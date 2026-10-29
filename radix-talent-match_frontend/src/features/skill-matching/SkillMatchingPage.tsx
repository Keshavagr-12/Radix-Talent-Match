import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitCompare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  History,
  Briefcase,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PageHeader,
  Button,
  ScoreRing,
  Progress,
  Skeleton,
} from '../../components/ui/primitives';
import { useWorkspace } from '../../context/WorkspaceContext';
import { CATEGORY_LOOKUP } from '../../data/radixCategories';
import { skillMatchingApiService as skillMatchingService } from '../../services/api';
import { CandidateProfile, ExtractedSkillList, SkillMatchingResult } from '../../types/radix';

export const SkillMatchingPage: React.FC = () => {
  const {
    activeProfile,
    activeProfileSession,
    activeJDSession,
    setSelectedJDId,
    executeSkillMatching,
    activeSkillMatchSession,
    updateActiveSkillMatchSession,
  } = useWorkspace();
  const navigate = useNavigate();

  // Persisted across the session until sign-out or a new entry selection occurs
  const {
    candidateSource,
    jdSource,
    importedProfile,
    importedJD,
    displayedResult: matchResult,
  } = activeSkillMatchSession;

  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [backendCandidates, setBackendCandidates] = useState<Array<{ id: string; name: string; skills_count: number; headline?: string }>>([]);
  const [backendJDs, setBackendJDs] = useState<Array<{ id: string; company: string; role: string; source_file: string; skills_count: number }>>([]);
  const [matchHistory, setMatchHistory] = useState<SkillMatchingResult[]>([]);

  const hasProfileData = Boolean(
    (activeProfileSession.hasSavedProfile && activeProfile.name.trim()) ||
    (activeProfile.skills && activeProfile.skills.length > 0)
  );
  const hasJDData = Boolean(
    activeJDSession.hasAnalyzed && activeJDSession.displayedResult
  );

  // Fetch available candidates and extracted JDs from Port 8005 on mount
  useEffect(() => {
    let isMounted = true;
    const fetchOptions = async () => {
      try {
        const cands = await skillMatchingService.getCandidates?.();
        if (isMounted && cands && cands.length > 0) {
          setBackendCandidates(cands);
          // If no profile is imported yet and activeProfile has no data, pre-import first candidate
          if (!importedProfile && !hasProfileData && cands[0]) {
            try {
              const res = await fetch(`http://127.0.0.1:8005/skill-matching/candidates/${cands[0].id}`);
              if (res.ok) {
                const candData = await res.json();
                if (isMounted) {
                  updateActiveSkillMatchSession({
                    candidateSource: `db_${cands[0].id}`,
                    importedProfile: candData,
                  });
                }
              }
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // quiet fallback
      }

      try {
        const jds = await skillMatchingService.getJDs?.();
        if (isMounted && jds && jds.length > 0) {
          setBackendJDs(jds);
          // If no JD is imported yet and activeJD has no data, pre-import first JD
          if (!importedJD && !hasJDData && jds[0]) {
            try {
              const res = await fetch(`http://127.0.0.1:8005/skill-matching/jds/${jds[0].id}`);
              if (res.ok) {
                const jdData = await res.json();
                if (isMounted) {
                  updateActiveSkillMatchSession({
                    jdSource: `db_${jds[0].id}`,
                    importedJD: jdData,
                  });
                }
              }
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // quiet fallback
      }

      try {
        const hist = await skillMatchingService.getMatchHistory?.();
        if (isMounted && hist && hist.length > 0) {
          setMatchHistory(hist);
        }
      } catch {
        // quiet fallback
      }
    };

    fetchOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync active Profile Builder session if user imports it
  useEffect(() => {
    if (candidateSource === 'profile_builder' && hasProfileData && activeProfile) {
      if (importedProfile?.name !== activeProfile.name || importedProfile?.skills?.length !== activeProfile.skills?.length) {
        updateActiveSkillMatchSession({
          importedProfile: activeProfile,
        });
      }
    }
  }, [hasProfileData, activeProfile, candidateSource, importedProfile, updateActiveSkillMatchSession]);

  const handleCandidateSourceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;

    if (!val) {
      updateActiveSkillMatchSession({
        candidateSource: '',
        importedProfile: null,
        hasMatched: false,
        displayedResult: null,
      });
      return;
    }

    if (val === 'profile_builder') {
      if (!hasProfileData) {
        toast.error('Profile Builder (Module 03) is empty. Please save a candidate profile first.');
        return;
      }
      updateActiveSkillMatchSession({
        candidateSource: val,
        importedProfile: activeProfile,
        hasMatched: false,
        displayedResult: null,
      });
      toast.success(
        `Imported candidate profile from Profile Builder: ${activeProfile.name} (${activeProfile.skills.length} skills)`
      );
    } else if (val.startsWith('db_')) {
      const cId = val.replace('db_', '');
      try {
        const res = await fetch(`http://127.0.0.1:8005/skill-matching/candidates/${cId}`);
        if (!res.ok) throw new Error('Candidate not found');
        const candData: CandidateProfile = await res.json();
        updateActiveSkillMatchSession({
          candidateSource: val,
          importedProfile: candData,
          hasMatched: false,
          displayedResult: null,
        });
        toast.success(`Imported candidate: ${candData.name} (${candData.skills?.length || 0} skills)`);
      } catch (err: any) {
        toast.error(`Could not load candidate: ${err.message}`);
      }
    }
  };

  const handleJDSourceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;

    if (!val) {
      updateActiveSkillMatchSession({
        jdSource: '',
        importedJD: null,
        hasMatched: false,
        displayedResult: null,
      });
      return;
    }

    if (val === 'jd_analytics') {
      const targetJD =
        activeJDSession.hasAnalyzed && activeJDSession.displayedResult
          ? activeJDSession.displayedResult
          : null;
      if (targetJD) {
        updateActiveSkillMatchSession({
          jdSource: val,
          importedJD: targetJD,
          hasMatched: false,
          displayedResult: null,
        });
        if (targetJD.id) {
          setSelectedJDId(targetJD.id);
        }
        toast.success(
          `Imported target job posting from JD Analytics: ${targetJD.company} — ${targetJD.role}`
        );
      } else {
        toast.error('JD Analytics (Module 01) is empty. Please analyze a Job Description first.');
      }
    } else if (val.startsWith('db_')) {
      const jId = val.replace('db_', '');
      try {
        const res = await fetch(`http://127.0.0.1:8005/skill-matching/jds/${jId}`);
        if (!res.ok) throw new Error('Job description not found');
        const jdData: ExtractedSkillList = await res.json();
        updateActiveSkillMatchSession({
          jdSource: val,
          importedJD: jdData,
          hasMatched: false,
          displayedResult: null,
        });
        if (jdData.id) {
          setSelectedJDId(jdData.id);
        }
        toast.success(`Imported job posting: ${jdData.role} @ ${jdData.company}`);
      } catch (err: any) {
        toast.error(`Could not load job description: ${err.message}`);
      }
    }
  };

  const handleManualRun = async () => {
    const targetProfile = importedProfile || (hasProfileData ? activeProfile : null);
    const targetJD = importedJD || (hasJDData ? activeJDSession.displayedResult : null);

    if (!targetProfile || !targetProfile.skills || targetProfile.skills.length === 0) {
      toast.error('Please select a candidate profile with verified skills in step 1.');
      return;
    }
    if (!targetJD || !targetJD.skills || targetJD.skills.length === 0) {
      toast.error('Please select a target Job Description with extracted requirements in step 2.');
      return;
    }

    setIsMatching(true);
    try {
      const res = await executeSkillMatching(targetJD, targetProfile);
      updateActiveSkillMatchSession({
        importedProfile: targetProfile,
        importedJD: targetJD,
        hasMatched: true,
        displayedResult: res,
      });

      // Update history
      setMatchHistory((prev) => [res, ...prev.filter((h) => h.id !== res.id)].slice(0, 10));

      toast.success(
        `Matched ${targetProfile.name} against ${targetJD.role} (${targetJD.company}): ${res.match_score}/100`
      );
    } catch (err: any) {
      toast.error(`Skill matching failed: ${err.message || 'Error executing match'}`);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="MODULE 05 · ROLE 5 (SKILL MATCHING)"
        title="Job-Specific Skill Matching & Missing Gap Analysis"
        description="Compare your candidate profile against one specific job posting (from Role 1 JD Analytics). Prioritizes an actionable missing-skill gap list alongside your match score."
      />

      {/* Selection Bar */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 md:grid-cols-12 gap-4 items-start shadow-sm">
        <div className="md:col-span-5 space-y-1.5">
          <label
            htmlFor="select-sm-candidate-source"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-indigo-500" />
            <span>1. Select Candidate Profile (Role 3)</span>
          </label>
          <select
            id="select-sm-candidate-source"
            value={candidateSource}
            onChange={handleCandidateSourceChange}
            className="w-full h-10 px-3 text-sm rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
          >
            <option value="">-- Choose Candidate Profile --</option>
            {hasProfileData && (
              <option value="profile_builder">
                Active Session: {activeProfile.name} ({activeProfile.skills.length} skills)
              </option>
            )}
            {backendCandidates.map((c) => (
              <option key={c.id} value={`db_${c.id}`}>
                {c.name} ({c.skills_count} skills) {c.headline ? `· ${c.headline}` : ''}
              </option>
            ))}
          </select>
          {importedProfile ? (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Selected: {importedProfile.name} ({importedProfile.skills?.length || 0} skills tagged)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium pt-0.5">
              <span>Choose an active profile or saved database candidate</span>
            </div>
          )}
        </div>

        <div className="md:col-span-5 space-y-1.5">
          <label
            htmlFor="select-sm-jd-source"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
            <span>2. Select Target Job Posting (Role 1)</span>
          </label>
          <select
            id="select-sm-jd-source"
            value={jdSource}
            onChange={handleJDSourceChange}
            className="w-full h-10 px-3 text-sm rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
          >
            <option value="">-- Choose Target Job Posting --</option>
            {hasJDData && activeJDSession.displayedResult && (
              <option value="jd_analytics">
                Active Session: {activeJDSession.displayedResult.role} @ {activeJDSession.displayedResult.company} ({activeJDSession.displayedResult.skills.length} skills)
              </option>
            )}
            {backendJDs.map((j) => (
              <option key={j.id} value={`db_${j.id}`}>
                {j.role} @ {j.company} ({j.skills_count} requirements)
              </option>
            ))}
          </select>
          {importedJD ? (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Selected: {importedJD.role} @ {importedJD.company} ({importedJD.skills?.length || 0} JD requirements)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium pt-0.5">
              <span>Choose an analyzed JD from Role 1 or database</span>
            </div>
          )}
        </div>

        <div className="md:col-span-2 md:pt-[22px]">
          <Button
            variant="primary"
            className="w-full h-10 shadow-sm"
            onClick={handleManualRun}
            isLoading={isMatching}
          >
            <GitCompare className="w-4 h-4" />
            <span>Run Skill Match</span>
          </Button>
        </div>
      </div>

      {isMatching && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!isMatching && matchResult && (
        <>
          {/* Match Score Overview & Role Metadata */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
              <ScoreRing
                score={matchResult.match_score}
                size={140}
                strokeWidth={10}
                label="Job-Specific Match Score"
                sublabel={`${matchResult.role} · ${matchResult.company}`}
              />
              <div className="w-full pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                  <span className="font-mono font-bold text-base text-emerald-700 dark:text-emerald-400">
                    {matchResult.matched_skills.length}
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Verified Matched
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                  <span className="font-mono font-bold text-base text-red-700 dark:text-red-400">
                    {matchResult.missing_skills.length}
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Missing Skills (Gaps)
                  </p>
                </div>
              </div>
            </div>

            {/* Target JD Breakdown & Actionable Next Steps */}
            <div className="lg:col-span-8 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-5 shadow-sm">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      SOURCE POSTING: {matchResult.jd_source_file}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {matchResult.candidate_name} → {matchResult.role} ({matchResult.company})
                    </h2>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                    {matchResult.matched_skills.length + matchResult.missing_skills.length} Extracted Requirements
                  </span>
                </div>

                <Progress
                  value={matchResult.match_score}
                  label="Role Requirement Coverage"
                  showValue
                  tone={
                    matchResult.match_score >= 75
                      ? 'emerald'
                      : matchResult.match_score >= 50
                      ? 'indigo'
                      : 'amber'
                  }
                />
              </div>

              {/* Recommended Next Steps for This Specific Posting */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Targeted Preparation Steps for {matchResult.role} at {matchResult.company}:
                  </h3>
                </div>

                {matchResult.gap_analysis?.top_recommendations && matchResult.gap_analysis.top_recommendations.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {matchResult.gap_analysis.top_recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : matchResult.missing_skills.length === 0 ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Your candidate profile covers all extracted requirements for this job description! Review partial notes to sharpen evidence for interview rounds.
                  </p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {matchResult.missing_skills.slice(0, 3).map((ms, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span>
                          Build coursework or project evidence in{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {ms.skill_name} ({ms.category_code})
                          </strong>{' '}
                          and tag it in Profile Builder.
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* PRIORITY 1: MISSING SKILLS & GAP LIST (USER DIRECTIVE: PRIORITIZE THE GAP LIST OVER NUMBER) */}
          <div className="p-6 rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Priority Gap Analysis: Missing Skills ({matchResult.missing_skills.length})
                </h3>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                ACTIONABLE PREPARATION GAPS
              </span>
            </div>

            {matchResult.missing_skills.length === 0 ? (
              <div className="p-6 text-center rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Zero Missing Skills for This Role
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {matchResult.candidate_name}&apos;s profile demonstrates verified coverage across all requirements in {matchResult.jd_source_file}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {matchResult.missing_skills.map((skill, idx) => {
                  const cat = CATEGORY_LOOKUP[skill.category_code];
                  const isHighConfidence = (skill.confidence || 'high').toLowerCase() === 'high';
                  const gapExplanation = (skill as any).gap_explanation;
                  const recommendation = (skill as any).recommendation;

                  return (
                    <div
                      key={`${skill.skill_name}-${idx}`}
                      className="p-4 rounded-xl border border-red-200/90 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {skill.skill_name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isHighConfidence && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-200/70 dark:bg-red-900/60 text-red-800 dark:text-red-300">
                              CRITICAL
                            </span>
                          )}
                          <span className="font-mono text-[11px] font-semibold text-red-600 dark:text-red-400">
                            {skill.category_code} · {cat?.shortName || skill.category_code}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        <strong>JD Context:</strong> {skill.evidence}
                      </p>

                      {gapExplanation && (
                        <p className="text-[11.5px] text-red-800 dark:text-red-300 font-medium leading-relaxed">
                          <strong>Gap Analysis:</strong> {gapExplanation}
                        </p>
                      )}

                      {recommendation && (
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed bg-white/60 dark:bg-slate-900/50 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                          <strong>💡 Next Step:</strong> {recommendation}
                        </p>
                      )}

                      <div className="pt-1 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-500">
                          Importance: {skill.confidence.toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => navigate('/app/profile')}
                          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          + Add in Profile Builder →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Partially Matched / Adjacent Competencies */}
          {matchResult.partial_skills && matchResult.partial_skills.length > 0 && (
            <div className="p-6 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Partially Matched / Adjacent Competencies ({matchResult.partial_skills.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {matchResult.partial_skills.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                      <span>Requirement: {item.jd_skill.skill_name}</span>
                      <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400 font-bold">
                        {item.jd_skill.category_code}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      <strong>Candidate Foundation:</strong> {item.candidate_skill.skill_name}
                    </p>
                    <p className="text-amber-900 dark:text-amber-300 font-medium leading-relaxed">
                      {item.similarity_note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Skills */}
          <div className="p-6 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Verified Matched Skills ({matchResult.matched_skills.length})
                </h3>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                COVERED IN PROFILE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {matchResult.matched_skills.map((skill, idx) => {
                const cat = CATEGORY_LOOKUP[skill.category_code];
                const matchExplanation = (skill as any).match_explanation;

                return (
                  <div
                    key={`${skill.skill_name}-${idx}`}
                    className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {skill.skill_name}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                        {skill.category_code} · {cat?.shortName || skill.category_code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <strong>Candidate Evidence:</strong> {skill.evidence}
                    </p>
                    {matchExplanation && (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 italic">
                        {matchExplanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Match History Section */}
      {matchHistory.length > 0 && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <History className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Skill Match Evaluations (Port 8005)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 uppercase font-mono border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2 px-3">Candidate</th>
                  <th className="py-2 px-3">Target Role</th>
                  <th className="py-2 px-3">Company</th>
                  <th className="py-2 px-3">Match Score</th>
                  <th className="py-2 px-3">Matched</th>
                  <th className="py-2 px-3">Gaps</th>
                  <th className="py-2 px-3">Evaluated At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {matchHistory.slice(0, 5).map((h, idx) => (
                  <tr key={h.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {h.candidate_name || 'Candidate'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{h.role}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{h.company}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {h.match_score}%
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {h.matched_skills.length}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-red-600 dark:text-red-400 font-semibold">
                      {h.missing_skills.length}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {(h.evaluated_at || '').slice(0, 16).replace('T', ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
