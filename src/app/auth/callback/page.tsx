"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthProvider";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [router, status]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="text-sm text-ink-muted">Completing your SkillState sign-in…</p>
    </div>
  );
}
