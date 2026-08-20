function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatItem(item) {
  const check = item.match(/^\[( |x|X)\]\s+(.*)$/);
  if (check) {
    const on = check[1].toLowerCase() === "x";
    return `<span class="task" aria-hidden="true">${on ? "☑" : "☐"}</span> ${inline(check[2])}`;
  }
  return inline(item);
}

function inline(text) {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[^\w])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]]+)\]\((https?:[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );
}

function normalizeSource(md) {
  return md
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+(#{1,6})\s+/g, "\n$1 ")
    .replace(/([^\n])[ \t]+([-*])[ \t]+(?=\S)/g, "$1\n$2 ");
}

function listKind(marker) {
  if (/^[-*+]$/.test(marker)) return { type: "ul", cls: "" };
  if (/^[IVXLCDM]+\.$/i.test(marker) && marker.length > 2) return { type: "ol", cls: "roman" };
  if (/^[A-Za-z]\.$/.test(marker)) return { type: "ol", cls: "alpha" };
  return { type: "ol", cls: "" };
}

function closeLists(stack, html, toIndent) {
  while (stack.length && stack[stack.length - 1].indent > toIndent) {
    html.value += `</li></${stack.pop().type}>`;
  }
  if (stack.length && stack[stack.length - 1].indent === toIndent) {
    html.value += "</li>";
  }
}

function renderFlow(text) {
  const lines = text.split("\n");
  const html = { value: "" };
  const stack = [];
  let para = [];
  let quote = [];

  const flushPara = () => {
    if (!para.length) return;
    html.value += `<p>${inline(para.join(" "))}</p>`;
    para = [];
  };

  const flushQuote = () => {
    if (!quote.length) return;
    html.value += `<blockquote>${quote.map((line) => `<p>${inline(line)}</p>`).join("")}</blockquote>`;
    quote = [];
  };

  const closeAllLists = () => {
    closeLists(stack, html, -1);
  };

  for (const raw of lines) {
    const line = raw.replace(/\t/g, "  ");
    const trimmed = line.trim();

    if (!trimmed) {
      flushPara();
      flushQuote();
      closeAllLists();
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushPara();
      flushQuote();
      closeAllLists();
      const level = Math.min(heading[1].length, 3);
      html.value += `<h${level}>${inline(heading[2])}</h${level}>`;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushPara();
      flushQuote();
      closeAllLists();
      html.value += "<hr />";
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushPara();
      closeAllLists();
      quote.push(quoteMatch[1]);
      continue;
    }
    flushQuote();

    const roman = trimmed.match(/^([IVXLCDM]+)\.\s+(.*)$/);
    if (roman && !/^\d/.test(roman[1]) && stack.length === 0) {
      flushPara();
      html.value += `<h3>${inline(roman[2])}</h3>`;
      continue;
    }

    const letter = trimmed.match(/^([A-Z])\.\s+(.*)$/);
    if (letter && stack.length === 0) {
      flushPara();
      html.value += `<h3>${inline(letter[2])}</h3>`;
      continue;
    }

    const list = line.match(/^(\s*)([-*+]|\d+\.|[A-Za-z]\.|[IVXLCDM]+\.)\s+(.*)$/);
    if (list) {
      flushPara();
      const indent = list[1].length;
      const { type, cls } = listKind(list[2]);
      const item = list[3];
      if (!stack.length || indent > stack[stack.length - 1].indent) {
        html.value += `<${type}${cls ? ` class="${cls}"` : ""}><li>${formatItem(item)}`;
        stack.push({ type, indent });
      } else {
        closeLists(stack, html, indent);
        const top = stack[stack.length - 1];
        if (!top || top.indent < indent) {
          html.value += `<${type}${cls ? ` class="${cls}"` : ""}><li>${formatItem(item)}`;
          stack.push({ type, indent });
        } else if (top.type !== type) {
          html.value += `</${top.type}>`;
          stack.pop();
          html.value += `<${type}${cls ? ` class="${cls}"` : ""}><li>${formatItem(item)}`;
          stack.push({ type, indent });
        } else {
          html.value += `<li>${formatItem(item)}`;
        }
      }
      continue;
    }

    para.push(trimmed);
  }

  flushPara();
  flushQuote();
  closeAllLists();
  return html.value;
}

export function renderMarkdown(md) {
  if (!md) return "";
  const parts = normalizeSource(String(md)).split(/```/);
  let html = "";
  for (let i = 0; i < parts.length; i += 1) {
    if (i % 2 === 1) {
      const nl = parts[i].indexOf("\n");
      const lang = nl === -1 ? "" : parts[i].slice(0, nl).trim();
      const code = nl === -1 ? parts[i] : parts[i].slice(nl + 1);
      html += `<pre><div class="code-head">${escapeHtml(lang || "code")}</div><code>${escapeHtml(code.replace(/\n$/, ""))}</code></pre>`;
      continue;
    }
    html += renderFlow(parts[i]);
  }
  return html;
}
