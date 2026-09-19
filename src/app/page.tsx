"use client";

import { useEffect, useState } from "react";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import { DemoPersonaId } from "@/data/demo";

export default function DiagnosticPage() {
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
      <main className="p-8 max-w-2xl mx-auto font-mono text-sm">
        <h1 className="text-xl font-bold mb-4">SkillState — Phase 1 Diagnostic</h1>
        <p className="text-gray-500">Hydrating store...</p>
      </main>
    );
  }

  const capabilityCount = destinationGraph.capabilityNodes.length;
  const evidenceCount = evidence.length;
  const gapCount = gaps.length;
  const nextActionCount = plan.now.length;

  return (
    <main className="p-8 max-w-2xl mx-auto font-mono text-sm space-y-6">
      <div className="border border-border p-6 rounded-card bg-surface shadow-card space-y-4">
        <div className="border-b border-border pb-3">
          <h1 className="text-lg font-bold">SkillState — Diagnostic</h1>
          <p className="text-xs text-ink-muted">Phase 1: Scaffold & Domain Model</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="text-ink-muted">Active Persona:</div>
          <div className="font-semibold">{profile.name} ({activePersonaId})</div>

          <div className="text-ink-muted">Destination:</div>
          <div className="font-semibold">{destination}</div>

          <div className="text-ink-muted">Capability Count:</div>
          <div className="font-semibold">{capabilityCount}</div>

          <div className="text-ink-muted">Evidence Count:</div>
          <div className="font-semibold">{evidenceCount}</div>

          <div className="text-ink-muted">Gap Count:</div>
          <div className="font-semibold">{gapCount}</div>

          <div className="text-ink-muted">Next Action Count:</div>
          <div className="font-semibold">{nextActionCount}</div>
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
            Switch Demo Persona:
          </div>
          <div className="flex gap-2">
            {(["persona-a", "persona-b", "persona-c"] as DemoPersonaId[]).map((id) => (
              <button
                key={id}
                onClick={() => loadPersona(id)}
                className={`px-3 py-1.5 rounded-sm text-xs font-semibold border transition-colors ${
                  activePersonaId === id
                    ? "bg-accent text-white border-accent"
                    : "bg-surface text-ink border-border hover:bg-surface-soft"
                }`}
              >
                {id.toUpperCase()}
              </button>
            ))}
            <button
              onClick={() => resetStore()}
              className="px-3 py-1.5 rounded-sm text-xs font-semibold border border-border bg-surface text-ink-muted hover:bg-surface-soft ml-auto"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
