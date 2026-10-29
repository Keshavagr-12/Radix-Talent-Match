import { ISkillMatchingService } from '../interfaces';
import { CandidateProfile, ExtractedSkillList, SkillMatchingResult } from '../../types/radix';
import { API_ENDPOINTS } from './config';
import { requestJson } from './client';

export class SkillMatchingApiService implements ISkillMatchingService {
  async runSkillMatching(
    profile: CandidateProfile,
    jd: ExtractedSkillList
  ): Promise<SkillMatchingResult> {
    const payload = {
      profile: {
        id: profile.id,
        candidate_id: profile.id,
        name: profile.name,
        email: profile.email,
        skills: profile.skills,
      },
      jd: {
        source_type: jd.source_type,
        source_file: jd.source_file,
        company: jd.company,
        role: jd.role,
        skills: jd.skills,
      },
    };

    const res = await requestJson<any>(API_ENDPOINTS.skillMatching.compare, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeoutMs: 30000,
    });

    return {
      id: res.id || `sm-${Date.now()}`,
      candidate_name: res.candidate_name || profile.name,
      company: res.company || jd.company,
      role: res.role || jd.role,
      jd_source_file: res.jd_source_file || jd.source_file,
      match_score: res.match_score,
      matched_skills: res.matched_skills || [],
      missing_skills: res.missing_skills || [],
      partial_skills: res.partial_skills || [],
      gap_analysis: res.gap_analysis,
      evaluated_at: res.evaluated_at || new Date().toISOString(),
    };
  }

  async getCandidates(): Promise<Array<{ id: string; name: string; skills_count: number; headline?: string }>> {
    try {
      return await requestJson<any>(API_ENDPOINTS.skillMatching.candidates, {
        method: 'GET',
        timeoutMs: 10000,
      });
    } catch (err) {
      console.warn('Failed to fetch candidates for skill matching:', err);
      return [];
    }
  }

  async getJDs(): Promise<Array<{ id: string; company: string; role: string; source_file: string; skills_count: number }>> {
    try {
      return await requestJson<any>(API_ENDPOINTS.skillMatching.jds, {
        method: 'GET',
        timeoutMs: 10000,
      });
    } catch (err) {
      console.warn('Failed to fetch JDs for skill matching:', err);
      return [];
    }
  }

  async getMatchHistory(): Promise<SkillMatchingResult[]> {
    try {
      return await requestJson<SkillMatchingResult[]>(API_ENDPOINTS.skillMatching.history, {
        method: 'GET',
        timeoutMs: 10000,
      });
    } catch (err) {
      console.warn('Failed to fetch skill match history:', err);
      return [];
    }
  }
}

export const skillMatchingApiService = new SkillMatchingApiService();

