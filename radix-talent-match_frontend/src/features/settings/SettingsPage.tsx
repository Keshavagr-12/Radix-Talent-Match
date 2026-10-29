import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  Monitor,
  Trash2,
  LogOut,
  Sliders,
  Bell,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PageHeader,
  Button,
  Select,
  ConfirmDialog,
} from '../../components/ui/primitives';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { profileBuilderApiService } from '../../services/api';
import { cn } from '../../utils/cn';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, reducedMotion, setReducedMotion } = useTheme();
  const { logout } = useAuth();
  const {
    activeCandidateId,
    selectCandidateProfile,
    clearWorkspaceHistory,
  } = useWorkspace();
  const navigate = useNavigate();

  const [emailDigest, setEmailDigest] = useState(true);
  const [gapAlerts, setGapAlerts] = useState(true);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [candidateOptions, setCandidateOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    let isMounted = true;
    profileBuilderApiService
      .listProfiles()
      .then((profiles) => {
        if (!isMounted) return;
        if (profiles && profiles.length > 0) {
          const opts = profiles.map((p) => {
            const name = p.profile?.name || p.profile?.candidate_name || p.id;
            const headline =
              p.profile?.headline ||
              p.profile?.profile_archetype ||
              p.profile?.preferred_roles?.[0] ||
              'Candidate Profile';
            return {
              value: p.id,
              label: `${name} — ${headline}`,
            };
          });
          setCandidateOptions(opts);
        } else {
          setCandidateOptions([
            {
              value: activeCandidateId || 'cand-workspace',
              label: 'Default Workspace Profile (Active)',
            },
          ]);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCandidateOptions([
            {
              value: activeCandidateId || 'cand-workspace',
              label: 'Default Workspace Profile (Active)',
            },
          ]);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [activeCandidateId]);

  const themeOptions: Array<{ id: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'light', label: 'Light Theme', icon: Sun },
    { id: 'dark', label: 'Dark Theme (Midnight Navy)', icon: Moon },
    { id: 'system', label: 'System Default', icon: Monitor },
  ];

  const handleLogout = async () => {
    await logout();
    toast.info('Signed out of RADIX Talent Match workspace.');
    navigate('/');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        kicker="PREFERENCES & ACCESSIBILITY"
        title="Workspace & Theme Settings"
        description="Configure color theme, reduced motion preferences, active candidate profile, and local browser workspace storage."
      />

      {/* 1. Theme & Accessibility */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Sliders className="w-4 h-4 text-indigo-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Appearance & Motion Preferences
          </h2>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Color Theme Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const active = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    toast.success(`Theme updated to ${opt.label}`);
                  }}
                  className={cn(
                    'p-4 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer',
                    active
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Reduced Motion Mode
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pauses the interactive talent-network canvas animation and minimizes UI transitions across all screens.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => {
                setReducedMotion(e.target.checked);
                toast.info(
                  e.target.checked
                    ? 'Reduced motion enabled.'
                    : 'Standard animations enabled.'
                );
              }}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
          </label>
        </div>
      </div>

      {/* 2. Active Candidate Profile Preference */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Users className="w-4 h-4 text-indigo-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Active Candidate Profile
          </h2>
        </div>

        <Select
          label="Switch Active Candidate Profile Across Workspace"
          value={activeCandidateId}
          onChange={async (e) => {
            await selectCandidateProfile(e.target.value);
            toast.success('Switched active candidate profile.');
          }}
          options={
            candidateOptions.length > 0
              ? candidateOptions
              : [
                  {
                    value: activeCandidateId || 'cand-workspace',
                    label: 'Default Workspace Profile (Active)',
                  },
                ]
          }
        />
      </div>

      {/* 3. Notification Preferences */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Bell className="w-4 h-4 text-indigo-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Workspace Notification Preferences
          </h2>
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                Skill Gap Alert Notifications
              </p>
              <p className="text-slate-500">
                Notify in workspace header when Talent Check identifies category gaps ≥ 2 levels.
              </p>
            </div>
            <input
              type="checkbox"
              checked={gapAlerts}
              onChange={(e) => setGapAlerts(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                Shared Contract Schema Validation Toast
              </p>
              <p className="text-slate-500">
                Display confirmation toast when importing Resume Parsing output into Profile Builder.
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailDigest}
              onChange={(e) => setEmailDigest(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>
        </div>
      </div>

      {/* 4. Local Persistence & Session Actions */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Local Workspace Storage & Session Controls
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Clear local Talent Check / Skill Match history or sign out of the candidate session.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmClearOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </Button>
          <Button variant="danger" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          clearWorkspaceHistory();
          toast.success('Cleared local analysis history.');
        }}
        title="Clear Local Analysis History?"
        message="This removes saved Talent Check and Skill Matching runs from local browser storage. Your candidate profiles and analyzed JDs will remain intact."
        confirmLabel="Clear History"
        variant="danger"
      />
    </div>
  );
};
