import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  GitCompare,
  Info,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Database,
  ArrowRight,
  TrendingUp,
  Search,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import {
  PageHeader,
  Button,
  ScoreRing,
  Progress,
  Skeleton,
} from '../../components/ui/primitives';
import { useWorkspace } from '../../context/WorkspaceContext';
import { CATEGORY_LOOKUP, RADIX_TWELVE_CATEGORIES } from '../../data/radixCategories';
import { talentCheckApiService as talentCheckService } from '../../services/api';
import {
  TalentCheckResult,
  RadixCategoryCode,
  CompanyExpectationProfile,
} from '../../types/radix';

export const TalentCheckPage: React.FC = () => {
  const {
    activeProfile,
    activeProfileSession,
    activeJDSession,
    executeTalentCheck,
    activeTalentCheckSession,
    updateActiveTalentCheckSession,
  } = useWorkspace();
  const navigate = useNavigate();

  const {
    candidateSource,
    importedProfile,
    importedJD,
    displayedResult: currentResult,
  } = activeTalentCheckSession;

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [availableCompanies, setAvailableCompanies] = useState<CompanyExpectationProfile[]>([]);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('Google LLC');
  const [benchmarkMode, setBenchmarkMode] = useState<'company_staging' | 'jd_analytics'>('company_staging');
  const [companySearch, setCompanySearch] = useState<string>('');

  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return availableCompanies;
    const q = companySearch.toLowerCase();
    return availableCompanies.filter(
      (c) =>
        c.company.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q) ||
        (c.tierDescriptor && c.tierDescriptor.toLowerCase().includes(q))
    );
  }, [availableCompanies, companySearch]);

  // Fetch benchmark companies from Supabase table company_skill_levels_staging via Port 8004
  useEffect(() => {
    let isMounted = true;
    talentCheckService.getCompanies().then((companies) => {
      if (isMounted && Array.isArray(companies) && companies.length > 0) {
        setAvailableCompanies(companies);
        // Default to Google LLC or first company
        const defaultCo = companies.find((c) => c.company.toLowerCase().includes('google')) || companies[0];
        setSelectedCompanyName(defaultCo.company);
      }
    }).catch((err) => {
      console.warn('Failed to load companies from backend:', err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const hasProfileData = Boolean(
    (activeProfileSession.hasSavedProfile && activeProfile.name.trim()) ||
    (activeProfile.skills && activeProfile.skills.length > 0)
  );

  const hasJDData = Boolean(
    activeJDSession.hasAnalyzed && activeJDSession.displayedResult
  );

  // Selected company expectation metadata
  const selectedCompanyMeta = useMemo(() => {
    if (benchmarkMode === 'jd_analytics' && importedJD) {
      return {
        company: `${importedJD.company} (${importedJD.role})`,
        shortName: importedJD.company,
        tierDescriptor: `Imported from JD Analytics · ${importedJD.source_file}`,
        headquarters: importedJD.location || 'Flexible / Hybrid',
        evaluationSummary:
          importedJD.summary ||
          '12-category competency bar derived from analyzed Job Description.',
        readinessThreshold: 80,
        expectedLevels: availableCompanies[0]?.expectedLevels || ({} as any),
      };
    }

    const matched = availableCompanies.find(
      (c) =>
        c.company.toLowerCase() === selectedCompanyName.toLowerCase() ||
        c.shortName.toLowerCase() === selectedCompanyName.toLowerCase()
    );

    if (matched) return matched;

    return {
      company: selectedCompanyName,
      shortName: selectedCompanyName.split(' ')[0],
      tierDescriptor: 'Enterprise Benchmark Tier',
      headquarters: 'India Operations',
      evaluationSummary: `Evaluation criteria and 12-skillset competency bar for ${selectedCompanyName}.`,
      readinessThreshold: 80,
      expectedLevels: availableCompanies[0]?.expectedLevels || ({} as any),
    };
  }, [availableCompanies, selectedCompanyName, benchmarkMode, importedJD]);

  // Main 12-Skillset Comparison Button Handler
  const handleCompare = async () => {
    const candidateToAssess = importedProfile || activeProfile;

    if (!candidateToAssess || !candidateToAssess.name.trim() || !candidateToAssess.skills || candidateToAssess.skills.length === 0) {
      toast.error('No candidate profile available. Please import or build a candidate profile in Profile Builder (Module 03).');
      return;
    }

    const targetCompany = benchmarkMode === 'jd_analytics' && importedJD
      ? importedJD.company
      : selectedCompanyName;

    setIsEvaluating(true);
    try {
      const result = await executeTalentCheck(targetCompany, candidateToAssess);

      // If evaluating against a custom JD Analytics JD with custom skill weighting
      if (benchmarkMode === 'jd_analytics' && importedJD && importedJD.skills.length > 0) {
        let weightedEarned = 0;
        let totalWeight = 0;

        const customGap = RADIX_TWELVE_CATEGORIES.map((cat) => {
          const code = cat.code as Exclude<RadixCategoryCode, 'OTHER'>;
          const jdCatSkills = importedJD.skills.filter((s) => s.category_code === code);
          const hasHigh = jdCatSkills.some((s) => s.confidence === 'high');
          const required_level = jdCatSkills.length > 0 ? (hasHigh ? 8 : 7) : 6;

          const baseRow = result.skillset_gap.find((r) => r.category_code === code);
          const candidate_level = baseRow ? baseRow.candidate_level : 0;
          const gap = candidate_level < required_level;

          const categoryAchievement = Math.min(1.0, candidate_level / required_level);
          weightedEarned += categoryAchievement * required_level;
          totalWeight += required_level;

          return {
            category_code: code,
            category_name: CATEGORY_LOOKUP[code]?.name || code,
            required_level,
            candidate_level,
            gap,
            gap_amount: Math.max(0, required_level - candidate_level),
            meets_bar: !gap,
          };
        });

        const score = totalWeight > 0 ? Math.min(100, Math.round((weightedEarned / totalWeight) * 100)) : 0;
        const status = score >= 80 ? 'READY' : score >= 65 ? 'UPSKILLING_RECOMMENDED' : 'NEEDS_PREPARATION';
        const label = score >= 80 ? 'Ready for Target Role' : score >= 65 ? 'Upskilling Recommended' : 'Needs Focused Preparation';

        const tailored: TalentCheckResult = {
          ...result,
          company: targetCompany,
          skillset_gap: customGap,
          readiness_score: score,
          readiness_status: status,
          readiness_label: label,
        };

        updateActiveTalentCheckSession({
          candidateSource: 'profile_builder',
          importedProfile: candidateToAssess,
          hasEvaluated: true,
          displayedResult: tailored,
        });
        toast.success(`Evaluated ${candidateToAssess.name} against ${targetCompany}: Readiness ${score}%`);
      } else {
        updateActiveTalentCheckSession({
          candidateSource: 'profile_builder',
          importedProfile: candidateToAssess,
          hasEvaluated: true,
          displayedResult: result,
        });
        toast.success(`Evaluated ${candidateToAssess.name} against ${targetCompany}: Readiness ${result.readiness_score}%`);
      }
    } catch (err: any) {
      toast.error(`Talent check comparison failed: ${err.message || 'Server error'}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const chartData = useMemo(() => {
    if (!currentResult) return [];
    return currentResult.skillset_gap.map((item) => ({
      category: item.category_code,
      name:
        CATEGORY_LOOKUP[item.category_code as RadixCategoryCode]?.shortName ||
        item.category_code,
      Candidate: item.candidate_level,
      Required: item.required_level,
    }));
  }, [currentResult]);

  const gapCategories = useMemo(
    () => (currentResult ? currentResult.skillset_gap.filter((g) => g.gap) : []),
    [currentResult]
  );

  const metCategories = useMemo(
    () => (currentResult ? currentResult.skillset_gap.filter((g) => !g.gap) : []),
    [currentResult]
  );

  // Derive status badge styling
  const readinessStatus = currentResult?.readiness_status || (
    currentResult ? (currentResult.readiness_score >= 80 ? 'READY' : currentResult.readiness_score >= 65 ? 'UPSKILLING_RECOMMENDED' : 'NEEDS_PREPARATION') : 'READY'
  );

  const activeCandidate = importedProfile || activeProfile;

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="MODULE 04 · ROLE 4 (TALENT CHECK)"
        title="12-Skillset Company Readiness Benchmark"
        description="Compare student candidate profile against company expected bar across all 12 RADIX skillsets, calculate numerical readiness, and inspect competency gaps."
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate('/app/skill-matching')}>
            <GitCompare className="w-4 h-4" />
            <span>Job-Specific Skill Match →</span>
          </Button>
        }
      />

      {/* Information Banner */}
      <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/25 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
        <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-900 dark:text-white">
            Live Supabase &amp; 12-Skillset Benchmark Pipeline
          </p>
          <p className="leading-relaxed">
            Company expectation bars are loaded directly from your Supabase table{' '}
            <code className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 font-mono text-indigo-700 dark:text-indigo-300">
              company_skill_levels_staging
            </code>{' '}
            (with local snapshots for Google LLC, Microsoft Corporation, and Oracle Financial Services Software). Every evaluation is saved in Supabase with zero artificial sample data.
          </p>
        </div>
      </div>

      {/* Comparison Controls Card */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1: Candidate Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[11px] font-bold">1</span>
                <span>Candidate Profile (From Profile Builder)</span>
              </label>
              {hasProfileData ? (
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Profile Available</span>
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Empty in Module 03</span>
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeCandidate.name.trim() ? activeCandidate.name : 'No Profile Loaded'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeCandidate.skills.length} skills assessed across 12 RADIX categories
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/profile-builder')}
              >
                <span>Edit Profile</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {activeCandidate.skills.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Candidate Proficiency Levels (Extracted from Resume):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {activeCandidate.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium"
                    >
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {s.category_code}:
                      </span>
                      <span className="truncate max-w-[140px]">{s.skill_name}</span>
                      <span className="px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 font-mono font-bold text-indigo-700 dark:text-indigo-300">
                        Lvl {s.proficiency_level ?? s.level ?? 6}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Target Company Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[11px] font-bold">2</span>
                <span>Target Company (from Supabase Staging)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBenchmarkMode('company_staging')}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                    benchmarkMode === 'company_staging'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Supabase Companies
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!hasJDData) {
                      toast.error('No analyzed JD found in JD Analytics. Analyze a JD in Module 01 first.');
                      return;
                    }
                    setBenchmarkMode('jd_analytics');
                  }}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                    benchmarkMode === 'jd_analytics'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  JD Analytics Benchmark
                </button>
              </div>
            </div>

            {benchmarkMode === 'company_staging' ? (
              <div className="space-y-3">
                {/* Search Bar for Supabase Benchmark Companies */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    placeholder="Search Supabase companies (e.g. Meta, Apple, TCS, Google, Netflix)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Quick Select Buttons for All Supabase Benchmark Companies */}
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {filteredCompanies.map((c) => {
                    const isSelected = selectedCompanyName.toLowerCase() === c.company.toLowerCase();
                    return (
                      <button
                        key={c.company}
                        type="button"
                        onClick={() => setSelectedCompanyName(c.company)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        <Building2 className="w-3 h-3" />
                        <span>{c.shortName || c.company}</span>
                      </button>
                    );
                  })}
                  {filteredCompanies.length === 0 && (
                    <span className="text-xs text-slate-400 py-1">No benchmark companies match &ldquo;{companySearch}&rdquo;</span>
                  )}
                </div>

                {/* Dropdown for All Staged Companies */}
                <select
                  value={selectedCompanyName}
                  onChange={(e) => setSelectedCompanyName(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                >
                  {availableCompanies.map((c) => (
                    <option key={c.company} value={c.company}>
                      {c.company} — {c.shortName} ({c.tierDescriptor})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {importedJD ? `${importedJD.company} — ${importedJD.role}` : 'No JD Selected'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {importedJD ? `${importedJD.skills.length} skills analyzed in JD Analytics` : 'Please import an analyzed JD from Module 01.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Company Details Card */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              <span>{selectedCompanyMeta.tierDescriptor}</span>
              <span className="text-slate-400">·</span>
              <span>{selectedCompanyMeta.headquarters}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {selectedCompanyMeta.evaluationSummary}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-[11px] text-slate-500 block font-medium">Readiness Threshold</span>
            <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
              ≥ {selectedCompanyMeta.readinessThreshold}% (Ready Bar)
            </span>
          </div>
        </div>

        {/* The Action Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            className="w-full h-11 text-sm font-semibold shadow-md flex items-center justify-center gap-2"
            onClick={handleCompare}
            isLoading={isEvaluating}
            disabled={!hasProfileData}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>
              Compare Student Profile Against {selectedCompanyMeta.shortName} Bar (12 Skillsets)
            </span>
          </Button>
          {!hasProfileData && (
            <p className="text-center text-xs text-amber-600 dark:text-amber-400 font-medium pt-2">
              Save a candidate profile with skills in Profile Builder (Module 03) to enable comparison.
            </p>
          )}
        </div>
      </div>

      {isEvaluating && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {/* Results View */}
      {!isEvaluating && currentResult && (
        <>
          {/* Header Metrics & Score Ring */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center gap-4">
              <ScoreRing
                score={currentResult.readiness_score}
                size={144}
                strokeWidth={11}
                label={`Readiness Score`}
                sublabel={`${selectedCompanyMeta.shortName} Bar: ≥ 80%`}
              />

              {/* Status Verdict Pill */}
              <div className="space-y-1.5 w-full">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    readinessStatus === 'READY'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : readinessStatus === 'UPSKILLING_RECOMMENDED'
                      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                      : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {readinessStatus === 'READY'
                      ? 'Ready for Target Role'
                      : readinessStatus === 'UPSKILLING_RECOMMENDED'
                      ? 'Upskilling Recommended'
                      : 'Needs Focused Preparation'}
                  </span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Target threshold is 80% across all 12 RADIX categories.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="w-full pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                  <span className="font-mono font-bold text-lg text-emerald-700 dark:text-emerald-400">
                    {metCategories.length} / 12
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Categories At/Above Bar
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                  <span className="font-mono font-bold text-lg text-amber-700 dark:text-amber-400">
                    {gapCategories.length} / 12
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Categories With Gap
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="lg:col-span-8 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{selectedCompanyMeta.company}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {activeCandidate.name} vs. {selectedCompanyMeta.shortName} Benchmark
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                    Side-by-side comparison of candidate assessed level against the required expectation for each category.
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="category"
                      tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    />
                    <YAxis domain={[0, 10]} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#1E293B',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#F8FAFC',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Candidate" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Required" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Priority Remediation Section */}
          {gapCategories.length > 0 && (
            <div className="p-6 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200">
                <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Priority Remediation Areas ({gapCategories.length} Categories Below Bar)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                To achieve Readiness ≥ 80% for {selectedCompanyMeta.shortName}, focus upskilling on these key gaps:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                {gapCategories.map((g) => {
                  const meta = CATEGORY_LOOKUP[g.category_code as RadixCategoryCode];
                  return (
                    <div
                      key={g.category_code}
                      className="p-3 rounded-lg border border-amber-200/80 dark:border-amber-900/50 bg-white dark:bg-slate-900 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {g.category_code}
                        </span>
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                          Gap: -{g.required_level - g.candidate_level} lvl
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {meta?.name || g.category_code}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Current {g.candidate_level}/10 → Required {g.required_level}/10
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Complete 12-Category Table */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Full 12-Category RADIX Skillset Gap Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comprehensive audit across all 12 competency dimensions with deficit/surplus metrics.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2.5 pr-4 font-medium">Category Code &amp; Name</th>
                    <th className="py-2.5 px-4 font-medium text-right">Company Required Level</th>
                    <th className="py-2.5 px-4 font-medium text-right">Candidate Level</th>
                    <th className="py-2.5 px-4 font-medium">Coverage Progress</th>
                    <th className="py-2.5 pl-4 font-medium text-right">Gap Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {currentResult.skillset_gap.map((row) => {
                    const meta = CATEGORY_LOOKUP[row.category_code as RadixCategoryCode];
                    const ratio = Math.min(
                      100,
                      Math.round((row.candidate_level / row.required_level) * 100)
                    );
                    const isGap = row.gap;
                    return (
                      <tr
                        key={row.category_code}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="py-3 pr-4">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mr-2">
                            {row.category_code}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {meta?.name || row.category_code}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {row.required_level} / 10
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                          {row.candidate_level} / 10
                        </td>
                        <td className="py-3 px-4 w-48">
                          <Progress
                            value={ratio}
                            tone={isGap ? 'amber' : 'emerald'}
                          />
                        </td>
                        <td className="py-3 pl-4 text-right font-mono whitespace-nowrap">
                          {isGap ? (
                            <span className="text-amber-700 dark:text-amber-400 font-semibold">
                              GAP (-{row.required_level - row.candidate_level} lvl)
                            </span>
                          ) : (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                              READY (+{row.candidate_level - row.required_level} lvl)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
