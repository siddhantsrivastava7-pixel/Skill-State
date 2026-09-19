import React from "react";
import { Link2, Infinity as InfinityIcon, Brain, Database, Code2, ShieldCheck, Sparkles } from "lucide-react";
import { CareerBranch } from "../journey/JourneyPath";

export interface KeepsOpenCardProps {
  branches: CareerBranch[];
  selectedBranchId?: string;
  onSelectBranch?: (id: string) => void;
  className?: string;
}

/**
 * KeepsOpenCard conforming to 06_COMPONENT_CATALOG.md, 04_DESIGN_SYSTEM.md, and skillstate-reference-ui.png:
 * - Exploring mode only
 * - Exactly 4 career path cards in a 2x2 grid
 * - Bottom reassurance note: "You don't need to choose now. Build, explore, and decide when you're ready."
 */
export function KeepsOpenCard({
  branches,
  selectedBranchId,
  onSelectBranch,
  className = "",
}: KeepsOpenCardProps) {
  // Cap at 4 branches
  const displayBranches = branches.slice(0, 4);

  const getBranchIcon = (title: string, tone: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("ai") || lower.includes("ml")) return <Brain className="w-4 h-4" />;
    if (lower.includes("data")) return <Database className="w-4 h-4" />;
    if (lower.includes("backend") || lower.includes("software")) return <Code2 className="w-4 h-4" />;
    if (lower.includes("security") || lower.includes("cyber")) return <ShieldCheck className="w-4 h-4" />;
    return <Sparkles className="w-4 h-4" />;
  };

  const getToneStyle = (tone: string, isSelected: boolean) => {
    if (isSelected) {
      return "ring-2 ring-blue border-blue bg-surface shadow-sm";
    }

    switch (tone) {
      case "purple":
        return "bg-purple-50/70 border-purple-200/80 text-purple-700 hover:border-purple-300";
      case "green":
        return "bg-emerald-50/70 border-emerald-200/80 text-emerald-700 hover:border-emerald-300";
      case "orange":
        return "bg-amber-50/70 border-amber-200/80 text-amber-700 hover:border-amber-300";
      case "blue":
      default:
        return "bg-blue-50/70 border-blue-200/80 text-blue-700 hover:border-blue-300";
    }
  };

  return (
    <div
      className={`rounded-card border border-border bg-surface p-5 sm:p-6 shadow-card flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border/60">
        <div className="w-8 h-8 rounded-full bg-blue-soft text-blue flex items-center justify-center shrink-0">
          <Link2 className="w-4 h-4 text-blue" />
        </div>
        <div>
          <h3 className="text-base font-bold text-ink leading-none">Keeps open</h3>
          <p className="text-xs text-ink-muted mt-1">
            If you follow this foundation plan, these paths remain open
          </p>
        </div>
      </div>

      {/* 2x2 Grid of Career Paths */}
      <div className="grid grid-cols-2 gap-2.5 my-3">
        {displayBranches.map((branch) => {
          const isSelected = selectedBranchId === branch.id;
          const toneClass = getToneStyle(branch.tone, isSelected);

          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => onSelectBranch?.(branch.id)}
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all duration-200 ${toneClass}`}
              aria-label={`Path: ${branch.title}`}
            >
              <div className="shrink-0">{getBranchIcon(branch.title, branch.tone)}</div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-ink block truncate">
                  {branch.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Reassurance Footer */}
      <div className="rounded-xl bg-surface-soft border border-border/70 p-3 flex items-start gap-2.5">
        <InfinityIcon className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-ink block">You don&apos;t need to choose now.</span>
          <span className="text-ink-muted block mt-0.5">
            Build, explore, and decide when you&apos;re ready.
          </span>
        </div>
      </div>
    </div>
  );
}
