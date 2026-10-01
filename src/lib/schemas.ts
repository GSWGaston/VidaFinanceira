import { z } from "zod";
import { parseMoney } from "./money";
const money = z
  .string()
  .min(1)
  .transform((value) => parseMoney(value));
const optionalNonnegativeMoney = z
  .union([z.literal(""), money.pipe(z.number().int().nonnegative())])
  .optional()
  .transform((value) => (value === "" || value === undefined ? null : value));
export const accountSchema = z
  .object({
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
    creditLimit: optionalNonnegativeMoney,
    creditAvailable: optionalNonnegativeMoney,
  })
  .superRefine((account, context) => {
    if ((account.creditLimit === null) !== (account.creditAvailable === null)) {
      context.addIssue({
        code: "custom",
        message: "Informe o limite total e o disponível juntos.",
        path: ["creditLimit"],
      });
    } else if (
      account.creditLimit !== null &&
      account.creditAvailable !== null &&
      account.creditAvailable > account.creditLimit
    ) {
      context.addIssue({
        code: "custom",
        message: "O crédito disponível não pode superar o limite total.",
        path: ["creditAvailable"],
      });
    }
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
