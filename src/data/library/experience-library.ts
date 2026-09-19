import { DestinationGraph, Gap, VerifiedCapabilityState } from "@/domain/types";

export type ExperienceOpportunityType =
  | "internship"
  | "hackathon"
  | "open-source"
  | "team-project"
  | "research";

export interface ExperienceOpportunity {
  id: string;
  title: string;
  organization: string;
  type: ExperienceOpportunityType;
  isDemoOpportunity: true;
  demoLabel: "Example / Demo Opportunity (Simulated Sandbox)";
  targetCapabilityIds: string[];
  fillsGapDescription: string;
  timingRecommendation: string;
  prerequisites: string[];
  prerequisitesMet: boolean;
  estimatedWeeks: number;
  mode: "Remote" | "Hybrid" | "In-Person";
  scopeOverview: string;
}

export const SEEDED_EXPERIENCE_CATALOG: ExperienceOpportunity[] = [
  // AI Engineer Opportunities
  {
    id: "exp-demo-ml-internship",
    title: "Computer Vision & ML Pipeline Engineering Internship",
    organization: "AeroVision AI Labs (Simulated Partner)",
    type: "internship",
    isDemoOpportunity: true,
    demoLabel: "Example / Demo Opportunity (Simulated Sandbox)",
    targetCapabilityIds: ["cap-ml", "cap-deployment"],
    fillsGapDescription:
      "Fills the industry experience gap by embedding you in a team maintaining model CI/CD pipelines and production data drift monitoring.",
    timingRecommendation:
      "Best pursued in Months 5–8 after completing model evaluation proof and Docker API project.",
    prerequisites: ["Python verified", "Model evaluation proof", "Docker API project"],
    prerequisitesMet: true,
    estimatedWeeks: 12,
    mode: "Remote",
    scopeOverview:
      "Work alongside senior engineers to automate inference regression tests, evaluate model accuracy across new camera splits, and profile container latency.",
  },
  {
    id: "exp-demo-ai-hackathon",
    title: "Global Open Source LLM & Inference Hackathon",
    organization: "Foundation Model Alliance (Simulated)",
    type: "hackathon",
    isDemoOpportunity: true,
    demoLabel: "Example / Demo Opportunity (Simulated Sandbox)",
    targetCapabilityIds: ["cap-ml", "cap-python"],
    fillsGapDescription:
      "Fills collaborative sprint experience and demonstrates high-pressure problem solving under tight weekend deadlines.",
    timingRecommendation:
      "Recommended during Month 3–4 as a mid-journey test of your vectorization and API integration skills.",
    prerequisites: ["Python verified", "Working REST API familiarity"],
    prerequisitesMet: true,
    estimatedWeeks: 1,
    mode: "Remote",
    scopeOverview:
      "A 48-hour collaborative build sprint challenging teams to create low-latency domain assistants with measurable retrieval benchmarks.",
  },
  {
    id: "exp-demo-scikit-contrib",
    title: "Community Open Source Feature Contribution",
    organization: "Open Machine Learning Initiative (Simulated)",
    type: "open-source",
    isDemoOpportunity: true,
    demoLabel: "Example / Demo Opportunity (Simulated Sandbox)",
    targetCapabilityIds: ["cap-python", "cap-stats"],
    fillsGapDescription:
      "Fills the professional code review and open collaboration gap, providing publicly verifiable git commit evidence.",
    timingRecommendation:
      "Recommended after Month 4 once you are comfortable writing unit tests and following PEP8 style guides.",
    prerequisites: ["Python verified", "Git & GitHub workflow"],
    prerequisitesMet: true,
    estimatedWeeks: 4,
    mode: "Remote",
    scopeOverview:
      "Pick up an open issue to improve test coverage, add docstrings, or optimize vector calculations in an active community library.",
  },

  // Finance Opportunities
  {
    id: "exp-demo-equity-internship",
    title: "Corporate Valuation & Equity Research Co-op",
    organization: "Apex Capital Research (Simulated Partner)",
    type: "internship",
    isDemoOpportunity: true,
    demoLabel: "Example / Demo Opportunity (Simulated Sandbox)",
    targetCapabilityIds: ["cap-fin-modeling", "cap-fin-statements"],
    fillsGapDescription:
      "Fills the practical investment analysis gap by drafting quarterly coverage updates under senior analyst supervision.",
    timingRecommendation:
      "Best pursued in Months 5–8 after audited DCF model completion.",
    prerequisites: ["Accounting verified", "Audited DCF model completed"],
    prerequisitesMet: true,
    estimatedWeeks: 10,
    mode: "Hybrid",
    scopeOverview:
      "Audit quarterly filings, update sensitivity scenarios, and present investment theses in weekly team pitch meetings.",
  },
  {
    id: "exp-demo-fin-case-comp",
    title: "National Intercollegiate M&A Case Competition",
    organization: "Finance Leadership Forum (Simulated)",
    type: "team-project",
    isDemoOpportunity: true,
    demoLabel: "Example / Demo Opportunity (Simulated Sandbox)",
    targetCapabilityIds: ["cap-fin-comm", "cap-fin-biz-analysis"],
    fillsGapDescription:
      "Fills executive presentation and teamwork gaps by defending acquisition valuations before a panel of industry judges.",
    timingRecommendation:
      "Recommended in Month 3–5 to test valuation modeling under competitive constraints.",
    prerequisites: ["3-statement model familiarity", "Pitch deck presentation"],
    prerequisitesMet: true,
    estimatedWeeks: 2,
    mode: "Remote",
    scopeOverview:
      "Collaborate in a 3-person team to analyze an acquisition target, estimate synergies, and present board-ready slides.",
  },
];

/**
 * Reusable domain selector: matches experience recommendations to destination requirements.
 * Presentation components remain 100% destination-agnostic.
 */
export function matchExperienceToGaps(
  gaps: Gap[],
  graph: DestinationGraph,
  verifiedStates: Record<string, VerifiedCapabilityState>
): ExperienceOpportunity[] {
  const isFinance = graph.destinationName.toLowerCase().includes("finan");

  const filtered = SEEDED_EXPERIENCE_CATALOG.filter((opp) => {
    if (isFinance) {
      return opp.targetCapabilityIds.some((id) => id.includes("fin"));
    }
    return !opp.targetCapabilityIds.some((id) => id.includes("fin"));
  });

  return filtered.map((opp) => {
    // Check if prerequisites are met based on verifiedStates
    const hasUnmetPrereq = opp.targetCapabilityIds.some(
      (id) => verifiedStates[id]?.state === "gap"
    );
    return {
      ...opp,
      prerequisitesMet: !hasUnmetPrereq,
    };
  });
}
