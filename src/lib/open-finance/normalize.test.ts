import { describe, expect, it } from "vitest";
import { balanceFor, dashboardTotals } from "../finance";
import {
  normalizeAccount,
  normalizeTransaction,
  toCents,
  transactionFingerprint,
} from "./normalize";

const userId = "00000000-0000-4000-8000-000000000001";
const connectionId = "00000000-0000-4000-8000-000000000002";
const externalAccountId = "00000000-0000-4000-8000-000000000003";
describe("Pluggy normalization", () => {
  it("converts BRL values to integer cents and rejects unsafe values", () => {
    expect(toCents(123.45)).toBe(12345);
    expect(toCents(-0.01)).toBe(-1);
    expect(() => toCents(1.005)).toThrow("INVALID_PRECISION");
    expect(() => toCents(Number.MAX_VALUE)).toThrow();
  });
  it("maps a bank account and keeps its balance as a provider snapshot", () => {
    const account = normalizeAccount(
      {
        id: externalAccountId,
        itemId: connectionId,
        type: "BANK",
        subtype: "CHECKING_ACCOUNT",
        name: "Conta",
        balance: 100.25,
        currencyCode: "BRL",
      },
      userId,
      connectionId,
      "Pluggy Bank",
    );
    expect(account?.provider_balance_cents).toBe(10025);
    expect(account?.kind).toBe("checking");
    expect(
      normalizeAccount(
        {
          id: externalAccountId,
          itemId: connectionId,
          type: "BANK",
          name: "USD",
          balance: 10,
          currencyCode: "USD",
        },
        userId,
        connectionId,
        "Banco",
      ),
    ).toBeNull();
  });
  it("maps signed transactions and feeds the common dashboard without double counting balance", () => {
    const imported = normalizeTransaction(
      {
        id: crypto.randomUUID(),
        accountId: externalAccountId,
        description: "Mercado",
        amount: -12.5,
        date: "2026-09-20",
        currencyCode: "BRL",
      },
      userId,
      externalAccountId,
      "Alimentação",
      false,
    )!;
    expect(imported).toMatchObject({
      amount_cents: 1250,
      type: "expense",
      date: "2026-09-20",
    });
    const account = {
      id: externalAccountId,
      name: "Conta",
      institution: "Pluggy Bank",
      kind: "checking" as const,
      openingBalanceCents: 0,
      color: "#176e55",
      active: true,
      source: "open_finance" as const,
      providerBalanceCents: 10025,
    };
    const data = {
      accounts: [account],
      benefits: [],
      transactions: [
        {
          id: imported.id,
          description: imported.description,
          amountCents: imported.amount_cents,
          type: imported.type,
          date: imported.date,
          category: imported.category,
          accountId: account.id,
          benefitId: null,
          createdAt: "2026-09-20",
          source: "open_finance" as const,
        },
      ],
    };
    expect(balanceFor(data, account.id, "account")).toBe(10025);
    expect(dashboardTotals(data, new Date(2026, 8, 25))).toMatchObject({
      balance: 10025,
      expense: 1250,
    });
  });
  it("uses a stable fingerprint across case and accent differences", () => {
    expect(
      transactionFingerprint(
        externalAccountId,
        "2026-09-20",
        -1250,
        "  CAFÉ  ",
      ),
    ).toBe(
      transactionFingerprint(externalAccountId, "2026-09-20", -1250, "cafe"),
    );
  });
});
