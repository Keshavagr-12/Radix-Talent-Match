"""
Streamlit Dashboard for RADIX Talent Check (Port 8004).
Automatically loads:
1. Real candidate profiles from the Candidate Profile folder (profile_builder/backend/data/profiles.json).
2. Exact proficiency_level for each skill parsed from the candidate's resume.
3. Company expectation bars from Supabase table company_skill_levels_staging / snapshot.
4. Compares candidate proficiency against target company across all 12 RADIX categories.
"""

import sys
from pathlib import Path

# Add backend directory to path
_backend_dir = str(Path(__file__).resolve().parent / "backend")
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

import streamlit as st
import requests
import pandas as pd
from core.candidate_profile_loader import load_all_candidate_profiles

API_BASE = "http://127.0.0.1:8004"
CHECK_URL = f"{API_BASE}/talent-check/check"
COMPANIES_URL = f"{API_BASE}/talent-check/companies"
CANDIDATES_URL = f"{API_BASE}/talent-check/candidates"

SKILLS = [
    "COD", "DSA", "SYSD", "SWE", "CLOUD", "SQL",
    "AI", "OS", "NETW", "OOD", "APTI", "COMM"
]

SKILL_NAMES = {
    "COD": "Core Coding & Syntax",
    "DSA": "Data Structures & Algos",
    "SYSD": "System Design",
    "SWE": "SWE Best Practices",
    "CLOUD": "Cloud & DevOps",
    "SQL": "Relational DB & SQL",
    "AI": "AI & Machine Learning",
    "OS": "Operating Systems",
    "NETW": "Computer Networks",
    "OOD": "Object-Oriented Design",
    "APTI": "Analytical Aptitude",
    "COMM": "Technical Communication"
}

st.set_page_config(
    page_title="RADIX Talent Check — Automated Profile Benchmark",
    page_icon="🎯",
    layout="wide"
)

st.title("🎯 RADIX Talent Check — 12-Skillset Benchmark Analysis")
st.write("Automatically loads candidate skill proficiency levels from the **Candidate Profile Folder** (parsed from resume) and benchmarks against target enterprise standards.")

# 1. Fetch available companies
@st.cache_data(ttl=30)
def fetch_companies():
    try:
        resp = requests.get(COMPANIES_URL, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) > 0:
                return data
    except Exception:
        pass
    return [
        {"company_name": "Google LLC", "short_name": "Google"},
        {"company_name": "Microsoft Corporation", "short_name": "Microsoft"},
        {"company_name": "Oracle Financial Services Software", "short_name": "Oracle"},
        {"company_name": "Amazon", "short_name": "Amazon"}
    ]

# 2. Fetch available candidates from profile builder folder
def fetch_candidates():
    # Try live backend first
    try:
        resp = requests.get(CANDIDATES_URL, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) > 0:
                return data
    except Exception:
        pass
    # Fallback to direct loader
    try:
        return load_all_candidate_profiles()
    except Exception:
        return []

companies_data = fetch_companies()
company_names = [c.get("company_name") for c in companies_data]
candidates_data = fetch_candidates()

with st.sidebar:
    st.header("🎯 Target Selection")
    selected_company = st.selectbox("1. Target Company Benchmark", company_names)

    st.header("👤 Candidate Profile Selection")
    if candidates_data:
        candidate_options = {
            f"{c['name']} ({c['headline'] or 'Candidate'} · {c['skills_count']} skills from resume)": c
            for c in candidates_data
        }
        selected_option_label = st.selectbox(
            "Select Candidate from Profile Folder",
            list(candidate_options.keys())
        )
        selected_candidate = candidate_options[selected_option_label]
    else:
        st.warning("No saved candidate profiles found in profile_builder/backend/data/profiles.json")
        selected_candidate = {
            "candidate_id": "manual-candidate",
            "name": "Candidate",
            "headline": "Engineering Candidate",
            "parsed_skills": [],
            "derived_skill_levels": {s: 6.0 for s in SKILLS}
        }

# Display Candidate Info Card
st.subheader(f"Candidate: {selected_candidate['name']}")
if selected_candidate.get("headline"):
    st.caption(f"**Headline:** {selected_candidate['headline']} | **ID:** `{selected_candidate.get('candidate_id', 'N/A')}`")

if selected_candidate.get("cv_file"):
    st.caption(f"📄 **Resume Source:** `{Path(selected_candidate['cv_file']).name}`")

# Expandable View of Skills Extracted from Resume
parsed_skills = selected_candidate.get("parsed_skills", [])
if parsed_skills:
    with st.expander(f"📋 View {len(parsed_skills)} Skills Extracted from Resume (Click to expand)", expanded=False):
        skills_df = pd.DataFrame([
            {
                "Skill Name": s.get("skill_name"),
                "Category": s.get("category_code"),
                "Proficiency Level": s.get("proficiency_level") or s.get("level") or "N/A",
                "Confidence": s.get("confidence", "medium"),
                "Evidence from Resume": s.get("evidence", "")[:120] + "..." if len(s.get("evidence", "")) > 120 else s.get("evidence", "")
            }
            for s in parsed_skills
        ])
        st.dataframe(skills_df, width="stretch")

st.markdown("---")

# Skill levels automatically populated from parsed profile
derived_levels = selected_candidate.get("derived_skill_levels", {})

st.subheader(f"Derived Candidate Proficiency Levels (from Resume Profile)")
st.caption("These levels are **automatically extracted from the candidate's resume/profile**. You can fine-tune if needed before running comparison.")

skill_levels = {}
cols = st.columns(3)

for i, skill in enumerate(SKILLS):
    with cols[i % 3]:
        # Default value is the actual proficiency level derived from resume!
        default_val = float(derived_levels.get(skill, 0.0))
        # Ensure it is between 0 and 10
        clamped_val = max(0.0, min(10.0, default_val))

        label = f"{skill} — {SKILL_NAMES.get(skill, skill)}"
        skill_levels[skill] = st.slider(
            label,
            min_value=0.0,
            max_value=10.0,
            value=clamped_val,
            step=0.5,
            key=f"skill_{selected_candidate.get('candidate_id', 'cand')}_{skill}"
        )

st.markdown("---")

# Single Comparison Action Button
if st.button(f"Compare {selected_candidate['name']}'s Profile Against {selected_company} Bar (12 Skillsets)", type="primary"):
    payload = {
        "company": selected_company,
        "candidate": {
            "candidate_id": selected_candidate.get("candidate_id", "candidate-001"),
            "name": selected_candidate.get("name", "Candidate"),
            "skills": [
                {"category_code": skill, "level": float(level)}
                for skill, level in skill_levels.items()
            ]
        }
    }

    try:
        with st.spinner(f"Evaluating readiness against {selected_company}..."):
            response = requests.post(CHECK_URL, json=payload, timeout=10)

        if response.status_code == 200:
            result = response.json()
            st.success("Comparison completed successfully!")

            # Key Metrics Cards
            m1, m2, m3, m4 = st.columns(4)
            score = result.get("readiness_score", 0.0)
            status_label = result.get("readiness_label", "Ready")
            met_count = result.get("met_categories_count", 0)
            gap_count = result.get("gap_categories_count", 0)

            m1.metric("Readiness Score", f"{score:.1f}%")
            m2.metric("Verdict", status_label)
            m3.metric("Categories Met", f"{met_count} / 12")
            m4.metric("Categories With Gap", f"{gap_count} / 12")

            st.info(result.get("summary", ""))

            # Detailed 12-Skillset Gap Table
            st.subheader(f"12-Skillset Detailed Gap Analysis ({selected_candidate['name']} vs. {selected_company})")
            gaps = result.get("skillset_gap", [])
            df = pd.DataFrame([
                {
                    "Category": item["category_code"],
                    "Name": item.get("category_name", item["category_code"]),
                    "Company Required": item["required_level"],
                    "Candidate Level (from Resume)": item["candidate_level"],
                    "Gap Deficit": item["gap_amount"],
                    "Status": "⚠️ NEEDS GAP REMEDIATION" if item["gap"] else "✅ READY / MEETS BAR"
                }
                for item in gaps
            ])
            st.dataframe(df, width="stretch")

            # Actionable Gaps
            gap_skills = [item for item in gaps if item["gap"]]
            if gap_skills:
                st.subheader("⚠️ Priority Remediation Areas")
                for item in gap_skills:
                    st.warning(
                        f"**{item['category_code']}** ({item.get('category_name', '')}): "
                        f"Candidate assessed {item['candidate_level']}/10 vs Required {item['required_level']}/10 "
                        f"(Deficit: -{item['gap_amount']} levels)"
                    )
            else:
                st.balloons()
                st.success("🎉 All 12 assessed categories meet or exceed the target company bar!")

        else:
            st.error(f"Backend returned error {response.status_code}: {response.text}")

    except requests.RequestException:
        st.error(
            f"Cannot connect to Talent Check backend at {API_BASE}. "
            "Ensure FastAPI is running on port 8004."
        )
