import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIProvider } from "@/agent/provider";
import { compileOnboardingDestination } from "@/agent/onboarding";
import { personaAGraph } from "@/data/demo";
import { routeForLearnerState } from "@/domain/onboarding-routing";
import { useSkillStateStore } from "@/store/useSkillStateStore";

describe("first-run learner state", () => {
  beforeEach(() => {
    useSkillStateStore.getState().resetStore();
  });

  it("routes an empty store to onboarding", () => {
    expect(
      routeForLearnerState({
        onboardingCompleted: false,
        hasCompletedProfile: false,
        isDemoState: false,
        demoModeRequested: false,
      })
    ).toBe("/onboarding");
  });

  it("routes a completed real learner to Home", () => {
    expect(
      routeForLearnerState({
        onboardingCompleted: true,
        hasCompletedProfile: true,
        isDemoState: false,
        demoModeRequested: false,
      })
    ).toBe("/");
  });

  it("returns to onboarding and clears learner data after reset", () => {
    useSkillStateStore.getState().loadPersona("persona-a");
    useSkillStateStore.getState().resetStore();

    const state = useSkillStateStore.getState();
    expect(state.onboardingCompleted).toBe(false);
    expect(state.profile.id).toBe("");
    expect(state.evidence).toEqual([]);
    expect(state.plan.now).toEqual([]);
    expect(state.activityLedger).toEqual([]);
    expect(
      routeForLearnerState({
        onboardingCompleted: state.onboardingCompleted,
        hasCompletedProfile: Boolean(state.profile.id),
        isDemoState: state.isDemoState,
        demoModeRequested: false,
      })
    ).toBe("/onboarding");
  });

  it("never assigns a demo persona to a fresh normal user", () => {
    const state = useSkillStateStore.getState();
    expect(state.activePersonaId).toBeNull();
    expect(state.isDemoState).toBe(false);
    expect(state.profile.id).toBe("");
    expect(state.destinationGraph.destinationId).toBe("");
  });

  it("calls destination compilation during live onboarding", async () => {
    const compileDestination = vi.fn().mockResolvedValue(personaAGraph);
    const liveProvider = { compileDestination } as unknown as AIProvider;
    const input = {
      stage: "college" as const,
      certainty: "exact" as const,
      statedDestination: "Machine learning engineer",
      interests: ["AI"],
      timelineMonths: 12,
      planningHorizon: { mode: "twelve-months" as const, resolvedMonths: 12 },
    };

    await expect(compileOnboardingDestination(liveProvider, input)).resolves.toBe(personaAGraph);
    expect(compileDestination).toHaveBeenCalledOnce();
    expect(compileDestination).toHaveBeenCalledWith(input);
  });
});
