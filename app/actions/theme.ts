"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { parseThemeMode, THEME_COOKIE, type ThemeMode } from "@/lib/theme";

export async function setThemeMode(mode: ThemeMode) {
  const safeMode = parseThemeMode(mode);
  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE, safeMode, {
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  revalidatePath("/", "layout");
}
