# HTML FineTune 14 图设计合同

## 1. 当前问题判断

当前 `UI` 分支已经完成组件拆分和主要业务链路接入，但尚未达到 14 图精准对齐。现状属于“功能可运行、视觉与部分状态接线仍不完整”：

- 空状态只显示中心欢迎区，设计要求左右栏和禁用顶栏同时保留。
- Inspector 默认宽度为 360px，设计合同为 320px。
- 缩放和设备控件仍位于 Canvas 第二层工具栏，桌面主稿要求置于顶栏中心。
- Source 存在多层 draft；DOM Tree 折叠和节点 diagnostics 接线不完整。
- `DeviceFrame`、`Menu`、`ToastRegion`、`AiProviderPicker` 尚未完整进入生产路径。
- 移动端尚未形成 390×844 的独立 shell 与 320px 源码抽屉。
- Diagnostics、Color Picker、Export Preview 与设计稿存在结构级差距。
- 当前 12 张流程截图默认约 1280×720，不能证明 14 个设计状态在指定 viewport 下对齐。

本次迁移不得推翻业务架构。应在现有 `App -> SourcePanel / CanvasPanel / InspectorPanel`、`useEditorHistory`、iframe bridge 和导出工具上逐层收敛。

## 2. 全局设计系统

### 2.1 目标视口

| 场景 | 精确视口 |
|---|---:|
| 桌面设计与浮层 | 1440×900 |
| 实际移动端 Shell | 390×844 |
| 桌面编辑器中的手机预览内容 | 375×667 |
| 平板预设 | 768×1024 |

### 2.2 桌面壳层尺寸

| 区域 | 尺寸 |
|---|---:|
| TopBar | 56px 高 |
| Source Panel | 280px 宽 |
| Inspector | 320px 宽 |
| StatusBar | 28px 高 |
| 中央 Stage padding | 24px |
| 主预览卡 | 800px 宽，最大宽度 100% |
| 预览 URL bar | 32px 高 |

1440px 桌面中间列的计算宽度为 `1440 - 280 - 320 = 840px`。800px 预览卡在 24px stage padding 内居中，宽度不足时降为 `max-width:100%`。

### 2.3 亮色 token

```css
:root {
  --n-bg-base: #ffffff;
  --n-bg-elevated: #ffffff;
  --n-bg-subtle: #fbfbfa;
  --n-bg-hover: #f1f1f0;
  --n-bg-sidebar: #f7f6f3;
  --n-bg-canvas: #f7f6f3;
  --n-bg-inverse: #2f3437;

  --n-fg-default: #37352f;
  --n-fg-secondary: #787774;
  --n-fg-tertiary: #9b9a97;
  --n-fg-disabled: #c4c4c2;
  --n-fg-link: #2383e2;
  --n-fg-onbrand: #ffffff;

  --n-brand: #2383e2;
  --n-brand-hover: #1a72cf;
  --n-brand-active: #1761b3;
  --n-brand-disabled: rgba(35, 131, 226, 0.40);
  --n-success: #0f7b0f;
  --n-warning: #cb912f;
  --n-danger: #e03e3e;

  --n-border-default: #e9e9e7;
  --n-border-strong: #d3d3d0;
  --n-border-focus: rgba(35, 131, 226, 0.40);
}
```

### 2.4 暗色 token

```css
.dark {
  --n-bg-base: #191919;
  --n-bg-elevated: #202020;
  --n-bg-subtle: #252525;
  --n-bg-hover: #2a2a2a;
  --n-bg-sidebar: #202020;
  --n-bg-canvas: #2c2c2c;
  --n-bg-inverse: #e8e8e8;

  --n-fg-default: rgba(255, 255, 255, 0.90);
  --n-fg-secondary: rgba(255, 255, 255, 0.66);
  --n-fg-tertiary: rgba(255, 255, 255, 0.45);
  --n-fg-disabled: rgba(255, 255, 255, 0.25);
  --n-fg-link: #4dabf7;
  --n-fg-onbrand: #191919;

  --n-brand: #4dabf7;
  --n-brand-hover: #5bb8ff;
  --n-brand-active: #3d9be6;
  --n-brand-disabled: rgba(77, 171, 247, 0.35);
  --n-success: #4caf50;
  --n-warning: #f5c542;
  --n-danger: #f44336;

  --n-border-default: rgba(255, 255, 255, 0.10);
  --n-border-strong: rgba(255, 255, 255, 0.16);
  --n-border-focus: rgba(77, 171, 247, 0.45);
}
```

### 2.5 字体、圆角、阴影与动效

```css
--n-font-sans: "Inter", "Inter Fallback", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
--n-font-mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;

--n-radius-sm: 4px;
--n-radius-md: 5px;
--n-radius-lg: 6px;

--n-shadow-card: 0 1px 3px rgba(15,15,15,.04), 0 0 0 1px rgba(15,15,15,.04);
--n-shadow-pop: 0 4px 12px rgba(15,15,15,.05), 0 0 0 1px rgba(15,15,15,.04);
--n-shadow-overlay: 0 12px 32px rgba(15,15,15,.14), 0 3px 8px rgba(15,15,15,.08);

--n-ease: cubic-bezier(.165,.84,.44,1);
--n-duration-fast: 120ms;
--n-duration-base: 180ms;
--n-duration-slow: 240ms;
```

暗色阴影分别为 `0 1px 3px rgba(0,0,0,.40)`、`0 6px 16px rgba(0,0,0,.50)`、`0 12px 32px rgba(0,0,0,.60)`。History 特例圆角 8px；设备框使用 24/36/40px。

### 2.6 尺寸节奏与层级

- 间距只使用 4px 网格：4/8/12/16/20/24/28/32/36/40/48/64。
- 常用控件高度：24/28/32/36/40/44/48/52/56。
- 图标尺寸：12/14/16/18/20。
- Tab active：2px 下划线；侧栏选中或当前历史：3px 左侧品牌条。
- 统一生产层级：content 0/1，sticky header 20，phone status 30，backdrop 40，drawer/trigger 50，popover/modal 100，tooltip 110，toast 120。
- 禁止依赖 DOM 顺序形成层级；History、Menu、Export 必须落在明确的 overlay 层。

## 3. 14 个设计状态

### D01 空状态欢迎页

- 源：[空状态欢迎页.html](../design-source/pages/空状态欢迎页.html)
- 图：[01-empty-workspace.png](../design-references/01-empty-workspace.png)
- Viewport：1440×900。
- 壳层：TopBar 56、Source 280、Inspector 320、StatusBar 28，全部保留。
- 左栏显示空树说明与“等待导入”；右栏显示“选中元素后可调整样式”。
- 顶栏编辑控件 disabled，颜色使用 `--n-fg-disabled`，整体 opacity 0.6；导出使用 disabled brand。
- 中心插画区域 200×160，图形本身约 80×96。
- 标题为“拖入 HTML 文件，或粘贴代码开始”；说明最大宽 420px。
- 主 CTA 高 36px、标题后 28px；“粘贴源码”链接与 CTA 间距 14px。
- 产品规则：空状态也必须呈现三栏，不能只渲染中心 `EmptyWorkspace`。

### D02 主工作区（亮）

- 源：[主工作区 (亮).html](<../design-source/pages/主工作区 (亮).html>)
- 图：[02-workspace-light.png](../design-references/02-workspace-light.png)
- Viewport：1440×900；壳层按 56/280/320/28。
- Source 行号列 36px；Source 状态栏 28px。
- Stage padding 24px；预览卡 800px；预览内容最小高 456px；URL bar 32px。
- Inspector card 外距 8px；active card 左侧 3px brand。
- 顶栏必须容纳撤销、重做、缩放、100%、适应、主题、历史、统一导出。
- 设计源静态状态有“源码可见但 DOM tab active”的冲突。强制规则：内容优先；源码可见时 Source 必须 `aria-selected=true`。

### D03 主工作区（暗）

- 源：[主工作区 (暗).html](<../design-source/pages/主工作区 (暗).html>)
- 图：[03-workspace-dark.png](../design-references/03-workspace-dark.png)
- 几何与 D02 完全相同；代码区和行号使用 `--n-bg-subtle`。
- 必须显式激活 `.dark` 和 `data-theme="dark"`。
- 原文件错误声明为 light；不得照抄根节点，也不得从损坏暗图推导新布局。

### D04 DOM 树面板

- 源：[DOM 树面板.html](../design-source/pages/DOM%20树面板.html)
- 图：[04-dom-tree.png](../design-references/04-dom-tree.png)
- 桌面壳与 D02 相同；搜索框高 28px；树行高 24px；每级缩进 16px。
- 选中树行使用 `--n-bg-hover` 和 3px brand 左条。
- 画布选中框：`outline:2px dashed var(--n-brand); outline-offset:-2px`。
- 标签位于选中框顶部 `top:-20px`。
- Inspector 示例：Inter、28px、700、line-height 1.3、`#37352f`。
- 必须实现搜索、真实折叠、树选中画布、画布选中树、选中节点自动滚入可视区。

### D05 手机/平板视口

- 源：[手机_平板视口.html](../design-source/pages/手机_平板视口.html)
- 图：[05-device-viewports.png](../design-references/05-device-viewports.png)
- 这是桌面编辑器中的设备预览状态，不是实际移动端 Shell。
- 顶栏 56px；左右窄 rail 48px；顶栏左右标题区各 220px。
- 手机外框 399×691、圆角 36、padding 12；内部屏幕 375×667、圆角 24。
- notch 24×24、z 10；status bar 20px、z 5；移动预览导航 44px。
- 下方尺寸工具条高 32px，显示 375×667。
- 必须支持 desktop、768×1024、375×667、旋转、缩放和适应。

### D06 移动端抽屉布局

- 源：[移动端抽屉布局.html](../design-source/pages/移动端抽屉布局.html)
- 图：[06-mobile-drawer.png](../design-references/06-mobile-drawer.png)
- 这是实际 390×844 响应式 Shell，与 D05 不得混用 CSS。
- status 44、app header 52、bottom nav 52。
- canvas padding `20px 16px 16px`；preview 340px 宽。
- 打开态 backdrop：`rgba(0,0,0,.40)`、z 40。
- Source drawer：left/top/bottom 0、宽 320、z 50；drawer header 52、tab 40、status 28。
- home indicator：134×5、bottom 6、opacity .3、z 60。
- 点击汉堡打开；关闭按钮、遮罩和 Escape 关闭；Source/DOM 可切换。
- 抽屉过渡使用 180–240ms；触控目标优先 40×40，不得低于 32×32。
- `@media(min-width:400px)` 仅用于把 390×844 device frame 居中展示，不得作为产品移动断点照搬。

### D07 颜色选择器弹层

- 源：[颜色选择器弹层.html](../design-source/pages/颜色选择器弹层.html)
- 图：[07-color-picker.png](../design-references/07-color-picker.png)
- 这是组件状态展示，不新增产品路由。
- 背景 workspace opacity .4；trigger top 220/left 1116/z 50。
- 弹层 top 257/right 16/width 300/padding 16/radius 6/z 100。
- 当前色 `#37352f`；hex input 80×28。
- 饱和度/亮度矩阵 268×140；参考网格 12×7、gap 1。
- hue 和 alpha 条均为 268×8，thumb 14。
- presets：8 列、24px swatch、gap 4、共 16 个。
- recent：8 列、20px swatch；5 个有值、3 个空位。
- 选中 swatch 2px brand outline、offset 1。
- 必须支持指针拖拽、键盘、合法 hex、alpha、最近使用、outside click 和 Escape。

### D08 下拉菜单/菜单

- 源：[下拉菜单_菜单.html](../design-source/pages/下拉菜单_菜单.html)
- 图：[08-dropdown-menu.png](../design-references/08-dropdown-menu.png)
- 这是菜单原语展示，不新增产品路由。
- menu padding 4、radius 5、pop shadow；item 高 32、水平 padding 12、gap 8。
- separator 高 1、margin `4px 8px`。
- File：top 52/left 40/width 220，Export 为 hover，支持快捷键和 recent submenu。
- Context：top 400/left 620/居中/width 200，Paste disabled，Delete danger。
- Viewport：top 52/right 40/width 180，1440×900 active，另含 768×1024、375×667、custom。
- Provider：bottom 52/right 40/width 240，active 左 3px brand。
- Provider 列表必须保留项目现有定义和 key/model 逻辑，不能被稿中的四个示例覆盖。

### D09 Toast + Tooltip 组件

- 源：[Toast + Tooltip 组件.html](<../design-source/pages/Toast + Tooltip 组件.html>)
- 图：[09-toast-tooltip.png](../design-references/09-toast-tooltip.png)
- 这是组件状态展示，不新增产品路由。
- 展示页节奏为 padding `48px 64px`、section gap 36。
- tooltip：z 110、11px、padding `4px 8px`、inverse background，必须支持四方向和边界翻转。
- toast region：fixed bottom/right 24、gap 8、z 120；toast 宽 320、min-height 40、padding 12。
- 按钮高 32、icon-only 28、input 32、checkbox 16、toggle 28×16/thumb 12、chip 22。
- 必须支持 success/error/info/loading；loading spinner `.8s linear infinite`；多 Toast 堆叠和关闭。

### D10 诊断/错误面板

- 源：[诊断_错误面板.html](../design-source/pages/诊断_错误面板.html)
- 图：[10-diagnostics-error.png](../design-references/10-diagnostics-error.png)
- 桌面壳 56/280/320；预览 800、内容最小高 424；底部诊断条 32。
- 顶栏“3 个问题”背景 `rgba(203,145,47,.08)`、边框 alpha .20。
- Tree、Canvas、Inspector、Bottom summary 必须共享同一个 Problem 数据源。
- Canvas error/warning outline 均为 2px dashed；标签 top -18。
- fixture 固定为：inline style error、img missing alt warning、html missing lang info。
- 底栏固定显示 1 错误、1 警告、1 提示。
- 右侧支持“修复”和“忽略”；error/warning row 背景分别 `rgba(224,62,62,.06)` 和 `rgba(203,145,47,.05)`。

### D11 导出预览（亮）

- 源：[导出预览 (亮).html](<../design-source/pages/导出预览 (亮).html>)
- 图：[11-export-light.png](../design-references/11-export-light.png)
- 固定 1440×900；背景 workspace opacity .35；backdrop `rgba(15,15,15,.30)`。
- modal card 宽 680、radius 6、overlay shadow、生产 z 100。
- 五段高度严格为：header 48、tabs 40、preview 360、format row 44、footer 48。
- preview 左右 margin 24。
- HTML active；Minified active；Include comments on，toggle 28×16/thumb 12。
- close 28；主导出按钮高 32、min-width 80。
- Minified/Pretty Print/Include comments 必须真实影响 HTML preview、copy 和 HTML download。
- PDF/PPTX 继续走现有真实导出实现，只复用同一 dialog shell。

### D12 导出预览（暗）

- 源：[导出预览 (暗).html](<../design-source/pages/导出预览 (暗).html>)
- 图：[12-export-dark.png](../design-references/12-export-dark.png)
- 几何与 D11 相同；backdrop `rgba(0,0,0,.60)`；应用暗色 token。
- 原文件根节点错误声明为 light，按 D03 的暗色纠错规则处理。

### D13 历史记录（亮）

- 源：[历史记录 (亮).html](<../design-source/pages/历史记录 (亮).html>)
- 图：[13-history-light.png](../design-references/13-history-light.png)
- 固定 1440×900；背景 opacity .45；overlay `rgba(15,15,15,.25)`。
- panel top 76/right 16/width 340/max-height 808/radius 8/z 100。
- 每条记录高 56；首条当前记录左侧 3px brand；elevated/sidebar 交替底色。
- time 11px mono、date 10px、title 13px、type pill 高 28/radius 14。
- footer 40；scrollbar 4。
- 必须支持选中恢复、关闭、清空确认、键盘和 reduced motion。

### D14 历史记录（暗）

- 源：[历史记录 (暗).html](<../design-source/pages/历史记录 (暗).html>)
- 图：[14-history-dark.png](../design-references/14-history-dark.png)
- 几何与 D13 相同；overlay `rgba(0,0,0,.60)`；应用暗色 token。
- 原文件根节点错误声明为 light，按 D03 的暗色纠错规则处理。

## 4. 强制纠错规则

1. 三个暗稿根节点错误为 light。暗稿含义由文件名、`.dark` token 和配对亮稿共同确定。
2. 主工作区稿存在 tab active 与内容冲突。可见内容决定 active tab，不复制静态错误。
3. 部分中文发生 UTF-8/GBK 双重乱码或残缺标签。能恢复时进行 GBK encode → UTF-8 decode；否则使用当前产品中的正确中文语义。最终 UI 必须零乱码。
4. 原型引用 Tailwind/Lucide CDN、内联 handler 和大量内联 style；这些只能用于测量，不能进入生产。
5. 设计源无真实 bitmap 资产。优先复用项目图标库；不得用 emoji、字符或 CSS 图形冒充图标。
6. 源稿中未定义的 `--n-foreground` 必须统一解释为 `--n-fg-default`。
7. D05 是编辑器里的设备预览，D06 是产品自身移动 Shell，二者必须分别实现。
8. Export 稿只展示 HTML active，但不得删除 PDF/PPTX 真实导出。

## 5. 不可破坏的产品边界

- 不修改 `backup-original/`、`docs/design-source/pages/` 和设计参考 PNG。
- 不改变 iframe bridge token、sandbox 或消息来源验证。
- 不改变 AI key 标准键 `html-finetune.ai-provider-keys`，不写死密钥，不删除 provider。
- 不降低 PDF/PPTX 二进制断言，不把 vendor 动态包重新打入主 chunk。
- 不删除 undo/redo/history、稳定 `data-dom-id` 和 E2E 语义选择器。
- 不以隐藏假控件通过测试。
- 不在视觉任务中顺手重写业务 utilities；不在业务接线任务中无边界重写全局 CSS。
