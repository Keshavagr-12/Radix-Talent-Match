/**
 * CENTRALIZED API CONFIGURATION — 5 FASTAPI BACKENDS + REACT FRONTEND
 */

export const BACKEND_URLS = {
  jdAnalytics: import.meta.env.VITE_API_JD_URL || 'http://127.0.0.1:8001',
  resumeParsing: import.meta.env.VITE_API_RESUME_PARSING_URL || 'http://127.0.0.1:8002',
  profileBuilder: import.meta.env.VITE_API_PROFILE_BUILDER_URL || 'http://127.0.0.1:8003',
  talentCheck: import.meta.env.VITE_API_TALENT_CHECK_URL || 'http://127.0.0.1:8004',
  skillMatching: import.meta.env.VITE_API_SKILL_MATCHING_URL || 'http://127.0.0.1:8005',
};

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  useMock: import.meta.env.VITE_USE_MOCK_API === 'true',
  timeoutMs: 30000,
};

export const API_ENDPOINTS = {
  auth: {
    login: `${BACKEND_URLS.profileBuilder}/api/auth/login`,
    signup: `${BACKEND_URLS.profileBuilder}/api/auth/signup`,
    logout: `${BACKEND_URLS.profileBuilder}/api/auth/logout`,
    session: `${BACKEND_URLS.profileBuilder}/api/auth/session`,
  },
  // Role 1: JD Analytics (Port 8001)
  jdAnalytics: {
    base: BACKEND_URLS.jdAnalytics,
    extract: `${BACKEND_URLS.jdAnalytics}/jd-analytics/extract`,
    extractJson: `${BACKEND_URLS.jdAnalytics}/jd-analytics/extract-json`,
    list: `${BACKEND_URLS.jdAnalytics}/jd-analytics/list`,
    health: `${BACKEND_URLS.jdAnalytics}/health`,
    analyzeFile: `${BACKEND_URLS.jdAnalytics}/jd-analytics/extract`,
    listSaved: `${BACKEND_URLS.jdAnalytics}/jd-analytics/list`,
  },
  // Role 2: Resume Parsing (Port 8002)
  resumeParsing: {
    base: BACKEND_URLS.resumeParsing,
    extract: `${BACKEND_URLS.resumeParsing}/resume-parsing/extract`,
    samples: `${BACKEND_URLS.resumeParsing}/resume-parsing/samples`,
    health: `${BACKEND_URLS.resumeParsing}/health`,
    parseFile: `${BACKEND_URLS.resumeParsing}/resume-parsing/extract`,
  },
  // Role 3: Profile Builder (Port 8003)
  profile: {
    base: BACKEND_URLS.profileBuilder,
    profiles: `${BACKEND_URLS.profileBuilder}/api/profiles`,
    uploadResume: `${BACKEND_URLS.profileBuilder}/api/profiles/resume`,
    health: `${BACKEND_URLS.profileBuilder}/health`,
    get: `${BACKEND_URLS.profileBuilder}/api/profiles`,
    save: `${BACKEND_URLS.profileBuilder}/api/profiles`,
  },
  // Role 4: Talent Check (Port 8004)
  talentCheck: {
    base: BACKEND_URLS.talentCheck,
    evaluate: `${BACKEND_URLS.talentCheck}/talent-check/evaluate`,
    check: `${BACKEND_URLS.talentCheck}/talent-check/check`,
    companies: `${BACKEND_URLS.talentCheck}/talent-check/companies`,
    health: `${BACKEND_URLS.talentCheck}/health`,
  },
  // Role 5: Skill Matching (Port 8005)
  skillMatching: {
    base: BACKEND_URLS.skillMatching,
    compare: `${BACKEND_URLS.skillMatching}/skill-matching/compare`,
    match: `${BACKEND_URLS.skillMatching}/skill-matching/match`,
    candidates: `${BACKEND_URLS.skillMatching}/skill-matching/candidates`,
    jds: `${BACKEND_URLS.skillMatching}/skill-matching/jds`,
    history: `${BACKEND_URLS.skillMatching}/skill-matching/history`,
    health: `${BACKEND_URLS.skillMatching}/health`,
  },
};
