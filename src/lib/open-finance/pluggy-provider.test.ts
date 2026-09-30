import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { PluggyProvider } from "./pluggy-provider";

const itemId = "00000000-0000-4000-8000-000000000001";
const accountId = "00000000-0000-4000-8000-000000000002";
const transactionId = "00000000-0000-4000-8000-000000000003";
const json = (body: object) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

describe("Pluggy HTTP provider", () => {
  it("caches the API key and follows account pages and transaction cursors", async () => {
    const paths: string[] = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      paths.push(url.pathname + url.search);
      if (url.pathname === "/auth") return json({ apiKey: "server-key" });
      if (url.pathname === "/accounts")
        return json({
          page: Number(url.searchParams.get("page")),
          totalPages: 2,
          results:
            Number(url.searchParams.get("page")) === 1
              ? [
                  {
                    id: accountId,
                    itemId,
                    type: "BANK",
                    name: "Conta",
                    balance: 10,
                  },
                ]
              : [],
        });
      if (url.pathname === "/v2/transactions")
        return json({
          results: url.searchParams.has("after")
            ? []
            : [
                {
                  id: transactionId,
                  accountId,
                  description: "Compra",
                  amount: -1,
                  date: "2026-09-01",
                  category: "Compras",
                },
              ],
          next: url.searchParams.has("after")
            ? null
            : `?accountId=${accountId}&after=cursor`,
        });
      throw new Error("Unexpected URL");
    });
    const provider = new PluggyProvider(
      "id",
      "secret",
      fetcher as typeof fetch,
    );
    expect(await provider.getAccounts(itemId)).toHaveLength(1);
    expect(
      await provider.getTransactions(accountId, { dateFrom: "2026-01-01" }),
    ).toHaveLength(1);
    expect(paths.filter((path) => path === "/auth")).toHaveLength(1);
    expect(paths.filter((path) => path.startsWith("/accounts"))).toHaveLength(
      2,
    );
    expect(
      paths.filter((path) => path.startsWith("/v2/transactions")),
    ).toHaveLength(2);
  });
});
