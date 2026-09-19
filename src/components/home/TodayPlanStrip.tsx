"use client";

import React, { useState, useEffect } from "react";
import { Calendar, CheckSquare, Square } from "lucide-react";
import { ActionItem } from "@/domain/types";

export type TodayPlanStripProps = {
  actions: ActionItem[];
  className?: string;
};

/**
 * TodayPlanStrip conforming to Phase 4.3 specifications:
 * - Exactly ONE instance on Home screen
 * - Accepts active persona's plan/actions (`ActionItem[]`)
 * - Displays active persona's daily actions (up to 4)
 * - Interactive completion toggle with completed counter
 * - Updates in place upon persona switch without component recreation
 */
export function TodayPlanStrip({ actions = [], className = "" }: TodayPlanStripProps) {
  const displayActions = actions.slice(0, 4);

  // Initialize completed state from action status
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set(displayActions.filter((a) => a.status === "done").map((a) => a.id))
  );

  // Sync completion state when actions change (e.g. persona switch)
  useEffect(() => {
    const activeSlice = actions.slice(0, 4);
    setCompletedIds(new Set(activeSlice.filter((a) => a.status === "done").map((a) => a.id)));
  }, [actions]);

  const toggleAction = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const completedCount = displayActions.filter((a) => completedIds.has(a.id)).length;

  return (
    <div
      className={`rounded-card border border-border bg-surface p-4 sm:p-5 shadow-card flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-ink-muted" />
          <h3 className="text-sm font-bold text-ink">Today&apos;s Plan</h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-soft text-green border border-green/20">
          {completedCount} / {displayActions.length} completed
        </span>
      </div>

      {/* Action List */}
      <div className="space-y-2.5 my-auto py-2">
        {displayActions.length === 0 ? (
          <p className="text-xs text-ink-muted py-2">No planned tasks for today.</p>
        ) : (
          displayActions.map((action) => {
            const isCompleted = completedIds.has(action.id);

            return (
              <button
                key={action.id}
                type="button"
                onClick={() => toggleAction(action.id)}
                className="w-full flex items-center justify-between gap-2.5 text-left p-1.5 rounded-lg hover:bg-surface-soft transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isCompleted ? (
                    <CheckSquare className="w-4 h-4 text-green shrink-0 fill-green/10" />
                  ) : (
                    <Square className="w-4 h-4 text-ink-muted/60 group-hover:text-ink shrink-0" />
                  )}
                  <span
                    className={`text-xs truncate leading-tight ${
                      isCompleted ? "line-through text-ink-muted font-normal" : "font-medium text-ink"
                    }`}
                  >
                    {action.title}
                  </span>
                </div>
                {action.estimatedMinutes ? (
                  <span className="text-[11px] text-ink-muted/80 shrink-0 font-medium">
                    {action.estimatedMinutes}m
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
