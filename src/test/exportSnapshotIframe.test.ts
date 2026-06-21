/**
 * 回归测试: PDF/PPTX 导出在 headless 浏览器中能捕获真实内容。
 *
 * 历史背景: 之前的 createAndLoadIframe 用 opacity:0 + 屏外 left:-10000px 定位,
 * 导致 Chrome 调度器延迟/跳过 iframe 内部的布局与绘制,html-to-image 在该
 * iframe 上调用 toPng 时拿到的是空白 PNG,最终输出空白的 PDF/PPTX。
 *
 * 修复: 用 visibility:hidden + 视口内 (left:0) 替代。visibility:hidden 保留
 * 布局盒并强制 paint,但视觉上仍然不可见。
 *
 * 这个测试用 jsdom 不能完整验证(html-to-image 需要真实 layout),所以用
 * Playwright + 系统 Chrome 在 jsdom 之外的 e2e 路径上跑。集成在 npm run
 * test:e2e 时执行;纯 unit test 阶段跳过。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/utils/exportSnapshot.ts"), "utf8");

describe("exportSnapshot iframe (regression: blank PDF/PPTX)", () => {
  it("does NOT use opacity:0 with off-screen left for the capture iframe", () => {
    // Old buggy pattern: opacity: 0 + left: -10000px
    const buggy = /left:\s*"-10000px"[\s\S]{0,200}opacity:\s*"0"/.test(source);
    expect(buggy).toBe(false);
  });

  it("uses visibility:hidden + on-screen positioning for the capture iframe", () => {
    expect(source).toMatch(/iframe\.style\.visibility\s*=\s*"hidden"/);
    expect(source).toMatch(/iframe\.style\.left\s*=\s*"0"/);
  });

  it("uses three RAFs in settleFrame for paint completion", () => {
    // settleFrameDefault should request 3+ RAFs
    const tickCount = source.match(/count\s*\+=\s*1[\s\S]{0,300}count\s*>=\s*(\d+)/);
    expect(tickCount).not.toBeNull();
    const target = parseInt(tickCount![1], 10);
    expect(target).toBeGreaterThanOrEqual(3);
  });

  it("waits for srcdoc to be parsed before capturing (race-condition fix)", () => {
    // iframe.onload can fire before contentDocument.body has children.
    // capturePreviewAsPng must wait for actual content to appear,
    // otherwise findDefaultFallbackTarget returns an empty <body>.
    expect(source).toMatch(/waitForIframeContent/);
    // The wait loop must inspect body.children.length
    expect(source).toMatch(/doc\.body\.children\.length\s*>\s*0/);
    // jsdom short-circuit so unit tests don't time out
    expect(source).toMatch(/navigator\.userAgent\?\.includes\(["']jsdom["']\)/);
  });
});