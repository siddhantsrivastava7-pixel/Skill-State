import Link from "next/link";
import { Card } from "@/components/ui/Card";

const sections = [
  ["Getting Started", "SkillState works backward from a destination, compares its requirements with your evidence, and keeps an adaptive plan of the next useful work."],
  ["Capability states", "Verified means strong evidence supports the capability. Developing means useful evidence exists but is not broad or strong enough yet. Needs proof means you have claimed or indirect evidence to verify. Gap means required learning or experience is missing. Unverified means SkillState does not have enough evidence to decide."],
  ["Assess & Prove", "Verification tasks evaluate a specific capability against a rubric. Every completed assessment becomes durable evidence; one focused task may move a capability to Developing without proving the full breadth of the skill."],
  ["Career changes", "Changing destination preserves your evidence and assessment history. SkillState recalculates transferable capabilities, new gaps, and future work without creating a second learner journey."],
  ["Resources", "Resources are matched to canonical capability gaps. A genuinely novel generated capability may not have a catalog match yet; its Journey objective and verification criteria remain the source of truth."],
  ["Account & saved state", "Use Settings to edit your profile and goals. Your top-right profile menu also provides Settings, Help, and Sign out. Signing out does not delete your saved learner state."],
] as const;

export default function HelpPage() {
  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Help & Guidance</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          A concise guide to SkillState&apos;s evidence-first journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(([title, body]) => (
          <Card key={title} className="p-5 space-y-2">
            <h2 className="text-sm font-bold text-ink">{title}</h2>
            <p className="text-xs text-ink-muted leading-relaxed">{body}</p>
          </Card>
        ))}
      </div>
      <p className="text-xs text-ink-muted">
        Need to correct your information?{" "}
        <Link href="/settings" className="font-semibold text-accent hover:underline">Open Settings</Link>.
      </p>
    </div>
  );
}
