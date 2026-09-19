"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCode2,
  ListChecks,
  AlertCircle,
} from "lucide-react";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import { matchProjectsToGaps, ProofProjectRecommendation } from "@/data/library/projects-library";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function ProofProjectsView() {
  const destination = useSkillStateStore((s) => s.destination);
  const destinationGraph = useSkillStateStore((s) => s.destinationGraph);
  const gaps = useSkillStateStore((s) => s.gaps);
  const verifiedStates = useSkillStateStore((s) => s.verifiedStates);

  // Match proof projects to current gaps and destination graph
  const projects = matchProjectsToGaps(gaps, destinationGraph);

  // Track expanded projects for detailed spec viewing
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(
    projects[0]?.id || null
  );

  const toggleExpand = (id: string) => {
    setExpandedProjectId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">Proof Projects</h1>
            <Badge variant="accent" size="sm">
              Target: {destination}
            </Badge>
            <Badge variant="default" size="sm">
              {projects.length} Recommended Deliverables
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            In SkillState, projects are not arbitrary practice tasks. Each project is selected specifically to produce concrete, auditable deliverables proving your unverified capabilities.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/journey">
            <Button variant="secondary" size="sm" className="text-xs gap-1.5">
              View in Journey
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Architecture Notice */}
      <div className="p-3.5 rounded-xl bg-surface-soft border border-border flex items-start gap-3 text-xs text-ink-muted">
        <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-ink">Objective Verification Standard:</span>
          <p>
            Unlike certificates or self-reported completions, each project below includes explicit{" "}
            <strong className="text-ink">Verification Criteria</strong> and measurable proof requirements.
            Completing these items directly converts unverified capability gaps into verified state.
          </p>
        </div>
      </div>

      {/* 3. Project Recommendations List */}
      <div className="space-y-4">
        {projects.map((proj, idx) => {
          const isExpanded = expandedProjectId === proj.id;
          const targetCapVerified = proj.targetCapabilityIds.some(
            (cid) => verifiedStates[cid]?.state === "verified"
          );

          return (
            <Card
              key={proj.id}
              className={`p-5 transition-all bg-surface border ${
                isExpanded ? "border-accent/40 shadow-sm" : "border-border hover:border-border/80"
              }`}
            >
              {/* Project Card Summary Row */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-ink-muted">PROJ-{idx + 1}</span>
                    <Badge
                      variant={
                        proj.proofLevel === "production"
                          ? "accent"
                          : proj.proofLevel === "working"
                          ? "blue"
                          : "default"
                      }
                      size="sm"
                    >
                      {proj.proofLevel.toUpperCase()} LEVEL PROOF
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                      <Clock className="w-3 h-3" /> ~{proj.estimatedHours} hrs
                    </span>
                    {targetCapVerified && (
                      <Badge variant="green" size="sm" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified Foundation
                      </Badge>
                    )}
                  </div>

                  <h2 className="text-base font-bold text-ink">{proj.title}</h2>
                  <p className="text-xs text-ink-muted">{proj.tagline}</p>

                  {/* Why this project callout */}
                  <div className="p-2.5 rounded-lg bg-surface-soft border border-border/60 text-xs">
                    <span className="font-semibold text-accent">Why this project: </span>
                    <span className="text-ink-muted">{proj.whyThisProject}</span>
                  </div>

                  {/* Target capabilities tags */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] font-semibold text-ink-muted">Target Capabilities:</span>
                    {proj.targetCapabilityNames.map((name, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-soft border border-border text-ink"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(proj.id)}
                    className="text-xs gap-1"
                  >
                    {isExpanded ? (
                      <>
                        Hide Spec <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        View Spec & Verification <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>

                  <Link href={`/assess?capability=${proj.targetCapabilityIds[0] || ""}`}>
                    <Button variant="primary" size="sm" className="text-xs gap-1 shadow-xs">
                      Submit Proof / Assess <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Collapsible Detailed Spec & Verification Criteria */}
              {isExpanded && (
                <div className="mt-5 pt-5 border-t border-border/70 grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
                  {/* Left: Required Deliverables */}
                  <div className="space-y-3 p-4 rounded-xl bg-surface-soft/60 border border-border">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="w-4 h-4 text-brandOrange" />
                      <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                        Required Deliverables
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {proj.deliverables.map((item, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-2 text-xs text-ink-muted">
                          <span className="w-4 h-4 rounded-full bg-brandOrange-soft text-brandOrange text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {dIdx + 1}
                          </span>
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right: Verification Criteria */}
                  <div className="space-y-3 p-4 rounded-xl bg-accent-soft/20 border border-accent/20">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-accent" />
                      <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                        Verification Criteria (Pass Thresholds)
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {proj.verificationCriteria.map((crit, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-2 text-xs text-ink-muted">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                          <span className="leading-snug">{crit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
