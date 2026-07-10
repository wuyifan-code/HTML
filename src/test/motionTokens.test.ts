import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf-8");
const tokens = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf-8");

describe("motion token palette", () => {
  it("declares the canonical Notion ease curve", () => {
    expect(tokens).toMatch(/--n-ease:\s*cubic-bezier\(0\.165,\s*0\.84,\s*0\.44,\s*1\)/);
  });

  it("declares Notion motion duration tokens (120/180/240ms)", () => {
    expect(tokens).toMatch(/--n-duration-fast:\s*120ms/);
    expect(tokens).toMatch(/--n-duration-base:\s*180ms/);
    expect(tokens).toMatch(/--n-duration-slow:\s*240ms/);
  });

  it("declares flat surface tokens (no glass blur)", () => {
    expect(tokens).toMatch(/--surface-vibrancy:\s*none/);
    expect(tokens).toMatch(/--surface-glass:\s*var\(--n-bg-elevated\)/);
  });

  it("declares compact shadow tokens (single-layer)", () => {
    expect(tokens).toMatch(/--n-shadow-card:[^;]+rgba\(15,15,15/);
    expect(tokens).toMatch(/--n-shadow-pop:[^;]+rgba\(15,15,15/);
    expect(tokens).toMatch(/--n-shadow-overlay:[^;]+rgba\(15,15,15/);
  });

  it("ensures no spring overshoot tokens exist", () => {
    expect(tokens).not.toMatch(/--ease-spring-pop/);
  });

  it("declares flat press-scale tokens (value 1 = no scale)", () => {
    expect(tokens).toMatch(/--press-scale-button:\s*1/);
    expect(tokens).toMatch(/--press-scale-icon:\s*1/);
    expect(tokens).toMatch(/--press-scale-card:\s*1/);
  });
});

describe("backward compatibility aliases", () => {
  it("maps old bg tokens to new n- tokens", () => {
    expect(tokens).toMatch(/--bg-base-default:\s*var\(--n-bg-elevated\)/);
    expect(tokens).toMatch(/--bg-base-secondary:\s*var\(--n-bg-subtle\)/);
    expect(tokens).toMatch(/--text-default:\s*var\(--n-fg-default\)/);
    expect(tokens).toMatch(/--border-neutral-l1:\s*#e9e9e7/);
    expect(tokens).toMatch(/--bg-brand:\s*var\(--n-brand\)/);
  });
});

describe("component Notion-style surfaces", () => {
  it("uses flat border-radius (4/5/6px) tokens", () => {
    expect(tokens).toMatch(/--n-radius-sm:\s*4px/);
    expect(tokens).toMatch(/--n-radius-md:\s*5px/);
    expect(tokens).toMatch(/--n-radius-lg:\s*6px/);
  });

  it(".history-drawer uses Notion elevated bg and ease", () => {
    const m = css.match(/\.history-drawer\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--n-bg-elevated\)/);
    expect(m![1]).toMatch(/var\(--n-ease\)/);
  });

  it(".export-dialog uses Notion elevated bg and shadow-overlay", () => {
    const m = css.match(/\.export-dialog\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--n-bg-elevated\)/);
    expect(m![1]).toMatch(/var\(--n-shadow-overlay\)/);
  });

  it(".ds-btn :active uses Notion subtle background press (no scale)", () => {
    const matches = [...css.matchAll(/\.ds-btn:active[^{]*\{([\s\S]+?)\}/g)];
    expect(matches.length).toBeGreaterThan(0);
    const hasNotionPress = matches.some((m) =>
      /transform:\s*none|box-shadow:\s*none/.test(m[1])
    );
    expect(hasNotionPress).toBe(true);
  });
});

describe("prefers-reduced-motion fallback", () => {
  it("media query exists in base styles", () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(css).toMatch(/animation-duration:\s*0\.001ms\s*!important/);
    expect(css).toMatch(/transition-duration:\s*0\.001ms\s*!important/);
  });

  it("useEditorStore still references matchMedia (prefers-color-scheme fallback)", () => {
    const storeSrc = readFileSync(resolve(process.cwd(), "src/hooks/useEditorStore.tsx"), "utf-8");
    expect(storeSrc).toMatch(/prefers-color-scheme/);
    expect(storeSrc).toMatch(/matchMedia\(/);
  });
});

describe("dark theme tokens", () => {
  it(".dark overrides Notion surface tokens", () => {
    expect(tokens).toMatch(/\.dark\s*\{/);
    expect(tokens).toMatch(/--n-bg-base:\s*#191919/);
    expect(tokens).toMatch(/--n-bg-elevated:\s*#202020/);
    expect(tokens).toMatch(/--n-brand:\s*#4dabf7/);
  });

  it("dark theme uses flat surfaces (no glass blur)", () => {
    expect(tokens).toMatch(/--surface-vibrancy:\s*none/);
  });
});
