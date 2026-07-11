import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const tokens = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf8");
const marker = "Convergence layer";
const start = css.lastIndexOf(marker);
const convergence = start >= 0 ? css.slice(start) : "";

describe("Notion convergence layer", () => {
  it("exists as the token-based visual authority", () => {
    expect(start).toBeGreaterThan(0);
    expect(convergence).toContain("flat surfaces, single shadows");
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

  it("uses a quiet, light export preview instead of legacy terminal treatment", () => {
    expect(convergence).toMatch(/\.export-dialog-code\s*\{[\s\S]*?background:\s*var\(--n-bg-subtle\)/);
    expect(convergence).toMatch(/\.export-dialog-code__chrome\s*\{[\s\S]*?display:\s*none/);
    expect(convergence).toMatch(/\.export-preview-code\s*\{[\s\S]*?color:\s*var\(--n-fg-default\)/);
  });
});

describe("canonical token source", () => {
  it("defines --n-* in tokens.css, not in styles.css", () => {
    expect(css).not.toMatch(/--n-bg-base:\s*#ffffff/);
    expect(tokens).toMatch(/--n-bg-base:\s*#ffffff/);
  });

  it("defines dark theme in tokens.css, not in styles.css convergence section", () => {
    expect(tokens).toMatch(/\.dark\s*\{/);
    expect(tokens).toMatch(/--n-bg-sidebar:\s*#202020/);
  });
});

describe("no duplicate selectors across styles.css and module CSS", () => {
  const moduleFiles = [
    "src/styles/shell.css",
    "src/styles/source-panel.css",
    "src/styles/canvas.css",
    "src/styles/inspector.css",
    "src/styles/controls.css",
    "src/styles/overlays.css",
    "src/styles/responsive.css",
  ];

  // Only check the main CSS area (before the convergence layer marker)
  // The convergence layer at the bottom of styles.css intentionally overrides
  // module definitions and is not a "duplicate selector" problem.
  const mainCss = start >= 0 ? css.slice(0, start) : css;

  for (const modFile of moduleFiles) {
    it(`${modFile} shares no structural selector with styles.css`, () => {
      const modCss = readFileSync(resolve(process.cwd(), modFile), "utf8");
      // Key structural selectors that must NOT appear in both files
      const structuralSelectors = [
        "workspace",
        "topbar",
        "app-header",
        "panel",
        "panel-head",
        "panel-tabs",
        "stage-panel",
        "stage",
        "canvas-panel",
        "inspector-panel",
        "property-card",
        "export-dialog",
        "history-drawer",
        "color-popover",
        "tooltip",
        "toast",
        "menu",
        "dropdown-panel",
      ];
      for (const sel of structuralSelectors) {
        // Match selector as a root-level definition: ^.selector { or ^.selector,
        // (must start at column 0 — not indented inside @media or other blocks)
        const rootDefRegex = new RegExp(
          String.raw`^\.${sel}\s*\{`,
          "m"
        );
        const inMain = rootDefRegex.test(mainCss);
        const inModule = rootDefRegex.test(modCss);
        if (inMain && inModule) {
          // Fail: same structural selector defined in both files
          expect(
            `Selector .${sel} found in both styles.css and ${modFile}`
          ).toBe("should only be in one file");
        }
      }
    });
  }
});
