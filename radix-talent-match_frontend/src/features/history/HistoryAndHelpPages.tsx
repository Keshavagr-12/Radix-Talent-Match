import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History as HistoryIcon,
  ShieldCheck,
  GitCompare,
  Trash2,
  BookOpen,
  Bell,
  CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PageHeader,
  Button,
  EmptyState,
  ConfirmDialog,
} from '../../components/ui/primitives';
import { useWorkspace } from '../../context/WorkspaceContext';
import { API_CONFIG, API_ENDPOINTS } from '../../services/api/config';
import { formatDateTime } from '../../utils/cn';

/**
 * 1. HISTORY PAGE (/app/history)
 */
export const HistoryPage: React.FC = () => {
  const {
    talentCheckHistory,
    skillMatchHistory,
    activities,
    clearWorkspaceHistory,
  } = useWorkspace();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="SESSION & EVALUATION LOG"
        title="Analysis & Comparison History"
        description="Review past Talent Check company readiness runs, job-specific Skill Matching scores, and workspace activity stored in your browser."
        actions={
          <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Talent Check History */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Talent Check Runs ({talentCheckHistory.length})</span>
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/talent-check')}>
              New Check
            </Button>
          </div>

          {talentCheckHistory.length === 0 ? (
            <EmptyState
              title="No Talent Check runs recorded"
              description="Run a 12-category company readiness check to record results here."
              actionLabel="Go to Talent Check"
              onAction={() => navigate('/app/talent-check')}
            />
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {talentCheckHistory.map((tc, i) => {
                const gaps = tc.skillset_gap.filter((g) => g.gap).length;
                return (
                  <div
                    key={tc.id || i}
                    onClick={() => navigate('/app/talent-check')}
                    className="py-3 flex items-center justify-between gap-4 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {tc.company} — {tc.candidate_name || 'Candidate'}
                      </p>
                      <p className="text-slate-500">
                        {12 - gaps}/12 categories met · {gaps} gaps ·{' '}
                        {tc.evaluated_at ? formatDateTime(tc.evaluated_at) : 'Recent'}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                      {tc.readiness_score}/100
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Skill Matching History */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-indigo-500" />
              <span>Skill Matching Runs ({skillMatchHistory.length})</span>
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/skill-matching')}>
              New Match
            </Button>
          </div>

          {skillMatchHistory.length === 0 ? (
            <EmptyState
              title="No Skill Matching runs recorded"
              description="Compare a candidate profile against a specific job posting to log runs."
              actionLabel="Go to Skill Matching"
              onAction={() => navigate('/app/skill-matching')}
            />
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {skillMatchHistory.map((sm, i) => (
                <div
                  key={sm.id || i}
                  onClick={() => navigate('/app/skill-matching')}
                  className="py-3 flex items-center justify-between gap-4 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {sm.role || sm.jd_source_file} ({sm.company})
                    </p>
                    <p className="text-slate-500">
                      {sm.candidate_name} · {sm.matched_skills.length} matched ·{' '}
                      {sm.missing_skills.length} missing
                    </p>
                  </div>
                  <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {sm.match_score}/100
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Activity Timeline */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HistoryIcon className="w-4 h-4 text-indigo-500" />
          <span>Complete Workspace Timeline ({activities.length})</span>
        </h2>

        {activities.length === 0 ? (
          <EmptyState
            title="Timeline is empty"
            description="Perform any action across the 5 RADIX modules to populate the timeline."
          />
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {activities.map((act) => (
              <div
                key={act.id}
                onClick={() => navigate(act.route)}
                className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg"
              >
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {act.title}
                  </span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="text-slate-500">{act.subtitle}</span>
                </div>
                <span className="font-mono text-slate-400 shrink-0">
                  {formatDateTime(act.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          clearWorkspaceHistory();
          toast.success('History cleared.');
        }}
        title="Clear Workspace History?"
        message="This clears recorded Talent Check and Skill Matching sessions from localStorage."
        confirmLabel="Clear"
        variant="danger"
      />
    </div>
  );
};

/**
 * 2. NOTIFICATIONS PAGE (/app/notifications)
 */
export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useWorkspace();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        kicker="WORKSPACE ALERTS"
        title="Notifications"
        description="System notifications and workflow handoff updates across the five RADIX Talent Match modules."
        actions={
          <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Read</span>
          </Button>
        }
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => {
              markNotificationRead(n.id);
              if (n.link) navigate(n.link);
            }}
            className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-start gap-3">
              <Bell className="w-4 h-4 text-indigo-500 shrink-0 mt-1" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {n.title}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {n.message}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400 shrink-0">
              {formatDateTime(n.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 3. SHARED DATA CONTRACT & BACKEND INTEGRATION GUIDE (/app/help)
 */
export const HelpContractPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        kicker="ARCHITECTURE & SHARED CONTRACT REFERENCE"
        title="Shared Data Contract & Backend Integration Guide"
        description="Exact JSON schemas from Section 06 of the RADIX Talent Match Hackathon Brief and step-by-step instructions for connecting the five Python/LangChain backend modules."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span>1. Building Block: Single `Skill` Schema</span>
          </h2>
          <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto">
{`{
  "skill_name": "...",
  "category_code": "DSA|COD|OOD|APTI|COMM|AI|CLOUD|SQL|SWE|SYSD|NETW|OS|OTHER",
  "evidence": "short quote or reason",
  "confidence": "high|medium|low"
}`}
          </pre>
        </div>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            2. Role 1 & Role 2 Output: `ExtractedSkillList`
          </h2>
          <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto">
{`{
  "source_type": "jd|resume",
  "source_file": "...",
  "company": "...",
  "role": "...",
  "skills": [ <skill>, ... ]
}`}
          </pre>
        </div>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            3. Role 4 Output: `TalentCheckResult`
          </h2>
          <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto">
{`{
  "company": "...",
  "skillset_gap": [
    {
      "category_code": "...",
      "required_level": 1-10,
      "candidate_level": 1-10,
      "gap": true|false
    }
  ],
  "readiness_score": 0-100
}`}
          </pre>
        </div>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            4. Role 5 Output: `SkillMatchingResult`
          </h2>
          <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto">
{`{
  "jd_source_file": "...",
  "match_score": 0-100,
  "matched_skills": [ <skill>, ... ],
  "missing_skills": [ <skill>, ... ]
}`}
          </pre>
        </div>
      </div>

      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          How to Connect Your 5 Python / LangChain / Supabase Backend Modules
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          All UI components consume service interfaces defined in <code className="font-mono">src/services/interfaces/index.ts</code> and configured via <code className="font-mono">src/services/api/config.ts</code>. Currently <code className="font-mono">API_CONFIG.useMock</code> is active (<code className="font-mono">{String(API_CONFIG.useMock)}</code>) with base URL <code className="font-mono">{API_CONFIG.baseUrl}</code>.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-2 pr-4 font-medium">Module & Role</th>
                <th className="py-2 px-4 font-medium">Service Interface</th>
                <th className="py-2 pl-4 font-medium">Configured Endpoint Path</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
              <tr>
                <td className="py-2.5 pr-4 font-sans font-semibold">01. JD Analytics</td>
                <td className="py-2.5 px-4 text-indigo-600 dark:text-indigo-400">IJDAnalyticsService</td>
                <td className="py-2.5 pl-4">{API_ENDPOINTS.jdAnalytics.analyzeFile}</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-sans font-semibold">02. Resume Parsing</td>
                <td className="py-2.5 px-4 text-indigo-600 dark:text-indigo-400">IResumeParsingService</td>
                <td className="py-2.5 pl-4">{API_ENDPOINTS.resumeParsing.parseFile}</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-sans font-semibold">03. Profile Builder</td>
                <td className="py-2.5 px-4 text-indigo-600 dark:text-indigo-400">IProfileService</td>
                <td className="py-2.5 pl-4">{API_ENDPOINTS.profile.save}</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-sans font-semibold">04. Talent Check</td>
                <td className="py-2.5 px-4 text-indigo-600 dark:text-indigo-400">ITalentCheckService</td>
                <td className="py-2.5 pl-4">{API_ENDPOINTS.talentCheck.evaluate}</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-sans font-semibold">05. Skill Matching</td>
                <td className="py-2.5 px-4 text-indigo-600 dark:text-indigo-400">ISkillMatchingService</td>
                <td className="py-2.5 pl-4">{API_ENDPOINTS.skillMatching.match}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
