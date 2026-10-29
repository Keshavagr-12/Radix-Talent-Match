import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileSearch,
  FileText,
  UserCheck,
  ShieldCheck,
  GitCompare,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Layers,
  Code2,
  Cpu,
  Database,
  Cloud,
  Terminal,
  Network,
  Sparkles,
  MessageSquare,
  Compass,
  Box,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TalentNetworkCanvas } from './TalentNetworkCanvas';
import { Button, ScoreRing, Progress } from '../../components/ui/primitives';
import { RADIX_TWELVE_CATEGORIES } from '../../data/radixCategories';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const FIVE_MODULES = [
  {
    number: '01',
    title: 'JD Analytics',
    route: '/app/jd-analytics',
    tag: 'LLM Extraction',
    icon: FileSearch,
    description:
      'Upload a job description and discover the required skills, technologies, and competency categories.',
    handoff: 'Hands off structured JD skill list to Skill Matching',
  },
  {
    number: '02',
    title: 'Resume Parsing',
    route: '/app/resume-parsing',
    tag: 'LLM Extraction',
    icon: FileText,
    description:
      'Extract technical skills, education, projects, and experience from a resume.',
    handoff: 'Hands off extracted resume skills & experience to Profile Builder',
  },
  {
    number: '03',
    title: 'Profile Builder',
    route: '/app/profile',
    tag: 'Normalized JSON',
    icon: UserCheck,
    description:
      'Create a comprehensive candidate profile with skills, internships, hackathons, certifications, preferred roles, and a CV.',
    handoff: 'Hands off saved candidate profile to Talent Check & Skill Matching',
  },
  {
    number: '04',
    title: 'Talent Check',
    route: '/app/talent-check',
    tag: '12-Category Bar',
    icon: ShieldCheck,
    description:
      "Understand your readiness against a company's expected competency levels across the 12 RADIX skill categories.",
    handoff: 'Evaluates against Google LLC, Microsoft, and Oracle FSS benchmarks',
  },
  {
    number: '05',
    title: 'Skill Matching',
    route: '/app/skill-matching',
    tag: 'Fuzzy Match & Gaps',
    icon: GitCompare,
    description:
      'Compare your profile with a specific job posting and understand matched skills, missing skills, and your match score.',
    handoff: 'Prioritizes actionable missing-skill gap lists alongside the score',
  },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Select or upload a job description',
    detail: 'Extract required skills, evidence quotes, and RADIX category mappings from any PDF/DOCX JD.',
    route: '/app/jd-analytics',
  },
  {
    step: '02',
    title: 'Upload and parse your resume',
    detail: 'Pull structured technical signal, academic history, projects, and internships from your CV.',
    route: '/app/resume-parsing',
  },
  {
    step: '03',
    title: 'Build or update your candidate profile',
    detail: 'Enrich your profile beyond the resume with hackathons, certifications, proficiency ratings, and target roles.',
    route: '/app/profile',
  },
  {
    step: '04',
    title: 'Run Talent Check against a selected company',
    detail: 'Benchmark your 12 RADIX competency levels against company expectations (Google, Microsoft, Oracle FSS).',
    route: '/app/talent-check',
  },
  {
    step: '05',
    title: 'Run Skill Matching against a specific job posting',
    detail: 'See your exact match score, matched competencies, and specific missing skills for one target role.',
    route: '/app/skill-matching',
  },
];

const FAQ_ITEMS = [
  {
    q: 'What is RADIX Talent Match?',
    a: 'RADIX Talent Match is a candidate-centric job-readiness and skill-matching workspace developed for the RADIX Talent Match Hackathon. It flips the traditional placement lens so candidates can evaluate their own skills, company readiness, and role-specific gaps using a unified 12-skillset framework.',
  },
  {
    q: 'What is the difference between Talent Check and Skill Matching?',
    a: "Talent Check (Module 04) compares your saved candidate profile against a company's overall engineering bar across all 12 RADIX skill categories (e.g., Google LLC, Microsoft Corporation, or Oracle Financial Services Software). Skill Matching (Module 05) compares your profile against one specific job description (e.g., Google Data Scientist vs. Google Software Engineer) and outputs matched skills, missing skills, and a role match score.",
  },
  {
    q: 'What documents can I upload?',
    a: 'Both JD Analytics and Resume Parsing validate PDF (.pdf) and Microsoft Word (.docx) files. You can also test immediately using the 6 built-in hackathon job descriptions and 4 deliberately distinct sample candidate profiles (Ananya Rao, Karthik Subramaniam, Priya Menon, and Rohan Verma).',
  },
  {
    q: 'What are the 12 skill categories?',
    a: 'Every extracted or user-added skill is tagged with one of 12 canonical RADIX category codes: Coding (COD), Data Structures & Algorithms (DSA), Object-Oriented Design (OOD), Aptitude (APTI), Communication (COMM), AI (AI), Cloud (CLOUD), SQL (SQL), Software Engineering (SWE), System Design (SYSD), Networking (NETW), and Operating Systems (OS). Any domain-specific skill outside these twelve uses OTHER.',
  },
  {
    q: 'Can I edit my candidate profile?',
    a: 'Yes. Module 03 (Profile Builder) provides a complete multi-section editor where you can import parsed resume data, adjust 1–10 skill proficiency ratings, add hackathons, internships, certifications, preferred roles, and save changes locally.',
  },
  {
    q: 'Does the platform guarantee a job?',
    a: 'No. RADIX Talent Match is an analytical readiness and gap-discovery prototype. All readiness and match scores in this frontend workspace are illustrative calculations designed to help candidates focus their preparation.',
  },
];

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  COD: Code2,
  DSA: Layers,
  OOD: Box,
  APTI: Compass,
  COMM: MessageSquare,
  AI: Sparkles,
  CLOUD: Cloud,
  SQL: Database,
  SWE: Terminal,
  SYSD: Cpu,
  NETW: Network,
  OS: Layers,
};

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [previewCandidateIdx, setPreviewCandidateIdx] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  const previewProfiles = [
    {
      name: 'Ananya Rao',
      archetype: 'Systems-Leaning Generalist',
      targetCompany: 'Google LLC',
      targetRole: 'Software Engineer (SWE)',
      readiness: 88,
      match: 90,
      topSkills: [
        { code: 'COD', name: 'C++ / Go Systems Coding', level: 9, req: 9, gap: false },
        { code: 'DSA', name: 'Graph Algorithms & DP', level: 9, req: 9, gap: false },
        { code: 'SYSD', name: 'Distributed Consensus & Sharding', level: 8, req: 8, gap: false },
        { code: 'SQL', name: 'Distributed SQL & Indexing', level: 6, req: 7, gap: true },
      ],
    },
    {
      name: 'Karthik Subramaniam',
      archetype: 'Data-Leaning Analyst',
      targetCompany: 'Microsoft Corporation',
      targetRole: 'Data Analyst',
      readiness: 79,
      match: 92,
      topSkills: [
        { code: 'SQL', name: 'Advanced SQL & Window Functions', level: 9, req: 8, gap: false },
        { code: 'AI', name: 'PyTorch & Predictive Modeling', level: 9, req: 7, gap: false },
        { code: 'APTI', name: 'Statistical Modeling & Cohorts', level: 9, req: 7, gap: false },
        { code: 'OOD', name: 'Enterprise OOP Architecture', level: 5, req: 9, gap: true },
      ],
    },
    {
      name: 'Priya Menon',
      archetype: 'Entry-Level, Support-Oriented',
      targetCompany: 'Oracle Financial Services Software',
      targetRole: 'Application Support Analyst',
      readiness: 86,
      match: 93,
      topSkills: [
        { code: 'SQL', name: 'Oracle SQL & PL/SQL Diagnostics', level: 8, req: 9, gap: true },
        { code: 'OS', name: 'Linux Server & Log Triage', level: 8, req: 7, gap: false },
        { code: 'COMM', name: 'SLA & Incident Communication', level: 9, req: 8, gap: false },
        { code: 'NETW', name: 'TCP/IP & Gateway Diagnostics', level: 7, req: 7, gap: false },
      ],
    },
  ];

  const activePreview = previewProfiles[previewCandidateIdx];

  return (
    <div id="top" className="overflow-x-hidden">
      {/* B & C: Interactive Hero Section + Dynamic Animated Background */}
      <section className="relative min-h-[580px] lg:min-h-[640px] flex items-center py-16 lg:py-24 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-slate-50 via-white to-slate-100/70 dark:from-[#090D16] dark:via-[#0B1120] dark:to-[#090D16]">
        <TalentNetworkCanvas />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="max-w-3xl space-y-6"
          >
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400">
              <span>RADIX TALENT MATCH HACKATHON</span>
              <span aria-hidden="true">·</span>
              <span>12-SKILLSET COMPETENCY ENGINE</span>
            </div>

            <h1
              className="text-3xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12]"
              style={{ textWrap: 'balance' }}
            >
              Know Your Skills. Understand Your Gaps. Get Job-Ready.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Turn your resume and target job into a clear picture of your readiness. Discover your strengths, identify skill gaps, and understand how you match the roles you want.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link to={user ? '/app/dashboard' : '/signup'}>
                <Button variant="primary" size="lg">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg">
                  Explore Features
                </Button>
              </a>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 max-w-xl leading-relaxed">
              Unifies JD Analytics, Resume Parsing, Profile Builder, Company Talent Check, and Role Skill Matching into one candidate-first workflow backed by a single shared data contract.
            </p>
          </motion.div>
        </div>
      </section>

      {/* E. Feature Overview — The Five Modules */}
      <section id="features" className="py-20 bg-white dark:bg-[#090D16] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
              FIVE INTEGRATED MODULES · ONE SHARED SCHEMA
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Five specialized pieces wired into one candidate tool
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Every module reads and writes the canonical RADIX shared data contract, letting you move seamlessly from raw PDFs to company-level readiness and role-specific skill gaps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {FIVE_MODULES.map((mod, idx) => {
              const Icon = mod.icon;
              const colSpan = idx < 2 ? 'lg:col-span-3' : 'lg:col-span-2';
              return (
                <div
                  key={mod.number}
                  className={cn(
                    'group p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 transition-all duration-150 flex flex-col justify-between gap-5',
                    colSpan
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {mod.number} — {mod.title}
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {mod.handoff}
                    </span>
                    <Link
                      to={user ? mod.route : '/login'}
                      state={{ from: mod.route }}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <span>Explore Feature</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* F & D: How It Works — 5-Step Connected Workflow + Interactive Illustrative Demo Preview */}
      <section id="how-it-works" className="py-20 bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
              END-TO-END WORKFLOW
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              How the five modules work together
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Each stage hands structured JSON data directly to the next—eliminating manual re-entry and ensuring every score is backed by concrete skill evidence.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {WORKFLOW_STEPS.map((item) => (
              <div
                key={item.step}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      STEP {item.step}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">→</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
                <Link
                  to={user ? item.route : '/login'}
                  state={{ from: item.route }}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Step {item.step}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>

          {/* Interactive Product Preview Composition placed directly under How the five modules work together */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="animate-float rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-6 lg:p-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left 5 Columns: Candidate Switcher & Dual Score Rings */}
              <div className="lg:col-span-5 space-y-5 lg:border-r lg:border-slate-200 dark:lg:border-slate-800 lg:pr-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                    <span>ILLUSTRATIVE DEMO PREVIEW</span>
                    <span>·</span>
                    <span>SHARED CONTRACT</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {activePreview.name} — {activePreview.targetCompany}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Target Role: {activePreview.targetRole} ({activePreview.archetype})
                  </p>
                </div>

                {/* Interactive Candidate Switcher Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/90">
                  {previewProfiles.map((prof, idx) => (
                    <button
                      key={prof.name}
                      type="button"
                      onClick={() => setPreviewCandidateIdx(idx)}
                      className={cn(
                        'flex-1 py-1.5 px-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap truncate cursor-pointer',
                        previewCandidateIdx === idx
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      )}
                    >
                      {prof.name}
                    </button>
                  ))}
                </div>

                {/* Dual Score Rings */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80">
                    <ScoreRing
                      score={activePreview.readiness}
                      size={96}
                      strokeWidth={7}
                      label="Talent Check"
                      sublabel={`${activePreview.targetCompany.split(' ')[0]} Bar`}
                    />
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80">
                    <ScoreRing
                      score={activePreview.match}
                      size={96}
                      strokeWidth={7}
                      label="Skill Match"
                      sublabel={activePreview.targetRole}
                    />
                  </div>
                </div>
              </div>

              {/* Right 7 Columns: Skill Gap Visualization Bars */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Competency Gap Snapshot (1–10 Scale)
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Candidate Level vs Company Requirement
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activePreview.topSkills.map((s) => (
                    <div
                      key={s.code}
                      className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {s.code}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {s.name}
                          </span>
                        </div>
                        <span className="font-mono tabular-nums text-xs shrink-0">
                          {s.level}/10{' '}
                          <span className="text-slate-400">(Req {s.req})</span>
                        </span>
                      </div>
                      <Progress
                        value={s.level * 10}
                        tone={s.gap ? 'amber' : 'emerald'}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Illustrative demo data from the hackathon candidate & JD pack
                  </span>
                  <Link
                    to={user ? '/app/talent-check' : '/login'}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Open Full Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* G. The 12 RADIX Skill Categories */}
      <section id="categories" className="py-20 bg-white dark:bg-[#090D16] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                CANONICAL TAXONOMY
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                The 12 RADIX Skill Categories
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Every extracted skill from a job description or resume is mapped to one of these 12 core engineering & analytical categories (skills outside these twelve use <code className="font-mono text-xs">OTHER</code> internally).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RADIX_TWELVE_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICON_MAP[cat.code] || Code2;
              return (
                <div
                  key={cat.code}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/50 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {cat.code}
                    </span>
                    <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {cat.description}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-500 pt-1 truncate">
                    {cat.examples.join(' · ')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* H & I: Dashboard Preview & Why RADIX Talent Match */}
      <section id="why-radix" className="py-20 bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-5">
              <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                WHY RADIX TALENT MATCH
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Built on placement intelligence, flipped for the candidate
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Most platforms stop at keyword counting on a resume. RADIX Talent Match connects company-level competency benchmarks with job-specific requirements so you know what to study next.
              </p>

              <ul className="space-y-3.5 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Move beyond a resume-only view:
                    </span>{' '}
                    <span className="text-slate-600 dark:text-slate-400">
                      Capture hackathons, internships, certifications, and self-assessed proficiency in Profile Builder.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Compare against company expectations:
                    </span>{' '}
                    <span className="text-slate-600 dark:text-slate-400">
                      See how your 12 RADIX skill categories stack up against Google LLC, Microsoft, and Oracle FSS.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Evidence-backed skill extraction:
                    </span>{' '}
                    <span className="text-slate-600 dark:text-slate-400">
                      Every extracted skill includes a direct quote or reason plus a confidence rating (high, medium, low).
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Actionable missing-skill gap lists:
                    </span>{' '}
                    <span className="text-slate-600 dark:text-slate-400">
                      A match score without explanation isn&apos;t enough—Skill Matching highlights exact missing requirements.
                    </span>
                  </div>
                </li>
              </ul>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate(user ? '/app/dashboard' : '/signup')}
                >
                  <span>Explore Candidate Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Registered Workspace Preview Panel */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                    WORKSPACE PREVIEW
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Inside the Registered Candidate Dashboard
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  4 Sample Profiles · 6 Real JDs Ready
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50">
                  <span className="text-xs text-slate-500">Profile Completeness</span>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                    100%
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    12/12 Categories Tagged
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50">
                  <span className="text-xs text-slate-500">Talent Check Bar</span>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                    88 / 100
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Google LLC Benchmark</p>
                </div>
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50">
                  <span className="text-xs text-slate-500">Latest Role Match</span>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                    90 / 100
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">SWE · Bengaluru</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Sample Candidate Matrix Included in Workspace
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500">
                        <th className="py-2.5 px-3 font-medium">Candidate</th>
                        <th className="py-2.5 px-3 font-medium">Profile Archetype</th>
                        <th className="py-2.5 px-3 font-medium">Primary Strength</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          Ananya Rao
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          Systems-leaning generalist
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          Strong fit for SWE roles (COD, DSA, SYSD, OS)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          Karthik Subramaniam
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          Data-leaning analyst
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          Strong fit for Data Scientist & Analyst roles (SQL, AI, APTI)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          Priya Menon
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          Entry-level, support-oriented
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          Best fit for Oracle FSS roles (SQL, OS, COMM, NETW)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          Rohan Verma
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          Strong all-rounder
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          Competitive across SWE, Data, and Cloud roles
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* J. FAQ Accordion */}
      <section id="faq" className="py-20 bg-white dark:bg-[#090D16]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-2 text-center">
            <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
              FREQUENTLY ASKED QUESTIONS
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Everything you need to know about RADIX Talent Match
            </h2>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className="p-5">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-slate-500 transition-transform duration-150 shrink-0',
                        isOpen && 'rotate-180 text-indigo-600 dark:text-indigo-400'
                      )}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
