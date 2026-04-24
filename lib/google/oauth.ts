import { OAuth2Client } from "google-auth-library";

/**
 * Scopes voor het verbinden van een mailbox. Naast openid/email/profile
 * vragen we Gmail readonly (om mails te lezen) en Gmail modify (om
 * labels te beheren wanneer Stap 5b dat nodig heeft).
 */
export const GMAIL_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
] as const;

/**
 * De redirect URI moet identiek zijn in (1) de Google Cloud OAuth-client
 * authorized redirect URIs, (2) de authorize-request en (3) de token-
 * exchange. Daarom centraal hier vastgelegd.
 *
 * In productie wijst dit naar metliefde.vercel.app. Override via
 * NEXT_PUBLIC_APP_URL voor preview-deployments (na elk URL-pad zelf in
 * Google Cloud whitelisten).
 */
export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "https://metliefde.vercel.app"
  );
}

export function getMailboxRedirectUri(): string {
  return `${getAppUrl()}/api/mailbox/callback`;
}

export function createOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID en GOOGLE_CLIENT_SECRET zijn niet gezet. Voeg ze toe in Vercel en redeploy.",
    );
  }
  return new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri: getMailboxRedirectUri(),
  });
}

/**
 * Genereert een ondertekende state-string voor CSRF-bescherming. Het is
 * gewoon een random nonce die we als httpOnly cookie zetten en bij de
 * callback terugverwachten.
 */
export function generateState(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const MAILBOX_STATE_COOKIE = "mailbox-oauth-state";
