import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Award } from "lucide-react";

export default function SkillsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Skills & Verification</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Claimed state vs verified state grouped by capability families
        </p>
      </div>

      <Card>
        <EmptyState
          icon={<Award className="w-6 h-6 text-brandGreen" />}
          title="Capability Ledger & Evidence Detail"
          description="SkillStateRows, verification statuses, and evidence drawers will be rendered here in Phase 5."
        />
      </Card>
    </div>
  );
}
