import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isEmailAllowed } from "@/lib/auth/whitelist";

type GoogleUserMetadata = {
  full_name?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  picture?: string;
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=geen_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=uitwisseling`);
  }

  const email = data.user.email?.toLowerCase() ?? null;

  if (!isEmailAllowed(email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=niet_toegestaan`);
  }

  // Synchroniseer auth-gebruiker naar public.users. Service client omzeilt RLS.
  const admin = createServiceClient();
  const metadata = (data.user.user_metadata ?? {}) as GoogleUserMetadata;
  const displayName =
    metadata.full_name?.trim() ||
    metadata.name?.trim() ||
    (email ? email.split("@")[0] : "Onbekend");

  const { error: upsertError } = await admin.from("users").upsert(
    {
      id: data.user.id,
      email: email!,
      display_name: displayName,
      role: "eigenaar",
      active: true,
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    // Niet fataal voor de sessie, maar wel zichtbaar in de logs.
    console.error("users upsert faalde", upsertError);
  }

  return NextResponse.redirect(`${origin}/`);
}
