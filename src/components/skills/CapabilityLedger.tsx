"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  FileText,
  HelpCircle,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import { CapabilityNode, CapabilityStateStatus, Evidence } from "@/domain/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";

export function CapabilityLedger() {
  const destinationGraph = useSkillStateStore((s) => s.destinationGraph);
  const claimedStates = useSkillStateStore((s) => s.claimedStates);
  const verifiedStates = useSkillStateStore((s) => s.verifiedStates);
  const evidence = useSkillStateStore((s) => s.evidence);

  const [selectedNode, setSelectedNode] = useState<CapabilityNode | null>(null);

  const nodes = destinationGraph.capabilityNodes;

  // Group capabilities by family
  const families = React.useMemo(() => {
    const map = new Map<string, CapabilityNode[]>();
    for (const node of nodes || []) {
      const fam = node.family || "General Capabilities";
      if (!map.has(fam)) {
        map.set(fam, []);
      }
      map.get(fam)!.push(node);
    }
    return Array.from(map.entries());
  }, [nodes]);

  // Aggregate stats
  const totalCount = nodes.length;
  const verifiedCount = nodes.filter((n) => verifiedStates[n.id]?.state === "verified").length;
  const developingCount = nodes.filter((n) => verifiedStates[n.id]?.state === "developing").length;
  const needsProofCount = nodes.filter((n) => verifiedStates[n.id]?.state === "needs-proof").length;
  const gapCount = nodes.filter((n) => verifiedStates[n.id]?.state === "gap").length;

  const getStatusBadge = (state: CapabilityStateStatus | "unverified") => {
    switch (state) {
      case "verified":
        return <Badge variant="green" size="sm">Verified</Badge>;
      case "developing":
        return <Badge variant="orange" size="sm">Developing</Badge>;
      case "needs-proof":
        return <Badge variant="blue" size="sm">Needs proof</Badge>;
      case "gap":
        return <Badge variant="red" size="sm">Gap</Badge>;
      default:
        return <Badge variant="default" size="sm">Unverified</Badge>;
    }
  };

  // Find evidence linked to selectedNode
  const selectedNodeEvidence = React.useMemo(() => {
    if (!selectedNode) return [];
    const vState = verifiedStates[selectedNode.id];
    const linkedIds = vState?.evidenceIds ?? [];

    return evidence.filter(
      (ev) =>
        linkedIds.includes(ev.id) ||
        ev.capabilitySignals.some((sig) => sig.capabilityId === selectedNode.id)
    );
  }, [selectedNode, verifiedStates, evidence]);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">Skills & Verification</h1>
            <Badge variant="green" size="sm">Capability Ledger</Badge>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Complete inventory of required capabilities for {destinationGraph.destinationName}, comparing self-reported claims against verified evidence.
          </p>
        </div>
        <Link href="/assess">
          <Button variant="primary" size="sm" className="text-xs gap-1.5 shadow-xs">
            Open Verification Workbench <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* 2. Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-card border border-border bg-surface shadow-xs">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">Total</span>
          <span className="text-xl font-bold text-ink mt-1 block">{totalCount}</span>
          <span className="text-[10px] text-ink-muted block mt-0.5">Required capabilities</span>
        </div>

        <div className="p-3.5 rounded-card border border-brandGreen/30 bg-brandGreen-soft/40 shadow-xs">
          <span className="text-[11px] font-semibold text-brandGreen uppercase tracking-wider block">Verified</span>
          <span className="text-xl font-bold text-brandGreen mt-1 block">{verifiedCount}</span>
          <span className="text-[10px] text-ink-muted block mt-0.5">Evidence confirmed</span>
        </div>

        <div className="p-3.5 rounded-card border border-brandOrange/30 bg-brandOrange-soft/40 shadow-xs">
          <span className="text-[11px] font-semibold text-brandOrange uppercase tracking-wider block">Developing</span>
          <span className="text-xl font-bold text-brandOrange mt-1 block">{developingCount}</span>
          <span className="text-[10px] text-ink-muted block mt-0.5">Reinforcement active</span>
        </div>

        <div className="p-3.5 rounded-card border border-brandBlue/30 bg-brandBlue-soft/40 shadow-xs">
          <span className="text-[11px] font-semibold text-brandBlue uppercase tracking-wider block">Needs Proof</span>
          <span className="text-xl font-bold text-brandBlue mt-1 block">{needsProofCount}</span>
          <span className="text-[10px] text-ink-muted block mt-0.5">Claimed, no proof</span>
        </div>

        <div className="p-3.5 rounded-card border border-brandRed/30 bg-brandRed-soft/40 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-brandRed uppercase tracking-wider block">Gaps</span>
          <span className="text-xl font-bold text-brandRed mt-1 block">{gapCount}</span>
          <span className="text-[10px] text-ink-muted block mt-0.5">Unaddressed deficits</span>
        </div>
      </div>

      {/* 3. Families List */}
      <div className="space-y-6">
        {families.map(([familyName, capNodes]) => {
          const familyVerified = capNodes.filter((n) => verifiedStates[n.id]?.state === "verified").length;
          const familyPct = Math.round((familyVerified / capNodes.length) * 100) || 0;

          return (
            <Card key={familyName} className="overflow-hidden">
              {/* Family Header */}
              <div className="p-4 bg-surface-soft/60 border-b border-border/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-bold text-ink">{familyName}</h2>
                  <span className="text-xs text-ink-muted font-normal">
                    ({capNodes.length} {capNodes.length === 1 ? "capability" : "capabilities"})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted">{familyVerified}/{capNodes.length} Verified</span>
                  <div className="w-16 bg-border rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-accent h-full transition-all duration-300"
                      style={{ width: `${familyPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Family Nodes */}
              <div className="divide-y divide-border/60">
                {capNodes.map((node) => {
                  const vState = verifiedStates[node.id]?.state ?? "unverified";
                  const claim = claimedStates[node.id];
                  const vInfo = verifiedStates[node.id];
                  const evCount = vInfo?.evidenceIds?.length ?? 0;

                  return (
                    <div
                      key={node.id}
                      className="p-4 hover:bg-surface-soft/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-ink leading-tight">{node.name}</span>
                          {getStatusBadge(vState)}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-soft border border-border text-ink-muted uppercase font-medium">
                            {node.importance}
                          </span>
                        </div>
                        <p className="text-xs text-ink-muted line-clamp-1">{node.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-muted pt-1">
                          <span>
                            Claim:{" "}
                            <strong className="text-ink capitalize">
                              {claim?.selfReportedLevel ? claim.selfReportedLevel : "Not claimed"}
                            </strong>
                          </span>
                          <span>·</span>
                          <span>
                            Evidence:{" "}
                            <strong className="text-ink">{evCount} item{evCount === 1 ? "" : "s"}</strong>
                          </span>
                          {vInfo?.explanation && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-sm italic">
                                &quot;{vInfo.explanation}&quot;
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedNode(node)}
                          className="text-xs gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-ink-muted" />
                          Details & Evidence
                        </Button>

                        <Link href={`/assess?capabilityId=${node.id}`}>
                          <Button
                            variant={vState === "verified" ? "secondary" : "primary"}
                            size="sm"
                            className="text-xs gap-1"
                          >
                            {vState === "verified" ? "Re-verify" : "Verify Capability"}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 4. Evidence Details Drawer */}
      <Drawer
        isOpen={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        title={selectedNode?.name}
        subtitle={selectedNode?.family}
      >
        {selectedNode && (
          <div className="p-5 space-y-6 overflow-y-auto">
            {/* Capability Metadata */}
            <div className="space-y-3 pb-4 border-b border-border/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Verification Status
                </span>
                {getStatusBadge(verifiedStates[selectedNode.id]?.state ?? "unverified")}
              </div>
              <p className="text-xs text-ink leading-relaxed font-medium">
                {selectedNode.description}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="p-2.5 rounded-lg bg-surface-soft border border-border">
                  <span className="text-[10px] text-ink-muted block uppercase">Importance</span>
                  <span className="font-semibold text-ink capitalize">{selectedNode.importance}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-soft border border-border">
                  <span className="text-[10px] text-ink-muted block uppercase">Claimed Level</span>
                  <span className="font-semibold text-ink capitalize">
                    {claimedStates[selectedNode.id]?.selfReportedLevel || "None"}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Evaluator Explanation */}
            {verifiedStates[selectedNode.id]?.explanation && (
              <div className="p-3.5 rounded-xl bg-accent-soft/40 border border-accent/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-accent text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Evaluator Note
                </div>
                <p className="text-xs text-ink leading-relaxed">
                  {verifiedStates[selectedNode.id]?.explanation}
                </p>
                {verifiedStates[selectedNode.id]?.lastUpdatedAt && (
                  <span className="text-[10px] text-ink-muted block pt-1">
                    Evaluated: {new Date(verifiedStates[selectedNode.id]!.lastUpdatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}

            {/* Linked Evidence Documents */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Supporting Evidence ({selectedNodeEvidence.length})
                </h3>
              </div>

              {selectedNodeEvidence.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-ink-muted">
                  No verified evidence attached to this capability yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedNodeEvidence.map((ev) => {
                    const signals = ev.capabilitySignals.filter(
                      (s) => s.capabilityId === selectedNode.id
                    );

                    return (
                      <div
                        key={ev.id}
                        className="p-3.5 rounded-xl border border-border bg-surface-soft space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-ink leading-tight">{ev.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface border border-border text-ink-muted uppercase">
                            {ev.type}
                          </span>
                        </div>

                        {ev.sourceText && (
                          <p className="text-[11px] text-ink-muted italic bg-surface p-2 rounded border border-border/60 line-clamp-3">
                            &quot;{ev.sourceText}&quot;
                          </p>
                        )}

                        {signals.map((sig, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center justify-between pt-1 border-t border-border/60 text-[11px]"
                          >
                            <span className="text-ink-muted">{sig.explanation}</span>
                            <Badge
                              variant={
                                sig.signal === "supports"
                                  ? "green"
                                  : sig.signal === "weakens"
                                  ? "orange"
                                  : "default"
                              }
                              size="sm"
                            >
                              {sig.signal} ({sig.strength})
                            </Badge>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Action */}
            <div className="pt-4 border-t border-border">
              <Link href={`/assess?capabilityId=${selectedNode.id}`} className="block w-full">
                <Button variant="primary" className="w-full text-xs gap-1.5 justify-center">
                  Launch Verification Assessment <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
