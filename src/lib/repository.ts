import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Account, Benefit, FinanceData, Transaction } from "./model";
import { emptyFinanceData, removeSampleRecords } from "./local-data";

export interface FinanceRepository {
  load(): Promise<FinanceData>;
  addAccount(item: Account): Promise<void>;
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
  kind: Account["kind"];
  opening_balance_cents: number;
  color: string;
  active: boolean;
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
};
export class SupabaseRepository implements FinanceRepository {
  constructor(
    private client: SupabaseClient,
    private userId: string,
  ) {}
  async load(): Promise<FinanceData> {
    const [accounts, benefits, transactions] = await Promise.all([
      this.client
        .from("accounts")
        .select("id,name,institution,kind,opening_balance_cents,color,active")
        .order("created_at"),
      this.client
        .from("benefit_accounts")
        .select(
          "id,name,company,kind,opening_balance_cents,monthly_credit_cents,credit_day,active",
        )
        .order("created_at"),
      this.client
        .from("transactions")
        .select(
          "id,description,amount_cents,type,date,category,account_id,benefit_id,created_at",
        )
        .order("date", { ascending: false }),
    ]);
    const error = accounts.error ?? benefits.error ?? transactions.error;
    if (error) throw error;
    return {
      accounts: ((accounts.data ?? []) as AccountRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        institution: row.institution,
        kind: row.kind,
        openingBalanceCents: row.opening_balance_cents,
        color: row.color,
        active: row.active,
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
        }),
      ),
    };
  }
  async addAccount(item: Account) {
    const { error } = await this.client.from("accounts").insert({
      id: item.id,
      user_id: this.userId,
      name: item.name,
      institution: item.institution,
      kind: item.kind,
      opening_balance_cents: item.openingBalanceCents,
      color: item.color,
      active: item.active,
    });
    if (error) throw error;
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
