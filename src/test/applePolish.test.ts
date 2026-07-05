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

  it("declares @keyframes numeric-pop used by .ds-input--numeric.is-changed", () => {
    expect(css).toMatch(/@keyframes\s+numeric-pop/);
    const m = css.match(/\.ds-input--numeric\.is-changed\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--press-scale-numeric\)/);
    expect(m![1]).toMatch(/var\(--ease-spring-pop\)|var\(--motion-base\)/);
  });

  it("prefers-reduced-motion fallback zeroes all animations and transitions", () => {
    const reduced = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]+?)\n\}/);
    expect(reduced).toBeTruthy();
    expect(reduced![1]).toMatch(/animation-duration:\s*0\.001ms\s*!important/);
    expect(reduced![1]).toMatch(/transition-duration:\s*0\.001ms\s*!important/);
  });
});
