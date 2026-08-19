import { getAccessToken } from "./auth";
import { apiVersion, appId, baseUrl, collectionName } from "./config";
import { resolveModel } from "./models";
import { parseCompletionStream } from "./stream";

export class ElysiaHttpError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`Elysia ${status}: ${body.slice(0, 280)}`);
    this.status = status;
    this.body = body;
  }
}

async function authorizedHeaders(extra?: Record<string, string>): Promise<HeadersInit> {
  const token = await getAccessToken();
  return { Authorization: `Bearer ${token}`, Accept: "application/json", ...extra };
}

export async function elysiaFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const auth = await authorizedHeaders();
  for (const [k, v] of Object.entries(auth)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return fetch(`${baseUrl()}${path}`, { ...init, headers });
}

export interface CompletionInput {
  query: string;
  chatSession?: string;
  collectionName?: string;
  language?: string;
  provider?: string;
  nameOfModel?: string;
}

export async function streamCompletion(
  input: CompletionInput,
): Promise<ReadableStream<Uint8Array>> {
  const model = resolveModel(input.provider, input.nameOfModel);
  const body: Record<string, unknown> = {
    appId: appId(),
    query: input.query,
    response_language: input.language || "English (US)",
    tokens: 8192,
    model: model.provider,
    name_of_model: model.nameOfModel,
    chat_session: input.chatSession,
    output_type: "markdown",
  };
  const collection = input.collectionName || collectionName();
  if (collection) body.collection_name = collection;

  const res = await elysiaFetch(`/${apiVersion()}/ai/chat/stream/completion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    throw new ElysiaHttpError(res.status, await res.text());
  }
  return res.body;
}

export async function* streamCompletionText(
  input: CompletionInput,
): AsyncGenerator<string> {
  yield* parseCompletionStream(await streamCompletion(input));
}
