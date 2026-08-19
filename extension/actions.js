export const PAGE_ACTIONS = [
  {
    id: "summarize",
    label: "Summarize this page",
    hint: "Short overview",
    prompt:
      "Summarize this page in 8–12 bullets. Lead with what it is and who it is for. Flag dates, prices, and deadlines. Do not invent facts.",
  },
  {
    id: "takeaways",
    label: "Key takeaways",
    hint: "What matters",
    prompt:
      "Give the five most important takeaways from this page. One sentence each. No preamble.",
  },
  {
    id: "actions",
    label: "Extract action items",
    hint: "To-dos and owners",
    prompt:
      "Extract action items, requests, and next steps from this page as a checklist. Include owners and dates only if they appear on the page.",
  },
  {
    id: "explain",
    label: "Explain simply",
    hint: "Plain language",
    prompt:
      "Explain this page in plain language as a briefing for a busy colleague who has not read it. Define jargon the first time it appears.",
  },
  {
    id: "quotes",
    label: "Quotes & stats",
    hint: "Copy-ready facts",
    prompt:
      "Pull notable quotes, statistics, and named claims from this page. Keep numbers exactly as written. Do not invent figures.",
  },
  {
    id: "risks",
    label: "Risks & caveats",
    hint: "What to watch",
    prompt:
      "List risks, caveats, limitations, and easy-to-miss details on this page. If none are stated, say so.",
  },
  {
    id: "outline",
    label: "Outline",
    hint: "Structure",
    prompt:
      "Produce a hierarchical outline of this page that preserves the author's structure.",
  },
  {
    id: "translate",
    label: "Translate",
    hint: "English (US)",
    prompt:
      "Translate this page into clear English (US). Keep names, figures, and product terms intact.",
  },
];
