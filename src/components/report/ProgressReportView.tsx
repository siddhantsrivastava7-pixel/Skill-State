"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  FileCheck2,
  ListChecks,
  RefreshCw,
  Route,
} from "lucide-react";
import { getClientAIProvider } from "@/agent/client-provider";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import { Button, Card, InlineNotice } from "@/components/ui";

const sections = [
  { key: "skillsAcquired", title: "Skills acquired", icon: Award },
  { key: "skillsInProgress", title: "Skills in progress", icon: RefreshCw },
  { key: "remainingGaps", title: "Remaining gaps", icon: ListChecks },
  { key: "proofAdded", title: "Proof added", icon: FileCheck2 },
  { key: "experienceAdded", title: "Experience gained", icon: BriefcaseBusiness },
  { key: "planChanges", title: "Plan changes", icon: Route },
  { key: "nextSteps", title: "Recommended next steps", icon: ArrowRight },
] as const;

export function ProgressReportView() {
  const profile = useSkillStateStore((state) => state.profile);
  const graph = useSkillStateStore((state) => state.destinationGraph);
  const verifiedStates = useSkillStateStore((state) => state.verifiedStates);
  const gaps = useSkillStateStore((state) => state.gaps);
  const evidence = useSkillStateStore((state) => state.evidence);
  const activityLedger = useSkillStateStore((state) => state.activityLedger);
  const progressReports = useSkillStateStore((state) => state.progressReports);
  const addProgressReport = useSkillStateStore((state) => state.addProgressReport);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const report = useMemo(
    () => progressReports.at(-1) ?? null,
    [progressReports]
  );

  const generateReport = async () => {
    setIsGenerating(true);
    setError("");
    try {
      const nextReport = await getClientAIProvider().generateProgressReport({
        profile,
        graph,
        verifiedStates,
        gaps,
        evidence,
        activityLedger,
      });
      addProgressReport(nextReport);
    } catch (reportError) {
      setError(
        reportError instanceof Error
          ? reportError.message
          : "The report could not be generated. Your current state was not changed."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Progress Report</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            A state-grounded summary for {graph.destinationName}; no invented mastery scores.
          </p>
        </div>
        <Button onClick={generateReport} disabled={isGenerating} size="sm">
          {isGenerating ? "Generating…" : "Generate current report"}
        </Button>
      </div>

      {error && (
        <InlineNotice variant="danger" title="Report generation failed">
          {error}
        </InlineNotice>
      )}

      {!report && (
        <Card className="p-6 text-center">
          <CheckCircle2 className="w-7 h-7 text-accent mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-ink">Your current state is ready to summarize</h2>
          <p className="text-xs text-ink-muted mt-1">
            Generate a report from verified skills, evidence, gaps, and recorded plan changes.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sections.map(({ key, title, icon: Icon }) => {
          const items = report?.[key] ?? [];
          return (
            <Card key={key} className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-ink">{title}</h2>
              </div>
              {items.length ? (
                <ul className="space-y-1.5 text-xs text-ink-muted">
                  {items.map((item, index) => (
                    <li key={`${key}-${index}`} className="flex gap-2">
                      <span className="text-accent">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-ink-muted">No recorded items yet.</p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
