import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  UserCheck,
  GraduationCap,
  Briefcase,
  Award,
  Code2,
  FolderGit2,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PageHeader,
  Button,
  FileUpload,
  Progress,
  Skeleton,
  ErrorState,
} from '../../components/ui/primitives';
import { useWorkspace } from '../../context/WorkspaceContext';
import { resumeParsingApiService as resumeParsingService } from '../../services/api';
import { ParsedResumeOutput } from '../../types/radix';
import { CATEGORY_LOOKUP } from '../../data/radixCategories';

export const ResumeParsingPage: React.FC = () => {
  const {
    latestParsedResume,
    setLatestParsedResume,
    importParsedResumeToProfile,
    activeResumeSession,
    updateActiveResumeSession,
  } = useWorkspace();
  const navigate = useNavigate();

  // List of real, user-parsed resumes fetched from the FastAPI backend (Port 8002)
  const [savedResumes, setSavedResumes] = useState<ParsedResumeOutput[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  // Uploaded file state
  const [uploadedFile, setUploadedFile] = useState<File | null>(() => {
    if (activeResumeSession.selectedFileName) {
      return new File([''], activeResumeSession.selectedFileName, {
        type: activeResumeSession.selectedFileName.endsWith('.docx')
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/pdf',
      });
    }
    return null;
  });

  // Raw text input mode toggle
  const [rawTextMode, setRawTextMode] = useState<boolean>(false);
  const [resumeRawText, setResumeRawText] = useState<string>('');

  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Fetch real persisted resumes on mount
  const loadSavedResumes = async () => {
    try {
      const resumes = await resumeParsingService.getSampleResumes();
      if (Array.isArray(resumes)) {
        setSavedResumes(resumes);
        if (resumes.length > 0 && !activeResumeSession.displayedResume) {
          setSelectedResumeId(resumes[0].id || '');
          updateActiveResumeSession({
            hasParsed: true,
            displayedResume: resumes[0],
            selectedFileName: resumes[0].source_file,
          });
        }
      }
    } catch (err) {
      console.warn('[ResumeParsingPage] Error fetching saved resumes:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    resumeParsingService.getSampleResumes().then((resumes) => {
      if (isMounted && Array.isArray(resumes)) {
        setSavedResumes(resumes);
        if (resumes.length > 0 && !activeResumeSession.displayedResume) {
          setSelectedResumeId(resumes[0].id || '');
          updateActiveResumeSession({
            hasParsed: true,
            displayedResume: resumes[0],
            selectedFileName: resumes[0].source_file,
          });
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const displayedResume: ParsedResumeOutput | null =
    activeResumeSession.displayedResume ||
    latestParsedResume ||
    savedResumes.find((r) => r.id === selectedResumeId) ||
    (savedResumes.length > 0 ? savedResumes[0] : null);

  const hasParsed = Boolean(displayedResume);

  const handleSelectSavedResume = (resumeId: string) => {
    const selected = savedResumes.find((r) => r.id === resumeId);
    if (selected) {
      setSelectedResumeId(resumeId);
      updateActiveResumeSession({
        hasParsed: true,
        displayedResume: selected,
        selectedFileName: selected.source_file,
      });
      toast.info(`Switched active resume to ${selected.candidate_name}`);
    }
  };

  const handleDeleteSavedResume = async (resumeId: string) => {
    try {
      if (resumeParsingService.deleteResume) {
        await resumeParsingService.deleteResume(resumeId);
      }
      const updated = savedResumes.filter((r) => r.id !== resumeId);
      setSavedResumes(updated);

      if (displayedResume?.id === resumeId) {
        if (updated.length > 0) {
          setSelectedResumeId(updated[0].id || '');
          updateActiveResumeSession({
            hasParsed: true,
            displayedResume: updated[0],
            selectedFileName: updated[0].source_file,
          });
        } else {
          setSelectedResumeId('');
          setLatestParsedResume(null);
          updateActiveResumeSession({
            hasParsed: false,
            displayedResume: null,
            selectedFileName: null,
            selectedFileSize: null,
          });
        }
      }
      toast.success('Resume deleted from storage.');
    } catch {
      toast.error('Failed to delete resume.');
    }
  };

  const handleParseResume = async () => {
    if (!uploadedFile && (!rawTextMode || !resumeRawText.trim())) {
      toast.error('Please upload a resume file (.pdf, .docx, .doc, .txt, .md) or enter resume text.');
      return;
    }

    setErrorMsg(null);
    setIsParsing(true);
    setProgress(25);

    const t1 = setTimeout(() => setProgress(65), 300);

    try {
      let fileToUpload = uploadedFile;

      // If in raw text mode, create a text/plain File
      if (rawTextMode && resumeRawText.trim()) {
        const textBlob = new Blob([resumeRawText.trim()], { type: 'text/plain' });
        fileToUpload = new File([textBlob], 'candidate_resume.txt', { type: 'text/plain' });
      }

      if (!fileToUpload) {
        throw new Error('No resume file available.');
      }

      const parsed = await resumeParsingService.parseResume({
        file: fileToUpload,
      });

      setProgress(100);
      setLatestParsedResume(parsed);
      setSelectedResumeId(parsed.id || '');

      // Update saved list
      setSavedResumes((prev) => {
        const filtered = prev.filter((r) => r.id !== parsed.id);
        return [parsed, ...filtered];
      });

      updateActiveResumeSession({
        hasParsed: true,
        displayedResume: parsed,
        selectedFileName: fileToUpload.name,
        selectedFileSize: fileToUpload.size,
      });

      toast.success(
        `Extracted ${parsed.skills.length} skills & experience for ${parsed.candidate_name}`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to parse resume. Please check backend connection on port 8002.');
    } finally {
      clearTimeout(t1);
      setIsParsing(false);
    }
  };

  const handleImportToProfileBuilder = async () => {
    if (!displayedResume) return;
    setIsImporting(true);
    try {
      await importParsedResumeToProfile(displayedResume);
      toast.success(
        `Imported ${displayedResume.candidate_name}'s extracted resume into Profile Builder.`
      );
      navigate('/app/profile');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="MODULE 02 · ROLE 2 (RESUME PARSING)"
        title="Resume Skill & Experience Extraction"
        description="Upload a candidate resume in PDF, Word (.docx, .doc), or Text (.txt, .md) format to extract structured technical skills, education, projects, and internships mapped to the 12 RADIX categories."
        actions={
          hasParsed && displayedResume ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleImportToProfileBuilder}
              isLoading={isImporting}
            >
              <UserCheck className="w-4 h-4" />
              <span>Import into Profile Builder →</span>
            </Button>
          ) : undefined
        }
      />

      {errorMsg && <ErrorState message={errorMsg} onRetry={handleParseResume} />}

      {/* 1. Saved Resumes from Backend (Shown when stored resumes exist) */}
      {savedResumes.length > 0 && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              <span>Saved Candidate Resumes ({savedResumes.length})</span>
            </h3>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              Live Backend Store (Port 8002)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {savedResumes.map((resume) => {
              const isSelected = displayedResume?.id === resume.id;
              return (
                <div
                  key={resume.id}
                  onClick={() => resume.id && handleSelectSavedResume(resume.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {resume.candidate_name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {resume.source_file} · {resume.skills.length} skills
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    )}
                    <button
                      type="button"
                      title="Delete resume"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (resume.id) handleDeleteSavedResume(resume.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Resume Upload Section */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Upload Candidate Resume
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Accepts documents in PDF (.pdf), Word (.docx, .doc), or Text (.txt, .md) formats.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRawTextMode(!rawTextMode)}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {rawTextMode ? 'Switch to File Upload' : 'Paste Raw Text Instead'}
          </button>
        </div>

        {rawTextMode ? (
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Paste Candidate Resume Text:
            </label>
            <textarea
              rows={8}
              value={resumeRawText}
              onChange={(e) => setResumeRawText(e.target.value)}
              placeholder="Paste candidate resume content here (e.g. contact info, education, technical skills, projects, internships)..."
              className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ) : (
          <FileUpload
            label="Upload Candidate Resume (.pdf, .docx, .doc, .txt, .md)"
            selectedFile={uploadedFile}
            onFileSelect={(file) => {
              setUploadedFile(file);
              if (!file) {
                updateActiveResumeSession({
                  hasParsed: false,
                  selectedFileName: null,
                  selectedFileSize: null,
                });
              } else {
                updateActiveResumeSession({
                  hasParsed: false,
                  selectedFileName: file.name,
                  selectedFileSize: file.size,
                });
                toast.info(`Selected ${file.name} for resume parsing.`);
              }
            }}
          />
        )}

        {uploadedFile && !rawTextMode && (
          <div className="px-3 py-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">
              Selected file: <strong>{uploadedFile.name}</strong> ({Math.round(uploadedFile.size / 1024)} KB)
            </span>
          </div>
        )}

        {isParsing && (
          <div className="p-3.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50">
            <Progress
              value={progress}
              label="Extracting technical skills, projects & education across 12 RADIX categories..."
              showValue
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <Button
            variant="primary"
            className="w-full sm:flex-1"
            onClick={handleParseResume}
            isLoading={isParsing}
          >
            <FileText className="w-4 h-4" />
            <span>Parse Resume</span>
          </Button>
          {hasParsed && displayedResume && (
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleImportToProfileBuilder}
              isLoading={isImporting}
            >
              <span>Import to Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* 3. Parsed Output Details */}
      {isParsing ? (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : displayedResume ? (
        <div className="space-y-6">
          {/* Candidate Header Card */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400">
                  <span>{displayedResume.source_file}</span>
                  <span>·</span>
                  <span>{displayedResume.profile_archetype}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {displayedResume.candidate_name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {displayedResume.candidate_email} · {displayedResume.phone || 'Phone not provided'} ·{' '}
                  {displayedResume.location || 'Location flexible'}
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                  {displayedResume.skills.length}
                </span>
                <p className="text-[11px] text-slate-500">Skills Extracted</p>
              </div>
            </div>

            {displayedResume.fit_summary && (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Profile Summary:
                </span>{' '}
                {displayedResume.fit_summary}
              </p>
            )}
          </div>

          {/* Extracted Technical Skills Grouped by RADIX Category */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-500" />
                <span>Extracted Technical Skills (12 RADIX Categories)</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">
                Shared `Skill[]` Format
              </span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {displayedResume.skills.map((skill, idx) => {
                const cat = CATEGORY_LOOKUP[skill.category_code];
                return (
                  <div
                    key={`${skill.category_code}-${idx}`}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {skill.category_code}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {skill.skill_name}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{cat?.shortName || skill.category_code}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        {skill.evidence}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono">
                      {typeof skill.proficiency_level === 'number' && (
                        <span className="text-slate-600 dark:text-slate-300">
                          Lvl {skill.proficiency_level}/10
                        </span>
                      )}
                      <span
                        className={
                          skill.confidence === 'high'
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : skill.confidence === 'medium'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {skill.confidence.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Extracted Education, Projects, Internships & Certifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-500" />
                <span>Education</span>
              </h3>
              {displayedResume.education.length > 0 ? (
                displayedResume.education.map((edu) => (
                  <div key={edu.id} className="text-xs space-y-0.5">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {edu.degree} in {edu.field_of_study}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">{edu.institution}</p>
                    <p className="font-mono text-[11px] text-slate-500">
                      Class of {edu.graduation_year} {edu.score_or_gpa ? `· ${edu.score_or_gpa}` : ''}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No education entries extracted.</p>
              )}
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                <span>Experience &amp; Internships</span>
              </h3>
              {displayedResume.internships.length > 0 ? (
                displayedResume.internships.map((intern) => (
                  <div key={intern.id} className="text-xs space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {intern.role} · {intern.company}
                    </p>
                    <p className="font-mono text-[11px] text-slate-500">{intern.duration}</p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {intern.description}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No work or internship entries extracted.</p>
              )}
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-indigo-500" />
                <span>Extracted Projects</span>
              </h3>
              <div className="space-y-3">
                {displayedResume.projects.length > 0 ? (
                  displayedResume.projects.map((proj) => (
                    <div key={proj.id} className="text-xs space-y-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {proj.title}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {proj.description}
                      </p>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <p className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                          {proj.technologies.join(' · ')}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No projects extracted.</p>
                )}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-500" />
                <span>Certifications &amp; Hackathons</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                {displayedResume.certifications.length > 0 &&
                  displayedResume.certifications.map((cert) => (
                    <div key={cert.id}>
                      <p className="font-semibold text-slate-900 dark:text-white">{cert.name}</p>
                      <p className="text-slate-500">
                        {cert.issuer} · {cert.year}
                      </p>
                    </div>
                  ))}
                {displayedResume.hackathons.length > 0 &&
                  displayedResume.hackathons.map((h) => (
                    <div key={h.id} className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {h.name} {h.achievement ? `(${h.achievement})` : ''}
                      </p>
                      <p className="text-slate-500">{h.project_summary}</p>
                    </div>
                  ))}
                {displayedResume.certifications.length === 0 && displayedResume.hackathons.length === 0 && (
                  <p className="text-xs text-slate-500">No certifications or hackathons extracted.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State (when no resumes have been uploaded/stored yet) */
        <div className="p-12 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3 bg-white dark:bg-slate-900">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No Candidate Resumes Analyzed Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Upload a candidate resume document (.pdf, .docx, .doc, .txt, .md) or paste resume text above to extract technical skills across the 12 RADIX categories, education, projects, and work experience.
          </p>
        </div>
      )}
    </div>
  );
};
