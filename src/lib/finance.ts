import type { FinanceData, Transaction } from "./model";
import { signedAmount, sumCents } from "./money";
export function balanceFor(
  data: FinanceData,
  id: string,
  source: "account" | "benefit",
): number {
  const entity =
    source === "account"
      ? data.accounts.find((item) => item.id === id)
      : data.benefits.find((item) => item.id === id);
  return (
    (entity?.openingBalanceCents ?? 0) +
    sumCents(
      data.transactions
        .filter((item) =>
          source === "account" ? item.accountId === id : item.benefitId === id,
        )
        .map(signedAmount),
    )
  );
}
export function dashboardTotals(data: FinanceData, now = new Date()) {
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthly = data.transactions.filter((item) =>
    item.date.startsWith(month),
  );
  const income = sumCents(
    monthly
      .filter((item) => item.type === "income")
      .map((item) => item.amountCents),
  );
  const expense = sumCents(
    monthly
      .filter((item) => item.type === "expense")
      .map((item) => item.amountCents),
  );
  return {
    balance: sumCents(
      data.accounts
        .filter((item) => item.active)
        .map((item) => balanceFor(data, item.id, "account")),
    ),
    benefits: sumCents(
      data.benefits
        .filter((item) => item.active)
        .map((item) => balanceFor(data, item.id, "benefit")),
    ),
    income,
    expense,
    result: income - expense,
  };
}
export function categoryExpenses(transactions: Transaction[], month: string) {
  const sums = new Map<string, number>();
  for (const item of transactions)
    if (item.type === "expense" && item.date.startsWith(month))
      sums.set(
        item.category,
        (sums.get(item.category) ?? 0) + item.amountCents,
      );
  return [...sums]
    .map(([name, amountCents]) => ({ name, amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents);
}
