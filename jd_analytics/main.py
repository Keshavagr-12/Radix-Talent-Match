"""
CLI Entry Point for RADIX JD Analytics.
Usage:
    python main.py <path-to-jd-file>
    python main.py --file "sample.pdf"
    python main.py --text "We are looking for a Python developer with SQL and Docker..."
"""

import sys
import argparse
from pathlib import Path

try:
    from .extractor import extract_text
    from .analyzer import analyze_job_description
except (ImportError, ValueError):
    from extractor import extract_text
    from analyzer import analyze_job_description


def main():
    parser = argparse.ArgumentParser(description="RADIX JD Analytics CLI")
    parser.add_argument("file_positional", nargs="?", help="Path to JD file (PDF, DOCX, TXT)")
    parser.add_argument("--file", "-f", dest="file_opt", help="Path to JD file")
    parser.add_argument("--text", "-t", dest="raw_text", help="Direct job description text string")
    args = parser.parse_args()

    file_path = args.file_positional or args.file_opt

    if args.raw_text:
        text = args.raw_text.strip()
        print("\nAnalyzing provided job description text...\n")
        result = analyze_job_description(text)
        print(result.model_dump_json(indent=2))
        return

    if not file_path:
        file_path = input("Enter the path of your JD file (PDF/DOCX/TXT): ").strip().strip('"')

    path = Path(file_path)
    if not path.is_file():
        print(f"Error: File '{file_path}' does not exist.")
        sys.exit(1)

    try:
        content = path.read_bytes()
        jd_text = extract_text(path.name, content)
        print(f"\nAnalyzing '{path.name}' ({len(jd_text)} characters)...\n")
        result = analyze_job_description(jd_text)
        print(result.model_dump_json(indent=2))
    except Exception as exc:
        print(f"Analysis failed: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
