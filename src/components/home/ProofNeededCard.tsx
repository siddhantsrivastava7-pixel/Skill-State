import React from "react";
import { ShieldAlert, Target } from "lucide-react";
import { ProofExpectation } from "@/domain/types";

export interface ProofNeededCardProps {
  destinationName: string;
  proofExpectations?: ProofExpectation[];
  className?: string;
}

/**
 * ProofNeededCard conforming to 06_COMPONENT_CATALOG.md, 04_DESIGN_SYSTEM.md, and Phase 4.2:
 * - Exact destination mode credibility requirements
 * - Career-specific proof items from active DestinationGraph
 * - Destination-neutral explanatory footer: "Strong claims need evidence that demonstrates the capability in practice."
 */
export function ProofNeededCard({
  destinationName,
  proofExpectations = [],
  className = "",
}: ProofNeededCardProps) {
  // Destination-neutral fallback proof items only if none present in graph
  const defaultProofs: ProofExpectation[] = [
    {
      id: "proof-fallback-1",
      capabilityId: "cap-1",
      description: `End-to-end practical project with documented methodology and validation for ${destinationName}.`,
      level: "working",
    },
    {
      id: "proof-fallback-2",
      capabilityId: "cap-2",
      description: `Verifiable artifact or portfolio deliverable demonstrating ${destinationName} standards.`,
      level: "working",
    },
  ];

  const items = proofExpectations.length > 0 ? proofExpectations.slice(0, 3) : defaultProofs;

  return (
    <div
      className={`rounded-card border border-border bg-surface p-5 sm:p-6 shadow-card flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border/60">
        <div className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h3 className="text-base font-bold text-ink leading-none">Proof still needed</h3>
          <p className="text-xs text-ink-muted mt-1">
            Credibility requirements for {destinationName}
          </p>
        </div>
      </div>

      {/* Proof Expectations List */}
      <div className="space-y-2.5 my-3">
        {items.map((proof, idx) => (
          <div
            key={proof.id || idx}
            className="p-3 rounded-xl border border-border/70 bg-surface-soft/60 flex items-start justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-ink block leading-snug">
                {proof.description}
              </span>
              <span className="text-[10px] text-ink-muted block mt-1">
                Target level: <span className="capitalize font-medium text-ink">{proof.level}</span>
              </span>
            </div>
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-soft text-accent border border-accent/20">
              Needs proof
            </span>
          </div>
        ))}
      </div>

      {/* Reassurance Footer */}
      <div className="rounded-xl bg-surface-soft border border-border/70 p-3 flex items-start gap-2.5">
        <Target className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-ink block">Focus on verifiable proof.</span>
          <span className="text-ink-muted block mt-0.5">
            Strong claims need evidence that demonstrates the capability in practice.
          </span>
        </div>
      </div>
    </div>
  );
}
