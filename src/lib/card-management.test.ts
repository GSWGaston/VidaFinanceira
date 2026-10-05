import { afterEach, describe, expect, it } from "vitest";
import { LocalRepository } from "./repository";
import type { Account, Transaction } from "./model";

const values = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  },
});
afterEach(() => values.clear());

const card: Account = {
  id: "card-1",
  name: "Cartão",
  institution: "Nubank",
  institutionId: "nubank",
  kind: "checking",
  openingBalanceCents: 5000,
  color: "#731cc2",
  active: true,
  source: "manual",
  creditLimitCents: 200000,
  creditAvailableCents: 150000,
};
const transaction: Transaction = {
  id: "tx-1",
  description: "Compra",
  amountCents: 1200,
  type: "expense",
  date: "2026-10-05",
  category: "Compras",
  accountId: card.id,
  benefitId: null,
  createdAt: "2026-10-05",
};

describe("manual card management", () => {
  it("edits a card and removes its credit while preserving the account and transactions", async () => {
    const repo = new LocalRepository();
    await repo.addAccount(card);
    await repo.addTransaction(transaction);
    await repo.updateCard({
      ...card,
      name: "Cartão revisado",
      creditAvailableCents: 100000,
    });
    expect((await repo.load()).accounts[0].creditAvailableCents).toBe(100000);
    await repo.removeCard(card);
    const data = await repo.load();
    expect(data.accounts[0]).toMatchObject({
      id: card.id,
      name: "Cartão revisado",
      openingBalanceCents: 5000,
      creditLimitCents: null,
      creditAvailableCents: null,
    });
    expect(data.transactions).toEqual([transaction]);
  });

  it("rejects edits to provider-owned cards", async () => {
    const repo = new LocalRepository();
    await repo.addAccount({ ...card, source: "open_finance" });
    await expect(repo.removeCard(card)).rejects.toThrow();
    await expect(repo.updateCard(card)).rejects.toThrow();
  });
  it("hides a removed standalone card without deleting its history", async () => {
    const repo = new LocalRepository();
    const standalone = { ...card, hasLinkedAccount: false };
    await repo.addAccount(standalone);
    await repo.addTransaction(transaction);
    await repo.removeCard(standalone);
    const saved = await repo.load();
    expect(saved.accounts[0]).toMatchObject({
      id: card.id,
      active: false,
      creditLimitCents: null,
    });
    expect(saved.transactions).toEqual([transaction]);
  });
});
