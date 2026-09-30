import { z } from "zod";
import { authenticatedUser, apiError } from "@/lib/open-finance/server-auth";
import { getPluggyProvider } from "@/lib/open-finance/pluggy-provider";
import { ownedConnection } from "@/lib/open-finance/service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const userId = await authenticatedUser(request);
    const body = z
      .object({ connectionId: z.string().uuid().optional() })
      .parse(await request.json().catch(() => ({})));
    const itemId = body.connectionId
      ? (await ownedConnection(body.connectionId, userId)).provider_item_id
      : undefined;
    return Response.json(
      {
        connectToken: await getPluggyProvider().createConnectToken(
          userId,
          itemId,
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
