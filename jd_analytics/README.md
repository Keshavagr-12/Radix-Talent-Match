# RADIX JD Analytics Microservice (Module 01)

An intelligent job description analysis microservice that parses documents (PDF, DOCX, TXT) and raw job postings, extracts technical competencies, and maps them directly into the 12 official RADIX skill categories using Groq LLM with a deterministic rule-based fallback.

---

## 📁 Professional Folder Architecture

```text
jd_analytics/
├── .env                     # Local environment configuration (Port 8001, GROQ_API_KEY)
├── .env.example             # Environment variable template
├── .gitignore               # Python ignore rules
├── requirements.txt         # Pinned microservice dependencies
├── README.md                # Comprehensive documentation
├── api.py                   # FastAPI application entrypoint (Port 8001)
├── analyzer.py              # Groq LLM analysis & rule-based fallback logic
├── extractor.py             # Multi-format document parser (PDF, DOCX, TXT, MD)
├── schemas.py               # Pydantic v2 schemas and data validation contracts
├── prompts.py               # RADIX competency taxonomy and system instructions
├── main.py                  # Standalone CLI interface
├── app.py                   # Streamlit interactive UI application
├── tests/                   # Automated pytest test suite
│   ├── test_api.py          # FastAPI endpoint integration tests
│   ├── test_extractor.py    # Document parsing unit tests
│   └── test_analyzer.py     # Skill classification unit tests
└── module 1/                # Backward compatibility stubs for legacy scripts
```

---

## ⚡ Quick Start

### 1. Installation
```powershell
cd jd_analytics
pip install -r requirements.txt
```

### 2. Environment Variables
Create a `.env` file (or copy `.env.example`):
```env
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-20b
PORT=8001
HOST=0.0.0.0
```

### 3. Running the FastAPI Server (Port 8001)
```powershell
python -m uvicorn api:app --host 127.0.0.1 --port 8001 --reload
```
Interactive Swagger Documentation: `http://127.0.0.1:8001/docs`

### 4. Running the Streamlit App
```powershell
streamlit run app.py
```

### 5. Running the CLI
```powershell
python main.py --text "Looking for a Python developer with SQL, Docker, and Data Structures"
```

### 6. Running Tests
```powershell
pytest tests/ -v
```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health probe returning service status and timestamp |
| `GET` | `/jd-analytics/list` | Sample pre-analyzed job descriptions |
| `GET` | `/jd-analytics/categories` | Official 12 RADIX categories specification |
| `POST` | `/jd-analytics/extract` | Multipart upload (`file`, `raw_text`, `company`, `role`) |
| `POST` | `/jd-analytics/extract-json` | JSON payload (`raw_text`, `company`, `role`) |

---

## 🏷️ The 12 RADIX Competency Categories

- **COD:** Coding & Programming Languages (Python, Java, C++, TypeScript, Go)
- **DSA:** Data Structures & Algorithms (Trees, Graphs, Dynamic Programming)
- **OOD:** Object-Oriented Design (SOLID principles, Design Patterns)
- **APTI:** Aptitude & Quantitative Reasoning
- **COMM:** Technical Communication & Collaboration
- **AI:** Artificial Intelligence & Machine Learning (PyTorch, LLMs, NLP)
- **CLOUD:** Cloud & DevOps (AWS, Azure, GCP, Docker, Kubernetes)
- **SQL:** Relational Databases & SQL Queries
- **SWE:** Software Engineering (Git, CI/CD, Testing, Agile)
- **SYSD:** System Design & Distributed Systems (Microservices, Scalability)
- **NETW:** Networking Protocols (TCP/IP, HTTP/3, gRPC)
- **OS:** Operating Systems & Concurrency (Linux, Multithreading)
- **OTHER:** Specialized domain technologies
