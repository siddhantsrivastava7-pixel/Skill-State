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
import { LearnerStateSnapshotSchema } from "@/persistence/schema";
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
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const hydrationSequence = useRef(0);

  const hydrateSession = useCallback(async (nextSession: Session | null) => {
    const sequence = ++hydrationSequence.current;
    setSession(nextSession);
    setError("");

    if (!nextSession) {
      useSkillStateStore.getState().clearForAuthChange();
      setStatus("unauthenticated");
      return;
    }

    const userId = nextSession.user.id;
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
        if (mounted && nextSession) setSession(nextSession);
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
    let inFlight = false;
    let pending: { serialized: string; state: SkillStateStoreState } | null = null;
    let disposed = false;

    const flush = async () => {
      if (disposed || inFlight || !pending) return;
      const next = pending;
      pending = null;
      inFlight = true;
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
      } finally {
        inFlight = false;
        if (pending && !disposed) void flush();
      }
    };

    const unsubscribe = useSkillStateStore.subscribe((nextState) => {
      if (!shouldPersistLearnerState(nextState, userId, isDemoMode)) return;
      const snapshot = learnerSnapshotFromState(nextState);
      const serialized = JSON.stringify(snapshot);
      if (serialized === baseline) return;
      pending = { serialized, state: nextState };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void flush(), 800);
    });

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [isDemoMode, session, status]);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = absoluteAppUrl("/auth/callback/", window.location.origin);
    const { error: signInError } = await getBrowserSupabaseClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (signInError) throw signInError;
  }, []);

  const signOut = useCallback(async () => {
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
  }), [error, isDemoMode, retryHydration, session, signInWithGoogle, signOut, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider.");
  return value;
}
