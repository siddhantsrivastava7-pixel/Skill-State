import { describe, expect, it } from "vitest";
import {
  isTrustedDemoRequest,
  liveAIRequiresAuthentication,
} from "@/auth/request-policy";

describe("server AI authentication policy", () => {
  it("requires authentication for live AI even when a demo header is spoofed", () => {
    expect(liveAIRequiresAuthentication("live")).toBe(true);
    expect(isTrustedDemoRequest("live", "1")).toBe(false);
  });

  it("allows an explicit demo request only when the server is not in live mode", () => {
    expect(isTrustedDemoRequest("demo", "1")).toBe(true);
    expect(isTrustedDemoRequest("demo", null)).toBe(false);
  });
});
