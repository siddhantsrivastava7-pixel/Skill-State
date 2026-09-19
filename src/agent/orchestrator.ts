import { AIProvider } from "./provider";
import { DemoAIProvider } from "./demo-provider";

let currentProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!currentProvider) {
    // Phase 1: Always use DemoAIProvider. Phase 7 will add LiveAIProvider switch.
    currentProvider = new DemoAIProvider();
  }
  return currentProvider;
}
