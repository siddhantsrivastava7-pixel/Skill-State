import { describe, it, expect } from "vitest";
import { getDemoPersona, DEMO_PERSONAS } from "@/data/demo";

describe("Phase 4.2 Home Persona Content Isolation & State-Driven Data", () => {
  it("Persona B Home does not contain beginner tasks ('Python for Beginners' or 'Simple Calculator')", () => {
    const personaB = getDemoPersona("persona-b");

    // Check Today's Plan
    const todayPlanTitles = personaB.todayPlan.map((t) => t.title.toLowerCase());
    expect(todayPlanTitles.some((t) => t.includes("python for beginners"))).toBe(false);
    expect(todayPlanTitles.some((t) => t.includes("simple calculator"))).toBe(false);

    // Check Adaptive Plan Now actions
    const nowActionTitles = personaB.plan.now.map((a) => a.title.toLowerCase());
    expect(nowActionTitles.some((t) => t.includes("python for beginners"))).toBe(false);
    expect(nowActionTitles.some((t) => t.includes("simple calculator"))).toBe(false);

    // Verify Persona B has AI-engineer-stage tasks
    expect(todayPlanTitles.some((t) => t.includes("linear algebra"))).toBe(true);
    expect(todayPlanTitles.some((t) => t.includes("ml evaluation"))).toBe(true);
    expect(todayPlanTitles.some((t) => t.includes("deployable ml api"))).toBe(true);
  });

  it("Persona C Home does not contain tech/exploring terms ('Machine Learning', 'Data Engineer', 'Python Basics', or 'software domains')", () => {
    const personaC = getDemoPersona("persona-c");

    // Check all plan items
    const todayPlanText = personaC.todayPlan.map((t) => t.title).join(" ").toLowerCase();
    const recentActivitiesText = personaC.recentActivities.map((a) => a.title).join(" ").toLowerCase();
    const nowActionsText = personaC.plan.now.map((a) => `${a.title} ${a.description} ${a.whyNow}`).join(" ").toLowerCase();
    const adjacentDestText = (personaC.graph.adjacentDestinations || [])
      .map((d) => `${d.title} ${d.descriptor}`)
      .join(" ")
      .toLowerCase();

    const combinedPersonaCText = [
      todayPlanText,
      recentActivitiesText,
      nowActionsText,
      adjacentDestText,
    ].join(" ");

    expect(combinedPersonaCText).not.toContain("machine learning");
    expect(combinedPersonaCText).not.toContain("data engineer");
    expect(combinedPersonaCText).not.toContain("python basics");
    expect(combinedPersonaCText).not.toContain("software domains");
  });

  it("Persona C does contain Financial Analyst-specific plan, action, and activity content", () => {
    const personaC = getDemoPersona("persona-c");

    const todayPlanTitles = personaC.todayPlan.map((t) => t.title.toLowerCase());
    const recentActivityTitles = personaC.recentActivities.map((a) => a.title.toLowerCase());
    const nowActionTitles = personaC.plan.now.map((a) => a.title.toLowerCase());

    // Check Financial Analyst specific Today's Plan actions
    expect(todayPlanTitles.some((t) => t.includes("3-statement") || t.includes("three-statement"))).toBe(true);
    expect(todayPlanTitles.some((t) => t.includes("dcf") || t.includes("wacc"))).toBe(true);
    expect(todayPlanTitles.some((t) => t.includes("company analysis"))).toBe(true);
    expect(todayPlanTitles.some((t) => t.includes("investment") || t.includes("business summary"))).toBe(true);

    // Check Financial Analyst specific Recent Activity
    expect(recentActivityTitles.some((t) => t.includes("3-statement") || t.includes("excel"))).toBe(true);
    expect(recentActivityTitles.some((t) => t.includes("valuation") || t.includes("wacc"))).toBe(true);
    expect(recentActivityTitles.some((t) => t.includes("management consultant"))).toBe(true);

    // Check Adaptive Plan Now actions
    expect(nowActionTitles.some((t) => t.includes("3-statement") || t.includes("financial modeling"))).toBe(true);
  });

  it("Switching demo personas changes Today Plan and Recent Activity appropriately", () => {
    const personaA = DEMO_PERSONAS["persona-a"];
    const personaB = DEMO_PERSONAS["persona-b"];
    const personaC = DEMO_PERSONAS["persona-c"];

    // Ensure all 3 have distinct Today's Plan items
    const aToday = personaA.todayPlan.map((t) => t.id);
    const bToday = personaB.todayPlan.map((t) => t.id);
    const cToday = personaC.todayPlan.map((t) => t.id);

    expect(aToday).not.toEqual(bToday);
    expect(bToday).not.toEqual(cToday);
    expect(aToday).not.toEqual(cToday);

    // Ensure all 3 have distinct Recent Activities
    const aActivities = personaA.recentActivities.map((a) => a.id);
    const bActivities = personaB.recentActivities.map((a) => a.id);
    const cActivities = personaC.recentActivities.map((a) => a.id);

    expect(aActivities).not.toEqual(bActivities);
    expect(bActivities).not.toEqual(cActivities);
    expect(aActivities).not.toEqual(cActivities);

    // Verify persona titles match expected personas
    expect(personaA.todayPlan[0].title).toContain("Python for Beginners");
    expect(personaB.todayPlan[0].title).toContain("Linear algebra repair");
    expect(personaC.todayPlan[0].title).toContain("Build 3-statement");
  });
});
