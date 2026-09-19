"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import {
  calculateCareerPathsWithOverlap,
  CareerPathItem,
} from "@/data/library/careers-library";
import { WhatIfSimulator } from "@/components/journey/WhatIfSimulator";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function CareerPathsView() {
  const destination = useSkillStateStore((s) => s.destination);
  const destinationGraph = useSkillStateStore((s) => s.destinationGraph);
  const verifiedStates = useSkillStateStore((s) => s.verifiedStates);

  const [simulatingCandidateId, setSimulatingCandidateId] = useState<string | null>(null);

  // Compute transferable overlap for each catalog destination
  const careerPaths: CareerPathItem[] = calculateCareerPathsWithOverlap(
    destinationGraph,
    verifiedStates
  );

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
              Career Exploration & Transferable Foundations
            </h1>
            <Badge variant="accent" size="sm">
              Current Target: {destination}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            Your verified evidence belongs to you, not a single job title. See how your verified capabilities transfer to adjacent careers without starting from scratch.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={simulatingCandidateId ? "secondary" : "primary"}
            size="sm"
            onClick={() =>
              setSimulatingCandidateId(
                simulatingCandidateId ? null : careerPaths[0]?.id || null
              )
            }
            className="text-xs gap-1.5 shadow-xs"
          >
            <Compass className="w-4 h-4" />
            {simulatingCandidateId ? "Hide Simulator" : "Launch What-If Simulator"}
          </Button>
        </div>
      </div>

      {/* 2. Embedded Simulator if activated */}
      {simulatingCandidateId && (
        <WhatIfSimulator
          initialDestinationId={simulatingCandidateId}
          onClose={() => setSimulatingCandidateId(null)}
          onApplied={() => setSimulatingCandidateId(null)}
        />
      )}

      {/* 3. Transferability Value Banner */}
      <div className="p-3.5 rounded-xl bg-brandGreen-soft/40 border border-brandGreen/30 flex items-start gap-3 text-xs text-ink-muted">
        <ShieldCheck className="w-4 h-4 text-brandGreen shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-ink">Evidence Preservation Standard:</span>
          <p>
            When you switch or simulate a career target, 100% of your verified states, submissions, and proof artifacts are preserved. Overlap percentages below show immediate progress toward each destination.
          </p>
        </div>
      </div>

      {/* 4. Career Paths Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {careerPaths.map((item) => {
          const isCurrent =
            item.title.toLowerCase() === destination.toLowerCase() ||
            item.graph.destinationName.toLowerCase() === destination.toLowerCase();

          return (
            <Card
              key={item.id}
              className={`p-5 bg-surface border transition-all flex flex-col justify-between space-y-4 ${
                isCurrent
                  ? "border-accent ring-1 ring-accent/30 shadow-card"
                  : "border-border hover:border-border/80 shadow-xs"
              }`}
            >
              <div className="space-y-3">
                {/* Meta Top Bar */}
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="default" size="sm">
                    {item.field}
                  </Badge>

                  <div className="flex items-center gap-1.5">
                    {isCurrent ? (
                      <Badge variant="accent" size="sm">
                        Active Destination
                      </Badge>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brandGreen">
                        <TrendingUp className="w-3 h-3" />
                        {item.demandOutlook}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h2 className="text-base font-bold text-ink">{item.title}</h2>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">{item.description}</p>
                </div>

                {/* Overlap Progress Bar & Stats */}
                <div className="p-3 rounded-xl bg-surface-soft border border-border/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ink">Transferable Overlap:</span>
                    <span className="font-bold text-brandGreen">{item.overlapPercentage}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-brandGreen rounded-full transition-all duration-300"
                      style={{ width: `${item.overlapPercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-ink-muted pt-0.5">
                    <span>
                      <strong className="text-brandGreen">{item.sharedCapabilities.length}</strong>{" "}
                      verified capability(ies) transfer
                    </span>
                    <span>
                      <strong className="text-brandOrange">{item.unverifiedCapabilitiesCount}</strong>{" "}
                      needed
                    </span>
                  </div>
                </div>

                {/* Shared Capabilities Chips */}
                {item.sharedCapabilities.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-ink-muted block">
                      Transferable Foundations Ready:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.sharedCapabilities.map((capName, cIdx) => (
                        <span
                          key={cIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-brandGreen-soft text-brandGreen border border-brandGreen/20"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {capName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bottom Bar */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-xs text-ink-muted">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Target horizon: ~{item.targetHorizonMonths} mo</span>
                </div>

                <Button
                  variant={isCurrent ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => setSimulatingCandidateId(item.id)}
                  className="text-xs gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  {isCurrent ? "Simulate Pacing" : "Simulate What-If"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
