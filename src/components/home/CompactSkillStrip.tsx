import React from "react";
import Link from "next/link";
import { BarChart2, ArrowRight, Code, Brain, Database, FileSpreadsheet, Puzzle } from "lucide-react";

export interface SkillProgressItem {
  name: string;
  progressPercent: number;
  tone: "purple" | "green" | "blue" | "orange";
}

export interface CompactSkillStripProps {
  skills?: SkillProgressItem[];
  className?: string;
}

/**
 * CompactSkillStrip conforming to 06_COMPONENT_CATALOG.md, 04_DESIGN_SYSTEM.md, and skillstate-reference-ui.png:
 * - 3–5 key skills with progress bars
 * - Header with "View all ->" link to /skills
 * - Tone-tinted progress indicators
 */
export function CompactSkillStrip({ skills, className = "" }: CompactSkillStripProps) {
  // Default skills matching Persona A reference UI
  const defaultSkills: SkillProgressItem[] = [
    { name: "Python", progressPercent: 65, tone: "purple" },
    { name: "Problem Solving", progressPercent: 40, tone: "green" },
    { name: "Data Fundamentals", progressPercent: 20, tone: "blue" },
  ];

  const items = skills && skills.length > 0 ? skills.slice(0, 4) : defaultSkills;

  const getToneBarColor = (tone: string) => {
    switch (tone) {
      case "purple":
        return "bg-[#8B5CF6]";
      case "green":
        return "bg-[#10B981]";
      case "blue":
        return "bg-[#3B82F6]";
      case "orange":
        return "bg-[#F59E0B]";
      default:
        return "bg-green";
    }
  };

  const getSkillIcon = (name: string, tone: string) => {
    const lower = name.toLowerCase();
    const iconClass = "w-3.5 h-3.5";
    if (lower.includes("python") || lower.includes("code")) return <Code className={`${iconClass} text-purple-600`} />;
    if (lower.includes("problem") || lower.includes("logic")) return <Puzzle className={`${iconClass} text-emerald-600`} />;
    if (lower.includes("data") || lower.includes("sql")) return <Database className={`${iconClass} text-blue-600`} />;
    if (lower.includes("sheet") || lower.includes("excel") || lower.includes("finance")) return <FileSpreadsheet className={`${iconClass} text-emerald-600`} />;
    return <Brain className={`${iconClass} text-purple-600`} />;
  };

  return (
    <div
      className={`rounded-card border border-border bg-surface p-4 sm:p-5 shadow-card flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-ink-muted" />
          <h3 className="text-sm font-bold text-ink">Skills & Progress</h3>
        </div>
        <Link
          href="/skills"
          className="text-xs font-medium text-ink-muted hover:text-green flex items-center gap-1 transition-colors"
        >
          View all
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Skill List */}
      <div className="space-y-3.5 my-auto py-2">
        {items.map((item) => (
          <div key={item.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-surface-soft border border-border flex items-center justify-center shrink-0">
                  {getSkillIcon(item.name, item.tone)}
                </div>
                <span className="font-semibold text-ink">{item.name}</span>
              </div>
              <span className="text-[11px] font-medium text-ink-muted">{item.progressPercent}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-surface-soft overflow-hidden border border-border/40">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getToneBarColor(item.tone)}`}
                style={{ width: `${Math.min(Math.max(item.progressPercent, 5), 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
