import type { AIProvider } from "./provider";
import type { CompileDestinationInput } from "@/domain/types";

export function compileOnboardingDestination(
  provider: AIProvider,
  input: CompileDestinationInput
) {
  return provider.compileDestination(input);
}
