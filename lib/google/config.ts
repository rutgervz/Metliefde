/**
 * Configuratie-status voor de mailbox-flow. Server-side te checken
 * voordat we de UI tonen, zodat we de gebruiker kunnen vertellen
 * welke env vars nog ontbreken.
 */

export type MailboxConfigStatus = {
  ready: boolean;
  missing: string[];
};

export function checkMailboxConfig(): MailboxConfigStatus {
  const missing: string[] = [];
  if (!process.env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    // Niet kritiek (default in code) maar wel beter expliciet.
  }
  return {
    ready: missing.length === 0,
    missing,
  };
}
