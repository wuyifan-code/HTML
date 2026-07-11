# 可直接复制给 DeepSeek 的执行指令

你正在维护 `D:\Trae\Html Write` 的 HTML FineTune React 项目。你的任务不是重新设计产品，而是严格依据仓库中的 14 状态设计合同完成精细化迁移。

开始前必须完整阅读：

1. `docs/deepseek/README.md`
2. `docs/deepseek/01-design-contract.md`
3. `docs/deepseek/02-implementation-plan.md`
4. `docs/deepseek/03-visual-qa-protocol.md`
5. 当前任务允许修改的全部源码和测试

## 执行模式

- 按 T0→T12 顺序执行，不允许跨任务抢跑。
- 本轮只执行用户指定的一个任务；未指定时从第一个未完成任务开始。
- 每个任务必须遵循 RED → GREEN → REFACTOR → targeted tests → build → commit。
- 每个任务一个独立提交；不得把其他任务顺手混入。
- 先检查 `git status --short`。已有改动属于用户，不得覆盖、reset、checkout 或删除。
- 只修改任务列出的允许文件。发现需要越界时停止并报告原因、所需文件和影响。

## 产品与架构规则

- 保留当前 HTML 编辑、DOM 选择、iframe bridge、AI、历史、HTML/PDF/PPTX 导出。
- `src/styles/tokens.css` 是 `--n-*` 唯一真源。
- 不把设计稿 CDN、inline handler、静态 demo route 或整段 HTML 搬进生产。
- 不修改 iframe token/sandbox/来源校验。
- 不修改 AI key 标准键 `html-finetune.ai-provider-keys`，不写死密钥。
- 不删除或削弱 PDF/PPTX 二进制测试。
- 不用隐藏控件、假按钮、过滤异常、降低阈值或跳过测试制造通过。
- `手机_平板视口` 是编辑器中的 device preview；`移动端抽屉布局` 是实际响应式 shell，禁止混为一套实现。
- 三个暗稿错误声明为 light；使用同组亮稿几何并显式应用设计合同的 `.dark` token。
- 源稿乱码和残缺标签不得复制；最终产品必须使用正确中文。

## 设计判定规则

当源码、PNG、现有实现冲突时，依次遵循：

1. `01-design-contract.md` 的强制规则。
2. `docs/design-source/pages/*.html` 可验证的尺寸/token/结构。
3. `docs/design-references/*.png` 的可见视觉。
4. 现有产品必须保留的业务行为。

不得自行改变颜色、字体、圆角、阴影、间距、控件结构或文案语义。

## 测试与证据

任务结束前必须运行该任务的 targeted tests 和 `npm run build`。T12 或最终交付还必须运行：

```bash
npm test
npm run build
node scripts/run-e2e.cjs
node scripts/e2e-design-14.cjs --compare
git diff --check
git status --short
```

浏览器验收必须使用真实 UI 到达状态。每个状态的 `pageerror` 和 console error 精确为 0，不允许白名单。

## 返回格式

完成后只返回以下材料：

```markdown
## Task
- ID:
- Status: complete | blocked
- Commit:

## Files changed
- path — reason

## RED evidence
- Command:
- Exit code:
- Expected failure:

## GREEN evidence
- Command:
- Exit code:
- Test count:

## Visual evidence
- State:
- Reference:
- Actual:
- Diff:
- Mismatch:
- Geometry result:
- Page errors: 0
- Console errors: 0

## Repository state
- git diff --check:
- git status --short:

## Risks or remaining work
- None，或列出真实阻断。
```

禁止使用“应该”“大概”“看起来一致”。没有新鲜命令输出或完整视觉材料时，不得报告 complete。
