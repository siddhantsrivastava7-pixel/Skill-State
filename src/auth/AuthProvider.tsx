"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { absoluteAppUrl } from "@/lib/app-path";
import {
  getBrowserSupabaseClient,
  isBrowserSupabaseConfigured,
} from "@/lib/supabase/browser";
import {
  LearnerStateRepository,
  SupabaseLearnerStateBackend,
} from "@/persistence/learner-state-repository";
import {
  LearnerStateSnapshotSchema,
  type LearnerStateSnapshot,
} from "@/persistence/schema";
import {
  OnboardingCommitCoordinator,
  persistCompletedOnboarding,
} from "@/persistence/onboarding-completion";
import {
  learnerSnapshotFromState,
  useSkillStateStore,
  type SkillStateStoreState,
} from "@/store/useSkillStateStore";
import { shouldPersistLearnerState } from "@/persistence/policy";
import { setClientDemoMode } from "@/auth/client-request";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "demo"
  | "configuration-error"
  | "remote-error";

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  error: string;
  isDemoMode: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  retryHydration: () => Promise<void>;
  completeOnboarding: (snapshot: LearnerStateSnapshot) => Promise<void>;
  flushLearnerState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const hydrationSequence = useRef(0);
  const sessionRef = useRef<Session | null>(null);
  const onboardingCoordinator = useRef(new OnboardingCommitCoordinator());
  const flushPersistenceRef = useRef<(() => Promise<void>) | null>(null);

  const hydrateSession = useCallback(async (nextSession: Session | null) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
    setError("");

    if (!nextSession) {
      ++hydrationSequence.current;
      onboardingCoordinator.current.supersede();
      useSkillStateStore.getState().clearForAuthChange();
      setStatus("unauthenticated");
      return;
    }

    const userId = nextSession.user.id;
    const currentState = useSkillStateStore.getState();
    if (onboardingCoordinator.current.isActiveFor(userId)) {
      setStatus("authenticated");
      return;
    }
    if (currentState._activeUserId === userId && currentState._hasHydrated) {
      setStatus("authenticated");
      return;
    }

    const sequence = ++hydrationSequence.current;
    useSkillStateStore.getState().beginRemoteHydration(userId);
    setStatus("loading");
    try {
      const repository = new LearnerStateRepository(
        new SupabaseLearnerStateBackend(getBrowserSupabaseClient())
      );
      const remote = await repository.load(userId);
      if (sequence !== hydrationSequence.current) return;
      if (remote) {
        useSkillStateStore.getState().hydrateRemoteState(
          userId,
          remote.snapshot,
          remote.revision
        );
      } else {
        useSkillStateStore.getState().completeEmptyRemoteHydration(userId);
      }
      setStatus("authenticated");
    } catch (loadError) {
      if (sequence !== hydrationSequence.current) return;
      const message = loadError instanceof Error
        ? loadError.message
        : "SkillState could not load your saved learner state.";
      useSkillStateStore.getState().failRemoteHydration(userId, message);
      setError(message);
      setStatus("remote-error");
    }
  }, []);

  useEffect(() => {
    const demoRequested = new URLSearchParams(window.location.search).get("demo") === "1";
    setClientDemoMode(demoRequested);
    setIsDemoMode(demoRequested);
    if (demoRequested) {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("persona");
      const persona = requested === "persona-b" || requested === "persona-c"
        ? requested
        : "persona-a";
      useSkillStateStore.getState().loadPersona(persona);
      setStatus("demo");
      return;
    }
    if (!isBrowserSupabaseConfigured()) {
      useSkillStateStore.getState().clearForAuthChange();
      setStatus("configuration-error");
      setError("SkillState authentication is not configured for this environment.");
      return;
    }

    const client = getBrowserSupabaseClient();
    let mounted = true;
    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) {
        setError("Your SkillState session could not be restored.");
        setStatus("unauthenticated");
        return;
      }
      void hydrateSession(data.session);
    });
    const { data } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted || event === "INITIAL_SESSION") return;
      if (event === "TOKEN_REFRESHED") {
        if (mounted && nextSession) {
          sessionRef.current = nextSession;
          setSession(nextSession);
        }
        return;
      }
      void hydrateSession(nextSession);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [hydrateSession]);

  useEffect(() => {
    if (status !== "authenticated" || !session || isDemoMode) return;
    const userId = session.user.id;
    const repository = new LearnerStateRepository(
      new SupabaseLearnerStateBackend(getBrowserSupabaseClient())
    );
    let revision = useSkillStateStore.getState()._remoteRevision;
    let baseline = JSON.stringify(
      learnerSnapshotFromState(useSkillStateStore.getState())
    );
    let timer: ReturnType<typeof setTimeout> | null = null;
    let activeFlush: Promise<void> | null = null;
    let pending: { serialized: string; state: SkillStateStoreState } | null = null;
    let disposed = false;

    const flush = async (): Promise<void> => {
      if (disposed) return;
      if (activeFlush) {
        await activeFlush;
        if (pending && !disposed) await flush();
        return;
      }
      if (!pending) return;
      const next = pending;
      pending = null;
      activeFlush = (async () => {
        const snapshot = learnerSnapshotFromState(next.state);
        useSkillStateStore.getState().setPersistenceResult("saving");
        try {
          const isEmpty = !snapshot.onboardingCompleted && !snapshot.profile.id;
          if (isEmpty) {
            await repository.delete(userId);
            revision = null;
          } else {
            const parsed = LearnerStateSnapshotSchema.parse(snapshot);
            revision = await repository.save(userId, parsed, revision);
          }
          baseline = next.serialized;
          if (useSkillStateStore.getState()._activeUserId === userId) {
            useSkillStateStore.getState().setPersistenceResult("saved", revision ?? undefined);
          }
        } catch (saveError) {
          const message = saveError instanceof Error
            ? saveError.message
            : "SkillState could not save your latest changes.";
          if (useSkillStateStore.getState()._activeUserId === userId) {
            useSkillStateStore.getState().setPersistenceResult("error", undefined, message);
          }
          throw saveError;
        }
      })();
      try {
        await activeFlush;
      } finally {
        activeFlush = null;
      }
      if (pending && !disposed) await flush();
    };

    flushPersistenceRef.current = async () => {
      if (timer) clearTimeout(timer);
      timer = null;
      await flush();
    };

    const unsubscribe = useSkillStateStore.subscribe((nextState) => {
      const snapshot = learnerSnapshotFromState(nextState);
      const serialized = JSON.stringify(snapshot);
      if (
        nextState._persistenceStatus === "saved" &&
        nextState._remoteRevision !== revision
      ) {
        revision = nextState._remoteRevision;
        baseline = serialized;
        pending = null;
        if (timer) clearTimeout(timer);
        timer = null;
        return;
      }
      if (!shouldPersistLearnerState(nextState, userId, isDemoMode)) return;
      if (serialized === baseline) return;
      pending = { serialized, state: nextState };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void flush().catch(() => undefined), 800);
    });

    return () => {
      disposed = true;
      flushPersistenceRef.current = null;
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [isDemoMode, session, status]);

  const flushLearnerState = useCallback(async () => {
    if (isDemoMode) return;
    const flush = flushPersistenceRef.current;
    if (!flush) throw new Error("SkillState sync is not ready yet.");
    await flush();
  }, [isDemoMode]);

  const completeOnboarding = useCallback(async (snapshot: LearnerStateSnapshot) => {
    const activeSession = sessionRef.current;
    if (!activeSession) throw new Error("Your session expired. Sign in and try again.");
    const userId = activeSession.user.id;
    if (snapshot.profile.id !== userId) {
      throw new Error("The onboarding profile does not match the signed-in learner.");
    }

    ++hydrationSequence.current;
    useSkillStateStore.getState().setPersistenceResult("saving");
    const repository = new LearnerStateRepository(
      new SupabaseLearnerStateBackend(getBrowserSupabaseClient())
    );
    const expectedRevision = useSkillStateStore.getState()._remoteRevision;

    try {
      await onboardingCoordinator.current.run(
        userId,
        () => persistCompletedOnboarding({
          repository,
          userId,
          snapshot,
          expectedRevision,
        }),
        (result) => {
          if (sessionRef.current?.user.id !== userId) {
            throw new Error("The signed-in learner changed during onboarding.");
          }
          useSkillStateStore.getState().commitPersistedOnboarding(
            userId,
            result.snapshot,
            result.revision
          );
        }
      );
    } catch (saveError) {
      if (useSkillStateStore.getState()._activeUserId === userId) {
        const message = saveError instanceof Error
          ? saveError.message
          : "SkillState could not save your completed onboarding.";
        useSkillStateStore.getState().setPersistenceResult("error", undefined, message);
      }
      throw saveError;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = absoluteAppUrl("/auth/callback/", window.location.origin);
    const { error: signInError } = await getBrowserSupabaseClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (signInError) throw signInError;
  }, []);

  const signOut = useCallback(async () => {
    onboardingCoordinator.current.supersede();
    sessionRef.current = null;
    useSkillStateStore.getState().clearForAuthChange();
    await getBrowserSupabaseClient().auth.signOut();
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  const retryHydration = useCallback(async () => {
    await hydrateSession(session);
  }, [hydrateSession, session]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    session,
    user: session?.user ?? null,
    error,
    isDemoMode,
    signInWithGoogle,
    signOut,
    retryHydration,
    completeOnboarding,
    flushLearnerState,
  }), [completeOnboarding, error, flushLearnerState, isDemoMode, retryHydration, session, signInWithGoogle, signOut, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider.");
  return value;
}
