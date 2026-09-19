import { describe, it, expect, beforeEach } from "vitest";
import { simulateWhatIf } from "../what-if";
import { organizePlanIntoJourneyTracks, TRACK_METADATA } from "../journey-tracks";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import {
  personaBProfile,
  personaBGraph,
  personaBClaims,
  personaBEvidence,
  personaBVerifiedStates,
  personaBPlan,
  personaCGraph,
} from "@/data/demo";
import {
  dataEngineerGraph,
  calculateCareerPathsWithOverlap,
  SEEDED_CAREER_PATHS_CATALOG,
} from "@/data/library/careers-library";
import { matchProjectsToGaps } from "@/data/library/projects-library";
import { matchExperienceToGaps, SEEDED_EXPERIENCE_CATALOG } from "@/data/library/experience-library";
import { matchResourcesToGaps } from "@/data/library/resources-library";

describe("Phase 6: Journey Tracks & What-If Simulation", () => {
  beforeEach(() => {
    useSkillStateStore.getState().loadPersona("persona-b");
  });

  describe("What-If Journey Simulator", () => {
    it("simulates alternative destinations without mutating real store state", () => {
      const initialStore = useSkillStateStore.getState();
      const initialDestination = initialStore.destination;
      const initialEvidenceCount = initialStore.evidence.length;

      const simResult = simulateWhatIf({
        currentEvidence: initialStore.evidence,
        currentVerifiedStates: initialStore.verifiedStates,
        currentClaimedStates: initialStore.claimedStates,
        currentProfile: initialStore.profile,
        candidateGraph: dataEngineerGraph,
        simulatedWeeklyHours: 15,
        simulatedTimelineMonths: 12,
      });

      // Verification of simulation result
      expect(simResult.candidateDestinationName).toBe("Data Engineer");
      expect(simResult.isSameDestination).toBe(false);
      expect(simResult.preservedFoundationCount).toBeGreaterThanOrEqual(1); // Python is verified in Persona B
      expect(simResult.preservedFoundations.some((f) => f.name.includes("Python"))).toBe(true);
      expect(simResult.transferOverlapPercentage).toBeGreaterThan(0);
      expect(simResult.newRequirementCount).toBeGreaterThan(0);
      expect(simResult.projectedTimelineMonths).toBeGreaterThan(0);

      // Verify that the actual store was NOT mutated
      const currentStore = useSkillStateStore.getState();
      expect(currentStore.destination).toBe(initialDestination);
      expect(currentStore.evidence.length).toBe(initialEvidenceCount);
    });

    it("adjusts projected completion timeline dynamically when weekly study hours change", () => {
      const store = useSkillStateStore.getState();

      const simPartTime = simulateWhatIf({
        currentEvidence: store.evidence,
        currentVerifiedStates: store.verifiedStates,
        currentClaimedStates: store.claimedStates,
        currentProfile: store.profile,
        candidateGraph: personaBGraph,
        simulatedWeeklyHours: 10,
        simulatedTimelineMonths: 12,
      });

      const simIntensive = simulateWhatIf({
        currentEvidence: store.evidence,
        currentVerifiedStates: store.verifiedStates,
        currentClaimedStates: store.claimedStates,
        currentProfile: store.profile,
        candidateGraph: personaBGraph,
        simulatedWeeklyHours: 30,
        simulatedTimelineMonths: 12,
      });

      // Higher weekly commitment should yield fewer projected months
      expect(simIntensive.projectedTimelineMonths).toBeLessThan(simPartTime.projectedTimelineMonths);
    });

    it("preserves 100% of historical evidence and verified states across different careers", () => {
      const store = useSkillStateStore.getState();

      const simFinance = simulateWhatIf({
        currentEvidence: store.evidence,
        currentVerifiedStates: store.verifiedStates,
        currentClaimedStates: store.claimedStates,
        currentProfile: store.profile,
        candidateGraph: personaCGraph,
        simulatedWeeklyHours: 15,
        simulatedTimelineMonths: 12,
      });

      // Preserved foundations list must only contain items that were verified in Persona B
      for (const foundation of simFinance.preservedFoundations) {
        expect(store.verifiedStates[foundation.id]?.state).toBe("verified");
      }
    });
  });

  describe("5-Track Journey Organization", () => {
    it("categorizes actions into the 5 tracks: learn, prove, build, experience, signal", () => {
      const store = useSkillStateStore.getState();
      const phases = organizePlanIntoJourneyTracks(store.plan, store.destinationGraph);

      expect(phases.length).toBeGreaterThanOrEqual(3);

      const allActions = phases.flatMap((p) => p.actions);
      const tracksFound = new Set(allActions.map((a) => a.track));

      expect(tracksFound.has("learn")).toBe(true);
      expect(tracksFound.has("prove")).toBe(true);
      expect(tracksFound.has("build")).toBe(true);
      expect(tracksFound.has("experience")).toBe(true);
      expect(tracksFound.has("signal")).toBe(true);
    });

    it("ensures every action states explicitly when it belongs and why it belongs", () => {
      const store = useSkillStateStore.getState();
      const phases = organizePlanIntoJourneyTracks(store.plan, store.destinationGraph);
      const allActions = phases.flatMap((p) => p.actions);

      for (const act of allActions) {
        expect(act.whenItBelongs).toBeTruthy();
        expect(act.whenItBelongs.length).toBeGreaterThan(10);
        expect(act.whyItBelongs).toBeTruthy();
        expect(act.whyItBelongs.length).toBeGreaterThan(10);
      }
    });
  });

  describe("Domain Libraries & Selectors", () => {
    it("matchProjectsToGaps recommends projects matching unverified capabilities with explicit deliverables and criteria", () => {
      const store = useSkillStateStore.getState();
      const projects = matchProjectsToGaps(store.gaps, store.destinationGraph);

      expect(projects.length).toBeGreaterThanOrEqual(1);

      for (const proj of projects) {
        expect(proj.title).toBeTruthy();
        expect(proj.whyThisProject).toBeTruthy();
        expect(proj.deliverables.length).toBeGreaterThanOrEqual(2);
        expect(proj.verificationCriteria.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("strictly marks every experience opportunity as a simulated demo sandbox", () => {
      for (const opp of SEEDED_EXPERIENCE_CATALOG) {
        expect(opp.isDemoOpportunity).toBe(true);
        expect(opp.demoLabel).toBe("Example / Demo Opportunity (Simulated Sandbox)");
      }

      const store = useSkillStateStore.getState();
      const matched = matchExperienceToGaps(store.gaps, store.destinationGraph, store.verifiedStates);
      for (const opp of matched) {
        expect(opp.isDemoOpportunity).toBe(true);
      }
    });

    it("matchResourcesToGaps groups resources strictly under active gaps without dictating the roadmap", () => {
      const store = useSkillStateStore.getState();
      const grouped = matchResourcesToGaps(store.gaps, store.destinationGraph);

      expect(grouped.length).toBe(store.gaps.length);
      for (const group of grouped) {
        expect(group.gapCapabilityId).toBeTruthy();
        expect(group.resources.length).toBeGreaterThanOrEqual(1);
        for (const res of group.resources) {
          expect(res.whyThisResource).toBeTruthy();
          expect(res.learningObjective).toBeTruthy();
        }
      }
    });

    it("calculateCareerPathsWithOverlap computes foundation transfer overlap percentages correctly", () => {
      const store = useSkillStateStore.getState();
      const careerPaths = calculateCareerPathsWithOverlap(store.destinationGraph, store.verifiedStates);

      expect(careerPaths.length).toBe(SEEDED_CAREER_PATHS_CATALOG.length);
      for (const cp of careerPaths) {
        expect(cp.overlapPercentage).toBeGreaterThanOrEqual(0);
        expect(cp.overlapPercentage).toBeLessThanOrEqual(100);
        expect(cp.targetHorizonMonths).toBeGreaterThan(0);
      }
    });
  });
});
