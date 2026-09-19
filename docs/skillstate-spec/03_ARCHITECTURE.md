# Technical Architecture

## Fixed stack

Use this stack unless the user explicitly changes it:

- Next.js 15, App Router
- TypeScript, `strict: true`
- Tailwind CSS
- Lucide React icons
- Zustand for client product state
- `zustand/middleware` persist for demo persistence
- Zod for all domain schemas and AI output validation
- React Hook Form for forms
- server route handlers for file extraction and AI calls
- `pdf-parse` for PDF text extraction
- `mammoth` for DOCX extraction
- Vitest for domain unit tests
- Playwright for one end-to-end happy path if time permits

Do not install a UI component framework. Build the specified primitives directly.

## Repository layout

```text
src/
  app/
    page.tsx
    onboarding/page.tsx
    journey/page.tsx
    skills/page.tsx
    assess/page.tsx
    projects/page.tsx
    experience/page.tsx
    careers/page.tsx
    resources/page.tsx
    report/page.tsx
    api/
      extract/route.ts
      agent/
        compile-destination/route.ts
        analyze-evidence/route.ts
        generate-verification/route.ts
        evaluate-verification/route.ts
        build-plan/route.ts
        replan/route.ts
        resources/route.ts
        progress-report/route.ts
        ask/route.ts

  components/
    shell/
    journey/
    state/
    evidence/
    assess/
    projects/
    plan/
    report/
    ui/

  domain/
    schemas.ts
    types.ts
    constants.ts
    scoring.ts
    prioritization.ts
    optionality.ts
    selectors.ts

  agent/
    provider.ts
    demo-provider.ts
    prompts.ts
    validators.ts
    orchestrator.ts

  data/
    demo/
    resources/

  store/
    useSkillStateStore.ts

  lib/
    files.ts
    dates.ts
    ids.ts
    format.ts
```

## Data ownership

The Zustand store is the single client-side source of truth for the hackathon MVP.

Persist:
- profile,
- destination,
- destination graph,
- claimed states,
- verified states,
- evidence,
- plan,
- activity ledger,
- progress reports.

Do not persist raw uploaded file binaries in local storage.

## Repository abstraction

All state-changing logic must go through domain functions.

UI components must not directly calculate:
- skill priority,
- verification need,
- optionality,
- plan order,
- progress state.

This keeps the product portable to Supabase later.

## AI provider architecture

Define:

```ts
interface AIProvider {
  compileDestination(input: CompileDestinationInput): Promise<DestinationGraph>;
  analyzeEvidence(input: EvidenceAnalysisInput): Promise<EvidenceAnalysisResult>;
  generateVerification(input: VerificationRequest): Promise<VerificationTask[]>;
  evaluateVerification(input: VerificationSubmission): Promise<VerificationResult>;
  buildPlan(input: BuildPlanInput): Promise<AdaptivePlan>;
  recommendResources(input: ResourceRequest): Promise<ResourceRecommendation[]>;
  generateProgressReport(input: ProgressReportInput): Promise<ProgressReport>;
  answerJourneyQuestion(input: JourneyQuestion): Promise<JourneyAnswer>;
}
```

Implement `DemoAIProvider` first.

The real provider adapter is added later. The UI must not care which provider is active.

## Demo resilience

Environment:

```text
SKILLSTATE_AI_MODE=demo | live
```

- `demo` returns deterministic fixture-backed results.
- `live` calls the configured model adapter.
- if live AI fails, surface a non-destructive error and allow switching to demo mode.
- never leave the UI blank because AI failed.

## Event-driven adaptation

These events can trigger recomputation:

- `DESTINATION_CHANGED`
- `EVIDENCE_ADDED`
- `SKILL_CLAIM_CHANGED`
- `VERIFICATION_COMPLETED`
- `ACTIVITY_COMPLETED`
- `PROJECT_ADDED`
- `TIME_BUDGET_CHANGED`

Flow:

```text
event
→ update evidence/state
→ recompute affected skill state
→ identify changed gaps
→ recalculate next-best actions
→ update plan
→ append explanation to activity ledger
```

## Hard rule

Never let the LLM directly mutate application state.

LLM:
1. returns structured proposal,
2. Zod validates,
3. deterministic domain layer decides what to apply,
4. store updates,
5. event is logged.
