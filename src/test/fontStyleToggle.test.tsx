import { describe, expect, it } from "vitest";
import { buildSelectedSnapshot } from "../utils/editorUtils";
import { updateHtmlElementByHftId } from "../utils/domPath";
import { injectEditableIds } from "../utils/injectEditableIds";

const HTML_TEMPLATE = "<div><p>hello</p></div>";

function buildHtmlWithEditableIds(html: string) {
  return injectEditableIds(html).html;
}

describe("fontStyle toggle (italic)", () => {
  it("selected snapshot returns italic when element has font-style: italic", () => {
    const html = buildHtmlWithEditableIds(
      `<p style="font-style: italic">hello</p>`
    );
    const hftId = html.match(/data-hft-id="(hft-[^"]+)"/)![1];
    const snapshot = buildSelectedSnapshot(html, hftId);
    expect(snapshot?.fontStyle).toBe("italic");
  });

  it("selected snapshot returns empty string when font-style not set", () => {
    const html = buildHtmlWithEditableIds(HTML_TEMPLATE);
    const hftId = html.match(/data-hft-id="(hft-[^"]+)"/)![1];
    const snapshot = buildSelectedSnapshot(html, hftId);
    expect(snapshot?.fontStyle).toBe("");
  });

  it("toggle italic writes inline font-style: italic and toggles back to normal", () => {
    const initial = buildHtmlWithEditableIds(HTML_TEMPLATE);
    const hftId = initial.match(/data-hft-id="(hft-[^"]+)"/)![1];

    // Apply italic
    const italicHtml = updateHtmlElementByHftId(initial, hftId, {
      styles: { fontStyle: "italic" },
    });
    expect(buildSelectedSnapshot(italicHtml, hftId)?.fontStyle).toBe("italic");

    // Toggle back to normal
    const normalHtml = updateHtmlElementByHftId(italicHtml, hftId, {
      styles: { fontStyle: "normal" },
    });
    expect(buildSelectedSnapshot(normalHtml, hftId)?.fontStyle).toBe("normal");
  });

  it("selected snapshot is null when hftId does not exist", () => {
    const html = buildHtmlWithEditableIds(HTML_TEMPLATE);
    expect(buildSelectedSnapshot(html, "hft-doesnotexist")).toBeNull();
  });
});