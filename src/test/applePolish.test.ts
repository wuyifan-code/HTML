import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf-8");
const tokens = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf-8");

describe("canonical Notion design tokens", () => {
  it("declares flat pane tokens (no spring overshoot)", () => {
    expect(tokens).toMatch(/--motion-pane-enter:\s*var\(--n-duration-slow\)/);
    expect(tokens).toMatch(/--motion-pane-exit:\s*var\(--n-duration-base\)/);
  });

  it("declares flat press-scale tokens (value 1 = no scale)", () => {
    expect(tokens).toMatch(/--press-scale-numeric:\s*1/);
    expect(tokens).toMatch(/--press-scale-swatch:\s*1/);
  });

  it("removes topbar blur (flat surface)", () => {
    expect(tokens).toMatch(/--topbar-blur:\s*none/);
  });
});

describe("Apple typography baseline", () => {
  it("font-family-default uses the requested system sans stack", () => {
    const m = tokens.match(/--n-font-sans:\s*([^;]+);/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/ui-sans-serif.*-apple-system/);
  });

  it("body sets -webkit-font-smoothing: antialiased", () => {
    const bodyMatch = css.match(/\bbody\s*\{([\s\S]+?)\n\}/);
    const bodyTokens = tokens.match(/\bbody\s*\{([\s\S]+?)\n\}/);
    // body is defined in base.css, check tokens instead
    const baseCss = readFileSync(resolve(process.cwd(), "src/styles/base.css"), "utf-8");
    expect(baseCss).toMatch(/-webkit-font-smoothing:\s*antialiased/);
  });
});

describe("component Notion-style tokens", () => {
  it(".app-side-panel transition uses Notion duration/ease tokens", () => {
    const m = css.match(/\.app-side-panel\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--n-duration-slow\)/);
    expect(m![1]).toMatch(/var\(--n-ease\)/);
  });

  it(".app-header uses Notion-style static topbar (no backdrop-filter, single bottom border)", () => {
    const m = css.match(/\.app-header\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).not.toMatch(/backdrop-filter/);
    expect(m![1]).toMatch(/var\(--n-border-default\)/);
  });

  it(".toolbar-separator is a 1px hairline using border token", () => {
    const m = css.match(/\.toolbar-separator\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/1px/);
  });

  it(".ds-input:focus-within uses ring-focus and Notion fast easing", () => {
    const m = css.match(/\.ds-input:focus-within\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--n-ring-focus\)/);
    expect(m![1]).toMatch(/var\(--n-duration-fast\)/);
  });

  it(".color-popover uses Notion ease + duration tokens for entry", () => {
    const m = css.match(/\.color-popover\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--n-duration-base\)/);
    expect(m![1]).toMatch(/var\(--n-ease\)/);
  });

  it(".color-popover.is-closing uses fast ease-in (Notion exit)", () => {
    const matches = [...css.matchAll(/\.color-popover\.is-closing\s*\{([\s\S]+?)\}/g)];
    expect(matches.length).toBeGreaterThan(0);
    const last = matches[matches.length - 1];
    expect(last[1]).toMatch(/var\(--n-duration-fast\)/);
    expect(last[1]).toMatch(/ease-in/);
  });
});

describe("dropdown and menu (Notion flat)", () => {
  it(".dropdown-panel uses Notion tokens and single-layer shadow (no backdrop)", () => {
    const m = css.match(/\.dropdown-panel\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--n-duration-base\)/);
    expect(m![1]).toMatch(/var\(--n-ease\)/);
    expect(m![1]).toMatch(/var\(--n-shadow-pop\)/);
    expect(m![1]).not.toMatch(/backdrop-filter/);
  });

  it(".menu-action :active uses Notion subtle background press (no scale)", () => {
    const m = css.match(/\.menu-action:active\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--n-bg-subtle\)/);
  });

  it("@keyframes dropdown-pop-in animates opacity + translateY (no scale)", () => {
    const kf = css.match(/@keyframes\s+dropdown-pop-in\s*\{([\s\S]+?)\n\}/);
    expect(kf).toBeTruthy();
    expect(kf![1]).toMatch(/opacity:\s*0/);
    expect(kf![1]).toMatch(/translateY\(-2px\)/);
  });
});

describe("export dialog (Notion style)", () => {
  it(".export-dialog animation uses Notion ease and transform-origin: center", () => {
    const m = css.match(/\.export-dialog\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--n-ease\)/);
    expect(m![1]).toMatch(/transform-origin:\s*center/);
  });

  it("@keyframes export-dialog-in uses a quiet translate-only entrance", () => {
    const kf = css.match(/@keyframes\s+export-dialog-in\s*\{([\s\S]+?)\n\}/);
    expect(kf).toBeTruthy();
    expect(kf![1]).toMatch(/translateY\(8px\)/);
    expect(kf![1]).not.toMatch(/scale\(/);
  });

  it(".export-dialog.is-closing + @keyframes export-dialog-out declared", () => {
    const cls = css.match(/\.export-dialog\.is-closing\s*\{([\s\S]+?)\}/);
    expect(cls).toBeTruthy();
    expect(cls![1]).toMatch(/var\(--motion-exit\)/);
    expect(cls![1]).toMatch(/var\(--ease-exit\)/);
    expect(css).toMatch(/@keyframes\s+export-dialog-out/);
  });
});

describe("prefers-reduced-motion fallback", () => {
  it("media query zeroes all animations and transitions", () => {
    const reduced = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]+?)\n\}/);
    expect(reduced).toBeTruthy();
    expect(reduced![1]).toMatch(/animation-duration:\s*0\.001ms\s*!important/);
    expect(reduced![1]).toMatch(/transition-duration:\s*0\.001ms\s*!important/);
  });
});
