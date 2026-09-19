"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Compass,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Briefcase,
  Users,
  Award,
  Sparkles,
  Filter,
  Layers,
  ChevronRight,
} from "lucide-react";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import {
  organizePlanIntoJourneyTracks,
  JourneyTrack,
  JourneyPhaseGroup,
  TRACK_METADATA,
} from "@/domain/journey-tracks";
import { WhatIfSimulator } from "./WhatIfSimulator";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export function JourneyView() {
  const destination = useSkillStateStore((s) => s.destination);
  const destinationGraph = useSkillStateStore((s) => s.destinationGraph);
  const plan = useSkillStateStore((s) => s.plan);
  const profile = useSkillStateStore((s) => s.profile);
  const verifiedStates = useSkillStateStore((s) => s.verifiedStates);

  const [showSimulator, setShowSimulator] = useState(false);
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<JourneyTrack | "all">("all");

  // Organize plan actions into multi-period phases across 5 tracks
  const phases: JourneyPhaseGroup[] = useMemo(() => {
    return organizePlanIntoJourneyTracks(plan, destinationGraph);
  }, [plan, destinationGraph]);

  // Capability node lookup map
  const capabilityMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const node of destinationGraph.capabilityNodes) {
      map.set(node.id, node.name);
    }
    return map;
  }, [destinationGraph]);

  // Count total actions by track
  const trackCounts = useMemo(() => {
    const counts: Record<JourneyTrack, number> = {
      learn: 0,
      prove: 0,
      build: 0,
      experience: 0,
      signal: 0,
    };
    for (const phase of phases) {
      for (const act of phase.actions) {
        if (counts[act.track] !== undefined) {
          counts[act.track]++;
        }
      }
    }
    return counts;
  }, [phases]);

  // Helper for track icon
  const getTrackIcon = (track: JourneyTrack) => {
    switch (track) {
      case "learn":
        return <BookOpen className="w-3.5 h-3.5 text-brandBlue" />;
      case "prove":
        return <ShieldCheck className="w-3.5 h-3.5 text-accent" />;
      case "build":
        return <Briefcase className="w-3.5 h-3.5 text-brandOrange" />;
      case "experience":
        return <Users className="w-3.5 h-3.5 text-brandGreen" />;
      case "signal":
        return <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">My Adaptive Journey</h1>
            <Badge variant="accent" size="sm">
              Target: {destination}
            </Badge>
            <Badge variant="default" size="sm">
              {profile.weeklyHours || 15} hrs/wk
            </Badge>
            <Badge variant="default" size="sm">
              {profile.targetTimelineMonths || 12} mo target
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            Structured roadmap across 5 tracks:{" "}
            <span className="font-semibold text-brandBlue">Learn</span> →{" "}
            <span className="font-semibold text-accent">Prove</span> →{" "}
            <span className="font-semibold text-brandOrange">Build</span> →{" "}
            <span className="font-semibold text-brandGreen">Experience</span> →{" "}
            <span className="font-semibold text-purple-600 dark:text-purple-400">Signal</span>.
            Every action states explicitly when and why it belongs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={showSimulator ? "secondary" : "primary"}
            size="sm"
            onClick={() => setShowSimulator(!showSimulator)}
            className="text-xs gap-1.5 shadow-xs"
          >
            <Compass className="w-4 h-4" />
            {showSimulator ? "Hide Simulator" : "What-If Simulator"}
          </Button>
        </div>
      </div>

      {/* 2. What-If Simulator Panel (Collapsible/Embeddable) */}
      {showSimulator && (
        <WhatIfSimulator
          onClose={() => setShowSimulator(false)}
          onApplied={() => setShowSimulator(false)}
        />
      )}

      {/* 3. Five-Track Summary & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface rounded-xl border border-border">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted shrink-0">
          <Filter className="w-3.5 h-3.5 text-ink-muted" />
          <span>Filter Track:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedTrackFilter("all")}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              selectedTrackFilter === "all"
                ? "bg-accent text-white font-semibold"
                : "bg-surface-soft text-ink-muted hover:text-ink hover:bg-surface-soft/80"
            }`}
          >
            All Tracks (
            {Object.values(trackCounts).reduce((a, b) => a + b, 0)}
            )
          </button>

          {(Object.keys(TRACK_METADATA) as JourneyTrack[]).map((trackKey) => {
            const meta = TRACK_METADATA[trackKey];
            const isSelected = selectedTrackFilter === trackKey;
            return (
              <button
                key={trackKey}
                type="button"
                onClick={() => setSelectedTrackFilter(trackKey)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                  isSelected
                    ? "bg-ink text-surface font-semibold shadow-xs"
                    : `${meta.bgColor} ${meta.color} hover:opacity-80 border border-transparent`
                }`}
              >
                {getTrackIcon(trackKey)}
                <span>{meta.label}</span>
                <span className="text-[10px] opacity-80">({trackCounts[trackKey]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Multi-Period Phases Timeline */}
      <div className="space-y-6">
        {phases.map((phase) => {
          const visibleActions =
            selectedTrackFilter === "all"
              ? phase.actions
              : phase.actions.filter((a) => a.track === selectedTrackFilter);

          if (visibleActions.length === 0 && selectedTrackFilter !== "all") {
            return null;
          }

          return (
            <div key={phase.phaseIndex} className="space-y-3">
              {/* Phase Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-3.5 bg-surface-soft rounded-xl border border-border">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {phase.phaseIndex}
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-ink">{phase.phaseLabel}</h2>
                    <p className="text-xs text-ink-muted">{phase.description}</p>
                  </div>
                </div>
                <Badge variant="default" size="sm" className="self-start sm:self-auto shrink-0">
                  <Clock className="w-3 h-3 mr-1" />
                  {phase.timingRange}
                </Badge>
              </div>

              {/* Action Cards Grid */}
              {visibleActions.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-ink-muted">
                  No actions in this phase matching the selected track filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {visibleActions.map((action) => {
                    const trackMeta = TRACK_METADATA[action.track];
                    return (
                      <Card
                        key={action.id}
                        className="p-4 sm:p-5 flex flex-col justify-between border-border/80 hover:border-accent/30 transition-all shadow-xs space-y-3.5 bg-surface"
                      >
                        {/* Top Meta Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${trackMeta.bgColor} ${trackMeta.color} border ${trackMeta.borderColor}`}
                            >
                              {getTrackIcon(action.track)}
                              {trackMeta.label} Track
                            </span>

                            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                              <Clock className="w-3 h-3" />
                              <span>{action.estimatedMinutes >= 60 ? `${Math.round(action.estimatedMinutes / 60)}h` : `${action.estimatedMinutes}m`}</span>
                              <Badge
                                variant={action.status === "done" || action.status === "verified" ? "green" : "default"}
                                size="sm"
                              >
                                {action.category === "prove"
                                  ? action.status === "verified" || action.status === "done"
                                    ? "Verified"
                                    : action.status === "attempted"
                                      ? "Attempted"
                                      : "Not started"
                                  : action.status === "done"
                                    ? "Completed"
                                    : "Scheduled"}
                              </Badge>
                            </div>
                          </div>

                          {/* Action Title & Description */}
                          <h3 className="text-sm font-bold text-ink leading-snug">{action.title}</h3>
                          <p className="text-xs text-ink-muted leading-relaxed">{action.description}</p>
                        </div>

                        {/* Rationale Blocks: When & Why */}
                        <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                          {/* When It Belongs */}
                          <div className="p-2 rounded-lg bg-surface-soft border border-border/50 space-y-0.5">
                            <div className="flex items-center gap-1 font-semibold text-ink text-[11px]">
                              <Clock className="w-3 h-3 text-accent shrink-0" />
                              <span>When it belongs:</span>
                              <span className="text-ink-muted font-normal">({action.timingRange})</span>
                            </div>
                            <p className="text-[11px] text-ink-muted leading-relaxed pl-4">
                              {action.whenItBelongs}
                            </p>
                          </div>

                          {/* Why It Belongs */}
                          <div className="p-2 rounded-lg bg-accent-soft/30 border border-accent/20 space-y-0.5">
                            <div className="flex items-center gap-1 font-semibold text-accent text-[11px]">
                              <Sparkles className="w-3 h-3 text-accent shrink-0" />
                              <span>Why it belongs:</span>
                            </div>
                            <p className="text-[11px] text-ink-muted leading-relaxed pl-4">
                              {action.whyItBelongs}
                            </p>
                          </div>
                        </div>

                        {/* Associated Capabilities & Action Link */}
                        <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-1 items-center">
                            {action.capabilityIds.map((cid) => {
                              const name = capabilityMap.get(cid) || cid;
                              const isVerified = verifiedStates[cid]?.state === "verified";
                              return (
                                <span
                                  key={cid}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    isVerified
                                      ? "bg-brandGreen-soft text-brandGreen border border-brandGreen/20"
                                      : "bg-surface-soft text-ink-muted border border-border"
                                  }`}
                                >
                                  {isVerified && <CheckCircle2 className="w-2.5 h-2.5" />}
                                  {name}
                                </span>
                              );
                            })}
                          </div>

                          <div className="shrink-0">
                            {action.track === "prove" && (
                              <Link
                                href={`/assess?capability=${action.capabilityIds[0] || ""}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                              >
                                Take Assessment <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                            {action.track === "build" && (
                              <Link
                                href="/projects"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-brandOrange hover:underline"
                              >
                                View Proof Specs <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                            {action.track === "learn" && (
                              <Link
                                href="/resources"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-brandBlue hover:underline"
                              >
                                View Resources <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                            {action.track === "experience" && (
                              <Link
                                href="/experience"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-brandGreen hover:underline"
                              >
                                Explore Opportunities <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                            {action.track === "signal" && (
                              <Link
                                href="/skills"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                              >
                                View Capability Signals <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. Quick Navigation Footer */}
      <Card className="p-4 bg-surface-soft border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-ink">
          <Layers className="w-4 h-4 text-accent" />
          <span className="font-semibold">Explore Journey Specialized Tracks:</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href="/projects"
            className="px-2.5 py-1 rounded-lg bg-surface border border-border text-ink hover:border-accent hover:text-accent font-medium transition-colors"
          >
            Proof Projects
          </Link>
          <Link
            href="/experience"
            className="px-2.5 py-1 rounded-lg bg-surface border border-border text-ink hover:border-accent hover:text-accent font-medium transition-colors"
          >
            Experience Sandboxes
          </Link>
          <Link
            href="/resources"
            className="px-2.5 py-1 rounded-lg bg-surface border border-border text-ink hover:border-accent hover:text-accent font-medium transition-colors"
          >
            Gap Resources
          </Link>
          <Link
            href="/careers"
            className="px-2.5 py-1 rounded-lg bg-surface border border-border text-ink hover:border-accent hover:text-accent font-medium transition-colors"
          >
            Career Paths
          </Link>
        </div>
      </Card>
    </div>
  );
}
