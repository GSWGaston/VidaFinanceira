import { describe, expect, it } from "vitest";
import type { Account, FinanceData } from "./model";
import { relationshipOverview } from "./relationship";

const base: Account = {
  id: "a",
  name: "Banco",
  institution: "Banco",
  kind: "checking",
  openingBalanceCents: 0,
  color: "#7a3e2b",
  active: true,
};
const data = (account: Account): FinanceData => ({
  accounts: [account],
  benefits: [],
  transactions: [],
});

describe("selected financial relationship", () => {
  it("shows a real zero balance on a manual account without credit", () => {
    expect(relationshipOverview(data(base), base)).toMatchObject({
      hasCredit: false,
      hasAccount: true,
      balanceCents: 0,
      linkedTransactionsCount: 0,
    });
  });
  it("does not present an unknown provider balance as zero", () => {
    const account = { ...base, source: "open_finance" as const };
    expect(
      relationshipOverview(data(account), account).balanceCents,
    ).toBeNull();
  });
  it("shows credit without a debit account for a standalone card", () => {
    const account = {
      ...base,
      hasLinkedAccount: false,
      creditLimitCents: 200000,
      creditAvailableCents: 150000,
    };
    expect(relationshipOverview(data(account), account)).toMatchObject({
      hasCredit: true,
      hasAccount: false,
      balanceCents: null,
      credit: { total: 200000, used: 50000, available: 150000 },
    });
  });
  it("shows account and credit together without inventing incomplete amounts", () => {
    const account = {
      ...base,
      creditLimitCents: 200000,
      source: "open_finance" as const,
      providerBalanceCents: 0,
    };
    expect(relationshipOverview(data(account), account)).toMatchObject({
      hasCredit: true,
      credit: null,
      hasAccount: true,
      balanceCents: 0,
    });
  });
});
