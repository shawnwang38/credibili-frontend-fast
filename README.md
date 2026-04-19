# Can U Deliver

A retail-investor web app that scores whether a company will actually deliver
on claims made in earnings calls and press articles. Bloomberg-terminal register,
mocked streaming end-to-end.

## Quickstart

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 — you'll be redirected to `/live`.

## Routes

- `/live` — Live Mode. YouTube earnings call + streaming claim list + credibility score.
- `/depth` — Depth Mode. 2x2 WIP analysis grid (Background / Past / Present / Future) → Overview with verdict.

## Architecture notes

- **No real backend.** Streaming is mocked via Next route handlers at `/api/live-stream`
  and `/api/depth-stream`, both using AI SDK v6 `createUIMessageStream` with typed
  `data-claim` / `data-feed-line` / `data-score` parts. The client (`useChat<AppUIMessage>`
  + `DefaultChatTransport`) is the production code path — when a real backend lands,
  swap the route handler bodies for an LLM call without touching components.
- **State.** Zustand for global UI (selected claim, panel completion, depth view,
  final score). `useChat` owns streaming state.
- **Stack.** Next 16.2 App Router + React 19.2 + Tailwind v4 (CSS-first @theme,
  OKLCH muted-warm palette) + shadcn/ui + JetBrains Mono.
- **Constraints honored.** Sharp edges everywhere (`--radius: 0` + global
  `border-radius: 0 !important` override). No whole-page scroll —
  `html, body { overflow: hidden }`; scroll lives only inside panels.
- **Hardcoded MVP values.** `DEFAULT_VIDEO_ID = "dQw4w9WgXcQ"` (placeholder),
  `DEFAULT_COMPANY = Acme Robotics (ACME)`, `DEFAULT_CLAIM` is the Q4 2026 margin claim.

## What to swap when the real backend lands

1. Replace `app/api/live-stream/route.ts` `for (const claim of fixtureClaims)`
   loop with the LLM/transcript-extractor stream.
2. Replace `app/api/depth-stream/route.ts` per-panel fixture loops with real
   data-source + analyzer pipelines, still emitting `data-feed-line` parts so
   the client UI is unchanged.
3. Replace fixture imports in `lib/fixtures.ts` with real fetchers (or delete
   the file entirely once components no longer touch it).
