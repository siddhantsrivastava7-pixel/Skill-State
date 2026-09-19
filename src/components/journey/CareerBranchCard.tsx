import React from "react";
import { Brain, Database, Code2, ShieldCheck, ChevronRight, TrendingUp, Sparkles, LineChart } from "lucide-react";

export interface CareerBranchCardProps {
  careerId: string;
  title: string;
  descriptor: string;
  tone: "purple" | "green" | "orange" | "blue";
  selected?: boolean;
  compact?: boolean;
  onSelect?: (careerId: string) => void;
  className?: string;
}

/**
 * CareerBranchCard conforming to 06_COMPONENT_CATALOG.md, 04_DESIGN_SYSTEM.md, and Phase 4.1:
 * - Tone-coded border, subtle background, icon, and right chevron
 * - Compact mode for exact destination adjacent career previews
 * - Visual secondary emphasis for preview branches
 */
export function CareerBranchCard({
  careerId,
  title,
  descriptor,
  tone,
  selected = false,
  compact = false,
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
      defaultIcon: <Brain className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />,
    },
    green: {
      card: "bg-[#F4FBF7] border-[#CFEFE1] hover:border-[#9EE1C3]",
      selected: "ring-2 ring-[#10B981] border-[#10B981] shadow-sm",
      iconBg: "bg-[#E6F8EF] text-[#059669]",
      chevron: "text-[#10B981]",
      defaultIcon: <Database className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />,
    },
    orange: {
      card: "bg-[#FFFBF5] border-[#FCE6D2] hover:border-[#F8C99F]",
      selected: "ring-2 ring-[#F59E0B] border-[#F59E0B] shadow-sm",
      iconBg: "bg-[#FEF3E2] text-[#D97706]",
      chevron: "text-[#F59E0B]",
      defaultIcon: <Code2 className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />,
    },
    blue: {
      card: "bg-[#F5FAFF] border-[#D6E8FE] hover:border-[#A8CDFC]",
      selected: "ring-2 ring-[#3B82F6] border-[#3B82F6] shadow-sm",
      iconBg: "bg-[#EAF2FE] text-[#2563EB]",
      chevron: "text-[#3B82F6]",
      defaultIcon: <ShieldCheck className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />,
    },
  };

  const style = toneMap[tone] || toneMap.purple;

  // Icon mapping based on career title
  const lowerTitle = title.toLowerCase();
  let icon = style.defaultIcon;
  const iconClass = compact ? "w-3.5 h-3.5" : "w-4 h-4";

  if (lowerTitle.includes("ai") || lowerTitle.includes("ml") || lowerTitle.includes("intelligence")) {
    icon = <Brain className={iconClass} />;
  } else if (lowerTitle.includes("data")) {
    icon = <Database className={iconClass} />;
  } else if (lowerTitle.includes("backend") || lowerTitle.includes("software") || lowerTitle.includes("code")) {
    icon = <Code2 className={iconClass} />;
  } else if (lowerTitle.includes("security") || lowerTitle.includes("cyber")) {
    icon = <ShieldCheck className={iconClass} />;
  } else if (lowerTitle.includes("finance") || lowerTitle.includes("analyst") || lowerTitle.includes("consultant")) {
    icon = <TrendingUp className={iconClass} />;
  } else if (lowerTitle.includes("accountant") || lowerTitle.includes("audit")) {
    icon = <LineChart className={iconClass} />;
  } else {
    icon = <Sparkles className={iconClass} />;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(careerId)}
      className={`w-full text-left transition-all duration-200 flex items-center justify-between gap-2.5 group select-none ${
        compact ? "rounded-lg border p-2 sm:p-2.5 shadow-subtle" : "rounded-xl border p-2.5 sm:p-3"
      } ${style.card} ${selected ? style.selected : ""} ${className}`}
      aria-label={`Preview career path: ${title}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Icon circle */}
        <div
          className={`rounded-md flex items-center justify-center shrink-0 ${
            compact ? "w-7 h-7" : "w-8 h-8 rounded-lg"
          } ${style.iconBg}`}
        >
          {icon}
        </div>

        {/* Text stack */}
        <div className="min-w-0 flex-1">
          <h4
            className={`font-semibold text-ink truncate leading-snug ${
              compact ? "text-xs" : "text-xs sm:text-sm"
            }`}
          >
            {title}
          </h4>
          <p className={`text-ink-muted truncate ${compact ? "text-[10px] mt-0.5" : "text-[11px] mt-0.5"}`}>
            {descriptor}
          </p>
        </div>
      </div>

      {/* Right chevron */}
      <ChevronRight
        className={`shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
          compact ? "w-3.5 h-3.5" : "w-4 h-4"
        } ${style.chevron}`}
      />
    </button>
  );
}
