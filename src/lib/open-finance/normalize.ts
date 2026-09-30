import { createHash } from "node:crypto";
import type { ProviderAccount, ProviderTransaction } from "./types";

export function toCents(value: number): number {
  if (!Number.isFinite(value)) throw new Error("INVALID_AMOUNT");
  const parts = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(Math.abs(value)));
  if (!parts) throw new Error("INVALID_PRECISION");
  const cents =
    Number(parts[1]) * 100 + Number((parts[2] ?? "").padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) throw new Error("AMOUNT_OUT_OF_RANGE");
  return value < 0 ? -cents : cents;
}

export function normalizeAccount(
  account: ProviderAccount,
  userId: string,
  connectionId: string,
  institution: string,
) {
  if (account.currencyCode && account.currencyCode !== "BRL") return null;
  const subtype = (account.subtype ?? "").toUpperCase();
  const kind = subtype.includes("SAVINGS")
    ? "savings"
    : subtype.includes("CHECKING")
      ? "checking"
      : "digital";
  const name = (account.marketingName || account.name).trim();
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    financial_connection_id: connectionId,
    external_id: account.id,
    source: "open_finance",
    provider: "pluggy",
    name: (name.length >= 2 ? name : "Conta bancária").slice(0, 80),
    institution: (institution.trim().length >= 2
      ? institution.trim()
      : "Instituição financeira"
    ).slice(0, 80),
    kind,
    opening_balance_cents: 0,
    provider_balance_cents: toCents(account.balance),
    currency_code: "BRL",
    color: "#176e55",
    active: true,
    last_synced_at: new Date().toISOString(),
  };
}

export function transactionFingerprint(
  accountId: string,
  date: string,
  signedCents: number,
  description: string,
) {
  const normalized = description
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256")
    .update(`${accountId}|${date}|${signedCents}|${normalized}`)
    .digest("hex");
}

export function normalizeTransaction(
  transaction: ProviderTransaction,
  userId: string,
  accountId: string,
  category: string,
  possibleDuplicate: boolean,
) {
  if (transaction.currencyCode && transaction.currencyCode !== "BRL")
    return null;
  if (transaction.status?.toUpperCase() === "PENDING") return null;
  const signedCents = toCents(transaction.amount);
  if (signedCents === 0) return null;
  const date = transaction.date.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("INVALID_DATE");
  const rawDescription = transaction.description.trim();
  const description = (
    rawDescription.length >= 2 ? rawDescription : "Lançamento bancário"
  ).slice(0, 120);
  const safeCategory =
    category.trim().length >= 2 ? category.trim() : "Sem categoria";
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    account_id: accountId,
    external_id: transaction.id,
    description,
    amount_cents: Math.abs(signedCents),
    type: (signedCents > 0 ? "income" : "expense") as "income" | "expense",
    date,
    category: safeCategory.slice(0, 80),
    fingerprint: transactionFingerprint(
      accountId,
      date,
      signedCents,
      description,
    ),
    possible_duplicate: possibleDuplicate,
  };
}
