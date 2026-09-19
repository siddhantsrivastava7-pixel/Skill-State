"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { TopCommandBar } from "./TopCommandBar";
import { MobileBottomNav } from "./MobileBottomNav";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, Sparkles } from "lucide-react";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import { getClientAIProvider } from "@/agent/client-provider";
import { hasUsableLearnerState } from "@/domain/onboarding-routing";

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [askQuery, setAskQuery] = useState("");
  const [askAnswer, setAskAnswer] = useState<{
    answer: string;
    citations: { type: string; label: string; detail: string }[];
  } | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [locationReady, setLocationReady] = useState(false);
  const [demoModeRequested, setDemoModeRequested] = useState(false);

  const hasHydrated = useSkillStateStore((s) => s._hasHydrated);
  const onboardingCompleted = useSkillStateStore((s) => s.onboardingCompleted);
  const isDemoState = useSkillStateStore((s) => s.isDemoState);
  const profile = useSkillStateStore((s) => s.profile);
  const destination = useSkillStateStore((s) => s.destination);
  const plan = useSkillStateStore((s) => s.plan);
  const activityLedger = useSkillStateStore((s) => s.activityLedger);
  const destinationGraph = useSkillStateStore((s) => s.destinationGraph);
  const verifiedStates = useSkillStateStore((s) => s.verifiedStates);
  const evidence = useSkillStateStore((s) => s.evidence);
  const gaps = useSkillStateStore((s) => s.gaps);

  useEffect(() => {
    setDemoModeRequested(new URLSearchParams(window.location.search).get("demo") === "1");
    setLocationReady(true);
  }, [pathname]);

  const isOnboardingRoute = pathname === "/onboarding";
  const hasAccess = hasUsableLearnerState({
    onboardingCompleted,
    hasCompletedProfile: Boolean(
      profile.id &&
        destinationGraph.destinationId &&
        destinationGraph.capabilityNodes.length > 0
    ),
    isDemoState,
    demoModeRequested,
  });

  useEffect(() => {
    if (hasHydrated && locationReady && !isOnboardingRoute && !hasAccess) {
      router.replace("/onboarding");
    }
  }, [hasAccess, hasHydrated, isOnboardingRoute, locationReady, router]);

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuery.trim()) return;

    setIsAnswering(true);
    try {
      const provider = getClientAIProvider();
      const response = await provider.answerJourneyQuestion({
        question: askQuery,
        profile,
        destination,
        currentPlan: plan,
        recentEvents: activityLedger,
        destinationGraph,
        verifiedStates,
        evidence,
        gaps,
      });
      setAskAnswer(response);
    } catch {
      setAskAnswer({
        answer: "Could not retrieve answer. Please try again.",
        citations: [],
      });
    } finally {
      setIsAnswering(false);
    }
  };

  if (!hasHydrated || (!isOnboardingRoute && (!locationReady || !hasAccess))) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-6">
        <p className="text-sm text-ink-muted">
          {hasHydrated ? "Taking you to onboarding…" : "Loading SkillState…"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Desktop Sidebar */}
      <AppSidebar />

      {/* Top Command Bar */}
      <TopCommandBar onOpenAsk={() => setIsAskOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-[208px] pt-16 pb-20 md:pb-8">
        <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Ask SkillState Command Panel Modal */}
      <Modal
        isOpen={isAskOpen}
        onClose={() => {
          setIsAskOpen(false);
          setAskAnswer(null);
          setAskQuery("");
        }}
        title="Ask SkillState"
        subtitle="Ask questions about your destination, requirements, or next best actions"
        maxWidth="lg"
      >
        <form onSubmit={handleAskSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-ink-muted" />
            <Input
              value={askQuery}
              onChange={(e) => setAskQuery(e.target.value)}
              placeholder="e.g. Why am I learning this now? Can I switch to Data Engineer?"
              className="pl-9 text-sm"
              autoFocus
            />
          </div>

          <div className="flex justify-between items-center text-xs text-ink-muted">
            <span>Answers cite internal profile, evidence, and plan state.</span>
            <Button type="submit" size="sm" disabled={!askQuery.trim() || isAnswering}>
              {isAnswering ? "Reasoning..." : "Ask"}
            </Button>
          </div>

          {askAnswer && (
            <div className="p-4 rounded-card bg-surface-soft border border-border space-y-3 mt-4 text-xs">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed text-ink">{askAnswer.answer}</div>
              </div>

              {askAnswer.citations.length > 0 && (
                <div className="pt-2 border-t border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-ink-muted font-medium">Based on:</span>
                  {askAnswer.citations.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-surface border border-border rounded text-[11px] text-ink-muted"
                    >
                      {c.label}: <strong className="text-ink">{c.detail}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
