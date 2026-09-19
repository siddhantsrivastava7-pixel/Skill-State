# Domain Data Model

Use these names and meanings.

## `LearnerProfile`

```ts
type LearnerProfile = {
  id: string;
  name: string;
  stage:
    | "school"
    | "college"
    | "graduate"
    | "professional";
  stageDetail?: string;
  fieldOfStudy?: string;
  weeklyHours: number;
  targetTimelineMonths?: number;
  learningPreference: "projects-first" | "balanced" | "structured-first";
  destinationCertainty: "exact" | "general" | "exploring";
  statedDestination?: string;
  statedField?: string;
  interests: string[];
};
```

## `CapabilityNode`

```ts
type CapabilityNode = {
  id: string;
  name: string;
  family: string;
  description: string;
  importance: "core" | "important" | "useful";
  stageExpected?: "foundation" | "developing" | "specialist";
  prerequisites: string[];
  unlocks: string[];
};
```

## `DestinationGraph`

```ts
type DestinationGraph = {
  destinationId: string;
  destinationName: string;
  summary: string;
  confidence: "high" | "medium" | "low";
  capabilityNodes: CapabilityNode[];
  proofExpectations: ProofExpectation[];
  experienceExpectations: ExperienceExpectation[];
  adjacentDestinations: AdjacentDestination[];
  sharedFoundationNodeIds: string[];
  decisionPointMonths?: number;
};
```

## `SkillClaim`

```ts
type SkillClaim = {
  capabilityId: string;
  selfReportedLevel: "none" | "basic" | "working" | "strong";
  source: "onboarding" | "profile-edit";
};
```

## `Evidence`

```ts
type Evidence = {
  id: string;
  type:
    | "resume"
    | "portfolio"
    | "certificate"
    | "project"
    | "assessment"
    | "activity"
    | "experience";
  title: string;
  sourceText?: string;
  createdAt: string;
  capabilitySignals: {
    capabilityId: string;
    signal: "supports" | "weakens" | "unclear";
    strength: "low" | "medium" | "high";
    explanation: string;
  }[];
};
```

## `VerifiedCapabilityState`

```ts
type VerifiedCapabilityState = {
  capabilityId: string;
  state:
    | "verified"
    | "developing"
    | "needs-proof"
    | "gap"
    | "unverified";
  evidenceIds: string[];
  explanation: string;
  lastUpdatedAt: string;
};
```

No raw numeric “mastery score” is required in MVP.

## `Gap`

```ts
type Gap = {
  capabilityId: string;
  gapType:
    | "never-learned"
    | "weak"
    | "false-confidence"
    | "knowledge-no-proof"
    | "missing-experience";
  priority: "critical" | "high" | "medium" | "low";
  reason: string;
  blocksCapabilityIds: string[];
};
```

## `ActionItem`

```ts
type ActionItem = {
  id: string;
  category: "learn" | "prove" | "build" | "experience" | "signal";
  title: string;
  description: string;
  whyNow: string;
  estimatedMinutes: number;
  capabilityIds: string[];
  status: "todo" | "doing" | "done";
};
```

## `AdaptivePlan`

```ts
type AdaptivePlan = {
  generatedAt: string;
  summary: string;
  now: ActionItem[];
  weeks: {
    weekIndex: number;
    objectives: string[];
    actions: ActionItem[];
  }[];
  milestones: {
    id: string;
    title: string;
    targetMonth: number;
    evidenceNeeded: string[];
  }[];
};
```

## `ProgressReport`

```ts
type ProgressReport = {
  generatedAt: string;
  skillsAcquired: string[];
  skillsInProgress: string[];
  remainingGaps: string[];
  proofAdded: string[];
  experienceAdded: string[];
  planChanges: string[];
  nextSteps: string[];
};
```

## Important semantic rule

A course completion is evidence of activity, not automatic evidence of capability.

A certificate is supporting evidence, not automatic verification.

A project can provide strong proof only for the capabilities actually demonstrated by the project.
