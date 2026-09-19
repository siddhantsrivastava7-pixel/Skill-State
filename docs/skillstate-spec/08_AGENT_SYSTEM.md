# Agent System

## Principle

Do not build a swarm of agents.

Build one orchestrated product agent with specialized operations.

This is easier to debug, easier to demo, and still genuinely agentic because it:
- observes new evidence,
- reasons over state,
- decides what needs verification,
- changes the plan,
- records why.

## Operation 1 — Destination Compiler

Input:
- learner stage,
- certainty,
- stated role/field/interests,
- timeline.

Output:
- `DestinationGraph`.

Rules:
- exact role → one primary destination + adjacent destinations.
- general field → 5–8 plausible destinations + shared foundation.
- exploring → 5–8 destinations driven by interests + shared foundation.
- do not assume engineering.
- generate career capabilities at a useful level of granularity.
- avoid micromanaging academic subtopics unless needed for a verification task.
- include knowledge, tools, proof, experience, and signals.

## Operation 2 — Evidence Analyzer

Input:
- extracted document text,
- project descriptions,
- destination graph.

Output:
- evidence signals linked to capability IDs.

Rules:
- distinguish explicit claims from demonstrated evidence.
- do not verify based on a resume claim alone.
- certificates can support but not conclusively prove practical competence.
- projects can strongly support a skill if the description shows direct use.

## Operation 3 — Verification Planner

Purpose:
Test only uncertain/high-impact skills.

Priority:
1. important capability with no evidence,
2. self-reported strong capability with weak evidence,
3. capability that unlocks many later capabilities,
4. capability currently blocking a near-term milestone.

Initial verification queue: max 3 tasks.

## Operation 4 — Verification Evaluator

Return:
- result,
- evidence signal,
- proposed state change,
- explanation,
- plan impact.

No hidden numeric “IQ-like” scores.

## Operation 5 — Gap Analyzer

Classify:
- never learned,
- weak,
- false confidence,
- knowledge without proof,
- missing experience.

Priority rule:

```text
importance
× downstream unlocks
× deficit severity
× timeline urgency
```

Implement this deterministically in `domain/prioritization.ts`.

The LLM may explain; it does not set priority arbitrarily.

## Operation 6 — Journey Planner

Generate:
- immediate 3 actions,
- 4-week plan,
- longer milestones.

Exploring learner:
- prioritize shared foundations and low-cost exploration;
- preserve optionality;
- include a future decision point.

Exact learner:
- prioritize blocking gaps;
- do not reteach verified capabilities;
- balance learn / prove / build / experience.

## Operation 7 — Replanner

Triggers:
- evidence added,
- verification completed,
- destination changed,
- weekly hours changed,
- action completed.

Output:
- changed actions,
- reason,
- affected milestones.

UI must show a visible “plan changed because…” explanation.

## Operation 8 — Resource Matcher

Input:
- learning objective,
- learner preference,
- available time.

Output:
- 2–4 resources.

Never make resource selection the center of the product.

## Operation 9 — Progress Reporter

Must output exactly:
- skills acquired,
- skills in progress,
- remaining gaps,
- proof added,
- experience added,
- plan changes,
- next steps.

## Operation 10 — Ask SkillState

Answer only from:
- current learner profile,
- destination graph,
- evidence,
- plan,
- progress state.

If user asks general career information not present in state, the live provider can answer with an explicit “general guidance” label.

## Deterministic SkillState transition rules

### Resume claim only
→ `unverified` or `needs-proof`

### Certificate + no task/project evidence
→ `needs-proof`

### Strong project evidence
→ `developing` or `verified` depending on directness

### Verification pass
→ increase evidence and move at most one state step unless evidence is strong

### Verification fail
→ `developing` or `gap`; never erase previous evidence

### Repeated failures
→ mark gap reason as repeated struggle and insert repair action

### Completed learning activity
→ do not automatically verify

## System prompt — Destination Compiler

Use this text verbatim in the live provider:

“You are SkillState’s Destination Compiler. Your job is to construct a practical competency graph for a learner’s desired destination. Work backward from credible readiness for the destination. Include knowledge, practical skills, tools, proof/projects, experience, credentials only when meaningful, and visible career signals. Adapt expectations to the learner’s life stage and timeline. If the learner is uncertain, preserve optionality by identifying shared foundations and a reasonable future decision point. Do not force specialization early. Do not assume the learner is in engineering or technology. Keep capability nodes broad enough to generalize across institutions and curricula; do not micromanage individual academic subtopics unless they are essential to the destination. Return only the required structured JSON.”

## System prompt — Evidence Analyzer

“You are SkillState’s Evidence Analyzer. Separate claims from evidence. A resume claim is not proof. A certificate supports exposure but does not automatically prove practical ability. Project evidence is strong only when the learner’s described actions demonstrate the capability. Link each useful piece of evidence to the provided capability IDs. Flag uncertainty rather than inventing confidence. Return only the required structured JSON.”

## System prompt — Journey Planner

“You are SkillState’s Journey Planner. Build the shortest credible path from the learner’s verified current state to the destination. Never reteach capabilities already well supported by evidence. Prioritize blocking gaps and prerequisite relationships. Balance learning with proof, projects, experience and visible signals. If the learner is uncertain, prioritize shared foundations and exploration that keep multiple destinations open. Respect the learner’s weekly time budget and target timeline. Every recommended action must include a plain-language reason for why it belongs now. Return only the required structured JSON.”
