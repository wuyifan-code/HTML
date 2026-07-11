# 设计参考图索引

这些 PNG 在 1440×900 统一视口下由 14 个 HTML 设计源渲染，用于辅助视觉比较。权威尺寸和源稿纠错规则以 [设计合同](../deepseek/01-design-contract.md) 为准。

| ID | 文件 | 状态 |
|---|---|---|
| D01 | `01-empty-workspace.png` | 空工作区 |
| D02 | `02-workspace-light.png` | 主工作区亮色 |
| D03 | `03-workspace-dark.png` | 主工作区暗色意图态 |
| D04 | `04-dom-tree.png` | DOM Tree + 选中 |
| D05 | `05-device-viewports.png` | 桌面中的手机预览 |
| D06 | `06-mobile-drawer.png` | 390×844 移动抽屉 |
| D07 | `07-color-picker.png` | Color Picker open |
| D08 | `08-dropdown-menu.png` | Menu variants |
| D09 | `09-toast-tooltip.png` | Toast/Tooltip primitives |
| D10 | `10-diagnostics-error.png` | Diagnostics 1/1/1 |
| D11 | `11-export-light.png` | Export Preview 亮色 |
| D12 | `12-export-dark.png` | Export Preview 暗色意图态 |
| D13 | `13-history-light.png` | History 亮色 |
| D14 | `14-history-dark.png` | History 暗色意图态 |

D03/D12/D14 的原始 HTML 根节点存在 light 标记错误，视觉测试必须从临时副本显式激活 `.dark`；不能仅凭当前 PNG 猜测暗色布局。
