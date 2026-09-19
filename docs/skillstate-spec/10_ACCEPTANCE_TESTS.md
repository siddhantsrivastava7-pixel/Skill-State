# Acceptance Tests

A phase is not complete until relevant tests pass.

## Global

- `npm run lint`
- `npm run typecheck`
- `npm run build`

No TypeScript `any` added to silence errors unless explicitly documented.

## Home — exploring

Given Persona A:
- hero headline matches spec;
- path shows Today → Foundations → Explore → Decision Point;
- exactly 4 visible branches;
- selecting branch changes branch emphasis without navigation;
- Now card shows exactly 3 actions;
- Why this changes when next action selection changes;
- Keeps open shows 4 careers;
- compact strip appears below;
- no readiness donut;
- no XP/streaks;
- no permanent chat panel.

## Home — exact

Given Persona B:
- headline is exact destination variant;
- gap path replaces exploration branch map;
- adjacent destinations visible but secondary;
- “You are not starting from zero” banner appears;
- verified, strengthening, missing, proof-needed counts display.

## Skills

- claimed and verified state shown separately;
- resume claim alone never displays “Verified”;
- evidence drawer lists evidence source;
- “Prove this” opens assessment flow.

## Assessment

- completing seeded ML proof task changes capability state;
- activity ledger records event;
- plan automatically changes;
- result screen says exactly why plan changed.

## Destination change

From AI Engineer → Data Engineer:
- Python/SQL existing evidence remains;
- future destination graph changes;
- action plan changes;
- no evidence is deleted.

## Hours change

10h/week → 5h/week:
- plan density decreases;
- target date may shift if necessary;
- existing verified states remain unchanged.

## Report

Contains all PS-required sections:
- acquired,
- in progress,
- remaining gaps,
- next steps.

## Career-agnostic

Loading Financial Analyst demo:
- no engineering-specific labels remain in the main journey;
- destination graph shows finance capabilities;
- project suggestions are finance-relevant;
- proof tasks are finance-relevant.

## Accessibility

- all primary controls keyboard reachable;
- focus visible;
- form labels present;
- no color-only status;
- mobile 390px viewport has no page-level horizontal scroll.
