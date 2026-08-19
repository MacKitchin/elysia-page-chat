import { describe, expect, it } from "vitest";
import { PAGE_ACTIONS, actionById } from "./actions";

describe("PAGE_ACTIONS", () => {
  it("includes summarize as the first action", () => {
    expect(PAGE_ACTIONS[0]?.id).toBe("summarize");
    expect(PAGE_ACTIONS[0]?.label).toBe("Summarize this page");
    expect(PAGE_ACTIONS[0]?.prompt.toLowerCase()).toContain("summarize");
  });

  it("gives every action a unique id, label, and prompt", () => {
    const ids = PAGE_ACTIONS.map((action) => action.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const action of PAGE_ACTIONS) {
      expect(action.label.length).toBeGreaterThan(2);
      expect(action.prompt.length).toBeGreaterThan(20);
    }
  });

  it("looks up actions by id", () => {
    expect(actionById("actions")?.label).toBe("Extract action items");
    expect(actionById("missing")).toBeUndefined();
  });
});
