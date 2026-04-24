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

export async function GET(request: NextRequest) {
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
    const url = new URL("/instellingen", request.url);
    url.searchParams.set("error", "alleen_eigenaar");
    return NextResponse.redirect(url);
  }

  const state = generateState();
  const cookieStore = await cookies();
  cookieStore.set(MAILBOX_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 10, // 10 minuten geldig
    path: "/",
  });

  const client = createOAuthClient();
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [...GMAIL_SCOPES],
    state,
    include_granted_scopes: true,
  });

  return NextResponse.redirect(authUrl);
}
