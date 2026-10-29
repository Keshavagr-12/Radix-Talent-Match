import {
  ExtractedSkillList,
  ParsedResumeOutput,
  CandidateProfile,
  RadixCategoryCode,
} from '../types/radix';

/**
 * ILLUSTRATIVE COMPANY EXPECTATIONS SNAPSHOT
 * Mirrors `talent_check_company_skillsets.json` referenced in the hackathon brief.
 * Levels are on a 1–10 scale across all 12 RADIX skill categories.
 * Note: These values are illustrative demo expectations for the hackathon prototype.
 */
export interface CompanyExpectationProfile {
  company: string;
  shortName: string;
  tierDescriptor: string;
  headquarters: string;
  evaluationSummary: string;
  readinessThreshold: number;
  expectedLevels: Record<Exclude<RadixCategoryCode, 'OTHER'>, number>;
}

export const COMPANY_SKILLSET_SNAPSHOT: CompanyExpectationProfile[] = [
  {
    company: 'Google LLC',
    shortName: 'Google',
    tierDescriptor: 'Global Hyperscale Technology & AI Engineering',
    headquarters: 'Bengaluru, India (Hybrid)',
    evaluationSummary:
      'Emphasizes deep algorithmic rigor (DSA), high-concurrency distributed systems (SYSD), production coding fluency (COD), and foundational AI/Cloud engineering.',
    readinessThreshold: 76,
    expectedLevels: {
      COD: 9,
      DSA: 9,
      OOD: 8,
      APTI: 8,
      COMM: 7,
      AI: 8,
      CLOUD: 8,
      SQL: 7,
      SWE: 8,
      SYSD: 8,
      NETW: 7,
      OS: 8,
    },
  },
  {
    company: 'Microsoft Corporation',
    shortName: 'Microsoft',
    tierDescriptor: 'Enterprise Cloud, Developer Platforms & Applied Data',
    headquarters: 'Hyderabad, India',
    evaluationSummary:
      'Balances strong Object-Oriented Design (OOD), Software Engineering lifecycle (SWE), Cloud architecture, and enterprise SQL/Data systems alongside solid DSA.',
    readinessThreshold: 72,
    expectedLevels: {
      COD: 8,
      DSA: 8,
      OOD: 9,
      APTI: 7,
      COMM: 8,
      AI: 7,
      CLOUD: 8,
      SQL: 8,
      SWE: 9,
      SYSD: 8,
      NETW: 7,
      OS: 7,
    },
  },
  {
    company: 'Oracle Financial Services Software',
    shortName: 'Oracle FSS',
    tierDescriptor: 'Core Banking Platforms, Relational Data & Enterprise Support',
    headquarters: 'Bengaluru / Mumbai / Chennai, India',
    evaluationSummary:
      'Prioritizes advanced SQL & PL/SQL proficiency, Object-Oriented Java/Enterprise systems, Operating Systems reliability, Networking diagnostics, and clear stakeholder communication.',
    readinessThreshold: 65,
    expectedLevels: {
      COD: 7,
      DSA: 6,
      OOD: 7,
      APTI: 7,
      COMM: 8,
      AI: 4,
      CLOUD: 6,
      SQL: 9,
      SWE: 7,
      SYSD: 6,
      NETW: 7,
      OS: 7,
    },
  },
];

/**
 * 6 SAMPLE JOB DESCRIPTIONS FROM THE HACKATHON BRIEF
 * 3 Companies × 2 Roles Each
 */
export const SAMPLE_JOB_DESCRIPTIONS: ExtractedSkillList[] = [
  {
    id: 'jd-google-swe',
    source_type: 'jd',
    source_file: 'Google_Software_Engineer_Bengaluru.pdf',
    company: 'Google LLC',
    role: 'Software Engineer (SWE)',
    location: 'Bengaluru, India (Hybrid)',
    analyzed_at: '2026-10-25T10:15:00Z',
    summary:
      'Design, build, and maintain planet-scale distributed backend services, high-throughput storage engines, and fault-tolerant microservices in C++, Go, or Java.',
    required_technologies: ['C++', 'Go', 'Java', 'Python', 'gRPC', 'Kubernetes', 'GCP', 'Spanner', 'Linux'],
    skills: [
      {
        skill_name: 'C++ / Go / Java Production Coding',
        category_code: 'COD',
        evidence: '"Write clean, high-performance, thread-safe production code in C++, Go, or Java."',
        confidence: 'high',
      },
      {
        skill_name: 'Advanced Data Structures & Graph Algorithms',
        category_code: 'DSA',
        evidence: '"Optimize latency-critical paths using custom trees, graphs, and dynamic programming."',
        confidence: 'high',
      },
      {
        skill_name: 'Distributed Systems Architecture',
        category_code: 'SYSD',
        evidence: '"Architect fault-tolerant services handling millions of QPS with horizontal sharding."',
        confidence: 'high',
      },
      {
        skill_name: 'Object-Oriented & Modular API Design',
        category_code: 'OOD',
        evidence: '"Design extensible domain abstractions and clean service interfaces."',
        confidence: 'high',
      },
      {
        skill_name: 'Google Cloud Platform & Kubernetes',
        category_code: 'CLOUD',
        evidence: '"Deploy containerized workloads across GKE clusters and multi-region cloud infrastructure."',
        confidence: 'high',
      },
      {
        skill_name: 'Linux Kernel & Concurrency Internals',
        category_code: 'OS',
        evidence: '"Diagnose multithreading lock contention, memory paging, and Linux system calls."',
        confidence: 'high',
      },
      {
        skill_name: 'gRPC & TCP/IP Network Protocols',
        category_code: 'NETW',
        evidence: '"Build low-latency RPC communication layers over HTTP/2, gRPC, and TCP/IP."',
        confidence: 'medium',
      },
      {
        skill_name: 'Automated Testing & CI/CD Pipelines',
        category_code: 'SWE',
        evidence: '"Maintain rigorous unit, integration, and load testing standards with peer code reviews."',
        confidence: 'high',
      },
      {
        skill_name: 'Distributed SQL & Relational Storage',
        category_code: 'SQL',
        evidence: '"Query and model transactional schemas using Cloud Spanner and PostgreSQL."',
        confidence: 'medium',
      },
      {
        skill_name: 'Cross-Team Design Documentation',
        category_code: 'COMM',
        evidence: '"Author clear technical design docs (TDDs) and collaborate across global engineering teams."',
        confidence: 'medium',
      },
    ],
  },
  {
    id: 'jd-google-ds',
    source_type: 'jd',
    source_file: 'Google_Data_Scientist_Bengaluru.pdf',
    company: 'Google LLC',
    role: 'Data Scientist',
    location: 'Bengaluru, India',
    analyzed_at: '2026-10-25T11:30:00Z',
    summary:
      'Develop statistical models, large-scale machine learning pipelines, causal inference experiments, and predictive ranking algorithms across petabyte-scale datasets.',
    required_technologies: ['Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'SQL', 'BigQuery', 'GCP Vertex AI', 'Pandas'],
    skills: [
      {
        skill_name: 'Machine Learning & Deep Learning Pipelines',
        category_code: 'AI',
        evidence: '"Train, evaluate, and deploy supervised and transformer-based models using PyTorch/TensorFlow."',
        confidence: 'high',
      },
      {
        skill_name: 'Statistical Modeling & Causal Inference',
        category_code: 'APTI',
        evidence: '"Design rigorous A/B experiments, hypothesis tests, and Bayesian regression models."',
        confidence: 'high',
      },
      {
        skill_name: 'Analytical SQL & BigQuery Optimization',
        category_code: 'SQL',
        evidence: '"Write complex analytical queries, window functions, and aggregations over petabyte tables."',
        confidence: 'high',
      },
      {
        skill_name: 'Python Scientific Computing (NumPy/Pandas)',
        category_code: 'COD',
        evidence: '"Build reproducible data transformation and feature engineering libraries in Python."',
        confidence: 'high',
      },
      {
        skill_name: 'Algorithmic Optimization & Complexity',
        category_code: 'DSA',
        evidence: '"Implement scalable sampling, clustering, and graph-based ranking algorithms."',
        confidence: 'high',
      },
      {
        skill_name: 'Cloud ML Infrastructure (Vertex AI / GCP)',
        category_code: 'CLOUD',
        evidence: '"Orchestrate distributed training jobs and model endpoints on Google Cloud."',
        confidence: 'medium',
      },
      {
        skill_name: 'Executive Data Storytelling & Visualization',
        category_code: 'COMM',
        evidence: '"Translate ambiguous product questions into quantitative insights for engineering leadership."',
        confidence: 'high',
      },
      {
        skill_name: 'Version Control & Production ML Pipelines',
        category_code: 'SWE',
        evidence: '"Follow software engineering best practices for model versioning, testing, and CI."',
        confidence: 'medium',
      },
    ],
  },
  {
    id: 'jd-msft-swe',
    source_type: 'jd',
    source_file: 'Microsoft_Software_Engineer_Hyderabad.docx',
    company: 'Microsoft Corporation',
    role: 'Software Engineer',
    location: 'Hyderabad, India',
    analyzed_at: '2026-10-25T14:20:00Z',
    summary:
      'Build resilient enterprise cloud services, developer tooling, and intelligent APIs on Azure using C#, TypeScript, Java, and modern microservices patterns.',
    required_technologies: ['C#', '.NET Core', 'TypeScript', 'Java', 'Azure', 'Docker', 'SQL Server', 'PostgreSQL', 'Git'],
    skills: [
      {
        skill_name: 'Object-Oriented Design & Design Patterns',
        category_code: 'OOD',
        evidence: '"Apply SOLID principles, dependency injection, and clean domain-driven design in C# or Java."',
        confidence: 'high',
      },
      {
        skill_name: 'Production Coding in C# / Java / TypeScript',
        category_code: 'COD',
        evidence: '"Deliver maintainable full-stack and backend features in modern strongly-typed languages."',
        confidence: 'high',
      },
      {
        skill_name: 'Data Structures & Problem Solving',
        category_code: 'DSA',
        evidence: '"Solve complex algorithmic challenges with optimal time and space efficiency."',
        confidence: 'high',
      },
      {
        skill_name: 'Azure Cloud Services & Microservices',
        category_code: 'CLOUD',
        evidence: '"Build and operate cloud-native services on Azure Kubernetes Service, Functions, and Service Bus."',
        confidence: 'high',
      },
      {
        skill_name: 'Scalable System Design & Caching',
        category_code: 'SYSD',
        evidence: '"Design high-availability REST/GraphQL services with Redis caching and event-driven queues."',
        confidence: 'high',
      },
      {
        skill_name: 'Software Engineering & DevOps CI/CD',
        category_code: 'SWE',
        evidence: '"Own end-to-end release quality through automated testing, telemetry, and Azure DevOps pipelines."',
        confidence: 'high',
      },
      {
        skill_name: 'Relational Databases & Query Tuning',
        category_code: 'SQL',
        evidence: '"Design normalized schemas and optimize indexing on Azure SQL and PostgreSQL."',
        confidence: 'high',
      },
      {
        skill_name: 'LLM / Copilot API Integration',
        category_code: 'AI',
        evidence: '"Integrate intelligent agent workflows and semantic search into enterprise productivity features."',
        confidence: 'medium',
      },
      {
        skill_name: 'Agile Cross-Functional Collaboration',
        category_code: 'COMM',
        evidence: '"Partner closely with PMs, designers, and security engineers in agile sprint cycles."',
        confidence: 'medium',
      },
    ],
  },
  {
    id: 'jd-msft-da',
    source_type: 'jd',
    source_file: 'Microsoft_Data_Analyst_Hyderabad.pdf',
    company: 'Microsoft Corporation',
    role: 'Data Analyst',
    location: 'Hyderabad, India',
    analyzed_at: '2026-10-25T15:45:00Z',
    summary:
      'Partner with cloud business and product teams to model customer telemetry, build automated ETL workflows, and deliver actionable business intelligence.',
    required_technologies: ['SQL', 'Python', 'Power BI', 'Azure Synapse', 'Excel', 'DAX', 'Pandas'],
    skills: [
      {
        skill_name: 'Advanced SQL, CTEs & Window Functions',
        category_code: 'SQL',
        evidence: '"Extract, join, and aggregate multi-million-row telemetry datasets using T-SQL and PostgreSQL."',
        confidence: 'high',
      },
      {
        skill_name: 'Quantitative Reasoning & KPI Forecasting',
        category_code: 'APTI',
        evidence: '"Perform cohort retention analysis, variance decomposition, and revenue forecasting."',
        confidence: 'high',
      },
      {
        skill_name: 'Python Data Automation & Pandas',
        category_code: 'COD',
        evidence: '"Automate recurring data hygiene and transformation pipelines using Python scripts."',
        confidence: 'high',
      },
      {
        skill_name: 'Stakeholder Reporting & Data Storytelling',
        category_code: 'COMM',
        evidence: '"Present executive-ready insights and self-serve dashboards to product and finance leaders."',
        confidence: 'high',
      },
      {
        skill_name: 'Predictive Modeling & Anomaly Detection',
        category_code: 'AI',
        evidence: '"Apply regression, clustering, and time-series anomaly detection to usage metrics."',
        confidence: 'medium',
      },
      {
        skill_name: 'Azure Data Lake & Cloud Warehousing',
        category_code: 'CLOUD',
        evidence: '"Query cloud data warehouses in Azure Synapse and manage scheduled pipeline runs."',
        confidence: 'medium',
      },
      {
        skill_name: 'Power BI & DAX Semantic Modeling',
        category_code: 'OTHER',
        evidence: '"Build interactive Power BI reports with optimized DAX measures and row-level security."',
        confidence: 'high',
      },
    ],
  },
  {
    id: 'jd-ofss-ase',
    source_type: 'jd',
    source_file: 'Oracle_FSS_Associate_Software_Engineer.docx',
    company: 'Oracle Financial Services Software',
    role: 'Associate Software Engineer',
    location: 'Bengaluru / Mumbai, India',
    analyzed_at: '2026-10-26T09:10:00Z',
    summary:
      'Develop, customize, and optimize enterprise core banking modules, transactional REST services, and high-integrity Oracle database packages.',
    required_technologies: ['Java', 'Spring Boot', 'Oracle SQL', 'PL/SQL', 'REST APIs', 'Linux', 'Git', 'JavaScript'],
    skills: [
      {
        skill_name: 'Oracle SQL, PL/SQL & Stored Procedures',
        category_code: 'SQL',
        evidence: '"Write complex PL/SQL packages, triggers, cursors, and tuned transactional queries."',
        confidence: 'high',
      },
      {
        skill_name: 'Core Java & Object-Oriented Programming',
        category_code: 'OOD',
        evidence: '"Design modular banking components using Java collections, interfaces, and OOP principles."',
        confidence: 'high',
      },
      {
        skill_name: 'Java / Spring Boot Backend Coding',
        category_code: 'COD',
        evidence: '"Implement secure backend services and batch processing utilities in Java."',
        confidence: 'high',
      },
      {
        skill_name: 'REST API Integration & SDLC Practices',
        category_code: 'SWE',
        evidence: '"Build and test RESTful web services following enterprise Git and release workflows."',
        confidence: 'high',
      },
      {
        skill_name: 'Data Structures & Algorithmic Logic',
        category_code: 'DSA',
        evidence: '"Apply fundamental data structures (arrays, hash maps, trees) to transaction processing."',
        confidence: 'medium',
      },
      {
        skill_name: 'Unix / Linux Environment & Shell Scripting',
        category_code: 'OS',
        evidence: '"Deploy and debug application servers on Linux/Unix environments using shell scripts."',
        confidence: 'medium',
      },
      {
        skill_name: 'Analytical & Quantitative Problem Solving',
        category_code: 'APTI',
        evidence: '"Validate financial interest calculations, reconciliation logic, and edge cases."',
        confidence: 'high',
      },
      {
        skill_name: 'Client & Team Technical Communication',
        category_code: 'COMM',
        evidence: '"Document functional specifications and coordinate with QA and implementation teams."',
        confidence: 'medium',
      },
    ],
  },
  {
    id: 'jd-ofss-asa',
    source_type: 'jd',
    source_file: 'Oracle_FSS_Application_Support_Analyst.pdf',
    company: 'Oracle Financial Services Software',
    role: 'Application Support Analyst',
    location: 'Bengaluru / Chennai, India',
    analyzed_at: '2026-10-26T10:00:00Z',
    summary:
      'Ensure high availability of mission-critical banking applications through SQL diagnostics, Linux log analysis, network troubleshooting, and SLA-driven incident resolution.',
    required_technologies: ['Oracle SQL', 'PL/SQL', 'Linux', 'Bash', 'TCP/IP', 'Java Basics', 'ITIL / Jira'],
    skills: [
      {
        skill_name: 'Production SQL Diagnostics & Data Reconciliation',
        category_code: 'SQL',
        evidence: '"Execute diagnostic SQL queries, analyze execution plans, and resolve EOD batch failures."',
        confidence: 'high',
      },
      {
        skill_name: 'Linux Server Administration & Bash Scripting',
        category_code: 'OS',
        evidence: '"Monitor server processes, memory utilization, cron jobs, and application logs on Linux."',
        confidence: 'high',
      },
      {
        skill_name: 'Incident Communication & SLA Management',
        category_code: 'COMM',
        evidence: '"Communicate root-cause analyses (RCA) clearly to banking clients and engineering escalations."',
        confidence: 'high',
      },
      {
        skill_name: 'Network Connectivity & HTTP/TCP Troubleshooting',
        category_code: 'NETW',
        evidence: '"Diagnose firewall rules, port bindings, SSL/TLS handshakes, and API gateway timeouts."',
        confidence: 'high',
      },
      {
        skill_name: 'Logical Root-Cause Analysis',
        category_code: 'APTI',
        evidence: '"Trace complex multi-tier transaction anomalies methodically under SLA timelines."',
        confidence: 'high',
      },
      {
        skill_name: 'Scripting & Log Automation (Python / Shell / Java)',
        category_code: 'COD',
        evidence: '"Read Java stack traces and write utility scripts to automate health checks."',
        confidence: 'medium',
      },
      {
        skill_name: 'Release Management & Issue Tracking',
        category_code: 'SWE',
        evidence: '"Verify hotfix deployments, maintain runbooks, and track defects through Jira."',
        confidence: 'medium',
      },
    ],
  },
];

/**
 * 4 SAMPLE CANDIDATES FROM THE HACKATHON BRIEF
 * Deliberately distinct profiles so Talent Check and Skill Matching produce visibly different results.
 */
export const SAMPLE_PARSED_RESUMES: ParsedResumeOutput[] = [
  {
    id: 'cand-ananya',
    source_type: 'resume',
    source_file: 'Ananya_Rao_Resume_2026.pdf',
    company: 'JSS Science & Technology University',
    role: 'Systems-Leaning Generalist (Final Year B.E. CSE)',
    candidate_name: 'Ananya Rao',
    candidate_email: 'ananya.rao.demo@radix-hackathon.example',
    phone: '+91 98450 11204 (Illustrative)',
    location: 'Bengaluru, India',
    profile_archetype: 'Systems-leaning generalist',
    fit_summary: 'Strong fit for SWE-heavy roles, weaker fit for pure data roles.',
    analyzed_at: '2026-10-26T08:30:00Z',
    preferred_roles: ['Software Engineer (SWE)', 'Backend Systems Engineer', 'Associate Software Engineer'],
    education: [
      {
        id: 'edu-ananya-1',
        institution: 'JSS Academy of Technical Education',
        degree: 'B.E. / B.Tech',
        field_of_study: 'Computer Science & Engineering',
        graduation_year: '2026',
        score_or_gpa: '8.92 CGPA',
      },
    ],
    projects: [
      {
        id: 'proj-ananya-1',
        title: 'RaftKV — Distributed Fault-Tolerant Key-Value Store',
        description: 'Implemented leader election, log replication, and snapshotting in Go over gRPC with sub-8ms p99 read latency.',
        technologies: ['Go', 'gRPC', 'Docker', 'Linux', 'Protobuf'],
      },
      {
        id: 'proj-ananya-2',
        title: 'ContainerLab — Lightweight Linux Namespace Sandbox',
        description: 'Built a C++ CLI utilizing Linux cgroups and namespaces to isolate student code execution workloads.',
        technologies: ['C++', 'Linux System Calls', 'CMake', 'Bash'],
      },
    ],
    internships: [
      {
        id: 'int-ananya-1',
        company: 'CloudScale Systems Pvt Ltd',
        role: 'Backend Engineering Intern',
        duration: 'May 2025 – Jul 2025',
        description: 'Refactored microservice authentication middleware in Go and reduced Redis cache miss rate by 28%.',
        technologies: ['Go', 'Redis', 'Kubernetes', 'PostgreSQL', 'Git'],
      },
    ],
    hackathons: [
      {
        id: 'hack-ananya-1',
        name: 'Smart India Systems Challenge 2025',
        organizer: 'AICTE & Industry Consortium',
        year: '2025',
        achievement: 'Top 5 Finalist',
        project_summary: 'Built a high-throughput telemetry ingestion gateway handling 50k events/sec.',
      },
    ],
    certifications: [
      {
        id: 'cert-ananya-1',
        name: 'Google Cloud Associate Cloud Engineer',
        issuer: 'Google Cloud',
        year: '2025',
      },
    ],
    skills: [
      {
        skill_name: 'C++, Go & Java Systems Programming',
        category_code: 'COD',
        evidence: 'Built RaftKV in Go and ContainerLab in C++; 600+ problems solved across platforms.',
        confidence: 'high',
        proficiency_level: 9,
      },
      {
        skill_name: 'Advanced Data Structures & Graph Algorithms',
        category_code: 'DSA',
        evidence: 'Competitive programming rating 1920; strong command of trees, graphs, and DP.',
        confidence: 'high',
        proficiency_level: 9,
      },
      {
        skill_name: 'Distributed Systems & Microservices Architecture',
        category_code: 'SYSD',
        evidence: 'Implemented Raft consensus, Redis caching layers, and horizontal sharding.',
        confidence: 'high',
        proficiency_level: 8,
      },
      {
        skill_name: 'Linux Internals, Concurrency & Cgroups',
        category_code: 'OS',
        evidence: 'Built process isolation sandbox using Linux namespaces, pthreads, and cgroups.',
        confidence: 'high',
        proficiency_level: 9,
      },
      {
        skill_name: 'gRPC, HTTP/2 & TCP/IP Socket Programming',
        category_code: 'NETW',
        evidence: 'Designed low-latency gRPC transport and custom TCP health probers.',
        confidence: 'high',
        proficiency_level: 8,
      },
      {
        skill_name: 'Object-Oriented & Modular API Design',
        category_code: 'OOD',
        evidence: 'Applied SOLID design patterns in Java and modular interface design in Go.',
        confidence: 'high',
        proficiency_level: 8,
      },
      {
        skill_name: 'Docker, Kubernetes & Google Cloud Platform',
        category_code: 'CLOUD',
        evidence: 'GCP Associate Cloud Engineer certified; deployed multi-container workloads on GKE.',
        confidence: 'high',
        proficiency_level: 8,
      },
      {
        skill_name: 'Git, Automated Unit Testing & CI/CD',
        category_code: 'SWE',
        evidence: 'Configured GitHub Actions pipelines and integration test suites during internship.',
        confidence: 'high',
        proficiency_level: 8,
      },
      {
        skill_name: 'PostgreSQL Schema & Indexing',
        category_code: 'SQL',
        evidence: 'Used PostgreSQL for transactional storage in backend internship.',
        confidence: 'medium',
        proficiency_level: 6,
      },
      {
        skill_name: 'Analytical Logic & Quantitative Reasoning',
        category_code: 'APTI',
        evidence: 'Strong algorithmic math foundation; limited statistical/econometric modeling.',
        confidence: 'medium',
        proficiency_level: 7,
      },
      {
        skill_name: 'Technical Design Documentation',
        category_code: 'COMM',
        evidence: 'Authored architecture RFCs and sprint demos for engineering mentors.',
        confidence: 'medium',
        proficiency_level: 7,
      },
      {
        skill_name: 'Foundational Machine Learning Concepts',
        category_code: 'AI',
        evidence: 'Completed undergraduate intro to ML course; minimal production ML pipeline work.',
        confidence: 'low',
        proficiency_level: 4,
      },
    ],
  },
  {
    id: 'cand-karthik',
    source_type: 'resume',
    source_file: 'Karthik_Subramaniam_Resume_2026.pdf',
    company: 'JSS Science & Technology University',
    role: 'Data-Leaning Analyst (Final Year B.Tech AI & Data Science)',
    candidate_name: 'Karthik Subramaniam',
    candidate_email: 'karthik.s.demo@radix-hackathon.example',
    phone: '+91 98801 44912 (Illustrative)',
    location: 'Chennai / Hyderabad, India',
    profile_archetype: 'Data-leaning analyst',
    fit_summary: 'Strong fit for Data Scientist / Data Analyst roles, weaker fit for pure SWE roles.',
    analyzed_at: '2026-10-26T08:45:00Z',
    preferred_roles: ['Data Scientist', 'Data Analyst', 'Applied ML Associate'],
    education: [
      {
        id: 'edu-karthik-1',
        institution: 'JSS Academy of Technical Education',
        degree: 'B.Tech',
        field_of_study: 'Artificial Intelligence & Data Science',
        graduation_year: '2026',
        score_or_gpa: '8.78 CGPA',
      },
    ],
    projects: [
      {
        id: 'proj-karthik-1',
        title: 'FinPulse — Credit Churn & Cohort Forecasting Engine',
        description: 'Built XGBoost and PyTorch survival models over 1.2M banking customer rows with SHAP explainability.',
        technologies: ['Python', 'PyTorch', 'Scikit-Learn', 'SQL', 'Power BI'],
      },
      {
        id: 'proj-karthik-2',
        title: 'RetailDemand — Automated BigQuery & Airflow ETL',
        description: 'Designed star-schema SQL transformations and anomaly alerting for regional inventory forecasting.',
        technologies: ['BigQuery', 'PostgreSQL', 'Python', 'Pandas', 'Tableau'],
      },
    ],
    internships: [
      {
        id: 'int-karthik-1',
        company: 'InsightGrid Analytics',
        role: 'Data Science & BI Intern',
        duration: 'Jan 2025 – Jun 2025',
        description: 'Authored complex SQL window queries and interactive Power BI executive dashboards reducing weekly reporting time by 65%.',
        technologies: ['SQL', 'Python', 'Power BI', 'DAX', 'Azure Synapse'],
      },
    ],
    hackathons: [
      {
        id: 'hack-karthik-1',
        name: 'National FinTech Data Datathon 2025',
        organizer: 'IIT Madras Research Park',
        year: '2025',
        achievement: 'Winner — Best Predictive Model',
        project_summary: 'Achieved 0.914 ROC-AUC on real-time fraud anomaly detection dataset.',
      },
    ],
    certifications: [
      {
        id: 'cert-karthik-1',
        name: 'Microsoft Certified: Power BI Data Analyst Associate (PL-300)',
        issuer: 'Microsoft',
        year: '2025',
      },
      {
        id: 'cert-karthik-2',
        name: 'DeepLearning.AI Machine Learning Specialization',
        issuer: 'Coursera / Stanford',
        year: '2024',
      },
    ],
    skills: [
      {
        skill_name: 'Advanced SQL, CTEs, Window Functions & BigQuery',
        category_code: 'SQL',
        evidence: 'Built star-schema data warehouses and optimized multi-million row analytical queries.',
        confidence: 'high',
        proficiency_level: 9,
      },
      {
        skill_name: 'Machine Learning & Deep Learning (PyTorch / Scikit-Learn)',
        category_code: 'AI',
        evidence: 'Won National FinTech Datathon; deployed XGBoost, NLP, and PyTorch forecasting models.',
        confidence: 'high',
        proficiency_level: 9,
      },
      {
        skill_name: 'Statistical Modeling, A/B Testing & Quantitative Aptitude',
        category_code: 'APTI',
        evidence: 'Strong mastery of hypothesis testing, Bayesian statistics, and cohort retention math.',
        confidence: 'high',
        proficiency_level: 9,
      },
      {
        skill_name: 'Python Scientific Computing (Pandas / NumPy)',
        category_code: 'COD',
        evidence: 'Fluent in Python data pipelines and scripting; less experience in C++/Java systems coding.',
        confidence: 'high',
        proficiency_level: 7,
      },
      {
        skill_name: 'Executive Data Storytelling & Stakeholder Reporting',
        category_code: 'COMM',
        evidence: 'Presented weekly KPI decks and self-serve dashboards to business leadership.',
        confidence: 'high',
        proficiency_level: 8,
      },
      {
        skill_name: 'Power BI, DAX & Tableau Visualization',
        category_code: 'OTHER',
        evidence: 'Microsoft PL-300 certified; built production DAX semantic models.',
        confidence: 'high',
        proficiency_level: 9,
      },
      {
        skill_name: 'Cloud Data Warehousing (Azure Synapse & GCP Vertex AI)',
        category_code: 'CLOUD',
        evidence: 'Managed scheduled data pipelines on Azure Synapse and BigQuery.',
        confidence: 'medium',
        proficiency_level: 6,
      },
      {
        skill_name: 'Core Data Structures & Algorithmic Complexity',
        category_code: 'DSA',
        evidence: 'Proficient in arrays, hashing, sorting, and trees in Python; moderate advanced graph/DP exposure.',
        confidence: 'medium',
        proficiency_level: 6,
      },
      {
        skill_name: 'Git Version Control & Notebook Reproducibility',
        category_code: 'SWE',
        evidence: 'Uses Git and modular Python packages for ML experiments.',
        confidence: 'medium',
        proficiency_level: 6,
      },
      {
        skill_name: 'Object-Oriented Python & Modular Scripting',
        category_code: 'OOD',
        evidence: 'Created custom scikit-learn transformer classes; limited enterprise Java/C# OOP.',
        confidence: 'low',
        proficiency_level: 5,
      },
      {
        skill_name: 'Data Pipeline Architecture',
        category_code: 'SYSD',
        evidence: 'Understands batch vs streaming ETL; limited distributed microservice design.',
        confidence: 'low',
        proficiency_level: 5,
      },
      {
        skill_name: 'Linux CLI & Environment Management',
        category_code: 'OS',
        evidence: 'Basic bash usage for remote GPU training instances.',
        confidence: 'low',
        proficiency_level: 4,
      },
      {
        skill_name: 'REST API Consumption & Networking Basics',
        category_code: 'NETW',
        evidence: 'Ingests data from REST endpoints; minimal low-level TCP/IP networking.',
        confidence: 'low',
        proficiency_level: 4,
      },
    ],
  },
  {
    id: 'cand-priya',
    source_type: 'resume',
    source_file: 'Priya_Menon_Resume_2026.docx',
    company: 'JSS Science & Technology University',
    role: 'Entry-Level, Support & Enterprise Database Oriented (B.E. ISE)',
    candidate_name: 'Priya Menon',
    candidate_email: 'priya.menon.demo@radix-hackathon.example',
    phone: '+91 97412 88390 (Illustrative)',
    location: 'Bengaluru / Kochi, India',
    profile_archetype: 'Entry-level, support-oriented',
    fit_summary: 'Best fit for the Oracle FSS roles, weaker fit for Google / Microsoft hyperscale engineering.',
    analyzed_at: '2026-10-26T09:00:00Z',
    preferred_roles: ['Application Support Analyst', 'Associate Software Engineer', 'Database & Operations Analyst'],
    education: [
      {
        id: 'edu-priya-1',
        institution: 'JSS Academy of Technical Education',
        degree: 'B.E.',
        field_of_study: 'Information Science & Engineering',
        graduation_year: '2026',
        score_or_gpa: '8.15 CGPA',
      },
    ],
    projects: [
      {
        id: 'proj-priya-1',
        title: 'BankLedger — Core Branch Transaction & Reconciliation Portal',
        description: 'Developed a Java & Oracle SQL application with PL/SQL stored procedures for daily branch ledger validation.',
        technologies: ['Java', 'Oracle SQL', 'PL/SQL', 'JDBC', 'HTML/CSS'],
      },
      {
        id: 'proj-priya-2',
        title: 'SysWatch — Automated Linux Log & Health Alert Utility',
        description: 'Created Bash cron scripts to monitor disk usage, Tomcat logs, and HTTP endpoint availability.',
        technologies: ['Linux', 'Bash', 'Cron', 'cURL', 'TCP/IP'],
      },
    ],
    internships: [
      {
        id: 'int-priya-1',
        company: 'Apex FinServ Operations',
        role: 'Technical Support & Database Trainee',
        duration: 'Jun 2025 – Aug 2025',
        description: 'Resolved L2 ticket escalations, wrote diagnostic SQL reconciliation queries, and documented SLA incident runbooks.',
        technologies: ['Oracle SQL', 'Linux', 'Jira', 'Shell Scripting'],
      },
    ],
    hackathons: [
      {
        id: 'hack-priya-1',
        name: 'Campus Service Reliability Ideathon',
        organizer: 'JSS Dept of ISE',
        year: '2025',
        achievement: 'Runner-Up',
        project_summary: 'Designed an automated incident triage workflow for campus ERP downtime.',
      },
    ],
    certifications: [
      {
        id: 'cert-priya-1',
        name: 'Oracle Database SQL Certified Associate',
        issuer: 'Oracle University',
        year: '2025',
      },
      {
        id: 'cert-priya-2',
        name: 'ITIL v4 Foundation Principles in Service Management',
        issuer: 'Axelos / Udemy',
        year: '2025',
      },
    ],
    skills: [
      {
        skill_name: 'Oracle SQL, PL/SQL Stored Procedures & Reconciliation',
        category_code: 'SQL',
        evidence: 'Oracle SQL Certified Associate; built PL/SQL ledger packages and L2 diagnostic queries.',
        confidence: 'high',
        proficiency_level: 8,
      },
      {
        skill_name: 'Linux Server Administration, Bash & Log Triage',
        category_code: 'OS',
        evidence: 'Built SysWatch monitoring cron jobs and analyzed Tomcat server logs on Linux.',
        confidence: 'high',
        proficiency_level: 8,
      },
      {
        skill_name: 'Incident Communication, RCA Documentation & SLA Management',
        category_code: 'COMM',
        evidence: 'Handled L2 client ticket updates, root-cause summaries, and operational runbooks.',
        confidence: 'high',
        proficiency_level: 9,
      },
      {
        skill_name: 'Network Diagnostics, TCP/IP, DNS & HTTP Troubleshooting',
        category_code: 'NETW',
        evidence: 'Experienced in diagnosing port connectivity, SSL certificates, and API gateway timeouts.',
        confidence: 'high',
        proficiency_level: 7,
      },
      {
        skill_name: 'Core Java & Object-Oriented Fundamentals',
        category_code: 'OOD',
        evidence: 'Built BankLedger using Java OOP, JDBC, and exception handling.',
        confidence: 'medium',
        proficiency_level: 6,
      },
      {
        skill_name: 'Java & Bash Scripting',
        category_code: 'COD',
        evidence: 'Writes clean utility scripts and standard Java CRUD modules.',
        confidence: 'medium',
        proficiency_level: 6,
      },
      {
        skill_name: 'Analytical Troubleshooting & Quantitative Checks',
        category_code: 'APTI',
        evidence: 'Methodical root-cause isolation and financial ledger verification.',
        confidence: 'high',
        proficiency_level: 7,
      },
      {
        skill_name: 'Issue Tracking (Jira), Release Verification & SDLC',
        category_code: 'SWE',
        evidence: 'Managed hotfix verification and regression testing checklists.',
        confidence: 'medium',
        proficiency_level: 6,
      },
      {
        skill_name: 'Foundational Data Structures (Arrays, HashMaps, Queues)',
        category_code: 'DSA',
        evidence: 'Comfortable with standard collection classes; limited advanced graph/DP practice.',
        confidence: 'low',
        proficiency_level: 4,
      },
      {
        skill_name: 'Multi-Tier Application Architecture Basics',
        category_code: 'SYSD',
        evidence: 'Understands client-server-DB topologies; minimal distributed sharding experience.',
        confidence: 'low',
        proficiency_level: 4,
      },
      {
        skill_name: 'Basic Cloud VM & Storage Operations',
        category_code: 'CLOUD',
        evidence: 'Familiar with basic cloud VM hosting and backups.',
        confidence: 'low',
        proficiency_level: 4,
      },
      {
        skill_name: 'Introductory AI Prompting & Automation',
        category_code: 'AI',
        evidence: 'Beginner exposure; no custom ML model training experience.',
        confidence: 'low',
        proficiency_level: 2,
      },
    ],
  },
  {
    id: 'cand-rohan',
    source_type: 'resume',
    source_file: 'Rohan_Verma_Resume_2026.pdf',
    company: 'JSS Science & Technology University',
    role: 'Strong All-Rounder (Final Year B.E. CSE)',
    candidate_name: 'Rohan Verma',
    candidate_email: 'rohan.verma.demo@radix-hackathon.example',
    phone: '+91 99002 77518 (Illustrative)',
    location: 'Bengaluru, India',
    profile_archetype: 'Strong all-rounder',
    fit_summary: 'Competitive fit across nearly every role in the pack (SWE, Data, and Enterprise).',
    analyzed_at: '2026-10-26T09:30:00Z',
    preferred_roles: [
      'Software Engineer (SWE)',
      'Data Scientist',
      'Full-Stack & Cloud Engineer',
      'Associate Software Engineer',
    ],
    education: [
      {
        id: 'edu-rohan-1',
        institution: 'JSS Academy of Technical Education',
        degree: 'B.E.',
        field_of_study: 'Computer Science & Engineering',
        graduation_year: '2026',
        score_or_gpa: '9.34 CGPA',
      },
    ],
    projects: [
      {
        id: 'proj-rohan-1',
        title: 'OmniSearch — Hybrid Vector & Relational Query Engine',
        description: 'Built an end-to-end semantic search and analytics service combining Python, PyTorch embeddings, PostgreSQL, and a TypeScript/Java microservices layer on Azure & GCP.',
        technologies: ['Python', 'Java', 'TypeScript', 'PyTorch', 'PostgreSQL', 'Docker', 'Kubernetes'],
      },
      {
        id: 'proj-rohan-2',
        title: 'PulseMesh — Distributed Telemetry & Alerting Platform',
        description: 'Designed event-driven microservices with Kafka, Redis caching, PL/SQL reporting procedures, and real-time operational dashboards.',
        technologies: ['C#', 'Go', 'Kafka', 'Redis', 'Oracle SQL', 'Linux', 'gRPC'],
      },
    ],
    internships: [
      {
        id: 'int-rohan-1',
        company: 'Vertex Cloud & AI Labs',
        role: 'Software & Data Engineering Intern',
        duration: 'May 2025 – Aug 2025',
        description: 'Delivered production C#/Java microservices and Python ML inference pipelines; improved SQL query latency by 42% across multi-tenant clusters.',
        technologies: ['Java', 'C#', 'Python', 'SQL', 'Azure', 'GCP', 'Kubernetes', 'PyTorch'],
      },
    ],
    hackathons: [
      {
        id: 'hack-rohan-1',
        name: 'RADIX National Engineering Blitz 2025',
        organizer: 'TGL & Industry Partners',
        year: '2025',
        achievement: '1st Place National Winner',
        project_summary: 'Built a real-time distributed code & data observability platform in 36 hours.',
      },
    ],
    certifications: [
      {
        id: 'cert-rohan-1',
        name: 'Microsoft Certified: Azure Solutions Architect & Developer',
        issuer: 'Microsoft',
        year: '2025',
      },
      {
        id: 'cert-rohan-2',
        name: 'Google Cloud Professional Data & Cloud Track',
        issuer: 'Google Cloud',
        year: '2025',
      },
    ],
    skills: [
      {
        skill_name: 'Polyglot Production Coding (Python, Java, C++, C#, Go, TypeScript)',
        category_code: 'COD',
        evidence: 'Shipped production microservices and ML pipelines in Python, Java, C#, and Go.',
        confidence: 'high',
        proficiency_level: 9,
      },
      {
        skill_name: 'Advanced Data Structures, Graphs & Dynamic Programming',
        category_code: 'DSA',
        evidence: 'National hackathon winner; 750+ algorithmic problems solved across trees, graphs, and DP.',
        confidence: 'high',
        proficiency_level: 9,
      },
      {
        skill_name: 'Object-Oriented Design, SOLID & Enterprise Patterns',
        category_code: 'OOD',
        evidence: 'Designed clean domain hierarchies and dependency-injected services in Java and C#.',
        confidence: 'high',
        proficiency_level: 9,
      },
      {
        skill_name: 'Distributed Systems, Caching & Microservices Design',
        category_code: 'SYSD',
        evidence: 'Architected Kafka event pipelines, Redis caching, and horizontally scaled APIs.',
        confidence: 'high',
        proficiency_level: 8,
      },
      {
        skill_name: 'Advanced SQL, PL/SQL, PostgreSQL & BigQuery Tuning',
        category_code: 'SQL',
        evidence: 'Improved multi-tenant SQL query latency by 42%; proficient in window functions and stored procedures.',
        confidence: 'high',
        proficiency_level: 9,
      },
      {
        skill_name: 'Machine Learning, PyTorch & LLM Agent Pipelines',
        category_code: 'AI',
        evidence: 'Built OmniSearch semantic vector engine and production PyTorch inference endpoints.',
        confidence: 'high',
        proficiency_level: 8,
      },
      {
        skill_name: 'Multi-Cloud Architecture (GCP, Azure, Docker, Kubernetes)',
        category_code: 'CLOUD',
        evidence: 'Certified in Azure & GCP; orchestrated containerized services on Kubernetes.',
        confidence: 'high',
        proficiency_level: 8,
      },
      {
        skill_name: 'Software Engineering, CI/CD, Automated Testing & Git',
        category_code: 'SWE',
        evidence: 'Maintained 90%+ test coverage, automated CI/CD pipelines, and peer code reviews.',
        confidence: 'high',
        proficiency_level: 9,
      },
      {
        skill_name: 'Quantitative Aptitude, Statistical Modeling & A/B Testing',
        category_code: 'APTI',
        evidence: 'Strong mathematical modeling, probability, and experimental evaluation skills.',
        confidence: 'high',
        proficiency_level: 8,
      },
      {
        skill_name: 'Executive & Cross-Functional Technical Communication',
        category_code: 'COMM',
        evidence: 'Led hackathon presentations, authored design docs, and collaborated with product teams.',
        confidence: 'high',
        proficiency_level: 8,
      },
      {
        skill_name: 'Linux Internals, Concurrency & Bash Automation',
        category_code: 'OS',
        evidence: 'Experienced in Linux server profiling, multithreading, and automated shell scripts.',
        confidence: 'high',
        proficiency_level: 8,
      },
      {
        skill_name: 'gRPC, REST, HTTP/2 & TCP/IP Networking',
        category_code: 'NETW',
        evidence: 'Configured gRPC service meshes, TLS handshakes, and API gateway routing.',
        confidence: 'high',
        proficiency_level: 8,
      },
    ],
  },
];

/**
 * Helper to convert a ParsedResumeOutput into a normalized CandidateProfile
 */
export function parsedResumeToCandidateProfile(parsed: ParsedResumeOutput): CandidateProfile {
  return {
    id: parsed.id || `prof-${Date.now()}`,
    name: parsed.candidate_name || '',
    email: parsed.candidate_email || '',
    phone: parsed.phone || '',
    location: parsed.location || '',
    headline: parsed.role || '',
    bio: parsed.fit_summary || '',
    education: (parsed.education || []).map((e, idx) => ({
      id: e.id || `edu-${idx}`,
      institution: e.institution || 'University',
      degree: e.degree || 'Degree',
      field_of_study: e.field_of_study || '',
      graduation_year: e.graduation_year ? String(e.graduation_year) : '',
      score_or_gpa: e.score_or_gpa || '',
    })),
    skills: (parsed.skills || []).map((s) => ({
      skill_name: s.skill_name || s.name || '',
      category_code: s.category_code || 'OTHER',
      evidence: s.evidence || 'Extracted from resume',
      confidence: s.confidence || 'medium',
      proficiency_level:
        typeof s.proficiency_level === 'number'
          ? s.proficiency_level
          : typeof s.level === 'number'
          ? s.level
          : 7.0,
    })),
    projects: (parsed.projects || []).map((p, idx) => ({
      id: p.id || `proj-${idx}`,
      title: p.title || 'Project',
      description: p.description || '',
      technologies: Array.isArray(p.technologies) ? [...p.technologies] : [],
    })),
    hackathons: (parsed.hackathons || []).map((h, idx) => ({
      id: h.id || `hack-${idx}`,
      name: h.name || 'Hackathon',
      organizer: h.organizer || '',
      year: h.year ? String(h.year) : '',
      achievement: h.achievement || '',
      project_summary: h.project_summary || '',
    })),
    internships: (parsed.internships || []).map((i, idx) => ({
      id: i.id || `int-${idx}`,
      company: i.company || 'Organization',
      role: i.role || 'Intern',
      duration: i.duration || '',
      description: i.description || '',
      technologies: Array.isArray(i.technologies) ? [...i.technologies] : [],
    })),
    certifications: (parsed.certifications || []).map((c, idx) => ({
      id: c.id || `cert-${idx}`,
      name: c.name || 'Certification',
      issuer: c.issuer || '',
      year: c.year ? String(c.year) : '',
    })),
    preferred_roles: [...(parsed.preferred_roles || [])],
    cv_file: parsed.source_file || 'resume.pdf',
    updated_at: new Date().toISOString(),
    is_draft: false,
  };
}

export const INITIAL_CANDIDATE_PROFILES: Record<string, CandidateProfile> = Object.fromEntries(
  SAMPLE_PARSED_RESUMES.map((r) => [r.id!, parsedResumeToCandidateProfile(r)])
);
