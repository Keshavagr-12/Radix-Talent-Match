import { IProfileService } from '../interfaces';
import { CandidateProfile } from '../../types/radix';
import { API_ENDPOINTS } from './config';
import { requestJson } from './client';

export class ProfileBuilderApiService implements IProfileService {
  async getProfile(candidateId: string): Promise<CandidateProfile> {
    try {
      const res = await requestJson<any>(`${API_ENDPOINTS.profile.profiles}/${candidateId}`);
      if (res && res.profile) {
        return {
          ...res.profile,
          id: res.id || candidateId,
          updated_at: res.updated_at,
        };
      }
      return res as CandidateProfile;
    } catch (err: any) {
      console.warn(`[ProfileBuilderApiService] getProfile(${candidateId}) warning:`, err);
      throw err;
    }
  }

  async saveProfile(
    candidateId: string,
    profile: CandidateProfile,
    isDraft: boolean = false
  ): Promise<CandidateProfile> {
    const payload = {
      ...profile,
      id: candidateId || profile.id,
      is_draft: isDraft,
      updated_at: new Date().toISOString(),
    };

    try {
      // Try update first
      const res = await requestJson<any>(`${API_ENDPOINTS.profile.profiles}/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.profile || payload;
    } catch {
      // If not existing, create
      try {
        const createRes = await requestJson<any>(API_ENDPOINTS.profile.profiles, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            headline: profile.headline,
            location: profile.location,
            bio: profile.bio || profile.summary,
            education: profile.education,
            skills: profile.skills,
            projects: profile.projects || [],
            hackathons: profile.hackathons,
            internships: profile.internships,
            certifications: profile.certifications,
            preferred_roles: profile.preferred_roles,
            cv_file: profile.cv_file || 'candidate_cv.pdf',
          }),
        });
        return createRes.profile || payload;
      } catch (err) {
        console.warn('[ProfileBuilderApiService] API save failed, returning local payload:', err);
        return payload;
      }
    }
  }

  async listProfiles(): Promise<Array<{ id: string; profile: any; created_at?: string; updated_at?: string }>> {
    try {
      const res = await requestJson<any>(API_ENDPOINTS.profile.profiles);
      return Array.isArray(res) ? res : [];
    } catch (err: any) {
      console.warn('[ProfileBuilderApiService] listProfiles failed:', err);
      return [];
    }
  }

  async uploadResumeFile(file: File, profileId?: string): Promise<{ id: string; profile: any; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const endpoint = profileId
      ? `${API_ENDPOINTS.profile.profiles}/${profileId}/resume`
      : API_ENDPOINTS.profile.uploadResume;

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Upload failed: HTTP ${response.status}`);
    }
    return await response.json();
  }

  async deleteProfile(profileId: string): Promise<boolean> {
    try {
      await requestJson<any>(`${API_ENDPOINTS.profile.profiles}/${profileId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (err: any) {
      console.warn(`[ProfileBuilderApiService] deleteProfile(${profileId}) failed:`, err);
      return false;
    }
  }

  calculateCompleteness(profile: CandidateProfile): {
    score: number;
    missingSections: string[];
    completedSections: string[];
  } {
    const sections = [
      { name: 'Basic Information', done: Boolean(profile.name && profile.email) },
      { name: 'Education', done: profile.education.length > 0 },
      { name: 'Technical Skills (1-10 Proficiency)', done: profile.skills.length >= 3 },
      { name: 'Preferred Roles', done: profile.preferred_roles.length > 0 },
      { name: 'Curriculum Vitae', done: Boolean(profile.cv_file && profile.cv_file.trim()) },
      { name: 'Internships / Experience', done: profile.internships.length > 0 },
      { name: 'Hackathons / Competitions', done: profile.hackathons.length > 0 },
      { name: 'Certifications', done: profile.certifications.length > 0 },
    ];

    const completedSections = sections.filter((s) => s.done).map((s) => s.name);
    const missingSections = sections.filter((s) => !s.done).map((s) => s.name);
    const score = Math.round((completedSections.length / sections.length) * 100);

    return { score, missingSections, completedSections };
  }
}

export const profileBuilderApiService = new ProfileBuilderApiService();

