import { create } from "zustand";
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
import {
  SKILLSTATE_STATE_SCHEMA_VERSION,
  type LearnerStateSnapshot,
} from "@/persistence/schema";

export type PersistenceStatus = "idle" | "saving" | "saved" | "error";
export type OnboardingFlowStatus = "idle" | "submitting" | "navigating";

export interface SkillStateStoreState {
  _hasHydrated: boolean;
  _activeUserId: string | null;
  _remoteRevision: number | null;
  _persistenceStatus: PersistenceStatus;
  _persistenceError: string;
  _persistenceBlocked: boolean;
  _onboardingFlowStatus: OnboardingFlowStatus;
  onboardingCompleted: boolean;
  isDemoState: boolean;
  activePersonaId: DemoPersonaId | null;
  profile: LearnerProfile;
  destination: string;
  destinationGraph: DestinationGraph;
  destinationCatalog: Record<string, DestinationGraph>;
  recentDestinationIds: string[];
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
  beginRemoteHydration: (userId: string) => void;
  hydrateRemoteState: (userId: string, snapshot: LearnerStateSnapshot, revision: number) => void;
  completeEmptyRemoteHydration: (userId: string) => void;
  failRemoteHydration: (userId: string, message: string) => void;
  clearForAuthChange: () => void;
  setPersistenceResult: (status: PersistenceStatus, revision?: number, error?: string) => void;
  beginOnboardingSubmission: () => boolean;
  commitPersistedOnboarding: (
    userId: string,
    snapshot: LearnerStateSnapshot,
    revision: number
  ) => void;
  failOnboardingSubmission: () => void;
  finishOnboardingNavigation: () => void;
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
    destinationCatalog: {},
    recentDestinationIds: [],
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

export const useSkillStateStore = create<SkillStateStoreState>()(
    (set, get) => ({
      _hasHydrated: false,
      _activeUserId: null,
      _remoteRevision: null,
      _persistenceStatus: "idle",
      _persistenceError: "",
      _persistenceBlocked: false,
      _onboardingFlowStatus: "idle",
      ...emptyLearnerState(),

      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated });
      },

      beginRemoteHydration: (userId: string) => {
        set({
          ...emptyLearnerState(),
          _hasHydrated: false,
          _activeUserId: userId,
          _remoteRevision: null,
          _persistenceStatus: "idle",
          _persistenceError: "",
          _persistenceBlocked: true,
          _onboardingFlowStatus: "idle",
        });
      },

      hydrateRemoteState: (userId, snapshot, revision) => {
        set({
          ...snapshot,
          destinationCatalog: snapshot.destinationGraph.destinationId
            ? { ...snapshot.destinationCatalog, [snapshot.destinationGraph.destinationId]: snapshot.destinationGraph }
            : snapshot.destinationCatalog,
          isDemoState: false,
          activePersonaId: null,
          lastTransitionResult: undefined,
          _hasHydrated: true,
          _activeUserId: userId,
          _remoteRevision: revision,
          _persistenceStatus: "saved",
          _persistenceError: "",
          _persistenceBlocked: false,
          _onboardingFlowStatus: "idle",
        });
      },

      completeEmptyRemoteHydration: (userId) => {
        set({
          ...emptyLearnerState(),
          _hasHydrated: true,
          _activeUserId: userId,
          _remoteRevision: null,
          _persistenceStatus: "idle",
          _persistenceError: "",
          _persistenceBlocked: false,
          _onboardingFlowStatus: "idle",
        });
      },

      failRemoteHydration: (userId, message) => {
        set({
          ...emptyLearnerState(),
          _hasHydrated: false,
          _activeUserId: userId,
          _remoteRevision: null,
          _persistenceStatus: "error",
          _persistenceError: message,
          _persistenceBlocked: true,
          _onboardingFlowStatus: "idle",
        });
      },

      clearForAuthChange: () => {
        set({
          ...emptyLearnerState(),
          _hasHydrated: false,
          _activeUserId: null,
          _remoteRevision: null,
          _persistenceStatus: "idle",
          _persistenceError: "",
          _persistenceBlocked: true,
          _onboardingFlowStatus: "idle",
        });
      },

      setPersistenceResult: (status, revision, error = "") => {
        set((state) => ({
          _persistenceStatus: status,
          _persistenceError: error,
          _remoteRevision: revision ?? state._remoteRevision,
        }));
      },

      beginOnboardingSubmission: () => {
        if (get()._onboardingFlowStatus !== "idle") return false;
        set({ _onboardingFlowStatus: "submitting", _persistenceError: "" });
        return true;
      },

      commitPersistedOnboarding: (userId, snapshot, revision) => {
        set({
          ...snapshot,
          isDemoState: false,
          activePersonaId: null,
          lastTransitionResult: undefined,
          _hasHydrated: true,
          _activeUserId: userId,
          _remoteRevision: revision,
          _persistenceStatus: "saved",
          _persistenceError: "",
          _persistenceBlocked: false,
          _onboardingFlowStatus: "navigating",
        });
      },

      failOnboardingSubmission: () => {
        set({ _onboardingFlowStatus: "idle" });
      },

      finishOnboardingNavigation: () => {
        set({ _onboardingFlowStatus: "idle" });
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
          destinationCatalog: { [bundle.graph.destinationId]: bundle.graph },
          recentDestinationIds: [],
          claimedStates: bundle.claimedStates,
          verifiedStates: bundle.verifiedStates,
          evidence: bundle.evidence,
          gaps: bundle.gaps,
          plan: bundle.plan,
          activityLedger: bundle.activityLedger,
          lastTransitionResult: undefined,
          _hasHydrated: true,
          _activeUserId: null,
          _remoteRevision: null,
          _persistenceStatus: "idle",
          _persistenceError: "",
          _persistenceBlocked: true,
          _onboardingFlowStatus: "idle",
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
        const snapshot = createInitialLearnerSnapshot(profile, graph, evidence, plan);
        set({
          ...snapshot,
          isDemoState: false,
          activePersonaId: null,
          lastTransitionResult: undefined,
          _onboardingFlowStatus: "idle",
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
          destinationCatalog: {
            ...state.destinationCatalog,
            ...(state.destinationGraph.destinationId
              ? { [state.destinationGraph.destinationId]: state.destinationGraph }
              : {}),
            [newGraph.destinationId]: newGraph,
          },
          recentDestinationIds: state.destinationGraph.destinationId &&
            state.destinationGraph.destinationId !== newGraph.destinationId
            ? [
                state.destinationGraph.destinationId,
                ...state.recentDestinationIds.filter(
                  (id) => id !== state.destinationGraph.destinationId && id !== newGraph.destinationId
                ),
              ].slice(0, 6)
            : state.recentDestinationIds.filter((id) => id !== newGraph.destinationId),
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
        const state = get();
        set({
          ...emptyLearnerState(),
          _hasHydrated: true,
          _activeUserId: state._activeUserId,
          _remoteRevision: state._remoteRevision,
          _persistenceStatus: "idle",
          _persistenceError: "",
          _persistenceBlocked: false,
          _onboardingFlowStatus: "idle",
        });
      },

      restartOnboarding: () => {
        const state = get();
        set({
          ...emptyLearnerState(),
          _hasHydrated: true,
          _activeUserId: state._activeUserId,
          _remoteRevision: state._remoteRevision,
          _persistenceStatus: "idle",
          _persistenceError: "",
          _persistenceBlocked: false,
          _onboardingFlowStatus: "idle",
        });
      },
    })
);

export function learnerSnapshotFromState(
  state: SkillStateStoreState
): LearnerStateSnapshot {
  return {
    schemaVersion: SKILLSTATE_STATE_SCHEMA_VERSION,
    onboardingCompleted: state.onboardingCompleted,
    profile: state.profile,
    destination: state.destination,
    destinationGraph: state.destinationGraph,
    destinationCatalog: state.destinationCatalog,
    recentDestinationIds: state.recentDestinationIds,
    claimedStates: state.claimedStates,
    verifiedStates: state.verifiedStates,
    evidence: state.evidence,
    gaps: state.gaps,
    plan: state.plan,
    activityLedger: state.activityLedger,
    progressReports: state.progressReports,
  };
}

export function createInitialLearnerSnapshot(
  profile: LearnerProfile,
  graph: DestinationGraph,
  evidence: Evidence[],
  plan: AdaptivePlan
): LearnerStateSnapshot {
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

  return {
    schemaVersion: SKILLSTATE_STATE_SCHEMA_VERSION,
    onboardingCompleted: true,
    profile,
    destination: graph.destinationName,
    destinationGraph: graph,
    destinationCatalog: { [graph.destinationId]: graph },
    recentDestinationIds: [],
    claimedStates: {},
    verifiedStates,
    evidence,
    gaps,
    plan,
    activityLedger: [event],
    progressReports: [],
  };
}
