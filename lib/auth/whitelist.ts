/**
 * Whitelist-check voor toegestane e-mailadressen.
 * De waarde komt uit de env-var ALLOWED_EMAILS als comma-separated lijst.
 */

function parseAllowed(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = parseAllowed();
  if (allowed.length === 0) return false;
  return allowed.includes(email.toLowerCase());
}
