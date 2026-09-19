import {
  personaAProfile,
  personaAGraph,
  personaAClaims,
  personaAEvidence,
  personaAVerifiedStates,
  personaAGaps,
  personaAPlan,
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
} from "./persona-b";

import {
  personaCProfile,
  personaCGraph,
  personaCClaims,
  personaCEvidence,
  personaCVerifiedStates,
  personaCGaps,
  personaCPlan,
} from "./persona-c";

import {
  AdaptivePlan,
  DestinationGraph,
  Evidence,
  Gap,
  LearnerProfile,
  SkillClaim,
  VerifiedCapabilityState,
} from "@/domain/types";

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
}

export const DEMO_PERSONAS: Record<DemoPersonaId, DemoPersonaBundle> = {
  "persona-a": {
    id: "persona-a",
    label: "Persona A (Siddhant — Exploring Class 12)",
    description: "Uncertain learner exploring Technology with 4 open branches and shared foundations.",
    profile: personaAProfile,
    graph: personaAGraph,
    claimedStates: personaAClaims,
    evidence: personaAEvidence,
    verifiedStates: personaAVerifiedStates,
    gaps: personaAGaps,
    plan: personaAPlan,
  },
  "persona-b": {
    id: "persona-b",
    label: "Persona B (Aarav — 3rd Year CS, AI Engineer)",
    description: "Exact destination learner with prior coursework and evidence requiring verification.",
    profile: personaBProfile,
    graph: personaBGraph,
    claimedStates: personaBClaims,
    evidence: personaBEvidence,
    verifiedStates: personaBVerifiedStates,
    gaps: personaBGaps,
    plan: personaBPlan,
  },
  "persona-c": {
    id: "persona-c",
    label: "Persona C (Priya — Financial Analyst)",
    description: "Non-engineering career proof demonstrating universal competency compiler.",
    profile: personaCProfile,
    graph: personaCGraph,
    claimedStates: personaCClaims,
    evidence: personaCEvidence,
    verifiedStates: personaCVerifiedStates,
    gaps: personaCGaps,
    plan: personaCPlan,
  },
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
  personaBProfile,
  personaBGraph,
  personaBClaims,
  personaBEvidence,
  personaBVerifiedStates,
  personaBGaps,
  personaBPlan,
  personaBVerificationQueue,
  personaCProfile,
  personaCGraph,
  personaCClaims,
  personaCEvidence,
  personaCVerifiedStates,
  personaCGaps,
  personaCPlan,
};
