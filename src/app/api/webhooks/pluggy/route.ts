import { timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/open-finance/server-auth";
import { markDeletedTransactions, syncItem } from "@/lib/open-finance/service";
export const runtime = "nodejs";
export const maxDuration = 60;
const eventSchema = z.object({
  eventId: z.string().uuid(),
  event: z.string(),
  itemId: z.string().uuid(),
  clientUserId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  transactionIds: z.array(z.string().uuid()).optional(),
  transactionsCreatedAtFrom: z.string().datetime().optional(),
});
function validSecret(value: string | null) {
  const expected = process.env.PLUGGY_WEBHOOK_TOKEN;
  if (!expected || !value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function POST(request: Request) {
  if (!validSecret(request.headers.get("x-vida-webhook-token")))
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "INVALID_EVENT" }, { status: 400 });
  const event = parsed.data;
  const client = adminClient();
  const inserted = await client
    .from("webhook_events")
    .upsert(
      {
        provider: "pluggy",
        provider_event_id: event.eventId,
        event_type: event.event,
        provider_item_id: event.itemId,
        transaction_ids: event.transactionIds ?? [],
      },
      { onConflict: "provider,provider_event_id", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();
  if (inserted.error)
    return Response.json({ error: "DATABASE_ERROR" }, { status: 503 });
  if (!inserted.data) return Response.json({ received: true, duplicate: true });
  const eventRowId = inserted.data.id;
  after(async () => {
    try {
      await client
        .from("webhook_events")
        .update({ status: "processing", attempts: 1 })
        .eq("id", eventRowId);
      if (event.event === "transactions/deleted")
        await markDeletedTransactions(event.itemId, event.transactionIds ?? []);
      else if (event.event === "item/deleted") {
        const connection = await client
          .from("financial_connections")
          .select("id,user_id")
          .eq("provider_item_id", event.itemId)
          .maybeSingle();
        if (connection.data) {
          await client
            .from("financial_connections")
            .update({ status: "disconnected" })
            .eq("id", connection.data.id);
          await client
            .from("accounts")
            .update({ active: false })
            .eq("financial_connection_id", connection.data.id);
        }
      } else if (
        [
          "item/created",
          "item/updated",
          "item/error",
          "item/waiting_user_input",
          "item/waiting_user_action",
          "transactions/created",
          "transactions/updated",
        ].includes(event.event)
      )
        await syncItem(
          event.itemId,
          event.clientUserId,
          event.event.startsWith("transactions/")
            ? {
                accountId: event.accountId,
                transactionIds: event.transactionIds,
                createdAtFrom: event.transactionsCreatedAtFrom,
              }
            : undefined,
        );
      await client
        .from("webhook_events")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
          last_error_code: null,
        })
        .eq("id", eventRowId);
    } catch (error) {
      console.error(
        "[OpenFinance] webhook processing failed",
        error instanceof Error ? error.name : "unknown",
      );
      await client
        .from("webhook_events")
        .update({ status: "error", last_error_code: "PROCESSING_FAILED" })
        .eq("id", eventRowId);
    }
  });
  return Response.json({ received: true });
}
