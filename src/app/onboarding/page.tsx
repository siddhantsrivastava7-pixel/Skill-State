"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  Input,
  Textarea,
  Pill,
  Badge,
  ProgressBar,
  FileDrop,
  IconButton,
  InlineNotice,
} from "@/components/ui";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Trash2,
  FileText,
  Upload,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  DestinationCertainty,
  Evidence,
  LearnerProfile,
  LearnerStage,
  LearningPreference,
  EvidenceType,
  PlanningHorizon,
  PlanningHorizonMode,
} from "@/domain/types";
import { calculateGraduationEstimate } from "@/domain/planning-horizon";
import { useSkillStateStore } from "@/store/useSkillStateStore";
import { getClientAIProvider } from "@/agent/client-provider";
import { generateId } from "@/lib/ids";
import { prioritizeGaps } from "@/domain/prioritization";
import { deriveVerifiedStates } from "@/domain/evidence-transition";

interface UploadedFileItem {
  id: string;
  name: string;
  type: EvidenceType;
  extractedStatus: "extracting" | "extracted" | "failed";
  text: string;
  wordCount: number;
}

const STAGE_OPTIONS: { id: LearnerStage; label: string }[] = [
  { id: "school", label: "Class 10–12" },
  { id: "college", label: "College / university" },
  { id: "graduate", label: "Graduate" },
  { id: "professional", label: "Working professional" },
];

const CERTAINTY_OPTIONS: {
  id: DestinationCertainty;
  title: string;
  helper: string;
}[] = [
  {
    id: "exact",
    title: "I know exactly what I want",
    helper: "I already have a specific role in mind.",
  },
  {
    id: "general",
    title: "I know the general direction",
    helper: "I know the field, but not the exact role.",
  },
  {
    id: "exploring",
    title: "I'm still exploring",
    helper: "Help me discover paths without closing doors.",
  },
];

const SUGGESTED_INTERESTS = [
  "building things",
  "AI",
  "data",
  "problem solving",
  "design",
  "finance",
  "business",
  "cybersecurity",
];

const GENERATION_STEPS = [
  "Understanding destination",
  "Reading existing evidence",
  "Building expected state",
  "Creating first path",
];

export default function OnboardingPage() {
  const router = useRouter();

  // Store actions
  const initializeJourney = useSkillStateStore((s) => s.initializeJourney);

  // Form states
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Current stage
  const [stage, setStage] = useState<LearnerStage>("college");
  const [collegeYear, setCollegeYear] = useState<string>("3");
  const [fieldOfStudy, setFieldOfStudy] = useState<string>("Computer Science");

  // Step 2: Destination certainty
  const [certainty, setCertainty] = useState<DestinationCertainty>("exact");
  const [targetRole, setTargetRole] = useState<string>("AI Engineer");
  const [generalField, setGeneralField] = useState<string>("Technology");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "building things",
    "AI",
  ]);
  const [customInterest, setCustomInterest] = useState<string>("");

  // Step 3: Existing evidence
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [pastedProjectText, setPastedProjectText] = useState<string>("");

  // Step 4: Constraints
  const [weeklyHours, setWeeklyHours] = useState<number>(10);
  const [planningHorizonMode, setPlanningHorizonMode] =
    useState<PlanningHorizonMode>(stage === "college" || stage === "school" ? "until-graduation" : "twelve-months");
  const [customMonths, setCustomMonths] = useState<number>(24);
  const [learningPreference, setLearningPreference] =
    useState<LearningPreference>("projects-first");

  const graduationEstimate = calculateGraduationEstimate(stage, collegeYear);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepIndex, setGenerationStepIndex] = useState(0);
  const [generationError, setGenerationError] = useState("");

  // Handlers for Step 2 Interests
  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else if (selectedInterests.length < 5) {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (trimmed && !selectedInterests.includes(trimmed) && selectedInterests.length < 5) {
      setSelectedInterests([...selectedInterests, trimmed]);
      setCustomInterest("");
    }
  };

  // Handlers for Step 3 Files
  const handleFilesSelected = async (files: File[]) => {
    for (const file of files) {
      const tempId = generateId("file");
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

      // Determine document type guess based on filename
      let docType: EvidenceType = "resume";
      const lower = file.name.toLowerCase();
      if (lower.includes("cert")) docType = "certificate";
      else if (lower.includes("port") || lower.includes("project")) docType = "project";

      const newItem: UploadedFileItem = {
        id: tempId,
        name: file.name,
        type: docType,
        extractedStatus: "extracting",
        text: "",
        wordCount: 0,
      };

      setUploadedFiles((prev) => [...prev, newItem]);

      // Call extraction API
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentType", docType);

        const res = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Server-side document extraction failed");
        const data = await res.json();
        setUploadedFiles((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  extractedStatus: "extracted",
                  text: data.extractedText,
                  wordCount: data.wordCount,
                }
              : item
          )
        );
      } catch {
        setUploadedFiles((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  extractedStatus: "failed",
                  text: "",
                  wordCount: 0,
                }
              : item
          )
        );
      }
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  // Step 4: Submission & Deterministic Generation
  const handleFinalSubmit = async () => {
    setIsGenerating(true);
    setGenerationStepIndex(0);
    setGenerationError("");

    try {
      const provider = getClientAIProvider();

    // Step 1: Understanding destination
    await new Promise((r) => setTimeout(r, 600));
    setGenerationStepIndex(1);

    const estimatedGradMonths = calculateGraduationEstimate(stage, collegeYear);
    const resolvedMonths =
      planningHorizonMode === "six-months"
        ? 6
        : planningHorizonMode === "twelve-months"
        ? 12
        : planningHorizonMode === "until-graduation"
        ? (estimatedGradMonths ?? 12)
        : planningHorizonMode === "custom"
        ? customMonths
        : undefined;

    const planningHorizonObj: PlanningHorizon = {
      mode: planningHorizonMode,
      resolvedMonths,
      customMonths: planningHorizonMode === "custom" ? customMonths : undefined,
      isEstimate: planningHorizonMode === "until-graduation",
    };

    const profileData: LearnerProfile = {
      id: generateId("profile"),
      name: "Siddhant",
      stage,
      stageDetail:
        stage === "college"
          ? `Year ${collegeYear} Undergraduate`
          : stage === "school"
          ? "Class 12"
          : stage,
      fieldOfStudy: stage === "college" ? fieldOfStudy : undefined,
      weeklyHours,
      targetTimelineMonths: resolvedMonths,
      planningHorizon: planningHorizonObj,
      learningPreference,
      destinationCertainty: certainty,
      statedDestination: certainty === "exact" ? targetRole : undefined,
      statedField: certainty === "general" ? generalField : undefined,
      interests: selectedInterests,
    };

    const graph = await provider.compileDestination({
      stage,
      certainty,
      statedDestination: targetRole,
      statedField: generalField,
      interests: selectedInterests,
      timelineMonths: resolvedMonths,
      planningHorizon: planningHorizonObj,
    });

    // Step 2: Reading existing evidence
    await new Promise((r) => setTimeout(r, 600));
    setGenerationStepIndex(2);

    const generatedEvidences: Evidence[] = [];

    // Ingest uploaded files
    for (const f of uploadedFiles) {
      if (f.extractedStatus !== "extracted" || !f.text.trim()) continue;
      const analysis = await provider.analyzeEvidence({
        documentText: f.text,
        documentType: f.type,
        filename: f.name,
        destinationGraph: graph,
      });
      generatedEvidences.push(analysis.evidence);
    }

    // Ingest pasted project descriptions if provided
    if (pastedProjectText.trim()) {
      const projAnalysis = await provider.analyzeEvidence({
        documentText: pastedProjectText,
        documentType: "project",
        filename: "Pasted Project Description",
        destinationGraph: graph,
      });
      generatedEvidences.push({
        ...projAnalysis.evidence,
        title: "Project Description",
        type: "project",
      });
    }

    // Step 3: Building expected state
    await new Promise((r) => setTimeout(r, 600));
    setGenerationStepIndex(3);

    // Step 4: Creating first path
    const verifiedStates = deriveVerifiedStates(graph, generatedEvidences);
    const gaps = prioritizeGaps({
      graph,
      verifiedStates,
      claimedStates: {},
      targetTimelineMonths: profileData.targetTimelineMonths,
    });
    const plan = await provider.buildPlan({
      profile: profileData,
      graph,
      verifiedStates,
      claimedStates: {},
      gaps,
      planningReason: "initial",
    });
    initializeJourney(profileData, graph, generatedEvidences, plan);

    // Navigate to home
    router.push("/");
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : "SkillState could not create the journey. Your current state was not changed."
      );
      setIsGenerating(false);
    }
  };

  // Generation Modal / Fullscreen view
  if (isGenerating) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-xl border-border">
          <div className="w-12 h-12 rounded-full bg-accent-soft text-accent mx-auto flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-ink">
              {GENERATION_STEPS[generationStepIndex]}
            </h2>
            <p className="text-xs text-ink-muted">
              Step {generationStepIndex + 1} of 4: Synthesizing your adaptive journey
            </p>
          </div>

          <ProgressBar
            value={(generationStepIndex + 1) * 25}
            max={100}
            variant="accent"
            size="md"
          />

          <div className="space-y-2 text-left text-xs pt-2">
            {GENERATION_STEPS.map((stepLabel, idx) => {
              const isCompleted = idx < generationStepIndex;
              const isCurrent = idx === generationStepIndex;
              return (
                <div
                  key={stepLabel}
                  className={`flex items-center gap-2.5 transition-colors ${
                    isCompleted
                      ? "text-brandGreen font-medium"
                      : isCurrent
                      ? "text-accent font-semibold"
                      : "text-ink-muted/50"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-brandGreen flex-shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-accent animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-border flex-shrink-0" />
                  )}
                  <span>{stepLabel}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span className="font-semibold text-accent uppercase tracking-wider text-[11px]">
            Step {currentStep} of 4
          </span>
          <span>{Math.round((currentStep / 4) * 100)}% completed</span>
        </div>
        <ProgressBar value={currentStep * 25} max={100} size="sm" />
      </div>

      {/* Step 1: Current stage */}
      {currentStep === 1 && (
        <Card className="space-y-6 p-6 sm:p-8">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
              Where are you starting from?
            </h1>
            <p className="text-xs text-ink-muted">
              Select your current educational or career stage to calibrate foundation expectations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STAGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStage(opt.id)}
                className={`p-4 rounded-sm border text-left transition-all ${
                  stage === opt.id
                    ? "border-accent bg-accent-soft/40 shadow-xs ring-1 ring-accent"
                    : "border-border bg-surface hover:bg-surface-soft hover:border-ink-muted/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{opt.label}</span>
                  {stage === opt.id && (
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Conditional College Fields */}
          {stage === "college" && (
            <div className="p-4 rounded-sm bg-surface-soft border border-border space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink">
                  Undergraduate Year
                </label>
                <div className="flex gap-2">
                  {["1", "2", "3", "4", "5+"].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setCollegeYear(yr)}
                      className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold border transition-colors ${
                        collegeYear === yr
                          ? "bg-accent text-white border-accent"
                          : "bg-surface text-ink border-border hover:bg-surface-soft"
                      }`}
                    >
                      Year {yr}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Field of study"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                placeholder="e.g. Computer Science, Mechanical Engineering, Commerce"
              />
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={() => setCurrentStep(2)}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Destination certainty */}
      {currentStep === 2 && (
        <Card className="space-y-6 p-6 sm:p-8">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
              How clear is the destination?
            </h1>
            <p className="text-xs text-ink-muted">
              Choose how specific your target role is today. You can always change or explore later.
            </p>
          </div>

          <div className="space-y-3">
            {CERTAINTY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCertainty(opt.id)}
                className={`w-full p-4 rounded-sm border text-left transition-all ${
                  certainty === opt.id
                    ? "border-accent bg-accent-soft/40 shadow-xs ring-1 ring-accent"
                    : "border-border bg-surface hover:bg-surface-soft hover:border-ink-muted/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-ink block">
                      {opt.title}
                    </span>
                    <span className="text-xs text-ink-muted block">{opt.helper}</span>
                  </div>
                  {certainty === opt.id && (
                    <CheckCircle2 className="w-4 h-4 text-accent mt-0.5" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Conditional questions based on certainty */}
          <div className="p-4 rounded-sm bg-surface-soft border border-border space-y-4">
            {certainty === "exact" && (
              <Input
                label="Target role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. AI Engineer, Financial Analyst, UX Designer, Data Engineer"
                helperText="We will work backward from this role's concrete requirements."
              />
            )}

            {certainty === "general" && (
              <Input
                label="General field"
                value={generalField}
                onChange={(e) => setGeneralField(e.target.value)}
                placeholder="e.g. Technology, Finance, Business Analytics, Design"
                helperText="We will identify shared foundations across related careers."
              />
            )}

            {certainty === "exploring" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-ink">
                    Select your interests (Max 5)
                  </label>
                  <p className="text-[11px] text-ink-muted">
                    Pick topics you enjoy to help map shared foundation branches.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_INTERESTS.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <Pill
                        key={interest}
                        active={isSelected}
                        clickable
                        onClick={() => toggleInterest(interest)}
                        size="sm"
                      >
                        {interest}
                      </Pill>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-1">
                  <Input
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    placeholder="Add custom interest..."
                    className="text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomInterest();
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={addCustomInterest}
                    disabled={!customInterest.trim() || selectedInterests.length >= 5}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setCurrentStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button onClick={() => setCurrentStep(3)}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Existing evidence */}
      {currentStep === 3 && (
        <Card className="space-y-6 p-6 sm:p-8">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
              Show SkillState what you&apos;ve already done.
            </h1>
            <p className="text-xs text-ink-muted">
              Upload documents or paste project descriptions so we don&apos;t reteach what you already know.
            </p>
          </div>

          <FileDrop
            onFilesSelected={handleFilesSelected}
            acceptedExtensionsText="Upload Resume, Portfolio, or Certificates (PDF, DOCX, TXT)"
          />

          {/* Uploaded File Chips */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-ink">Uploaded Documents:</h3>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-surface-soft border border-border rounded-sm text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-accent flex-shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-ink block truncate">
                          {file.name}
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          {file.type} •{" "}
                          {file.extractedStatus === "extracting"
                            ? "Extracting text..."
                            : file.extractedStatus === "failed"
                              ? "Extraction failed — remove and try again"
                              : `Extracted (${file.wordCount} words)`}
                        </span>
                      </div>
                    </div>

                    <IconButton
                      aria-label="Remove file"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-brandRed" />
                    </IconButton>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paste Project Description */}
          <div className="space-y-1.5 pt-1">
            <Textarea
              label="Paste project descriptions or repository notes (optional)"
              rows={3}
              value={pastedProjectText}
              onChange={(e) => setPastedProjectText(e.target.value)}
              placeholder="e.g. Built a Python data pipeline with Pandas and Matplotlib analyzing housing price trends..."
              helperText="Describing what you actually built helps verify practical competence."
            />
          </div>

          {generationError && (
            <InlineNotice variant="danger" title="Journey generation failed">
              {generationError} Your existing SkillState remains unchanged.
            </InlineNotice>
          )}

          <div className="flex justify-between items-center pt-2">
            <Button variant="ghost" onClick={() => setCurrentStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setCurrentStep(4)}>
                Skip for now
              </Button>
              <Button onClick={() => setCurrentStep(4)}>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Constraints */}
      {currentStep === 4 && (
        <Card className="space-y-6 p-6 sm:p-8">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
              What can this journey realistically fit around?
            </h1>
            <p className="text-xs text-ink-muted">
              Define your weekly time commitment, target timeline, and learning style.
            </p>
          </div>

          <div className="space-y-4">
            {/* Hours per week */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-medium text-ink">Hours available per week</label>
                <span className="font-semibold text-accent">{weeklyHours} hours/week</span>
              </div>
              <input
                type="range"
                min={3}
                max={30}
                step={1}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className="w-full accent-accent h-2 bg-surface-soft rounded-pill cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-ink-muted">
                <span>3 hrs (light)</span>
                <span>10 hrs (balanced)</span>
                <span>20+ hrs (intensive)</span>
              </div>
            </div>

            {/* How far ahead should SkillState plan? */}
            <div className="space-y-2">
              <div className="space-y-0.5">
                <label className="block text-xs font-medium text-ink">
                  How far ahead should SkillState plan?
                </label>
                {certainty === "exploring" && (
                  <p className="text-[11px] text-ink-muted">
                    For exploratory journeys, this represents how far ahead to plan before reevaluating or specializing.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Next 6 months */}
                <button
                  type="button"
                  onClick={() => setPlanningHorizonMode("six-months")}
                  className={`p-3 rounded-sm text-xs font-medium border text-left transition-colors ${
                    planningHorizonMode === "six-months"
                      ? "bg-accent text-white border-accent shadow-xs"
                      : "bg-surface text-ink border-border hover:bg-surface-soft"
                  }`}
                >
                  <span className="block font-semibold">Next 6 months</span>
                  <span
                    className={`text-[11px] block mt-0.5 ${
                      planningHorizonMode === "six-months" ? "text-white/80" : "text-ink-muted"
                    }`}
                  >
                    Near-term focus sprint
                  </span>
                </button>

                {/* Next 12 months */}
                <button
                  type="button"
                  onClick={() => setPlanningHorizonMode("twelve-months")}
                  className={`p-3 rounded-sm text-xs font-medium border text-left transition-colors ${
                    planningHorizonMode === "twelve-months"
                      ? "bg-accent text-white border-accent shadow-xs"
                      : "bg-surface text-ink border-border hover:bg-surface-soft"
                  }`}
                >
                  <span className="block font-semibold">Next 12 months</span>
                  <span
                    className={`text-[11px] block mt-0.5 ${
                      planningHorizonMode === "twelve-months" ? "text-white/80" : "text-ink-muted"
                    }`}
                  >
                    One-year milestone trajectory
                  </span>
                </button>

                {/* Until graduation — show only for school/college users */}
                {(stage === "school" || stage === "college") && (
                  <button
                    type="button"
                    onClick={() => {
                      if (stage === "college" && collegeYear === "5+") {
                        setPlanningHorizonMode("custom");
                      } else {
                        setPlanningHorizonMode("until-graduation");
                      }
                    }}
                    className={`p-3 rounded-sm text-xs font-medium border text-left transition-colors ${
                      planningHorizonMode === "until-graduation"
                        ? "bg-accent text-white border-accent shadow-xs"
                        : "bg-surface text-ink border-border hover:bg-surface-soft"
                    }`}
                  >
                    <span className="block font-semibold">Until graduation</span>
                    <span
                      className={`text-[11px] block mt-0.5 ${
                        planningHorizonMode === "until-graduation"
                          ? "text-white/80"
                          : "text-ink-muted"
                      }`}
                    >
                      {stage === "college" && collegeYear === "5+"
                        ? "Requires custom duration (Year 5+)"
                        : `~${graduationEstimate ?? 12} months (editable estimate)`}
                    </span>
                  </button>
                )}

                {/* Full path to my goal */}
                <button
                  type="button"
                  onClick={() => setPlanningHorizonMode("full-path")}
                  className={`p-3 rounded-sm text-xs font-medium border text-left transition-colors ${
                    planningHorizonMode === "full-path"
                      ? "bg-accent text-white border-accent shadow-xs"
                      : "bg-surface text-ink border-border hover:bg-surface-soft"
                  }`}
                >
                  <span className="block font-semibold">Full path to my goal</span>
                  <span
                    className={`text-[11px] block mt-0.5 ${
                      planningHorizonMode === "full-path" ? "text-white/80" : "text-ink-muted"
                    }`}
                  >
                    Complete end-to-end readiness roadmap
                  </span>
                </button>

                {/* Custom */}
                <button
                  type="button"
                  onClick={() => setPlanningHorizonMode("custom")}
                  className={`p-3 rounded-sm text-xs font-medium border text-left transition-colors ${
                    stage === "school" || stage === "college" ? "sm:col-span-2" : ""
                  } ${
                    planningHorizonMode === "custom"
                      ? "bg-accent-soft/60 text-ink border-accent shadow-xs"
                      : "bg-surface text-ink border-border hover:bg-surface-soft"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block font-semibold">Custom</span>
                      <span className="text-[11px] text-ink-muted block mt-0.5">
                        Specify an exact duration (1–72 months)
                      </span>
                    </div>
                    {planningHorizonMode === "custom" && (
                      <span className="text-xs font-semibold text-accent">
                        {customMonths} months
                      </span>
                    )}
                  </div>
                </button>
              </div>

              {/* Custom months input */}
              {planningHorizonMode === "custom" && (
                <div className="p-3.5 bg-surface-soft rounded-sm border border-border space-y-2 mt-2">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-ink whitespace-nowrap">
                      Duration (months):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={72}
                      value={customMonths}
                      onChange={(e) => setCustomMonths(Number(e.target.value))}
                      className="w-24 px-3 py-1.5 text-sm bg-surface border border-border rounded-sm focus:outline-none focus:border-accent"
                    />
                    <span className="text-xs text-ink-muted">1–72 months</span>
                  </div>
                  {customMonths > 72 && (
                    <p className="text-xs text-brandRed font-medium">
                      Custom planning horizon cannot exceed 72 months (6 years).
                    </p>
                  )}
                  {customMonths < 1 && (
                    <p className="text-xs text-brandRed font-medium">
                      Custom planning horizon must be at least 1 month.
                    </p>
                  )}
                </div>
              )}

              {/* Editable graduation estimate label */}
              {planningHorizonMode === "until-graduation" && (
                <div className="p-3 bg-surface-soft rounded-sm border border-border text-xs text-ink-muted flex items-center justify-between">
                  <div>
                    <span>
                      Estimated remaining:{" "}
                      <strong className="text-ink">
                        {graduationEstimate ?? 12} months
                      </strong>{" "}
                      based on standard academic program duration.
                    </span>
                    <span className="block text-[11px] text-ink-muted mt-0.5">
                      Clearly an editable initial estimate, not a fixed fact.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomMonths(graduationEstimate ?? 12);
                      setPlanningHorizonMode("custom");
                    }}
                    className="text-accent underline text-xs font-medium whitespace-nowrap ml-3"
                  >
                    Edit duration
                  </button>
                </div>
              )}
            </div>

            {/* Preferred learning format */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-ink">
                Preferred learning format
              </label>
              <div className="space-y-2">
                {[
                  { id: "projects-first", label: "Projects first", desc: "Build immediately, learn theory as needed." },
                  { id: "balanced", label: "Balanced", desc: "Equal mix of structured learning and practical builds." },
                  { id: "structured-first", label: "Structured learning first", desc: "Master core concepts before undertaking large projects." },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setLearningPreference(fmt.id as LearningPreference)}
                    className={`w-full p-3.5 rounded-sm border text-left transition-all ${
                      learningPreference === fmt.id
                        ? "border-accent bg-accent-soft/40 shadow-xs ring-1 ring-accent"
                        : "border-border bg-surface hover:bg-surface-soft"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-ink block">{fmt.label}</span>
                        <span className="text-[11px] text-ink-muted block">{fmt.desc}</span>
                      </div>
                      {learningPreference === fmt.id && (
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button variant="ghost" onClick={() => setCurrentStep(3)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button
              size="lg"
              onClick={handleFinalSubmit}
              disabled={planningHorizonMode === "custom" && (customMonths < 1 || customMonths > 72)}
              className="shadow-md"
            >
              <Sparkles className="w-4 h-4 mr-1.5" /> Build my SkillState
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
