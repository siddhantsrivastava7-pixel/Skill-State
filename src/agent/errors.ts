export type AIApplicationErrorCode =
  | "AI_CONFIGURATION_ERROR"
  | "AI_INVALID_INPUT"
  | "AI_INVALID_OUTPUT"
  | "AI_PROVIDER_ERROR"
  | "AI_REFUSAL";

export interface AIApplicationErrorPayload {
  code: AIApplicationErrorCode;
  message: string;
  operation: string;
  retryable: boolean;
}

export interface AIValidationIssueDiagnostic {
  path: string;
  code: string;
}

export interface AIErrorDiagnostics {
  configuredModel?: string;
  validationIssues?: AIValidationIssueDiagnostic[];
}

export class AIApplicationError extends Error {
  readonly payload: AIApplicationErrorPayload;
  readonly diagnostics?: AIErrorDiagnostics;

  constructor(
    payload: AIApplicationErrorPayload,
    options?: ErrorOptions,
    diagnostics?: AIErrorDiagnostics
  ) {
    super(payload.message, options);
    this.name = "AIApplicationError";
    this.payload = payload;
    this.diagnostics = diagnostics;
  }
}

export function toAIApplicationError(
  error: unknown,
  operation: string,
  diagnostics?: AIErrorDiagnostics
): AIApplicationError {
  if (error instanceof AIApplicationError) {
    if (!diagnostics || error.diagnostics) return error;
    return new AIApplicationError(error.payload, { cause: error.cause }, diagnostics);
  }

  return new AIApplicationError(
    {
      code: "AI_PROVIDER_ERROR",
      message: "SkillState intelligence is temporarily unavailable. Your current state was not changed.",
      operation,
      retryable: true,
    },
    { cause: error },
    diagnostics
  );
}
