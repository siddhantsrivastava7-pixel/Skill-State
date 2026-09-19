import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileBarChart } from "lucide-react";

export default function ReportPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Progress Report</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Verified skills, in-progress capabilities, remaining gaps, and recent plan adaptations
        </p>
      </div>

      <Card>
        <EmptyState
          icon={<FileBarChart className="w-6 h-6 text-accent" />}
          title="Progress Report Generator"
          description="Periodic progress reports and summaries will be rendered here in Phase 8."
        />
      </Card>
    </div>
  );
}
