import { idpUrl, tokenScope } from "./config";

let cached: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt - 60_000) return cached.token;

  const clientId = process.env.ELYSIA_CLIENT_ID;
  const clientSecret = process.env.ELYSIA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("ELYSIA_CLIENT_ID / ELYSIA_CLIENT_SECRET are not configured.");
  }

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
  };

  const attempt = async (withScope: boolean) => {
    const body = new URLSearchParams({ grant_type: "client_credentials" });
    if (withScope) body.set("scope", tokenScope());
    return fetch(`${idpUrl()}/oauth2/token`, { method: "POST", headers, body });
  };

  let res = await attempt(true);
  if (!res.ok) {
    const first = await res.text();
    res = await attempt(false);
    if (!res.ok) {
      const second = await res.text();
      throw new Error(
        `Token request failed (${res.status}): ${second.slice(0, 240) || first.slice(0, 240)}`,
      );
    }
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return cached.token;
}
