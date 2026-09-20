import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "./config";

function serverAuthOptions() {
  return {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  } as const;
}

export function createServerAuthClient(): SupabaseClient {
  const config = getPublicSupabaseConfig();
  if (!config.configured) {
    throw new Error("Supabase authentication environment is not configured.");
  }
  return createClient(config.url, config.publishableKey, serverAuthOptions());
}

export function createServerAdminClient(): SupabaseClient {
  const config = getPublicSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config.url || !serviceRoleKey) {
    throw new Error("Supabase server persistence environment is not configured.");
  }
  return createClient(config.url, serviceRoleKey, serverAuthOptions());
}
