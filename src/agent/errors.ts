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

export class AIApplicationError extends Error {
  readonly payload: AIApplicationErrorPayload;

  constructor(payload: AIApplicationErrorPayload, options?: ErrorOptions) {
    super(payload.message, options);
    this.name = "AIApplicationError";
    this.payload = payload;
  }
}

export function toAIApplicationError(
  error: unknown,
  operation: string
): AIApplicationError {
  if (error instanceof AIApplicationError) return error;

  return new AIApplicationError(
    {
      code: "AI_PROVIDER_ERROR",
      message: "SkillState intelligence is temporarily unavailable. Your current state was not changed.",
      operation,
      retryable: true,
    },
    { cause: error }
  );
}
