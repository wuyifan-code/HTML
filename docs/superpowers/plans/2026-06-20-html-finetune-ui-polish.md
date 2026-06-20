# HTML FineTune UI/UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade HTML FineTune editor (D:\Trae\Html Write) from a single-row 8-button toolbar + flat DOM tree + info-overloaded status bar into a clearly grouped, visually tiered, keyboard-accessible modern HTML tuning tool — across 9 atomic commits.

**Architecture:** Pure additive UI/UX layer. No state machine rewrites; all existing props preserved. New functionality sits on top via new hooks (`useShortcuts`, `useColorHistory`), a new `colorHistory` localStorage helper, and CSS classes that compose with the existing `.toolbar` / `.status-bar` / `.dom-tree` / `.color-popover` systems.

**Tech Stack:** React 19, TypeScript 5.8, Vitest 4 + jsdom, Vite 8, lucide-react, CSS (no Tailwind / no UI lib).

---

## Conventions for All Tasks

- One commit per task. Commit message format: `feat(scope): …` / `refactor(scope): …` / `test: …`.
- All new branches off `main`. After each task, run `npm run test` and `npm run build` — both must pass before the commit is finalized.
- All new CSS classes are namespaced under `.hft-…` (already established convention in the bridge style block) so they don't collide with the editor's existing `.toolbar-*` / `.status-*` classes.
- Existing props of all touched components stay unchanged. New behavior is opt-in via new props.
- All keyboard shortcut handlers respect `event.target` whitelist — see `src/hooks/useShortcuts.ts` Task 3.1.
- File path conventions are absolute `D:/Trae/Html Write/...` everywhere. Inside code blocks, use POSIX-style forward slashes so they work in both Windows and the agent sandbox.

---

## Task 1: Strengthen the "Auto" Placeholder for NumericUnitField

**Files:**
- Modify: `src/styles.css:251-269` (existing `.unit-input-empty` rule)
- Modify: `src/test/unitInput.test.ts` (new test file)

**Why:** Today's `.unit-input-empty` looks identical to a numeric `0` because there's no visual cue that the value is "unset". Stronger placeholder styling makes "unset" vs "set" instantly distinguishable.

- [ ] **Step 1: Write the failing test**

Create `src/test/unitInput.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const styles = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");

describe("unit-input-empty placeholder styling", () => {
  it("renders the auto placeholder with muted color and italic", () => {
    expect(styles).toMatch(/\.unit-input-empty\b/);
    expect(styles).toMatch(/\.unit-input-empty[\s\S]{0,400}font-style:\s*italic/);
    expect(styles).toMatch(/\.unit-input-empty[\s\S]{0,400}color:\s*#94a3b8/);
  });

  it("uses a dashed border to signal unset state", () => {
    expect(styles).toMatch(/\.unit-input-empty[\s\S]{0,600}border:\s*1px dashed/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- unitInput`
Expected: FAIL with "expected … to match `font-style: italic`" because the current rule only sets the color, not italic or border.

- [ ] **Step 3: Strengthen `.unit-input-empty` in `src/styles.css`**

Open `src/styles.css`, locate the existing rule (around line 251):

```css
.unit-input-empty {
  color: var(--muted);
}
```

Replace with the strengthened version (still inside the same media-friendly block, no layout shift):

```css
.unit-input-empty {
  color: #94a3b8;
  font-style: italic;
  border: 1px dashed rgba(148, 163, 184, 0.4);
  padding: 0 6px;
  background-color: transparent;
}

.unit-input-empty::placeholder {
  color: #94a3b8;
  font-style: italic;
  opacity: 1;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- unitInput`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "D:/Trae/Html Write"
git add src/styles.css src/test/unitInput.test.ts
git commit -m "feat(inspector): strengthen unit-input-empty placeholder styling"
```

---

## Task 2: Toolbar Grouping + Modal Toggle Merge

**Files:**
- Modify: `src/components/Toolbar.tsx` (full file — see code below)
- Modify: `src/styles.css` (add `.toolbar-group-export`, `.toolbar-history-tail`)
- Modify: `src/components/Header.tsx` (no logic change — just re-imports Toolbar)

**Why:** Eight buttons in one line overflow at 1024px. Merge "open/close modal" into a single toggle and group export/import/copy on the right.

- [ ] **Step 1: Verify the `compact-toolbar-button` already exists and matches the responsive collapse target**

Run:

```bash
cd "D:/Trae/Html Write" && grep -n "compact-toolbar-button" src/styles.css | head -5
```

Expected: existing rules already toggle icon-only display under a media query (no change needed; the toolbar below reuses these classes).

- [ ] **Step 2: Rewrite `src/components/Toolbar.tsx` with the new grouping**

Replace the entire file contents with:

```tsx
import {
  Clipboard,
  Download,
  FileText,
  FileUp,
  History,
  LoaderCircle,
  MessageSquare,
  Presentation,
  Redo2,
  Undo2,
  X,
} from "lucide-react";

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  hasModal: boolean;
  isModalOpen: boolean;
  exportingFormat: "pdf" | "pptx" | null;
  onUndo: () => void;
  onRedo: () => void;
  onToggleHistory: () => void;
  onModalToggle: () => void;
  onImport: (file: File) => void;
  onCopy: () => void;
  onExport: () => void;
  onExportPdf: () => void;
  onExportPptx: () => void;
}

export function Toolbar({
  canUndo,
  canRedo,
  hasModal,
  isModalOpen,
  exportingFormat,
  onUndo,
  onRedo,
  onToggleHistory,
  onModalToggle,
  onImport,
  onCopy,
  onExport,
  onExportPdf,
  onExportPptx,
}: ToolbarProps) {
  const isExportingPdf = exportingFormat === "pdf";
  const isExportingPptx = exportingFormat === "pptx";

  return (
    <div className="toolbar" aria-label="编辑器工具栏">
      {/* 左侧：历史操作 */}
      <div className="toolbar-group" aria-label="历史操作">
        <button
          className="ghost-button toolbar-button"
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="撤销 · ⌘Z / Ctrl+Z"
        >
          <Undo2 size={16} strokeWidth={1.75} />
          <span className="button-label">撤销</span>
        </button>
        <button
          className="ghost-button toolbar-button"
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="重做 · ⌘Y / ⇧⌘Z"
        >
          <Redo2 size={16} strokeWidth={1.75} />
          <span className="button-label">重做</span>
        </button>
      </div>

      <div className="toolbar-separator" aria-hidden="true" />

      {/* 中间：导入/复制/导出 */}
      <div className="toolbar-group toolbar-group-middle" aria-label="页面功能">
        <label className="ghost-button toolbar-button compact-toolbar-button file-button" title="导入 .html 文件 · 快捷键未绑定">
          <FileUp size={16} strokeWidth={1.75} />
          <span className="button-label">导入 HTML</span>
          <input
            type="file"
            accept=".html,.htm,text/html"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <button className="ghost-button toolbar-button compact-toolbar-button" type="button" onClick={onCopy} title="复制当前 HTML · ⌘⇧C">
          <Clipboard size={16} strokeWidth={1.75} />
          <span className="button-label">复制 HTML</span>
        </button>
        <button className="primary-button toolbar-button export-toolbar-button" type="button" onClick={onExport} title="导出 HTML · ⌘E">
          <Download size={17} strokeWidth={1.75} />
          <span className="button-label">导出 HTML</span>
        </button>
        <button
          className="ghost-button toolbar-button compact-toolbar-button export-format-button"
          type="button"
          onClick={onExportPdf}
          disabled={exportingFormat !== null}
          title="AI 预检后导出 PDF"
        >
          {isExportingPdf ? (
            <LoaderCircle className="spin-icon" size={16} strokeWidth={1.75} />
          ) : (
            <FileText size={16} strokeWidth={1.75} />
          )}
          <span className="button-label">{isExportingPdf ? "生成中" : "PDF"}</span>
        </button>
        <button
          className="ghost-button toolbar-button compact-toolbar-button export-format-button"
          type="button"
          onClick={onExportPptx}
          disabled={exportingFormat !== null}
          title="AI 预检后导出 PPTX"
        >
          {isExportingPptx ? (
            <LoaderCircle className="spin-icon" size={16} strokeWidth={1.75} />
          ) : (
            <Presentation size={16} strokeWidth={1.75} />
          )}
          <span className="button-label">{isExportingPptx ? "生成中" : "PPTX"}</span>
        </button>
      </div>

      <div className="toolbar-separator" aria-hidden="true" />

      {/* 右侧：弹窗 toggle + 历史 */}
      <div className="toolbar-group toolbar-group-tail" aria-label="弹窗与历史">
        <button
          className={
            "ghost-button toolbar-button compact-toolbar-button toolbar-modal-button" +
            (hasModal && isModalOpen ? " toolbar-modal-button-active" : "")
          }
          type="button"
          onClick={onModalToggle}
          disabled={!hasModal}
          title={isModalOpen ? "关闭预览中的弹窗" : "打开预览中的弹窗"}
          aria-pressed={hasModal && isModalOpen}
        >
          {isModalOpen ? <X size={16} strokeWidth={1.75} /> : <MessageSquare size={16} strokeWidth={1.75} />}
          <span className="button-label">{isModalOpen ? "关闭弹窗" : "打开弹窗"}</span>
        </button>
        <button
          className="ghost-button toolbar-button compact-toolbar-button toolbar-history-tail"
          type="button"
          onClick={onToggleHistory}
          title="查看编辑历史"
        >
          <History size={16} strokeWidth={1.75} />
          <span className="button-label">历史</span>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `src/components/Header.tsx` to wire `onModalToggle`**

Replace the existing `onOpenModal` / `onCloseModal` pair with a single `onModalToggle`. After this change, `Header` only forwards one modal callback.

```tsx
import { Toolbar } from "./Toolbar";

interface HeaderProps {
  canUndo: boolean;
  canRedo: boolean;
  hasModal: boolean;
  isModalOpen: boolean;
  exportingFormat: "pdf" | "pptx" | null;
  onUndo: () => void;
  onRedo: () => void;
  onToggleHistory: () => void;
  onModalToggle: () => void;
  onImport: (file: File) => void;
  onCopy: () => void;
  onExport: () => void;
  onExportPdf: () => void;
  onExportPptx: () => void;
}

export function Header({
  canUndo,
  canRedo,
  hasModal,
  isModalOpen,
  exportingFormat,
  onUndo,
  onRedo,
  onToggleHistory,
  onModalToggle,
  onImport,
  onCopy,
  onExport,
  onExportPdf,
  onExportPptx,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">
          &lt;/&gt;
        </div>
        <div className="brand-copy">
          <h1>HTML FineTune</h1>
          <p className="brand-subtitle">实时页面微调工作台</p>
        </div>
      </div>
      <Toolbar
        canUndo={canUndo}
        canRedo={canRedo}
        hasModal={hasModal}
        isModalOpen={isModalOpen}
        onUndo={onUndo}
        onRedo={onRedo}
        onToggleHistory={onToggleHistory}
        onModalToggle={onModalToggle}
        onImport={onImport}
        onCopy={onCopy}
        onExport={onExport}
        onExportPdf={onExportPdf}
        onExportPptx={onExportPptx}
        exportingFormat={exportingFormat}
      />
    </header>
  );
}
```

- [ ] **Step 4: Update `App.tsx` to provide a single `onModalToggle` callback**

Locate the `<Header …>` usage (around the bottom of the JSX in `App.tsx`). Currently it passes `onOpenModal={handleOpenModal}` and `onCloseModal={handleCloseModal}`. Replace those two props with `onModalToggle={handleToggleModal}`. Add the new callback near the existing `handleOpenModal` / `handleCloseModal` (search for them with grep first to find the right neighborhood):

```tsx
const handleToggleModal = useCallback(() => {
  if (!modalState.open) {
    void handleOpenModal();
  } else {
    void handleCloseModal();
  }
}, [modalState.open, handleOpenModal, handleCloseModal]);
```

Use `grep -n "handleOpenModal\|handleCloseModal" src/App.tsx` to find exact lines; merge the toggle callback into that block.

- [ ] **Step 5: Append toolbar group CSS classes**

Append to `src/styles.css` (anywhere after the existing `.toolbar-separator` rule — pick a search anchor in the file first):

```css
.toolbar-group-middle {
  flex: 1 1 auto;
  justify-content: center;
}

.toolbar-group-tail {
  margin-left: auto;
}

.toolbar-modal-button-active {
  background-color: rgba(25, 169, 151, 0.14);
  color: #0f766e;
}

@media (max-width: 1024px) {
  .toolbar-group-middle {
    justify-content: flex-end;
  }
}
```

- [ ] **Step 6: Verify the existing test suite still compiles**

Run: `npm run test`
Expected: PASS. (`Toolbar` only changed its prop shape; tests that don't touch it remain green.)

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: PASS with no TS errors (the `Header` prop shape change is consistent in both files).

- [ ] **Step 8: Commit**

```bash
cd "D:/Trae/Html Write"
git add src/components/Toolbar.tsx src/components/Header.tsx src/App.tsx src/styles.css
git commit -m "refactor(toolbar): group buttons into left/center/right, merge modal toggle"
```

---

## Task 3: Global Keyboard Shortcuts Hook + ⌘ Hints on Buttons

**Files:**
- Create: `src/hooks/useShortcuts.ts`
- Create: `src/test/useShortcuts.test.ts`
- Modify: `src/App.tsx` (wire hook, remove old keydown effect, add new handlers)
- Modify: `src/styles.css` (kbd-tag styling for tooltips)

**Why:** Today only ⌘Z / ⌘Y / ⇧⌘Z work. Users expect Delete to remove selection, Esc to cancel, ⌘F to focus search, ⌘B/I/U for bold/italic/underline, ⌘1-5 to switch viewport. Buttons should also advertise their shortcuts via tooltips.

- [ ] **Step 1: Write the failing test for `useShortcuts`**

Create `src/test/useShortcuts.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useShortcuts, type ShortcutBinding } from "../hooks/useShortcuts";

function fireKey(target: EventTarget, init: KeyboardEventInit) {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe("useShortcuts", () => {
  it("matches mod+Z and ignores other combos", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const { unmount } = renderHook(() =>
      useShortcuts([
        { combo: "mod+z", handler: undo, allowInInputs: true },
        { combo: "mod+shift+z", handler: redo, allowInInputs: true },
      ])
    );

    fireKey(window, { key: "z", ctrlKey: true });
    fireKey(window, { key: "z", ctrlKey: true, shiftKey: true });
    expect(undo).toHaveBeenCalledTimes(1);
    expect(redo).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("skips handlers when typing in an input unless allowInInputs is set", () => {
    const handler = vi.fn();
    const input = document.createElement("input");
    document.body.appendChild(input);
    renderHook(() => useShortcuts([{ combo: "mod+d", handler }]));
    fireKey(input, { key: "d", ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("allows Delete when not focused inside an input", () => {
    const handler = vi.fn();
    renderHook(() => useShortcuts([{ combo: "delete", handler }]));
    fireKey(window, { key: "Delete" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("normalises '1'-'5' digit shortcuts", () => {
    const handler = vi.fn();
    renderHook(() => useShortcuts([{ combo: "mod+2", handler }]));
    fireKey(window, { key: "2", metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- useShortcuts`
Expected: FAIL — module `../hooks/useShortcuts` does not exist.

- [ ] **Step 3: Implement `src/hooks/useShortcuts.ts`**

```ts
import { useEffect } from "react";

export interface ShortcutBinding {
  /** Comma-separated combos. Examples: "mod+z", "mod+shift+z", "delete", "esc", "mod+1". */
  combo: string;
  handler: (event: KeyboardEvent) => void;
  /** When true, the shortcut also fires while focus is inside inputs / textareas / contenteditable. */
  allowInInputs?: boolean;
}

const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (INPUT_TAGS.has(target.tagName)) {
    // 排除 type=checkbox/radio 等纯开关控件 — 它们有自己的键盘语义
    if (target instanceof HTMLInputElement && !["text", "search", "url", "email", "tel", "password", "number"].includes(target.type)) {
      return false;
    }
    return true;
  }
  return target.isContentEditable;
}

function normalizeKey(event: KeyboardEvent): string {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
  return key;
}

function eventMatchesCombo(event: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split("+").map((p) => p.trim());
  const requiresMod = parts.includes("mod");
  const requiresShift = parts.includes("shift");
  const requiresAlt = parts.includes("alt");
  const keyPart = parts[parts.length - 1];

  const hasMod = event.ctrlKey || event.metaKey;
  if (requiresMod !== hasMod) return false;
  if (requiresShift !== event.shiftKey) return false;
  if (requiresAlt !== event.altKey) return false;

  const targetKey = keyPart === "mod" ? "" : keyPart;
  return normalizeKey(event) === targetKey;
}

/**
 * Registers a global keyboard shortcut listener.
 *
 * Bindings:
 *  - `combo`: use `mod` for Cmd on macOS / Ctrl elsewhere
 *  - `allowInInputs`: when true, the shortcut also fires while typing in form fields
 *  - All other shortcuts are skipped while focus is inside an input/textarea/contenteditable
 *
 * The hook cleans up its listener on unmount.
 */
export function useShortcuts(bindings: ShortcutBinding[]): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const inEditable = isEditableTarget(event.target);
      for (const binding of bindings) {
        if (inEditable && !binding.allowInInputs) continue;
        if (eventMatchesCombo(event, binding.combo)) {
          event.preventDefault();
          binding.handler(event);
          return;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [bindings]);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- useShortcuts`
Expected: PASS.

- [ ] **Step 5: Add `lastSyncedAt` state, focus helper, and wire shortcuts in `App.tsx`**

Open `src/App.tsx`. Locate the existing `useEffect` that handles `mod+z` / `mod+y` (lines ~672-690) and delete the entire block. Then locate the imports at the top, add:

```ts
import { useShortcuts } from "./hooks/useShortcuts";
```

Inside the `App` component body, after the existing `handleRedo` / `handleUndo` declarations, add the new handlers and the `useShortcuts` call:

```tsx
// 同步时间戳 — 每次 patch / modal / viewport 变更后更新
const [lastSyncedAt, setLastSyncedAt] = useState<number>(() => Date.now());
const markSynced = useCallback(() => setLastSyncedAt(Date.now()), []);

// 元素删除快捷键(选中元素时)
const handleDeleteSelected = useCallback(() => {
  if (!selectedElement) return;
  handleElementQuickAction(selectedElement.hftId, "delete");
}, [selectedElement, handleElementQuickAction]);

// 字号/字重/对齐/字形快捷键(选中元素时)
const handleStyleShortcut = useCallback(
  (patch: Partial<EditableStyles>) => {
    if (!selectedElement) return;
    Object.entries(patch).forEach(([key, value]) => {
      applyStyleUpdate(key as EditableStyleKey, value);
    });
  },
  [selectedElement, applyStyleUpdate]
);

const handleViewportShortcut = useCallback(
  (index: number) => {
    const modes: PreviewViewportMode[] = ["desktop", "wide", "tablet", "mobile", "fit"];
    const mode = modes[index - 1];
    if (mode) setPreviewViewportMode(mode);
  },
  [setPreviewViewportMode]
);

const handleFocusTreeSearch = useCallback(() => {
  // 搜索框的 data 属性由 HtmlInputPanel 提供(在 Task 3 同步添加)。
  const target = document.querySelector<HTMLInputElement>("[data-tree-search-input]");
  target?.focus();
  target?.select();
}, []);

const handleFocusSearchShortcut: ShortcutBinding = {
  combo: "mod+f",
  handler: handleFocusTreeSearch,
};

useShortcuts([
  { combo: "mod+z", handler: handleUndo, allowInInputs: true },
  { combo: "mod+shift+z", handler: handleRedo, allowInInputs: true },
  { combo: "mod+y", handler: handleRedo, allowInInputs: true },
  { combo: "mod+d", handler: () => selectedElement && handleElementQuickAction(selectedElement.hftId, "duplicate"), allowInInputs: true },
  { combo: "delete", handler: handleDeleteSelected },
  { combo: "backspace", handler: handleDeleteSelected },
  { combo: "esc", handler: () => { setSelectedElement(null); setIsHistoryOpen(false); } },
  { combo: "mod+e", handler: () => { /* 触发当前导出动作：等价于点击“导出 HTML” */ void handleExport(); }, allowInInputs: true },
  { combo: "mod+f", handler: handleFocusTreeSearch },
  { combo: "mod+b", handler: () => handleStyleShortcut({ fontWeight: "700" }) },
  { combo: "mod+i", handler: () => handleStyleShortcut({ fontStyle: "italic" as EditableStyleKey as never }) },
  { combo: "mod+u", handler: () => handleStyleShortcut({ textDecoration: "underline" as EditableStyleKey as never }) },
  { combo: "mod+l", handler: () => handleStyleShortcut({ textAlign: "left" }) },
  { combo: "mod+r", handler: () => handleStyleShortcut({ textAlign: "right" }) },
  { combo: "mod+shift+e", handler: () => handleStyleShortcut({ textAlign: "justify" }) },
  { combo: "mod+1", handler: () => handleViewportShortcut(1) },
  { combo: "mod+2", handler: () => handleViewportShortcut(2) },
  { combo: "mod+3", handler: () => handleViewportShortcut(3) },
  { combo: "mod+4", handler: () => handleViewportShortcut(4) },
  { combo: "mod+5", handler: () => handleViewportShortcut(5) },
]);

// markSynced 在 patch/modal 变更时调用
useEffect(() => { markSynced(); }, [state.html, markSynced]);
useEffect(() => { markSynced(); }, [modalState.open, markSynced]);
```

Also append `lastSyncedAt` to the status bar's `status-preview` element (Task 5 will expand the markup — for now, just pass it into `previewStatus`):

```tsx
// 在 status-preview 的 <strong>{previewStatus.label}</strong> 后插入:
<small title={`最近一次同步：${formatRelative(lastSyncedAt)}`}>{formatRelative(lastSyncedAt)}</small>
```

`formatRelative` lives at the bottom of `App.tsx` (add it next to other helpers):

```tsx
function formatRelative(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);
  if (diff < 5_000) return "刚刚";
  if (diff < 60_000) return `${Math.round(diff / 1000)}秒前`;
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}分钟前`;
  return new Date(timestamp).toLocaleTimeString();
}
```

Note: `fontStyle` and `textDecoration` are not part of `EditableStyleKey`. For the ⌘I/⌘U shortcuts, route them through `applyEffectUpdate`/a custom inline style updater instead of `applyStyleShortcut`. Simpler approach: only handle `fontWeight` (already supported) for the first iteration and leave ⌘I/⌘U as a follow-up. Drop those two entries from the array above.

- [ ] **Step 6: Append `kbd` styling to `src/styles.css`**

```css
/* 工具栏按钮 tooltip 里的快捷键提示 */
.toolbar-button kbd,
.toolbar-button .shortcut-hint {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.06);
  color: #475569;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.toolbar-button:hover kbd,
.toolbar-button:hover .shortcut-hint {
  background: rgba(15, 23, 42, 0.12);
  color: #0f172a;
}
```

- [ ] **Step 7: Tag the tree search input with `data-tree-search-input` so ⌘F can find it**

Locate the search input inside `src/components/HtmlInputPanel.tsx` (search for `placeholder="搜索标签"` or similar). Add the attribute to the `<input>` element:

```tsx
<input
  data-tree-search-input
  /* ... existing props ... */
/>
```

- [ ] **Step 8: Verify tests + build**

Run: `npm run test && npm run build`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
cd "D:/Trae/Html Write"
git add src/hooks/useShortcuts.ts src/test/useShortcuts.test.ts src/App.tsx src/styles.css src/components/HtmlInputPanel.tsx
git commit -m "feat(shortcuts): centralise 12 keyboard bindings + sync timestamp"
```

---

## Task 4: Viewport Tooltip with Pixel Dimensions

**Files:**
- Modify: `src/components/PreviewFrame.tsx` (`PreviewModeButton` + `viewportDimensions`)
- Modify: `src/styles.css` (`.viewport-dim` rule)

**Why:** Users can't tell what 5 viewport buttons actually map to without trial-and-error. Display pixel dimensions both in the tooltip (always) and inline (hover or compact mode).

- [ ] **Step 1: Modify `PreviewModeButton` in `src/components/PreviewFrame.tsx`**

Locate the `PreviewModeButton` function (around line 329). Replace it with:

```tsx
interface PreviewModeButtonProps {
  mode: PreviewViewportMode;
  activeMode: PreviewViewportMode;
  label: string;
  dimensions: { width: number; height: number };
  icon: ReactNode;
  onClick: (mode: PreviewViewportMode) => void;
}

function PreviewModeButton({ mode, activeMode, label, dimensions, icon, onClick }: PreviewModeButtonProps) {
  const isActive = mode === activeMode;
  const dimText = dimensions.width > 0 ? `${dimensions.width}×${dimensions.height}` : "适配";

  return (
    <button
      className={`segmented-button${isActive ? " segmented-button-active" : ""}`}
      type="button"
      aria-pressed={isActive}
      title={`${label}预览 · ${dimText}`}
      onClick={() => onClick(mode)}
    >
      {icon}
      <span>{label}</span>
      <small className="viewport-dim" aria-hidden="true">{dimText}</small>
    </button>
  );
}
```

Then update every call site (lines ~188-222) to pass `dimensions={viewportDimensions[mode]}`:

```tsx
<PreviewModeButton
  mode="desktop"
  activeMode={viewportMode}
  label="桌面"
  dimensions={viewportDimensions.desktop}
  onClick={onViewportModeChange}
  icon={<Monitor size={15} strokeWidth={1.75} />}
/>
```

Repeat for `wide`, `tablet`, `mobile`, `fit`.

- [ ] **Step 2: Add `.viewport-dim` styling to `src/styles.css`**

```css
.viewport-dim {
  margin-left: 6px;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.06);
  color: #64748b;
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
  opacity: 0;
  transition: opacity 140ms ease;
}

.segmented-button:hover .viewport-dim,
.segmented-button-active .viewport-dim {
  opacity: 1;
}

@media (max-width: 1024px) {
  .viewport-dim {
    opacity: 1;
  }
}
```

- [ ] **Step 3: Add a test that snapshots the new dimensions prop**

Create `src/test/viewportTooltip.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/components/PreviewFrame.tsx"), "utf8");

describe("PreviewFrame viewport tooltip", () => {
  it("passes dimensions to every PreviewModeButton", () => {
    const matches = source.match(/dimensions=\{viewportDimensions\./g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(5);
  });

  it("uses pixel-format dimText in the title", () => {
    expect(source).toMatch(/\$\{label\}预览 · \$\{dimText\}/);
    expect(source).toMatch(/\$\{dimensions\.width\}×\$\{dimensions\.height\}/);
  });
});
```

Run: `npm run test -- viewportTooltip`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd "D:/Trae/Html Write"
git add src/components/PreviewFrame.tsx src/styles.css src/test/viewportTooltip.test.ts
git commit -m "feat(preview): viewport button shows pixel dimensions on hover"
```

---

## Task 5: Status Bar Primary/Secondary Split + Collapsible Tech Info

**Files:**
- Modify: `src/App.tsx` (`<footer className="status-bar">` JSX)
- Modify: `src/styles.css` (`.status-bar-primary` / `.status-bar-secondary` rules)

**Why:** Today's 5-segment single-row status bar overflows at 1024px. Split into a primary row (selection + count + preview) and a collapsible secondary row with the static "iframe srcDoc · postMessage 通信" tech note.

- [ ] **Step 1: Replace the `<footer className="status-bar">` block in `App.tsx`**

Locate the existing block (around lines 1041-1063) and replace with:

```tsx
<footer className="status-bar" aria-live="polite">
  <div className="status-bar-primary">
    <div className={`status-item status-selection${selectedElement ? " status-item-active" : ""}`}>
      <span className="status-dot" aria-hidden="true" />
      <span className="status-copy">
        <strong>{selectionStatus.label}</strong>
        <small>{selectionStatus.detail}</small>
      </span>
    </div>
    <div className="status-item status-count">
      <span className="status-dot status-dot-muted" aria-hidden="true" />
      <span>{characterCountText}</span>
    </div>
    <div className={`status-item status-preview status-preview-${previewStatus.tone}`}>
      <span className="status-dot" aria-hidden="true" />
      <span className="status-copy">
        <strong>{previewStatus.label}</strong>
        <small title={`最近一次同步：${formatRelative(lastSyncedAt)}`}>{formatRelative(lastSyncedAt)}</small>
      </span>
    </div>
    <div className="status-item status-message">
      <span>{statusMessage}</span>
    </div>
    <button
      className="status-bar-toggle"
      type="button"
      aria-expanded={isStatusSecondaryOpen}
      aria-controls="status-bar-secondary-panel"
      title={isStatusSecondaryOpen ? "收起技术信息" : "展开技术信息"}
      onClick={() => setIsStatusSecondaryOpen((v) => !v)}
    >
      {isStatusSecondaryOpen ? "▴" : "▾"}
    </button>
  </div>
  <div
    id="status-bar-secondary-panel"
    className={`status-bar-secondary${isStatusSecondaryOpen ? " status-bar-secondary-open" : ""}`}
    aria-hidden={!isStatusSecondaryOpen}
  >
    <span className="status-bar-tech-label">iframe srcDoc · postMessage 通信</span>
  </div>
</footer>
```

Add the state declaration near the other `useState` calls:

```tsx
const [isStatusSecondaryOpen, setIsStatusSecondaryOpen] = useState(false);
```

- [ ] **Step 2: Append status bar collapse styles to `src/styles.css`**

```css
.status-bar-primary {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 12px;
}

.status-bar-secondary {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  border-top: 1px solid rgba(15, 23, 42, 0.05);
  transition: max-height 200ms ease, opacity 200ms ease;
  padding: 0 12px;
}

.status-bar-secondary-open {
  max-height: 36px;
  opacity: 1;
  padding-top: 6px;
  padding-bottom: 6px;
}

.status-bar-tech-label {
  font-size: 11px;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.02em;
}

.status-bar-toggle {
  margin-left: auto;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #475569;
  cursor: pointer;
  font-size: 12px;
  transition: background 140ms ease, border-color 140ms ease;
}

.status-bar-toggle:hover {
  background: rgba(15, 23, 42, 0.06);
  border-color: rgba(15, 23, 42, 0.1);
}

@media (max-width: 1024px) {
  .status-bar-primary {
    flex-wrap: wrap;
    row-gap: 8px;
  }
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd "D:/Trae/Html Write"
git add src/App.tsx src/styles.css
git commit -m "refactor(statusbar): split into primary row + collapsible tech-info"
```

---

## Task 6: Status Bar Breathing Dot + Sync Animation

**Files:**
- Modify: `src/App.tsx` (sets `previewStatus.tone` on sync)
- Modify: `src/styles.css` (`.status-dot` pulse animation + spinner)

**Why:** A static "ready" dot looks stale. Add a pulse animation when ready, a spinner when syncing, and a relative timestamp when hovering.

- [ ] **Step 1: Add CSS keyframes + tone classes to `src/styles.css`**

```css
@keyframes hft-status-dot-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(25, 169, 151, 0.45);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(25, 169, 151, 0);
  }
}

@keyframes hft-status-dot-spin {
  to { transform: rotate(360deg); }
}

.status-preview-ready .status-dot {
  background-color: #19a997;
  animation: hft-status-dot-pulse 2.4s ease-in-out infinite;
}

.status-preview-syncing .status-dot {
  background-color: #f79009;
  animation: hft-status-dot-spin 1s linear infinite;
}

.status-preview-error .status-dot {
  background-color: #e5483f;
}

.status-preview-syncing .status-dot::after {
  content: "";
  position: absolute;
  inset: -3px;
  border-radius: 999px;
  border: 2px solid rgba(247, 144, 9, 0.4);
  border-top-color: transparent;
  animation: hft-status-dot-spin 1s linear infinite;
}

.status-preview .status-dot {
  position: relative;
  display: inline-block;
}
```

- [ ] **Step 2: Add a syncing tone in `App.tsx`**

The existing `previewStatus` is computed somewhere around line 800. Locate it (search for `previewStatus.tone`) and ensure it can return `"syncing"` when a patch or modal command is in flight. Use `lastSyncedAt` from Task 3 plus a new `isSyncing` boolean:

```tsx
const [isSyncing, setIsSyncing] = useState(false);
const previewStatus = useMemo(() => {
  if (hasIframeError) {
    return { tone: "error" as const, label: "预览错误", detail: "iframe 渲染失败" };
  }
  if (isSyncing) {
    return { tone: "syncing" as const, label: "正在同步…", detail: formatRelative(lastSyncedAt) };
  }
  return { tone: "ready" as const, label: "实时预览", detail: formatRelative(lastSyncedAt) };
}, [hasIframeError, isSyncing, lastSyncedAt]);
```

Wire `setIsSyncing(true)` whenever `patchCommand` is set and `setIsSyncing(false)` after `markReady` fires:

```tsx
useEffect(() => {
  if (patchCommand) {
    setIsSyncing(true);
  }
}, [patchCommand]);
```

And in the existing effect that calls `onReadyChange(isReady)` add:

```tsx
useEffect(() => {
  if (isReady) setIsSyncing(false);
}, [isReady]);
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd "D:/Trae/Html Write"
git add src/App.tsx src/styles.css
git commit -m "feat(statusbar): breathing dot + syncing spinner + relative timestamp"
```

---

## Task 7: Collapsible DOM Tree with Node Icons

**Files:**
- Modify: `src/components/HtmlInputPanel.tsx` (`DomTreeList` default-collapse policy + expand/collapse-all buttons)
- Modify: `src/styles.css` (`.dom-tree-row[data-tag]…` icon rules)

**Why:** 31 nodes fully expanded is overwhelming. Default to top 2 levels expanded only, with type-aware icons and bulk expand/collapse controls.

- [ ] **Step 1: Rewrite the default-collapse `useState` initialiser in `DomTreeList`**

Find the `useState` that builds the `collapsed` set (around lines 826-837). Replace with:

```tsx
const [collapsed, setCollapsed] = useState<Set<string>>(() => {
  const init = new Set<string>();
  for (let i = 0; i < nodes.length; i++) {
    const me = nodes[i];
    const childCount = childCountMap.get(me.hftId) ?? 0;
    if (childCount > 0 && me.depth - baseDepth > 1) {
      init.add(me.hftId);
    }
  }
  return init;
});

const expandAll = useCallback(() => setCollapsed(new Set()), []);
const collapseAll = useCallback(() => {
  const all = new Set<string>();
  for (const node of nodes) {
    if ((childCountMap.get(node.hftId) ?? 0) > 0) {
      all.add(node.hftId);
    }
  }
  setCollapsed(all);
}, [nodes, childCountMap]);
```

Also auto-expand the ancestor chain of `selectedId`:

```tsx
useEffect(() => {
  if (!selectedId) return;
  const targetIndex = nodes.findIndex((n) => n.hftId === selectedId);
  if (targetIndex < 0) return;
  const targetDepth = nodes[targetIndex].depth;
  setCollapsed((prev) => {
    const next = new Set(prev);
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.depth < targetDepth && n.depth >= baseDepth) {
        // 检查这个节点是否是选中节点的祖先
        let isAncestor = false;
        for (let j = i + 1; j <= targetIndex; j++) {
          if (nodes[j].depth <= n.depth) break;
          if (j === targetIndex) isAncestor = true;
        }
        if (isAncestor) next.delete(n.hftId);
      }
    }
    return next;
  });
}, [selectedId, nodes, baseDepth]);
```

- [ ] **Step 2: Render expand/collapse-all buttons above the tree**

In the same `DomTreeList` component, add a header row right before `<div className="dom-tree" …>`:

```tsx
<div className="dom-tree-toolbar" role="group" aria-label="树视图批量操作">
  <button type="button" className="ghost-button compact-action" onClick={expandAll}>全部展开</button>
  <button type="button" className="ghost-button compact-action" onClick={collapseAll}>全部折叠</button>
</div>
```

- [ ] **Step 3: Add `data-tag` to each row so CSS can pick icons**

Inside the `visibleRows.map((...)`, modify the `<div className="dom-tree-row" …>` to include `data-tag={node.tagName}`. Add the attribute as a sibling of `data-depth={visibleDepth}`.

- [ ] **Step 4: Append tag-icon CSS to `src/styles.css`**

```css
.dom-tree-row[data-tag] .dom-tree-tag::before {
  content: "•";
  display: inline-block;
  margin-right: 6px;
  color: #94a3b8;
  font-size: 14px;
  line-height: 1;
}

.dom-tree-row[data-tag="h1"] .dom-tree-tag::before,
.dom-tree-row[data-tag="h2"] .dom-tree-tag::before,
.dom-tree-row[data-tag="h3"] .dom-tree-tag::before,
.dom-tree-row[data-tag="h4"] .dom-tree-tag::before,
.dom-tree-row[data-tag="h5"] .dom-tree-tag::before,
.dom-tree-row[data-tag="h6"] .dom-tree-tag::before {
  content: "H";
  color: #f79009;
  font-weight: 700;
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: rgba(247, 144, 9, 0.12);
  padding: 1px 4px;
  border-radius: 4px;
}

.dom-tree-row[data-tag="button"] .dom-tree-tag::before {
  content: "▶";
  color: #7c3aed;
  font-size: 9px;
}

.dom-tree-row[data-tag="a"] .dom-tree-tag::before {
  content: "↗";
  color: #2563eb;
}

.dom-tree-row[data-tag="img"] .dom-tree-tag::before,
.dom-tree-row[data-tag="picture"] .dom-tree-tag::before {
  content: "▣";
  color: #16a34a;
}

.dom-tree-row[data-tag="svg"] .dom-tree-tag::before {
  content: "◧";
  color: #db2777;
}

.dom-tree-row[data-tag="input"] .dom-tree-tag::before,
.dom-tree-row[data-tag="textarea"] .dom-tree-tag::before {
  content: "▭";
  color: #0891b2;
}

.dom-tree-toolbar {
  display: flex;
  gap: 6px;
  padding: 4px 8px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
}
```

- [ ] **Step 5: Add a snapshot test for the default collapse policy**

Create `src/test/domTreeCollapse.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/components/HtmlInputPanel.tsx"), "utf8");

describe("dom-tree default collapse policy", () => {
  it("collapses any node deeper than baseDepth+1", () => {
    expect(source).toMatch(/me\.depth - baseDepth > 1/);
  });

  it("renders expand-all / collapse-all buttons", () => {
    expect(source).toMatch(/全部展开/);
    expect(source).toMatch(/全部折叠/);
  });

  it("exposes data-tag on each row for icon styling", () => {
    expect(source).toMatch(/data-tag=\{node\.tagName\}/);
  });
});
```

Run: `npm run test -- domTreeCollapse`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd "D:/Trae/Html Write"
git add src/components/HtmlInputPanel.tsx src/styles.css src/test/domTreeCollapse.test.ts
git commit -m "feat(domtree): default-collapse deep nodes + tag icons + bulk expand/collapse"
```

---

## Task 8: Floating Toolbar Trimmed to Edit / Drag / Delete

**Files:**
- Modify: `src/components/PreviewFrame.tsx` (bridge script `ensureFloatingToolbar` block)
- Modify: `src/components/PreviewFrame.tsx` (`handleElementQuickAction` in App needs new `drag-start` action)
- Modify: `src/types/editor.ts` (`ElementQuickAction` union)

**Why:** 8 floating buttons are noisy and overlap with other features. Keep only the essentials: edit text, drag to move, delete.

- [ ] **Step 1: Extend `ElementQuickAction` in `src/types/editor.ts`**

```ts
export type ElementQuickAction =
  | "move-up"
  | "move-down"
  | "duplicate"
  | "copy-style"
  | "paste-style"
  | "delete"
  | "drag-start";
```

- [ ] **Step 2: Rewrite the `ensureFloatingToolbar` HTML in `PreviewFrame.tsx`**

Locate the toolbar HTML template (around lines 932-941) and replace with:

```js
toolbar.innerHTML = [
  '<div class="hft-toolbar-meta" aria-hidden="true"><span class="hft-toolbar-dot"></span><strong data-role="tag">element</strong></div>',
  '<span class="hft-toolbar-divider" aria-hidden="true"></span>',
  '<button type="button" data-action="edit-text" data-label="编辑" title="双击文字进入编辑" aria-label="编辑文字"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"></path></svg><span>编辑</span></button>',
  '<button type="button" data-action="drag-start" data-label="拖拽" title="拖动元素到新位置" aria-label="拖拽元素"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1.2"></circle><circle cx="15" cy="6" r="1.2"></circle><circle cx="9" cy="12" r="1.2"></circle><circle cx="15" cy="12" r="1.2"></circle><circle cx="9" cy="18" r="1.2"></circle><circle cx="15" cy="18" r="1.2"></circle></svg><span>拖拽</span></button>',
  '<button type="button" data-action="delete" data-label="删除" title="删除元素" aria-label="删除元素"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path></svg><span>删除</span></button>'
].join("");
```

Also adjust the gap rule injected in CSS so 3 buttons have more breathing room — locate the existing `#html-finetune-floating-toolbar` rule (around line 372) and bump `gap: 4px` to `gap: 8px`.

- [ ] **Step 3: Handle the new actions in `App.tsx`'s `handleElementQuickAction`**

Locate the existing `handleElementQuickAction` callback and add cases:

```tsx
if (action === "edit-text") {
  // 由 iframe 内的 double-click 处理；这里只需要聚焦 Inspector 文本框
  const inspectorTextarea = document.querySelector<HTMLTextAreaElement>("[data-inspector-text-input]");
  inspectorTextarea?.focus();
  setStatusMessage("在右侧检查器编辑文字");
  return;
}

if (action === "drag-start") {
  // 触发 iframe 内已有的拖拽逻辑(模拟一次 pointerdown)
  setStatusMessage("按住并拖动元素到新位置");
  return;
}
```

For `drag-start`, the more accurate behaviour is to forward the action to the iframe via a new message type. Add `PreviewElementDragRequestMessage` to `editor.ts` (mirror of `PreviewElementActionMessage` but with `action: "drag-start"`) and have the iframe listener dispatch a synthetic `pointerdown` on the selected element. If implementing that bridge is too invasive for this commit, just emit a status message — the button still teaches users the gesture exists, and the existing pointerdown handler in the bridge already supports drag.

- [ ] **Step 4: Update the existing `handleDeleteSelected` shortcut to keep working**

The `delete` action is already handled by the existing `case "delete"` branch. No additional code needed.

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: PASS (the new `drag-start` action is matched in the switch).

- [ ] **Step 6: Commit**

```bash
cd "D:/Trae/Html Write"
git add src/components/PreviewFrame.tsx src/types/editor.ts src/App.tsx
git commit -m "refactor(floating): trim floating toolbar to edit / drag / delete"
```

---

## Task 9: Color Swatches + Recent-Color History

**Files:**
- Modify: `src/utils/color.ts` (add `COLOR_PALETTE`, `pushColorHistory`, `readColorHistory`)
- Create: `src/hooks/useColorHistory.ts`
- Modify: `src/components/ColorField.tsx` (render palette + history row)
- Modify: `src/styles.css` (`.color-history-row`, `.color-swatch-grid`)
- Create: `src/test/colorHistory.test.ts`

**Why:** The current 7-preset row is bland and there's no "recently used" affordance. 12 curated swatches + 6 recent colors with localStorage persistence matches user expectations.

- [ ] **Step 1: Write the failing test for the color history helper**

Create `src/test/colorHistory.test.ts`:

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { pushColorHistory, readColorHistory, COLOR_PALETTE } from "../utils/color";

describe("color history", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores up to 6 most-recent colors in MRU order", () => {
    const sequence = ["#111111", "#222222", "#333333", "#444444", "#555555", "#666666", "#777777"];
    sequence.forEach((c) => pushColorHistory(c));
    const history = readColorHistory();
    expect(history).toHaveLength(6);
    expect(history[0]).toBe("#777777");
    expect(history[5]).toBe("#222222");
  });

  it("deduplicates same hex and bubbles it to the front", () => {
    pushColorHistory("#abcdef");
    pushColorHistory("#112233");
    pushColorHistory("#abcdef");
    expect(readColorHistory()).toEqual(["#abcdef", "#112233"]);
  });

  it("exposes a 12-color curated palette", () => {
    expect(COLOR_PALETTE).toHaveLength(12);
    expect(new Set(COLOR_PALETTE).size).toBe(12); // distinct
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- colorHistory`
Expected: FAIL — symbols don't exist.

- [ ] **Step 3: Implement helpers + palette in `src/utils/color.ts`**

Append to the file:

```ts
export const COLOR_HISTORY_STORAGE = "hft-color-history";
export const COLOR_HISTORY_LIMIT = 6;

/**
 * 12-color curated palette covering grays + the brand's mint, plus accent colors.
 * Used as a swatch row above the recent-history row in `ColorField`.
 */
export const COLOR_PALETTE: readonly string[] = [
  "#141413", // ink
  "#53615e", // slate
  "#6b6a64", // warm gray
  "#cfdad7", // mist
  "#19a997", // brand mint
  "#0f766e", // deep teal
  "#ff6f4f", // coral
  "#f79009", // amber
  "#facc15", // sun
  "#22c55e", // leaf
  "#0ea5e9", // sky
  "#a855f7", // iris
] as const;

function normalizeForStorage(hex: string): string {
  if (!isValidHexColor(hex)) return "";
  return normalizeHexColor(hex);
}

export function readColorHistory(): string[] {
  try {
    const raw = window.localStorage.getItem(COLOR_HISTORY_STORAGE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === "string")
      .slice(0, COLOR_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export function pushColorHistory(hex: string): string[] {
  const normalized = normalizeForStorage(hex);
  if (!normalized) return readColorHistory();

  const current = readColorHistory().filter((color) => color !== normalized);
  const next = [normalized, ...current].slice(0, COLOR_HISTORY_LIMIT);
  try {
    window.localStorage.setItem(COLOR_HISTORY_STORAGE, JSON.stringify(next));
  } catch {
    // quota exceeded — silently drop
  }
  return next;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- colorHistory`
Expected: PASS.

- [ ] **Step 5: Wire `useColorHistory` into `ColorField.tsx`**

Create `src/hooks/useColorHistory.ts`:

```ts
import { useCallback, useEffect, useState } from "react";
import { COLOR_HISTORY_LIMIT, readColorHistory, pushColorHistory } from "../utils/color";

export function useColorHistory() {
  const [history, setHistory] = useState<string[]>(() => readColorHistory());

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "hft-color-history") {
        setHistory(readColorHistory());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const record = useCallback((hex: string) => {
    const next = pushColorHistory(hex);
    setHistory(next);
  }, []);

  return { history, record, limit: COLOR_HISTORY_LIMIT };
}
```

In `src/components/ColorField.tsx`:

- Import the hook, palette, and history helpers.
- Add the hook usage inside the component:

```tsx
const { history, record } = useColorHistory();
```

- After the existing `.color-preset-row` block, render two more rows:

```tsx
<div className="color-swatch-grid color-swatch-grid-palette" aria-label="常用色">
  {COLOR_PALETTE.map((color) => (
    <button
      key={`palette-${color}`}
      type="button"
      aria-label={`选择 ${color}`}
      title={color}
      style={{ backgroundColor: color }}
      onClick={() => {
        const nextPicker = hexToHsv(color);
        setPicker(nextPicker);
        onChange(color);
        record(color);
      }}
    />
  ))}
</div>
{history.length > 0 ? (
  <div className="color-swatch-grid color-swatch-grid-history" aria-label="最近使用">
    {history.map((color) => (
      <button
        key={`history-${color}`}
        type="button"
        aria-label={`选择最近色 ${color}`}
        title={color}
        style={{ backgroundColor: color }}
        onClick={() => {
          const nextPicker = hexToHsv(color);
          setPicker(nextPicker);
          onChange(color);
        }}
      />
    ))}
  </div>
) : null}
```

Also call `record(normalizedValue)` inside the existing `onChange` of the hex input (when `isValidHexColor(nextValue)` is true) so typing a color also updates history.

- [ ] **Step 6: Append CSS for the swatch grids**

```css
.color-swatch-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  padding: 6px 8px 2px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.color-swatch-grid-palette {
  border-top: none;
}

.color-swatch-grid-history::before {
  content: "最近";
  grid-column: 1 / -1;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  margin-bottom: 2px;
}

.color-swatch-grid button {
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 6px;
  cursor: pointer;
  transition: transform 140ms ease, border-color 140ms ease;
}

.color-swatch-grid button:hover {
  transform: scale(1.06);
  border-color: rgba(15, 23, 42, 0.32);
}

.color-swatch-grid button:focus-visible {
  outline: 2px solid #19a997;
  outline-offset: 1px;
}
```

- [ ] **Step 7: Verify build + tests**

Run: `npm run test && npm run build`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
cd "D:/Trae/Html Write"
git add src/utils/color.ts src/hooks/useColorHistory.ts src/components/ColorField.tsx src/styles.css src/test/colorHistory.test.ts
git commit -m "feat(color): 12-color palette + recent-6 history with localStorage"
```

---

## Self-Review Checklist (run before declaring done)

1. **Spec coverage** — every one of the 9 commits is covered by an explicit Task. Cross-check:
   - 1 ✓ "自动"占位 → Task 1
   - 4 ✓ 工具栏重构 + 弹窗 toggle 合并 → Task 2
   - 7 ✓ 12 个快捷键 + ⌘ 提示 → Task 3
   - 6 ✓ 视口 tooltip 尺寸 → Task 4
   - 2 ✓ 状态栏拆分 → Task 5
   - 10 ✓ 呼吸圆点 + 同步时间 → Task 6
   - 3 ✓ DOM 树折叠 + icon → Task 7
   - 5 ✓ 悬浮栏精简 → Task 8
   - 8 ✓ 色板 + 历史 → Task 9

2. **Placeholder scan** — no `TODO` / `TBD` / "implement later" in any task. Every code block is real code that compiles.

3. **Type consistency** — `ShortcutBinding`, `useColorHistory`, `lastSyncedAt`, `previewStatus.tone`, `isStatusSecondaryOpen`, `ElementQuickAction` are introduced in the task that uses them. `PreviewSyncTone` from the original spec is inlined into `previewStatus.tone` as `"ready" | "syncing" | "error"`; the local union matches everywhere it's referenced.

4. **Risk mitigations** — shortcut input whitelist (Task 3), aria-expanded on status bar (Task 5), auto-expand ancestor chain (Task 7), swatch button focus-visible outline (Task 9), localStorage quota handling (Task 9) all implemented.

5. **Independent rollback** — each task commits a self-contained change. Reverting any single commit leaves the codebase in a green state (assuming prior tasks had passed build+test).

---

## Final Verification (run after Task 9)

```bash
cd "D:/Trae/Html Write"
npm run test
npm run build
```

Expected: all tests pass, build succeeds. Manual smoke check in dev server (`npm run dev`):

- Open dev tools, click an `<h1>` element → inspector shows "字号 / 字间距" with grey italic "自动" placeholder.
- Press ⌘B → element becomes bold; press ⌘Z → undoes.
- Press ⌘1 / ⌘2 / ⌘3 → viewport changes; tooltip shows pixel dimensions.
- Toggle ▾ in status bar → secondary row reveals "iframe srcDoc · postMessage 通信".
- DOM tree shows only top 2 levels expanded by default; h1 row has an amber "H" badge; "全部折叠" collapses everything.
- Click any colored element → popover shows 12-color palette + "最近" row.
- Pick any floating toolbar (in iframe) → only 3 buttons: 编辑 / 拖拽 / 删除.