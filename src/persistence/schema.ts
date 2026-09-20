import { z } from "zod";
import {
  ActivityEventSchema,
  AdaptivePlanSchema,
  DestinationGraphSchema,
  EvidenceSchema,
  GapSchema,
  LearnerProfileSchema,
  ProgressReportSchema,
  SkillClaimSchema,
  VerifiedCapabilityStateSchema,
} from "@/domain/schemas";

export const SKILLSTATE_STATE_SCHEMA_VERSION = 1;

export const LearnerStateSnapshotSchema = z.object({
  schemaVersion: z.literal(SKILLSTATE_STATE_SCHEMA_VERSION),
  onboardingCompleted: z.boolean(),
  profile: LearnerProfileSchema,
  destination: z.string(),
  destinationGraph: DestinationGraphSchema,
  claimedStates: z.record(SkillClaimSchema),
  verifiedStates: z.record(VerifiedCapabilityStateSchema),
  evidence: z.array(EvidenceSchema),
  gaps: z.array(GapSchema),
  plan: AdaptivePlanSchema,
  activityLedger: z.array(ActivityEventSchema),
  progressReports: z.array(ProgressReportSchema),
}).strict();

export type LearnerStateSnapshot = z.infer<typeof LearnerStateSnapshotSchema>;

export function hasCompletedSnapshot(snapshot: LearnerStateSnapshot): boolean {
  return Boolean(
    snapshot.onboardingCompleted &&
    snapshot.profile.id &&
    snapshot.destinationGraph.destinationId &&
    snapshot.destinationGraph.capabilityNodes.length > 0
  );
}
