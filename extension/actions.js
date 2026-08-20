export const PAGE_ACTIONS = [
  {
    id: "summarize",
    label: "Summarize this page",
    hint: "Short overview",
    prompt:
      "Summarize this page. Start with a one-sentence overview as a paragraph, then 8–12 markdown bullets. Flag dates, prices, and deadlines. Do not invent facts.",
  },
  {
    id: "takeaways",
    label: "Key takeaways",
    hint: "What matters",
    prompt:
      "Give the five most important takeaways. Use a markdown numbered list. One sentence per item. No preamble.",
  },
  {
    id: "actions",
    label: "Extract action items",
    hint: "To-dos and owners",
    prompt:
      "Extract action items as a markdown checklist (- [ ] task). Group under ### headings if there are distinct owners or themes. Include owners and dates only if they appear on the page.",
  },
  {
    id: "explain",
    label: "Explain simply",
    hint: "Plain language",
    prompt:
      "Explain this page as a briefing. Use ## headings for 3–5 short sections and short paragraphs (1–3 sentences). Define jargon the first time it appears.",
  },
  {
    id: "quotes",
    label: "Quotes & stats",
    hint: "Copy-ready facts",
    prompt:
      "Pull notable quotes and statistics. Use ### Quotes with a quoted block (>) per quote, then ### Stats as bullets. Keep numbers exactly as written.",
  },
  {
    id: "risks",
    label: "Risks & caveats",
    hint: "What to watch",
    prompt:
      "List risks and caveats as markdown bullets under ### headings (Risks, Caveats, Easy to miss). If none are stated, say so in a short paragraph.",
  },
  {
    id: "outline",
    label: "Outline",
    hint: "Structure",
    prompt:
      "Produce a hierarchical outline of this page. Use ## for the title, ### for each top-level section, and nested markdown bullets for children (two-space indent). Do not use Roman numerals or inline ### markers.",
  },
  {
    id: "translate",
    label: "Translate",
    hint: "English (US)",
    prompt:
      "Translate this page into clear English (US). Use the same heading and list structure as a well-formatted article. Keep names, figures, and product terms intact.",
  },
];
