import {
  AdaptivePlan,
  DestinationGraph,
  Evidence,
  Gap,
  LearnerProfile,
  SkillClaim,
  VerificationTask,
  VerifiedCapabilityState,
} from "@/domain/types";

export const personaBProfile: LearnerProfile = {
  id: "persona-b",
  name: "Aarav",
  stage: "college",
  stageDetail: "3rd Year Undergraduate",
  fieldOfStudy: "Computer Science",
  weeklyHours: 10,
  targetTimelineMonths: 20,
  learningPreference: "projects-first",
  destinationCertainty: "exact",
  statedDestination: "AI Engineer",
  interests: ["machine learning", "building products"],
};

export const personaBGraph: DestinationGraph = {
  destinationId: "dest-ai-engineer",
  destinationName: "AI Engineer",
  summary:
    "End-to-end machine learning engineering: data pipelines, mathematical foundations, model development, evaluation, and cloud deployment.",
  confidence: "high",
  capabilityNodes: [
    {
      id: "cap-python",
      name: "Python Programming",
      family: "Programming",
      description: "Idiomatic Python, OOP, packaging, and data processing libraries (NumPy, Pandas).",
      importance: "core",
      stageExpected: "foundation",
      prerequisites: [],
      unlocks: ["cap-ml", "cap-deployment"],
    },
    {
      id: "cap-sql",
      name: "SQL & Relational Databases",
      family: "Data",
      description: "Complex joins, aggregations, window functions, and query optimization.",
      importance: "important",
      stageExpected: "foundation",
      prerequisites: [],
      unlocks: ["cap-ml"],
    },
    {
      id: "cap-stats",
      name: "Probability & Statistics",
      family: "Mathematics",
      description: "Distributions, hypothesis testing, Bayesian reasoning, and sampling theory.",
      importance: "important",
      stageExpected: "foundation",
      prerequisites: [],
      unlocks: ["cap-ml"],
    },
    {
      id: "cap-linalg",
      name: "Linear Algebra",
      family: "Mathematics",
      description: "Vectors, matrices, eigenvalues, SVD, and tensor transformations.",
      importance: "core",
      stageExpected: "foundation",
      prerequisites: [],
      unlocks: ["cap-ml", "cap-deep-learning"],
    },
    {
      id: "cap-ml",
      name: "Machine Learning & Model Evaluation",
      family: "AI/ML",
      description: "Supervised and unsupervised models, cross-validation, precision/recall trade-offs, and metrics.",
      importance: "core",
      stageExpected: "developing",
      prerequisites: ["cap-python", "cap-stats", "cap-linalg"],
      unlocks: ["cap-deployment"],
    },
    {
      id: "cap-deployment",
      name: "Model Deployment & Serving",
      family: "Systems",
      description: "FastAPI inference services, Docker containerization, and cloud deployment.",
      importance: "core",
      stageExpected: "specialist",
      prerequisites: ["cap-python", "cap-ml"],
      unlocks: [],
    },
  ],
  proofExpectations: [
    {
      id: "proof-ml-eval",
      capabilityId: "cap-ml",
      description: "End-to-end Jupyter notebook or script training a model with documented validation and error analysis.",
      level: "working",
    },
    {
      id: "proof-api-deploy",
      capabilityId: "cap-deployment",
      description: "Dockerized inference REST API deployed to a cloud provider with latency benchmarks.",
      level: "working",
    },
  ],
  experienceExpectations: [
    {
      id: "exp-ml-internship",
      title: "Machine Learning / Data Science Internship",
      description: "10-12 week industry internship working on production pipelines or customer-facing models.",
      type: "internship",
    },
  ],
  adjacentDestinations: [
    {
      id: "dest-data-engineer",
      title: "Data Engineer",
      descriptor: "Data orchestration, pipeline optimization, and warehousing.",
      tone: "blue",
      sharedCapabilityIds: ["cap-python", "cap-sql"],
    },
    {
      id: "dest-backend-engineer",
      title: "Backend Engineer",
      descriptor: "Distributed systems, APIs, and microservices architecture.",
      tone: "green",
      sharedCapabilityIds: ["cap-python", "cap-sql", "cap-deployment"],
    },
  ],
  sharedFoundationNodeIds: ["cap-python", "cap-sql", "cap-stats", "cap-linalg"],
  decisionPointMonths: 6,
};

export const personaBClaims: Record<string, SkillClaim> = {
  "cap-python": {
    capabilityId: "cap-python",
    selfReportedLevel: "strong",
    source: "onboarding",
  },
  "cap-sql": {
    capabilityId: "cap-sql",
    selfReportedLevel: "working",
    source: "onboarding",
  },
  "cap-stats": {
    capabilityId: "cap-stats",
    selfReportedLevel: "strong",
    source: "onboarding",
  },
  "cap-linalg": {
    capabilityId: "cap-linalg",
    selfReportedLevel: "basic",
    source: "onboarding",
  },
  "cap-ml": {
    capabilityId: "cap-ml",
    selfReportedLevel: "working",
    source: "onboarding",
  },
  "cap-deployment": {
    capabilityId: "cap-deployment",
    selfReportedLevel: "none",
    source: "onboarding",
  },
};

export const personaBEvidence: Evidence[] = [
  {
    id: "ev-resume-aarav",
    type: "resume",
    title: "Resume: Aarav Sharma - CS 3rd Year",
    createdAt: "2026-09-18T10:00:00Z",
    sourceText: "Aarav Sharma | 3rd Year B.Tech CS | Skills: Python, Scikit-Learn, SQL, Statistics. Built data analysis projects in Python.",
    capabilitySignals: [
      {
        capabilityId: "cap-python",
        signal: "supports",
        strength: "medium",
        explanation: "Resume indicates 2 years active Python project experience.",
      },
      {
        capabilityId: "cap-sql",
        signal: "unclear",
        strength: "low",
        explanation: "SQL is listed as a skill keyword without project or work context.",
      },
      {
        capabilityId: "cap-ml",
        signal: "supports",
        strength: "low",
        explanation: "Mention of basic ML coursework and tools.",
      },
    ],
  },
  {
    id: "ev-project-data-clean",
    type: "project",
    title: "Housing Price Data Analysis & Feature Engineering",
    createdAt: "2026-09-18T11:00:00Z",
    sourceText: "GitHub repo with Pandas data cleaning, exploratory data analysis, and Matplotlib visualization pipelines.",
    capabilitySignals: [
      {
        capabilityId: "cap-python",
        signal: "supports",
        strength: "high",
        explanation: "Direct code proof of NumPy, Pandas, data wrangling, and structured Python scripts.",
      },
      {
        capabilityId: "cap-stats",
        signal: "supports",
        strength: "medium",
        explanation: "Applies descriptive statistics, correlation matrices, and distribution analysis in exploratory code.",
      },
    ],
  },
  {
    id: "ev-cert-ml-course",
    type: "certificate",
    title: "Supervised Machine Learning Course Certificate",
    createdAt: "2026-09-18T12:00:00Z",
    sourceText: "Completed online specialization certificate covering linear regression, logistic regression, and decision trees.",
    capabilitySignals: [
      {
        capabilityId: "cap-ml",
        signal: "supports",
        strength: "low",
        explanation: "Certificate confirms academic exposure to concepts, but does not provide direct proof of practical capability.",
      },
    ],
  },
];

export const personaBVerifiedStates: Record<string, VerifiedCapabilityState> = {
  "cap-python": {
    capabilityId: "cap-python",
    state: "verified",
    evidenceIds: ["ev-resume-aarav", "ev-project-data-clean"],
    explanation: "Verified through functional Python GitHub project demonstrate data manipulation and clean code.",
    lastUpdatedAt: "2026-09-18T12:00:00Z",
  },
  "cap-sql": {
    capabilityId: "cap-sql",
    state: "needs-proof",
    evidenceIds: ["ev-resume-aarav"],
    explanation: "Claimed working knowledge on resume, but no project code or queries found in evidence.",
    lastUpdatedAt: "2026-09-18T12:00:00Z",
  },
  "cap-stats": {
    capabilityId: "cap-stats",
    state: "developing",
    evidenceIds: ["ev-project-data-clean"],
    explanation: "Applied descriptive stats demonstrated in project; inferential and testing depth remains unverified.",
    lastUpdatedAt: "2026-09-18T12:00:00Z",
  },
  "cap-linalg": {
    capabilityId: "cap-linalg",
    state: "gap",
    evidenceIds: [],
    explanation: "Self-reported basic; no coursework or practical evidence recorded. Critical blocker for advanced ML.",
    lastUpdatedAt: "2026-09-18T12:00:00Z",
  },
  "cap-ml": {
    capabilityId: "cap-ml",
    state: "needs-proof",
    evidenceIds: ["ev-cert-ml-course"],
    explanation: "Course certificate provides theoretical exposure; practical model validation proof still required.",
    lastUpdatedAt: "2026-09-18T12:00:00Z",
  },
  "cap-deployment": {
    capabilityId: "cap-deployment",
    state: "gap",
    evidenceIds: [],
    explanation: "Zero claim and zero evidence. Complete gap for production readiness.",
    lastUpdatedAt: "2026-09-18T12:00:00Z",
  },
};

export const personaBGaps: Gap[] = [
  {
    capabilityId: "cap-linalg",
    gapType: "never-learned",
    priority: "high",
    reason: "Linear Algebra is a core competency required for deep understanding of model mechanics and dimensionality reduction.",
    blocksCapabilityIds: ["cap-ml", "cap-deep-learning"],
  },
  {
    capabilityId: "cap-ml",
    gapType: "knowledge-no-proof",
    priority: "high",
    reason: "Machine Learning & Model Evaluation has certificate support but lacks practical evaluation proof.",
    blocksCapabilityIds: ["cap-deployment"],
  },
  {
    capabilityId: "cap-deployment",
    gapType: "never-learned",
    priority: "medium",
    reason: "Model Deployment & Serving is required for production engineering readiness.",
    blocksCapabilityIds: [],
  },
  {
    capabilityId: "cap-sql",
    gapType: "knowledge-no-proof",
    priority: "medium",
    reason: "SQL is listed on resume without accompanying project evidence.",
    blocksCapabilityIds: ["cap-ml"],
  },
];

export const personaBVerificationQueue: VerificationTask[] = [
  {
    id: "task-sql-scenario",
    capabilityId: "cap-sql",
    capabilityName: "SQL & Relational Databases",
    type: "scenario",
    prompt: "Given a database with 'users' and 'user_events', write a single SQL query with window functions to find the top 3 events per user by timestamp in the last 30 days.",
    rubric: "Checks partition by user_id, order by timestamp desc, and row_number() or dense_rank().",
  },
  {
    id: "task-ml-eval-scenario",
    capabilityId: "cap-ml",
    capabilityName: "Machine Learning & Model Evaluation",
    type: "scenario",
    prompt: "Your fraud detection dataset has 99.2% negative and 0.8% positive cases. Your model achieves 99.2% accuracy. Explain why this metric is misleading and specify the metric and validation strategy you would use.",
    rubric: "Must identify accuracy paradox, recommend PR-AUC/F1/Precision-Recall, and stratified cross-validation.",
  },
  {
    id: "task-stats-mcq",
    capabilityId: "cap-stats",
    capabilityName: "Probability & Statistics",
    type: "mcq",
    prompt: "When conducting an A/B test with high variance in user session duration, which statistical test is most appropriate to test whether the medians differ?",
    options: [
      "Standard two-sample Student's t-test assuming equal variances",
      "Mann-Whitney U non-parametric test",
      "One-way ANOVA without post-hoc correction",
      "Chi-square test of independence",
    ],
  },
];

export const personaBPlan: AdaptivePlan = {
  generatedAt: "2026-09-19T00:00:00Z",
  summary:
    "An accelerated 20-month exact pathway targeting AI Engineer, skipping verified Python and focusing on mathematics repair, ML proof, and API deployment.",
  now: [
    {
      id: "act-b-1",
      category: "learn",
      title: "Linear algebra repair module",
      description: "Targeted refresher on matrix transformations, eigenvalues, and dot-product geometry for neural networks.",
      whyNow: "Removes your primary theoretical blocker before advanced model architecture and training.",
      estimatedMinutes: 300,
      capabilityIds: ["cap-linalg"],
      status: "todo",
    },
    {
      id: "act-b-2",
      category: "prove",
      title: "ML evaluation proof task",
      description: "Complete a real-world scenario verifying cross-validation, precision-recall curve analysis, and error diagnosis.",
      whyNow: "Converts your theoretical certificate exposure into verified practical proof.",
      estimatedMinutes: 90,
      capabilityIds: ["cap-ml"],
      status: "todo",
    },
    {
      id: "act-b-3",
      category: "build",
      title: "Small deployable ML API project",
      description: "Wrap an inference model in a FastAPI server, package in Docker, and deploy with an interactive Swagger UI.",
      whyNow: "Addresses your deployment gap and provides a visible portfolio signal for internships.",
      estimatedMinutes: 360,
      capabilityIds: ["cap-deployment", "cap-python"],
      status: "todo",
    },
  ],
  weeks: [
    {
      weekIndex: 1,
      objectives: ["Reinforce matrix operations in Python", "Submit ML evaluation proof"],
      actions: [
        {
          id: "act-b-w1-1",
          category: "learn",
          title: "Matrix multiplication and tensor shapes in NumPy",
          description: "Hands-on vectorization drills.",
          whyNow: "Immediate prerequisite for linear algebra repair.",
          estimatedMinutes: 120,
          capabilityIds: ["cap-linalg"],
          status: "todo",
        },
      ],
    },
  ],
  milestones: [
    {
      id: "ms-b-1",
      title: "Mathematical Foundations & Core ML Verified",
      targetMonth: 2,
      evidenceNeeded: ["cap-linalg", "cap-ml"],
    },
    {
      id: "ms-b-2",
      title: "First Deployable Production AI Project",
      targetMonth: 5,
      evidenceNeeded: ["cap-deployment"],
    },
    {
      id: "ms-b-3",
      title: "Industry Internship Readiness",
      targetMonth: 8,
      evidenceNeeded: ["cap-deployment", "cap-ml", "cap-sql"],
    },
  ],
};
