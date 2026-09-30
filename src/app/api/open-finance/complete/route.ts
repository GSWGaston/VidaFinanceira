import { z } from "zod";
import { authenticatedUser, apiError } from "@/lib/open-finance/server-auth";
import { syncItem } from "@/lib/open-finance/service";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const userId = await authenticatedUser(request);
    const { itemId } = z
      .object({ itemId: z.string().uuid() })
      .parse(await request.json());
    return Response.json(await syncItem(itemId, userId), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
