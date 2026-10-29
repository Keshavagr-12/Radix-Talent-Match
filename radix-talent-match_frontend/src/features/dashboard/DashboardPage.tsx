import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSearch,
  FileText,
  UserCheck,
  ShieldCheck,
  GitCompare,
  LayoutDashboard,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  PageHeader,
  Button,
  ScoreRing,
} from '../../components/ui/primitives';
import { BackendServiceStatusStrip } from '../../components/layout/BackendServiceStatusStrip';
import { useWorkspace } from '../../context/WorkspaceContext';
import { RADIX_TWELVE_CATEGORIES } from '../../data/radixCategories';

const TOOLTIP_STYLE = {
  backgroundColor: '#0F172A',
  borderColor: '#1E293B',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#F8FAFC',
};

export const DashboardPage: React.FC = () => {
  const {
    activeProfile,
    completeness,
    activeJDSession,
    activeResumeSession,
    activeTalentCheckSession,
    activeSkillMatchSession,
  } = useWorkspace();
  const navigate = useNavigate();

  // Active data sources across all 5 modules
  const currentJD = activeJDSession.hasAnalyzed ? activeJDSession.displayedResult : null;
  const currentResume = activeResumeSession.hasParsed ? activeResumeSession.displayedResume : null;
  const currentTalentCheck = activeTalentCheckSession.hasEvaluated
    ? activeTalentCheckSession.displayedResult
    : null;
  const currentSkillMatch = activeSkillMatchSession.hasMatched
    ? activeSkillMatchSession.displayedResult
    : null;

  // ---------------------------------------------------------------------------
  // MODULE 01: JD ANALYTICS GRAPH DATA
  // ---------------------------------------------------------------------------
  const jdCategoryData = useMemo(() => {
    const skills = currentJD?.skills || [];
    return RADIX_TWELVE_CATEGORIES.map((cat) => {
      const catSkills = skills.filter((s) => s.category_code === cat.code);
      return {
        category: cat.code,
        name: cat.shortName,
        High: catSkills.filter((s) => s.confidence === 'high').length,
        Medium: catSkills.filter((s) => s.confidence === 'medium').length,
        Low: catSkills.filter((s) => s.confidence === 'low').length,
        total: catSkills.length,
      };
    });
  }, [currentJD]);

  const jdConfidencePieData = useMemo(() => {
    const skills = currentJD?.skills || [];
    const high = skills.filter((s) => s.confidence === 'high').length;
    const medium = skills.filter((s) => s.confidence === 'medium').length;
    const low = skills.filter((s) => s.confidence === 'low').length;
    const data = [
      { name: 'High Confidence', value: high, color: '#10B981' },
      { name: 'Medium Confidence', value: medium, color: '#6366F1' },
      { name: 'Low Confidence', value: low, color: '#F59E0B' },
    ].filter((d) => d.value > 0);
    return data.length > 0
      ? data
      : [{ name: 'No Skills Extracted', value: 1, color: '#475569' }];
  }, [currentJD]);

  // ---------------------------------------------------------------------------
  // MODULE 02: RESUME PARSING GRAPH DATA
  // ---------------------------------------------------------------------------
  const resumeCategoryData = useMemo(() => {
    const skills = currentResume?.skills || [];
    return RADIX_TWELVE_CATEGORIES.map((cat) => {
      const catSkills = skills.filter((s) => s.category_code === cat.code);
      return {
        category: cat.code,
        name: cat.shortName,
        High: catSkills.filter((s) => s.confidence === 'high').length,
        Medium: catSkills.filter((s) => s.confidence === 'medium').length,
        Low: catSkills.filter((s) => s.confidence === 'low').length,
        Total: catSkills.length,
      };
    });
  }, [currentResume]);

  const resumeSectionsData = useMemo(() => {
    if (!currentResume) return [];
    return [
      { section: 'Skills', count: currentResume.skills?.length || 0 },
      { section: 'Education', count: currentResume.education?.length || 0 },
      { section: 'Projects', count: currentResume.projects?.length || 0 },
      { section: 'Internships', count: currentResume.internships?.length || 0 },
      { section: 'Hackathons', count: currentResume.hackathons?.length || 0 },
      { section: 'Certs', count: currentResume.certifications?.length || 0 },
      { section: 'Roles', count: currentResume.preferred_roles?.length || 0 },
    ];
  }, [currentResume]);

  // ---------------------------------------------------------------------------
  // MODULE 03: PROFILE BUILDER GRAPH DATA
  // ---------------------------------------------------------------------------
  const profileRadarData = useMemo(() => {
    const profileSkills = activeProfile?.skills || [];
    return RADIX_TWELVE_CATEGORIES.map((cat) => {
      const matching = profileSkills.filter((s) => s.category_code === cat.code);
      let level = 2;
      if (matching.length > 0) {
        const levels = matching.map((s) =>
          typeof s.proficiency_level === 'number'
            ? s.proficiency_level
            : s.confidence === 'high'
            ? 8
            : s.confidence === 'medium'
            ? 6
            : 4
        );
        level = Math.min(10, Math.max(...levels) + (matching.length > 1 ? 1 : 0));
      }
      return {
        category: cat.code,
        fullName: cat.name,
        Proficiency: level,
      };
    });
  }, [activeProfile]);

  const profileSectionsBarData = useMemo(() => {
    const hasBasics = Boolean(
      activeProfile?.name && activeProfile?.email && activeProfile?.headline
    );
    const skillsLen = activeProfile?.skills?.length || 0;
    const eduLen = activeProfile?.education?.length || 0;
    const projLen = activeProfile?.projects?.length || 0;
    const internLen = activeProfile?.internships?.length || 0;
    const hackLen = activeProfile?.hackathons?.length || 0;
    const certLen = activeProfile?.certifications?.length || 0;
    const rolesLen = activeProfile?.preferred_roles?.length || 0;

    return [
      { section: '1. Basics', entries: hasBasics ? 1 : 0, status: hasBasics ? 100 : 40 },
      { section: '2. Skills', entries: skillsLen, status: skillsLen > 0 ? 100 : 0 },
      { section: '3. Education', entries: eduLen, status: eduLen > 0 ? 100 : 0 },
      { section: '4. Projects', entries: projLen, status: projLen > 0 ? 100 : 0 },
      { section: '5. Internships', entries: internLen, status: internLen > 0 ? 100 : 0 },
      { section: '6. Hackathons', entries: hackLen, status: hackLen > 0 ? 100 : 0 },
      { section: '7. Certs', entries: certLen, status: certLen > 0 ? 100 : 0 },
      { section: '8. Roles/CV', entries: rolesLen + (activeProfile?.cv_file ? 1 : 0), status: rolesLen > 0 ? 100 : 0 },
    ];
  }, [activeProfile]);

  // ---------------------------------------------------------------------------
  // MODULE 04: TALENT CHECK GRAPH DATA
  // ---------------------------------------------------------------------------
  const talentCheckBarData = useMemo(() => {
    if (!currentTalentCheck) return [];
    return currentTalentCheck.skillset_gap.map((row) => ({
      category: row.category_code,
      Candidate: row.candidate_level,
      Required: row.required_level,
    }));
  }, [currentTalentCheck]);

  const talentCheckPieData = useMemo(() => {
    if (!currentTalentCheck) {
      return [{ name: 'Pending Evaluation', value: 12, color: '#475569' }];
    }
    const met = currentTalentCheck.skillset_gap.filter((g) => !g.gap).length;
    const gap = currentTalentCheck.skillset_gap.filter((g) => g.gap).length;
    return [
      { name: 'Meets/Exceeds Bar', value: met, color: '#10B981' },
      { name: 'Competency Gap', value: gap, color: '#F59E0B' },
    ].filter((d) => d.value > 0);
  }, [currentTalentCheck]);

  // ---------------------------------------------------------------------------
  // MODULE 05: SKILL MATCHING GRAPH DATA
  // ---------------------------------------------------------------------------
  const skillMatchCategoryData = useMemo(() => {
    const matched = currentSkillMatch?.matched_skills || [];
    const missing = currentSkillMatch?.missing_skills || [];
    const partial = currentSkillMatch?.partial_skills || [];

    return RADIX_TWELVE_CATEGORIES.map((cat) => {
      const mCount = matched.filter((s) => s.category_code === cat.code).length;
      const gCount = missing.filter((s) => s.category_code === cat.code).length;
      const pCount = partial.filter((p) => p.jd_skill.category_code === cat.code).length;
      return {
        category: cat.code,
        Matched: mCount,
        Missing: gCount,
        Partial: pCount,
      };
    });
  }, [currentSkillMatch]);

  const skillMatchPieData = useMemo(() => {
    if (!currentSkillMatch) {
      return [{ name: 'No Match Run', value: 1, color: '#475569' }];
    }
    const matched = currentSkillMatch.matched_skills.length;
    const missing = currentSkillMatch.missing_skills.length;
    const partial = currentSkillMatch.partial_skills?.length || 0;
    const data = [
      { name: 'Matched Skills', value: matched, color: '#10B981' },
      { name: 'Missing Skills (Gaps)', value: missing, color: '#EF4444' },
      { name: 'Partial / Adjacent', value: partial, color: '#F59E0B' },
    ].filter((d) => d.value > 0);
    return data.length > 0 ? data : [{ name: 'No Requirements', value: 1, color: '#475569' }];
  }, [currentSkillMatch]);

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="RADIX ANALYTICS COMMAND CENTER · ALL 5 MODULES"
        title="5-Module Graphical Overview Dashboard"
        description="Unified visual analytics across Module 01 (JD Analytics), Module 02 (Resume Parsing), Module 03 (Profile Builder), Module 04 (Talent Check), and Module 05 (Skill Matching)."
      />

      {/* Live Microservices Health & Discovery */}
      <BackendServiceStatusStrip />

      {/* 5-Module KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          onClick={() => navigate('/app/jd-analytics')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/60 transition-colors cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              MODULE 01
            </span>
            <FileSearch className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {currentJD ? `${currentJD.skills.length} Skills` : '0 Skills'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {currentJD ? `${currentJD.company} · ${currentJD.role}` : 'JD Analytics'}
          </p>
        </div>

        <div
          onClick={() => navigate('/app/resume-parsing')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/60 transition-colors cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
              MODULE 02
            </span>
            <FileText className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {currentResume ? `${currentResume.skills.length} Skills` : '0 Skills'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {currentResume
              ? `${currentResume.candidate_name} (${currentResume.source_file})`
              : 'Resume Parsing'}
          </p>
        </div>

        <div
          onClick={() => navigate('/app/profile')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/60 transition-colors cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              MODULE 03
            </span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {completeness.score}% Ready
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {activeProfile.name} · {activeProfile.skills.length} tagged skills
          </p>
        </div>

        <div
          onClick={() => navigate('/app/talent-check')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/60 transition-colors cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
              MODULE 04
            </span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {currentTalentCheck ? `${currentTalentCheck.readiness_score}/100` : '—'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {currentTalentCheck
              ? `Benchmark: ${currentTalentCheck.company}`
              : 'Talent Check Readiness'}
          </p>
        </div>

        <div
          onClick={() => navigate('/app/skill-matching')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/60 transition-colors cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
              MODULE 05
            </span>
            <GitCompare className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {currentSkillMatch ? `${currentSkillMatch.match_score}/100` : '—'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {currentSkillMatch
              ? `${currentSkillMatch.matched_skills.length} Matched · ${currentSkillMatch.missing_skills.length} Missing`
              : 'Job Skill Match'}
          </p>
        </div>
      </div>

      {/* =====================================================================
          MODULE 01: JD ANALYTICS OVERVIEW GRAPHS
      ===================================================================== */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              MODULE 01 · ROLE 1 (JD ANALYTICS)
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Job Description Skill Extraction &amp; Confidence Distribution
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentJD
                ? `Active JD: ${currentJD.company} — ${currentJD.role} (${currentJD.source_file})`
                : 'No JD analyzed yet'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/jd-analytics')}>
            <span>Open Module 01</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Extracted JD Skills Across 12 RADIX Categories (Stacked by Confidence)
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jdCategoryData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="High" stackId="jd" fill="#10B981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Medium" stackId="jd" fill="#6366F1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Low" stackId="jd" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center">
              JD Skill Confidence Breakdown
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={jdConfidencePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {jdConfidencePieData.map((entry, idx) => (
                      <Cell key={`jd-pie-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODULE 02: RESUME PARSING OVERVIEW GRAPHS
      ===================================================================== */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              MODULE 02 · ROLE 2 (RESUME PARSING)
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Parsed Resume Skill Signal &amp; Section Extraction Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentResume
                ? `Active Resume: ${currentResume.candidate_name} (${currentResume.source_file})`
                : 'No resume parsed yet'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/resume-parsing')}>
            <span>Open Module 02</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Parsed Resume Skills by RADIX Category
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={resumeCategoryData}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="High" stackId="res" fill="#06B6D4" />
                  <Bar dataKey="Medium" stackId="res" fill="#6366F1" />
                  <Bar dataKey="Low" stackId="res" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Extracted Structured Entries by Resume Section
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={resumeSectionsData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="section"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    width={75}
                  />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" name="Extracted Items" fill="#06B6D4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODULE 03: PROFILE BUILDER OVERVIEW GRAPHS
      ===================================================================== */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              MODULE 03 · ROLE 3 (PROFILE BUILDER)
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              12-Category Candidate Competency Radar &amp; 8-Section Profile Density
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Candidate: {activeProfile.name} · Completeness: {completeness.score}% ({activeProfile.skills.length} evidence-backed skills)
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/profile')}>
            <span>Open Module 03</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center">
              12-Category Evidence-Derived Proficiency Radar (1–10)
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="74%" data={profileRadarData}>
                  <PolarGrid stroke="#475569" strokeOpacity={0.3} />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 10]}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                  />
                  <Radar
                    name={activeProfile.name}
                    dataKey="Proficiency"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.35}
                  />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Entries Recorded Across All 8 Profile Builder Sections
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={profileSectionsBarData}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis dataKey="section" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="entries"
                    name="Recorded Entries"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODULE 04: TALENT CHECK OVERVIEW GRAPHS
      ===================================================================== */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              MODULE 04 · ROLE 4 (TALENT CHECK)
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              12-Category Company Benchmark Readiness &amp; Gap Comparison
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentTalentCheck
                ? `Evaluated Benchmark: ${currentTalentCheck.company} · Readiness Score: ${currentTalentCheck.readiness_score}/100`
                : 'Import profile and JD benchmark in Module 04 to run a custom evaluation'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/talent-check')}>
            <span>Open Module 04</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Candidate Proficiency vs. Company Required Level Across 12 Categories
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={talentCheckBarData}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  />
                  <YAxis domain={[0, 10]} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Candidate" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Required" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col items-center justify-center gap-4">
            <ScoreRing
              score={currentTalentCheck?.readiness_score || 0}
              size={116}
              strokeWidth={9}
              label="Readiness Score"
              sublabel={currentTalentCheck?.company || 'No Benchmark'}
            />
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={talentCheckPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={62}
                    paddingAngle={3}
                  >
                    {talentCheckPieData.map((entry, idx) => (
                      <Cell key={`tc-pie-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODULE 05: SKILL MATCHING OVERVIEW GRAPHS
      ===================================================================== */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              MODULE 05 · ROLE 5 (SKILL MATCHING)
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Job-Specific Matched Skills vs. Missing Gap Analysis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentSkillMatch
                ? `Target Posting: ${currentSkillMatch.role || currentSkillMatch.jd_source_file} (${currentSkillMatch.company || 'Analyzed JD'}) · Score: ${currentSkillMatch.match_score}/100`
                : 'Run Skill Matching in Module 05 to compare your profile against a target job posting'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/skill-matching')}>
            <span>Open Module 05</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Matched vs. Missing JD Skills Across 12 RADIX Categories
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={skillMatchCategoryData}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Matched" stackId="sm" fill="#10B981" />
                  <Bar dataKey="Partial" stackId="sm" fill="#F59E0B" />
                  <Bar dataKey="Missing" stackId="sm" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col items-center justify-center gap-4">
            <ScoreRing
              score={currentSkillMatch?.match_score || 0}
              size={116}
              strokeWidth={9}
              label="Role Match Score"
              sublabel={currentSkillMatch?.role || currentSkillMatch?.jd_source_file || 'Target JD'}
            />
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={skillMatchPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={62}
                    paddingAngle={3}
                  >
                    {skillMatchPieData.map((entry, idx) => (
                      <Cell key={`sm-pie-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
