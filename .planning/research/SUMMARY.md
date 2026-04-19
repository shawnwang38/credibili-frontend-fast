# Project Research Summary — Can U Deliver

**Domain:** Retail-investor credibility-check web app (Next.js frontend + mocked streaming backend)
**Researched:** 2026-04-19
**Confidence:** HIGH on stack, architecture, pitfalls; MEDIUM-HIGH on feature conventions.

> **Reconciliation with PROJECT.md.** The four research files (STACK, FEATURES, ARCHITECTURE, PITFALLS) were written against an earlier design direction. The user refined PROJECT.md on 2026-04-19. **Where research conflicts with PROJECT.md, PROJECT.md wins.** Overrides are called out inline and consolidated in the "Reconciliation" section.

---

## Executive Summary

Can U Deliver is a frontend-first retail-investor tool that ingests a single URL (YouTube earnings call or article) from a Chrome extension, extracts one or more "claims," and returns a single credibility verdict with visible reasoning. Category-wise it sits at the intersection of live-transcript claim extraction (Otter/Fathom), AI research with narrated progress (Perplexity Pro Search), credibility scorecards (NewsGuard/Ground News), and stakeholder simulation (Mirrorfish). The technical substrate — Next.js App Router + TypeScript + Tailwind v4 + shadcn/ui — is mature, Vercel-native, and well-supported; nearly every library choice has a clear 2026 leader.

The recommended approach is **"trustworthy restraint at the verdict, transparent density in the analysis"** — the opposite of the investor dashboards retail users mistrust. Four surfaces, three routes (Live, Depth, Overview) unified by a top-bar stepper. Depth is *not* a free dashboard: it is a guided four-step linear swipe flow (A Background → B Past+Present split → C Future graph → D Overview hand-off), with persistent left/right arrow back-nav. Streaming from a mocked Next route-handler backend uses Vercel AI SDK v5 typed `UIMessage` data parts; the client never distinguishes mock from real. The Bloomberg-terminal register (sharp edges, mono/mono-flavored typography, 3–4 type sizes total, muted warm palette, no whole-page scroll) is load-bearing and must be encoded in design tokens before any feature work.

Key risks are reputational-via-UI: fake-precision scores ("72.34%"), authority bias, implied financial advice (regulatory), force-graph collapse past 40 nodes, lying progress UIs, and fixture-shaped components. Mitigations are well-known (whole-percent rounding, persistent disclaimer + methodology link, canvas graph with frozen layout, real substep streaming via SSE, Zod at API boundary, error/empty/partial fixtures from day one).

---

## Key Findings

### Recommended Stack

Next.js 16.2 App Router + React 19.2 + TypeScript 5.7 + Tailwind v4 (CSS-first `@theme`) + shadcn/ui on the v4 track. Streaming via Vercel AI SDK v5 with typed `UIMessage` data parts over SSE-on-POST; mocks live as Next route handlers returning fixtures through the same code path production will use. State is stratified: URL for shareable state, TanStack Query v5 for server cache, Zustand for ephemeral UI, `useChat` state for in-flight streams. Zod schemas at the API boundary are the single source of truth.

**Core technologies:**
- **Next.js 16.2 App Router** — RSC shells + client islands, route handlers as mock backend, streaming — Vercel-native
- **Tailwind v4 + shadcn/ui (v4 track) + `tw-animate-css`** — CSS-first theming with OKLCH tokens, owned component code
- **Vercel AI SDK v5 (`useChat` + typed data parts)** — streaming progress, claim cards, verdict assembly — production code path even when mocked
- **Next route handlers + fixtures + Zod** — mock backend that swaps to real via env flag, not MSW at runtime
- **`react-player` v3** — YouTube embed with `onProgress` for claim-timestamp sync
- **`react-force-graph-2d`** — canvas-rendered force-directed graph for Step C stakeholder network (NOT React Flow: DOM-per-node janks at 40+ nodes with per-frame animation)
- **TanStack Query v5 + Zustand 5 + URL params** — server cache / ephemeral UI / shareable state
- **Motion for React (`motion` package)** — swipe transitions between Depth steps, claim-card enter/exit
- **Recharts via shadcn `Chart` primitive** — small, restrained charts for score breakdown / historical tiles
- **Typography — Bloomberg-terminal register (PROJECT.md override):** IBM Plex Mono + IBM Plex Sans, JetBrains Mono + Inter, or Berkeley Mono if licensed. **STACK.md's Geist recommendation is superseded.** Final pick Phase 1 typography spike.

### Expected Features

**Must have (table stakes):**
- Embedded YouTube player with click-to-jump timestamps; **2-line transcript window (current + previous line only)** per PROJECT.md
- Side rail of claim cards showing a **short summarized claim** (not raw quote); verbatim quote + credibility check revealed on expand
- Speaker attribution on each claim card
- Streaming per-card state: Extracting → Checking past → Scored — muted, non-flashing visuals
- Top-bar stepper (`Live → Depth → Overview` for video, `Depth → Overview` for article) on every route
- Past-delivery table (Claim → Date → Outcome → Evidence link), CEO history split from company history
- Citations: inline `[1][2]` markers with a sourced pane per Depth step
- Methodology link on every verdict-adjacent surface
- Credibility verdict: plain-English claim restatement + whole-number percentage + verdict label + 4-axis nutrition-label breakdown + historical-delivery headline stat
- Last-analyzed timestamp on Overview
- Dark + light mode across all surfaces
- Desktop-first, viewport-contained (no whole-page scroll); must not break on mobile

**Should have (differentiators):**
- Inline past-claim comparison on each new Live claim card — signature "aha" moment
- Narrated substep streaming in Depth steps (real text like "Matched 14/18 past claims")
- Force-directed stakeholder graph with per-node persona tooltips in Step C
- Quiet credibility signal per Live card (thin warm-toned left border)
- "Based on N signals" confidence qualifier next to the score
- Deterministic layout + frozen positions on the stakeholder graph
- Cancellable analysis runs with AbortController

**Defer (v2+):** auth / saved-verdict history / portfolio tracking; animated stakeholder-reaction replay; PDF/CSV export; mobile-optimized layout; share-link affordance.

**Explicit anti-features:** live stock ticker; user-draggable tile layouts; radar/gauge visualizations; red/green flashing indicators; AI chat on Depth; 20+ financial-ratio tiles; share-to-Twitter; sentiment word clouds; credibility-trend line charts.

### Architecture Approach

Next.js App Router with RSC page shells + client islands for interactive surfaces. Zod schemas in `lib/api/schemas.ts` are the cross-cutting contract; adapter pattern (`FixtureAdapter` | `HttpAdapter`) selected via env var lets real backend drop in with zero component changes. Streaming is **one mechanism everywhere** — Vercel AI SDK v5 typed `UIMessage` data parts over SSE-on-POST — consumed identically by Live claim rail and Depth substep streams.

**Major components (reconciled with PROJECT.md):**

1. **Route shell & global top-bar stepper** — `StepperBar` in root layout; reads route + entry type (video vs article); "Generate Overview?" confirmation on Live → Overview transition
2. **Typed API client + adapter + Zod schemas** (`src/lib/api/*`)
3. **Mock backend route handlers** with `?mock=success|empty|partial|slow|error` query-param variants from day one
4. **Live Earnings-Call surface** — `react-player` + 2-line transcript window + claim rail + per-card expand with verbatim quote + "Run depth" action; viewport-contained; internal scroll only in the claim rail
5. **Depth linear stepwise flow** — `/depth/[claimId]` **single route, stepped state via `?step=A|B|C|D`, NOT parallel slots** — persistent left/right arrow affordances, keyboard arrow-key nav, Motion horizontal transitions; substep telemetry streams into each step
6. **Stakeholder force-graph module** (Step C) — `react-force-graph-2d` canvas, dynamic-imported `ssr: false`, frozen-layout, deterministic seed, table fallback for a11y
7. **Overview / Verdict surface** — mostly RSC; headline + whole-number percentage + 4-axis breakdown + historical-delivery stat + methodology link; viewport-contained
8. **Design tokens** — single OKLCH muted-warm palette, one dark + one light theme, **no "calm/rich" register split**. Sharp edges (`--radius: 0`), constrained type scale (3–4 sizes), Bloomberg-terminal typography
9. **Streaming hook** — one typed `useRunStream` (or AI SDK `useChat` wrapper) consumed by both Live claim rail and Depth step panels

### Critical Pitfalls

1. **Fake-precision scores** — never show `72.34%`. Round to whole percentages at the view-model layer. Pair every number with a verdict band label. Bands primary, number secondary.
2. **Authority bias + implied financial advice (regulatory)** — persistent non-dismissible disclaimer on every verdict/depth surface. Methodology link always visible. Score claims, never people. Copy audit bans "buy," "invest," "profit," "opportunity." Legal-review gate pre-launch. Flag in Phase 0.
3. **Fixture-shaped components** — foundation phase ships error/empty/partial/slow/timeout variants per endpoint. Typed `Result<T, E>`. Storybook stories for each variant.
4. **Force-graph melt + determinism** — cap visible nodes at 30–40; canvas rendering; freeze positions after initial settle; deterministic seed; table fallback; `prefers-reduced-motion` disables simulation.
5. **YouTube timestamp drift + live-sync** — `rAF`-gated 4Hz polling paused on `visibilitychange`; `±2s` activation window; handle `onError` codes 2/5/100/101/150; muted autoplay + `playsinline`; `youtube-nocookie.com`.
6. **Progress UIs that lie** — named substeps driven by real SSE, never client-simulated. Elapsed time after 5s. Cancel after 3s that actually aborts. No backward-moving or stalling percentages.
7. **Visual-language bleed** — single palette; density + type-scale alone differentiate "analysis" (dense/tabular) from "insight" (spacious) panels. Lint rule bans raw hex/rgb. Visual regression on dark + light.

---

## Implications for Roadmap

### Phase 0 — Legal/Compliance Framing (lightweight, parallel)
Flag regulatory exposure before any score UI. Delivers: disclaimer copy spec, banned-verb list, "score claims not people" rule, legal-review gate scheduled pre-launch. Avoids Pitfall 2.

### Phase 1 — Foundation (design system + API contract + mock backend + streaming primitive)
Nothing ships without this. Design tokens, typed API client, Zod schemas, fixture variants, streaming hook must land before any surface.

Delivers:
- Next 16 + React 19 + Tailwind v4 + shadcn v4; `tw-animate-css`
- OKLCH muted-warm palette; sharp-edge override (`--radius: 0`); constrained 3–4-size type scale; **typography spike** picks from {IBM Plex, JetBrains Mono + Inter, Berkeley Mono}
- `next-themes` dark/light; viewport-contained root (`h-dvh overflow-hidden`) enforcing "no whole-page scroll"
- Global `StepperBar` with video/article entry-type detection and "Generate Overview?" confirmation
- Zod schemas for Claim, DepthRun, Verdict, Stakeholder, SubstepEvent
- `lib/api/*` adapter + fixture adapter; AI SDK v5 streaming hook
- Route handlers: `/api/claims/[videoId]`, `/api/depth/[claimId]`, `/api/verdict/[claimId]`, streaming `/api/runs/[runId]/stream` — each with `?mock=` variants
- TanStack Query provider + Zustand root store + ESLint rule banning hex/rgb

Avoids Pitfalls 1, 3, 7.

### Phase 2 — Overview / Verdict Surface
Simplest surface, pure RSC. Validates full schema → fixture → RSC → UI pipeline end-to-end. Ships polished components Live card expansions reuse.

Delivers: `/overview/[claimId]` with plain-English claim, whole-number percentage, verdict band label, 4-axis breakdown (Transparency / Accuracy / Consistency / Industry state), historical-delivery headline, last-analyzed timestamp, methodology link, persistent disclaimer.

Avoids Pitfalls 1, 2.

### Phase 3 — Streaming Primitive (`useRunStream` hook + mock SSE scripts)
Prove the streaming mechanism in isolation before Live. Reused in Live per-card state and Depth per-step telemetry.

Delivers: typed data parts (`data-progress`, `data-claim`, `data-verdict`); realistic mock substep strings; cancel/abort; elapsed-time UI; reconnection after `visibilitychange`; per-step failure-and-retry.

Avoids Pitfall 6.

### Phase 4 — Live Earnings-Call Surface
Reuses streaming hook from Phase 3 and verdict components from Phase 2. Introduces YouTube integration.

Delivers: `react-player` embed with visibility-gated 4Hz polling, muted-autoplay + `playsinline`, `onError` handling, `youtube-nocookie.com`; 2-line rolling transcript; claim rail (internal scroll) with summarized claims; expand reveals verbatim quote + live credibility check + inline past-claim comparison; per-card state machine; speaker-attribution chip; "Run depth analysis" → `/depth/[claimId]?step=A`; top-bar stepper active on "Live".

Avoids Pitfall 5.

### Phase 5 — Depth Chassis (Steps A, B, D)
Swipe-flow chassis and non-graph steps first. Step C is isolated risk.

Delivers:
- `/depth/[claimId]` single page; `?step=A|B|C|D` URL state; persistent left/right arrow affordances; keyboard arrow-key nav; Motion horizontal transitions; back/forward to any prior step
- **Step A:** Company background / context research (full-screen)
- **Step B:** 50/50 split — Left = Past module (claim-vs-delivery table, CEO vs company split, citations); Right = Present module (financials + industry signals tiles, 2–3 numbers with one-line explainers, 3–5 peer comparison)
- **Step D:** "Generate Overview" hand-off → `/overview/[claimId]`
- Substep telemetry streams into each active step via Phase 3 hook
- Top-bar stepper active on "Depth"; panels viewport-contained

### Phase 6 — Depth Step C: Stakeholder Force-Directed Graph
Highest complexity + signature value. Ship last, isolated, against 30–50 node fixture with persona data.

Delivers: `react-force-graph-2d` canvas, dynamic-imported `ssr: false`; deterministic seed; frozen positions after settle; quadtree-optimized forces; per-node persona tooltip + side-panel detail on click; edge weight as opacity/thickness; aggregate-node collapse past 30–40; `prefers-reduced-motion` skips simulation; **table fallback** for a11y; v1 static final-state (animated replay deferred).

Avoids Pitfall 4.

### Phase 7 — Integration, Polish, Pre-Launch Gate
Cross-surface review, dark/light audit, a11y pass, bundle-size audit, mobile non-break pass, legal-review gate.

Delivers: CI bundle-size budget (<250KB per-route first-load); Chromatic/Percy visual regression on dark + light; axe-core clean; VoiceOver/NVDA smoke on Live + Overview; legal-review sign-off on disclaimer copy; error/empty/partial Storybook coverage verified; swap-to-real-backend path documented.

### Phase Ordering Rationale

- Foundation before surfaces — tokens, contract, streaming, or every surface gets rewritten
- Overview before Live — pure RSC proves the pipeline; components reused in Live card expansions
- Streaming before Live — Live depends on the hook
- Depth chassis (A/B/D) before Step C — graph is biggest isolated risk; do not let it block scaffolding
- Legal/compliance flagged in Phase 0 — cheaper than retrofit

### Research Flags

Needs research during planning:
- **Phase 1:** typography spike; Tailwind v4 `@theme` + shadcn v4 + `next-themes` FOUC-free toggle
- **Phase 3:** AI SDK v5 `createUIMessageStream` + typed `UIMessage` against current v5 docs; Vercel Node-runtime SSE keepalive behind CDN
- **Phase 4:** iOS Safari autoplay + background throttle; `react-player` v3 `onProgress` + cleanup; embed-disabled error codes
- **Phase 6:** `react-force-graph-2d` custom node drawing; deterministic seeding; table-fallback a11y convention

Standard patterns (skip research): Phase 0, 2, 5, 7.

---

## Reconciliation with PROJECT.md (2026-04-19)

| Research said | PROJECT.md says (ground truth) | Impact |
|---|---|---|
| Depth = parallel-slot modular dashboard (`@past`/`@present`/`@future`) | Depth = **linear stepwise swipe flow** (A full → B 50/50 → C full graph → D hand-off), left/right arrow back-nav | Single `/depth/[claimId]` with `?step=` URL state + Motion transitions. No parallel slots. |
| Separate `/progress/[runId]` route + intercepting modal over `/watch` | **No separate progress route** — progress is intrinsic to Depth steps | Drop `/progress` route and interceptor. Keep streaming hook + per-step telemetry. Inline per-card progress in Live remains. |
| Two route groups `(minimalist)`/`(maximalist)` with dual "calm/rich" token sets | **One unified Bloomberg-terminal register.** Sharp edges, constrained type scale, single muted-warm palette. Density + type-scale alone differentiate panels | Single palette + type scale with density variant (spacing tokens only). Still lint-enforced. |
| Geist Sans + Geist Mono | **Bloomberg-terminal mono or mono-flavored sans** — IBM Plex / JetBrains + Inter / Berkeley Mono. Final pick Phase 1 | Typography spike in Phase 1. |
| Whole-page scroll permitted | **No whole-page scroll anywhere** — every route viewport-contained; scroll only inside individual panels | Root layout enforces `h-dvh overflow-hidden`. |
| Top-bar chrome not explicit | **Global top-bar stepper**: `Live → Depth → Overview` (video) or `Depth → Overview` (article, Live disabled). "Generate Overview?" confirmation on Live → Overview | `StepperBar` in root layout, Phase 1. |
| Full live transcript pane | **Transcript = current + previous line only** | Simpler component; claim cards are primary live surface. |
| Claim cards show raw extracted quote | Claim cards show **short summarized claim**; verbatim quote in expanded view | Add `summary` field to Claim schema alongside `verbatim`. |

Authoritative from research, unchanged:
- Entire STACK.md except typography
- Entire PITFALLS.md
- FEATURES.md table-stakes/differentiators/anti-features (only Depth layout shape changed)
- ARCHITECTURE.md typed-client + adapter + Zod + streaming-hook + URL-first state model

---

## Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| Stack | HIGH | 2026 library choices verified; typography now constrained by PROJECT.md |
| Features | MEDIUM-HIGH | Table-stakes solid; stakeholder-sim genre less standardized |
| Architecture | HIGH | App Router patterns well-documented; single-route `?step=` simplification is idiomatic |
| Pitfalls | HIGH | Technical pitfalls verified; legal framing flagged for counsel |

**Overall:** HIGH — ready for roadmapping.

### Gaps to Address in Requirements / Planning

- **Final typography pick** — Phase 1 spike; optimize for tabular-figure numeric clarity
- **Verdict label vocabulary** — recommend 4 bands: "Likely to deliver" / "Mixed signals" / "Unlikely to deliver" / "Insufficient history." Confirm Phase 2
- **Score-to-band thresholds** — cannot ship bands without these. Phase 2
- **Stakeholder persona data shape** — node type, affiliation, stance, influence weight, edge type. Lock Phase 1 fixtures before Phase 6 build
- **Substep message catalog** — plausible substep strings per stage as part of Phase 1 fixture design
- **Methodology page content** — stub in Phase 1; blank link erodes trust
- **Swipe transition spec** — horizontal slide vs crossfade-and-slide; finalize Phase 5
- **Legal-review gate date** — schedule pre-launch; Phase 7 assumes sign-off is blocking

## Suggested Phase Count

8 phases total (Phase 0 compliance + Phases 1–7 build/polish).

## Ready for Requirements

Research synthesized and reconciled with PROJECT.md. Roadmapper can proceed.
