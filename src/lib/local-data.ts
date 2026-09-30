import type { FinanceData } from "./model";

export const emptyFinanceData = (): FinanceData => ({
  accounts: [],
  benefits: [],
  transactions: [],
});

// Remove the old sample records while retaining user-created records that
// still point to a user-created account or benefit.
export function removeSampleRecords(data: FinanceData): FinanceData {
  const accounts = data.accounts.filter((item) => !item.id.startsWith("demo-"));
  const benefits = data.benefits.filter((item) => !item.id.startsWith("demo-"));
  const accountIds = new Set(accounts.map((item) => item.id));
  const benefitIds = new Set(benefits.map((item) => item.id));
  const transactions = data.transactions.filter(
    (item) =>
      !item.id.startsWith("demo-") &&
      ((item.accountId !== null && accountIds.has(item.accountId)) ||
        (item.benefitId !== null && benefitIds.has(item.benefitId))),
  );
  return { accounts, benefits, transactions };
}
