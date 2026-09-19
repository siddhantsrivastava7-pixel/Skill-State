"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Layers,
  FileText,
  Video,
  Code,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import {
  matchResourcesToGaps,
  GroupedGapResources,
  ResourceFormat,
} from "@/data/library/resources-library";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function LearningResourcesView() {
  const destination = useSkillStateStore((s) => s.destination);
  const destinationGraph = useSkillStateStore((s) => s.destinationGraph);
  const gaps = useSkillStateStore((s) => s.gaps);

  // Group resources strictly by active gaps
  const groupedGaps: GroupedGapResources[] = matchResourcesToGaps(gaps, destinationGraph);

  const getFormatIcon = (format: ResourceFormat) => {
    switch (format) {
      case "project-guide":
        return <Code className="w-3.5 h-3.5 text-brandOrange" />;
      case "interactive-drill":
        return <Sparkles className="w-3.5 h-3.5 text-accent" />;
      case "case-study":
        return <FileText className="w-3.5 h-3.5 text-brandBlue" />;
      case "documentation":
        return <BookOpen className="w-3.5 h-3.5 text-ink-muted" />;
      case "article":
        return <FileText className="w-3.5 h-3.5 text-ink-muted" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
              Gap-Matched Learning Resources
            </h1>
            <Badge variant="accent" size="sm">
              Target: {destination}
            </Badge>
            <Badge variant="default" size="sm">
              {groupedGaps.length} Active Gap Areas
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            In SkillState, courses and tutorials never dictate your roadmap. Resources exist exclusively to resolve identified capability gaps and prepare you for verification tasks.
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

      {/* 2. Core Principle Notice */}
      <div className="p-3.5 rounded-xl bg-brandBlue-soft/40 border border-brandBlue/30 flex items-start gap-3 text-xs text-ink-muted">
        <BookOpen className="w-4 h-4 text-brandBlue shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-ink">Resources Serve Objectives, Not Catalogs:</span>
          <p>
            You are not asked to watch 60 hours of video lectures. Each resource below is paired with a specific evaluated deficit or upcoming verification milestone so your study time is lean, focused, and immediately proven.
          </p>
        </div>
      </div>

      {/* 3. Grouped Resources by Gap */}
      <div className="space-y-6">
        {groupedGaps.length === 0 ? (
          <Card className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-brandGreen mx-auto" />
            <h2 className="text-base font-bold text-ink">Zero Active Learning Gaps!</h2>
            <p className="text-xs text-ink-muted max-w-md mx-auto">
              All destination foundation requirements have verified evidence. Proceed to Proof Projects or Experience Sandboxes to build advanced credentials.
            </p>
          </Card>
        ) : (
          groupedGaps.map((group) => (
            <div key={group.gapCapabilityId} className="space-y-3">
              {/* Gap Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-surface-soft rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <h2 className="text-sm font-bold text-ink">
                    Gap: {group.gapCapabilityName}
                  </h2>
                  <Badge
                    variant={
                      group.gapPriority === "critical"
                        ? "accent"
                        : group.gapPriority === "high"
                        ? "orange"
                        : "default"
                    }
                    size="sm"
                  >
                    {group.gapPriority.toUpperCase()} PRIORITY
                  </Badge>
                </div>

                <span className="text-xs text-ink-muted italic sm:text-right">
                  {group.gapReason}
                </span>
              </div>

              {/* Resource Cards under this Gap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {group.resources.map((res) => (
                  <Card
                    key={res.id}
                    className="p-4 bg-surface border border-border hover:border-accent/30 transition-all shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-soft border border-border text-ink">
                          {getFormatIcon(res.format)}
                          <span className="capitalize">{res.format.replace("-", " ")}</span>
                        </span>

                        <div className="flex items-center gap-1 text-xs text-ink-muted">
                          <Clock className="w-3 h-3" />
                          <span>~{res.estimatedMinutes}m</span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-ink leading-snug">{res.title}</h3>
                      <span className="text-xs font-medium text-accent block">
                        Source: {res.provider}
                      </span>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {res.learningObjective}
                      </p>
                    </div>

                    {/* Why this resource & Action button */}
                    <div className="pt-2 border-t border-border/60 space-y-2.5">
                      <div className="p-2 rounded-lg bg-surface-soft text-[11px] text-ink-muted">
                        <strong className="text-ink">Why this resource: </strong>
                        {res.whyThisResource}
                      </div>

                      <div className="flex items-center justify-between">
                        <Link
                          href={`/assess?capability=${res.targetGapCapabilityId}`}
                          className="text-[11px] font-semibold text-accent hover:underline inline-flex items-center gap-1"
                        >
                          Verify this skill <ExternalLink className="w-3 h-3" />
                        </Link>

                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-soft hover:bg-surface-soft/80 border border-border text-ink transition-colors"
                        >
                          Open Resource <ExternalLink className="w-3 h-3 text-ink-muted" />
                        </a>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
