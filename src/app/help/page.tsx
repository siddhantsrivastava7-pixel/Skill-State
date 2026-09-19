import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { HelpCircle } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Help & Guidance</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Understanding SkillState: How reverse-planning and verification work
        </p>
      </div>

      <Card>
        <EmptyState
          icon={<HelpCircle className="w-6 h-6 text-ink-muted" />}
          title="SkillState Guidance"
          description="Guidelines on claimed vs verified skills, proof tasks, and path morphing."
        />
      </Card>
    </div>
  );
}
