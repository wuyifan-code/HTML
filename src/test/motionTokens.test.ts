import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf-8");

describe("motion token palette", () => {
  it("declares the spring palette: ease-emphasized / ease-soft-end / ease-spring-pop / ease-exit", () => {
    expect(css).toMatch(/--ease-emphasized:\s*cubic-bezier\(/);
    expect(css).toMatch(/--ease-soft-end:\s*cubic-bezier\(/);
    expect(css).toMatch(/--ease-spring-pop:\s*cubic-bezier\(/);
    expect(css).toMatch(/--ease-exit:\s*cubic-bezier\(/);
    // 旧的 ease-spring-pop 字面值被允许,但不能出现自引用循环
    expect(css).not.toMatch(/--ease-spring-pop:\s*var\(--ease-spring-pop\)/);
    expect(css).not.toMatch(/--ease-emphasized:\s*var\(--ease-emphasized\)/);
  });

  it("--ease-soft-end 与 --ease-emphasized 数值应有差异(避免死代码)", () => {
    const emphM = css.match(/--ease-emphasized:\s*cubic-bezier\(([^)]+)\)/);
    const softM = css.match(/--ease-soft-end:\s*cubic-bezier\(([^)]+)\)/);
    expect(emphM).toBeTruthy();
    expect(softM).toBeTruthy();
    expect(emphM![1].replace(/\s/g, "")).not.toBe(softM![1].replace(/\s/g, ""));
  });

  it("declares surface (glass) tokens", () => {
    expect(css).toMatch(/--surface-glass:/);
    expect(css).toMatch(/--surface-glass-strong:/);
    expect(css).toMatch(/--surface-vibrancy:\s*saturate\(180%\)\s*blur\(20px\)/);
  });

  it("declares multi-layer shadow tokens", () => {
    expect(css).toMatch(/--elev-raised:[\s\S]+?box-shadow/);
    expect(css).toMatch(/--elev-floating:[\s\S]+?box-shadow/);
    expect(css).toMatch(/--elev-window:[\s\S]+?box-shadow/);
  });

  it("declares press-scale tokens", () => {
    expect(css).toMatch(/--press-scale-button:\s*0\.97/);
    expect(css).toMatch(/--press-scale-icon:\s*0\.92/);
    expect(css).toMatch(/--press-scale-card:\s*0\.985/);
  });

  it("declares motion duration tokens", () => {
    expect(css).toMatch(/--motion-fast:\s*130ms/);
    expect(css).toMatch(/--motion-base:\s*220ms/);
    expect(css).toMatch(/--motion-slow:\s*320ms/);
  });

  it("declares focus-halo token", () => {
    expect(css).toMatch(/--focus-halo:[\s\S]+?var\(--bg-brand\)/);
  });
});

describe("curve semantics", () => {
  function curve(definition: string): { y1: number; y2: number } {
    const m = definition.match(/cubic-bezier\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
    if (!m) throw new Error("no match");
    return { y1: Number(m[2]), y2: Number(m[4]) };
  }

  it("emphasized curve pulls toward soft overshoot at the end", () => {
    const m = css.match(/--ease-emphasized:\s*(cubic-bezier\([^)]+\))/);
    expect(m, "--ease-emphasized must exist").toBeTruthy();
    const { y2 } = curve(m![1]);
    expect(y2).toBeGreaterThanOrEqual(0.8);
  });

  it("spring-pop curve carries visible overshoot", () => {
    const m = css.match(/--ease-spring-pop:\s*(cubic-bezier\([^)]+\))/);
    expect(m).toBeTruthy();
    const { y1 } = curve(m![1]);
    expect(y1).toBeGreaterThan(1);
  });

  it("exit curve has high starting slope", () => {
    const m = css.match(/--ease-exit:\s*(cubic-bezier\([^)]+\))/);
    expect(m).toBeTruthy();
    const { y1 } = curve(m![1]);
    expect(y1).toBeGreaterThanOrEqual(0.9);
  });
});

describe("prefers-reduced-motion fallback", () => {
  it("media query exists in base reset", () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(css).toMatch(/animation-duration:\s*0\.001ms\s*!important/);
    expect(css).toMatch(/transition-duration:\s*0\.001ms\s*!important/);
  });

  it("useEditorStore still references matchMedia (prefers-color-scheme fallback, no longer tween)", () => {
    const storeSrc = readFileSync(resolve(process.cwd(), "src/hooks/useEditorStore.tsx"), "utf-8");
    expect(storeSrc).toMatch(/prefers-color-scheme/);
    expect(storeSrc).toMatch(/matchMedia\(/);
  });
});

describe("component Notion-style surfaces", () => {
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

  it(".toast base uses surface-vibrancy-soft; .is-visible uses spring-pop", () => {
    const base = css.match(/\.toast\s*\{([\s\S]+?)\}/);
    expect(base).toBeTruthy();
    expect(base![1]).toMatch(/--surface-vibrancy-soft/);
    const visible = css.match(/\.toast\.is-visible\s*\{([\s\S]+?)\}/);
    expect(visible).toBeTruthy();
    expect(visible![1]).toMatch(/--ease-spring-pop/);
  });

  it(".ds-btn :active uses Notion subtle background press (no scale)", () => {
    const matches = [...css.matchAll(/\.ds-btn:active[^{]*\{([\s\S]+?)\}/g)];
    expect(matches.length).toBeGreaterThan(0);
    const hasNotionPress = matches.some((m) =>
      /transform:\s*translateY\(0\.5px\)|rgba\(0,0,0,0\.04\)/.test(m[1])
    );
    expect(hasNotionPress).toBe(true);
  });

  it(".ds-btn--icon.ds-btn--sm :active uses --press-scale-icon", () => {
    const m = css.match(/\.ds-btn--icon\.ds-btn--sm:active\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--press-scale-icon\)/);
  });
});

describe("dark theme adapts shadows and surface tokens", () => {
  it(".theme-dark overrides --elev-window with deeper rgba(0,0,0,...) shadows", () => {
    const m = css.match(/\.theme-dark\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/--elev-window:/);
    const shadowLines = m![1].match(/0\s+\d+px\s+\d+px\s+rgba\(\s*0\s*,\s*0\s*,\s*0/g);
    expect(shadowLines).toBeTruthy();
    expect(shadowLines!.length).toBeGreaterThanOrEqual(3);
  });

  it(".theme-dark lowers backdrop-blur radius / saturates surface-glass-strong", () => {
    const m = css.match(/\.theme-dark\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    // 暗色下把 --surface-vibrancy 重新声明为 saturate(160%) ... blur(28px)
    expect(m![1]).toMatch(/--surface-vibrancy:\s*saturate\(160%\)\s*blur\(28px\)/);
  });
});
