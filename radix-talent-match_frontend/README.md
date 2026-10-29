# RADIX Talent Match — Candidate Readiness & Skill Matching Platform

Production-grade React + TypeScript frontend developed for the **RADIX Talent Match Hackathon**.

The platform flips the traditional placement lens so candidates can evaluate:
1. **01 — JD Analytics**: What skills, technologies, and RADIX competency categories a job description requires.
2. **02 — Resume Parsing**: What structured skills, projects, education, and experience their resume demonstrates.
3. **03 — Profile Builder**: How to maintain a complete candidate profile (including 1–10 skill proficiency levels, hackathons, internships, certifications, preferred roles, and CV reference).
4. **04 — Talent Check**: How ready they are against a company's expected bar (**Google LLC**, **Microsoft Corporation**, **Oracle Financial Services Software**) across all **12 RADIX skill categories**.
5. **05 — Skill Matching**: How closely they match one specific job posting, prioritizing a clear **missing-skills gap list** alongside the match score.

---

## 1. Quick Start & Development Commands

```bash
# Install dependencies
npm install

# Start Vite development server on port 3000
npm run dev

# Type-check with TypeScript
npm run lint

# Build for production
npm run build
```

---

## 2. Application Routes

### Public & Auth Routes
- `/` — Interactive Landing Page with custom Canvas Talent Network visualization, live candidate preview, 5-module overview, 5-step workflow, 12 RADIX categories, and FAQ.
- `/login` — Mock Candidate Sign-In with 1-click persona pre-fill for the 4 hackathon sample candidates.
- `/signup` — Mock Candidate Registration.

### Protected Workspace Routes (`/app/*`)
- `/app/dashboard` — Candidate Readiness Overview (12-category Radar Chart, completeness metrics, dynamic recommendations, recent matches, activity feed).
- `/app/jd-analytics` — **Role 1: JD Analytics** (6 hackathon JDs + PDF/DOCX dropzone, category distribution, shared JSON inspector, searchable/filterable skills table).
- `/app/resume-parsing` — **Role 2: Resume Parsing** (4 hackathon candidate resumes + PDF/DOCX validation, extracted skills/projects/education, one-click *Import into Profile Builder*).
- `/app/profile` — **Role 3: Profile Builder** (8-section editor, 1–10 proficiency sliders, draft/save persistence, completeness checklist).
- `/app/talent-check` — **Role 4: Talent Check** (12-category readiness comparison against Google LLC, Microsoft Corporation, and Oracle Financial Services Software).
- `/app/skill-matching` — **Role 5: Skill Matching** (Job-specific skill comparison displaying match score, missing skills gap list, matched skills, and partial similarity notes).
- `/app/history` — Session history for Talent Check runs, Skill Matching runs, and workspace timeline.
- `/app/notifications` — Workspace notifications and hand-off alerts.
- `/app/help` — Shared Data Contract JSON schemas & Backend Integration Reference.
- `/app/settings` — Light, Dark, and System theme switching, Reduced Motion toggle, active candidate switcher, and local storage reset.

---

## 3. Project Folder Structure

```text
src/
├── app/
│   └── router.tsx                  # React Router configuration & route guards
├── components/
│   ├── layout/
│   │   ├── PublicLayout.tsx        # Marketing header, mobile menu, legal modals, footer
│   │   ├── AuthLayout.tsx          # Centered auth shell with redirect guard
│   │   └── DashboardLayout.tsx     # Persistent collapsible sidebar, topbar, candidate switcher
│   └── ui/
│       ├── RadixLogo.tsx           # Geometric orbital SVG mark + wordmark
│       └── primitives.tsx          # Button, Input, Select, ScoreRing, Progress, FileUpload, Modal, etc.
├── context/
│   ├── ThemeContext.tsx            # Light / Dark / System theme + Reduced Motion persistence
│   ├── AuthContext.tsx             # Mock authentication session provider
│   └── WorkspaceContext.tsx        # Connected state across all 5 RADIX modules
├── data/
│   ├── radixCategories.ts          # Canonical 12 RADIX skill categories + OTHER
│   └── mockDataset.ts              # 3 Companies, 6 Sample JDs, 4 Sample Candidates (Ananya, Karthik, Priya, Rohan)
├── features/
│   ├── landing/
│   │   ├── TalentNetworkCanvas.tsx # Custom HTML5 Canvas skill-node constellation
│   │   └── LandingPage.tsx         # Complete public homepage
│   ├── auth/
│   │   └── AuthPages.tsx           # LoginPage & SignupPage (React Hook Form + Zod)
│   ├── dashboard/
│   │   └── DashboardPage.tsx       # Main candidate dashboard with Recharts Radar
│   ├── jd-analytics/
│   │   └── JDAnalyticsPage.tsx     # Role 1: JD Analytics
│   ├── resume-parsing/
│   │   └── ResumeParsingPage.tsx   # Role 2: Resume Parsing
│   ├── profile-builder/
│   │   └── ProfileBuilderPage.tsx  # Role 3: Profile Builder
│   ├── talent-check/
│   │   └── TalentCheckPage.tsx     # Role 4: Talent Check
│   ├── skill-matching/
│   │   └── SkillMatchingPage.tsx   # Role 5: Skill Matching
│   ├── settings/
│   │   └── SettingsPage.tsx        # Theme, reduced motion, and demo storage controls
│   └── history/
│       └── HistoryAndHelpPages.tsx # History, Notifications, and Shared Data Contract guide
├── services/
│   ├── api/
│   │   └── config.ts               # Centralized VITE_API_BASE_URL & endpoint map
│   ├── interfaces/
│   │   └── index.ts                # Service contracts for all 5 backend modules
│   └── mock/
│       └── index.ts                # Deterministic mock implementations & scoring logic
├── types/
│   └── radix.ts                    # Shared Data Contract TypeScript interfaces
└── utils/
    └── cn.ts                       # Class merging & date formatting helpers
```

---

## 4. Demo Accounts & Sample Data

On `/login` (or at any time via the sidebar **Active Demo Candidate** dropdown), you can switch between the four sample candidates defined in the hackathon brief:
- **Ananya Rao** (`cand-ananya`) — Systems-leaning generalist (Strong fit for Google/Microsoft SWE roles, weaker fit for pure data roles).
- **Karthik Subramaniam** (`cand-karthik`) — Data-leaning analyst (Strong fit for Google Data Scientist & Microsoft Data Analyst roles).
- **Priya Menon** (`cand-priya`) — Entry-level, support-oriented (Best fit for Oracle Financial Services Software roles).
- **Rohan Verma** (`cand-rohan`) — Strong all-rounder (Competitive across nearly every role in the pack).

---

## 5. Connecting the 5 Backend Modules Later

All UI components are decoupled from mock logic through `src/services/interfaces/index.ts`. To connect your Python / LangChain / Supabase backend services:
1. Configure `VITE_API_BASE_URL` and `VITE_USE_MOCK_API="false"` in `.env`.
2. Update endpoint paths if needed in `src/services/api/config.ts`.
3. Implement HTTP client classes matching `IJDAnalyticsService`, `IResumeParsingService`, `IProfileService`, `ITalentCheckService`, and `ISkillMatchingService` returning the shared JSON contract defined in `src/types/radix.ts`.

---

## 6. Known Frontend-Only Prototype Limitations
- Document uploads (`.pdf`, `.docx`) validate file extensions and file sizes client-side and run through deterministic mock extraction rather than a live LLM parser until the backend is connected.
- Authentication is a local browser session simulation (`localStorage`) for hackathon demonstration and does not verify passwords against a server.
- Company skillset benchmarks (`talent_check_company_skillsets.json` snapshot) are illustrative hackathon evaluation bars.
