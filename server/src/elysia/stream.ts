export async function* parseCompletionStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawSse = false;
  let currentEvent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });

    if (!sawSse && !chunk.includes("data:") && buffer === "") {
      yield chunk;
      continue;
    }

    sawSse = true;
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("event:")) {
        currentEvent = trimmed.slice(6).trim();
        continue;
      }
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const parsed = JSON.parse(payload) as {
          content?: string;
          answer?: string;
          message?: string;
        };
        if (currentEvent === "error") {
          throw new Error(parsed.message ?? payload);
        }
        if (currentEvent === "final_response") continue;
        const text = parsed.content ?? parsed.answer;
        if (typeof text === "string" && text) yield text;
      } catch (err) {
        if (err instanceof SyntaxError) {
          if (payload) yield payload;
          continue;
        }
        throw err;
      }
    }
  }
}

export function encodeSse(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
