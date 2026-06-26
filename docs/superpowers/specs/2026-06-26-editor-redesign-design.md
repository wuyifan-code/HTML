# HTML FineTune 编辑器视觉重构设计

> 日期：2026-06-26
> 分支：`UI`
> 设计稿：`D:\Trae\Html Write\.trae\design-exports\1782399426495-编辑工作台.zip`
> 状态：已批准，进入实施阶段

## 1. 目标与边界

### 必须做

- 把 `OptimizedUiApp` / `App.tsx` 合并成**单一入口**，消除双入口历史包袱。
- 按设计稿重做编辑器外壳：顶部栏、左侧源/结构树、中央画布、右侧检查器、底部状态栏。
- 把设计稿中已经准备好的 `TraeWork` 组件 CSS（`ds-btn`、`ds-input`、`ds-tab`、`ds-card`、`ds-tag`、`ds-textarea`、`ds-notif`、`ds-alert`、`ds-menu`、`ds-pagination`、`ds-progress`、`ds-skeleton`、`ds-table`、`ds-select-wrap` 等）落到 `src/styles.css`。
- 保留全部现有功能：AI 扫描（16 家供应商）、HTML/PDF/PPTX 导出、历史时间线、快捷键、面板尺寸拖拽、面板折叠。
- 仅优化桌面端（1280+），**不动手机响应式布局**。

### 不做

- 不做暗色模式（用户明确推迟）。
- 不新增页面（起始页/设置/关于都不做）。
- 不重新设计移动端断点。
- 不改后端/构建管线。

### 设计冲突已确认

| 冲突点 | 处理 |
|---|---|
| 检查器顶部「当前选中」卡片（commit `2afb31c` 删除） | **恢复**，按设计稿 |
| 面板宽度 336/360 vs 设计稿 280/300 | 改回 280/300，保留拖拽缩放 |
| 版本号 v2.4.1 vs 设计稿 v2.0 | 改回 v2.0 |
| 对齐按钮 vs 仅快捷键 | **同时保留**：可见图标按钮 + B/L/R/J 快捷键 |
| 3 段底部状态栏 vs 单条状态文字 | 新增底部 3 段状态栏 |
| `App.tsx` 与 `OptimizedUiApp.tsx` 双入口 | 合并为单入口 |

## 2. 架构

### 2.1 入口与目录结构

```
src/
├── main.tsx                # 单一入口
├── App.tsx                 # 合并后的根组件
├── styles.css              # 设计稿 token + 组件 CSS
├── components/
│   ├── shell/
│   │   ├── TopBar.tsx           # 48px 顶栏
│   │   ├── LeftPanel.tsx        # 280px 源/结构树
│   │   ├── Canvas.tsx           # 中央画布
│   │   ├── Inspector.tsx        # 300px 检查器
│   │   └── StatusBar.tsx        # 28px 底部状态栏
│   ├── tree/
│   │   ├── StructureTree.tsx
│   │   └── AiScanCard.tsx
│   ├── inspector/
│   │   ├── SelectionHeader.tsx
│   │   ├── PropertyCard.tsx
│   │   ├── AlignmentBar.tsx
│   │   └── ColorField.tsx
│   ├── canvas/
│   │   ├── PreviewFrame.tsx
│   │   └── ViewportBar.tsx
│   ├── Toolbar.tsx
│   ├── HistoryPanel.tsx
│   ├── ExportPreviewDialog.tsx
│   └── ErrorBoundary.tsx
├── hooks/                  # 不动
├── utils/                  # 不动
└── test/
```

### 2.2 单一入口策略

- `main.tsx` 渲染 `<App />`（不再渲染 `OptimizedUiApp`）。
- `App.tsx` 把 `OptimizedUiApp.tsx` 的状态机、hooks、命令处理器全部纳入，UI 树按 `shell/*` 重排。
- 删除 `OptimizedUiApp.tsx`。
- `backup-original/` 作为快照保留不动。

## 3. 视觉规范

### 3.1 设计令牌

- `src/styles.css` 顶部保留现有 token 块。
- 从设计稿 `<style id="component-vars">` 复制 `ds-*` 组件 CSS。
- 关键 token：
  - 主色：`--bg-brand: #4b3fe3`
  - 顶栏高：`48px`，底栏高：`28px`
  - 面板默认宽：`280px` / `300px`（可拖拽）

### 3.2 顶栏 TopBar（48px）

```
┌─ HFT ─ HTML FineTune v2.0 │ landing-page / index.html ──── [Undo][Redo][Import][Copy][导出][PDF][PPTX][Modal][History] ─┐
```

- 8px 圆角 violet `HFT` 方块 + 标题 + 版本 chip + 面包屑
- 右侧工具栏 `ds-btn` 风格
- `data-dom-id` 选择器：`btn-undo`、`btn-export` 等

### 3.3 左侧面板 LeftPanel（280px）

- 40px tab 切换：`结构树` / `源码`
- 折叠式「AI 结构扫描」卡片：✨ + chevron + `12 节点` 徽标 + provider/model + 清空标注 + AI 扫描
- 搜索框（magnifier icon）
- 结构树：按 tagName 配色 pill（H1→brand、SECTION→success、IMG→warning、DIV→primary、NAV→cyan）

### 3.4 中央画布 Canvas

- 36px 视口工具条：🖥/📱/平板 + 尺寸 + 缩放 + Fit
- 虚线网格背景
- iframe 内为已选示例 landing-page

### 3.5 右侧检查器 Inspector（300px）

- 顶部「当前选中」卡：
  - 元素 pill + className：`H1 .hero-title`
  - 计算值：`1280 × 72 px` · `28px / 36px` · `600`
- 属性分组，每组为边框卡片 + icon + 标题：
  - 字体 / 间距 / 颜色 / 边框 / 对齐
- 对齐按钮：L/C/R + B/I 图标（保留快捷键）

### 3.6 底部状态栏 StatusBar（28px，**新增**）

- 左：`H1.hero-title · 234 个字符`
- 中：`● 已自动保存`（绿色脉冲）
- 右：`UTF-8 | HTML | 1440 × 900`

## 4. 交互与状态

| 区域 | 行为 |
|---|---|
| 顶栏按钮 | hover → `bg-overlay-l2`；按下 → `bg-overlay-l3`；导出 → brand-hover |
| 结构树 | hover → `bg-overlay-l1`；选中 → `bg-overlay-l2` + brand 边线 |
| AI 扫描卡 | 点击切换展开，chevron 旋转，aria-expanded 同步 |
| 检查器分组 | 始终展开；输入框 Enter/blur 提交；颜色字段实时更新 |
| 对齐按钮 | 点击立即应用；当前态高亮 `bg-overlay-l3` |
| 快捷键 | Cmd/Ctrl+Z/Y/Shift+Z + B/L/R/J + E/D/I/F + ? |
| 面板拖拽 | 默认 280/300，最小 220/240 |
| 面板折叠 | `panel-left-close` / `panel-right-close` |
| 视口切换 | `zoomToTransform` 真实缩放 |
| 自动保存 | 450ms 节流写 localStorage，脉冲 800ms |

## 5. 数据流

```
HTML 导入 → sourceDraft (debounced 450ms)
   ├── useEditorHistory 快照 → 时间线 → 撤销/重做
   ├── iframe srcdoc → PreviewFrame 桥接 → useIframeSelection → selectedElement
   │                                          ↓
   │                                  PropertyCard 实时回写
   └── AI 扫描 → analyzeStructureWithAi → aiAnnotations（risk badge）

选中节点 → Inspector 显示 computedStyle → 用户编辑 → patchElementStyle → useEditorHistory.push
```

## 6. 错误处理

| 场景 | 处理 |
|---|---|
| 导入非 HTML | toast「请导入 .html 或 .htm」 |
| AI key 缺失 | 弹回设置入口 + 状态栏告警 |
| PDF/PPTX 失败 | `ExportPreviewDialog` 显示警告 |
| iframe 同源 | 全部 `srcdoc` + postMessage 桥接 |
| localStorage 失败 | 静默降级 + 顶部 banner |
| 面板越界 | 钳制 220-460 |

## 7. 测试策略

- 27 个测试文件保留，按视觉结构调整 selector。
- 新增/更新：
  - `TopBar.test.tsx`：版本号 `v2.0`；工具栏；面包屑
  - `LeftPanel.test.tsx`：tab 切换；AI 卡折叠；彩色 tag chip
  - `Inspector.test.tsx`：选中卡片 + 分组卡片 + 对齐按钮
  - `StatusBar.test.tsx`：三段渲染
  - `canvasToolbarDom.test.tsx`：视口 + 缩放
  - `cheatsheet.test.tsx`：B/L/R/J 描述

## 8. 实施步骤概要

1. 复制设计稿 token + 组件 CSS 到 `src/styles.css`
2. 新建 `components/shell/{TopBar,LeftPanel,Canvas,Inspector,StatusBar}.tsx`
3. 升级 `Toolbar.tsx`、`HistoryPanel.tsx`、`ExportPreviewDialog.tsx`、`ColorField.tsx`、`CustomSelect.tsx` 使用 `ds-*` 类
4. 合并 `OptimizedUiApp.tsx` 与 `App.tsx` 为单一 `App.tsx`，更新 `main.tsx`
5. 恢复「当前选中」卡片到 `Inspector.tsx`
6. 新增 `StatusBar.tsx` 与 3 段布局
7. 把对齐按钮 UI 加回（同时保留快捷键）
8. 调整面板默认宽 280/300
9. 更新 Header 版本号 `v2.4.1` → `v2.0`
10. 给所有可交互控件加 `data-dom-id`
11. 跑 `npm run dev` + `npm run test`，截图比对
12. 提交 + PR 描述

## 9. 风险与缓解

| 风险 | 缓解 |
|---|---|
| 双入口合并遗漏 | 用 `git diff` + `CODE_REVIEW.md` 对照 |
| CSS 命名冲突 | grep `ds-` 扫描 |
| 测试 selector 工作量 | 优先 `aria-label` |
| 面板宽度影响截图测试 | 更新视觉基线 |
| 「当前选中」与空态卡重复 | 仅 `selectedElement != null` 显示 |

## 10. 不做

- 暗色模式、新增页面、移动端断点、后端 API、切换框架。