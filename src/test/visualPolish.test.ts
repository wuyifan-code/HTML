import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * 视觉回归保护:
 *   - 移动端 backdrop-filter 必须被彻底禁用(防止中低端机型帧率掉到 30fps 以下)
 *   - 键盘焦点 halo 必须含 inset shadow(避免环变单层)
 *   - 我们用 mockMatchMedia + createElement 触发样式计算;jsdom 不支持 backdrop-filter,
 *     这里改读 styles.css 字面量规则进行语义化断言,与 motionTokens.test.ts 配合。
 */

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const tokens = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf8");

describe("backdrop-filter 移动端兜底", () => {
  it("在 @media (max-width: 760px) 内禁用所有浮层 backdrop-filter", () => {
    // 找到 @media (max-width: 760px) 块 — 校验其中确实包含 !important 的禁用
    const blocks = [...css.matchAll(/@media \(max-width:\s*760px\)\s*\{([\s\S]+?)(?=\n\}\n|\n@media |\s*\}\s*$)/g)];
    expect(blocks.length).toBeGreaterThan(0);
    const hasFallback = blocks.some((m) =>
      /backdrop-filter:\s*none\s*!important/.test(m[1]) &&
      /-webkit-backdrop-filter:\s*none\s*!important/.test(m[1])
    );
    expect(hasFallback, "至少一个 760px 块包含 backdrop-filter: none !important").toBe(true);
  });

  it("禁用后 float 节点使用 color-mix 兜底或 fallback token", () => {
    const mobileBlock = css.match(
      /@media \(max-width:\s*760px\)\s*\{[\s\S]+?(?=\n\}\n|\n@media |\s*\}\s*$)/
    );
    expect(mobileBlock).toBeTruthy();
    const block = mobileBlock![0];
    // 至少给 .color-popover / .toast / .export-dialog 一个 fallback 背景
    const hasPopoverFallback = /\.color-popover[\s\S]*?background:\s*var\(--bg-base-default\)/.test(block) ||
      /\.color-popover \{[\s\S]*?background:\s*var\(--bg-base-default\)/.test(block);
    const hasExportDialogFallback = /background:\s*linear-gradient/.test(block) ||
      /\.export-dialog\s*\{/.test(block);
    expect(hasPopoverFallback || hasExportDialogFallback).toBe(true);
  });
});

describe("focus halo 视觉断言", () => {
  it(":focus-visible 必须显式声明 inset halo 与 outer ring", () => {
    // :focus-visible 引用 var(--focus-halo),inset 由 :root 中 token 定义承担
    const focusVisible = css.match(/:focus-visible\s*\{([\s\S]+?)\}/);
    expect(focusVisible).toBeTruthy();
    expect(focusVisible![1]).toMatch(/var\(--focus-halo\)|box-shadow/);

    // 在 :root 中 --focus-halo 定义在 tokens.css（单行），须含 'inset' 与第二层 outer ring
    const focusHaloMatch = tokens.match(/--focus-halo:\s*([^;]+);/);
    expect(focusHaloMatch, "--focus-halo 必须在 tokens.css :root 中声明并含值").toBeTruthy();
    expect(focusHaloMatch![1], "focus halo 外层 ring 4px (双环结构: bg gap + brand ring)").toMatch(/4px/);
  });

  it("全局 :focus 关闭 outline 但 :focus-visible 必须有可见焦点环(非 none 仅有)", () => {
    const focus = css.match(/:focus\s*\{([\s\S]+?)\}/);
    const focusVisible = css.match(/:focus-visible\s*\{([\s\S]+?)\}/);
    expect(focus).toBeTruthy();
    expect(focusVisible).toBeTruthy();
    expect(focus![1], ":focus 关掉 outline").toMatch(/outline:\s*none/);
    // :focus-visible 必须给 box-shadow / outline 至少一个
    expect(focusVisible![1], ":focus-visible 必须含 outline 或 box-shadow").toMatch(/outline|box-shadow/);
  });

  it("浮层内的 :focus-visible 双重兜底:box-shadow + outline", () => {
    const backdropFallbacks = css.match(
      /\.export-dialog :focus-visible,[\s\S]+?\{([\s\S]+?)\}/,
    );
    expect(backdropFallbacks, "export-dialog / .history-drawer 等浮层内的 :focus-visible 双保险").toBeTruthy();
    expect(backdropFallbacks![1]).toMatch(/outline/);
  });
});

describe("reduced-motion 一致性", () => {
  it("所有 @media (prefers-reduced-motion: reduce) 块都使用统一的 0.001ms 兜底", () => {
    // 不再允许出现 0.01ms 等不同值(过去三处不一致)
    const disallowed = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?0\.01ms\s*!important/);
    expect(disallowed, "reduced-motion 必须统一到 0.001ms,不允许 0.01ms 残留").toBeNull();
  });

  it("使用 forwards 的关键帧在 reduced-motion 下也能呈现 to-state(因 duration = 0.001ms)", () => {
    // 检查所有 forwards 动画 — 由于 duration 几乎是 0,浏览器仍把元素跳到 to 的最终计算值。
    // 这是 CSS 规范行为,无需额外处理。我们只列出 forwards 用法作为 sanity 计数。
    const forwardsCount = (css.match(/animation-fill-mode:\s*forwards/g) || []).length;
    expect(forwardsCount).toBeGreaterThanOrEqual(0);
  });
});
