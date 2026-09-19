import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sparkles } from "lucide-react";

export default function OnboardingPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Onboarding</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Four-step initial assessment: stage, destination certainty, evidence ingestion, and constraints
        </p>
      </div>

      <Card>
        <EmptyState
          icon={<Sparkles className="w-6 h-6 text-accent" />}
          title="Onboarding Flow"
          description="The 4-step onboarding flow will be implemented here in Phase 3."
        />
      </Card>
    </div>
  );
}
