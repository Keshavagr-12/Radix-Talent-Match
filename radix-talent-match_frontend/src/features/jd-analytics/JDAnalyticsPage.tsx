import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSearch,
  Search,
  GitCompare,
  BookmarkCheck,
  FileText,
  FilePlus2,
  Download,
  CheckCircle2,
  Trash2,
  PlusCircle,
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
import { jdApiService as jdAnalyticsService } from '../../services/api';
import { ExtractedSkillList } from '../../types/radix';
import { CATEGORY_LOOKUP, RADIX_TWELVE_CATEGORIES } from '../../data/radixCategories';

/**
 * Generates a standards-compliant single-page PDF File from plain text
 * so users can both download the generated PDF and immediately select/analyze it.
 */
function createPdfFileFromText(rawText: string): File {
  const cleanText = rawText
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .trim();

  // Wrap text into lines of ~80 characters
  const paragraphs = cleanText.split(/\r?\n/);
  const wrappedLines: string[] = [];
  for (const para of paragraphs) {
    if (!para.trim()) {
      wrappedLines.push('');
      continue;
    }
    const words = para.trim().split(/\s+/);
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= 82) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) wrappedLines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) wrappedLines.push(currentLine);
  }

  const maxLines = wrappedLines.slice(0, 48);
  const escapePdfText = (str: string) =>
    str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  const textOps = [
    'BT',
    '/F1 11 Tf',
    '50 750 Td',
    '14 TL',
    '(Job Description Document) Tj',
    'T*',
    '/F1 10 Tf',
    ...maxLines.map((line) => `T* (${escapePdfText(line)}) Tj`),
    'ET',
  ].join('\n');

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj',
    `4 0 obj\n<< /Length ${textOps.length} >>\nstream\n${textOps}\nendstream\nendobj`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const firstWords = cleanText
    .split(/\s+/)
    .slice(0, 3)
    .join('_')
    .replace(/[^a-zA-Z0-9_]/g, '');
  const fileName = `${firstWords || 'Job_Description'}_JD.pdf`;

  return new File([pdf], fileName, { type: 'application/pdf' });
}

export const JDAnalyticsPage: React.FC = () => {
  const {
    analyzedJDs,
    selectedJDId,
    setSelectedJDId,
    addAnalyzedJD,
    removeAnalyzedJD,
    activeJDSession,
    updateActiveJDSession,
  } = useWorkspace();
  const navigate = useNavigate();

  const [companyInput, setCompanyInput] = useState<string>('');
  const [roleInput, setRoleInput] = useState<string>('');
  const [locationInput, setLocationInput] = useState<string>('');

  // Reconstruct selected File & PDF download URL from session state when returning to this page
  const [uploadedFile, setUploadedFile] = useState<File | null>(() => {
    if (activeJDSession.convertedSourceText) {
      return createPdfFileFromText(activeJDSession.convertedSourceText);
    }
    if (activeJDSession.selectedFileName) {
      return new File([''], activeJDSession.selectedFileName, {
        type: activeJDSession.selectedFileName.endsWith('.docx')
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/pdf',
      });
    }
    return null;
  });

  const [convertedPdfUrl, setConvertedPdfUrl] = useState<string | null>(() => {
    if (activeJDSession.convertedSourceText) {
      const pdfFile = createPdfFileFromText(activeJDSession.convertedSourceText);
      return URL.createObjectURL(pdfFile);
    }
    return null;
  });

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Table search & filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('ALL');

  const fallbackResult: ExtractedSkillList | null = useMemo(() => {
    return (
      analyzedJDs.find((j) => j.id === selectedJDId) ||
      analyzedJDs[0] ||
      null
    );
  }, [analyzedJDs, selectedJDId]);

  const displayedResult = activeJDSession.displayedResult || fallbackResult;
  const hasAnalyzed =
    (activeJDSession.hasAnalyzed && Boolean(activeJDSession.displayedResult)) ||
    Boolean(displayedResult);
  const jdTextInput = activeJDSession.jdTextInput;
  const convertedSourceText = activeJDSession.convertedSourceText;

  useEffect(() => {
    return () => {
      if (convertedPdfUrl) {
        URL.revokeObjectURL(convertedPdfUrl);
      }
    };
  }, [convertedPdfUrl]);

  const handleDeleteJD = async (id?: string) => {
    if (!id) return;
    const target = analyzedJDs.find((j) => j.id === id);
    await removeAnalyzedJD(id);
    toast.success(target ? `Deleted ${target.role} (${target.company})` : 'Deleted job description');
  };

  const handleConvertTextToPdf = () => {
    const trimmed = jdTextInput.trim();
    if (!trimmed) {
      toast.error('Please enter or paste a job description first.');
      return;
    }

    if (convertedPdfUrl) {
      URL.revokeObjectURL(convertedPdfUrl);
    }

    const pdfFile = createPdfFileFromText(trimmed);
    const url = URL.createObjectURL(pdfFile);

    setUploadedFile(pdfFile);
    setConvertedPdfUrl(url);

    // Changing/converting a new JD resets hasAnalyzed until user clicks Analyze Job Description
    updateActiveJDSession({
      hasAnalyzed: false,
      selectedFileName: pdfFile.name,
      selectedFileSize: pdfFile.size,
      convertedSourceText: trimmed,
    });

    toast.success(`Converted text to ${pdfFile.name} and selected it for analysis.`);
  };

  const handleRunAnalysis = async () => {
    // If user typed new text in the bar and hasn't converted yet, auto-convert & select it first
    let activeFile = uploadedFile;
    let activeText = convertedSourceText;

    if (jdTextInput.trim() && jdTextInput.trim() !== convertedSourceText) {
      const trimmed = jdTextInput.trim();
      const pdfFile = createPdfFileFromText(trimmed);
      if (convertedPdfUrl) {
        URL.revokeObjectURL(convertedPdfUrl);
      }
      const url = URL.createObjectURL(pdfFile);
      setUploadedFile(pdfFile);
      setConvertedPdfUrl(url);
      activeFile = pdfFile;
      activeText = trimmed;
    }

    if (!activeFile && !activeText) {
      toast.error('Please enter a job description to convert to PDF or browse a PDF/DOCX file.');
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);
    setProgressStep(25);

    const stepTimer1 = setTimeout(() => setProgressStep(60), 200);
    const stepTimer2 = setTimeout(() => setProgressStep(90), 420);

    try {
      const result = await jdAnalyticsService.analyzeJD({
        file: activeFile || undefined,
        rawText: activeText || undefined,
        companyOverride: companyInput.trim() || undefined,
        roleOverride: roleInput.trim() || undefined,
      });

      setProgressStep(100);
      addAnalyzedJD(result);
      if (result.id) {
        setSelectedJDId(result.id);
      }

      // Persist analyzed JD result in session until signout or until JD is changed
      updateActiveJDSession({
        hasAnalyzed: true,
        displayedResult: result,
        selectedFileName: activeFile?.name || result.source_file,
        selectedFileSize: activeFile?.size || null,
        convertedSourceText: activeText,
      });

      toast.success(`Extracted ${result.skills.length} skills from ${result.source_file}`);
    } catch (err: any) {
      console.error('[JDAnalyticsPage] Extraction error:', err);
      setErrorMsg(err?.message || 'JD skill extraction encountered an error. Please retry.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsAnalyzing(false);
    }
  };

  const filteredSkills = useMemo(() => {
    if (!displayedResult?.skills) return [];
    return displayedResult.skills.filter((s) => {
      const matchesQuery =
        !searchQuery.trim() ||
        s.skill_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.evidence.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category_code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = categoryFilter === 'ALL' || s.category_code === categoryFilter;
      const matchesConf = confidenceFilter === 'ALL' || s.confidence === confidenceFilter;
      return matchesQuery && matchesCat && matchesConf;
    });
  }, [displayedResult?.skills, searchQuery, categoryFilter, confidenceFilter]);

  const handleSendToSkillMatching = () => {
    if (displayedResult?.id) {
      setSelectedJDId(displayedResult.id);
    }
    if (displayedResult) {
      addAnalyzedJD(displayedResult);
    }
    navigate('/app/skill-matching');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="MODULE 01 · ROLE 1 (JD ANALYTICS)"
        title="Job Description Skill & Competency Extraction"
        description="Import job descriptions, convert to PDF, extract structured skills and evidence, and manage your imported catalog."
        actions={
          hasAnalyzed ? (
            <Button variant="primary" size="sm" onClick={handleSendToSkillMatching}>
              <GitCompare className="w-4 h-4" />
              <span>Match Profile to This JD →</span>
            </Button>
          ) : undefined
        }
      />

      {errorMsg && <ErrorState message={errorMsg} onRetry={handleRunAnalysis} />}

      {/* Imported Job Descriptions List */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Imported Job Descriptions ({analyzedJDs.length})
            </h2>
          </div>
          {analyzedJDs.length > 0 && (
            <span className="text-[11px] text-slate-500">
              Showing only JDs added during import
            </span>
          )}
        </div>

        {analyzedJDs.length === 0 ? (
          <div className="py-6 px-4 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
            <FileText className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              No job descriptions imported yet.
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Paste text or browse a PDF/Word JD below and click &quot;Analyze &amp; Import Job Description&quot;.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {analyzedJDs.map((jd) => {
              const isActive = displayedResult?.id === jd.id;
              return (
                <div
                  key={jd.id}
                  className={`inline-flex items-center rounded-lg border text-xs font-medium transition-all overflow-hidden ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (jd.id) setSelectedJDId(jd.id);
                      updateActiveJDSession({
                        hasAnalyzed: true,
                        displayedResult: jd,
                        selectedFileName: jd.source_file,
                        convertedSourceText: jd.raw_text || '',
                      });
                    }}
                    className="px-3 py-1.5 flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span>
                      {jd.role} · {jd.company}
                    </span>
                  </button>
                  <button
                    type="button"
                    title={`Delete ${jd.role}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteJD(jd.id);
                    }}
                    className={`px-2 py-1.5 border-l transition-colors cursor-pointer ${
                      isActive
                        ? 'border-indigo-500/50 hover:bg-indigo-700 text-indigo-100 hover:text-white'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 1. Add / Import Job Description Form */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            1. Add &amp; Import Job Description
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Provide the company, role, and text description or browse an existing PDF/Word file to extract skills.
          </p>
        </div>

        {/* Optional Metadata: Company & Role */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="jd-company-input" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Company Name (Optional)
            </label>
            <input
              id="jd-company-input"
              type="text"
              placeholder="e.g. Google, Microsoft, Stripe"
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div>
            <label htmlFor="jd-role-input" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Job Title / Role (Optional)
            </label>
            <input
              id="jd-role-input"
              type="text"
              placeholder="e.g. Senior Software Engineer"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div>
            <label htmlFor="jd-location-input" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Location (Optional)
            </label>
            <input
              id="jd-location-input"
              type="text"
              placeholder="e.g. Bengaluru / Remote"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>

        {/* Text Bar that takes text description and converts it into PDF format */}
        <div className="space-y-2.5">
          <label
            htmlFor="jd-text-converter-input"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Job Description Text to PDF
          </label>
          <textarea
            id="jd-text-converter-input"
            rows={4}
            value={jdTextInput}
            onChange={(e) => {
              const nextVal = e.target.value;
              updateActiveJDSession({
                jdTextInput: nextVal,
                // If user clears the text box completely and no browsed file is active, hide old analysis
                ...(nextVal.trim() === '' && convertedSourceText
                  ? {
                      hasAnalyzed: false,
                      convertedSourceText: '',
                      selectedFileName: null,
                      selectedFileSize: null,
                    }
                  : {}),
              });
              if (nextVal.trim() === '' && convertedSourceText) {
                setUploadedFile(null);
                if (convertedPdfUrl) {
                  URL.revokeObjectURL(convertedPdfUrl);
                  setConvertedPdfUrl(null);
                }
              }
            }}
            placeholder="Paste or type the job description responsibilities, required skills, and qualifications here..."
            className="w-full px-3.5 py-2.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleConvertTextToPdf}
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Convert to PDF &amp; Select</span>
            </Button>

            {convertedPdfUrl && uploadedFile && (
              <a
                href={convertedPdfUrl}
                download={uploadedFile.name}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {uploadedFile.name}</span>
              </a>
            )}
          </div>
        </div>

        {/* Browse Option for existing PDF or Word JD */}
        <FileUpload
          label="Or Browse Existing JD File (.pdf or .docx)"
          selectedFile={uploadedFile}
          onFileSelect={(file) => {
            setUploadedFile(file);
            if (convertedPdfUrl) {
              URL.revokeObjectURL(convertedPdfUrl);
              setConvertedPdfUrl(null);
            }
            if (!file) {
              // User removed the selected JD file -> hide previous analysis until a new JD is analyzed
              updateActiveJDSession({
                hasAnalyzed: false,
                selectedFileName: null,
                selectedFileSize: null,
                convertedSourceText: '',
              });
            } else {
              // User browsed a new JD file -> reset previous analysis until Analyze Job Description is clicked
              updateActiveJDSession({
                hasAnalyzed: false,
                selectedFileName: file.name,
                selectedFileSize: file.size,
                convertedSourceText: '',
              });
              toast.info(`Selected ${file.name} for JD analysis.`);
            }
          }}
        />

        {uploadedFile && (
          <div className="px-3 py-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {hasAnalyzed ? 'Active analyzed document:' : 'Ready to analyze:'}{' '}
              <strong>{uploadedFile.name}</strong>
            </span>
          </div>
        )}

        {isAnalyzing && (
          <div className="p-3.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-2">
            <Progress
              value={progressStep}
              label="Extracting skills & mapping to 12 RADIX categories..."
              showValue
            />
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleRunAnalysis}
            isLoading={isAnalyzing}
          >
            <FileSearch className="w-4 h-4" />
            <span>Analyze &amp; Import Job Description</span>
          </Button>
          {hasAnalyzed && displayedResult && (
            <Button
              variant="outline"
              onClick={() => {
                addAnalyzedJD(displayedResult);
                toast.success('Saved JD analysis to workspace state.');
              }}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>Save</span>
            </Button>
          )}
        </div>
      </div>

      {/* Show Role Summary Div and Extracted Skills & Evidence Table below when Analyze Job Description is clicked (persisted across session) */}
      {isAnalyzing || (hasAnalyzed && displayedResult) ? (
        <>
          {/* Software & Technical Role Summary Div */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
            {isAnalyzing ? (
              <div className="space-y-4">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : displayedResult ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{displayedResult.source_file}</span>
                      {displayedResult.location && (
                        <>
                          <span>·</span>
                          <span>{displayedResult.location}</span>
                        </>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {displayedResult.role} — {displayedResult.company}
                    </h2>
                    {displayedResult.summary && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                        {displayedResult.summary}
                      </p>
                    )}
                  </div>
                  <div className="text-left sm:text-right shrink-0 flex items-center sm:flex-col sm:items-end gap-3">
                    <div>
                      <span className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                        {displayedResult.skills.length}
                      </span>
                      <p className="text-[11px] text-slate-500">Extracted Skills</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
                      onClick={() => handleDeleteJD(displayedResult.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      <span>Delete JD</span>
                    </Button>
                  </div>
                </div>

                {/* Required Technologies List */}
                {displayedResult.required_technologies && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Named Technologies &amp; Tooling Detected
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {displayedResult.required_technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Searchable & Filterable Extracted Skills & Evidence Table */}
          {!isAnalyzing && displayedResult && (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Extracted Skills &amp; Evidence Table ({filteredSkills.length} of {displayedResult.skills.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Every requirement is tagged with its canonical RADIX category_code, direct prose evidence, and confidence level.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search skill or evidence..."
                      className="w-full h-9 pl-8 pr-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    aria-label="Filter by RADIX Category"
                    className="h-9 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="ALL">All Categories</option>
                    {RADIX_TWELVE_CATEGORIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.shortName}
                      </option>
                    ))}
                    <option value="OTHER">OTHER</option>
                  </select>

                  <select
                    value={confidenceFilter}
                    onChange={(e) => setConfidenceFilter(e.target.value)}
                    aria-label="Filter by Confidence Level"
                    className="h-9 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="ALL">All Confidence</option>
                    <option value="high">High Confidence</option>
                    <option value="medium">Medium Confidence</option>
                    <option value="low">Low Confidence</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="py-2.5 pr-4 font-medium">Skill / Requirement</th>
                      <th className="py-2.5 px-4 font-medium">RADIX Category</th>
                      <th className="py-2.5 px-4 font-medium">Evidence Quote / Reason</th>
                      <th className="py-2.5 pl-4 font-medium text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredSkills.map((skill, index) => {
                      const catMeta = CATEGORY_LOOKUP[skill.category_code];
                      return (
                        <tr
                          key={`${skill.skill_name}-${index}`}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        >
                          <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {skill.skill_name}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {skill.category_code}
                            </span>
                            <span className="text-slate-400 mx-1.5">·</span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {catMeta?.shortName || skill.category_code}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
                            {skill.evidence}
                          </td>
                          <td className="py-3 pl-4 text-right font-mono whitespace-nowrap">
                            <span
                              className={
                                skill.confidence === 'high'
                                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                  : skill.confidence === 'medium'
                                  ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                                  : 'text-amber-600 dark:text-amber-400'
                              }
                            >
                              {skill.confidence.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
          <FileSearch className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No Job Description Analyzed Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Upload a document (PDF, Word DOCX/DOC, TXT, MD) or paste job description text above, then click &ldquo;Analyze Job Description&rdquo; to extract competencies across the 12 RADIX categories. All analyzed JDs are saved and directly accessible.
          </p>
        </div>
      )}
    </div>
  );
};
