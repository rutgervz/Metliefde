import { NextResponse, type NextRequest } from "next/server";
import { syncAllConnectedMailboxes } from "@/lib/google/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron-endpoint: ophalen van nieuwe facturen-mails uit alle verbonden
 * mailboxen. Vercel triggert dit elke 15 minuten met een Bearer-token
 * dat overeenkomt met CRON_SECRET. Manuele aanroep gebeurt via de
 * server action triggerMailboxSync vanuit de UI.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET niet geconfigureerd" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await syncAllConnectedMailboxes();
  return NextResponse.json({
    runAt: new Date().toISOString(),
    mailboxes: results,
  });
}
