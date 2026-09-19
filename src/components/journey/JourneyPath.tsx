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

  return (
    <div className={`relative w-full ${className}`}>
      {/* ========================================================================= */}
      {/* DESKTOP / TABLET VIEW (Responsive SVG Path + Overlaid Nodes & Cards)      */}
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
            {/* Soft path glow filter */}
            <filter id="pathGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1FA978" floodOpacity="0.15" />
            </filter>
          </defs>

          {mode === "exploring" ? (
            <>
              {/* --- SHARED WINDING PATH (Exploring: 4 Nodes) --- */}
              {/* Soft mint underlay / halo */}
              <path
                d="M 100 185 C 190 170, 200 175, 290 175 C 380 175, 390 185, 480 185 C 570 185, 580 180, 670 180"
                stroke="#EAF8F2"
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.9"
              />
              {/* Main solid green path line (5px) */}
              <path
                d="M 100 185 C 190 170, 200 175, 290 175 C 380 175, 390 185, 480 185 C 570 185, 580 180, 670 180"
                stroke="#1FA978"
                strokeWidth="5"
                strokeLinecap="round"
                filter="url(#pathGlow)"
              />

              {/* --- BRANCHING DASHED CURVES (From Decision Point 670, 180 to Cards 760, Y) --- */}
              {branches.slice(0, 4).map((branch, index) => {
                const targetY = [55, 138, 222, 305][index] ?? 180;
                const isSelected = selectedBranchId === branch.id;
                const color = branchStrokeColors[branch.tone] || "#8B5CF6";
                const isAnySelected = Boolean(selectedBranchId);

                return (
                  <path
                    key={branch.id}
                    d={`M 670 180 C 705 180, 725 ${targetY}, 760 ${targetY}`}
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
              {/* --- SHARED WINDING PATH (Exact Destination: 5 Nodes) --- */}
              {/* Nodes at: 80, 220, 360, 500, 640 */}
              <path
                d="M 80 185 C 150 172, 150 178, 220 178 C 290 178, 290 188, 360 188 C 430 188, 430 180, 500 180 C 570 180, 570 185, 640 185"
                stroke="#EAF8F2"
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.9"
              />
              <path
                d="M 80 185 C 150 172, 150 178, 220 178 C 290 178, 290 188, 360 188 C 430 188, 430 180, 500 180 C 570 180, 570 185, 640 185"
                stroke="#1FA978"
                strokeWidth="5"
                strokeLinecap="round"
                filter="url(#pathGlow)"
              />

              {/* Branch curves from Target node 640, 185 to adjacent cards */}
              {branches.slice(0, 3).map((branch, index) => {
                const targetY = [85, 185, 285][index] ?? 185;
                const isSelected = selectedBranchId === branch.id;
                const color = branchStrokeColors[branch.tone] || "#3B82F6";
                const isAnySelected = Boolean(selectedBranchId);

                return (
                  <path
                    key={branch.id}
                    d={`M 640 185 C 685 185, 715 ${targetY}, 760 ${targetY}`}
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
          )}
        </svg>

        {/* --- STAGE NODES LAYER --- */}
        {mode === "exploring" ? (
          <div className="absolute inset-y-0 left-0 right-[260px] pointer-events-none">
            {/* Stage 1: Today (x: 100) */}
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

            {/* Stage 2: Foundations (x: 290) */}
            <div className="absolute left-[29%] top-[153px] -translate-x-1/2 pointer-events-auto">
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

            {/* Stage 3: Explore (x: 480) */}
            <div className="absolute left-[48%] top-[163px] -translate-x-1/2 pointer-events-auto">
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

            {/* Stage 4: Decision Point (x: 670) */}
            <div className="absolute left-[67%] top-[158px] -translate-x-1/2 pointer-events-auto">
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
          <div className="absolute inset-y-0 left-0 right-[260px] pointer-events-none">
            {/* Exact mode: 5 nodes */}
            {stages.map((stg, i) => {
              const leftPercents = ["8%", "22%", "36%", "50%", "64%"];
              const topPx = [163, 156, 166, 158, 163];
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
        <div className="absolute right-4 top-4 bottom-4 w-[240px] flex flex-col justify-between py-1 z-10">
          {mode === "exact" && (
            <div className="text-[11px] font-semibold text-ink-muted px-1 tracking-tight">
              Your foundations also transfer to:
            </div>
          )}
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
        </div>
      </div>
    </div>
  );
}
