# Architecture Research

**Domain:** Next.js App Router frontend for streaming analysis product with dual-register UX (minimalist + maximalist) and mocked backend.
**Researched:** 2026-04-19
**Confidence:** HIGH (Next.js conventions, App Router patterns, fixture/MSW abstraction are well-established and directly applicable)

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js App Router (src/app)               │
│                                                                 │
│  /watch/[videoId]     /depth/[claimId]    /verdict/[claimId]    │
│  (minimalist, RSC     (maximalist RSC     (minimalist RSC       │
│   shell + client      shell + heavy       shell, mostly         │
│   player + rail)      client modules)     static)               │
│                                                                 │
│  /progress/[runId]         @modal slots, (.)intercepting for    │
│  (maximalist,              "Run depth" → progress overlay on    │
│   SSE-driven)              /watch without losing player state   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────┴─────────────────────────────────┐
│                    Typed API Client Layer (src/lib/api)         │
│                                                                 │
│   getClaims(videoId)     getDepth(claimId)     getVerdict(id)   │
│   streamRun(runId) ──── (SSE / ReadableStream)                  │
│                                                                 │
│   Backed by an adapter: FixtureAdapter | HttpAdapter            │
│   Zod schemas define contract → shared types on both sides      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────┴─────────────────────────────────┐
│         Mock Backend (src/app/api/*/route.ts + fixtures)        │
│                                                                 │
│   /api/claims/[videoId]   /api/depth/[claimId]                  │
│   /api/verdict/[claimId]  /api/runs/[runId]/stream (SSE)        │
│                                                                 │
│   Fixtures (src/fixtures/*.ts) + scripted timers simulate       │
│   streaming progress. Swappable with real backend via env flag. │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Route segments (`app/*`) | URL → page shell, metadata, layout composition | Server Components with async `params` |
| Surface shells | Compose server-fetched data + client-interactive children | Server Component that renders Client Component children |
| Interactive widgets | YouTube player, force-directed graph, streaming card list | Client Components behind `"use client"` leaf islands |
| API client (`lib/api`) | Single typed entry point for all data access | Thin functions returning Zod-parsed DTOs |
| Adapter layer | Swap fixtures vs real HTTP without touching callers | Strategy pattern selected via `process.env.DATA_SOURCE` |
| Route handlers (`app/api/*`) | Mock backend surface — returns fixtures, simulates SSE | Next.js Route Handlers, Node runtime |
| Fixture scripts | Time-based "scripts" that emit progress events | Async generators or setInterval-driven ReadableStream |
| Server state | Cached reads (past history, verdict, depth snapshot) | React Query (TanStack Query) in client, RSC fetch in server |
| Client state | Ephemeral UI (selected claim, open module, player time) | Zustand for cross-component; URL params for shareable state |
| Design tokens | Dual-register theme | Tailwind CSS variables + mode class on route-group layout |

## Recommended Project Structure

```
src/
├── app/
│   ├── (minimalist)/                  # Route group: quiet register
│   │   ├── layout.tsx                 # Sets data-register="calm", loads calm tokens
│   │   ├── watch/
│   │   │   └── [videoId]/
│   │   │       ├── page.tsx           # RSC: fetch initial claims, render shell
│   │   │       ├── loading.tsx
│   │   │       ├── error.tsx
│   │   │       └── @modal/            # Parallel slot for intercepted "run depth"
│   │   │           ├── default.tsx
│   │   │           └── (.)progress/[runId]/page.tsx   # Intercepted progress overlay
│   │   └── verdict/
│   │       └── [claimId]/
│   │           └── page.tsx           # RSC: static-ish verdict
│   ├── (maximalist)/                  # Route group: rich register
│   │   ├── layout.tsx                 # Sets data-register="rich"
│   │   ├── depth/
│   │   │   └── [claimId]/
│   │   │       ├── page.tsx           # RSC shell, parallel module slots
│   │   │       ├── @past/page.tsx
│   │   │       ├── @present/page.tsx
│   │   │       └── @future/page.tsx   # Client-heavy (force graph)
│   │   └── progress/
│   │       └── [runId]/
│   │           └── page.tsx           # Full-screen run viewer, SSE client
│   ├── api/
│   │   ├── claims/[videoId]/route.ts
│   │   ├── depth/[claimId]/route.ts
│   │   ├── verdict/[claimId]/route.ts
│   │   └── runs/
│   │       ├── start/route.ts         # POST → returns runId
│   │       └── [runId]/
│   │           └── stream/route.ts    # GET SSE
│   ├── layout.tsx                     # Root: fonts, theme provider, query client
│   └── globals.css                    # Tailwind base + CSS variables
├── components/
│   ├── ui/                            # shadcn primitives
│   ├── surfaces/
│   │   ├── watch/
│   │   │   ├── YoutubePlayer.tsx      # "use client"
│   │   │   ├── ClaimRail.tsx          # "use client" (subscribes to SSE)
│   │   │   └── ClaimCard.tsx
│   │   ├── depth/
│   │   │   ├── ModuleShell.tsx        # compound component root
│   │   │   ├── PastModule.tsx
│   │   │   ├── PresentModule.tsx
│   │   │   └── FutureModule.tsx       # react-flow graph, "use client"
│   │   ├── verdict/
│   │   │   ├── VerdictHeadline.tsx
│   │   │   └── ScoreBreakdown.tsx
│   │   └── progress/
│   │       ├── RunPipeline.tsx        # 3-step visual
│   │       └── SubstepStream.tsx      # "use client", consumes SSE
│   └── shared/
├── lib/
│   ├── api/
│   │   ├── index.ts                   # Public typed client
│   │   ├── schemas.ts                 # Zod schemas → single source of truth
│   │   ├── types.ts                   # z.infer types re-exported
│   │   ├── adapters/
│   │   │   ├── fixture.ts             # Reads src/fixtures
│   │   │   └── http.ts                # Real fetch() against API
│   │   └── sse.ts                     # EventSource helper + typed parser
│   ├── query/
│   │   └── client.ts                  # React Query client + keys
│   ├── state/
│   │   └── watch-store.ts             # Zustand: selectedClaimId, playerTime
│   └── design/
│       └── tokens.ts                  # Token references (consumed by Tailwind)
├── fixtures/
│   ├── claims.ts
│   ├── depth.ts
│   ├── verdicts.ts
│   └── run-scripts.ts                 # Time-scripted substep sequences
└── styles/
    └── tokens.css                     # CSS variables for both registers
```

### Structure Rationale

- **`(minimalist)` vs `(maximalist)` route groups**: Route groups let the two visual registers have separate root layouts (distinct `<body>` class, token set, font weight defaults) without affecting URL shape. This is the idiomatic App Router way to encode cross-cutting visual states.
- **`@past` / `@present` / `@future` parallel slots** on `/depth/[claimId]`: Makes modules genuinely swappable/composable. Each slot has its own `loading.tsx` so modules stream in independently (Past may be fast, Future simulation is slow).
- **`@modal` slot with `(.)progress` intercepting route** on `/watch`: Clicking "Run depth analysis" pushes to `/progress/[runId]` which renders as an overlay while the YouTube player keeps mounted in the background. Direct nav to `/progress/[runId]` shows the full-page version.
- **`app/api/*` mock handlers**: Living in the same repo as the frontend means fixtures are type-checked against the same Zod schemas the client consumes. No MSW required for local dev since route handlers work identically on Vercel previews.
- **`lib/api` as single-entry client**: Every data read goes through one function set. Swapping adapters happens in one file.

## Architectural Patterns

### Pattern 1: Typed API Client with Adapter Swap

**What:** Single `lib/api/index.ts` exposes functions like `getClaims(videoId)`. Internally it delegates to `FixtureAdapter` or `HttpAdapter` based on `process.env.DATA_SOURCE`. Zod schemas in `schemas.ts` are the contract; both adapters must satisfy them.
**When to use:** Whenever the backend will land later — which is exactly this project.
**Trade-offs:** Adds one indirection. Pays off the moment backend lands (zero UI rewrites).

```typescript
// lib/api/schemas.ts
export const ClaimSchema = z.object({
  id: z.string(),
  text: z.string(),
  timestamp: z.number(),
  status: z.enum(['pending', 'analyzing', 'scored']),
  score: z.number().nullable(),
});
export type Claim = z.infer<typeof ClaimSchema>;

// lib/api/index.ts
const adapter = process.env.DATA_SOURCE === 'http' ? httpAdapter : fixtureAdapter;
export const getClaims = (videoId: string): Promise<Claim[]> =>
  adapter.getClaims(videoId).then((r) => z.array(ClaimSchema).parse(r));
```

### Pattern 2: SSE for Streaming, One Mechanism Everywhere

**What:** Both the live-claim rail (Surface 1) and the progress pipeline (Surface 3) consume `GET /api/runs/[runId]/stream` (text/event-stream). Events are typed (`{type: 'claim_added' | 'substep' | 'score_updated' | 'done', payload: ...}`). Client uses a small `useRunStream(runId)` hook built on `EventSource`.
**When to use:** When you want simple, unidirectional server→client push with automatic reconnect. Avoids WebSocket overhead; works on Vercel (Node runtime, not Edge, so streams don't time out aggressively for dev).
**Trade-offs:** Connection-per-run (fine for this scale). On Vercel Serverless, long-running SSE needs Node runtime + duration config; for the mock layer, timers in-process are fine.

```typescript
// app/api/runs/[runId]/stream/route.ts
export const runtime = 'nodejs';
export async function GET(_: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const stream = new ReadableStream({
    async start(controller) {
      for await (const evt of scriptedRun(runId)) {
        controller.enqueue(`data: ${JSON.stringify(evt)}\n\n`);
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
```

### Pattern 3: Compound Modules for Depth Dashboard

**What:** Each dashboard module is a self-contained component group that accepts a `claimId` and owns its own data fetching. `ModuleShell` provides the tile chrome (header, resize handle placeholder, skeleton). Modules are composed in `app/(maximalist)/depth/[claimId]/page.tsx` — or individually in parallel slots so they can stream independently.
**When to use:** When modules must be swappable/reorderable later (the PROJECT doc hints at dnd resizable tiles).
**Trade-offs:** Slightly more boilerplate than inline JSX. Big win when adding/removing modules.

```tsx
// components/surfaces/depth/ModuleShell.tsx
export function ModuleShell({ title, children, density = 'rich' }: Props) {
  return (
    <section data-density={density} className="module-tile">
      <header className="module-header">{title}</header>
      <div className="module-body">{children}</div>
    </section>
  );
}
// usage
<ModuleShell title="Past delivery"><PastModule claimId={id} /></ModuleShell>
```

### Pattern 4: Dual-Register via CSS Variable Namespaces

**What:** Tailwind is configured with semantic tokens (`bg-surface`, `text-primary`, `border-subtle`) that resolve to CSS variables. Variables are defined twice: once per `data-register="calm"` and once per `data-register="rich"`, both supporting `.dark` and `:root` (light). Route-group layouts set the `data-register` attribute on `<body>`. shadcn components automatically inherit since they already use `bg-background`/`text-foreground` tokens.
**When to use:** When two distinct visual systems must coexist in one app without forking components.
**Trade-offs:** Double the token definitions; one-time cost. Component code stays single-source.

```css
/* styles/tokens.css */
:root { /* light + calm default */
  --bg-surface: 36 24% 97%;
  --text-primary: 30 15% 12%;
  --density: 1.5rem;
}
[data-register="rich"] {
  --bg-surface: 36 18% 94%;
  --density: 0.75rem;
}
.dark { --bg-surface: 30 8% 10%; --text-primary: 36 20% 92%; }
.dark[data-register="rich"] { --bg-surface: 30 6% 8%; }
```

```ts
// tailwind.config.ts
theme: { extend: { colors: { surface: 'hsl(var(--bg-surface) / <alpha-value>)' } } }
```

### Pattern 5: URL as Primary State, Zustand for Ephemeral

**What:**
- URL owns: `videoId`, `claimId`, `runId`, currently-open module (via `?module=future`). Shareable, back-button-safe.
- Zustand owns: player currentTime (updates many times/sec), selected-for-preview claim, module layout (collapsed/expanded).
- React Query owns: server cache (claims, depth data, verdict). Keys mirror API routes: `['claims', videoId]`, `['depth', claimId]`.

**When to use:** Default pattern for App Router apps — URL-first is idiomatic and plays well with RSC.
**Trade-offs:** Requires discipline about what belongs where. Clear rule: "if refresh should preserve it, URL; if it's per-session UI, Zustand; if it comes from API, React Query."

### Pattern 6: Server Shell + Client Island

**What:** Every route `page.tsx` is a Server Component that does initial data fetches and renders a Client Component island where interactivity lives. RSC hydrates the island with initial data via props (avoids waterfall).
**When to use:** Default for App Router. Especially important for `/watch` (player is client, shell is server) and `/depth` (modules are mostly client due to graph, but initial data is server-fetched).
**Trade-offs:** Boundary discipline — don't leak non-serializable props across.

```tsx
// app/(minimalist)/watch/[videoId]/page.tsx  (Server)
export default async function Page({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const initialClaims = await getClaims(videoId);
  return <WatchSurface videoId={videoId} initialClaims={initialClaims} />;
}
// components/surfaces/watch/WatchSurface.tsx
'use client';
export function WatchSurface({ videoId, initialClaims }) { /* player + rail */ }
```

## Server vs Client Component Split

| Surface | Server | Client | Why |
|---------|--------|--------|-----|
| `/watch/[videoId]` | Page shell, initial claim list fetch, metadata | `YoutubePlayer` (YT iframe API needs DOM), `ClaimRail` (subscribes to SSE), `ClaimCard` (local animation state) | Player and streaming are inherently client; shell benefits from server-side data preload for first paint. |
| `/depth/[claimId]` | Page shell, parallel `@past`/`@present`/`@future` slots each do server fetch for their own data | `FutureModule` (react-flow graph), any dnd/resize chrome, interactive charts | Past/Present are mostly static data display — server-render for fast first paint. Future is heavy interactive graph. |
| `/verdict/[claimId]` | Entire page | Only a small "share" button client island | Verdict is a read-only snapshot — perfect RSC use case. |
| `/progress/[runId]` | Page shell, pipeline skeleton | `SubstepStream` (SSE consumer) | The streaming nature forces a client island for the live substeps; the structural pipeline visual is server-rendered. |

## Data Flow

### Request Flow (Static Data: depth modules, verdict)

```
User navigates to /depth/[claimId]
    ↓
RSC page → getDepth(claimId) → api client → FixtureAdapter → fixtures/depth.ts
    ↓                                                      (or HttpAdapter → /api/depth/[claimId] → real backend)
Zod parse
    ↓
Props passed to Client island
    ↓
React Query hydrated with initial data (no refetch on mount)
```

### Streaming Flow (Claim rail + Progress substeps)

```
User opens /watch/[videoId]
    ↓
Client mounts ClaimRail → EventSource('/api/runs/[videoId]/stream')
    ↓
Route handler opens ReadableStream, iterates scripted timeline
    ↓  (every N seconds)
'claim_added' event → Zustand/React Query updates → card appears
'score_updated' event → card transitions from "analyzing" to "scored"
'done' event → stream closes
```

### "Run Depth Analysis" Flow (intercepted route)

```
User clicks "Run depth" on a ClaimCard
    ↓
POST /api/runs/start { claimId } → returns { runId }
    ↓
router.push(`/progress/${runId}`)
    ↓
Next.js interceptor matches (.)progress/[runId] under /watch
    ↓
Modal slot renders overlay; /watch layout stays mounted (player preserved)
    ↓
Overlay consumes SSE; on 'done' → router.replace(`/depth/${claimId}`) or /verdict
```

### State Management

```
                ┌─ URL params (videoId, claimId, runId, ?module=)
                │
Components ─────┼─ React Query (server cache: claims, depth, verdict)
                │
                └─ Zustand (player time, selected claim, UI layout)
```

## Fixture → Real Backend Migration Path

1. **Schemas as contract** — `lib/api/schemas.ts` (Zod) is the single source of truth. Real backend team gets these schemas; if they deviate, Zod parse fails loudly.
2. **Adapter swap** — flip `DATA_SOURCE=http` and set `API_BASE_URL`. Zero changes in components or pages.
3. **Route handlers become proxy or go away** — option A: delete `app/api/*` and point `HttpAdapter` at real backend. Option B: keep handlers as thin BFF proxies (useful for auth injection later).
4. **SSE stream swap** — `HttpAdapter.streamRun(runId)` points at real backend SSE. Event schema is the same (defined in `schemas.ts`), so `SubstepStream` and `ClaimRail` keep working.
5. **Fixtures retained for tests** — `src/fixtures/` stays as Storybook/Playwright fixture source.

**What prevents rewrites:**
- No component imports `fetch('/api/...')` directly — only through `lib/api`.
- No component imports from `fixtures/` — only adapters do.
- All DTO shapes flow from Zod schemas; component props typed from `z.infer`.

## Build Order (Dependency Chain)

Build from shared infrastructure outward, then surfaces in order of "what unlocks the next one."

1. **Foundation (blocks everything)**
   - Tailwind + shadcn init, dual-register token system, theme provider, font setup.
   - `lib/api` skeleton: schemas, adapter interface, fixture adapter stub.
   - React Query provider, Zustand store skeleton.

2. **Mock backend stubs**
   - Route handlers for `/api/claims`, `/api/depth`, `/api/verdict` returning static fixtures.
   - SSE endpoint for `/api/runs/[runId]/stream` with scripted generator.

3. **Surface 4 — Verdict (simplest, pure RSC)**
   - Validates the schema → fixture → RSC → UI pipeline end to end with minimal interactivity.
   - Ships a polished minimalist component set (headline, score breakdown, percentage) that verdict copies reuse elsewhere.

4. **Surface 3 — Progress (introduces SSE)**
   - Build the full-page `/progress/[runId]` first (not intercepted).
   - Proves the SSE mechanism. `SubstepStream` component becomes reusable in Surface 1.

5. **Surface 1 — Watch (reuses SSE + verdict components for claim cards)**
   - YouTube embed integration, ClaimRail subscribing to SSE, ClaimCard with inline progress (reuses Surface 3 streaming hook).
   - Then wire the intercepting route `@modal/(.)progress/[runId]` for overlay mode.

6. **Surface 2 — Depth (heaviest, last)**
   - Parallel-slot scaffolding for `@past`/`@present`/`@future`.
   - Past and Present modules first (data-heavy but not interactive).
   - Future module (force-directed graph via `react-flow` or `d3-force` + custom SVG) last — highest risk, highest complexity.

7. **Polish passes**
   - Navigation transitions between surfaces (progress done → depth or verdict).
   - Dark/light mode verification across both registers.
   - Mobile non-breakage audit.

## Scaling Considerations

This is a frontend against a mocked backend; "scaling" here is mostly about handling more simultaneous streams and more modules.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| MVP / demo | Everything local; fixtures in memory; single SSE per user; Vercel default Node runtime. |
| Real backend, 1k users | Swap adapter to HTTP; consider `unstable_cache` or `'use cache'` for depth/verdict RSC reads; move SSE to backend. |
| 10k+ users | BFF route handlers if auth/session needed; edge for static RSC pages; keep SSE on Node runtime backend. |

### Scaling Priorities

1. **First bottleneck:** React Query cache invalidation strategy when real backend returns stale data — settle on a key convention early.
2. **Second bottleneck:** Force-directed graph performance at high stakeholder counts — plan for Canvas/WebGL fallback if SVG chokes past ~200 nodes.

## Anti-Patterns

### Anti-Pattern 1: Fetching inside Client Components on mount

**What people do:** `useEffect(() => fetch('/api/claims')...)` in `WatchSurface`.
**Why it's wrong:** Creates a loading waterfall after hydration; defeats RSC's first-paint win.
**Do this instead:** Fetch in the Server Component `page.tsx`, pass as `initialData` to React Query on the client.

### Anti-Pattern 2: Leaking fixtures into components

**What people do:** `import { claimsFixture } from '@/fixtures/claims'` inside a component for "just a quick demo."
**Why it's wrong:** When backend lands, every such import becomes a rewrite. Defeats the adapter abstraction.
**Do this instead:** Always go through `lib/api`. If you need a deterministic demo, add a `DATA_SOURCE=fixture` env mode.

### Anti-Pattern 3: One monolithic Zustand store

**What people do:** Global store with everything (server data, UI state, URL shadows).
**Why it's wrong:** Re-render storms, hard to reason about, duplicates React Query.
**Do this instead:** Zustand ONLY for ephemeral cross-component UI state. Server data → React Query. Shareable state → URL.

### Anti-Pattern 4: SSR-ing the YouTube player or graph

**What people do:** Trying to render the iframe or react-flow server-side.
**Why it's wrong:** Both need `window`; causes hydration mismatches.
**Do this instead:** Wrap in `"use client"` component; optionally `dynamic(() => import(...), { ssr: false })` for graph to reduce bundle pressure.

### Anti-Pattern 5: Mixing register tokens mid-component

**What people do:** Hardcode `bg-warm-100` inside a shared component "just for this one surface."
**Why it's wrong:** Breaks the dual-register system; component no longer works in the other register.
**Do this instead:** Use semantic tokens only (`bg-surface`). Let the route-group layout decide what `surface` means.

### Anti-Pattern 6: Polling when SSE fits

**What people do:** `setInterval(() => refetchClaims(), 2000)` for live updates.
**Why it's wrong:** Wasteful; loses event ordering; ugly on reconnect.
**Do this instead:** SSE for live streams; React Query `refetchOnWindowFocus` for non-live data.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| YouTube IFrame API | `"use client"` component loads `https://www.youtube.com/iframe_api`; use `onStateChange` to feed playerTime into Zustand | Must be client-only. Do not SSR. |
| Real backend (future) | HttpAdapter `fetch(API_BASE_URL + path)` with Zod parse | Define `API_BASE_URL` in `.env`; use `vercel env pull` for parity. |
| react-flow (or d3-force) | Dynamic-imported client component, mounted in `@future` slot | Consider `ssr: false` to cut server bundle. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| RSC page ↔ Client island | Serializable props (typed via Zod inferred types) | No functions, no class instances. |
| Client components ↔ API | `lib/api` functions returning Promises + `lib/api/sse` for streams | One chokepoint, easy to instrument. |
| Adapter ↔ Data source | Strict interface in `lib/api/adapters/types.ts` | Both fixture + http satisfy identical signature. |
| Route handlers ↔ Fixtures | Direct import in dev | Handlers are the ONLY code allowed to import fixtures directly besides adapters. |

## Key Design Decisions Summary

- **Route groups** `(minimalist)` / `(maximalist)` encode the dual register at the layout level — not per-component.
- **Parallel slots** (`@past` / `@present` / `@future`) make depth modules independently streamable and future-swappable.
- **Intercepting route** `(.)progress/[runId]` keeps the YouTube player alive while progress overlays.
- **SSE** for both streaming surfaces — one typed event schema, one consumer hook.
- **Zod schemas** are the cross-cutting contract; fixture vs real backend is one env var.
- **URL-first state**, React Query for server cache, Zustand for ephemeral UI.
- **Build order: Verdict → Progress → Watch → Depth** — each surface unlocks infrastructure the next needs.

## Sources

- Next.js App Router documentation: route groups, parallel routes, intercepting routes, streaming with Suspense (official Next.js docs, confirmed current as of Next 15/16).
- Next.js Route Handlers + streaming ReadableStream (official docs).
- TanStack Query + RSC hydration pattern (official TanStack Query v5 docs).
- Zod + API contract pattern (widely adopted Next.js community pattern).
- shadcn/ui + CSS variable theming conventions (official shadcn docs).
- Confidence: HIGH — all patterns are current, documented, and directly applicable. Force-graph library choice (react-flow vs d3-force vs vis-network) is MEDIUM confidence and should be validated during Surface 2 build.

---
*Architecture research for: Next.js App Router frontend with dual-register UX, mocked streaming backend, modular dashboard*
*Researched: 2026-04-19*
