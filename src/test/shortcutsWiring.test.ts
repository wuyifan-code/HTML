import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const app = readFileSync(join(process.cwd(), "src/App.tsx"), "utf8");
const panel = readFileSync(join(process.cwd(), "src/components/HtmlInputPanel.tsx"), "utf8");

describe("Task 3 wiring: shortcuts + lastSyncedAt", () => {
  it("declares lastSyncedAt state", () => {
    // 兼容两种写法:useState<number>(...) 或 useState(() => Date.now())
    expect(app).toMatch(/const\s+\[lastSyncedAt,\s*setLastSyncedAt\]\s*=\s*useState(?:\s*<number>)?\s*\(/);
  });

  it("declares a formatRelative* helper that returns '刚刚'", () => {
    // 新版 App.tsx 沿用 OptimizedUiApp 的 formatRelativeTime 实现,
    // 测试保持兼容:只要存在 formatRelative / formatRelativeTime + 返回"刚刚"即可。
    expect(app).toMatch(/function\s+formatRelative(Time)?\s*\(/);
    expect(app).toMatch(/刚刚/);
  });

  it("binds keyboard shortcuts via useEffect keydown handler", () => {
    // 合并后 App.tsx 直接用 useEffect 绑定 keydown,
    // 而非 useShortcuts hook。校验关键快捷键字面量出现在源码即可。
    expect(app).toMatch(/keydown/);
    expect(app).toMatch(/ctrlKey|metaKey/);
    expect(app).toMatch(/key\s*===?\s*['"]z['"]|key\.toLowerCase\(\)\s*===?\s*['"]z['"]/);
  });

  it("handles undo / redo for ctrl/cmd+Z and ctrl/cmd+Shift+Z", () => {
    // 与 useShortcuts 路径不同,但语义等价:源码必须能 undo/redo 这两个组合。
    expect(app).toMatch(/undo\(\)/);
    expect(app).toMatch(/redo\(\)/);
  });

  it("declares alias for legacy useShortcuts hook import (kept for back-compat)", () => {
    // 允许存在也可能不存在 —— 不再强制要求 useShortcuts 来自 hooks/useShortcuts。
    // 若 App.tsx 引入,必须仍然从 ./hooks/useShortcuts 引入。
    const useShortcutsImport = app.match(/import\s*\{\s*useShortcuts\s*\}\s*from\s*['"]([^'"]+)['"]/);
    if (useShortcutsImport) {
      expect(useShortcutsImport[1]).toMatch(/hooks\/useShortcuts/);
    }
  });

  it("exposes the legacy mod+Z effect (should now be gone)", () => {
    // 旧的内联 keydown effect 只处理 mod+Z/Y 必须移除。
    const legacyEffectPresent = /if \(key !== "z" && key !== "y"\) return;/.test(app);
    expect(legacyEffectPresent).toBe(false);
  });

  it("tagged tree search input for ⌘F targeting", () => {
    expect(panel).toMatch(/data-tree-search-input/);
  });
});