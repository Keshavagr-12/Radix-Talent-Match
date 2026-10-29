"""
Streamlit Web Application for RADIX JD Analytics.
Run with:
    streamlit run app.py
"""

import streamlit as st
try:
    from .extractor import extract_text
    from .analyzer import analyze_job_description
except (ImportError, ValueError):
    from extractor import extract_text
    from analyzer import analyze_job_description

st.set_page_config(
    page_title="RADIX JD Analytics",
    page_icon="📄",
    layout="wide"
)

st.title("📄 RADIX JD Analytics")
st.caption("Module 01: Extract and classify technical competencies from Job Descriptions")

st.write(
    "Upload a job description document (PDF, DOCX, TXT) or paste raw text to extract "
    "competency skills mapped to official RADIX categories."
)

tab_upload, tab_paste = st.tabs(["📁 Upload Document", "✍️ Paste Text"])

jd_text = ""
source_name = "Job Description"

with tab_upload:
    uploaded_file = st.file_uploader(
        "Choose a file",
        type=["pdf", "docx", "txt", "md"]
    )
    if uploaded_file is not None:
        source_name = uploaded_file.name
        try:
            jd_text = extract_text(uploaded_file.name, uploaded_file.getvalue())
            st.info(f"Loaded '{uploaded_file.name}' ({len(jd_text)} characters).")
        except Exception as err:
            st.error(f"Failed to extract text: {err}")

with tab_paste:
    pasted_text = st.text_area(
        "Paste Job Description text here:",
        height=200,
        placeholder="We are looking for a Senior Software Engineer with expertise in Python, Distributed Systems, Docker, and SQL..."
    )
    if pasted_text.strip():
        jd_text = pasted_text.strip()
        source_name = "Pasted Job Description"

if st.button("🚀 Analyze Job Description", type="primary", disabled=not bool(jd_text.strip())):
    try:
        with st.spinner("Extracting and classifying RADIX competency skills..."):
            result = analyze_job_description(jd_text)

        st.success("✅ Analysis completed successfully!")

        st.subheader("Extracted RADIX Skills")
        skills = result.skills

        if skills:
            table_data = [
                {
                    "Skill": s.skill_name,
                    "RADIX Category": s.category_code,
                    "Evidence": s.evidence,
                    "Confidence": s.confidence
                }
                for s in skills
            ]
            st.dataframe(table_data, use_container_width=True)
        else:
            st.warning("No technical skills were detected in the provided text.")

        st.download_button(
            label="💾 Download Structured Analysis (JSON)",
            data=result.model_dump_json(indent=2),
            file_name=f"{source_name}_analysis.json",
            mime="application/json"
        )

    except Exception as exc:
        st.error(f"Analysis failed: {exc}")
