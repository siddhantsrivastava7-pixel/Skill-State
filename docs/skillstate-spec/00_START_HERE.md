# SkillState — Antigravity Build Pack

This package is the source of truth for the hackathon build.

## Prime directive

**Antigravity is an implementation engine, not a product designer.**
It must not invent UI, UX, copy, architecture, data models, agent behavior, colors, layouts, routes, features, or workflows.

If anything is missing or contradictory:
1. stop,
2. report the exact ambiguity,
3. wait for the user to resolve it.

Do **not** fill gaps with your own product ideas.

## Read order

1. `01_PRODUCT_BRIEF.md`
2. `02_HACKATHON_REQUIREMENTS.md`
3. `03_ARCHITECTURE.md`
4. `04_DESIGN_SYSTEM.md`
5. `05_SCREEN_SPECS.md`
6. `06_COMPONENT_CATALOG.md`
7. `07_DATA_MODEL.md`
8. `08_AGENT_SYSTEM.md`
9. `09_DEMO_DATA.md`
10. `10_ACCEPTANCE_TESTS.md`
11. `13_BUILD_CHECKLIST.md`
12. Run the prompts in `/prompts` **one at a time and in order**.

## Non-negotiable implementation rules

- Do not redesign anything.
- Do not add features that are not in this pack.
- Do not remove features because they look difficult.
- Do not substitute a generic dashboard for the specified interfaces.
- Do not use generic AI gradients or glowing neon visual language.
- Do not add XP, coins, streaks, avatars, gamification, mascots, or inspirational clutter.
- Do not add charts unless explicitly specified.
- Do not add an always-open AI chat sidebar.
- Do not invent career-readiness percentages that imply scientific precision.
- Do not present self-reported skill as verified skill.
- Do not mark a skill verified without evidence.
- Do not create a hard-coded curriculum for a single career.
- Do not hard-code IITM, AI engineering, or engineering-only assumptions into the core architecture.
- All role-specific content must come from data returned by the Destination Compiler or from demo fixtures.
- Keep all AI outputs behind Zod validation.
- Keep demo mode deterministic and available even if the model/API fails.
- After every phase: run lint/typecheck/build and report the exact files changed.
- Never silently fix unrelated code.

## The one-sentence product definition

**SkillState is an adaptive career-navigation agent that works backward from any destination, verifies where a learner actually is, identifies the shortest credible path between the two, and continuously replans learning, proof, projects, and experience as the learner changes.**

## Design reference

The selected design reference is in:

`assets/skillstate-reference-ui.png`

Use it for visual hierarchy and tone. Implementation specs in this pack override any ambiguous detail in the image.
