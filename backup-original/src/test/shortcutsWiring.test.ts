import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const app = readFileSync(join(process.cwd(), "src/App.tsx"), "utf8");
const panel = readFileSync(join(process.cwd(), "src/components/HtmlInputPanel.tsx"), "utf8");

describe("Task 3 wiring: shortcuts + lastSyncedAt", () => {
  it("imports useShortcuts hook", () => {
    expect(app).toMatch(/import\s*\{\s*useShortcuts\s*\}\s*from\s*"\.\/hooks\/useShortcuts"/);
  });

  it("declares lastSyncedAt state", () => {
    expect(app).toMatch(/const\s+\[lastSyncedAt,\s*setLastSyncedAt\]\s*=\s*useState<number>/);
  });

  it("binds at least 12 distinct combos via useShortcuts", () => {
    const blockMatch = app.match(/useShortcuts\(\[\s*([\s\S]*?)\]\);/);
    const block = blockMatch ? blockMatch[1] : "";
    const combos = new Set<string>();
    const re = /combo:\s*"([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(block)) !== null) combos.add(m[1]);
    expect(combos.size).toBeGreaterThanOrEqual(12);
    // Sanity: a few critical combos
    expect(combos.has("mod+z")).toBe(true);
    expect(combos.has("mod+shift+z")).toBe(true);
    expect(combos.has("mod+y")).toBe(true);
    expect(combos.has("delete")).toBe(true);
    expect(combos.has("backspace")).toBe(true);
    expect(combos.has("esc")).toBe(true);
    expect(combos.has("mod+e")).toBe(true);
    expect(combos.has("mod+f")).toBe(true);
    expect(combos.has("mod+b")).toBe(true);
    expect(combos.has("mod+1")).toBe(true);
    expect(combos.has("mod+5")).toBe(true);
  });

  it("exposes the legacy mod+Z effect (should now be gone)", () => {
    // The old inline keydown effect that only handled mod+Z/Y must be removed.
    const legacyEffectPresent = /if \(key !== "z" && key !== "y"\) return;/.test(app);
    expect(legacyEffectPresent).toBe(false);
  });

  it("renders formatRelative in the status-preview small", () => {
    expect(app).toMatch(/formatRelative\(lastSyncedAt\)/);
  });

  it("declares formatRelative helper", () => {
    expect(app).toMatch(/function\s+formatRelative\s*\(/);
    expect(app).toMatch(/return\s+"刚刚"/);
  });

  it("tagged tree search input for ⌘F targeting", () => {
    expect(panel).toMatch(/data-tree-search-input/);
  });
});