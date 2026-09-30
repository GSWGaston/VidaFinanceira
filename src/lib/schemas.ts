import { z } from "zod";
import { parseMoney } from "./money";
const money = z
  .string()
  .min(1)
  .transform((value) => parseMoney(value));
export const accountSchema = z.object({
  name: z.string().trim().min(2).max(80),
  institution: z.string().trim().min(2).max(80),
  kind: z.enum([
    "checking",
    "savings",
    "digital",
    "cash",
    "investment",
    "other",
  ]),
  openingBalance: money,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
export const benefitSchema = z.object({
  name: z.string().trim().min(2).max(80),
  company: z.string().trim().min(2).max(80),
  kind: z.enum(["va", "vr", "mobility", "fuel", "other"]),
  openingBalance: money,
  monthlyCredit: money,
  creditDay: z.coerce.number().int().min(1).max(28),
});
export const transactionSchema = z.object({
  description: z.string().trim().min(2).max(120),
  amount: money.pipe(z.number().positive()),
  type: z.enum(["income", "expense"]),
  date: z.iso.date(),
  category: z.string().min(2),
  sourceId: z.string().min(1),
  sourceKind: z.enum(["account", "benefit"]),
});
