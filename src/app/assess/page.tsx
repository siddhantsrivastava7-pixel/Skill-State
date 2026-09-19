import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckCircle2 } from "lucide-react";

export default function AssessPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Assess & Prove</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Verify claimed skills, repair weak areas, and review evidence impact
        </p>
      </div>

      <Card>
        <EmptyState
          icon={<CheckCircle2 className="w-6 h-6 text-brandBlue" />}
          title="Verification Queue & Tasks"
          description="Scenario assessments, quick checks, and plan-changing result panels will be rendered here in Phase 5."
        />
      </Card>
    </div>
  );
}
