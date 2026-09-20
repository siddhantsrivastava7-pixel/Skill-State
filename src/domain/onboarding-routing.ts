export interface OnboardingAccessState {
  onboardingCompleted: boolean;
  hasCompletedProfile: boolean;
  isDemoState: boolean;
  demoModeRequested: boolean;
}

export function hasUsableLearnerState(state: OnboardingAccessState): boolean {
  if (state.demoModeRequested) return true;
  if (!state.onboardingCompleted) return false;
  if (!state.hasCompletedProfile) return false;
  if (state.isDemoState) return false;
  return true;
}

export function routeForLearnerState(
  state: OnboardingAccessState
): "/" | "/onboarding" {
  return hasUsableLearnerState(state) ? "/" : "/onboarding";
}

export function resolveLearnerRoute(input: OnboardingAccessState & {
  hasHydrated: boolean;
  onboardingFlowStatus: "idle" | "submitting" | "navigating";
}): "loading" | "processing" | "/" | "/onboarding" {
  if (!input.hasHydrated) return "loading";
  if (input.onboardingFlowStatus !== "idle") return "processing";
  return routeForLearnerState(input);
}
