import { NextRequest, NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import { getAIProvider } from "@/agent/orchestrator";
import { AIApplicationError, toAIApplicationError } from "@/agent/errors";
import {
  BuildPlanInputSchema,
  CompileDestinationInputSchema,
  EvidenceAnalysisInputSchema,
  JourneyQuestionSchema,
  ProgressReportInputSchema,
  ResourceRequestSchema,
  VerificationRequestSchema,
  VerificationSubmissionSchema,
} from "@/domain/schemas";

export const runtime = "nodejs";

async function runValidated<TInput, TOutput>(
  body: unknown,
  schema: ZodSchema<TInput>,
  operation: string,
  call: (input: TInput) => Promise<TOutput>
) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new AIApplicationError({
      code: "AI_INVALID_INPUT",
      message: "The SkillState request was incomplete or invalid.",
      operation,
      retryable: false,
    });
  }
  return call(parsed.data);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ operation: string }> }
) {
  const { operation } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "AI_INVALID_INPUT",
          message: "The request body must be valid JSON.",
          operation,
          retryable: false,
        },
      },
      { status: 400 }
    );
  }

  try {
    const provider = getAIProvider();
    let data: unknown;

    switch (operation) {
      case "compile-destination":
        data = await runValidated(body, CompileDestinationInputSchema, operation, (input) =>
          provider.compileDestination(input)
        );
        break;
      case "analyze-evidence":
        data = await runValidated(body, EvidenceAnalysisInputSchema, operation, (input) =>
          provider.analyzeEvidence(input)
        );
        break;
      case "generate-verification":
        data = await runValidated(body, VerificationRequestSchema, operation, (input) =>
          provider.generateVerification(input)
        );
        break;
      case "evaluate-verification":
        data = await runValidated(body, VerificationSubmissionSchema, operation, (input) =>
          provider.evaluateVerification(input)
        );
        break;
      case "build-plan":
        data = await runValidated(body, BuildPlanInputSchema, operation, (input) =>
          provider.buildPlan(input)
        );
        break;
      case "resources":
        data = await runValidated(body, ResourceRequestSchema, operation, (input) =>
          provider.recommendResources(input)
        );
        break;
      case "progress-report":
        data = await runValidated(body, ProgressReportInputSchema, operation, (input) =>
          provider.generateProgressReport(input)
        );
        break;
      case "ask":
        data = await runValidated(body, JourneyQuestionSchema, operation, (input) =>
          provider.answerJourneyQuestion(input)
        );
        break;
      default:
        return NextResponse.json(
          {
            error: {
              code: "AI_INVALID_INPUT",
              message: "Unknown SkillState intelligence operation.",
              operation,
              retryable: false,
            },
          },
          { status: 404 }
        );
    }

    return NextResponse.json({ data });
  } catch (error) {
    const applicationError = toAIApplicationError(error, operation);
    const status =
      applicationError.payload.code === "AI_INVALID_INPUT"
        ? 400
        : applicationError.payload.code === "AI_CONFIGURATION_ERROR"
          ? 503
          : 502;
    return NextResponse.json({ error: applicationError.payload }, { status });
  }
}
