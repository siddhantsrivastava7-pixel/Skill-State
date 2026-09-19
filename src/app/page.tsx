"use client";

import { useEffect, useState } from "react";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import { DemoPersonaId } from "@/data/demo";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { HillBackgroundSvg } from "@/components/journey/HillBackgroundSvg";

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);

  const activePersonaId = useSkillStateStore((s) => s.activePersonaId);
  const profile = useSkillStateStore((s) => s.profile);
  const destination = useSkillStateStore((s) => s.destination);
  const destinationGraph = useSkillStateStore((s) => s.destinationGraph);
  const evidence = useSkillStateStore((s) => s.evidence);
  const gaps = useSkillStateStore((s) => s.gaps);
  const plan = useSkillStateStore((s) => s.plan);
  const loadPersona = useSkillStateStore((s) => s.loadPersona);
  const resetStore = useSkillStateStore((s) => s.resetStore);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-sm">
        <p className="text-ink-muted">Hydrating store...</p>
      </div>
    );
  }

  const capabilityCount = destinationGraph.capabilityNodes.length;
  const evidenceCount = evidence.length;
  const gapCount = gaps.length;
  const nextActionCount = plan.now.length;

  return (
    <div className="space-y-6">
      {/* Hero preview banner demonstrating layered hill SVG background asset */}
      <div className="relative overflow-hidden rounded-card border border-border min-h-[160px] p-6 sm:p-8 flex flex-col justify-end bg-surface">
        <HillBackgroundSvg />
        <div className="relative z-10 space-y-1 max-w-xl">
          <Badge variant="accent" size="sm" className="mb-2">
            Phase 2: Visual System & Shell Active
          </Badge>
          <h1 className="font-serif text-2xl sm:text-3xl text-ink font-normal leading-tight">
            Explore your future without closing doors too early.
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Build strong foundations, try different paths, and keep your options open before you specialize.
          </p>
        </div>
      </div>

      {/* Diagnostic & Persona Switcher */}
      <Card className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">SkillState Diagnostic State</h2>
            <p className="text-xs text-ink-muted">Live Zustand store metrics</p>
          </div>
          <Badge variant="default" size="sm">
            {profile.destinationCertainty.toUpperCase()} MODE
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="p-3 bg-surface-soft rounded-sm border border-border/60">
            <span className="text-ink-muted block text-[11px]">Active Persona</span>
            <span className="font-semibold text-ink text-sm block mt-0.5">
              {profile.name} ({activePersonaId})
            </span>
          </div>

          <div className="p-3 bg-surface-soft rounded-sm border border-border/60">
            <span className="text-ink-muted block text-[11px]">Destination</span>
            <span className="font-semibold text-ink text-sm block mt-0.5 truncate">
              {destination}
            </span>
          </div>

          <div className="p-3 bg-surface-soft rounded-sm border border-border/60">
            <span className="text-ink-muted block text-[11px]">Capability Count</span>
            <span className="font-semibold text-ink text-sm block mt-0.5">
              {capabilityCount}
            </span>
          </div>

          <div className="p-3 bg-surface-soft rounded-sm border border-border/60">
            <span className="text-ink-muted block text-[11px]">Evidence Count</span>
            <span className="font-semibold text-ink text-sm block mt-0.5">
              {evidenceCount}
            </span>
          </div>

          <div className="p-3 bg-surface-soft rounded-sm border border-border/60">
            <span className="text-ink-muted block text-[11px]">Gap Count</span>
            <span className="font-semibold text-ink text-sm block mt-0.5">
              {gapCount}
            </span>
          </div>

          <div className="p-3 bg-surface-soft rounded-sm border border-border/60">
            <span className="text-ink-muted block text-[11px]">Next Action Count</span>
            <span className="font-semibold text-ink text-sm block mt-0.5">
              {nextActionCount}
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted font-medium">Switch Persona:</span>
            {(["persona-a", "persona-b", "persona-c"] as DemoPersonaId[]).map((id) => (
              <Button
                key={id}
                size="sm"
                variant={activePersonaId === id ? "primary" : "secondary"}
                onClick={() => loadPersona(id)}
              >
                {id === "persona-a" ? "Persona A" : id === "persona-b" ? "Persona B" : "Persona C"}
              </Button>
            ))}
          </div>
          <Button size="sm" variant="ghost" onClick={() => resetStore()}>
            Reset
          </Button>
        </div>
      </Card>
    </div>
  );
}
