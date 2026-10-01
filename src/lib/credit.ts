import type { Account, FinanceData } from "./model";

export type CreditOverview = {
  totalCents: number;
  usedCents: number;
  availableCents: number;
  usagePercentage: number;
  knownLines: number;
  incompleteLines: number;
};

function creditLine(account: Account) {
  const total = account.creditLimitCents;
  const available = account.creditAvailableCents;
  const used = account.creditUsedCents;
  if (total == null || !Number.isSafeInteger(total) || total < 0) return null;
  if (
    available != null &&
    Number.isSafeInteger(available) &&
    available >= 0 &&
    available <= total
  )
    return { total, available, used: total - available };
  if (used != null && Number.isSafeInteger(used) && used >= 0 && used <= total)
    return { total, available: total - used, used };
  return null;
}

export function creditOverview(data: FinanceData): CreditOverview | null {
  const lines = new Map<string, ReturnType<typeof creditLine>>();
  for (const account of data.accounts) {
    if (!account.active) continue;
    const hasCredit =
      account.creditLimitCents != null ||
      account.creditAvailableCents != null ||
      account.creditUsedCents != null;
    if (!hasCredit) continue;
    // A provider can assign one identifier to cards sharing a credit line.
    const key = account.creditLineId?.trim()
      ? `${account.connectionId ?? "manual"}:${account.creditLineId.trim()}`
      : account.id;
    const complete = creditLine(account);
    const previous = lines.get(key);
    if (previous === undefined || (!previous && complete))
      lines.set(key, complete);
  }
  const known = [...lines.values()].filter((line) => line !== null);
  if (!known.length) return null;
  const totalCents = known.reduce((sum, line) => sum + line.total, 0);
  const usedCents = known.reduce((sum, line) => sum + line.used, 0);
  const availableCents = known.reduce((sum, line) => sum + line.available, 0);
  return {
    totalCents,
    usedCents,
    availableCents,
    usagePercentage: totalCents === 0 ? 0 : (usedCents / totalCents) * 100,
    knownLines: known.length,
    incompleteLines: lines.size - known.length,
  };
}
