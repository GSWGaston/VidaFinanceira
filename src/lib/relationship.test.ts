import { describe, expect, it } from "vitest";
import type { Account, FinanceData, Transaction } from "./model";
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
const transaction = (source?: Transaction["source"]): Transaction => ({
  id: "tx",
  description: "Compra",
  amountCents: 1000,
  type: "expense",
  date: "2026-10-05",
  category: "Compras",
  accountId: "a",
  benefitId: null,
  createdAt: "2026-10-05",
  source,
});

describe("selected financial relationship", () => {
  it("shows a real zero balance on a manual account without credit", () => {
    expect(relationshipOverview(data(base), base)).toMatchObject({
      hasCredit: false,
      hasAccount: true,
      balanceCents: 0,
      debitMovementsCount: 0,
      creditMovementsCount: null,
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
      creditMovementsCount: 0,
      debitMovementsCount: null,
    });
  });
  it("counts manual account movements as debit when credit is also available", () => {
    const account = {
      ...base,
      creditLimitCents: 200000,
      creditAvailableCents: 150000,
    };
    const records = { ...data(account), transactions: [transaction("manual")] };
    expect(relationshipOverview(records, account)).toMatchObject({
      creditMovementsCount: 0,
      debitMovementsCount: 1,
    });
  });
  it("keeps mixed provider movements unclassified", () => {
    const account = {
      ...base,
      creditLimitCents: 200000,
      creditAvailableCents: 150000,
      source: "open_finance" as const,
    };
    const records = {
      ...data(account),
      transactions: [transaction("open_finance")],
    };
    expect(relationshipOverview(records, account)).toMatchObject({
      creditMovementsCount: null,
      debitMovementsCount: null,
    });
  });
  it("counts linked records as credit for a standalone card", () => {
    const account = {
      ...base,
      hasLinkedAccount: false,
      creditLimitCents: 200000,
      creditAvailableCents: 150000,
    };
    const records = {
      ...data(account),
      transactions: [transaction("open_finance")],
    };
    expect(relationshipOverview(records, account)).toMatchObject({
      creditMovementsCount: 1,
      debitMovementsCount: null,
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
