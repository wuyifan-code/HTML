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

  it(".app-side-panel transition uses motion-spring / ease-soft-end tokens", () => {
    const m = css.match(/\.app-side-panel\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/width\s+var\(--motion-spring\)/);
    expect(m![1]).toMatch(/var\(--ease-soft-end\)/);
    expect(m![1]).not.toMatch(/cubic-bezier\(\s*0\.4\s*,\s*0\s*,\s*0\.2\s*,\s*1\s*\)/);
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

  it(".app-header uses surface-vibrancy + topbar-blur stack", () => {
    const m = css.match(/\.app-header\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--surface-vibrancy\)|var\(--topbar-blur\)/);
    expect(m![1]).toMatch(/backdrop-filter:/);
  });

  it(".toolbar-separator is a 1px hairline using border-neutral-l1", () => {
    const m = css.match(/\.toolbar-separator\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/1px/);
    expect(m![1]).toMatch(/var\(--border-neutral-l1\)/);
  });

  it(".ds-input:focus-within uses --focus-halo and motion-fast easing", () => {
    // :focus-within is the canonical ds-input focus selector in this codebase.
    const m = css.match(/\.ds-input:focus-within\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--focus-halo\)/);
    expect(m![1]).toMatch(/var\(--motion-fast\)/);
  });

  it(".color-popover uses motion-spring + ease-emphasized for entry", () => {
    const m = css.match(/\.color-popover\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--motion-spring\)/);
    expect(m![1]).toMatch(/var\(--ease-emphasized\)/);
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

describe("apple dropdown spring entrance + menu press", () => {
  it(".dropdown-panel uses spring tokens and surface-vibrancy backdrop", () => {
    const m = css.match(/\.dropdown-panel\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--motion-spring\)/);
    expect(m![1]).toMatch(/var\(--ease-emphasized\)/);
    expect(m![1]).toMatch(/backdrop-filter:\s*var\(--surface-vibrancy-strong\)/);
  });

  it(".menu-action :active uses apple-style scale-down press", () => {
    const m = css.match(/\.menu-action:active\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/transform:\s*scale\(0\.985\)/);
  });

  it("@keyframes dropdown-pop-in animates opacity + translateY + scale", () => {
    const kf = css.match(/@keyframes\s+dropdown-pop-in\s*\{([\s\S]+?)\n\}/);
    expect(kf).toBeTruthy();
    expect(kf![1]).toMatch(/opacity:\s*0/);
    expect(kf![1]).toMatch(/translateY\(-4px\)/);
    expect(kf![1]).toMatch(/scale\(0\.98\)/);
  });
});

describe("export dialog spring center-scale entrance + exit", () => {
  it(".export-dialog animation uses spring-pop ease and transform-origin: center", () => {
    const m = css.match(/\.export-dialog\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--ease-spring-pop\)/);
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
