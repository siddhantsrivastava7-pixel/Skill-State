"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Award, CheckCircle2, MoreHorizontal } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname() || "/";

  const items = [
    { label: "Home", href: "/", icon: Home },
    { label: "Journey", href: "/journey", icon: Map },
    { label: "Skills", href: "/skills", icon: Award },
    { label: "Prove", href: "/assess", icon: CheckCircle2 },
    { label: "More", href: "/careers", icon: MoreHorizontal },
  ];

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
    </nav>
  );
}
