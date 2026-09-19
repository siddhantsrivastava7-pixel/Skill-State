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
  VerificationSubmission,
  VerifiedCapabilityState,
} from "@/domain/types";
import {
  DemoPersonaId,
  getDemoPersona,
} from "@/data/demo";
import { prioritizeGaps } from "@/domain/prioritization";
import { preserveEvidenceOnDestinationChange } from "@/domain/destination-switch";
import {
  executeVerificationTransition,
  VerificationTransitionResult,
} from "@/domain/state-transition";
import {
  applyEvidenceToVerifiedStates,
  deriveVerifiedStates,
} from "@/domain/evidence-transition";

export interface SkillStateStoreState {
  _hasHydrated: boolean;
  onboardingCompleted: boolean;
  isDemoState: boolean;
  activePersonaId: DemoPersonaId | null;
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
  lastTransitionResult?: VerificationTransitionResult;

  // Actions
  setHasHydrated: (state: boolean) => void;
  loadPersona: (personaId: DemoPersonaId) => void;
  setProfile: (profile: LearnerProfile) => void;
  setPlan: (plan: AdaptivePlan) => void;
  addProgressReport: (report: ProgressReport) => void;
  initializeJourney: (
    profile: LearnerProfile,
    graph: DestinationGraph,
    evidence: Evidence[],
    plan: AdaptivePlan
  ) => void;
  changeDestination: (destinationName: string, newGraph: DestinationGraph) => void;
  addEvidence: (newEvidence: Evidence) => void;
  updateSkillClaim: (claim: SkillClaim) => void;
  updateVerifiedState: (state: VerifiedCapabilityState) => void;
  recordVerificationResult: (
    result: VerificationResult,
    submission?: VerificationSubmission
  ) => VerificationTransitionResult;
  completeAction: (actionId: string) => void;
  clearLastTransition: () => void;
  replan: () => void;
  resetStore: () => void;
  restartOnboarding: () => void;
}

const EMPTY_PROFILE: LearnerProfile = {
  id: "",
  name: "",
  stage: "college",
  weeklyHours: 10,
  learningPreference: "balanced",
  destinationCertainty: "exact",
  interests: [],
};

const EMPTY_GRAPH: DestinationGraph = {
  destinationId: "",
  destinationName: "",
  summary: "",
  confidence: "low",
  capabilityNodes: [],
  proofExpectations: [],
  experienceExpectations: [],
  adjacentDestinations: [],
  sharedFoundationNodeIds: [],
};

const EMPTY_PLAN: AdaptivePlan = {
  generatedAt: new Date(0).toISOString(),
  summary: "",
  now: [],
  weeks: [],
  milestones: [],
};

function emptyLearnerState() {
  return {
    onboardingCompleted: false,
    isDemoState: false,
    activePersonaId: null,
    profile: EMPTY_PROFILE,
    destination: "",
    destinationGraph: EMPTY_GRAPH,
    claimedStates: {},
    verifiedStates: {},
    evidence: [],
    gaps: [],
    plan: EMPTY_PLAN,
    activityLedger: [],
    progressReports: [],
    lastTransitionResult: undefined,
  };
}

function reconcileVerifiedStates(
  graph: DestinationGraph,
  evidence: Evidence[],
  claimedStates: Record<string, SkillClaim>,
  persistedStates: Record<string, VerifiedCapabilityState>
) {
  const reconciled = deriveVerifiedStates(graph, evidence, claimedStates);
  for (const node of graph.capabilityNodes) {
    const persisted = persistedStates[node.id];
    if (persisted && (persisted.state !== "unverified" || persisted.evidenceIds.length > 0)) {
      reconciled[node.id] = persisted;
    }
  }
  return reconciled;
}

export const useSkillStateStore = create<SkillStateStoreState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      ...emptyLearnerState(),

      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated });
      },

      loadPersona: (personaId: DemoPersonaId) => {
        const bundle = getDemoPersona(personaId);
        set({
          onboardingCompleted: true,
          isDemoState: true,
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
          lastTransitionResult: undefined,
        });
      },

      setProfile: (profile: LearnerProfile) => {
        const state = get();
        if (profile.weeklyHours !== state.profile.weeklyHours) {
          const event: ActivityEvent = {
            id: `event-hours-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: "TIME_BUDGET_CHANGED",
            title: "Weekly time budget changed",
            description: `Weekly time changed from ${state.profile.weeklyHours} to ${profile.weeklyHours} hours.`,
          };
          set({ profile, activityLedger: [...state.activityLedger, event] });
          return;
        }
        set({ profile });
      },

      setPlan: (plan: AdaptivePlan) => {
        set({ plan });
      },

      addProgressReport: (report: ProgressReport) => {
        const state = get();
        set({ progressReports: [...state.progressReports, report] });
      },

      initializeJourney: (profile, graph, evidence, plan) => {
        const verifiedStates = deriveVerifiedStates(graph, evidence, {});
        const gaps = prioritizeGaps({
          graph,
          verifiedStates,
          claimedStates: {},
          targetTimelineMonths: profile.targetTimelineMonths,
        });
        const event: ActivityEvent = {
          id: `event-journey-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "DESTINATION_CHANGED",
          title: `Journey created for ${graph.destinationName}`,
          description: `Compiled ${graph.capabilityNodes.length} destination capabilities and created an evidence-aware plan.`,
        };
        set({
          onboardingCompleted: true,
          isDemoState: false,
          activePersonaId: null,
          profile,
          destination: graph.destinationName,
          destinationGraph: graph,
          claimedStates: {},
          verifiedStates,
          evidence,
          gaps,
          plan,
          activityLedger: [event],
          progressReports: [],
          lastTransitionResult: undefined,
        });
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
          lastTransitionResult: undefined,
        });
      },

      addEvidence: (newEvidence: Evidence) => {
        const state = get();
        const updatedEvidence = [...state.evidence, newEvidence];
        const updatedVerified = applyEvidenceToVerifiedStates(
          state.verifiedStates,
          newEvidence,
          state.destinationGraph
        );

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

      recordVerificationResult: (
        result: VerificationResult,
        submission?: VerificationSubmission
      ) => {
        const state = get();
        const capId = result.capabilityId;
        const sub: VerificationSubmission = submission ?? {
          taskId: `task-${capId}`,
          capabilityId: capId,
          userResponse: "Verification task completed",
        };

        const transitionResult = executeVerificationTransition({
          submission: sub,
          evaluationResult: result,
          currentVerifiedStates: state.verifiedStates,
          currentClaims: state.claimedStates,
          currentEvidence: state.evidence,
          currentPlan: state.plan,
          graph: state.destinationGraph,
          targetTimelineMonths: state.profile.targetTimelineMonths,
        });

        set({
          evidence: [...state.evidence, transitionResult.newEvidence],
          verifiedStates: transitionResult.updatedVerifiedStates,
          gaps: transitionResult.recomputedGaps,
          plan: transitionResult.updatedPlan,
          activityLedger: [...state.activityLedger, transitionResult.activityEvent],
          lastTransitionResult: transitionResult,
        });

        return transitionResult;
      },

      completeAction: (actionId: string) => {
        const state = get();
        const action = [
          ...state.plan.now,
          ...state.plan.weeks.flatMap((week) => week.actions),
        ].find((item) => item.id === actionId);
        if (!action || action.status === "done" || action.status === "verified") return;

        const status = action.category === "prove" ? "attempted" as const : "done" as const;
        const update = (item: AdaptivePlan["now"][number]) =>
          item.id === actionId ? { ...item, status } : item;
        const plan: AdaptivePlan = {
          ...state.plan,
          now: state.plan.now.map(update),
          weeks: state.plan.weeks.map((week) => ({
            ...week,
            actions: week.actions.map(update),
          })),
        };
        const event: ActivityEvent = {
          id: `event-activity-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "ACTIVITY_COMPLETED",
          title: action.category === "prove" ? `Proof attempted: ${action.title}` : `Activity completed: ${action.title}`,
          description:
            action.category === "prove"
              ? "The proof activity was attempted; capability verification still depends on evaluation."
              : `${action.title} was completed. Completion records activity but does not automatically verify a capability.`,
          metadata: { actionId, category: action.category, status },
        };
        set({ plan, activityLedger: [...state.activityLedger, event] });
      },

      clearLastTransition: () => {
        set({ lastTransitionResult: undefined });
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
        set(emptyLearnerState());
      },

      restartOnboarding: () => {
        set(emptyLearnerState());
      },
    }),
    {
      name: "skillstate_demo_store",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        onboardingCompleted: state.onboardingCompleted,
        isDemoState: state.isDemoState,
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
      migrate: (persistedState) => {
        const persisted = persistedState as Partial<SkillStateStoreState>;
        const profileId = persisted.profile?.id ?? "";
        const hasCompletedState = Boolean(
          profileId &&
            persisted.destinationGraph?.destinationId &&
            persisted.destinationGraph.capabilityNodes.length > 0
        );
        const inferredDemoState = ["persona-a", "persona-b", "persona-c"].includes(profileId);
        const isDemoState = persisted.isDemoState ?? inferredDemoState;
        const graph = persisted.destinationGraph ?? EMPTY_GRAPH;
        const evidence = persisted.evidence ?? [];
        const claimedStates = persisted.claimedStates ?? {};
        const verifiedStates = reconcileVerifiedStates(
          graph,
          evidence,
          claimedStates,
          persisted.verifiedStates ?? {}
        );
        const gaps = isDemoState
          ? (persisted.gaps ?? [])
          : prioritizeGaps({
              graph,
              verifiedStates,
              claimedStates,
              targetTimelineMonths: persisted.profile?.targetTimelineMonths,
            });
        return {
          ...emptyLearnerState(),
          ...persisted,
          onboardingCompleted:
            persisted.onboardingCompleted ?? hasCompletedState,
          isDemoState,
          activePersonaId: inferredDemoState
            ? (profileId as DemoPersonaId)
            : null,
          verifiedStates,
          gaps,
        } as SkillStateStoreState;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
