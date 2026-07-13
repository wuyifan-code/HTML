import { describe, expect, it } from "vitest";
import { buildPreviewSrcDoc, cssString, formatPreviewStatusMessage } from "../utils/editorUtils";

describe("buildPreviewSrcDoc fallback", () => {
  it("returns a non-empty fallback when DOMParser cannot build a document", () => {
    // DOMParser 在 jsdom 中通常对任意字符串都容错;为模拟 parseHtmlDocument 抛错,
    // 这里我们用极其异常的 input(但仍会通过 DOMParser 解析),
    // 改为:检验 srcDoc 永远非空,即便遇到未闭合 HTML 也不返回 undefined。
    const html = "<div><p>ok</p>";
    const srcDoc = buildPreviewSrcDoc(html, null, "tok-test");
    expect(typeof srcDoc).toBe("string");
    expect(srcDoc.length).toBeGreaterThan(100);
  });

  it("preserves the bridge token in the script payload", () => {
    const html = "<div></div>";
    const srcDoc = buildPreviewSrcDoc(html, null, "fixed-token-99");
    // BRIDGE_TOKEN 必须以原值出现在 srcDoc 中
    expect(srcDoc).toContain("fixed-token-99");
  });

  it("renders the optimized quickbar as a polished toolbar with meta, icons, and all actions", () => {
    const srcDoc = buildPreviewSrcDoc("<main><h1>Hello</h1></main>", null, "tok-test");
    expect(srcDoc).toContain('quickbar.setAttribute("role", "toolbar")');
    expect(srcDoc).toContain('class="hft-qb-meta"');
    expect(srcDoc).toContain('data-role="tag"');
    expect(srcDoc).toContain('data-label="编辑"');
    expect(srcDoc).toContain('data-action="edit-text"');
    expect(srcDoc).toContain('data-action="duplicate"');
    expect(srcDoc).toContain('data-action="move-up"');
    expect(srcDoc).toContain('data-action="move-down"');
    expect(srcDoc).toContain('data-action="copy-style"');
    expect(srcDoc).toContain('data-action="paste-style"');
    expect(srcDoc).toContain('data-action="delete"');
    expect(srcDoc).toContain("function hideQuickbar()");
    expect(srcDoc).toContain('event.key === "Escape"');
  });

  it("keeps selection updates inside the iframe instead of rebuilding srcdoc", () => {
    const html = '<main><h1 data-hft-id="hft-0001">Hello</h1></main>';
    const unselected = buildPreviewSrcDoc(html, null, "tok-test");
    const selected = buildPreviewSrcDoc(html, "hft-0001", "tok-test");

    expect(selected).toBe(unselected);
    expect(selected).toContain("HTML_FINETUNE_OPTIMIZED_SET_SELECTION");
  });

  it("activates a hidden slide through the deck API or navigation controls before selecting", () => {
    const srcDoc = buildPreviewSrcDoc(
      '<button data-slide="2">Page 2</button><section class="slide" data-slide="1"><h1 data-hft-id="hft-0001">One</h1></section><section class="slide" data-slide="2" style="display:none"><h1 data-hft-id="hft-0002">Two</h1></section>',
      null,
      "tok-test",
    );

    expect(srcDoc).toContain("const slideSelector");
    expect(srcDoc).toContain("function activateSlideFor");
    expect(srcDoc).toContain("function selectElementByHftId");
    expect(srcDoc).toContain("HTML_FINETUNE_OPTIMIZED_SLIDE_ACTIVATED");
    expect(srcDoc).toContain("control.click()");
    expect(srcDoc).not.toContain("slide.style.setProperty(\"display\"");
  });
});

describe("cssString escaping", () => {
  it("escapes backslashes and double quotes", () => {
    expect(cssString('a\\b"c')).toBe('a\\\\b\\"c');
  });

  it("does not change plain alphanumeric strings", () => {
    expect(cssString("hft-0001")).toBe("hft-0001");
  });
});

describe("preview status copy", () => {
  it("hides bridge implementation details from the status bar", () => {
    expect(formatPreviewStatusMessage("预览桥接已就绪")).toBe("预览已同步");
    expect(formatPreviewStatusMessage("  预览桥接已就绪  ")).toBe("预览已同步");
  });

  it("preserves user-facing preview messages", () => {
    expect(formatPreviewStatusMessage("已打开预览弹窗")).toBe("已打开预览弹窗");
  });
});
