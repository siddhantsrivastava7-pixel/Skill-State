import {
  LearnerStateRepository,
  type LoadedLearnerState,
} from "@/persistence/learner-state-repository";
import {
  hasCompletedSnapshot,
  LearnerStateSnapshotSchema,
  type LearnerStateSnapshot,
} from "@/persistence/schema";

export class StaleOnboardingCompletionError extends Error {
  constructor() {
    super("A newer onboarding session replaced this completion.");
    this.name = "StaleOnboardingCompletionError";
  }
}

export async function persistCompletedOnboarding(input: {
  repository: LearnerStateRepository;
  userId: string;
  snapshot: LearnerStateSnapshot;
  expectedRevision: number | null;
}): Promise<LoadedLearnerState> {
  const snapshot = LearnerStateSnapshotSchema.parse(input.snapshot);
  if (!hasCompletedSnapshot(snapshot)) {
    throw new Error("Onboarding produced an incomplete learner snapshot.");
  }

  const existing = await input.repository.load(input.userId);
  if (existing && hasCompletedSnapshot(existing.snapshot)) return existing;

  const expectedRevision = existing?.revision ?? input.expectedRevision;
  try {
    const revision = await input.repository.save(
      input.userId,
      snapshot,
      expectedRevision
    );
    return { snapshot, revision };
  } catch (error) {
    // A lost response or another tab may have completed the same first-run save.
    // In that case the durable completed row is authoritative and is safe to hydrate.
    const latest = await input.repository.load(input.userId);
    if (latest && hasCompletedSnapshot(latest.snapshot)) return latest;
    throw error;
  }
}

export class OnboardingCommitCoordinator {
  private generation = 0;
  private active: { userId: string; promise: Promise<LoadedLearnerState> } | null = null;

  run(
    userId: string,
    persist: () => Promise<LoadedLearnerState>,
    commit: (result: LoadedLearnerState) => void
  ): Promise<LoadedLearnerState> {
    if (this.active) {
      if (this.active.userId === userId) return this.active.promise;
      return Promise.reject(new StaleOnboardingCompletionError());
    }

    const generation = ++this.generation;
    const promise = (async () => {
      const result = await persist();
      if (generation !== this.generation) {
        throw new StaleOnboardingCompletionError();
      }
      commit(result);
      return result;
    })();

    this.active = { userId, promise };
    void promise.then(
      () => {
        if (this.active?.promise === promise) this.active = null;
      },
      () => {
        if (this.active?.promise === promise) this.active = null;
      }
    );
    return promise;
  }

  isActiveFor(userId: string): boolean {
    return this.active?.userId === userId;
  }

  supersede(): void {
    this.generation += 1;
    this.active = null;
  }
}
