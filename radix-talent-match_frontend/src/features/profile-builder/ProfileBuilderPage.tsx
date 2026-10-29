import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  Plus,
  Trash2,
  Download,
  ShieldCheck,
  GitCompare,
  FileUp,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  Upload,
  UserCheck,
  Edit3,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PageHeader,
  Button,
  Input,
  Select,
  Progress,
  FileUpload,
  ConfirmDialog,
} from '../../components/ui/primitives';
import { useWorkspace, EMPTY_CANDIDATE_PROFILE } from '../../context/WorkspaceContext';
import { profileBuilderApiService as profileService } from '../../services/api';
import {
  CandidateProfile,
  RadixCategoryCode,
  ConfidenceLevel,
} from '../../types/radix';
import { RADIX_TWELVE_CATEGORIES, CATEGORY_LOOKUP } from '../../data/radixCategories';
import { parsedResumeToCandidateProfile } from '../../utils/profileMapper';
import { cn } from '../../utils/cn';

type SectionTab =
  | 'basic'
  | 'skills'
  | 'education'
  | 'projects'
  | 'internships'
  | 'hackathons'
  | 'certifications'
  | 'roles_cv';

const SECTION_TABS: Array<{ id: SectionTab; label: string }> = [
  { id: 'basic', label: '1. Basic Details' },
  { id: 'skills', label: '2. Skills & Proficiency' },
  { id: 'education', label: '3. Education' },
  { id: 'projects', label: '4. Projects' },
  { id: 'internships', label: '5. Internships' },
  { id: 'hackathons', label: '6. Hackathons' },
  { id: 'certifications', label: '7. Certifications' },
  { id: 'roles_cv', label: '8. Preferred Roles & CV' },
];

/**
 * Automatically computes a 1–10 skill proficiency rating based on the
 * richness, technical depth, and quantified impact of the Evidence / Project Context.
 */
function computeProficiencyFromEvidence(
  evidenceText: string,
  confidence: ConfidenceLevel
): number {
  const clean = (evidenceText || '').trim().toLowerCase();
  if (!clean) {
    return confidence === 'high' ? 6 : confidence === 'medium' ? 5 : 4;
  }

  let score = confidence === 'high' ? 6 : confidence === 'medium' ? 5 : 4;

  const advancedSignals = [
    'architect',
    'distributed',
    'production',
    'scalable',
    'microservice',
    'latency',
    'throughput',
    'optimized',
    'benchmark',
    'consensus',
    'sharding',
    'concurrent',
    'published',
    'lead',
    'mentored',
    'ci/cd',
    'kubernetes',
  ];

  const implementationSignals = [
    'built',
    'developed',
    'implemented',
    'deployed',
    'designed',
    'engineered',
    'integrated',
    'automated',
    'internship',
    'hackathon',
    'pipeline',
    'api',
    'database',
    'solved',
  ];

  const advHits = advancedSignals.filter((kw) => clean.includes(kw)).length;
  const impHits = implementationSignals.filter((kw) => clean.includes(kw)).length;
  const hasQuantifiedMetrics = /\b(\d+%|\d+x|\d+\+|\d{2,}\s*(ms|rps|users|nodes|problems|queries|services))\b/i.test(
    clean
  );

  if (advHits >= 2) score += 2;
  else if (advHits === 1) score += 1;

  if (impHits >= 2) score += 1;
  if (hasQuantifiedMetrics) score += 1;
  if (clean.split(/\s+/).length >= 12) score += 1;

  return Math.max(1, Math.min(10, score));
}

export const ProfileBuilderPage: React.FC = () => {
  const {
    activeProfile,
    saveCandidateProfile,
    latestParsedResume,
    importParsedResumeToProfile,
  } = useWorkspace();
  const navigate = useNavigate();

  const [formState, setFormState] = useState<CandidateProfile>(activeProfile);
  const [activeTab, setActiveTab] = useState<SectionTab>('basic');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);
  const [cvFileObj, setCvFileObj] = useState<File | null>(null);

  // Resume Upload State
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const resumeFileInputRef = useRef<HTMLInputElement | null>(null);

  // Database Saved Profiles State
  const [savedProfiles, setSavedProfiles] = useState<
    Array<{ id: string; profile: any; created_at?: string; updated_at?: string }>
  >([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState<boolean>(false);
  const [selectedSavedProfileId, setSelectedSavedProfileId] = useState<string>('');

  // New skill quick-add form state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<RadixCategoryCode>('COD');
  const [newSkillEvidence, setNewSkillEvidence] = useState('');
  const [newSkillConfidence, setNewSkillConfidence] = useState<ConfidenceLevel>('high');
  const [newSkillProficiency, setNewSkillProficiency] = useState<number>(7);

  // Preferred role input
  const [newRoleInput, setNewRoleInput] = useState('');

  // Load saved profiles from Supabase database on mount
  const fetchSavedProfiles = async () => {
    setIsLoadingProfiles(true);
    try {
      if (profileService.listProfiles) {
        const rows = await profileService.listProfiles();
        setSavedProfiles(rows || []);
      }
    } catch (err) {
      console.warn('Could not fetch saved profiles:', err);
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  useEffect(() => {
    fetchSavedProfiles();
  }, []);

  // Sync when activeProfile changes externally
  useEffect(() => {
    setFormState(activeProfile);
    setIsDirty(false);
  }, [activeProfile]);

  const liveCompleteness = profileService.calculateCompleteness(formState);

  const updateField = <K extends keyof CandidateProfile>(
    field: K,
    value: CandidateProfile[K]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Direct Resume File Upload & Auto-fill
  const handleResumeFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.docx'].includes(extension)) {
      toast.error('Only PDF and DOCX resume files are supported.');
      return;
    }

    setIsUploadingResume(true);
    const toastId = toast.loading(`Parsing "${file.name}" and syncing to Supabase...`);

    try {
      if (!profileService.uploadResumeFile) {
        throw new Error('Upload method not supported.');
      }

      const res = await profileService.uploadResumeFile(file);
      const extracted = res.profile || {};
      const newId = res.id || formState.id;

      // Auto-fill ALL fields from the extracted resume into formState
      const populatedProfile: CandidateProfile = {
        ...formState,
        id: newId,
        name: extracted.name || formState.name,
        email: extracted.email || formState.email,
        phone: extracted.phone || formState.phone,
        headline: extracted.headline || formState.headline,
        location: extracted.location || formState.location,
        bio: extracted.bio || extracted.summary || formState.bio,
        skills: (extracted.skills || []).map((s: any) => ({
          skill_name: s.skill_name || s.name || '',
          category_code: s.category_code || 'OTHER',
          evidence: s.evidence || 'Extracted from resume',
          confidence: s.confidence || 'medium',
          proficiency_level:
            typeof s.proficiency_level === 'number'
              ? s.proficiency_level
              : typeof s.level === 'number'
              ? s.level
              : computeProficiencyFromEvidence(s.evidence || '', s.confidence || 'medium'),
        })),
        education: (extracted.education || []).map((e: any, idx: number) => ({
          id: e.id || `edu-${Date.now()}-${idx}`,
          institution: e.institution || 'University',
          degree: e.degree || 'Degree',
          field_of_study: e.field_of_study || '',
          graduation_year: e.graduation_year ? String(e.graduation_year) : '',
          score_or_gpa: e.score_or_gpa || '',
        })),
        projects: (extracted.projects || []).map((p: any, idx: number) => ({
          id: p.id || `proj-${Date.now()}-${idx}`,
          title: p.title || 'Project',
          description: p.description || '',
          technologies: Array.isArray(p.technologies) ? p.technologies : [],
        })),
        internships: (extracted.internships || []).map((i: any, idx: number) => ({
          id: i.id || `int-${Date.now()}-${idx}`,
          company: i.company || 'Organization',
          role: i.role || 'Intern',
          duration: i.duration || '',
          description: i.description || '',
          technologies: Array.isArray(i.technologies) ? i.technologies : [],
        })),
        hackathons: (extracted.hackathons || []).map((h: any, idx: number) => ({
          id: h.id || `hack-${Date.now()}-${idx}`,
          name: h.name || 'Hackathon',
          organizer: h.organizer || '',
          year: h.year ? String(h.year) : '',
          achievement: h.achievement || '',
          project_summary: h.project_summary || '',
        })),
        certifications: (extracted.certifications || []).map((c: any, idx: number) => ({
          id: c.id || `cert-${Date.now()}-${idx}`,
          name: c.name || 'Certification',
          issuer: c.issuer || '',
          year: c.year ? String(c.year) : '',
        })),
        preferred_roles: extracted.preferred_roles || formState.preferred_roles || [],
        cv_file: extracted.cv_file || file.name,
        updated_at: new Date().toISOString(),
      };

      setFormState(populatedProfile);
      await saveCandidateProfile(populatedProfile, false);
      setIsDirty(false);
      setSelectedSavedProfileId(newId);
      await fetchSavedProfiles();

      toast.success(
        `Resume parsed & profile created! All fields auto-filled and fully editable.`,
        { id: toastId }
      );
      setActiveTab('skills');
    } catch (err: any) {
      toast.error(`Resume processing error: ${err.message || 'Failed to parse resume.'}`, {
        id: toastId,
      });
    } finally {
      setIsUploadingResume(false);
      if (resumeFileInputRef.current) {
        resumeFileInputRef.current.value = '';
      }
    }
  };

  // Load a saved profile selected from database
  const handleSelectSavedProfile = async (profileId: string) => {
    setSelectedSavedProfileId(profileId);
    if (!profileId) return;

    try {
      const selected = savedProfiles.find((p) => String(p.id) === profileId);
      let targetProfile = selected?.profile;

      if (!targetProfile) {
        targetProfile = await profileService.getProfile(profileId);
      }

      if (targetProfile) {
        const loaded: CandidateProfile = {
          ...EMPTY_CANDIDATE_PROFILE,
          ...targetProfile,
          id: profileId,
          skills: (targetProfile.skills || []).map((s: any) => ({
            skill_name: s.skill_name || s.name || '',
            category_code: s.category_code || 'OTHER',
            evidence: s.evidence || '',
            confidence: s.confidence || 'medium',
            proficiency_level:
              typeof s.proficiency_level === 'number'
                ? s.proficiency_level
                : typeof s.level === 'number'
                ? s.level
                : computeProficiencyFromEvidence(s.evidence || '', s.confidence || 'medium'),
          })),
        };
        setFormState(loaded);
        await saveCandidateProfile(loaded, false);
        setIsDirty(false);
        toast.success(`Loaded "${loaded.name || 'Candidate'}" from Supabase database.`);
      }
    } catch (err: any) {
      toast.error(`Failed to load profile: ${err.message || 'Error'}`);
    }
  };

  const handleSave = async () => {
    if (!formState.name.trim() || !formState.email.trim()) {
      toast.error('Name and Email are required in Basic Details.');
      setActiveTab('basic');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveCandidateProfile(formState, false);
      setIsDirty(false);
      toast.success('Saved candidate profile to Supabase database & local cache.');
      await fetchSavedProfiles();
      if (saved?.id) {
        setSelectedSavedProfileId(String(saved.id));
      }
    } catch (err: any) {
      toast.error(`Save failed: ${err.message || 'Error saving profile'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) {
      toast.error('Please enter a skill or technology name.');
      return;
    }

    const added = {
      skill_name: newSkillName.trim(),
      category_code: newSkillCategory,
      evidence: newSkillEvidence.trim() || 'Hands-on project experience',
      confidence: newSkillConfidence,
      proficiency_level: newSkillProficiency,
    };

    updateField('skills', [added, ...formState.skills]);
    setNewSkillName('');
    setNewSkillEvidence('');
    setNewSkillProficiency(7);
    toast.success(
      `Added "${added.skill_name}" (${added.category_code}) · Proficiency: ${added.proficiency_level}/10`
    );
  };

  const handleImportLatestResume = async () => {
    if (!latestParsedResume) {
      toast.info('No parsed resume available in Module 02. Upload a resume file above.');
      return;
    }
    const converted = parsedResumeToCandidateProfile(latestParsedResume);
    setFormState(converted);
    setIsDirty(true);
    await saveCandidateProfile(converted, false);
    await fetchSavedProfiles();
    toast.success(
      `Imported complete details from ${latestParsedResume.candidate_name}'s parsed resume!`
    );
    setActiveTab('skills');
  };

  const handleClearProfile = () => {
    setFormState(EMPTY_CANDIDATE_PROFILE);
    saveCandidateProfile(EMPTY_CANDIDATE_PROFILE, true);
    setIsDirty(false);
    setSelectedSavedProfileId('');
    toast.info('Cleared profile fields. You can enter details manually or upload a resume.');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="MODULE 03 · ROLE 3 (PROFILE BUILDER)"
        title="Comprehensive Candidate Profile Editor"
        description="Upload resumes to auto-fill all candidate details, customize fields directly to correct errors, and securely sync with the Supabase database."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {latestParsedResume && (
              <Button variant="outline" size="sm" onClick={handleImportLatestResume}>
                <Download className="w-4 h-4" />
                <span>Import from Module 02</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => resumeFileInputRef.current?.click()}
              isLoading={isUploadingResume}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Resume</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
            >
              <Save className="w-4 h-4" />
              <span>Save Profile</span>
            </Button>
          </div>
        }
      />

      {/* Hidden file input for resume upload */}
      <input
        type="file"
        ref={resumeFileInputRef}
        onChange={handleResumeFileUpload}
        accept=".pdf,.docx"
        className="hidden"
      />

      {/* Database Connection & Resume Quick-Action Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Supabase Saved Profiles Selector */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <Database className="w-4 h-4 text-emerald-500 shrink-0" />
          <div className="flex-1 max-w-sm">
            <select
              value={selectedSavedProfileId}
              onChange={(e) => handleSelectSavedProfile(e.target.value)}
              className="w-full text-xs py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">
                {isLoadingProfiles
                  ? 'Loading Supabase database profiles...'
                  : savedProfiles.length === 0
                  ? 'No saved profiles in database (Upload or enter one below)'
                  : `Select from ${savedProfiles.length} saved profile(s)...`}
              </option>
              {savedProfiles.map((p) => {
                const name = p.profile?.name || 'Unnamed Candidate';
                const email = p.profile?.email ? ` (${p.profile.email})` : '';
                return (
                  <option key={String(p.id)} value={String(p.id)}>
                    {name}
                    {email}
                  </option>
                );
              })}
            </select>
          </div>
          <button
            type="button"
            onClick={fetchSavedProfiles}
            disabled={isLoadingProfiles}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Refresh saved profiles list from database"
          >
            <RefreshCw className={cn('w-4 h-4', isLoadingProfiles && 'animate-spin')} />
          </button>
        </div>

        {/* Resume Upload Pill / Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => resumeFileInputRef.current?.click()}
            disabled={isUploadingResume}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploadingResume ? 'Parsing Resume...' : 'Upload & Auto-Fill from Resume (PDF / DOCX)'}</span>
          </button>
        </div>
      </div>

      {/* Module 02 Sync Banner if a parsed resume exists */}
      {latestParsedResume && formState.name !== latestParsedResume.candidate_name && (
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-indigo-900 dark:text-indigo-200">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              <strong>Resume parsed for {latestParsedResume.candidate_name}:</strong> Complete competencies, education ({latestParsedResume.education?.length || 0}), projects ({latestParsedResume.projects?.length || 0}), and skills ({latestParsedResume.skills?.length || 0}) are ready to import.
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleImportLatestResume}
            className="shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Import Complete Resume Data</span>
          </Button>
        </div>
      )}

      {isDirty && (
        <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              You have unsaved changes in the Profile Editor. Click Save Profile to sync all edits with the Supabase database.
            </span>
          </div>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
            Save Now
          </Button>
        </div>
      )}

      {/* Section Navigation Tabs */}
      <div className="grid grid-cols-4 gap-2.5 w-full">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-center leading-snug transition-colors cursor-pointer',
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Full-Width Active Section Editor Card */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
        {/* TAB 1: BASIC DETAILS */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Basic Candidate Details
              </h2>
              <span className="text-xs text-slate-500">
                Auto-filled from resume or editable manually
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                placeholder="e.g. John Doe"
                value={formState.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
              <Input
                label="Email Address *"
                type="email"
                placeholder="e.g. john@example.com"
                value={formState.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
              <Input
                label="Phone"
                placeholder="e.g. +1 555-0199 or +91 9876543210"
                value={formState.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
              />
              <Input
                label="Location"
                placeholder="e.g. San Francisco, CA or Bengaluru, India"
                value={formState.location || ''}
                onChange={(e) => updateField('location', e.target.value)}
              />
            </div>
            <Input
              label="Professional Headline"
              placeholder="e.g. Senior Full Stack Engineer & Cloud Architect"
              value={formState.headline || ''}
              onChange={(e) => updateField('headline', e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Candidate Summary / Fit Note
              </label>
              <textarea
                rows={3}
                placeholder="Summary of background, key achievements, or fit notes..."
                value={formState.bio || formState.summary || ''}
                onChange={(e) => {
                  updateField('bio', e.target.value);
                  updateField('summary', e.target.value);
                }}
                className="w-full p-3 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* TAB 2: SKILLS & PROFICIENCY (FULLY EDITABLE: Name, Category, Evidence, Confidence, Proficiency) */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-500" />
                  <span>Technical Skills &amp; Proficiency (Fully Editable)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Extracted resume skills can occasionally have wrong categories or levels. You can freely edit any skill name, category, evidence, and 1–10 proficiency rating below.
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/70 shrink-0">
                {formState.skills.length} Skills Tagged
              </span>
            </div>

            {/* Add New Skill Form */}
            <div className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Add New Skill to Profile
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  12 RADIX Categories + OTHER
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <Input
                    label="Skill / Technology Name"
                    placeholder="e.g. React, Kubernetes, Python"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                  />
                </div>
                <div className="md:col-span-4">
                  <Select
                    label="RADIX Category"
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value as RadixCategoryCode)}
                    options={[
                      ...RADIX_TWELVE_CATEGORIES.map((c) => ({
                        value: c.code,
                        label: `${c.code} — ${c.name}`,
                      })),
                      { value: 'OTHER', label: 'OTHER — Domain Specific' },
                    ]}
                  />
                </div>
                <div className="md:col-span-3">
                  <Select
                    label="Confidence"
                    value={newSkillConfidence}
                    onChange={(e) => setNewSkillConfidence(e.target.value as ConfidenceLevel)}
                    options={[
                      { value: 'high', label: 'High Confidence' },
                      { value: 'medium', label: 'Medium Confidence' },
                      { value: 'low', label: 'Low Confidence' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-7">
                  <Input
                    label="Evidence / Project Context"
                    placeholder="Where or how candidate demonstrated this skill"
                    value={newSkillEvidence}
                    onChange={(e) => {
                      setNewSkillEvidence(e.target.value);
                      const auto = computeProficiencyFromEvidence(e.target.value, newSkillConfidence);
                      setNewSkillProficiency(auto);
                    }}
                  />
                </div>
                <div className="md:col-span-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Proficiency:
                      </span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {newSkillProficiency} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={newSkillProficiency}
                      onChange={(e) => setNewSkillProficiency(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="w-full h-10"
                    onClick={handleAddSkill}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Skill</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* List of Skills - Each Card is Fully Editable */}
            <div className="space-y-3">
              {formState.skills.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                  <p className="text-sm text-slate-500">
                    No skills added yet. Upload a resume above or use the form above to add skills.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formState.skills.map((skill, idx) => {
                    const currentProficiency =
                      typeof skill.proficiency_level === 'number'
                        ? skill.proficiency_level
                        : computeProficiencyFromEvidence(skill.evidence, skill.confidence);

                    return (
                      <div
                        key={`${skill.skill_name}-${idx}`}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 hover:border-indigo-500/40 transition-colors space-y-3"
                      >
                        {/* Top Row: Category dropdown & Delete button */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 max-w-[200px]">
                            <select
                              value={skill.category_code}
                              onChange={(e) => {
                                const next = [...formState.skills];
                                next[idx] = {
                                  ...next[idx],
                                  category_code: e.target.value as RadixCategoryCode,
                                };
                                updateField('skills', next);
                              }}
                              className="text-xs font-mono font-semibold py-1 px-2 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 focus:outline-none"
                            >
                              {RADIX_TWELVE_CATEGORIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.code} ({c.name})
                                </option>
                              ))}
                              <option value="OTHER">OTHER (Domain Specific)</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              value={skill.confidence}
                              onChange={(e) => {
                                const next = [...formState.skills];
                                next[idx] = {
                                  ...next[idx],
                                  confidence: e.target.value as ConfidenceLevel,
                                };
                                updateField('skills', next);
                              }}
                              className="text-[10px] font-mono uppercase py-1 px-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                const next = formState.skills.filter((_, i) => i !== idx);
                                updateField('skills', next);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                              title={`Delete ${skill.skill_name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Editable Skill Name */}
                        <div>
                          <input
                            type="text"
                            value={skill.skill_name}
                            onChange={(e) => {
                              const next = [...formState.skills];
                              next[idx] = { ...next[idx], skill_name: e.target.value };
                              updateField('skills', next);
                            }}
                            className="w-full font-bold text-sm text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:outline-none pb-0.5"
                            placeholder="Skill name"
                          />
                        </div>

                        {/* Editable Evidence */}
                        <div>
                          <textarea
                            rows={2}
                            value={skill.evidence}
                            onChange={(e) => {
                              const next = [...formState.skills];
                              next[idx] = { ...next[idx], evidence: e.target.value };
                              updateField('skills', next);
                            }}
                            placeholder="Evidence or project context..."
                            className="w-full text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none leading-relaxed"
                          />
                        </div>

                        {/* Editable Proficiency Level (Slider + Auto-eval button) */}
                        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">
                              Proficiency Rating:
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {currentProficiency} / 10
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const computed = computeProficiencyFromEvidence(
                                    skill.evidence,
                                    skill.confidence
                                  );
                                  const next = [...formState.skills];
                                  next[idx] = { ...next[idx], proficiency_level: computed };
                                  updateField('skills', next);
                                  toast.info(`Evaluated from evidence: ${computed}/10`);
                                }}
                                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                                title="Re-calculate from evidence context"
                              >
                                <Wand2 className="w-3 h-3" />
                                <span>Auto-eval</span>
                              </button>
                            </div>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={10}
                            step={1}
                            value={currentProficiency}
                            onChange={(e) => {
                              const next = [...formState.skills];
                              next[idx] = {
                                ...next[idx],
                                proficiency_level: Number(e.target.value),
                              };
                              updateField('skills', next);
                            }}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                          <Progress
                            value={currentProficiency * 10}
                            tone={
                              currentProficiency >= 8
                                ? 'emerald'
                                : currentProficiency >= 6
                                ? 'indigo'
                                : 'amber'
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: EDUCATION */}
        {activeTab === 'education' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Education History
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateField('education', [
                    ...formState.education,
                    {
                      id: `edu-${Date.now()}`,
                      institution: '',
                      degree: '',
                      field_of_study: '',
                      graduation_year: '',
                      score_or_gpa: '',
                    },
                  ])
                }
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Education</span>
              </Button>
            </div>

            {formState.education.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No education entries added yet.</p>
            ) : (
              formState.education.map((edu, idx) => (
                <div
                  key={edu.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Academic Entry #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          'education',
                          formState.education.filter((_, i) => i !== idx)
                        )
                      }
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Institution"
                      placeholder="e.g. Stanford University or IIT Bombay"
                      value={edu.institution}
                      onChange={(e) => {
                        const next = [...formState.education];
                        next[idx] = { ...next[idx], institution: e.target.value };
                        updateField('education', next);
                      }}
                    />
                    <Input
                      label="Degree"
                      placeholder="e.g. B.Tech / B.S. in Computer Science"
                      value={edu.degree}
                      onChange={(e) => {
                        const next = [...formState.education];
                        next[idx] = { ...next[idx], degree: e.target.value };
                        updateField('education', next);
                      }}
                    />
                    <Input
                      label="Field of Study"
                      placeholder="e.g. Computer Science and Engineering"
                      value={edu.field_of_study || ''}
                      onChange={(e) => {
                        const next = [...formState.education];
                        next[idx] = { ...next[idx], field_of_study: e.target.value };
                        updateField('education', next);
                      }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Grad Year"
                        placeholder="e.g. 2026"
                        value={edu.graduation_year || ''}
                        onChange={(e) => {
                          const next = [...formState.education];
                          next[idx] = { ...next[idx], graduation_year: e.target.value };
                          updateField('education', next);
                        }}
                      />
                      <Input
                        label="CGPA / Percentage"
                        placeholder="e.g. 8.8 CGPA"
                        value={edu.score_or_gpa || ''}
                        onChange={(e) => {
                          const next = [...formState.education];
                          next[idx] = { ...next[idx], score_or_gpa: e.target.value };
                          updateField('education', next);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Technical Projects
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateField('projects', [
                    ...(formState.projects || []),
                    {
                      id: `proj-${Date.now()}`,
                      title: '',
                      description: '',
                      technologies: [],
                    },
                  ])
                }
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </Button>
            </div>

            {(!formState.projects || formState.projects.length === 0) ? (
              <p className="text-sm text-slate-500 py-4">No projects added yet.</p>
            ) : (
              formState.projects.map((proj, idx) => (
                <div
                  key={proj.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Project #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          'projects',
                          (formState.projects || []).filter((_, i) => i !== idx)
                        )
                      }
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <Input
                    label="Project Title"
                    placeholder="e.g. Distributed Key-Value Store"
                    value={proj.title}
                    onChange={(e) => {
                      const next = [...(formState.projects || [])];
                      next[idx] = { ...next[idx], title: e.target.value };
                      updateField('projects', next);
                    }}
                  />
                  <Input
                    label="Description"
                    placeholder="Describe architecture, scale, and outcomes..."
                    value={proj.description}
                    onChange={(e) => {
                      const next = [...(formState.projects || [])];
                      next[idx] = { ...next[idx], description: e.target.value };
                      updateField('projects', next);
                    }}
                  />
                  <Input
                    label="Technologies (comma-separated)"
                    placeholder="e.g. Go, Raft, Docker, Redis"
                    value={(proj.technologies || []).join(', ')}
                    onChange={(e) => {
                      const next = [...(formState.projects || [])];
                      next[idx] = {
                        ...next[idx],
                        technologies: e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean),
                      };
                      updateField('projects', next);
                    }}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: INTERNSHIPS */}
        {activeTab === 'internships' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Internships &amp; Work Experience
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateField('internships', [
                    ...formState.internships,
                    {
                      id: `int-${Date.now()}`,
                      company: '',
                      role: '',
                      duration: '',
                      description: '',
                      technologies: [],
                    },
                  ])
                }
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Internship</span>
              </Button>
            </div>

            {formState.internships.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No internship entries added yet.</p>
            ) : (
              formState.internships.map((intern, idx) => (
                <div
                  key={intern.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Internship #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          'internships',
                          formState.internships.filter((_, i) => i !== idx)
                        )
                      }
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Company"
                      placeholder="e.g. Google or TechCorp"
                      value={intern.company}
                      onChange={(e) => {
                        const next = [...formState.internships];
                        next[idx] = { ...next[idx], company: e.target.value };
                        updateField('internships', next);
                      }}
                    />
                    <Input
                      label="Role"
                      placeholder="e.g. Software Engineer Intern"
                      value={intern.role}
                      onChange={(e) => {
                        const next = [...formState.internships];
                        next[idx] = { ...next[idx], role: e.target.value };
                        updateField('internships', next);
                      }}
                    />
                    <Input
                      label="Duration"
                      placeholder="e.g. Jun 2025 – Aug 2025"
                      value={intern.duration || ''}
                      onChange={(e) => {
                        const next = [...formState.internships];
                        next[idx] = { ...next[idx], duration: e.target.value };
                        updateField('internships', next);
                      }}
                    />
                  </div>
                  <Input
                    label="Impact & Description"
                    placeholder="Key responsibilities and measurable outcomes..."
                    value={intern.description}
                    onChange={(e) => {
                      const next = [...formState.internships];
                      next[idx] = { ...next[idx], description: e.target.value };
                      updateField('internships', next);
                    }}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 6: HACKATHONS */}
        {activeTab === 'hackathons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Hackathons &amp; Competitions
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateField('hackathons', [
                    ...formState.hackathons,
                    {
                      id: `hack-${Date.now()}`,
                      name: '',
                      organizer: '',
                      year: '',
                      achievement: '',
                      project_summary: '',
                    },
                  ])
                }
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Hackathon</span>
              </Button>
            </div>

            {formState.hackathons.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No hackathon entries added yet.</p>
            ) : (
              formState.hackathons.map((hack, idx) => (
                <div
                  key={hack.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Hackathon #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          'hackathons',
                          formState.hackathons.filter((_, i) => i !== idx)
                        )
                      }
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Hackathon Name"
                      placeholder="e.g. Smart India Hackathon"
                      value={hack.name}
                      onChange={(e) => {
                        const next = [...formState.hackathons];
                        next[idx] = { ...next[idx], name: e.target.value };
                        updateField('hackathons', next);
                      }}
                    />
                    <Input
                      label="Organizer"
                      placeholder="e.g. Ministry of Education"
                      value={hack.organizer || ''}
                      onChange={(e) => {
                        const next = [...formState.hackathons];
                        next[idx] = { ...next[idx], organizer: e.target.value };
                        updateField('hackathons', next);
                      }}
                    />
                    <Input
                      label="Achievement / Rank"
                      placeholder="e.g. Winner, Finalist, Top 5"
                      value={hack.achievement || ''}
                      onChange={(e) => {
                        const next = [...formState.hackathons];
                        next[idx] = { ...next[idx], achievement: e.target.value };
                        updateField('hackathons', next);
                      }}
                    />
                  </div>
                  <Input
                    label="Project Summary"
                    placeholder="Short description of the solution built..."
                    value={hack.project_summary || ''}
                    onChange={(e) => {
                      const next = [...formState.hackathons];
                      next[idx] = { ...next[idx], project_summary: e.target.value };
                      updateField('hackathons', next);
                    }}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 7: CERTIFICATIONS */}
        {activeTab === 'certifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Certifications &amp; Credentials
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateField('certifications', [
                    ...formState.certifications,
                    {
                      id: `cert-${Date.now()}`,
                      name: '',
                      issuer: '',
                      year: '',
                    },
                  ])
                }
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Certification</span>
              </Button>
            </div>

            {formState.certifications.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No certification entries added yet.</p>
            ) : (
              formState.certifications.map((cert, idx) => (
                <div
                  key={cert.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-5">
                    <Input
                      label="Certification Name"
                      placeholder="e.g. AWS Certified Solutions Architect"
                      value={cert.name}
                      onChange={(e) => {
                        const next = [...formState.certifications];
                        next[idx] = { ...next[idx], name: e.target.value };
                        updateField('certifications', next);
                      }}
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <Input
                      label="Issuing Organization"
                      placeholder="e.g. Amazon Web Services"
                      value={cert.issuer || ''}
                      onChange={(e) => {
                        const next = [...formState.certifications];
                        next[idx] = { ...next[idx], issuer: e.target.value };
                        updateField('certifications', next);
                      }}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Year"
                      placeholder="e.g. 2025"
                      value={cert.year ? String(cert.year) : ''}
                      onChange={(e) => {
                        const next = [...formState.certifications];
                        next[idx] = { ...next[idx], year: e.target.value };
                        updateField('certifications', next);
                      }}
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          'certifications',
                          formState.certifications.filter((_, i) => i !== idx)
                        )
                      }
                      className="p-2 text-slate-400 hover:text-red-600 cursor-pointer"
                      title="Remove certification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 8: PREFERRED ROLES & CV UPLOAD */}
        {activeTab === 'roles_cv' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Preferred Target Roles
              </h2>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="e.g. Software Engineer, Backend Engineer, Cloud Engineer"
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!newRoleInput.trim()) return;
                      updateField('preferred_roles', [
                        ...formState.preferred_roles,
                        newRoleInput.trim(),
                      ]);
                      setNewRoleInput('');
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!newRoleInput.trim()) return;
                    updateField('preferred_roles', [
                      ...formState.preferred_roles,
                      newRoleInput.trim(),
                    ]);
                    setNewRoleInput('');
                  }}
                >
                  Add Role
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {formState.preferred_roles.map((r, idx) => (
                  <div
                    key={`${r}-${idx}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                  >
                    <span>{r}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          'preferred_roles',
                          formState.preferred_roles.filter((_, i) => i !== idx)
                        )
                      }
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                      aria-label={`Remove role ${r}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileUp className="w-4 h-4 text-indigo-500" />
                <span>CV Document Reference (`cv_file`)</span>
              </h3>
              <Input
                label="CV Filename in Database Record"
                value={formState.cv_file || ''}
                onChange={(e) => updateField('cv_file', e.target.value)}
              />
              <FileUpload
                label="Upload Updated CV File to Update Reference"
                selectedFile={cvFileObj}
                onFileSelect={(file) => {
                  setCvFileObj(file);
                  if (file) {
                    updateField('cv_file', file.name);
                    toast.info(`Updated cv_file reference to ${file.name}`);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* LIVE PROFILE PREVIEW CARD */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                LIVE PROFILE PREVIEW
              </span>
              {formState.id && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  ID: {formState.id.slice(0, 8)}...
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {formState.name || 'Unnamed Candidate'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formState.email || 'No email specified'}
              {formState.headline ? ` · ${formState.headline}` : ''}
              {formState.phone ? ` · ${formState.phone}` : ''}
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Profile Completeness
              </span>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                {liveCompleteness.score}% Complete
              </span>
            </div>
            <Progress
              value={liveCompleteness.score}
              tone={liveCompleteness.score === 100 ? 'emerald' : 'indigo'}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Summary Counters */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block">Tagged Skills</span>
              <span className="font-mono font-bold text-base text-slate-900 dark:text-white mt-0.5 block">
                {formState.skills.length}
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block">Internships</span>
              <span className="font-mono font-bold text-base text-slate-900 dark:text-white mt-0.5 block">
                {formState.internships.length}
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block">Hackathons</span>
              <span className="font-mono font-bold text-base text-slate-900 dark:text-white mt-0.5 block">
                {formState.hackathons.length}
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block">Certifications</span>
              <span className="font-mono font-bold text-base text-slate-900 dark:text-white mt-0.5 block">
                {formState.certifications.length}
              </span>
            </div>
          </div>

          {/* Completeness Checklist */}
          <div className="lg:col-span-5 space-y-2.5 text-xs">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Readiness Hand-off Checklist
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {liveCompleteness.completedSections.map((sec) => (
                <div
                  key={sec}
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{sec}</span>
                </div>
              ))}
              {liveCompleteness.missingSections.map((sec) => (
                <div
                  key={sec}
                  className="flex items-center gap-2 text-amber-600 dark:text-amber-400"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Missing: {sec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Flow Actions */}
          <div className="lg:col-span-3 space-y-2.5">
            <Button
              variant="primary"
              className="w-full"
              onClick={async () => {
                await handleSave();
                navigate('/app/talent-check');
              }}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Save &amp; Run Talent Check →</span>
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await handleSave();
                navigate('/app/skill-matching');
              }}
            >
              <GitCompare className="w-4 h-4" />
              <span>Save &amp; Run Skill Matching →</span>
            </Button>
            <button
              type="button"
              onClick={() => setConfirmClearOpen(true)}
              className="w-full text-center text-[11px] text-slate-500 hover:text-red-600 pt-1 cursor-pointer"
            >
              Clear profile fields
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={handleClearProfile}
        title="Clear Profile Fields?"
        message="This will clear all entered candidate details, skills, and experience from the editor so you can enter new data or upload another resume."
        confirmLabel="Clear Editor"
        variant="danger"
      />
    </div>
  );
};
