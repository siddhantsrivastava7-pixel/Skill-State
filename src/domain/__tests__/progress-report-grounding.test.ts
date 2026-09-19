import { describe, expect, it } from "vitest";
import {
  personaBActivityLedger,
  personaBEvidence,
  personaBGaps,
  personaBGraph,
  personaBPlan,
  personaBProfile,
  personaBVerifiedStates,
  personaCGraph,
  personaCPlan,
} from "@/data/demo";
import { preserveEvidenceOnDestinationChange } from "@/domain/destination-switch";
import { deriveVerifiedStates } from "@/domain/evidence-transition";
import { prioritizeGaps } from "@/domain/prioritization";
import { buildProgressReportFromState } from "@/domain/progress-report";
import type { ProgressReportInput } from "@/domain/types";
import {
  uxResearcherGraph,
  uxResearcherPlan,
  uxResearcherProfile,
} from "@/domain/__tests__/fixtures/ux-researcher";

function currentInput(
  overrides: Partial<ProgressReportInput> = {}
): ProgressReportInput {
  return {
    profile: personaBProfile,
    graph: personaBGraph,
    verifiedStates: personaBVerifiedStates,
    gaps: personaBGaps,
    evidence: personaBEvidence,
    activityLedger: personaBActivityLedger,
    currentPlan: personaBPlan,
    ...overrides,
  };
}

describe("progress report state grounding", () => {
  it("keeps the Skills and Report destination capability counts identical", () => {
    const input = currentInput();
    const report = buildProgressReportFromState(input, "Grounded summary.");

    expect(report.destinationCapabilities).toHaveLength(
      input.graph.capabilityNodes.length
    );
  });

  it("copies current learner gap IDs exactly and in their current order", () => {
    const input = currentInput();
    const report = buildProgressReportFromState(input, "Grounded summary.");

    expect(report.gapCapabilityIds).toEqual(
      input.gaps.map((gap) => gap.capabilityId)
    );
  });

  it("cannot introduce a historical capability absent from the active graph", () => {
    const input = currentInput({
      verifiedStates: {
        ...personaBVerifiedStates,
        "historical-capability": {
          capabilityId: "historical-capability",
          state: "verified",
          evidenceIds: ["historical-evidence"],
          explanation: "Belongs to an earlier destination.",
          lastUpdatedAt: "2026-09-19T00:00:00.000Z",
        },
      },
    });
    const report = buildProgressReportFromState(input, "Grounded summary.");

    expect(
      report.destinationCapabilities.map((capability) => capability.capabilityId)
    ).not.toContain("historical-capability");
    expect(report.skillsAcquired).not.toContain("historical-capability");
  });

  it("uses the new active destination after a career switch", () => {
    const switched = preserveEvidenceOnDestinationChange({
      currentEvidence: personaBEvidence,
      currentVerifiedStates: personaBVerifiedStates,
      currentClaimedStates: {},
      newGraph: personaCGraph,
      targetTimelineMonths: personaBProfile.targetTimelineMonths,
    });
    const report = buildProgressReportFromState(
      currentInput({
        graph: personaCGraph,
        verifiedStates: switched.updatedVerifiedStates,
        gaps: switched.recomputedGaps,
        evidence: switched.preservedEvidence,
        currentPlan: personaCPlan,
      }),
      "Grounded summary."
    );

    expect(report.destinationId).toBe(personaCGraph.destinationId);
    expect(report.destinationTitle).toBe(personaCGraph.destinationName);
    expect(report.destinationCapabilities.map(({ capabilityId }) => capabilityId)).toEqual(
      personaCGraph.capabilityNodes.map(({ id }) => id)
    );
  });

  it("keeps a novel career report grounded in its generated DestinationGraph", () => {
    const verifiedStates = deriveVerifiedStates(uxResearcherGraph, []);
    const gaps = prioritizeGaps({
      graph: uxResearcherGraph,
      verifiedStates,
      claimedStates: {},
      targetTimelineMonths: uxResearcherProfile.targetTimelineMonths,
    });
    const report = buildProgressReportFromState(
      {
        profile: uxResearcherProfile,
        graph: uxResearcherGraph,
        verifiedStates,
        gaps,
        evidence: [],
        activityLedger: [],
        currentPlan: uxResearcherPlan,
      },
      "Grounded summary."
    );

    const graphIds = uxResearcherGraph.capabilityNodes.map(({ id }) => id);
    expect(report.destinationCapabilities.map(({ capabilityId }) => capabilityId)).toEqual(
      graphIds
    );
    expect(report.gapCapabilityIds).toEqual(
      gaps.map(({ capabilityId }) => capabilityId)
    );
    expect(report.destinationCapabilities.every(({ capabilityId }) => graphIds.includes(capabilityId))).toBe(true);
  });
});
