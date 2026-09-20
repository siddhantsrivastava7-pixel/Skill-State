import type { SkillStateStoreState } from "@/store/useSkillStateStore";

export function shouldPersistLearnerState(
  state: SkillStateStoreState,
  userId: string,
  isDemoMode: boolean
): boolean {
  return Boolean(
    !isDemoMode &&
    state._hasHydrated &&
    !state._persistenceBlocked &&
    !state.isDemoState &&
    state._activeUserId === userId
  );
}
