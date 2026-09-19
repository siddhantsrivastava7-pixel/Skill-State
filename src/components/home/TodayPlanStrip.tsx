"use client";

import React, { useState } from "react";
import { Calendar, CheckSquare, Square } from "lucide-react";

export interface PlanItemTask {
  id: string;
  title: string;
  timeSlot: string;
  completed: boolean;
}

export interface TodayPlanStripProps {
  initialTasks?: PlanItemTask[];
  className?: string;
}

/**
 * TodayPlanStrip conforming to 06_COMPONENT_CATALOG.md, 04_DESIGN_SYSTEM.md, and skillstate-reference-ui.png:
 * - Exactly 4 actionable tasks
 * - Checklist completion counter: "X / 4 completed"
 * - Interactive toggleable state
 */
export function TodayPlanStrip({ initialTasks, className = "" }: TodayPlanStripProps) {
  // Default tasks matching reference UI
  const defaultTasks: PlanItemTask[] = [
    {
      id: "plan-1",
      title: "Watch: Python for Beginners",
      timeSlot: "10:00 AM",
      completed: true,
    },
    {
      id: "plan-2",
      title: "Practice: Variables & Data Types",
      timeSlot: "11:30 AM",
      completed: true,
    },
    {
      id: "plan-3",
      title: "Build: Simple Calculator",
      timeSlot: "2:00 PM",
      completed: false,
    },
    {
      id: "plan-4",
      title: "Read: How Python is used in real world",
      timeSlot: "4:00 PM",
      completed: false,
    },
  ];

  const [tasks, setTasks] = useState<PlanItemTask[]>(initialTasks || defaultTasks);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;

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
          {completedCount} / {tasks.length} completed
        </span>
      </div>

      {/* Task List */}
      <div className="space-y-2.5 my-auto py-2">
        {tasks.slice(0, 4).map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => toggleTask(task.id)}
            className="w-full flex items-center justify-between gap-2.5 text-left p-1.5 rounded-lg hover:bg-surface-soft transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {task.completed ? (
                <CheckSquare className="w-4 h-4 text-green shrink-0 fill-green/10" />
              ) : (
                <Square className="w-4 h-4 text-ink-muted/60 group-hover:text-ink shrink-0" />
              )}
              <span
                className={`text-xs truncate leading-tight ${
                  task.completed ? "line-through text-ink-muted font-normal" : "font-medium text-ink"
                }`}
              >
                {task.title}
              </span>
            </div>
            <span className="text-[11px] text-ink-muted/80 shrink-0 font-medium">{task.timeSlot}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
