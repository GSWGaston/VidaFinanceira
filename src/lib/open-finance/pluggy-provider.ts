import "server-only";
import { z } from "zod";
import type {
  OpenFinanceProvider,
  ProviderAccount,
  ProviderItem,
  ProviderTransaction,
} from "./types";

const baseUrl = "https://api.pluggy.ai";
const itemSchema = z.object({
  id: z.string().uuid(),
  clientUserId: z.string().nullable().optional(),
  status: z.string(),
  executionStatus: z.string().nullable().optional(),
  connector: z.object({
    id: z.number(),
    name: z.string(),
    imageUrl: z.string().nullable().optional(),
    isSandbox: z.boolean().optional(),
  }),
  error: z.object({ code: z.string().optional() }).nullable().optional(),
});
const accountSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  type: z.string(),
  subtype: z.string().nullable().optional(),
  name: z.string(),
  marketingName: z.string().nullable().optional(),
  balance: z.number(),
  currencyCode: z.string().nullable().optional(),
});
const transactionSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  description: z.string(),
  amount: z.number(),
  date: z.string(),
  category: z.string().nullable().optional(),
  currencyCode: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
});
const pageSchema = <T extends z.ZodType>(row: T) =>
  z.object({ page: z.number(), totalPages: z.number(), results: z.array(row) });
const cursorSchema = z.object({
  results: z.array(transactionSchema),
  next: z.string().nullable(),
});

export class PluggyError extends Error {
  constructor(
    public code: string,
    public httpStatus = 502,
  ) {
    super(code);
  }
}
export class PluggyProvider implements OpenFinanceProvider {
  private apiKey: string | null = null;
  private apiKeyExpiresAt = 0;
  private pendingKey: Promise<string> | null = null;
  constructor(
    private clientId: string,
    private clientSecret: string,
    private fetcher: typeof fetch = fetch,
  ) {}
  private async getApiKey(): Promise<string> {
    if (this.apiKey && Date.now() < this.apiKeyExpiresAt) return this.apiKey;
    if (this.pendingKey) return this.pendingKey;
    this.pendingKey = (async () => {
      const response = await this.fetcher(`${baseUrl}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: this.clientId,
          clientSecret: this.clientSecret,
        }),
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
      if (!response.ok) throw new PluggyError("AUTH_FAILED", 502);
      const parsed = z
        .object({ apiKey: z.string().min(1) })
        .parse(await response.json());
      this.apiKey = parsed.apiKey;
      this.apiKeyExpiresAt = Date.now() + 110 * 60 * 1000;
      return parsed.apiKey;
    })().finally(() => {
      this.pendingKey = null;
    });
    return this.pendingKey;
  }
  private async request<T extends z.ZodType>(
    path: string,
    schema: T,
    init: RequestInit = {},
    retry = true,
  ): Promise<z.infer<T>> {
    const key = await this.getApiKey();
    const response = await this.fetcher(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": key,
        ...init.headers,
      },
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });
    if (response.status === 401 && retry) {
      this.apiKey = null;
      this.apiKeyExpiresAt = 0;
      return this.request(path, schema, init, false);
    }
    if (!response.ok) {
      const safeCode =
        response.status === 404
          ? "NOT_FOUND"
          : response.status === 429
            ? "RATE_LIMITED"
            : "PROVIDER_ERROR";
      throw new PluggyError(safeCode, response.status);
    }
    return schema.parse(await response.json());
  }
  async createConnectToken(userId: string, itemId?: string): Promise<string> {
    const payload = {
      ...(itemId ? { itemId } : {}),
      options: { clientUserId: userId, avoidDuplicates: true },
    };
    const result = await this.request(
      "/connect_token",
      z.object({ accessToken: z.string().min(1) }),
      { method: "POST", body: JSON.stringify(payload) },
    );
    return result.accessToken;
  }
  async getItem(itemId: string): Promise<ProviderItem> {
    const item = await this.request(
      `/items/${encodeURIComponent(itemId)}`,
      itemSchema,
    );
    return {
      ...item,
      clientUserId: item.clientUserId ?? null,
      executionStatus: item.executionStatus ?? null,
    };
  }
  async getAccounts(itemId: string): Promise<ProviderAccount[]> {
    const results: ProviderAccount[] = [];
    for (let page = 1; page <= 100; page++) {
      const params = new URLSearchParams({
        itemId,
        type: "BANK",
        page: String(page),
      });
      const response = await this.request(
        `/accounts?${params}`,
        pageSchema(accountSchema),
      );
      results.push(...response.results);
      if (page >= response.totalPages) return results;
    }
    throw new PluggyError("PAGINATION_LIMIT");
  }
  async getTransactions(
    accountId: string,
    filter: { dateFrom?: string; createdAtFrom?: string; ids?: string[] },
  ): Promise<ProviderTransaction[]> {
    const results: ProviderTransaction[] = [];
    let next: string | null =
      `?${new URLSearchParams({ accountId, ...(filter.dateFrom ? { dateFrom: filter.dateFrom } : {}), ...(filter.createdAtFrom ? { createdAtFrom: filter.createdAtFrom } : {}), ...(filter.ids?.length ? { ids: filter.ids.join(",") } : {}) })}`;
    const seen = new Set<string>();
    for (let page = 0; page < 100 && next; page++) {
      if (!next.startsWith("?") || seen.has(next))
        throw new PluggyError("INVALID_CURSOR");
      seen.add(next);
      const response: z.infer<typeof cursorSchema> = await this.request(
        `/v2/transactions${next}`,
        cursorSchema,
      );
      results.push(...response.results);
      next = response.next;
    }
    if (next) throw new PluggyError("PAGINATION_LIMIT");
    return results;
  }
  async disconnectConnection(itemId: string): Promise<void> {
    await this.request(
      `/items/${encodeURIComponent(itemId)}`,
      z.object({ count: z.number() }),
      { method: "DELETE" },
    );
  }
}
let instance: PluggyProvider | null = null;
export function pluggyConfigured(): boolean {
  return Boolean(
    process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET,
  );
}
export function getPluggyProvider(): PluggyProvider {
  if (!pluggyConfigured()) throw new PluggyError("NOT_CONFIGURED", 503);
  if (!instance)
    instance = new PluggyProvider(
      process.env.PLUGGY_CLIENT_ID!,
      process.env.PLUGGY_CLIENT_SECRET!,
    );
  return instance;
}
