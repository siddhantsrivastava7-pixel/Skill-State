import { describe, expect, it, vi } from "vitest";
import type OpenAI from "openai";
import { OpenAIProvider } from "@/agent/openai-provider";
import { deriveVerifiedStates } from "@/domain/evidence-transition";
import { prioritizeGaps } from "@/domain/prioritization";
import type { LearnerProfile } from "@/domain/types";
import { useSkillStateStore } from "@/store/useSkillStateStore";

const meta = {
  confidence: "high" as const,
  evidenceContradictory: false,
  unresolvedMappings: false,
  ambiguous: false,
};

const uxResearcherGraph = {
  destinationId: "ux-researcher",
  destinationName: "UX Researcher",
  summary: "Plan and conduct ethical user research that informs product decisions.",
  confidence: "high" as const,
  capabilityNodes: [
    {
      id: "research-methods",
      name: "Research Methods",
      family: "Research",
      description: "Select qualitative and quantitative methods for product questions.",
      importance: "core" as const,
      stageExpected: "foundation" as const,
      prerequisites: [],
      unlocks: ["study-design"],
    },
    {
      id: "study-design",
      name: "UX Study Design",
      family: "Research",
      description: "Create protocols, sampling plans, and unbiased research instruments.",
      importance: "core" as const,
      stageExpected: "developing" as const,
      prerequisites: ["research-methods"],
      unlocks: [],
    },
  ],
  proofExpectations: [
    {
      id: "proof-study",
      capabilityId: "study-design",
      description: "A research plan and findings report grounded in participant evidence.",
      level: "working" as const,
    },
  ],
  experienceExpectations: [
    {
      id: "experience-study",
      title: "Moderated product study",
      description: "Plan, moderate, synthesize, and communicate a study with real participants.",
      type: "research" as const,
    },
  ],
  adjacentDestinations: [
    {
      id: "consumer-insights",
      title: "Consumer Insights Researcher",
      descriptor: "Research customer behavior and market needs.",
      tone: null,
      overlapPercentage: null,
      sharedCapabilityIds: ["research-methods"],
    },
  ],
  sharedFoundationNodeIds: ["research-methods"],
  decisionPointMonths: 4,
};

const uxPlan = {
  generatedAt: "2026-09-19T00:00:00.000Z",
  summary: "Build research foundations, then produce direct study evidence.",
  now: [
    {
      id: "action-methods",
      category: "learn" as const,
      title: "Compare UX research methods",
      description: "Choose appropriate methods for three product questions.",
      whyNow: "Research methods are prerequisite to credible study design.",
      estimatedMinutes: 90,
      capabilityIds: ["research-methods"],
      status: "todo" as const,
    },
  ],
  weeks: [
    {
      weekIndex: 1,
      objectives: ["Select methods"],
      actions: [],
    },
    { weekIndex: 2, objectives: ["Draft protocol"], actions: [] },
    { weekIndex: 3, objectives: ["Run pilot"], actions: [] },
    { weekIndex: 4, objectives: ["Synthesize findings"], actions: [] },
  ],
  milestones: [
    {
      id: "milestone-study",
      title: "Complete a moderated study",
      targetMonth: 3,
      evidenceNeeded: ["proof-study"],
    },
  ],
};

function providerWithResponses(responses: unknown[]) {
  const parse = vi.fn();
  responses.forEach((response) => parse.mockResolvedValueOnce(response));
  const client = { responses: { parse } } as unknown as OpenAI;
  const provider = new OpenAIProvider(
    {
      apiKey: "test-key",
      miniModel: "mini-model-from-environment",
      reasoningModel: "reasoning-model-from-environment",
    },
    client
  );
  return { provider, parse };
}

describe("OpenAIProvider", () => {
  it("fails invalid output after one repair attempt and never mutates Zustand", async () => {
    const before = JSON.stringify({
      destination: useSkillStateStore.getState().destination,
      evidence: useSkillStateStore.getState().evidence,
      plan: useSkillStateStore.getState().plan,
    });
    const invalid = { output_parsed: { data: {}, meta } };
    const { provider, parse } = providerWithResponses([invalid, invalid]);

    await expect(
      provider.compileDestination({
        stage: "college",
        certainty: "exact",
        statedDestination: "UX Researcher",
        interests: ["psychology", "research"],
      })
    ).rejects.toMatchObject({
      name: "AIApplicationError",
      payload: expect.objectContaining({ code: "AI_INVALID_OUTPUT" }),
    });

    expect(parse).toHaveBeenCalledTimes(2);
    expect(JSON.stringify({
      destination: useSkillStateStore.getState().destination,
      evidence: useSkillStateStore.getState().evidence,
      plan: useSkillStateStore.getState().plan,
    })).toBe(before);
  });

  it("compiles and plans an unseeded UX Researcher journey via reasoning-model routing", async () => {
    const { provider, parse } = providerWithResponses([
      { output_parsed: { data: uxResearcherGraph, meta } },
      { output_parsed: { data: uxPlan, meta } },
    ]);
    const profile: LearnerProfile = {
      id: "ux-learner",
      name: "Psychology Student",
      stage: "college",
      stageDetail: "2nd-year psychology student",
      fieldOfStudy: "Psychology",
      weeklyHours: 8,
      targetTimelineMonths: 12,
      learningPreference: "balanced",
      destinationCertainty: "exact",
      statedDestination: "UX Researcher",
      interests: ["psychology", "research", "product design"],
    };

    const graph = await provider.compileDestination({
      stage: profile.stage,
      certainty: profile.destinationCertainty,
      statedDestination: profile.statedDestination,
      interests: profile.interests,
      timelineMonths: profile.targetTimelineMonths,
    });
    const verifiedStates = deriveVerifiedStates(graph, []);
    const gaps = prioritizeGaps({
      graph,
      verifiedStates,
      claimedStates: {},
      targetTimelineMonths: profile.targetTimelineMonths,
    });
    const plan = await provider.buildPlan({
      profile,
      graph,
      verifiedStates,
      claimedStates: {},
      gaps,
    });

    expect(graph.destinationName).toBe("UX Researcher");
    expect(graph.capabilityNodes).toHaveLength(2);
    expect(graph.proofExpectations).not.toHaveLength(0);
    expect(graph.experienceExpectations).not.toHaveLength(0);
    expect(gaps).toHaveLength(2);
    expect(plan.now[0].whyNow).toContain("prerequisite");
    expect(parse).toHaveBeenCalledTimes(2);
    expect(parse.mock.calls[0][0]).toMatchObject({
      model: "reasoning-model-from-environment",
      store: false,
    });
    expect(parse.mock.calls[1][0]).toMatchObject({
      model: "reasoning-model-from-environment",
      store: false,
    });
  });
});
