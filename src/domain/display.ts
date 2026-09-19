import type { LearnerProfile } from "./types";

/** Active destination is authoritative after a switch; exploration keeps its broader field label. */
export function resolveHomeGoalLabel(
  destination: string,
  profile: LearnerProfile
): string {
  if (profile.destinationCertainty === "exact") {
    return destination || profile.statedDestination || "Target Role";
  }
  return profile.statedField || destination || "Technology career";
}
