# Component Catalog

Antigravity must implement these components. Do not substitute arbitrary card layouts.

## Shell

### `AppSidebar`
Props:
- activeRoute
- profileStage
- goalLabel

### `TopCommandBar`
Props:
- onOpenAsk
- userName
- stageLabel

---

## Journey

### `JourneyHero`
Composition:
- `JourneyPath`
- `ProfileNote`
- headline/subhead

### `JourneyPath`
Props:
```ts
type JourneyPathProps = {
  mode: "exploring" | "exact";
  stages: JourneyStage[];
  branches: CareerBranch[];
  selectedBranchId?: string;
  onBranchPreview(id: string): void;
}
```

### `JourneyStageNode`
Props:
- title
- subtitle
- icon
- state: complete | current | future | decision

### `CareerBranchCard`
Props:
- careerId
- title
- descriptor
- tone: purple | green | orange | blue
- selected
- onSelect

### `NextActionsCard`
Exactly 3 items on home.

### `WhyThisCard`
Shows explanation for selected next action.

### `KeepsOpenCard`
Exploring mode only.
Max 4 paths visible.

### `ProofNeededCard`
Exact destination mode only.

---

## Skill state

### `SkillStateRow`
Props:
- name
- claimedLabel
- verifiedLabel
- evidenceCount
- status

### `SkillStatusBadge`
Allowed statuses only:
- Verified
- Developing
- Needs proof
- Gap
- Unverified

### `EvidenceList`
Each evidence item:
- type
- title
- date
- source
- confidenceLabel
- affectedSkills

### `SkillDetailDrawer`
Tabs:
- Overview
- Evidence
- Unlocks
- Next step

---

## Assessment

### `VerificationQueue`
### `VerificationTaskCard`
### `QuickCheck`
### `ShortAnswerTask`
### `VerificationResultPanel`

Result panel must show:
- previous state,
- new state,
- evidence added,
- plan impact.

---

## Plan

### `JourneyTimeline`
Rows:
- Learn
- Prove
- Build
- Experience
- Signal

### `PlanBlock`
Props:
- category
- title
- start
- end
- status
- reason
- dependencies

### `WhatIfSimulator`
Fields:
- target destination
- hours/week
- target date
Buttons:
- Preview
- Apply changes
- Cancel

---

## Projects

### `ProofProjectCard`
Fields:
- title
- proofTargets
- scope
- duration
- reason
- status

---

## Progress

### `CompactSkillStrip`
Only 3–5 skills.

### `TodayPlanStrip`
Only 4 items.

### `RecentActivityStrip`
Only 4 items.

### `ProgressReportSection`

---

## Utility

Build these primitives:
- Button
- IconButton
- Badge
- Pill
- Card
- Drawer
- Modal
- Tabs
- Input
- Textarea
- Select
- FileDrop
- ProgressBar
- EmptyState
- InlineNotice
- Skeleton

Use design tokens only.
