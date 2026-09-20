"use client";

import { withBasePath } from "@/lib/app-path";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

let clientDemoMode = false;

export function setClientDemoMode(enabled: boolean): void {
  clientDemoMode = enabled;
}

function isDemoRequest(): boolean {
  return clientDemoMode || (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("demo") === "1"
  );
}

export async function authenticatedAppFetch(
  path: string,
  init: RequestInit = {},
  options: { idempotencyKey?: string } = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (isDemoRequest()) {
    headers.set("x-skillstate-demo", "1");
  } else {
    const { data, error } = await getBrowserSupabaseClient().auth.getSession();
    if (error || !data.session?.access_token) {
      throw new Error("Your SkillState session has expired. Please sign in again.");
    }
    headers.set("authorization", `Bearer ${data.session.access_token}`);
  }
  if (options.idempotencyKey) {
    headers.set("x-idempotency-key", options.idempotencyKey);
  }
  return fetch(withBasePath(path), { ...init, headers });
}
