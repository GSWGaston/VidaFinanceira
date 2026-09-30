export function parseMoney(value: string): number {
  const normalized = value
    .trim()
    .replace(/\s/g, "")
    .replace(/^R\$/, "")
    .replace(/\./g, "")
    .replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized))
    throw new Error("Informe um valor válido com até duas casas decimais.");
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents < 0)
    throw new Error("Informe um valor válido.");
  return cents;
}
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
export function signedAmount(transaction: {
  type: "income" | "expense";
  amountCents: number;
}): number {
  return transaction.type === "income"
    ? transaction.amountCents
    : -transaction.amountCents;
}
export function sumCents(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
