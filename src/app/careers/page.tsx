import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Compass } from "lucide-react";

export default function CareersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Career Paths</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Explore alternative career paths across Technology, Design, Business, Finance, and Research
        </p>
      </div>

      <Card>
        <EmptyState
          icon={<Compass className="w-6 h-6 text-accent" />}
          title="Career Exploration & Path Preview"
          description="Non-engineering and technology career previews will be rendered here in Phase 6."
        />
      </Card>
    </div>
  );
}
