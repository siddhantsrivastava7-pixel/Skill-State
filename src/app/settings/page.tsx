"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, InlineNotice, Input, Modal } from "@/components/ui";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import { formatPlanningHorizonLabel } from "@/domain/planning-horizon";

type AIStatus = {
  mode: "demo" | "live";
  status: "checking" | "ready" | "connected" | "not-configured" | "unavailable";
};

const STAGE_LABELS = {
  school: "Class 10–12",
  college: "College / university",
  graduate: "Graduate",
  professional: "Working professional",
} as const;

function formatPlanningHorizon(profile: ReturnType<typeof useSkillStateStore.getState>["profile"]) {
  return formatPlanningHorizonLabel(profile.planningHorizon, profile.targetTimelineMonths);
}

export default function SettingsPage() {
  const router = useRouter();
  const profile = useSkillStateStore((state) => state.profile);
  const destination = useSkillStateStore((state) => state.destination);
  const setProfile = useSkillStateStore((state) => state.setProfile);
  const restartOnboarding = useSkillStateStore((state) => state.restartOnboarding);
  const resetStore = useSkillStateStore((state) => state.resetStore);

  const [name, setName] = useState(profile.name);
  const [weeklyHours, setWeeklyHours] = useState(profile.weeklyHours);
  const [saved, setSaved] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [aiStatus, setAIStatus] = useState<AIStatus>({ mode: "demo", status: "checking" });

  useEffect(() => {
    setName(profile.name);
    setWeeklyHours(profile.weeklyHours);
  }, [profile.name, profile.weeklyHours]);

  useEffect(() => {
    let active = true;
    fetch("/api/agent/status", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as AIStatus;
        if (active) setAIStatus(result);
      })
      .catch(() => {
        if (active) setAIStatus((current) => ({ ...current, status: "unavailable" }));
      });
    return () => {
      active = false;
    };
  }, []);

  const connectionLabel = useMemo(() => {
    switch (aiStatus.status) {
      case "checking":
        return "Checking…";
      case "connected":
        return "Connected";
      case "ready":
        return "Ready";
      case "not-configured":
        return "Not configured";
      default:
        return "Unavailable";
    }
  }, [aiStatus.status]);

  const saveProfile = () => {
    setProfile({
      ...profile,
      name: name.trim() || profile.name,
      weeklyHours: Math.max(1, Math.min(168, weeklyHours)),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2_000);
  };

  const beginOnboarding = (reset: boolean) => {
    if (reset) resetStore();
    else restartOnboarding();
    router.replace("/onboarding");
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Manage your learner profile, AI status, and local SkillState data.
        </p>
      </div>

      <Card className="p-5 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-ink">Profile</h2>
          <p className="text-xs text-ink-muted mt-0.5">Your current planning context.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Learner name" value={name} onChange={(event) => setName(event.target.value)} />
          <Input
            label="Weekly hours"
            type="number"
            min={1}
            max={168}
            value={weeklyHours}
            onChange={(event) => setWeeklyHours(Number(event.target.value))}
          />
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-ink">Current stage</p>
            <p className="px-3.5 py-2 text-sm bg-surface-soft text-ink-muted border border-border rounded-sm">
              {STAGE_LABELS[profile.stage]}{profile.stageDetail ? ` · ${profile.stageDetail}` : ""}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-ink">Current destination</p>
            <p className="px-3.5 py-2 text-sm bg-surface-soft text-ink-muted border border-border rounded-sm">
              {destination || "Not set"}
            </p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <p className="text-xs font-medium text-ink">Planning horizon</p>
            <p className="px-3.5 py-2 text-sm bg-surface-soft text-ink-muted border border-border rounded-sm">
              {formatPlanningHorizon(profile)}
            </p>
          </div>
        </div>

        {saved && <InlineNotice variant="success">Profile settings saved.</InlineNotice>}

        <div className="flex flex-wrap gap-2">
          <Button onClick={saveProfile} disabled={!name.trim()}>Save profile</Button>
          <Button variant="secondary" onClick={() => router.push("/onboarding?edit=1")}>
            Edit onboarding answers
          </Button>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">AI</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Connection details are checked securely on the server.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={aiStatus.mode === "live" ? "green" : "accent"}>
            {aiStatus.mode === "live" ? "Live AI" : "Demo AI"}
          </Badge>
          <Badge
            variant={
              aiStatus.status === "connected" || aiStatus.status === "ready"
                ? "green"
                : aiStatus.status === "checking"
                  ? "default"
                  : "red"
            }
          >
            {connectionLabel}
          </Badge>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Data &amp; onboarding</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Both actions return you to onboarding. Reset also removes all locally persisted learner data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => beginOnboarding(false)}>
            Restart onboarding
          </Button>
          <Button variant="danger" onClick={() => setResetOpen(true)}>
            Reset SkillState
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset SkillState?"
        subtitle="This clears your learner profile, evidence, plans, reports, and activity from this browser."
        maxWidth="sm"
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setResetOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => beginOnboarding(true)}>Reset SkillState</Button>
        </div>
      </Modal>
    </div>
  );
}
