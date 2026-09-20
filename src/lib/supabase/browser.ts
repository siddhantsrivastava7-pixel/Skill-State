"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "./config";

let browserClient: SupabaseClient | null = null;

export function isBrowserSupabaseConfigured(): boolean {
  return getPublicSupabaseConfig().configured;
}

export function getBrowserSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const config = getPublicSupabaseConfig();
  if (!config.configured) {
    throw new Error("SkillState authentication is not configured.");
  }

  browserClient = createClient(config.url, config.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return browserClient;
}
