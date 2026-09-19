export const APP_NAME = "SkillState";
export const APP_TAGLINE = "Plan. Learn. Prove. Grow.";

export const STORAGE_KEYS = {
  STORE: "skillstate_demo_store",
} as const;

export const DEFAULT_AI_MODE: "demo" | "live" = "demo";

export const CAPABILITY_STATUSES = [
  "verified",
  "developing",
  "needs-proof",
  "gap",
  "unverified",
] as const;

export const GAP_TYPES = [
  "never-learned",
  "weak",
  "false-confidence",
  "knowledge-no-proof",
  "missing-experience",
] as const;

export const GAP_PRIORITIES = ["critical", "high", "medium", "low"] as const;
