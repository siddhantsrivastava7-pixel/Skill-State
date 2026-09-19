import React from "react";
import Link from "next/link";
import { BarChart2, ArrowRight, CheckCircle2, ShieldAlert, AlertCircle, HelpCircle, MinusCircle } from "lucide-react";
import {
  CapabilityNode,
  CapabilityStateStatus,
  Evidence,
  VerifiedCapabilityState,
} from "@/domain/types";

export interface CompactSkillItem {
  id?: string;
  name: string;
  status: CapabilityStateStatus;
  supportingMeta: string;
  workflowState?: "verification-complete" | "proof-pending" | "evidence-needed" | "gap-identified";
}

export interface CompactSkillStripProps {
  skills?: CompactSkillItem[];
  className?: string;
}

/**
 * Derives compact skill items dynamically from active destination graph nodes,
 * verified states, and attached evidence.
 */
export function deriveCompactSkills(
  capabilityNodes: CapabilityNode[],
  verifiedStates: Record<string, VerifiedCapabilityState>,
  evidence: Evidence[],
  limit = 4
): CompactSkillItem[] {
  return capabilityNodes.slice(0, limit).map((node) => {
    const verified = verifiedStates[node.id];
    const status: CapabilityStateStatus = verified ? verified.state : "unverified";

    // Count evidence items for this capability
    const matchedEvidence = evidence.filter((ev) =>
      ev.capabilitySignals.some((sig) => sig.capabilityId === node.id)
    );
    const count = matchedEvidence.length;

    let supportingMeta = "";
    let workflowState: CompactSkillItem["workflowState"] | undefined;

    if (status === "verified") {
      supportingMeta = count > 0 ? `${count} verified project${count > 1 ? "s" : ""} • Complete` : "Verified coursework • Complete";
      workflowState = "verification-complete";
    } else if (status === "needs-proof") {
      supportingMeta = "Claimed on resume • 1 proof task pending";
      workflowState = "proof-pending";
    } else if (status === "developing") {
      supportingMeta = count > 0 ? `${count} project evidence • In progress` : "Coursework completed • In progress";
    } else if (status === "gap") {
      supportingMeta = `${count} evidence items • Critical prerequisite gap`;
      workflowState = "gap-identified";
    } else {
      supportingMeta = `${count} evidence items • Core foundation`;
      workflowState = "evidence-needed";
    }

    return {
      id: node.id,
      name: node.name,
      status,
      supportingMeta,
      workflowState,
    };
  });
}

/**
 * CompactSkillStrip conforming to 06_COMPONENT_CATALOG.md, 04_DESIGN_SYSTEM.md, and Phase 4.1 specifications:
 * - Shows 3–5 skills backed by actual evidence state
 * - Uses approved status badges only: Verified | Developing | Needs proof | Gap | Unverified
 * - Concrete supporting meta (evidence counts, proof tasks pending, baseline status)
 * - Explicitly eliminates fake skill percentage bars
 */
export function CompactSkillStrip({ skills, className = "" }: CompactSkillStripProps) {
  // Default skills matching Persona A exploring baseline
  const defaultSkills: CompactSkillItem[] = [
    {
      name: "Programming Fundamentals",
      status: "unverified",
      supportingMeta: "0 evidence items • Core foundation",
      workflowState: "evidence-needed",
    },
    {
      name: "Problem Solving & Logic",
      status: "unverified",
      supportingMeta: "Self-reported claim • Awaiting proof",
      workflowState: "evidence-needed",
    },
    {
      name: "Data Fundamentals",
      status: "unverified",
      supportingMeta: "0 evidence items • Downstream unlock",
      workflowState: "evidence-needed",
    },
  ];

  const items = skills && skills.length > 0 ? skills.slice(0, 4) : defaultSkills;

  const renderStatusBadge = (status: CapabilityStateStatus) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-soft text-green border border-green/30">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        );
      case "developing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Developing
          </span>
        );
      case "needs-proof":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent-soft text-accent border border-accent/30">
            <ShieldAlert className="w-3 h-3 text-accent" />
            Needs proof
          </span>
        );
      case "gap":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-soft text-ink-muted border border-border">
            <MinusCircle className="w-3 h-3 text-ink-muted/80" />
            Gap
          </span>
        );
      case "unverified":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-soft text-ink-muted border border-border/80">
            <HelpCircle className="w-3 h-3 text-ink-muted/70" />
            Unverified
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-card border border-border bg-surface p-4 sm:p-5 shadow-card flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-ink-muted" />
          <h3 className="text-sm font-bold text-ink">Skills & Progress</h3>
        </div>
        <Link
          href="/skills"
          className="text-xs font-medium text-ink-muted hover:text-green flex items-center gap-1 transition-colors"
        >
          View all
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Skill List with Evidence-Backed Status */}
      <div className="divide-y divide-border/40 my-auto">
        {items.map((item) => (
          <div key={item.name} className="py-2.5 first:pt-1.5 last:pb-1.5 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-semibold text-ink leading-snug">
                {item.name}
              </span>
              {renderStatusBadge(item.status)}
            </div>

            <div className="flex items-center justify-between text-[11px] text-ink-muted">
              <span>{item.supportingMeta}</span>
              {item.workflowState === "verification-complete" && (
                <span className="text-green font-medium">Complete</span>
              )}
              {item.workflowState === "proof-pending" && (
                <span className="text-accent font-medium">Proof pending</span>
              )}
              {item.workflowState === "gap-identified" && (
                <span className="text-amber-700 font-medium">To learn</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
