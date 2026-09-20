import { afterEach, describe, expect, it, vi } from "vitest";
import { AIApplicationError, toAIApplicationError } from "@/agent/errors";

vi.mock("server-only", () => ({}));

describe("server AI diagnostics", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MINI_MODEL;
    delete process.env.OPENAI_REASONING_MODEL;
  });

  it("logs safe provider metadata without secrets or raw messages", async () => {
    process.env.OPENAI_API_KEY = "sk-must-not-be-logged";
    process.env.OPENAI_MINI_MODEL = "mini-model-from-environment";
    process.env.OPENAI_REASONING_MODEL = "reasoning-model-from-environment";
    const providerError = Object.assign(
      new Error("invalid_api_key: sk-must-not-be-logged learner evidence must stay private"),
      {
        name: "AuthenticationError",
        code: "invalid_api_key",
        status: 401,
        type: "invalid_request_error",
      }
    );
    const applicationError = toAIApplicationError(providerError, "compileDestination", {
      configuredModel: "reasoning-model-from-environment",
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { logAIProviderFailure } = await import("@/agent/server-diagnostics");

    logAIProviderFailure({
      operation: "compile-destination",
      error: applicationError,
      requestId: "request-safe-123",
    });

    expect(consoleError).toHaveBeenCalledOnce();
    const output = String(consoleError.mock.calls[0][0]);
    expect(output).toContain('"operation":"compile-destination"');
    expect(output).toContain('"errorClass":"Error"');
    expect(output).toContain('"errorName":"AuthenticationError"');
    expect(output).toContain('"errorCode":"invalid_api_key"');
    expect(output).toContain('"upstreamStatus":401');
    expect(output).toContain('"upstreamErrorType":"invalid_request_error"');
    expect(output).toContain('"safeMessage":"invalid_api_key"');
    expect(output).toContain('"configuredModel":"reasoning-model-from-environment"');
    expect(output).toContain('"OPENAI_API_KEY":true');
    expect(output).toContain('"requestId":"request-safe-123"');
    expect(output).not.toContain("sk-must-not-be-logged");
    expect(output).not.toContain("learner evidence");
    expect(JSON.stringify(applicationError.payload)).toBe(
      '{"code":"AI_PROVIDER_ERROR","message":"SkillState intelligence is temporarily unavailable. Your current state was not changed.","operation":"compileDestination","retryable":true}'
    );
  });

  it("summarizes validation failures without logging issue messages", async () => {
    const applicationError = new AIApplicationError(
      {
        code: "AI_INVALID_OUTPUT",
        message: "Generic browser-safe error",
        operation: "compileDestination",
        retryable: true,
      },
      undefined,
      {
        configuredModel: "reasoning-model-from-environment",
        validationIssues: [
          { path: "capabilityNodes.0.id", code: "custom" },
          { path: "proofExpectations.0.capabilityId", code: "invalid_type" },
        ],
      }
    );
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { logAIProviderFailure } = await import("@/agent/server-diagnostics");

    logAIProviderFailure({ operation: "compile-destination", error: applicationError });

    const output = String(consoleError.mock.calls[0][0]);
    expect(output).toContain('"issueCount":2');
    expect(output).toContain('"path":"capabilityNodes.0.id"');
    expect(output).toContain('"code":"invalid_type"');
    expect(output).not.toContain("Generic browser-safe error");
  });
});
