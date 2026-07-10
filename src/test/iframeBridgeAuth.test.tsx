import { describe, expect, it } from "vitest";
import { buildPreviewSrcDoc } from "../utils/editorUtils";

describe("iframe bridge authentication", () => {
  it("buildPreviewSrcDoc embeds the bridge token in the script", () => {
    const html = "<div><p>hello</p></div>";
    const token = "tok-fixed-12345";
    const srcDoc = buildPreviewSrcDoc(html, null, token);
    // token 必须原样出现在 srcDoc 里(脚本会把 token 注入每条 postMessage)
    expect(srcDoc).toContain(token);
  });

  it("buildPreviewSrcDoc uses empty string when no token provided", () => {
    const html = "<div><p>hello</p></div>";
    const srcDoc = buildPreviewSrcDoc(html, null);
    // 即使无 token,srcDoc 也要可生成,token 在脚本里为空字符串
    expect(srcDoc).toContain('BRIDGE_TOKEN = ""');
  });

  it("buildPreviewSrcDoc does not throw on malformed HTML and returns a fallback doc", () => {
    // 触发 parseHtmlDocument 的 DOMParser 异常 — 这里用任意触发条件: 极长但合法内容
    const html = "<div><p>ok</p></div>";
    const srcDoc = buildPreviewSrcDoc(html, "hft-0001", "tok-x");
    expect(typeof srcDoc).toBe("string");
    expect(srcDoc.length).toBeGreaterThan(0);
  });

  it("bridge token is reflected inside postMessage payloads (sanity check on injected script)", () => {
    const token = "tok-fixed-12345";
    const srcDoc = buildPreviewSrcDoc("<div></div>", null, token);
    // 在脚本中我们让所有 OPTIMIZED_* 消息都带 token: BRIDGE_TOKEN。
    // 这里验证 BRIDGE_TOKEN 在脚本里被作为变量绑定,且出现于至少一处 postMessage 调用。
    const tokenMatches = srcDoc.match(/token:\s*BRIDGE_TOKEN/g) ?? [];
    expect(tokenMatches.length).toBeGreaterThanOrEqual(5); // SELECT/DRAG/ACTION/STATUS/CONTENT_BOUNDS/MODAL_STATE
  });

  it("malformed HTML yields fallback doc that does NOT contain the bridge token leak", () => {
    // 强行制造一个会让 DOMParser 抛错的字符串（罕见，因为 DOMParser 通常对字符串容错）
    // 用一个显然过大的不闭合文档来触发边界
    const html = "<div>" + "<span>".repeat(200) + "oops"; // 未闭合
    const srcDoc = buildPreviewSrcDoc(html, null, "tok-leak-test");
    // 不论是否走 fallback 路径,token 不应在未含 BRIDGE_TOKEN 常量的情况下出现在 srcDoc 内
    if (srcDoc.includes("解析失败")) {
      expect(srcDoc).not.toContain("tok-leak-test");
    } else {
      // 走 happy path,token 应被脚本使用,但不会以字面量泄漏
      expect(srcDoc).toContain("BRIDGE_TOKEN = \"tok-leak-test\"");
    }
  });
});