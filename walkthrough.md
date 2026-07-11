# HTML FineTune UI 升级操作说明

## 1. 初始化工作区

打开应用后，如果当前为空工作区，可通过“导入 HTML”选择文件初始化画布。导入完成后，源码、DOM 树、画布和属性检查器会使用同一份编辑状态。

## 2. 源码与画布同步

1. 切换到左侧“来源”标签。
2. 在源码编辑器中修改 HTML。
3. 点击“应用”。
4. 最新 HTML 会直接传给 App 应用逻辑，画布与 DOM 树在同一操作后刷新，状态恢复为“已同步”。

## 3. DOM 树和属性编辑

1. 切换到“DOM 树”。
2. 点击 `.tree-node` 节点选择画布元素。
3. 在右侧 Inspector 修改字号、对齐方式或文本内容。
4. 点击对应的应用按钮，将属性写回 HTML 和预览画布。

## 4. AI 扫描失败处理

AI 扫描使用 localStorage 键 `html-finetune.ai-provider-keys` 读取提供商密钥。若 AI 返回 malformed JSON：

- AI 面板显示明确的 JSON 解析失败提示；
- `aiStatus` 进入错误状态；
- 应用外壳和统一导出入口继续可用；
- 浏览器不会产生未捕获 `pageerror`。

手动扫描的 rejected Promise 只在 UI 事件边界消费；内部导出预检仍可通过 `try/catch` 获知扫描失败并执行降级。

## 5. 统一导出

1. 点击顶栏“导出”。
2. 在导出弹窗选择 HTML、PDF 或 PPTX。
3. 点击当前格式对应的最终导出按钮。

顶栏不再提供独立或隐藏的 PDF/PPTX 按钮。自动化测试也必须经过统一导出弹窗，不允许操作测试占位 DOM。

## 6. 自动化验收

完整本地验收命令：

```bash
npm run test
npm run build
node scripts/run-e2e.cjs
```

也可以运行统一命令：

```bash
npm run ci
```

`scripts/run-e2e.cjs` 会自动选择空闲端口、启动 `/HTML/` 预览服务、依次执行 UI/AI/导出场景，并在结束后关闭服务。

UI 截图保存在 `.screenshots/01_initial_home.png` 至 `.screenshots/12_export_dialog_pptx.png`。该目录属于测试产物，不提交到 Git。

## 7. CI 部署

GitHub Pages 工作流使用 Node.js 22，并执行：

1. `npm ci`；
2. 安装 Playwright Chromium 及系统依赖；
3. `npm run ci`；
4. 仅在完整验证通过后上传 `dist` 并部署 Pages。

Windows 默认使用系统 Chrome；非 Windows 环境在未指定 `CHROME_PATH` 时使用 Playwright Chromium。
