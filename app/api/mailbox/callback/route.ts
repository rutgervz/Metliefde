import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/queries/users";
import {
  GMAIL_SCOPES,
  MAILBOX_STATE_COOKIE,
  createOAuthClient,
} from "@/lib/google/oauth";
import { upsertMailAccount } from "@/lib/mutations/mail-accounts";

type GoogleIdTokenPayload = {
  email?: string;
  name?: string;
  picture?: string;
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const settingsUrl = (params: Record<string, string>) => {
    const url = new URL("/instellingen/mailboxen", origin);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    return url;
  };

  if (error) {
    return NextResponse.redirect(settingsUrl({ error: "geweigerd" }));
  }
  if (!code || !state) {
    return NextResponse.redirect(settingsUrl({ error: "geen_code" }));
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(MAILBOX_STATE_COOKIE)?.value;
  cookieStore.delete(MAILBOX_STATE_COOKIE);
  if (!expectedState || expectedState !== state) {
    return NextResponse.redirect(settingsUrl({ error: "ongeldige_state" }));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const profile = await getCurrentUserProfile();
  if (profile?.role !== "eigenaar") {
    return NextResponse.redirect(settingsUrl({ error: "alleen_eigenaar" }));
  }

  const client = createOAuthClient();
  let tokens;
  try {
    const result = await client.getToken(code);
    tokens = result.tokens;
  } catch {
    return NextResponse.redirect(settingsUrl({ error: "uitwisseling" }));
  }

  if (!tokens.access_token) {
    return NextResponse.redirect(settingsUrl({ error: "geen_token" }));
  }

  // E-mail uit id_token halen.
  let email: string | null = null;
  let displayName: string | null = null;
  if (tokens.id_token) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload() as GoogleIdTokenPayload | undefined;
      email = payload?.email?.toLowerCase() ?? null;
      displayName = payload?.name ?? null;
    } catch {
      return NextResponse.redirect(settingsUrl({ error: "id_token" }));
    }
  }

  if (!email) {
    return NextResponse.redirect(settingsUrl({ error: "geen_email" }));
  }

  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date).toISOString()
    : null;

  try {
    await upsertMailAccount({
      email,
      display_name: displayName,
      provider: "gmail",
      status: "verbonden",
      connected_by: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: expiresAt,
      scopes: [...GMAIL_SCOPES],
      gmail_label: "Facturen/Inbox",
    });
  } catch (err) {
    console.error("upsertMailAccount faalde", err);
    return NextResponse.redirect(settingsUrl({ error: "opslaan" }));
  }

  return NextResponse.redirect(settingsUrl({ verbonden: email }));
}
