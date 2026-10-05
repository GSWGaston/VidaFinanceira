import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Account,
  Benefit,
  FinanceData,
  FinancialConnection,
  Transaction,
} from "./model";
import { emptyFinanceData, removeSampleRecords } from "./local-data";

export interface FinanceRepository {
  load(): Promise<FinanceData>;
  addAccount(item: Account): Promise<void>;
  updateCard(item: Account): Promise<void>;
  removeCard(item: Account): Promise<void>;
  addBenefit(item: Benefit): Promise<void>;
  addTransaction(item: Transaction): Promise<void>;
}
const localKey = "vida-financeira-local-v2";
const oldSampleKey = "vida-financeira-demo-v1";
export class LocalRepository implements FinanceRepository {
  async load(): Promise<FinanceData> {
    try {
      const saved = localStorage.getItem(localKey);
      const oldData = localStorage.getItem(oldSampleKey);
      if (saved) {
        if (oldData) localStorage.removeItem(oldSampleKey);
        return JSON.parse(saved) as FinanceData;
      }
      if (!oldData) return emptyFinanceData();
      const cleaned = removeSampleRecords(JSON.parse(oldData) as FinanceData);
      localStorage.setItem(localKey, JSON.stringify(cleaned));
      localStorage.removeItem(oldSampleKey);
      return cleaned;
    } catch {
      try {
        localStorage.removeItem(oldSampleKey);
      } catch {
        // Storage can be unavailable in private browsing contexts.
      }
      return emptyFinanceData();
    }
  }
  private async save(
    kind: keyof FinanceData,
    item: Account | Benefit | Transaction,
  ) {
    const data = await this.load();
    (data[kind] as (Account | Benefit | Transaction)[]).push(item);
    localStorage.setItem(localKey, JSON.stringify(data));
  }
  addAccount(item: Account) {
    return this.save("accounts", item);
  }
  async updateCard(item: Account) {
    const data = await this.load();
    const index = data.accounts.findIndex(
      (account) =>
        account.id === item.id &&
        (!account.source || account.source === "manual"),
    );
    if (index < 0) throw new Error("Cartão manual não encontrado.");
    data.accounts[index] = item;
    localStorage.setItem(localKey, JSON.stringify(data));
  }
  async removeCard(item: Account) {
    const data = await this.load();
    const account = data.accounts.find(
      (entry) =>
        entry.id === item.id && (!entry.source || entry.source === "manual"),
    );
    if (!account) throw new Error("Cartão manual não encontrado.");
    Object.assign(account, {
      creditLimitCents: null,
      creditAvailableCents: null,
      creditUsedCents: null,
      creditLineId: null,
    });
    if (account.hasLinkedAccount === false) account.active = false;
    localStorage.setItem(localKey, JSON.stringify(data));
  }
  addBenefit(item: Benefit) {
    return this.save("benefits", item);
  }
  addTransaction(item: Transaction) {
    return this.save("transactions", item);
  }
}
export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
export const supabase = supabaseConfigured
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    )
  : null;
type AccountRow = {
  id: string;
  name: string;
  institution: string;
  institution_id?: string | null;
  has_linked_account?: boolean;
  kind: Account["kind"];
  opening_balance_cents: number;
  color: string;
  active: boolean;
  source: Account["source"];
  financial_connection_id: string | null;
  external_id: string | null;
  provider_balance_cents: number | null;
  last_synced_at: string | null;
  credit_limit_cents?: number | null;
  credit_available_cents?: number | null;
  credit_used_cents?: number | null;
  credit_line_id?: string | null;
};
type ConnectionRow = {
  id: string;
  provider_item_id: string;
  institution_name: string;
  is_sandbox: boolean;
  status: FinancialConnection["status"];
  last_sync_at: string | null;
};
type BenefitRow = {
  id: string;
  name: string;
  company: string;
  kind: Benefit["kind"];
  opening_balance_cents: number;
  monthly_credit_cents: number;
  credit_day: number | null;
  active: boolean;
};
type TransactionRow = {
  id: string;
  description: string;
  amount_cents: number;
  type: Transaction["type"];
  date: string;
  category: string;
  account_id: string | null;
  benefit_id: string | null;
  created_at: string;
  source: Transaction["source"];
  possible_duplicate: boolean;
};
export class SupabaseRepository implements FinanceRepository {
  constructor(
    private client: SupabaseClient,
    private userId: string,
  ) {}
  async load(): Promise<FinanceData> {
    const accountColumns =
      "id,name,institution,kind,opening_balance_cents,color,active,source,financial_connection_id,external_id,provider_balance_cents,last_synced_at";
    const loadAccounts = async () => {
      const result = await this.client
        .from("accounts")
        .select(
          `${accountColumns},institution_id,has_linked_account,credit_limit_cents,credit_available_cents,credit_used_cents,credit_line_id`,
        )
        .order("created_at");
      // Existing deployments remain readable until the migration is applied.
      if (result.error?.code === "42703" || result.error?.code === "PGRST204") {
        const legacy = await this.client
          .from("accounts")
          .select(
            `${accountColumns},credit_limit_cents,credit_available_cents,credit_used_cents,credit_line_id`,
          )
          .order("created_at");
        if (!legacy.error) return legacy;
        if (legacy.error.code === "42703" || legacy.error.code === "PGRST204")
          return this.client
            .from("accounts")
            .select(accountColumns)
            .order("created_at");
        return legacy;
      }
      return result;
    };
    const [accounts, benefits, transactions, connections] = await Promise.all([
      loadAccounts(),
      this.client
        .from("benefit_accounts")
        .select(
          "id,name,company,kind,opening_balance_cents,monthly_credit_cents,credit_day,active",
        )
        .order("created_at"),
      this.client
        .from("transactions")
        .select(
          "id,description,amount_cents,type,date,category,account_id,benefit_id,created_at,source,possible_duplicate",
        )
        .eq("provider_deleted", false)
        .order("date", { ascending: false }),
      this.client
        .from("financial_connections")
        .select(
          "id,provider_item_id,institution_name,is_sandbox,status,last_sync_at",
        )
        .order("created_at", { ascending: false }),
    ]);
    const error =
      accounts.error ??
      benefits.error ??
      transactions.error ??
      connections.error;
    if (error) throw error;
    return {
      accounts: ((accounts.data ?? []) as AccountRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        institution: row.institution,
        institutionId: row.institution_id ?? null,
        hasLinkedAccount: row.has_linked_account ?? true,
        kind: row.kind,
        openingBalanceCents: row.opening_balance_cents,
        color: row.color,
        active: row.active,
        source: row.source,
        connectionId: row.financial_connection_id,
        externalId: row.external_id,
        providerBalanceCents: row.provider_balance_cents,
        lastSyncedAt: row.last_synced_at,
        creditLimitCents: row.credit_limit_cents ?? null,
        creditAvailableCents: row.credit_available_cents ?? null,
        creditUsedCents: row.credit_used_cents ?? null,
        creditLineId: row.credit_line_id ?? null,
      })),
      benefits: ((benefits.data ?? []) as BenefitRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        company: row.company,
        kind: row.kind,
        openingBalanceCents: row.opening_balance_cents,
        monthlyCreditCents: row.monthly_credit_cents,
        creditDay: row.credit_day,
        active: row.active,
      })),
      transactions: ((transactions.data ?? []) as TransactionRow[]).map(
        (row) => ({
          id: row.id,
          description: row.description,
          amountCents: row.amount_cents,
          type: row.type,
          date: row.date,
          category: row.category,
          accountId: row.account_id,
          benefitId: row.benefit_id,
          createdAt: row.created_at,
          source: row.source,
          possibleDuplicate: row.possible_duplicate,
        }),
      ),
      connections: ((connections.data ?? []) as ConnectionRow[]).map((row) => ({
        id: row.id,
        providerItemId: row.provider_item_id,
        institutionName: row.institution_name,
        isSandbox: row.is_sandbox,
        status: row.status,
        lastSyncAt: row.last_sync_at,
      })),
    };
  }
  async addAccount(item: Account) {
    const { error } = await this.client.from("accounts").insert({
      id: item.id,
      user_id: this.userId,
      name: item.name,
      institution: item.institution,
      ...(item.institutionId && { institution_id: item.institutionId }),
      has_linked_account: item.hasLinkedAccount ?? true,
      kind: item.kind,
      opening_balance_cents: item.openingBalanceCents,
      color: item.color,
      active: item.active,
      ...(item.creditLimitCents != null && {
        credit_limit_cents: item.creditLimitCents,
      }),
      ...(item.creditAvailableCents != null && {
        credit_available_cents: item.creditAvailableCents,
      }),
      ...(item.creditUsedCents != null && {
        credit_used_cents: item.creditUsedCents,
      }),
      ...(item.creditLineId && { credit_line_id: item.creditLineId }),
    });
    if (error) throw error;
  }
  async updateCard(item: Account) {
    const { data, error } = await this.client
      .from("accounts")
      .update({
        name: item.name,
        institution: item.institution,
        institution_id: item.institutionId ?? null,
        has_linked_account: item.hasLinkedAccount ?? true,
        kind: item.kind,
        opening_balance_cents: item.openingBalanceCents,
        color: item.color,
        credit_limit_cents: item.creditLimitCents,
        credit_available_cents: item.creditAvailableCents,
        credit_used_cents: null,
      })
      .eq("id", item.id)
      .eq("user_id", this.userId)
      .eq("source", "manual")
      .select("id")
      .single();
    if (error) throw error;
    if (!data) throw new Error("Cartão manual não encontrado.");
  }
  async removeCard(item: Account) {
    const { data, error } = await this.client
      .from("accounts")
      .update({
        credit_limit_cents: null,
        credit_available_cents: null,
        credit_used_cents: null,
        credit_line_id: null,
        ...(item.hasLinkedAccount === false && { active: false }),
      })
      .eq("id", item.id)
      .eq("user_id", this.userId)
      .eq("source", "manual")
      .select("id")
      .single();
    if (error) throw error;
    if (!data) throw new Error("Cartão manual não encontrado.");
  }
  async addBenefit(item: Benefit) {
    const { error } = await this.client.from("benefit_accounts").insert({
      id: item.id,
      user_id: this.userId,
      name: item.name,
      company: item.company,
      kind: item.kind,
      opening_balance_cents: item.openingBalanceCents,
      monthly_credit_cents: item.monthlyCreditCents,
      credit_day: item.creditDay,
      active: item.active,
    });
    if (error) throw error;
  }
  async addTransaction(item: Transaction) {
    const { error } = await this.client.from("transactions").insert({
      id: item.id,
      user_id: this.userId,
      description: item.description,
      amount_cents: item.amountCents,
      type: item.type,
      date: item.date,
      category: item.category,
      account_id: item.accountId,
      benefit_id: item.benefitId,
    });
    if (error) throw error;
  }
}
