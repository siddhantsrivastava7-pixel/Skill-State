import { ActionItem, AdaptivePlan, DestinationGraph, PlanMilestone } from "./types";

export interface PlanImpactResult {
  affectedNowActions: ActionItem[];
  affectedWeekActions: {
    weekIndex: number;
    actions: ActionItem[];
  }[];
  affectedMilestones: PlanMilestone[];
  affectedCapabilityIds: string[];
  summary: string;
  isPlanChanged: boolean;
}

/**
 * Deterministically calculates which plan items and milestones are affected
 * by changes to one or more capabilities (e.g. after assessment, verification, or claim update).
 */
export function calculateAffectedPlanItems(
  changedCapabilityIds: string[],
  plan: AdaptivePlan,
  graph: DestinationGraph
): PlanImpactResult {
  if (!changedCapabilityIds.length) {
    return {
      affectedNowActions: [],
      affectedWeekActions: [],
      affectedMilestones: [],
      affectedCapabilityIds: [],
      summary: "No capabilities changed; plan remains unchanged.",
      isPlanChanged: false,
    };
  }

  const changedSet = new Set(changedCapabilityIds);

  // Also include directly unlocked capabilities
  for (const capId of changedCapabilityIds) {
    const node = graph.capabilityNodes.find((n) => n.id === capId);
    if (node) {
      for (const unlocked of node.unlocks) {
        changedSet.add(unlocked);
      }
    }
  }

  const affectedNowActions = plan.now.filter((action) =>
    action.capabilityIds.some((id) => changedSet.has(id))
  );

  const affectedWeekActions: { weekIndex: number; actions: ActionItem[] }[] = [];
  for (const week of plan.weeks) {
    const matching = week.actions.filter((action) =>
      action.capabilityIds.some((id) => changedSet.has(id))
    );
    if (matching.length > 0) {
      affectedWeekActions.push({
        weekIndex: week.weekIndex,
        actions: matching,
      });
    }
  }

  const affectedMilestones = plan.milestones.filter((milestone) =>
    milestone.evidenceNeeded.some((id) => changedSet.has(id))
  );

  const totalAffectedActions =
    affectedNowActions.length +
    affectedWeekActions.reduce((acc, w) => acc + w.actions.length, 0);

  const isPlanChanged = totalAffectedActions > 0 || affectedMilestones.length > 0;

  const names = changedCapabilityIds
    .map((id) => graph.capabilityNodes.find((n) => n.id === id)?.name ?? id)
    .join(", ");

  const summary = isPlanChanged
    ? `Updates to ${names} impacted ${affectedNowActions.length} immediate action(s), ${totalAffectedActions} total action(s), and ${affectedMilestones.length} milestone(s).`
    : `No active plan items directly depended on ${names}.`;

  return {
    affectedNowActions,
    affectedWeekActions,
    affectedMilestones,
    affectedCapabilityIds: Array.from(changedSet),
    summary,
    isPlanChanged,
  };
}
