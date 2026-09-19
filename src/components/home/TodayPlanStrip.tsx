"use client";

import React, { useState, useEffect } from "react";
import { Calendar, CheckSquare, Square } from "lucide-react";
import { ActionItem } from "@/domain/types";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import { getClientAIProvider } from "@/agent/client-provider";
import { buildTodaySchedule } from "@/domain/daily-scheduling";

export type TodayPlanStripProps = {
  actions: ActionItem[];
  weeklyHours?: number;
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
export function TodayPlanStrip({ actions = [], weeklyHours, className = "" }: TodayPlanStripProps) {
  const schedule = weeklyHours === undefined
    ? actions.slice(0, 4).map((action) => ({ action, scheduledMinutes: action.estimatedMinutes, isPartial: false }))
    : buildTodaySchedule(actions, weeklyHours);
  const displayActions = schedule.map((item) => item.action);
  const completeAction = useSkillStateStore((state) => state.completeAction);
  const setPlan = useSkillStateStore((state) => state.setPlan);

  // Initialize completed state from action status
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set(displayActions.filter((a) => a.status === "done" || a.status === "verified").map((a) => a.id))
  );

  // Sync completion state when actions change (e.g. persona switch)
  useEffect(() => {
    const activeSlice = actions.slice(0, 4);
    setCompletedIds(new Set(activeSlice.filter((a) => a.status === "done" || a.status === "verified").map((a) => a.id)));
  }, [actions]);

  const toggleAction = (action: ActionItem) => {
    if (action.status === "done" || action.status === "verified") return;
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (action.category !== "prove") next.add(action.id);
      return next;
    });
    completeAction(action.id);

    const state = useSkillStateStore.getState();
    void getClientAIProvider()
      .buildPlan({
        profile: state.profile,
        graph: state.destinationGraph,
        verifiedStates: state.verifiedStates,
        claimedStates: state.claimedStates,
        gaps: state.gaps,
        planningReason: "activity-completion",
        currentPlan: state.plan,
        triggerEvent: state.activityLedger.at(-1),
      })
      .then((replanned) => {
        const completedStatus = action.category === "prove" ? "attempted" as const : "done" as const;
        const preserveCompletion = (item: ActionItem) =>
          item.id === action.id ? { ...item, status: completedStatus } : item;
        setPlan({
          ...replanned,
          now: replanned.now.map(preserveCompletion),
          weeks: replanned.weeks.map((week) => ({
            ...week,
            actions: week.actions.map(preserveCompletion),
          })),
        });
      })
      .catch(() => {
        // The deterministic completion and ledger event remain valid; invalid AI output is not applied.
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
          schedule.map(({ action, scheduledMinutes, isPartial }) => {
            const isCompleted = completedIds.has(action.id);

            return (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  if (!isPartial) toggleAction(action);
                }}
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
                {scheduledMinutes ? (
                  <span className="text-[11px] text-ink-muted/80 shrink-0 font-medium">
                    {scheduledMinutes}m{isPartial ? " session" : ""}
                  </span>
                ) : null}
                {action.category === "prove" && action.status === "attempted" && (
                  <span className="text-[10px] text-brandOrange font-semibold shrink-0">Attempted</span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
