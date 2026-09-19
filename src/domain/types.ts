import { z } from "zod";
import {
  LearnerStageSchema,
  LearningPreferenceSchema,
  DestinationCertaintySchema,
  LearnerProfileSchema,
  CapabilityImportanceSchema,
  StageExpectedSchema,
  CapabilityNodeSchema,
  ProofExpectationSchema,
  ExperienceExpectationSchema,
  AdjacentDestinationSchema,
  DestinationConfidenceSchema,
  DestinationGraphSchema,
  SelfReportedLevelSchema,
  SkillClaimSourceSchema,
  SkillClaimSchema,
  EvidenceTypeSchema,
  EvidenceSignalTypeSchema,
  EvidenceStrengthSchema,
  EvidenceSignalSchema,
  EvidenceSchema,
  CapabilityStateStatusSchema,
  VerifiedCapabilityStateSchema,
  GapTypeSchema,
  GapPrioritySchema,
  GapSchema,
  ActionCategorySchema,
  ActionStatusSchema,
  ActionItemSchema,
  PlanWeekSchema,
  PlanMilestoneSchema,
  AdaptivePlanSchema,
  ProgressReportSchema,
  ActivityEventTypeSchema,
  ActivityEventSchema,
  CompileDestinationInputSchema,
  EvidenceAnalysisInputSchema,
  EvidenceAnalysisResultSchema,
  VerificationTaskTypeSchema,
  VerificationTaskSchema,
  VerificationRequestSchema,
  VerificationSubmissionSchema,
  VerificationResultSchema,
  BuildPlanInputSchema,
  ResourceRequestSchema,
  ResourceRecommendationSchema,
  ProgressReportInputSchema,
  JourneyQuestionSchema,
  JourneyAnswerSchema,
} from "./schemas";

export type LearnerStage = z.infer<typeof LearnerStageSchema>;
export type LearningPreference = z.infer<typeof LearningPreferenceSchema>;
export type DestinationCertainty = z.infer<typeof DestinationCertaintySchema>;
export type LearnerProfile = z.infer<typeof LearnerProfileSchema>;

export type CapabilityImportance = z.infer<typeof CapabilityImportanceSchema>;
export type StageExpected = z.infer<typeof StageExpectedSchema>;
export type CapabilityNode = z.infer<typeof CapabilityNodeSchema>;
export type ProofExpectation = z.infer<typeof ProofExpectationSchema>;
export type ExperienceExpectation = z.infer<typeof ExperienceExpectationSchema>;
export type AdjacentDestination = z.infer<typeof AdjacentDestinationSchema>;
export type DestinationConfidence = z.infer<typeof DestinationConfidenceSchema>;
export type DestinationGraph = z.infer<typeof DestinationGraphSchema>;

export type SelfReportedLevel = z.infer<typeof SelfReportedLevelSchema>;
export type SkillClaimSource = z.infer<typeof SkillClaimSourceSchema>;
export type SkillClaim = z.infer<typeof SkillClaimSchema>;

export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;
export type EvidenceSignalType = z.infer<typeof EvidenceSignalTypeSchema>;
export type EvidenceStrength = z.infer<typeof EvidenceStrengthSchema>;
export type EvidenceSignal = z.infer<typeof EvidenceSignalSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;

export type CapabilityStateStatus = z.infer<typeof CapabilityStateStatusSchema>;
export type VerifiedCapabilityState = z.infer<typeof VerifiedCapabilityStateSchema>;

export type GapType = z.infer<typeof GapTypeSchema>;
export type GapPriority = z.infer<typeof GapPrioritySchema>;
export type Gap = z.infer<typeof GapSchema>;

export type ActionCategory = z.infer<typeof ActionCategorySchema>;
export type ActionStatus = z.infer<typeof ActionStatusSchema>;
export type ActionItem = z.infer<typeof ActionItemSchema>;
export type PlanWeek = z.infer<typeof PlanWeekSchema>;
export type PlanMilestone = z.infer<typeof PlanMilestoneSchema>;
export type AdaptivePlan = z.infer<typeof AdaptivePlanSchema>;

export type ProgressReport = z.infer<typeof ProgressReportSchema>;
export type ActivityEventType = z.infer<typeof ActivityEventTypeSchema>;
export type ActivityEvent = z.infer<typeof ActivityEventSchema>;

export type CompileDestinationInput = z.infer<typeof CompileDestinationInputSchema>;
export type EvidenceAnalysisInput = z.infer<typeof EvidenceAnalysisInputSchema>;
export type EvidenceAnalysisResult = z.infer<typeof EvidenceAnalysisResultSchema>;
export type VerificationTaskType = z.infer<typeof VerificationTaskTypeSchema>;
export type VerificationTask = z.infer<typeof VerificationTaskSchema>;
export type VerificationRequest = z.infer<typeof VerificationRequestSchema>;
export type VerificationSubmission = z.infer<typeof VerificationSubmissionSchema>;
export type VerificationResult = z.infer<typeof VerificationResultSchema>;
export type BuildPlanInput = z.infer<typeof BuildPlanInputSchema>;
export type ResourceRequest = z.infer<typeof ResourceRequestSchema>;
export type ResourceRecommendation = z.infer<typeof ResourceRecommendationSchema>;
export type ProgressReportInput = z.infer<typeof ProgressReportInputSchema>;
export type JourneyQuestion = z.infer<typeof JourneyQuestionSchema>;
export type JourneyAnswer = z.infer<typeof JourneyAnswerSchema>;
