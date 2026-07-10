import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const marker = "Notion convergence layer";
const start = css.lastIndexOf(marker);
const convergence = start >= 0 ? css.slice(start) : "";

describe("Notion convergence layer", () => {
  it("exists as the final visual authority", () => {
    expect(start).toBeGreaterThan(0);
    expect(convergence).toContain("--n-bg-sidebar: #202020");
    expect(convergence).toContain("--surface-vibrancy: none");
  });

  it("flattens the shell and canvas instead of restoring material chrome", () => {
    expect(convergence).toMatch(/\.app-topbar\s*\{[\s\S]*?backdrop-filter:\s*none/);
    expect(convergence).toMatch(/\.stage,[\s\S]*?background-image:\s*none/);
    expect(convergence).toMatch(/\.stage::before,[\s\S]*?display:\s*none/);
  });

  it("uses compact blue selection and non-floating inspector surfaces", () => {
    expect(convergence).toMatch(/\.tree-node\.is-selected\s*\{[\s\S]*?background:\s*#e8f1fb/);
    expect(convergence).toMatch(/\.inspector-card,[\s\S]*?box-shadow:\s*none/);
    expect(convergence).toMatch(/\.property-card,[\s\S]*?box-shadow:\s*none/);
  });

  it("removes scale and material feedback from core controls", () => {
    expect(convergence).toMatch(/\.ds-btn,[\s\S]*?transform:\s*none/);
    expect(convergence).toMatch(/\.ds-btn:active:not\(\[disabled\]\),[\s\S]*?transform:\s*none/);
    expect(convergence).toMatch(/\.color-popover,[\s\S]*?backdrop-filter:\s*none/);
  });

  it("keeps a fitted preview inside the handset canvas", () => {
    expect(convergence).toMatch(/\.workspace\.workspace-mobile-shell \.stage > \.nw-canvas\s*\{[\s\S]*?min-width:\s*0/);
    expect(convergence).toMatch(/\.workspace\.workspace-mobile-shell \.stage \.nw-preview-card\s*\{[\s\S]*?width:\s*100%/);
  });

  it("uses a quiet, light export preview instead of the legacy terminal treatment", () => {
    expect(convergence).toMatch(/\.export-dialog-code\s*\{[\s\S]*?background:\s*var\(--n-bg-subtle\)/);
    expect(convergence).toMatch(/\.export-dialog-code__chrome\s*\{[\s\S]*?display:\s*none/);
    expect(convergence).toMatch(/\.export-preview-code\s*\{[\s\S]*?color:\s*var\(--n-fg-default\)/);
  });
});
