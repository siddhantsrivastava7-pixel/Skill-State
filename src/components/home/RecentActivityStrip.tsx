import React from "react";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { ActivityEvent } from "@/domain/types";

export interface RecentActivityStripProps {
  activities?: ActivityEvent[];
  className?: string;
}

export function meaningfulRecentActivities(activities: ActivityEvent[]): ActivityEvent[] {
  return activities
    .filter((item) => !(item.type === "DESTINATION_CHANGED" && item.title.startsWith("Journey created for")))
    .slice()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * RecentActivityStrip conforming to Phase 4.3 specifications:
 * - Exactly ONE instance on Home screen
 * - Driven entirely by active persona's activity ledger (`ActivityEvent[]`)
 * - Displays active persona's recent events (up to 4)
 * - Color-coded event indicators based on activity type
 * - "View all ->" link to /journey
 */
export function RecentActivityStrip({ activities = [], className = "" }: RecentActivityStripProps) {
  const items = meaningfulRecentActivities(activities).slice(0, 4);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp;
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (sameDay) return `Today, ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  };

  const getDotStyle = (type: string) => {
    switch (type) {
      case "PROJECT_ADDED":
        return "bg-green ring-2 ring-green/20";
      case "DESTINATION_CHANGED":
        return "bg-blue ring-2 ring-blue/20";
      case "VERIFICATION_COMPLETED":
        return "bg-[#8B5CF6] ring-2 ring-[#8B5CF6]/20";
      case "ACTIVITY_COMPLETED":
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
        {items.length === 0 ? (
          <p className="text-xs text-ink-muted py-2">Complete an assessment, add evidence, or finish a project to start your activity history.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${getDotStyle(item.type)}`} />
                <span className="font-medium text-ink truncate">{item.title}</span>
              </div>
              <span className="text-[11px] text-ink-muted/80 shrink-0 whitespace-nowrap">
                {formatTimestamp(item.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
