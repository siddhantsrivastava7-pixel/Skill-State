# Screen Specifications

## 1. `/onboarding`

Purpose: collect only information needed to construct the initial state.

### Step 1 — Current stage

Headline:
**Where are you starting from?**

Options:
- Class 10–12
- College / university
- Graduate
- Working professional

If college:
- year: 1, 2, 3, 4, 5+
- field of study: free text

### Step 2 — Destination certainty

Headline:
**How clear is the destination?**

Choices:

1. **I know exactly what I want**
   helper: “I already have a specific role in mind.”

2. **I know the general direction**
   helper: “I know the field, but not the exact role.”

3. **I'm still exploring**
   helper: “Help me discover paths without closing doors.”

Exact → ask target role.
General → ask field.
Exploring → ask interests, max 5 chips + optional text.

### Step 3 — Existing evidence

Headline:
**Show SkillState what you've already done.**

Inputs:
- upload resume
- upload portfolio PDF
- upload certificates
- paste project descriptions
- optional “Skip for now”

Accepted: PDF, DOCX, TXT.

After files:
show file chips with:
- filename,
- type,
- extracted text status,
- remove.

### Step 4 — Constraints

Headline:
**What can this journey realistically fit around?**

Fields:
- hours available per week
- target timeline
- preferred learning format:
  - projects first,
  - balanced,
  - structured learning first

CTA:
**Build my SkillState**

### Generation state

Do not show a spinner alone.

Show 4 deterministic steps:
- Understanding destination
- Reading existing evidence
- Building expected state
- Creating first path

Then navigate to home.

---

# 2. `/` Home

The home screen adapts based on destination certainty.

## Exploring variant

Hero headline:
**Explore your future without closing doors too early.**

Subhead:
**Build strong foundations, try different paths, and keep your options open before you specialize.**

Hero:
Today → Foundations → Explore → Decision Point → 4 visible career branches.

Top right profile note:
“Keep exploring. A wider foundation gives you more freedom later.”

Primary cards:

### Now
Exactly 3 next actions.

Example:
1. Learn Python fundamentals
2. Try a mini project
3. Explore 2 career paths

### Why this?
Explain action #1 and what it unlocks.

### Keeps open
Show 4 most relevant career paths and:
“You don't need to choose now.”

Compact strip:
- Skills & Progress
- Today's Plan
- Recent Activity

## Exact destination variant

Hero headline:
**Your shortest credible path to {destination}.**

Shared path:
Today → Fix gaps → Build proof → Gain experience → Target

Right edge:
show 2–3 adjacent careers under:
**Your foundations also transfer to**

Primary cards:
- Now
- Why this?
- Proof still needed

## Third-year / later-stage variant

Add a compact banner above hero:
**You are not starting from zero.**

Show:
- verified,
- needs strengthening,
- missing,
- needs proof.

Do not show one overall “career readiness %”.

---

# 3. `/journey`

Purpose: multi-year / multi-month plan.

Header:
**Your journey to {destination}**

Controls:
- Timeline
- By skill
- By proof
- By experience

Main view:
horizontal periods:
- Now
- 3 months
- 6 months
- 12 months
- 18 months
- Target

Rows:
- Learn
- Prove
- Build
- Experience
- Signal

Each plan block contains:
- title,
- duration,
- state,
- reason,
- dependencies.

Click opens detail drawer.

Top action:
**What if...?**

Simulator controls:
- change destination,
- change weekly hours,
- change target date.

Preview changes before applying.

---

# 4. `/skills`

Purpose: claimed vs verified state.

Group by capability families.

Each skill row:
- name,
- claimed state,
- verified state,
- evidence count,
- status:
  - Verified
  - Developing
  - Needs proof
  - Gap
  - Unverified

Never show self-report and verified state as the same field.

Skill drawer tabs:
- Overview
- Evidence
- What it unlocks
- How to improve

CTA based on state:
- Prove this
- Strengthen this
- Add evidence

---

# 5. `/assess`

Purpose: verify claims and repair weak areas.

Sections:
- Needs verification
- Repair tasks
- Recently verified

Verification task types:
- 5-question quick check
- one scenario response
- one practical micro-task
- project evidence review

For hackathon MVP, support:
- MCQ,
- short answer,
- project description review.

Results:
- evidence added,
- state changed,
- plan impact.

Critical interaction:
After result, display:
**Your plan changed because of this result**
with before/after next action.

---

# 6. `/projects`

Purpose: proof planning.

Sections:
- Recommended next proof
- In progress
- Completed

Project card:
- project title,
- what it proves,
- suggested scope,
- estimated duration,
- related destination requirements,
- “Why this project?”

Do not recommend another project when proof is already strong and experience is the bottleneck.

---

# 7. `/experience`

Purpose: non-course development.

Sections:
- Next useful experience
- Internships
- Hackathons / competitions
- Open source / research / team work

Each recommendation:
- why now,
- what it adds,
- which skills it exercises,
- whether it is exploratory or destination-specific.

For MVP, opportunity items may come from seeded demo data.
Do not claim live availability unless a live source exists.

---

# 8. `/careers`

Purpose: career exploration.

Search + category chips:
- Technology
- Design
- Business
- Finance
- Marketing
- Research

Career detail:
- what people do,
- capability families,
- typical proof,
- experience types,
- overlap with current state,
- what would change from current plan.

CTA:
**Preview this path**

Preview must not overwrite current destination until user confirms.

---

# 9. `/resources`

Resource recommendations grouped by gap.

Resource card:
- title
- format
- provider
- estimated effort
- matched gap
- “Why this resource?”
- open external link

Resource choices must not drive SkillState.
They are implementation options for already-decided learning objectives.

---

# 10. `/report`

Periodic progress report.

Sections:
- Skills acquired
- Skills in progress
- Remaining gaps
- Proof added
- Experience gained
- Plan changes since last report
- Recommended next steps

Allow:
**Generate current report**

No PDF export required for MVP.

---

# 11. Ask SkillState

Use a command/search field in top bar, not a permanent chat sidebar.

Example questions:
- “Why am I learning this now?”
- “Can I still become a data engineer?”
- “What changed after my assessment?”
- “What should I build next?”
- “What if I only have 5 hours a week?”

Open answer in a centered command panel.

Answers must cite internal evidence:
- skill,
- plan item,
- user constraint,
- evidence item.

Do not expose chain-of-thought.
