import { z } from "zod";
import { authenticatedUser, apiError } from "@/lib/open-finance/server-auth";
import {
  disconnectItem,
  ownedConnection,
  syncItem,
} from "@/lib/open-finance/service";
export const runtime = "nodejs";
export const maxDuration = 60;
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  try {
    const userId = await authenticatedUser(request);
    const id = z
      .string()
      .uuid()
      .parse((await context.params).id);
    const connection = await ownedConnection(id, userId);
    return Response.json(await syncItem(connection.provider_item_id, userId));
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    const userId = await authenticatedUser(request);
    const id = z
      .string()
      .uuid()
      .parse((await context.params).id);
    await disconnectItem(id, userId);
    return Response.json({ disconnected: true });
  } catch (error) {
    return apiError(error);
  }
}
