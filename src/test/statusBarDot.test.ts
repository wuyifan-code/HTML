import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const styles = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");
const app = readFileSync(join(process.cwd(), "src/App.tsx"), "utf8");

describe("status bar breathing dot", () => {
  it("declares the pulse keyframes", () => {
    expect(styles).toMatch(/@keyframes\s+hft-status-dot-pulse/);
  });

  it("applies pulse to .status-preview-ready .status-dot", () => {
    expect(styles).toMatch(/\.status-preview-ready\s+\.status-dot\b/);
    expect(styles).toMatch(/\.status-preview-ready\s+\.status-dot[\s\S]{0,300}animation:\s*hft-status-dot-pulse/);
  });

  it("applies spin to .status-preview-syncing .status-dot", () => {
    expect(styles).toMatch(/\.status-preview-syncing\s+\.status-dot[\s\S]{0,300}hft-status-dot-spin/);
  });

  it("uses the syncing tone in App.tsx when not ready", () => {
    expect(app).toMatch(/tone:\s*"syncing"/);
    expect(app).toMatch(/status-preview-\$\{previewStatus\.tone\}/);
  });
});