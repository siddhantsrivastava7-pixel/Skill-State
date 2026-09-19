import type { ActionItem } from "./types";

export interface ScheduledAction {
  action: ActionItem;
  scheduledMinutes: number;
  isPartial: boolean;
}

/** Five active study days, capped to focused two-hour sessions and four items. */
export function buildTodaySchedule(
  actions: ActionItem[],
  weeklyHours: number
): ScheduledAction[] {
  let remaining = Math.max(0, Math.floor((weeklyHours * 60) / 5));
  const scheduled: ScheduledAction[] = [];
  for (const action of actions) {
    if (remaining <= 0 || scheduled.length >= 4) break;
    const scheduledMinutes = Math.min(action.estimatedMinutes, remaining, 120);
    if (scheduledMinutes <= 0) continue;
    scheduled.push({
      action,
      scheduledMinutes,
      isPartial: scheduledMinutes < action.estimatedMinutes,
    });
    remaining -= scheduledMinutes;
  }
  return scheduled;
}
