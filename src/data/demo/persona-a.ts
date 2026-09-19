import {
  AdaptivePlan,
  DestinationGraph,
  Evidence,
  Gap,
  LearnerProfile,
  SkillClaim,
  VerifiedCapabilityState,
} from "@/domain/types";

export const personaAProfile: LearnerProfile = {
  id: "persona-a",
  name: "Siddhant",
  stage: "school",
  stageDetail: "Class 12",
  weeklyHours: 7,
  targetTimelineMonths: 24,
  learningPreference: "balanced",
  destinationCertainty: "general",
  statedField: "Technology",
  interests: ["building things", "AI", "data", "problem solving"],
};

export const personaAGraph: DestinationGraph = {
  destinationId: "technology-foundations",
  destinationName: "Technology & Software Foundations",
  summary:
    "An exploratory technology path preserving optionality across AI, data, backend, and security.",
  confidence: "medium",
  capabilityNodes: [
    {
      id: "cap-prog-fund",
      name: "Programming Fundamentals",
      family: "Foundations",
      description: "Core logic, variables, control flow, functions, and structured problem solving in Python.",
      importance: "core",
      stageExpected: "foundation",
      prerequisites: [],
      unlocks: ["cap-data-fund", "cap-mini-project", "cap-backend-fund", "cap-ai-fund"],
    },
    {
      id: "cap-prob-solv",
      name: "Problem Solving & Logic",
      family: "Foundations",
      description: "Algorithmic thinking, decomposition, and debugging fundamentals.",
      importance: "core",
      stageExpected: "foundation",
      prerequisites: [],
      unlocks: ["cap-prog-fund"],
    },
    {
      id: "cap-data-fund",
      name: "Data Fundamentals",
      family: "Data",
      description: "Understanding data structures, tabular records, and basic transformation.",
      importance: "important",
      stageExpected: "foundation",
      prerequisites: ["cap-prog-fund"],
      unlocks: ["cap-ai-fund"],
    },
    {
      id: "cap-comm",
      name: "Technical Communication",
      family: "Professional",
      description: "Documenting projects, explaining technical trade-offs, and structured writing.",
      importance: "useful",
      stageExpected: "foundation",
      prerequisites: [],
      unlocks: [],
    },
    {
      id: "cap-mini-project",
      name: "Hands-on Project Execution",
      family: "Proof",
      description: "Taking an idea from concept to a functional code prototype.",
      importance: "core",
      stageExpected: "developing",
      prerequisites: ["cap-prog-fund"],
      unlocks: [],
    },
    {
      id: "cap-ai-fund",
      name: "AI & Machine Learning Overview",
      family: "AI",
      description: "Conceptual understanding of supervised learning, models, and real-world AI applications.",
      importance: "useful",
      stageExpected: "developing",
      prerequisites: ["cap-data-fund"],
      unlocks: [],
    },
  ],
  proofExpectations: [
    {
      id: "proof-py-project",
      capabilityId: "cap-prog-fund",
      description: "A runnable Python script or interactive command-line application.",
      level: "basic",
    },
  ],
  experienceExpectations: [
    {
      id: "exp-hackathon-explorer",
      title: "Beginner Hackathon or Code Showcase",
      description: "Participate in a school or community beginner coding sprint.",
      type: "hackathon",
    },
  ],
  adjacentDestinations: [
    {
      id: "dest-ai-engineer",
      title: "AI Engineer",
      descriptor: "Builds production machine learning models and intelligent apps.",
      tone: "purple",
      sharedCapabilityIds: ["cap-prog-fund", "cap-prob-solv", "cap-data-fund", "cap-mini-project"],
    },
    {
      id: "dest-data-engineer",
      title: "Data Engineer",
      descriptor: "Architects scalable data pipelines and storage systems.",
      tone: "blue",
      sharedCapabilityIds: ["cap-prog-fund", "cap-prob-solv", "cap-data-fund"],
    },
    {
      id: "dest-backend-engineer",
      title: "Backend Engineer",
      descriptor: "Designs reliable server architectures, databases, and APIs.",
      tone: "green",
      sharedCapabilityIds: ["cap-prog-fund", "cap-prob-solv", "cap-mini-project"],
    },
    {
      id: "dest-cybersecurity",
      title: "Cybersecurity Analyst",
      descriptor: "Protects systems, evaluates vulnerabilities, and secures networks.",
      tone: "orange",
      sharedCapabilityIds: ["cap-prog-fund", "cap-prob-solv"],
    },
  ],
  sharedFoundationNodeIds: ["cap-prog-fund", "cap-prob-solv", "cap-data-fund", "cap-comm"],
  decisionPointMonths: 12,
};

export const personaAClaims: Record<string, SkillClaim> = {
  "cap-prob-solv": {
    capabilityId: "cap-prob-solv",
    selfReportedLevel: "basic",
    source: "onboarding",
  },
};

export const personaAEvidence: Evidence[] = [];

export const personaAVerifiedStates: Record<string, VerifiedCapabilityState> = {
  "cap-prob-solv": {
    capabilityId: "cap-prob-solv",
    state: "unverified",
    evidenceIds: [],
    explanation: "Self-reported basic logic aptitude from high school coursework; awaiting proof.",
    lastUpdatedAt: "2026-09-19T00:00:00Z",
  },
  "cap-prog-fund": {
    capabilityId: "cap-prog-fund",
    state: "unverified",
    evidenceIds: [],
    explanation: "Core foundation required to unlock further career explorations.",
    lastUpdatedAt: "2026-09-19T00:00:00Z",
  },
  "cap-data-fund": {
    capabilityId: "cap-data-fund",
    state: "unverified",
    evidenceIds: [],
    explanation: "Prerequisite for both AI and Data Engineering tracks.",
    lastUpdatedAt: "2026-09-19T00:00:00Z",
  },
  "cap-comm": {
    capabilityId: "cap-comm",
    state: "unverified",
    evidenceIds: [],
    explanation: "Cross-cutting communication skill.",
    lastUpdatedAt: "2026-09-19T00:00:00Z",
  },
  "cap-mini-project": {
    capabilityId: "cap-mini-project",
    state: "unverified",
    evidenceIds: [],
    explanation: "Proof milestone to demonstrate programming competence.",
    lastUpdatedAt: "2026-09-19T00:00:00Z",
  },
  "cap-ai-fund": {
    capabilityId: "cap-ai-fund",
    state: "unverified",
    evidenceIds: [],
    explanation: "Exploratory elective based on expressed interest.",
    lastUpdatedAt: "2026-09-19T00:00:00Z",
  },
};

export const personaAGaps: Gap[] = [
  {
    capabilityId: "cap-prog-fund",
    gapType: "never-learned",
    priority: "critical",
    reason: "Programming Fundamentals is a core competency required for this destination.",
    blocksCapabilityIds: ["cap-data-fund", "cap-mini-project", "cap-backend-fund", "cap-ai-fund"],
  },
  {
    capabilityId: "cap-prob-solv",
    gapType: "knowledge-no-proof",
    priority: "high",
    reason: "Problem Solving & Logic concepts are known but lack demonstrated project proof.",
    blocksCapabilityIds: ["cap-prog-fund"],
  },
  {
    capabilityId: "cap-data-fund",
    gapType: "never-learned",
    priority: "medium",
    reason: "Data Fundamentals is an important competency required for this destination.",
    blocksCapabilityIds: ["cap-ai-fund"],
  },
];

export const personaAPlan: AdaptivePlan = {
  generatedAt: "2026-09-19T00:00:00Z",
  summary:
    "An exploration-first 24-month roadmap building shared foundations while keeping 4 tech careers open.",
  now: [
    {
      id: "act-a-1",
      category: "learn",
      title: "Learn Python fundamentals",
      description: "Master variables, loops, data structures, and functions through interactive code exercises.",
      whyNow: "Python supports 7 of 8 possible paths and unlocks future projects.",
      estimatedMinutes: 240,
      capabilityIds: ["cap-prog-fund"],
      status: "todo",
    },
    {
      id: "act-a-2",
      category: "build",
      title: "Try a mini project",
      description: "Build a text-based budget tracker or interactive quiz app to solidify code foundations.",
      whyNow: "Builds tangible project proof early without committing to a single specialization.",
      estimatedMinutes: 180,
      capabilityIds: ["cap-mini-project", "cap-prog-fund"],
      status: "todo",
    },
    {
      id: "act-a-3",
      category: "signal",
      title: "Explore 2 career paths",
      description: "Review real-world project portfolios and daily routines of AI Engineers vs Data Engineers.",
      whyNow: "Helps you discover what work you genuinely enjoy before reaching the Month 12 decision point.",
      estimatedMinutes: 60,
      capabilityIds: ["cap-comm"],
      status: "todo",
    },
  ],
  weeks: [
    {
      weekIndex: 1,
      objectives: ["Set up Python development environment", "Write first 3 functional scripts"],
      actions: [
        {
          id: "act-a-w1-1",
          category: "learn",
          title: "Python variables and basic data types",
          description: "Hands-on syntax practice with strings, numbers, and lists.",
          whyNow: "Core syntax foundation.",
          estimatedMinutes: 120,
          capabilityIds: ["cap-prog-fund"],
          status: "todo",
        },
      ],
    },
  ],
  milestones: [
    {
      id: "ms-a-1",
      title: "Foundational Programming Proof",
      targetMonth: 3,
      evidenceNeeded: ["cap-prog-fund", "cap-mini-project"],
    },
    {
      id: "ms-a-2",
      title: "Exploration Decision Point",
      targetMonth: 12,
      evidenceNeeded: ["cap-data-fund", "cap-ai-fund"],
    },
  ],
};

export const personaATodayPlan = [
  {
    id: "plan-a-1",
    title: "Watch: Python for Beginners",
    timeSlot: "10:00 AM",
    completed: true,
  },
  {
    id: "plan-a-2",
    title: "Practice: Variables & Data Types",
    timeSlot: "11:30 AM",
    completed: true,
  },
  {
    id: "plan-a-3",
    title: "Build: Simple Calculator",
    timeSlot: "2:00 PM",
    completed: false,
  },
  {
    id: "plan-a-4",
    title: "Read: How Python is used in real world",
    timeSlot: "4:00 PM",
    completed: false,
  },
];

export const personaARecentActivities = [
  {
    id: "act-a-log-1",
    title: "Completed quiz: Python Basics",
    timestamp: "2 hours ago",
    dotColor: "green" as const,
  },
  {
    id: "act-a-log-2",
    title: "Saved career path: Data Engineer",
    timestamp: "5 hours ago",
    dotColor: "blue" as const,
  },
  {
    id: "act-a-log-3",
    title: "Added to bookmarks: Machine Learning",
    timestamp: "1 day ago",
    dotColor: "purple" as const,
  },
];

