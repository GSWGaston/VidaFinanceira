import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AccessError, adminClient } from "./server-auth";
import { getPluggyProvider, PluggyError } from "./pluggy-provider";
import {
  normalizeAccount,
  normalizeTransaction,
  transactionFingerprint,
  toCents,
} from "./normalize";

type Connection = {
  id: string;
  user_id: string;
  provider_item_id: string;
  last_sync_at: string | null;
  status: string;
};
function check(error: { message: string } | null) {
  if (error) throw new Error("DATABASE_ERROR");
}
export async function ownedConnection(
  id: string,
  userId: string,
): Promise<Connection> {
  const { data, error } = await adminClient()
    .from("financial_connections")
    .select("id,user_id,provider_item_id,last_sync_at,status")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error || !data || data.status === "disconnected")
    throw new AccessError("NOT_FOUND", 404);
  return data as Connection;
}
function itemStatus(status: string, errorCode?: string) {
  const value = status.toUpperCase();
  if (value === "UPDATING") return "syncing";
  if (errorCode === "USER_AUTHORIZATION_PENDING") return "waiting_user_action";
  if (
    value.includes("WAITING_USER_INPUT") ||
    value.includes("WAITING_USER_PASSWORD")
  )
    return "waiting_user_input";
  if (
    value.includes("WAITING_USER_ACTION") ||
    value.includes("WAITING_USER_AUTHORIZATION")
  )
    return "waiting_user_action";
  if (value.includes("ERROR") || value.includes("OUTDATED")) return "error";
  return "connected";
}
function dateFrom(lastSync: string | null) {
  const date = lastSync ? new Date(lastSync) : new Date();
  date.setUTCDate(date.getUTCDate() - (lastSync ? 45 : 365));
  return date.toISOString().slice(0, 10);
}
async function syncAccounts(
  client: SupabaseClient,
  itemId: string,
  connection: Connection,
  institution: string,
) {
  const providerAccounts = await getPluggyProvider().getAccounts(itemId);
  const rows = providerAccounts
    .map((a) =>
      normalizeAccount(a, connection.user_id, connection.id, institution),
    )
    .filter((a) => a !== null);
  const ids = new Set(rows.map((a) => a.external_id));
  for (const row of rows) {
    const inserted = await client.from("accounts").upsert(row, {
      onConflict: "provider,external_id",
      ignoreDuplicates: true,
    });
    check(inserted.error);
    const updated = await client
      .from("accounts")
      .update({
        name: row.name,
        institution: row.institution,
        kind: row.kind,
        provider_balance_cents: row.provider_balance_cents,
        active: true,
        last_synced_at: row.last_synced_at,
      })
      .eq("provider", "pluggy")
      .eq("external_id", row.external_id)
      .eq("user_id", connection.user_id)
      .eq("financial_connection_id", connection.id);
    check(updated.error);
  }
  const found = await client
    .from("accounts")
    .select("id,external_id")
    .eq("financial_connection_id", connection.id);
  check(found.error);
  for (const old of found.data ?? []) {
    if (old.external_id && !ids.has(old.external_id)) {
      check(
        (
          await client
            .from("accounts")
            .update({ active: false })
            .eq("id", old.id)
            .eq("user_id", connection.user_id)
        ).error,
      );
    }
  }
  return (found.data ?? []).filter(
    (a) => a.external_id && ids.has(a.external_id),
  ) as { id: string; external_id: string }[];
}
async function syncTransactions(
  client: SupabaseClient,
  connection: Connection,
  accounts: { id: string; external_id: string }[],
  event?: {
    accountId?: string;
    transactionIds?: string[];
    createdAtFrom?: string;
  },
) {
  const since = dateFrom(connection.last_sync_at);
  const rulesResult = await client
    .from("categorization_rules")
    .select("pattern,category")
    .eq("user_id", connection.user_id)
    .eq("enabled", true)
    .order("priority", { ascending: false });
  check(rulesResult.error);
  const rules = rulesResult.data ?? [];
  for (const account of accounts) {
    if (event?.accountId && event.accountId !== account.external_id) continue;
    const incoming = [] as Awaited<
      ReturnType<ReturnType<typeof getPluggyProvider>["getTransactions"]>
    >;
    if (event?.transactionIds?.length) {
      for (let index = 0; index < event.transactionIds.length; index += 500)
        incoming.push(
          ...(await getPluggyProvider().getTransactions(account.external_id, {
            ids: event.transactionIds.slice(index, index + 500),
          })),
        );
    } else {
      incoming.push(
        ...(await getPluggyProvider().getTransactions(
          account.external_id,
          event?.createdAtFrom
            ? { createdAtFrom: event.createdAtFrom }
            : { dateFrom: since },
        )),
      );
    }
    const earliest = incoming.reduce(
      (date, transaction) =>
        transaction.date.slice(0, 10) < date
          ? transaction.date.slice(0, 10)
          : date,
      since,
    );
    const manual = await client
      .from("transactions")
      .select("date,amount_cents,type,description")
      .eq("user_id", connection.user_id)
      .eq("account_id", account.id)
      .eq("source", "manual")
      .gte("date", earliest);
    check(manual.error);
    const manualFingerprints = new Set(
      (manual.data ?? []).map((t) =>
        transactionFingerprint(
          account.id,
          t.date,
          t.type === "income" ? t.amount_cents : -t.amount_cents,
          t.description,
        ),
      ),
    );
    const rows = incoming
      .map((t) => {
        const category =
          rules.find((r) =>
            t.description
              .toLocaleLowerCase("pt-BR")
              .includes(r.pattern.toLocaleLowerCase("pt-BR")),
          )?.category ??
          t.category?.trim() ??
          "Sem categoria";
        const signed = toCents(t.amount);
        const fingerprint = transactionFingerprint(
          account.id,
          t.date.slice(0, 10),
          signed,
          t.description,
        );
        return normalizeTransaction(
          t,
          connection.user_id,
          account.id,
          category || "Sem categoria",
          manualFingerprints.has(fingerprint),
        );
      })
      .filter((t) => t !== null);
    for (let index = 0; index < rows.length; index += 200) {
      check(
        (
          await client.rpc("merge_open_finance_transactions", {
            p_rows: rows.slice(index, index + 200),
          })
        ).error,
      );
    }
  }
}
export async function syncItem(
  itemId: string,
  userId?: string,
  event?: {
    accountId?: string;
    transactionIds?: string[];
    createdAtFrom?: string;
  },
) {
  const provider = getPluggyProvider();
  const item = await provider.getItem(itemId);
  const client = adminClient();
  const existing = await client
    .from("financial_connections")
    .select("id,user_id,provider_item_id,last_sync_at,status")
    .eq("provider", "pluggy")
    .eq("provider_item_id", itemId)
    .maybeSingle();
  check(existing.error);
  if (existing.data && userId && existing.data.user_id !== userId)
    throw new AccessError("NOT_FOUND", 404);
  const owner = userId ?? existing.data?.user_id;
  if (!owner || item.clientUserId !== owner)
    throw new AccessError("ITEM_OWNER_MISMATCH", 403);
  if (existing.data?.status === "disconnected")
    throw new AccessError("NOT_FOUND", 404);
  const status = itemStatus(item.status, item.error?.code);
  const base = {
    user_id: owner,
    provider: "pluggy",
    provider_item_id: itemId,
    institution_id: item.connector.id,
    institution_name: item.connector.name,
    institution_image_url: item.connector.imageUrl ?? null,
    is_sandbox: item.connector.isSandbox ?? false,
    status: status === "connected" ? "syncing" : status,
    last_error_code: item.error?.code ?? null,
    updated_at: new Date().toISOString(),
  };
  const stored = await client
    .from("financial_connections")
    .upsert(
      { ...base, ...(existing.data ? { id: existing.data.id } : {}) },
      { onConflict: "provider,provider_item_id" },
    )
    .select("id,user_id,provider_item_id,last_sync_at,status")
    .single();
  check(stored.error);
  const connection = stored.data as Connection;
  if (status !== "connected") return { status, connectionId: connection.id };
  try {
    const accounts = await syncAccounts(
      client,
      itemId,
      connection,
      item.connector.name,
    );
    await syncTransactions(client, connection, accounts, event);
    check(
      (
        await client
          .from("financial_connections")
          .update({
            status: "connected",
            last_sync_at: new Date().toISOString(),
            last_error_code: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", connection.id)
      ).error,
    );
    console.info("[OpenFinance] sync complete", { accounts: accounts.length });
    return {
      status: "connected",
      connectionId: connection.id,
      accounts: accounts.length,
    };
  } catch (error) {
    await client
      .from("financial_connections")
      .update({
        status: "error",
        last_error_code:
          error instanceof PluggyError ? error.code : "SYNC_FAILED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id);
    throw error;
  }
}
export async function disconnectItem(id: string, userId: string) {
  const connection = await ownedConnection(id, userId);
  try {
    await getPluggyProvider().disconnectConnection(connection.provider_item_id);
  } catch (error) {
    if (!(error instanceof PluggyError && error.httpStatus === 404))
      throw error;
  }
  const client = adminClient();
  check(
    (
      await client
        .from("financial_connections")
        .update({
          status: "disconnected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)
    ).error,
  );
  check(
    (
      await client
        .from("accounts")
        .update({ active: false })
        .eq("financial_connection_id", id)
        .eq("user_id", userId)
    ).error,
  );
}
export async function markDeletedTransactions(
  itemId: string,
  transactionIds: string[],
) {
  const client = adminClient();
  const connection = await client
    .from("financial_connections")
    .select("id,user_id")
    .eq("provider_item_id", itemId)
    .maybeSingle();
  check(connection.error);
  if (!connection.data || !transactionIds.length) return;
  const accounts = await client
    .from("accounts")
    .select("id")
    .eq("financial_connection_id", connection.data.id);
  check(accounts.error);
  const accountIds = (accounts.data ?? []).map((a) => a.id);
  if (accountIds.length)
    check(
      (
        await client
          .from("transactions")
          .update({
            provider_deleted: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", connection.data.user_id)
          .eq("provider", "pluggy")
          .in("account_id", accountIds)
          .in("external_id", transactionIds)
      ).error,
    );
}
