import {
  ExtractedSkillList,
  ParsedResumeOutput,
  CandidateProfile,
  TalentCheckResult,
  SkillMatchingResult,
  UserSession,
  CompanyExpectationProfile,
} from '../../types/radix';

export interface LoginPayload {
  email: string;
  password?: string;
  candidateId?: string;
  rememberMe?: boolean;
}

export interface SignupPayload {
  name: string;
  email: string;
  password?: string;
  candidateId?: string;
}

export type AuthProviderType = 'github' | 'google' | 'linkedin';

export interface IAuthService {
  getCurrentSession(): UserSession | null;
  login(payload: LoginPayload): Promise<UserSession>;
  signup(payload: SignupPayload): Promise<UserSession>;
  loginWithProvider(provider: AuthProviderType): Promise<UserSession>;
  logout(): Promise<void>;
  switchDemoCandidate(candidateId: string): Promise<UserSession>;
}

export interface AnalyzeJDInput {
  file?: File;
  sampleId?: string;
  rawText?: string;
  companyOverride?: string;
  roleOverride?: string;
}

export interface IJDAnalyticsService {
  getSampleJDs(): Promise<ExtractedSkillList[]>;
  analyzeJD(input: AnalyzeJDInput): Promise<ExtractedSkillList>;
  getJD?(id: string): Promise<ExtractedSkillList>;
  deleteJD?(id: string): Promise<boolean>;
}

export interface ParseResumeInput {
  file?: File;
  sampleCandidateId?: string;
}

export interface IResumeParsingService {
  getSampleResumes(): Promise<ParsedResumeOutput[]>;
  parseResume(input: ParseResumeInput): Promise<ParsedResumeOutput>;
  getResume?(id: string): Promise<ParsedResumeOutput>;
  deleteResume?(id: string): Promise<boolean>;
}

export interface IProfileService {
  getProfile(candidateId: string): Promise<CandidateProfile>;
  saveProfile(candidateId: string, profile: CandidateProfile, isDraft?: boolean): Promise<CandidateProfile>;
  calculateCompleteness(profile: CandidateProfile): {
    score: number;
    missingSections: string[];
    completedSections: string[];
  };
  listProfiles?(): Promise<Array<{ id: string; profile: any; created_at?: string; updated_at?: string }>>;
  uploadResumeFile?(file: File, profileId?: string): Promise<{ id: string; profile: any; message: string }>;
  deleteProfile?(id: string): Promise<boolean>;
}

export interface ITalentCheckService {
  getCompanies(): Promise<CompanyExpectationProfile[]>;
  runTalentCheck(profile: CandidateProfile, companyName: string): Promise<TalentCheckResult>;
}

export interface ISkillMatchingService {
  runSkillMatching(profile: CandidateProfile, jd: ExtractedSkillList): Promise<SkillMatchingResult>;
  getCandidates?(): Promise<Array<{ id: string; name: string; skills_count: number; headline?: string }>>;
  getJDs?(): Promise<Array<{ id: string; company: string; role: string; source_file: string; skills_count: number }>>;
  getMatchHistory?(): Promise<SkillMatchingResult[]>;
}
