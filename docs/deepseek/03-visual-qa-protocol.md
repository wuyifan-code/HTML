# 14 状态视觉验收协议

## 1. 验收结论规则

只有同时满足以下条件，执行模型才可以报告“设计对齐完成”：

- 14/14 状态均由真实产品入口到达。
- 每个状态都有 reference、actual、diff、metrics、geometry 五项材料。
- 所有几何硬断言通过。
- 所有关键文字、active state、主题 token 和控件可用性断言通过。
- 每个状态 `pageerror=[]` 且 console error `=[]`。
- 整体像素 mismatch ratio 不高于 1.5%。
- `design-qa.md` 明确写出 `final result: passed`。
- 全量单测、构建、现有 E2E、14 状态视觉 E2E 全部退出码 0。

任何一个状态缺材料都等同失败。不得用“总体接近”“主要页面通过”替代。

## 2. Reference 生成规则

### 2.1 原始源

Reference 从 `docs/design-source/pages/*.html` 在本地离线服务中渲染，固定 viewport 为合同指定值。

### 2.2 暗色源纠错

D03、D12、D14 原始文件误写 `class="light" data-theme="light"`。Reference renderer 必须在内存副本中改为 dark，不得修改原始文件，也不得改变 DOM、尺寸和文案。

### 2.3 中文纠错

Reference 图片保留设计布局，但产品 actual 不复制损坏乱码。视觉比较时，乱码文本区域可设窄 mask；actual 必须使用现有产品的正确中文。不能用大矩形 mask 掩盖布局。

## 3. 状态驱动要求

| ID | Viewport | 产品状态 | 强制观察点 |
|---|---:|---|---|
| D01 | 1440×900 | 空工作区 | 三栏、disabled 顶栏、中心 CTA、状态栏 |
| D02 | 1440×900 | workspace/light/source | 56/280/320/28、preview 800、Source active |
| D03 | 1440×900 | workspace/dark/source | 暗 token、几何与 D02 相同 |
| D04 | 1440×900 | DOM Tree + selected h1 | 搜索、树折叠、24px row、画布 outline |
| D05 | 1440×900 | device preview/mobile | 399×691 外框、375×667 screen、尺寸条 |
| D06 | 390×844 | actual mobile source drawer open | 52 header、52 nav、320 drawer、backdrop |
| D07 | 1440×900 | text color picker open | 300 popover、268 map、hue/alpha、swatches |
| D08 | 1440×900 | menu showcase through real triggers | file/context/viewport/provider menu variants |
| D09 | 1440×900 | tooltip/toast states | 四方向 tooltip、四类 toast、堆叠 |
| D10 | 1440×900 | diagnostics fixture | 1 error/1 warning/1 info 全链同步 |
| D11 | 1440×900 | export/light/html | 680 与五段高度、Minified、comments on |
| D12 | 1440×900 | export/dark/html | 暗 overlay/token、几何不变 |
| D13 | 1440×900 | history/light | top76/right16/width340、56px rows |
| D14 | 1440×900 | history/dark | 暗 overlay/token、几何不变 |

## 4. 几何硬断言

使用 `getBoundingClientRect()`，输出到 `geometry.json`。每个断言结构：

```json
{
  "selector": "[data-dom-id=panel-source-tree]",
  "expected": { "x": 0, "y": 56, "width": 280, "height": 816 },
  "actual": { "x": 0, "y": 56, "width": 280, "height": 816 },
  "tolerance": 1,
  "passed": true
}
```

必须覆盖：

- Desktop：TopBar 56、Source 280、Inspector 320、StatusBar 28、Stage padding 24、Preview 800。
- DOM：search 28、row 24、indent 16、selected indicator 3。
- Device：399×691、375×667、toolbar 32。
- Mobile：390×844、header 52、bottom nav 52、drawer 320。
- Color：popover 300、map 268×140、slider 268×8。
- Toast：width 320、min-height 40、right/bottom 24。
- Export：680、48/40/360/44/48。
- History：top 76、right 16、width 340、row 56、footer 40。

桌面容差 ±1px；设备内部 iframe 和缩放后 preview 可 ±2px。文本换行不得用扩大容差解决。

## 5. 像素比较

### 5.1 算法

- 解码为 RGBA。
- 两 PNG 尺寸必须完全相同。
- 任一通道差值大于 8 才计 mismatch。
- 只在明确声明的 mask 之外比较。
- 输出 mismatch pixels、compared pixels、ratio。
- diff 图：一致像素降为 20% 灰度，差异像素标为不透明红色。

### 5.2 阈值

- 整体 mismatch ratio：`<=0.015`。
- 弹层/card bbox：硬断言，不受 ratio 豁免。
- 品牌色、surface、border、文字颜色：computed style 必须等于合同 token。
- Active/disabled/open/selected：必须通过属性和 class 硬断言。

### 5.3 允许 mask

- iframe 中明确的动态光标。
- 操作系统滚动条。
- 时间戳中不可固定的秒级内容。
- 字体渲染导致的文字 glyph 内部小范围抗锯齿。

禁止 mask：整个 TopBar、整个侧栏、整个 modal、整个文字区、缺失控件、错误背景色。

## 6. 浏览器错误检查

每个状态创建独立错误数组，切换状态前清空：

```js
const pageErrors = [];
const consoleErrors = [];

page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
```

状态完成后断言：

```js
assert.deepStrictEqual(pageErrors, []);
assert.deepStrictEqual(consoleErrors, []);
```

不允许基于错误文本做过滤。

## 7. 输出目录

```text
output/design-qa/
  D01-empty-workspace/
    reference.png
    actual.png
    diff.png
    metrics.json
    geometry.json
  ...
  D14-history-dark/
  summary.json
```

`summary.json` 至少包含：

```json
{
  "passed": 14,
  "failed": 0,
  "maxMismatchRatio": 0.015,
  "pageErrors": 0,
  "consoleErrors": 0
}
```

输出目录属于临时验收产物，不提交 Git；`design-qa.md` 提交。

## 8. 必须运行的命令

```bash
npm test
npm run build
node scripts/run-e2e.cjs
node scripts/e2e-design-14.cjs --compare
git diff --check
git status --short
```

最终 `git status --short` 必须为空。若视觉脚本需要启动服务，必须自动选择空闲端口并在 `finally` 中终止服务。

## 9. design-qa.md 格式

```markdown
# Design QA

final result: passed

| State | Viewport | Mismatch | Geometry | Page errors | Console errors |
|---|---:|---:|---|---:|---:|
| D01 | 1440×900 | 0.84% | PASS | 0 | 0 |

## Remaining P3

- 仅记录不阻断交付的抗锯齿或平台字体差异。
```

存在任何 P0/P1/P2 时，`final result` 必须为 `failed` 或 `blocked`，不能写 passed。
