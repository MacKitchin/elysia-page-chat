import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { serve } from "@hono/node-server";
import { Hono } from "hono";

function loadEnvFile(file: string): void {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");
import { PAGE_ACTIONS } from "./actions";
import { corsHeaders } from "./cors";
import { streamCompletionText } from "./elysia/client";
import {
  collectionName,
  hasCredentials,
  isMockForced,
  listenPort,
  shouldUseMock,
} from "./elysia/config";
import { defaultModel, LANGUAGES, MODEL_CATALOG } from "./elysia/models";
import { encodeSse } from "./elysia/stream";
import {
  PAGE_CONTEXT_CHAR_LIMIT,
  buildPageContextQuery,
  userQuestionFromPrompt,
  type PageContext,
} from "./page-context";

const app = new Hono();

app.use("*", async (c, next) => {
  const extra = corsHeaders(c.req.header("origin"));
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: extra });
  }
  await next();
  for (const [key, value] of Object.entries(extra)) {
    c.header(key, value);
  }
});

app.get("/", (c) =>
  c.text(
    "Elysia Page Chat proxy is running. In Chrome, Load unpacked → the extension/ folder in this project.",
  ),
);

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/actions", (c) => c.json({ actions: PAGE_ACTIONS }));

app.get("/api/status", (c) => {
  const model = defaultModel();
  return c.json({
    mockForced: isMockForced(),
    credentialsPresent: hasCredentials(),
    collectionName: collectionName(),
    model,
    models: MODEL_CATALOG,
    languages: LANGUAGES,
    notice:
      "Internal prototype. Not an official Informa or OpenAI product. Page text is sent to Elysia.",
  });
});

function demoReply(query: string): string {
  const asked = userQuestionFromPrompt(query);
  return `I don't have a live Elysia connection in this session, so this is a placeholder.\n\nYou asked: **${asked || "…"}**\n\nAdd \`ELYSIA_CLIENT_ID\`, \`ELYSIA_CLIENT_SECRET\`, and \`ELYSIA_APP_ID\` to \`.env\`, then restart the proxy.`;
}

app.post("/api/chat/stream", async (c) => {
  const body = (await c.req.json()) as {
    query?: string;
    chatSession?: string;
    collectionName?: string;
    language?: string;
    provider?: string;
    nameOfModel?: string;
    pageContext?: PageContext | null;
  };

  const question = (body.query || "").trim();
  if (!question) {
    return c.json({ error: "query is required" }, 400);
  }

  const query = buildPageContextQuery(question, body.pageContext);
  const chatSession = body.chatSession || randomUUID();
  const selection = (body.pageContext?.selection || "").trim();
  const extract = selection || body.pageContext?.text || "";
  const origin = c.req.header("origin");

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encodeSse(event, data));
      };
      try {
        send("meta", {
          chatSession,
          mock: shouldUseMock(),
          page: body.pageContext
            ? {
                url: body.pageContext.url,
                title: body.pageContext.title,
                chars: extract.length,
                truncated: extract.length > PAGE_CONTEXT_CHAR_LIMIT,
                usedSelection: Boolean(selection),
              }
            : null,
        });
        if (shouldUseMock()) {
          for (const part of demoReply(query).split(/(?<=\s)/)) {
            send("token", { content: part });
          }
          send("done", { chatSession });
          controller.close();
          return;
        }
        try {
          for await (const chunk of streamCompletionText({
            query,
            chatSession,
            collectionName: body.collectionName,
            language: body.language,
            provider: body.provider,
            nameOfModel: body.nameOfModel,
          })) {
            send("token", { content: chunk });
          }
        } catch (liveErr) {
          send("stage", {
            id: "fallback",
            status: "demo",
            detail: liveErr instanceof Error ? liveErr.message : String(liveErr),
          });
          for (const part of demoReply(query).split(/(?<=\s)/)) {
            send("token", { content: part });
          }
        }
        send("done", { chatSession });
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
});

const port = listenPort();
serve({ fetch: app.fetch, port }, () => {
  console.log(`Elysia Page Chat proxy listening on http://localhost:${port}`);
});
