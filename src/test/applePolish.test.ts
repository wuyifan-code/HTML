import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf-8");

describe("apple-level polish tokens", () => {
  it("declares new pane / press / blur tokens", () => {
    expect(css).toMatch(/--motion-pane-enter:\s*360ms/);
    expect(css).toMatch(/--motion-pane-exit:\s*220ms/);
    expect(css).toMatch(/--press-scale-numeric:\s*1\.04/);
    expect(css).toMatch(/--press-scale-swatch:\s*0\.94/);
    expect(css).toMatch(/--topbar-blur:\s*saturate\(180%\)\s*blur\(20px\)/);
  });

  it(".app-side-panel transition uses Notion duration/ease tokens", () => {
    const m = css.match(/\.app-side-panel\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--n-duration-slow\)/);
    expect(m![1]).toMatch(/var\(--n-ease\)/);
  });

  it(".app-side-panel--left entry animation uses motion-spring + ease-emphasized", () => {
    const m = css.match(/\.app-side-panel--left:not\(\.app-side-panel--collapsed\) > \*\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--motion-spring\)/);
    expect(m![1]).toMatch(/var\(--ease-emphasized\)/);
  });

  it(".app-side-panel--right entry animation uses motion-spring + ease-emphasized", () => {
    const m = css.match(/\.app-side-panel--right:not\(\.app-side-panel--collapsed\) > \*\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--motion-spring\)/);
    expect(m![1]).toMatch(/var\(--ease-emphasized\)/);
  });

  it("declares panel-content-exit-left and panel-content-exit-right keyframes", () => {
    expect(css).toMatch(/@keyframes\s+panel-content-exit-left/);
    expect(css).toMatch(/@keyframes\s+panel-content-exit-right/);
  });

  it(".app-header uses Notion-style static topbar (no backdrop-filter, single bottom border)", () => {
    const m = css.match(/\.app-header\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).not.toMatch(/backdrop-filter/);
    expect(m![1]).toMatch(/var\(--n-border-default\)/);
  });

  it(".toolbar-separator is a 1px hairline using border-neutral-l1", () => {
    const m = css.match(/\.toolbar-separator\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/1px/);
    expect(m![1]).toMatch(/var\(--border-neutral-l1\)/);
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

  it(".color-popover.is-closing uses motion-exit + ease-exit", () => {
    const m = css.match(/\.color-popover\.is-closing\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--motion-exit\)/);
    expect(m![1]).toMatch(/var\(--ease-exit\)/);
  });

  it("declares @keyframes numeric-pop with press-scale-numeric and an is-changed rule using spring-pop", () => {
    expect(css).toMatch(/@keyframes\s+numeric-pop/);
    const kf = css.match(/@keyframes\s+numeric-pop\s*\{([\s\S]+?)\n\}/);
    expect(kf).toBeTruthy();
    expect(kf![1]).toMatch(/var\(--press-scale-numeric\)/);
    const m = css.match(/\.ds-input--numeric\.is-changed\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/numeric-pop\s+var\(--motion-base\)\s+var\(--ease-spring-pop\)/);
  });

  it("prefers-reduced-motion fallback zeroes all animations and transitions", () => {
    const reduced = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]+?)\n\}/);
    expect(reduced).toBeTruthy();
    expect(reduced![1]).toMatch(/animation-duration:\s*0\.001ms\s*!important/);
    expect(reduced![1]).toMatch(/transition-duration:\s*0\.001ms\s*!important/);
  });
});

describe("apple typography baseline", () => {
  it("font-family-default begins with the Apple system font stack", () => {
    const m = css.match(/--font-family-default:\s*([^;]+);/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/^-apple-system\s*,\s*BlinkMacSystemFont\s*,\s*"SF Pro Text"/);
  });

  it("body sets -webkit-font-smoothing: antialiased", () => {
    const body = css.match(/\bbody\s*\{([\s\S]+?)\n\}/);
    expect(body).toBeTruthy();
    expect(body![1]).toMatch(/-webkit-font-smoothing:\s*antialiased/);
  });
});

describe("apple dropdown entrance + menu press (Notion)", () => {
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

describe("export dialog center-scale entrance + exit (Notion)", () => {
  it(".export-dialog animation uses Notion ease and transform-origin: center", () => {
    const m = css.match(/\.export-dialog\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--n-ease\)/);
    expect(m![1]).toMatch(/transform-origin:\s*center/);
  });

  it("@keyframes export-dialog-in uses scale(0.92) at start", () => {
    const kf = css.match(/@keyframes\s+export-dialog-in\s*\{([\s\S]+?)\n\}/);
    expect(kf).toBeTruthy();
    expect(kf![1]).toMatch(/scale\(0\.92\)/);
  });

  it(".export-dialog.is-closing + @keyframes export-dialog-out declared", () => {
    const cls = css.match(/\.export-dialog\.is-closing\s*\{([\s\S]+?)\}/);
    expect(cls).toBeTruthy();
    expect(cls![1]).toMatch(/var\(--motion-exit\)/);
    expect(cls![1]).toMatch(/var\(--ease-exit\)/);
    expect(css).toMatch(/@keyframes\s+export-dialog-out/);
  });
});
