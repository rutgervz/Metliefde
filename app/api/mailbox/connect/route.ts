import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/queries/users";
import {
  GMAIL_SCOPES,
  MAILBOX_STATE_COOKIE,
  createOAuthClient,
  generateState,
} from "@/lib/google/oauth";
import { checkMailboxConfig } from "@/lib/google/config";

export async function GET(request: NextRequest) {
  const settingsUrl = (params: Record<string, string>) => {
    const url = new URL("/instellingen/mailboxen", request.url);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    return url;
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  const profile = await getCurrentUserProfile();
  if (profile?.role !== "eigenaar") {
    return NextResponse.redirect(settingsUrl({ error: "alleen_eigenaar" }));
  }

  const config = checkMailboxConfig();
  if (!config.ready) {
    return NextResponse.redirect(
      settingsUrl({ error: "config_ontbreekt", missing: config.missing.join(",") }),
    );
  }

  let authUrl: string;
  try {
    const state = generateState();
    const cookieStore = await cookies();
    cookieStore.set(MAILBOX_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 10,
      path: "/",
    });

    const client = createOAuthClient();
    authUrl = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [...GMAIL_SCOPES],
      state,
      include_granted_scopes: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("mailbox connect setup faalde", message);
    return NextResponse.redirect(
      settingsUrl({ error: "setup", details: message.slice(0, 120) }),
    );
  }

  return NextResponse.redirect(authUrl);
}
