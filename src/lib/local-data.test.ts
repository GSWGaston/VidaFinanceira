import { describe, expect, it } from "vitest";
import { emptyFinanceData, removeSampleRecords } from "./local-data";
import type { FinanceData } from "./model";

describe("local data cleanup", () => {
  it("starts without preloaded financial records", () => {
    expect(emptyFinanceData()).toEqual({
      accounts: [],
      benefits: [],
      transactions: [],
    });
  });
  it("removes sample records and keeps independent user records", () => {
    const data: FinanceData = {
      accounts: [
        {
          id: "demo-bank",
          name: "Example",
          institution: "Example",
          kind: "checking",
          openingBalanceCents: 100,
          color: "#176e55",
          active: true,
        },
        {
          id: "user-bank",
          name: "My account",
          institution: "My bank",
          kind: "checking",
          openingBalanceCents: 500,
          color: "#176e55",
          active: true,
        },
      ],
      benefits: [],
      transactions: [
        {
          id: "demo-tx",
          description: "Example",
          amountCents: 100,
          type: "expense",
          date: "2026-09-01",
          category: "Outros",
          accountId: "demo-bank",
          benefitId: null,
          createdAt: "2026-09-01",
        },
        {
          id: "user-tx",
          description: "Mine",
          amountCents: 100,
          type: "expense",
          date: "2026-09-01",
          category: "Outros",
          accountId: "user-bank",
          benefitId: null,
          createdAt: "2026-09-01",
        },
        {
          id: "user-on-demo",
          description: "Linked to sample",
          amountCents: 100,
          type: "expense",
          date: "2026-09-01",
          category: "Outros",
          accountId: "demo-bank",
          benefitId: null,
          createdAt: "2026-09-01",
        },
      ],
    };
    const cleaned = removeSampleRecords(data);
    expect(cleaned.accounts.map((item) => item.id)).toEqual(["user-bank"]);
    expect(cleaned.transactions.map((item) => item.id)).toEqual(["user-tx"]);
  });
});
