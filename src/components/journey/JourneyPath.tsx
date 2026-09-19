"use client";

import React from "react";
import {
  BookOpen,
  Compass,
  GitFork,
  MapPin,
  Wrench,
  ShieldCheck,
  Briefcase,
  Target,
} from "lucide-react";
import { JourneyStageNode } from "./JourneyStageNode";
import { CareerBranchCard } from "./CareerBranchCard";

export interface JourneyStage {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  state: "complete" | "current" | "future" | "decision";
  isCurrent?: boolean;
}

export interface CareerBranch {
  id: string;
  title: string;
  descriptor: string;
  tone: "purple" | "green" | "orange" | "blue";
  selected?: boolean;
}

export interface JourneyPathProps {
  mode: "exploring" | "exact";
  stages: JourneyStage[];
  branches: CareerBranch[];
  selectedBranchId?: string;
  onBranchPreview: (id: string) => void;
  className?: string;
}

export function JourneyPath({
  mode,
  stages,
  branches,
  selectedBranchId,
  onBranchPreview,
  className = "",
}: JourneyPathProps) {
  // Helper to map icon name to Lucide component
  const getStageIcon = (name: string, state: string) => {
    const isWhite = state === "current" || state === "decision" || state === "complete";
    const iconClass = `w-4 h-4 ${isWhite ? "text-white" : "text-green"}`;

    switch (name) {
      case "book-open":
      case "foundations":
        return <BookOpen className={iconClass} />;
      case "compass":
      case "explore":
        return <Compass className={iconClass} />;
      case "git-branch":
      case "git-fork":
      case "decision":
        return <GitFork className={iconClass} />;
      case "wrench":
      case "fix-gaps":
        return <Wrench className={iconClass} />;
      case "shield-check":
      case "build-proof":
        return <ShieldCheck className={iconClass} />;
      case "briefcase":
      case "experience":
        return <Briefcase className={iconClass} />;
      case "target":
        return <Target className={iconClass} />;
      default:
        return <MapPin className={iconClass} />;
    }
  };

  // Branch tone stroke color mapping
  const branchStrokeColors: Record<string, string> = {
    purple: "#8B5CF6",
    green: "#10B981",
    orange: "#F59E0B",
    blue: "#3B82F6",
  };

  // For exact mode: 2 or 3 adjacent cards centered around Target node level (y = 185)
  const exactBranches = branches.slice(0, 3);
  const isExactTwoCards = exactBranches.length === 2;

  return (
    <div className={`relative w-full ${className}`}>
      {/* ========================================================================= */}
      {/* DESKTOP VIEW (1000 x 370 Coordinate Space)                               */}
      {/* ========================================================================= */}
      <div className="hidden md:block relative w-full h-[370px] select-none">
        {/* SVG Path Layer */}
        <svg
          viewBox="0 0 1000 370"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            <filter id="pathGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1FA978" floodOpacity="0.15" />
            </filter>
          </defs>

          {mode === "exploring" ? (
            <>
              {/* --- EXPLORING MODE (Persona A) --- */}
              {/* Winding green path connecting 4 nodes: 100 -> 280 -> 460 -> 640 */}
              <path
                d="M 100 185 C 190 172, 190 178, 280 178 C 370 178, 370 190, 460 190 C 550 190, 550 182, 640 182"
                stroke="#EAF8F2"
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.9"
              />
              <path
                d="M 100 185 C 190 172, 190 178, 280 178 C 370 178, 370 190, 460 190 C 550 190, 550 182, 640 182"
                stroke="#1FA978"
                strokeWidth="5"
                strokeLinecap="round"
                filter="url(#pathGlow)"
              />

              {/* 4 Branching curves from Decision Point (662, 182) to Cards (730, Y) */}
              {branches.slice(0, 4).map((branch, index) => {
                const targetY = [62, 140, 218, 296][index] ?? 182;
                const isSelected = selectedBranchId === branch.id;
                const color = branchStrokeColors[branch.tone] || "#8B5CF6";
                const isAnySelected = Boolean(selectedBranchId);

                return (
                  <path
                    key={branch.id}
                    d={`M 662 182 C 695 182, 705 ${targetY}, 730 ${targetY}`}
                    stroke={color}
                    strokeWidth={isSelected ? 4 : 2.5}
                    strokeDasharray={isSelected ? "none" : "5 5"}
                    strokeLinecap="round"
                    opacity={isAnySelected ? (isSelected ? 1 : 0.35) : 0.85}
                    className="transition-all duration-300"
                  />
                );
              })}
            </>
          ) : (
            <>
              {/* --- EXACT DESTINATION MODE (Persona B & C) --- */}
              {/* Single dominant main path: Today(80) -> Fix gaps(215) -> Build proof(350) -> Gain experience(485) -> Target(620) */}
              <path
                d="M 80 185 C 145 172, 150 178, 215 178 C 280 178, 285 190, 350 190 C 415 190, 420 180, 485 180 C 550 180, 555 185, 620 185"
                stroke="#EAF8F2"
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.95"
              />
              <path
                d="M 80 185 C 145 172, 150 178, 215 178 C 280 178, 285 190, 350 190 C 415 190, 420 180, 485 180 C 550 180, 555 185, 620 185"
                stroke="#1FA978"
                strokeWidth="5"
                strokeLinecap="round"
                filter="url(#pathGlow)"
              />

              {/* Shortened connector lines: emerge from Target node edge (642, 185) and terminate cleanly at card left edge (730, targetY) */}
              {exactBranches.map((branch, index) => {
                // If 2 cards: targets at y = 155 and y = 215 (centered around 185 Target level)
                // If 3 cards: targets at y = 135, y = 185, y = 235
                const targetY = isExactTwoCards
                  ? [155, 215][index] ?? 185
                  : [135, 185, 235][index] ?? 185;

                const isSelected = selectedBranchId === branch.id;
                const color = branchStrokeColors[branch.tone] || "#3B82F6";
                const isAnySelected = Boolean(selectedBranchId);

                return (
                  <path
                    key={branch.id}
                    d={`M 642 185 C 680 185, 700 ${targetY}, 730 ${targetY}`}
                    stroke={color}
                    strokeWidth={isSelected ? 3 : 2}
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                    opacity={isAnySelected ? (isSelected ? 1 : 0.35) : 0.75}
                    className="transition-all duration-300"
                  />
                );
              })}
            </>
          )}
        </svg>

        {/* --- STAGE NODES OVERLAY LAYER (Absolute Inset-0 for 1:1 SVG Matching) --- */}
        {mode === "exploring" ? (
          <div className="absolute inset-0 pointer-events-none">
            {/* Stage 1: Today (x: 100 / left: 10%) */}
            <div className="absolute left-[10%] top-[163px] -translate-x-1/2 pointer-events-auto">
              {stages[0] && (
                <JourneyStageNode
                  id={stages[0].id}
                  title={stages[0].title}
                  subtitle={stages[0].subtitle}
                  state={stages[0].state}
                  isCurrent={stages[0].isCurrent ?? true}
                  icon={getStageIcon(stages[0].iconName, stages[0].state)}
                />
              )}
            </div>

            {/* Stage 2: Foundations (x: 280 / left: 28%) */}
            <div className="absolute left-[28%] top-[156px] -translate-x-1/2 pointer-events-auto">
              {stages[1] && (
                <JourneyStageNode
                  id={stages[1].id}
                  title={stages[1].title}
                  subtitle={stages[1].subtitle}
                  state={stages[1].state}
                  icon={getStageIcon(stages[1].iconName, stages[1].state)}
                />
              )}
            </div>

            {/* Stage 3: Explore (x: 460 / left: 46%) */}
            <div className="absolute left-[46%] top-[168px] -translate-x-1/2 pointer-events-auto">
              {stages[2] && (
                <JourneyStageNode
                  id={stages[2].id}
                  title={stages[2].title}
                  subtitle={stages[2].subtitle}
                  state={stages[2].state}
                  icon={getStageIcon(stages[2].iconName, stages[2].state)}
                />
              )}
            </div>

            {/* Stage 4: Decision Point (x: 640 / left: 64%) */}
            <div className="absolute left-[64%] top-[160px] -translate-x-1/2 pointer-events-auto">
              {stages[3] && (
                <JourneyStageNode
                  id={stages[3].id}
                  title={stages[3].title}
                  subtitle={stages[3].subtitle}
                  state={stages[3].state}
                  icon={getStageIcon(stages[3].iconName, stages[3].state)}
                />
              )}
            </div>
          </div>
        ) : (
          /* Exact Destination: 5 Nodes (8%, 21.5%, 35%, 48.5%, 62%) */
          <div className="absolute inset-0 pointer-events-none">
            {stages.map((stg, i) => {
              const leftPercents = ["8%", "21.5%", "35%", "48.5%", "62%"];
              const topPx = [163, 156, 168, 158, 163];

              return (
                <div
                  key={stg.id}
                  className="absolute -translate-x-1/2 pointer-events-auto"
                  style={{ left: leftPercents[i] ?? "50%", top: `${topPx[i] ?? 160}px` }}
                >
                  <JourneyStageNode
                    id={stg.id}
                    title={stg.title}
                    subtitle={stg.subtitle}
                    state={stg.state}
                    isCurrent={stg.isCurrent}
                    icon={getStageIcon(stg.iconName, stg.state)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* --- RIGHT EDGE CAREER CARDS --- */}
        {mode === "exploring" ? (
          /* Exploring Mode Right Rail (4 standard cards anchored from left 73%) */
          <div className="absolute left-[73%] right-4 top-3 bottom-3 flex flex-col justify-between py-1 z-10">
            {branches.map((branch) => (
              <CareerBranchCard
                key={branch.id}
                careerId={branch.id}
                title={branch.title}
                descriptor={branch.descriptor}
                tone={branch.tone}
                selected={selectedBranchId === branch.id}
                onSelect={onBranchPreview}
              />
            ))}
          </div>
        ) : (
          /* Exact Mode Compact Right Rail (Anchored from left 73%, vertically centered at Target level) */
          <div className="absolute left-[73%] right-4 top-1/2 -translate-y-1/2 flex flex-col justify-center space-y-2.5 z-10">
            <div className="text-[10px] font-semibold text-ink-muted/90 uppercase tracking-wider px-1">
              Your foundations also transfer to
            </div>
            {exactBranches.map((branch) => (
              <CareerBranchCard
                key={branch.id}
                careerId={branch.id}
                title={branch.title}
                descriptor={branch.descriptor}
                tone={branch.tone}
                compact={true}
                selected={selectedBranchId === branch.id}
                onSelect={onBranchPreview}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MOBILE VIEW (Vertical timeline with connected nodes and branch stack)    */}
      {/* ========================================================================= */}
      <div className="md:hidden space-y-6 pt-2 pb-4">
        <div className="relative pl-6 space-y-6 before:absolute before:left-5 before:top-4 before:bottom-4 before:w-1 before:bg-green/30 before:rounded-full">
          {stages.map((stg) => (
            <div key={stg.id} className="relative flex items-start gap-4">
              <div className="-ml-6">
                <JourneyStageNode
                  id={stg.id}
                  title={stg.title}
                  subtitle={stg.subtitle}
                  state={stg.state}
                  isCurrent={stg.isCurrent}
                  icon={getStageIcon(stg.iconName, stg.state)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Branches */}
        <div className="pt-2 border-t border-border/60">
          <h4 className="text-xs font-semibold text-ink-muted mb-2.5 px-1">
            {mode === "exploring" ? "Available Career Paths" : "Your foundations also transfer to"}
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {(mode === "exploring" ? branches : exactBranches).map((branch) => (
              <CareerBranchCard
                key={branch.id}
                careerId={branch.id}
                title={branch.title}
                descriptor={branch.descriptor}
                tone={branch.tone}
                compact={mode === "exact"}
                selected={selectedBranchId === branch.id}
                onSelect={onBranchPreview}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
