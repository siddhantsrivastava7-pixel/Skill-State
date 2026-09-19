import type { ProgressReport, ProgressReportInput } from "./types";

export type ProgressReportFacts = Omit<
  ProgressReport,
  "generatedAt" | "narrativeSummary"
>;

function uniqueCurrentPlanActions(input: ProgressReportInput) {
  const activeCapabilityIds = new Set(
    input.graph.capabilityNodes.map((node) => node.id)
  );
  const actions = [
    ...input.currentPlan.now,
    ...input.currentPlan.weeks.flatMap((week) => week.actions),
  ];
  const seen = new Set<string>();

  return actions.filter((action) => {
    if (seen.has(action.id) || action.status === "done" || action.status === "verified") {
      return false;
    }
    seen.add(action.id);
    return action.capabilityIds.every((id) => activeCapabilityIds.has(id));
  });
}

export function buildProgressReportFacts(
  input: ProgressReportInput
): ProgressReportFacts {
  const activeCapabilityIds = new Set(
    input.graph.capabilityNodes.map((node) => node.id)
  );
  const unknownGap = input.gaps.find(
    (gap) => !activeCapabilityIds.has(gap.capabilityId)
  );
  if (unknownGap) {
    throw new Error(
      `Progress report gap is not in the active destination: ${unknownGap.capabilityId}`
    );
  }

  const capabilityName = new Map(
    input.graph.capabilityNodes.map((node) => [node.id, node.name])
  );
  const activeStates = input.graph.capabilityNodes.map((node) =>
    input.verifiedStates[node.id] ?? {
      capabilityId: node.id,
      state: "unverified" as const,
      evidenceIds: [],
      explanation: "No verified evidence is recorded for this active capability.",
      lastUpdatedAt: input.currentPlan.generatedAt,
    }
  );

  return {
    destinationId: input.graph.destinationId,
    destinationTitle: input.graph.destinationName,
    destinationCapabilities: input.graph.capabilityNodes.map((node, index) => ({
      capabilityId: node.id,
      name: node.name,
      state: activeStates[index].state,
    })),
    gapCapabilityIds: input.gaps.map((gap) => gap.capabilityId),
    skillsAcquired: activeStates
      .filter((state) => state.state === "verified")
      .map((state) => capabilityName.get(state.capabilityId) ?? state.capabilityId),
    skillsInProgress: activeStates
      .filter((state) => state.state === "developing")
      .map((state) => capabilityName.get(state.capabilityId) ?? state.capabilityId),
    remainingGaps: input.gaps.map(
      (gap) => `${capabilityName.get(gap.capabilityId)} (${gap.priority} priority)`
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
    nextSteps: uniqueCurrentPlanActions(input)
      .slice(0, 5)
      .map((action) => `${action.title}: ${action.whyNow}`),
  };
}

export function buildProgressReportFromState(
  input: ProgressReportInput,
  narrativeSummary: string
): ProgressReport {
  return {
    generatedAt: new Date().toISOString(),
    narrativeSummary,
    ...buildProgressReportFacts(input),
  };
}
