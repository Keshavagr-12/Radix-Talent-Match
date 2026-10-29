import { IJDAnalyticsService, AnalyzeJDInput } from '../interfaces';
import { ExtractedSkillList } from '../../types/radix';
import { API_ENDPOINTS } from './config';
import { requestJson, postMultipart } from './client';

export class JDApiService implements IJDAnalyticsService {
  /**
   * Retrieves all real analyzed job descriptions from persistent storage.
   * No artificial sample data: returns an empty array if none have been uploaded yet.
   */
  async getSampleJDs(): Promise<ExtractedSkillList[]> {
    try {
      const res = await requestJson<ExtractedSkillList[]>(API_ENDPOINTS.jdAnalytics.list, {
        timeoutMs: 5000,
      });
      if (Array.isArray(res)) return res;
    } catch (err) {
      console.warn('[JDApiService] Live getSampleJDs / list query failed:', err);
    }
    return [];
  }

  /**
   * Retrieves a specific analyzed job description by its unique ID.
   */
  async getJD(id: string): Promise<ExtractedSkillList> {
    const url = `${API_ENDPOINTS.jdAnalytics.base}/jd-analytics/${encodeURIComponent(id)}`;
    return await requestJson<ExtractedSkillList>(url, { timeoutMs: 5000 });
  }

  /**
   * Deletes an analyzed job description by its ID.
   */
  async deleteJD(id: string): Promise<boolean> {
    const url = `${API_ENDPOINTS.jdAnalytics.base}/jd-analytics/${encodeURIComponent(id)}`;
    try {
      await requestJson<{ status: string; id: string }>(url, {
        method: 'DELETE',
        timeoutMs: 5000,
      });
      return true;
    } catch (err) {
      console.warn('[JDApiService] Failed to delete JD:', err);
      return false;
    }
  }

  /**
   * Analyzes an uploaded job description across multiple formats (PDF, Word DOCX/DOC, TXT, MD)
   * or direct text input and stores it persistently.
   */
  async analyzeJD(input: AnalyzeJDInput): Promise<ExtractedSkillList> {
    if (input.sampleId) {
      const existing = await this.getJD(input.sampleId);
      if (existing) return existing;
    }

    const formData = new FormData();
    // Attach file if present with actual content bytes
    if (input.file && input.file.size > 0) {
      formData.append('file', input.file);
    }
    if (input.rawText && input.rawText.trim()) {
      formData.append('raw_text', input.rawText.trim());
    }
    if (input.companyOverride && input.companyOverride.trim()) {
      formData.append('company', input.companyOverride.trim());
    }
    if (input.roleOverride && input.roleOverride.trim()) {
      formData.append('role', input.roleOverride.trim());
    }

    const result = await postMultipart<ExtractedSkillList>(API_ENDPOINTS.jdAnalytics.extract, formData, {
      timeoutMs: 60000,
    });

    if (!result.id) {
      result.id = `jd-${Date.now().toString(36)}`;
    }
    if (!result.skills) {
      result.skills = [];
    }

    return result;
  }
}

export const jdApiService = new JDApiService();

