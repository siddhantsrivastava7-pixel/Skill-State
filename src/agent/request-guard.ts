import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export class AIRequestLimitError extends Error {
  constructor(message = "SkillState AI request limit reached. Please try again later.") {
    super(message);
    this.name = "AIRequestLimitError";
  }
}

export class DuplicateAIRequestError extends Error {
  constructor() {
    super("This SkillState AI request is already being processed.");
    this.name = "DuplicateAIRequestError";
  }
}

export interface AIRequestRecord {
  id: string;
  startedAt: number;
}

function configuredHourlyLimit(): number {
  const parsed = Number(process.env.SKILLSTATE_AI_REQUEST_LIMIT_PER_HOUR ?? "60");
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 60;
}

export async function beginAIRequest(
  client: SupabaseClient,
  input: { userId: string; operation: string; idempotencyKey: string }
): Promise<AIRequestRecord> {
  if (!input.idempotencyKey || input.idempotencyKey.length > 200) {
    throw new DuplicateAIRequestError();
  }
  const startedAt = Date.now();
  const createdAfter = new Date(startedAt - 60 * 60 * 1_000).toISOString();
  const { count, error: countError } = await client
    .from("skillstate_ai_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .gte("created_at", createdAfter);
  if (countError) throw countError;
  if ((count ?? 0) >= configuredHourlyLimit()) throw new AIRequestLimitError();

  const { data, error } = await client
    .from("skillstate_ai_requests")
    .insert({
      user_id: input.userId,
      operation: input.operation,
      idempotency_key: input.idempotencyKey,
      status: "started",
    })
    .select("id")
    .single();
  if (error?.code === "23505") throw new DuplicateAIRequestError();
  if (error || !data?.id) throw error ?? new Error("AI request could not be registered.");
  return { id: data.id, startedAt };
}

export async function finishAIRequest(
  client: SupabaseClient,
  record: AIRequestRecord,
  status: "succeeded" | "failed"
): Promise<void> {
  const { error } = await client
    .from("skillstate_ai_requests")
    .update({ status, duration_ms: Date.now() - record.startedAt })
    .eq("id", record.id);
  if (error && process.env.NODE_ENV === "development") {
    console.info("[SkillState AI] request log update failed", { requestId: record.id });
  }
}
