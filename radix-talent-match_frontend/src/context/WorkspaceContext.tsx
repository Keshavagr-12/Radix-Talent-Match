import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ExtractedSkillList,
  ParsedResumeOutput,
  CandidateProfile,
  TalentCheckResult,
  SkillMatchingResult,
  ActivityRecord,
  NotificationItem,
} from '../types/radix';
import { parsedResumeToCandidateProfile } from '../utils/profileMapper';
import {
  profileBuilderApiService as profileService,
  talentCheckApiService as talentCheckService,
  skillMatchingApiService as skillMatchingService,
} from '../services/api';
import { useAuth } from './AuthContext';

export interface ActiveJDSessionState {
  hasAnalyzed: boolean;
  displayedResult: ExtractedSkillList | null;
  jdTextInput: string;
  selectedFileName: string | null;
  selectedFileSize: number | null;
  convertedSourceText: string;
}

export interface ActiveResumeSessionState {
  hasParsed: boolean;
  displayedResume: ParsedResumeOutput | null;
  selectedFileName: string | null;
  selectedFileSize: number | null;
}

export interface ActiveProfileSessionState {
  hasSavedProfile: boolean;
  savedProfile: CandidateProfile | null;
}

export interface ActiveTalentCheckSessionState {
  hasEvaluated: boolean;
  candidateSource: string;
  benchmarkSource: string;
  importedProfile: CandidateProfile | null;
  importedJD: ExtractedSkillList | null;
  displayedResult: TalentCheckResult | null;
}

export interface ActiveSkillMatchSessionState {
  hasMatched: boolean;
  candidateSource: string;
  jdSource: string;
  importedProfile: CandidateProfile | null;
  importedJD: ExtractedSkillList | null;
  displayedResult: SkillMatchingResult | null;
}

export const EMPTY_CANDIDATE_PROFILE: CandidateProfile = {
  id: 'cand-workspace',
  name: '',
  email: '',
  phone: '',
  headline: '',
  location: '',
  summary: '',
  skills: [],
  education: [],
  projects: [],
  internships: [],
  hackathons: [],
  certifications: [],
  preferred_roles: [],
  completeness_score: 0,
  updated_at: new Date().toISOString(),
};

interface WorkspaceContextValue {
  activeCandidateId: string;
  activeProfile: CandidateProfile;
  analyzedJDs: ExtractedSkillList[];
  selectedJDId: string;
  selectedCompany: string;
  latestParsedResume: ParsedResumeOutput | null;
  talentCheckHistory: TalentCheckResult[];
  skillMatchHistory: SkillMatchingResult[];
  activities: ActivityRecord[];
  notifications: NotificationItem[];
  activeJDSession: ActiveJDSessionState;
  activeResumeSession: ActiveResumeSessionState;
  activeProfileSession: ActiveProfileSessionState;
  activeTalentCheckSession: ActiveTalentCheckSessionState;
  activeSkillMatchSession: ActiveSkillMatchSessionState;
  completeness: {
    score: number;
    missingSections: string[];
    completedSections: string[];
  };
  selectCandidateProfile: (candidateId: string) => Promise<void>;
  saveCandidateProfile: (profile: CandidateProfile, isDraft?: boolean) => Promise<CandidateProfile>;
  importParsedResumeToProfile: (parsed: ParsedResumeOutput) => Promise<CandidateProfile>;
  clearActiveProfileSession: () => void;
  addAnalyzedJD: (jd: ExtractedSkillList) => void;
  removeAnalyzedJD: (jdId: string) => Promise<void>;
  setSelectedJDId: (jdId: string) => void;
  setSelectedCompany: (company: string) => void;
  setLatestParsedResume: (parsed: ParsedResumeOutput | null) => void;
  updateActiveJDSession: (patch: Partial<ActiveJDSessionState>) => void;
  clearActiveJDSession: () => void;
  updateActiveResumeSession: (patch: Partial<ActiveResumeSessionState>) => void;
  clearActiveResumeSession: () => void;
  updateActiveTalentCheckSession: (patch: Partial<ActiveTalentCheckSessionState>) => void;
  clearActiveTalentCheckSession: () => void;
  updateActiveSkillMatchSession: (patch: Partial<ActiveSkillMatchSessionState>) => void;
  clearActiveSkillMatchSession: () => void;
  executeTalentCheck: (companyName: string, profileOverride?: CandidateProfile) => Promise<TalentCheckResult>;
  executeSkillMatching: (jd: ExtractedSkillList, profileOverride?: CandidateProfile) => Promise<SkillMatchingResult>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearWorkspaceHistory: () => void;
}

const JDS_STORAGE_KEY = 'radix_tm_jds_v2';
const ACTIVE_JD_SESSION_KEY = 'radix_tm_active_jd_session_v1';
const ACTIVE_RESUME_SESSION_KEY = 'radix_tm_active_resume_session_v1';
const ACTIVE_PROFILE_SESSION_KEY = 'radix_tm_active_profile_session_v1';
const ACTIVE_TC_SESSION_KEY = 'radix_tm_active_talent_check_session_v1';
const ACTIVE_SM_SESSION_KEY = 'radix_tm_active_skill_match_session_v1';
const TC_STORAGE_KEY = 'radix_tm_talent_checks_v2';
const SM_STORAGE_KEY = 'radix_tm_skill_matches_v2';
const ACT_STORAGE_KEY = 'radix_tm_activities_v2';
const NOTIF_STORAGE_KEY = 'radix_tm_notifications_v1';

const DEFAULT_ACTIVE_JD_SESSION: ActiveJDSessionState = {
  hasAnalyzed: false,
  displayedResult: null,
  jdTextInput: '',
  selectedFileName: null,
  selectedFileSize: null,
  convertedSourceText: '',
};

const DEFAULT_ACTIVE_RESUME_SESSION: ActiveResumeSessionState = {
  hasParsed: false,
  displayedResume: null,
  selectedFileName: null,
  selectedFileSize: null,
};

const DEFAULT_ACTIVE_PROFILE_SESSION: ActiveProfileSessionState = {
  hasSavedProfile: false,
  savedProfile: null,
};

const DEFAULT_ACTIVE_TC_SESSION: ActiveTalentCheckSessionState = {
  hasEvaluated: false,
  candidateSource: '',
  benchmarkSource: '',
  importedProfile: null,
  importedJD: null,
  displayedResult: null,
};

const DEFAULT_ACTIVE_SM_SESSION: ActiveSkillMatchSessionState = {
  hasMatched: false,
  candidateSource: '',
  jdSource: '',
  importedProfile: null,
  importedJD: null,
  displayedResult: null,
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore
  }
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Shared Data Contract Active',
    message: 'All 5 RADIX modules are synced with the 12-skillset schema.',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    read: false,
    link: '/app/profile',
  },
  {
    id: 'notif-2',
    title: 'Company Benchmark Snapshot Loaded',
    message: 'Illustrative 12-category expectations for Google LLC, Microsoft, and Oracle FSS are ready for Talent Check.',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    read: false,
    link: '/app/talent-check',
  },
];

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, switchCandidate } = useAuth();
  const activeCandidateId = user?.selectedCandidateId || 'cand-workspace';

  const [activeJDSession, setActiveJDSession] = useState<ActiveJDSessionState>(() =>
    loadFromStorage<ActiveJDSessionState>(ACTIVE_JD_SESSION_KEY, DEFAULT_ACTIVE_JD_SESSION)
  );

  const [activeResumeSession, setActiveResumeSession] = useState<ActiveResumeSessionState>(() =>
    loadFromStorage<ActiveResumeSessionState>(ACTIVE_RESUME_SESSION_KEY, DEFAULT_ACTIVE_RESUME_SESSION)
  );

  const [activeProfileSession, setActiveProfileSession] = useState<ActiveProfileSessionState>(() =>
    loadFromStorage<ActiveProfileSessionState>(ACTIVE_PROFILE_SESSION_KEY, DEFAULT_ACTIVE_PROFILE_SESSION)
  );

  const [activeProfile, setActiveProfile] = useState<CandidateProfile>(() => {
    const savedSession = loadFromStorage<ActiveProfileSessionState>(
      ACTIVE_PROFILE_SESSION_KEY,
      DEFAULT_ACTIVE_PROFILE_SESSION
    );
    if (savedSession.hasSavedProfile && savedSession.savedProfile) {
      return savedSession.savedProfile;
    }
    return EMPTY_CANDIDATE_PROFILE;
  });

  const [analyzedJDs, setAnalyzedJDs] = useState<ExtractedSkillList[]>(() =>
    loadFromStorage<ExtractedSkillList[]>(JDS_STORAGE_KEY, [])
  );

  const [selectedJDId, setSelectedJDId] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [latestParsedResume, setLatestParsedResume] = useState<ParsedResumeOutput | null>(() => {
    const resumeSession = loadFromStorage<ActiveResumeSessionState>(
      ACTIVE_RESUME_SESSION_KEY,
      DEFAULT_ACTIVE_RESUME_SESSION
    );
    return resumeSession.hasParsed ? resumeSession.displayedResume : null;
  });

  const [activeTalentCheckSession, setActiveTalentCheckSession] = useState<ActiveTalentCheckSessionState>(() =>
    loadFromStorage<ActiveTalentCheckSessionState>(ACTIVE_TC_SESSION_KEY, DEFAULT_ACTIVE_TC_SESSION)
  );

  const [activeSkillMatchSession, setActiveSkillMatchSession] = useState<ActiveSkillMatchSessionState>(() =>
    loadFromStorage<ActiveSkillMatchSessionState>(ACTIVE_SM_SESSION_KEY, DEFAULT_ACTIVE_SM_SESSION)
  );

  const [talentCheckHistory, setTalentCheckHistory] = useState<TalentCheckResult[]>(() =>
    loadFromStorage<TalentCheckResult[]>(TC_STORAGE_KEY, [])
  );

  const [skillMatchHistory, setSkillMatchHistory] = useState<SkillMatchingResult[]>(() =>
    loadFromStorage<SkillMatchingResult[]>(SM_STORAGE_KEY, [])
  );

  const [activities, setActivities] = useState<ActivityRecord[]>(() =>
    loadFromStorage<ActivityRecord[]>(ACT_STORAGE_KEY, [])
  );

  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    loadFromStorage<NotificationItem[]>(NOTIF_STORAGE_KEY, INITIAL_NOTIFICATIONS)
  );

  // Clear active JD, Resume, Profile, Talent Check, and Skill Match session state whenever user signs out
  useEffect(() => {
    if (!user) {
      setActiveJDSession(DEFAULT_ACTIVE_JD_SESSION);
      setActiveResumeSession(DEFAULT_ACTIVE_RESUME_SESSION);
      setActiveProfileSession(DEFAULT_ACTIVE_PROFILE_SESSION);
      setActiveProfile(EMPTY_CANDIDATE_PROFILE);
      setLatestParsedResume(null);
      setActiveTalentCheckSession(DEFAULT_ACTIVE_TC_SESSION);
      setActiveSkillMatchSession(DEFAULT_ACTIVE_SM_SESSION);
      try {
        localStorage.removeItem(ACTIVE_JD_SESSION_KEY);
        localStorage.removeItem(ACTIVE_RESUME_SESSION_KEY);
        localStorage.removeItem(ACTIVE_PROFILE_SESSION_KEY);
        localStorage.removeItem(ACTIVE_TC_SESSION_KEY);
        localStorage.removeItem(ACTIVE_SM_SESSION_KEY);
      } catch {
        // Ignore
      }
    }
  }, [user]);

  const logActivity = useCallback((record: Omit<ActivityRecord, 'id' | 'timestamp'>) => {
    const newRecord: ActivityRecord = {
      ...record,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => {
      const updated = [newRecord, ...prev].slice(0, 30);
      saveToStorage(ACT_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const selectCandidateProfile = async (candidateId: string) => {
    await switchCandidate(candidateId);
    const prof = await profileService.getProfile(candidateId);
    setActiveProfile(prof);
  };

  const saveCandidateProfile = async (profile: CandidateProfile, isDraft = false) => {
    const saved = await profileService.saveProfile(activeCandidateId, profile, isDraft);
    setActiveProfile(saved);
    const nextSession: ActiveProfileSessionState = {
      hasSavedProfile: Boolean(saved.name.trim()),
      savedProfile: saved,
    };
    setActiveProfileSession(nextSession);
    saveToStorage(ACTIVE_PROFILE_SESSION_KEY, nextSession);
    logActivity({
      type: 'profile_update',
      title: isDraft ? 'Saved Profile Draft' : 'Updated Candidate Profile',
      subtitle: `${saved.name} · ${saved.skills.length} tagged skills`,
      route: '/app/profile',
    });
    return saved;
  };

  const importParsedResumeToProfile = async (parsed: ParsedResumeOutput) => {
    const converted = parsedResumeToCandidateProfile(parsed);
    const targetId = parsed.id || activeCandidateId;
    if (parsed.id && parsed.id !== activeCandidateId) {
      await switchCandidate(parsed.id);
    }
    const saved = await profileService.saveProfile(targetId, converted, false);
    setActiveProfile(saved);
    const nextSession: ActiveProfileSessionState = {
      hasSavedProfile: Boolean(saved.name.trim()),
      savedProfile: saved,
    };
    setActiveProfileSession(nextSession);
    saveToStorage(ACTIVE_PROFILE_SESSION_KEY, nextSession);
    logActivity({
      type: 'resume_parsing',
      title: `Imported Resume into Profile Builder`,
      subtitle: `${parsed.candidate_name} (${parsed.source_file})`,
      route: '/app/profile',
    });
    return saved;
  };

  const clearActiveProfileSession = useCallback(() => {
    setActiveProfile(EMPTY_CANDIDATE_PROFILE);
    setActiveProfileSession(DEFAULT_ACTIVE_PROFILE_SESSION);
    try {
      localStorage.removeItem(ACTIVE_PROFILE_SESSION_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const addAnalyzedJD = (jd: ExtractedSkillList) => {
    setAnalyzedJDs((prev) => {
      const existsIdx = prev.findIndex(
        (item) => item.id === jd.id || item.source_file === jd.source_file
      );
      let updated: ExtractedSkillList[];
      if (existsIdx >= 0) {
        updated = [...prev];
        updated[existsIdx] = jd;
      } else {
        updated = [jd, ...prev];
      }
      saveToStorage(JDS_STORAGE_KEY, updated);
      return updated;
    });
    if (jd.id) {
      setSelectedJDId(jd.id);
    }
    logActivity({
      type: 'jd_analytics',
      title: `Analyzed JD: ${jd.role}`,
      subtitle: `${jd.company} · ${jd.skills.length} skills extracted`,
      route: '/app/jd-analytics',
    });
  };

  const removeAnalyzedJD = async (jdId: string) => {
    setAnalyzedJDs((prev) => {
      const updated = prev.filter((item) => item.id !== jdId);
      saveToStorage(JDS_STORAGE_KEY, updated);
      return updated;
    });
    if (selectedJDId === jdId) {
      setSelectedJDId('');
    }
    if (activeJDSession.displayedResult?.id === jdId) {
      updateActiveJDSession({
        hasAnalyzed: false,
        displayedResult: null,
        selectedFileName: null,
        selectedFileSize: null,
        convertedSourceText: '',
      });
    }
  };

  const executeTalentCheck = async (
    companyName: string,
    profileOverride?: CandidateProfile
  ): Promise<TalentCheckResult> => {
    const targetProfile = profileOverride || activeProfile;
    const result = await talentCheckService.runTalentCheck(targetProfile, companyName);
    setTalentCheckHistory((prev) => {
      const updated = [result, ...prev].slice(0, 20);
      saveToStorage(TC_STORAGE_KEY, updated);
      return updated;
    });
    logActivity({
      type: 'talent_check',
      title: `Talent Check: ${result.company}`,
      subtitle: `Evaluated ${targetProfile.name} across 12 categories`,
      score: result.readiness_score,
      route: '/app/talent-check',
    });
    return result;
  };

  const executeSkillMatching = async (
    jd: ExtractedSkillList,
    profileOverride?: CandidateProfile
  ): Promise<SkillMatchingResult> => {
    const targetProfile = profileOverride || activeProfile;
    const result = await skillMatchingService.runSkillMatching(targetProfile, jd);
    setSkillMatchHistory((prev) => {
      const updated = [result, ...prev].slice(0, 20);
      saveToStorage(SM_STORAGE_KEY, updated);
      return updated;
    });
    logActivity({
      type: 'skill_matching',
      title: `Skill Match: ${jd.role}`,
      subtitle: `${jd.company} · ${targetProfile.name}`,
      score: result.match_score,
      route: '/app/skill-matching',
    });
    return result;
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveToStorage(NOTIF_STORAGE_KEY, updated);
      return updated;
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveToStorage(NOTIF_STORAGE_KEY, updated);
      return updated;
    });
  };

  const updateActiveJDSession = useCallback((patch: Partial<ActiveJDSessionState>) => {
    setActiveJDSession((prev) => {
      const next = { ...prev, ...patch };
      saveToStorage(ACTIVE_JD_SESSION_KEY, next);
      return next;
    });
  }, []);

  const clearActiveJDSession = useCallback(() => {
    setActiveJDSession(DEFAULT_ACTIVE_JD_SESSION);
    try {
      localStorage.removeItem(ACTIVE_JD_SESSION_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const updateActiveResumeSession = useCallback((patch: Partial<ActiveResumeSessionState>) => {
    setActiveResumeSession((prev) => {
      const next = { ...prev, ...patch };
      saveToStorage(ACTIVE_RESUME_SESSION_KEY, next);
      return next;
    });
  }, []);

  const clearActiveResumeSession = useCallback(() => {
    setActiveResumeSession(DEFAULT_ACTIVE_RESUME_SESSION);
    try {
      localStorage.removeItem(ACTIVE_RESUME_SESSION_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const updateActiveTalentCheckSession = useCallback((patch: Partial<ActiveTalentCheckSessionState>) => {
    setActiveTalentCheckSession((prev) => {
      const next = { ...prev, ...patch };
      saveToStorage(ACTIVE_TC_SESSION_KEY, next);
      return next;
    });
  }, []);

  const clearActiveTalentCheckSession = useCallback(() => {
    setActiveTalentCheckSession(DEFAULT_ACTIVE_TC_SESSION);
    try {
      localStorage.removeItem(ACTIVE_TC_SESSION_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const updateActiveSkillMatchSession = useCallback((patch: Partial<ActiveSkillMatchSessionState>) => {
    setActiveSkillMatchSession((prev) => {
      const next = { ...prev, ...patch };
      saveToStorage(ACTIVE_SM_SESSION_KEY, next);
      return next;
    });
  }, []);

  const clearActiveSkillMatchSession = useCallback(() => {
    setActiveSkillMatchSession(DEFAULT_ACTIVE_SM_SESSION);
    try {
      localStorage.removeItem(ACTIVE_SM_SESSION_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const clearWorkspaceHistory = () => {
    setTalentCheckHistory([]);
    setSkillMatchHistory([]);
    setActivities([]);
    clearActiveJDSession();
    clearActiveResumeSession();
    clearActiveProfileSession();
    clearActiveTalentCheckSession();
    clearActiveSkillMatchSession();
    saveToStorage(TC_STORAGE_KEY, []);
    saveToStorage(SM_STORAGE_KEY, []);
    saveToStorage(ACT_STORAGE_KEY, []);
  };

  const completeness = profileService.calculateCompleteness(activeProfile);

  return (
    <WorkspaceContext.Provider
      value={{
        activeCandidateId,
        activeProfile,
        analyzedJDs,
        selectedJDId,
        selectedCompany,
        latestParsedResume,
        talentCheckHistory,
        skillMatchHistory,
        activities,
        notifications,
        activeJDSession,
        activeResumeSession,
        activeProfileSession,
        activeTalentCheckSession,
        activeSkillMatchSession,
        completeness,
        selectCandidateProfile,
        saveCandidateProfile,
        importParsedResumeToProfile,
        clearActiveProfileSession,
        addAnalyzedJD,
        removeAnalyzedJD,
        setSelectedJDId,
        setSelectedCompany,
        setLatestParsedResume,
        updateActiveJDSession,
        clearActiveJDSession,
        updateActiveResumeSession,
        clearActiveResumeSession,
        updateActiveTalentCheckSession,
        clearActiveTalentCheckSession,
        updateActiveSkillMatchSession,
        clearActiveSkillMatchSession,
        executeTalentCheck,
        executeSkillMatching,
        markNotificationRead,
        markAllNotificationsRead,
        clearWorkspaceHistory,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within a WorkspaceProvider');
  return ctx;
}
