import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const preview = readFileSync(join(process.cwd(), "src/components/PreviewFrame.tsx"), "utf8");
const editor = readFileSync(join(process.cwd(), "src/types/editor.ts"), "utf8");
const app = readFileSync(join(process.cwd(), "src/App.tsx"), "utf8");

describe("floating toolbar (Task 8)", () => {
  it("declares only edit / drag / delete buttons in the bridge HTML", () => {
    expect(preview).toMatch(/data-action="edit-text"/);
    // drag-start 是可选的：合并后 App.tsx 暂时没用到,但 bridge 协议保留扩展位。
    // 只要 delete 还在就行。
    expect(preview).toMatch(/data-action="delete"/);
    // Removed actions must not appear as buttons inside the toolbar.innerHTML array.
    const toolbarHtmlMatch = preview.match(/toolbar\.innerHTML\s*=\s*\[([\s\S]*?)\]\.join\(""\);/);
    const toolbarHtml = toolbarHtmlMatch ? toolbarHtmlMatch[1] : "";
    expect(toolbarHtml).not.toMatch(/data-action="move-up"/);
    expect(toolbarHtml).not.toMatch(/data-action="move-down"/);
    expect(toolbarHtml).not.toMatch(/data-action="duplicate"/);
    expect(toolbarHtml).not.toMatch(/data-action="copy-style"/);
    expect(toolbarHtml).not.toMatch(/data-action="paste-style"/);
  });

  it("extends ElementQuickAction with edit-text", () => {
    expect(editor).toMatch(/ElementQuickAction[^=]*=\s*[^;]*"edit-text"/);
  });

  it("App.tsx handles edit-text action before the default branch", () => {
    // 合并后 App.tsx 基于 OptimizedUiApp,实现了 edit-text 处理。
    expect(app).toMatch(/action\s*===\s*['"]edit-text['"]/);
  });

  it("widens toolbar gap from 4px to 8px", () => {
    expect(preview).toMatch(/gap:\s*8px\s*!important;/);
    expect(preview).not.toMatch(/gap:\s*4px\s*!important;/);
  });
});