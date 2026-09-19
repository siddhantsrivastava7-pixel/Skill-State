import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Manage demo personas, reset local store, and configure AI mode
        </p>
      </div>

      <Card>
        <EmptyState
          icon={<Settings className="w-6 h-6 text-ink-muted" />}
          title="Settings & Demo Preferences"
          description="Demo preferences and store controls."
        />
      </Card>
    </div>
  );
}
