import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertUserProfile } from "@/lib/mutations/users";
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

  const metadata = (data.user.user_metadata ?? {}) as GoogleUserMetadata;
  const displayName =
    metadata.full_name?.trim() ||
    metadata.name?.trim() ||
    (email ? email.split("@")[0] : "Onbekend");

  try {
    await upsertUserProfile({
      id: data.user.id,
      email: email!,
      display_name: displayName,
      role: "eigenaar",
      active: true,
    });
  } catch (err) {
    // Sessie is al gezet en whitelist is gepasseerd. We laten de
    // gebruiker doorgaan en kunnen op de homepage een fallback-sync doen.
    console.error("upsertUserProfile faalde", err);
  }

  return NextResponse.redirect(`${origin}/`);
}
