# Design System — Exact Implementation Direction

## Visual target

Use `assets/skillstate-reference-ui.png` as the visual reference.

The target is a combination of:
- the polished structure and sidebar from the first selected concept;
- the calm branching journey from the second selected concept.

The interface should feel like:
**Linear + an editorial learning product + a subtle illustrated map.**

It must not feel like:
- Duolingo,
- an RPG,
- a fantasy map,
- generic purple SaaS,
- Coursera,
- a corporate BI dashboard.

## Fonts

Use `next/font/google`.

- UI font: **Inter**
- Display serif: **Newsreader**

Use Newsreader only for:
- hero headlines,
- occasional short editorial quote.

Everything else is Inter.

## Color tokens

```css
--ink: #121832;
--ink-muted: #5E6785;
--canvas: #FBFBFD;
--surface: #FFFFFF;
--surface-soft: #F7F8FC;
--border: #E8EAF1;

--accent: #5B4CF0;
--accent-soft: #EFEDFF;

--green: #1FA978;
--green-soft: #EAF8F2;

--blue: #3A82F7;
--blue-soft: #ECF3FF;

--orange: #E98A32;
--orange-soft: #FFF4E8;

--red: #E35C68;
--red-soft: #FFF0F2;
```

Do not introduce new brand colors.

## Radius

- small controls: 10px
- cards: 16px
- pills: 999px

No huge rounded “bubble” aesthetic.

## Shadow

Cards:
```css
box-shadow: 0 1px 2px rgba(18,24,50,.04), 0 8px 28px rgba(18,24,50,.035);
```

No glow.

## Desktop shell

- sidebar width: 208px
- top search bar area height: 64px
- main max width: 1400px
- main horizontal padding: 24px
- content gap: 12px–16px
- hero min-height: 390px

## Sidebar

Order:
1. Home
2. My Journey
3. Skills
4. Assess & Prove
5. Projects
6. Experience
7. Career Paths
8. Resources
9. separator
10. Settings
11. Help

Bottom decorative area:
- subtle scenic crop / abstract hills
- one short line: **More paths. A brighter you.**
- do not use a character/avatar illustration.

## Hero journey background

Create a calm layered SVG background:
- distant pale blue-gray hills,
- closer desaturated green hills,
- subtle warm sun disk,
- no photorealism,
- no fantasy buildings,
- no people,
- opacity must remain low enough that text has high contrast.

The path itself is the dominant interactive visual.

## Hero journey path

Stages:
- Today
- Foundations
- Explore
- Decision Point
- branches to destination cards

Path line:
- 5px
- muted green for shared path
- dashed colored branches after the decision point

Stage nodes:
- 44px circular nodes
- 3px white inner ring
- pale green outer background
- one Lucide icon

Career cards:
- 236px × 58px approximate
- no shadows heavier than base card shadow
- border + pale background based on branch color
- icon, title, one-line descriptor, chevron

## Home lower grid

Three primary cards only:
- **Now**
- **Why this?**
- **Keeps open**

Then one compact information strip:
- Skills & Progress
- Today's Plan
- Recent Activity

Do not add more cards to home.

## Motion

Use CSS transitions only.

- 180–260ms
- ease-out
- branch path fades/slides when goal changes
- cards crossfade
- no bouncing
- no confetti
- no animated counters

Respect reduced motion.

## Mobile

- sidebar becomes a simple 5-item bottom nav:
  Home, Journey, Skills, Prove, More
- hero path becomes vertical:
  Today → Foundations → Explore → Decision Point → branches
- lower three cards stack
- no horizontal page overflow

## Copy tone

Clear, supportive, mature.

Good:
- “You don't need to choose now.”
- “This foundation keeps six paths open.”
- “You already know more than your plan assumed.”

Bad:
- “Level up!”
- “Crush your goals!”
- “Become unstoppable!”
- “Your epic career quest begins!”
