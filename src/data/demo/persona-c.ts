import {
  AdaptivePlan,
  DestinationGraph,
  Evidence,
  Gap,
  LearnerProfile,
  SkillClaim,
  VerifiedCapabilityState,
} from "@/domain/types";

export const personaCProfile: LearnerProfile = {
  id: "persona-c",
  name: "Priya",
  stage: "graduate",
  stageDetail: "Economics & Commerce Graduate",
  fieldOfStudy: "Commerce / Finance",
  weeklyHours: 12,
  targetTimelineMonths: 12,
  learningPreference: "structured-first",
  destinationCertainty: "exact",
  statedDestination: "Financial Analyst",
  interests: ["valuation", "financial markets", "corporate finance", "data visualization"],
};

export const personaCGraph: DestinationGraph = {
  destinationId: "dest-financial-analyst",
  destinationName: "Financial Analyst",
  summary:
    "Corporate valuation, three-statement financial modeling, variance analysis, capital budgeting, and executive presentation of financial performance.",
  confidence: "high",
  capabilityNodes: [
    {
      id: "cap-fin-accounting",
      name: "Accounting Fundamentals",
      family: "Foundations",
      description: "GAAP/IFRS rules, accrual mechanics, debits/credits, and balance sheet reconciliation.",
      importance: "core",
      stageExpected: "foundation",
      prerequisites: [],
      unlocks: ["cap-fin-statements", "cap-fin-modeling"],
    },
    {
      id: "cap-fin-spreadsheets",
      name: "Advanced Spreadsheet Analysis",
      family: "Tools",
      description: "Index/Match, XLOOKUP, dynamic arrays, scenario managers, data tables, and auditing shortcuts in Excel.",
      importance: "core",
      stageExpected: "foundation",
      prerequisites: [],
      unlocks: ["cap-fin-modeling", "cap-fin-dataviz"],
    },
    {
      id: "cap-fin-statements",
      name: "Three-Statement Analysis",
      family: "Analysis",
      description: "Interlinking Income Statement, Balance Sheet, and Cash Flow statement with working capital dynamics.",
      importance: "core",
      stageExpected: "developing",
      prerequisites: ["cap-fin-accounting"],
      unlocks: ["cap-fin-modeling"],
    },
    {
      id: "cap-fin-modeling",
      name: "Financial Modeling & Valuation",
      family: "Modeling",
      description: "Discounted Cash Flow (DCF), Comparable Company Analysis, WACC calculation, and sensitivity tables.",
      importance: "core",
      stageExpected: "developing",
      prerequisites: ["cap-fin-accounting", "cap-fin-spreadsheets", "cap-fin-statements"],
      unlocks: ["cap-fin-biz-analysis"],
    },
    {
      id: "cap-fin-biz-analysis",
      name: "Business & Variance Analysis",
      family: "Strategy",
      description: "Analyzing operating margin drivers, revenue churn, budget vs actual variance, and competitive moat.",
      importance: "important",
      stageExpected: "specialist",
      prerequisites: ["cap-fin-modeling"],
      unlocks: [],
    },
    {
      id: "cap-fin-dataviz",
      name: "Financial Reporting & Data Visualization",
      family: "Presentation",
      description: "Waterfall charts, bridge diagrams, dashboard design (Power BI / Excel charts), and board decks.",
      importance: "important",
      stageExpected: "developing",
      prerequisites: ["cap-fin-spreadsheets"],
      unlocks: ["cap-fin-comm"],
    },
    {
      id: "cap-fin-comm",
      name: "Executive Financial Communication",
      family: "Professional",
      description: "Translating numerical findings into concise memos, investor updates, and board-ready recommendations.",
      importance: "core",
      stageExpected: "developing",
      prerequisites: [],
      unlocks: [],
    },
  ],
  proofExpectations: [
    {
      id: "proof-dcf-model",
      capabilityId: "cap-fin-modeling",
      description: "A fully dynamic, audited DCF and Comps model for a publicly listed firm with sensitivity tables.",
      level: "working",
    },
  ],
  experienceExpectations: [
    {
      id: "exp-equity-research",
      title: "Corporate Finance or Equity Research Internship",
      description: "Hands-on experience building quarterly financial decks and assisting in earnings breakdown.",
      type: "internship",
    },
  ],
  adjacentDestinations: [
    {
      id: "dest-accountant",
      title: "Corporate Accountant",
      descriptor: "Financial reporting, internal controls, statutory audits, and tax compliance.",
      tone: "blue",
      sharedCapabilityIds: ["cap-fin-accounting", "cap-fin-spreadsheets", "cap-fin-statements"],
    },
    {
      id: "dest-consultant",
      title: "Management Consultant",
      descriptor: "Strategic problem solving, market sizing, cost optimization, and executive advisory.",
      tone: "orange",
      sharedCapabilityIds: ["cap-fin-spreadsheets", "cap-fin-biz-analysis", "cap-fin-comm"],
    },
  ],
  sharedFoundationNodeIds: [
    "cap-fin-accounting",
    "cap-fin-spreadsheets",
    "cap-fin-statements",
    "cap-fin-comm",
  ],
  decisionPointMonths: 6,
};

export const personaCClaims: Record<string, SkillClaim> = {
  "cap-fin-accounting": {
    capabilityId: "cap-fin-accounting",
    selfReportedLevel: "strong",
    source: "onboarding",
  },
  "cap-fin-spreadsheets": {
    capabilityId: "cap-fin-spreadsheets",
    selfReportedLevel: "strong",
    source: "onboarding",
  },
  "cap-fin-statements": {
    capabilityId: "cap-fin-statements",
    selfReportedLevel: "working",
    source: "onboarding",
  },
  "cap-fin-modeling": {
    capabilityId: "cap-fin-modeling",
    selfReportedLevel: "basic",
    source: "onboarding",
  },
  "cap-fin-biz-analysis": {
    capabilityId: "cap-fin-biz-analysis",
    selfReportedLevel: "none",
    source: "onboarding",
  },
  "cap-fin-dataviz": {
    capabilityId: "cap-fin-dataviz",
    selfReportedLevel: "working",
    source: "onboarding",
  },
  "cap-fin-comm": {
    capabilityId: "cap-fin-comm",
    selfReportedLevel: "working",
    source: "onboarding",
  },
};

export const personaCEvidence: Evidence[] = [
  {
    id: "ev-transcript-priya",
    type: "certificate",
    title: "University Transcript: Bachelor of Commerce (Honours)",
    createdAt: "2026-09-17T09:00:00Z",
    sourceText: "Coursework completed: Corporate Accounting (Grade A), Financial Management (Grade A), Business Statistics (Grade B+).",
    capabilitySignals: [
      {
        capabilityId: "cap-fin-accounting",
        signal: "supports",
        strength: "high",
        explanation: "Consistent university-level academic coursework in corporate accounting.",
      },
      {
        capabilityId: "cap-fin-statements",
        signal: "supports",
        strength: "medium",
        explanation: "Coursework verified theoretical understanding of balance sheet and cash flow mechanics.",
      },
    ],
  },
  {
    id: "ev-case-study-fmcg",
    type: "project",
    title: "FMCG Company Financial Ratio & Profitability Case Study",
    createdAt: "2026-09-17T14:00:00Z",
    sourceText: "Authored 15-page comparative analysis of two leading consumer goods companies evaluating operating leverage and return on equity.",
    capabilitySignals: [
      {
        capabilityId: "cap-fin-spreadsheets",
        signal: "supports",
        strength: "medium",
        explanation: "Demonstrated spreadsheet analysis calculating DuPont framework and working capital ratios.",
      },
      {
        capabilityId: "cap-fin-comm",
        signal: "supports",
        strength: "medium",
        explanation: "Clear executive summary and written rationale explaining margin expansion.",
      },
    ],
  },
];

export const personaCVerifiedStates: Record<string, VerifiedCapabilityState> = {
  "cap-fin-accounting": {
    capabilityId: "cap-fin-accounting",
    state: "verified",
    evidenceIds: ["ev-transcript-priya"],
    explanation: "Academic transcript confirms rigorous corporate accounting foundations.",
    lastUpdatedAt: "2026-09-17T14:00:00Z",
  },
  "cap-fin-spreadsheets": {
    capabilityId: "cap-fin-spreadsheets",
    state: "developing",
    evidenceIds: ["ev-case-study-fmcg"],
    explanation: "Proven basic ratio calculation in spreadsheets; complex dynamic 3-statement modeling unverified.",
    lastUpdatedAt: "2026-09-17T14:00:00Z",
  },
  "cap-fin-statements": {
    capabilityId: "cap-fin-statements",
    state: "developing",
    evidenceIds: ["ev-transcript-priya"],
    explanation: "Strong theoretical understanding; requires hands-on integrated modeling proof.",
    lastUpdatedAt: "2026-09-17T14:00:00Z",
  },
  "cap-fin-modeling": {
    capabilityId: "cap-fin-modeling",
    state: "gap",
    evidenceIds: [],
    explanation: "Self-reported basic; no DCF or Comps model provided. Core bottleneck for analyst roles.",
    lastUpdatedAt: "2026-09-17T14:00:00Z",
  },
  "cap-fin-biz-analysis": {
    capabilityId: "cap-fin-biz-analysis",
    state: "gap",
    evidenceIds: [],
    explanation: "Budget variance and competitive moat modeling not yet demonstrated.",
    lastUpdatedAt: "2026-09-17T14:00:00Z",
  },
  "cap-fin-dataviz": {
    capabilityId: "cap-fin-dataviz",
    state: "needs-proof",
    evidenceIds: [],
    explanation: "Self-reported working familiarity with presentation charts; no portfolio exhibits attached.",
    lastUpdatedAt: "2026-09-17T14:00:00Z",
  },
  "cap-fin-comm": {
    capabilityId: "cap-fin-comm",
    state: "developing",
    evidenceIds: ["ev-case-study-fmcg"],
    explanation: "Demonstrated structured writing in case study analysis.",
    lastUpdatedAt: "2026-09-17T14:00:00Z",
  },
};

export const personaCGaps: Gap[] = [
  {
    capabilityId: "cap-fin-modeling",
    gapType: "never-learned",
    priority: "critical",
    reason: "Financial Modeling & Valuation is a core competency required for financial analyst recruiting.",
    blocksCapabilityIds: ["cap-fin-biz-analysis"],
  },
  {
    capabilityId: "cap-fin-dataviz",
    gapType: "knowledge-no-proof",
    priority: "medium",
    reason: "Data visualization for finance reported as working but requires visual sample deck.",
    blocksCapabilityIds: ["cap-fin-comm"],
  },
  {
    capabilityId: "cap-fin-biz-analysis",
    gapType: "never-learned",
    priority: "medium",
    reason: "Business & Variance Analysis is an important competency for strategic finance positions.",
    blocksCapabilityIds: [],
  },
];

export const personaCPlan: AdaptivePlan = {
  generatedAt: "2026-09-19T00:00:00Z",
  summary:
    "A 12-month corporate finance transition roadmap focusing on 3-statement integrated modeling, DCF valuation, and equity research internship placement.",
  now: [
    {
      id: "act-c-1",
      category: "build",
      title: "Build 3-statement dynamic model",
      description: "Construct a linked dynamic financial model for a real retail enterprise in Excel.",
      whyNow: "Converts your accounting theory into the primary practical artifact required by corporate finance teams.",
      estimatedMinutes: 300,
      capabilityIds: ["cap-fin-spreadsheets", "cap-fin-statements", "cap-fin-modeling"],
      status: "todo",
    },
    {
      id: "act-c-2",
      category: "learn",
      title: "Master DCF and WACC methodology",
      description: "Work through cost of capital calculation, terminal value assumptions, and sensitivity tables.",
      whyNow: "Prepares you for the DCF model valuation milestone.",
      estimatedMinutes: 180,
      capabilityIds: ["cap-fin-modeling"],
      status: "todo",
    },
    {
      id: "act-c-3",
      category: "signal",
      title: "Format one-page equity summary note",
      description: "Synthesize company valuation findings into a structured investment memo with waterfall charts.",
      whyNow: "Demonstrates executive communication and financial charting ability to recruiters.",
      estimatedMinutes: 120,
      capabilityIds: ["cap-fin-comm", "cap-fin-dataviz"],
      status: "todo",
    },
  ],
  weeks: [
    {
      weekIndex: 1,
      objectives: ["Set up Excel dynamic modeling templates", "Link Balance Sheet and Cash Flow"],
      actions: [
        {
          id: "act-c-w1-1",
          category: "build",
          title: "Build revenue and depreciation schedules",
          description: "Model working capital schedules and debt amortization tables.",
          whyNow: "Fundamental prerequisite for statement integration.",
          estimatedMinutes: 150,
          capabilityIds: ["cap-fin-modeling"],
          status: "todo",
        },
      ],
    },
  ],
  milestones: [
    {
      id: "ms-c-1",
      title: "Complete Audited 3-Statement & DCF Model",
      targetMonth: 2,
      evidenceNeeded: ["cap-fin-modeling", "cap-fin-statements"],
    },
    {
      id: "ms-c-2",
      title: "Corporate Finance Interview Readiness",
      targetMonth: 4,
      evidenceNeeded: ["cap-fin-modeling", "cap-fin-biz-analysis", "cap-fin-comm"],
    },
  ],
};
