import { AIProvider } from "./provider";
import { DemoAIProvider } from "./demo-provider";
import { OpenAIProvider } from "./openai-provider";

let currentProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!currentProvider) {
    const mode = process.env.SKILLSTATE_AI_MODE?.trim().toLowerCase() || "demo";
    if (mode !== "demo" && mode !== "live") {
      throw new Error("SKILLSTATE_AI_MODE must be either 'demo' or 'live'.");
    }
    currentProvider = mode === "live" ? new OpenAIProvider() : new DemoAIProvider();
  }
  return currentProvider;
}

export function resetAIProviderForTests(): void {
  currentProvider = null;
}
