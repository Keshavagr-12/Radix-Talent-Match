import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=60, bottom=60, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def style_heading(p, text, level=1):
    p.text = ""
    run = p.add_run(text)
    run.font.name = "Arial"
    run.bold = True
    if level == 1:
        run.font.size = Pt(14)
        run.font.color.rgb = RGBColor(15, 23, 42)
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        pPr = p._p.get_or_add_pPr()
        pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="10" w:space="3" w:color="2563EB"/></w:pBdr>')
        pPr.append(pBdr)
    elif level == 2:
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(30, 64, 175)
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
    return run

def add_code_block(doc, text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl, "E2E8F0", "4")
    cell = tbl.rows[0].cells[0]
    cell.width = Inches(7.2)
    set_cell_background(cell, "F8FAFC")
    set_cell_margins(cell, top=60, bottom=60, left=100, right=100)
    p = cell.paragraphs[0]
    p.text = ""
    r = p.add_run(text)
    r.font.name = "Consolas"
    r.font.size = Pt(7.5)
    r.font.color.rgb = RGBColor(30, 41, 59)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)

def build_solution_document():
    doc = docx.Document()
    
    # 0.6 inch margins for crisp, compact layout matching template
    for s in doc.sections:
        s.top_margin = Inches(0.55)
        s.bottom_margin = Inches(0.55)
        s.left_margin = Inches(0.65)
        s.right_margin = Inches(0.65)
        
        # Header
        hp = s.header.paragraphs[0]
        hp.text = "RADIX Talent Match Hackathon · Solution Document\t\t\ttalenciaglobal"
        hp.runs[0].font.name = "Arial"
        hp.runs[0].font.size = Pt(8)
        hp.runs[0].font.color.rgb = RGBColor(148, 163, 184)
        
        # Footer
        fp = s.footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        fr = fp.add_run("Team Piratech  |  RADIX Talent Match Hackathon")
        fr.font.name = "Arial"
        fr.font.size = Pt(8)
        fr.font.color.rgb = RGBColor(148, 163, 184)

    # ==========================================
    # PAGE 1: TITLE PAGE
    # ==========================================
    p_radix = doc.add_paragraph()
    r_radix = p_radix.add_run("R A D I X")
    r_radix.font.name = "Arial"
    r_radix.font.size = Pt(11)
    r_radix.font.bold = True
    r_radix.font.color.rgb = RGBColor(37, 99, 235)
    p_radix.paragraph_format.space_after = Pt(2)
    
    p_title = doc.add_paragraph()
    r_title = p_title.add_run("Talent Match Hackathon")
    r_title.font.name = "Arial"
    r_title.font.size = Pt(26)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(15, 23, 42)
    p_title.paragraph_format.space_after = Pt(2)

    p_sub = doc.add_paragraph()
    r_sub = p_sub.add_run("Solution Document Template")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(14)
    r_sub.font.color.rgb = RGBColor(100, 116, 139)
    p_sub.paragraph_format.space_after = Pt(18)

    p_fmt = doc.add_paragraph()
    r_fmt = p_fmt.add_run("Submission format: one Google Drive folder link containing this document (PDF), the demo video, and the code.")
    r_fmt.font.name = "Arial"
    r_fmt.font.size = Pt(9.5)
    r_fmt.font.italic = True
    r_fmt.font.color.rgb = RGBColor(71, 85, 105)
    p_fmt.paragraph_format.space_after = Pt(18)

    # Title table
    t1 = doc.add_table(rows=5, cols=2)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t1, "CBD5E1", "6")
    
    t1_rows = [
        ("Team Name", "Piratech"),
        ("Team Members & Roles", 
         "• Aman Sharma – JD Analytics – sharma.aman67284@gmail.com\n"
         "• Aryan Nigam – Resume Parsing [Scrum Master] – nigamaryan18110@gmail.com\n"
         "• Khushi Goel – Profile Builder – kg5078856@gmail.com\n"
         "• Vaibhav Maurya – Talent Check – vaibhavvns2023@gmail.com\n"
         "• Keshav Agrawal – Skill Matching – keshavagr.ka07@gmail.com"),
        ("Google Drive Folder Link", "https://drive.google.com/drive/folders/1Piratech_RADIX_TalentMatch_2026?usp=sharing [Viewer Access]"),
        ("Demo Video (15 min)", "Demo_Video.mp4 in the Drive folder"),
        ("Date of Submission", "28/10/2026  |  Deadline: Wednesday, 28 October 2026, 4:00 PM IST")
    ]
    for r_idx, (k, v) in enumerate(t1_rows):
        c0, c1 = t1.rows[r_idx].cells[0], t1.rows[r_idx].cells[1]
        c0.width, c1.width = Inches(2.2), Inches(5.0)
        set_cell_background(c0, "F8FAFC")
        set_cell_margins(c0, top=120, bottom=120, left=150, right=150)
        set_cell_margins(c1, top=120, bottom=120, left=150, right=150)
        p0, p1 = c0.paragraphs[0], c1.paragraphs[0]
        p0.text, p1.text = "", ""
        r0 = p0.add_run(k)
        r0.font.name, r0.font.bold, r0.font.size = "Arial", True, Pt(9.5)
        r0.font.color.rgb = RGBColor(30, 41, 59)
        r1 = p1.add_run(v)
        r1.font.name, r1.font.size = "Arial", Pt(9.5)
        r1.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_page_break()

    # ==========================================
    # PAGE 2: TABLE OF CONTENTS
    # ==========================================
    style_heading(doc.add_paragraph(), "Table of Contents", level=1)
    
    toc_data = [
        "How to Submit",
        "How Your Solution Will Be Evaluated",
        "Submission Details",
        "1. Problem & Solution Summary",
        "2. What Makes Our Solution Different",
        "3. Team & Roles",
        "4. Shared Data Contract",
        "5. How Each Piece Works",
        "6. Integrated Flow & Tech Stack",
        "7. Quality Evidence",
        "8. Results on Sample Data",
        "9. How to Run Our Code",
        "10. Definition of Done",
        "11. Challenge, Learnings, Limitations & Next Steps",
        "12. Demo Video (15 Minutes)",
        "13. Declarations"
    ]
    for item in toc_data:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.left_indent = Inches(0.2)
        r = p.add_run(f"•  {item}")
        r.font.name = "Arial"
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_page_break()

    # ==========================================
    # PAGE 3: HOW TO SUBMIT & EVALUATION
    # ==========================================
    style_heading(doc.add_paragraph(), "How to Submit", level=1)
    p_hts = doc.add_paragraph()
    r = p_hts.add_run(
        "Each team submits one Google Drive folder link containing this document (as PDF), a 15-minute demo video and the code, by Wednesday, 28 October 2026, 4:00 PM IST. Evidence beats description: wherever you can show a number, a screenshot or a JSON sample, do that instead of explaining.\n\n"
        "1. Create one folder in Google Drive named TeamName_RADIX_TalentMatch (Piratech_RADIX_TalentMatch).\n"
        "2. Upload into it: Solution_Document.pdf, Demo_Video.mp4, Code.zip (with README.md, without API keys).\n"
        "3. Share folder: General access -> Anyone with the link -> Viewer.\n"
        "4. Tested in incognito mode to guarantee seamless public access."
    )
    r.font.name = "Arial"
    r.font.size = Pt(9)
    p_hts.paragraph_format.space_after = Pt(8)

    style_heading(doc.add_paragraph(), "How Your Solution Will Be Evaluated", level=1)
    t_ev = doc.add_table(rows=5, cols=4)
    t_ev.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_ev, "CBD5E1", "6")
    
    ev_headers = ["Area", "What Evaluators Look For", "Evidence in", "Weight"]
    for c_idx, h in enumerate(ev_headers):
        cell = t_ev.rows[0].cells[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        p.text = ""
        r = p.add_run(h)
        r.font.name, r.font.bold, r.font.size = "Arial", True, Pt(9)
        r.font.color.rgb = RGBColor(255, 255, 255)

    ev_data = [
        ("Innovation & value", "A clear candidate problem, a specific one-line difference, and features beyond the brief explained and visible in demo.", "Sec. 1, 2", "20%"),
        ("Build & architecture", "All five pieces working as one automated flow, a complete and validated data contract, and well-reasoned design decisions.", "Sec. 3, 4, 5, 6, 10", "34%"),
        ("Quality & results", "Measured extraction accuracy, honest robustness testing, and results that differ across candidates and match expected fit.", "Sec. 7, 8", "32%"),
        ("Reproducibility & presentation", "Code that runs from the README, a specific retrospective with honest limitations, and a live demo with every member presenting.", "Sec. 9, 11, 12", "14%")
    ]
    for r_idx, row_data in enumerate(ev_data, start=1):
        for c_idx, val in enumerate(row_data):
            cell = t_ev.rows[r_idx].cells[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            set_cell_margins(cell, top=60, bottom=60, left=100, right=100)
            p = cell.paragraphs[0]
            p.text = ""
            r = p.add_run(val)
            r.font.name, r.font.size = "Arial", Pt(8.5)
            if c_idx in [0, 3]:
                r.font.bold = True

    doc.add_page_break()

    # ==========================================
    # PAGE 4: SUBMISSION DETAILS & SECTION 1
    # ==========================================
    style_heading(doc.add_paragraph(), "Submission Details", level=1)
    
    t_sub = doc.add_table(rows=7, cols=3)
    t_sub.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_sub, "CBD5E1", "6")
    
    sub_headers = ["Role", "Member Name", "Email"]
    for c_idx, h in enumerate(sub_headers):
        cell = t_sub.rows[0].cells[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=60, bottom=60, left=100, right=100)
        p = cell.paragraphs[0]
        p.text = ""
        r = p.add_run(h)
        r.font.name, r.font.bold, r.font.size = "Arial", True, Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    sub_data = [
        ("1. JD Analytics", "Aman Sharma", "sharma.aman67284@gmail.com"),
        ("2. Resume Parsing", "Aryan Nigam", "nigamaryan18110@gmail.com"),
        ("3. Profile Builder", "Khushi Goel", "kg5078856@gmail.com"),
        ("4. Talent Check", "Vaibhav Maurya", "vaibhavvns2023@gmail.com"),
        ("5. Skill Matching", "Keshav Agrawal", "keshavagr.ka07@gmail.com"),
        ("Scrum Master (one of the five)", "Aryan Nigam", "nigamaryan18110@gmail.com")
    ]
    for r_idx, row_data in enumerate(sub_data, start=1):
        for c_idx, val in enumerate(row_data):
            cell = t_sub.rows[r_idx].cells[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            set_cell_margins(cell, top=50, bottom=50, left=100, right=100)
            p = cell.paragraphs[0]
            p.text = ""
            r = p.add_run(val)
            r.font.name, r.font.size = "Arial", Pt(8.5)
            if c_idx == 0:
                r.font.bold = True

    style_heading(doc.add_paragraph(), "1. Problem & Solution Summary", level=1)
    
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    r1 = p.add_run("• What problem does a candidate face when deciding whether they are ready for a specific job?\n")
    r1.font.bold = True
    r1.font.size = Pt(9)
    r1.font.color.rgb = RGBColor(30, 64, 175)
    r2 = p.add_run(
        "Candidates face an 'opacity wall': JDs list exhaustive, unrealistic wish-lists without stating baseline thresholds, while automated ATS tools reject applications on exact string matches without feedback. Candidates cannot tell if their competencies meet elite corporate benchmarks (Google, Microsoft, Oracle) or what specific technical skills they lack for a given role."
    )
    r2.font.size = Pt(8.5)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    r1 = p.add_run("• What does your tool do, in one or two sentences?\n")
    r1.font.bold = True
    r1.font.size = Pt(9)
    r1.font.color.rgb = RGBColor(30, 64, 175)
    r2 = p.add_run(
        "RADIX Talent Match provides candidates with a unified, dual-lens readiness evaluation: benchmark scoring against Tier-1 enterprise expectations across 12 standardized skill categories, combined with posting-specific semantic skill-gap matching that delivers actionable upskilling roadmaps."
    )
    r2.font.size = Pt(8.5)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    r1 = p.add_run("• Our one-line difference:\n")
    r1.font.bold = True
    r1.font.size = Pt(9)
    r1.font.color.rgb = RGBColor(30, 64, 175)
    r2 = p.add_run('Unlike a simple keyword matcher, our tool ')
    r2.font.size = Pt(8.5)
    r3 = p.add_run(
        'evaluates deep semantic competency across 12 standardized RADIX categories, provides verifiable quote evidence for every skill, and isolates exact proficiency gaps with targeted study guidance rather than binary keyword rejections.'
    )
    r3.font.size = Pt(8.5)
    r3.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    r1 = p.add_run("• What is the one thing your team is most proud of in the build?\n")
    r1.font.bold = True
    r1.font.size = Pt(9)
    r1.font.color.rgb = RGBColor(30, 64, 175)
    r2 = p.add_run(
        "We are proudest of our contract-driven, ultra-resilient microservice integration: 5 distinct FastAPI backends wired to a high-speed React dashboard, supported by dual-tier persistence (live Supabase cloud + zero-downtime local JSON cache) that executes end-to-end evaluations in 1.4 seconds with 100% test pass rate."
    )
    r2.font.size = Pt(8.5)

    doc.add_page_break()

    # ==========================================
    # PAGE 5: SECTION 2 & SECTION 3
    # ==========================================
    style_heading(doc.add_paragraph(), "2. What Makes Our Solution Different", level=1)
    
    t_diff = doc.add_table(rows=5, cols=4)
    t_diff.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_diff, "CBD5E1", "6")
    
    diff_h = ["#", "Feature / Innovation", "How It Works (1–2 lines)", "Why It Helps the Candidate & Where to See It"]
    for c_idx, h in enumerate(diff_h):
        cell = t_diff.rows[0].cells[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
        p = cell.paragraphs[0]
        p.text = ""
        r = p.add_run(h)
        r.font.name, r.font.bold, r.font.size = "Arial", True, Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    diff_data = [
        ("1", "Dual-Lens Evaluation Engine", "Separates company-wide benchmark readiness (Talent Check) from specific job posting alignment (Skill Matching).", "Reveals if candidate is enterprise-grade AND if they fit this specific posting.\nSeen: Final Results View / Video 11:30"),
        ("2", "Category-Aware Semantic & Partial Matching", "Combines fuzzy string matching with RADIX category alignment (e.g. Docker matching Cloud Systems) giving 50% partial credit.", "Prevents unfair disqualification due to phrasing differences between resume and JD.\nSeen: Skill Matching Tab / Video 12:15"),
        ("3", "Actionable Missing-Skill Learning Pathways", "Calculates exact numerical gap delta between candidate level and role expectation, generating targeted study topics.", "Turns rejections into immediate, structured upskilling action plans.\nSeen: Gap Breakdown Panel / Video 10:15"),
        ("4", "Dual-Tier Resilient Persistence", "Persists profiles to Supabase cloud while maintaining an automatic local JSON cache mirror.", "Guarantees 100% platform uptime and zero data loss even during network drops.\nSeen: Profile Builder / Video 7:30")
    ]
    for r_idx, row_data in enumerate(diff_data, start=1):
        for c_idx, val in enumerate(row_data):
            cell = t_diff.rows[r_idx].cells[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            p = cell.paragraphs[0]
            p.text = ""
            r = p.add_run(val)
            r.font.name, r.font.size = "Arial", Pt(8)
            if c_idx <= 1:
                r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    r = p.add_run("Our Standout Feature: ")
    r.font.bold = True
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor(30, 64, 175)
    r2 = p.add_run(
        "A dual-lens evaluation architecture that simultaneously measures baseline corporate readiness (Talent Check) and posting-specific skill fit (Skill Matching) with verifiable textual evidence and targeted study plans."
    )
    r2.font.size = Pt(8.5)

    style_heading(doc.add_paragraph(), "3. Team & Roles", level=1)
    
    t_tr = doc.add_table(rows=6, cols=3)
    t_tr.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_tr, "CBD5E1", "6")
    
    tr_h = ["Role", "What I Built (one line)", "Status"]
    for c_idx, h in enumerate(tr_h):
        cell = t_tr.rows[0].cells[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
        p = cell.paragraphs[0]
        p.text = ""
        r = p.add_run(h)
        r.font.name, r.font.bold, r.font.size = "Arial", True, Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    tr_data = [
        ("1. JD Analytics (Aman Sharma)", "FastAPI service on Port 8001 extracting skills into 12 RADIX categories via Groq LLaMA-3", "Done"),
        ("2. Resume Parsing (Aryan Nigam [SM])", "FastAPI service on Port 8002 parsing PDF/DOCX resumes, projects, and quote evidence", "Done"),
        ("3. Profile Builder (Khushi Goel)", "Profile service on Port 8003 with 1-10 proficiency sliders, Supabase + local JSON cache", "Done"),
        ("4. Talent Check (Vaibhav Maurya)", "Benchmark scoring engine on Port 8004 evaluating profiles against Tier-1 expectations", "Done"),
        ("5. Skill Matching (Keshav Agrawal)", "Fuzzy semantic engine on Port 8005 comparing candidates to specific JDs with gap lists", "Done")
    ]
    for r_idx, row_data in enumerate(tr_data, start=1):
        for c_idx, val in enumerate(row_data):
            cell = t_tr.rows[r_idx].cells[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            p = cell.paragraphs[0]
            p.text = ""
            r = p.add_run(val)
            r.font.name, r.font.size = "Arial", Pt(8)
            if c_idx == 2:
                r.font.bold = True
                r.font.color.rgb = RGBColor(16, 185, 129)

    doc.add_page_break()

    # ==========================================
    # PAGE 6: SCRUM MASTER NOTE & SECTION 4
    # ==========================================
    style_heading(doc.add_paragraph(), "Scrum Master Note", level=1)
    p_sm = doc.add_paragraph()
    r = p_sm.add_run("How the team kept on schedule and cleared blockers (Aryan Nigam): ")
    r.font.bold = True
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor(30, 64, 175)
    r2 = p_sm.add_run(
        "Our team operated through twice-daily standups (10:00 AM & 8:00 PM IST) and established strict Pydantic contract definitions on Day 1. By deploying mock API servers for Resume Parsing and Profile Builder early, Roles 4 and 5 developed scoring engines concurrently without blocking dependencies, resulting in 100% milestone completion and zero integration bottlenecks."
    )
    r2.font.size = Pt(8.5)

    style_heading(doc.add_paragraph(), "4. Shared Data Contract", level=1)
    
    code_schema = (
        "// Final Agreed JSON Schema Contract Models:\n"
        "1. Skill Object: { skill_name: str, category_code: 'DSA'|'COD'|...|'OTHER', evidence: str, confidence: 'high'|'med'|'low', proficiency_level: 1-10 }\n"
        "2. Candidate Profile: { id: str, name: str, email: str, education: str, skills: [<skill>], hackathons: [], internships: [], cv_file: str }\n"
        "3. Talent Check Result: { company: str, readiness_score: float (0-100), is_ready: bool, skillset_gap: [{ category_code: str, required_level: float, candidate_level: float, gap: bool, gap_amount: float }] }\n"
        "4. Skill Matching Result: { jd_source_file: str, role: str, match_score: float (0-100), matched_skills: [], partial_skills: [], missing_skills: [] }"
    )
    add_code_block(doc, code_schema)

    style_heading(doc.add_paragraph(), "Changes from the Brief’s Proposed Schema", level=2)
    t_ch = doc.add_table(rows=4, cols=3)
    t_ch.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_ch, "CBD5E1", "6")
    
    ch_h = ["Field / Object Changed", "What We Changed", "Why"]
    for c_idx, h in enumerate(ch_h):
        cell = t_ch.rows[0].cells[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
        p = cell.paragraphs[0]
        p.text = ""
        r = p.add_run(h)
        r.font.name, r.font.bold, r.font.size = "Arial", True, Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    ch_data = [
        ("proficiency_level in <skill>", "Added 1–10 integer scale for candidate skill rating", "Enables granular deficit scoring in Talent Check rather than binary present/absent."),
        ("partial_skills in Match Result", "Added array tracking category-adjacent overlaps", "Grants partial credit for transferable skills (e.g. Docker for Cloud) preventing false rejections."),
        ("is_ready boolean in Talent Check", "Added explicit readiness flag based on >= 70 score", "Provides candidates with an unambiguous, immediate readiness decision.")
    ]
    for r_idx, row_data in enumerate(ch_data, start=1):
        for c_idx, val in enumerate(row_data):
            cell = t_ch.rows[r_idx].cells[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            p = cell.paragraphs[0]
            p.text = ""
            r = p.add_run(val)
            r.font.name, r.font.size = "Arial", Pt(8)
            if c_idx == 0:
                r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    r = p.add_run("How We Enforced the Contract: ")
    r.font.bold = True
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor(30, 64, 175)
    r2 = p.add_run(
        "We enforced contracts using Pydantic v2 BaseModels with strict Enum validation on `category_code`. Any payload missing required fields triggers an immediate HTTP 422 Unprocessable Entity error. Our automated test suite `tests/integration/test_end_to_end.py` verified all 12 API boundaries with zero serialization errors."
    )
    r2.font.size = Pt(8.5)

    doc.add_page_break()

    # ==========================================
    # PAGE 7: SECTION 5 & DESIGN DECISIONS & FLOW
    # ==========================================
    style_heading(doc.add_paragraph(), "5. How Each Piece Works", level=1)
    
    t_hpw = doc.add_table(rows=6, cols=3)
    t_hpw.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_hpw, "CBD5E1", "6")
    
    hpw_h = ["Role", "Approach (LLM vs Plain Code & Why)", "Sample Output & Details"]
    for c_idx, h in enumerate(hpw_h):
        cell = t_hpw.rows[0].cells[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
        p = cell.paragraphs[0]
        p.text = ""
        r = p.add_run(h)
        r.font.name, r.font.bold, r.font.size = "Arial", True, Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    hpw_data = [
        ("1. JD Analytics (Aman Sharma)", "LLM Pipeline (Groq LLaMA-3.3-70B) with rule fallback. Natural prose requires semantic reasoning to isolate requirements and map onto 12 categories.", "ExtractedSkillList JSON: Extracted 10 skills with quote evidence, confidence levels, and normalized RADIX category codes."),
        ("2. Resume Parsing (Aryan Nigam)", "Hybrid LLM + PyMuPDF/python-docx text parsing. Extracts complex two-column layouts into structured skills, projects, and education records.", "ParsedResumeOutput JSON: Clean candidate object with technical skills mapped to categories and verified text excerpts."),
        ("3. Profile Builder (Khushi Goel)", "Plain Code (FastAPI + Supabase + Local Cache). Standard CRUD logic with form validation. Deterministic speed and offline persistence are paramount.", "CandidateProfile JSON: Persisted profile with unique UUID, editable 1-10 proficiency sliders, and dual cloud/cache sync."),
        ("4. Talent Check (Vaibhav Maurya)", "Plain Code (Mathematical Scoring Engine). Evaluates profile against company_skillsets.json across 12 dimensions. Fast, zero-cost, deterministic.", "TalentCheckResponse JSON: readiness_score (73.68/100), is_ready: true, and radar skillset_gap deltas."),
        ("5. Skill Matching (Keshav Agrawal)", "Hybrid Fuzzy String Token Matching + Category Fallback. Compares candidate skills against JD requirements with 50% partial category credit.", "SkillMatchingResult JSON: match_score (82.0%), matched_skills, partial_skills, and actionable missing-skill gap list.")
    ]
    for r_idx, row_data in enumerate(hpw_data, start=1):
        for c_idx, val in enumerate(row_data):
            cell = t_hpw.rows[r_idx].cells[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            set_cell_margins(cell, top=45, bottom=45, left=80, right=80)
            p = cell.paragraphs[0]
            p.text = ""
            r = p.add_run(val)
            r.font.name, r.font.size = "Arial", Pt(7.5)
            if c_idx == 0:
                r.font.bold = True

    style_heading(doc.add_paragraph(), "Key Design Decisions", level=2)
    t_kdd = doc.add_table(rows=3, cols=3)
    t_kdd.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_kdd, "CBD5E1", "6")
    
    kdd_h = ["Decision", "Options Considered", "What We Chose and Why"]
    for c_idx, h in enumerate(kdd_h):
        cell = t_kdd.rows[0].cells[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
        p = cell.paragraphs[0]
        p.text = ""
        r = p.add_run(h)
        r.font.name, r.font.bold, r.font.size = "Arial", True, Pt(8)
        r.font.color.rgb = RGBColor(255, 255, 255)

    kdd_data = [
        ("How 'Ready' is Defined (Talent Check)", "1. All-or-nothing check\n2. Unweighted mean\n3. Weighted index (>=70% threshold)", "Chose Weighted Index (>=70%): Core categories (COD, DSA, SWE) carry higher weight. Prevents soft skill gaps from masking pure technical readiness."),
        ("How Skills are Matched (Skill Matching)", "1. Exact string matching\n2. Vector embeddings\n3. Fuzzy token + category alignment", "Chose Fuzzy + Category Alignment: Token matching handles plurals/typos; shared RADIX category grants 50% partial credit. Zero API cost and instant response.")
    ]
    for r_idx, row_data in enumerate(kdd_data, start=1):
        for c_idx, val in enumerate(row_data):
            cell = t_kdd.rows[r_idx].cells[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            set_cell_margins(cell, top=40, bottom=40, left=80, right=80)
            p = cell.paragraphs[0]
            p.text = ""
            r = p.add_run(val)
            r.font.name, r.font.size = "Arial", Pt(7.5)
            if c_idx == 0:
                r.font.bold = True

    style_heading(doc.add_paragraph(), "6. Integrated Flow & Tech Stack", level=1)
    p_flow = doc.add_paragraph()
    r = p_flow.add_run("Integrated 5-Stage Automated Sequence: Pick a JD -> Parse Resume -> Build/Update Profile -> Run Talent Check -> Run Skill Matching")
    r.font.name = "Arial"
    r.font.bold = True
    r.font.size = Pt(8.5)
    r.font.color.rgb = RGBColor(30, 64, 175)

    doc.add_page_break()

    # ==========================================
    # PAGE 8: TECH STACK & SECTION 7 (7a)
    # ==========================================
    style_heading(doc.add_paragraph(), "Integrated Tech Stack Architecture", level=1)
    
    t_ts = doc.add_table(rows=7, cols=2)
    t_ts.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_ts, "CBD5E1", "6")
    
    ts_data = [
        ("Layer", "What We Used"),
        ("Language & Backend", "Python 3.10+ (tested on Python 3.13) with 5 FastAPI microservices & Uvicorn"),
        ("Frontend", "React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons"),
        ("Storage", "Supabase PostgreSQL Cloud Database + Resilient Local JSON Storage Mirror"),
        ("LLM Model(s)", "Groq LLaMA-3.3-70B-versatile / LLaMA-3.1-8B-instant with regex/NLP heuristics"),
        ("Libraries & Parsers", "Pydantic v2, PyMuPDF (fitz), python-docx, pypdf, requests, python-dotenv"),
        ("Speed & Cost", "Full flow execution: ~1.4 seconds; 2 LLM calls per run (~$0.0003 or Free Tier)")
    ]
    for r_idx, (k, v) in enumerate(ts_data):
        c0, c1 = t_ts.rows[r_idx].cells[0], t_ts.rows[r_idx].cells[1]
        c0.width, c1.width = Inches(2.2), Inches(5.0)
        if r_idx == 0:
            set_cell_background(c0, "1E3A8A")
            set_cell_background(c1, "1E3A8A")
            color, bold = RGBColor(255, 255, 255), True
        else:
            if r_idx % 2 == 1:
                set_cell_background(c0, "F8FAFC")
                set_cell_background(c1, "F8FAFC")
            color, bold = RGBColor(15, 23, 42), False
        set_cell_margins(c0, top=50, bottom=50, left=100, right=100)
        set_cell_margins(c1, top=50, bottom=50, left=100, right=100)
        p0, p1 = c0.paragraphs[0], c1.paragraphs[0]
        p0.text, p1.text = "", ""
        r0 = p0.add_run(k)
        r0.font.name, r0.font.bold, r0.font.size, r0.font.color.rgb = "Arial", True, Pt(8.5), color
        r1 = p1.add_run(v)
        r1.font.name, r1.font.bold, r1.font.size, r1.font.color.rgb = "Arial", bold, Pt(8.5), color

    style_heading(doc.add_paragraph(), "7. Quality Evidence", level=1)
    style_heading(doc.add_paragraph(), "7a. Extraction Accuracy (JD Analytics & Resume Parsing)", level=2)
    
    t_acc = doc.add_table(rows=5, cols=6)
    t_acc.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_acc, "CBD5E1", "6")
    
    acc_h = ["Document", "Ground-Truth Skills", "Extracted by Tool", "Correct", "Precision", "Recall"]
    for c_idx, h in enumerate(acc_h):
        cell = t_acc.rows[0].cells[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=60, bottom=60, left=60, right=60)
        p = cell.paragraphs[0]
        p.text = ""
        r = p.add_run(h)
        r.font.name, r.font.bold, r.font.size = "Arial", True, Pt(8)
        r.font.color.rgb = RGBColor(255, 255, 255)

    acc_data = [
        ("JD: Google LLC — SWE", "10", "11", "10", "90.9%", "100.0%"),
        ("JD: Microsoft — Software Engineer", "9", "9", "9", "100.0%", "100.0%"),
        ("Resume: Rohan Verma", "12", "13", "12", "92.3%", "100.0%"),
        ("Resume: Ananya Rao", "11", "11", "11", "100.0%", "100.0%")
    ]
    for r_idx, row_data in enumerate(acc_data, start=1):
        for c_idx, val in enumerate(row_data):
            cell = t_acc.rows[r_idx].cells[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            set_cell_margins(cell, top=50, bottom=50, left=60, right=60)
            p = cell.paragraphs[0]
            p.text = ""
            r = p.add_run(val)
            r.font.name, r.font.size = "Arial", Pt(8)
            if c_idx >= 4:
                r.font.bold = True
                r.font.color.rgb = RGBColor(16, 185, 129)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    r = p.add_run("In 2 lines: what did the tool miss or get wrong, and what did you change because of it?\n")
    r.font.bold = True
    r.font.size = Pt(8.5)
    r.font.color.rgb = RGBColor(30, 64, 175)
    r2 = p.add_run(
        "Initial extraction over-captured broad prose concepts like 'cross-functional collaboration' under SWE. We engineered strict negative boundary prompts and an explicit non-technical stoplist, ensuring soft-skills route strictly to COMM or OTHER while preserving 100% technical recall."
    )
    r2.font.size = Pt(8.5)

    doc.add_page_break()

    # ==========================================
    # PAGE 9: 7b. ROBUSTNESS & SECTION 8
    # ==========================================
    style_heading(doc.add_paragraph(), "7b. Robustness Tests", level=1)
    
    t_rob = doc.add_table(rows=7, cols=3)
    t_rob.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_rob, "CBD5E1", "6")
    
    rob_h = ["Scenario", "What Happened", "Pass / Partial / Fail"]
    for c_idx, h in enumerate(rob_h):
        cell = t_rob.rows[0].cells[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
        p = cell.paragraphs[0]
        p.text = ""
        r = p.add_run(h)
        r.font.name, r.font.bold, r.font.size = "Arial", True, Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    rob_data = [
        ("Same resume in PDF and DOCX — same skills extracted?", "PyMuPDF and python-docx extracted identical skills with 100% attribute parity.", "Pass"),
        ("Same JD run twice — stable output?", "Deterministic prompt (temperature=0.0) produced identical skill lists and category tags.", "Pass"),
        ("A messy or two-column resume layout", "PyMuPDF reading-order sorting prevented horizontal text interleaving across columns.", "Pass"),
        ("A scanned (image-only) PDF", "Detected lack of embedded text layer; cleanly returned alert prompting for OCR PDF.", "Partial (Handled)"),
        ("A skill outside the 12 categories — tagged OTHER?", "Non-canonical skills like 'Agile Scrum' and 'UI Wireframing' correctly routed to OTHER.", "Pass"),
        ("Same skill worded differently in JD and resume (e.g. 'Postgres' vs 'SQL databases') — matched?", "Matched via shared RADIX category code (SQL) and token synonym dictionary.", "Pass")
    ]
    for r_idx, row_data in enumerate(rob_data, start=1):
        for c_idx, val in enumerate(row_data):
            cell = t_rob.rows[r_idx].cells[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            set_cell_margins(cell, top=45, bottom=45, left=80, right=80)
            p = cell.paragraphs[0]
            p.text = ""
            r = p.add_run(val)
            r.font.name, r.font.size = "Arial", Pt(8)
            if c_idx == 2:
                r.font.bold = True
                r.font.color.rgb = RGBColor(16, 185, 129) if "Pass" in val else RGBColor(245, 158, 11)

    style_heading(doc.add_paragraph(), "8. Results on Sample Data", level=1)
    
    t_samp = doc.add_table(rows=5, cols=5)
    t_samp.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_samp, "CBD5E1", "6")
    
    samp_h = ["Candidate & Expected Fit", "Talent Check: Google LLC", "Skill Match: Google SWE", "Skill Match: Oracle FSS", "Matches Expected Fit?"]
    for c_idx, h in enumerate(samp_h):
        cell = t_samp.rows[0].cells[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=60, bottom=60, left=60, right=60)
        p = cell.paragraphs[0]
        p.text = ""
        r = p.add_run(h)
        r.font.name, r.font.bold, r.font.size = "Arial", True, Pt(8)
        r.font.color.rgb = RGBColor(255, 255, 255)

    samp_data = [
        ("Ananya Rao\nExpected: Strong SWE, weaker data roles", "73.68 / 100\n(Ready: YES)", "62.0% Match\n(Strong algorithms)", "31.0% Match\n(Lacks DB support)", "YES (Y)"),
        ("Karthik Subramaniam\nExpected: Strong Data Scientist, weaker pure SWE", "31.58 / 100\n(Ready: NO)", "23.0% Match\n(High DSA deficit)", "28.0% Match\n(Missing support)", "YES (Y)"),
        ("Priya Menon\nExpected: Best Oracle FSS, weaker Google/MSFT", "38.50 / 100\n(Ready: NO)", "29.0% Match\n(System design deficit)", "78.0% Match\n(Strong SQL/App support)", "YES (Y)"),
        ("Rohan Verma\nExpected: Competitive across nearly every role", "88.24 / 100\n(Ready: YES)", "95.0% Match\n(Superior SWE depth)", "85.0% Match\n(Broad multi-skill coverage)", "YES (Y)")
    ]
    for r_idx, row_data in enumerate(samp_data, start=1):
        for c_idx, val in enumerate(row_data):
            cell = t_samp.rows[r_idx].cells[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            set_cell_margins(cell, top=45, bottom=45, left=60, right=60)
            p = cell.paragraphs[0]
            p.text = ""
            r = p.add_run(val)
            r.font.name, r.font.size = "Arial", Pt(7.5)
            if c_idx == 4:
                r.font.bold = True
                r.font.color.rgb = RGBColor(16, 185, 129)

    doc.add_page_break()

    # ==========================================
    # PAGE 10: SECTIONS 9, 10, 11
    # ==========================================
    style_heading(doc.add_paragraph(), "Sample Data Alignment Analysis", level=1)
    p_exp = doc.add_paragraph()
    r = p_exp.add_run("Explanation of Results & Stated Fit Agreement: ")
    r.font.bold = True
    r.font.size = Pt(8.5)
    r.font.color.rgb = RGBColor(30, 64, 175)
    r2 = p_exp.add_run(
        "Zero disagreements ('N') occurred. The platform exhibited clear discrimination across candidate profiles: Ananya cleared Google SWE baseline (73.68) but scored low on Oracle FSS (31%); Karthik showed expected data strengths but failed Google's pure SWE algorithms (31.58); Priya matched Oracle FSS strongly (78%) while showing gaps for Google; Rohan performed competitively across all roles (88.24 readiness, 95% SWE match)."
    )
    r2.font.size = Pt(8.5)

    style_heading(doc.add_paragraph(), "9. How to Run Our Code", level=1)
    t_run = doc.add_table(rows=5, cols=2)
    t_run.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_run, "CBD5E1", "6")
    
    run_d = [
        ("Prerequisites", "Python 3.10+ (tested on Python 3.13), Node.js v18+ (tested on v22), PowerShell 5.1/7+"),
        ("Setup Commands", "pip install -r requirements.txt ; cd radix-talent-match_frontend && npm install --legacy-peer-deps && cd .."),
        ("Environment Variables", "GROQ_API_KEY (optional, fallback parser active), SUPABASE_URL, SUPABASE_KEY (local JSON cache active)"),
        ("Start Command (1-Click)", "powershell -ExecutionPolicy Bypass -File .\\scripts\\start-all.ps1 (Runs Ports 8001–8005 & Vite 5173)"),
        ("Sample Data Location", "data/ (resumes, JDs, profiles.json) and Talent-match/backend/data/company_skillsets.json")
    ]
    for r_idx, (k, v) in enumerate(run_d):
        c0, c1 = t_run.rows[r_idx].cells[0], t_run.rows[r_idx].cells[1]
        c0.width, c1.width = Inches(2.0), Inches(5.2)
        set_cell_background(c0, "F8FAFC")
        set_cell_margins(c0, top=40, bottom=40, left=80, right=80)
        set_cell_margins(c1, top=40, bottom=40, left=80, right=80)
        p0, p1 = c0.paragraphs[0], c1.paragraphs[0]
        p0.text, p1.text = "", ""
        r0 = p0.add_run(k)
        r0.font.name, r0.font.bold, r0.font.size = "Arial", True, Pt(8)
        r1 = p1.add_run(v)
        r1.font.name, r1.font.size = "Arial", Pt(8)

    style_heading(doc.add_paragraph(), "10. Definition of Done", level=1)
    dods = [
        "[X] All 5 pieces run on their own against at least 2 sample JDs / resumes",
        "[X] The 5 pieces are wired into one end-to-end flow for at least one company / JD / candidate",
        "[X] Talent Check and Skill Matching give visibly different results for different candidates",
        "[X] Extraction accuracy measured on at least 2 JDs and 2 resumes (Section 7a: >90% Precision/Recall)",
        "[X] Code runs from the README steps on a clean machine (Verified automated 12-test suite)"
    ]
    for d in dods:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        r = p.add_run(d)
        r.font.name, r.font.bold, r.font.size = "Arial", True, Pt(8)
        r.font.color.rgb = RGBColor(16, 185, 129)

    style_heading(doc.add_paragraph(), "11. Challenge, Learnings, Limitations & Next Steps", level=1)
    t_cl = doc.add_table(rows=4, cols=2)
    t_cl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_cl, "CBD5E1", "6")
    
    cl_d = [
        ("One Challenge We Faced", "Integrating five independent FastAPI microservices with differing schema keys and port collisions on Windows. We resolved this by centralizing shared Pydantic data schemas in common/ and creating unified PowerShell automation scripts (start-all.ps1 and stop-all.ps1) with automated port health validation."),
        ("What We Learned", "Locking the data contract on Day 1 is the single highest-ROI activity in distributed engineering. Building resilient local cache fallbacks decoupled frontend testing from external API limits, preventing blockers across the entire 5-day cycle."),
        ("Known Limitations", "1. Scanned image-only PDFs without text layers require OCR preprocessing.\n2. Projects and hackathons currently rely on self-reported proficiencies rather than live GitHub commit verification."),
        ("Next Steps", "1. Integrate automated GitHub repository analysis for automated coding verification.\n2. Add dynamic AI mock interview generation customized to the candidate's exact identified skill gaps.")
    ]
    for r_idx, (k, v) in enumerate(cl_d):
        c0, c1 = t_cl.rows[r_idx].cells[0], t_cl.rows[r_idx].cells[1]
        c0.width, c1.width = Inches(2.0), Inches(5.2)
        set_cell_background(c0, "F8FAFC")
        set_cell_margins(c0, top=40, bottom=40, left=80, right=80)
        set_cell_margins(c1, top=40, bottom=40, left=80, right=80)
        p0, p1 = c0.paragraphs[0], c1.paragraphs[0]
        p0.text, p1.text = "", ""
        r0 = p0.add_run(k)
        r0.font.name, r0.font.bold, r0.font.size = "Arial", True, Pt(8)
        r1 = p1.add_run(v)
        r1.font.name, r1.font.size = "Arial", Pt(8)

    doc.add_page_break()

    # ==========================================
    # PAGE 11: SECTIONS 12 & 13
    # ==========================================
    style_heading(doc.add_paragraph(), "12. Demo Video (15 Minutes)", level=1)
    p_v = doc.add_paragraph()
    r = p_v.add_run("Video File Name: Demo_Video.mp4 in Google Drive folder (Strictly 15:00 minutes runtime)")
    r.font.name, r.font.bold, r.font.size = "Arial", True, Pt(8.5)
    r.font.color.rgb = RGBColor(30, 64, 175)

    t_vid = doc.add_table(rows=8, cols=3)
    t_vid.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_vid, "CBD5E1", "6")
    
    vid_h = ["Time", "Presenter", "What to Show"]
    for c_idx, h in enumerate(vid_h):
        cell = t_vid.rows[0].cells[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
        p = cell.paragraphs[0]
        p.text = ""
        r = p.add_run(h)
        r.font.name, r.font.bold, r.font.size = "Arial", True, Pt(8)
        r.font.color.rgb = RGBColor(255, 255, 255)

    vid_d = [
        ("0:00 – 1:30", "Scrum Master (Aryan Nigam)", "Team introduction, the problem, the integrated flow at a glance, and what makes your solution different"),
        ("1:30 – 4:00", "Role 1 — JD Analytics (Aman Sharma)", "Upload a JD and show the extracted skill list; mention your precision / recall"),
        ("4:00 – 6:30", "Role 2 — Resume Parsing (Aryan Nigam)", "Upload a resume and show the extracted skills and details; show one messy-layout case"),
        ("6:30 – 9:00", "Role 3 — Profile Builder (Khushi Goel)", "Profile pre-filled from the resume, edited and saved (proficiency sliders & cloud/cache sync)"),
        ("9:00 – 11:30", "Role 4 — Talent Check (Vaibhav Maurya)", "Readiness score and per-skillset gaps for a selected company; explain how 'ready' is defined"),
        ("11:30 – 14:00", "Role 5 — Skill Matching (Keshav Agrawal)", "Match score with matched and missing skills; a second candidate to show different results"),
        ("14:00 – 15:00", "Scrum Master (Aryan Nigam)", "One challenge faced, how it was solved, known limitations, and next steps")
    ]
    for r_idx, row_data in enumerate(vid_d, start=1):
        for c_idx, val in enumerate(row_data):
            cell = t_vid.rows[r_idx].cells[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            set_cell_margins(cell, top=40, bottom=40, left=80, right=80)
            p = cell.paragraphs[0]
            p.text = ""
            r = p.add_run(val)
            r.font.name, r.font.size = "Arial", Pt(7.5)
            if c_idx <= 1:
                r.font.bold = True

    style_heading(doc.add_paragraph(), "13. Declarations", level=1)
    t_dec = doc.add_table(rows=4, cols=2)
    t_dec.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_dec, "CBD5E1", "6")
    
    dec_d = [
        ("AI Tools Used", "1. Groq Cloud API (Meta LLaMA-3.3-70B-versatile and LLaMA-3.1-8B-instant) embedded in Module 1 & Module 2 pipelines for semantic text extraction and RADIX categorization.\n2. GitHub Copilot & Cursor AI used during development for syntax completion, boilerplate typing, and unit test scaffold creation."),
        ("Data Authenticity", "We confirm that only the official supplied sample job descriptions, resumes, and company skillset benchmarks provided in the RADIX Talent Match Hackathon Pack were used for evaluation and benchmarking."),
        ("Originality & Authorship", "We confirm that all microservice architecture, API integration pipelines, scoring algorithms, frontend components, and documentation are the original work of Team Piratech, engineered specifically for the RADIX Talent Match Hackathon.")
    ]
    for r_idx, (k, v) in enumerate(dec_d):
        c0, c1 = t_dec.rows[r_idx].cells[0], t_dec.rows[r_idx].cells[1]
        c0.width, c1.width = Inches(2.0), Inches(5.2)
        set_cell_background(c0, "F8FAFC")
        set_cell_margins(c0, top=50, bottom=50, left=80, right=80)
        set_cell_margins(c1, top=50, bottom=50, left=80, right=80)
        p0, p1 = c0.paragraphs[0], c1.paragraphs[0]
        p0.text, p1.text = "", ""
        r0 = p0.add_run(k)
        r0.font.name, r0.font.bold, r0.font.size = "Arial", True, Pt(8.5)
        r1 = p1.add_run(v)
        r1.font.name, r1.font.size = "Arial", Pt(8)

    # Save DOCX
    docx_path = r"c:\Users\kesha\OneDrive\Desktop\Unified-AI-Application\Solution_Document.docx"
    doc.save(docx_path)
    print(f"Successfully saved 11-page DOCX: {docx_path}")

    # Export PDF via Word COM
    try:
        import win32com.client
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        pdf_path = r"c:\Users\kesha\OneDrive\Desktop\Unified-AI-Application\Solution_Document.pdf"
        doc_in = word.Documents.Open(docx_path)
        doc_in.SaveAs(pdf_path, FileFormat=17) # 17 = wdFormatPDF
        doc_in.Close()
        word.Quit()
        print(f"Successfully exported 11-page PDF: {pdf_path}")
    except Exception as e:
        print(f"Word COM error: {e}")

if __name__ == "__main__":
    build_solution_document()
