# 14 个设计源说明

`pages/` 来自用户提供的“空状态欢迎页 等 14 个设计.zip”，按原始字节展开，作为尺寸、token、结构和状态意图的测量源。不得直接复制其中的 CDN、inline handler 或整段 demo markup 到生产。

已知源稿缺陷：

- `主工作区 (暗).html`、`导出预览 (暗).html`、`历史记录 (暗).html` 的根节点错误写为 `class="light" data-theme="light"`。渲染暗稿时只在临时副本中改为 dark，原文件保持不变。
- `主工作区` 源码内容可见，但静态 tab active 指向 DOM Tree。产品实现按“可见内容优先”纠正。
- 部分中文存在双重编码乱码或残缺标签。生产使用现有正确中文，不复制乱码。
- 源文件依赖浏览器版 Tailwind 和 Lucide CDN；它们只用于原稿渲染，不进入应用依赖。

完整解释见 [设计合同](../deepseek/01-design-contract.md)。
