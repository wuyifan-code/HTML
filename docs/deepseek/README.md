# DeepSeek 精细化开发文档入口

本目录用于指导 DeepSeek 编码模型在现有 HTML FineTune React 项目中，对齐 `docs/design-source/pages/` 的 14 个设计状态。目标是保留当前 HTML 编辑、iframe 预览、AI、历史和真实导出能力，同时完成可量化、可回归的视觉迁移。

## 文档顺序

1. [设计合同](./01-design-contract.md)：14 个设计状态、像素尺寸、主题 token、交互和源稿纠错规则。
2. [实施计划](./02-implementation-plan.md)：T0–T12 的依赖顺序、允许修改文件、TDD 步骤、提交边界和验收标准。
3. [视觉验收协议](./03-visual-qa-protocol.md)：1440×900、390×844 截图、几何硬断言、像素差、控制台错误和交付产物。
4. [DeepSeek 执行指令](./04-deepseek-execution-prompt.md)：可直接复制给 DeepSeek 的总控提示词。

实施计划同时按项目计划约定镜像到 `docs/superpowers/plans/2026-07-11-html-finetune-14-design-alignment.md`；两份内容必须保持一致。

## 权威顺序

发生冲突时，执行模型必须按以下优先级判断，禁止自行“美化”：

1. 本目录的设计合同和强制纠错规则。
2. `docs/design-source/pages/*.html` 中可验证的尺寸、token、结构和文案意图。
3. `docs/design-references/01-*.png` 至 `14-*.png` 的可见视觉。
4. 当前产品已工作的业务行为和安全边界。

原始 HTML 是设计测量源，不是可直接复制的生产代码。不得把其 Tailwind CDN、Lucide CDN、内联事件、内联样式或损坏中文复制进 React。

## 设计源清单

原始压缩包已原样展开到：

```text
docs/design-source/pages/
```

视觉参考位于：

```text
docs/design-references/
```

当前实现的 1440×900 空状态基线保存在 [current-ui-baseline.png](./current-ui-baseline.png)，只用于展示迁移前差距，不是目标设计。

三个暗色 HTML 的根节点错误写成 `class="light" data-theme="light"`。暗色状态必须使用同组亮稿几何，并显式激活本文定义的 `.dark` token。暗色 PNG 只用于辅助查看，不得覆盖该规则。

## 执行原则

- 一次只执行一个任务；每个任务一个独立提交。
- 先写失败测试或失败视觉基线，再修改生产实现。
- 每个任务仅修改“允许文件”；发现越界需求必须停止并报告。
- 不以肉眼描述代替尺寸断言、截图 diff 和浏览器错误检查。
- 不允许通过隐藏控件、放宽断言、过滤 `pageerror` 或固定假数据获得绿灯。
- 最终必须返回 14 个状态的 reference、actual、diff、差异率和关键 bounding box JSON。
