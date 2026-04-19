# Feature Research

**Domain:** Retail-investor credibility-check web app (AI analysis + live transcript claim extraction + verdict scoring)
**Researched:** 2026-04-19
**Confidence:** MEDIUM-HIGH (strong pattern knowledge across the six named adjacent categories; MEDIUM on some Mirrorfish/agent-sim conventions since that genre is less standardized)

---

## Executive Framing

Four frontend surfaces, four different UX registers. The temptation in this category is to graft "investor dashboard" conventions (Koyfin, Seeking Alpha, Bloomberg Terminal) onto a retail audience — which produces exactly the "20 dashboards of vibe-coded metrics" the project explicitly rejects. The correct reference set is actually a hybrid:

- **For the verdict:** NewsGuard credibility badges, Ground News bias bars, Snopes verdict cards — not Koyfin stat tiles.
- **For live checker:** Otter.ai live-notes + YouTube chapter markers — not Bloomberg TV overlays.
- **For depth dashboard:** AlphaSense / Perplexity Finance citation-first layouts + Kensho-style event studies — not Seeking Alpha's 40-tab article shell.
- **For progress UI:** Perplexity's "Pro Search" step list, v0/Lovable agent step traces, ChatGPT Deep Research progress — not generic spinners or bar loaders.
- **For stakeholder simulation:** Mirrorfish, Obsidian graph view, Kumu.io, AI Town visualizations — not standard org charts.

Our product's competitive strategy is **trustworthy restraint at the verdict, transparent density in the analysis** — the opposite of products that make the verdict complex (to look sophisticated) and the analysis opaque (because it's not real).

---

## Feature Landscape

### Table Stakes (Users Expect These)

#### Surface 1 — Live Earnings-Call Checker

| Feature | Why Expected | Complexity | Surface | Notes |
|---|---|---|---|---|
| Embedded YouTube player with standard controls | Any video-centric tool has this (Otter, Fathom, Descript) | LOW | S1 | Use official IFrame Player API; don't custom-roll controls |
| Auto-scrolling claim cards as call progresses | Live-note tools (Otter, Fireflies, Read.ai) set this expectation | MEDIUM | S1 | Streaming list with "new card" animation; auto-scroll with "pause auto-scroll on user scroll" convention |
| Timestamp on each claim card + click-to-jump-video | Ubiquitous in transcript tools (Otter, Rev, YouTube chapters) | LOW | S1 | Jump via IFrame `seekTo()`; show current-claim indicator on the player timeline |
| Speaker attribution per claim (CEO / CFO / analyst) | Earnings calls have named speakers; users need to know *who* committed | MEDIUM | S1 | Data comes from backend; UI just needs a name + role chip per card. Avoid avatars unless backend provides them |
| Live/streaming state indicators on cards | Users distrust "instant" AI results on a live call; streaming builds trust | MEDIUM | S1 | "Extracting…" → "Checking past claims…" → verdict. Use shadcn Skeleton + subtle shimmer, not spinners |
| Quiet, long-session-friendly visual density | Users watch full calls (45–90 min); aggressive UI fatigues them | MEDIUM | S1 | Muted warm palette is table-stakes here, not a differentiator. No red/green flashing |
| Pause-friendly reading (claim doesn't disappear) | Users want to pause, read the claim, resume | LOW | S1 | Claims persist in side rail; no auto-dismiss |
| Keyboard shortcut: space to play/pause | YouTube/Otter/every video tool | LOW | S1 | Swallow space when focus is not in a text input |

#### Surface 2 — Depth Dashboard

| Feature | Why Expected | Complexity | Surface | Notes |
|---|---|---|---|---|
| Citation/source pane per claim | Perplexity Finance, AlphaSense, Ground News — non-negotiable in 2026 AI research tools | MEDIUM | S2 | Inline footnote-style citations `[1][2]` clickable to a right-rail source panel. Show source date + publisher |
| "Headline claim" always visible | Users get lost in dense dashboards without a persistent anchor | LOW | S2 | Sticky top bar with the claim text + company + date |
| Past delivery track record table | This IS the product's core "past" module; table form is table-stakes | MEDIUM | S2 | Claim → Date said → Outcome (delivered / partial / missed) → Evidence link. Sortable, not filterable (keep restrained) |
| Modular tile layout with consistent chrome | Modern analytical tools (Notion dashboards, Retool, Linear insights) | MEDIUM | S2 | shadcn Card + consistent header pattern (title, optional action, optional collapse). Do NOT build user-customizable drag-to-rearrange for v1 |
| Methodology / "how we calculated this" link | Credibility tools without this read as black-boxy (NewsGuard always links methodology) | LOW | S2 | One persistent link in the top-right or footer of each module |
| Loading states per module (not whole-page spinners) | Dashboard convention: each tile reveals when ready | MEDIUM | S2 | Per-tile skeletons; page is usable as modules stream in |
| Deep-link URLs per claim/analysis | Shareable URLs are table-stakes for research tools (AlphaSense, Seeking Alpha) | LOW | S2 | `/analysis/[claim-id]` route; preserve scroll/module state via URL params |

#### Surface 3 — Progress UI

| Feature | Why Expected | Complexity | Surface | Notes |
|---|---|---|---|---|
| Named pipeline steps (not just a %) | Perplexity Pro / Deep Research / v0 / Cursor Agent — the 2025–26 convention is *narrated* progress | MEDIUM | S3 | Past → Present → Future, each with a status (pending / active / done / failed) |
| Granular substep messages that change | Users sit through 30–90s waits; static progress feels stuck | MEDIUM | S3 | "Scraping Q3 2022 transcript…" "Matched 14/18 past claims" — backend streams these; UI just lists them |
| Time estimate or elapsed timer | Long-running AI ops need a sense of "am I waiting too long?" | LOW | S3 | Elapsed timer is safer than ETA (AI pipelines are variable); show "~1 min" as a rough band |
| Failure states with retry | Non-negotiable; AI pipelines fail | MEDIUM | S3 | Per-step failure; offer retry just that step if backend supports it, else retry-all |
| Non-blocking progress in Surface 1 (inline card state) | Live checker can't interrupt the video with a full-screen loader | MEDIUM | S1/S3 | Inline per-card state machine; stay quiet |
| Clean completion transition | Users lose trust if "done" feels abrupt or unclear | LOW | S3 | Brief "Complete — opening results" state before routing to S2 or S4 |

#### Surface 4 — Verdict Overview

| Feature | Why Expected | Complexity | Surface | Notes |
|---|---|---|---|---|
| Plain-English claim restatement | Retail audience — jargon kills trust (NewsGuard / Snopes model) | LOW | S4 | One sentence, max. Comes from backend |
| Single prominent credibility number + label | "72% — Likely to deliver" is the spec; matches NewsGuard score card convention | LOW | S4 | Large typography, single color. Avoid gauge dials (feel gimmicky) |
| Visible sub-scores (Transparency / Accuracy / Consistency / Industry state) | Score breakdown is in the spec; also matches NewsGuard's nutrition-label pattern | LOW | S4 | Four compact rows: label + value + 1-line explainer. No charts |
| Methodology link | Honest-scoring UIs always link their method (NewsGuard, Ground News, AllSides) | LOW | S4 | Small link; opens a static page or modal |
| "Last analyzed" / data freshness timestamp | Credibility tools are judged on recency (Ground News, NewsGuard show update dates) | LOW | S4 | Relative time ("analyzed 3 min ago") |
| Single historical-delivery headline stat | Core differentiator anchor; matches Surface spec | LOW | S4 | "Delivered 7 of 12 prior claims" — one number, one line |
| "See full analysis" link to Surface 2 | Users must be able to drill in; verdict-only is a dead end | LOW | S4 | One CTA, not five |

---

### Differentiators (Competitive Advantage)

These are where this product competes — most retail-investor tools either don't do these or do them badly.

#### Live Checker (S1) Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| **Inline past-claim comparison on each new claim** | "CEO said this in Q2 2024 too. Delivered: partial." — nothing else does this live | HIGH | Mini-footer on each claim card showing 1–2 matched prior claims + outcome. Backend dependency; UI can mock. High signal-to-noise — this is the "aha" moment |
| **Quiet credibility signal per card** (not loud red/green) | Retail tools scream with color; restraint signals seriousness | LOW | Thin left border in muted warm tone (sand/clay/terracotta gradient by score). No big numbers per card — full score lives in Surface 4 |
| **"Run depth analysis" one-click from any card** | Bridges minimal → maximal surfaces; matches spec | LOW | Ghost button on card hover; routes into Surface 3 progress with that claim as context |
| **Auto-pause scroll when user is reading** | Respects long-session use; Otter does variants of this | MEDIUM | Detect scroll position; pause auto-scroll until user returns to bottom |

#### Depth Dashboard (S2) Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| **Past/Present/Future as three equal-weight modules** | Most investor tools are present-only (financials); past-delivery comparison + future simulation is genuinely novel | HIGH | Forces a 3-section layout; each has its own visual motif. Don't let "present" dominate |
| **Force-directed stakeholder graph (future module)** | Mirrorfish-style — this is a signature feature, not in any investor tool | HIGH | react-flow recommended (Next.js friendly, maintained, SSR-safe with dynamic import). d3-force works too but more custom work. Node = stakeholder with persona tooltip; edges = relationship/influence |
| **Agent-simulation outcome replay** | Watching the sim "play out" is memorable; distinguishes from static dashboards | HIGH | Optional stretch: step-through simulation where graph animates through reactions. If cut, still show final state + per-node "predicted reaction" text |
| **Past-claim matching with delivery evidence** | The backbone differentiator: "here's what they said, here's what happened" | MEDIUM | Table + expandable row with source link + 1-sentence outcome summary |
| **CEO personal track record separate from company** | Most tools conflate; separating them is honest and useful | MEDIUM | Two sub-tables or tabs within the Past module |
| **Competitor-context tile that's comparative not encyclopedic** | Koyfin-style "peers" tables are overwhelming; a restrained version is differentiating | MEDIUM | 3–5 named peers max, one metric each. "Peers who made similar claims: X delivered, Y didn't" |
| **Industry-signals mini-timeline** | Most products dump charts; a single annotated timeline is clearer | MEDIUM | Horizontal timeline with 3–5 annotated events, not a stock chart |

#### Progress UI (S3) Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| **Narrated substep stream that feels like thinking, not loading** | Perplexity/Cursor set this standard; retail-finance tools don't do it yet | MEDIUM | Real substep text from backend > clever placeholders. If backend is mocked, write plausible substeps per run |
| **Pipeline stage visualization (Past → Present → Future)** | Matches the mental model of the product itself — structural clarity | MEDIUM | Horizontal or vertical stepper with connected line. shadcn has no built-in stepper; roll one with Tailwind |
| **Intermediate results visible during run** | Perplexity shows sources as they arrive; builds trust vs opaque progress | MEDIUM-HIGH | "Found 12 past claims so far…" surfaces partial data. Raises complexity but massively improves trust |
| **Cancellable runs** | Serious tools let users cancel; AI-tool UX standard by 2025 | MEDIUM | Abort-controller pattern; confirm on cancel |

#### Verdict (S4) Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| **Confidence interval or "based on N signals" secondary text** | Honest scoring shows its work; "72% (based on 18 past claims)" beats "72%" alone | LOW | One line under the score. Avoid statistical language ("±5%") for retail audience; use count-based framing |
| **Verdict label vocabulary tuned for non-overpromise** | "Likely to deliver" / "Mixed signals" / "Unlikely to deliver" / "Insufficient history" — 4 bands max, no false certainty | LOW | Band names are a design decision worth nailing. Avoid "High confidence" / "Low confidence" (users hear it as AI bragging) |
| **Score breakdown as a nutrition label, not a radar chart** | NewsGuard-style; radar charts imply false equivalence between axes | LOW | Four labeled rows. Each axis has its own weight visible |
| **One-sentence "why this score" explanation** | Retail users need a bridge from score to meaning | LOW | Backend-provided. "Past delivery is strong but industry headwinds are severe." |
| **Explicit "Insufficient data" state instead of fake low score** | Honest tools say "we don't know" — most scoring products fake a number | LOW | Dedicated empty-ish state; don't show a 30% when backend has nothing |

---

### Anti-Features (Deliberately NOT Building)

The user is explicit: "no 20 dashboards, no vibe-coded metrics." These are the specific traps retail-investor and AI-analysis products fall into — document them so future scope-creep debates have a reference.

| Anti-Feature | Why Commonly Requested | Why Problematic Here | Alternative |
|---|---|---|---|
| **Live stock price tile** | "It's an investor tool, add a chart" | Not in the claim→delivery thesis; invites Bloomberg-comparison; users will distrust real-time accuracy | Mention current context in the Present module text, no live ticker |
| **User-customizable dashboard (drag/drop tiles, saved layouts)** | Retool / Koyfin train this expectation | Massive complexity; serves power-users the product isn't for; fights the "restrained" register | Fixed, opinionated layout. If users ask, "we chose this order deliberately" |
| **Portfolio tracking / watchlists** | Every investor tool has it | Explicitly out of scope in PROJECT.md; pulls product toward Seeking Alpha territory | Per-URL anonymous flow stays the product |
| **Radar / spider chart for score breakdown** | Looks "data-rich" | Implies axes are comparable/equivalent; hard to read; feels like "vibe metric" theater | Nutrition-label rows with explicit labels and weights |
| **Gauge / speedometer for credibility score** | Classic "credibility meter" skeuomorph | Reads as gimmicky; conflicts with "looks serious" goal; wastes huge screen real estate | Big typography number + verdict label |
| **Red/green flashing or pulsing indicators on live cards** | Bloomberg TV / trading UI convention | Fatiguing for 60-min call-watching; signals speculation, not analysis | Muted warm tones; subtle left-border color shift |
| **AI chat interface on depth dashboard** | "Add Perplexity-style chat" reflex | Turns the product into another ChatGPT skin; undermines the hard-coded scoring thesis | Fixed modules with clear outputs. Chat is a v2+ question |
| **Share-to-Twitter/LinkedIn buttons on verdict** | Growth-hack reflex | Implies verdicts are shareable hot takes; conflicts with credibility register; exposes product to liability framing | Copyable deep-link URL only |
| **Historical score chart ("credibility over time")** | Sounds analytical | Implies the score is stable enough to trend; it's not; invites over-interpretation | Single "last analyzed" timestamp |
| **Dark-pattern upsell / "unlock premium" gates** | SaaS default | User spec is anonymous per-URL flow; no auth in scope | Not in v1 at all |
| **Excessive disclaimers wrapping every number** | Legal-reflex overcorrection | Dilutes the credibility signal the product is trying to build | One footer line + methodology link; defer legal review per PROJECT.md |
| **Sentiment-analysis word cloud** | Cheap "AI vibe" | 2015-era visualization; no analytical value | Industry-signals timeline with 3–5 annotated events |
| **Auto-playing audio clips of the CEO** | "Bring the quote to life" | Invasive for dashboard use; adds media complexity | Text quote + timestamp link back to video |
| **20+ financial ratio tiles (P/E, EV/EBITDA, etc.)** | Koyfin / Seeking Alpha reflex | Exactly the "vibe-coded metrics dashboard" the product rejects | Present module surfaces 2–3 contextually relevant numbers with 1-line explainers |
| **Modal stacking / multi-level drill-ins** | Seeking Alpha pattern | Creates lostness; retail users don't page-trace | Flat routing: S1 → S3 → S2 or S4. No nested modals |
| **Real-time collaborative cursors / comments** | Trendy "Figma-style" addition | No collaboration in scope; noise for solo users | Not in v1 |
| **AI "ask a follow-up question" on verdict** | Perplexity reflex | Pulls focus from the clean verdict; invites infinite rabbit-holing | "See full analysis" link into Surface 2 is the only drill-down |
| **Confidence as a separate percentage next to score** | "Show uncertainty" reflex done wrong | Two percentages confuse retail users ("72% credible, 60% confident???") | Single score + "based on N signals" qualifier |
| **Per-user onboarding tour** | SaaS default | Product is per-URL anonymous; tour is friction | Inline affordances and one-line tooltips only |
| **Notifications / email digests** | Growth-feature reflex | No accounts; out of scope | Not applicable |

---

## Feature Dependencies

```
API Client + Types + Mock Layer (foundation)
    |
    +--requires--> Surface 1 (Live Checker)
    |                 |
    |                 +--requires--> Streaming claim list component
    |                 +--requires--> YouTube IFrame integration (seekTo, currentTime)
    |                 +--requires--> Per-card inline progress states
    |
    +--requires--> Surface 3 (Progress UI)
    |                 |
    |                 +--requires--> Streaming substep data from API
    |                 +--requires--> Stepper component (Past/Present/Future)
    |                 +--requires--> Per-step failure/retry UI
    |
    +--requires--> Surface 2 (Depth Dashboard)
    |                 |
    |                 +--requires--> Modular tile layout system
    |                 +--requires--> Past: claim-vs-delivery table
    |                 +--requires--> Present: current-state tiles
    |                 +--requires--> Future: force-directed graph (react-flow)
    |                 +--requires--> Citation pane system
    |
    +--requires--> Surface 4 (Verdict)
                      |
                      +--requires--> Score breakdown component (4 axes)
                      +--requires--> Verdict label vocabulary (design system constant)
                      +--requires--> Methodology static content

Cross-cutting:
    Design tokens (muted warm palette, type scale, density registers)
        --enhances--> ALL four surfaces (distinguishes minimal vs maximal)

    S1 "Run depth analysis" action --triggers--> S3 --completes into--> S2 or S4
    S4 "See full analysis" link --navigates to--> S2
    S2 is also reachable directly from article URL (extension deep-link)
```

### Dependency Notes

- **All surfaces require the typed API client and mock layer first** — without a stable data contract, every surface gets reworked.
- **Surface 3 is the connector between S1 and S2/S4** — build it early with both the inline (short) and dedicated (long) variants; they share state machines.
- **Force-directed graph has the highest isolated complexity** — build it as a standalone component with a fixture, integrate last. Don't let it block the rest of S2.
- **Design-register tokens must exist before any surface is built in earnest** — building S1 and S2 without a shared token system will produce two products that don't feel related.
- **Score breakdown component is shared between S2 and S4** — one component, two densities (S2 dense, S4 restrained). Build once.
- **Citation pane is shared between S2 modules** — don't re-implement per module.

---

## MVP Definition

### Launch With (v1) — The Four Surfaces, Honestly

- [ ] **API client + fixtures + typed mock layer** — foundation; nothing ships without this
- [ ] **Design tokens + dual-register system (minimal vs maximal)** — cross-cutting; S1/S4 get the quiet tokens, S2/S3 get the dense tokens
- [ ] **Surface 1: YouTube player + streaming claim cards + inline per-card progress + speaker attribution + timestamp jump + "run depth" action** — full S1 spec
- [ ] **Surface 3 inline variant: per-card state machine** — required by S1
- [ ] **Surface 3 dedicated variant: Past/Present/Future stepper with narrated substeps + elapsed timer + failure/retry** — required by S2 entry
- [ ] **Surface 2: Past module (claim-vs-delivery table with CEO split), Present module (company/industry/competitor tiles), Future module (force-directed graph with stakeholder personas), citation pane, methodology link** — full S2 spec
- [ ] **Surface 4: plain-English claim + big score + 4-axis nutrition-label breakdown + historical-delivery headline + last-analyzed timestamp + methodology link + "see full analysis" link** — full S4 spec
- [ ] **Dark mode + light mode** — spec constraint
- [ ] **Desktop-first responsive (doesn't break on mobile)** — spec constraint

### Add After Validation (v1.x)

- [ ] **Intermediate-results streaming in S3** (partial counts, source thumbnails as found) — add after v1 validates that users read progress UI at all
- [ ] **Agent-simulation animated replay in S2 future module** — start with static final-state graph; add animation if users find the graph compelling
- [ ] **Cancellable pipeline runs** — needs backend support; add when backend is real
- [ ] **Deep-link URL state preservation** (scroll position, which module expanded) — add after layout settles
- [ ] **Keyboard shortcuts beyond space-to-play** — add after usage shows what users want
- [ ] **Copy-link share affordance on S4** — deliberate *minimal* share story; add only if users ask

### Future Consideration (v2+)

- [ ] Authentication + saved verdict history — explicitly out of scope for MVP; revisit after PMF
- [ ] Email / push alerts on re-analysis — needs accounts
- [ ] Portfolio or watchlist — explicitly out of scope
- [ ] Mobile-optimized layout — deferred per PROJECT.md
- [ ] Export to PDF / CSV of depth analysis — wait for user demand; dashboard-bloat risk
- [ ] User-customizable tile arrangement on S2 — violates restraint thesis; only if strongly requested
- [ ] Legal-grade disclaimers / financial-advice compliance copy — needs legal review; stub only for v1

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---|---|---|---|
| Typed API client + mocks | HIGH | MEDIUM | P1 |
| Design tokens / dual register | HIGH | MEDIUM | P1 |
| S1 YouTube player + claim cards | HIGH | MEDIUM | P1 |
| S1 inline card progress states | HIGH | MEDIUM | P1 |
| S1 timestamp click-to-jump | MEDIUM | LOW | P1 |
| S1 speaker attribution | MEDIUM | LOW | P1 |
| S1 inline past-claim comparison | HIGH (differentiator) | MEDIUM | P1 |
| S3 dedicated pipeline stepper | HIGH | MEDIUM | P1 |
| S3 narrated substeps | HIGH (differentiator) | MEDIUM | P1 |
| S3 failure/retry | MEDIUM | LOW | P1 |
| S2 Past module (delivery table) | HIGH | MEDIUM | P1 |
| S2 Present module | MEDIUM | MEDIUM | P1 |
| S2 Future module (force graph) | HIGH (signature) | HIGH | P1 |
| S2 citation pane | HIGH | MEDIUM | P1 |
| S2 methodology link | MEDIUM | LOW | P1 |
| S4 score + verdict label | HIGH | LOW | P1 |
| S4 4-axis breakdown | HIGH | LOW | P1 |
| S4 historical delivery headline | HIGH | LOW | P1 |
| S4 last-analyzed timestamp | MEDIUM | LOW | P1 |
| Dark/light mode | MEDIUM | LOW | P1 |
| Intermediate-results streaming in S3 | MEDIUM | MEDIUM | P2 |
| Agent-sim animated replay | HIGH (if it works) | HIGH | P2 |
| Cancellable runs | MEDIUM | MEDIUM | P2 |
| Copy-link share | LOW | LOW | P2 |
| PDF export | LOW | MEDIUM | P3 |
| Auth / saved history | OUT OF SCOPE | — | — |
| Portfolio tracking | OUT OF SCOPE | — | — |

---

## Competitor Feature Analysis (Cross-Category)

### Live transcript + claim extraction

| Feature | Otter.ai | Fathom / Read.ai | YouTube chapters | Our Approach |
|---|---|---|---|---|
| Live transcript | Full scrolling transcript | Full transcript | None | **None — we surface claims only, not transcript** |
| Highlight / bookmark | Manual highlights | Auto-highlights | Chapter jumps | **Claim cards are the "auto-highlight" — no manual** |
| Speaker ID | Yes | Yes | No | **Yes (from backend)** |
| Click to jump | Yes | Yes | Yes | **Yes, via IFrame seekTo** |
| Inline analysis of claims | No | Summary only | No | **YES — past-comparison + credibility per card (signature)** |

### Investor research dashboards

| Feature | Koyfin | Seeking Alpha | Simply Wall St | AlphaSense | Our Approach |
|---|---|---|---|---|---|
| Live price ticker | Yes | Yes | Yes | No | **No (anti-feature)** |
| Financial ratio tiles (20+) | Yes | Yes | Yes (Snowflake viz) | No | **2–3 contextual numbers only** |
| Peer comparison | Dense table | Dense table | Snowflake | AI summary | **3–5 peers, one metric, one sentence** |
| Watchlist | Yes | Yes | Yes | Yes | **No (out of scope)** |
| Customizable dashboard | Yes | Limited | No | Yes | **No (anti-feature)** |
| Citation-first analysis | No | No | No | **Yes** | **Yes — AlphaSense is the closest model** |

### AI research / analysis

| Feature | Perplexity Finance | Bloomberg GPT | Kensho | ChatGPT Deep Research | Our Approach |
|---|---|---|---|---|---|
| Narrated progress steps | Yes (Pro Search) | No | No | Yes | **Yes — key differentiator** |
| Inline citations | Yes | Yes | Yes | Yes | **Yes** |
| Open-ended chat | Yes | Yes | Limited | Yes | **No (anti-feature)** |
| Structured deterministic outputs | No | No | Yes | No | **Yes — hard-coded score, not LLM free-text** |
| Event / scenario simulation | No | Limited | Yes (event studies) | No | **Yes — Mirrorfish-style graph (signature)** |

### Credibility / fact-check scoring UI

| Feature | NewsGuard | Ground News | Snopes | AllSides | Our Approach |
|---|---|---|---|---|---|
| Single prominent score | Yes (nutrition label) | Blindspot bar | Verdict label | Bias bar | **Yes — % + label** |
| Sub-scores / axes | Yes (9 criteria) | Source-count-based | No | No | **Yes — 4 axes (Transparency/Accuracy/Consistency/Industry)** |
| Methodology link | Yes (prominent) | Yes | Yes | Yes | **Yes** |
| Last-analyzed timestamp | Yes | Yes | Yes | Yes | **Yes** |
| Confidence qualifier | Implicit | Via source count | No | No | **"Based on N signals"** |
| Radar / gauge viz | No (nutrition rows) | Horizontal bar | None | Horizontal bar | **Nutrition-label rows (anti-radar/gauge)** |

### Agent / stakeholder simulation

| Feature | Mirrorfish | AI Town | Obsidian Graph | Kumu.io | Our Approach |
|---|---|---|---|---|---|
| Force-directed layout | Yes | No (spatial) | Yes | Yes | **Yes (react-flow)** |
| Per-node persona | Yes | Yes | No | Yes | **Yes (from backend)** |
| Animated interaction | Yes | Yes | No | Limited | **v1: static final state; v1.x: animated replay** |
| Edge = influence weight | Yes | Implicit | No | Yes | **Yes (thickness / opacity)** |
| Interactive inspection (click node) | Yes | Yes | Yes | Yes | **Yes (tooltip + side-panel detail)** |

---

## Known Unknowns / Flags for Requirements Phase

- **Verdict label vocabulary** needs explicit design decision — 4 bands recommended ("Likely to deliver" / "Mixed signals" / "Unlikely to deliver" / "Insufficient history") but user should confirm.
- **Score-to-band mapping thresholds** — where does 72% land? UI can't show this until product decides.
- **Stakeholder persona data shape** — force graph UI depends on backend contract; mock-data design needs a call on node types (role, affiliation, stance, influence weight) and edge types.
- **Substep message catalog** — mock data needs plausible substep strings per stage; worth writing these as part of fixture design, not winging them.
- **"Claim" data shape for S1 streaming** — does backend push one claim at a time, or a running list? Both work; affects client state machine.
- **Methodology page content** — stub is fine for v1 but needs to exist (a blank link erodes trust).
- **Citation source types** — SEC filings, news articles, transcripts, analyst reports? Each renders slightly differently in the pane.
- **Force-graph library final call** — strong lean toward `@xyflow/react` (react-flow v12+, App Router-safe with dynamic import + `ssr: false`). Alternative: `reagraph` or custom d3-force. Validate in STACK.md.

---

## Sources

- **Named references from prompt:** Snopes, Full Fact, Ground News, Koyfin, Seeking Alpha, Simply Wall St, AlphaSense, Perplexity Finance, Bloomberg GPT, Kensho, Otter.ai, Rev, Mirrorfish, AI Town, NewsGuard, AllSides — pattern knowledge synthesized from direct product usage / public documentation through Jan 2026.
- **PROJECT.md:** surface definitions, UX thesis, constraints, and explicit out-of-scope list.
- **Adjacent UX conventions:** Perplexity Pro Search step display, ChatGPT Deep Research progress pattern, v0 / Cursor Agent narrated-step UX, shadcn/ui component conventions, react-flow (xyflow) documentation patterns.
- **Confidence notes:** HIGH on dashboard / fact-check / transcript-tool conventions (well-documented, directly observable). MEDIUM on agent-simulation UX (Mirrorfish and AI Town are the strongest references but the genre is nascent and conventions less stable). MEDIUM on "narrated progress UI" specifics — the pattern is new enough (2024–2026) that best practices are still forming; recommendations are based on current leaders (Perplexity, Cursor, v0) not a standard.

---

*Feature research for: retail-investor credibility-check web app (Can U Deliver)*
*Researched: 2026-04-19*
