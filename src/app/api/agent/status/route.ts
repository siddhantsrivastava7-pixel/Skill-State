import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const mode = process.env.SKILLSTATE_AI_MODE?.trim().toLowerCase() === "live"
    ? "live"
    : "demo";

  if (mode === "demo") {
    return NextResponse.json({ mode, status: "ready" });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const miniModel = process.env.OPENAI_MINI_MODEL?.trim();
  const reasoningModel = process.env.OPENAI_REASONING_MODEL?.trim();

  if (!apiKey || !miniModel || !reasoningModel) {
    return NextResponse.json(
      { mode, status: "not-configured" },
      { status: 503 }
    );
  }

  try {
    const client = new OpenAI({ apiKey, timeout: 5_000, maxRetries: 0 });
    await client.models.retrieve(miniModel);
    return NextResponse.json({ mode, status: "connected" });
  } catch {
    return NextResponse.json(
      { mode, status: "unavailable" },
      { status: 503 }
    );
  }
}
