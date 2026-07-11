# HTML FineTune UI 升级交付清单

## 状态

UI 迁移、React 源码同步、DOM 树交互、AI 异常边界、统一导出与自动化验收均已完成。

## 已交付内容

- 新版 SourcePanel、CanvasPanel、InspectorPanel 已接入 App 主渲染链路。
- 源码“应用”操作直接传递最新 HTML，避免 React 状态异步导致画布使用旧值。
- DOM 树 E2E 使用真实 `.tree-node`，字号编辑使用 `label:has-text("字号") input`。
- 手动 AI 扫描会将失败同步到 UI 状态，同时在事件边界消费 rejection，不再产生未捕获 `pageerror`。
- 顶栏只保留统一导出入口，不包含隐藏 PDF/PPTX 测试占位按钮。
- PDF/PPTX E2E 通过真实统一导出弹窗完成下载，并执行二进制结构检查。
- GitHub Pages 部署在上传产物前执行完整 `npm run ci`。

## 提交

- `4ac878e` — `fix(ui): complete migrated workspace integration and e2e coverage`
- `7550d0b` — `ci: gate pages deployment on full browser verification`

## 验收记录

- `npm test`：50 个测试文件、408 个测试用例通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过。
- `node scripts/run-e2e.cjs`：UI、AI、PDF/PPTX 三组场景通过。
- AI malformed JSON 场景：页面显示错误信息，捕获的未处理 `pageerror` 数量为 0。
- UI 场景：12 张步骤截图全部生成。
- PDF：1 页，1068 × 510 pt，15,261 bytes。
- PPTX：1 张幻灯片、1 个媒体文件，129,175 bytes，内嵌 PNG 可解码。

## 最终检查

交付前必须重新运行：

```bash
npm run ci
git diff --check
git status --short
```
