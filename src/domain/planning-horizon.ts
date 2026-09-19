import { LearnerStage, PlanningHorizon, PlanningHorizonMode } from "./types";

/**
 * Calculates estimated remaining months until graduation for school/college students.
 * Standard 4-year undergraduate estimate:
 * Year 1 -> 36 months remaining
 * Year 2 -> 24 months remaining
 * Year 3 -> 12 months remaining
 * Year 4 -> 6 months remaining
 * Year 5+ -> do not infer; require custom duration.
 *
 * Clearly an editable estimate, not a fact.
 */
export function calculateGraduationEstimate(
  stage: LearnerStage,
  collegeYear?: string,
  stageDetail?: string
): number | null {
  if (stage === "college") {
    switch (collegeYear) {
      case "1":
        return 36;
      case "2":
        return 24;
      case "3":
        return 12;
      case "4":
        return 6;
      case "5+":
      default:
        return null; // Year 5+: do not infer, require custom duration
    }
  }

  if (stage === "school") {
    const detail = (stageDetail || "").toLowerCase();
    if (detail.includes("12")) return 12;
    if (detail.includes("11")) return 24;
    if (detail.includes("10")) return 36;
    return 12; // Default reasonable estimate for high school graduation
  }

  return null;
}

export interface ResolvePlanningHorizonInput {
  mode: PlanningHorizonMode;
  customMonths?: number;
  stage: LearnerStage;
  collegeYear?: string;
  stageDetail?: string;
}

/**
 * Resolves the effective planning horizon in months, if applicable.
 * For 'full-path', does not force a numeric month value.
 */
export function resolvePlanningHorizon(
  input: ResolvePlanningHorizonInput
): PlanningHorizon {
  const { mode, customMonths, stage, collegeYear, stageDetail } = input;

  switch (mode) {
    case "six-months":
      return {
        mode: "six-months",
        resolvedMonths: 6,
        isEstimate: false,
      };

    case "twelve-months":
      return {
        mode: "twelve-months",
        resolvedMonths: 12,
        isEstimate: false,
      };

    case "until-graduation": {
      const estimated = calculateGraduationEstimate(stage, collegeYear, stageDetail);
      return {
        mode: "until-graduation",
        resolvedMonths: estimated ?? undefined,
        isEstimate: true,
      };
    }

    case "custom":
      return {
        mode: "custom",
        customMonths,
        resolvedMonths: customMonths,
        isEstimate: false,
      };

    case "full-path":
      // Full path does not force a fake exact completion date
      return {
        mode: "full-path",
        resolvedMonths: undefined,
        isEstimate: false,
      };
  }
}
