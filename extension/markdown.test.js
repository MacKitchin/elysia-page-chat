import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown.js";

describe("renderMarkdown", () => {
  it("renders headings and paragraphs on separate lines", () => {
    const html = renderMarkdown("## Title\n\nHello world.");
    expect(html).toContain("<h2>");
    expect(html).toContain("Title");
    expect(html).toContain("<p>");
    expect(html).toContain("Hello world.");
  });

  it("renders nested bullet lists instead of one paragraph", () => {
    const html = renderMarkdown(
      "- Header\n  - Tagline\n  - Dates\n- Why exhibit\n  - Buyers",
    );
    expect(html).toContain("<ul>");
    expect(html.match(/<ul>/g)?.length).toBeGreaterThan(1);
    expect(html).toContain("<li>");
    expect(html).not.toContain("Header Tagline");
  });

  it("promotes mid-line heading markers so ### is not shown as text", () => {
    const html = renderMarkdown(
      "II. Why Exhibit Section ### A. Show Statistics - Total participants - Meetings booked",
    );
    expect(html).not.toContain("###");
    expect(html).toMatch(/<h3>/);
    expect(html).toContain("<li>");
    expect(html).toContain("Total participants");
  });

  it("renders roman-numeral sections as headings", () => {
    const html = renderMarkdown("I. Header & Event Overview\n- Register now");
    expect(html).toMatch(/<h3/);
    expect(html).toContain("Header &amp; Event Overview");
    expect(html).toContain("<ul>");
  });

  it("renders blockquotes and fenced code", () => {
    const html = renderMarkdown("> a quote\n\n```js\nconst x = 1;\n```");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("a quote");
    expect(html).toContain("<pre>");
    expect(html).toContain("const x = 1;");
  });

  it("escapes HTML", () => {
    const html = renderMarkdown("<script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
