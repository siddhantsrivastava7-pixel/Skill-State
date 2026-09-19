"use client";

import { useEffect, useState } from "react";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import {
  DemoPersonaId,
  personaATodayPlan,
  personaARecentActivities,
  personaBTodayPlan,
  personaBRecentActivities,
  personaCTodayPlan,
  personaCRecentActivities,
} from "@/data/demo";
import { JourneyHero } from "@/components/journey/JourneyHero";
import { JourneyStage, CareerBranch } from "@/components/journey/JourneyPath";
import { LaterStageBanner } from "@/components/home/LaterStageBanner";
import { NextActionsCard } from "@/components/home/NextActionsCard";
import { WhyThisCard } from "@/components/home/WhyThisCard";
import { KeepsOpenCard } from "@/components/home/KeepsOpenCard";
import { ProofNeededCard } from "@/components/home/ProofNeededCard";
import { CompactSkillStrip, CompactSkillItem } from "@/components/home/CompactSkillStrip";
import { TodayPlanStrip } from "@/components/home/TodayPlanStrip";
import { RecentActivityStrip } from "@/components/home/RecentActivityStrip";

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedActionIndex, setSelectedActionIndex] = useState(0);
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(undefined);

  const activePersonaId = useSkillStateStore((s) => s.activePersonaId);
  const profile = useSkillStateStore((s) => s.profile);
  const destination = useSkillStateStore((s) => s.destination);
  const destinationGraph = useSkillStateStore((s) => s.destinationGraph);
  const plan = useSkillStateStore((s) => s.plan);
  const verifiedStates = useSkillStateStore((s) => s.verifiedStates);
  const loadPersona = useSkillStateStore((s) => s.loadPersona);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setIsDemoMode(params.get("demo") === "1");
      const p = params.get("persona");
      if (p === "persona-a" || p === "persona-b" || p === "persona-c") {
        loadPersona(p as DemoPersonaId);
      }
    }
  }, [loadPersona]);

  // Reset selected action when persona changes
  useEffect(() => {
    setSelectedActionIndex(0);
    setSelectedBranchId(undefined);
  }, [activePersonaId]);

  if (!isMounted) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-sm">
        <p className="text-ink-muted">Hydrating SkillState...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Variant Detection & Configuration
  // ---------------------------------------------------------------------------
  const isExploring =
    profile.destinationCertainty === "exploring" ||
    profile.destinationCertainty === "general";
  const mode: "exploring" | "exact" = isExploring ? "exploring" : "exact";

  // Variant C: Later-stage banner condition (Persona B / 3rd+ year college / graduate)
  const isCollegeLaterStage =
    profile.stage === "college" &&
    (profile.stageDetail?.includes("3") ||
      profile.stageDetail?.includes("4") ||
      profile.stageDetail?.includes("5"));
  const isLaterStage =
    isCollegeLaterStage ||
    profile.stage === "graduate" ||
    profile.stage === "professional" ||
    activePersonaId === "persona-b";

  // Baseline counts for LaterStageBanner
  const verifiedValues = Object.values(verifiedStates);
  const verifiedCount = verifiedValues.filter((s) => s.state === "verified").length;
  const needsStrengtheningCount = verifiedValues.filter((s) => s.state === "developing").length;
  const missingCount = verifiedValues.filter((s) => s.state === "gap").length;
  const needsProofCount = verifiedValues.filter((s) => s.state === "needs-proof").length;

  // ---------------------------------------------------------------------------
  // Journey Stages Construction
  // ---------------------------------------------------------------------------
  const targetDestinationLabel = destination || profile.statedDestination || "Target Role";

  const stages: JourneyStage[] = isExploring
    ? [
        {
          id: "stg-today",
          title: "Today",
          subtitle: "Understand where you are and set your direction.",
          iconName: "map-pin",
          state: "current",
          isCurrent: true,
        },
        {
          id: "stg-foundations",
          title: "Foundations",
          subtitle: "Build core skills that open multiple paths.",
          iconName: "book-open",
          state: "future",
        },
        {
          id: "stg-explore",
          title: "Explore",
          subtitle: "Try, learn, and discover what excites you.",
          iconName: "compass",
          state: "future",
        },
        {
          id: "stg-decision",
          title: "Decision Point",
          subtitle: "You can choose later. All paths stay open.",
          iconName: "git-branch",
          state: "decision",
        },
      ]
    : [
        {
          id: "stg-today",
          title: "Today",
          subtitle: "Assessed baseline and existing evidence.",
          iconName: "map-pin",
          state: "current",
          isCurrent: true,
        },
        {
          id: "stg-fix-gaps",
          title: "Fix gaps",
          subtitle: "Close critical prerequisite deficits.",
          iconName: "wrench",
          state: "future",
        },
        {
          id: "stg-build-proof",
          title: "Build proof",
          subtitle: "Build working project and code artifacts.",
          iconName: "shield-check",
          state: "future",
        },
        {
          id: "stg-experience",
          title: "Gain experience",
          subtitle: "Practical scenarios and application trials.",
          iconName: "briefcase",
          state: "future",
        },
        {
          id: "stg-target",
          title: targetDestinationLabel,
          subtitle: "Readiness threshold milestone.",
          iconName: "target",
          state: "decision",
        },
      ];

  // ---------------------------------------------------------------------------
  // Career Branches Construction
  // ---------------------------------------------------------------------------
  const defaultExploringBranches: CareerBranch[] = [
    {
      id: "dest-ai-engineer",
      title: "AI Engineer",
      descriptor: "Build intelligent systems",
      tone: "purple",
    },
    {
      id: "dest-data-engineer",
      title: "Data Engineer",
      descriptor: "Work with data at scale",
      tone: "green",
    },
    {
      id: "dest-backend-engineer",
      title: "Backend Engineer",
      descriptor: "Power the web and apps",
      tone: "orange",
    },
    {
      id: "dest-cybersecurity",
      title: "Cybersecurity",
      descriptor: "Keep systems and people safe",
      tone: "blue",
    },
  ];

  const adjacentFromGraph: CareerBranch[] =
    destinationGraph.adjacentDestinations && destinationGraph.adjacentDestinations.length > 0
      ? destinationGraph.adjacentDestinations.map((adj) => ({
          id: adj.id,
          title: adj.title,
          descriptor: adj.descriptor,
          tone: (adj.tone as "purple" | "green" | "orange" | "blue") || "blue",
        }))
      : defaultExploringBranches;

  const branches: CareerBranch[] = isExploring ? defaultExploringBranches : adjacentFromGraph;

  // Handle branch preview without mutating destination in store
  const handleBranchPreview = (id: string) => {
    setSelectedBranchId((prev) => (prev === id ? undefined : id));
  };

  // ---------------------------------------------------------------------------
  // Evidence-Backed Skills & Progress Data (Semantic Statuses Only)
  // ---------------------------------------------------------------------------
  let compactSkills: CompactSkillItem[] = [
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

  if (activePersonaId === "persona-b") {
    compactSkills = [
      {
        name: "Python Programming",
        status: "verified",
        supportingMeta: "1 verified project (GitHub) • Fully verified",
        workflowState: "verification-complete",
      },
      {
        name: "SQL & Relational DBs",
        status: "needs-proof",
        supportingMeta: "Claimed on resume • 1 proof task pending",
        workflowState: "proof-pending",
      },
      {
        name: "Probability & Statistics",
        status: "developing",
        supportingMeta: "1 project evidence • Inferential stats needed",
      },
      {
        name: "Linear Algebra",
        status: "gap",
        supportingMeta: "0 evidence items • Critical prerequisite gap",
        workflowState: "gap-identified",
      },
    ];
  } else if (activePersonaId === "persona-c") {
    compactSkills = [
      {
        name: "Accounting Fundamentals",
        status: "verified",
        supportingMeta: "2 coursework & transcript items",
        workflowState: "verification-complete",
      },
      {
        name: "Advanced Spreadsheet Analysis",
        status: "verified",
        supportingMeta: "1 model workbook artifact",
        workflowState: "verification-complete",
      },
      {
        name: "Three-Statement Analysis",
        status: "developing",
        supportingMeta: "Coursework completed • Practical model pending",
      },
      {
        name: "Financial Modeling & Valuation",
        status: "needs-proof",
        supportingMeta: "1 DCF model artifact required",
        workflowState: "proof-pending",
      },
    ];
  }

  // ---------------------------------------------------------------------------
  // State-Driven Today's Plan & Recent Activity
  // ---------------------------------------------------------------------------
  let currentTodayPlan = personaATodayPlan;
  let currentRecentActivities = personaARecentActivities;

  if (activePersonaId === "persona-b") {
    currentTodayPlan = personaBTodayPlan;
    currentRecentActivities = personaBRecentActivities;
  } else if (activePersonaId === "persona-c") {
    currentTodayPlan = personaCTodayPlan;
    currentRecentActivities = personaCRecentActivities;
  }

  // Selected action object
  const activeAction = plan.now[selectedActionIndex] || plan.now[0];

  return (
    <div className="space-y-6">
      {/* Hidden Dev/Demo Fast Switcher — ONLY rendered when ?demo=1 is active */}
      {isDemoMode && (
        <aside
          aria-label="Demo switcher controls"
          className="flex items-center justify-between gap-3 px-3.5 py-2 bg-surface rounded-card border border-accent/40 text-xs shadow-subtle animate-fade-in"
        >
          <div className="flex items-center gap-2 text-ink-muted">
            <span className="font-semibold text-accent">[DEMO MODE]</span>
            <span className="font-semibold text-ink">Active Persona:</span>
            <span className="capitalize">{profile.name}</span>
            <span className="text-border">|</span>
            <span>{isExploring ? "Variant A (Exploring)" : "Variant B (Exact)"}</span>
            {isLaterStage && <span className="text-green font-medium">+ Variant C</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => loadPersona("persona-a")}
              className={`px-2.5 py-1 rounded-pill text-[11px] font-medium transition-colors ${
                activePersonaId === "persona-a"
                  ? "bg-accent text-white"
                  : "text-ink-muted hover:bg-surface-soft"
              }`}
            >
              Persona A (Exploring)
            </button>
            <button
              type="button"
              onClick={() => loadPersona("persona-b")}
              className={`px-2.5 py-1 rounded-pill text-[11px] font-medium transition-colors ${
                activePersonaId === "persona-b"
                  ? "bg-accent text-white"
                  : "text-ink-muted hover:bg-surface-soft"
              }`}
            >
              Persona B (Exact / 3rd Yr)
            </button>
            <button
              type="button"
              onClick={() => loadPersona("persona-c")}
              className={`px-2.5 py-1 rounded-pill text-[11px] font-medium transition-colors ${
                activePersonaId === "persona-c"
                  ? "bg-accent text-white"
                  : "text-ink-muted hover:bg-surface-soft"
              }`}
            >
              Persona C (Finance)
            </button>
          </div>
        </aside>
      )}

      {/* Variant C: Third-year / Later-stage Banner */}
      {isLaterStage && (
        <LaterStageBanner
          verifiedCount={verifiedCount || 1}
          needsStrengtheningCount={needsStrengtheningCount || 1}
          missingCount={missingCount || 2}
          needsProofCount={needsProofCount || 2}
        />
      )}

      {/* Signature Journey Hero & Branching Visualization */}
      <JourneyHero
        mode={mode}
        userName={profile.name}
        userStageDetail={profile.stageDetail || "Class 12"}
        userFieldOrGoal={profile.statedDestination || profile.statedField || destination || "Technology career"}
        stages={stages}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onBranchPreview={handleBranchPreview}
      />

      {/* Primary 3-Column Grid: Now | Why this? | Keeps open (or Proof needed) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Column 1: Now (Exactly 3 actions) */}
        <NextActionsCard
          actions={plan.now}
          selectedIndex={selectedActionIndex}
          onSelectAction={setSelectedActionIndex}
        />

        {/* Column 2: Why this? (Dynamic explanation for selected action) */}
        <WhyThisCard selectedAction={activeAction} destinationName={targetDestinationLabel} />

        {/* Column 3: Keeps open (Exploring) OR Proof still needed (Exact) */}
        {isExploring ? (
          <KeepsOpenCard
            branches={branches}
            selectedBranchId={selectedBranchId}
            onSelectBranch={handleBranchPreview}
          />
        ) : (
          <ProofNeededCard
            destinationName={targetDestinationLabel}
            proofExpectations={destinationGraph.proofExpectations}
          />
        )}
      </div>

      {/* Bottom 3-Column Compact Information Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        {/* Skills & Progress (Evidence-backed semantic badges) */}
        <CompactSkillStrip skills={compactSkills} />

        {/* Today's Plan (State-driven per active persona) */}
        <TodayPlanStrip key={activePersonaId} initialTasks={currentTodayPlan} />

        {/* Recent Activity (State-driven per active persona) */}
        <RecentActivityStrip key={activePersonaId} activities={currentRecentActivities} />
      </div>
    </div>
  );
}
