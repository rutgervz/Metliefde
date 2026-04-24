import SunCalc from "suncalc";

export type ThemeMode = "auto" | "licht" | "donker";
export type EffectiveTheme = "light" | "dark";

export const THEME_COOKIE = "theme-mode";

// Anker-coordinaten voor Us Wente / Friesland. De zon-tijden verschillen
// nauwelijks van elke andere plek in Nederland; dit dient als poetische
// referentie voor wanneer de app van licht naar donker switcht.
const FRIESLAND_LAT = 53.176;
const FRIESLAND_LNG = 5.793;

export function parseThemeMode(value: string | undefined): ThemeMode {
  if (value === "licht" || value === "donker") return value;
  return "auto";
}

/**
 * Bepaalt op basis van mode + huidig moment welk thema actief is.
 * In auto-modus volgt het de zonsondergang in Friesland.
 */
export function getEffectiveTheme(
  mode: ThemeMode,
  now: Date = new Date(),
): EffectiveTheme {
  if (mode === "licht") return "light";
  if (mode === "donker") return "dark";

  const times = SunCalc.getTimes(now, FRIESLAND_LAT, FRIESLAND_LNG);
  const sunrise = times.sunrise;
  const sunset = times.sunset;

  // Veiligheidsklep voor de poolnacht of corrupte input.
  if (
    !(sunrise instanceof Date) ||
    !(sunset instanceof Date) ||
    isNaN(sunrise.getTime()) ||
    isNaN(sunset.getTime())
  ) {
    const hour = now.getHours();
    return hour >= 7 && hour < 20 ? "light" : "dark";
  }

  return now >= sunrise && now < sunset ? "light" : "dark";
}
