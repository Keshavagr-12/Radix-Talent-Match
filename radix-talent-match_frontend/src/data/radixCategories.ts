import { RadixCategoryCode } from '../types/radix';

export interface RadixCategoryMeta {
  code: RadixCategoryCode;
  name: string;
  shortName: string;
  description: string;
  examples: string[];
  accentColor: string;
}

export const RADIX_TWELVE_CATEGORIES: RadixCategoryMeta[] = [
  {
    code: 'COD',
    name: 'Coding',
    shortName: 'Coding',
    description: 'Fluency in programming languages, clean code practices, debugging, and implementation speed.',
    examples: ['Python', 'Java', 'C++', 'TypeScript', 'Go'],
    accentColor: '#6366F1',
  },
  {
    code: 'DSA',
    name: 'Data Structures & Algorithms',
    shortName: 'DSA',
    description: 'Algorithmic problem solving, asymptotic complexity analysis, trees, graphs, and dynamic programming.',
    examples: ['Graph Algorithms', 'Dynamic Programming', 'Complexity Analysis', 'Heaps & Trees'],
    accentColor: '#8B5CF6',
  },
  {
    code: 'OOD',
    name: 'Object-Oriented Design',
    shortName: 'OO Design',
    description: 'Modular class hierarchies, SOLID principles, design patterns, and maintainable domain modeling.',
    examples: ['SOLID Principles', 'Design Patterns', 'UML & Class Design', 'Polymorphism'],
    accentColor: '#EC4899',
  },
  {
    code: 'APTI',
    name: 'Aptitude',
    shortName: 'Aptitude',
    description: 'Quantitative reasoning, analytical logic, statistical interpretation, and structured problem breakdown.',
    examples: ['Quantitative Analysis', 'Logical Reasoning', 'Probability & Statistics'],
    accentColor: '#F59E0B',
  },
  {
    code: 'COMM',
    name: 'Communication',
    shortName: 'Communication',
    description: 'Technical documentation, stakeholder alignment, incident reporting, and cross-functional collaboration.',
    examples: ['Technical Writing', 'Stakeholder Alignment', 'Design Reviews', 'Incident Triage'],
    accentColor: '#10B981',
  },
  {
    code: 'AI',
    name: 'AI',
    shortName: 'AI & ML',
    description: 'Machine learning pipelines, statistical modeling, deep learning architectures, and LLM orchestration.',
    examples: ['PyTorch', 'Scikit-Learn', 'LangChain', 'NLP & Transformers', 'Feature Engineering'],
    accentColor: '#06B6D4',
  },
  {
    code: 'CLOUD',
    name: 'Cloud',
    shortName: 'Cloud',
    description: 'Cloud-native infrastructure, containerization, serverless compute, and CI/CD deployment pipelines.',
    examples: ['GCP', 'Azure', 'AWS', 'Docker', 'Kubernetes', 'Terraform'],
    accentColor: '#3B82F6',
  },
  {
    code: 'SQL',
    name: 'SQL',
    shortName: 'SQL & Data',
    description: 'Relational schema design, complex joins, window functions, query optimization, and PL/SQL.',
    examples: ['PostgreSQL', 'Oracle PL/SQL', 'Window Functions', 'Query Indexing', 'BigQuery'],
    accentColor: '#14B8A6',
  },
  {
    code: 'SWE',
    name: 'Software Engineering',
    shortName: 'Software Eng',
    description: 'Version control, automated testing, API lifecycle, code review rigor, and agile delivery.',
    examples: ['Git Workflows', 'REST & gRPC APIs', 'Unit & Integration Testing', 'CI/CD'],
    accentColor: '#6366F1',
  },
  {
    code: 'SYSD',
    name: 'System Design',
    shortName: 'System Design',
    description: 'Distributed systems architecture, high availability, caching, message queues, and scalability.',
    examples: ['Microservices', 'Distributed Caching', 'Kafka', 'Load Balancing', 'Sharding'],
    accentColor: '#A855F7',
  },
  {
    code: 'NETW',
    name: 'Networking',
    shortName: 'Networking',
    description: 'TCP/IP stack, HTTP/2 & TLS protocols, DNS resolution, load balancers, and network diagnostics.',
    examples: ['TCP/IP & UDP', 'HTTP/HTTPS & TLS', 'DNS & CDN', 'Socket Programming'],
    accentColor: '#0EA5E9',
  },
  {
    code: 'OS',
    name: 'Operating Systems',
    shortName: 'Operating Systems',
    description: 'Process scheduling, concurrency & multithreading, virtual memory, Linux internals, and shell scripting.',
    examples: ['Linux Internals', 'Concurrency & Locks', 'Memory Management', 'Bash Scripting'],
    accentColor: '#F97316',
  },
];

export const CATEGORY_LOOKUP: Record<RadixCategoryCode, RadixCategoryMeta> = {
  ...Object.fromEntries(RADIX_TWELVE_CATEGORIES.map((c) => [c.code, c])),
  OTHER: {
    code: 'OTHER',
    name: 'Other Domain Skills',
    shortName: 'Other',
    description: 'Specialized domain tooling, business workflows, or industry-specific platforms outside the core 12.',
    examples: ['Power BI', 'Tableau', 'ITIL', 'Banking Core Domain'],
    accentColor: '#64748B',
  },
} as Record<RadixCategoryCode, RadixCategoryMeta>;
