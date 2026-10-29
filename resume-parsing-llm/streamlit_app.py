"""
Streamlit Web Application for RADIX Resume Parsing (Module 02 · Role 2).
Allows standalone inspection, testing, and exploration of resume extraction.

Run with:
    streamlit run streamlit_app.py
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime, timezone

# Ensure UTF-8 output streams on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Ensure parent directory is in Python path for standalone imports
_this_dir = Path(__file__).resolve().parent
if str(_this_dir) not in sys.path:
    sys.path.insert(0, str(_this_dir))

import streamlit as st

# Resilient imports from app package
try:
    from app.config import PORT, GROQ_API_KEY, GROQ_MODEL, DATA_DIR, STORAGE_FILE
    from app.extractor import extract_text
    from app.parser import parse_resume_content, parse_resume_rule_based
    from app.storage import get_all_resumes, get_resume_by_id, save_resume, delete_resume
    from app.schemas import ParsedResumeOutput
except (ImportError, ValueError):
    from config import PORT, GROQ_API_KEY, GROQ_MODEL, DATA_DIR, STORAGE_FILE
    from extractor import extract_text
    from parser import parse_resume_content, parse_resume_rule_based
    from storage import get_all_resumes, get_resume_by_id, save_resume, delete_resume
    from schemas import ParsedResumeOutput

# -------------------------------------------------------------
# PAGE CONFIGURATION
# -------------------------------------------------------------
st.set_page_config(
    page_title="RADIX Resume Parsing",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .metric-card {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
        text-align: center;
    }
    .badge-cod { background-color: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
    .badge-dsa { background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
    .badge-cloud { background-color: #e0f2fe; color: #075985; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
    .badge-sql { background-color: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
    .badge-ai { background-color: #fae8ff; color: #86198f; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
    .badge-other { background-color: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
</style>
""", unsafe_allow_html=True)

# -------------------------------------------------------------
# SIDEBAR
# -------------------------------------------------------------
with st.sidebar:
    st.title("⚙️ Engine Status")
    
    # Engine status indicators
    llm_status = "🟢 Groq LLM Active" if GROQ_API_KEY else "🟡 Rule-based Fallback"
    st.write(f"**Parser Engine:** {llm_status}")
    if GROQ_API_KEY:
        st.caption(f"Model: `{GROQ_MODEL}`")
    else:
        st.caption("No GROQ_API_KEY found; utilizing deterministic regex taxonomy.")
        
    st.write(f"**FastAPI Microservice Port:** `8002`")
    st.write(f"**Storage Path:** `{STORAGE_FILE.name}`")
    
    st.divider()
    
    # Saved Resumes in Storage
    st.subheader("📚 Saved Resumes in Store")
    saved_list = get_all_resumes()
    st.caption(f"Total stored in database: **{len(saved_list)}**")
    
    selected_stored_id = None
    if saved_list:
        options = {f"{r.get('candidate_name', 'Unknown')} ({r.get('id', '')})": r.get('id') for r in saved_list}
        selected_label = st.selectbox("Select saved candidate to view:", list(options.keys()), key="sidebar_select_cand")
        selected_stored_id = options.get(selected_label)
        
        if st.button("🗑️ Delete Selected Resume", type="secondary"):
            if selected_stored_id and delete_resume(selected_stored_id):
                st.success("Resume deleted.")
                st.rerun()
    else:
        st.info("No resumes saved yet. Upload or paste one on the right to start!")

    st.divider()
    st.caption("RADIX Talent Match Platform · Module 02 (Resume Parsing)")

# -------------------------------------------------------------
# MAIN VIEW
# -------------------------------------------------------------
st.title("📄 RADIX Resume Skill & Experience Parser")
st.caption("Module 02 · Role 2: Upload candidate resumes in multiple formats (PDF, Word, Text) to extract structured skills across the 12 RADIX categories, education, projects, and work experience.")

# If user selected a saved resume from the sidebar, load it into session state
if selected_stored_id and ("active_resume" not in st.session_state or st.session_state.get("active_resume", {}).get("id") != selected_stored_id):
    loaded = get_resume_by_id(selected_stored_id)
    if loaded:
        st.session_state["active_resume"] = loaded

tab_upload, tab_paste, tab_samples = st.tabs(["📁 Upload Resume Document", "✍️ Paste Resume Text", "📋 Saved Resumes List"])

resume_text = ""
source_filename = "resume.txt"

with tab_upload:
    uploaded_file = st.file_uploader(
        "Choose a candidate resume document",
        type=["pdf", "docx", "doc", "txt", "md", "rtf", "html", "json"],
        help="Supports PDF, Word (.docx, .doc), Plain Text (.txt, .md), and RTF."
    )
    if uploaded_file is not None:
        source_filename = uploaded_file.name
        try:
            with st.spinner("Reading and extracting text from document..."):
                resume_text = extract_text(uploaded_file.name, uploaded_file.getvalue())
            st.success(f"Successfully extracted text from **{uploaded_file.name}** ({len(resume_text):,} characters).")
            
            with st.expander("👁️ View Extracted Raw Document Text", expanded=False):
                st.text_area("Document Content Preview", resume_text, height=200, disabled=True)
        except Exception as exc:
            st.error(f"Failed to extract text from '{uploaded_file.name}': {exc}")

with tab_paste:
    pasted_text = st.text_area(
        "Paste Candidate Resume Text here:",
        height=220,
        placeholder="Paste candidate resume content here (e.g., Name, Email, Education, Technical Skills, Projects, Work Experience)...",
        help="Directly paste text to test without needing a file."
    )
    if pasted_text.strip():
        resume_text = pasted_text.strip()
        source_filename = "pasted_resume.txt"

with tab_samples:
    all_resumes = get_all_resumes()
    if all_resumes:
        st.write(f"Displaying **{len(all_resumes)}** candidate resume(s) persisted in `data/resumes.json`:")
        for r in all_resumes:
            c1, c2, c3, c4 = st.columns([3, 2, 2, 1])
            with c1:
                st.markdown(f"**{r.get('candidate_name', 'Unknown')}** · `{r.get('id')}`")
                st.caption(f"{r.get('candidate_email', '')} | {r.get('role', '')}")
            with c2:
                st.write(f"📄 `{r.get('source_file', '')}`")
                st.caption(f"{len(r.get('skills', []))} skills extracted")
            with c3:
                st.write(f"🏛️ {len(r.get('education', []))} edu | 🛠️ {len(r.get('projects', []))} proj")
            with c4:
                if st.button("View", key=f"view_{r.get('id')}"):
                    st.session_state["active_resume"] = r
                    st.rerun()
    else:
        st.info("No saved resumes in the database yet. Starts empty by default (zero mock data).")

st.divider()

# -------------------------------------------------------------
# PARSE ACTION BUTTON
# -------------------------------------------------------------
col_btn, col_info = st.columns([1, 3])
with col_btn:
    parse_clicked = st.button("🚀 Parse Resume", type="primary", disabled=not bool(resume_text.strip()))

with col_info:
    if resume_text.strip():
        st.caption(f"Ready to analyze: **{source_filename}** ({len(resume_text):,} chars)")
    else:
        st.caption("Upload a file or paste resume text above to enable parsing.")

if parse_clicked:
    try:
        with st.spinner("Extracting technical competencies across 12 RADIX categories, education, and projects..."):
            parsed_output = parse_resume_content(resume_text, source_filename)
            # Persist to database
            save_resume(parsed_output.model_dump())
            st.session_state["active_resume"] = parsed_output.model_dump()
            st.success(f"✅ Successfully parsed resume for **{parsed_output.candidate_name}**! Saved to database.")
    except Exception as exc:
        st.error(f"Resume parsing failed: {exc}")

# -------------------------------------------------------------
# DISPLAY ACTIVE PARSED RESUME
# -------------------------------------------------------------
active_data = st.session_state.get("active_resume")

if active_data:
    st.markdown("---")
    st.header("📊 Parsed Candidate Profile")
    
    # 1. Candidate Header Card
    cand_col1, cand_col2 = st.columns([3, 1])
    with cand_col1:
        st.subheader(f"👤 {active_data.get('candidate_name', 'Candidate Name')}")
        st.markdown(
            f"📧 `{active_data.get('candidate_email', 'N/A')}` | "
            f"📞 `{active_data.get('phone', 'N/A')}` | "
            f"📍 `{active_data.get('location', 'N/A')}`"
        )
        st.markdown(f"**Target Role / Headline:** {active_data.get('role', 'Software Engineer')}")
        st.markdown(f"**Profile Archetype:** `{active_data.get('profile_archetype', 'Software Engineer')}`")
        if active_data.get('fit_summary'):
            st.info(f"💡 **Profile Summary:** {active_data.get('fit_summary')}")
            
    with cand_col2:
        st.metric("Total Skills", len(active_data.get("skills", [])))
        st.metric("Education Entries", len(active_data.get("education", [])))
        st.metric("Projects", len(active_data.get("projects", [])))
        st.caption(f"Source: `{active_data.get('source_file', '')}`")

    st.markdown("---")
    
    # 2. Extracted RADIX Skills
    st.subheader("🛠️ Extracted Technical Skills (12 RADIX Categories)")
    skills = active_data.get("skills", [])
    
    if skills:
        # Category count summary pills
        categories = [s.get("category_code") for s in skills]
        cat_counts = {c: categories.count(c) for c in sorted(set(categories))}
        
        cat_pills = " · ".join([f"**{c}**: {cnt}" for c, cnt in cat_counts.items()])
        st.caption(f"**Category Breakdown:** {cat_pills}")
        
        table_rows = [
            {
                "Category": s.get("category_code"),
                "Skill Name": s.get("skill_name"),
                "Proficiency Level": f"Lvl {s.get('proficiency_level', 8)}/10",
                "Confidence": str(s.get("confidence", "high")).upper(),
                "Supporting Evidence": s.get("evidence", "")
            }
            for s in skills
        ]
        st.dataframe(table_rows, width="stretch", hide_index=True)
    else:
        st.warning("No technical skills were extracted.")

    st.markdown("---")
    
    # 3. Education, Projects, Internships, Certifications Grid
    sec_col1, sec_col2 = st.columns(2)
    
    with sec_col1:
        st.subheader("🎓 Education")
        education_list = active_data.get("education", [])
        if education_list:
            for edu in education_list:
                st.markdown(f"**{edu.get('degree', 'Degree')} in {edu.get('field_of_study', '')}**")
                st.write(f"🏛️ {edu.get('institution', '')}")
                st.caption(f"Year: {edu.get('graduation_year', '')} | Score: {edu.get('score_or_gpa', 'N/A')}")
                st.write("")
        else:
            st.write("No education entries extracted.")

        st.subheader("💼 Work Experience & Internships")
        internships = active_data.get("internships", [])
        if internships:
            for intern in internships:
                st.markdown(f"**{intern.get('role', 'Intern')}** at **{intern.get('company', '')}**")
                st.caption(f"⏱️ {intern.get('duration', '')}")
                st.write(intern.get('description', ''))
                techs = intern.get("technologies", [])
                if techs:
                    st.caption("Tech: " + " · ".join(techs))
                st.write("")
        else:
            st.write("No internship or work experience entries extracted.")

    with sec_col2:
        st.subheader("💻 Technical Projects")
        projects = active_data.get("projects", [])
        if projects:
            for proj in projects:
                st.markdown(f"**{proj.get('title', 'Project')}**")
                st.write(proj.get('description', ''))
                techs = proj.get("technologies", [])
                if techs:
                    st.caption("Tech: " + " · ".join(techs))
                if proj.get("link"):
                    st.caption(f"🔗 Link: {proj.get('link')}")
                st.write("")
        else:
            st.write("No projects extracted.")

        st.subheader("🏆 Certifications & Hackathons")
        certs = active_data.get("certifications", [])
        hackathons = active_data.get("hackathons", [])
        
        if certs:
            st.markdown("**Certifications:**")
            for c in certs:
                st.write(f"• **{c.get('name')}** ({c.get('issuer')}, {c.get('year')})")
        if hackathons:
            st.markdown("**Hackathons & Competitions:**")
            for h in hackathons:
                st.write(f"• **{h.get('name')}** — *{h.get('achievement')}* ({h.get('year')})")
                if h.get("project_summary"):
                    st.caption(h.get("project_summary"))
        if not certs and not hackathons:
            st.write("No certifications or hackathons extracted.")

    st.markdown("---")
    
    # 4. JSON Export & Download
    exp_col1, exp_col2 = st.columns([2, 1])
    with exp_col1:
        with st.expander("🔍 View Raw Structured JSON"):
            st.json(active_data)
            
    with exp_col2:
        cand_name_slug = active_data.get('candidate_name', 'candidate').lower().replace(' ', '_')
        st.download_button(
            label="💾 Download Structured Resume JSON",
            data=json.dumps(active_data, indent=2, ensure_ascii=False),
            file_name=f"{cand_name_slug}_parsed_resume.json",
            mime="application/json",
            type="primary"
        )
