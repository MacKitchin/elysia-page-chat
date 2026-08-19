import { describe, expect, it } from "vitest";
import { corsHeaders, isAllowedOrigin } from "./cors";

describe("isAllowedOrigin", () => {
  it("allows chrome-extension and localhost", () => {
    expect(isAllowedOrigin("chrome-extension://abcd")).toBe(true);
    expect(isAllowedOrigin("http://localhost:8787")).toBe(true);
    expect(isAllowedOrigin("http://127.0.0.1:8787")).toBe(true);
  });

  it("rejects other origins", () => {
    expect(isAllowedOrigin("https://evil.example")).toBe(false);
    expect(isAllowedOrigin("")).toBe(false);
    expect(isAllowedOrigin(null)).toBe(false);
  });
});

describe("corsHeaders", () => {
  it("echoes allowed origins only", () => {
    expect(corsHeaders("chrome-extension://abcd")["Access-Control-Allow-Origin"]).toBe(
      "chrome-extension://abcd",
    );
    expect(corsHeaders("https://evil.example")["Access-Control-Allow-Origin"]).toBeUndefined();
  });
});
