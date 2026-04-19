# Pitfalls Research

**Domain:** Retail-investor credibility-scoring web app (Next.js frontend, live video sync, force-directed graph, mocked backend)
**Researched:** 2026-04-19
**Confidence:** HIGH for technical pitfalls (Next.js, YouTube IFrame API, react-flow/d3, shadcn/Tailwind v4 — verified patterns). MEDIUM for legal/compliance framing (general fintech UX guidance, not formal legal advice). HIGH for retail-investor UX pitfalls (well-documented in SEC Office of Investor Education materials, fintech post-mortems).

---

## Critical Pitfalls

### Pitfall 1: Fake-precision scores (the "72.34%" problem)

**What goes wrong:**
A credibility score displayed as `72.34%` or `71.8%` implies a precision the underlying math does not have. Users treat two decimals as scientific truth; the model is actually four heuristics added together. The second someone gets a score of 69.9% and another of 70.1% with identical verdicts, the trust evaporates.

**Why it happens:**
Raw math returns floats. Developers `.toFixed(2)` to "look professional." Designers think more digits = more credible. Nobody asks "what does the 0.34 mean?"

**How to avoid:**
- Round to whole percentages (`72%`), or use 5-point buckets (`70%`).
- Pair every numeric score with a verdict band label (`Likely to deliver`, `Mixed signals`, `Unlikely`).
- Treat score bands (e.g., 0–40 / 40–70 / 70–100) as the primary UX element; the number is secondary.
- Never show sub-percent precision. Never animate a counter ticking through decimals.

**Warning signs:**
- Any `.toFixed(1)` or `.toFixed(2)` on a user-facing score.
- Designer comps with "73.4%" in them.
- Two scores one point apart have different verdict bands (the boundary is a lie).

**Phase to address:** Design-system phase (score component) + Verdict Surface (Surface 4) phase.

---

### Pitfall 2: Authority bias from slick UI (the Theranos effect)

**What goes wrong:**
A beautifully designed dashboard looks authoritative regardless of data quality. Retail investors anchor on "this looks like Bloomberg, it must be right" and make trades based on a mocked fixture. In a product that explicitly analyzes *credibility*, the irony of the product itself overpromising is fatal.

**Why it happens:**
Design team optimizes for "feels premium." No one treats restraint as a feature. Confidence indicators (error bars, data freshness, source count) are seen as clutter.

**How to avoid:**
- Always show *what the score is based on* alongside the score: # of past claims analyzed, date of most recent data, sample-size caveats.
- Visible "methodology" link on every verdict screen, not buried in a footer.
- Use tentative language in verdict labels: "Likely to deliver" not "Will deliver." "Mixed signals" not "Cannot deliver."
- Include a "low-confidence" visual state when sample size is small (e.g., CEO has only 2 past claims to match against) — grey out, add a "limited history" badge.

**Warning signs:**
- No way to get from a verdict back to "where did this number come from?"
- Copy uses absolute verbs ("will", "cannot", "confirms").
- Same UI treatment for a verdict based on 40 data points as one based on 3.

**Phase to address:** Verdict Surface (Surface 4) + cross-cutting content/copy review before any marketing-adjacent polish.

---

### Pitfall 3: Implied financial advice (regulatory surface-area)

**What goes wrong:**
A credibility score on an investable claim ("Tesla will deliver 2M vehicles in 2026: 78% — Likely to deliver") is functionally indistinguishable from investment recommendation UX. In the US, this can trigger SEC/FINRA scrutiny under the Investment Advisers Act. In the EU/UK, MiFID II and FCA COBS rules apply. Defamation exposure exists if a *named CEO's* personal claims are scored low.

**Why it happens:**
Founders think "we're just showing data." Legal review is deferred to post-MVP. Copy like "Buy" / "Sell" never appears, but "Likely to deliver" next to a ticker symbol is read the same way by a retail investor.

**How to avoid:**
- **Never show a ticker alongside the verdict.** Claim is about "the company's statement," not "the stock."
- Persistent, non-dismissible disclaimer on every verdict + depth surface: "Not investment advice. Analytical opinion about stated claims. Do your own research."
- Copy audit: ban verbs like "buy," "invest," "profit," "opportunity." Favor "claim," "statement," "delivery track record."
- For CEO personal claims, keep scoring at the *claim level* (the statement's plausibility), never at the *person level* ("CEO is dishonest" is defamation; "this specific forecast has 3/10 historical match" is analysis).
- Add a one-time acknowledgment modal on first use: "This is analytical commentary, not advice."
- Budget a legal review pass *before* public launch, not after.

**Warning signs:**
- Copy like "should you trust…" or "worth betting on."
- Ticker symbols, price charts, or "buy" CTAs creeping into designs.
- Scorecard that aggregates *across a CEO's career* rather than per-claim.
- No disclaimer visible without scrolling.

**Phase to address:** Content/copy phase (foundations, cross-cutting) + dedicated legal-review gate before any public deployment. Flag in Phase 0.

---

### Pitfall 4: YouTube timestamp drift & live-sync hell

**What goes wrong:**
The claim cards side-rail is driven by timestamps, but `YT.Player.getCurrentTime()` is polled, not pushed. Polling at 1Hz drifts 500ms per card in edge cases; at 250ms the main thread stutters and the force-graph chokes. On mobile iOS, Safari suspends the iframe when scrolled off-screen, so `getCurrentTime()` returns stale values. Autoplay is blocked without a user gesture; muted autoplay works on desktop but is inconsistent on iOS <17.

**Why it happens:**
Devs assume the IFrame API gives them events for every second. It doesn't — you get coarse state-change events and must poll. Live streams have *additional* quirks: `getDuration()` returns 0 or Infinity, seeking is restricted, and `onStateChange` fires less reliably.

**How to avoid:**
- Use `requestAnimationFrame`-based polling gated to 4Hz (250ms) **only when the tab is visible**. Pause polling on `document.visibilitychange` hidden.
- Derive claim-card activation from a *range* (`claim.start - 2s <= currentTime <= claim.end + 2s`), never an exact equality.
- Test the "tab is backgrounded for 90 seconds, user returns" path — browsers throttle `setInterval` to 1s minimum on hidden tabs.
- For live streams: do NOT rely on `getDuration()`. Use `getCurrentTime()` as monotonic clock + server-provided transcript chunks with absolute timestamps.
- Never autoplay with sound. Muted + `playsinline` + user-gesture-to-unmute is the only path that works cross-browser.
- Disable the YouTube branding where allowed (`modestbranding=1`) but accept you cannot remove it — own the framing.
- Handle the `onError` codes explicitly (2, 5, 100, 101, 150) — embed-disabled videos are extremely common and will 404 silently otherwise.

**Warning signs:**
- Claim card "pops in" but only after a seek — means polling is too slow.
- Force-graph framerate drops when video is playing — main-thread contention.
- iOS mobile: video plays but claim cards freeze — iframe suspended.
- Test video works; production video returns error 101 — embed-disabled by owner.

**Phase to address:** Live Checker (Surface 1) phase. Budget explicit "cross-browser/device smoke test" subphase.

---

### Pitfall 5: Force-directed graph that melts past 50 nodes

**What goes wrong:**
react-flow handles 50+ nodes fine *statically*, but a live d3-force simulation with collision detection, link-strength tuning, and animated node pulses tanks to <20fps on a 4-year-old MacBook. Layout is non-deterministic — same data, different shape each load, which destroys user trust ("why did the graph rearrange?"). Labels overlap to illegibility. Screen readers announce "graphic" with no semantic information.

**Why it happens:**
d3-force is a physics simulation — it's O(n²) without quadtree optimization, which most tutorials skip. Devs ship with defaults. No one tests with 80 nodes because the mock data has 12. Labels are rendered as HTML overlays with no collision avoidance.

**How to avoid:**
- Cap visible nodes at 30–40. Collapse lower-priority stakeholders into aggregate nodes ("5 retail competitors").
- **Freeze the layout** after initial simulation (fix positions, `node.fx = node.x; node.fy = node.y`). Re-running physics on every render is the #1 perceived-instability cause.
- Seed the simulation with a deterministic RNG so the same input produces the same graph every time.
- Use Canvas rendering (react-flow's built-in or PixiJS via react-pixi) for >50 nodes. SVG dies.
- Label strategy: show only hovered/focused labels + top-N by importance. Use occlusion detection or simply a ring layout for labels.
- **Provide a table alternative.** A data table of `[stakeholder, relationship, simulated reaction]` satisfies screen-reader users and is the accessibility fallback. Keyboard nav through nodes via arrow keys + `Enter` to expand.
- Test with `prefers-reduced-motion`: disable the animated simulation, render the settled layout immediately.

**Warning signs:**
- FPS counter <40 during node pulse animation.
- User reloads page and graph is visually different → seed not deterministic.
- Tooltips visible through other nodes (z-index roulette).
- No table view → ship blocker for accessibility.

**Phase to address:** Future Module / Force-Graph phase in Surface 2.

---

### Pitfall 6: Streaming progress UI that lies

**What goes wrong:**
A progress bar that goes 0 → 30% → stalls at 70% for 8 seconds → jumps to 100% is *worse* than no progress bar. Users learn the number is fake. "AI is thinking…" with no substeps and no elapsed-time signal reads as "site is broken." No cancel button means users reload the page, losing the in-flight analysis.

**Why it happens:**
Backend gives a binary done/not-done. Frontend invents a percentage. Substeps are faked with setTimeout. Nobody tests the "user waits 45 seconds" flow.

**How to avoid:**
- **Either a real progress bar or no progress bar.** If the backend can't emit percentages, use a named-substep list with checkmarks ("Scraping 2022 Q3 call ✓ / Matching past claims… / Simulating stakeholder reactions"). Named steps age better than fake numbers.
- Real substeps must come from a stream (SSE / ReadableStream) — don't simulate them client-side.
- Show elapsed time after 5s ("12s elapsed"). Users forgive long waits if they see the clock.
- **Always a cancel button** after 3s. Clicking it must actually abort the request (`AbortController`).
- Indeterminate states use a shimmering skeleton, not a spinning percentage.
- Handle browser-throttled inactive tabs: when tab returns to foreground, check for stale streams; reconnect if SSE dropped.
- For the depth 3-step pipeline (Past / Present / Future), show all 3 from the start with their substeps — users can see the total scope, not just current step.

**Warning signs:**
- Any `setInterval` that increments a progress percentage.
- No abort handling — canceling does nothing.
- Percentage that ever goes backward or stalls for >5s.
- Elapsed time hidden or unavailable.

**Phase to address:** Progress UI (Surface 3) phase.

---

### Pitfall 7: "It worked with mocks" — fixture-shaped components

**What goes wrong:**
Components are built against MSW fixtures. Fixture data is always well-formed: never null fields, always 5 past claims, never a 500 error, always resolves in 300ms. When real backend lands, components blow up on `null` stakeholder graphs, 8-second timeouts, truncated streams, partial data (Past module loaded but Future timed out).

**Why it happens:**
MSW fixtures are crafted to "look good in Storybook." Error states are deferred. Developers never hit the failure paths during dev.

**How to avoid:**
- **Fixtures must include error variants from day 1.** For every endpoint: `success`, `empty`, `partial`, `slow (15s)`, `error-500`, `error-timeout`, `error-auth`.
- Route-handler mocks should support query params like `?mock=partial` or `?mock=timeout` to force states.
- Typed API client uses a `Result<T, Err>` pattern (discriminated union), not thrown exceptions, so TypeScript forces error-path handling at call sites.
- Every data-consuming component has a Storybook story for each of: loading, empty, partial, error, success.
- Decouple component props from API response shapes: use a view-model layer (`mapApiToViewModel`) so backend shape changes don't cascade.
- Contract tests: generate types from an OpenAPI/Zod schema shared between mock and real backend. When real backend lands, type mismatches fail at compile.

**Warning signs:**
- Components destructure API response directly (`const { stakeholders } = await fetch(...)`).
- No empty-state designs.
- Only happy-path Storybook stories.
- No Zod / runtime validation of API responses.

**Phase to address:** Foundation phase (typed API client + fixture strategy) — must be locked in before feature work begins.

---

### Pitfall 8: Next.js App Router — hydration chaos with YouTube and force-graph

**What goes wrong:**
YouTube IFrame API and react-flow/d3 both need `window`. Dropping them into a default (Server) component explodes at build. Wrapping a whole route in `'use client'` nukes streaming/RSC benefits and balloons the client bundle. Hydration mismatches appear intermittently — server renders "Loading player…" and client renders the iframe, but the two diverge with a random prop.

**Why it happens:**
App Router's defaults (Server Components) are new territory for many devs. The reflex is either (a) `'use client'` at the top of every file, or (b) wrestle with `dynamic(() => import(...), { ssr: false })` without understanding.

**How to avoid:**
- Keep route pages (`page.tsx`) as Server Components. Data-fetching happens there.
- Isolate client-only leaves (YouTube player wrapper, force-graph canvas, shadcn `DropdownMenu`) to their own `'use client'` files. Import them from Server Components.
- Use `next/dynamic` with `{ ssr: false }` specifically for libs that `typeof window` check at module load (react-flow, most charting libs).
- Serialize ALL server-to-client props — no Date objects, no class instances, no functions. Convert Dates to ISO strings at the boundary.
- For deeply nested client trees, accept `children` as a prop (Server Components can be rendered *inside* Client Components if passed as children).
- Enforce `'use client'` discipline via ESLint — custom rule or `eslint-plugin-react-server-components`.
- On hydration mismatch: check for `Date.now()`, `Math.random()`, `localStorage` in render; gate with `useEffect` + `useState(null)` initial.

**Warning signs:**
- `'use client'` at the top of a layout or page file.
- Client bundle >500KB for a simple route (check with `@next/bundle-analyzer`).
- Console errors: "Text content does not match server-rendered HTML."
- Suspense boundaries missing around `useSearchParams()` → CSR bailout for the entire page.

**Phase to address:** Foundation phase (routing + component boundaries). Audit at each surface's integration.

---

### Pitfall 9: shadcn + Tailwind v4 theme drift

**What goes wrong:**
shadcn components are copied into the repo, then diverge from upstream. Six months in, three buttons with slightly different focus rings exist. Tailwind v4's CSS-variable-based theme (`@theme`) interacts oddly with shadcn's `--background` / `--foreground` conventions. Dark mode works, light mode works, but the "muted warm" palette drifts — the minimalist Surface 1 feels cool and the maximalist Surface 2 feels warm because different devs used different HSL values.

**Why it happens:**
shadcn is a *paste-and-own* library by design — there is no upstream version to pull. Tailwind v4's theme migration (from `tailwind.config.ts` to `@theme` in CSS) confuses teams straddling the boundary. Dark-mode variants defined ad-hoc per component.

**How to avoid:**
- Define the **full palette as CSS variables in one place** (`globals.css`): `--warm-50` through `--warm-950`, `--accent-*`, etc. shadcn variables (`--background`, `--primary`) map to these tokens, not to raw colors.
- Use Tailwind v4's `@theme` block as the single source of truth. Document every token.
- Ban hex/rgb values outside the theme file. ESLint rule: `no-restricted-syntax` on raw color literals in component files.
- For register duality (minimalist vs maximalist), define two *density/type scale* sets, not two color sets. Same palette, different spacing and type sizes.
- One `ThemeProvider` (shadcn's or next-themes), one switcher. Test both themes in Storybook by default (decorator).
- Visual regression tests (Chromatic / Percy / Playwright screenshots) on both themes for key components.
- When customizing a shadcn component, document *why* in a comment at the top of the file. Prevents "why is this button different?" audits later.

**Warning signs:**
- More than one file defines colors.
- Component-level `dark:` overrides without a corresponding light variant.
- Two buttons render differently in Storybook → customization debt.
- `text-gray-500` or `bg-[#abc123]` in feature code → theme bypass.

**Phase to address:** Design-system foundation phase (pre-feature).

---

### Pitfall 10: Jargon creep & information overload on verdict surface

**What goes wrong:**
"EBITDA guidance YoY delta: -3.2σ" appears on a page aimed at a 28-year-old who bought her first ETF last month. The verdict screen grows from 4 metrics to 14 because stakeholders keep adding "just one more." Information density kills the core thesis — that retail investors distrust dashboards.

**Why it happens:**
Engineers and finance people are comfortable with jargon and forget their audience. Scope creep on "just one more metric." Nobody defends the minimalist register.

**How to avoid:**
- Maintain a **copy glossary** — every finance term has a plain-language replacement. "Guidance" → "what the company promised." "Delivery rate" not "EPS beat rate."
- Hover tooltips on every data label (the label itself is plain; tooltip offers the technical term for users who want it).
- Hard cap on verdict surface: 1 headline + 1 score + 4 breakdown dimensions + 1 historical stat = 7 elements total. More requires a PR review against a "verdict complexity budget."
- User testing with 3+ non-finance readers *before* each surface ships. If they can't explain what the page says in their own words, it fails.
- Scrollbar on the verdict page = design failure. Verdict must fit the viewport.

**Warning signs:**
- Any metric with a Greek letter.
- Any acronym without a tooltip.
- Verdict screen exceeds 7 elements.
- User testing reveals "I don't know what to do with this."

**Phase to address:** Verdict Surface (Surface 4) phase + cross-cutting copy review.

---

### Pitfall 11: Bundle bloat from react-flow + YouTube + charting

**What goes wrong:**
Default imports pull in all of react-flow (~180KB gzipped), Recharts (~100KB), YouTube IFrame API loader (~40KB), plus shadcn's radix-ui tree (~150KB across components). Initial JS payload exceeds 1MB. First Contentful Paint on a cold Vercel edge is 3.2s on Slow 4G. Retail investors on mobile bounce.

**Why it happens:**
Devs import from package roots. No one audits bundle until after launch. react-flow's imperative handle and d3's modular packages are poorly understood.

**How to avoid:**
- **Code-split by surface.** Surface 1 (live checker) does not need react-flow. Surface 2 (depth) does not need the YouTube SDK. Use `next/dynamic` per-surface.
- Import d3-force subpackages, not the `d3` umbrella (`d3-force`, `d3-hierarchy` individually).
- Use `@next/bundle-analyzer` in CI — fail if first-load JS exceeds a budget (e.g., 200KB per route).
- shadcn components: only import components you use (which is already the shadcn model, but audit).
- Recharts alternative: if only one chart type is needed, a custom SVG (~5KB) beats Recharts (~100KB).
- YouTube IFrame API: load only on Surface 1 route — use route-level dynamic import, not layout-level.
- Preload critical fonts with `next/font` subset to Latin only; `display: 'swap'` to avoid blocking.
- Image optimization: the force-graph rendering of avatars must use `next/image` with sized remotePatterns — otherwise Next warns and serves unoptimized originals.

**Warning signs:**
- First-load JS >250KB per route in `.next/analyze`.
- LCP >2.5s on desktop (Vercel Speed Insights).
- `import * from 'd3'`.
- Same chart library loaded on every route.

**Phase to address:** Performance-audit subphase within each surface; cross-cutting in foundation.

---

### Pitfall 12: Dense-dashboard accessibility failure

**What goes wrong:**
A keyboard user cannot tab through the stakeholder graph. A screen-reader user hears "image" for the entire Future module. Color-only signaling (red = low credibility) fails for ~8% of male users with CVD. Focus rings are removed for "aesthetic." The modular tile layout uses drag-and-drop with no keyboard alternative.

**Why it happens:**
Accessibility treated as a post-launch bolt-on. Graph/dataviz devs focus on pixels. Designers remove focus outlines because "they're ugly."

**How to avoid:**
- WCAG 2.2 AA as the floor, not ceiling. Run axe-core in CI on key pages.
- Every graph/chart has a `<table>` alternative (either toggleable or visually hidden but accessible). Announce data as "list of stakeholders: 12 items."
- Every color signal is paired with text or an icon. Low credibility = red + "low" label + downward arrow icon.
- Keep focus rings. Use `:focus-visible` to suppress only on mouse users.
- Skip-to-content link on every surface.
- Modular tiles: if drag-to-reorder is shipped, add arrow-key reorder (up/down moves tile) as keyboard equivalent.
- Test with VoiceOver (Mac) + NVDA (Windows) on at least the verdict surface + live surface. One pass before launch.
- `prefers-reduced-motion`: disable graph simulation animation, disable claim-card slide-in animations.
- Minimum contrast 4.5:1 for body text, 3:1 for large text — check the muted warm palette in both modes.

**Warning signs:**
- Tab order skips the graph or the video player.
- axe-core reports >0 critical issues.
- `outline: none` anywhere in CSS.
- No table/list alternative for graph.
- Color-only status indicators.

**Phase to address:** Cross-cutting. Each surface has an a11y checkpoint before marked done.

---

### Pitfall 13: Dual-register visual-language bleed

**What goes wrong:**
Surface 1 (minimalist live checker) and Surface 2 (maximalist depth dashboard) are supposed to feel like different registers of the same product. Six weeks in, they feel like two different products. The warm muted palette on Surface 1 becomes saturated on Surface 2 because someone needed "punch" for the graph. Type scales diverge. Dark mode on Surface 2 breaks the "muted warm" intent because the force-graph library ships with defaults.

**Why it happens:**
Different devs build different surfaces. No shared density/type scale spec. Third-party component defaults (react-flow's background color, Recharts' palette) bleed through.

**How to avoid:**
- Define the register duality in tokens: `--density-minimal`, `--density-dense`; `--type-scale-quiet`, `--type-scale-loud`. Not two color palettes — two *spacing and type* systems sharing one palette.
- All third-party components (react-flow, Recharts, YouTube) are wrapped in a themed container that overrides their defaults.
- Storybook documents both registers side by side. PR reviewer checks new components fit one register.
- One dark-mode audit pass after each surface lands — all 4 surfaces side-by-side in dark mode to catch drift.
- Design review: lock the palette values early, treat changes as breaking.

**Warning signs:**
- Two scores use different font sizes without spec.
- react-flow background white in light mode and black in dark mode — not your muted warm.
- Spacing on Surface 2 feels tight on one page and loose on the next.
- Chart colors don't match palette.

**Phase to address:** Design-system foundation + cross-surface review at each integration milestone.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode mock latency (e.g., always 300ms) | Fast dev feedback | Masks slow-state bugs; progress UI never tested properly | Day 1 only; replace with variable latency by foundation phase end |
| `'use client'` at layout level | Avoids hydration errors | Kills RSC benefits; bundle grows indefinitely | Never acceptable for this project |
| Skip error-state designs in favor of generic "Something went wrong" | Ship faster | "It worked with mocks" explosion on real backend | Acceptable *only* if error fixtures exist and are exercised via Storybook |
| Raw color hex in components | Designer unblocks themselves | Palette drift across surfaces | Never — require theme token |
| Inline YouTube embed `<iframe>` instead of YT SDK | Avoid SDK complexity | No timestamp events, breaks live-sync | Never for Surface 1; fine for static marketing pages if any |
| One giant `<ForceGraph>` component | Ships quickly | Can't tree-shake; bundle bloat on other surfaces | Never — always dynamic-import per surface |
| Display score as float without rounding | Unblocks backend integration | Fake-precision erodes trust | Never — round at the view-model boundary |
| Skip `Result<T, E>` typing on API client | Faster initial typing | Error paths silently untested | Acceptable only in throwaway spikes |
| Use shadcn defaults unchanged | Fast start | Theme drift, identity-free look | Acceptable in prototype; must own by MVP |
| No Zod validation on mock responses | Faster fixture creation | Real backend shape mismatch found in production | Never — schema-first from day 1 |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| YouTube IFrame API | Load via `<script>` in `_document` | Use `youtube-player` npm package or dynamic import the SDK per-component; handle race conditions on multiple instances |
| YouTube live streams | Assume `getDuration()` returns stream length | Check for `Infinity`/`0`, use server-side transcript timestamps as source of truth |
| YouTube `onStateChange` | Treat `PLAYING` as "video is playing now" | `BUFFERING` state can precede by several seconds; check `getPlayerState()` before acting |
| react-flow with d3-force | Let simulation run on every render | Run once, fix positions, re-run only on data change (memoize by data hash) |
| react-flow in Next.js | Default import at the page level | `dynamic(() => import('reactflow'), { ssr: false })`, and import `reactflow/dist/style.css` globally |
| shadcn + next-themes | FOUC (flash of unstyled content) on first paint | `next-themes` with `suppressHydrationWarning` on `<html>` and `attribute="class"`; render theme-aware bits after mount |
| Tailwind v4 + shadcn | shadcn CSS vars conflict with v4 `@theme` defaults | Define shadcn tokens *inside* `@theme` block; don't duplicate in `:root` |
| MSW in Next.js App Router | Set up only on client | Set up for both server (route handlers calling MSW) and browser; or use Next.js route handlers directly as the mock layer |
| MSW for streaming | Return full response | MSW supports `ReadableStream` responses; use it for SSE/progressive content |
| SSE behind Vercel | Assume connection stays open indefinitely | Vercel Edge has a 30s response timeout on Hobby; use streaming with keepalive pings, or upgrade tier; Node functions have longer limits |
| `next/image` for YouTube thumbnails | Hit `i.ytimg.com` without config | Configure `remotePatterns` in `next.config.js`; use `unoptimized` only as last resort |
| `next/font` with Tailwind v4 | Variable set via `className` but referenced in `@theme` | Expose font via CSS variable on `<html>`, reference in `@theme` with `--font-sans: var(--font-inter)` |
| AbortController + fetch | Created once per component lifecycle | Create fresh per request; abort on unmount AND on new request; propagate signal through typed API client |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| d3-force without quadtree | Graph FPS drops as nodes added; CPU pegged | Use `d3-force`'s built-in quadtree (default on `forceCollide`/`forceManyBody`, but check `theta` param); consider `force-graph` library for canvas rendering | ~50 nodes with collision detection |
| Polling `getCurrentTime()` at 60Hz | Main thread saturated; YouTube player stutters | Poll at 4Hz with `requestAnimationFrame` + throttle; pause on tab hidden | Any live session > 5 minutes |
| Re-running force simulation on state change | Graph "shuffles" on every claim card click | Memoize simulation by data identity; freeze positions after initial settle | Any interactive surface change |
| Recharts re-render on parent prop change | Visible chart flicker; bundle warm | `React.memo` chart components; stable data references | Depth dashboard with 4+ charts |
| Bundle includes all shadcn components | First-load JS >500KB | Only copy in components you use; periodic audit | MVP launch |
| Unsplit route bundles | Every route loads every feature | `dynamic()` heavy libs per-surface | As soon as a second surface ships |
| Unoptimized font load | LCP pushed out by 400-800ms | `next/font` with `display: 'swap'`, subset to Latin, preload | First production deploy |
| SSE held open without keepalive | Connection drops silently behind CDN | Send comment-line keepalive every 20s; reconnect on close | Any real streaming deploy |
| Backgrounded tab stream accumulation | User returns to 500 queued events, UI freezes | Pause event processing on `visibilitychange`; drop stale; sync on resume | Any session >2min with tab switching |
| localStorage hit during render | Hydration mismatch; flash of default theme | Read storage in `useEffect`; initial state from server-provided cookie | First user with saved preference |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Rendering extracted claim text without sanitization | XSS if backend scrapes malicious source | Treat all backend strings as untrusted; React's default escaping is usually enough but avoid `dangerouslySetInnerHTML` entirely on claim content |
| Storing ticker/claim history in localStorage unencrypted | Profile inference; privacy leak | Don't persist what you don't need; for v1 (anonymous, per-URL), storage is unnecessary |
| CORS wildcard on mock route handlers | Accidental carryover to prod API | Lock mock route handlers to same-origin; separate allowlist for real backend |
| Exposing backend analytical logic in client bundle | Reveals model/heuristic — competitive leak and defamation surface | Keep score math server-side; client receives pre-computed numbers + pre-worded verdict labels |
| Passing user-controlled URL into server fetch (SSRF) | If a user-submitted article URL triggers server-side scrape | Allowlist hosts; reject private IP ranges; timeout aggressively; this is backend concern but frontend must validate before dispatch |
| Missing CSP | Inline script injection via YouTube embed edge cases | Strict CSP with `frame-src https://www.youtube.com https://www.youtube-nocookie.com`; consider `youtube-nocookie.com` for privacy |
| Embed via default domain vs `youtube-nocookie.com` | Tracks user without consent (GDPR issue) | Default to `youtube-nocookie.com` (a.k.a. privacy-enhanced mode); no change in functionality |
| No rate limiting on "Run depth analysis" button | Client spam → backend overwhelm | Debounce/disable button during in-flight; backend rate-limits separately |
| Mixing real analytics (PostHog, Vercel Analytics) before disclaimer acceptance | GDPR/UK-GDPR consent violation | Defer analytics init until after disclaimer + consent event for EU users; check geolocation or use consent mode |
| Defamation via CEO-level scoring | Lawsuit exposure | Score *claims*, not *people*; never aggregate a "CEO credibility score" across unrelated contexts without clear methodology disclosure |
| Logging claim text with PII | Accidental storage of CEO personal statements, private individuals | Strip PII from analytics events; never log full claim bodies to client-side observability |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Single verdict without uncertainty | User treats 70% as fact | Show verdict band + confidence indicator + sample size |
| Surprise score changes when new data arrives | User loses faith ("it said 80 yesterday, now 65") | Version verdicts; show "updated X days ago"; surface the delta reason |
| "Scan complete" when partial data was used | False confidence | Label partial results explicitly; grey out modules that failed |
| Verdict screen as a dead-end | User has no next action, bounces | CTA: "See the reasoning" → depth view; "Track this claim over time" (future feature) |
| Chart-porn in the live checker surface | Breaks minimalist register; distracts from video | Enforce element budget on Surface 1: video + side rail + nothing else |
| Autoplay with sound | iOS blocks; perceived as spam on desktop | Muted autoplay with user-gesture unmute prompt |
| Drag-to-reorder tiles without undo | User loses layout accidentally | Undo toast for 5s; "reset layout" button |
| No loading state during force-graph simulation settle | Graph appears broken during 2s settle | Skeleton graph or progress indicator during simulation phase |
| Tooltips requiring hover on touch devices | Mobile users can't read definitions | Tap-to-reveal on touch; or inline definitions for key terms |
| Verdict label changes wording across surfaces | "Likely to deliver" vs "High credibility" inconsistency | Single copy source — one canonical label per band |
| Time-to-verdict anxiety | User doesn't know if 30s is normal or broken | Expectation-set: "Typical analysis: 20–40 seconds" visible during wait |
| Modal that can't be closed via Escape | Keyboard users trapped | shadcn Dialog does this by default — don't break it with custom |

---

## "Looks Done But Isn't" Checklist

- [ ] **YouTube player**: Often missing — mobile iOS autoplay fallback, error-code handling (101, 150 = embed disabled), visibility-based polling pause. Verify: deploy to preview, test on real iPhone, try an embed-disabled video (e.g., major music label).
- [ ] **Claim cards streaming**: Often missing — partial-state designs, timestamp-drift tolerance, reconnection after browser throttle. Verify: throttle tab to background for 60s then return, confirm cards catch up without reload.
- [ ] **Credibility score**: Often missing — low-sample-size state, stale-data indicator, methodology link. Verify: force a mock with `past_claims_count: 2` and confirm the UI degrades gracefully.
- [ ] **Force-directed graph**: Often missing — table fallback, keyboard navigation, `prefers-reduced-motion` path, >40 node test. Verify: tab through graph with screen reader on, load mock with 60 stakeholders.
- [ ] **Progress UI**: Often missing — cancel button, elapsed-time display, timeout error state, tab-throttle recovery. Verify: click cancel mid-analysis and confirm abort; leave tab for 90s, return, confirm correct state.
- [ ] **Verdict page**: Often missing — disclaimer (non-dismissible), methodology link, sample-size surface, next action CTA. Verify: take a screenshot and hand to a non-finance friend; if they can't articulate what they're looking at, it fails.
- [ ] **Dark mode**: Often missing — shadcn focus-ring color, third-party component overrides (react-flow, Recharts, YouTube chrome), palette adherence in graph edges. Verify: Storybook decorator renders every component in dark mode; visual diff.
- [ ] **Light mode**: Often missing — "muted warm" adherence (devs default to stock Tailwind slate/zinc). Verify: designer review of every surface in light mode before merge.
- [ ] **Error states**: Often missing — timeout, rate-limit, partial-data, embed-disabled. Verify: Storybook has a story for each error variant per surface.
- [ ] **Empty states**: Often missing — no past claims found, no stakeholders identified, video not yet started. Verify: fixture `?mock=empty` variants exist and render meaningfully.
- [ ] **Mobile non-break**: Often missing — desktop-first but spec says "must not break." Verify: manual pass on iPhone SE (smallest common viewport) + Android Chrome.
- [ ] **Legal disclaimer**: Often missing — persistent, non-dismissible, on every verdict surface, not just the landing page. Verify: grep for disclaimer text in every Surface 4 route; visible in dark mode.
- [ ] **Accessibility**: Often missing — axe-core clean, keyboard-complete, VoiceOver pass, contrast verified. Verify: CI run axe-core; manual NVDA/VoiceOver once per surface before merge.
- [ ] **Bundle budget**: Often missing — per-route first-load JS <250KB. Verify: `@next/bundle-analyzer` in CI; fail build on budget exceed.
- [ ] **Type safety at API boundary**: Often missing — Zod-validated responses, discriminated-union error handling. Verify: `tsc --noEmit` clean; every `fetch` call goes through typed client.
- [ ] **Consistent verdict copy**: Often missing — same band label across surfaces. Verify: centralized copy file; no string literals for band names in components.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Fake-precision score already shipped | LOW | Round at view-model layer; update copy; one deploy |
| Fixture-shaped components (real backend mismatch) | HIGH | Introduce view-model layer retroactively; Zod-validate at boundary; expect 2-week refactor per surface |
| Hydration errors in prod | MEDIUM | Identify offending component via React DevTools; wrap in `dynamic({ ssr: false })` or move to `useEffect` init; immediate hotfix possible |
| Bundle bloat past launch | MEDIUM | Audit with bundle-analyzer; code-split heaviest routes first (usually graph surface); progressive improvement |
| Graph performance collapse at scale | MEDIUM-HIGH | Cap visible nodes; move to canvas renderer (react-flow canvas mode or `react-force-graph`); freeze layout |
| Missing accessibility | HIGH | A11y remediation is rarely quick; budget 1 week per surface; start with keyboard + screen-reader core paths |
| Theme drift (too many color values in code) | MEDIUM | ESLint rule retroactively; grep for hex/rgb; replace with tokens over 2-3 sprints |
| Legal/compliance retrofit | HIGH | Content audit; disclaimer rollout; potential pause on public launch; engage counsel early |
| Timestamp drift in live sync | LOW | Increase polling frequency; adjust claim-card activation window; re-test |
| Progress UI distrust (fake bars) | LOW-MEDIUM | Replace with named substeps driven by real stream; backend must emit events |
| Score changed between user visits | MEDIUM | Version verdicts; add "updated" timestamp + change-log tooltip |
| Dark-mode breakage discovered late | MEDIUM | Storybook dark decorator; visual regression tests; one audit pass per surface |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Fake-precision scores | Design-system + Surface 4 | Score component unit test: no sub-percent precision allowed |
| Authority-bias / overclaiming | Content/copy phase (foundation) | Copy audit checklist; methodology link present on every verdict |
| Implied financial advice | **Foundation (Phase 0)** + pre-launch legal gate | Legal review sign-off; disclaimer presence grep test |
| YouTube timestamp drift | Surface 1 (Live Checker) phase | Cross-device smoke test; tab-throttle test scenario |
| Force-graph melt | Surface 2 / Future Module phase | Perf test with 60-node mock; FPS budget; table fallback test |
| Progress-bar lies | Surface 3 (Progress UI) phase | Real-stream integration test; abort test; elapsed-time visible |
| Fixture-shaped components | **Foundation** (typed API + fixture strategy) | Error/empty/partial fixtures exist per endpoint; Storybook coverage |
| Hydration / RSC misuse | Foundation (routing) + per-surface audit | Bundle analyzer; hydration error count in CI; ESLint rule |
| Shadcn / Tailwind theme drift | Design-system foundation | Single-source palette; lint rule against hex literals; visual regression |
| Jargon / info overload | Surface 4 + cross-cutting copy | Glossary exists; user-test 3 non-finance readers per surface; element-count budget |
| Bundle bloat | Foundation perf budget + per-surface audit | CI bundle-size check; LCP budget |
| Accessibility failure | Cross-cutting, every surface | axe-core CI; manual screen-reader pass per surface; table alternatives |
| Dual-register bleed | Design-system foundation + per-surface review | Storybook side-by-side; density/type tokens enforced |

---

## Sources

- Next.js App Router docs — Server/Client Components, hydration guidance (current as of Next 15+). HIGH confidence.
- YouTube IFrame Player API reference — state-change behaviors, error codes, live-stream caveats. HIGH confidence.
- react-flow docs + d3-force quadtree behavior (d3-force README, Observable community discussions). HIGH confidence.
- shadcn/ui + Tailwind CSS v4 migration guidance (`@theme` block, CSS-variable theming). HIGH confidence.
- WCAG 2.2 AA; WAI-ARIA Authoring Practices for interactive graphs (emerging pattern; dataviz a11y still pre-standard — MEDIUM confidence on graph-specific guidance).
- SEC Office of Investor Education & Advocacy bulletins on robo-advice and analytical tools; FINRA guidance on "investment advice" boundary (general awareness; not legal advice — MEDIUM confidence, flag for counsel).
- Retail-investor UX research: Betterment, Public.com, Robinhood post-mortems (mixed sources — MEDIUM confidence on specifics, HIGH on general patterns).
- Community post-mortems on streaming UI (Linear's progress patterns, Vercel's streaming docs, SSE-behind-CDN gotchas). HIGH confidence.
- Vercel deployment docs for Edge streaming limits, `next/font`, `@next/bundle-analyzer`. HIGH confidence.

---

*Pitfalls research for: Can U Deliver — retail-investor credibility checker frontend*
*Researched: 2026-04-19*
