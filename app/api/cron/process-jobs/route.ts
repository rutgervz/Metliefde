import { NextResponse, type NextRequest } from "next/server";
import { processPendingJobs } from "@/lib/jobs/processor";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron-endpoint dat wachtende jobs uit de queue oppakt en verwerkt.
 * Vercel triggert dit elke 15 minuten met een Bearer-token. Manuele
 * aanroep gaat via de Verwerk jobs-knop in de UI.
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

  const results = await processPendingJobs(20);
  return NextResponse.json({
    runAt: new Date().toISOString(),
    processed: results.length,
    results,
  });
}
