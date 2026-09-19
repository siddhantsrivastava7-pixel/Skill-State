import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";

export default function ExperiencePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Experience & Opportunities</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Internships, hackathons, and practical non-course development
        </p>
      </div>

      <Card>
        <EmptyState
          icon={<FileText className="w-6 h-6 text-ink-muted" />}
          title="Experience Recommendations"
          description="Contextual opportunities and timing recommendations will be rendered here in Phase 6."
        />
      </Card>
    </div>
  );
}
