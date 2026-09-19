import React from "react";
import { Brain, Database, Code2, ShieldCheck, ChevronRight, TrendingUp, Sparkles } from "lucide-react";

export interface CareerBranchCardProps {
  careerId: string;
  title: string;
  descriptor: string;
  tone: "purple" | "green" | "orange" | "blue";
  selected?: boolean;
  onSelect?: (careerId: string) => void;
  className?: string;
}

/**
 * CareerBranchCard conforming to 06_COMPONENT_CATALOG.md and 04_DESIGN_SYSTEM.md:
 * - Approx 236px x 58px
 * - Border + pale background based on branch tone
 * - Tone-coded icon, title, descriptor, chevron
 * - Click sets preview emphasis without mutating underlying destination
 */
export function CareerBranchCard({
  careerId,
  title,
  descriptor,
  tone,
  selected = false,
  onSelect,
  className = "",
}: CareerBranchCardProps) {
  // Tone palette configuration
  const toneMap = {
    purple: {
      card: "bg-[#FBF9FF] border-[#E6DBFC] hover:border-[#CBB2F8]",
      selected: "ring-2 ring-[#8B5CF6] border-[#8B5CF6] shadow-sm",
      iconBg: "bg-[#F1EAFF] text-[#7C3AED]",
      chevron: "text-[#8B5CF6]",
      defaultIcon: <Brain className="w-4 h-4" />,
    },
    green: {
      card: "bg-[#F4FBF7] border-[#CFEFE1] hover:border-[#9EE1C3]",
      selected: "ring-2 ring-[#10B981] border-[#10B981] shadow-sm",
      iconBg: "bg-[#E6F8EF] text-[#059669]",
      chevron: "text-[#10B981]",
      defaultIcon: <Database className="w-4 h-4" />,
    },
    orange: {
      card: "bg-[#FFFBF5] border-[#FCE6D2] hover:border-[#F8C99F]",
      selected: "ring-2 ring-[#F59E0B] border-[#F59E0B] shadow-sm",
      iconBg: "bg-[#FEF3E2] text-[#D97706]",
      chevron: "text-[#F59E0B]",
      defaultIcon: <Code2 className="w-4 h-4" />,
    },
    blue: {
      card: "bg-[#F5FAFF] border-[#D6E8FE] hover:border-[#A8CDFC]",
      selected: "ring-2 ring-[#3B82F6] border-[#3B82F6] shadow-sm",
      iconBg: "bg-[#EAF2FE] text-[#2563EB]",
      chevron: "text-[#3B82F6]",
      defaultIcon: <ShieldCheck className="w-4 h-4" />,
    },
  };

  const style = toneMap[tone] || toneMap.purple;

  // Choose icon based on title keywords if appropriate
  let icon = style.defaultIcon;
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("ai") || lowerTitle.includes("intelligence") || lowerTitle.includes("ml")) {
    icon = <Brain className="w-4 h-4" />;
  } else if (lowerTitle.includes("data") || lowerTitle.includes("database")) {
    icon = <Database className="w-4 h-4" />;
  } else if (lowerTitle.includes("backend") || lowerTitle.includes("software") || lowerTitle.includes("code")) {
    icon = <Code2 className="w-4 h-4" />;
  } else if (lowerTitle.includes("security") || lowerTitle.includes("cyber")) {
    icon = <ShieldCheck className="w-4 h-4" />;
  } else if (lowerTitle.includes("finance") || lowerTitle.includes("analyst") || lowerTitle.includes("consultant")) {
    icon = <TrendingUp className="w-4 h-4" />;
  } else {
    icon = <Sparkles className="w-4 h-4" />;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(careerId)}
      className={`w-full text-left rounded-xl border p-2.5 sm:p-3 transition-all duration-200 flex items-center justify-between gap-3 group select-none ${
        style.card
      } ${selected ? style.selected : "shadow-subtle"} ${className}`}
      aria-label={`Preview career branch: ${title}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Icon circle */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.iconBg}`}>
          {icon}
        </div>

        {/* Text stack */}
        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-sm font-semibold text-ink truncate group-hover:text-ink transition-colors leading-snug">
            {title}
          </h4>
          <p className="text-[11px] text-ink-muted truncate mt-0.5">{descriptor}</p>
        </div>
      </div>

      {/* Right chevron */}
      <ChevronRight
        className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${style.chevron}`}
      />
    </button>
  );
}
