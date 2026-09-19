import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIProvider } from "@/agent/provider";
import { compileOnboardingDestination } from "@/agent/onboarding";
import { resolveDestination } from "@/data/knowledge/resolution";
import { matchResourcesToGaps } from "@/data/library/resources-library";
import type {
  AdaptivePlan,
  CompileDestinationInput,
  DestinationGraph,
  LearnerProfile,
} from "@/domain/types";
import { useSkillStateStore } from "@/store/useSkillStateStore";

const rawComputationalLinguistGraph: DestinationGraph = {
  destinationId: "computational-linguist",
  destinationName: "Computational Linguist",
  summary: "Uses computational methods to study and build language systems.",
  confidence: "high",
  capabilityNodes: [
    {
      id: "language-structure-analysis",
      name: "Language Structure Analysis",
      family: "Linguistics",
      description: "Analyze phonology, morphology, syntax, semantics, and pragmatics.",
      importance: "core",
      stageExpected: "developing",
      prerequisites: [],
      unlocks: [],
    },
    {
      id: "research-methods-evaluation",
      name: "Research Methods and Evaluation",
      family: "Research",
      description: "Formulate questions, design studies or experiments, choose evaluation criteria, interpret results, and recognize limits of evidence.",
      importance: "core",
      stageExpected: "developing",
      prerequisites: [],
      unlocks: [],
    },
    {
      id: "programming-for-language-data",
      name: "Programming for Language Data",
      family: "Computing",
      description: "Use programming to clean, transform, analyze, and automate work on text or speech data, typically with scripting, data structures, and reproducible workflows.",
      importance: "core",
      stageExpected: "developing",
      prerequisites: [],
      unlocks: [],
    },
    {
      id: "statistics-data-analysis",
      name: "Statistics and Data Analysis",
      family: "Data",
      description: "Apply descriptive statistics, inference, exploratory analysis, and basic modeling to language-related datasets and experimental results.",
      importance: "core",
      stageExpected: "developing",
      prerequisites: [],
      unlocks: [],
    },
    {
      id: "nlp-methods-implementation",
      name: "NLP Methods Implementation",
      family: "Language Technology",
      description: "Implement and evaluate computational methods for tagging, parsing, retrieval, generation, or speech and text processing.",
      importance: "core",
      stageExpected: "specialist",
      prerequisites: [],
      unlocks: [],
    },
  ],
  proofExpectations: [],
  experienceExpectations: [],
  adjacentDestinations: [],
  sharedFoundationNodeIds: [
    "language-structure-analysis",
    "research-methods-evaluation",
    "programming-for-language-data",
    "statistics-data-analysis",
  ],
};

const profile: LearnerProfile = {
  id: "fresh-computational-linguist",
  name: "Trace Learner",
  stage: "college",
  stageDetail: "Year 1 Undergraduate",
  fieldOfStudy: "Data Science",
  weeklyHours: 14,
  targetTimelineMonths: 12,
  learningPreference: "balanced",
  destinationCertainty: "exact",
  statedDestination: "Computational Linguist",
  interests: [],
};

const emptyPlan: AdaptivePlan = {
  generatedAt: "2026-09-19T00:00:00.000Z",
  summary: "Fresh onboarding plan",
  now: [],
  weeks: [],
  milestones: [],
};

describe("Computational Linguist browser onboarding integration", () => {
  beforeEach(() => useSkillStateStore.getState().resetStore());

  it("keeps canonical IDs from compilation through resource lookup", async () => {
    const rawCompiler = {
      compileDestination: vi.fn().mockResolvedValue(rawComputationalLinguistGraph),
    };
    const browserProvider = {
      compileDestination: async (input: CompileDestinationInput) => (
        await resolveDestination(input, {
          allowCompilation: true,
          provider: rawCompiler,
        })
      ).graph,
    } as AIProvider;

    const graph = await compileOnboardingDestination(browserProvider, {
      stage: "college",
      certainty: "exact",
      statedDestination: "Computational Linguist",
      interests: [],
      timelineMonths: 12,
    });
    useSkillStateStore.getState().initializeJourney(profile, graph, [], emptyPlan);

    const state = useSkillStateStore.getState();
    const graphIds = state.destinationGraph.capabilityNodes.map((node) => node.id);
    const verifiedIds = Object.values(state.verifiedStates).map((item) => item.capabilityId);
    const gapIds = state.gaps.map((gap) => gap.capabilityId);
    const resources = matchResourcesToGaps(
      state.gaps,
      state.destinationGraph,
      state.verifiedStates
    );

    expect(graphIds).toContain("programming-python");
    expect(graphIds).toContain("research-design");
    expect(graphIds).toContain("statistics");
    expect(graphIds).toContain("language-structure-analysis");
    expect(graphIds).not.toContain("programming-for-language-data");
    expect(new Set(verifiedIds)).toEqual(new Set(graphIds));
    expect(new Set(gapIds)).toEqual(new Set(graphIds));
    expect(
      resources.find((group) => group.gapCapabilityId === "programming-python")?.resources
        .map((resource) => resource.id)
    ).toContain("python-tutorial");
    expect(
      resources.find((group) => group.gapCapabilityId === "research-design")?.resources.length
    ).toBeGreaterThan(0);
    expect(
      resources.find((group) => group.gapCapabilityId === "statistics")?.resources.length
    ).toBeGreaterThan(0);
    expect(
      resources.find((group) => group.gapCapabilityId === "language-structure-analysis")?.resources
    ).toEqual([]);
  });
});
