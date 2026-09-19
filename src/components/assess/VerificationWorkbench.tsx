"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  FileCheck,
  ShieldAlert,
  ArrowUpRight,
  RotateCcw,
  Zap,
} from "lucide-react";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import { selectMax3VerificationCandidates } from "@/domain/verification";
import { getAIProvider } from "@/agent/orchestrator";
import {
  CapabilityNode,
  VerificationSubmission,
  VerificationTask,
} from "@/domain/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function VerificationWorkbench() {
  const destinationGraph = useSkillStateStore((s) => s.destinationGraph);
  const claimedStates = useSkillStateStore((s) => s.claimedStates);
  const verifiedStates = useSkillStateStore((s) => s.verifiedStates);
  const evidence = useSkillStateStore((s) => s.evidence);
  const plan = useSkillStateStore((s) => s.plan);
  const lastTransitionResult = useSkillStateStore((s) => s.lastTransitionResult);
  const recordVerificationResult = useSkillStateStore((s) => s.recordVerificationResult);
  const clearLastTransition = useSkillStateStore((s) => s.clearLastTransition);

  const [candidates, setCandidates] = useState<CapabilityNode[]>([]);
  const [selectedCapId, setSelectedCapId] = useState<string>("");
  const [activeTask, setActiveTask] = useState<VerificationTask | null>(null);
  const [userResponse, setUserResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Read demo mode from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setIsDemoMode(params.get("demo") === "1");
    }
  }, []);

  // 1. Calculate candidates
  useEffect(() => {
    const cands = selectMax3VerificationCandidates({
      graph: destinationGraph,
      claimedStates,
      verifiedStates,
      evidence,
    });
    setCandidates(cands);

    // Check URL params for capabilityId
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const capFromUrl = params.get("capabilityId");
      if (capFromUrl && destinationGraph.capabilityNodes.some((n) => n.id === capFromUrl)) {
        setSelectedCapId(capFromUrl);
        return;
      }
    }

    // Default to first candidate or first unverified node
    if (cands.length > 0) {
      setSelectedCapId((prev) => (prev && destinationGraph.capabilityNodes.some((n) => n.id === prev) ? prev : cands[0].id));
    } else if (destinationGraph.capabilityNodes.length > 0) {
      const firstUnverified = destinationGraph.capabilityNodes.find(
        (n) => verifiedStates[n.id]?.state !== "verified"
      );
      setSelectedCapId(firstUnverified ? firstUnverified.id : destinationGraph.capabilityNodes[0].id);
    }
  }, [destinationGraph, claimedStates, verifiedStates, evidence]);

  // 2. Fetch/generate task when selectedCapId changes
  useEffect(() => {
    if (!selectedCapId) return;

    let isMounted = true;
    const loadTask = async () => {
      const provider = getAIProvider();
      try {
        const tasks = await provider.generateVerification({
          capabilityIds: [selectedCapId],
        });
        if (isMounted && tasks && tasks.length > 0) {
          setActiveTask(tasks[0]);
          setUserResponse("");
          setErrorMessage("");
        }
      } catch (err) {
        console.error("Error generating verification task:", err);
      }
    };

    loadTask();
    return () => {
      isMounted = false;
    };
  }, [selectedCapId]);

  const activeNode = destinationGraph.capabilityNodes.find((n) => n.id === selectedCapId);
  const currentVerified = selectedCapId ? verifiedStates[selectedCapId] : undefined;
  const currentClaim = selectedCapId ? claimedStates[selectedCapId] : undefined;

  // Handle submission
  const handleSubmit = async (customAnswer?: string) => {
    const answer = customAnswer !== undefined ? customAnswer : userResponse;
    if (!answer.trim()) {
      setErrorMessage("Please enter an answer before submitting.");
      return;
    }
    if (!activeTask || !selectedCapId) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const provider = getAIProvider();
      const submission: VerificationSubmission = {
        taskId: activeTask.id,
        capabilityId: selectedCapId,
        userResponse: answer,
      };

      const evalResult = await provider.evaluateVerification(submission);
      recordVerificationResult(evalResult, submission);
    } catch (err) {
      console.error("Failed to evaluate verification:", err);
      setErrorMessage("Evaluation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill demo templates
  const isCapMl = selectedCapId === "cap-ml";
  const weakTemplate = isCapMl
    ? "Our fraud detection model achieves 99.2% accuracy on the test set, which means accuracy is fine and the model performs great on almost all cases. We don't need additional metrics since 99.2% accuracy is well above standard thresholds."
    : "I usually rely on default settings and basic accuracy metrics to determine whether the implementation works.";

  const strongTemplate = isCapMl
    ? "In a 99.2% / 0.8% imbalanced dataset, overall accuracy is a misleading metric due to the accuracy paradox—a trivial model predicting always negative achieves 99.2% accuracy while failing 100% of fraud cases. We must evaluate with PR-AUC (Precision-Recall Area Under Curve), tune decision thresholds according to financial cost matrices, track F1/Recall at 90%+ precision, and validate using stratified 5-fold cross-validation."
    : "I address this by decomposing the system constraints, establishing stratified cross-validation splits, analyzing failure modes on edge cases, and benchmarking latency and accuracy tradeoffs under production load.";

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">Assess & Prove</h1>
            {isDemoMode && <Badge variant="blue" size="sm">Demo Mode</Badge>}
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Verify claimed capabilities with rigorous evaluation. Every assessment directly drives and adapts your plan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">Target Destination:</span>
          <Badge variant="accent" size="md">
            {destinationGraph.destinationName}
          </Badge>
        </div>
      </div>

      {/* 2. Verification Candidate Queue */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-ink">Priority Verification Queue</h2>
          </div>
          <span className="text-xs text-ink-muted">Max 3 prioritized by milestone impact</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {candidates.map((node) => {
            const vState = verifiedStates[node.id]?.state ?? "unverified";
            const isSelected = node.id === selectedCapId;
            const cClaim = claimedStates[node.id];

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => {
                  setSelectedCapId(node.id);
                  clearLastTransition();
                }}
                className={`text-left p-4 rounded-card border transition-all duration-150 relative ${
                  isSelected
                    ? "border-accent ring-2 ring-accent/20 bg-accent-soft/40 shadow-xs"
                    : "border-border bg-surface hover:border-ink-muted/40 hover:bg-surface-soft/50 shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-ink leading-tight">{node.name}</span>
                  <Badge
                    variant={
                      vState === "verified"
                        ? "green"
                        : vState === "developing"
                        ? "orange"
                        : vState === "needs-proof"
                        ? "blue"
                        : "default"
                    }
                    size="sm"
                  >
                    {vState}
                  </Badge>
                </div>

                <p className="text-[11px] text-ink-muted line-clamp-2 mb-3">
                  {node.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-ink-muted border-t border-border/60 pt-2.5 mt-auto">
                  <span>
                    Claim: <strong className="text-ink capitalize">{cClaim?.selfReportedLevel || "None"}</strong>
                  </span>
                  <span className="font-semibold text-accent flex items-center gap-1">
                    {isSelected ? "Active Task" : "Select"} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Last Transition Result & Plan Impact Callout (If verification evaluated) */}
      {lastTransitionResult && (
        <div className="p-5 rounded-card border-2 border-accent/40 bg-accent-soft/30 shadow-card animate-in fade-in duration-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-accent/20">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  lastTransitionResult.stateTransition.passed
                    ? "bg-brandGreen-soft text-brandGreen"
                    : "bg-brandOrange-soft text-brandOrange"
                }`}
              >
                {lastTransitionResult.stateTransition.passed ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">
                  {lastTransitionResult.stateTransition.passed
                    ? "Verification Confirmed: Capability Verified"
                    : "Verification Evaluated: Gap Exposed"}
                </h3>
                <p className="text-xs text-ink-muted">
                  State updated: <strong className="text-ink capitalize">{lastTransitionResult.stateTransition.previousState}</strong>
                  {" "}→{" "}
                  <strong className={lastTransitionResult.stateTransition.passed ? "text-brandGreen capitalize" : "text-brandOrange capitalize"}>
                    {lastTransitionResult.stateTransition.newState}
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/">
                <Button size="sm" variant="primary" className="text-xs gap-1.5 shadow-xs">
                  View Updated Home Plan <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <Link href="/skills">
                <Button size="sm" variant="secondary" className="text-xs gap-1.5">
                  View Capability Ledger
                </Button>
              </Link>
            </div>
          </div>

          {/* Visible "Why your plan changed" callout */}
          <div className="p-4 rounded-xl bg-surface border border-accent/30 shadow-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-accent" />
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                Why your plan changed
              </h4>
            </div>
            <p className="text-xs text-ink font-medium leading-relaxed">
              {lastTransitionResult.planChangeExplanation}
            </p>

            {/* Updated Now actions preview */}
            <div className="mt-3 pt-3 border-t border-border/60">
              <span className="text-[11px] font-semibold text-ink-muted block mb-2">
                Current Today&apos;s Plan Actions:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lastTransitionResult.updatedPlan.now.map((action, idx) => {
                  const isNewRepair = action.id.includes("act-repair") || action.title.toLowerCase().includes("repair");
                  return (
                    <div
                      key={action.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                        isNewRepair
                          ? "bg-accent-soft/60 border-accent text-accent font-semibold"
                          : "bg-surface-soft border-border text-ink"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{action.title}</span>
                          {isNewRepair && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-accent text-white font-bold shrink-0">
                              NEW
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-ink-muted block mt-0.5 capitalize">
                          {action.category} · {action.estimatedMinutes}m · {action.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Active Task Workspace */}
      {activeNode && activeTask ? (
        <Card className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/70">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Verification Scenario
                </span>
                <span className="text-border">·</span>
                <span className="text-xs text-ink-muted capitalize">{activeTask.type} Task</span>
              </div>
              <h3 className="text-base font-bold text-ink mt-0.5">{activeNode.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted">Current status:</span>
              <Badge
                variant={
                  currentVerified?.state === "verified"
                    ? "green"
                    : currentVerified?.state === "developing"
                    ? "orange"
                    : currentVerified?.state === "needs-proof"
                    ? "blue"
                    : "default"
                }
              >
                {currentVerified?.state ?? "unverified"}
              </Badge>
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-ink block">Assessment Prompt:</span>
            <div className="p-4 rounded-xl bg-surface-soft border border-border/80 text-xs sm:text-sm text-ink leading-relaxed font-sans">
              {activeTask.prompt}
            </div>
          </div>

          {/* Rubric */}
          {activeTask.rubric && (
            <div className="p-3 rounded-lg bg-surface-soft/60 border border-border/60 text-xs text-ink-muted flex items-start gap-2">
              <FileCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink font-semibold">Evaluation Rubric: </strong>
                {activeTask.rubric}
              </div>
            </div>
          )}

          {/* Answer Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="answer-input" className="text-xs font-bold text-ink">
                Your Technical Response:
              </label>
              <span className="text-[11px] text-ink-muted">
                {userResponse.length} characters
              </span>
            </div>

            <textarea
              id="answer-input"
              rows={5}
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder="Explain your technical reasoning, evaluation metrics, and validation strategy..."
              className="w-full p-3.5 rounded-xl border border-border bg-surface text-ink text-xs sm:text-sm leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-y"
            />

            {errorMessage && (
              <p className="text-xs text-brandRed font-medium">{errorMessage}</p>
            )}

            {/* Quick-fill Scenario Triggers for Deterministic Demo Verification (shown only in ?demo=1 mode) */}
            {isDemoMode && (
              <div className="p-3.5 rounded-xl bg-surface-soft/80 border border-border/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-accent" />
                    Interactive Demo Evaluation Scenarios:
                  </span>
                  <span className="text-[11px] text-ink-muted">1-click test triggers</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserResponse(weakTemplate);
                      handleSubmit(weakTemplate);
                    }}
                    disabled={isSubmitting}
                    className="text-left p-3 rounded-lg border border-brandOrange/30 bg-brandOrange-soft/40 hover:bg-brandOrange-soft/70 transition-colors text-xs space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink group-hover:text-brandOrange transition-colors">
                        Test Weak Answer
                      </span>
                      <Badge variant="orange" size="sm">Expose Gap</Badge>
                    </div>
                    <p className="text-[11px] text-ink-muted">
                      {isCapMl
                        ? "Relies on 99.2% accuracy in imbalanced data (accuracy paradox)"
                        : "Provides basic reasoning without edge case handling"}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserResponse(strongTemplate);
                      handleSubmit(strongTemplate);
                    }}
                    disabled={isSubmitting}
                    className="text-left p-3 rounded-lg border border-brandGreen/30 bg-brandGreen-soft/40 hover:bg-brandGreen-soft/70 transition-colors text-xs space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink group-hover:text-brandGreen transition-colors">
                        Test Strong Answer
                      </span>
                      <Badge variant="green" size="sm">Verify Skill</Badge>
                    </div>
                    <p className="text-[11px] text-ink-muted">
                      {isCapMl
                        ? "Identifies accuracy paradox, specifies PR-AUC & stratified CV"
                        : "Provides rigorous validation and production constraint analysis"}
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUserResponse("")}
                disabled={isSubmitting || !userResponse}
                className="text-xs"
              >
                Clear
              </Button>

              <Button
                variant="primary"
                onClick={() => handleSubmit()}
                disabled={isSubmitting || !userResponse.trim()}
                className="text-xs gap-2 min-w-[180px]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Evaluating...
                  </>
                ) : (
                  <>
                    Submit for AI Verification <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center text-ink-muted text-xs">
          Loading verification task for {selectedCapId}...
        </Card>
      )}
    </div>
  );
}
