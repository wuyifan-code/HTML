# HTML FineTune → Notion 风格改造方案

> 基于 2026-07-09 项目代码分析制定。当前项目采用 Apple HIG 设计语言（毛玻璃、多层阴影、紫蓝主色、spring 弹性动画），改造目标为借鉴 Notion 的视觉语言与交互模式，保持现有功能完整。

---

## 一、Notion 设计语言核心特征

| 维度 | 当前（Apple HIG） | 目标（Notion） |
|------|------------------|----------------|
| 视觉重心 | 工具/面板优先（三栏工作台） | 内容优先（编辑器居中，工具按需浮现） |
| 主色 | `#4b3fe3` 紫蓝 | `#2383e2` 蓝，或可选保留紫蓝 |
| 背景体系 | 白色 + 毛玻璃层叠 | `#ffffff` / `#fbfbfa` / `#f7f6f3` 纯平 |
| 文字色 | 深色高对比 | `#37352f` 正文 / `#9b9a97` 次要 |
| 阴影 | 多层（contact + ambient + floating） | 几乎无阴影，扁平 |
| 边框 | 明确的 border + 卡片容器 | 极淡边框 `#e9e9e7`，很多地方直接去框 |
| 字体 | SF Pro / PingFang SC | Inter + 系统无衬线 |
| 圆角 | 8-16px | 3-6px，更克制 |
| 组件容器 | `.property-card` 卡片式 | 扁平区块 + 悬停背景变色 |
| 动效 | spring 弹性曲线 | 极简 ease，几乎无动画 |
| 交互入口 | 固定面板 + 图标按钮 | Cmd+K 命令面板 + 悬停浮现操作 |
| 侧栏 | 固定三栏 | 可折叠侧栏（页面列表式） |

---

## 二、改造边界

### 不改造的范围

- iframe Bridge 通信层（`srcDoc` 构建、`postMessage` 协议、沙箱 token 验证）
- 导出引擎（HTML / PDF / PPTX 的生成逻辑）
- AI 结构分析模块（`aiStructure.ts`）
- 撤销/重做引擎（`useEditorHistory`）
- DOM 操作工具函数（`domPath.ts`、`domTree.ts`、`injectEditableIds.ts`）
- 字体测量（Pretext 集成）

### 改造的范围

- CSS 设计令牌体系（`src/styles.css`）
- 组件视觉风格（按钮、卡片、输入框、下拉框、弹窗）
- 布局结构（面板排列方式、顶栏、状态栏）
- 交互模式（新增命令面板、块手柄拖拽）
- 主题切换机制

---

## 三、分阶段实施方案

### 阶段 1：Design Token 替换

**目标**：一套 CSS 变量完成全部视觉风格切换，不改组件结构。

**涉及文件**：`src/styles.css`（约 2000 行）

**Token 映射表**：

```
当前 Token                      替换值                         说明
──────────────────────────────────────────────────────────────────
颜色系统
--bg-brand: #4b3fe3           →  #2383e2                     Notion 蓝（可选保留 #4b3fe3）
--bg-brand-hover              →  #1a6fd1                     hover 加深
--bg-brand-active             →  #1558a3                     点击态
--bg-app                      →  #ffffff                     应用底色
--bg-surface                  →  #fbfbfa                     面板/侧栏底色
--bg-surface-hover            →  #f1f1f0                     悬停高亮
--bg-surface-active           →  #e8e8e6                     选中态
--bg-page                     →  #f7f6f3                     页面背景（可选）

文字色
--text-default                →  #37352f                     正文
--text-secondary              →  #9b9a97                     次要文字/图标
--text-tertiary               →  #b4b4b0                     占位符/禁用
--text-disabled               →  #dad9d6                     完全禁用
--text-on-brand               →  #ffffff                     品牌色上的文字

边框色
--border-neutral-l1           →  #e9e9e7                     默认边框
--border-neutral-l2           →  #dad9d6                     更深边框
--border-neutral-l3           →  #ccccca                     最深边框
--border-focus                →  #2383e2                     聚焦环

状态色
--status-success              →  #0f7b4e                     成功绿
--status-warning              →  #dfab01                     警告黄
--status-error                →  #e03e2f                     错误红
--status-primary              →  #2383e2                     信息蓝

阴影（大幅削减）
--elev-flat: none                                              移除
--elev-ring: 0 0 0 1px #e9e9e7                                仅保留 1px 环
--elev-raised: 0 1px 2px rgba(0,0,0,0.04)                     极轻阴影
--elev-floating: 0 2px 8px rgba(0,0,0,0.08)                   弹窗阴影
--elev-window: 0 4px 16px rgba(0,0,0,0.12)                    模态窗口

毛玻璃（移除或大幅削弱）
--surface-glass: none                                          不再使用毛玻璃
--surface-vibrancy: none

字体
--font-family-default: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif
--font-family-heading: 'Inter', ...                            与正文相同
--font-family-mono: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace
--font-family-metric: 'Inter', ...                             与正文相同

字号（微调）
--font-size-xs: 11px                                           微调为 Notion 比例
--font-size-sm: 13px
--font-size-md: 14px                                           Notion 默认正文
--font-size-lg: 16px
--font-size-xl: 20px
--font-size-2xl: 24px
--font-size-3xl: 32px

间距（更宽松）
--spacer-0: 0                                                  保持
--spacer-2: 2px
--spacer-4: 4px
--spacer-8: 6px  ← 改                                         让空间更紧凑
--spacer-12: 8px
--spacer-16: 12px
--spacer-24: 16px
--spacer-32: 20px
--spacer-48: 28px
--spacer-64: 36px

圆角（更克制）
--radius-0: 0
--radius-sm: 3px                                               缩至 3px
--radius-md: 4px                                               缩至 4px
--radius-lg: 6px                                               缩至 6px
--radius-xl: 8px
--radius-full: 9999px                                          药丸形保持

动效（极简化）
--motion-fast: 100ms              ease                        去掉 bezier
--motion-base: 150ms              ease
--motion-slow: 200ms              ease
--motion-spring: 200ms            ease                        不再使用 spring
--ease-standard: ease
--ease-emphasized: ease
--ease-soft-end: ease-out
--ease-exit: ease-in
--ease-spring-pop: ease-out                                    弃用弹性
```

**复选框 / 开关 / 输入框** 的风格也需要对应微调，但建议通过变量统一驱动。

> ⚠️ 如果项目存在 `backdrop-filter`（毛玻璃），需在阶段 1 全部移除或替换为纯色背景。

---

### 阶段 2：布局重构

**目标**：从"三栏工作台"变为"侧栏 + 主内容区"。

#### 2.1 当前布局

```
┌──────────┬──────────────┬──────────┐
│  源码树   │   画布/预览   │  属性面板  │
│  (固定)   │   (iframe)   │  (固定)   │
│          │              │          │
│          │              │          │
│          │              │          │
└──────────┴──────────────┴──────────┘
    280px      自适应         320px
```

#### 2.2 目标布局

```
┌─────┬────────────────────────────────────┐
│ 侧栏 │  顶栏（面包屑 + 最小操作按钮）       │
│     ├────────────────────────────────────┤
│ 页面 │                                    │
│ 列表 │         画布 / 预览区域              │
│     │         (iframe 最大化)              │
│(可折 │                                    │
│ 叠) │                                    │
│     ├────────────────────────────────────┤
│     │  属性检查器（底部浮动条 / 右侧抽屉）    │
└─────┴────────────────────────────────────┘
    240px (默认收起)
```

#### 2.3 具体改动项

**侧栏**：
- 提取为独立 `Sidebar` 组件
- 页面列表式展示（支持多个 HTML 项目切换）
- 底部显示用户/设置入口
- hover 时展开，离开时收起（或手动 pin）
- 三个 Tab（structure / source / ai）移入侧栏内

**画布区域**：
- 占据最大可用空间
- 去掉当前 `.panel` 的固定边框和阴影
- viewport 尺寸选择器移到顶栏或画布角落的浮动工具条

**属性检查器**：
- 从右侧固定面板改为两种模式（用户可切换）：
  - **底部面板**：点击元素后在画布下方弹出属性编辑区域（200px 高）
  - **右侧抽屉**：类似 Notion 页面属性，从右侧滑出（320px 宽）
- 快捷操作（上移/下移/复制/删除）移到画布内浮动工具栏

**顶栏**：
- 从当前多功能工具栏简化为极窄操作条
- 保留：品牌标识、撤销/重做、导入、导出、主题切换、命令面板入口
- 移除：显式的"查看历史""快捷键帮助"按钮（移到命令面板）

**状态栏**：
- 考虑降级或移除（Notion 没有状态栏）
- 必要的信息（选中元素名/元素计数）移到画布角落的小标签

---

### 阶段 3：组件级改造

#### 3.1 按钮系统

```css
/* 改造前（Apple 风格） */
.ds-btn {
  background: var(--bg-brand);       /* 紫蓝实色 */
  box-shadow: var(--elev-raised);    /* 多层阴影 */
  border-radius: var(--radius-lg);   /* 大圆角 */
  font-weight: 500;
}

/* 改造后（Notion 风格） */
.ds-btn {
  background: #efefef;
  color: #37352f;
  box-shadow: none;
  border: 1px solid transparent;
  border-radius: 4px;
  font-weight: 400;
  font-size: 14px;
  height: 28px;                      /* 统一小尺寸 */
  padding: 0 8px;
}
.ds-btn:hover { background: #e8e8e6; }
.ds-btn:active { background: #dad9d6; }

/* 主要操作按钮 */
.ds-btn--primary {
  background: #2383e2;
  color: #fff;
}
.ds-btn--primary:hover { background: #1a6fd1; }

/* 图标按钮 */
.ds-btn--icon {
  width: 28px;
  height: 28px;
  padding: 0;
  justify-content: center;
  background: transparent;
}
.ds-btn--icon:hover { background: #f1f1f0; }

/* ghost 按钮：保持透明背景 */
.ds-btn--ghost:hover { background: #f1f1f0; }
```

#### 3.2 输入框

```css
/* 当前可能有圆角和阴影 */
.ds-input {
  border: 1px solid #e9e9e7;
  border-radius: 4px;
  background: #ffffff;
  padding: 4px 8px;
  font-size: 14px;
  color: #37352f;
  box-shadow: none;                  /* 去掉 inset shadow */
}
.ds-input:focus {
  border-color: #2383e2;
  box-shadow: 0 0 0 1px #2383e2;    /* 单环聚焦环 */
  outline: none;
}
```

#### 3.3 属性卡片 → 可折叠区块

```
改造前 (.property-card):
┌─────────────────────────┐
│ 📝 Typography            │  ← 卡式容器，有背景和阴影
│ ┌─────────┬───────────┐ │
│ │ font    │ Inter  ▼  │ │
│ │ size    │ 16px      │ │
│ └─────────┴───────────┘ │
└─────────────────────────┘

改造后:
▸ Typography               ← 可折叠标题，无容器
  ─────────────────────    ← 分隔线
  font     [Inter      ▼]  ← 行式排列，悬停才显示操作
  size     [16px        ]  ← 无边框，字符间距对齐
  weight   [400         ▼]
  ─────────────────────
```

#### 3.4 下拉框（CustomSelect）

```css
/* Notion 风格下拉 */
.ds-select {
  border: 1px solid #e9e9e7;
  border-radius: 4px;
  background: #fff;
  font-size: 14px;
  min-height: 28px;
}
.ds-select:hover { border-color: #dad9d6; }
.ds-select:focus-within { border-color: #2383e2; box-shadow: 0 0 0 1px #2383e2; }

.ds-select-option {
  padding: 4px 8px;
  min-height: 28px;
  display: flex;
  align-items: center;
}
.ds-select-option:hover { background: #f1f1f0; }
.ds-select-option.is-selected { background: #e8f1fb; color: #2383e2; }
```

#### 3.5 弹窗（Dialog / Popover）

```css
.ds-dialog {
  background: #ffffff;
  border: 1px solid #e9e9e7;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  padding: 20px;
}
.ds-dialog-header {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.ds-popover {
  background: #ffffff;
  border: 1px solid #e9e9e7;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 4px;                        /* 紧凑内边距 */
}
```

#### 3.6 历史面板（HistoryPanel）

```
改造前：浮层抽屉，卡片式历史条目
改造后：
  ┌──────────────────────────────────────┐
  │ 🔄 历史记录                    ✕ 关闭 │
  ├──────────────────────────────────────┤
  │ ○ 修改 div.container 背景色   2分钟前  │
  │ ○ 调整 h1.title 字号          5分钟前  │
  │ ○ 删除 p.description          10分钟前 │
  │ ...                                   │
  └──────────────────────────────────────┘
```

条目用极简的圆点 + 单行文字，hover 时整行变色，无卡片包裹。

---

### 阶段 4：新增 Notion 交互特性

#### 4.1 命令面板（Cmd/Ctrl + K）

Notion 的灵魂交互。实现为一个居中的模态输入框。

**触发**：`Cmd+K` / `Ctrl+K`

**功能**：

```
┌──────────────────────────────────────────┐
│ 🔍  输入关键词搜索...                      │
├──────────────────────────────────────────┤
│ 操作                                     │
│  📥  导入 HTML 文件                       │
│  📤  导出 HTML                            │
│  📄  导出 PDF                             │
│  🎞️  导出 PPTX                           │
│  ↩️  撤销              Ctrl+Z             │
│  ↪️  重做              Ctrl+Shift+Z       │
│ ─────────────────────────────────────── │
│ 元素（输入关键词后显示）                     │
│  🔲  div.container                       │
│  🔤  h1.hero-title                       │
│  📝  p.description                       │
│ ─────────────────────────────────────── │
│ 视图                                     │
│  🌙  切换深色模式                          │
│  ⌨️  快捷键帮助                           │
│  📋  查看历史                             │
└──────────────────────────────────────────┘
```

**技术实现要点**：
- 独立 `CommandPalette` 组件
- 使用 `@radix-ui/react-dialog` 或自建 Portal 弹窗
- 命令注册表：`{ id, label, icon, keywords, action }[]`
- 支持模糊搜索 + 键盘导航（上下箭头 + Enter）
- 按 Escape 关闭

#### 4.2 块手柄（Block Handle）

在结构树的每个节点左侧增加拖拽手柄。

```
触发条件：hover 节点时显示
外观：⋮⋮ 或 ┆ 符号（12px 宽，浅灰色）
交互：拖拽排序（改变 DOM 顺序）
实现：
  - 使用 HTML5 Drag and Drop API 或 @dnd-kit
  - 拖拽时显示插入指示线
  - 放开后调用 domPath.ts 中的 move 方法
```

#### 4.3 悬停浮现操作

```
改造前：选中元素 → 右侧属性面板显示操作按钮
改造后：
  - 画布中选中元素 → 元素旁边浮现浮动工具栏
  - 工具栏内容：✏️编辑  ⬆️上移  ⬇️下移  📋复制  🗑️删除
  - 移出元素后工具栏消失
```

这实际上是 Notion block hover menu 的等价物——你当前已经在 iframe bridge 中实现了浮动工具栏，只需要让宿主侧的工具栏也遵循同样的浮现逻辑。

---

### 阶段 5：主题切换优化

**当前机制**：`useEditorStore` 中通过 `requestAnimationFrame` JS 插值 RGB 做渐变动画过渡。

**改造建议**：

```css
/* 用 CSS 自定义属性驱动的纯 CSS 主题切换 */
:root {
  --bg-app: #ffffff;
  --text-default: #37352f;
  /* ... 所有 token */
}

.theme-dark {
  --bg-app: #191919;
  --text-default: #d4d4d4;
  /* ... 暗色对应值 */
}

/* 过渡由 CSS transition 托管，不再使用 JS 插值 */
body {
  transition: background-color 150ms ease, color 150ms ease;
}
```

**优点**：
- 代码更简洁（移除 `useEditorStore` 中的主题过渡逻辑）
- 浏览器原生 GPU 加速过渡
- 不需要逐帧计算 RGB

**暗色模式 Token 参考（Notion 暗色）**：

```css
.theme-dark {
  --bg-app: #191919;
  --bg-surface: #202020;
  --bg-surface-hover: #2a2a2a;
  --bg-surface-active: #333333;
  --text-default: #d4d4d4;
  --text-secondary: #999999;
  --text-tertiary: #6b6b6b;
  --text-disabled: #404040;
  --border-neutral-l1: #333333;
  --border-neutral-l2: #404040;
  --border-neutral-l3: #4d4d4d;
  --status-success: #4caf50;
  --status-warning: #f5c542;
  --status-error: #f44336;
  --status-primary: #4dabf7;
}
```

---

## 四、App.tsx 拆分建议

当前 `App.tsx` 约 2000+ 行，内联了所有子视图。在对布局做结构性调整时，**强烈建议同时进行组件拆分**，否则后续维护会更加困难。

### 推荐拆分方案

```
src/
├── App.tsx                    ← 主入口，仅保留布局骨架 + Provider 嵌套
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx        ← 左侧可折叠侧栏（页面列表 + 三个 Tab）
│   │   ├── TopBar.tsx         ← 极简顶部操作条
│   │   ├── Canvas.tsx         ← 画布主区域（Stage + iframe 容器）
│   │   ├── BottomDrawer.tsx   ← 底部属性编辑面板
│   │   └── RightDrawer.tsx    ← 右侧属性抽屉（与 BottomDrawer 二选一）
│   ├── panels/
│   │   ├── StructureTree.tsx  ← DOM 结构树（从 App 提取）
│   │   ├── SourceEditor.tsx   ← 源码编辑器（从 App 提取）
│   │   └── AiPanel.tsx        ← AI 面板（从 App 提取）
│   ├── inspector/
│   │   ├── InspectorPanel.tsx ← 属性检查器主容器
│   │   ├── QuickActions.tsx   ← 快捷操作按钮组
│   │   ├── ContentCard.tsx    ← 内容编辑
│   │   ├── TypographyCard.tsx ← 排版设置
│   │   ├── SpacingCard.tsx    ← 间距设置
│   │   ├── ColorCard.tsx      ← 颜色设置
│   │   ├── BorderCard.tsx     ← 边框设置
│   │   └── LayoutCard.tsx     ← 布局设置
│   ├── overlays/
│   │   ├── CommandPalette.tsx ← 命令面板（新增）
│   │   ├── HistoryPanel.tsx   ← 历史记录
│   │   ├── ExportPreviewDialog.tsx
│   │   └── Cheatsheet.tsx     ← 快捷键帮助
│   └── shared/
│       ├── Tooltip.tsx
│       ├── ColorField.tsx
│       ├── CustomSelect.tsx
│       └── TreeItem.tsx
```

### 拆分原则

1. 每个文件控制在 200 行以内（理想情况）
2. 组件只通过 props 接收数据，不直接访问 Context（除全局 UI 状态外）
3. 先拆分叶子组件（卡片、按钮），再拆分容器组件
4. 每次拆分后立即运行测试确保无回归

---

## 五、实施路线图

```
Week 1: Design Token 替换（阶段 1）
  ├── 改动：src/styles.css
  ├── 产出：视觉立刻变成 Notion 风格
  ├── 风险：低（纯 CSS）
  └── 验证：目视检查 + 对比截图

Week 2: 组件拆分 + 布局重构（阶段 2 + 四）
  ├── 改动：App.tsx → 拆分为多个组件
  ├── 改动：src/styles.css（面板布局样式）
  ├── 产出：新的侧栏 + 画布布局
  ├── 风险：中（涉及 App.tsx 结构）
  └── 验证：功能回归测试 + 移动端适配检查

Week 3: 组件视觉改造（阶段 3）
  ├── 改动：所有 components/*.tsx
  ├── 产出：按钮、卡片、输入框全部 Notion 化
  ├── 风险：中（大量文件）
  └── 验证：逐个组件检查

Week 4: 命令面板 + 块手柄 + 主题优化（阶段 4 + 5）
  ├── 新增：CommandPalette.tsx
  ├── 改动：useEditorStore（主题切换简化）
  ├── 改动：styles.css（暗色主题 token）
  ├── 产出：完整 Notion 交互体验
  └── 风险：中低

Week 5: 打磨
  ├── 移动端适配微调
  ├── 导出截图回归测试
  ├── 性能检查（大量元素时树渲染性能）
  └── 用户测试反馈
```

---

## 六、风险与注意事项

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| iframe bridge 回归 | 🔴 高 | 不改 bridge script；改造后运行全部 e2e 测试 |
| 导出截图尺寸偏差 | 🟡 中 | 改造后逐格式（HTML/PDF/PPTX）验证 |
| App.tsx 拆分引入 bug | 🟡 中 | 先跑现有测试，每拆一个组件跑一次 |
| 移动端 `<760px` 适配破坏 | 🟡 中 | 每个阶段末尾检查移动端折叠行为 |
| 深色主题动画卡顿 | 🟢 低 | 从 JS 插值改为纯 CSS transition 后反而不容易出问题 |
| 属性面板交互习惯变更 | 🟢 低 | 底部抽屉 + 右侧抽屉两种模式让用户切换 |
| 大量 CSS 变量重命名导致遗漏 | 🟡 中 | 用全局搜索确保每个变量引用都被检查 |

---

## 七、不推荐的改造

以下特性**不建议**在当前项目中引入：

1. **斜杠命令 `/`** — 你的工具不是文档编辑器，没有"输入内容"的场景
2. **数据库视图（表格/看板/日历）** — 与 HTML 编辑器的核心功能无关
3. **实时协作（多人编辑）** — 引入 OT/CRDT 的复杂度远超收益
4. **Markdown 快捷输入** — 你的输入场景是属性值（颜色代码、CSS 值），不是 Markdown
5. **Notion API 集成** — 除非你想做"把编辑结果同步到 Notion"的功能

---

## 八、参考资料

- Notion 设计原则：https://www.notion.so/design
- Inter 字体：https://rsms.me/inter/
- Radix UI（弹窗/下拉等无障碍组件）：https://www.radix-ui.com/
- dnd-kit（拖拽排序）：https://dndkit.com/
- cmdk（命令面板参考实现）：https://cmdk.paco.me/

---

> **文档版本**：v1.0  
> **创建日期**：2026-07-09  
> **适用范围**：HTML FineTune v2.0 项目（`D:\Trae\Html Write\`）
