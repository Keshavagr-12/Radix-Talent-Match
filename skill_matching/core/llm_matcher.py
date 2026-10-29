"""
LLM-Powered Semantic Skill Matcher for RADIX Role 5.
Uses Groq API with reasoning model to handle fuzziness, synonymy,
and adjacent technical competencies across candidate profiles and job descriptions.
Falls back seamlessly to deterministic fuzzy_matcher if offline.
"""

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from dotenv import load_dotenv

try:
    from skill_matching.core.fuzzy_matcher import match_jd_against_candidate
    from skill_matching.models.schemas import PartialMatchItem
except ImportError:
    from core.fuzzy_matcher import match_jd_against_candidate
    from models.schemas import PartialMatchItem

_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)
load_dotenv()

logger = logging.getLogger("skill_matching.llm_matcher")

DEFAULT_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")


def _get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        from groq import Groq
        return Groq(api_key=api_key)
    except Exception as exc:
        logger.debug(f"Groq client init error: {exc}")
        return None


def run_llm_skill_matching(
    jd_skills: List[Dict[str, Any]],
    candidate_skills: List[Dict[str, Any]],
    company: str = "Target Company",
    role: str = "Software Engineer",
    timeout_sec: float = 12.0
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[PartialMatchItem], float]:
    """
    Compare JD skills against Candidate skills using Groq LLM.
    Handles semantic nuances and terminology differences.
    Falls back to fuzzy_matcher on any error or timeout.
    """
    client = _get_groq_client()
    if not client:
        logger.info("No Groq API key available, using deterministic fuzzy matcher.")
        return match_jd_against_candidate(jd_skills, candidate_skills, company=company, role=role)

    # Simplified candidate skills for prompt
    cand_summary = [
        {
            "skill_name": cs.get("skill_name"),
            "category_code": cs.get("category_code"),
            "evidence": cs.get("evidence"),
            "level": cs.get("proficiency_level") or cs.get("level") or 7.0
        }
        for cs in candidate_skills
    ]

    jd_summary = [
        {
            "skill_name": js.get("skill_name"),
            "category_code": js.get("category_code"),
            "evidence": js.get("evidence"),
            "confidence": js.get("confidence", "high")
        }
        for js in jd_skills
    ]

    system_prompt = (
        "You are an expert technical hiring analyst. Compare a candidate's verified skills against "
        f"the extracted requirements of a specific Job Description for '{role}' at '{company}'.\n"
        "Account for semantic fuzziness: candidates and JDs describe identical or related concepts differently "
        "(e.g., 'C++ multithreaded scheduler' fulfills 'OS concurrency', 'PostgreSQL' fulfills 'SQL database').\n\n"
        "For EACH JD skill, classify into one of:\n"
        "- 'FULL_MATCH': Candidate has this skill or direct semantic equivalent.\n"
        "- 'PARTIAL_MATCH': Candidate has adjacent or foundational competency in the same domain/category, "
        "but lacks specific tool/framework.\n"
        "- 'MISSING': No verified evidence in candidate skills.\n\n"
        "Output MUST be valid JSON with this exact structure:\n"
        "{\n"
        '  "evaluations": [\n'
        '    {\n'
        '      "jd_skill_name": "string (exact name from JD list)",\n'
        '      "status": "FULL_MATCH" | "PARTIAL_MATCH" | "MISSING",\n'
        '      "matched_candidate_skill": "string or null",\n'
        '      "match_explanation": "string explaining how candidate matches or null",\n'
        '      "gap_explanation": "string explaining what is missing or why there is a gap",\n'
        '      "recommendation": "actionable advice on how candidate can prepare/bridge gap"\n'
        '    }\n'
        '  ]\n'
        "}"
    )

    user_prompt = (
        f"Target Role: {role} at {company}\n\n"
        f"JD Requirements:\n{json.dumps(jd_summary, indent=2)}\n\n"
        f"Candidate Skills:\n{json.dumps(cand_summary, indent=2)}\n\n"
        "Evaluate every JD requirement. Respond strictly with JSON."
    )

    try:
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=2500,
            timeout=timeout_sec
        )

        content = response.choices[0].message.content
        data = json.loads(content)
        evals = data.get("evaluations", [])

        if not evals or not isinstance(evals, list):
            logger.warning("Groq returned empty evaluations list, falling back to fuzzy matcher.")
            return match_jd_against_candidate(jd_skills, candidate_skills, company=company, role=role)

        eval_map = {e.get("jd_skill_name", "").strip().lower(): e for e in evals}
        cand_map = {cs.get("skill_name", "").strip().lower(): cs for cs in candidate_skills}

        matched_skills: List[Dict[str, Any]] = []
        missing_skills: List[Dict[str, Any]] = []
        partial_skills: List[PartialMatchItem] = []
        earned_points = 0.0

        for js in jd_skills:
            js_name = str(js.get("skill_name", "")).strip()
            ev = eval_map.get(js_name.lower())

            if not ev:
                # Find by substring match
                for k, v in eval_map.items():
                    if k in js_name.lower() or js_name.lower() in k:
                        ev = v
                        break

            status = (ev.get("status") if ev else "MISSING").upper()
            cand_skill_name = ev.get("matched_candidate_skill") if ev else None
            matched_cand = cand_map.get(cand_skill_name.lower()) if cand_skill_name else None

            # If no matched_cand resolved, look through candidate_skills
            if not matched_cand and cand_skill_name:
                for cs in candidate_skills:
                    if cs.get("skill_name", "").strip().lower() == cand_skill_name.strip().lower():
                        matched_cand = cs
                        break

            if status == "FULL_MATCH":
                cand_lvl = (
                    matched_cand.get("proficiency_level") or matched_cand.get("level")
                    if matched_cand else 8
                )
                matched_skills.append({
                    "skill_name": js_name,
                    "category_code": js.get("category_code", "OTHER"),
                    "evidence": (matched_cand.get("evidence") if matched_cand else None) or js.get("evidence"),
                    "confidence": js.get("confidence", "high"),
                    "proficiency_level": cand_lvl,
                    "match_type": "semantic",
                    "match_explanation": ev.get("match_explanation") or f"Semantic alignment with candidate {cand_skill_name}"
                })
                earned_points += 10.0

            elif status == "PARTIAL_MATCH":
                cand_ref = matched_cand or (candidate_skills[0] if candidate_skills else {})
                p_item = PartialMatchItem(
                    jd_skill=js,
                    candidate_skill=cand_ref,
                    similarity_note=ev.get("match_explanation") or ev.get("gap_explanation") or f"Adjacent foundation via {cand_skill_name}",
                    gap_explanation=ev.get("gap_explanation") or f"Requires practical hands-on evidence in {js_name}."
                )
                partial_skills.append(p_item)

                missing_item = dict(js)
                missing_item["gap_explanation"] = ev.get("gap_explanation") or p_item.similarity_note
                missing_item["recommendation"] = ev.get("recommendation") or f"Prepare demonstration project in {js_name}."
                missing_skills.append(missing_item)
                earned_points += 5.0

            else:
                missing_item = dict(js)
                missing_item["gap_explanation"] = (
                    ev.get("gap_explanation") if ev else
                    f"Required competency for {role} at {company}. No candidate evidence found."
                )
                missing_item["recommendation"] = (
                    ev.get("recommendation") if ev else
                    f"Build coursework or project demonstrating {js_name} ({js.get('category_code', 'OTHER')})."
                )
                missing_skills.append(missing_item)

        logger.info(f"LLM Matching successful: {len(matched_skills)} matched, {len(missing_skills)} missing, {len(partial_skills)} partial.")
        return matched_skills, missing_skills, partial_skills, earned_points

    except Exception as exc:
        logger.warning(f"Groq LLM matching failed ({exc}), falling back to deterministic fuzzy matcher.")
        return match_jd_against_candidate(jd_skills, candidate_skills, company=company, role=role)
