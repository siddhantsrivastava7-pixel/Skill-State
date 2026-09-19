import type { AIProvider } from "@/agent/provider";
import type { ActionItem, AdaptivePlan, BuildPlanInput } from "./types";

export function buildDeterministicDestinationPlan(
  input: BuildPlanInput
): AdaptivePlan {
  const repairActions: ActionItem[] = input.gaps.map((gap, index) => {
    const node = input.graph.capabilityNodes.find((item) => item.id === gap.capabilityId);
    const name = node?.name ?? gap.capabilityId;
    const needsProof = gap.gapType === "knowledge-no-proof";
    return {
      id: `switch-${input.graph.destinationId}-${gap.capabilityId}`,
      category: needsProof ? "prove" : "learn",
      title: `${needsProof ? "Prove" : "Strengthen"} ${name}`,
      description: gap.reason,
      whyNow: `${name} is a ${gap.priority} active requirement for ${input.graph.destinationName}.`,
      estimatedMinutes: index < 3 ? 90 : 120,
      capabilityIds: [gap.capabilityId],
      status: "todo",
    };
  });

  const activeGapIds = new Set(input.gaps.map((gap) => gap.capabilityId));
  const proofCapabilityIds = Array.from(new Set(
    input.graph.proofExpectations
      .map((proof) => proof.capabilityId)
      .filter((capabilityId) => activeGapIds.has(capabilityId))
  ));
  const proofAction: ActionItem[] = proofCapabilityIds.length > 1
    ? [{
        id: `switch-${input.graph.destinationId}-integrated-proof`,
        category: "build",
        title: `Build one end-to-end ${input.graph.destinationName} proof project`,
        description: input.graph.proofExpectations
          .filter((proof) => proofCapabilityIds.includes(proof.capabilityId))
          .map((proof) => proof.description)
          .join(" "),
        whyNow: `One integrated artifact can prove ${proofCapabilityIds.length} active ${input.graph.destinationName} requirements without duplicating work.`,
        estimatedMinutes: 480,
        capabilityIds: proofCapabilityIds,
        status: "todo",
      }]
    : [];
  const scheduledActions = [...repairActions, ...proofAction];

  const weeks = Array.from({
    length: Math.min(4, Math.max(1, Math.ceil(scheduledActions.length / 3))),
  }, (_, index) => {
    const weekActions = scheduledActions.slice(index * 3, index * 3 + 3);
    return {
      weekIndex: index + 1,
      objectives: weekActions.map((action) => action.title),
      actions: weekActions,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    summary: `Deterministic baseline plan for ${input.graph.destinationName}, prioritized from preserved evidence and active gaps.`,
    now: repairActions.slice(0, 3),
    weeks,
    milestones: input.graph.proofExpectations.slice(0, 3).map((proof, index) => ({
      id: `switch-milestone-${input.graph.destinationId}-${index + 1}`,
      title: proof.description,
      targetMonth: (index + 1) * 2,
      evidenceNeeded: [proof.capabilityId],
    })),
  };
}

export async function planDestinationSwitch(
  input: BuildPlanInput,
  knownCareer: boolean,
  provider: Pick<AIProvider, "buildPlan">
): Promise<AdaptivePlan> {
  if (knownCareer) return buildDeterministicDestinationPlan(input);
  return provider.buildPlan(input);
}
