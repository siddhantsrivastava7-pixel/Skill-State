import type { AIProvider } from "./provider";
import { AIApplicationError } from "./errors";
import {
  AdaptivePlanSchema,
  DestinationGraphSchema,
  EvidenceAnalysisResultSchema,
  JourneyAnswerSchema,
  ProgressReportSchema,
  ResourceRecommendationSchema,
  VerificationResultSchema,
  VerificationTaskSchema,
} from "@/domain/schemas";
import type {
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
import type { ZodSchema } from "zod";
import { authenticatedAppFetch } from "@/auth/client-request";

interface AgentEnvelope {
  data?: unknown;
  error?: {
    code?: string;
    message?: string;
    operation?: string;
    retryable?: boolean;
  };
}

const inFlightAgentRequests = new Map<string, Promise<unknown>>();

async function callAgent<TInput, TOutput>(
  operation: string,
  input: TInput,
  schema: ZodSchema<TOutput>
): Promise<TOutput> {
  const serializedInput = JSON.stringify(input);
  const inFlightKey = `${operation}:${serializedInput}`;
  const existing = inFlightAgentRequests.get(inFlightKey);
  if (existing) return existing as Promise<TOutput>;

  const request = (async () => {
    const response = await authenticatedAppFetch(`/api/agent/${operation}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: serializedInput,
    }, { idempotencyKey: crypto.randomUUID() });

    const envelope = (await response.json().catch(() => ({}))) as AgentEnvelope;
    if (!response.ok || envelope.error) {
      throw new AIApplicationError({
        code: envelope.error?.code === "AI_INVALID_OUTPUT"
          ? "AI_INVALID_OUTPUT"
          : "AI_PROVIDER_ERROR",
        message:
          envelope.error?.message ??
          "SkillState intelligence is temporarily unavailable. Your current state was not changed.",
        operation,
        retryable: envelope.error?.retryable ?? true,
      });
    }

    const parsed = schema.safeParse(envelope.data);
    if (!parsed.success) {
      throw new AIApplicationError({
        code: "AI_INVALID_OUTPUT",
        message: "SkillState received an invalid response. Your current state was not changed.",
        operation,
        retryable: true,
      });
    }
    return parsed.data;
  })();
  inFlightAgentRequests.set(inFlightKey, request);
  try {
    return await request;
  } finally {
    inFlightAgentRequests.delete(inFlightKey);
  }
}

export class ClientAIProvider implements AIProvider {
  compileDestination(input: CompileDestinationInput): Promise<DestinationGraph> {
    return callAgent("compile-destination", input, DestinationGraphSchema);
  }

  analyzeEvidence(input: EvidenceAnalysisInput): Promise<EvidenceAnalysisResult> {
    return callAgent("analyze-evidence", input, EvidenceAnalysisResultSchema);
  }

  generateVerification(input: VerificationRequest): Promise<VerificationTask[]> {
    return callAgent("generate-verification", input, VerificationTaskSchema.array());
  }

  evaluateVerification(input: VerificationSubmission): Promise<VerificationResult> {
    return callAgent("evaluate-verification", input, VerificationResultSchema);
  }

  buildPlan(input: BuildPlanInput): Promise<AdaptivePlan> {
    return callAgent("build-plan", input, AdaptivePlanSchema);
  }

  recommendResources(input: ResourceRequest): Promise<ResourceRecommendation[]> {
    return callAgent("resources", input, ResourceRecommendationSchema.array());
  }

  generateProgressReport(input: ProgressReportInput): Promise<ProgressReport> {
    return callAgent("progress-report", input, ProgressReportSchema);
  }

  answerJourneyQuestion(input: JourneyQuestion): Promise<JourneyAnswer> {
    return callAgent("ask", input, JourneyAnswerSchema);
  }
}

let clientProvider: AIProvider | null = null;

export function getClientAIProvider(): AIProvider {
  clientProvider ??= new ClientAIProvider();
  return clientProvider;
}
