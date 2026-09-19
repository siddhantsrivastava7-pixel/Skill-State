import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Briefcase } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Projects & Proof</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Proof projects matched directly to unverified destination requirements
        </p>
      </div>

      <Card>
        <EmptyState
          icon={<Briefcase className="w-6 h-6 text-brandOrange" />}
          title="Proof Planning & Scopes"
          description="Proof project recommendations and scopes will be rendered here in Phase 6."
        />
      </Card>
    </div>
  );
}
