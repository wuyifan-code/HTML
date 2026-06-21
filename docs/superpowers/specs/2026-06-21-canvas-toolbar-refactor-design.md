# Canvas 工具栏重构 — 设计文档

- **日期**：2026-06-21
- **状态**：待审阅
- **作者**：ZCode (brainstorming)

## 1. 背景与问题

### 1.1 现状
当前 Canvas 工具栏（位于 `src/components/PreviewFrame.tsx` 第 178–285 行）包含 3 组共 11 个 UI 元素：

| 组 | 元素 | 数量 | 类型 |
|---|---|---|---|
| 视口预设 (segmented) | 桌面 / 宽屏 / 平板 / 手机 / 适配 | 5 | 按钮 |
| 画布读数 | `1280 × 800 🔒` | 1 | readout |
| 缩放控制 | `-` / `100% / 适应` / `+` / 独立 `适应` | 4 | 按钮 + readout |
| 全屏 | `全屏 / 恢复` | 1 | 按钮 |

### 1.2 问题
1. **功能冗余**：5 个 preset 按钮（桌面/宽屏/平板/手机/适配）本质都是"设置 W×H 这一对数字"，占用 5 个按钮槽位却只表达 1 个维度。
2. **信息重复**：preset 按钮 hover 时显示 `1280×800` 像素尺寸，旁边又有独立 readout 重复显示同一数字。
3. **风格偏离**：项目 UI 风格为"图文并存的线性 UI"（图标 + 文字组合按钮），但 Canvas 工具栏里有 `1280 × 800 🔒` 这类纯文字 readout + Lock 图标的异类组件，与项目其他位置不一致。
4. **空间挤压**：preset 区 ~430px + readout/缩放/全屏 ~400px = ~830px 总宽度，挤在 50px 高的 panel-header 内。

### 1.3 项目整体 UI 风格约束（已与用户确认）
- **图文并存的线性 UI**：按钮 = 图标 + 文字
- **禁止纯图标按钮**：每个按钮必须有可见的中文文字标签
- **禁止纯文字 readout 用图标装饰**：与项目其他位置一致
- 参考实现：`src/components/Toolbar.tsx`（撤销/重做/导入/复制/导出/历史）

## 2. 设计目标

1. 消除视口 preset 区的功能冗余（5 个按钮 → 1 个紧凑编辑器）
2. 支持任意自定义尺寸（之前只能选预设）
3. Canvas 工具栏总宽度从 ~830px 降至 ≤ 600px
4. 与项目整体 UI 风格一致（图文字并存、无纯图标按钮、无异类 readout）
5. 保持 `PreviewViewportMode` 类型与 `mod+1..5` 快捷键不变（向后兼容）

## 3. 解决方案

### 3.1 总体结构

把 11 个元素压缩为 4 组共 10 个元素：

```
Canvas  │  当前: [1280] × [800]  [▾ 桌面]  [适配]  │  [−]  [适应 / 100%]  [+]  │  [↗ 全屏]
```

| 组 | 元素 | 数量 | 类型 |
|---|---|---|---|
| 视口尺寸编辑器 | `当前:` label + 宽度 input + `×` + 高度 input + preset 下拉 | 5 | 表单 |
| 视口模式切换 | `适配` 按钮 | 1 | 按钮 |
| 缩放控制 | `−` / `适应 / 100%` / `+` | 3 | 按钮 |
| 全屏 | `全屏 / 恢复` | 1 | 按钮 |

### 3.2 视口尺寸编辑器（核心新增）

**JSX 结构**（位于 `preview-header-actions` 起始位置）：

```tsx
<div className="viewport-editor" aria-label="视口尺寸">
  <span className="viewport-editor-label">当前:</span>
  <input
    className="viewport-size-input"
    type="number"
    inputMode="numeric"
    min={120}
    max={3840}
    value={viewportWidth}
    onChange={(e) => onViewportSizeChange(Number(e.target.value), viewportHeight)}
    aria-label="视口宽度"
  />
  <span className="viewport-editor-times" aria-hidden="true">×</span>
  <input
    className="viewport-size-input"
    type="number"
    inputMode="numeric"
    min={80}
    max={2160}
    value={viewportHeight}
    onChange={(e) => onViewportSizeChange(viewportWidth, Number(e.target.value))}
    aria-label="视口高度"
  />
  <CustomSelect
    value={presetKey ?? ""}
    options={[
      { value: "desktop", label: "桌面 1280×800" },
      { value: "wide",    label: "宽屏 1440×900" },
      { value: "tablet",  label: "平板 820×1180" },
      { value: "mobile",  label: "手机 390×844" },
    ]}
    onChange={(value) => onViewportPresetSelect(value as Exclude<PreviewViewportMode, "fit">)}
    matchValue={(opt, current) => opt.value === presetKey}
    placeholder="预设"
  />
</div>
```

**当 `presetKey === null` 时**（W×H 不匹配任何 preset）：CustomSelect 的 `value=""`，因 options 中无空字符串项，`selectedIndex = -1`，需用新增的 `placeholder` prop 显示"预设"。本次实现为 `CustomSelect` 增加可选 `placeholder` prop（默认 `""`），向后兼容。

**派生数据**：
- `viewportWidth` / `viewportHeight`：当前视口尺寸。当 `viewportMode === "fit"` 时来自 `adaptiveViewport` / `contentDimensions`；否则来自 `viewportSize` state。
- `presetKey`：通过 `isPresetMatch(mode, w, h)` 判断当前 W×H 是否匹配某个 preset，匹配则下拉显示该 preset；否则下拉显示"预设"占位符。

**`isPresetMatch` 辅助函数**（新增到 `src/components/PreviewFrame.tsx` 或独立工具文件）：

```ts
function isPresetMatch(
  mode: Exclude<PreviewViewportMode, "fit">,
  width: number,
  height: number
): boolean {
  const preset = viewportDimensions[mode];
  return preset.width === width && preset.height === height;
}
```

调用方：`App.tsx` 中用 4 个 preset 依次尝试，返回第一个匹配项；若都不匹配，`presetKey = null`，CustomSelect 显示空（触发 `placeholder`）。

### 3.3 数据流改造

**保留**：`PreviewViewportMode` 类型与 `viewportMode` state（向后兼容外部 API 与 `mod+1..5` 快捷键）。

**新增**：
- `viewportWidth: number` / `viewportHeight: number` —— 在 `App.tsx` 中独立于 `viewportMode` 的尺寸 state
- 当 `viewportMode !== "fit"` 时，使用 `viewportWidth / viewportHeight` 而非 `viewportDimensions[viewportMode]`
- 当 `viewportMode === "fit"` 时，仍使用 `adaptiveViewport` / `contentDimensions`

**`PreviewFrame` props 调整**：
```ts
interface PreviewFrameProps {
  // ... 现有 props
  viewportWidth: number;
  viewportHeight: number;
  onViewportSizeChange: (width: number, height: number) => void;
  onViewportPresetSelect: (mode: Exclude<PreviewViewportMode, "fit">) => void;
  // 删除 onViewportModeChange（替换为 onViewportPresetSelect + 适配按钮 onClick）
}
```

**`App.tsx` state 调整**：
```ts
const [viewportSize, setViewportSize] = useState({ width: 1280, height: 800 });
const [previewViewportMode, setPreviewViewportMode] = useState<PreviewViewportMode>("desktop");

const handleViewportSizeChange = useCallback((width: number, height: number) => {
  setViewportSize({ width, height });
}, []);

const handleViewportPresetSelect = useCallback((mode: Exclude<PreviewViewportMode, "fit">) => {
  setPreviewViewportMode(mode);
  setViewportSize(viewportDimensions[mode]);
}, []);

const handleFitToggle = useCallback(() => {
  setPreviewViewportMode((prev) => (prev === "fit" ? lastNonFitMode : "fit"));
}, [lastNonFitMode]);
```

**`mod+1..5` 快捷键不变**：仍调用 `setPreviewViewportMode`，但同时同步 `setViewportSize`。

### 3.4 视口编辑器样式

新增到 `src/styles.css`：

```css
.viewport-editor {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 9px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--surface-soft);
}

.viewport-editor-label {
  color: var(--muted);
  font-size: 12px;
  font-weight: 650;
}

.viewport-size-input {
  width: 56px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--ink-soft);
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 680;
  text-align: right;
}

.viewport-size-input:focus-visible {
  outline: none;
  border-color: var(--mint);
  box-shadow: 0 0 0 3px rgba(25, 169, 151, 0.14);
}

.viewport-editor-times {
  color: var(--faint);
  font-family: var(--mono);
  font-size: 12px;
}
```

复用现有 `.custom-select` 组件，但因 `.custom-select` 默认 `width: 100%`，需要在 `.viewport-editor` 作用域下覆盖为 `width: auto`：

```css
.viewport-editor .custom-select {
  width: auto;
}

.viewport-editor .custom-select-trigger {
  min-height: 28px;
  height: 28px;
  padding: 0 8px;
}
```

确保与编辑器其他元素（28px 高）等高对齐。

### 3.5 删除/重构

| 删除 | 原因 |
|---|---|
| `PreviewModeButton` 组件（`PreviewFrame.tsx` 第 326–352 行） | preset 按钮不再存在 |
| `canvas-size-control` 容器 + Lock 图标（`PreviewFrame.tsx` 第 231–236 行） | 读数整合到 `viewport-editor` |
| 独立 `适应` 按钮（`PreviewFrame.tsx` 第 264–272 行） | 与 `100%` pill 合并 |
| `viewport-dim` 样式（`styles.css` 第 1830–1852 行） | preset 按钮不再需要 |
| `preview-mode-control` segmented control 容器 | 替换为 `viewport-editor` |
| `src/test/viewportTooltip.test.ts` | 测试的 `viewport-dim` 结构不再存在 |

**保留并改造**：
- `viewportDimensions` 常量（`PreviewFrame.tsx` 第 318–324 行）—— 移至 `App.tsx` 或独立工具，供 preset 选择时回填尺寸
- `preview-readouts` 容器 → 改为 `viewport-editor`
- `iframe-shell-{mode}` 与 `preview-viewport-{mode}` className —— 仍由 `viewportMode` 驱动 CSS（`adaptive-width/height` 计算不依赖 preset）

## 4. 状态保留与迁移

### 4.1 `PreviewViewportMode` 保留
- `"desktop" | "wide" | "tablet" | "mobile" | "fit"` 5 个值不变
- `mod+1..5` 快捷键语义不变（数字 1–4 = preset，5 = 适配）
- `iframe-shell-{mode}` CSS 类名不变（CSS 不需重写）

### 4.2 `viewportSize` 新增
- 初始值：`{ width: 1280, height: 800 }`（与 `viewportDimensions.desktop` 一致）
- 与 `viewportMode` 双向绑定：选 preset → 同步尺寸；改尺寸 → 仅当匹配 preset 时同步 mode，否则 mode 保持不变但下拉显示空

## 5. 错误处理与边界

### 5.1 数字输入边界
- `width`：min=120, max=3840（HD 宽度）
- `height`：min=80, max=2160（4K 高度）
- 用户输入越界 → input 自带的 `min/max` + 失焦时 clamp 到边界
- 用户输入非数字 → `type="number"` 自动拒绝（`onChange` 仅在有效数字时触发）

### 5.2 `viewportMode === "fit"` 时的尺寸显示
- 当 `viewportMode === "fit"` 时，宽度/高度 input 显示 `contentDimensions` 的实测值
- input 设为 `disabled`，提示用户"适配模式下尺寸由内容决定"
- preset 下拉也 disabled
- 只有"适配"按钮可点击退出 fit 模式

### 5.3 状态同步
- iframe 内容变化时 `contentDimensions` 变化（fit 模式才相关）
- `reloadNonce` 变化时重置 `viewportSize` 与 `viewportMode`（保持现有行为）

## 6. 测试策略

### 6.1 新增测试
1. **`viewportEditor.test.tsx`** —— DOM 级断言：
   - 渲染两个 `<input type="number">` 显示当前尺寸
   - 渲染 4 个 preset 选项的 CustomSelect
   - 渲染"适配"按钮
   - 不再渲染 5 个独立的 preset 按钮
2. **`viewportPresetSync.test.ts`** —— 纯逻辑：
   - `isPresetMatch(mode, w, h)` —— 给定 (desktop, 1280, 800) → true；(desktop, 1281, 800) → false
   - 选择 preset → `viewportSize` 回填正确尺寸
   - 修改 input → `viewportSize` 更新（但不强制 preset 选中）

### 6.2 删除/更新测试
- 删除 `src/test/viewportTooltip.test.ts`（结构不再适用）
- 更新 `shortcutsWiring.test.ts` 中关于 `mod+1..5` 的断言（若涉及 UI 文本）

### 6.3 e2e（手动验证）
- 1024 / 1280 / 1440 / 1920px 视口下，Canvas 工具栏不挤压
- 输入自定义尺寸生效
- 切换 preset 回填尺寸
- `mod+1..5` 快捷键仍工作
- fit 模式下 input 禁用

## 7. 文件改动清单

| 文件 | 改动 |
|---|---|
| `src/components/PreviewFrame.tsx` | 删除 `PreviewModeButton`、删除 `canvas-size-control`、删除独立 `适应` 按钮；新增 `viewport-editor` JSX；接受新 props `viewportWidth/Height`、`onViewportSizeChange`、`onViewportPresetSelect` |
| `src/components/CustomSelect.tsx` | 增加可选 `placeholder` prop（向后兼容，默认 `""`）；无选中项时显示 placeholder |
| `src/App.tsx` | 新增 `viewportSize` state；新增 `handleViewportSizeChange` / `handleViewportPresetSelect` / `handleFitToggle`；传递新 props 给 `PreviewFrame`；`mod+1..5` 同步更新尺寸 |
| `src/types/editor.ts` | 不变（`PreviewViewportMode` 类型保留） |
| `src/styles.css` | 删除 `.viewport-dim`、`.preview-mode-control`、`.canvas-size-control` 样式；新增 `.viewport-editor`、`.viewport-size-input`、`.viewport-editor-times`、`.viewport-editor-label` |
| `src/test/viewportTooltip.test.ts` | 删除 |
| `src/test/viewportEditor.test.tsx` | 新增 |
| `src/test/viewportPresetSync.test.ts` | 新增 |

## 8. 验收标准

- [ ] 5 个 preset 按钮合并为 1 个紧凑编辑器（preset 下拉 + 2 个数字 input + label）
- [ ] Canvas 工具栏总宽度 ≤ 600px（在 1280px 视口下测量）
- [ ] 桌面/宽屏/平板/手机/适配 5 个 preset 通过下拉选择 + 自动回填尺寸仍可用
- [ ] 用户可手动输入任意 120–3840 × 80–2160 范围内的尺寸
- [ ] `mod+1..5` 快捷键保持工作
- [ ] fit 模式下 input / 下拉 禁用，提示由内容决定
- [ ] 与项目其他 panel 风格一致：所有按钮图标 + 文字，无纯图标按钮、无异类 readout
- [ ] 单元测试 + DOM 测试通过
- [ ] 1024 / 1280 / 1440 / 1920px 视口下手测无挤压

## 9. 风险与权衡

### 9.1 风险
- **state 结构改动**：从单一 `viewportMode` 变为 `viewportMode + viewportSize`。需要保证两者同步不出错。
- **iframe CSS 类名仍依赖 `viewportMode`**：CSS 改造范围要控制，避免影响 `.preview-viewport-{mode}` 等已有样式。
- **数字输入可访问性**：需要正确标注 `aria-label`、处理键盘焦点。

### 9.2 权衡
- **失去"一键看到当前 preset 名字"**：原 preset 按钮上有"桌面"标签；新版需要看 readout 与下拉才能判断当前是哪个 preset。**缓解**：下拉默认值显示当前 preset 名字。
- **输入数字比点击按钮慢一拍**：点击 preset 是 1 次点击；输入数字需要点击 input + 键入。**缓解**：保留 preset 下拉作为快速路径。
- **fit 模式下 input 禁用**：用户可能误以为坏了。**缓解**：input 显示 tooltip 解释为何禁用。

## 10. 不在范围内（Out of Scope）

- iframe 内部渲染逻辑改动（`postPreviewReady` / `adaptiveViewport` 不变）
- 导出 / patch / modal 等其他业务流
- `PreviewFrame` 之外的面板 UI 改动
- 移除其他位置的 lucide-react 图标（Toolbar 仍用图标 + 文字组合）