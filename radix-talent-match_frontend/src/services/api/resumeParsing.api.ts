import { IResumeParsingService, ParseResumeInput } from '../interfaces';
import { ParsedResumeOutput } from '../../types/radix';
import { API_ENDPOINTS } from './config';
import { requestJson, postMultipart } from './client';

export class ResumeParsingApiService implements IResumeParsingService {
  /**
   * Retrieves all real, user-parsed candidate resumes stored in the database.
   * Returns empty array if none have been uploaded/saved yet.
   */
  async getSampleResumes(): Promise<ParsedResumeOutput[]> {
    try {
      const res = await requestJson<ParsedResumeOutput[]>(API_ENDPOINTS.resumeParsing.samples, {
        timeoutMs: 4000,
      });
      if (Array.isArray(res)) return res;
      return [];
    } catch (err) {
      console.warn('[ResumeParsingApiService] Live getSampleResumes failed:', err);
      return [];
    }
  }

  async getResume(id: string): Promise<ParsedResumeOutput> {
    return await requestJson<ParsedResumeOutput>(`${API_ENDPOINTS.resumeParsing.base}/resume-parsing/${id}`, {
      timeoutMs: 5000,
    });
  }

  async deleteResume(id: string): Promise<boolean> {
    try {
      await requestJson<{ status: string }>(`${API_ENDPOINTS.resumeParsing.base}/resume-parsing/${id}`, {
        method: 'DELETE',
        timeoutMs: 5000,
      });
      return true;
    } catch (err) {
      console.warn(`[ResumeParsingApiService] Failed to delete resume ${id}:`, err);
      return false;
    }
  }

  async parseResume(input: ParseResumeInput): Promise<ParsedResumeOutput> {
    const formData = new FormData();
    if (input.file) {
      formData.append('file', input.file);
    }
    if (input.sampleCandidateId) {
      formData.append('sample_candidate_id', input.sampleCandidateId);
    }

    return await postMultipart<ParsedResumeOutput>(API_ENDPOINTS.resumeParsing.extract, formData, {
      timeoutMs: 45000,
    });
  }
}

export const resumeParsingApiService = new ResumeParsingApiService();

