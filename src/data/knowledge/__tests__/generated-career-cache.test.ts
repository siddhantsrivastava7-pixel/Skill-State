import { describe, expect, it, vi } from "vitest";
import type { GeneratedCareerCache } from "@/data/knowledge/supabase-generated-careers";
import { resolveDestination } from "@/data/knowledge/resolution";
import { uxResearcherGraph } from "@/domain/__tests__/fixtures/ux-researcher";

function cache(overrides: Partial<GeneratedCareerCache> = {}): GeneratedCareerCache {
  return {
    findGraphByTitleOrAlias: vi.fn().mockResolvedValue(null),
    saveValidated: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

const novelGraph = {
  ...uxResearcherGraph,
  destinationId: "astrobiology-field-systems-designer",
  destinationName: "Astrobiology Field Systems Designer",
};

const novelInput = {
  stage: "college" as const,
  certainty: "exact" as const,
  statedDestination: "Astrobiology Field Systems Designer",
  interests: ["research"],
};

describe("generated career resolution cache", () => {
  it("returns a validated cache hit without calling Destination Compiler", async () => {
    const generatedCache = cache({
      findGraphByTitleOrAlias: vi.fn().mockResolvedValue(novelGraph),
    });
    const compileDestination = vi.fn();

    const result = await resolveDestination(novelInput, {
      allowCompilation: true,
      provider: { compileDestination },
      generatedCache,
      userId: "user-a",
    });

    expect(result.source).toBe("generated-cache");
    expect(result.graph).toEqual(novelGraph);
    expect(compileDestination).not.toHaveBeenCalled();
    expect(generatedCache.saveValidated).not.toHaveBeenCalled();
  });

  it("compiles, validates, reconciles, and saves a cache miss", async () => {
    const generatedCache = cache();
    const compileDestination = vi.fn().mockResolvedValue(novelGraph);

    const result = await resolveDestination(novelInput, {
      allowCompilation: true,
      provider: { compileDestination },
      generatedCache,
      userId: "user-a",
    });

    expect(result.source).toBe("generated");
    expect(compileDestination).toHaveBeenCalledOnce();
    expect(generatedCache.saveValidated).toHaveBeenCalledOnce();
    expect(result.persisted).toBe(true);
  });

  it("resolves a static v1.1 career before touching DB cache or AI", async () => {
    const generatedCache = cache();
    const compileDestination = vi.fn();

    const result = await resolveDestination({
      stage: "professional",
      certainty: "exact",
      statedDestination: "Product Designer",
      interests: [],
    }, {
      allowCompilation: true,
      provider: { compileDestination },
      generatedCache,
      userId: "user-a",
    });

    expect(result.source).toBe("shared-knowledge");
    expect(generatedCache.findGraphByTitleOrAlias).not.toHaveBeenCalled();
    expect(compileDestination).not.toHaveBeenCalled();
  });
});
