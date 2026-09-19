import React from "react";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";

export interface ActivityItem {
  id: string;
  title: string;
  timestamp: string;
  dotColor: "green" | "blue" | "purple" | "orange";
}

export interface RecentActivityStripProps {
  activities?: ActivityItem[];
  className?: string;
}

/**
 * RecentActivityStrip conforming to 06_COMPONENT_CATALOG.md, 04_DESIGN_SYSTEM.md, and skillstate-reference-ui.png:
 * - 3–4 recent ledger items
 * - Colored status indicators
 * - Relative timestamps
 * - "View all ->" link to /journey
 */
export function RecentActivityStrip({ activities, className = "" }: RecentActivityStripProps) {
  // Default activity logs matching reference UI
  const defaultActivities: ActivityItem[] = [
    {
      id: "act-1",
      title: "Completed quiz: Python Basics",
      timestamp: "2 hours ago",
      dotColor: "green",
    },
    {
      id: "act-2",
      title: "Saved career path: Data Engineer",
      timestamp: "5 hours ago",
      dotColor: "blue",
    },
    {
      id: "act-3",
      title: "Added to bookmarks: Machine Learning",
      timestamp: "1 day ago",
      dotColor: "purple",
    },
  ];

  const items = activities && activities.length > 0 ? activities.slice(0, 4) : defaultActivities;

  const getDotStyle = (color: string) => {
    switch (color) {
      case "green":
        return "bg-green ring-2 ring-green/20";
      case "blue":
        return "bg-blue ring-2 ring-blue/20";
      case "purple":
        return "bg-[#8B5CF6] ring-2 ring-[#8B5CF6]/20";
      case "orange":
      default:
        return "bg-orange ring-2 ring-orange/20";
    }
  };

  return (
    <div
      className={`rounded-card border border-border bg-surface p-4 sm:p-5 shadow-card flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-ink-muted" />
          <h3 className="text-sm font-bold text-ink">Recent Activity</h3>
        </div>
        <Link
          href="/journey"
          className="text-xs font-medium text-ink-muted hover:text-green flex items-center gap-1 transition-colors"
        >
          View all
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Activity List */}
      <div className="space-y-3.5 my-auto py-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${getDotStyle(item.dotColor)}`} />
              <span className="font-medium text-ink truncate">{item.title}</span>
            </div>
            <span className="text-[11px] text-ink-muted/80 shrink-0 whitespace-nowrap">
              {item.timestamp}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
