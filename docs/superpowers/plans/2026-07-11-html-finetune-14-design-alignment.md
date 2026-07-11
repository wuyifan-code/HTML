# HTML FineTune 14-State Design Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不破坏现有编辑、AI、历史、iframe 安全和真实导出能力的前提下，使 HTML FineTune 在 14 个规定状态下精准对齐设计合同。

**Architecture:** 保留 `App` 作为业务编排入口，使用现有 `SourcePanel / CanvasPanel / InspectorPanel / ExportDialog / HistoryDrawer` 逐步收敛。`tokens.css` 是唯一 `--n-*` token 源；状态由真实业务链路驱动，视觉测试通过固定 fixture、真实交互和截图比较到达目标状态，不增加产品演示路由或隐藏测试控件。

**Tech Stack:** React 19、TypeScript、Vite、Vitest、Testing Library、Playwright、PNGJS、现有 iframe bridge、PDF-Lib、PptxGenJS。

---

## 文件职责锁定

| 文件 | 责任 |
|---|---|
| `src/App.tsx` | 文档、选择、AI、导出、历史、移动状态总编排；不得继续堆叠纯视觉 JSX |
| `src/hooks/useEditorStore.tsx` | theme、栏宽、折叠、zoom、viewport 和壳层状态 |
| `src/styles/tokens.css` | 唯一 `--n-*` token 定义 |
| `src/styles/shell.css` | TopBar、三栏、StatusBar、空状态壳层 |
| `src/styles/source-panel.css` | Source、DOM Tree、搜索、选中和诊断徽标 |
| `src/styles/canvas.css` | Stage、preview card、device frame、选择/诊断 outline |
| `src/styles/inspector.css` | Inspector section、字段和 Color trigger |
| `src/styles/controls.css` | 按钮、输入、toggle、badge、chip、Menu/Tooltip 原语 |
| `src/styles/overlays.css` | Drawer、Dialog、Popover、Toast、Color Picker、History |
| `src/styles/responsive.css` | 390×844 shell、移动 drawer、safe area |
| `src/styles.css` | 兼容入口；不得新增重复目标 selector |

计划新增：`e2e/fixtures/design-workspace.html`、`e2e/fixtures/design-diagnostics.html`、`scripts/design-states.cjs`、`scripts/render-design-references.cjs`、`scripts/e2e-design-14.cjs`、`scripts/png-diff.cjs`、`src/utils/diagnostics.ts`、`src/utils/formatExportHtml.ts` 及对应测试。

## 全局禁止项

- 不修改 `docs/design-source/pages/*`、`docs/design-references/*`、`backup-original/*`。
- 不复制设计稿 CDN、inline handler 或整段静态 HTML。
- 不修改 iframe 安全边界、AI key 标准键和 provider 定义。
- 不降低 PDF/PPTX 二进制断言，不改变动态 vendor 边界。
- 不增加隐藏控件、测试专用生产按钮或演示路由。
- 不过滤 `pageerror`/console error，不放宽断言获得绿灯。
- 不提交 `.screenshots/`、`output/design-diff/`、downloads 或浏览器缓存。

---

### Task T0: 固化 14 状态视觉合同与 Reference Renderer

**Files:**
- Create: `e2e/fixtures/design-workspace.html`
- Create: `e2e/fixtures/design-diagnostics.html`
- Create: `scripts/design-states.cjs`
- Create: `scripts/render-design-references.cjs`
- Create: `scripts/png-diff.cjs`
- Modify: `package.json`
- Test: `src/test/designContract.test.ts`

- [ ] **Step 1: 写失败的合同测试**

```ts
expect(states).toHaveLength(14);
expect(new Set(states.map((state) => state.id)).size).toBe(14);
expect(state("D01").geometry).toMatchObject({ topbar: 56, source: 280, inspector: 320, statusbar: 28 });
expect(state("D06").viewport).toEqual({ width: 390, height: 844 });
expect(state("D11").geometry).toMatchObject({ dialogWidth: 680, header: 48, tabs: 40, preview: 360, options: 44, footer: 48 });
```

- [ ] **Step 2: 运行 RED**

Run: `npm test -- src/test/designContract.test.ts`

Expected: FAIL，`design-states.cjs` 不存在。

- [ ] **Step 3: 实现状态合同**

每个对象必须包含 `id/name/viewport/reference/driver/geometry/masks/maxMismatchRatio`。D01–D14 不得遗漏；暗色增加 `theme:"dark"` 和 `sourceRootCorrection:true`。

```js
{
  id: "D01",
  name: "empty-workspace",
  viewport: { width: 1440, height: 900 },
  reference: "docs/design-references/01-empty-workspace.png",
  driver: "empty",
  geometry: { topbar: 56, source: 280, inspector: 320, statusbar: 28 },
  masks: [],
  maxMismatchRatio: 0.015
}
```

- [ ] **Step 4: 实现 Reference Renderer**

从 `docs/design-source/pages/` 提供本地服务。D03/D12/D14 在内存副本中把根节点由 light 改为 dark；原始文件不得写回。默认输出临时目录，只有显式 `--update` 可更新 reference。

- [ ] **Step 5: 实现 PNG diff**

使用 `pngjs`；单通道差值 `<=8` 视为抗锯齿容差；mask 不计；输出 width/height/comparedPixels/mismatchedPixels/mismatchRatio 和红色 diff PNG。

- [ ] **Step 6: GREEN 并提交**

Run: `npm test -- src/test/designContract.test.ts && node scripts/render-design-references.cjs --check && npm run build`

Commit: `test(design): codify fourteen visual reference states`

**验收：** 14 个状态可机器读取；源稿未变化；暗稿纠错只发生在渲染副本；无产品代码改动。

---

### Task T1: 收敛 Token 与 CSS 权威

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles.css`
- Modify: `src/styles/base.css`
- Modify: `src/styles/shell.css`
- Modify: `src/styles/source-panel.css`
- Modify: `src/styles/canvas.css`
- Modify: `src/styles/inspector.css`
- Modify: `src/styles/controls.css`
- Modify: `src/styles/overlays.css`
- Modify: `src/styles/responsive.css`
- Test: `src/test/motionTokens.test.ts`
- Test: `src/test/notionConvergence.test.ts`
- Test: `src/test/visualPolish.test.ts`

- [ ] **Step 1: 写失败测试**

锁定 `--n-radius-xl:8px`、`--n-ease-out:var(--n-ease)`、`--n-bg-default:var(--n-bg-base)`、dark hover `#2a2a2a`，并断言本次目标 selector 不同时存在于 `styles.css` 和模块 CSS。

- [ ] **Step 2: 运行 RED**

Run: `npm test -- src/test/motionTokens.test.ts src/test/notionConvergence.test.ts src/test/visualPolish.test.ts`

- [ ] **Step 3: 修复 token 和层级**

`tokens.css` 定义合同 token 和兼容 alias；其他文件只消费 token。只迁移后续任务会修改的 shell/source/canvas/inspector/menu/toast/export/history/mobile selector，不对其余 CSS 做格式化。

- [ ] **Step 4: 验证并提交**

Run: `npm test -- src/test/motionTokens.test.ts src/test/notionConvergence.test.ts src/test/visualPolish.test.ts src/test/applePolish.test.ts && npm run build && git diff --check`

Commit: `refactor(ui): establish authoritative design tokens and css layers`

**验收：** 无未定义关键 token；暗色 token 与合同一致；不新增渐变、毛玻璃或重复目标 selector。

---

### Task T2: 对齐桌面 Shell、空状态和主工作区

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/hooks/useEditorStore.tsx`
- Modify: `src/components/workspace/shell/WorkspaceShell.tsx`
- Modify: `src/components/workspace/shell/TopBar.tsx`
- Modify: `src/components/workspace/shell/StatusBar.tsx`
- Modify: `src/components/workspace/EmptyWorkspace.tsx`
- Modify: `src/components/workspace/source/SourcePanel.tsx`
- Modify: `src/components/workspace/inspector/InspectorPanel.tsx`
- Modify: `src/styles/shell.css`
- Modify: `src/styles/responsive.css`
- Test: `src/test/workspaceShell.test.tsx`
- Test: `src/test/emptyWorkspace.test.tsx`
- Test: `src/test/themeProvider.test.tsx`

- [ ] **Step 1: 写空状态三栏失败测试**

空文档时必须同时存在 `panel-source-tree`、`.empty-workspace` 和 Inspector empty state；顶栏编辑按钮 disabled。

- [ ] **Step 2: 写几何失败测试**

锁定默认 source 280、inspector 320、topbar 56、statusbar 28；TopBar 接收 zoom/viewport callbacks。

- [ ] **Step 3: 运行 RED**

Run: `npm test -- src/test/workspaceShell.test.tsx src/test/emptyWorkspace.test.tsx src/test/themeProvider.test.tsx`

- [ ] **Step 4: 最小实现**

始终渲染三栏；empty 通过 props 禁用交互并显示 placeholder。把缩放、适应和设备入口放入 TopBar；Canvas 内不得重复第二条桌面 toolbar。

- [ ] **Step 5: 验证并提交**

Run: `npm test -- src/test/workspaceShell.test.tsx src/test/emptyWorkspace.test.tsx src/test/themeProvider.test.tsx src/test/mobilePanelBackdrop.test.ts && npm run build`

Commit: `feat(ui): align desktop shell and persistent empty workspace`

**验收：** D01 保留左右栏；D02/D03 切主题不改变几何；56/280/320/28 和 preview 800±2 达标。

---

### Task T3: 统一 Source Draft 并修复 DOM Tree 接线

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/workspace/source/SourcePanel.tsx`
- Modify: `src/components/workspace/source/SourceCodeView.tsx`
- Modify: `src/components/workspace/source/DomTreeView.tsx`
- Modify: `src/components/TreeItem.tsx`
- Modify: `src/styles/source-panel.css`
- Test: `src/test/sourcePanel.test.tsx`
- Test: `src/test/sourceEditorPolish.test.tsx`
- Test: `src/test/domTree.test.ts`
- Test: `src/test/e2e-ui.test.tsx`

- [ ] **Step 1: 写 stale draft 回归测试**

import/undo/history jump 后 textarea 必须显示新的 `sourceDraft`；“应用”提交当前输入而不是旧 state。

- [ ] **Step 2: 写折叠与 diagnostics 测试**

折叠父节点后子节点消失；展开恢复。节点 badge 从传入问题映射计算，不得固定为 0。

- [ ] **Step 3: 运行 RED**

Run: `npm test -- src/test/sourcePanel.test.tsx src/test/sourceEditorPolish.test.tsx src/test/domTree.test.ts src/test/e2e-ui.test.tsx`

- [ ] **Step 4: 实现单一受控 draft 与真实 tree state**

只保留 App 的 `sourceDraft`。SourcePanel/SourceCodeView 接收 `value/onChange/onApply(value)`；App 传 `visibleTree/collapsedTreeIds`；禁止读取 `(node as any).isCollapsed`。

- [ ] **Step 5: 对齐并提交**

Run: `npm test -- src/test/sourcePanel.test.tsx src/test/sourceEditorPolish.test.tsx src/test/domTree.test.ts src/test/e2e-ui.test.tsx && npm run build`

Commit: `fix(source): unify draft state and wire the real dom tree`

**验收：** 零 stale；折叠真实隐藏子树；搜索框 28、树行 24、缩进 16、选中左条 3；Source/DOM active 与可见内容一致。

---

### Task T4: 接入 DeviceFrame 与桌面设备预览

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/workspace/canvas/CanvasPanel.tsx`
- Modify: `src/components/workspace/canvas/ViewportToolbar.tsx`
- Modify: `src/components/workspace/canvas/DeviceFrame.tsx`
- Modify: `src/utils/viewportPresets.ts`
- Modify: `src/styles/canvas.css`
- Test: `src/test/canvasPanel.test.tsx`
- Test: `src/test/viewportPresets.test.ts`

- [ ] **Step 1: 写 D05 失败测试**

mobile preset 渲染 `.device-frame`，外框 399×691、内部 375×667；desktop 不渲染手机外壳。

- [ ] **Step 2: 运行 RED**

Run: `npm test -- src/test/canvasPanel.test.tsx src/test/viewportPresets.test.ts`

- [ ] **Step 3: 生产接入并实现设备操作**

CanvasPanel 根据 preset 选择普通 preview、tablet 或 phone frame；复用同一 iframe。支持 1440×900、768×1024、375×667、custom、旋转、zoom 和 fit。

- [ ] **Step 4: 验证并提交**

Run: `npm test -- src/test/canvasPanel.test.tsx src/test/viewportPresets.test.ts src/test/buildPreviewSrcDoc.test.ts src/test/iframeBridgeAuth.test.tsx && npm run build`

Commit: `feat(canvas): add production device preview frames`

**验收：** 399/691、375/667、36/24px 圆角和 32px 尺寸条满足 ±1px；iframe 安全测试不变。

---

### Task T5: 对齐 Inspector 主状态

**Files:**
- Modify: `src/components/workspace/inspector/InspectorPanel.tsx`
- Modify: `src/components/workspace/inspector/InspectorSection.tsx`
- Modify: `src/components/PretextMeasureBadge.tsx`
- Modify: `src/components/ColorField.tsx`（仅 trigger）
- Modify: `src/styles/inspector.css`
- Test: `src/test/inspectorPanel.test.tsx`
- Test: `src/test/fontStyleToggle.test.tsx`

- [ ] **Step 1: 写 section 顺序和 active card 失败测试**

固定首屏顺序：Typography、Spacing、Color、Size、Border；active section 左 3px brand。业务字段不得删除，额外字段放在设计首屏以下。

- [ ] **Step 2: 运行 RED**

Run: `npm test -- src/test/inspectorPanel.test.tsx src/test/fontStyleToggle.test.tsx`

- [ ] **Step 3: 对齐字段和密度**

卡片 margin 8、radius 5、1px border；标签/值字体和 24/28/32 控件高度遵循设计合同。

- [ ] **Step 4: 验证并提交**

Run: `npm test -- src/test/inspectorPanel.test.tsx src/test/fontStyleToggle.test.tsx src/test/pretextMeasure.test.ts && npm run build`

Commit: `feat(inspector): align property sections with the design contract`

**验收：** D02/D03/D04 右栏几何稳定；已有字体、间距、颜色、尺寸、边框编辑仍写回 HTML。

---

### Task T6: 建立 D10 统一 Diagnostics 数据链

**Files:**
- Create: `src/utils/diagnostics.ts`
- Modify: `src/types/editor.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/workspace/shell/TopBar.tsx`
- Modify: `src/components/workspace/source/DomTreeView.tsx`
- Modify: `src/components/TreeItem.tsx`
- Modify: `src/components/workspace/canvas/CanvasPanel.tsx`
- Modify: `src/components/workspace/inspector/DiagnosticsSection.tsx`
- Modify: `src/components/InspectorDiagnostics.tsx`
- Modify: `src/components/workspace/shell/StatusBar.tsx`
- Modify: `src/styles/source-panel.css`
- Modify: `src/styles/canvas.css`
- Modify: `src/styles/inspector.css`
- Test: `src/test/diagnostics.test.ts`

- [ ] **Step 1: 定义并测试 Problem 类型**

```ts
export type ProblemSeverity = "error" | "warning" | "info";

export interface EditorProblem {
  id: string;
  ruleId: "inline-style" | "img-alt" | "html-lang";
  severity: ProblemSeverity;
  hftId: string | null;
  line: number | null;
  title: string;
  fixable: boolean;
  ignored: boolean;
}
```

Fixture 必须稳定产生 1 error、1 warning、1 info。问题 ID 稳定去重；不得因 Inspector 正常写回在同一编辑帧无限增加重复问题。

- [ ] **Step 2: 运行 RED**

Run: `npm test -- src/test/diagnostics.test.ts`

- [ ] **Step 3: 实现单一数据源**

`scanDiagnostics(html)` memoize；TopBar count、Tree badge、Canvas outline、Inspector list、StatusBar summary 都消费同一数组。

- [ ] **Step 4: 实现 fix/ignore**

`img-alt` 写入空 alt；`html-lang` 可写入 `lang="zh-CN"` 或按设计保存 ignored rule；`inline-style` 只移除目标节点现有 inline style。所有修复进入 history 并保留选择。

- [ ] **Step 5: 对齐 D10 并提交**

Run: `npm test -- src/test/diagnostics.test.ts src/test/inspectorPanel.test.tsx src/test/domTree.test.ts src/test/useEditorHistory.test.tsx && npm run build`

Commit: `feat(diagnostics): connect problems across tree canvas and inspector`

**验收：** 精确 1/1/1；顶栏、Tree、Canvas、Inspector、32px summary 同步；AI annotations 与 native problems 不互相覆盖。

---

### Task T7: 生产接入 Menu、ToastRegion 与 Tooltip

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/workspace/shell/TopBar.tsx`
- Modify: `src/components/ui/Menu.tsx`
- Modify: `src/components/ui/ToastRegion.tsx`
- Modify: `src/components/Tooltip.tsx`
- Modify: `src/components/AiProviderPicker.tsx`
- Modify: `src/styles/controls.css`
- Modify: `src/styles/overlays.css`
- Test: `src/test/menu.test.tsx`
- Test: `src/test/toastRegion.test.tsx`
- Test: `src/test/tooltip.test.tsx`

- [ ] **Step 1: 写生产挂载失败测试**

App 只能渲染 `ToastRegion`，不得保留 legacy 单条 `.toast`。移动更多操作使用 `Menu`；provider picker 从现有 provider 定义生成。

- [ ] **Step 2: 扩展 Menu 类型并测试**

支持 `disabled/danger/shortcut/description/checked/submenu/divider/header/footer`；Escape 关闭并恢复 trigger focus；ArrowDown/Up 循环且跳过 disabled。

- [ ] **Step 3: 运行 RED**

Run: `npm test -- src/test/menu.test.tsx src/test/toastRegion.test.tsx src/test/tooltip.test.tsx src/test/e2e-ui.test.tsx`

- [ ] **Step 4: 接入并对齐 D08/D09**

替换 hardcoded mobile actions 和 legacy toast。Menu 4/5/32/12/8；Toast 320/min40/p12/bottom-right24；Tooltip 11px/p4×8，四方向与 viewport flip 生效。

- [ ] **Step 5: 验证并提交**

Run: `npm test -- src/test/menu.test.tsx src/test/toastRegion.test.tsx src/test/tooltip.test.tsx src/test/e2e-ui.test.tsx && npm run build`

Commit: `feat(overlays): connect menus notifications and tooltips`

**验收：** 生产不存在 legacy toast/hardcoded menu；无隐藏假控件；provider/key/model 行为保持。

---

### Task T8: 重构 Color Picker

**Files:**
- Modify: `src/components/ColorField.tsx`
- Modify: `src/hooks/useColorHistory.ts`
- Modify: `src/utils/color.ts`
- Modify: `src/styles/inspector.css`
- Modify: `src/styles/overlays.css`
- Test: `src/test/color.test.ts`
- Test: `src/test/colorHistory.test.ts`
- Test: `src/test/colorFieldHistory.test.tsx`

- [ ] **Step 1: 写 D07 结构与交互失败测试**

断言 300px popover、268×140 map、268×8 sliders、8×24 preset grid、recent、合法 hex、alpha 和 Escape/outside close。

- [ ] **Step 2: 运行 RED**

Run: `npm test -- src/test/color.test.ts src/test/colorHistory.test.ts src/test/colorFieldHistory.test.tsx`

- [ ] **Step 3: 实现可访问交互**

指针使用 pointer capture；Arrow 改 1 单位、Shift+Arrow 改 10；无效 hex 不提交；选择完成后 debounce 写 recent。

- [ ] **Step 4: 验证并提交**

Run: `npm test -- src/test/color.test.ts src/test/colorHistory.test.ts src/test/colorFieldHistory.test.tsx && npm run build`

Commit: `feat(color): align picker geometry and accessible controls`

**验收：** D07 几何 ±1px；选择颜色仍即时写回 Inspector；recent 不重复、不无限增长。

---

### Task T9: 校准 History 明暗状态

**Files:**
- Modify: `src/components/HistoryDrawer.tsx`
- Modify: `src/utils/historySummary.ts`（仅展示格式确需时）
- Modify: `src/styles/overlays.css`
- Test: `src/test/historyDrawerPolish.test.ts`
- Test: `src/test/historyPanel.test.tsx`
- Test: `src/test/historySummary.test.ts`
- Test: `src/test/useEditorHistory.test.tsx`

- [ ] **Step 1: 写几何和行为失败测试**

锁定 340/top76/right16/max808/radius8、56px row、40px footer、current `aria-current="step"` 和 3px indicator。

- [ ] **Step 2: 运行 RED**

Run: `npm test -- src/test/historyDrawerPolish.test.ts src/test/historyPanel.test.tsx src/test/historySummary.test.ts src/test/useEditorHistory.test.tsx`

- [ ] **Step 3: 只校准展示**

不改 history reducer 语义；保留跳转、redo 分支和清空当前基线。实现亮/暗 overlay、交替底色、4px scrollbar 和 reduced motion。

- [ ] **Step 4: 验证并提交**

Run: `npm test -- src/test/historyDrawerPolish.test.ts src/test/historyPanel.test.tsx src/test/historySummary.test.ts src/test/useEditorHistory.test.tsx && npm run build`

Commit: `feat(history): match the light and dark history drawer`

**验收：** D13/D14 几何 ±1px；关闭恢复焦点；清空保留当前文档；无 reducer 回归。

---

### Task T10: 对齐 Export Preview 并实现 HTML 格式选项

**Files:**
- Modify: `src/components/ExportDialog.tsx`
- Modify: `src/components/ExportPreviewDialog.tsx`
- Modify: `src/App.tsx`
- Create: `src/utils/formatExportHtml.ts`
- Modify: `src/styles/overlays.css`
- Test: `src/test/exportHtmlFormatting.test.ts`
- Test: `src/test/exportDialog.test.tsx`
- Test: `src/test/exportPreviewDialogWarnings.test.tsx`

- [ ] **Step 1: 写格式化失败测试**

```ts
expect(formatExportHtml(html, { mode: "minified", includeComments: false })).not.toContain("<!--");
expect(formatExportHtml(html, { mode: "pretty", includeComments: true })).toContain("\n  <body>");
```

- [ ] **Step 2: 写 D11/D12 几何失败测试**

锁定 680 宽和 48/40/360/44/48 五段高度；HTML/PDF/PPTX tabs；close/cancel；toggle 状态。

- [ ] **Step 3: 运行 RED**

Run: `npm test -- src/test/exportHtmlFormatting.test.ts src/test/exportDialog.test.tsx src/test/exportPreviewDialogWarnings.test.tsx`

- [ ] **Step 4: 实现格式化与 Dialog**

格式化结果只用于 HTML preview/copy/download。先执行 `cleanHtmlForExport`，再格式化。PDF/PPTX 继续接收原有 clean HTML。亮 backdrop .30、暗 .60；不新增独立顶栏 PDF/PPTX 按钮。

- [ ] **Step 5: 完整验证并提交**

Run: `npm test -- src/test/exportHtmlFormatting.test.ts src/test/exportDialog.test.tsx src/test/exportPreviewDialogWarnings.test.tsx src/test/exportPdf.test.ts src/test/exportPptx.test.ts src/test/exportSnapshot.test.ts src/test/exportSnapshotIframe.test.ts && npm run build && node e2e-export.cjs`

Commit: `feat(export): match preview dialog and html formatting controls`

**验收：** D11/D12 几何 ±1px；HTML 选项真实生效；PDF/PPTX 下载与二进制检查不降级。

---

### Task T11: 实现 390×844 移动 Shell 与 320px Drawer

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/workspace/shell/TopBar.tsx`
- Modify: `src/components/workspace/source/SourcePanel.tsx`
- Modify: `src/components/workspace/inspector/InspectorPanel.tsx`
- Modify: `src/styles/shell.css`
- Modify: `src/styles/responsive.css`
- Test: `src/test/mobilePanelBackdrop.test.ts`
- Test: `src/test/workspaceShell.test.tsx`
- Test: `src/test/sourcePanel.test.tsx`

- [ ] **Step 1: 写 D06 失败测试**

390px viewport 下断言 header 52、bottom nav 52、drawer 320、backdrop visible、Source/DOM tabs、Escape 和 focus restore。

- [ ] **Step 2: 运行 RED**

Run: `npm test -- src/test/mobilePanelBackdrop.test.ts src/test/workspaceShell.test.tsx src/test/sourcePanel.test.tsx`

- [ ] **Step 3: 实现移动壳**

沿用项目 `max-width:760px`；不得把源稿 `min-width:400px` 展示规则复制成产品断点。Drawer transform；backdrop z40、drawer z50、safe area、180–240ms。

- [ ] **Step 4: 实现底部导航**

52px，至少 Preview、Source、Inspector；当前入口有 selected 状态。触控目标最低 32×32，优先 40×40。

- [ ] **Step 5: 验证并提交**

Run: `npm test -- src/test/mobilePanelBackdrop.test.ts src/test/workspaceShell.test.tsx src/test/sourcePanel.test.tsx && npm run build`

Commit: `feat(mobile): implement the responsive shell and source drawer`

**验收：** 390×844 无水平滚动、裁切或不可见主操作；drawer 320±1；遮罩/按钮/Escape 都能关闭。

---

### Task T12: 14 状态视觉收口与 CI Gate

**Files:**
- Create/Modify: `scripts/e2e-design-14.cjs`
- Modify: `scripts/design-states.cjs`
- Modify: `scripts/run-e2e.cjs`
- Modify: `package.json`
- Modify: `.github/workflows/deploy.yml`
- Modify: only files named by a failed visual state
- Create: `design-qa.md`

- [ ] **Step 1: 完成真实状态 drivers**

| 状态 | 到达方式 |
|---|---|
| D01 | 清空 localStorage，打开空工作区 |
| D02/D03 | 导入 workspace fixture，切 theme |
| D04 | 切 DOM Tree，选中 h1 |
| D05 | 选择 mobile viewport preset |
| D06 | 390×844，点击 Source drawer trigger |
| D07 | 选中元素，点击文字颜色 trigger |
| D08 | 打开文件/上下文/viewport/provider 菜单的规定状态 |
| D09 | 触发四方向 tooltip 和四种 toast |
| D10 | 导入 diagnostics fixture |
| D11/D12 | 打开 ExportDialog HTML tab，切 theme |
| D13/D14 | 产生固定 history entries，打开 drawer，切 theme |

- [ ] **Step 2: 增加几何硬断言**

设计合同列出的固定尺寸必须通过 `getBoundingClientRect()` 检查；桌面容差 ±1px，preview/device ±2px。

- [ ] **Step 3: 增加错误 Gate**

```js
page.on("pageerror", (error) => pageErrors.push(error));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
```

两者必须精确为 0，不设白名单。

- [ ] **Step 4: 执行 visual compare**

Run: `node scripts/e2e-design-14.cjs --compare`

每个状态输出 `reference.png`、`actual.png`、`diff.png`、`metrics.json`、`geometry.json`。整体 mismatch `<=1.5%`；关键 bbox、token color 和文本为硬断言，不被整体阈值豁免。

- [ ] **Step 5: 写 design-qa.md**

逐图记录 viewport、mismatch、bbox 和剩余偏差。只有 P0/P1/P2 为 0 时写 `final result: passed`。

- [ ] **Step 6: 接入 CI 并最终验证**

`npm run ci` 顺序必须为 test → build → existing E2E → design 14 compare。

Run: `npm test && npm run build && node scripts/run-e2e.cjs && node scripts/e2e-design-14.cjs --compare && git diff --check && git status --short`

Commit: `test(design): gate delivery on all fourteen visual states`

**验收：** 14/14 有完整证据；`design-qa.md` 为 passed；无 pageerror/console error；最终工作树干净。

---

## 风险登记

| 风险 | 触发信号 | 强制处理 |
|---|---|---|
| 暗稿 root class 错误 | 暗稿 computed token 仍为亮色 | 只在 reference 临时副本激活 `.dark`，原稿不改 |
| 中文双重乱码 | UI 出现 `姝/鍙/锛` 等字符 | 停止复制源文案，恢复编码或使用现有正确中文 |
| CSS 多层覆盖 | DevTools 中目标规则来自 `styles.css` 末尾旧 override | 删除 touched selector 的旧重复定义，模块 CSS 成为唯一来源 |
| App 状态继续膨胀 | 纯展示状态继续新增在 `App.tsx` | 下沉到对应组件或专用 hook，不重构业务 store 之外的无关部分 |
| Source draft 再次 stale | import/undo 后 textarea 与画布不一致 | 单一受控 draft；加入 import/undo/history 回归测试 |
| Diagnostics 误报爆炸 | Inspector 正常写回后问题数持续增长 | 稳定 rule ID + hftId 去重；扫描 memoize；fixture 精确 1/1/1 |
| Device preview 与移动 Shell 混用 | 390px 产品页面出现 phone mock 外框 | D05 只用于桌面 Canvas，D06 只用于 responsive shell |
| 字体抗锯齿造成误差 | bbox/颜色正确但 glyph 像素小幅变化 | 仅 mask glyph 内部或使用通道容差 8，不扩大结构 mask |
| Export 功能回归 | 视觉通过但 PDF/PPTX 二进制失败 | 保留原 clean HTML 和导出 utilities；HTML 格式化只作用于 HTML |
| CI 浏览器差异 | 本地通过、Ubuntu 找不到 Chrome/字体 | 使用已接入的 Playwright Chromium 安装；固定 viewport 和字体 fallback |
| E2E 假绿 | 日志出现 pageerror 但脚本 PASS | 错误数组精确为 0，不设过滤器；任一子场景失败统一退出 1 |
| 超范围改动 | 任务需要修改未授权业务 util | 停止任务并报告文件、原因和影响，等待架构确认 |

---

## 每任务必须返回的材料

1. 任务 ID、提交哈希和提交标题。
2. 修改文件列表；说明每个文件为何在允许范围内。
3. RED 命令、预期失败原因和关键原始输出。
4. GREEN 命令、退出码和测试计数。
5. 对应状态的 reference/actual/diff/metrics 路径。
6. `git diff --check` 原始输出。
7. `git status --short` 原始输出。
8. 风险或未满足项；存在阻断时禁止声称完成。
