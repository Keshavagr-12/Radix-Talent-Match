import { CandidateProfile, ParsedResumeOutput } from '../types/radix';

export function parsedResumeToCandidateProfile(parsed: ParsedResumeOutput): CandidateProfile {
  return {
    id: parsed.id || `prof-${Date.now()}`,
    name: parsed.candidate_name || '',
    email: parsed.candidate_email || '',
    phone: parsed.phone || '',
    location: parsed.location || '',
    headline: parsed.role || '',
    summary: parsed.summary || parsed.fit_summary || '',
    bio: parsed.summary || parsed.fit_summary || '',
    education: (parsed.education || []).map((e, idx) => ({
      id: e.id || `edu-${idx}`,
      institution: e.institution || 'University',
      degree: e.degree || 'Degree',
      field_of_study: e.field_of_study || '',
      graduation_year: e.graduation_year ? String(e.graduation_year) : '',
      score_or_gpa: e.score_or_gpa || '',
    })),
    skills: (parsed.skills || []).map((s) => ({
      skill_name: s.skill_name || s.name || '',
      category_code: s.category_code || 'OTHER',
      evidence: s.evidence || 'Extracted from resume',
      confidence: s.confidence || 'high',
      proficiency_level: s.proficiency_level || 7.0,
      level: s.proficiency_level || 7.0,
    })),
    projects: (parsed.projects || []).map((p, idx) => ({
      id: p.id || `proj-${idx}`,
      title: p.title || 'Project',
      description: p.description || '',
      technologies: p.technologies || [],
    })),
    internships: (parsed.internships || []).map((i, idx) => ({
      id: i.id || `int-${idx}`,
      company: i.company || 'Company',
      role: i.role || 'Intern',
      duration: i.duration || '',
      description: i.description || '',
      technologies: i.technologies || [],
    })),
    hackathons: (parsed.hackathons || []).map((h, idx) => ({
      id: h.id || `hack-${idx}`,
      name: h.name || 'Hackathon',
      organizer: h.organizer || '',
      year: h.year || '',
      achievement: h.achievement || '',
      project_summary: h.project_summary || '',
    })),
    certifications: (parsed.certifications || []).map((c, idx) => ({
      id: c.id || `cert-${idx}`,
      name: c.name || 'Certification',
      issuer: c.issuer || '',
      year: c.year || '',
    })),
    preferred_roles: parsed.preferred_roles || [],
    completeness_score: 0,
    updated_at: new Date().toISOString(),
  };
}
