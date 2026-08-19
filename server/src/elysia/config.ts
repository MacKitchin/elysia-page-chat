export function isMockForced(): boolean {
  return process.env.ELYSIA_MOCK === "true";
}

export function hasCredentials(): boolean {
  return Boolean(process.env.ELYSIA_CLIENT_ID && process.env.ELYSIA_CLIENT_SECRET);
}

export function shouldUseMock(): boolean {
  return isMockForced() || !hasCredentials();
}

export function idpUrl(): string {
  return process.env.ELYSIA_IDP_URL || "https://idp.dev.ai.informa.com";
}

export function baseUrl(): string {
  return process.env.ELYSIA_BASE_URL || "https://api.stage.ai.informa.com";
}

export function apiVersion(): string {
  return process.env.ELYSIA_API_VERSION || "v1";
}

export function appId(): string | undefined {
  return process.env.ELYSIA_APP_ID;
}

export function collectionName(): string {
  return process.env.ELYSIA_COLLECTION_NAME || "content_vectorstore";
}

export function tokenScope(): string {
  return process.env.ELYSIA_SCOPE || "iris.apis/ai";
}

export function listenPort(): number {
  return Number(process.env.PORT || 8788);
}
