import { describe, it, expect, beforeEach } from "vitest";
import { executeVerificationTransition } from "../state-transition";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import {
  personaBProfile,
  personaBGraph,
  personaBClaims,
  personaBEvidence,
  personaBVerifiedStates,
  personaBPlan,
  personaBVerificationQueue,
} from "@/data/demo";
import { getAIProvider } from "@/agent/orchestrator";
import { VerificationSubmission } from "../types";

describe("Phase 5: Verification State Transition Engine", () => {
  beforeEach(() => {
    useSkillStateStore.getState().loadPersona("persona-b");
  });

  it("completes the end-to-end transition: claimed -> task -> submission -> evidence -> verifiedState -> gap recomputation -> adaptive plan -> explanation", async () => {
    const provider = getAIProvider();

    // 1. Claimed capability & task
    const capId = "cap-ml";
    const queueTask = personaBVerificationQueue.find((t) => t.capabilityId === capId)!;
    expect(queueTask).toBeDefined();

    // 2. Submitted Answer (strong response)
    const submission: VerificationSubmission = {
      taskId: queueTask.id,
      capabilityId: capId,
      userResponse:
        "In this 99.2% / 0.8% imbalanced distribution, overall accuracy suffers from the accuracy paradox. I would evaluate the model with PR-AUC, set decision thresholds based on business cost trade-offs, and validate with stratified 5-fold cross-validation.",
    };

    // 3. Evaluated Evidence
    const evalResult = await provider.evaluateVerification(submission);
    expect(evalResult.passed).toBe(true);
    expect(evalResult.proposedState).toBe("verified");
    expect(evalResult.evidenceSignal.signal).toBe("supports");

    // 4. State transition execution
    const transition = executeVerificationTransition({
      submission,
      evaluationResult: evalResult,
      currentVerifiedStates: personaBVerifiedStates,
      currentClaims: personaBClaims,
      currentEvidence: personaBEvidence,
      currentPlan: personaBPlan,
      graph: personaBGraph,
      targetTimelineMonths: personaBProfile.targetTimelineMonths,
    });

    // 5. VerifiedCapabilityState update
    expect(transition.updatedVerifiedStates[capId].state).toBe("verified");
    expect(transition.updatedVerifiedStates[capId].evidenceIds).toContain(
      transition.newEvidence.id
    );

    // 6. Evidence creation
    expect(transition.newEvidence.type).toBe("assessment");
    expect(transition.newEvidence.capabilitySignals[0].signal).toBe("supports");

    // 7. Gap recomputation
    // When cap-ml is verified, cap-ml should not be in the high priority unverified gaps
    const mlGap = transition.recomputedGaps.find((g) => g.capabilityId === capId);
    expect(mlGap).toBeUndefined();

    // 8. AdaptivePlan update
    expect(transition.updatedPlan).toBeDefined();
    expect(transition.updatedPlan.now.length).toBeGreaterThan(0);

    // 9. Visible explanation
    expect(transition.planChangeExplanation).toBeTruthy();
    expect(typeof transition.planChangeExplanation).toBe("string");

    // 10. Activity Event
    expect(transition.activityEvent.type).toBe("VERIFICATION_COMPLETED");
    expect(transition.activityEvent.metadata?.passed).toBe(true);
  });

  it("handles Persona B weak answer scenario: exposes gap, inserts repair task in plan.now, and explains plan change", async () => {
    const provider = getAIProvider();
    const capId = "cap-ml";

    // Submits weak response relying on 99.2% accuracy
    const submission: VerificationSubmission = {
      taskId: "task-ml-eval-scenario",
      capabilityId: capId,
      userResponse:
        "Our accuracy is 99.2% which is fine because accuracy is fine for almost all cases. We don't need additional metrics.",
    };

    const evalResult = await provider.evaluateVerification(submission);
    expect(evalResult.passed).toBe(false);
    expect(evalResult.proposedState).toBe("developing");
    expect(evalResult.signal).toBe("weakens");

    const transition = executeVerificationTransition({
      submission,
      evaluationResult: evalResult,
      currentVerifiedStates: personaBVerifiedStates,
      currentClaims: personaBClaims,
      currentEvidence: personaBEvidence,
      currentPlan: personaBPlan,
      graph: personaBGraph,
      targetTimelineMonths: personaBProfile.targetTimelineMonths,
    });

    // Verified state becomes developing
    expect(transition.updatedVerifiedStates[capId].state).toBe("developing");

    // Gap recomputation reflects the deficit
    const mlGap = transition.recomputedGaps.find((g) => g.capabilityId === capId);
    expect(mlGap).toBeDefined();

    // Plan.now contains an immediate repair action
    const repairTask = transition.updatedPlan.now.find(
      (a) => a.capabilityIds.includes(capId) && a.title.toLowerCase().includes("repair")
    );
    expect(repairTask).toBeDefined();

    // Explanation is visible and explains the model evaluation gap
    expect(transition.planChangeExplanation.toLowerCase()).toContain("gap");
  });

  it("synchronizes state atomically in useSkillStateStore", async () => {
    const store = useSkillStateStore.getState();
    const capId = "cap-ml";

    const initialEvidenceCount = store.evidence.length;
    const initialActivityCount = store.activityLedger.length;

    const submission: VerificationSubmission = {
      taskId: "task-ml-eval-scenario",
      capabilityId: capId,
      userResponse:
        "The 99.2% accuracy is misleading due to the accuracy paradox on imbalanced data. We must measure PR-AUC and use stratified cross-validation.",
    };

    const provider = getAIProvider();
    const evalResult = await provider.evaluateVerification(submission);

    // Call store action
    const transitionResult = store.recordVerificationResult(evalResult, submission);

    const updatedStore = useSkillStateStore.getState();

    // 1. Evidence appended
    expect(updatedStore.evidence.length).toBe(initialEvidenceCount + 1);
    expect(updatedStore.evidence.some((e) => e.id === transitionResult.newEvidence.id)).toBe(true);

    // 2. Verified state updated
    expect(updatedStore.verifiedStates[capId].state).toBe("verified");

    // 3. Activity ledger appended
    expect(updatedStore.activityLedger.length).toBe(initialActivityCount + 1);
    expect(updatedStore.activityLedger[updatedStore.activityLedger.length - 1].type).toBe(
      "VERIFICATION_COMPLETED"
    );

    // 4. lastTransitionResult populated
    expect(updatedStore.lastTransitionResult).toBeDefined();
    expect(updatedStore.lastTransitionResult?.stateTransition.passed).toBe(true);

    // 5. clearLastTransition resets it
    updatedStore.clearLastTransition();
    expect(useSkillStateStore.getState().lastTransitionResult).toBeUndefined();
  });
});
