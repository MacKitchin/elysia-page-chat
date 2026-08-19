function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(text) {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );
}

export function renderMarkdown(md) {
  if (!md) return "";
  const parts = String(md).split(/```/);
  let html = "";
  for (let i = 0; i < parts.length; i += 1) {
    if (i % 2 === 1) {
      const nl = parts[i].indexOf("\n");
      const lang = nl === -1 ? "" : parts[i].slice(0, nl).trim();
      const code = nl === -1 ? parts[i] : parts[i].slice(nl + 1);
      html += `<pre><div class="code-head">${escapeHtml(lang || "code")}</div><code>${escapeHtml(code.replace(/\n$/, ""))}</code></pre>`;
      continue;
    }
    const blocks = parts[i].split(/\n{2,}/);
    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;
      const lines = trimmed.split("\n");
      if (lines.every((line) => /^[-*]\s+/.test(line))) {
        html += `<ul>${lines
          .map((line) => `<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`)
          .join("")}</ul>`;
        continue;
      }
      if (lines.every((line) => /^\d+\.\s+/.test(line))) {
        html += `<ol>${lines
          .map((line) => `<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>`)
          .join("")}</ol>`;
        continue;
      }
      if (/^###\s+/.test(trimmed)) {
        html += `<h3>${inline(trimmed.replace(/^###\s+/, ""))}</h3>`;
        continue;
      }
      if (/^##\s+/.test(trimmed)) {
        html += `<h2>${inline(trimmed.replace(/^##\s+/, ""))}</h2>`;
        continue;
      }
      if (/^#\s+/.test(trimmed)) {
        html += `<h1>${inline(trimmed.replace(/^#\s+/, ""))}</h1>`;
        continue;
      }
      html += `<p>${inline(lines.join(" "))}</p>`;
    }
  }
  return html;
}
