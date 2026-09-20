export function isTrustedDemoRequest(
  aiMode: string | undefined,
  demoHeader: string | null
): boolean {
  return aiMode?.trim().toLowerCase() !== "live" && demoHeader === "1";
}

export function liveAIRequiresAuthentication(aiMode: string | undefined): boolean {
  return aiMode?.trim().toLowerCase() === "live";
}
