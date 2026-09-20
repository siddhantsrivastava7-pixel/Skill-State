import { NextRequest, NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import { getAIProvider } from "@/agent/orchestrator";
import { AIApplicationError, toAIApplicationError } from "@/agent/errors";
import { logAIProviderFailure } from "@/agent/server-diagnostics";
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
import { resolveDestination, UnknownDestinationError } from "@/data/knowledge/resolution";
import { requireAuthenticatedUser, AuthenticationError } from "@/auth/server-auth";
import { createServerAdminClient } from "@/lib/supabase/server";
import { SupabaseGeneratedCareerCache } from "@/data/knowledge/supabase-generated-careers";
import {
  AIRequestLimitError,
  DuplicateAIRequestError,
  beginAIRequest,
  finishAIRequest,
  type AIRequestRecord,
} from "@/agent/request-guard";
import { isTrustedDemoRequest } from "@/auth/request-policy";

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
  const liveMode = process.env.SKILLSTATE_AI_MODE === "live";
  const demoRequest = isTrustedDemoRequest(
    process.env.SKILLSTATE_AI_MODE,
    request.headers.get("x-skillstate-demo")
  );
  let adminClient: ReturnType<typeof createServerAdminClient> | null = null;
  let requestRecord: AIRequestRecord | null = null;
  let authenticatedUserId: string | null = null;
  const supportedOperations = new Set([
    "compile-destination",
    "analyze-evidence",
    "generate-verification",
    "evaluate-verification",
    "build-plan",
    "resources",
    "progress-report",
    "ask",
  ]);
  if (!supportedOperations.has(operation)) {
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

  try {
    if (!demoRequest) {
      const user = await requireAuthenticatedUser(request);
      authenticatedUserId = user.id;
      if (liveMode) {
        adminClient = createServerAdminClient();
        requestRecord = await beginAIRequest(adminClient, {
          userId: user.id,
          operation,
          idempotencyKey: request.headers.get("x-idempotency-key") ?? "",
        });
      }
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AIApplicationError({
        code: "AI_INVALID_INPUT",
        message: "The request body must be valid JSON.",
        operation,
        retryable: false,
      });
    }
    let data: unknown;

    switch (operation) {
      case "compile-destination":
        data = await runValidated(body, CompileDestinationInputSchema, operation, async (input) => {
          const resolution = await resolveDestination(input, {
            allowCompilation: liveMode,
            provider: liveMode ? getAIProvider() : undefined,
            generatedCache: liveMode && adminClient
              ? new SupabaseGeneratedCareerCache(adminClient)
              : undefined,
            userId: authenticatedUserId ?? undefined,
          });
          return resolution.graph;
        });
        break;
      case "analyze-evidence":
        data = await runValidated(body, EvidenceAnalysisInputSchema, operation, (input) =>
          getAIProvider().analyzeEvidence(input)
        );
        break;
      case "generate-verification":
        data = await runValidated(body, VerificationRequestSchema, operation, (input) =>
          getAIProvider().generateVerification(input)
        );
        break;
      case "evaluate-verification":
        data = await runValidated(body, VerificationSubmissionSchema, operation, (input) =>
          getAIProvider().evaluateVerification(input)
        );
        break;
      case "build-plan":
        data = await runValidated(body, BuildPlanInputSchema, operation, (input) =>
          getAIProvider().buildPlan(input)
        );
        break;
      case "resources":
        data = await runValidated(body, ResourceRequestSchema, operation, (input) =>
          getAIProvider().recommendResources(input)
        );
        break;
      case "progress-report":
        data = await runValidated(body, ProgressReportInputSchema, operation, (input) =>
          getAIProvider().generateProgressReport(input)
        );
        break;
      case "ask":
        data = await runValidated(body, JourneyQuestionSchema, operation, (input) =>
          getAIProvider().answerJourneyQuestion(input)
        );
        break;
    }

    if (adminClient && requestRecord) {
      await finishAIRequest(adminClient, requestRecord, "succeeded");
    }
    return NextResponse.json({ data });
  } catch (error) {
    if (adminClient && requestRecord) {
      await finishAIRequest(adminClient, requestRecord, "failed");
    }
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: { code: "AUTH_REQUIRED", message: error.message, operation, retryable: false } },
        { status: 401 }
      );
    }
    if (error instanceof AIRequestLimitError || error instanceof DuplicateAIRequestError) {
      return NextResponse.json(
        { error: { code: "AI_RATE_LIMITED", message: error.message, operation, retryable: true } },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    if (error instanceof UnknownDestinationError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            operation,
            retryable: false,
          },
        },
        { status: 503 }
      );
    }
    const applicationError = toAIApplicationError(error, operation);
    logAIProviderFailure({
      operation,
      error: applicationError,
      requestId:
        request.headers.get("cf-ray") ??
        request.headers.get("x-request-id") ??
        request.headers.get("x-correlation-id"),
    });
    const status =
      applicationError.payload.code === "AI_INVALID_INPUT"
        ? 400
        : applicationError.payload.code === "AI_CONFIGURATION_ERROR"
          ? 503
          : 502;
    return NextResponse.json({ error: applicationError.payload }, { status });
  }
}
