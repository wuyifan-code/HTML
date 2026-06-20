import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const styles = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");

describe("unit-input-empty placeholder styling", () => {
  it("applies a distinct visual treatment to the unset/auto state", () => {
    // Selector must exist for the NumericUnitField empty branch.
    expect(styles).toMatch(/\.unit-input-empty\b/);
    // Italic + muted color communicate "inherit / unset".
    expect(styles).toMatch(/\.unit-input-empty[\s\S]{0,400}font-style:\s*italic/);
    expect(styles).toMatch(/\.unit-input-empty[\s\S]{0,400}color:\s*#94a3b8/);
  });

  it("signals the unset state with a dashed border (shorthand or longhand)", () => {
    const shorthand = /\.unit-input-empty[\s\S]{0,600}border:\s*1px\s+dashed/;
    const longhand = /\.unit-input-empty[\s\S]{0,600}border-style:\s*dashed/;
    expect(styles).toMatch(new RegExp(`${shorthand.source}|${longhand.source}`));
  });

  it("keeps the placeholder label visible and muted", () => {
    expect(styles).toMatch(/\.unit-input-empty::placeholder\b/);
    expect(styles).toMatch(/\.unit-input-empty::placeholder[\s\S]{0,200}opacity:\s*1/);
  });
});