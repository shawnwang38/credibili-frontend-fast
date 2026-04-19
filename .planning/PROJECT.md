# Can U Deliver

## What This Is

A retail-investor web app that scores whether a company will actually deliver on claims made in earnings calls and press articles. Users arrive via a Chrome extension (assumed working) that redirects from a YouTube video or article URL; the app extracts the claim, analyzes past delivery, current signals, and future stakeholder dynamics, and returns a clear credibility verdict. Built for non-technical, non-finance retail investors who want a serious-looking tool that doesn't drown them in dashboards.

## Core Value

Give ordinary investors a credible, non-overwhelming verdict — *can this company deliver this claim?* — backed by visible reasoning they can trust.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

**Global chrome — Top bar stepper**
- [ ] Every route renders a top-bar stepper that anchors the user in the flow
- [ ] Video entry: `Live → Depth → Overview` (3 stages, all reachable)
- [ ] Article entry: `Depth → Overview` (2 stages; "Live" stage is hidden or rendered disabled)
- [ ] Tapping "Overview" from Live ends live tracking and asks "Generate Overview?" (confirmation), then proceeds

**Surface 1 — Live Earnings Call Checker (minimalist)**
- [ ] Large embedded YouTube player as the focal point
- [ ] No whole-page scroll — page is fixed to viewport; individual panels scroll internally (e.g., claims rail scrolls, transcript does not)
- [ ] Transcript panel shows ONLY the current line + the previous line (2-line window)
- [ ] Side rail of "key claim" cards — each card shows a *short summarized claim* (not the raw quote)
- [ ] Each claim card expands in place (or a side panel) to reveal the full verbatim quote + live credibility check
- [ ] "Run depth analysis" action on any claim → launches Surface 2 for that claim
- [ ] Sharp edges throughout; calm, dense, terminal-like

**Surface 2 — Depth Analysis (guided stepwise flow, not a free dashboard)**
Entry: from article URL (one claim surfaced) OR from a video claim (list of claims to pick from). User selects a claim and clicks **Analyze**. The experience is a left-to-right swipe sequence:

- [ ] **Step A — Company background (full-screen):** renders company profile / context research first, full width
- [ ] **Step B — Past + Present (split screen, 50/50):** swipes in from the right as Step A swipes left. Left half = past claim analysis (5-year delivery history, company + CEO). Right half = current research on financials + industry signals
- [ ] **Step C — Future AI network (full-screen):** swipes in as B swipes left. Force-directed graph of stakeholder agents (competitors, partners, execs, regulators) simulating reactions to the claim
- [ ] **Back/forward navigation:** persistent arrow buttons on the left and right edges of the screen let the user swipe back to any prior step
- [ ] **Step D — Generate Overview:** after Future completes, user is prompted to generate the overview (transition to Surface 4)
- [ ] Formatting simple and clean — Bloomberg-terminal register, not "maximalist dashboard clutter"

**Surface 3 — Progress UI**
- [ ] Inline progress inside Live claim cards (short form, streaming states, sharp borders, terse labels)
- [ ] Step-by-step progress is intrinsic to the Depth flow itself (Steps A → B → C act as the progress surface — no separate progress screen required). Granular substep telemetry streams into each step panel (e.g., "scraping 2022 Q3 call", "matched 14/18 past claims")

**Surface 4 — Verdict Overview (minimalist)**
- [ ] Shown after user confirms "Generate Overview?" (from Live → Overview transition OR after Depth completes)
- [ ] Headline: core claim in plain English
- [ ] Credibility: **percentage + verdict label** (e.g., "72 — Likely to deliver")
- [ ] Score breakdown: Transparency / Accuracy / Consistency / Industry state (each as its own tile with score)
- [ ] Historical delivery rate (headline stat)
- [ ] Deliberately under-stated — no 20 dashboards, no vibe-coded metrics
- [ ] Sharp edges, Bloomberg-terminal type register

**Cross-cutting design**
- [ ] **No whole-page scroll anywhere** — every route is contained to the viewport on desktop. Scroll is permitted only inside individual modules/panels (claims rail, transcript window, tables). Applies to Live, Depth, and Overview.
- [ ] **Sharp edges everywhere** — zero border-radius on cards, panels, buttons, inputs (override shadcn defaults)
- [ ] **Constrained type scale** — minimize font-size variety; Bloomberg-terminal discipline (roughly 3-4 sizes total across entire app: body, label/caps, number/heading, micro)
- [ ] **Bloomberg-terminal-inspired typeface** — a clean technical mono or mono-flavored sans (e.g., IBM Plex Mono + IBM Plex Sans pair, or JetBrains Mono + Inter, or Berkeley Mono if licensed). Final pick in Phase 1.
- [ ] Dark mode and light mode
- [ ] Muted warm color palette (contrasts with Bloomberg's orange-on-black; we go warm-muted, not saturated)
- [ ] Clear visual language differentiating **analysis/progress panels** (dense, tabular, numeric) from **high-level insight panels** (spacious, restrained) — via density and color scope, not type-size escalation
- [ ] Panel-based composition (Bloomberg-terminal feel): fixed viewport, panels tile, panels scroll internally

**Technical foundation**
- [ ] Next.js App Router + TypeScript + Tailwind + shadcn/ui
- [ ] Typed API client hitting mocked endpoints (Next route handlers or MSW), swap to real backend later
- [ ] Streaming-capable UI patterns (progress, claim cards, score breakdown)
- [ ] Deployable on Vercel

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Chrome extension build — user says "assume it works"; web app is the scope
- Real AI/backend analysis pipeline — frontend consumes a mocked API layer; real backend is a downstream integration
- Authentication / user accounts — not mentioned; verdict flow is per-URL, assume anonymous for v1
- Portfolio tracking / saved verdicts history — out of scope until after MVP validates demand
- Mobile-first layouts — desktop-first given the dashboard density; must not break on mobile but not optimized
- Financial advice language / disclaimers — will need legal review later, stub-only for MVP

## Context

- **Audience:** non-technical, non-finance retail investors. They want something that *looks serious* but doesn't assume finance literacy.
- **UX thesis:** users distrust "vibe-coded index metrics" and 20-dashboard overloads. Clarity and restraint beat information density for the final verdict. Analysis surfaces can be dense *because they're opt-in* (depth view).
- **Two contrasting UX registers:** the live earnings-call view and verdict page are *quiet*; the depth dashboard and progress screen are *rich*. The system's visual language must make this duality intentional, not accidental.
- **Mirrorfish reference:** user pointed to Mirrorfish as the mental model for the future-simulation module — an AI agent network where each node is a stakeholder with a persona informed by past behavior. Force-directed graph was the chosen visual.
- **Credibility score:** user wants a hard-coded math component (not a pure AI score) with a visible breakdown — Transparency / Accuracy / Consistency / Industry state. Breakdown is a first-class UI element, not a hidden detail.
- **Data assumed available from backend (mocked for now):** extracted claim text, historical claim-vs-delivery pairs (company + CEO), current financials, competitor context, industry trend signals, stakeholder persona graph, agent simulation outcomes.
- **Directory name:** `canudeliver` — product name "Can U Deliver" / "Can U Deliver?".

## Constraints

- **Tech stack**: Next.js App Router + TypeScript + Tailwind + shadcn/ui — chosen for speed + Vercel-native deploy + design-system flexibility.
- **Backend integration**: mocked API layer (typed client, fixtures via route handlers or MSW) — real backend does not yet exist / is separate track. All data shapes must be defined as if a real API will swap in.
- **Design register**: Bloomberg-terminal-inspired — dense, panel-based, sharp-edged, restrained type scale (3–4 sizes max). Dual register is about *density* (Live/Overview spacious, Depth panels dense) rather than visual style contrast; the visual style is unified terminal-modern.
- **No whole-page scroll**: every route is viewport-contained. Scroll is inside modules only. Non-negotiable cross-cutting layout constraint.
- **Theming**: dark + light mode, muted warm palette, Bloomberg-terminal-inspired typeface (mono or mono-flavored sans — final pick Phase 1). Sharp edges (zero border-radius).
- **Audience literacy**: copy and data visualization must be readable by non-finance retail investors. No jargon without explanation.
- **Platform**: desktop-first; must not break on mobile but optimization is deferred.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Scope: MVP for real users (not demo) | User wants production-grade frontend, not a throwaway clickable prototype | — Pending |
| Backend: mock API layer (typed client + fixtures) | Real backend is separate track; typed layer lets us swap in later without rewriting UI | — Pending |
| Stack: Next.js + Tailwind + shadcn | Speed, Vercel-native, design-system flexibility, user confirmed | — Pending |
| Progress UX: inline in Live cards + intrinsic to Depth stepwise flow | Depth steps A→B→C ARE the progress surface — no separate progress route needed | — Pending |
| Credibility score format: percentage + verdict + 4-part breakdown (Transparency / Accuracy / Consistency / Industry state) | Non-technical readers understand %, verdict label frames it, 4-part breakdown surfaces transparency | — Pending |
| Stakeholder network viz: force-directed graph | User chose — feels alive, matches Mirrorfish reference; canvas-based (react-force-graph-2d) per research | — Pending |
| Four surfaces: Live / Depth / Overview + global top-bar stepper | Stepper is `Live → Depth → Overview` from video, `Depth → Overview` from article (Live disabled) | — Pending |
| Depth is a linear stepwise swipe flow (A: background → B: past+present split → C: future graph → D: overview) | User rejected a free-layout dashboard in favor of a guided left-to-right journey with back-arrow nav | — Pending |
| No whole-page scroll — viewport-contained layouts everywhere | Bloomberg-terminal feel; scroll lives inside individual modules | — Pending |
| Sharp edges (zero border-radius), constrained type scale, Bloomberg-terminal typography | Explicit user direction 2026-04-19 — overrides default shadcn radii and default sans-serif register | — Pending |
| Live transcript shows only current + last line (2-line rolling window) | Reduces noise, keeps focus on claim cards | — Pending |
| Live claim cards show short summarized claim; verbatim quote in expanded view | Keeps the rail scannable | — Pending |
| Overview transition from Live requires "Generate Overview?" confirmation | Ends live tracking — user must opt in | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-19 after initialization + design-direction refinement (Bloomberg-terminal register, stepper chrome, swipe-through depth flow, no-page-scroll, sharp edges)*
