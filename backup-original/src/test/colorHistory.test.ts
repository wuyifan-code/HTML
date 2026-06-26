import { describe, expect, it, beforeEach } from "vitest";
import { COLOR_PALETTE, pushColorHistory, readColorHistory } from "../utils/color";

describe("color history", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores up to 6 most-recent colors in MRU order", () => {
    const sequence = ["#111111", "#222222", "#333333", "#444444", "#555555", "#666666", "#777777"];
    sequence.forEach((c) => pushColorHistory(c));
    const history = readColorHistory();
    expect(history).toHaveLength(6);
    expect(history[0]).toBe("#777777");
    expect(history[5]).toBe("#222222");
  });

  it("deduplicates same hex and bubbles it to the front", () => {
    pushColorHistory("#abcdef");
    pushColorHistory("#112233");
    pushColorHistory("#abcdef");
    expect(readColorHistory()).toEqual(["#abcdef", "#112233"]);
  });

  it("ignores invalid hex strings", () => {
    pushColorHistory("not-a-color");
    expect(readColorHistory()).toEqual([]);
  });

  it("exposes a 12-color curated palette with distinct values", () => {
    expect(COLOR_PALETTE).toHaveLength(12);
    expect(new Set(COLOR_PALETTE).size).toBe(12);
  });
});