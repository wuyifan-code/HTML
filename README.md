# HTML FineTune

实时 HTML 可视化编辑器。左侧编辑源码、中间实时预览、右侧调整样式，所见即所得。

Built with React 19 + TypeScript 5.8 + Vite 8.

---

## 核心功能

| 功能 | 说明 |
|------|------|
| **源码编辑** | Textarea 直接编辑 HTML，实时同步预览 |
| **结构树导航** | 以树形展示所有可编辑元素，支持搜索 |
| **实时预览** | 5 种视口模式（桌面/宽屏/平板/手机/适配），支持缩放 |
| **元素选择** | iframe 内鼠标悬停高亮、点击选中 |
| **浮动工具栏** | 选中元素上方出现操作栏：上移/下移/克隆/复制样式/粘贴样式/删除 |
| **Style Inspector** | 修改字体、字号、字重、行高、颜色、对齐、间距、边框、阴影等 |
| **图片编辑** | 修改 img 的 src、alt、宽度、高度、object-fit |
| **颜色选择器** | HSV 色相/饱和度/明度 + RGB 微调 + 预设色 |
| **样式复制粘贴** | 跨元素的样式快速复用 |
| **元素 CRUD** | 克隆、删除、移动（上/下）元素 |
| **撤销/重做** | Ctrl+Z / Ctrl+Shift+Z 支持，历史面板可跳转 |
| **导出 HTML** | 去除编辑器内部属性后导出干净 HTML |
| **Modal 管理** | 检测并控制预览中的弹窗 |
| **Pretext 文本测量** | 零 DOM 回流的文本尺寸预测，实时显示行数/高度 |

---

## 技术栈

- **框架**: React 19.1
- **语言**: TypeScript 5.8
- **构建**: Vite 8
- **图标**: Lucide React 0.468
- **文本测量**: [@chenglou/pretext](https://github.com/chenglou/pretext) — 纯 JS 文本度量，零 DOM 回流
- **测试**: Vitest 4 + Testing Library + jsdom + node-canvas

---

## 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build

# 运行测试
npm test

# 监听模式运行测试
npm run test:watch
```

访问 `http://localhost:5173/` 即可使用编辑器。

---

## 使用说明

### 基础流程

1. **加载 HTML**: 默认加载示例页面，或拖入 `.html` 文件
2. **选择元素**: 在预览区点击任意文本/图片元素
3. **编辑样式**: 在右侧 Inspector 面板调整样式
4. **实时预览**: 修改立刻在预览区生效
5. **导出**: 点击 "导出" 生成干净 HTML

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Z` | 撤销 |
| `Ctrl+Shift+Z` / `Ctrl+Y` | 重做 |

### 元素操作（浮动工具栏）

选中元素后出现的浮动工具栏提供：
- **上移/下移**: 在同级 DOM 中调整顺序
- **克隆**: 复制包含子元素的完整节点
- **取样式**: 复制元素的样式到剪贴板
- **套样式**: 将已复制的样式应用到新元素
- **删除**: 从 DOM 中移除元素

---

## 项目结构

```
src/
├── main.tsx                    # 入口 + ErrorBoundary
├── App.tsx                     # 主应用组件（状态管理 + 布局）
├── styles.css                  # 全局样式
├── components/
│   ├── Header.tsx              # 顶部导航栏
│   ├── Toolbar.tsx             # 工具栏按钮
│   ├── HtmlInputPanel.tsx      # 源码编辑 + 结构树面板
│   ├── PreviewFrame.tsx        # iframe 实时预览 + 桥接脚本
│   ├── StyleEditorPanel.tsx    # 样式检查器面板
│   ├── CustomSelect.tsx        # 自定义下拉选择
│   ├── ColorField.tsx          # 颜色选择器组件
│   ├── PretextMeasureBadge.tsx # Pretext 文本测量显示
│   ├── HistoryPanel.tsx        # 历史记录面板
│   ├── ExportPreviewDialog.tsx # 导出前预览弹窗
│   └── ErrorBoundary.tsx       # React 错误边界
├── hooks/
│   ├── useEditorHistory.ts     # 撤销/重做/防抖历史
│   ├── useIframeSelection.ts   # iframe 通信 + 元素选择
│   ├── usePretextMeasure.ts    # Pretext 文本测量 Hook
│   └── usePanelResize.ts       # 面板拖拽缩放 Hook
├── types/
│   ├── editor.ts               # 编辑器核心类型
│   └── messages.ts             # iframe 消息协议常量 + 类型守卫
├── utils/
│   ├── editableElement.ts      # 可编辑元素判定
│   ├── injectEditableIds.ts    # HFT ID 注入
│   ├── domPath.ts              # DOM 查询/修改/序列化
│   ├── domTree.ts              # 可编辑元素树构建
│   ├── fontLibrary.ts          # 字体库管理（含 Pretext 式字符串注入）
│   ├── color.ts                # HSV/RGB/Hex 色彩工具
│   ├── string.ts               # 共享字符串工具
│   ├── cleanHtmlForExport.ts   # 导出 HTML 清洗
│   ├── exportHtml.ts           # 下载 HTML 文件
│   ├── exportValidation.ts     # 导出验证 + 警告
│   ├── clipboard.ts            # 剪贴板工具
│   ├── pretextMeasure.ts       # Pretext 测量封装
│   ├── iframeMessages.ts       # iframe 消息发送工具
│   └── historySummary.ts       # 历史摘要生成
└── test/
    ├── setup.ts                # 测试环境配置
    ├── editableElement.test.ts # 可编辑元素判定测试
    ├── injectEditableIds.test.ts # HFT ID 注入测试
    ├── domPath.test.ts         # DOM 路径测试
    ├── domTree.test.ts         # DOM 树测试
    ├── historySummary.test.ts  # 历史摘要测试
    ├── fontLibrary.test.ts     # 字体库测试（含字符串注入）
    └── pretextMeasure.test.ts  # Pretext 测量测试
```

---

## 状态模型

```
html 字符串（主 Source of Truth）
    ↕ 序列化/反序列化
in-memory Document（DOMParser 缓存，读操作复用）
    ↕ 增量 patch
iframe DOM（临时显示层，不持久化）
    ↕
selectedElement（从 html 派生，不持久化）
```

- 所有编辑最终都生成新的 `html` 字符串
- `selectedElement` 快照在每次 `html` 变化时从新 HTML 重建
- iframe 只做展示，修改通过 `postMessage` 增量补丁
- 历史记录只存 `{ html, selectedId }` 对

---

## iframe 消息协议

所有消息类型使用常量定义（`src/types/messages.ts`），禁止裸字符串。

### 主应用 → iframe
- `HTML_FINETUNE_SELECT_ELEMENT` — 选中元素
- `HTML_FINETUNE_PATCH_ELEMENT` — 增量更新样式/文本
- `HTML_FINETUNE_MODAL_COMMAND` — 打开/关闭弹窗

### iframe → 主应用
- `HTML_FINETUNE_ELEMENT_SELECTED` — 元素被选中
- `HTML_FINETUNE_ELEMENT_ACTION` — 执行快捷操作
- `HTML_FINETUNE_PREVIEW_READY` — 预览就绪 + 内容尺寸
- `HTML_FINETUNE_MODAL_STATE` — 弹窗状态变化

### 安全
- 所有消息通过 `bridgeToken` 校验
- 接收端检查 `event.origin`（只接受同源或 null origin）
- 发送端使用 `targetOrigin` 而非 `*`

---

## 当前限制

1. **大文档性能**: > 50KB HTML 时写操作（`updateHtmlElementByHftId`）的全量序列化可能有感知延迟
2. **无自动保存**: 刷新页面即丢失所有编辑
3. **无协同编辑**: 单机编辑器
4. **远程字体 FOUC**: 字体加载前会回退到系统字体
5. **历史内存**: 每次编辑保存完整 HTML 字符串，极长会话可能占用大量内存

---

## 后续规划

- [ ] 大文档增量序列化（避免每次全量 DOMParser）
- [ ] localStorage 自动保存/恢复
- [ ] 键盘快捷键扩展
- [ ] 更多视口设备预设
- [ ] 自定义 CSS 注入
- [ ] 多语言 UI

---

## 开发

```bash
# TypeScript 检查
npx tsc --noEmit

# 运行所有测试
npm test

# 监听测试
npm run test:watch
```

测试使用 Vitest + jsdom + node-canvas 环境，覆盖核心逻辑模块。
