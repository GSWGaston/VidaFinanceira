import { describe, expect, it } from "vitest";
import { balanceFor, categoryExpenses, dashboardTotals } from "./finance";
import { formatMoney, parseMoney } from "./money";
import type { FinanceData } from "./model";
const data: FinanceData = {
  accounts: [
    {
      id: "account",
      name: "Conta",
      institution: "Banco",
      kind: "checking",
      openingBalanceCents: 10000,
      color: "#176e55",
      active: true,
    },
  ],
  benefits: [
    {
      id: "benefit",
      name: "VA",
      company: "Empresa",
      kind: "va",
      openingBalanceCents: 5000,
      monthlyCreditCents: 0,
      creditDay: null,
      active: true,
    },
  ],
  transactions: [
    {
      id: "1",
      description: "Salário",
      amountCents: 20000,
      type: "income",
      date: "2026-09-05",
      category: "Salário",
      accountId: "account",
      benefitId: null,
      createdAt: "2026-09-05",
    },
    {
      id: "2",
      description: "Mercado",
      amountCents: 1250,
      type: "expense",
      date: "2026-09-10",
      category: "Alimentação",
      accountId: null,
      benefitId: "benefit",
      createdAt: "2026-09-10",
    },
    {
      id: "3",
      description: "Combustível",
      amountCents: 3000,
      type: "expense",
      date: "2026-08-20",
      category: "Automóvel",
      accountId: "account",
      benefitId: null,
      createdAt: "2026-08-20",
    },
  ],
};
describe("money", () => {
  it("parses BRL without floating point arithmetic", () => {
    expect(parseMoney("1.234,56")).toBe(123456);
    expect(parseMoney("0,01")).toBe(1);
    expect(formatMoney(123456)).toContain("1.234,56");
  });
  it("rejects fractions beyond cents", () =>
    expect(() => parseMoney("1,001")).toThrow());
});
describe("financial summaries", () => {
  it("keeps restricted benefits separate from cash", () => {
    expect(balanceFor(data, "account", "account")).toBe(27000);
    expect(balanceFor(data, "benefit", "benefit")).toBe(3750);
    expect(dashboardTotals(data, new Date(2026, 8, 15))).toEqual({
      balance: 27000,
      benefits: 3750,
      income: 20000,
      expense: 1250,
      result: 18750,
    });
  });
  it("groups only expenses within the selected month", () => {
    expect(categoryExpenses(data.transactions, "2026-09")).toEqual([
      { name: "Alimentação", amountCents: 1250 },
    ]);
  });
});
