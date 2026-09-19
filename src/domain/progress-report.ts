import type { ProgressReport, ProgressReportInput } from "./types";

export function buildProgressReportFromState(
  input: ProgressReportInput,
  nextSteps: string[]
): ProgressReport {
  const capabilityName = (capabilityId: string) =>
    input.graph.capabilityNodes.find((node) => node.id === capabilityId)?.name ??
    capabilityId;
  const states = Object.values(input.verifiedStates);

  return {
    generatedAt: new Date().toISOString(),
    skillsAcquired: states
      .filter((state) => state.state === "verified")
      .map((state) => capabilityName(state.capabilityId)),
    skillsInProgress: states
      .filter((state) => state.state === "developing" || state.state === "needs-proof")
      .map((state) => capabilityName(state.capabilityId)),
    remainingGaps: input.gaps.map(
      (gap) => `${capabilityName(gap.capabilityId)} (${gap.priority} priority)`
    ),
    proofAdded: input.evidence
      .filter((item) => item.type === "project" || item.type === "assessment")
      .map((item) => item.title),
    experienceAdded: input.evidence
      .filter((item) => item.type === "experience" || item.type === "activity")
      .map((item) => item.title),
    planChanges: input.activityLedger
      .filter((event) =>
        [
          "DESTINATION_CHANGED",
          "VERIFICATION_COMPLETED",
          "ACTIVITY_COMPLETED",
          "TIME_BUDGET_CHANGED",
        ].includes(event.type)
      )
      .slice(-5)
      .map((event) => event.description),
    nextSteps,
  };
}
