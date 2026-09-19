import { ZodSchema, ZodError } from "zod";

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationFailure {
  success: false;
  error: string;
  details: unknown;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Validates any raw data (e.g. from an AI provider or API handler)
 * against a Zod schema. Enforces non-negotiable rule:
 * "Keep all AI outputs behind Zod validation."
 */
export function validateWithSchema<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const zodError = result.error as ZodError;
  return {
    success: false,
    error: `Validation failed: ${zodError.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
    details: zodError.flatten(),
  };
}
