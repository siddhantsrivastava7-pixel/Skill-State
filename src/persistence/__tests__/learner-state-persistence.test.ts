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
import {
  CorruptRemoteStateError,
  LearnerStateRepository,
  RemoteStateOwnershipError,
  type LearnerStateBackend,
} from "@/persistence/learner-state-repository";
import { shouldPersistLearnerState } from "@/persistence/policy";
import {
  LearnerStateSnapshotSchema,
  type LearnerStateSnapshot,
} from "@/persistence/schema";
import { useSkillStateStore } from "@/store/useSkillStateStore";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";

function snapshot(userId = userA): LearnerStateSnapshot {
  return LearnerStateSnapshotSchema.parse({
    schemaVersion: 1,
    onboardingCompleted: true,
    profile: { ...personaBProfile, id: userId },
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

function backendWithRow(row: Awaited<ReturnType<LearnerStateBackend["loadRow"]>>): LearnerStateBackend {
  return {
    loadRow: vi.fn().mockResolvedValue(row),
    saveRow: vi.fn().mockResolvedValue(2),
    deleteRows: vi.fn().mockResolvedValue(undefined),
  };
}

describe("production learner-state persistence", () => {
  beforeEach(() => useSkillStateStore.getState().clearForAuthChange());

  it("validates a complete persisted learner snapshot", () => {
    expect(LearnerStateSnapshotSchema.safeParse(snapshot()).success).toBe(true);
  });

  it("never hydrates user A from user B's repository row", async () => {
    const repository = new LearnerStateRepository(backendWithRow({
      user_id: userB,
      state_json: snapshot(userB),
      schema_version: 1,
      revision: 4,
    }));

    await expect(repository.load(userA)).rejects.toBeInstanceOf(RemoteStateOwnershipError);
  });

  it("rejects corrupted remote JSON without writing over the raw row", async () => {
    const backend = backendWithRow({
      user_id: userA,
      state_json: { schemaVersion: 1, destination: "broken" },
      schema_version: 1,
      revision: 8,
    });
    const repository = new LearnerStateRepository(backend);

    await expect(repository.load(userA)).rejects.toBeInstanceOf(CorruptRemoteStateError);
    expect(backend.saveRow).not.toHaveBeenCalled();
    expect(backend.deleteRows).not.toHaveBeenCalled();
  });

  it("does not persist demo persona activity", () => {
    useSkillStateStore.getState().loadPersona("persona-a");
    expect(shouldPersistLearnerState(useSkillStateStore.getState(), userA, true)).toBe(false);
  });

  it("clears all private learner data when auth changes or logs out", () => {
    useSkillStateStore.getState().hydrateRemoteState(userA, snapshot(), 3);
    useSkillStateStore.getState().clearForAuthChange();
    const state = useSkillStateStore.getState();

    expect(state._activeUserId).toBeNull();
    expect(state._hasHydrated).toBe(false);
    expect(state.profile.id).toBe("");
    expect(state.destinationGraph.capabilityNodes).toEqual([]);
    expect(state.evidence).toEqual([]);
    expect(state.plan.now).toEqual([]);
  });

  it("blocks initial empty defaults from saving until remote hydration completes", () => {
    useSkillStateStore.getState().beginRemoteHydration(userA);
    expect(shouldPersistLearnerState(useSkillStateStore.getState(), userA, false)).toBe(false);

    useSkillStateStore.getState().hydrateRemoteState(userA, snapshot(), 5);
    const hydrated = useSkillStateStore.getState();
    expect(hydrated.destination).toBe(personaBGraph.destinationName);
    expect(hydrated._remoteRevision).toBe(5);
    expect(shouldPersistLearnerState(hydrated, userA, false)).toBe(true);
  });
});
