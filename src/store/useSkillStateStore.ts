import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  ActivityEvent,
  AdaptivePlan,
  DestinationGraph,
  Evidence,
  Gap,
  LearnerProfile,
  ProgressReport,
  SkillClaim,
  VerificationResult,
  VerifiedCapabilityState,
} from "@/domain/types";
import {
  DemoPersonaId,
  getDemoPersona,
  personaAProfile,
  personaAGraph,
  personaAClaims,
  personaAEvidence,
  personaAVerifiedStates,
  personaAGaps,
  personaAPlan,
} from "@/data/demo";
import { prioritizeGaps } from "@/domain/prioritization";
import { preserveEvidenceOnDestinationChange } from "@/domain/destination-switch";

export interface SkillStateStoreState {
  _hasHydrated: boolean;
  activePersonaId: DemoPersonaId;
  profile: LearnerProfile;
  destination: string;
  destinationGraph: DestinationGraph;
  claimedStates: Record<string, SkillClaim>;
  verifiedStates: Record<string, VerifiedCapabilityState>;
  evidence: Evidence[];
  gaps: Gap[];
  plan: AdaptivePlan;
  activityLedger: ActivityEvent[];
  progressReports: ProgressReport[];

  // Actions
  setHasHydrated: (state: boolean) => void;
  loadPersona: (personaId: DemoPersonaId) => void;
  setProfile: (profile: LearnerProfile) => void;
  changeDestination: (destinationName: string, newGraph: DestinationGraph) => void;
  addEvidence: (newEvidence: Evidence) => void;
  updateSkillClaim: (claim: SkillClaim) => void;
  updateVerifiedState: (state: VerifiedCapabilityState) => void;
  recordVerificationResult: (result: VerificationResult) => void;
  replan: () => void;
  resetStore: () => void;
}

const initialBundle = getDemoPersona("persona-a");

export const useSkillStateStore = create<SkillStateStoreState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      activePersonaId: "persona-a",
      profile: initialBundle.profile,
      destination: initialBundle.graph.destinationName,
      destinationGraph: initialBundle.graph,
      claimedStates: initialBundle.claimedStates,
      verifiedStates: initialBundle.verifiedStates,
      evidence: initialBundle.evidence,
      gaps: initialBundle.gaps,
      plan: initialBundle.plan,
      activityLedger: initialBundle.activityLedger,
      progressReports: [],

      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated });
      },

      loadPersona: (personaId: DemoPersonaId) => {
        const bundle = getDemoPersona(personaId);
        set({
          activePersonaId: personaId,
          profile: bundle.profile,
          destination: bundle.graph.destinationName,
          destinationGraph: bundle.graph,
          claimedStates: bundle.claimedStates,
          verifiedStates: bundle.verifiedStates,
          evidence: bundle.evidence,
          gaps: bundle.gaps,
          plan: bundle.plan,
          activityLedger: bundle.activityLedger,
        });
      },

      setProfile: (profile: LearnerProfile) => {
        set({ profile });
      },

      changeDestination: (destinationName: string, newGraph: DestinationGraph) => {
        const state = get();
        const switchResult = preserveEvidenceOnDestinationChange({
          currentEvidence: state.evidence,
          currentVerifiedStates: state.verifiedStates,
          currentClaimedStates: state.claimedStates,
          newGraph,
          targetTimelineMonths: state.profile.targetTimelineMonths,
        });

        const event: ActivityEvent = {
          id: `event-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "DESTINATION_CHANGED",
          title: `Destination changed to ${destinationName}`,
          description: `Preserved ${switchResult.preservedFoundationCount} existing foundation(s). Identified ${switchResult.newRequirementCount} new requirement(s).`,
        };

        set({
          destination: destinationName,
          destinationGraph: newGraph,
          evidence: switchResult.preservedEvidence,
          claimedStates: switchResult.preservedClaimedStates,
          verifiedStates: switchResult.updatedVerifiedStates,
          gaps: switchResult.recomputedGaps,
          activityLedger: [...state.activityLedger, event],
        });
      },

      addEvidence: (newEvidence: Evidence) => {
        const state = get();
        const updatedEvidence = [...state.evidence, newEvidence];
        const updatedVerified = { ...state.verifiedStates };

        for (const sig of newEvidence.capabilitySignals) {
          const current = updatedVerified[sig.capabilityId];
          const prevEvidenceIds = current?.evidenceIds ?? [];
          const newEvidenceIds = prevEvidenceIds.includes(newEvidence.id)
            ? prevEvidenceIds
            : [...prevEvidenceIds, newEvidence.id];

          let newState = current?.state ?? "needs-proof";
          if (sig.signal === "supports") {
            newState = sig.strength === "high" ? "verified" : "needs-proof";
          } else if (sig.signal === "weakens") {
            newState = "developing";
          }

          updatedVerified[sig.capabilityId] = {
            capabilityId: sig.capabilityId,
            state: newState,
            evidenceIds: newEvidenceIds,
            explanation: sig.explanation,
            lastUpdatedAt: new Date().toISOString(),
          };
        }

        const recomputedGaps = prioritizeGaps({
          graph: state.destinationGraph,
          verifiedStates: updatedVerified,
          claimedStates: state.claimedStates,
          targetTimelineMonths: state.profile.targetTimelineMonths,
        });

        const event: ActivityEvent = {
          id: `event-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "EVIDENCE_ADDED",
          title: `Evidence added: ${newEvidence.title}`,
          description: `Extracted ${newEvidence.capabilitySignals.length} capability signal(s).`,
        };

        set({
          evidence: updatedEvidence,
          verifiedStates: updatedVerified,
          gaps: recomputedGaps,
          activityLedger: [...state.activityLedger, event],
        });
      },

      updateSkillClaim: (claim: SkillClaim) => {
        const state = get();
        const updatedClaims = {
          ...state.claimedStates,
          [claim.capabilityId]: claim,
        };

        const recomputedGaps = prioritizeGaps({
          graph: state.destinationGraph,
          verifiedStates: state.verifiedStates,
          claimedStates: updatedClaims,
          targetTimelineMonths: state.profile.targetTimelineMonths,
        });

        const event: ActivityEvent = {
          id: `event-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "SKILL_CLAIM_CHANGED",
          title: `Claim updated for ${claim.capabilityId}`,
          description: `Self-reported level set to ${claim.selfReportedLevel}.`,
        };

        set({
          claimedStates: updatedClaims,
          gaps: recomputedGaps,
          activityLedger: [...state.activityLedger, event],
        });
      },

      updateVerifiedState: (newVerifiedState: VerifiedCapabilityState) => {
        const state = get();
        const updated = {
          ...state.verifiedStates,
          [newVerifiedState.capabilityId]: newVerifiedState,
        };
        const recomputedGaps = prioritizeGaps({
          graph: state.destinationGraph,
          verifiedStates: updated,
          claimedStates: state.claimedStates,
          targetTimelineMonths: state.profile.targetTimelineMonths,
        });
        set({
          verifiedStates: updated,
          gaps: recomputedGaps,
        });
      },

      recordVerificationResult: (result: VerificationResult) => {
        const state = get();
        const capId = result.capabilityId;
        const current = state.verifiedStates[capId];
        const newEvidenceId = `ev-verif-${Date.now()}`;

        const verifEvidence: Evidence = {
          id: newEvidenceId,
          type: "assessment",
          title: `Verification Assessment: ${capId}`,
          createdAt: new Date().toISOString(),
          capabilitySignals: [result.evidenceSignal],
        };

        const updatedVerified = {
          ...state.verifiedStates,
          [capId]: {
            capabilityId: capId,
            state: result.proposedState,
            evidenceIds: [...(current?.evidenceIds ?? []), newEvidenceId],
            explanation: result.explanation,
            lastUpdatedAt: new Date().toISOString(),
          },
        };

        const recomputedGaps = prioritizeGaps({
          graph: state.destinationGraph,
          verifiedStates: updatedVerified,
          claimedStates: state.claimedStates,
          targetTimelineMonths: state.profile.targetTimelineMonths,
        });

        const event: ActivityEvent = {
          id: `event-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "VERIFICATION_COMPLETED",
          title: `Verification completed for ${capId}`,
          description: `${result.passed ? "Passed" : "Identified need for reinforcement"}: ${result.explanation}. Plan impact: ${result.planImpact}`,
        };

        set({
          evidence: [...state.evidence, verifEvidence],
          verifiedStates: updatedVerified,
          gaps: recomputedGaps,
          activityLedger: [...state.activityLedger, event],
        });
      },

      replan: () => {
        const state = get();
        const recomputedGaps = prioritizeGaps({
          graph: state.destinationGraph,
          verifiedStates: state.verifiedStates,
          claimedStates: state.claimedStates,
          targetTimelineMonths: state.profile.targetTimelineMonths,
        });
        set({ gaps: recomputedGaps });
      },

      resetStore: () => {
        set({
          activePersonaId: "persona-a",
          profile: personaAProfile,
          destination: personaAGraph.destinationName,
          destinationGraph: personaAGraph,
          claimedStates: personaAClaims,
          verifiedStates: personaAVerifiedStates,
          evidence: personaAEvidence,
          gaps: personaAGaps,
          plan: personaAPlan,
          activityLedger: [
            {
              id: `event-${Date.now()}`,
              timestamp: new Date().toISOString(),
              type: "DESTINATION_CHANGED",
              title: "Store reset to default Persona A",
              description: "Cleared local mutations.",
            },
          ],
          progressReports: [],
        });
      },
    }),
    {
      name: "skillstate_demo_store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activePersonaId: state.activePersonaId,
        profile: state.profile,
        destination: state.destination,
        destinationGraph: state.destinationGraph,
        claimedStates: state.claimedStates,
        verifiedStates: state.verifiedStates,
        evidence: state.evidence,
        gaps: state.gaps,
        plan: state.plan,
        activityLedger: state.activityLedger,
        progressReports: state.progressReports,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
