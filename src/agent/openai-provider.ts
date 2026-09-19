import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { AIProvider } from "./provider";
import { AIApplicationError, toAIApplicationError } from "./errors";
import {
  SYSTEM_PROMPT_DESTINATION_COMPILER,
  SYSTEM_PROMPT_EVIDENCE_ANALYZER,
  SYSTEM_PROMPT_JOURNEY_PLANNER,
} from "./prompts";
import {
  AdaptivePlanSchema,
  DestinationGraphSchema,
  EvidenceAnalysisResultSchema,
  EvidenceTypeSchema,
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
import { resourcesForCapability } from "@/data/library/resources-library";
import { buildProgressReportFromState } from "@/domain/progress-report";

const nullableString = z.string().nullable();
const responseMetaSchema = z.object({
  confidence: z.enum(["high", "medium", "low"]),
  evidenceContradictory: z.boolean(),
  unresolvedMappings: z.boolean(),
  ambiguous: z.boolean(),
});

function responseEnvelopeSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({ data, meta: responseMetaSchema });
}

const liveCapabilityNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  family: z.string(),
  description: z.string(),
  importance: z.enum(["core", "important", "useful"]),
  stageExpected: z.enum(["foundation", "developing", "specialist"]).nullable(),
  prerequisites: z.array(z.string()),
  unlocks: z.array(z.string()),
});

const liveDestinationGraphSchema = z.object({
  destinationId: z.string(),
  destinationName: z.string(),
  summary: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  capabilityNodes: z.array(liveCapabilityNodeSchema),
  proofExpectations: z.array(
    z.object({
      id: z.string(),
      capabilityId: z.string(),
      description: z.string(),
      level: z.enum(["basic", "working", "advanced"]),
    })
  ),
  experienceExpectations: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      type: z.enum(["internship", "hackathon", "open-source", "team-project", "research"]),
    })
  ),
  adjacentDestinations: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      descriptor: z.string(),
      tone: z.enum(["purple", "green", "orange", "blue"]).nullable(),
      overlapPercentage: z.number().nullable(),
      sharedCapabilityIds: z.array(z.string()),
    })
  ),
  sharedFoundationNodeIds: z.array(z.string()),
  decisionPointMonths: z.number().nullable(),
});

const evidenceSignalSchema = z.object({
  capabilityId: z.string(),
  signal: z.enum(["supports", "weakens", "unclear"]),
  strength: z.enum(["low", "medium", "high"]),
  explanation: z.string(),
});

const liveEvidenceAnalysisSchema = z.object({
  evidence: z.object({
    id: z.string(),
    type: z.enum(["resume", "portfolio", "certificate", "project", "assessment", "activity", "experience"]),
    title: z.string(),
    sourceText: nullableString,
    createdAt: z.string(),
    capabilitySignals: z.array(evidenceSignalSchema),
  }),
  extractedSignals: z.array(evidenceSignalSchema),
  proposedStateUpdates: z.array(
    z.object({
      capabilityId: z.string(),
      proposedState: z.enum(["verified", "developing", "needs-proof", "gap", "unverified"]),
      reason: z.string(),
    })
  ),
});

const liveVerificationTaskSchema = z.object({
  id: z.string(),
  capabilityId: z.string(),
  capabilityName: z.string(),
  type: z.enum(["mcq", "scenario", "micro-task", "project-review"]),
  prompt: z.string(),
  options: z.array(z.string()).nullable(),
  rubric: nullableString,
});

const liveVerificationTasksSchema = z.object({ tasks: z.array(liveVerificationTaskSchema) });
const liveResourceRecommendationsSchema = z.object({
  recommendations: z.array(ResourceRecommendationSchema),
});

const liveJourneyAnswerSchema = z.object({
  answer: z.string(),
  citations: z.array(
    z.object({
      type: z.enum(["skill", "plan-item", "constraint", "evidence"]),
      label: z.string(),
      detail: z.string(),
    })
  ),
  isGeneralGuidance: z.boolean().nullable(),
});

const validatedDestinationGraphSchema = DestinationGraphSchema.superRefine(
  (graph, context) => {
    const ids = new Set(graph.capabilityNodes.map((node) => node.id));
    if (graph.capabilityNodes.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A destination graph must contain capability nodes.",
      });
    }
    if (ids.size !== graph.capabilityNodes.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Capability IDs must be unique.",
      });
    }
    const references = [
      ...graph.capabilityNodes.flatMap((node) => [...node.prerequisites, ...node.unlocks]),
      ...graph.proofExpectations.map((proof) => proof.capabilityId),
      ...graph.sharedFoundationNodeIds,
      ...graph.adjacentDestinations.flatMap((destination) => destination.sharedCapabilityIds),
    ];
    references.forEach((reference) => {
      if (!ids.has(reference)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown capability reference: ${reference}`,
        });
      }
    });
  }
);

type ModelTier = "mini" | "reasoning";
type Operation = keyof AIProvider;

interface OpenAIProviderConfig {
  apiKey: string;
  miniModel: string;
  reasoningModel: string;
}

interface StructuredRequest<TLive, TDomain> {
  operation: Operation;
  tier: ModelTier;
  system: string;
  payload: unknown;
  liveSchema: z.ZodType<TLive>;
  domainSchema: z.ZodType<TDomain>;
  normalize: (value: TLive) => unknown;
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new AIApplicationError({
      code: "AI_CONFIGURATION_ERROR",
      message: `Live SkillState intelligence requires ${name} to be configured on the server.`,
      operation: "configuration",
      retryable: false,
    });
  }
  return value;
}

function loadConfig(): OpenAIProviderConfig {
  return {
    apiKey: requiredEnvironment("OPENAI_API_KEY"),
    miniModel: requiredEnvironment("OPENAI_MINI_MODEL"),
    reasoningModel: requiredEnvironment("OPENAI_REASONING_MODEL"),
  };
}

function logEscalation(operation: Operation, reason: string) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[SkillState AI] Escalated ${operation}: ${reason}`);
  }
}

function escalationReason(meta: z.infer<typeof responseMetaSchema>): string | null {
  if (meta.confidence === "low") return "model reported low confidence";
  if (meta.evidenceContradictory) return "evidence is contradictory";
  if (meta.unresolvedMappings) return "mutually exclusive capability mappings remain unresolved";
  if (meta.ambiguous) return "verification or interpretation is explicitly ambiguous";
  return null;
}

function compact(value: unknown): string {
  return JSON.stringify(value);
}

export class OpenAIProvider implements AIProvider {
  private readonly config: OpenAIProviderConfig;
  private readonly client: OpenAI;

  constructor(config: OpenAIProviderConfig = loadConfig(), client?: OpenAI) {
    this.config = config;
    this.client = client ?? new OpenAI({ apiKey: config.apiKey });
  }

  private async structured<TLive, TDomain>(
    request: StructuredRequest<TLive, TDomain>
  ): Promise<TDomain> {
    const envelope = responseEnvelopeSchema(request.liveSchema);
    let tier = request.tier;
    let repair = false;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const model = tier === "reasoning" ? this.config.reasoningModel : this.config.miniModel;
      let response;
      try {
        response = await this.client.responses.parse({
          model,
          store: false,
          input: [
            { role: "developer", content: request.system },
            {
              role: "user",
              content: `${repair ? "Repair the prior invalid result. " : ""}Return only the requested structured result. Input: ${compact(request.payload)}`,
            },
          ],
          text: {
            format: zodTextFormat(envelope, `skillstate_${request.operation.replaceAll("-", "_")}`),
          },
        });
      } catch (error) {
        throw toAIApplicationError(error, request.operation);
      }

      const parsed = response.output_parsed;
      if (!parsed) {
        if (attempt === 0) {
          repair = true;
          continue;
        }
        throw new AIApplicationError({
          code: "AI_INVALID_OUTPUT",
          message: "SkillState received no usable structured response. Your current state was not changed.",
          operation: request.operation,
          retryable: true,
        });
      }

      let normalized: unknown;
      try {
        normalized = request.normalize(parsed.data as TLive);
      } catch {
        normalized = undefined;
      }
      const domainResult = request.domainSchema.safeParse(normalized);
      if (!domainResult.success) {
        if (process.env.NODE_ENV === "development") {
          console.info(
            `[SkillState AI] ${request.operation} validation issues:`,
            domainResult.error.issues.map((issue) => ({
              path: issue.path.join("."),
              code: issue.code,
              message: issue.message,
            }))
          );
        }
        if (attempt === 0) {
          repair = true;
          continue;
        }
        if (request.tier === "mini") {
          logEscalation(request.operation, "structured output failed validation twice; preserving current state");
        }
        throw new AIApplicationError({
          code: "AI_INVALID_OUTPUT",
          message: "SkillState could not validate the model response. Your current state was not changed.",
          operation: request.operation,
          retryable: true,
        });
      }

      const reason = tier === "mini" ? escalationReason(parsed.meta) : null;
      if (reason && attempt === 0) {
        logEscalation(request.operation, reason);
        tier = "reasoning";
        repair = false;
        continue;
      }

      return domainResult.data;
    }

    throw new AIApplicationError({
      code: "AI_INVALID_OUTPUT",
      message: "SkillState could not validate the model response. Your current state was not changed.",
      operation: request.operation,
      retryable: true,
    });
  }

  compileDestination(input: CompileDestinationInput): Promise<DestinationGraph> {
    return this.structured({
      operation: "compileDestination",
      tier: "reasoning",
      system: `${SYSTEM_PROMPT_DESTINATION_COMPILER} Use stable, slug-like IDs. Every prerequisite, unlock, proof capability, adjacent shared capability, and shared foundation reference must name an ID present in capabilityNodes.`,
      payload: input,
      liveSchema: liveDestinationGraphSchema,
      domainSchema: validatedDestinationGraphSchema,
      normalize: (graph) => ({
        ...graph,
        capabilityNodes: graph.capabilityNodes.map((node) => ({
          ...node,
          ...(node.stageExpected ? { stageExpected: node.stageExpected } : {}),
        })),
        adjacentDestinations: graph.adjacentDestinations.map((item) => ({
          id: item.id,
          title: item.title,
          descriptor: item.descriptor,
          sharedCapabilityIds: item.sharedCapabilityIds,
          ...(item.tone ? { tone: item.tone } : {}),
          ...(item.overlapPercentage === null ? {} : { overlapPercentage: item.overlapPercentage }),
        })),
        ...(graph.decisionPointMonths === null ? {} : { decisionPointMonths: graph.decisionPointMonths }),
      }),
    });
  }

  analyzeEvidence(input: EvidenceAnalysisInput): Promise<EvidenceAnalysisResult> {
    const allowedIds = new Set(input.destinationGraph.capabilityNodes.map((node) => node.id));
    const documentType = EvidenceTypeSchema.safeParse(input.documentType);
    return this.structured({
      operation: "analyzeEvidence",
      tier: "mini",
      system: SYSTEM_PROMPT_EVIDENCE_ANALYZER,
      payload: {
        documentText: input.documentText.slice(0, 24_000),
        documentType: input.documentType,
        filename: input.filename,
        capabilities: input.destinationGraph.capabilityNodes.map(({ id, name, description }) => ({ id, name, description })),
      },
      liveSchema: liveEvidenceAnalysisSchema,
      domainSchema: EvidenceAnalysisResultSchema,
      normalize: (result) => {
        const signals = result.extractedSignals.filter((signal) => allowedIds.has(signal.capabilityId));
        const evidenceSignals = result.evidence.capabilitySignals.filter((signal) => allowedIds.has(signal.capabilityId));
        return {
          evidence: {
            id: `evidence-${crypto.randomUUID()}`,
            type: documentType.success ? documentType.data : "resume",
            title: result.evidence.title,
            createdAt: new Date().toISOString(),
            capabilitySignals: evidenceSignals,
          },
          extractedSignals: signals,
          proposedStateUpdates: result.proposedStateUpdates.filter((update) => allowedIds.has(update.capabilityId)),
        };
      },
    });
  }

  generateVerification(input: VerificationRequest): Promise<VerificationTask[]> {
    const requestedIds = new Set(input.capabilityIds);
    return this.structured({
      operation: "generateVerification",
      tier: "mini",
      system: "Create exactly one high-value verification task for each supplied capability ID, up to three tasks. Copy every capability ID exactly from the request. Use MCQ, scenario, micro-task (short answer), or project-review. Rubrics must be observable and concise. Use options only for MCQ tasks.",
      payload: { capabilityIds: input.capabilityIds.slice(0, 12), context: input.context ?? "" },
      liveSchema: liveVerificationTasksSchema,
      domainSchema: VerificationTaskSchema.array().max(3),
      normalize: ({ tasks }) =>
        tasks
          .filter((task) => requestedIds.has(task.capabilityId))
          .slice(0, 3)
          .map(({ options, rubric, ...task }) => ({
            ...task,
            ...(options === null ? {} : { options }),
            ...(rubric === null ? {} : { rubric }),
          })),
    });
  }

  evaluateVerification(input: VerificationSubmission): Promise<VerificationResult> {
    return this.structured({
      operation: "evaluateVerification",
      tier: "mini",
      system: "Evaluate only the supplied task, rubric, learner response, target capability, active state, and relevant evidence. Do not infer unrelated gaps. A pass may propose verified; a failure may propose developing or gap. Mark meta.ambiguous true when the result cannot be resolved from the supplied material.",
      payload: input,
      liveSchema: VerificationResultSchema,
      domainSchema: VerificationResultSchema,
      normalize: (result) => {
        const previous = input.activeCapabilityState?.state ?? "unverified";
        const proposedState = result.passed
          ? previous === "verified" || result.strength === "high"
            ? "verified"
            : "developing"
          : result.proposedState === "gap"
            ? "gap"
            : "developing";
        return {
          ...result,
          taskId: input.taskId,
          capabilityId: input.capabilityId,
          proposedState,
          evidenceSignal: {
            ...result.evidenceSignal,
            capabilityId: input.capabilityId,
          },
        };
      },
    });
  }

  buildPlan(input: BuildPlanInput): Promise<AdaptivePlan> {
    return this.structured({
      operation: "buildPlan",
      tier: input.planningReason === "activity-completion" ? "mini" : "reasoning",
      system: `${SYSTEM_PROMPT_JOURNEY_PLANNER}${
        input.planningReason === "activity-completion"
          ? " This is a small activity-completion replan. Preserve unaffected actions and milestones, remove or advance only the completed objective and directly unlocked work."
          : ""
      }`,
      payload: {
        profile: input.profile,
        destination: {
          id: input.graph.destinationId,
          name: input.graph.destinationName,
          capabilities: input.graph.capabilityNodes,
          proofExpectations: input.graph.proofExpectations,
          experienceExpectations: input.graph.experienceExpectations,
          sharedFoundationNodeIds: input.graph.sharedFoundationNodeIds,
          decisionPointMonths: input.graph.decisionPointMonths,
        },
        verifiedStates: input.verifiedStates,
        claimedStates: input.claimedStates,
        gaps: input.gaps,
        planningReason: input.planningReason ?? "initial",
        currentPlan: input.currentPlan,
        triggerEvent: input.triggerEvent,
      },
      liveSchema: AdaptivePlanSchema,
      domainSchema: AdaptivePlanSchema,
      normalize: (plan) => ({ ...plan, now: plan.now.slice(0, 3), weeks: plan.weeks.slice(0, 4) }),
    });
  }

  async recommendResources(input: ResourceRequest): Promise<ResourceRecommendation[]> {
    const candidates = resourcesForCapability(input.gapCapabilityId).slice(0, 4);
    if (candidates.length === 0) return [];

    return this.structured({
      operation: "recommendResources",
      tier: "mini",
      system: "Explain why the supplied real resources match the stated gap and learner constraints. Never add, replace, rename, or invent a resource or URL.",
      payload: { gapCapabilityId: input.gapCapabilityId, learningPreference: input.learningPreference, availableMinutes: input.availableMinutes, candidates },
      liveSchema: liveResourceRecommendationsSchema,
      domainSchema: ResourceRecommendationSchema.array(),
      normalize: ({ recommendations }) =>
        recommendations.filter((item) =>
          candidates.some((candidate) => candidate.url === item.url && candidate.title === item.title)
        ),
    });
  }

  generateProgressReport(input: ProgressReportInput): Promise<ProgressReport> {
    return this.structured({
      operation: "generateProgressReport",
      tier: "mini",
      system: "Create a concise progress report using only supplied facts. Include all seven required sections. Do not invent mastery percentages, achievements, evidence, experience, or plan changes.",
      payload: {
        destination: input.graph.destinationName,
        capabilities: input.graph.capabilityNodes.map(({ id, name }) => ({ id, name })),
        verifiedStates: input.verifiedStates,
        gaps: input.gaps,
        evidence: input.evidence.map(({ id, type, title, capabilitySignals }) => ({ id, type, title, capabilitySignals })),
        recentEvents: input.activityLedger.slice(-10),
      },
      liveSchema: ProgressReportSchema,
      domainSchema: ProgressReportSchema,
      normalize: (report) => buildProgressReportFromState(input, report.nextSteps),
    });
  }

  answerJourneyQuestion(input: JourneyQuestion): Promise<JourneyAnswer> {
    const questionTerms = input.question.toLowerCase().split(/\W+/).filter((term) => term.length > 3);
    const relevantEvidence = (input.evidence ?? []).filter((item) => {
      const searchable = `${item.title} ${item.sourceText ?? ""}`.toLowerCase();
      return questionTerms.length === 0 || questionTerms.some((term) => searchable.includes(term));
    }).slice(0, 5);
    const relevantGaps = (input.gaps ?? []).slice(0, 6);

    return this.structured({
      operation: "answerJourneyQuestion",
      tier: "mini",
      system: "Answer Ask SkillState from the selected learner state only. Give conclusions and concise explanations, never hidden reasoning. Cite concrete state in a visible Based on list. If the question requires facts absent from state, label the answer as general guidance.",
      payload: {
        question: input.question,
        profile: input.profile,
        destination: input.destination,
        destinationCapabilities: input.destinationGraph?.capabilityNodes.map(({ id, name }) => ({ id, name })) ?? [],
        verifiedStates: input.verifiedStates ?? {},
        relevantEvidence,
        relevantGaps,
        currentActions: input.currentPlan.now,
        nextWeek: input.currentPlan.weeks[0] ?? null,
        recentEvents: input.recentEvents.slice(-5),
      },
      liveSchema: liveJourneyAnswerSchema,
      domainSchema: JourneyAnswerSchema,
      normalize: (answer) => ({
        answer: answer.answer,
        citations: answer.citations,
        ...(answer.isGeneralGuidance === null ? {} : { isGeneralGuidance: answer.isGeneralGuidance }),
      }),
    });
  }
}
