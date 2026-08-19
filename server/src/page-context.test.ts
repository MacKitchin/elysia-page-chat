import { describe, expect, it } from "vitest";
import {
  PAGE_CONTEXT_CHAR_LIMIT,
  buildPageContextQuery,
  userQuestionFromPrompt,
} from "./page-context";

describe("buildPageContextQuery", () => {
  it("returns the question when no page is provided", () => {
    expect(buildPageContextQuery("  hello  ")).toBe("hello");
  });

  it("wraps the page and keeps the user question recoverable", () => {
    const query = buildPageContextQuery("What is the fee?", {
      url: "https://example.com/cphi",
      title: "CPhI",
      text: "The booth fee is £4,200.",
    });
    expect(query).toContain("https://example.com/cphi");
    expect(query).toContain("The booth fee is £4,200.");
    expect(userQuestionFromPrompt(query)).toBe("What is the fee?");
  });

  it("prefers selected text", () => {
    const query = buildPageContextQuery("Explain", {
      url: "https://example.com",
      title: "Doc",
      text: "Long page that should not be primary.",
      selection: "Only this sentence.",
    });
    expect(query).toContain("Only this sentence.");
    expect(query).not.toContain("Long page that should not be primary.");
  });

  it("notes truncation past the char limit", () => {
    const query = buildPageContextQuery("Go", {
      url: "https://example.com",
      title: "Big",
      text: "x".repeat(PAGE_CONTEXT_CHAR_LIMIT + 10),
    });
    expect(query).toContain("[Page truncated]");
  });
});
