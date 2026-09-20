import "server-only";

import { AIApplicationError, type AIValidationIssueDiagnostic } from "./errors";

interface ProviderFailureContext {
  operation: string;
  error: AIApplicationError;
  requestId?: string | null;
}

type UnknownRecord = Record<string, unknown>;

const LOGGABLE_ERROR_CODES = new Set([
  "AI_CONFIGURATION_ERROR",
  "AI_INVALID_OUTPUT",
  "AI_PROVIDER_ERROR",
  "AI_REFUSAL",
]);

const SAFE_MESSAGE_CATEGORIES: Array<[RegExp, string]> = [
  [/model[_\s-]?not[_\s-]?found/i, "model_not_found"],
  [/(?:invalid[_\s-]?api[_\s-]?key|incorrect api key)/i, "invalid_api_key"],
  [/unsupported[_\s-]?parameter/i, "unsupported_parameter"],
  [/(?:rate[_\s-]?limit[_\s-]?exceeded|rate limit)/i, "rate_limit_exceeded"],
  [/(?:schema.*validat|validat.*schema)/i, "schema_validation_failure"],
];

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null ? value as UnknownRecord : null;
}

function safeToken(value: unknown, maximumLength = 160): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maximumLength || !/^[a-zA-Z0-9._:/-]+$/.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

function safeConstructorName(value: unknown): string | undefined {
  const constructor = asRecord(value)?.constructor;
  return typeof constructor === "function" ? safeToken(constructor.name) : undefined;
}

function readNestedToken(record: UnknownRecord | null, key: string): string | undefined {
  const direct = safeToken(record?.[key]);
  if (direct) return direct;
  return safeToken(asRecord(record?.error)?.[key]);
}

function readStatus(record: UnknownRecord | null): number | undefined {
  const nested = asRecord(record?.error);
  const candidates = [record?.status, record?.statusCode, nested?.status, nested?.statusCode];
  return candidates.find(
    (value): value is number => typeof value === "number" && Number.isInteger(value) && value >= 100 && value <= 599
  );
}

function providerCause(error: AIApplicationError): unknown {
  let candidate: unknown = error.cause ?? error;
  while (candidate instanceof AIApplicationError && candidate.cause) {
    candidate = candidate.cause;
  }
  return candidate;
}

function safeMessageCategory(error: unknown): string | undefined {
  const message = asRecord(error)?.message;
  if (typeof message !== "string") return undefined;
  return SAFE_MESSAGE_CATEGORIES.find(([pattern]) => pattern.test(message))?.[1];
}

function validationSummary(
  issues: AIValidationIssueDiagnostic[] | undefined,
  providerError: unknown
) {
  const rawIssues = issues ?? (() => {
    const value = asRecord(providerError)?.issues;
    if (!Array.isArray(value)) return undefined;
    return value.map((issue) => {
      const record = asRecord(issue);
      const rawPath = record?.path;
      return {
        path: Array.isArray(rawPath)
          ? rawPath.filter((part) => typeof part === "string" || typeof part === "number").join(".")
          : "",
        code: safeToken(record?.code) ?? "unknown",
      };
    });
  })();

  if (!rawIssues?.length) return undefined;
  return {
    issueCount: rawIssues.length,
    issues: rawIssues.slice(0, 10).map((issue) => ({
      path: safeToken(issue.path) ?? "unknown",
      code: safeToken(issue.code) ?? "unknown",
    })),
  };
}

function configuredModelForOperation(operation: string): string | undefined {
  const reasoningOperations = new Set(["compile-destination", "compileDestination", "build-plan", "buildPlan"]);
  const variable = reasoningOperations.has(operation) ? "OPENAI_REASONING_MODEL" : "OPENAI_MINI_MODEL";
  return process.env[variable]?.trim() || undefined;
}

export function logAIProviderFailure({ operation, error, requestId }: ProviderFailureContext): void {
  if (!LOGGABLE_ERROR_CODES.has(error.payload.code)) return;

  const original = providerCause(error);
  const record = asRecord(original);
  const constructorName = safeConstructorName(original);
  const errorName = safeToken(record?.name) ?? constructorName ?? "UnknownError";
  const validation = validationSummary(error.diagnostics?.validationIssues, original);
  const diagnostic = {
    event: "skillstate_ai_provider_failure",
    operation,
    errorClass: constructorName ?? errorName,
    errorName,
    errorCode: readNestedToken(record, "code"),
    upstreamStatus: readStatus(record),
    upstreamErrorType: readNestedToken(record, "type"),
    safeMessage: safeMessageCategory(original),
    configuredModel: error.diagnostics?.configuredModel ?? configuredModelForOperation(operation),
    requiredEnvironmentPresent: {
      OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY?.trim()),
      OPENAI_MINI_MODEL: Boolean(process.env.OPENAI_MINI_MODEL?.trim()),
      OPENAI_REASONING_MODEL: Boolean(process.env.OPENAI_REASONING_MODEL?.trim()),
    },
    validation,
    requestId: safeToken(requestId, 200),
  };

  console.error(`[SkillState AI] ${JSON.stringify(diagnostic)}`);
}
