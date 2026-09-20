import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  personaBActivityLedger,
  personaBEvidence,
  personaBGaps,
  personaBGraph,
  personaBPlan,
  personaBProfile,
  personaBVerifiedStates,
} from "@/data/demo";
import { resolveLearnerRoute } from "@/domain/onboarding-routing";
import {
  LearnerStateRepository,
  type LearnerStateBackend,
} from "@/persistence/learner-state-repository";
import {
  OnboardingCommitCoordinator,
  StaleOnboardingCompletionError,
  persistCompletedOnboarding,
} from "@/persistence/onboarding-completion";
import {
  LearnerStateSnapshotSchema,
  type LearnerStateSnapshot,
} from "@/persistence/schema";
import { useSkillStateStore } from "@/store/useSkillStateStore";

const userId = "11111111-1111-4111-8111-111111111111";

function completedSnapshot(name = "First learner"): LearnerStateSnapshot {
  return LearnerStateSnapshotSchema.parse({
    schemaVersion: 1,
    onboardingCompleted: true,
    profile: { ...personaBProfile, id: userId, name },
    destination: personaBGraph.destinationName,
    destinationGraph: personaBGraph,
    claimedStates: {},
    verifiedStates: personaBVerifiedStates,
    evidence: personaBEvidence,
    gaps: personaBGaps,
    plan: personaBPlan,
    activityLedger: personaBActivityLedger,
    progressReports: [],
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("onboarding completion race safety", () => {
  beforeEach(() => useSkillStateStore.getState().clearForAuthChange());

  it("keeps the route guard in loading while learner hydration is pending", () => {
    expect(resolveLearnerRoute({
      hasHydrated: false,
      onboardingFlowStatus: "idle",
      onboardingCompleted: false,
      hasCompletedProfile: false,
      isDemoState: false,
      demoModeRequested: false,
    })).toBe("loading");
  });

  it("stays processing until slow onboarding persistence commits", async () => {
    const gate = deferred<{ snapshot: LearnerStateSnapshot; revision: number }>();
    const coordinator = new OnboardingCommitCoordinator();
    const commit = vi.fn();
    const promise = coordinator.run(userId, () => gate.promise, commit);

    expect(commit).not.toHaveBeenCalled();
    expect(resolveLearnerRoute({
      hasHydrated: true,
      onboardingFlowStatus: "submitting",
      onboardingCompleted: false,
      hasCompletedProfile: false,
      isDemoState: false,
      demoModeRequested: false,
    })).toBe("processing");

    const result = { snapshot: completedSnapshot(), revision: 1 };
    gate.resolve(result);
    await expect(promise).resolves.toEqual(result);
    expect(commit).toHaveBeenCalledOnce();
  });

  it("cannot flash or reset to onboarding after the first successful commit", async () => {
    useSkillStateStore.getState().completeEmptyRemoteHydration(userId);
    expect(useSkillStateStore.getState().beginOnboardingSubmission()).toBe(true);

    const coordinator = new OnboardingCommitCoordinator();
    await coordinator.run(
      userId,
      async () => ({ snapshot: completedSnapshot(), revision: 1 }),
      (result) => useSkillStateStore.getState().commitPersistedOnboarding(
        userId,
        result.snapshot,
        result.revision
      )
    );

    const committed = useSkillStateStore.getState();
    expect(committed.profile.name).toBe("First learner");
    expect(resolveLearnerRoute({
      hasHydrated: committed._hasHydrated,
      onboardingFlowStatus: committed._onboardingFlowStatus,
      onboardingCompleted: committed.onboardingCompleted,
      hasCompletedProfile: Boolean(committed.profile.id),
      isDemoState: committed.isDemoState,
      demoModeRequested: false,
    })).toBe("processing");

    committed.finishOnboardingNavigation();
    expect(resolveLearnerRoute({
      hasHydrated: true,
      onboardingFlowStatus: useSkillStateStore.getState()._onboardingFlowStatus,
      onboardingCompleted: true,
      hasCompletedProfile: true,
      isDemoState: false,
      demoModeRequested: false,
    })).toBe("/");
  });

  it("uses an already durable completed snapshot after a refresh during completion", async () => {
    const durable = completedSnapshot("Durable learner");
    const backend: LearnerStateBackend = {
      loadRow: vi.fn().mockResolvedValue({
        user_id: userId,
        state_json: durable,
        schema_version: 1,
        revision: 4,
      }),
      saveRow: vi.fn(),
      deleteRows: vi.fn(),
    };

    const result = await persistCompletedOnboarding({
      repository: new LearnerStateRepository(backend),
      userId,
      snapshot: completedSnapshot("Retry learner"),
      expectedRevision: null,
    });

    expect(result).toEqual({ snapshot: durable, revision: 4 });
    expect(backend.saveRow).not.toHaveBeenCalled();
  });

  it("deduplicates duplicate submits into one persistence operation", async () => {
    const gate = deferred<{ snapshot: LearnerStateSnapshot; revision: number }>();
    const coordinator = new OnboardingCommitCoordinator();
    const persist = vi.fn(() => gate.promise);
    const commit = vi.fn();

    const first = coordinator.run(userId, persist, commit);
    const duplicate = coordinator.run(userId, persist, commit);
    expect(duplicate).toBe(first);
    expect(persist).toHaveBeenCalledOnce();

    gate.resolve({ snapshot: completedSnapshot(), revision: 1 });
    await Promise.all([first, duplicate]);
    expect(commit).toHaveBeenCalledOnce();
  });

  it("prevents a late first request from corrupting a subsequent state", async () => {
    const firstGate = deferred<{ snapshot: LearnerStateSnapshot; revision: number }>();
    const coordinator = new OnboardingCommitCoordinator();
    const committedNames: string[] = [];
    const first = coordinator.run(
      userId,
      () => firstGate.promise,
      (result) => committedNames.push(result.snapshot.profile.name)
    );

    coordinator.supersede();
    await coordinator.run(
      userId,
      async () => ({ snapshot: completedSnapshot("Second learner"), revision: 2 }),
      (result) => committedNames.push(result.snapshot.profile.name)
    );

    firstGate.resolve({ snapshot: completedSnapshot("Late first learner"), revision: 1 });
    await expect(first).rejects.toBeInstanceOf(StaleOnboardingCompletionError);
    expect(committedNames).toEqual(["Second learner"]);
  });
});
