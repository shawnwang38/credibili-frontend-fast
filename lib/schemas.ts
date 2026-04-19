import { z } from "zod";

export const ClaimSchema = z.object({
  id: z.string(),
  timestamp: z.number(), // seconds into video
  text: z.string(), // short summary
  verbatim: z.string(), // full quote
});
export type Claim = z.infer<typeof ClaimSchema>;

export const PastClaimSchema = z.object({
  id: z.string(),
  year: z.number(),
  text: z.string(),
  delivered: z.boolean(),
});
export type PastClaim = z.infer<typeof PastClaimSchema>;

export const PresentStateSchema = z.object({
  financials: z.object({
    revenue: z.string(),
    margin: z.string(),
    growth: z.string(),
  }),
  currentClaims: z.array(z.string()),
  competitors: z.array(
    z.object({
      name: z.string(),
      claim: z.string(),
      revenue: z.string(),
    }),
  ),
});
export type PresentState = z.infer<typeof PresentStateSchema>;

export const StakeholderSchema = z.object({
  id: z.string(),
  label: z.string(),
  role: z.enum([
    "ceo",
    "board",
    "investor",
    "customer",
    "regulator",
    "competitor",
    "partner",
    "employee",
  ]),
});
export type Stakeholder = z.infer<typeof StakeholderSchema>;

export const ScoreSchema = z.object({
  pastDelivery: z.number().min(0).max(100),
  currentMarket: z.number().min(0).max(100),
  futureSimulation: z.number().min(0).max(100).nullable(),
  overall: z.enum(["Likely", "Mixed", "Unlikely"]),
});
export type Score = z.infer<typeof ScoreSchema>;
