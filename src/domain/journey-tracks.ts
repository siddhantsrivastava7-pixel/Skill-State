import {
  ActionCategory,
  ActionItem,
  AdaptivePlan,
  DestinationGraph,
} from "./types";

export type JourneyTrack = "learn" | "prove" | "build" | "experience" | "signal";

export interface JourneyActionItem extends ActionItem {
  track: JourneyTrack;
  phaseIndex: number;
  phaseLabel: string;
  timingRange: string;
  whenItBelongs: string;
  whyItBelongs: string;
  scheduledWeek: number;
}

export interface JourneyPhaseGroup {
  phaseIndex: number;
  phaseLabel: string;
  timingRange: string;
  description: string;
  actions: JourneyActionItem[];
}

export const TRACK_METADATA: Record<
  JourneyTrack,
  {
    label: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  learn: {
    label: "Learn",
    description: "Foundations, concept refreshers, and theoretical repair drills.",
    color: "text-brandBlue",
    bgColor: "bg-brandBlue-soft/60",
    borderColor: "border-brandBlue/30",
  },
  prove: {
    label: "Prove",
    description: "Rigorous verification tasks, scenario checks, and benchmark challenges.",
    color: "text-accent",
    bgColor: "bg-accent-soft/60",
    borderColor: "border-accent/30",
  },
  build: {
    label: "Build",
    description: "Standalone portfolio work and reviewable, reproducible deliverables.",
    color: "text-brandOrange",
    bgColor: "bg-brandOrange-soft/60",
    borderColor: "border-brandOrange/30",
  },
  experience: {
    label: "Experience",
    description: "Collaborative sprints, open-source work, and simulated internships.",
    color: "text-brandGreen",
    bgColor: "bg-brandGreen-soft/60",
    borderColor: "border-brandGreen/30",
  },
  signal: {
    label: "Signal",
    description: "Artifact presentation, portfolio proof, and external credibility signals.",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
};

/**
 * Organizes plan actions into a coherent multi-period journey across 5 tracks:
 * Learn → Prove → Build → Experience → Signal
 * Annotates each action with explicit "When it belongs" and "Why it belongs" context.
 */
export function organizePlanIntoJourneyTracks(
  plan: AdaptivePlan,
  graph: DestinationGraph
): JourneyPhaseGroup[] {
  // Collect plan actions with their actual scheduled week. `now` is week 1;
  // explicit plan weeks remain authoritative for later actions.
  const allActions: ActionItem[] = [...plan.now];
  const scheduledWeekByActionId = new Map<string, number>();
  plan.now.forEach((action) => scheduledWeekByActionId.set(action.id, 1));

  for (const week of plan.weeks) {
    for (const act of week.actions) {
      const currentWeek = scheduledWeekByActionId.get(act.id);
      scheduledWeekByActionId.set(
        act.id,
        currentWeek === undefined ? week.weekIndex : Math.min(currentWeek, week.weekIndex)
      );
      if (!allActions.some((a) => a.id === act.id)) {
        allActions.push(act);
      }
    }
  }

  const latestScheduledWeek = Math.max(
    1,
    ...Array.from(scheduledWeekByActionId.values())
  );

  // Synthesize experiential and signal actions if not explicitly seeded
  if (!allActions.some((a) => a.category === "experience")) {
    const primaryExp = graph.experienceExpectations[0];
    const syntheticExperience = {
      id: `act-synth-exp-${graph.destinationId}`,
      category: "experience",
      title: primaryExp ? primaryExp.title : `${graph.destinationName} Team Project Sprint`,
      description: primaryExp
        ? primaryExp.description
        : "Collaborate in a simulated team project with shared review and clear responsibilities.",
      whyNow: "Builds cross-functional collaboration and applied judgment beyond solo practice.",
      estimatedMinutes: 480,
      capabilityIds: graph.capabilityNodes.slice(0, 3).map((n) => n.id),
      status: "todo",
    } satisfies ActionItem;
    allActions.push(syntheticExperience);
    scheduledWeekByActionId.set(syntheticExperience.id, latestScheduledWeek + 1);
  }

  if (!allActions.some((a) => a.category === "signal")) {
    const syntheticSignal = {
      id: `act-synth-signal-${graph.destinationId}`,
      category: "signal",
      title: "Verified Capability Portfolio & Evidence Summary",
      description: `Package evidence artifacts, results, and methodology summaries for ${graph.destinationName}.`,
      whyNow: "Converts verified internal capability states into visible proof for external reviewers.",
      estimatedMinutes: 180,
      capabilityIds: graph.capabilityNodes.slice(0, 2).map((n) => n.id),
      status: "todo",
    } satisfies ActionItem;
    allActions.push(syntheticSignal);
    scheduledWeekByActionId.set(syntheticSignal.id, latestScheduledWeek + 2);
  }

  // Map each action to a JourneyActionItem with timing and structural rationale
  const journeyActions: JourneyActionItem[] = allActions.map((action) => {
    const track = (action.category as JourneyTrack) || "learn";
    const scheduledWeek = scheduledWeekByActionId.get(action.id) ?? 1;
    let phaseIndex = 1;
    let phaseLabel = "Phase 1: Foundations & Immediate Repairs";
    const timingRange = scheduledWeek === 1 ? "Now / Week 1" : `Week ${scheduledWeek}`;
    let whenItBelongs = "";
    let whyItBelongs = "";

    switch (track) {
      case "learn":
        phaseIndex = 1;
        phaseLabel = "Phase 1: Foundations & Immediate Repairs";
        whenItBelongs = "Belongs early before attempting complex application or verification.";
        whyItBelongs =
          action.whyNow ||
          "Removes conceptual blockers and foundational gaps before applied work begins.";
        break;

      case "prove":
        phaseIndex = 1;
        phaseLabel = "Phase 1: Foundations & Immediate Repairs";
        whenItBelongs = "Belongs immediately after learning to validate claimed understanding.";
        whyItBelongs =
          action.whyNow ||
          "Elevates self-reported working knowledge into verified capability states with proof.";
        break;

      case "build":
        phaseIndex = 2;
        phaseLabel = "Phase 2: Core Proof & Production Deliverables";
        whenItBelongs = "Belongs in the core development phase after prerequisites are verified.";
        whyItBelongs =
          action.whyNow ||
          "Creates permanent, reviewable artifacts proving practical competence under realistic constraints.";
        break;

      case "experience":
        phaseIndex = 3;
        phaseLabel = "Phase 3: Applied Experience & Team Collaboration";
        whenItBelongs = "Belongs in mid-journey once standalone portfolio pieces are completed.";
        whyItBelongs =
          action.whyNow ||
          "Exposes you to realistic ambiguity, teamwork, and stakeholder constraints.";
        break;

      case "signal":
        phaseIndex = 4;
        phaseLabel = "Phase 4: Target Destination Readiness & External Signals";
        whenItBelongs = "Belongs near journey completion when full proof is ready for public evaluation.";
        whyItBelongs =
          action.whyNow ||
          "Communicates verified capabilities to external evaluators and hiring teams.";
        break;
    }

    return {
      ...action,
      track,
      phaseIndex,
      phaseLabel,
      timingRange,
      whenItBelongs,
      whyItBelongs,
      scheduledWeek,
    };
  });

  // Group by Phase
  const phasesMap = new Map<number, JourneyPhaseGroup>();

  const defaultPhases: Array<{ index: number; label: string; desc: string }> = [
    {
      index: 1,
      label: "Phase 1: Foundations & Immediate Repairs",
      desc: "Refresh foundations, address identified gaps, and verify core capability claims.",
    },
    {
      index: 2,
      label: "Phase 2: Core Proof & Production Deliverables",
      desc: "Build applied work and verifiable portfolio deliverables.",
    },
    {
      index: 3,
      label: "Phase 3: Applied Experience & Collaboration",
      desc: "Participate in simulated applied experiences and collaborative work.",
    },
    {
      index: 4,
      label: "Phase 4: Target Destination Readiness & External Signals",
      desc: "Compile final verified artifacts, refine external signals, and prepare for career transition.",
    },
  ];

  for (const dp of defaultPhases) {
    phasesMap.set(dp.index, {
      phaseIndex: dp.index,
      phaseLabel: dp.label,
      timingRange: "",
      description: dp.desc,
      actions: [],
    });
  }

  for (const jAction of journeyActions) {
    const group = phasesMap.get(jAction.phaseIndex);
    if (group) {
      group.actions.push(jAction);
    }
  }

  return Array.from(phasesMap.values())
    .filter((phase) => phase.actions.length > 0)
    .map((phase) => {
      const weeks = phase.actions.map((action) => action.scheduledWeek);
      const start = Math.min(...weeks);
      const end = Math.max(...weeks);
      return {
        ...phase,
        timingRange:
          start === end
            ? start === 1 ? "Now / Week 1" : `Week ${start}`
            : `${start === 1 ? "Now / Week 1" : `Week ${start}`} – Week ${end}`,
      };
    });
}
