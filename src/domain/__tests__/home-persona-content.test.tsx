import React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { DEMO_PERSONAS, DemoPersonaId } from "@/data/demo";
import { TodayPlanStrip } from "@/components/home/TodayPlanStrip";
import { RecentActivityStrip } from "@/components/home/RecentActivityStrip";
import { CompactSkillStrip, deriveCompactSkills } from "@/components/home/CompactSkillStrip";

function LowerInformationStrip({ personaId }: { personaId: DemoPersonaId }) {
  const persona = DEMO_PERSONAS[personaId];
  const compactSkills = deriveCompactSkills(
    persona.graph.capabilityNodes,
    persona.verifiedStates,
    persona.evidence
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
      <CompactSkillStrip skills={compactSkills} />
      <TodayPlanStrip actions={persona.plan.now} />
      <RecentActivityStrip activities={persona.activityLedger} />
    </div>
  );
}

describe("Phase 4.3 Unified Persona-Driven Home Strips", () => {
  it("renders exactly one Today's Plan heading on Home", () => {
    for (const id of ["persona-a", "persona-b", "persona-c"] as DemoPersonaId[]) {
      const html = renderToString(<LowerInformationStrip personaId={id} />);
      const todayMatches = html.match(/Today(?:'|&#x27;|'|&#39;)s Plan/g) || [];
      expect(todayMatches.length).toBe(1);
    }
  });

  it("renders exactly one Recent Activity heading on Home", () => {
    for (const id of ["persona-a", "persona-b", "persona-c"] as DemoPersonaId[]) {
      const html = renderToString(<LowerInformationStrip personaId={id} />);
      const activityMatches = html.match(/Recent Activity/g) || [];
      expect(activityMatches.length).toBe(1);
    }
  });

  it("Persona B does not render Simple Calculator, DCF/WACC, or finance actions", () => {
    const htmlB = renderToString(<LowerInformationStrip personaId="persona-b" />);

    // Should NOT contain Persona A beginner actions
    expect(htmlB).not.toContain("Simple Calculator");
    expect(htmlB).not.toContain("Python for Beginners");

    // Should NOT contain Persona C finance actions
    expect(htmlB).not.toContain("DCF/WACC");
    expect(htmlB).not.toContain("3-statement");
    expect(htmlB).not.toContain("Corporate Valuation");
    expect(htmlB).not.toContain("Management Consultant");

    // Must contain Persona B AI/ML actions and activity
    expect(htmlB).toContain("Linear algebra repair");
    expect(htmlB).toContain("ML evaluation proof");
    expect(htmlB).toContain("Deployable ML API project");
    expect(htmlB).toContain("Python ML project");
    expect(htmlB).toContain("ML model evaluation");
  });

  it("Persona C does not render Python for Beginners, Linear algebra repair, or ML actions", () => {
    const htmlC = renderToString(<LowerInformationStrip personaId="persona-c" />);

    // Should NOT contain Persona A beginner actions
    expect(htmlC).not.toContain("Python for Beginners");
    expect(htmlC).not.toContain("Simple Calculator");

    // Should NOT contain Persona B actions or ML activity
    expect(htmlC).not.toContain("Linear algebra repair");
    expect(htmlC).not.toContain("ML evaluation proof");
    expect(htmlC).not.toContain("Deployable ML API project");
    expect(htmlC).not.toContain("Python ML project");
    expect(htmlC).not.toContain("ML model evaluation");

    // Must contain Persona C finance actions and activity
    expect(htmlC).toContain("3-statement model");
    expect(htmlC).toContain("DCF/WACC");
    expect(htmlC).toContain("company analysis");
    expect(htmlC).toContain("written financial/business summary");
    expect(htmlC).toContain("3-statement Excel model");
    expect(htmlC).toContain("Corporate Valuation &amp; WACC case");
  });

  it("Persona A does not render Persona B/C actions", () => {
    const htmlA = renderToString(<LowerInformationStrip personaId="persona-a" />);

    // Must contain Persona A actions
    expect(htmlA).toContain("Python for Beginners");
    expect(htmlA).toContain("Simple Calculator");
    expect(htmlA).toContain("Variables &amp; Data Types");

    // Should NOT contain Persona B actions
    expect(htmlA).not.toContain("Linear algebra repair");
    expect(htmlA).not.toContain("ML evaluation proof");
    expect(htmlA).not.toContain("Deployable ML API project");

    // Should NOT contain Persona C actions
    expect(htmlA).not.toContain("3-statement model");
    expect(htmlA).not.toContain("DCF/WACC");
    expect(htmlA).not.toContain("Corporate Valuation");
  });

  it("switching demo personas replaces the plan contents rather than adding another plan component", () => {
    // Initial Persona A render
    const htmlA = renderToString(<LowerInformationStrip personaId="persona-a" />);
    const countA = (htmlA.match(/Today(?:'|&#x27;|'|&#39;)s Plan/g) || []).length;
    expect(countA).toBe(1);
    expect(htmlA).toContain("Python for Beginners");
    expect(htmlA).not.toContain("Linear algebra repair");

    // Switch to Persona B: same component tree, replaced data
    const htmlB = renderToString(<LowerInformationStrip personaId="persona-b" />);
    const countB = (htmlB.match(/Today(?:'|&#x27;|'|&#39;)s Plan/g) || []).length;
    expect(countB).toBe(1);
    expect(htmlB).toContain("Linear algebra repair");
    expect(htmlB).not.toContain("Python for Beginners");

    // Switch to Persona C: same component tree, replaced data
    const htmlC = renderToString(<LowerInformationStrip personaId="persona-c" />);
    const countC = (htmlC.match(/Today(?:'|&#x27;|'|&#39;)s Plan/g) || []).length;
    expect(countC).toBe(1);
    expect(htmlC).toContain("3-statement model");
    expect(htmlC).not.toContain("Linear algebra repair");
    expect(htmlC).not.toContain("Python for Beginners");
  });
});
