"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Award, CheckCircle2, MoreHorizontal } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const [moreOpen, setMoreOpen] = useState(false);

  const items = [
    { label: "Home", href: "/", icon: Home },
    { label: "Journey", href: "/journey", icon: Map },
    { label: "Skills", href: "/skills", icon: Award },
    { label: "Prove", href: "/assess", icon: CheckCircle2 },
  ];

  const moreItems = [
    ["Career Paths", "/careers"],
    ["Resources", "/resources"],
    ["Projects", "/projects"],
    ["Experience", "/experience"],
    ["Progress Report", "/report"],
    ["Settings", "/settings"],
    ["Help", "/help"],
  ] as const;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border px-2 py-1.5 flex items-center justify-around select-none"
      aria-label="Mobile Navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-sm text-[10px] font-medium transition-colors ${
              isActive
                ? "text-accent font-semibold"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-accent" : "text-ink-muted"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => setMoreOpen((open) => !open)}
        aria-expanded={moreOpen}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-sm text-[10px] font-medium text-ink-muted"
      >
        <MoreHorizontal className="w-5 h-5 mb-0.5" />
        <span>More</span>
      </button>
      {moreOpen && (
        <div className="absolute bottom-full right-2 mb-2 w-56 rounded-card border border-border bg-surface p-2 shadow-card grid grid-cols-1 gap-1">
          {moreItems.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMoreOpen(false)}
              className="min-h-10 flex items-center rounded-sm px-3 text-xs font-medium text-ink hover:bg-surface-soft"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
