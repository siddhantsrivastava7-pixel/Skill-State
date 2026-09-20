import { beforeEach, describe, expect, it } from "vitest";
import { careerKnowledgeToDestinationGraph } from "@/data/knowledge/adapter";
import { reconcileGeneratedDestinationGraph } from "@/data/knowledge/capability-reconciler";
import { careerRepository, resourceRepository } from "@/data/knowledge/repositories";
import { personaBGraph } from "@/data/demo";
import { meaningfulRecentActivities } from "@/components/home/RecentActivityStrip";
import { addLimitedSelection, toggleLimitedSelection } from "@/domain/limited-selection";
import type { DestinationGraph, VerificationResult, VerificationSubmission } from "@/domain/types";
import { LearnerStateSnapshotSchema } from "@/persistence/schema";
import { learnerSnapshotFromState, useSkillStateStore } from "@/store/useSkillStateStore";

function sharedGraph(id: string) {
  const career = careerRepository.getByIdSync(id);
  if (!career) throw new Error(`Missing career ${id}`);
  return careerKnowledgeToDestinationGraph(career);
}

describe("consolidated production bug fixes", () => {
  beforeEach(() => {
    useSkillStateStore.getState().clearForAuthChange();
    useSkillStateStore.getState().loadPersona("persona-b");
  });

  it("keeps assessment evidence and evaluator result after navigation-style cleanup and hydration", () => {
    const capabilityId = personaBGraph.capabilityNodes[0].id;
    const submission: VerificationSubmission = {
      taskId: "durable-task",
      capabilityId,
      userResponse: "A complete response with explicit validation and trade-offs.",
      taskPrompt: "Demonstrate the capability.",
      rubric: "Explain method, validation, and limitations.",
    };
    const result: VerificationResult = {
      taskId: submission.taskId,
      capabilityId,
      passed: false,
      signal: "supports",
      strength: "medium",
      proposedState: "developing",
      explanation: "Good focused evidence, but broader capability coverage is still needed.",
      planImpact: "Add broader proof.",
      evidenceSignal: {
        capabilityId,
        signal: "supports",
        strength: "medium",
        explanation: "The response supports part of the capability.",
      },
    };

    useSkillStateStore.getState().recordVerificationResult(result, submission);
    useSkillStateStore.getState().clearLastTransition();
    const snapshot = LearnerStateSnapshotSchema.parse(
      learnerSnapshotFromState(useSkillStateStore.getState())
    );
    const assessment = snapshot.evidence.find((item) => item.assessment);
    expect(assessment?.assessment?.evaluatorNote).toBe(result.explanation);

    useSkillStateStore.getState().hydrateRemoteState(snapshot.profile.id, snapshot, 2);
    expect(useSkillStateStore.getState().verifiedStates[capabilityId].state).toBe("developing");
    expect(useSkillStateStore.getState().evidence.find((item) => item.assessment)?.assessment?.taskId)
      .toBe("durable-task");
  });

  it("switches AI Engineer to Software Engineer and back without losing evidence", () => {
    const initial = useSkillStateStore.getState();
    const initialGraph = initial.destinationGraph;
    const initialEvidenceIds = initial.evidence.map((item) => item.id);
    const software = sharedGraph("software-engineer");
    useSkillStateStore.getState().changeDestination(software.destinationName, software);
    const cachedAI = useSkillStateStore.getState().destinationCatalog[initialGraph.destinationId];
    expect(cachedAI).toBeDefined();
    useSkillStateStore.getState().changeDestination(cachedAI.destinationName, cachedAI);

    const state = useSkillStateStore.getState();
    expect(state.destinationGraph.destinationId).toBe(initialGraph.destinationId);
    expect(state.evidence.map((item) => item.id)).toEqual(initialEvidenceIds);
  });

  it("recovers a generated destination after a seeded switch without recompiling it", () => {
    const generated: DestinationGraph = {
      ...personaBGraph,
      destinationId: "generated-ocean-ai",
      destinationName: "Ocean AI Specialist",
      confidence: "medium",
    };
    useSkillStateStore.getState().changeDestination(generated.destinationName, generated);
    useSkillStateStore.getState().changeDestination("Software Engineer", sharedGraph("software-engineer"));
    const recovered = useSkillStateStore.getState().destinationCatalog[generated.destinationId];
    expect(recovered).toEqual(generated);
    useSkillStateStore.getState().changeDestination(recovered.destinationName, recovered);
    expect(useSkillStateStore.getState().destinationGraph).toEqual(generated);
  });

  it("persists a profile edit while preserving evidence", () => {
    const before = useSkillStateStore.getState();
    const evidenceIds = before.evidence.map((item) => item.id);
    before.setProfile({ ...before.profile, weeklyHours: 15 });
    const snapshot = LearnerStateSnapshotSchema.parse(
      learnerSnapshotFromState(useSkillStateStore.getState())
    );
    useSkillStateStore.getState().hydrateRemoteState(snapshot.profile.id, snapshot, 3);
    expect(useSkillStateStore.getState().profile.weeklyHours).toBe(15);
    expect(useSkillStateStore.getState().evidence.map((item) => item.id)).toEqual(evidenceIds);
  });

  it("reconciles known exploring foundations to resource-bearing canonical IDs", () => {
    const generated: DestinationGraph = {
      destinationId: "exploring-oceanography-ai",
      destinationName: "Exploring oceanography and AI",
      summary: "Shared foundations",
      confidence: "medium",
      capabilityNodes: [
        {
          id: "generated-user-empathy",
          name: "User Research and Empathy",
          family: "research",
          description: "Use user empathy and research to understand human needs and frame problems.",
          importance: "core",
          stageExpected: "foundation",
          prerequisites: [],
          unlocks: [],
        },
        {
          id: "generated-ai-literacy",
          name: "AI Literacy and Model Behavior",
          family: "ai",
          description: "Evaluate model behavior, outputs, quality, and limitations.",
          importance: "core",
          stageExpected: "foundation",
          prerequisites: [],
          unlocks: [],
        },
      ],
      proofExpectations: [],
      experienceExpectations: [],
      adjacentDestinations: [],
      sharedFoundationNodeIds: ["generated-user-empathy", "generated-ai-literacy"],
    };
    const reconciled = reconcileGeneratedDestinationGraph(generated).graph;
    const ids = reconciled.capabilityNodes.map((node) => node.id);
    expect(ids).toEqual(expect.arrayContaining(["human-centered-design", "model-evaluation"]));
    expect(resourceRepository.matchCapabilityIdsSync(ids).length).toBeGreaterThan(0);
  });

  it("keeps onboarding selections visible, unique, removable, and capped at five", () => {
    let selected = addLimitedSelection([], "Python");
    selected = addLimitedSelection(selected, "Statistics");
    selected = addLimitedSelection(selected, "SQL");
    selected = addLimitedSelection(selected, "SQL");
    expect(selected).toEqual(["Python", "Statistics", "SQL"]);
    selected = toggleLimitedSelection(selected, "Statistics");
    expect(selected).toEqual(["Python", "SQL"]);
    selected = ["A", "B", "C", "D", "E"];
    expect(addLimitedSelection(selected, "F")).toEqual(selected);
  });

  it("filters initialization noise from Recent Activity", () => {
    const activities = useSkillStateStore.getState().activityLedger;
    expect(meaningfulRecentActivities(activities).some((item) =>
      item.title.startsWith("Journey created for")
    )).toBe(false);
  });
});
