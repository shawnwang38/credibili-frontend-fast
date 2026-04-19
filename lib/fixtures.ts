import type {
  Claim,
  PastClaim,
  PresentState,
  Score,
  Stakeholder,
} from "@/lib/schemas";
import type { FeedPanel } from "@/lib/api-types";

export const DEFAULT_VIDEO_ID = "dQw4w9WgXcQ";
export const DEFAULT_COMPANY = {
  name: "Acme Robotics",
  ticker: "ACME",
  sector: "Industrial AI",
  marketCap: "$8.4B",
};
export const DEFAULT_CLAIM =
  "We will achieve positive operating margin by Q4 2026";

export const fixtureClaims: Claim[] = [
  {
    id: "c1",
    timestamp: 12,
    text: "Positive operating margin by Q4 2026",
    verbatim:
      "We are absolutely committed to achieving positive operating margin by Q4 of 2026, no matter the macro environment.",
  },
  {
    id: "c2",
    timestamp: 45,
    text: "R&D spend held flat at 18% of revenue",
    verbatim:
      "Despite the push to profitability, R&D will remain at roughly 18% of revenue — we are not slowing innovation.",
  },
  {
    id: "c3",
    timestamp: 82,
    text: "Three new Fortune-500 logo wins this quarter",
    verbatim:
      "I'm pleased to announce three new Fortune-500 customer wins this quarter, all multi-year contracts.",
  },
  {
    id: "c4",
    timestamp: 127,
    text: "Gross margin expansion of 400bps in FY27",
    verbatim:
      "Through manufacturing efficiencies and supplier renegotiation, we expect 400 basis points of gross margin expansion in fiscal 2027.",
  },
  {
    id: "c5",
    timestamp: 175,
    text: "EU regulatory approval expected H2 2026",
    verbatim:
      "We're tracking well against the EU AI-Act compliance timeline; full regulatory approval is expected in the second half of 2026.",
  },
  {
    id: "c6",
    timestamp: 220,
    text: "$500M share buyback authorized",
    verbatim:
      "The board has authorized a $500 million share repurchase program reflecting confidence in long-term cash generation.",
  },
];

export const fixturePastClaims: PastClaim[] = [
  {
    id: "p1",
    year: 2021,
    text: "Reach $1B annual revenue run-rate",
    delivered: true,
  },
  {
    id: "p2",
    year: 2022,
    text: "Launch enterprise product tier in Q3",
    delivered: true,
  },
  {
    id: "p3",
    year: 2022,
    text: "Achieve gross margin of 60%",
    delivered: false,
  },
  {
    id: "p4",
    year: 2023,
    text: "Expand into APAC region by year-end",
    delivered: true,
  },
  {
    id: "p5",
    year: 2023,
    text: "Cut operating loss by 30%",
    delivered: false,
  },
  {
    id: "p6",
    year: 2024,
    text: "Sign 5 strategic partnerships",
    delivered: true,
  },
  {
    id: "p7",
    year: 2024,
    text: "Ship Generation-3 platform",
    delivered: true,
  },
  {
    id: "p8",
    year: 2025,
    text: "Reach cash-flow positive in Q4",
    delivered: false,
  },
];

export const fixturePresentState: PresentState = {
  financials: {
    revenue: "$1.8B",
    margin: "-4%",
    growth: "+22% YoY",
  },
  currentClaims: [
    "Operating margin to turn positive by Q4 2026",
    "Gross margin expansion of 400bps in FY27",
    "R&D investment held at 18% of revenue",
    "Three new Fortune-500 customers signed this quarter",
  ],
  competitors: [
    { name: "Helix Industrial", claim: "Profitable by FY26", revenue: "$2.4B" },
    { name: "Northstar Automation", claim: "30% YoY growth", revenue: "$1.1B" },
    { name: "Vector Robotics", claim: "EU launch H1 2026", revenue: "$760M" },
  ],
};

export const fixtureStakeholders: {
  nodes: Stakeholder[];
  links: { source: string; target: string }[];
} = {
  nodes: [
    { id: "ceo", label: "CEO Reyes", role: "ceo" },
    { id: "cfo", label: "CFO Park", role: "ceo" },
    { id: "board", label: "Board", role: "board" },
    { id: "inv1", label: "Vanguard", role: "investor" },
    { id: "inv2", label: "BlackRock", role: "investor" },
    { id: "inv3", label: "Activist Fund", role: "investor" },
    { id: "cust1", label: "Tier-1 Auto OEM", role: "customer" },
    { id: "cust2", label: "Logistics Co.", role: "customer" },
    { id: "reg1", label: "EU AI-Act", role: "regulator" },
    { id: "comp1", label: "Helix", role: "competitor" },
    { id: "part1", label: "Foundry Partner", role: "partner" },
    { id: "emp1", label: "Eng Workforce", role: "employee" },
  ],
  links: [
    { source: "ceo", target: "board" },
    { source: "cfo", target: "board" },
    { source: "ceo", target: "cfo" },
    { source: "board", target: "inv1" },
    { source: "board", target: "inv2" },
    { source: "inv3", target: "board" },
    { source: "ceo", target: "cust1" },
    { source: "ceo", target: "cust2" },
    { source: "cust1", target: "part1" },
    { source: "reg1", target: "ceo" },
    { source: "reg1", target: "comp1" },
    { source: "comp1", target: "cust1" },
    { source: "part1", target: "ceo" },
    { source: "emp1", target: "ceo" },
    { source: "emp1", target: "cfo" },
    { source: "inv1", target: "comp1" },
    { source: "cust2", target: "part1" },
    { source: "reg1", target: "part1" },
  ],
};

export const fixtureFeedLines: Record<FeedPanel, string[]> = {
  background: [
    "Resolving company identifier ACME...",
    "Fetching SEC 10-K (FY2025)...",
    "Parsing latest 10-Q (Q3 FY2026)...",
    "Indexing 4 earnings call transcripts (2024-2026)...",
    "Cross-referencing investor day deck (Mar 2026)...",
    "Geist embeddings — claim entity resolved: operating-margin",
    "Background context assembly complete.",
  ],
  past: [
    "Loading historical claims corpus (2021-2025)...",
    "Found 18 forward-looking statements...",
    "Matched 14/18 against actual outcomes...",
    "Computing per-year delivery rate...",
    "Weighting by claim materiality...",
    "Past credibility index: 62/100",
    "Past panel ready.",
  ],
  present: [
    "Pulling current financials (10-Q Q3 FY26)...",
    "Revenue $1.8B / Margin -4% / Growth +22% YoY",
    "Scanning competitor claims (Helix, Northstar, Vector)...",
    "Computing Herfindahl index for sector...",
    "Sentiment analysis on last 30d analyst notes...",
    "Current market score: 54/100",
    "Present panel ready.",
  ],
  future: [
    "Initializing stakeholder simulation...",
    "Resolving 12 stakeholder personas...",
    "Modeling reaction: CEO Reyes -> commit",
    "Modeling reaction: CFO Park -> mitigate",
    "Modeling reaction: Activist Fund -> pressure",
    "Modeling reaction: EU AI-Act -> conditional pass",
    "Running 5,000 Monte Carlo paths...",
    "Aggregating delivery probability distribution...",
    "Future simulation score: 78/100",
    "Future panel ready.",
  ],
};

export const fixtureScoreNoFuture: Score = {
  pastDelivery: 62,
  currentMarket: 54,
  futureSimulation: null,
  overall: "Mixed",
};

export const fixtureScoreWithFuture: Score = {
  pastDelivery: 62,
  currentMarket: 54,
  futureSimulation: 78,
  overall: "Mixed",
};
