import { toast } from 'sonner';
import {
  IJDAnalyticsService,
  IResumeParsingService,
  IProfileService,
  ITalentCheckService,
  ISkillMatchingService,
  AnalyzeJDInput,
  ParseResumeInput,
} from '../interfaces';
import {
  ExtractedSkillList,
  ParsedResumeOutput,
  CandidateProfile,
  TalentCheckResult,
  SkillMatchingResult,
  CompanyExpectationProfile,
} from '../../types/radix';
import { JDApiService } from './jd.api';
import { ResumeParsingApiService } from './resumeParsing.api';
import { ProfileBuilderApiService } from './profileBuilder.api';
import { TalentCheckApiService } from './talentCheck.api';
import { SkillMatchingApiService } from './skillMatching.api';

export class IntegratedJDAnalyticsService implements IJDAnalyticsService {
  private api = new JDApiService();

  async getSampleJDs(): Promise<ExtractedSkillList[]> {
    try {
      return await this.api.getSampleJDs();
    } catch (err: any) {
      console.warn('[IntegratedJDAnalyticsService] Live getSampleJDs failed:', err);
      return [];
    }
  }

  async getJD(id: string): Promise<ExtractedSkillList> {
    return await this.api.getJD(id);
  }

  async deleteJD(id: string): Promise<boolean> {
    return await this.api.deleteJD(id);
  }

  async analyzeJD(input: AnalyzeJDInput): Promise<ExtractedSkillList> {
    try {
      const res = await this.api.analyzeJD(input);
      toast.success('Analyzed & saved job description via FastAPI backend (Port 8001)');
      return res;
    } catch (err: any) {
      console.error('[IntegratedJDAnalyticsService] Live backend error:', err);
      toast.error(`JD Analytics Backend error: ${err.message || 'Offline'}.`);
      throw err;
    }
  }
}

export class IntegratedResumeParsingService implements IResumeParsingService {
  private api = new ResumeParsingApiService();

  async getSampleResumes(): Promise<ParsedResumeOutput[]> {
    try {
      return await this.api.getSampleResumes();
    } catch (err: any) {
      console.warn('[IntegratedResumeParsingService] Live getSampleResumes failed:', err);
      return [];
    }
  }

  async getResume(id: string): Promise<ParsedResumeOutput> {
    return await this.api.getResume(id);
  }

  async deleteResume(id: string): Promise<boolean> {
    return await this.api.deleteResume(id);
  }

  async parseResume(input: ParseResumeInput): Promise<ParsedResumeOutput> {
    try {
      const res = await this.api.parseResume(input);
      toast.success('Parsed & saved candidate resume via live FastAPI backend (Port 8002)');
      return res;
    } catch (err: any) {
      console.error('[IntegratedResumeParsingService] Live backend error:', err);
      toast.error(`Resume Parsing Backend error: ${err.message || 'Offline'}.`);
      throw err;
    }
  }
}

export class IntegratedProfileService implements IProfileService {
  private api = new ProfileBuilderApiService();

  async getProfile(candidateId: string): Promise<CandidateProfile> {
    return await this.api.getProfile(candidateId);
  }

  async saveProfile(
    candidateId: string,
    profile: CandidateProfile,
    isDraft: boolean = false
  ): Promise<CandidateProfile> {
    try {
      const saved = await this.api.saveProfile(candidateId, profile, isDraft);
      toast.success('Saved candidate profile via live FastAPI backend (Port 8003)');
      return saved;
    } catch (err: any) {
      console.error('[IntegratedProfileService] Live backend error:', err);
      toast.error(`Profile Builder Backend error: ${err.message || 'Offline'}.`);
      throw err;
    }
  }

  calculateCompleteness(profile: CandidateProfile) {
    return this.api.calculateCompleteness(profile);
  }

  async listProfiles(): Promise<Array<{ id: string; profile: any; created_at?: string; updated_at?: string }>> {
    return await this.api.listProfiles();
  }

  async uploadResumeFile(file: File, profileId?: string) {
    return await this.api.uploadResumeFile(file, profileId);
  }

  async deleteProfile(profileId: string) {
    return await this.api.deleteProfile(profileId);
  }
}

export class IntegratedTalentCheckService implements ITalentCheckService {
  private api = new TalentCheckApiService();

  async getCompanies(): Promise<CompanyExpectationProfile[]> {
    return await this.api.getCompanies();
  }

  async runTalentCheck(profile: CandidateProfile, companyName: string): Promise<TalentCheckResult> {
    try {
      const res = await this.api.runTalentCheck(profile, companyName);
      toast.success(`Evaluated readiness against ${companyName} via live FastAPI backend (Port 8004)`);
      return res;
    } catch (err: any) {
      console.error('[IntegratedTalentCheckService] Live backend error:', err);
      toast.error(`Talent Check Backend error: ${err.message || 'Offline'}.`);
      throw err;
    }
  }
}

export class IntegratedSkillMatchingService implements ISkillMatchingService {
  private api = new SkillMatchingApiService();

  async runSkillMatching(
    profile: CandidateProfile,
    jd: ExtractedSkillList
  ): Promise<SkillMatchingResult> {
    try {
      const res = await this.api.runSkillMatching(profile, jd);
      toast.success(`Matched skills against ${jd.role} via live FastAPI backend (Port 8005)`);
      return res;
    } catch (err: any) {
      console.error('[IntegratedSkillMatchingService] Live backend error:', err);
      toast.error(`Skill Matching Backend error: ${err.message || 'Offline'}.`);
      throw err;
    }
  }

  async getCandidates() {
    return await this.api.getCandidates();
  }

  async getJDs() {
    return await this.api.getJDs();
  }

  async getMatchHistory() {
    return await this.api.getMatchHistory();
  }
}
