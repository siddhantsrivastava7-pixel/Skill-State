import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/auth/server-auth", () => {
  class AuthenticationError extends Error {}
  return {
    AuthenticationError,
    requireAuthenticatedUser: vi.fn().mockRejectedValue(new AuthenticationError("Session required")),
  };
});
const mocks = vi.hoisted(() => ({ getAIProvider: vi.fn() }));
vi.mock("@/agent/orchestrator", () => ({ getAIProvider: mocks.getAIProvider }));

describe("live AI route authentication", () => {
  afterEach(() => {
    delete process.env.SKILLSTATE_AI_MODE;
    vi.clearAllMocks();
  });

  it("returns 401 before invoking a provider when no bearer session is present", async () => {
    process.env.SKILLSTATE_AI_MODE = "live";
    const { POST } = await import("@/app/api/agent/[operation]/route");
    const request = new NextRequest("http://localhost/skillstate/api/agent/compile-destination", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-skillstate-demo": "1",
      },
      body: JSON.stringify({
        stage: "college",
        certainty: "exact",
        statedDestination: "Product Designer",
        interests: [],
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ operation: "compile-destination" }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: { code: "AUTH_REQUIRED", retryable: false },
    });
    expect(mocks.getAIProvider).not.toHaveBeenCalled();
  });
});
