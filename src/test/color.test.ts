import { describe, expect, it } from "vitest";
import {
  normalizeHexColor,
  isValidHexColor,
  hexToRgb,
  rgbToHex,
  hexToHsv,
  hsvToHex,
  clampNumber,
} from "../utils/color";

describe("color: hex normalization", () => {
  it("expands 3-digit hex to 6-digit", () => {
    expect(normalizeHexColor("#abc")).toBe("#aabbcc");
  });

  it("lowercases 6-digit hex", () => {
    expect(normalizeHexColor("#AABBCC")).toBe("#aabbcc");
  });

  it("returns ink fallback for non-hex string", () => {
    expect(normalizeHexColor("not-a-color")).toBe("#141413");
  });

  it("parses rgb(255, 99, 71)", () => {
    expect(normalizeHexColor("rgb(255, 99, 71)")).toBe("#ff6347");
  });

  it("parses rgba(0, 0, 0, 0.5) — alpha is dropped, rgb is solid black", () => {
    // 文档化的行为:alpha 一律丢弃,返回纯色 hex
    expect(normalizeHexColor("rgba(0, 0, 0, 0.5)")).toBe("#000000");
  });

  it("clamps rgb channels above 255", () => {
    expect(normalizeHexColor("rgb(300, 999, 1000)")).toBe("#ffffff");
  });

  it("trims whitespace", () => {
    expect(normalizeHexColor("  #abcdef  ")).toBe("#abcdef");
  });
});

describe("color: isValidHexColor", () => {
  it("accepts 3-digit and 6-digit hex", () => {
    expect(isValidHexColor("#abc")).toBe(true);
    expect(isValidHexColor("#abcdef")).toBe(true);
  });

  it("accepts rgb() and rgba()", () => {
    expect(isValidHexColor("rgb(255, 99, 71)")).toBe(true);
    expect(isValidHexColor("rgba(0, 0, 0, 0.5)")).toBe(true);
  });

  it("rejects garbage strings", () => {
    expect(isValidHexColor("not-a-color")).toBe(false);
    expect(isValidHexColor("")).toBe(false);
  });

  it("rejects rgb() with garbage alpha (.. not a number)", () => {
    // 之前 isValidHexColor 用 [\d.]+ 接受 .., normalizeHexColor 不接受 — 不对称。
    // 修复后 isValidHexColor 也应拒绝。
    expect(isValidHexColor("rgba(0, 0, 0, ..)")).toBe(false);
  });

  it("rejects CSS Level 4 space-separated rgb() (not supported)", () => {
    // 文档化:目前只支持逗号分隔
    expect(isValidHexColor("rgb(0 200 100)")).toBe(false);
  });
});

describe("color: round-trip stability", () => {
  it("hexToRgb ↔ rgbToHex round-trips common colors", () => {
    const cases = ["#ff6347", "#19a997", "#000000", "#ffffff", "#141413"];
    for (const hex of cases) {
      const rgb = hexToRgb(hex);
      expect(rgbToHex(rgb)).toBe(hex);
    }
  });

  it("hexToHsv ↔ hsvToHex round-trips common colors with reasonable precision", () => {
    const cases = ["#ff6347", "#19a997", "#000000", "#ffffff"];
    for (const hex of cases) {
      const hsv = hexToHsv(hex);
      const back = hsvToHex(hsv);
      // 浮点容差 — 重新计算差异
      const originalRgb = hexToRgb(hex);
      const backRgb = hexToRgb(back);
      expect(Math.abs(originalRgb.r - backRgb.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(originalRgb.g - backRgb.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(originalRgb.b - backRgb.b)).toBeLessThanOrEqual(1);
    }
  });
});

describe("color: hsvToHex NaN defense", () => {
  it("returns a safe fallback for NaN hue (does not produce '#nanNaNnan')", () => {
    const result = hsvToHex({ h: NaN, s: 50, v: 50 });
    // 不应包含 'nan' 字符串
    expect(result.toLowerCase()).not.toContain("nan");
  });

  it("returns a safe fallback for Infinity hue", () => {
    const result = hsvToHex({ h: Infinity, s: 50, v: 50 });
    expect(result.toLowerCase()).not.toContain("nan");
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("color: clampNumber", () => {
  it("clamps to range", () => {
    expect(clampNumber(150, 0, 100)).toBe(100);
    expect(clampNumber(-5, 0, 100)).toBe(0);
    expect(clampNumber(50, 0, 100)).toBe(50);
  });

  it("returns min for non-finite", () => {
    expect(clampNumber(NaN, 0, 100)).toBe(0);
    expect(clampNumber(Infinity, 0, 100)).toBe(0);
  });
});