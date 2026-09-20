import { describe, expect, it } from "vitest";
import { absoluteAppUrl, withBasePath } from "./app-path";

describe("SkillState base path", () => {
  it("prefixes direct API requests without duplicating the product path", () => {
    expect(withBasePath("/api/agent/status")).toBe("/skillstate/api/agent/status");
    expect(withBasePath("/skillstate/api/agent/status")).toBe("/skillstate/api/agent/status");
  });

  it("builds the required production OAuth callback URL", () => {
    expect(absoluteAppUrl("/auth/callback/", "https://sidbuilds.com")).toBe(
      "https://sidbuilds.com/skillstate/auth/callback/"
    );
  });
});
