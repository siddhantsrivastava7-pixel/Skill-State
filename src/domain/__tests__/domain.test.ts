import { describe, it, expect } from "vitest";
import {
  prioritizeGaps,
  calculateAffectedPlanItems,
  preserveEvidenceOnDestinationChange,
  selectMax3VerificationCandidates,
  calculateReadinessDimensions,
  calculateCapabilityOptionality,
} from "../index";
import {
  personaAProfile,
  personaAGraph,
  personaAClaims,
  personaAEvidence,
  personaAVerifiedStates,
  personaAPlan,
  personaBProfile,
  personaBGraph,
  personaBClaims,
  personaBEvidence,
  personaBVerifiedStates,
  personaBPlan,
  personaCGraph,
  personaCProfile,
} from "@/data/demo";
import {
  LearnerProfileSchema,
  DestinationGraphSchema,
  AdaptivePlanSchema,
  EvidenceSchema,
} from "../schemas";

describe("Domain Models & Schemas", () => {
  it("validates Persona A, B, and C profiles against LearnerProfileSchema", () => {
    expect(LearnerProfileSchema.safeParse(personaAProfile).success).toBe(true);
    expect(LearnerProfileSchema.safeParse(personaBProfile).success).toBe(true);
    expect(LearnerProfileSchema.safeParse(personaCProfile).success).toBe(true);
  });

  it("validates Destination Graphs against DestinationGraphSchema", () => {
    expect(DestinationGraphSchema.safeParse(personaAGraph).success).toBe(true);
    expect(DestinationGraphSchema.safeParse(personaBGraph).success).toBe(true);
    expect(DestinationGraphSchema.safeParse(personaCGraph).success).toBe(true);
  });

  it("validates Plans against AdaptivePlanSchema", () => {
    expect(AdaptivePlanSchema.safeParse(personaAPlan).success).toBe(true);
    expect(AdaptivePlanSchema.safeParse(personaBPlan).success).toBe(true);
  });

  it("validates Evidence items against EvidenceSchema", () => {
    for (const ev of personaBEvidence) {
      expect(EvidenceSchema.safeParse(ev).success).toBe(true);
    }
  });
});

describe("Deterministic Domain Helpers", () => {
  it("prioritizes gaps deterministically based on importance, unlocks, severity, urgency", () => {
    const gaps = prioritizeGaps({
      graph: personaBGraph,
      verifiedStates: personaBVerifiedStates,
      claimedStates: personaBClaims,
      targetTimelineMonths: 20,
    });

    expect(gaps.length).toBeGreaterThan(0);
    // Verified skills like Python should not appear as gaps
    expect(gaps.some((g) => g.capabilityId === "cap-python")).toBe(false);

    // Gaps must be sorted by score descending
    for (let i = 0; i < gaps.length - 1; i++) {
      expect(gaps[i].score).toBeGreaterThanOrEqual(gaps[i + 1].score);
    }

    // High/critical priority gaps should include unverified blockers like Linear Algebra
    const linAlgGap = gaps.find((g) => g.capabilityId === "cap-linalg");
    expect(linAlgGap).toBeDefined();
    expect(["critical", "high"]).toContain(linAlgGap?.priority);
  });

  it("calculates affected plan items when a capability changes", () => {
    const impact = calculateAffectedPlanItems(
      ["cap-linalg"],
      personaBPlan,
      personaBGraph
    );

    expect(impact.isPlanChanged).toBe(true);
    expect(impact.affectedNowActions.length).toBeGreaterThan(0);
    expect(impact.affectedNowActions.some((a) => a.id === "act-b-1")).toBe(true);
    expect(impact.affectedMilestones.some((m) => m.id === "ms-b-1")).toBe(true);
  });

  it("preserves 100% of evidence and foundations on destination change", () => {
    const result = preserveEvidenceOnDestinationChange({
      currentEvidence: personaBEvidence,
      currentVerifiedStates: personaBVerifiedStates,
      currentClaimedStates: personaBClaims,
      newGraph: personaCGraph, // Switching from AI Engineer to Financial Analyst
      targetTimelineMonths: 12,
    });

    // Evidence must never be deleted
    expect(result.preservedEvidence.length).toBe(personaBEvidence.length);
    expect(result.preservedEvidence).toEqual(personaBEvidence);

    // Claims must be preserved
    expect(result.preservedClaimedStates).toEqual(personaBClaims);

    // New destination gaps must be recomputed
    expect(result.recomputedGaps.length).toBeGreaterThan(0);
  });

  it("selects maximum 3 verification candidates strictly adhering to priority hierarchy", () => {
    const candidates = selectMax3VerificationCandidates({
      graph: personaBGraph,
      claimedStates: personaBClaims,
      verifiedStates: personaBVerifiedStates,
      evidence: personaBEvidence,
      nearTermCapabilityIds: ["cap-linalg", "cap-ml"],
    });

    expect(candidates.length).toBeLessThanOrEqual(3);
    // Already fully verified capabilities (Python) must NOT be in the verification queue
    expect(candidates.some((c) => c.id === "cap-python")).toBe(false);

    // Should prioritize unverified/uncertain capabilities like cap-ml and cap-sql
    const candidateIds = candidates.map((c) => c.id);
    expect(candidateIds).toContain("cap-ml");
  });

  it("calculates multi-dimensional readiness without fake single score", () => {
    const dimensions = calculateReadinessDimensions(
      personaBGraph,
      personaBVerifiedStates,
      personaBEvidence
    );

    expect(dimensions.verifiedCount).toBe(1); // Python
    expect(dimensions.gapCount).toBe(2); // linalg, deployment
    expect(dimensions.needsProofCount).toBe(2); // sql, ml
    expect(dimensions.hasProjectProof).toBe(true);
  });

  it("calculates capability optionality for uncertain learners", () => {
    const opt = calculateCapabilityOptionality("cap-prog-fund", personaAGraph);
    expect(opt.supportedPathsCount).toBe(5); // 1 primary + 4 adjacent branches
    expect(opt.explanation).toContain("supports 5 of 5 possible paths");
  });
});
