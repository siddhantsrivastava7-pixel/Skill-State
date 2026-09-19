"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Calendar,
  Building2,
  Code2,
  Trophy,
  GitBranch,
  ShieldCheck,
} from "lucide-react";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import {
  matchExperienceToGaps,
  ExperienceOpportunity,
  ExperienceOpportunityType,
} from "@/data/library/experience-library";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function ExperienceOpportunitiesView() {
  const destination = useSkillStateStore((s) => s.destination);
  const destinationGraph = useSkillStateStore((s) => s.destinationGraph);
  const gaps = useSkillStateStore((s) => s.gaps);
  const verifiedStates = useSkillStateStore((s) => s.verifiedStates);

  // Match experience opportunities to gaps
  const opportunities: ExperienceOpportunity[] = matchExperienceToGaps(
    gaps,
    destinationGraph,
    verifiedStates
  );

  const getTypeIcon = (type: ExperienceOpportunityType) => {
    switch (type) {
      case "internship":
        return <Building2 className="w-3.5 h-3.5 text-brandBlue" />;
      case "hackathon":
        return <Trophy className="w-3.5 h-3.5 text-brandOrange" />;
      case "open-source":
        return <GitBranch className="w-3.5 h-3.5 text-brandGreen" />;
      case "team-project":
        return <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case "research":
        return <Code2 className="w-3.5 h-3.5 text-accent" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
              Experience Opportunities
            </h1>
            <Badge variant="accent" size="sm">
              Target: {destination}
            </Badge>
            <Badge variant="orange" size="sm">
              Simulated Sandbox
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            Destination readiness requires applied practice, collaboration, feedback, and real-world constraints beyond solo exercises.
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

      {/* 2. Prominent Demo / Simulated Sandbox Transparency Banner */}
      <div className="p-4 rounded-xl bg-brandOrange-soft/50 border border-brandOrange/30 flex items-start gap-3">
        <Info className="w-5 h-5 text-brandOrange shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-ink-muted">
          <div className="flex items-center gap-2 flex-wrap">
            <strong className="text-ink text-sm">Example / Demo Opportunity (Simulated Sandbox)</strong>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brandOrange text-white uppercase tracking-wider">
              Demo Data Fixture
            </span>
          </div>
          <p className="leading-relaxed">
            These opportunities illustrate how SkillState matches learners to practical non-course experience using the active destination, capability gaps, and experience expectations. They remain simulated examples for demonstrating timing and gap-filling logic.
          </p>
        </div>
      </div>

      {/* 3. Opportunities List */}
      <div className="space-y-4">
        {opportunities.map((opp) => (
          <Card
            key={opp.id}
            className="p-5 bg-surface border border-border hover:border-border/80 transition-all shadow-xs space-y-4"
          >
            {/* Header & Badges */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-surface-soft border border-border text-ink">
                    {getTypeIcon(opp.type)}
                    <span className="capitalize">{opp.type.replace("-", " ")}</span>
                  </span>
                  <Badge variant="default" size="sm">
                    {opp.mode}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                    <Calendar className="w-3 h-3" /> {opp.estimatedWeeks} weeks duration
                  </span>
                  <Badge variant="orange" size="sm" className="text-[10px]">
                    {opp.demoLabel}
                  </Badge>
                </div>

                <h2 className="text-base font-bold text-ink">{opp.title}</h2>
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <Building2 className="w-3.5 h-3.5 text-accent" />
                  <span className="font-semibold text-ink">{opp.organization}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {opp.prerequisitesMet ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brandGreen-soft text-brandGreen border border-brandGreen/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Prerequisites Met
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brandOrange-soft text-brandOrange border border-brandOrange/30">
                    <AlertCircle className="w-3.5 h-3.5" /> Prerequisites in Progress
                  </span>
                )}
              </div>
            </div>

            {/* Scope Overview */}
            <p className="text-xs text-ink-muted leading-relaxed">{opp.scopeOverview}</p>

            {/* Rationale & Timing Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border/60 text-xs">
              {/* Gap Filled */}
              <div className="p-3 rounded-lg bg-surface-soft border border-border/60 space-y-1">
                <span className="font-semibold text-accent block">Experience Gap It Fills:</span>
                <p className="text-[11px] text-ink-muted leading-relaxed">{opp.fillsGapDescription}</p>
              </div>

              {/* Timing Recommendation */}
              <div className="p-3 rounded-lg bg-surface-soft border border-border/60 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-ink">
                  <Clock className="w-3 h-3 text-accent" />
                  <span>Optimal Journey Timing:</span>
                </div>
                <p className="text-[11px] text-ink-muted leading-relaxed">{opp.timingRecommendation}</p>
              </div>
            </div>

            {/* Prerequisites Checklist */}
            <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-ink text-[11px]">Prerequisites:</span>
                {opp.prerequisites.map((req, rIdx) => (
                  <span
                    key={rIdx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-surface-soft text-ink-muted border border-border"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-brandGreen" />
                    {req}
                  </span>
                ))}
              </div>

              <div className="shrink-0 text-ink-muted text-[11px]">
                <span>Simulated Sandbox Experience</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
