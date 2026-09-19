import {
  personaAProfile,
  personaAGraph,
  personaAClaims,
  personaAEvidence,
  personaAVerifiedStates,
  personaAGaps,
  personaAPlan,
  personaAActivityLedger,
} from "./persona-a";

import {
  personaBProfile,
  personaBGraph,
  personaBClaims,
  personaBEvidence,
  personaBVerifiedStates,
  personaBGaps,
  personaBPlan,
  personaBVerificationQueue,
  personaBActivityLedger,
} from "./persona-b";

import {
  personaCProfile,
  personaCGraph,
  personaCClaims,
  personaCEvidence,
  personaCVerifiedStates,
  personaCGaps,
  personaCPlan,
  personaCActivityLedger,
} from "./persona-c";

import {
  ActivityEvent,
  AdaptivePlan,
  DestinationGraph,
  Evidence,
  Gap,
  LearnerProfile,
  SkillClaim,
  VerifiedCapabilityState,
} from "@/domain/types";
import { capabilityRepository, careerRepository } from "@/data/knowledge/repositories";
import { careerKnowledgeToDestinationGraph } from "@/data/knowledge/adapter";
import { deriveVerifiedStates } from "@/domain/evidence-transition";
import { prioritizeGaps } from "@/domain/prioritization";

export type DemoPersonaId = "persona-a" | "persona-b" | "persona-c";

export interface DemoPersonaBundle {
  id: DemoPersonaId;
  label: string;
  description: string;
  profile: LearnerProfile;
  graph: DestinationGraph;
  claimedStates: Record<string, SkillClaim>;
  evidence: Evidence[];
  verifiedStates: Record<string, VerifiedCapabilityState>;
  gaps: Gap[];
  plan: AdaptivePlan;
  activityLedger: ActivityEvent[];
}

function learnerBundleForGraph(
  base: Omit<DemoPersonaBundle, "graph" | "verifiedStates" | "gaps">,
  graph: DestinationGraph,
  idMap: Record<string, string>
): DemoPersonaBundle {
  const validIds = new Set(graph.capabilityNodes.map((node) => node.id));
  const mapId = (id: string) => idMap[id] ?? id;
  const claimedStates = Object.fromEntries(
    Object.values(base.claimedStates)
      .map((claim) => ({ ...claim, capabilityId: mapId(claim.capabilityId) }))
      .filter((claim) => validIds.has(claim.capabilityId))
      .map((claim) => [claim.capabilityId, claim])
  );
  const evidence = base.evidence.map((item) => ({
    ...item,
    capabilitySignals: item.capabilitySignals
      .map((signal) => ({ ...signal, capabilityId: mapId(signal.capabilityId) }))
      .filter((signal) => validIds.has(signal.capabilityId)),
  }));
  const mapAction = (action: AdaptivePlan["now"][number]) => ({
    ...action,
    capabilityIds: Array.from(new Set(action.capabilityIds.map(mapId).filter((id) => validIds.has(id)))),
  });
  const plan = {
    ...base.plan,
    now: base.plan.now.map(mapAction),
    weeks: base.plan.weeks.map((week) => ({ ...week, actions: week.actions.map(mapAction) })),
  };
  const verifiedStates = deriveVerifiedStates(graph, evidence, claimedStates);
  const gaps = prioritizeGaps({
    graph,
    verifiedStates,
    claimedStates,
    targetTimelineMonths: base.profile.targetTimelineMonths,
  });
  return { ...base, graph, claimedStates, evidence, verifiedStates, gaps, plan };
}

function sharedDemoBundle(
  base: Omit<DemoPersonaBundle, "graph" | "verifiedStates" | "gaps">,
  careerId: string,
  idMap: Record<string, string>
): DemoPersonaBundle {
  const career = careerRepository.getByIdSync(careerId);
  if (!career) throw new Error(`Missing demo career in shared knowledge: ${careerId}`);
  return learnerBundleForGraph(base, careerKnowledgeToDestinationGraph(career), idMap);
}

const PERSONA_A_CAPABILITY_MAP: Record<string, string> = {
  "cap-prog-fund": "programming-python",
  "cap-prob-solv": "critical-thinking",
  "cap-data-fund": "data-modeling",
  "cap-comm": "documentation",
  "cap-mini-project": "testing-quality",
  "cap-ai-fund": "machine-learning",
};

function exploringPersonaBundle(
  base: Omit<DemoPersonaBundle, "graph" | "verifiedStates" | "gaps">
): DemoPersonaBundle {
  const mapId = (id: string) => PERSONA_A_CAPABILITY_MAP[id] ?? id;
  const mappedNodes = personaAGraph.capabilityNodes.map((node) => {
    const id = mapId(node.id);
    const definition = capabilityRepository.getByIdSync(id);
    if (!definition) throw new Error(`Missing shared exploration capability: ${id}`);
    return {
      ...node,
      id,
      name: definition.name,
      family: definition.domain,
      description: definition.description,
      prerequisites: node.prerequisites.map(mapId),
      unlocks: node.unlocks.map(mapId),
    };
  });
  const explorationIds = new Set(mappedNodes.map((node) => node.id));
  const capabilityNodes = mappedNodes.map((node) => ({
    ...node,
    prerequisites: node.prerequisites.filter((id) => explorationIds.has(id)),
    unlocks: node.unlocks.filter((id) => explorationIds.has(id)),
  }));
  const candidateIds = [
    "ai-engineer",
    "data-engineer",
    "backend-engineer",
    "cybersecurity-analyst",
  ];
  const adjacentDestinations = candidateIds.map((careerId, index) => {
    const career = careerRepository.getByIdSync(careerId);
    if (!career) throw new Error(`Missing shared exploration candidate: ${careerId}`);
    const candidate = careerKnowledgeToDestinationGraph(career);
    return {
      id: career.id,
      title: career.title,
      descriptor: career.summary,
      tone: (["purple", "blue", "green", "orange"] as const)[index],
      sharedCapabilityIds: candidate.capabilityNodes
        .map((node) => node.id)
        .filter((id) => explorationIds.has(id)),
    };
  });
  const graph: DestinationGraph = {
    ...personaAGraph,
    capabilityNodes,
    proofExpectations: personaAGraph.proofExpectations.map((proof) => ({
      ...proof,
      capabilityId: mapId(proof.capabilityId),
    })),
    adjacentDestinations,
    sharedFoundationNodeIds: personaAGraph.sharedFoundationNodeIds.map(mapId),
  };
  return learnerBundleForGraph(base, graph, PERSONA_A_CAPABILITY_MAP);
}

export const DEMO_PERSONAS: Record<DemoPersonaId, DemoPersonaBundle> = {
  "persona-a": exploringPersonaBundle({
    id: "persona-a",
    label: "Persona A (Siddhant — Exploring Class 12)",
    description: "Uncertain learner exploring Technology with 4 open branches and shared foundations.",
    profile: personaAProfile,
    claimedStates: personaAClaims,
    evidence: personaAEvidence,
    plan: personaAPlan,
    activityLedger: personaAActivityLedger,
  }),
  "persona-b": sharedDemoBundle({
    id: "persona-b",
    label: "Persona B (Aarav — 3rd Year CS, AI Engineer)",
    description: "Exact destination learner with prior coursework and evidence requiring verification.",
    profile: personaBProfile,
    claimedStates: personaBClaims,
    evidence: personaBEvidence,
    plan: personaBPlan,
    activityLedger: personaBActivityLedger,
  }, "ai-engineer", {
    "cap-python": "programming-python",
    "cap-ml": "machine-learning",
    "cap-deployment": "mlops",
  }),
  "persona-c": sharedDemoBundle({
    id: "persona-c",
    label: "Persona C (Priya — Financial Analyst)",
    description: "Non-engineering career proof demonstrating universal competency compiler.",
    profile: personaCProfile,
    claimedStates: personaCClaims,
    evidence: personaCEvidence,
    plan: personaCPlan,
    activityLedger: personaCActivityLedger,
  }, "financial-analyst", {
    "cap-fin-accounting": "accounting",
    "cap-fin-spreadsheets": "excel-modeling",
    "cap-fin-statements": "financial-statements",
    "cap-fin-modeling": "financial-modeling",
    "cap-fin-biz-analysis": "corporate-finance",
    "cap-fin-comm": "presentation-storytelling",
  }),
};

export function getDemoPersona(id: DemoPersonaId): DemoPersonaBundle {
  return DEMO_PERSONAS[id] ?? DEMO_PERSONAS["persona-a"];
}

export {
  personaAProfile,
  personaAGraph,
  personaAClaims,
  personaAEvidence,
  personaAVerifiedStates,
  personaAGaps,
  personaAPlan,
  personaAActivityLedger,
  personaBProfile,
  personaBGraph,
  personaBClaims,
  personaBEvidence,
  personaBVerifiedStates,
  personaBGaps,
  personaBPlan,
  personaBVerificationQueue,
  personaBActivityLedger,
  personaCProfile,
  personaCGraph,
  personaCClaims,
  personaCEvidence,
  personaCVerifiedStates,
  personaCGaps,
  personaCPlan,
  personaCActivityLedger,
};
