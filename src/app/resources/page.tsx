import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookOpen } from "lucide-react";

export default function ResourcesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Learning Resources</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Curated learning resources tied strictly to identified skill gaps
        </p>
      </div>

      <Card>
        <EmptyState
          icon={<BookOpen className="w-6 h-6 text-brandGreen" />}
          title="Gap-Matched Learning Resources"
          description="Resource recommendations grouped by gap will be rendered here in Phase 6."
        />
      </Card>
    </div>
  );
}
