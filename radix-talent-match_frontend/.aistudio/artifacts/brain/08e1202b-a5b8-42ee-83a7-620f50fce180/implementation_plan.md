# Empty-State & Strict Cross-Module Import Validation Plan

## Overview
We will remove pre-seeded sample fallbacks across Modules 01–05 so that **Module 03 (Profile Builder)** starts empty until you either import a parsed resume from **Module 02 (Resume Parsing)** or manually fill and save your profile. In **Module 04 (Talent Check)** and **Module 05 (Skill Matching)**, the **Import from Profile Builder** and **Import from JD Analytics** dropdown options will strictly require real session data from Module 03 and Module 01 respectively, and will be **disabled** in the dropdown whenever the corresponding source module is empty.

---

## Key Changes

### 1. Empty Session Initialization & Profile Session Persistence (`WorkspaceContext.tsx`)
- **Empty Initial Profile**:
  - Replace the pre-seeded sample candidate (`Ananya Rao`) initialization with an empty `CandidateProfile` (`name: ''`, `email: ''`, `phone: ''`, `summary: ''`, `skills: []`, `education: []`, `projects: []`, `internships: []`, `hackathons: []`, `certifications: []`, `preferred_roles: []`, `completeness_score: 0`).
  - Add an `activeProfileSession` state persisted in `localStorage` (`radix_tm_active_profile_session_v1`) with `{ hasSavedProfile: boolean, profile: CandidateProfile }`.
  - Set `hasSavedProfile: true` only when the user explicitly clicks **Save Profile** in Module 03 or clicks **Import Parsed Resume** in Module 03 (when Module 02 has a parsed resume).
  - Clear `activeProfileSession` (along with `activeJDSession`, `activeResumeSession`, `activeTalentCheckSession`, and `activeSkillMatchSession`) upon user sign-out.
- **Remove Sample Fallbacks**:
  - Initialize `latestParsedResume` from `activeResumeSession.displayedResume` (`null` when Module 02 is empty) instead of `SAMPLE_PARSED_RESUMES[0]`.
  - Stop pre-seeding `analyzedJDs`, `talentCheckHistory`, and `skillMatchHistory` with sample records when Modules 01–03 are empty.

### 2. Module 03 (`ProfileBuilderPage.tsx`) — Start Empty & Strict Module 02 Import
- **Start Empty**:
  - Display empty form fields and an empty Live Profile Preview until the user enters details and saves or imports from Module 02.
- **Import Parsed Resume Guard**:
  - Disable the **Import Parsed Resume** button when Module 02 (`activeResumeSession.hasParsed && activeResumeSession.displayedResume`) has no parsed resume, preventing any fallback to sample candidate data.

### 3. Module 04 (`TalentCheckPage.tsx`) & Module 05 (`SkillMatchingPage.tsx`) — Disabled Import Options When Source Modules Are Empty
- **Strict Source Checks**:
  - `hasProfileData`: `Boolean(activeProfileSession.hasSavedProfile && activeProfile.name.trim())`
  - `hasJDData`: `Boolean(activeJDSession.hasAnalyzed && activeJDSession.displayedResult)` (removing the `|| analyzedJDs[0]` fallback).
- **Disable Dropdown Options Until Data Exists**:
  - In **1. Select Candidate Profile (From Profile Builder)**:
    - Disable the `Import from Profile Builder` `<option>` when `!hasProfileData` (displaying `Import from Profile Builder (No Profile in Module 03)` as disabled), and display a helper message below the select box guiding the user to Module 03 when empty.
  - In **2. Select Target Company Benchmark / Target Job Posting (From JD Analytics)**:
    - Disable the `Import from JD Analytics` `<option>` when `!hasJDData` (displaying `Import from JD Analytics (No JD Analyzed in Module 01)` as disabled), and display a helper message below the select box guiding the user to Module 01 when empty.
  - Reset any stale selection if the underlying module has no data.
