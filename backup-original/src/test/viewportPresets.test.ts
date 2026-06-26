import { describe, expect, it } from "vitest";
import { isPresetMatch, VIEWPORT_PRESETS, findMatchingPresetKey } from "../utils/viewportPresets";

describe("viewportPresets", () => {
  it("exposes exactly 4 named presets (desktop, wide, tablet, mobile)", () => {
    const keys = Object.keys(VIEWPORT_PRESETS);
    expect(keys.sort()).toEqual(["desktop", "mobile", "tablet", "wide"]);
  });

  it("isPresetMatch returns true when both width and height match the preset", () => {
    expect(isPresetMatch("desktop", 1280, 800)).toBe(true);
    expect(isPresetMatch("wide", 1440, 900)).toBe(true);
    expect(isPresetMatch("tablet", 820, 1180)).toBe(true);
    expect(isPresetMatch("mobile", 390, 844)).toBe(true);
  });

  it("isPresetMatch returns false on any width or height mismatch", () => {
    expect(isPresetMatch("desktop", 1281, 800)).toBe(false);
    expect(isPresetMatch("desktop", 1280, 801)).toBe(false);
    expect(isPresetMatch("desktop", 0, 0)).toBe(false);
  });

  it("VIEWPORT_PRESETS labels include the pixel dimensions", () => {
    expect(VIEWPORT_PRESETS.desktop.label).toContain("1280");
    expect(VIEWPORT_PRESETS.desktop.label).toContain("800");
    expect(VIEWPORT_PRESETS.wide.label).toContain("1440");
    expect(VIEWPORT_PRESETS.wide.label).toContain("900");
  });

  it("findMatchingPresetKey returns the key for matching dimensions", () => {
    expect(findMatchingPresetKey(1280, 800)).toBe("desktop");
    expect(findMatchingPresetKey(1440, 900)).toBe("wide");
    expect(findMatchingPresetKey(820, 1180)).toBe("tablet");
    expect(findMatchingPresetKey(390, 844)).toBe("mobile");
  });

  it("findMatchingPresetKey returns null for non-matching dimensions", () => {
    expect(findMatchingPresetKey(1024, 768)).toBeNull();
    expect(findMatchingPresetKey(1280, 801)).toBeNull();
  });
});
