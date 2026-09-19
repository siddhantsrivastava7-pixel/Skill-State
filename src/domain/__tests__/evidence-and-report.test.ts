import { describe, expect, it } from "vitest";
import { DemoAIProvider } from "@/agent/demo-provider";
import {
  applyEvidenceToVerifiedStates,
  deriveVerifiedStates,
} from "@/domain/evidence-transition";
import {
  personaBActivityLedger,
  personaBEvidence,
  personaBGaps,
  personaBGraph,
  personaBProfile,
  personaBVerifiedStates,
} from "@/data/demo";

describe("evidence transitions and progress reporting", () => {
  it("never verifies a resume claim or certificate by itself", () => {
    const resumeStates = applyEvidenceToVerifiedStates({}, {
      id: "resume-only",
      type: "resume",
      title: "Resume",
      createdAt: "2026-09-19T00:00:00.000Z",
      capabilitySignals: [{
        capabilityId: "cap-python",
        signal: "supports",
        strength: "high",
        explanation: "Claims Python experience.",
      }],
    });
    const certificateStates = applyEvidenceToVerifiedStates({}, {
      id: "certificate-only",
      type: "certificate",
      title: "Certificate",
      createdAt: "2026-09-19T00:00:00.000Z",
      capabilitySignals: [{
        capabilityId: "cap-python",
        signal: "supports",
        strength: "high",
        explanation: "Completed a Python course.",
      }],
    });

    expect(resumeStates["cap-python"].state).toBe("needs-proof");
    expect(certificateStates["cap-python"].state).toBe("needs-proof");
  });

  it("allows directly demonstrated strong project evidence to verify a capability", () => {
    const states = deriveVerifiedStates(personaBGraph, [{
      id: "direct-project",
      type: "project",
      title: "Deployed model API",
      createdAt: "2026-09-19T00:00:00.000Z",
      capabilitySignals: [{
        capabilityId: "cap-deployment",
        signal: "supports",
        strength: "high",
        explanation: "The artifact directly demonstrates deployment and serving.",
      }],
    }]);
    expect(states["cap-deployment"].state).toBe("verified");
  });

  it("produces all seven deterministic report sections from state", async () => {
    const report = await new DemoAIProvider().generateProgressReport({
      profile: personaBProfile,
      graph: personaBGraph,
      verifiedStates: personaBVerifiedStates,
      gaps: personaBGaps,
      evidence: personaBEvidence,
      activityLedger: personaBActivityLedger,
    });

    expect(Object.keys(report)).toEqual([
      "generatedAt",
      "skillsAcquired",
      "skillsInProgress",
      "remainingGaps",
      "proofAdded",
      "experienceAdded",
      "planChanges",
      "nextSteps",
    ]);
  });
});
