import { ITalentCheckService, CompanyExpectationProfile } from '../interfaces';
import { CandidateProfile, TalentCheckResult } from '../../types/radix';
import { API_ENDPOINTS } from './config';
import { requestJson } from './client';

export class TalentCheckApiService implements ITalentCheckService {
  async getCompanies(): Promise<CompanyExpectationProfile[]> {
    try {
      const res = await requestJson<any[]>(API_ENDPOINTS.talentCheck.companies, {
        timeoutMs: 8000,
      });
      if (Array.isArray(res) && res.length > 0) {
        return res.map((c) => ({
          company: c.company_name,
          shortName: c.short_name || c.company_name.split(' ')[0],
          tierDescriptor: c.tier_descriptor || 'Enterprise Benchmark Tier',
          headquarters: c.headquarters || 'India Operations',
          evaluationSummary: c.evaluation_summary || `Evaluation criteria and competency bar for ${c.company_name}.`,
          readinessThreshold: c.readiness_threshold || 80,
          expectedLevels: c.expected_skills,
        }));
      }
      return [];
    } catch (err) {
      console.warn('[TalentCheckApiService] Live getCompanies failed:', err);
      throw err;
    }
  }

  async runTalentCheck(profile: CandidateProfile, companyName: string): Promise<TalentCheckResult> {
    const payload = {
      company: companyName,
      profile: {
        id: profile.id,
        candidate_id: profile.id,
        name: profile.name,
        skills: profile.skills.map((s) => ({
          skill_name: s.skill_name,
          category_code: s.category_code,
          level: s.proficiency_level || 6.0,
          proficiency_level: s.proficiency_level || 6.0,
        })),
      },
    };

    const res = await requestJson<any>(API_ENDPOINTS.talentCheck.evaluate, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeoutMs: 20000,
    });

    return {
      id: `tc-${Date.now()}`,
      candidate_name: profile.name,
      company: res.company || companyName,
      readiness_score: Math.round(res.readiness_score),
      readiness_status: res.readiness_status || (res.readiness_score >= 80 ? 'READY' : res.readiness_score >= 65 ? 'UPSKILLING_RECOMMENDED' : 'NEEDS_PREPARATION'),
      readiness_label: res.readiness_label || (res.readiness_score >= 80 ? 'Ready for Target Role' : res.readiness_score >= 65 ? 'Upskilling Recommended' : 'Needs Focused Preparation'),
      threshold: res.threshold || 80,
      met_categories_count: res.met_categories_count ?? (res.skillset_gap || []).filter((g: any) => !g.gap).length,
      gap_categories_count: res.gap_categories_count ?? (res.skillset_gap || []).filter((g: any) => g.gap).length,
      summary: res.summary,
      source: res.source,
      skillset_gap: (res.skillset_gap || []).map((g: any) => ({
        category_code: g.category_code,
        category_name: g.category_name,
        required_level: g.required_level,
        candidate_level: g.candidate_level,
        gap: Boolean(g.gap),
        gap_amount: g.gap_amount,
        meets_bar: Boolean(g.meets_bar),
      })),
      evaluated_at: res.evaluated_at || new Date().toISOString(),
    };
  }
}

export const talentCheckApiService = new TalentCheckApiService();

