import { VerificationWorkbench } from "@/components/assess/VerificationWorkbench";
import { ASSESS_INTRO_COPY } from "@/domain/copy";

export const metadata = {
  title: "Assess & Prove | SkillState",
  description: ASSESS_INTRO_COPY,
};

export default function AssessPage() {
  return <VerificationWorkbench />;
}
