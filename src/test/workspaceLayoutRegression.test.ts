import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const inspectorCss = readFileSync(resolve(process.cwd(), "src/styles/inspector.css"), "utf-8");
const canvasCss = readFileSync(resolve(process.cwd(), "src/styles/canvas.css"), "utf-8");
const shellCss = readFileSync(resolve(process.cwd(), "src/styles/shell.css"), "utf-8");
const sourceCss = readFileSync(resolve(process.cwd(), "src/styles/source-panel.css"), "utf-8");
const appSource = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf-8");

describe("workspace layout regressions", () => {
  it("keeps inspector cards at their intrinsic height inside the scroll region", () => {
    expect(inspectorCss).toMatch(
      /\.inspector-body\s*>\s*\*\s*\{[^}]*flex-shrink:\s*0/s,
    );
  });

  it("assigns canvas scrolling to the stage instead of the outer panel", () => {
    expect(canvasCss).toMatch(
      /\.stage-panel\.nw-canvas\s*\{[^}]*overflow:\s*hidden[^}]*padding:\s*0/s,
    );
    expect(canvasCss).toMatch(
      /\.stage\s*>\s*\.nw-canvas\s*\{[^}]*overflow:\s*visible/s,
    );
  });

  it("gives panel resizers a full-height absolute hit target", () => {
    expect(shellCss).toMatch(
      /\.nw-left-panel\s*>\s*\.panel-resizer,\s*\.nw-right-panel\s*>\s*\.panel-resizer\s*\{[^}]*position:\s*absolute[^}]*top:\s*0[^}]*bottom:\s*0/s,
    );
  });

  it("keeps the inspector resize floor aligned with the 320px design width", () => {
    expect(appSource).toMatch(/const DEFAULT_INSPECTOR_WIDTH = 320;/);
    expect(appSource).toMatch(/const MIN_INSPECTOR_WIDTH = 320;/);
  });

  it("keeps the inspector collapse control compact in the title row", () => {
    expect(inspectorCss).toMatch(
      /\.inspector-tabs-wrap\s*>\s*\.nw-inspector-title\s*\{[^}]*flex:\s*1/s,
    );
    expect(inspectorCss).toMatch(
      /\.inspector-tabs-wrap\s*>\s*\.panel-collapse-btn\s*\{[^}]*flex:\s*0\s+0\s+28px/s,
    );
  });

  it("uses the same typography metrics for source text and line numbers", () => {
    expect(sourceCss).toMatch(/\.source-code-editor\s*\{[^}]*--source-code-line-height:/s);
    expect(sourceCss).toMatch(/\.source-code-gutter\s*\{[^}]*font-size:\s*var\(--source-code-font-size\)[^}]*line-height:\s*var\(--source-code-line-height\)/s);
    expect(sourceCss).toMatch(/\.source-code-textarea\s*\{[^}]*font-size:\s*var\(--source-code-font-size\)[^}]*line-height:\s*var\(--source-code-line-height\)/s);
  });

  it("keeps the canvas toolbar compact without reintroducing nested overflow", () => {
    expect(canvasCss).toMatch(
      /\.stage-panel\s*>\s*\.viewport-bar\s*\{[^}]*height:\s*44px[^}]*overflow:\s*hidden/s,
    );
    expect(canvasCss).toMatch(
      /\.stage-panel\s*>\s*\.viewport-bar\s+\.segmented-button\s*>\s*span\s*\{[^}]*display:\s*none/s,
    );
    expect(canvasCss).toMatch(
      /\.stage-panel\s*>\s*\.viewport-bar\s+\.segmented-viewport-control\s*\{[^}]*width:\s*92px[^}]*flex:\s*0\s+0\s+92px/s,
    );
    expect(canvasCss).toMatch(
      /\.stage\s*>\s*\.nw-canvas\s*\{[^}]*flex:\s*1\s+1\s+auto[^}]*min-width:\s*0[^}]*padding:\s*16px/s,
    );
  });

  it("keeps zoomed previews scrollable and batches grab-hand movement", () => {
    expect(canvasCss).toMatch(
      /\.stage\s*>\s*\.nw-canvas\s+\.nw-preview-card\s*\{[^}]*flex:\s*0\s+0\s+max-content[^}]*width:\s*max-content/s,
    );
    expect(appSource).toMatch(/requestAnimationFrame\(flushDrag\)/);
    expect(appSource).toMatch(/stage\.setPointerCapture\?\./);
    expect(appSource).toMatch(/stage\.classList\.add\("is-panning"\)/);
    expect(appSource).toMatch(/useElementSize\(stageRef,\s*!isEmptyDoc\)/);
  });

  it("allows the canvas toolbar to wrap on mobile", () => {
    expect(canvasCss).toMatch(
      /@media\s*\(max-width:\s*760px\)\s*\{[\s\S]*?\.stage-panel\s*>\s*\.viewport-bar\s*\{[^}]*height:\s*auto[^}]*overflow:\s*visible/s,
    );
  });

  it("does not make the 25MB iframe document depend on selection state", () => {
    expect(appSource).toMatch(
      /buildPreviewSrcDoc\(state\.html,\s*null,\s*bridgeTokenRef\.current\)/,
    );
    expect(appSource).toMatch(
      /HTML_FINETUNE_OPTIMIZED_SET_SELECTION/,
    );
    expect(appSource).not.toMatch(
      /buildPreviewSrcDoc\(state\.html,\s*selectedId/,
    );
  });

  it("prepares clean export HTML only when the user requests an export action", () => {
    expect(appSource).not.toMatch(
      /const\s+cleanHtml\s*=\s*useMemo\(\(\)\s*=>\s*cleanHtmlForExport/,
    );
    expect(appSource).toMatch(/const\s+prepareExport\s*=\s*useCallback/);
    expect(appSource).not.toMatch(/const\s+isDocumentEmpty\s*=\s*useMemo/);
  });
});
