import "server-only";
import { createClient } from "@supabase/supabase-js";
import { ZodError } from "zod";
import { PluggyError } from "./pluggy-provider";

export class AccessError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}
const config = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publicKey || !secretKey)
    throw new AccessError("NOT_CONFIGURED", 503);
  return { url, publicKey, secretKey };
};
export function adminClient() {
  const { url, secretKey } = config();
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function authenticatedUser(request: Request): Promise<string> {
  const match = /^Bearer (.+)$/i.exec(
    request.headers.get("authorization") ?? "",
  );
  if (!match) throw new AccessError("UNAUTHORIZED", 401);
  const { url, publicKey } = config();
  const client = createClient(url, publicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(match[1]);
  if (error || !data.user) throw new AccessError("UNAUTHORIZED", 401);
  return data.user.id;
}
export function apiError(error: unknown) {
  if (error instanceof AccessError)
    return Response.json({ error: error.code }, { status: error.status });
  if (error instanceof ZodError)
    return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });
  if (error instanceof PluggyError)
    return Response.json({ error: error.code }, { status: error.httpStatus });
  console.error(
    "[OpenFinance] request failed",
    error instanceof Error ? error.name : "unknown",
  );
  return Response.json(
    {
      error:
        error instanceof Error && error.message === "NOT_CONFIGURED"
          ? "NOT_CONFIGURED"
          : "SYNC_FAILED",
    },
    { status: 503 },
  );
}
