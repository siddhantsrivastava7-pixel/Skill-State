import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdaptivePlan, BuildPlanInput, DestinationGraph, LearnerProfile } from "@/domain/types";
import { reconcileGeneratedDestinationGraph } from "@/data/knowledge/capability-reconciler";
import { resourcesForCapability } from "@/data/library/resources-library";
import { careerKnowledgeToDestinationGraph } from "@/data/knowledge/adapter";
import { careerRepository } from "@/data/knowledge/repositories";
import { resolveDestination } from "@/data/knowledge/resolution";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import { resolveHomeGoalLabel } from "@/domain/display";
import {
  matchProjectsToGaps,
  mergeDuplicateProjects,
  type ProofProjectRecommendation,
} from "@/data/library/projects-library";
import {
  buildDeterministicDestinationPlan,
  planDestinationSwitch,
} from "@/domain/destination-planning";
import { organizePlanIntoJourneyTracks } from "@/domain/journey-tracks";
import { getLocalGreeting } from "@/components/journey/JourneyHero";
import { ASSESS_INTRO_COPY } from "@/domain/copy";

const emptyPlan: AdaptivePlan = {
  generatedAt: "2026-09-19T00:00:00.000Z",
  summary: "Test plan",
  now: [],
  weeks: [],
  milestones: [],
};

const profile: LearnerProfile = {
  id: "acceptance-learner",
  name: "Yana",
  stage: "college",
  stageDetail: "Year 2 Undergraduate",
  fieldOfStudy: "Psychology",
  weeklyHours: 10,
  targetTimelineMonths: 12,
  learningPreference: "balanced",
  destinationCertainty: "exact",
  statedDestination: "UX Researcher",
  interests: ["research"],
};

function sharedGraph(id: string): DestinationGraph {
  const career = careerRepository.getByIdSync(id);
  if (!career) throw new Error(`Missing test career: ${id}`);
  return careerKnowledgeToDestinationGraph(career);
}

function generatedComputationalLinguistGraph(): DestinationGraph {
  return {
    destinationId: "computational-linguist",
    destinationName: "Computational Linguist",
    summary: "Uses computation to analyze language.",
    confidence: "high",
    capabilityNodes: [
      {
        id: "programming-foundations",
        name: "Programming Foundations",
        family: "Computing",
        description: "Write readable Python programs and scripts using core language features and modules.",
        importance: "core",
        stageExpected: "foundation",
        prerequisites: [],
        unlocks: ["linguistics-foundations"],
      },
      {
        id: "python-basics",
        name: "Python Basics",
        family: "Computing",
        description: "Use Python code, modules, and scripts for reproducible language analysis.",
        importance: "important",
        stageExpected: "developing",
        prerequisites: [],
        unlocks: [],
      },
      {
        id: "linguistics-foundations",
        name: "Linguistics Foundations",
        family: "Linguistics",
        description: "Reason about syntax, morphology, phonology, and linguistic structure.",
        importance: "core",
        stageExpected: "foundation",
        prerequisites: ["programming-foundations"],
        unlocks: [],
      },
    ],
    proofExpectations: [
      {
        id: "proof-python-text",
        capabilityId: "programming-foundations",
        description: "Build a Python text-processing script.",
        level: "working",
      },
      {
        id: "proof-linguistics",
        capabilityId: "linguistics-foundations",
        description: "Produce a linguistic analysis.",
        level: "working",
      },
    ],
    experienceExpectations: [],
    adjacentDestinations: [],
    sharedFoundationNodeIds: ["programming-foundations", "linguistics-foundations"],
  };
}

function recordWeakHcdAssessment() {
  const capabilityId = "human-centered-design";
  useSkillStateStore.getState().recordVerificationResult({
    taskId: "hcd-assessment",
    capabilityId,
    passed: false,
    signal: "weakens",
    strength: "medium",
    proposedState: "gap",
    explanation: "The response did not demonstrate a human-centered process.",
    planImpact: "HCD remains an active repair requirement.",
    evidenceSignal: {
      capabilityId,
      signal: "weakens",
      strength: "medium",
      explanation: "Weak evaluated response.",
    },
  });
}

function project(overrides: Partial<ProofProjectRecommendation>): ProofProjectRecommendation {
  return {
    id: "project-a",
    title: "Start one end-to-end redesign project",
    tagline: "Create one coherent redesign artifact.",
    destinationFamily: "Product Designer",
    targetCapabilityIds: ["human-centered-design"],
    targetCapabilityNames: ["Human-Centered Design"],
    proofLevel: "working",
    whyThisProject: "Creates reviewable evidence.",
    deliverables: ["Research brief"],
    verificationCriteria: ["Uses user evidence"],
    estimatedHours: 20,
    ...overrides,
  };
}

describe("acceptance repair regressions", () => {
  beforeEach(() => {
    useSkillStateStore.getState().resetStore();
    useSkillStateStore.getState().initializeJourney(profile, sharedGraph("ux-researcher"), [], emptyPlan);
  });

  it("reuses a canonical ID for a semantically equivalent generated capability", () => {
    const result = reconcileGeneratedDestinationGraph(generatedComputationalLinguistGraph());
    expect(result.graph.capabilityNodes.map((node) => node.id)).toContain("programming-python");
    expect(result.mappings.some((item) => item.generatedId === "programming-foundations" && item.canonicalId === "programming-python")).toBe(true);
  });

  it("does not create a duplicate when two generated capabilities reconcile to one canonical identity", () => {
    const result = reconcileGeneratedDestinationGraph(generatedComputationalLinguistGraph());
    expect(result.graph.capabilityNodes.filter((node) => node.id === "programming-python")).toHaveLength(1);
  });

  it("preserves a genuinely novel linguistics capability", () => {
    const result = reconcileGeneratedDestinationGraph(generatedComputationalLinguistGraph());
    expect(result.graph.capabilityNodes.map((node) => node.id)).toContain("linguistics-foundations");
    expect(result.novelCapabilityIds).toContain("linguistics-foundations");
  });

  it("does not fabricate resources for a genuinely novel capability", () => {
    const result = reconcileGeneratedDestinationGraph(generatedComputationalLinguistGraph());
    expect(resourcesForCapability("linguistics-foundations")).toEqual([]);
    expect(result.novelCapabilityIds).toContain("linguistics-foundations");
  });

  it("returns existing resources for a canonicalized generated capability", () => {
    const result = reconcileGeneratedDestinationGraph(generatedComputationalLinguistGraph());
    const programmingId = result.graph.capabilityNodes.find((node) => node.name === "Python Programming")?.id;
    expect(programmingId).toBe("programming-python");
    expect(resourcesForCapability(programmingId ?? "").length).toBeGreaterThan(0);
  });

  it("preserves assessment evidence across UX Researcher to Product Designer", () => {
    recordWeakHcdAssessment();
    const evidence = useSkillStateStore.getState().evidence;
    useSkillStateStore.getState().changeDestination("Product Designer", sharedGraph("product-designer"));
    expect(useSkillStateStore.getState().evidence).toEqual(evidence);
  });

  it("preserves transition history but clears the active old transition panel state", () => {
    recordWeakHcdAssessment();
    const ledgerCount = useSkillStateStore.getState().activityLedger.length;
    expect(useSkillStateStore.getState().lastTransitionResult).toBeDefined();
    useSkillStateStore.getState().changeDestination("Product Designer", sharedGraph("product-designer"));
    expect(useSkillStateStore.getState().lastTransitionResult).toBeUndefined();
    expect(useSkillStateStore.getState().activityLedger.length).toBe(ledgerCount + 1);
  });

  it("keeps a failed shared assessment evidence-aware after destination switching", () => {
    recordWeakHcdAssessment();
    expect(useSkillStateStore.getState().verifiedStates["human-centered-design"].state).toBe("gap");
    useSkillStateStore.getState().changeDestination("Product Designer", sharedGraph("product-designer"));
    expect(useSkillStateStore.getState().verifiedStates["human-centered-design"].state).toBe("gap");
    expect(useSkillStateStore.getState().verifiedStates["human-centered-design"].state).not.toBe("needs-proof");
  });

  it("uses Product Designer as the Home title after the first switch", () => {
    useSkillStateStore.getState().changeDestination("Product Designer", sharedGraph("product-designer"));
    const state = useSkillStateStore.getState();
    expect(resolveHomeGoalLabel(state.destination, state.profile)).toBe("Product Designer");
  });

  it("uses Computational Linguist as the Home title after a second switch", () => {
    useSkillStateStore.getState().changeDestination("Product Designer", sharedGraph("product-designer"));
    const generated = reconcileGeneratedDestinationGraph(generatedComputationalLinguistGraph()).graph;
    useSkillStateStore.getState().changeDestination("Computational Linguist", generated);
    const state = useSkillStateStore.getState();
    expect(resolveHomeGoalLabel(state.destination, state.profile)).toBe("Computational Linguist");
  });

  it("merges duplicate proof project candidates", () => {
    const merged = mergeDuplicateProjects([
      project({}),
      project({ id: "project-b", title: "Build an end-to-end redesign project" }),
    ]);
    expect(merged).toHaveLength(1);
  });

  it("unions target capabilities on a merged proof project", () => {
    const merged = mergeDuplicateProjects([
      project({}),
      project({
        id: "project-b",
        title: "Build an end-to-end redesign project",
        targetCapabilityIds: ["interaction-design"],
        targetCapabilityNames: ["Interaction Design"],
      }),
    ]);
    expect(merged[0].targetCapabilityIds).toEqual(["human-centered-design", "interaction-design"]);
  });

  it("keeps genuinely distinct projects separate", () => {
    const merged = mergeDuplicateProjects([
      project({}),
      project({ id: "corpus", title: "Corpus annotation project" }),
    ]);
    expect(merged).toHaveLength(2);
  });

  it("preserves all verification criteria while reducing recommendation count", () => {
    const merged = mergeDuplicateProjects([
      project({ verificationCriteria: ["Uses user evidence"] }),
      project({
        id: "project-b",
        title: "Build an end-to-end redesign project",
        verificationCriteria: ["Includes an interactive prototype"],
      }),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].verificationCriteria).toEqual([
      "Uses user evidence",
      "Includes an interactive prototype",
    ]);
  });

  it("recommends one multi-capability proof project for Product Designer", () => {
    const graph = sharedGraph("product-designer");
    useSkillStateStore.getState().changeDestination(graph.destinationName, graph);
    const state = useSkillStateStore.getState();
    const plan = buildDeterministicDestinationPlan({
      profile: state.profile,
      graph,
      verifiedStates: state.verifiedStates,
      claimedStates: state.claimedStates,
      gaps: state.gaps,
      planningReason: "full-what-if",
    });
    const projects = matchProjectsToGaps(state.gaps, graph, plan);
    expect(projects).toHaveLength(1);
    expect(projects[0].targetCapabilityIds.length).toBeGreaterThan(1);
    expect(projects[0].verificationCriteria).toHaveLength(graph.proofExpectations.length * 2);
  });

  it("does not invoke Destination Compiler for a seeded destination", async () => {
    const compileDestination = vi.fn();
    await resolveDestination({
      stage: "college",
      certainty: "exact",
      statedDestination: "Product Designer",
      interests: [],
    }, { allowCompilation: true, provider: { compileDestination } });
    expect(compileDestination).not.toHaveBeenCalled();
  });

  it("does not invoke AI planning when applying a known seeded destination", async () => {
    const graph = sharedGraph("product-designer");
    const buildPlan = vi.fn();
    const input: BuildPlanInput = {
      profile,
      graph,
      verifiedStates: {},
      claimedStates: {},
      gaps: [],
      planningReason: "full-what-if",
    };
    await planDestinationSwitch(input, true, { buildPlan });
    expect(buildPlan).not.toHaveBeenCalled();
  });

  it("retains AI planning for a genuinely generated destination", async () => {
    const plan = { ...emptyPlan, summary: "AI plan" };
    const buildPlan = vi.fn().mockResolvedValue(plan);
    const input: BuildPlanInput = {
      profile,
      graph: generatedComputationalLinguistGraph(),
      verifiedStates: {},
      claimedStates: {},
      gaps: [],
      planningReason: "full-what-if",
    };
    await expect(planDestinationSwitch(input, false, { buildPlan })).resolves.toBe(plan);
    expect(buildPlan).toHaveBeenCalledTimes(1);
  });

  it("derives phase headers from the actual scheduled action weeks", () => {
    const graph = sharedGraph("product-designer");
    const learn = {
      id: "learn-hcd", category: "learn" as const, title: "Learn HCD", description: "Learn",
      whyNow: "Foundation", estimatedMinutes: 60, capabilityIds: ["human-centered-design"], status: "todo" as const,
    };
    const prove = { ...learn, id: "prove-hcd", category: "prove" as const, title: "Prove HCD" };
    const phases = organizePlanIntoJourneyTracks({
      ...emptyPlan,
      now: [learn],
      weeks: [
        { weekIndex: 1, objectives: [learn.title], actions: [learn] },
        { weekIndex: 3, objectives: [prove.title], actions: [prove] },
      ],
    }, graph);
    const phaseOne = phases.find((phase) => phase.phaseIndex === 1);
    expect(phaseOne?.timingRange).toBe("Now / Week 1 – Week 3");
    expect(phaseOne?.actions.map((action) => action.timingRange)).toEqual(["Now / Week 1", "Week 3"]);
  });

  it("derives morning, afternoon, and evening greetings from browser-local hour", () => {
    expect(getLocalGreeting(9)).toBe("Good morning");
    expect(getLocalGreeting(14)).toBe("Good afternoon");
    expect(getLocalGreeting(20)).toBe("Good evening");
  });

  it("uses fresh-learner Assess copy that does not assume a claim", () => {
    expect(ASSESS_INTRO_COPY).toContain("Establish your current capability level");
    expect(ASSESS_INTRO_COPY.toLowerCase()).not.toContain("claimed capabilities");
  });
});
