export const PAGE_CONTEXT_CHAR_LIMIT = 12_000;

export interface PageContext {
  url: string;
  title: string;
  text: string;
  selection?: string;
}

const USER_QUESTION_MARKER = "User question: ";

export const RESPONSE_FORMAT = `Format the answer in GitHub-flavored Markdown for a narrow chat panel:
- Put headings on their own lines (## Section). Never place # markers in the middle of a sentence.
- Use nested bullet lists for outlines and inventories (- item, then two-space indented - child). Never write an outline as one paragraph or as "I. A. - item" on a single line.
- Put a blank line between top-level sections.
- Keep paragraphs to 1–3 sentences.
- Use **bold** only for short labels, not whole sentences.
- Use a quoted block (>) for verbatim quotes.
- Use a markdown table only for a small grid of comparable facts (2–6 rows).
- Checklists use "- [ ]" items.`;

export function normalizeExtractedText(raw: string): string {
  return raw
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function truncatePageText(
  text: string,
  limit: number = PAGE_CONTEXT_CHAR_LIMIT,
): { text: string; truncated: boolean } {
  if (text.length <= limit) return { text, truncated: false };
  return { text: `${text.slice(0, limit)}\n\n[Page truncated]`, truncated: true };
}

export function userQuestionFromPrompt(query: string): string {
  const idx = query.lastIndexOf(USER_QUESTION_MARKER);
  if (idx === -1) return query.trim();
  return query.slice(idx + USER_QUESTION_MARKER.length).trim();
}

export function buildPageContextQuery(
  question: string,
  page?: PageContext | null,
): string {
  const q = question.trim();
  if (!page || (!page.text && !page.selection && !page.url && !page.title)) {
    return q;
  }

  const selected = normalizeExtractedText(page.selection || "");
  const usingSelection = selected.length > 0;
  const source = usingSelection
    ? selected
    : normalizeExtractedText(page.text || "");
  const { text, truncated } = truncatePageText(source);

  const lines = [
    "You are answering questions about a web page the user currently has open.",
    "Use only this page as source material unless the user asks something the page cannot answer; then say so.",
    "Do not invent facts that are not on the page.",
    `URL: ${page.url || "(unknown)"}`,
    `Title: ${page.title || "(untitled)"}`,
    usingSelection
      ? "Context: user-selected text from the page."
      : "Context: extracted readable text from the page.",
  ];
  if (truncated) {
    lines.push("Note: the extract was truncated to fit the model window.");
  }
  lines.push(
    "---",
    text || "(no readable text could be extracted from this page)",
    "---",
    `${USER_QUESTION_MARKER}${q}`,
  );
  return lines.join("\n");
}

export function composeCompletionQuery(
  question: string,
  page?: PageContext | null,
): string {
  const wrapped = buildPageContextQuery(question, page);
  const body = wrapped.includes(USER_QUESTION_MARKER)
    ? wrapped
    : `${USER_QUESTION_MARKER}${wrapped}`;
  return `${RESPONSE_FORMAT}\n\n${body}`;
}
