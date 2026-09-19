import {
  AdaptivePlan,
  BuildPlanInput,
  CompileDestinationInput,
  DestinationGraph,
  EvidenceAnalysisInput,
  EvidenceAnalysisResult,
  JourneyAnswer,
  JourneyQuestion,
  ProgressReport,
  ProgressReportInput,
  ResourceRecommendation,
  ResourceRequest,
  VerificationRequest,
  VerificationResult,
  VerificationSubmission,
  VerificationTask,
} from "@/domain/types";

export interface AIProvider {
  compileDestination(input: CompileDestinationInput): Promise<DestinationGraph>;
  analyzeEvidence(input: EvidenceAnalysisInput): Promise<EvidenceAnalysisResult>;
  generateVerification(input: VerificationRequest): Promise<VerificationTask[]>;
  evaluateVerification(input: VerificationSubmission): Promise<VerificationResult>;
  buildPlan(input: BuildPlanInput): Promise<AdaptivePlan>;
  recommendResources(input: ResourceRequest): Promise<ResourceRecommendation[]>;
  generateProgressReport(input: ProgressReportInput): Promise<ProgressReport>;
  answerJourneyQuestion(input: JourneyQuestion): Promise<JourneyAnswer>;
}
