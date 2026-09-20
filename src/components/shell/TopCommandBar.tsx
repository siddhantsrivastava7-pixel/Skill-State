"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, HelpCircle, LogOut, Settings } from "lucide-react";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import { useAuth } from "@/auth/AuthProvider";

export interface TopCommandBarProps {
  onOpenAsk?: () => void;
  userName?: string;
  stageLabel?: string;
}

export function TopCommandBar({
  onOpenAsk,
  userName,
  stageLabel,
}: TopCommandBarProps) {
  const profile = useSkillStateStore((s) => s.profile);
  const auth = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = userName || profile.name || "Siddhant";
  const displayStage =
    stageLabel ||
    profile.stageDetail ||
    (profile.stage === "school" ? "Class 12" : profile.stage);

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Handle global ⌘K / Ctrl+K shortcut to trigger Ask / Command panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenAsk?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenAsk]);

  return (
    <header className="h-16 fixed top-0 right-0 left-0 md:left-[208px] z-20 bg-canvas/90 backdrop-blur-sm border-b border-border px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Search / Ask Trigger Input */}
      <div className="flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenAsk}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-surface text-ink-muted border border-border rounded-sm text-xs hover:border-ink-muted/40 transition-colors duration-180 text-left shadow-xs group"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-ink-muted group-hover:text-ink transition-colors flex-shrink-0" />
            <span className="truncate">
              Search careers, skills, projects, or ask anything...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-ink-muted bg-surface-soft border border-border rounded">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right Controls: User Profile */}
      <div className="relative flex items-center gap-3">
        {/* User Chip */}
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-2.5 pl-2 py-1 border-l border-border rounded-sm hover:bg-surface-soft text-left"
        >
          <div className="w-8 h-8 rounded-full bg-ink-muted/15 text-ink font-semibold text-xs flex items-center justify-center border border-border flex-shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-ink leading-tight">
                {displayName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
            </div>
            <span className="text-[11px] text-ink-muted block leading-none whitespace-nowrap">
              {displayStage}
            </span>
          </div>
        </button>
        {menuOpen && (
          <div role="menu" className="absolute right-0 top-12 w-52 rounded-card border border-border bg-surface p-1.5 shadow-card">
            <Link role="menuitem" href="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-sm px-3 py-2.5 text-xs text-ink hover:bg-surface-soft">
              <Settings className="w-4 h-4" /> Profile / Settings
            </Link>
            <Link role="menuitem" href="/help" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-sm px-3 py-2.5 text-xs text-ink hover:bg-surface-soft">
              <HelpCircle className="w-4 h-4" /> Help &amp; Guidance
            </Link>
            {!auth.isDemoMode && (
              <button role="menuitem" type="button" onClick={() => void auth.signOut()} className="flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-xs text-brandRed hover:bg-surface-soft">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
