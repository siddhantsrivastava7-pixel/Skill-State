import { z } from "zod";

export const LearnerStageSchema = z.enum([
  "school",
  "college",
  "graduate",
  "professional",
]);

export const LearningPreferenceSchema = z.enum([
  "projects-first",
  "balanced",
  "structured-first",
]);

export const DestinationCertaintySchema = z.enum([
  "exact",
  "general",
  "exploring",
]);

export const LearnerProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  stage: LearnerStageSchema,
  stageDetail: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  weeklyHours: z.number().min(1),
  targetTimelineMonths: z.number().optional(),
  learningPreference: LearningPreferenceSchema,
  destinationCertainty: DestinationCertaintySchema,
  statedDestination: z.string().optional(),
  statedField: z.string().optional(),
  interests: z.array(z.string()),
});

export const CapabilityImportanceSchema = z.enum([
  "core",
  "important",
  "useful",
]);

export const StageExpectedSchema = z.enum([
  "foundation",
  "developing",
  "specialist",
]);

export const CapabilityNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  family: z.string(),
  description: z.string(),
  importance: CapabilityImportanceSchema,
  stageExpected: StageExpectedSchema.optional(),
  prerequisites: z.array(z.string()),
  unlocks: z.array(z.string()),
});

export const ProofExpectationSchema = z.object({
  id: z.string(),
  capabilityId: z.string(),
  description: z.string(),
  level: z.enum(["basic", "working", "advanced"]),
});

export const ExperienceExpectationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum([
    "internship",
    "hackathon",
    "open-source",
    "team-project",
    "research",
  ]),
});

export const AdjacentDestinationSchema = z.object({
  id: z.string(),
  title: z.string(),
  descriptor: z.string(),
  tone: z.enum(["purple", "green", "orange", "blue"]).optional(),
  overlapPercentage: z.number().optional(),
  sharedCapabilityIds: z.array(z.string()),
});

export const DestinationConfidenceSchema = z.enum(["high", "medium", "low"]);

export const DestinationGraphSchema = z.object({
  destinationId: z.string(),
  destinationName: z.string(),
  summary: z.string(),
  confidence: DestinationConfidenceSchema,
  capabilityNodes: z.array(CapabilityNodeSchema),
  proofExpectations: z.array(ProofExpectationSchema),
  experienceExpectations: z.array(ExperienceExpectationSchema),
  adjacentDestinations: z.array(AdjacentDestinationSchema),
  sharedFoundationNodeIds: z.array(z.string()),
  decisionPointMonths: z.number().optional(),
});

export const SelfReportedLevelSchema = z.enum([
  "none",
  "basic",
  "working",
  "strong",
]);

export const SkillClaimSourceSchema = z.enum(["onboarding", "profile-edit"]);

export const SkillClaimSchema = z.object({
  capabilityId: z.string(),
  selfReportedLevel: SelfReportedLevelSchema,
  source: SkillClaimSourceSchema,
});

export const EvidenceTypeSchema = z.enum([
  "resume",
  "portfolio",
  "certificate",
  "project",
  "assessment",
  "activity",
  "experience",
]);

export const EvidenceSignalTypeSchema = z.enum([
  "supports",
  "weakens",
  "unclear",
]);

export const EvidenceStrengthSchema = z.enum(["low", "medium", "high"]);

export const EvidenceSignalSchema = z.object({
  capabilityId: z.string(),
  signal: EvidenceSignalTypeSchema,
  strength: EvidenceStrengthSchema,
  explanation: z.string(),
});

export const EvidenceSchema = z.object({
  id: z.string(),
  type: EvidenceTypeSchema,
  title: z.string(),
  sourceText: z.string().optional(),
  createdAt: z.string(),
  capabilitySignals: z.array(EvidenceSignalSchema),
});

export const CapabilityStateStatusSchema = z.enum([
  "verified",
  "developing",
  "needs-proof",
  "gap",
  "unverified",
]);

export const VerifiedCapabilityStateSchema = z.object({
  capabilityId: z.string(),
  state: CapabilityStateStatusSchema,
  evidenceIds: z.array(z.string()),
  explanation: z.string(),
  lastUpdatedAt: z.string(),
});

export const GapTypeSchema = z.enum([
  "never-learned",
  "weak",
  "false-confidence",
  "knowledge-no-proof",
  "missing-experience",
]);

export const GapPrioritySchema = z.enum(["critical", "high", "medium", "low"]);

export const GapSchema = z.object({
  capabilityId: z.string(),
  gapType: GapTypeSchema,
  priority: GapPrioritySchema,
  reason: z.string(),
  blocksCapabilityIds: z.array(z.string()),
});

export const ActionCategorySchema = z.enum([
  "learn",
  "prove",
  "build",
  "experience",
  "signal",
]);

export const ActionStatusSchema = z.enum(["todo", "doing", "done"]);

export const ActionItemSchema = z.object({
  id: z.string(),
  category: ActionCategorySchema,
  title: z.string(),
  description: z.string(),
  whyNow: z.string(),
  estimatedMinutes: z.number(),
  capabilityIds: z.array(z.string()),
  status: ActionStatusSchema,
});

export const PlanWeekSchema = z.object({
  weekIndex: z.number(),
  objectives: z.array(z.string()),
  actions: z.array(ActionItemSchema),
});

export const PlanMilestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  targetMonth: z.number(),
  evidenceNeeded: z.array(z.string()),
});

export const AdaptivePlanSchema = z.object({
  generatedAt: z.string(),
  summary: z.string(),
  now: z.array(ActionItemSchema),
  weeks: z.array(PlanWeekSchema),
  milestones: z.array(PlanMilestoneSchema),
});

export const ProgressReportSchema = z.object({
  generatedAt: z.string(),
  skillsAcquired: z.array(z.string()),
  skillsInProgress: z.array(z.string()),
  remainingGaps: z.array(z.string()),
  proofAdded: z.array(z.string()),
  experienceAdded: z.array(z.string()),
  planChanges: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

export const ActivityEventTypeSchema = z.enum([
  "DESTINATION_CHANGED",
  "EVIDENCE_ADDED",
  "SKILL_CLAIM_CHANGED",
  "VERIFICATION_COMPLETED",
  "ACTIVITY_COMPLETED",
  "PROJECT_ADDED",
  "TIME_BUDGET_CHANGED",
]);

export const ActivityEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  type: ActivityEventTypeSchema,
  title: z.string(),
  description: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

// AI Provider input & output schemas
export const CompileDestinationInputSchema = z.object({
  stage: LearnerStageSchema,
  certainty: DestinationCertaintySchema,
  statedDestination: z.string().optional(),
  statedField: z.string().optional(),
  interests: z.array(z.string()),
  timelineMonths: z.number().optional(),
});

export const EvidenceAnalysisInputSchema = z.object({
  documentText: z.string(),
  documentType: z.string(),
  filename: z.string().optional(),
  destinationGraph: DestinationGraphSchema,
});

export const EvidenceAnalysisResultSchema = z.object({
  evidence: EvidenceSchema,
  extractedSignals: z.array(EvidenceSignalSchema),
  proposedStateUpdates: z.array(
    z.object({
      capabilityId: z.string(),
      proposedState: CapabilityStateStatusSchema,
      reason: z.string(),
    })
  ),
});

export const VerificationTaskTypeSchema = z.enum([
  "mcq",
  "scenario",
  "micro-task",
  "project-review",
]);

export const VerificationTaskSchema = z.object({
  id: z.string(),
  capabilityId: z.string(),
  capabilityName: z.string(),
  type: VerificationTaskTypeSchema,
  prompt: z.string(),
  options: z.array(z.string()).optional(),
  rubric: z.string().optional(),
});

export const VerificationRequestSchema = z.object({
  capabilityIds: z.array(z.string()),
  context: z.string().optional(),
});

export const VerificationSubmissionSchema = z.object({
  taskId: z.string(),
  capabilityId: z.string(),
  userResponse: z.string(),
  selectedOptionIndex: z.number().optional(),
});

export const VerificationResultSchema = z.object({
  taskId: z.string(),
  capabilityId: z.string(),
  passed: z.boolean(),
  signal: EvidenceSignalTypeSchema,
  strength: EvidenceStrengthSchema,
  proposedState: CapabilityStateStatusSchema,
  explanation: z.string(),
  planImpact: z.string(),
  evidenceSignal: EvidenceSignalSchema,
});

export const BuildPlanInputSchema = z.object({
  profile: LearnerProfileSchema,
  graph: DestinationGraphSchema,
  verifiedStates: z.record(VerifiedCapabilityStateSchema),
  claimedStates: z.record(SkillClaimSchema),
  gaps: z.array(GapSchema),
});

export const ResourceRequestSchema = z.object({
  gapCapabilityId: z.string(),
  learningPreference: LearningPreferenceSchema,
  availableMinutes: z.number().optional(),
});

export const ResourceRecommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  format: z.enum(["course", "article", "project-guide", "documentation", "video"]),
  provider: z.string(),
  estimatedMinutes: z.number(),
  matchedGapId: z.string(),
  whyThis: z.string(),
  url: z.string(),
});

export const ProgressReportInputSchema = z.object({
  profile: LearnerProfileSchema,
  graph: DestinationGraphSchema,
  verifiedStates: z.record(VerifiedCapabilityStateSchema),
  gaps: z.array(GapSchema),
  evidence: z.array(EvidenceSchema),
  activityLedger: z.array(ActivityEventSchema),
});

export const JourneyQuestionSchema = z.object({
  question: z.string(),
  profile: LearnerProfileSchema,
  destination: z.string(),
  currentPlan: AdaptivePlanSchema,
  recentEvents: z.array(ActivityEventSchema),
});

export const JourneyAnswerSchema = z.object({
  answer: z.string(),
  citations: z.array(
    z.object({
      type: z.enum(["skill", "plan-item", "constraint", "evidence"]),
      label: z.string(),
      detail: z.string(),
    })
  ),
  isGeneralGuidance: z.boolean().optional(),
});
