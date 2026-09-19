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
    description: "Standalone portfolio deliverables, APIs, and reproducible models.",
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
  // Collect all actions from plan.now and plan.weeks
  const allActions: ActionItem[] = [...plan.now];

  for (const week of plan.weeks) {
    for (const act of week.actions) {
      if (!allActions.some((a) => a.id === act.id)) {
        allActions.push(act);
      }
    }
  }

  // Synthesize experiential and signal actions if not explicitly seeded
  if (!allActions.some((a) => a.category === "experience")) {
    const primaryExp = graph.experienceExpectations[0];
    allActions.push({
      id: `act-synth-exp-${graph.destinationId}`,
      category: "experience",
      title: primaryExp ? primaryExp.title : `${graph.destinationName} Team Project Sprint`,
      description: primaryExp
        ? primaryExp.description
        : "Collaborate in a simulated team sprint adhering to code review and issue tracking.",
      whyNow: "Builds cross-functional collaboration and edge-case resilience beyond solo code.",
      estimatedMinutes: 480,
      capabilityIds: graph.capabilityNodes.slice(0, 3).map((n) => n.id),
      status: "todo",
    });
  }

  if (!allActions.some((a) => a.category === "signal")) {
    allActions.push({
      id: `act-synth-signal-${graph.destinationId}`,
      category: "signal",
      title: "Verified Capability Portfolio & Technical Write-up",
      description: `Package evidence artifacts, benchmark results, and methodology summaries for ${graph.destinationName}.`,
      whyNow: "Converts verified internal capability states into visible proof for hiring teams.",
      estimatedMinutes: 180,
      capabilityIds: graph.capabilityNodes.slice(0, 2).map((n) => n.id),
      status: "todo",
    });
  }

  // Map each action to a JourneyActionItem with timing and structural rationale
  const journeyActions: JourneyActionItem[] = allActions.map((action, idx) => {
    const track = (action.category as JourneyTrack) || "learn";
    let phaseIndex = 1;
    let phaseLabel = "Phase 1: Foundations & Immediate Repairs";
    let timingRange = "Now – Month 2";
    let whenItBelongs = "";
    let whyItBelongs = "";

    switch (track) {
      case "learn":
        phaseIndex = 1;
        phaseLabel = "Phase 1: Foundations & Immediate Repairs";
        timingRange = "Weeks 1–4";
        whenItBelongs = "Belongs early before attempting complex implementation or verification.";
        whyItBelongs =
          action.whyNow ||
          "Removes conceptual blockers and theoretical gaps so downstream code runs reliably.";
        break;

      case "prove":
        phaseIndex = 1;
        phaseLabel = "Phase 1: Foundations & Immediate Repairs";
        timingRange = "Weeks 2–6";
        whenItBelongs = "Belongs immediately after learning to validate claimed understanding.";
        whyItBelongs =
          action.whyNow ||
          "Elevates self-reported working knowledge into verified capability states with proof.";
        break;

      case "build":
        phaseIndex = 2;
        phaseLabel = "Phase 2: Core Proof & Production Deliverables";
        timingRange = "Months 2–5";
        whenItBelongs = "Belongs in the core development phase after prerequisites are verified.";
        whyItBelongs =
          action.whyNow ||
          "Creates permanent demonstrable artifacts proving practical competence under production constraints.";
        break;

      case "experience":
        phaseIndex = 3;
        phaseLabel = "Phase 3: Applied Experience & Team Collaboration";
        timingRange = "Months 5–8";
        whenItBelongs = "Belongs in mid-journey once standalone portfolio pieces are completed.";
        whyItBelongs =
          action.whyNow ||
          "Exposes you to realistic codebase ambiguity, teamwork, and client/user constraints.";
        break;

      case "signal":
        phaseIndex = 4;
        phaseLabel = "Phase 4: Target Destination Readiness & External Signals";
        timingRange = "Months 8+";
        whenItBelongs = "Belongs near journey completion when full proof is ready for public evaluation.";
        whyItBelongs =
          action.whyNow ||
          "Broadcasts verified capabilities to industry evaluators and hiring managers.";
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
    };
  });

  // Group by Phase
  const phasesMap = new Map<number, JourneyPhaseGroup>();

  const defaultPhases: Array<{ index: number; label: string; range: string; desc: string }> = [
    {
      index: 1,
      label: "Phase 1: Foundations & Immediate Repairs",
      range: "Now – Month 2",
      desc: "Refresh fundamentals, patch identified gaps, and verify core technical claims.",
    },
    {
      index: 2,
      label: "Phase 2: Core Proof & Production Deliverables",
      range: "Months 2–5",
      desc: "Build deployable systems, dynamic models, and verifiable portfolio deliverables.",
    },
    {
      index: 3,
      label: "Phase 3: Applied Experience & Collaboration",
      range: "Months 5–8",
      desc: "Participate in simulated internships, team hackathons, and open-source contributions.",
    },
    {
      index: 4,
      label: "Phase 4: Target Destination Readiness & External Signals",
      range: "Months 8+",
      desc: "Compile final verified artifacts, refine technical signals, and prepare for career transition.",
    },
  ];

  for (const dp of defaultPhases) {
    phasesMap.set(dp.index, {
      phaseIndex: dp.index,
      phaseLabel: dp.label,
      timingRange: dp.range,
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

  return Array.from(phasesMap.values()).filter((p) => p.actions.length > 0);
}
