import { CapabilityLedger } from "@/components/skills/CapabilityLedger";

export const metadata = {
  title: "Skills & Verification | SkillState",
  description: "Complete capability ledger comparing self-reported claims against verified evidence.",
};

export default function SkillsPage() {
  return <CapabilityLedger />;
}
