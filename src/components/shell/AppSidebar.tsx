"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Map,
  Award,
  CheckCircle2,
  Briefcase,
  FileText,
  Compass,
  BookOpen,
  Settings,
  HelpCircle,
  Sparkles,
} from "lucide-react";

export interface AppSidebarProps {
  activeRoute?: string;
  profileStage?: string;
  goalLabel?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "My Journey", href: "/journey", icon: Map },
  { label: "Skills", href: "/skills", icon: Award },
  { label: "Assess & Prove", href: "/assess", icon: CheckCircle2 },
  { label: "Projects", href: "/projects", icon: Briefcase },
  { label: "Experience", href: "/experience", icon: FileText },
  { label: "Career Paths", href: "/careers", icon: Compass },
  { label: "Resources", href: "/resources", icon: BookOpen },
];

const SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help", href: "/help", icon: HelpCircle },
];

export function AppSidebar({ activeRoute }: AppSidebarProps) {
  const pathname = usePathname();
  const currentPath = activeRoute || pathname || "/";

  return (
    <aside
      className="hidden md:flex flex-col w-[208px] h-screen fixed left-0 top-0 bg-surface border-r border-border z-30 select-none"
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-sm bg-accent text-white flex items-center justify-center shadow-xs group-hover:bg-accent/90 transition-colors">
            {/* Geometric prism logo mark */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 22 22 22" />
              <line x1="12" y1="2" x2="12" y2="22" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-ink block leading-tight">
              SkillState
            </span>
            <span className="text-[10px] text-ink-muted block leading-none mt-0.5">
              Plan. Learn. Prove. Grow.
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? currentPath === "/"
              : currentPath.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-medium transition-colors duration-180 ease-out ${
                isActive
                  ? "bg-accent-soft text-accent font-semibold"
                  : "text-ink hover:bg-surface-soft hover:text-ink"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-accent" : "text-ink-muted"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-3 pb-1 px-3">
          <hr className="border-border" />
        </div>

        {SECONDARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-medium transition-colors duration-180 ease-out ${
                isActive
                  ? "bg-accent-soft text-accent font-semibold"
                  : "text-ink-muted hover:bg-surface-soft hover:text-ink"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0 text-ink-muted" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Scenic Crop Decorative Area */}
      <div className="p-3.5 m-2.5 rounded-card bg-surface-soft border border-border/80 overflow-hidden relative">
        {/* Subtle hill curves */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <svg viewBox="0 0 160 80" fill="none" className="w-full h-full object-cover">
            <path d="M-10 60 Q 30 40 80 50 T 170 45 L 170 80 L -10 80 Z" fill="#D2DFD8" />
            <path d="M-10 68 Q 40 55 90 62 T 170 58 L 170 80 L -10 80 Z" fill="#BED5C8" />
          </svg>
        </div>
        <div className="relative z-10 space-y-1">
          <p className="font-serif italic text-xs text-ink leading-snug font-normal">
            More paths.
            <br />
            A brighter you.
          </p>
        </div>
      </div>
    </aside>
  );
}
