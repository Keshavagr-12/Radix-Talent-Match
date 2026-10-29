import {
  ExtractedSkillList,
  ParsedResumeOutput,
  CandidateProfile,
  TalentCheckResult,
  SkillMatchingResult,
  Skill,
  RadixCategoryCode,
  UserSession,
} from '../../types/radix';
import {
  SAMPLE_JOB_DESCRIPTIONS,
  SAMPLE_PARSED_RESUMES,
  COMPANY_SKILLSET_SNAPSHOT,
  INITIAL_CANDIDATE_PROFILES,
  CompanyExpectationProfile,
} from '../../data/mockDataset';
import { RADIX_TWELVE_CATEGORIES } from '../../data/radixCategories';
import {
  IAuthService,
  IJDAnalyticsService,
  IResumeParsingService,
  IProfileService,
  ITalentCheckService,
  ISkillMatchingService,
  LoginPayload,
  SignupPayload,
  AuthProviderType,
  AnalyzeJDInput,
  ParseResumeInput,
} from '../interfaces';

const SESSION_STORAGE_KEY = 'radix_tm_session_v1';
const PROFILES_STORAGE_KEY = 'radix_tm_profiles_v1';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function safeReadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors in restricted environments
  }
}

/**
 * AUTH SERVICE
 * Stores session metadata locally and supports email/password and OAuth provider sign-in.
 */
export class MockAuthService implements IAuthService {
  getCurrentSession(): UserSession | null {
    return safeReadStorage<UserSession | null>(SESSION_STORAGE_KEY, null);
  }

  async login(payload: LoginPayload): Promise<UserSession> {
    await delay(350);
    const candidateId = payload.candidateId || 'cand-ananya';
    const sample = SAMPLE_PARSED_RESUMES.find((c) => c.id === candidateId) || SAMPLE_PARSED_RESUMES[0];

    const session: UserSession = {
      id: `usr-${Date.now()}`,
      name: payload.email.includes('@') && !payload.candidateId
        ? payload.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
        : sample.candidate_name,
      email: payload.email || sample.candidate_email,
      selectedCandidateId: sample.id!,
      createdAt: new Date().toISOString(),
    };
    safeWriteStorage(SESSION_STORAGE_KEY, session);
    return session;
  }

  async signup(payload: SignupPayload): Promise<UserSession> {
    await delay(400);
    const candidateId = payload.candidateId || 'cand-ananya';
    const session: UserSession = {
      id: `usr-${Date.now()}`,
      name: payload.name.trim(),
      email: payload.email.trim(),
      selectedCandidateId: candidateId,
      createdAt: new Date().toISOString(),
    };
    safeWriteStorage(SESSION_STORAGE_KEY, session);
    return session;
  }

  async loginWithProvider(provider: AuthProviderType): Promise<UserSession> {
    await delay(450);
    const sample = SAMPLE_PARSED_RESUMES[0];
    const providerProfiles: Record<AuthProviderType, { name: string; email: string }> = {
      github: { name: sample.candidate_name, email: 'ananya.rao@github-user.dev' },
      google: { name: sample.candidate_name, email: 'ananya.rao@gmail.com' },
      linkedin: { name: sample.candidate_name, email: 'ananya.rao@linkedin-member.com' },
    };
    const selected = providerProfiles[provider];
    const session: UserSession = {
      id: `usr-${provider}-${Date.now()}`,
      name: selected.name,
      email: selected.email,
      selectedCandidateId: sample.id!,
      createdAt: new Date().toISOString(),
    };
    safeWriteStorage(SESSION_STORAGE_KEY, session);
    return session;
  }

  async logout(): Promise<void> {
    await delay(150);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('radix_tm_active_jd_session_v1');
      localStorage.removeItem('radix_tm_active_resume_session_v1');
      localStorage.removeItem('radix_tm_active_talent_check_session_v1');
      localStorage.removeItem('radix_tm_active_skill_match_session_v1');
    } catch {
      // Ignore
    }
  }

  async switchDemoCandidate(candidateId: string): Promise<UserSession> {
    const sample = SAMPLE_PARSED_RESUMES.find((c) => c.id === candidateId) || SAMPLE_PARSED_RESUMES[0];
    const current = this.getCurrentSession();
    const updated: UserSession = {
      id: current?.id || `usr-${Date.now()}`,
      name: sample.candidate_name,
      email: sample.candidate_email,
      selectedCandidateId: sample.id!,
      createdAt: current?.createdAt || new Date().toISOString(),
    };
    safeWriteStorage(SESSION_STORAGE_KEY, updated);
    return updated;
  }
}

/**
 * ROLE 1: MOCK JD ANALYTICS SERVICE
 * Produces deterministic, realistic ExtractedSkillList results from sample JDs or uploaded PDF/DOCX files.
 */
export class MockJDAnalyticsService implements IJDAnalyticsService {
  async getSampleJDs(): Promise<ExtractedSkillList[]> {
    return SAMPLE_JOB_DESCRIPTIONS;
  }

  async analyzeJD(input: AnalyzeJDInput): Promise<ExtractedSkillList> {
    await delay(650);

    const rawText = input.rawText?.trim() || '';
    const fileName = input.file?.name || (rawText ? 'Converted_Job_Description.pdf' : 'Job_Description.pdf');

    // If raw text is provided, dynamically extract matching skills & evidence from the text
    if (rawText.length > 0) {
      const lowerText = rawText.toLowerCase();
      const sentences = rawText
        .split(/(?<=[.!?])\s+|\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 12);

      const findEvidence = (keywords: string[], fallback: string): string => {
        const match = sentences.find((s) =>
          keywords.some((kw) => s.toLowerCase().includes(kw))
        );
        return match ? match.slice(0, 180) : fallback;
      };

      const extractedSkills: Skill[] = [];
      const detectedTech: string[] = [];

      const skillCatalog: Array<{
        skill_name: string;
        category_code: RadixCategoryCode;
        keywords: string[];
        techLabel?: string;
      }> = [
        {
          skill_name: 'Software Development & Programming',
          category_code: 'COD',
          keywords: ['python', 'java', 'c++', 'typescript', 'javascript', 'golang', 'go', 'c#', 'rust', 'coding', 'programming'],
          techLabel: 'Python / Java / TypeScript',
        },
        {
          skill_name: 'Data Structures & Algorithmic Problem Solving',
          category_code: 'DSA',
          keywords: ['data structures', 'algorithm', 'dsa', 'complexity', 'graph', 'trees', 'optimization'],
          techLabel: 'Algorithms & Data Structures',
        },
        {
          skill_name: 'System Design & Scalable Architecture',
          category_code: 'SYSD',
          keywords: ['system design', 'distributed', 'microservices', 'scalability', 'high availability', 'architecture', 'caching', 'kafka'],
          techLabel: 'Distributed Systems & Microservices',
        },
        {
          skill_name: 'Object-Oriented Design & Modularity',
          category_code: 'OOD',
          keywords: ['object-oriented', 'oop', 'ood', 'design patterns', 'solid', 'modular', 'class design'],
          techLabel: 'OOP & Design Patterns',
        },
        {
          skill_name: 'SQL & Relational Database Engineering',
          category_code: 'SQL',
          keywords: ['sql', 'postgresql', 'mysql', 'oracle', 'database', 'pl/sql', 'query', 'indexing', 'snowflake'],
          techLabel: 'SQL / PostgreSQL / Relational DB',
        },
        {
          skill_name: 'Cloud Infrastructure & DevOps',
          category_code: 'CLOUD',
          keywords: ['aws', 'gcp', 'azure', 'cloud', 'kubernetes', 'docker', 'terraform', 'ci/cd', 'serverless'],
          techLabel: 'Cloud (AWS / GCP / Azure) & Containers',
        },
        {
          skill_name: 'Artificial Intelligence & Machine Learning',
          category_code: 'AI',
          keywords: ['machine learning', 'ai', 'deep learning', 'llm', 'nlp', 'pytorch', 'tensorflow', 'genai', 'model'],
          techLabel: 'Machine Learning / AI',
        },
        {
          skill_name: 'Software Engineering Practices & Testing',
          category_code: 'SWE',
          keywords: ['git', 'agile', 'unit test', 'code review', 'ci/cd', 'rest api', 'graphql', 'sdlc', 'testing', 'engineering'],
          techLabel: 'REST APIs / Git / Testing',
        },
        {
          skill_name: 'Operating Systems & Linux Environment',
          category_code: 'OS',
          keywords: ['linux', 'unix', 'operating system', 'shell', 'bash', 'concurrency', 'multithreading', 'memory'],
          techLabel: 'Linux / OS Internals',
        },
        {
          skill_name: 'Networking & API Protocols',
          category_code: 'NETW',
          keywords: ['http', 'tcp/ip', 'dns', 'networking', 'grpc', 'load balancing', 'tls', 'security', 'api gateway'],
          techLabel: 'HTTP / TCP/IP / gRPC',
        },
        {
          skill_name: 'Quantitative Aptitude & Analytical Thinking',
          category_code: 'APTI',
          keywords: ['analytical', 'quantitative', 'statistics', 'metrics', 'problem-solving', 'problem solving', 'data analysis'],
          techLabel: 'Analytical & Quantitative Reasoning',
        },
        {
          skill_name: 'Cross-Functional Technical Communication',
          category_code: 'COMM',
          keywords: ['communication', 'stakeholder', 'collaborate', 'documentation', 'cross-functional', 'mentoring', 'team'],
          techLabel: 'Stakeholder Collaboration & Docs',
        },
      ];

      for (const item of skillCatalog) {
        const hitCount = item.keywords.filter((kw) => lowerText.includes(kw)).length;
        if (hitCount > 0) {
          extractedSkills.push({
            skill_name: item.skill_name,
            category_code: item.category_code,
            confidence: hitCount >= 2 ? 'high' : 'medium',
            evidence: findEvidence(
              item.keywords,
              `Detected requirement matching ${item.skill_name} in submitted job description.`
            ),
          });
          if (item.techLabel) detectedTech.push(item.techLabel);
        }
      }

      // Ensure at least a core set of skills is returned if text was very brief
      if (extractedSkills.length === 0) {
        extractedSkills.push(
          {
            skill_name: 'Software Engineering & Problem Solving',
            category_code: 'SWE',
            confidence: 'high',
            evidence: sentences[0] || rawText.slice(0, 140),
          },
          {
            skill_name: 'Programming & Implementation',
            category_code: 'COD',
            confidence: 'medium',
            evidence: sentences[1] || rawText.slice(0, 140),
          },
          {
            skill_name: 'Technical Communication & Collaboration',
            category_code: 'COMM',
            confidence: 'medium',
            evidence: 'Collaborate effectively across engineering and product teams.',
          }
        );
      }

      const firstLine = rawText.split('\n').map((l) => l.trim()).find(Boolean) || 'Target Engineering Role';
      const inferredRole = input.roleOverride?.trim() || (firstLine.length <= 64 ? firstLine : 'Software & Technical Role');
      const inferredCompany = input.companyOverride?.trim() || 'Target Organization';

      return {
        id: `jd-text-${Date.now()}`,
        source_type: 'jd',
        source_file: fileName,
        company: inferredCompany,
        role: inferredRole,
        location: 'Flexible / Hybrid',
        summary: rawText.slice(0, 220) + (rawText.length > 220 ? '...' : ''),
        required_technologies: detectedTech.length > 0 ? detectedTech : ['Software Engineering', 'Core Technical Stack'],
        skills: extractedSkills,
        analyzed_at: new Date().toISOString(),
      };
    }

    // If a known sample ID was selected, return that sample with optional metadata overrides
    if (input.sampleId) {
      const found = SAMPLE_JOB_DESCRIPTIONS.find((j) => j.id === input.sampleId);
      if (found) {
        return {
          ...found,
          company: input.companyOverride?.trim() || found.company,
          role: input.roleOverride?.trim() || found.role,
          source_file: input.file ? input.file.name : found.source_file,
          analyzed_at: new Date().toISOString(),
        };
      }
    }

    // If a custom file was uploaded, deterministically map filename keywords to the closest JD template
    const lower = `${fileName} ${input.companyOverride || ''} ${input.roleOverride || ''}`.toLowerCase();

    let template = SAMPLE_JOB_DESCRIPTIONS[0];
    if (lower.includes('data') && lower.includes('scientist')) {
      template = SAMPLE_JOB_DESCRIPTIONS[1];
    } else if (lower.includes('analyst') && lower.includes('support')) {
      template = SAMPLE_JOB_DESCRIPTIONS[5];
    } else if (lower.includes('analyst') || lower.includes('bi') || lower.includes('power')) {
      template = SAMPLE_JOB_DESCRIPTIONS[3];
    } else if (lower.includes('oracle') || lower.includes('associate') || lower.includes('banking')) {
      template = SAMPLE_JOB_DESCRIPTIONS[4];
    } else if (lower.includes('microsoft') || lower.includes('azure') || lower.includes('c#')) {
      template = SAMPLE_JOB_DESCRIPTIONS[2];
    }

    return {
      ...template,
      id: `jd-custom-${Date.now()}`,
      source_file: fileName,
      company: input.companyOverride?.trim() || template.company,
      role: input.roleOverride?.trim() || template.role,
      analyzed_at: new Date().toISOString(),
    };
  }
}

/**
 * ROLE 2: MOCK RESUME PARSING SERVICE
 * Extracts structured skills, education, projects, and experience from sample candidates or uploaded files.
 */
export class MockResumeParsingService implements IResumeParsingService {
  async getSampleResumes(): Promise<ParsedResumeOutput[]> {
    return SAMPLE_PARSED_RESUMES;
  }

  async parseResume(input: ParseResumeInput): Promise<ParsedResumeOutput> {
    await delay(650);

    if (input.sampleCandidateId) {
      const found = SAMPLE_PARSED_RESUMES.find((r) => r.id === input.sampleCandidateId);
      if (found) {
        return {
          ...found,
          source_file: input.file ? input.file.name : found.source_file,
          analyzed_at: new Date().toISOString(),
        };
      }
    }

    const fileName = input.file?.name || 'Uploaded_Resume.pdf';
    const lower = fileName.toLowerCase();
    let matched = SAMPLE_PARSED_RESUMES[0];
    if (lower.includes('karthik') || lower.includes('data')) {
      matched = SAMPLE_PARSED_RESUMES[1];
    } else if (lower.includes('priya') || lower.includes('support') || lower.includes('oracle')) {
      matched = SAMPLE_PARSED_RESUMES[2];
    } else if (lower.includes('rohan') || lower.includes('verma')) {
      matched = SAMPLE_PARSED_RESUMES[3];
    }

    return {
      ...matched,
      source_file: fileName,
      analyzed_at: new Date().toISOString(),
    };
  }
}

/**
 * ROLE 3: MOCK PROFILE BUILDER SERVICE
 * Persists candidate profiles in localStorage and computes profile completeness.
 */
export class MockProfileService implements IProfileService {
  private getAllProfiles(): Record<string, CandidateProfile> {
    const stored = safeReadStorage<Record<string, CandidateProfile>>(PROFILES_STORAGE_KEY, {});
    return {
      ...INITIAL_CANDIDATE_PROFILES,
      ...stored,
    };
  }

  async getProfile(candidateId: string): Promise<CandidateProfile> {
    const all = this.getAllProfiles();
    return all[candidateId] || all['cand-ananya'];
  }

  async saveProfile(
    candidateId: string,
    profile: CandidateProfile,
    isDraft = false
  ): Promise<CandidateProfile> {
    await delay(250);
    const all = this.getAllProfiles();
    const updated: CandidateProfile = {
      ...profile,
      id: candidateId,
      is_draft: isDraft,
      updated_at: new Date().toISOString(),
    };
    all[candidateId] = updated;
    safeWriteStorage(PROFILES_STORAGE_KEY, all);
    return updated;
  }

  calculateCompleteness(profile: CandidateProfile): {
    score: number;
    missingSections: string[];
    completedSections: string[];
  } {
    const checks: Array<{ label: string; weight: number; valid: boolean }> = [
      {
        label: 'Basic Details (Name & Email)',
        weight: 15,
        valid: Boolean(profile.name?.trim() && profile.email?.trim()),
      },
      {
        label: 'Education History',
        weight: 15,
        valid: Array.isArray(profile.education) && profile.education.length > 0,
      },
      {
        label: 'Technical Skills (at least 5)',
        weight: 25,
        valid: Array.isArray(profile.skills) && profile.skills.length >= 5,
      },
      {
        label: 'Projects or Internships',
        weight: 20,
        valid:
          (Array.isArray(profile.internships) && profile.internships.length > 0) ||
          (Array.isArray(profile.projects) && profile.projects.length > 0),
      },
      {
        label: 'Hackathons or Certifications',
        weight: 10,
        valid:
          (Array.isArray(profile.hackathons) && profile.hackathons.length > 0) ||
          (Array.isArray(profile.certifications) && profile.certifications.length > 0),
      },
      {
        label: 'Preferred Roles',
        weight: 10,
        valid: Array.isArray(profile.preferred_roles) && profile.preferred_roles.length > 0,
      },
      {
        label: 'CV File Reference',
        weight: 5,
        valid: Boolean(profile.cv_file?.trim()),
      },
    ];

    let score = 0;
    const missingSections: string[] = [];
    const completedSections: string[] = [];

    for (const check of checks) {
      if (check.valid) {
        score += check.weight;
        completedSections.push(check.label);
      } else {
        missingSections.push(check.label);
      }
    }

    return { score, missingSections, completedSections };
  }
}

/**
 * ROLE 4: MOCK TALENT CHECK SERVICE
 * Deterministically evaluates a CandidateProfile against a selected company's 12 RADIX skillset expectations.
 *
 * Scoring methodology:
 * - For each of the 12 RADIX categories, computes candidate_level (1-10) from the candidate's
 *   saved skills in that category (using explicit `proficiency_level` if present, or confidence mapping:
 *   high = 8, medium = 6, low = 4, plus bonus for multiple evidences/projects/internships).
 * - Compares `candidate_level` vs `required_level`. `gap = candidate_level < required_level`.
 * - Overall `readiness_score` (0-100) is weighted by the company's `required_level` for each category:
 *   ratio = min(1, candidate_level / required_level) weighted by required_level.
 */
export class MockTalentCheckService implements ITalentCheckService {
  async getCompanies(): Promise<CompanyExpectationProfile[]> {
    return COMPANY_SKILLSET_SNAPSHOT;
  }

  async runTalentCheck(profile: CandidateProfile, companyName: string): Promise<TalentCheckResult> {
    await delay(500);

    const companySpec =
      COMPANY_SKILLSET_SNAPSHOT.find(
        (c) => c.company.toLowerCase() === companyName.toLowerCase() || c.shortName.toLowerCase() === companyName.toLowerCase()
      ) || COMPANY_SKILLSET_SNAPSHOT[0];

    let weightedEarned = 0;
    let totalWeight = 0;

    const skillset_gap = RADIX_TWELVE_CATEGORIES.map((cat) => {
      const code = cat.code as Exclude<RadixCategoryCode, 'OTHER'>;
      const required_level = companySpec.expectedLevels[code] ?? 7;

      const matchingSkills = profile.skills.filter((s) => s.category_code === code);
      let candidate_level = 2; // Baseline awareness if category not listed on profile

      if (matchingSkills.length > 0) {
        const levels = matchingSkills.map((s) => {
          if (typeof s.proficiency_level === 'number') {
            return Math.min(10, Math.max(1, s.proficiency_level));
          }
          if (s.confidence === 'high') return 8;
          if (s.confidence === 'medium') return 6;
          return 4;
        });
        const maxSkillLevel = Math.max(...levels);
        const multiSkillBonus = matchingSkills.length > 1 ? 1 : 0;
        candidate_level = Math.min(10, maxSkillLevel + multiSkillBonus);
      }

      const gap = candidate_level < required_level;
      const categoryAchievement = Math.min(1.05, candidate_level / required_level);
      weightedEarned += categoryAchievement * required_level;
      totalWeight += required_level;

      return {
        category_code: code as RadixCategoryCode,
        required_level,
        candidate_level,
        gap,
      };
    });

    const readiness_score = Math.min(100, Math.max(0, Math.round((weightedEarned / totalWeight) * 100)));

    return {
      id: `tc-${Date.now()}`,
      candidate_name: profile.name,
      company: companySpec.company,
      skillset_gap,
      readiness_score,
      evaluated_at: new Date().toISOString(),
    };
  }
}

/**
 * ROLE 5: MOCK SKILL MATCHING SERVICE
 * Compares a CandidateProfile against a specific ExtractedSkillList (JD) using deterministic
 * token + category + proficiency fuzzy matching.
 */
export class MockSkillMatchingService implements ISkillMatchingService {
  async runSkillMatching(
    profile: CandidateProfile,
    jd: ExtractedSkillList
  ): Promise<SkillMatchingResult> {
    await delay(550);

    const matched_skills: Skill[] = [];
    const missing_skills: Skill[] = [];
    const partial_skills: NonNullable<SkillMatchingResult['partial_skills']> = [];

    const stopWords = new Set([
      'and',
      'or',
      'the',
      'in',
      'for',
      'with',
      'to',
      'of',
      'basic',
      'basics',
      'core',
      'advanced',
      'production',
    ]);

    const tokenize = (text: string): string[] =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9+#/]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1 && !stopWords.has(w));

    let earnedPoints = 0;
    const totalPoints = jd.skills.length * 10;

    for (const jdSkill of jd.skills) {
      const jdTokens = tokenize(`${jdSkill.skill_name} ${jdSkill.evidence}`);
      const sameCategorySkills = profile.skills.filter(
        (cs) => cs.category_code === jdSkill.category_code
      );

      let bestCandidateSkill: Skill | null = null;
      let bestStrength: 'strong' | 'partial' | 'none' = 'none';
      let note = '';

      for (const candSkill of profile.skills) {
        const candTokens = tokenize(`${candSkill.skill_name} ${candSkill.evidence}`);
        const overlap = jdTokens.filter((t) => candTokens.includes(t));
        const candLevel =
          candSkill.proficiency_level ??
          (candSkill.confidence === 'high' ? 8 : candSkill.confidence === 'medium' ? 6 : 4);

        const sameCat = candSkill.category_code === jdSkill.category_code;

        if (sameCat && candLevel >= 7 && (overlap.length >= 1 || candSkill.confidence === 'high')) {
          bestCandidateSkill = candSkill;
          bestStrength = 'strong';
          note = `Strong alignment via ${candSkill.skill_name} (${candSkill.category_code}, Level ${candLevel}/10).`;
          break;
        } else if (sameCat && candLevel >= 5) {
          bestCandidateSkill = candSkill;
          bestStrength = 'partial';
          note = `Adjacent category match (${candSkill.skill_name}, Level ${candLevel}/10) — deepen specific JD tooling.`;
        } else if (overlap.length >= 2 && bestStrength === 'none') {
          bestCandidateSkill = candSkill;
          bestStrength = 'partial';
          note = `Shared technology keywords (${overlap.slice(0, 3).join(', ')}) found in ${candSkill.skill_name}.`;
        }
      }

      // Check if candidate has strong same-category skill even if token phrasing differs
      if (bestStrength === 'none' && sameCategorySkills.length > 0) {
        const topCatSkill = sameCategorySkills[0];
        const level =
          topCatSkill.proficiency_level ??
          (topCatSkill.confidence === 'high' ? 8 : topCatSkill.confidence === 'medium' ? 6 : 4);
        if (level >= 7) {
          bestCandidateSkill = topCatSkill;
          bestStrength = 'strong';
          note = `Demonstrated strong ${jdSkill.category_code} competency via ${topCatSkill.skill_name}.`;
        } else if (level >= 5) {
          bestCandidateSkill = topCatSkill;
          bestStrength = 'partial';
          note = `Foundational ${jdSkill.category_code} background (${topCatSkill.skill_name}), but below target depth.`;
        }
      }

      if (bestStrength === 'strong' && bestCandidateSkill) {
        matched_skills.push({
          ...jdSkill,
          evidence: `${jdSkill.evidence} — Matched by candidate: ${bestCandidateSkill.skill_name}`,
        });
        earnedPoints += 10;
      } else if (bestStrength === 'partial' && bestCandidateSkill) {
        matched_skills.push({
          ...jdSkill,
          confidence: 'medium',
          evidence: `${jdSkill.evidence} — Partial/Adjacent match: ${bestCandidateSkill.skill_name}`,
        });
        partial_skills.push({
          jd_skill: jdSkill,
          candidate_skill: bestCandidateSkill,
          similarity_note: note,
        });
        earnedPoints += 5.5;
      } else {
        missing_skills.push(jdSkill);
      }
    }

    const match_score =
      totalPoints > 0 ? Math.min(100, Math.max(0, Math.round((earnedPoints / totalPoints) * 100))) : 0;

    return {
      id: `sm-${Date.now()}`,
      candidate_name: profile.name,
      company: jd.company,
      role: jd.role,
      jd_source_file: jd.source_file,
      match_score,
      matched_skills,
      missing_skills,
      partial_skills,
      evaluated_at: new Date().toISOString(),
    };
  }
}

import {
  IntegratedJDAnalyticsService,
  IntegratedResumeParsingService,
  IntegratedProfileService,
  IntegratedTalentCheckService,
  IntegratedSkillMatchingService,
} from '../api/integratedServices';

export const authService: IAuthService = new MockAuthService();
export const jdAnalyticsService: IJDAnalyticsService = new IntegratedJDAnalyticsService();
export const resumeParsingService: IResumeParsingService = new IntegratedResumeParsingService();
export const profileService: IProfileService = new IntegratedProfileService();
export const talentCheckService: ITalentCheckService = new IntegratedTalentCheckService();
export const skillMatchingService: ISkillMatchingService = new IntegratedSkillMatchingService();
