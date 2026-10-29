import os
from typing import Any

import requests
import streamlit as st


# ==================================================
# PAGE CONFIGURATION
# ==================================================
st.set_page_config(
    page_title="RADIX Talent Match | Profile Builder",
    page_icon="🧩",
    layout="wide",
)

st.title("🧩 RADIX Talent Match")
st.caption("Profile Builder | Create, parse, view, and update candidate profiles")


# ==================================================
# BACKEND CONFIGURATION
# ==================================================
default_api_url = os.getenv(
    "RADIX_API_URL",
    "http://127.0.0.1:8003",
)

with st.sidebar:
    st.header("Backend Connection")

    api_base = st.text_input(
        "FastAPI URL",
        value=st.session_state.get("api_base", default_api_url),
    ).strip().rstrip("/")

    st.session_state["api_base"] = api_base

    if st.button("Check API Connection"):
        try:
            response = requests.get(
                f"{api_base}/openapi.json",
                timeout=5,
            )
            if response.ok:
                st.success("FastAPI connected!")
            else:
                st.error(f"HTTP {response.status_code}")
        except requests.RequestException:
            st.error("Cannot connect. Start your FastAPI backend.")

    st.divider()
    st.markdown("**Start backend**")
    st.code("uvicorn main:app --reload", language="bash")
    st.markdown("**Start frontend**")
    st.code("streamlit run streamlit_app.py", language="bash")


# ==================================================
# HELPER FUNCTIONS
# ==================================================
def get_api_base() -> str:
    return st.session_state.get("api_base", default_api_url).rstrip("/")


def api_request(
    method: str,
    path: str,
    **kwargs: Any,
) -> requests.Response | None:
    base = get_api_base()
    try:
        return requests.request(
            method=method,
            url=f"{base}{path}",
            timeout=60,
            **kwargs,
        )
    except requests.RequestException as exc:
        st.error(f"Backend connection failed: {exc}")
        return None


def parse_response(response: requests.Response) -> dict:
    try:
        data = response.json()
        return data if isinstance(data, dict) else {"data": data}
    except ValueError:
        return {"detail": response.text or "Empty response"}


def format_error_detail(detail: Any) -> str:
    if isinstance(detail, list):
        messages = []
        for err in detail:
            if isinstance(err, dict):
                loc = " -> ".join(str(item) for item in err.get("loc", []) if item != "body")
                msg = err.get("msg", "Validation error")
                messages.append(f"{loc}: {msg}" if loc else msg)
            else:
                messages.append(str(err))
        return "\n".join(messages)
    return str(detail)


def comma_list(value: str) -> list[str]:
    return [
        item.strip()
        for item in value.split(",")
        if item.strip()
    ]


def make_skills(value: str) -> list[dict]:
    category_map = {
        "c++": "COD",
        "python": "COD",
        "java": "COD",
        "javascript": "COD",
        "typescript": "COD",
        "c": "COD",
        "go": "COD",
        "rust": "COD",
        "data structures and algorithms": "DSA",
        "dsa": "DSA",
        "object-oriented design": "OOD",
        "ood": "OOD",
        "oop": "OOD",
        "operating systems": "OS",
        "linux": "OS",
        "multithreading": "OS",
        "computer networks": "NETW",
        "networking": "NETW",
        "communication": "COMM",
        "aptitude": "APTI",
        "artificial intelligence": "AI",
        "ai": "AI",
        "machine learning": "AI",
        "cloud": "CLOUD",
        "aws": "CLOUD",
        "docker": "CLOUD",
        "kubernetes": "CLOUD",
        "sql": "SQL",
        "postgresql": "SQL",
        "mysql": "SQL",
        "software engineering": "SWE",
        "fastapi": "SWE",
        "api": "SWE",
        "rate-limiter": "SWE",
        "system design": "SYSD",
        "git": "OTHER",
        "redis": "OTHER",
        "react": "OTHER",
        "node.js": "OTHER",
        "mongodb": "OTHER",
    }

    return [
        {
            "skill_name": skill,
            "category_code": category_map.get(
                skill.lower(),
                "OTHER",
            ),
            "evidence": "Added through RADIX Profile Builder",
            "confidence": "medium",
        }
        for skill in comma_list(value)
    ]


def save_profile_id(data: dict) -> None:
    """Save the profile ID returned by the backend."""
    profile = data.get("profile", {})
    profile_id = data.get("id") or (
        profile.get("id") if isinstance(profile, dict) else None
    )

    if profile_id:
        st.session_state["active_profile_id"] = str(profile_id)


def get_saved_profile_id() -> str:
    return str(st.session_state.get("active_profile_id", ""))


def display_profile(data: dict) -> None:
    profile = data.get("profile", data)

    if not isinstance(profile, dict):
        st.json(data)
        return

    st.markdown("### Candidate Details")
    st.write("**Name:**", profile.get("name") or "Not detected")
    st.write("**Email:**", profile.get("email") or "Not detected")

    st.markdown("### Education")
    st.json(profile.get("education") or [])

    st.markdown("### Skills")
    st.json(profile.get("skills") or [])

    st.markdown("### Hackathons")
    st.json(profile.get("hackathons") or [])

    st.markdown("### Internships")
    st.json(profile.get("internships") or [])

    st.markdown("### Certifications")
    st.json(profile.get("certifications") or [])

    st.markdown("### Preferred Roles")
    st.write(profile.get("preferred_roles") or ["Not specified"])

    if profile.get("cv_file"):
        st.markdown("### Resume Storage Path")
        st.code(str(profile["cv_file"]))


# ==================================================
# TABS
# ==================================================
create_tab, upload_tab, view_tab, update_tab, help_tab = st.tabs(
    [
        "➕ Create Profile",
        "📄 Upload Resume",
        "🔎 View Profile",
        "✏️ Update Profile",
        "ℹ️ Help",
    ]
)


# ==================================================
# TAB 1: CREATE PROFILE MANUALLY
# ==================================================
with create_tab:
    st.subheader("Create a Candidate Profile")

    with st.form("create_profile_form"):
        col1, col2 = st.columns(2)

        with col1:
            name = st.text_input("Full Name *")
            email = st.text_input("Email Address *")
            degree = st.text_input("Degree", placeholder="B.Tech")
            institution = st.text_input("Institution")

        with col2:
            graduation_year = st.number_input(
                "Graduation Year",
                min_value=1900,
                max_value=2100,
                value=2026,
            )
            field_of_study = st.text_input("Field of Study")
            skills_text = st.text_input(
                "Skills (comma-separated)",
                placeholder="Python, C++, DSA",
            )
            roles_text = st.text_input(
                "Preferred Roles (comma-separated)",
                placeholder="Software Engineer, Backend Engineer",
            )

        submitted = st.form_submit_button(
            "Create Profile",
            type="primary",
            width="stretch",
        )

    if submitted:
        if not name.strip() or not email.strip():
            st.warning("Name and email are required.")
        else:
            education = []

            if degree.strip() or institution.strip() or field_of_study.strip():
                education.append({
                    "degree": degree.strip() or "Not specified",
                    "institution": institution.strip() or "Not specified",
                    "graduation_year": int(graduation_year),
                    "field_of_study": field_of_study.strip() or None,
                })

            body = {
                "name": name.strip(),
                "email": email.strip(),
                "education": education,
                "skills": make_skills(skills_text),
                "hackathons": [],
                "internships": [],
                "certifications": [],
                "preferred_roles": comma_list(roles_text),
                "cv_file": None,
            }

            response = api_request(
                "POST",
                "/api/profiles",
                json=body,
            )

            if response is not None:
                result = parse_response(response)

                if response.ok:
                    save_profile_id(result)
                    st.success("Profile created successfully!")

                    if get_saved_profile_id():
                        st.markdown("**Your Profile ID**")
                        st.code(get_saved_profile_id())

                    display_profile(result)
                else:
                    st.error(format_error_detail(result.get("detail", "Could not create profile.")))
                    st.json(result)


# ==================================================
# TAB 2: UPLOAD RESUME
# NO PROFILE ID REQUIRED
# ==================================================
with upload_tab:
    st.subheader("Upload Resume")

    st.write(
        "Upload a PDF or DOCX resume. The backend should create a new "
        "profile automatically or update an existing profile when the "
        "resume email matches."
    )

    uploaded_file = st.file_uploader(
        "Choose your resume",
        type=["pdf", "docx"],
        key="resume_upload",
    )

    if uploaded_file:
        st.caption(
            f"Selected: {uploaded_file.name} "
            f"| {uploaded_file.size:,} bytes"
        )

    if st.button(
        "Upload Resume & Create Profile",
        type="primary",
        width="stretch",
        key="upload_resume_button",
    ):
        if uploaded_file is None:
            st.warning("Please select a PDF or DOCX file.")
        else:
            files = {
                "file": (
                    uploaded_file.name,
                    uploaded_file.getvalue(),
                    uploaded_file.type or "application/octet-stream",
                )
            }

            with st.spinner("Processing resume and saving profile..."):
                response = api_request(
                    "POST",
                    "/api/profiles/resume",
                    files=files,
                )

            if response is not None:
                result = parse_response(response)

                if response.ok:
                    save_profile_id(result)

                    st.success(
                        result.get(
                            "message",
                            "Resume processed and profile saved!",
                        )
                    )

                    if get_saved_profile_id():
                        st.markdown("### Your Profile ID")
                        st.code(get_saved_profile_id())
                        st.caption(
                            "This ID was generated or returned by the backend. "
                            "You did not need to enter it."
                        )

                    display_profile(result)

                else:
                    st.error(format_error_detail(result.get("detail", "Resume upload failed.")))
                    st.json(result)


# ==================================================
# TAB 3: VIEW PROFILE
# USE AUTOMATICALLY SAVED ID OR BROWSE
# ==================================================
with view_tab:
    st.subheader("View Candidate Profile")

    saved_id = get_saved_profile_id()

    if saved_id:
        st.info(f"Current Profile ID: {saved_id}")
    else:
        st.info(
            "Upload a resume or create a profile first. "
            "Its ID will appear here automatically."
        )

    # Allow browsing existing profiles
    with st.expander("📋 Browse Existing Profiles in Database"):
        if st.button("Load All Profiles"):
            list_resp = api_request("GET", "/api/profiles")
            if list_resp is not None and list_resp.ok:
                profiles_list = list_resp.json()
                if profiles_list:
                    options = {}
                    for p in profiles_list:
                        p_id = p.get("id")
                        prof = p.get("profile") or {}
                        p_name = prof.get("name") or "Unnamed"
                        p_email = prof.get("email") or "No email"
                        options[f"{p_name} ({p_email}) - {p_id}"] = p_id

                    selected_label = st.selectbox("Select Candidate", list(options.keys()))
                    if st.button("Set as Active Profile"):
                        st.session_state["active_profile_id"] = options[selected_label]
                        st.rerun()
                else:
                    st.write("No profiles found in database.")
            else:
                st.error("Failed to load profiles list.")

    manual_view_id = st.text_input(
        "Or enter a different Profile ID",
        value="",
        key="manual_view_id",
    ).strip()

    view_id = manual_view_id or saved_id

    if st.button(
        "Load Profile",
        type="primary",
        width="stretch",
    ):
        if not view_id:
            st.warning("Create a profile or upload a resume first.")
        else:
            response = api_request(
                "GET",
                f"/api/profiles/{view_id}",
            )

            if response is not None:
                result = parse_response(response)

                if response.ok:
                    save_profile_id(result)
                    display_profile(result)
                else:
                    st.error(format_error_detail(result.get("detail", "Profile not found.")))
                    st.json(result)


# ==================================================
# TAB 4: UPDATE PROFILE
# USE AUTOMATICALLY SAVED ID
# ==================================================
with update_tab:
    st.subheader("Update Candidate Profile")

    saved_id = get_saved_profile_id()

    if saved_id:
        st.info(f"Updating Profile ID: {saved_id}")
    else:
        st.warning(
            "Create a profile or upload a resume first to obtain a Profile ID."
        )

    manual_update_id = st.text_input(
        "Or enter a different Profile ID",
        value="",
        key="manual_update_id",
    ).strip()

    update_id = manual_update_id or saved_id

    with st.form("update_profile_form"):
        new_name = st.text_input("New Name")
        new_email = st.text_input("New Email")
        new_skills = st.text_input(
            "Replace Skills (comma-separated)",
        )
        new_roles = st.text_input(
            "Replace Preferred Roles (comma-separated)",
        )

        update_submitted = st.form_submit_button(
            "Save Changes",
            type="primary",
            width="stretch",
        )

    if update_submitted:
        if not update_id:
            st.warning("Create a profile or upload a resume first.")
        else:
            updates = {}

            if new_name.strip():
                updates["name"] = new_name.strip()

            if new_email.strip():
                updates["email"] = new_email.strip()

            if new_skills.strip():
                updates["skills"] = make_skills(new_skills)

            if new_roles.strip():
                updates["preferred_roles"] = comma_list(new_roles)

            if not updates:
                st.warning("Enter at least one field to update.")
            else:
                response = api_request(
                    "PUT",
                    f"/api/profiles/{update_id}",
                    json=updates,
                )

                if response is not None:
                    result = parse_response(response)

                    if response.ok:
                        save_profile_id(result)
                        st.success("Profile updated successfully!")
                        display_profile(result)
                    else:
                        st.error(format_error_detail(result.get("detail", "Update failed.")))
                        st.json(result)


# ==================================================
# TAB 5: HELP
# ==================================================
with help_tab:
    st.subheader("How to Run the Application")

    st.markdown(
        """
        ### 1. Install dependencies

        ```bash
        python -m pip install -r requirements.txt
        ```

        ### 2. Start FastAPI in the first terminal

        ```bash
        uvicorn main:app --reload
        ```

        ### 3. Start Streamlit in the second terminal

        ```bash
        streamlit run streamlit_app.py
        ```

        ### 4. Use the application

        1. Open **Upload Resume** and select a PDF or DOCX.
        2. Click **Upload Resume & Create Profile**.
        3. The backend should create or update the profile and return its ID.
        4. Open **View Profile** to inspect the saved information.
        5. Open **Update Profile** to edit the information.

        ### API endpoints

        - `GET /api/profiles` — list existing profiles
        - `POST /api/profiles` — create a profile manually
        - `POST /api/profiles/resume` — upload a resume without a Profile ID
        - `GET /api/profiles/{profile_id}` — retrieve a profile
        - `PUT /api/profiles/{profile_id}` — update a profile
        - `POST /api/profiles/{profile_id}/resume` — upload a resume for an existing profile

        **Note:** Keep Supabase credentials in your backend `.env` file.
        Do not put secret keys in the Streamlit frontend.
        """
    )

st.divider()
st.caption("RADIX Talent Match | Profile Builder")
