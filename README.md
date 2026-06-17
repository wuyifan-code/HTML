# HTML FineTune

HTML FineTune 是一个本地运行的 HTML 可视化微调工作台。它把源码编辑、结构树导航、实时 iframe 预览和样式检查器放在同一个界面里，适合快速修改导入的页面、HTML 幻灯片、活动页和静态原型。

项目目标不是替代完整 IDE，而是让你在“看得见页面”的状态下，快速选中元素、调整样式、修改文本，并导出干净的 HTML。

## 核心功能

| 功能 | 说明 |
| --- | --- |
| 三栏编辑工作台 | 左侧源码/结构树，中间 Canvas 预览，右侧 Inspector 样式面板 |
| HTML 导入与导出 | 支持导入 `.html` / `.htm`，导出时清理编辑器内部标记 |
| 结构树选中 | 自动为可编辑元素注入 `data-hft-id`，从结构树定位到预览元素 |
| 实时 iframe 预览 | 使用 `srcDoc` 隔离渲染，通过 `postMessage` 同步选中、补丁和弹窗状态 |
| 可视化样式编辑 | 支持字体、字号、字重、行高、颜色、间距、边框、阴影、尺寸等常用属性 |
| 主题化颜色选择器 | 支持色相、饱和度/明度、RGB 微调和主题色预设 |
| 浮动快捷工具栏 | 选中元素后可复制样式、粘贴样式、复制、删除、上移、下移 |
| 多视口预览 | 桌面、宽屏、平板、手机和适配模式，支持缩放与专注预览 |
| Pretext 文本测量 | 使用 `@chenglou/pretext` 在不触发 DOM 回流的情况下预估文本行数和高度 |
| 编辑历史 | 支持撤销、重做和历史面板跳转 |
| 弹窗控制 | 识别常见 modal/dialog，并提供打开、关闭控制 |
| 测试覆盖 | 使用 Vitest + jsdom + node-canvas 覆盖 DOM、导出、字体和 Pretext 逻辑 |

## 截图 / GIF

当前仓库还没有提交正式演示图。建议在后续补充以下资源，并放到 `docs/screenshots/`：

| 资源 | 建议文件名 | 展示内容 |
| --- | --- | --- |
| 主界面截图 | `docs/screenshots/main-workspace.png` | 三栏布局、Canvas、Inspector 和状态栏 |
| 选中元素动图 | `docs/screenshots/select-and-edit.gif` | 从结构树选中元素并修改样式 |
| 颜色选择器截图 | `docs/screenshots/color-picker.png` | 主题化颜色 UI、RGB 输入、预设色 |
| 导入导出流程动图 | `docs/screenshots/import-export.gif` | 导入 HTML、编辑、导出干净 HTML |

示例写法：

```md
![HTML FineTune 主界面](docs/screenshots/main-workspace.png)
```

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 前端框架 | React 19 |
| 开发语言 | TypeScript 5 |
| 构建工具 | Vite 8 |
| 图标 | Lucide React |
| 文本测量 | `@chenglou/pretext` |
| 测试 | Vitest, Testing Library, jsdom, node-canvas |
| 运行方式 | 本地浏览器应用，无后端服务 |

## 本地运行

环境要求：

- Node.js 18 或更高版本
- npm 9 或更高版本

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

默认访问：

```txt
http://localhost:5173/
```

构建生产版本：

```bash
npm run build
```

运行测试：

```bash
npm test
```

监听模式运行测试：

```bash
npm run test:watch
```

## 使用方式

1. 打开应用后，可以直接编辑默认示例 HTML。
2. 点击“导入 HTML”，选择本地 `.html` 或 `.htm` 文件。
3. 在左侧切换“源码”或“结构”视图：
   - 源码视图适合直接改 HTML。
   - 结构视图适合快速定位可编辑元素。
4. 在中间 Canvas 中点击文本、图片或按钮元素。
5. 在右侧 Inspector 修改内容、字体、颜色、尺寸和其他样式。
6. 使用浮动工具栏进行复制样式、粘贴样式、复制、删除、移动等操作。
7. 点击“导出 HTML”，预览并下载清理后的 HTML 文件。

## 快捷键

| 快捷键 | 功能 |
| --- | --- |
| `Ctrl + Z` | 撤销 |
| `Ctrl + Y` | 重做 |
| `Ctrl + Shift + Z` | 重做 |

macOS 下可使用 `Cmd` 替代 `Ctrl`。

## 项目结构

```txt
src/
├─ main.tsx                         # React 入口
├─ App.tsx                          # 应用主状态、布局和核心事件流
├─ styles.css                       # 全局样式和组件样式
├─ sampleHtml.ts                    # 默认示例 HTML
├─ components/
│  ├─ Header.tsx                    # 顶部品牌区和工具栏容器
│  ├─ Toolbar.tsx                   # 撤销、重做、导入、复制、导出等操作
│  ├─ HtmlInputPanel.tsx            # 源码编辑器和结构树
│  ├─ PreviewFrame.tsx              # iframe 预览、桥接脚本、Canvas 控制
│  ├─ StyleEditorPanel.tsx          # Inspector 样式编辑面板
│  ├─ ColorField.tsx                # 颜色选择器
│  ├─ CustomSelect.tsx              # 自定义下拉选择
│  ├─ PretextMeasureBadge.tsx       # Pretext 文本测量提示
│  ├─ HistoryPanel.tsx              # 编辑历史面板
│  ├─ ExportPreviewDialog.tsx       # 导出前预览弹窗
│  └─ ErrorBoundary.tsx             # React 错误边界
├─ hooks/
│  ├─ useEditorHistory.ts           # 撤销、重做、历史记录
│  ├─ useIframeSelection.ts         # iframe 消息接收、选中状态、加载超时
│  ├─ usePanelResize.ts             # 左右面板拖拽调整
│  └─ usePretextMeasure.ts          # Pretext 文本测量 Hook
├─ types/
│  ├─ editor.ts                     # 编辑器核心类型
│  └─ messages.ts                   # iframe 消息协议类型与守卫
├─ utils/
│  ├─ editableElement.ts            # 可编辑元素识别规则
│  ├─ injectEditableIds.ts          # 为 HTML 注入可编辑 ID
│  ├─ domPath.ts                    # DOM 查询、更新、序列化
│  ├─ domTree.ts                    # 可编辑元素结构树
│  ├─ cleanHtmlForExport.ts         # 导出前清理内部属性
│  ├─ exportValidation.ts           # 导出校验与警告
│  ├─ exportHtml.ts                 # 下载 HTML 文件
│  ├─ fontLibrary.ts                # 远端字体库检测与注入
│  ├─ iframeMessages.ts             # iframe 消息发送工具
│  ├─ pretextMeasure.ts             # Pretext 测量封装与缓存
│  ├─ color.ts                      # Hex / RGB / HSV 转换
│  ├─ string.ts                     # 字符串辅助函数
│  └─ historySummary.ts             # 历史记录摘要
└─ test/
   ├─ setup.ts                      # 测试环境和 canvas polyfill
   ├─ editableElement.test.ts
   ├─ injectEditableIds.test.ts
   ├─ domPath.test.ts
   ├─ domTree.test.ts
   ├─ fontLibrary.test.ts
   ├─ pretextMeasure.test.ts
   └─ historySummary.test.ts
```

## 当前限制

- **大文档性能**：部分写操作仍会重新解析和序列化整份 HTML，超大文件可能有延迟。
- **自动保存**：当前没有持久化到 localStorage 或云端，刷新页面会丢失未导出的修改。
- **协同编辑**：目前是单机编辑器，不支持多人协作。
- **复杂脚本页面**：导入页面中的原始脚本可能与 iframe 沙箱、桥接脚本或页面自身状态产生交互问题。
- **远端字体加载**：Google Fonts 等远端字体首次加载时可能出现短暂字体回退。
- **历史记录内存**：历史栈保存完整 HTML 字符串，长时间编辑大文档会增加内存占用。
- **截图资源**：README 暂未内置正式截图或 GIF，需要后续补充。

## Roadmap

- [ ] 增量 DOM 持久化，减少大文档全量序列化开销
- [ ] localStorage 自动保存和崩溃恢复
- [ ] 更完善的幻灯片/分页 HTML 适配 API
- [ ] 键盘快捷键配置面板
- [ ] 批量样式操作和多选元素
- [ ] 组件级复制、粘贴和模板收藏
- [ ] 导出前可视化校验报告
- [ ] README 截图与演示 GIF
- [ ] Playwright 端到端测试
- [ ] 暗色模式和更多主题

## 开发说明

核心数据流：

```txt
HTML 字符串
  -> 注入可编辑 ID
  -> iframe srcDoc 渲染
  -> postMessage 回传选中元素
  -> React 状态更新
  -> 增量 patch 同步到 iframe
  -> 导出时清理内部属性
```

iframe 通信使用 `bridgeToken` 做消息校验；导出流程会移除 `data-hft-id`、选中态、hover 态和桥接样式，确保下载文件尽量接近普通静态 HTML。
