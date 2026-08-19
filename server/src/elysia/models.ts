export type ModelProvider = "azure" | "aws";

export interface ElysiaModelOption {
  id: string;
  label: string;
  provider: ModelProvider;
  nameOfModel: string;
  region: string;
}

export const LANGUAGES = [
  "English (US)",
  "English (UK)",
  "Portuguese",
  "German",
  "French",
  "Spanish",
  "Turkish",
  "Dutch",
  "Simplified Chinese",
  "Japanese",
  "Arabic",
] as const;

export const MODEL_CATALOG: ElysiaModelOption[] = [
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "azure",
    nameOfModel: "gpt-4o",
    region: "Global",
  },
  {
    id: "gpt-5",
    label: "GPT-5",
    provider: "azure",
    nameOfModel: "gpt-5",
    region: "Global",
  },
  {
    id: "gpt-5-mini",
    label: "GPT-5 mini",
    provider: "azure",
    nameOfModel: "gpt-5-mini",
    region: "Global",
  },
  {
    id: "claude-4.5-eu",
    label: "Claude Sonnet 4.5",
    provider: "aws",
    nameOfModel: "eu.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region: "EU",
  },
  {
    id: "claude-4-eu",
    label: "Claude Sonnet 4",
    provider: "aws",
    nameOfModel: "eu.anthropic.claude-sonnet-4-20250514-v1:0",
    region: "EU",
  },
];

export function defaultModel(): ElysiaModelOption {
  const provider = (process.env.ELYSIA_MODEL_PROVIDER as ModelProvider) || "azure";
  const name = process.env.ELYSIA_MODEL_NAME || "gpt-4o";
  return (
    MODEL_CATALOG.find((m) => m.provider === provider && m.nameOfModel === name) ??
    MODEL_CATALOG[0]
  );
}

export function resolveModel(
  provider?: string,
  nameOfModel?: string,
): ElysiaModelOption {
  return (
    MODEL_CATALOG.find((m) => m.provider === provider && m.nameOfModel === nameOfModel) ??
    defaultModel()
  );
}
