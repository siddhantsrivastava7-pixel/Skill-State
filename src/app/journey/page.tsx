import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Map } from "lucide-react";

export default function JourneyPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">My Journey</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Multi-period adaptive roadmap from current state to destination
        </p>
      </div>

      <Card>
        <EmptyState
          icon={<Map className="w-6 h-6 text-accent" />}
          title="Adaptive Journey Timeline"
          description="Timeline, plan blocks, and What If simulator will be rendered here in Phase 6."
        />
      </Card>
    </div>
  );
}
