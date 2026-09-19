# Demo Data

The app must ship with deterministic demo personas.

## Persona A — Exploring Class 12

```json
{
  "name": "Siddhant",
  "stage": "school",
  "stageDetail": "Class 12",
  "weeklyHours": 7,
  "targetTimelineMonths": 24,
  "learningPreference": "balanced",
  "destinationCertainty": "general",
  "statedField": "Technology",
  "interests": ["building things", "AI", "data", "problem solving"]
}
```

Career branches displayed on home:
- AI Engineer
- Data Engineer
- Backend Engineer
- Cybersecurity Analyst

Additional paths in Careers:
- UX Designer
- Product Manager

Shared foundation:
- programming fundamentals,
- problem solving,
- data fundamentals,
- communication,
- projects.

Home actions:
1. Learn Python fundamentals
2. Try a mini project
3. Explore 2 career paths

Why:
“Python supports 7 of 8 possible paths and unlocks future projects.”

## Persona B — 3rd Year, Exact AI Engineer

```json
{
  "name": "Aarav",
  "stage": "college",
  "stageDetail": "3rd Year Undergraduate",
  "fieldOfStudy": "Computer Science",
  "weeklyHours": 10,
  "targetTimelineMonths": 20,
  "learningPreference": "projects-first",
  "destinationCertainty": "exact",
  "statedDestination": "AI Engineer",
  "interests": ["machine learning", "building products"]
}
```

Claims:
- Python: strong
- SQL: working
- Statistics: strong
- Linear Algebra: basic
- Machine Learning: working
- Deployment: none

Evidence:
- resume claims Python/ML
- one Python data project
- ML certificate
- no deployment project
- SQL only mentioned on resume

Expected detected state:
- Python → Verified
- SQL → Needs proof
- Statistics → Developing
- Linear Algebra → Gap
- Machine Learning → Needs proof
- Deployment → Gap

Initial verification queue:
1. SQL scenario
2. ML model-evaluation scenario
3. statistics short check

Gap priorities:
1. Linear Algebra — High
2. Model Evaluation — High
3. Deployment — Medium
4. SQL proof — Medium

Personalized next actions:
1. Linear algebra repair module
2. ML evaluation proof task
3. small deployable ML API project

## Persona C — Non-engineering proof

Role: **Financial Analyst**

Stage: Graduate

Expected capability families:
- accounting fundamentals
- spreadsheet analysis
- financial statements
- financial modeling
- business analysis
- data visualization
- communication
- proof through models/case analyses
- internship / real analysis experience

This persona exists to demonstrate that the core is career-agnostic.

## Career seed catalog

For Browse Careers only:

Technology:
- AI Engineer
- Data Engineer
- Backend Engineer
- Cybersecurity Analyst

Design:
- UX Designer

Business:
- Product Manager
- Management Consultant

Finance:
- Financial Analyst
- Accountant

Marketing:
- Digital Marketer
- Content Strategist

Research:
- Research Analyst
