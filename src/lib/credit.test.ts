import { describe, expect, it } from "vitest";
import { creditOverview } from "./credit";
import type { Account, FinanceData } from "./model";
import { accountSchema } from "./schemas";

const account = (id: string, fields: Partial<Account> = {}): Account => ({
  id,
  name: id,
  institution: "Banco",
  kind: "checking",
  openingBalanceCents: 500000,
  color: "#176e55",
  active: true,
  ...fields,
});
const data = (...accounts: Account[]): FinanceData => ({
  accounts,
  benefits: [],
  transactions: [],
});

describe("credit overview", () => {
  it("hides credit when no limit data exists", () => {
    expect(creditOverview(data(account("cash")))).toBeNull();
  });

  it("derives used credit from provider available credit, independently of cash", () => {
    const result = creditOverview(
      data(
        account("one", {
          creditLimitCents: 1250000,
          creditAvailableCents: 926000,
          creditUsedCents: 114000,
        }),
      ),
    );
    expect(result).toMatchObject({
      totalCents: 1250000,
      availableCents: 926000,
      usedCents: 324000,
      knownLines: 1,
      incompleteLines: 0,
    });
    expect(result?.usagePercentage).toBeCloseTo(25.92);
  });

  it("derives available credit from an explicit used amount", () => {
    expect(
      creditOverview(
        data(
          account("one", { creditLimitCents: 500000, creditUsedCents: 230000 }),
        ),
      )?.availableCents,
    ).toBe(270000);
  });

  it("counts shared limits once and reports incomplete lines", () => {
    const result = creditOverview(
      data(
        account("primary", {
          creditLineId: "shared",
          creditLimitCents: 1000000,
          creditAvailableCents: 700000,
        }),
        account("additional", {
          creditLineId: "shared",
          creditLimitCents: 1000000,
          creditAvailableCents: 700000,
        }),
        account("other", { creditLimitCents: 200000 }),
      ),
    );
    expect(result).toMatchObject({
      totalCents: 1000000,
      usedCents: 300000,
      knownLines: 1,
      incompleteLines: 1,
    });
  });

  it("distinguishes a known zero limit from missing data", () => {
    expect(
      creditOverview(
        data(account("zero", { creditLimitCents: 0, creditAvailableCents: 0 })),
      ),
    ).toMatchObject({ totalCents: 0, availableCents: 0, usagePercentage: 0 });
  });

  it("ignores invalid and inactive credit lines", () => {
    expect(
      creditOverview(
        data(
          account("invalid", {
            creditLimitCents: 500000,
            creditAvailableCents: 600000,
          }),
          account("inactive", {
            active: false,
            creditLimitCents: 500000,
            creditAvailableCents: 400000,
          }),
        ),
      ),
    ).toBeNull();
  });

  it("validates optional manual credit as a complete pair", () => {
    const base = {
      name: "Conta manual",
      institution: "Banco",
      kind: "checking",
      openingBalance: "500",
      color: "#176e55",
    };
    expect(accountSchema.safeParse(base).success).toBe(true);
    expect(
      accountSchema.safeParse({
        ...base,
        creditLimit: "5.000,00",
        creditAvailable: "2.700,00",
      }).data,
    ).toMatchObject({ creditLimit: 500000, creditAvailable: 270000 });
    expect(
      accountSchema.safeParse({ ...base, creditLimit: "5.000,00" }).success,
    ).toBe(false);
    expect(
      accountSchema.safeParse({
        ...base,
        creditLimit: "5.000,00",
        creditAvailable: "5.100,00",
      }).success,
    ).toBe(false);
  });
});
