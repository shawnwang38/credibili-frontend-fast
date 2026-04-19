# Stack Research — Can U Deliver

**Domain:** Retail-investor credibility-check web app (frontend, mocked backend)
**Researched:** 2026-04-19
**Overall confidence:** HIGH on framework/core, MEDIUM on library-level tradeoff picks

---

## TL;DR Stack

- **Framework:** Next.js 16.2 (App Router) + React 19.2 + TypeScript 5.7+
- **Styling:** Tailwind CSS v4 (CSS-first config) + shadcn/ui (Tailwind v4 track) + `tw-animate-css`
- **Theming:** `next-themes` + Tailwind v4 `@theme`/`@theme inline` with OKLCH tokens
- **Typography:** Geist Sans (UI + display) + Geist Mono (numeric/stats) via `geist` npm
- **Video:** `react-player` (v3) for YouTube embed — specifically for `onProgress`-driven claim sync
- **Stakeholder graph:** `react-force-graph-2d` (canvas, d3-force under the hood) — NOT React Flow
- **Charts:** Recharts (paired with shadcn/ui `Chart` primitive) for verdict/breakdown; Visx kept as escape hatch
- **State:** TanStack Query v5 (server cache) + Zustand (global UI state) + RSC where possible. No Redux, no Jotai.
- **Streaming:** Vercel AI SDK v5 `useChat` with typed `data-*` UIMessage parts — not raw SSE, not bare `ReadableStream`
- **Mocking:** Next route handlers returning fixtures **as the primary source**, **not** MSW — see tradeoff below
- **Animation:** Motion for React (formerly Framer Motion, now `motion` package) + CSS where trivial
- **Fetching:** `fetch` + zod schemas at the boundary; typed API client generated from zod

---

## Core Technologies

| Technology | Version | Purpose | Why |
|---|---|---|---|
| Next.js | **16.2.x** | App Router, RSC, route handlers, streaming | Stable since Oct 2025; Turbopack default for `dev` + `build`; Cache Components stable; React 19.2 bundled; Vercel-native. Confidence: HIGH |
| React | **19.2.x** (bundled) | UI runtime | `<Activity>` for preserved-state show/hide (useful for depth dashboard tiles), View Transitions for surface-to-surface transitions, Server Components. Confidence: HIGH |
| TypeScript | **5.7+** | Types | Required for `satisfies`, const type parameters used throughout zod schemas. Confidence: HIGH |
| Tailwind CSS | **v4.x** (stable) | Styling | Oxide engine (Rust) 10x faster builds; CSS-first config via `@theme`; OKLCH color space for perceptually uniform muted-warm palette. Confidence: HIGH |
| shadcn/ui | **Tailwind v4 / React 19 track** (use latest CLI: `shadcn@canary` or current stable) | Component primitives | Copy-paste, owned code, full Tailwind v4 compatibility, deprecated `tailwindcss-animate` in favor of `tw-animate-css`. Confidence: HIGH |
| next-themes | **latest 0.4.x+** | Dark/light toggle | Standard pairing with shadcn; `attribute="class"`, `disableTransitionOnChange` recommended. Confidence: HIGH |

---

## Supporting Libraries (Prescriptive Picks)

### YouTube Player → `react-player` v3

| Library | Verdict | Why |
|---|---|---|
| **`react-player` v3** | **USE** | Maintained, lightweight wrapper over the YouTube IFrame API, exposes `onProgress` (interval-driven current time), `onPlay/onPause/onSeek`, `getCurrentTime()`. Perfect fit for claim-sync: subscribe to `onProgress` at ~500ms interval, dispatch claim-card reveals when `playedSeconds` crosses claim timestamps. |
| `@vidstack/react` | Skip | More powerful (storage, analytics, custom UI) but heavier and optimized for owned HLS/DASH streams. For a plain YouTube embed with time-sync, it's overkill and a bigger learning curve. |
| Raw `<iframe>` + YouTube IFrame API | Skip for MVP | Works but forces us to write boilerplate (script loader, ready state, error handling). `react-player` already solves this. |

**Claim-sync pattern:** `react-player` `onProgress` → Zustand `currentTime` atom → claim cards read via selector with `useShallow` to avoid re-render cascade. Use `progressInterval={500}`.

**Confidence:** HIGH on react-player for this shape; MEDIUM vs vidstack (vidstack is better if we later add our own video hosting).

---

### Stakeholder Force-Directed Graph → `react-force-graph-2d`

Critical UX decision. For **20–50 nodes** with **animated reactions** (nodes reacting to simulation events), tradeoffs:

| Library | Verdict | Tradeoffs |
|---|---|---|
| **`react-force-graph-2d`** | **USE** | Canvas-rendered, uses `d3-force-3d` under the hood, supports node dragging with simulation reheat, click/hover handlers, custom `nodeCanvasObject`. Built for exactly this. Handles 50–5000 nodes smoothly. Gives us canvas custom drawing for per-node pulses/auras when stakeholder reacts. ~30KB. |
| `@xyflow/react` (React Flow) | Skip for this surface | React Flow's core model is **DOM-rendered nodes** for editing/workflows. Force-directed is an add-on example (Pro tier for advanced); React-DOM per-node hurts at 50 nodes with per-frame animation. Keep React Flow in mind only if we later need an editable graph. |
| `d3-force` + custom canvas | Skip | We'd be reimplementing 80% of react-force-graph for no gain. Use only if we need a very bespoke physics regime. |
| `vis-network` | Skip | Still maintained but its aesthetic is dated; weaker TS types; escaping its default styles for a muted-warm palette is painful. |
| `cosmos-graph` (@cosmograph) | Skip | WebGL, brilliant at 100k+ nodes, massive overkill at 50; harder to customize per-node visuals. |

**Why canvas over DOM here:** Mirrorfish-style "living" graphs demand per-frame visual updates (pulse rings when a stakeholder "reacts", edge weight animation, color shifts). DOM nodes at 50+ with Framer Motion transitions will jank on mid-range laptops. Canvas trivially runs at 60fps.

**Confidence:** HIGH. This is the clearest pick.

---

### Streaming UI → Vercel AI SDK v5 `useChat` with typed UIMessage parts

| Approach | Verdict | Why |
|---|---|---|
| **AI SDK v5 `useChat` + typed `data-*` parts via `createUIMessageStream`** | **USE** | v5 ships typed `UIMessage` generic with custom data parts. Perfect for our shape: stream `data-progress` (step + substep), `data-claim` (claim cards for Surface 1), `data-verdict` (final score). Automatic client-side reconciliation by ID (progress updates in place). SSE protocol under the hood (debuggable in DevTools Network tab). |
| Plain `fetch` + `ReadableStream` + custom JSON-lines | Skip | We'd reinvent reconciliation, reconnection, typed parts. Only worthwhile if we're allergic to the AI SDK. |
| Raw SSE (`EventSource`) | Skip | `EventSource` doesn't support POST bodies → forces us into GET + query params for the claim payload, which gets ugly fast. AI SDK uses SSE over POST correctly. |

**Pattern:**
```ts
// Typed message for this app
type CUDMessage = UIMessage<
  never, // metadata
  {
    progress: { step: 'past' | 'present' | 'future'; substep: string; pct: number };
    claim: { id: string; text: string; timestamp: number; credibility?: number };
    verdict: { percentage: number; label: string; breakdown: {...} };
  }
>;
```

Server route handler uses `createUIMessageStream` + `writer.write({ type: 'data-progress', id: 'p1', data: {...} })`.

**Confidence:** HIGH. Data parts feature was the headline AI SDK 5 addition in Oct 2025 and is battle-tested.

---

### Mocking Layer → **Next route handlers with fixtures** (NOT MSW)

Critical DX decision. Reasoning:

| Approach | Verdict | Tradeoffs |
|---|---|---|
| **Next route handlers + typed fixtures + zod schemas** | **USE as primary** | Lives at the real API boundary (`/api/*`), uses the real transport (fetch + SSE), same code path in dev and Vercel preview. When backend lands, swap the handler body with a proxy/fetch to the real service — the client never changes. Streaming mocks use the AI SDK `createUIMessageStream` — the **exact** production code path. No separate "mock mode" toggle. |
| MSW | **Skip for runtime; keep for unit tests only** | MSW shines for **test-time** interception. At dev-time in Next 16 App Router, MSW adds two handler sets (browser + node) and gets brittle with streaming responses + RSC fetch caching. For this project the backend literally doesn't exist yet → route handlers *are* our backend stub; there's nothing to mock around. |
| In-memory hooks (fake `useClaim()` returning static data) | Skip | Doesn't exercise streaming, doesn't model the real API contract, hides integration bugs until backend swap. |

**Swap path:** When real backend arrives, route handlers forward to it (`fetch(process.env.BACKEND_URL + '/analyze', { ... })`) and/or we delete the handler and repoint the client `fetch` to the backend URL. Either way, zero client-component change.

**Structure:**
```
/app/api/claims/extract/route.ts       → POST (transcript URL) → claims
/app/api/analysis/depth/route.ts       → POST (claim) → streams progress + modules
/app/api/analysis/live/route.ts        → POST (video URL) → streams claim cards
/lib/api/fixtures/                     → typed JSON fixtures
/lib/api/schemas.ts                    → zod schemas shared by client + handler
/lib/api/client.ts                     → typed client (fetch + AI SDK useChat)
```

**Confidence:** HIGH. This is the idiomatic Next.js pattern and the "swap to real backend" path is trivial.

---

### State Management → **TanStack Query + Zustand + RSC**

| Layer | Pick | Why |
|---|---|---|
| **Server data** (past claims history, financials, etc. — one-shot fetches) | **TanStack Query v5** | Caching, dedupe, retry, suspense integration, invalidation. Crucial for Surface 2's past/present modules that fetch independently. |
| **Streaming/in-flight session state** (current analysis run, claim stream, verdict assembly) | **AI SDK `useChat` state** | Already handled by the streaming layer; don't duplicate in Zustand. |
| **Global UI state** (current video time, active claim, theme-independent UI flags, modal state) | **Zustand 5.x** | Small, fast, works with RSC, easy selectors with `useShallow`. |
| **Derived computed state** (score breakdown math, percentiles) | Plain React/TS or **Zustand selectors** | No need for Jotai; the derivations here are straightforward. |
| **Form state** (URL input on landing, settings) | `react-hook-form` + `zod` | Standard; shadcn `Form` primitive expects this. |

**Why not Jotai:** Our state graph isn't atom-heavy. Jotai's superpower is fine-grained re-renders for deeply computed atoms; we don't have that. Zustand + selectors is simpler.

**Why not Redux Toolkit:** Overkill; no time-travel debugging requirement; RTK Query overlaps with TanStack Query.

**Confidence:** HIGH.

---

### Charting → **Recharts via shadcn `Chart` primitive**

| Library | Verdict | Why |
|---|---|---|
| **Recharts 2.x** (via shadcn/ui `Chart`) | **USE** | shadcn ships a first-class `Chart` component wrapping Recharts with Tailwind-themed tooltips/legends/grids. Reads CSS variables → automatically respects muted-warm palette in dark/light. Declarative API suits our small chart count (score breakdown radar/bar, historical delivery sparkline). |
| Tremor | Skip | Built on Recharts but ships its own design system that fights shadcn's. Redundant. |
| Visx | Keep as escape hatch | If we ever want a custom score-breakdown visualization that Recharts can't express (e.g., radial gauge with fine animation control), Visx's d3 primitives are the move. Don't install upfront. |
| Nivo | Skip | Gorgeous defaults but its theming model isn't CSS-variable-driven → fighting it for muted-warm duality is painful. |

**Confidence:** HIGH for Recharts+shadcn pairing.

---

### Theming → `next-themes` + Tailwind v4 `@theme` with OKLCH

**Setup:**
```css
/* app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";
@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(0.98 0.01 80);    /* warm off-white */
  --foreground: oklch(0.22 0.02 50);    /* warm near-black */
  --primary:    oklch(0.55 0.12 40);    /* muted terracotta */
  --muted:      oklch(0.94 0.01 70);
  --accent:     oklch(0.72 0.08 65);    /* muted amber */
  /* ... */
}
.dark {
  --background: oklch(0.18 0.015 45);
  --foreground: oklch(0.92 0.01 75);
  --primary:    oklch(0.68 0.11 45);
  /* ... */
}
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... */
}
```

Use **OKLCH** (not HSL) — it's perceptually uniform, so "muted warm" stays consistent across lightness levels. shadcn's default v4 theme uses OKLCH.

**Surface-register differentiation:** define two additional theme scopes (e.g., `.surface-quiet` for Surfaces 1 & 4 — higher contrast, more whitespace vars; `.surface-dense` for Surfaces 2 & 3 — tighter spacing tokens). Apply at layout level. Cross-cuts the minimalist/maximalist dual register cleanly.

**Confidence:** HIGH.

---

### Animation → **Motion for React** (new `motion` package, formerly Framer Motion)

| Library | Verdict | Why |
|---|---|---|
| **`motion` (Motion for React)** | **USE** | Renamed from `framer-motion` in mid-2025; React 19 compatible with concurrent rendering. Layout animations, `AnimatePresence`, `useMotionValue` all still there. Best-in-class DX for module transitions (Surface 2 tile swaps), progress step reveals, claim card entry. |
| Motion One (`@motionone/react`) | Partial use | 85% smaller bundle, WAAPI-based, great for simple transitions. If bundle is a concern, use for basic fades/slides. But `motion` gives us layout animations which we'll want for the "modular dashboard" feel. |
| CSS-only | Use for trivia | Use `tw-animate-css` for simple enter/exit on shadcn primitives; save `motion` for orchestrated sequences. |
| GSAP | Skip | Licensing friction, bigger bundle, weaker React integration story. |

**Note:** import path is now `motion/react` (not `framer-motion`).

**Confidence:** HIGH.

---

### Typography → **Geist Sans + Geist Mono**

Recommendation: **Geist Sans** (primary UI + headings) + **Geist Mono** (numerics on the verdict percentage, historical delivery rate stat, timestamps).

| Font | Use | Why |
|---|---|---|
| **Geist Sans** | UI, headings, body, claim text | Vercel's own — zero-friction `next/font` via `geist` npm package. Modern neo-grotesque with slightly warm counters (not as cold as Inter). Variable font, wide weight range. Pairs perfectly with muted-warm palette. Designed for digital UI. Swiss-design lineage reads "serious" to non-finance audience. |
| **Geist Mono** | Percentages (72%), stats, timestamps, claim IDs | Same family = visual cohesion. Tabular figures look solid in the verdict. |
| Inter | Alternative if Geist feels too trendy | Neutral, slightly colder, rock-solid. Fine second choice. |
| IBM Plex Sans | Skip | Excellent font but reads slightly "enterprise" / IBM-branded in context. Pairs awkwardly with muted-warm (designed for cooler neutrals). |
| Satoshi | Skip | Nice display face but proprietary (Fontshare) and weaker at UI sizes than Geist. |

**Setup:**
```ts
// app/layout.tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

// Tailwind v4 in globals.css:
// @theme { --font-sans: var(--font-geist-sans); --font-mono: var(--font-geist-mono); }
```

**Confidence:** MEDIUM-HIGH (subjective but well-justified).

---

## Development Tools

| Tool | Purpose | Notes |
|---|---|---|
| **pnpm** | Package manager | Fast, disk-efficient; works cleanly on Vercel |
| **Biome** or **ESLint 9 + Prettier** | Lint/format | Biome if we want speed + single-tool; ESLint 9 flat config + Prettier if shadcn/third-party configs matter. Recommend Biome for greenfield. |
| **Vitest 2.x** + **@testing-library/react** | Unit + component tests | Works with Next 16; MSW **here** for network mocks in tests |
| **Playwright** | E2E | Test the four-surface flows end-to-end; pair with MSW or the dev fixtures |
| **shadcn CLI (latest)** | Install primitives | `npx shadcn@latest add button card dialog ...` |
| **Turbopack** (built-in) | Dev + build bundler | Stable in Next 16; no config needed |
| **Vercel CLI** | Deploy/preview/env | `vercel link`, `vercel env pull .env.local`, `vercel dev` if route handlers need Vercel-specific runtime |

---

## Installation

```bash
# Core
pnpm create next-app@latest canudeliver --typescript --tailwind --app --src-dir --use-pnpm
# (confirms Next 16 + React 19 + Tailwind v4)

# shadcn (Tailwind v4 track)
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card dialog sheet tabs tooltip skeleton progress badge chart form input label separator toggle

# Theming + fonts
pnpm add next-themes geist

# State + data
pnpm add zustand @tanstack/react-query zod react-hook-form @hookform/resolvers

# Streaming AI
pnpm add ai @ai-sdk/react
# (AI SDK v5; @ai-sdk/react provides useChat)

# Video
pnpm add react-player

# Graph
pnpm add react-force-graph-2d d3-force

# Animation
pnpm add motion

# Charting
# (Recharts comes with `shadcn add chart`)

# Dev
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
pnpm add -D msw @playwright/test
pnpm add -D @biomejs/biome
# or: pnpm add -D eslint prettier eslint-config-next

# Tailwind v4 animate plugin (shadcn v4 default)
pnpm add tw-animate-css
```

---

## Vercel-Specific Leverage

| Feature | Use For | Notes |
|---|---|---|
| **Vercel Functions (default Node runtime)** | Route handlers streaming AI SDK responses | Keep default Node runtime; Edge runtime unnecessary for our I/O pattern and loses access to some Node APIs |
| **Vercel AI Gateway** | When real backend arrives & we proxy to an LLM | Zero-config model routing, observability, rate limiting. Stub now, wire later. |
| **Vercel Blob** | Storing transcripts/audio if we ingest raw YouTube audio (post-MVP) | Not needed for frontend-only MVP |
| **Cache Components (Next 16)** | Static verdict-overview demo page, example depth dashboard | `"use cache"` directive; defer until real backend to avoid caching stale fixtures |
| **View Transitions (React 19.2)** | Surface 3 → Surface 2/4 handoff | Wrap route transitions; pair with `motion` for finer control |
| **Deployment Protection** | Preview deploys for stakeholder review | On by default; use `vercel curl` to access protected previews from agents/scripts |

---

## Alternatives Considered (Summary)

| Recommended | Alternative | When Alternative Wins |
|---|---|---|
| react-player | @vidstack/react | Later, if we host our own video |
| react-force-graph-2d | @xyflow/react | Later, if the graph becomes editable (add/remove nodes via UI) |
| AI SDK v5 useChat | bare `ReadableStream` + SSE | If we want zero AI-SDK dependency (not our situation) |
| Next route handlers w/ fixtures | MSW runtime | For Storybook-driven component dev or heavy E2E suites |
| TanStack Query + Zustand | Jotai | If state evolves into deeply-derived atom graphs (unlikely for this app) |
| Recharts + shadcn | Visx | A bespoke score-breakdown viz Recharts can't express |
| Motion for React | Motion One | Aggressive bundle budget |
| Geist Sans | Inter | Team preference for colder neutral |
| Tailwind v4 | Tailwind v3 | Never — v3 is legacy for new projects |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|---|---|---|
| `framer-motion` package | Renamed to `motion` mid-2025; old package is deprecated | `motion` (import from `motion/react`) |
| `tailwindcss-animate` | Deprecated in shadcn v4 track | `tw-animate-css` |
| `tailwind.config.ts` file | Removed in Tailwind v4's CSS-first model | `@theme` in `globals.css` |
| Redux / Redux Toolkit | Boilerplate-heavy, overlaps with TanStack Query | Zustand + TanStack Query |
| `EventSource` for SSE | No POST body support → awkward for payloads | AI SDK v5 streaming (SSE over POST) |
| `pages/` router | Legacy in Next 16 | App Router exclusively |
| MSW at runtime in dev | Double maintenance vs route handlers; fragile w/ streaming | Route handlers + fixtures (keep MSW for tests) |
| `react-youtube` | Thin, less maintained, no onProgress abstraction | `react-player` |
| HSL color tokens | Non-uniform lightness hurts muted-warm palette | OKLCH |
| `pages/api` for new routes | Legacy | `app/api/.../route.ts` |

---

## Stack Patterns by Variant

**If we later add authentication:**
- Add NextAuth.js v5 (Auth.js) or Clerk
- Middleware in `middleware.ts` (v16 rename to `proxy.ts` if upgrading post-migration)

**If backend never materializes / we pivot to demo-only:**
- Keep everything; route handlers + fixtures are already the "demo" path

**If we need to handle 500+ stakeholder nodes:**
- Swap `react-force-graph-2d` → `cosmos-graph` (WebGL) or `react-force-graph-vr`/`3d` for WebGL variants

**If mobile becomes priority:**
- Re-evaluate animations (prefer Motion One), re-evaluate canvas graph (add touch gesture lib)

---

## Version Compatibility Notes

| Package A | Compatible With | Notes |
|---|---|---|
| `next@16.2` | `react@19.2`, `react-dom@19.2` | Bundled; do not pin older React |
| `tailwindcss@4` | `shadcn@latest` (v4 track) | MUST use shadcn's v4-compatible components; init command auto-detects |
| `shadcn@latest` Tailwind v4 | `tw-animate-css` (not `tailwindcss-animate`) | Auto-installed by init |
| `ai@5.x` | `@ai-sdk/react@2.x` | Peer relationship; keep aligned |
| `motion` | `react@19` | Yes; concurrent-safe since v11+ |
| `react-player@3.x` | `react@19` | Yes; v3 dropped legacy APIs |
| `react-force-graph-2d@1.48+` | `react@19` | Yes; uses refs cleanly |
| `@tanstack/react-query@5.x` | `react@19` | Native; Suspense mode integrates with RSC streaming |
| `next-themes@0.4+` | Next 16 App Router | Works; set `attribute="class"` and wrap in client boundary |

---

## Confidence Summary

| Area | Confidence | Notes |
|---|---|---|
| Next.js / React / TS / Tailwind / shadcn versions | HIGH | Verified via Next.js blog (16.0 Oct 2025, 16.2 Mar 2026), shadcn docs |
| Graph library (react-force-graph-2d) | HIGH | Best fit for canvas-rendered animated 20–50 node network |
| Streaming (AI SDK v5) | HIGH | Data parts are purpose-built for this use case |
| Mocking (route handlers > MSW) | HIGH for this project; DIFFERS from generic advice | Reason: no real backend exists yet → route handlers *are* the stub |
| State (TanStack Query + Zustand) | HIGH | Standard 2026 pattern |
| Charts (Recharts via shadcn) | HIGH | Native shadcn integration is the deciding factor |
| Theming (OKLCH + next-themes) | HIGH | Matches shadcn v4 defaults |
| Animation (Motion for React) | HIGH | Rename handled; React 19 compatible |
| Typography (Geist) | MEDIUM-HIGH | Subjective but well-justified against muted-warm palette |
| Video (react-player v3) | MEDIUM-HIGH | Solid pick; vidstack is viable alternative |

---

## Sources

- [Next.js 16 release blog](https://nextjs.org/blog/next-16) — HIGH
- [Next.js 16.2 release notes](https://medium.com/@onix_react/release-next-js-16-2-377798369d25) — MEDIUM
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — HIGH
- [shadcn/ui Next.js dark mode](https://ui.shadcn.com/docs/dark-mode/next) — HIGH
- [Tailwind v4 release](https://trybuildpilot.com/488-tailwind-css-v4-review-2026) — MEDIUM
- [Vercel AI SDK 5](https://vercel.com/blog/ai-sdk-5) — HIGH
- [AI SDK UI: Streaming Custom Data](https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data) — HIGH
- [AI SDK UI: Stream Protocols](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) — HIGH
- [react-force-graph GitHub](https://github.com/vasturiano/react-force-graph) — HIGH
- [React Flow force layout](https://reactflow.dev/examples/layout/force-layout) — HIGH
- [Motion for React docs](https://motion.dev/docs/react) — HIGH
- [Motion rename announcement](https://motion.dev/magazine/should-i-use-framer-motion-or-motion-one) — HIGH
- [Geist font package](https://www.npmjs.com/package/geist) — HIGH
- [Vercel Geist font page](https://vercel.com/font) — HIGH
- [MSW + Next.js setup guide](https://gimbap.dev/blog/setting-msw-in-next) — MEDIUM
- [TanStack Query / Zustand comparisons (2026)](https://inhaq.com/blog/react-state-management-2026-redux-vs-zustand-vs-jotai.html) — MEDIUM
- [React charting libraries 2026](https://querio.ai/articles/top-react-chart-libraries-data-visualization) — MEDIUM
- [Next.js Route Handlers docs](https://nextjs.org/docs/app/getting-started/route-handlers) — HIGH
- [AI SDK 5 + Next.js 16 (Avolve)](https://avolve.io/software/vercel-ai-sdk) — MEDIUM

---

*Stack research for: retail-investor credibility-check frontend (Can U Deliver)*
*Researched: 2026-04-19*
