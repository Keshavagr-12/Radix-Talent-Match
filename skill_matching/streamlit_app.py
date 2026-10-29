"""
Streamlit Standalone Dashboard for RADIX Skill Matching (Role 5).
Matches a Candidate Profile against one specific Job Description from Role 1 JD Analytics.
Prioritizes the missing-skill gap list over raw numbers, with deep explanations
and actionable interview/project recommendations.
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime, timezone
import requests
import streamlit as st
import pandas as pd
from dotenv import load_dotenv

# Ensure module path resolution
sys.path.insert(0, str(Path(__file__).resolve().parent))

load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()

from core.profile_loader import list_candidate_profiles
from core.jd_loader import list_extracted_jds
from core.llm_matcher import run_llm_skill_matching
from core.gap_analyzer import build_gap_analysis
from core.storage_service import save_match_result, list_matches

# Set page config
st.set_page_config(
    page_title="RADIX Skill Matching & Gap Analysis",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .metric-card {
        background-color: #ffffff;
        border-radius: 12px;
        padding: 20px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .gap-card-critical {
        background-color: #fef2f2;
        border: 1px solid #fecaca;
        border-left: 5px solid #ef4444;
        border-radius: 8px;
        padding: 14px 18px;
        margin-bottom: 12px;
    }
    .gap-card-moderate {
        background-color: #fffbeb;
        border: 1px solid #fde68a;
        border-left: 5px solid #f59e0b;
        border-radius: 8px;
        padding: 14px 18px;
        margin-bottom: 12px;
    }
    .match-card {
        background-color: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-left: 5px solid #10b981;
        border-radius: 8px;
        padding: 14px 18px;
        margin-bottom: 12px;
    }
    .badge-critical {
        background-color: #fee2e2;
        color: #991b1b;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 11px;
    }
    .badge-matched {
        background-color: #dcfce7;
        color: #166534;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 11px;
    }
    .badge-partial {
        background-color: #fef3c7;
        color: #92400e;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 11px;
    }
</style>
""", unsafe_allow_html=True)

st.title("🎯 RADIX Skill Matching & Missing Gap Analysis")
st.caption("Role 5 · Compares candidate profiles against specific Job Descriptions from Role 1 JD Analytics. Prioritizes actionable missing-skill gaps over raw numbers.")

# Sidebar: Controls & Selection
with st.sidebar:
    st.header("⚙️ Selection & Input Source")

    # 1. Candidate Source
    st.subheader("1. Candidate Profile (Role 3)")
    cand_options = list_candidate_profiles()
    cand_names = [f"{c['name']} ({c['skills_count']} skills)" for c in cand_options]
    cand_names.append("✏️ Custom Candidate Entry")

    selected_cand_idx = st.selectbox(
        "Select Candidate Profile:",
        range(len(cand_names)),
        format_func=lambda i: cand_names[i]
    )

    if selected_cand_idx < len(cand_options):
        active_candidate = cand_options[selected_cand_idx]["profile"]
        st.success(f"Loaded: **{active_candidate.get('name')}**")
        st.caption(f"{len(active_candidate.get('skills', []))} verified skills imported from Profile Builder.")
    else:
        st.info("Define custom candidate profile below:")
        cand_name_input = st.text_input("Candidate Name", value="Jane Doe")
        cand_skills_raw = st.text_area(
            "Skills (Name, Category, Level)",
            value="Python, COD, 8\nData Structures, DSA, 9\nDocker, CLOUD, 7\nPostgreSQL, SQL, 8"
        )
        custom_skills = []
        for line in cand_skills_raw.strip().split("\n"):
            parts = [p.strip() for p in line.split(",") if p.strip()]
            if len(parts) >= 2:
                custom_skills.append({
                    "skill_name": parts[0],
                    "category_code": parts[1].upper(),
                    "proficiency_level": float(parts[2]) if len(parts) > 2 else 7.0,
                    "evidence": f"Custom skill entry: {parts[0]}"
                })
        active_candidate = {
            "name": cand_name_input,
            "skills": custom_skills
        }

    st.divider()

    # 2. JD Source
    st.subheader("2. Target Job Posting (Role 1)")
    jd_options = list_extracted_jds()
    jd_names = [f"{j['role']} @ {j['company']} ({j['skills_count']} skills)" for j in jd_options]
    jd_names.append("✏️ Custom Job Description Entry")

    selected_jd_idx = st.selectbox(
        "Select Extracted JD Posting:",
        range(len(jd_names)),
        format_func=lambda i: jd_names[i]
    )

    if selected_jd_idx < len(jd_options):
        active_jd = jd_options[selected_jd_idx]["jd_data"]
        st.success(f"Target: **{active_jd.get('role')}** @ **{active_jd.get('company')}**")
        st.caption(f"Source: {active_jd.get('source_file')} ({len(active_jd.get('skills', []))} extracted requirements)")
    else:
        st.info("Define custom target JD below:")
        jd_company_input = st.text_input("Company Name", value="Google LLC")
        jd_role_input = st.text_input("Role Title", value="Software Engineer")
        jd_skills_raw = st.text_area(
            "JD Requirements (Name, Category, Confidence)",
            value="Python, COD, high\nData Structures, DSA, high\nKubernetes, CLOUD, high\nGo, COD, high\nDistributed Systems, SYSD, high"
        )
        custom_jd_skills = []
        for line in jd_skills_raw.strip().split("\n"):
            parts = [p.strip() for p in line.split(",") if p.strip()]
            if len(parts) >= 2:
                custom_jd_skills.append({
                    "skill_name": parts[0],
                    "category_code": parts[1].upper(),
                    "confidence": parts[2].lower() if len(parts) > 2 else "high",
                    "evidence": f"Target requirement: {parts[0]}"
                })
        active_jd = {
            "company": jd_company_input,
            "role": jd_role_input,
            "source_file": "Custom Input JD",
            "skills": custom_jd_skills
        }

    st.divider()
    run_btn = st.button("🚀 Run Skill Matching & Gap Analysis", type="primary", width="stretch")

# Main Page Area
if "latest_match" not in st.session_state:
    st.session_state.latest_match = None

if run_btn:
    with st.spinner("Analyzing candidate profile against job description..."):
        try:
            cand_skills = active_candidate.get("skills", [])
            jd_skills = active_jd.get("skills", [])

            if not jd_skills:
                st.error("Selected Job Description has 0 skills. Please select a valid JD.")
            else:
                matched, missing, partial, earned_pts = run_llm_skill_matching(
                    jd_skills=jd_skills,
                    candidate_skills=cand_skills,
                    company=active_jd.get("company", "Target Company"),
                    role=active_jd.get("role", "Target Role")
                )

                total_pts = len(jd_skills) * 10.0
                score = min(100, max(0, int(round((earned_pts / max(total_pts, 1.0)) * 100.0))))

                gap_summary = build_gap_analysis(
                    jd_skills=jd_skills,
                    matched_skills=matched,
                    missing_skills=missing,
                    partial_skills=partial,
                    company=active_jd.get("company", "Target Company"),
                    role=active_jd.get("role", "Target Role")
                )

                match_record = {
                    "id": f"sm-{int(datetime.now().timestamp())}",
                    "candidate_name": active_candidate.get("name", "Candidate"),
                    "company": active_jd.get("company", "Target Company"),
                    "role": active_jd.get("role", "Target Role"),
                    "jd_source_file": active_jd.get("source_file", "Job Description"),
                    "match_score": score,
                    "matched_skills": matched,
                    "missing_skills": missing,
                    "partial_skills": [p.model_dump() if hasattr(p, "model_dump") else p for p in partial],
                    "gap_analysis": gap_summary.model_dump(),
                    "evaluated_at": datetime.now(timezone.utc).isoformat()
                }

                # Save record
                save_match_result(match_record)
                st.session_state.latest_match = match_record
                st.toast(f"Skill Match Completed: {score}/100", icon="✅")

        except Exception as exc:
            st.error(f"Error executing skill match: {exc}")

# Display Match Results
res = st.session_state.latest_match

if res:
    st.markdown(f"### 📋 Match Analysis: **{res['candidate_name']}** → **{res['role']}** ({res['company']})")
    st.caption(f"Evaluated against: `{res['jd_source_file']}` at {res['evaluated_at']}")

    # Metric Row
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.metric("Skill Match Score", f"{res['match_score']}%", delta=f"{res['match_score'] - 50}% vs Base")
    with c2:
        st.metric("Total JD Skills", len(res['matched_skills']) + len(res['missing_skills']))
    with c3:
        st.metric("Verified Matched Skills", len(res['matched_skills']))
    with c4:
        st.metric("Missing Skills (Gaps)", len(res['missing_skills']), delta_color="inverse")

    st.progress(res['match_score'] / 100.0)

    st.write("")

    # PRIORITY 1: MISSING SKILLS & GAP LIST (USER DIRECTIVE: PRIORITIZE THE GAP LIST OVER NUMBER)
    st.subheader(f"🚨 Priority 1: Missing Skills & Gap Breakdown ({len(res['missing_skills'])})")
    st.info("💡 **Design Directive**: Prioritizing the gap list over numbers. Below is the detailed breakdown of what is missing, why it constitutes a gap, and how to bridge it.")

    if not res['missing_skills']:
        st.success("🎉 Outstanding! Your candidate profile covers 100% of the extracted requirements for this job posting.")
    else:
        gap_data = res.get("gap_analysis") or {}
        crit_gaps = gap_data.get("critical_gaps", [])
        mod_gaps = gap_data.get("moderate_gaps", [])

        # Display Top Recommendations Banner
        top_recs = gap_data.get("top_recommendations", [])
        if top_recs:
            st.markdown("#### 🎯 Actionable Preparation Steps for This Specific Posting:")
            for i, rec in enumerate(top_recs, 1):
                st.markdown(f"**{i}.** {rec}")

        st.write("")

        # Critical Gaps
        if crit_gaps:
            st.markdown(f"##### 🔴 Critical Missing Requirements ({len(crit_gaps)}) — High Priority in JD:")
            for g in crit_gaps:
                with st.container():
                    st.markdown(f"""
                    <div class="gap-card-critical">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 700; font-size: 15px; color: #7f1d1d;">{g['skill_name']}</span>
                            <span class="badge-critical">{g['category_code']} · {g['category_title']}</span>
                        </div>
                        <p style="margin: 6px 0; font-size: 13px; color: #475569;">
                            <strong>Posting Evidence:</strong> <em>"{g['evidence']}"</em>
                        </p>
                        <p style="margin: 4px 0; font-size: 12.5px; color: #991b1b;">
                            <strong>Why This is a Gap:</strong> {g['gap_explanation']}
                        </p>
                        <p style="margin: 4px 0; font-size: 12.5px; color: #1e293b;">
                            <strong>Actionable Recommendation:</strong> {g['recommendation']}
                        </p>
                    </div>
                    """, unsafe_allow_html=True)

        # Moderate Gaps
        if mod_gaps:
            st.markdown(f"##### 🟡 Moderate & Adjacent Gaps ({len(mod_gaps)}):")
            for g in mod_gaps:
                with st.container():
                    st.markdown(f"""
                    <div class="gap-card-moderate">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 700; font-size: 15px; color: #78350f;">{g['skill_name']}</span>
                            <span class="badge-partial">{g['category_code']} · {g['category_title']}</span>
                        </div>
                        <p style="margin: 6px 0; font-size: 13px; color: #475569;">
                            <strong>Posting Requirement:</strong> <em>"{g['evidence']}"</em>
                        </p>
                        <p style="margin: 4px 0; font-size: 12.5px; color: #92400e;">
                            <strong>Gap Details:</strong> {g['gap_explanation']}
                        </p>
                        <p style="margin: 4px 0; font-size: 12.5px; color: #1e293b;">
                            <strong>Actionable Recommendation:</strong> {g['recommendation']}
                        </p>
                    </div>
                    """, unsafe_allow_html=True)

    st.divider()

    # Partial Matches Section
    partial_list = res.get("partial_skills", [])
    if partial_list:
        st.subheader(f"⚡ Partially Matched / Adjacent Competencies ({len(partial_list)})")
        for p in partial_list:
            js = p.get("jd_skill", {})
            cs = p.get("candidate_skill", {})
            note = p.get("similarity_note", "")
            with st.container():
                st.markdown(f"""
                <div class="gap-card-moderate">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>JD Requirement: {js.get('skill_name')} ({js.get('category_code')})</strong>
                        <span class="badge-partial">Candidate Foundation: {cs.get('skill_name')}</span>
                    </div>
                    <p style="margin: 6px 0; font-size: 13px; color: #1e293b;">{note}</p>
                </div>
                """, unsafe_allow_html=True)

        st.divider()

    # Matched Skills Section
    st.subheader(f"✅ Verified Matched Skills ({len(res['matched_skills'])})")
    if res['matched_skills']:
        matched_cols = st.columns(2)
        for i, ms in enumerate(res['matched_skills']):
            col = matched_cols[i % 2]
            with col:
                st.markdown(f"""
                <div class="match-card">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: #065f46;">{ms['skill_name']}</span>
                        <span class="badge-matched">{ms.get('category_code', 'OTHER')} · Match</span>
                    </div>
                    <p style="margin: 6px 0; font-size: 12.5px; color: #334155;">
                        <strong>Candidate Evidence:</strong> {ms.get('evidence', 'Demonstrated in profile')}
                    </p>
                    <p style="margin: 2px 0; font-size: 11.5px; color: #059669;">
                        <em>{ms.get('match_explanation', 'Validated match')}</em>
                    </p>
                </div>
                """, unsafe_allow_html=True)

else:
    st.info("👈 Select a Candidate Profile and a Target Job Posting in the sidebar, then click **'Run Skill Matching & Gap Analysis'** to view the match score and prioritized missing skill breakdown.")

# Match History
st.divider()
st.subheader("📜 Match Evaluation History (Real Data Only)")
history = list_matches()
if history:
    history_df = pd.DataFrame([
        {
            "Timestamp": h.get("evaluated_at", h.get("saved_at", ""))[:19].replace("T", " "),
            "Candidate": h.get("candidate_name"),
            "Company": h.get("company"),
            "Role": h.get("role"),
            "Match Score": f"{h.get('match_score')}%",
            "Matched Skills": len(h.get("matched_skills", [])),
            "Missing Skills": len(h.get("missing_skills", []))
        }
        for h in reversed(history[-10:])
    ])
    st.dataframe(history_df, width="stretch")
else:
    st.caption("No evaluations performed yet. History begins empty (zero mock data seeded).")
