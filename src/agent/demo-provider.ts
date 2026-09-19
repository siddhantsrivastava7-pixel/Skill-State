import { AIProvider } from "./provider";
import {
  AdaptivePlan,
  BuildPlanInput,
  CompileDestinationInput,
  DestinationGraph,
  EvidenceAnalysisInput,
  EvidenceAnalysisResult,
  EvidenceSignal,
  JourneyAnswer,
  JourneyQuestion,
  ProgressReport,
  ProgressReportInput,
  ResourceRecommendation,
  ResourceRequest,
  VerificationRequest,
  VerificationResult,
  VerificationSubmission,
  VerificationTask,
} from "@/domain/types";
import {
  personaAGraph,
  personaAPlan,
  personaBGraph,
  personaBPlan,
  personaBVerificationQueue,
  personaCGraph,
  personaCPlan,
} from "@/data/demo";

export class DemoAIProvider implements AIProvider {
  async compileDestination(
    input: CompileDestinationInput
  ): Promise<DestinationGraph> {
    const dest = (input.statedDestination || input.statedField || "").toLowerCase();

    if (dest.includes("finance") || dest.includes("financial") || dest.includes("analyst")) {
      return personaCGraph;
    }

    if (dest.includes("ai") || dest.includes("machine learning") || dest.includes("data scientist")) {
      return personaBGraph;
    }

    return personaAGraph;
  }

  async analyzeEvidence(
    input: EvidenceAnalysisInput
  ): Promise<EvidenceAnalysisResult> {
    const text = input.documentText.toLowerCase();
    const docType = input.documentType;

    const signals = input.destinationGraph.capabilityNodes
      .filter((node) => {
        const nameKeywords = node.name.toLowerCase().split(/\s+/);
        return nameKeywords.some((kw) => kw.length > 3 && text.includes(kw));
      })
      .map((node): EvidenceSignal => ({
        capabilityId: node.id,
        signal: "supports",
        strength: docType === "certificate" ? "low" : "medium",
        explanation: `Mentioned in ${input.filename || "document"} with relevant context for ${node.name}.`,
      }));

    return {
      evidence: {
        id: `ev-analyzed-${Date.now()}`,
        type: docType === "certificate" ? "certificate" : "resume",
        title: input.filename ? `Uploaded: ${input.filename}` : "Analyzed Document",
        createdAt: new Date().toISOString(),
        capabilitySignals: signals,
      },
      extractedSignals: signals,
      proposedStateUpdates: signals.map((sig) => ({
        capabilityId: sig.capabilityId,
        proposedState: sig.strength === "high" ? "verified" : "needs-proof",
        reason: sig.explanation,
      })),
    };
  }

  async generateVerification(
    input: VerificationRequest
  ): Promise<VerificationTask[]> {
    const matchingTasks = personaBVerificationQueue.filter((t) =>
      input.capabilityIds.includes(t.capabilityId)
    );

    if (matchingTasks.length > 0) {
      return matchingTasks;
    }

    // Default fallback task for any requested capability
    return input.capabilityIds.slice(0, 3).map((capId, idx) => ({
      id: `task-gen-${capId}-${idx}`,
      capabilityId: capId,
      capabilityName: capId,
      type: "scenario" as const,
      prompt: `Describe how you would approach solving a complex problem involving ${capId} under production constraints.`,
      rubric: "Evaluates architectural trade-offs, code hygiene, and verification rigor.",
    }));
  }

  async evaluateVerification(
    submission: VerificationSubmission
  ): Promise<VerificationResult> {
    const text = submission.userResponse.toLowerCase();

    // Check for weak answer patterns in demo scenario (from 12_DEMO_SCRIPT.md)
    const isWeakAnswer =
      text.includes("accuracy is fine") ||
      text.includes("accuracy alone") ||
      text.length < 30;

    if (submission.capabilityId === "cap-ml" && isWeakAnswer) {
      return {
        taskId: submission.taskId,
        capabilityId: submission.capabilityId,
        passed: false,
        signal: "weakens",
        strength: "medium",
        proposedState: "developing",
        explanation:
          "Response relied on overall accuracy in an imbalanced dataset; exposed gap in precision-recall trade-offs and threshold tuning.",
        planImpact:
          "Your plan changed because this result exposed a model-evaluation gap. Inserted Linear algebra repair module and ML evaluation proof task.",
        evidenceSignal: {
          capabilityId: submission.capabilityId,
          signal: "weakens",
          strength: "medium",
          explanation: "Weak response on imbalanced classification metrics.",
        },
      };
    }

    return {
      taskId: submission.taskId,
      capabilityId: submission.capabilityId,
      passed: true,
      signal: "supports",
      strength: "high",
      proposedState: "verified",
      explanation: "Provided solid reasoning, correct metric identification, and rigorous validation approach.",
      planImpact: "Verified capability requirement; downstream blockers removed.",
      evidenceSignal: {
        capabilityId: submission.capabilityId,
        signal: "supports",
        strength: "high",
        explanation: "Verified through interactive assessment scenario.",
      },
    };
  }

  async buildPlan(input: BuildPlanInput): Promise<AdaptivePlan> {
    const dest = input.graph.destinationName.toLowerCase();
    if (dest.includes("financial") || dest.includes("finance")) {
      return personaCPlan;
    }
    if (dest.includes("ai") || dest.includes("machine learning")) {
      return personaBPlan;
    }
    return personaAPlan;
  }

  async recommendResources(
    input: ResourceRequest
  ): Promise<ResourceRecommendation[]> {
    return [
      {
        id: `res-${input.gapCapabilityId}-1`,
        title: `Example / Demo Resource: Practical Foundations for ${input.gapCapabilityId}`,
        format: "project-guide",
        provider: "Example / Demo Resource",
        estimatedMinutes: 90,
        matchedGapId: input.gapCapabilityId,
        whyThis: "Focuses directly on the practical proof required to bridge this gap.",
        url: "https://example.com/skillstate-demo-guide",
      },
      {
        id: `res-${input.gapCapabilityId}-2`,
        title: `Example / Demo Resource: Interactive Scenarios for ${input.gapCapabilityId}`,
        format: "article",
        provider: "Example / Demo Resource",
        estimatedMinutes: 45,
        matchedGapId: input.gapCapabilityId,
        whyThis: "Provides real-world failure modes and architectural decisions.",
        url: "https://example.com/skillstate-demo-cases",
      },
    ];
  }

  async generateProgressReport(
    input: ProgressReportInput
  ): Promise<ProgressReport> {
    const verified = Object.values(input.verifiedStates).filter(
      (v) => v.state === "verified"
    );
    const developing = Object.values(input.verifiedStates).filter(
      (v) => v.state === "developing" || v.state === "needs-proof"
    );

    return {
      generatedAt:
        input.activityLedger.at(-1)?.timestamp ?? new Date(0).toISOString(),
      skillsAcquired: verified.map(
        (v) =>
          input.graph.capabilityNodes.find((n) => n.id === v.capabilityId)?.name ??
          v.capabilityId
      ),
      skillsInProgress: developing.map(
        (v) =>
          input.graph.capabilityNodes.find((n) => n.id === v.capabilityId)?.name ??
          v.capabilityId
      ),
      remainingGaps: input.gaps.map((g) => {
        const node = input.graph.capabilityNodes.find(
          (n) => n.id === g.capabilityId
        );
        return `${node?.name ?? g.capabilityId} (${g.priority} priority)`;
      }),
      proofAdded: input.evidence
        .filter((e) => e.type === "project" || e.type === "assessment")
        .map((e) => e.title),
      experienceAdded: input.evidence
        .filter((e) => e.type === "experience" || e.type === "activity")
        .map((e) => e.title),
      planChanges: input.activityLedger
        .filter(
          (a) =>
            a.type === "DESTINATION_CHANGED" ||
            a.type === "VERIFICATION_COMPLETED"
        )
        .slice(-3)
        .map((a) => a.description),
      nextSteps: [
        "Focus on highest-priority blocking gap.",
        "Submit project artifact for unverified working knowledge.",
        "Maintain scheduled weekly hours commitment.",
      ],
    };
  }

  async answerJourneyQuestion(input: JourneyQuestion): Promise<JourneyAnswer> {
    const q = input.question.toLowerCase();
    const capabilityName = (capabilityId: string) =>
      input.destinationGraph?.capabilityNodes.find((node) => node.id === capabilityId)?.name ??
      capabilityId;

    if (q.includes("why") && (q.includes("learning") || q.includes("action"))) {
      const topAction = input.currentPlan.now[0];
      return {
        answer: topAction
          ? `You are currently focusing on '${topAction.title}' because: ${topAction.whyNow}`
          : "Your current focus addresses the highest-priority blocking gap on your roadmap.",
        citations: [
          {
            type: "plan-item",
            label: topAction?.title ?? "Next Action",
            detail: topAction?.whyNow ?? "Highest priority requirement",
          },
        ],
      };
    }

    if (q.includes("data engineer") || q.includes("change")) {
      return {
        answer:
          "Yes. Because SkillState separates verified foundations from future branches, switching to Data Engineer preserves your verified programming and data skills while replacing specialist machine learning requirements with pipeline and warehouse milestones.",
        citations: [
          {
            type: "constraint",
            label: "Preserved Foundation",
            detail: "Core programming and database evidence remains valid.",
          },
        ],
      };
    }

    if (q.includes("assessment") || q.includes("what changed")) {
      const event = [...input.recentEvents]
        .reverse()
        .find((item) => item.type === "VERIFICATION_COMPLETED");
      return {
        answer: event
          ? event.description
          : "No verification result has changed your current plan yet.",
        citations: event
          ? [{ type: "evidence", label: event.title, detail: event.description }]
          : [{ type: "constraint", label: "Activity ledger", detail: "No completed verification recorded" }],
      };
    }

    if (q.includes("build next")) {
      const action = input.currentPlan.now.find((item) => item.category === "build") ??
        input.currentPlan.weeks.flatMap((week) => week.actions).find((item) => item.category === "build");
      return {
        answer: action
          ? `Build '${action.title}' next. ${action.whyNow}`
          : "Your current plan does not yet contain a build action; complete the highest-priority prerequisite first.",
        citations: action
          ? [{ type: "plan-item", label: action.title, detail: action.whyNow }]
          : [],
      };
    }

    if (q.includes("evidence") || q.includes("still need")) {
      const gaps = (input.gaps ?? []).slice(0, 3);
      return {
        answer: gaps.length
          ? `You still need credible proof for ${gaps.map((gap) => capabilityName(gap.capabilityId)).join(", ")}. Prioritize direct project or assessment evidence for these active gaps.`
          : "No active evidence gaps are recorded for the current destination.",
        citations: gaps.map((gap) => ({
          type: "skill" as const,
          label: capabilityName(gap.capabilityId),
          detail: gap.reason,
        })),
      };
    }

    if (q.includes("5 hours") || q.includes("hours per week")) {
      return {
        answer: `Reducing from ${input.profile.weeklyHours} to 5 hours per week should lower plan density and may extend the estimated remaining journey. Verified evidence would remain unchanged.`,
        citations: [
          {
            type: "constraint",
            label: "Current weekly budget",
            detail: `${input.profile.weeklyHours} hours/week`,
          },
        ],
      };
    }

    return {
      answer: `Based on your target (${input.destination}) and current profile constraints (${input.profile.weeklyHours}h/week, ${input.profile.learningPreference} learning), your plan prioritizes the shortest credible path to readiness.`,
      citations: [
        {
          type: "constraint",
          label: "Weekly Budget",
          detail: `${input.profile.weeklyHours} hours/week`,
        },
        {
          type: "skill",
          label: "Destination",
          detail: input.destination,
        },
      ],
    };
  }
}
