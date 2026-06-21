# Canvas 工具栏重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Canvas toolbar in `PreviewFrame.tsx` to replace the 5 redundant viewport preset buttons (桌面/宽屏/平板/手机/适配) with a single compact viewport size editor (two `<input type="number">` + a preset `CustomSelect` dropdown + a 适配 button). Shrink toolbar width from ~830px to ≤600px, restore UI consistency with the rest of the editor (图标+文字 buttons, no pure-icon or pure-text readout), and preserve `mod+1..5` shortcuts and the `PreviewViewportMode` type.

**Architecture:** Pure UI refactor + one new App-level state slice. `PreviewFrame.tsx` stops owning viewport dimensions and accepts `viewportWidth / viewportHeight` + 2 callbacks as props. `App.tsx` owns a `viewportSize` state and synchronizes it with `previewViewportMode` (mode drives CSS class on the iframe shell; size drives the actual width/height). The 5-button segmented control is replaced by a `.viewport-editor` group: `当前:` label, two `type="number"` inputs, a `CustomSelect` preset dropdown (using a new `placeholder` prop on the component), and a 适配 toggle button. Existing `viewportDimensions` constant is moved to `App.tsx` so both the editor and the dropdown can reference the same source of truth. `viewport-dim` CSS, `PreviewModeButton` component, and `canvas-size-control` container are deleted. Two new tests + one deletion + one existing shortcut test stays untouched (semantics unchanged).

**Tech Stack:** React 19, TypeScript 5.8, Vitest 4 + @testing-library/react + jsdom, Vite 8, lucide-react (icons stay), CSS (no Tailwind).

---

## Conventions for All Tasks

- One commit per task. Conventional Commits: `feat(scope):` / `refactor(scope):` / `test:` / `chore:`.
- After each task run `npm run test` (must pass) and `npm run build` (must pass) before committing.
- Inside code blocks use forward slashes for paths (Windows-safe).
- Existing `PreviewViewportMode` type is NOT modified — it stays `"desktop" | "wide" | "tablet" | "mobile" | "fit"`.
- Existing `mod+1..5` keyboard shortcuts keep their semantics but now also sync `viewportSize`.

---

## Task 1: Extend `CustomSelect` with `placeholder` prop

**Files:**
- Modify: `src/components/CustomSelect.tsx:1-26, 117-119`
- Modify: `src/components/CustomSelect.tsx` (add `placeholder` to prop interface + use it when no match)

**Why:** When the editor's W×H doesn't match any preset, the dropdown needs to show a neutral "预设" placeholder instead of the empty `value`. Today `CustomSelect` has no such escape hatch — it falls back to the raw `value` string.

- [ ] **Step 1: Write the failing test**

Create `src/test/customSelectPlaceholder.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/components/CustomSelect.tsx"), "utf8");

describe("CustomSelect placeholder prop", () => {
  it("declares an optional placeholder prop in the interface", () => {
    expect(source).toMatch(/placeholder\?:\s*string/);
  });

  it("uses placeholder as fallback when selectedLabel is empty", () => {
    // Either via `selectedLabel || placeholder` or via a conditional render
    expect(source).toMatch(/placeholder/);
    expect(source).not.toMatch(/selectedLabel = selectedIndex >= 0 \? options\[selectedIndex\]\.label : value;/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- customSelectPlaceholder`
Expected: FAIL — at least one of the regexes does not match.

- [ ] **Step 3: Modify `CustomSelect.tsx`**

Edit `src/components/CustomSelect.tsx`:

1. Add `placeholder?: string` to the interface:

```ts
interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  /** Optional custom matcher if value stored differs from option.value */
  matchValue?: (option: CustomSelectOption, currentValue: string) => boolean;
  /** Optional placeholder shown when no option matches. Defaults to "". */
  placeholder?: string;
}
```

2. Update the component signature to destructure `placeholder = ""`:

```ts
export function CustomSelect({ value, options, onChange, matchValue, placeholder = "" }: CustomSelectProps) {
```

3. Replace the `selectedLabel` line at `CustomSelect.tsx:23-26` with:

```ts
const selectedIndex = options.findIndex((opt) =>
  matchValue ? matchValue(opt, value) : opt.value === value
);
const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : placeholder;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- customSelectPlaceholder`
Expected: PASS (3 tests).

- [ ] **Step 5: Run full test suite + build**

Run: `npm run test`
Expected: All existing tests pass (we changed default behavior for an unset value — but all current call sites pass `value` matching an option, so they remain unchanged).

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/CustomSelect.tsx src/test/customSelectPlaceholder.test.ts
git commit -m "feat(CustomSelect): add optional placeholder prop for unmatched values"
```

---

## Task 2: Move `viewportDimensions` constant + `isPresetMatch` helper to a shared location

**Files:**
- Create: `src/utils/viewportPresets.ts`
- Modify: `src/components/PreviewFrame.tsx:318-324` (delete local constant)

**Why:** Both `App.tsx` (to sync `viewportSize` when a preset is selected) and the preset dropdown (to derive `presetKey` and to render option labels) need the preset dimensions and the matching predicate. Currently `viewportDimensions` is a private const inside `PreviewFrame.tsx`.

- [ ] **Step 1: Write the failing test**

Create `src/test/viewportPresets.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isPresetMatch, VIEWPORT_PRESETS, type ViewportPresetKey } from "../utils/viewportPresets";

describe("viewportPresets", () => {
  it("exposes exactly 4 named presets (desktop, wide, tablet, mobile)", () => {
    const keys = Object.keys(VIEWPORT_PRESETS);
    expect(keys.sort()).toEqual(["desktop", "mobile", "tablet", "wide"]);
  });

  it("isPresetMatch returns true when both width and height match the preset", () => {
    expect(isPresetMatch("desktop", 1280, 800)).toBe(true);
    expect(isPresetMatch("wide", 1440, 900)).toBe(true);
    expect(isPresetMatch("tablet", 820, 1180)).toBe(true);
    expect(isPresetMatch("mobile", 390, 844)).toBe(true);
  });

  it("isPresetMatch returns false on any width or height mismatch", () => {
    expect(isPresetMatch("desktop", 1281, 800)).toBe(false);
    expect(isPresetMatch("desktop", 1280, 801)).toBe(false);
    expect(isPresetMatch("desktop", 0, 0)).toBe(false);
  });

  it("VIEWPORT_PRESETS labels include the pixel dimensions", () => {
    expect(VIEWPORT_PRESETS.desktop.label).toContain("1280");
    expect(VIEWPORT_PRESETS.desktop.label).toContain("800");
    expect(VIEWPORT_PRESETS.wide.label).toContain("1440");
    expect(VIEWPORT_PRESETS.wide.label).toContain("900");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- viewportPresets`
Expected: FAIL with "Cannot find module '../utils/viewportPresets'" or similar.

- [ ] **Step 3: Create `src/utils/viewportPresets.ts`**

```ts
import type { PreviewViewportMode } from "../types/editor";

export type ViewportPresetKey = Exclude<PreviewViewportMode, "fit">;

export interface ViewportPreset {
  width: number;
  height: number;
  /** Localized label shown in the preset dropdown, e.g. "桌面 1280×800". */
  label: string;
}

export const VIEWPORT_PRESETS: Record<ViewportPresetKey, ViewportPreset> = {
  desktop: { width: 1280, height: 800,  label: "桌面 1280×800" },
  wide:    { width: 1440, height: 900,  label: "宽屏 1440×900" },
  tablet:  { width: 820,  height: 1180, label: "平板 820×1180" },
  mobile:  { width: 390,  height: 844,  label: "手机 390×844" },
};

export const VIEWPORT_PRESET_KEYS: ViewportPresetKey[] = ["desktop", "wide", "tablet", "mobile"];

export function isPresetMatch(key: ViewportPresetKey, width: number, height: number): boolean {
  const preset = VIEWPORT_PRESETS[key];
  return preset.width === width && preset.height === height;
}

/**
 * Returns the preset key whose dimensions match (width, height), or null if none match.
 * Use this to derive `presetKey` for the CustomSelect in the editor.
 */
export function findMatchingPresetKey(width: number, height: number): ViewportPresetKey | null {
  for (const key of VIEWPORT_PRESET_KEYS) {
    if (isPresetMatch(key, width, height)) return key;
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- viewportPresets`
Expected: PASS (4 tests).

- [ ] **Step 5: Delete the local `viewportDimensions` constant from `PreviewFrame.tsx`**

In `src/components/PreviewFrame.tsx`, **delete** lines 318–324 (the `const viewportDimensions: Record<PreviewViewportMode, { width: number; height: number }> = { ... }` block).

**Note:** This will currently break the file because the rest of the component still references `viewportDimensions`. We will fix all references in Task 3. For now, do NOT run the build — proceed directly to Task 3.

- [ ] **Step 6: Commit (tests + new util only)**

```bash
git add src/utils/viewportPresets.ts src/test/viewportPresets.test.ts
git commit -m "feat(utils): extract VIEWPORT_PRESETS + isPresetMatch into shared util"
```

(Note: `PreviewFrame.tsx` change is unstaged — it will be committed together with Task 3 which restores the file to a working state.)

---

## Task 3: Refactor `PreviewFrame.tsx` — new props, new JSX, drop obsolete code

**Files:**
- Modify: `src/components/PreviewFrame.tsx` (entire component)
- Modify: `src/components/PreviewFrame.tsx:178-313` (replace `panel-header` JSX with viewport editor)
- Modify: `src/components/PreviewFrame.tsx:24-40` (update `PreviewFrameProps` interface)
- Modify: `src/components/PreviewFrame.tsx:42-313` (replace `viewportSize`/`adaptiveViewport` calculations)
- Delete: `src/components/PreviewFrame.tsx:326-352` (`PreviewModeButton`)

**Why:** The component no longer owns the preset buttons, the dim labels, the lock-icon readout, or the standalone 适应 button. It receives width/height/callbacks as props and renders the new compact editor.

- [ ] **Step 1: Update the `PreviewFrameProps` interface (replace lines 24–40)**

Replace the existing `interface PreviewFrameProps` with:

```ts
interface PreviewFrameProps {
  html: string;
  selectedId: string | null;
  reloadNonce: number;
  patchCommand: PatchCommand | null;
  modalCommand: ModalCommand | null;
  selectCommand: SelectElementCommand | null;
  viewportMode: PreviewViewportMode;
  viewportWidth: number;
  viewportHeight: number;
  isFocusPreview: boolean;
  onViewportSizeChange: (width: number, height: number) => void;
  onViewportPresetSelect: (mode: Exclude<PreviewViewportMode, "fit">) => void;
  onFitToggle: () => void;
  onToggleFocusPreview: () => void;
  onElementSelected: (element: SelectedElementSnapshot) => void;
  onModalStateChange: (state: ModalState) => void;
  onElementAction: (hftId: string, action: ElementQuickAction) => void;
  onElementDragged: (hftId: string, position: string, top: string, left: string) => void;
  onReadyChange: (isReady: boolean) => void;
}
```

- [ ] **Step 2: Update the component signature (replace lines 42–58)**

Replace the function signature + first destructuring:

```ts
function PreviewFrameComponent({
  html,
  selectedId,
  reloadNonce,
  patchCommand,
  modalCommand,
  selectCommand,
  viewportMode,
  viewportWidth,
  viewportHeight,
  isFocusPreview,
  onViewportSizeChange,
  onViewportPresetSelect,
  onFitToggle,
  onToggleFocusPreview,
  onElementSelected,
  onModalStateChange,
  onElementAction,
  onElementDragged,
  onReadyChange,
}: PreviewFrameProps) {
```

- [ ] **Step 3: Replace the viewport-size computation (replace lines 74–115)**

Replace from `const viewportSize = viewportDimensions[viewportMode];` through the end of the `displayZoom` const:

```ts
const isFit = viewportMode === "fit";
const [zoom, setZoom] = useState(1);
const [autoFit, setAutoFit] = useState(true);

// 在 fit 模式下使用自适应尺寸；否则使用编辑器传入的尺寸
const effectiveWidth = isFit && contentDimensions ? Math.round(contentDimensions.contentWidth) : viewportWidth;
const effectiveHeight = isFit && contentDimensions ? Math.round(contentDimensions.contentHeight) : viewportHeight;

const readoutViewport = {
  width: effectiveWidth,
  height: effectiveHeight,
};

const displayZoom = autoFit ? 1 : zoom;
```

Also remove the now-unused `adaptiveViewport` `useMemo` block (lines 85–105). The `viewportSize` const is replaced by direct use of `viewportWidth` / `viewportHeight` below in step 5.

- [ ] **Step 4: Replace the `panel-header` JSX (replace lines 180–285)**

Replace the entire `<div className="panel-header">…</div>` block with:

```tsx
      <div className="panel-header">
        <div className="panel-title">
          <Eye size={18} strokeWidth={1.75} />
          <span>Canvas</span>
        </div>
        <div className="preview-header-actions">
          <div className="viewport-editor" aria-label="视口尺寸">
            <span className="viewport-editor-label">当前</span>
            <input
              className="viewport-size-input"
              type="number"
              inputMode="numeric"
              min={120}
              max={3840}
              step={10}
              value={effectiveWidth}
              disabled={isFit}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isFinite(next)) onViewportSizeChange(next, effectiveHeight);
              }}
              aria-label="视口宽度"
              title={isFit ? "适配模式下尺寸由内容决定" : "视口宽度"}
            />
            <span className="viewport-editor-times" aria-hidden="true">×</span>
            <input
              className="viewport-size-input"
              type="number"
              inputMode="numeric"
              min={80}
              max={2160}
              step={10}
              value={effectiveHeight}
              disabled={isFit}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isFinite(next)) onViewportSizeChange(effectiveWidth, next);
              }}
              aria-label="视口高度"
              title={isFit ? "适配模式下尺寸由内容决定" : "视口高度"}
            />
            <CustomSelect
              value={presetKey ?? ""}
              options={[
                { value: "desktop", label: VIEWPORT_PRESETS.desktop.label },
                { value: "wide",    label: VIEWPORT_PRESETS.wide.label },
                { value: "tablet",  label: VIEWPORT_PRESETS.tablet.label },
                { value: "mobile",  label: VIEWPORT_PRESETS.mobile.label },
              ]}
              onChange={(value) =>
                onViewportPresetSelect(value as Exclude<PreviewViewportMode, "fit">)
              }
              matchValue={(opt) => opt.value === presetKey}
              placeholder="预设"
            />
            <button
              className={`ghost-button compact-action viewport-fit-btn${isFit ? " viewport-fit-btn-active" : ""}`}
              type="button"
              onClick={onFitToggle}
              title={isFit ? "退出适配，使用自定义尺寸" : "按内容尺寸自适应"}
            >
              <Shrink size={14} strokeWidth={1.75} />
              <span>适配</span>
            </button>
          </div>
          <div className="zoom-control-cluster" aria-label="缩放控制">
            <button
              className="ghost-button compact-action zoom-btn"
              type="button"
              onClick={handleZoomOut}
              disabled={displayZoom <= 0.25}
              title="缩小"
            >
              <ZoomOut size={14} strokeWidth={1.75} />
            </button>
            <button
              className="zoom-pill-button"
              type="button"
              onClick={handleZoomReset}
              title="重置为 100%"
            >
              {autoFit ? "适应" : `${Math.round(displayZoom * 100)}%`}
            </button>
            <button
              className="ghost-button compact-action zoom-btn"
              type="button"
              onClick={handleZoomIn}
              disabled={displayZoom >= 2}
              title="放大"
            >
              <ZoomIn size={14} strokeWidth={1.75} />
            </button>
          </div>
          <button
            className="ghost-button compact-action preview-focus-button"
            type="button"
            onClick={onToggleFocusPreview}
            title={isFocusPreview ? "恢复三栏编辑器" : "隐藏编辑器，全屏预览"}
          >
            {isFocusPreview ? <Minimize2 size={15} strokeWidth={1.75} /> : <Maximize2 size={15} strokeWidth={1.75} />}
            <span>{isFocusPreview ? "恢复" : "全屏"}</span>
          </button>
        </div>
      </div>
```

- [ ] **Step 5: Add `presetKey` derivation in component body**

Inside `PreviewFrameComponent`, after the `useState` calls and before the `useEffect` for `markRendering`, add:

```ts
import { findMatchingPresetKey, VIEWPORT_PRESETS } from "../utils/viewportPresets";
import { CustomSelect } from "./CustomSelect";
```

(Add these to the existing top-of-file import block — do not duplicate the `import { ... } from "lucide-react"` line.)

Then inside the function body, after `const displayZoom = autoFit ? 1 : zoom;`:

```ts
const presetKey = useMemo(
  () => findMatchingPresetKey(viewportWidth, viewportHeight),
  [viewportWidth, viewportHeight]
);
```

- [ ] **Step 6: Update the iframe shell — replace `viewportSize` references**

The iframe shell currently uses `viewportSize.width` and `viewportSize.height`. Replace those with `effectiveWidth` / `effectiveHeight`:

```tsx
      <div className={`iframe-shell iframe-shell-${viewportMode}`}>
        <div
          className={`preview-viewport preview-viewport-${viewportMode}`}
          style={{
            "--preview-zoom": displayZoom,
            width: `${effectiveWidth}px`,
            height: `${effectiveHeight}px`,
          } as React.CSSProperties}
        >
```

(We replace the `width: "100%", height: "100%"` fit-mode style with explicit pixel values driven by `effectiveWidth/Height` — `contentDimensions` flows through these in fit mode.)

Note: This means `.preview-viewport-desktop / .preview-viewport-wide / etc.` CSS classes that hardcode `var(--adaptive-width, 1280px)` etc. will need a follow-up in Task 5 (CSS). For now, inline pixel width/height takes precedence.

- [ ] **Step 7: Delete the `PreviewModeButton` component**

Delete the entire block from `function PreviewModeButton(...)` (line 326) through the closing brace at line 352.

- [ ] **Step 8: Add `useMemo` to React imports if not already present**

Check the top of `PreviewFrame.tsx`. The first line should be:

```ts
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
```

If `useMemo` is missing, add it.

- [ ] **Step 9: Run full test suite**

Run: `npm run test`
Expected: Some existing tests may fail because `PreviewFrame` props changed. We'll fix those in Task 4 (update `App.tsx` to pass new props).

If a `tsc` compile error appears about missing `viewportDimensions`, that's expected — proceed.

- [ ] **Step 10: Run build (allow it to fail on App.tsx)**

Run: `npm run build`
Expected: Build fails on `App.tsx` because `PreviewFrame` props changed. We'll fix in Task 4.

- [ ] **Step 11: Commit**

```bash
git add src/components/PreviewFrame.tsx
git commit -m "refactor(PreviewFrame): replace 5 preset buttons + readout with viewport-editor"
```

---

## Task 4: Wire new state + props in `App.tsx`

**Files:**
- Modify: `src/App.tsx:133` (add `viewportSize` state)
- Modify: `src/App.tsx:766-770` (`mod+1..5` shortcut handlers must also sync `viewportSize`)
- Modify: `src/App.tsx:1090-1110` (pass new props to `PreviewFrame`)

**Why:** `App.tsx` must own `viewportSize` and propagate width/height/callbacks to `PreviewFrame`. The 5 shortcuts must remain functional.

- [ ] **Step 1: Add `viewportSize` state**

Right after the existing `useState` for `previewViewportMode` (around `App.tsx:133`), add:

```ts
const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
  width: 1280,
  height: 800,
});
```

- [ ] **Step 2: Add callback handlers**

Right after the new state, add:

```ts
const handleViewportSizeChange = useCallback((width: number, height: number) => {
  setViewportSize({ width, height });
}, []);

const handleViewportPresetSelect = useCallback(
  (mode: Exclude<PreviewViewportMode, "fit">) => {
    setPreviewViewportMode(mode);
    setViewportSize({
      width: VIEWPORT_PRESETS[mode].width,
      height: VIEWPORT_PRESETS[mode].height,
    });
  },
  []
);

const handleFitToggle = useCallback(() => {
  setPreviewViewportMode((prev) => (prev === "fit" ? "desktop" : "fit"));
}, []);
```

Add `VIEWPORT_PRESETS` to the import block at the top:

```ts
import { VIEWPORT_PRESETS } from "./utils/viewportPresets";
```

(merge into existing import lines)

- [ ] **Step 3: Update `mod+1..5` shortcut handlers**

Replace the block at `App.tsx:766-770`:

```ts
{ combo: "mod+1", handler: () => { setPreviewViewportMode("desktop"); setViewportSize({ width: 1280, height: 800 }); } },
{ combo: "mod+2", handler: () => { setPreviewViewportMode("wide"); setViewportSize({ width: 1440, height: 900 }); } },
{ combo: "mod+3", handler: () => { setPreviewViewportMode("tablet"); setViewportSize({ width: 820, height: 1180 }); } },
{ combo: "mod+4", handler: () => { setPreviewViewportMode("mobile"); setViewportSize({ width: 390, height: 844 }); } },
{ combo: "mod+5", handler: () => setPreviewViewportMode("fit") },
```

- [ ] **Step 4: Update `PreviewFrame` props in JSX**

Find the `<PreviewFrame ... />` invocation (around `App.tsx:1090-1110`). Replace the props:

```tsx
          viewportMode={previewViewportMode}
          viewportWidth={viewportSize.width}
          viewportHeight={viewportSize.height}
          onViewportSizeChange={handleViewportSizeChange}
          onViewportPresetSelect={handleViewportPresetSelect}
          onFitToggle={handleFitToggle}
          onToggleFocusPreview={toggleFocusPreview}
```

(Remove the old `onViewportModeChange={setPreviewViewportMode}` line. Keep `onToggleFocusPreview` — it exists with that exact name in App.tsx already.)

- [ ] **Step 5: Run full test suite**

Run: `npm run test`
Expected: Existing tests pass. (The deleted `viewportTooltip.test.ts` hasn't been deleted yet — we'll do it in Task 6.)

If a test still references `viewportDimensions`, it's coming from inside `PreviewFrame.tsx` — should already be gone in Task 3.

- [ ] **Step 6: Run build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "refactor(App): own viewportSize state + wire new PreviewFrame props"
```

---

## Task 5: Add CSS for the new viewport editor + clean up obsolete styles

**Files:**
- Modify: `src/styles.css` (add new rules, remove obsolete rules)

**Why:** The new `.viewport-editor` group needs its own styling. Old `.viewport-mode-control`, `.viewport-dim`, and `.canvas-size-control` rules are dead code now.

- [ ] **Step 1: Write the failing test for new CSS classes**

Create `src/test/viewportEditorStyles.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const styles = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");

describe("viewport-editor CSS", () => {
  it("declares .viewport-editor container", () => {
    expect(styles).toMatch(/\.viewport-editor\s*\{/);
  });

  it("declares .viewport-size-input with right-aligned text and monospace font", () => {
    const block = styles.match(/\.viewport-size-input\s*\{[^}]+\}/);
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/text-align:\s*right/);
    expect(block![0]).toMatch(/font-family:\s*var\(--mono\)/);
  });

  it("overrides .custom-select width inside .viewport-editor to auto", () => {
    expect(styles).toMatch(/\.viewport-editor\s+\.custom-select\s*\{[\s\S]*?width:\s*auto/);
  });

  it("declares .viewport-fit-btn and .viewport-fit-btn-active", () => {
    expect(styles).toMatch(/\.viewport-fit-btn\s*\{/);
    expect(styles).toMatch(/\.viewport-fit-btn-active\s*\{/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- viewportEditorStyles`
Expected: FAIL — no `.viewport-editor` rule yet.

- [ ] **Step 3: Add CSS rules**

Append to `src/styles.css` (place after the existing `.canvas-size-control` rules around line 1876):

```css
.viewport-editor {
  height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 9px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--surface-soft);
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.03);
}

.viewport-editor-label {
  color: var(--muted);
  font-size: 12px;
  font-weight: 650;
}

.viewport-size-input {
  width: 56px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--ink-soft);
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 680;
  text-align: right;
  -moz-appearance: textfield;
  appearance: textfield;
  transition: border-color var(--motion-fast), box-shadow var(--motion-fast);
}

.viewport-size-input::-webkit-outer-spin-button,
.viewport-size-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.viewport-size-input:focus-visible {
  outline: none;
  border-color: var(--mint);
  box-shadow: 0 0 0 3px rgba(25, 169, 151, 0.14);
}

.viewport-size-input:disabled {
  color: var(--faint);
  background: var(--surface-muted);
  cursor: not-allowed;
}

.viewport-editor-times {
  color: var(--faint);
  font-family: var(--mono);
  font-size: 12px;
}

.viewport-editor .custom-select {
  width: auto;
}

.viewport-editor .custom-select-trigger {
  min-height: 28px;
  height: 28px;
  padding: 0 8px;
  background: var(--surface);
}

.viewport-fit-btn {
  height: 28px;
  padding: 0 8px;
  gap: 4px;
  font-size: 12px;
  font-weight: 650;
}

.viewport-fit-btn-active {
  color: var(--mint-strong);
  background: rgba(25, 169, 151, 0.1);
  border-color: rgba(25, 169, 151, 0.25);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- viewportEditorStyles`
Expected: PASS (4 tests).

- [ ] **Step 5: Delete obsolete CSS rules**

In `src/styles.css`, delete:

1. The entire `.viewport-dim` block (lines 1830–1846, plus the `@media (max-width: 1024px) { .viewport-dim { opacity: 1 } }` block at 1848–1852).
2. The entire `.preview-mode-control` block (lines 1801–1827).
3. The entire `.canvas-size-control` block (lines 1854–1876) — note: keep `.canvas-size-control small` and `.canvas-size-control svg` siblings too if they exist; delete all 3 together.

After deletion, run a sanity grep to confirm:

Run: `grep -n "viewport-dim\|preview-mode-control\|canvas-size-control" src/styles.css`
Expected: no output.

- [ ] **Step 6: Run full test suite + build**

Run: `npm run test`
Expected: All tests pass.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/styles.css src/test/viewportEditorStyles.test.ts
git commit -m "feat(styles): add viewport-editor styles, drop obsolete preset/readout rules"
```

---

## Task 6: Delete obsolete test + add DOM-level test for the new editor

**Files:**
- Delete: `src/test/viewportTooltip.test.ts`
- Create: `src/test/canvasToolbarDom.test.tsx`

**Why:** `viewportTooltip.test.ts` asserts the existence of the old `viewport-dim` and 5 `viewportDimensions.*` references — both gone now. Replace with a DOM-level test that mounts the refactored toolbar shape (we test `PreviewFrame` directly, mocking `iframeRef` etc. as needed — or we test a smaller extracted component if easier; the plan below mounts the full `PreviewFrame`).

- [ ] **Step 1: Delete `viewportTooltip.test.ts`**

```bash
git rm src/test/viewportTooltip.test.ts
```

- [ ] **Step 2: Create the DOM-level test**

Create `src/test/canvasToolbarDom.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PreviewFrame } from "../components/PreviewFrame";
import type {
  ModalCommand,
  PatchCommand,
  SelectElementCommand,
  SelectedElementSnapshot,
} from "../types/editor";

// Stub iframe-only deps: the iframe will never actually load in jsdom,
// so we don't need to mock the bridge — we just verify the DOM renders.

const noop = () => {};

const baseProps = {
  html: "<!doctype html><html><body><h1>hi</h1></body></html>",
  selectedId: null,
  reloadNonce: 0,
  patchCommand: null as PatchCommand | null,
  modalCommand: null as ModalCommand | null,
  selectCommand: null as SelectElementCommand | null,
  viewportMode: "desktop" as const,
  viewportWidth: 1280,
  viewportHeight: 800,
  isFocusPreview: false,
  onViewportSizeChange: noop,
  onViewportPresetSelect: noop,
  onFitToggle: noop,
  onToggleFocusPreview: noop,
  onElementSelected: noop as (e: SelectedElementSnapshot) => void,
  onModalStateChange: noop,
  onElementAction: noop,
  onElementDragged: noop,
  onReadyChange: noop,
};

describe("Canvas toolbar DOM (refactor)", () => {
  it("renders the new viewport-editor container with exactly two number inputs", () => {
    const { container } = render(<PreviewFrame {...baseProps} />);
    expect(container.querySelector(".viewport-editor")).not.toBeNull();
    const inputs = container.querySelectorAll('.viewport-editor input[type="number"]');
    expect(inputs.length).toBe(2);
  });

  it("renders a CustomSelect dropdown for presets (not 5 separate preset buttons)", () => {
    const { container } = render(<PreviewFrame {...baseProps} />);
    // New structure: a single custom-select trigger inside the editor
    expect(container.querySelector(".viewport-editor .custom-select")).not.toBeNull();
    // Old structure: 5 segmented-buttons with the label
    const desktopBtns = Array.from(container.querySelectorAll("button")).filter((b) =>
      Array.from(b.querySelectorAll("span")).some((s) => s.textContent === "桌面")
    );
    // No top-level preset buttons — the only "桌面" text should be inside the dropdown
    expect(desktopBtns.length).toBe(0);
  });

  it("renders the 适配 button inside the editor", () => {
    const { container } = render(<PreviewFrame {...baseProps} />);
    const fitBtn = container.querySelector(".viewport-fit-btn");
    expect(fitBtn).not.toBeNull();
    expect(fitBtn?.textContent).toMatch(/适配/);
  });

  it("disables inputs when in fit mode", () => {
    const { container } = render(<PreviewFrame {...baseProps} viewportMode="fit" />);
    const inputs = container.querySelectorAll('.viewport-editor input[type="number"]');
    inputs.forEach((input) => {
      expect((input as HTMLInputElement).disabled).toBe(true);
    });
    const fitBtn = container.querySelector(".viewport-fit-btn");
    expect(fitBtn?.className).toMatch(/viewport-fit-btn-active/);
  });

  it("does not render the legacy .canvas-size-control or .preview-mode-control", () => {
    const { container } = render(<PreviewFrame {...baseProps} />);
    expect(container.querySelector(".canvas-size-control")).toBeNull();
    expect(container.querySelector(".preview-mode-control")).toBeNull();
  });

  it("calls onViewportSizeChange when the width input changes", () => {
    const onChange = vi.fn();
    const { container } = render(
      <PreviewFrame {...baseProps} onViewportSizeChange={onChange} />
    );
    const widthInput = container.querySelectorAll('.viewport-editor input[type="number"]')[0] as HTMLInputElement;
    widthInput.value = "1024";
    widthInput.dispatchEvent(new Event("change", { bubbles: true }));
    expect(onChange).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npm run test -- canvasToolbarDom`
Expected: PASS (6 tests). If any fail because `PreviewFrame` tries to access `iframeRef.current` and throws, we wrap relevant effects in try/catch in the component — but since we only render the JSX tree without an actual iframe, those code paths should be inert. If a real failure occurs, the fix is to ensure `useIframeSelection` returns safe defaults when `iframeRef.current` is null.

- [ ] **Step 4: Run full test suite**

Run: `npm run test`
Expected: All tests pass.

- [ ] **Step 5: Run build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/test/canvasToolbarDom.test.tsx
git commit -m "test(canvas-toolbar): DOM assertions for new viewport-editor + drop obsolete viewportTooltip test"
```

---

## Task 7: Manual verification across viewport sizes

**Why:** Component tests don't catch real-browser layout issues. Manually verify the toolbar fits without wrapping/clipping at common breakpoints.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Dev server starts, prints a local URL.

- [ ] **Step 2: Open in a browser at 1920×1080**

Open the dev URL. Verify:

- [ ] Canvas toolbar shows: `当前 [1280] × [800] [▾ 桌面] [适配] | [-] [适应] [+] | [↗ 全屏]`
- [ ] Total toolbar width ≤ 600px (use browser devtools to measure `.preview-header-actions`)
- [ ] No element wraps or clips
- [ ] Clicking `适配` button toggles fit mode (inputs become disabled, button highlights)
- [ ] Selecting a preset from the dropdown changes both inputs and the iframe size
- [ ] Editing either input changes the iframe size (no preset auto-select unless values match exactly)

- [ ] **Step 3: Resize browser to 1280×720**

Reload. Verify the toolbar still fits in one row. If it wraps, that's acceptable as long as it doesn't clip.

- [ ] **Step 4: Resize to 1024×640**

Reload. Verify toolbar wraps cleanly onto 2 rows (acceptable per spec) without clipping.

- [ ] **Step 5: Test keyboard shortcuts**

Press `Cmd+1` / `Ctrl+1`. Verify viewport switches to 桌面 1280×800 (inputs + dropdown update).
Press `Cmd+5` / `Ctrl+5`. Verify fit mode activates.

- [ ] **Step 6: Stop dev server**

Stop the dev server process.

- [ ] **Step 7: Final full validation**

Run: `npm run test`
Expected: All tests pass.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 8: Commit (if any UI tweaks were made)**

If during manual verification any small CSS tweaks were needed (e.g., a padding adjustment):

```bash
git add src/styles.css src/components/PreviewFrame.tsx
git commit -m "polish(canvas-toolbar): manual QA-driven spacing tweaks"
```

If no tweaks were needed, skip this commit.

---

## Self-Review

**1. Spec coverage:**
- §1.1, §1.2 (problem statement) → addressed in Tasks 3, 4, 5, 6.
- §1.3 (UI style constraints) → enforced in Task 5 (icon + text for 适配 button, no pure-icon).
- §2 (goals: width ≤600px, custom sizes, shortcuts) → Tasks 4, 7.
- §3.1 (overall structure: 10 elements in 4 groups) → Task 3 JSX produces exactly this.
- §3.2 (viewport-editor JSX) → Task 3 Step 4 is a verbatim port.
- §3.3 (state flow) → Task 4 owns `viewportSize`.
- §3.4 (styles) → Task 5 adds new CSS, deletes obsolete.
- §3.5 (deletions) → Task 3 Step 7 + Task 5 Step 5 + Task 6 Step 1.
- §4 (state preservation: type + shortcuts) → Task 4 Step 3 keeps `mod+1..5` working.
- §5 (edge cases: numeric input bounds, fit disable) → Task 3 Step 4 (min/max + disabled).
- §6 (tests) → Tasks 1, 2, 5, 6 each ship a test; `viewportTooltip` deleted in Task 6.
- §7 (file change list) → matches the 7 tasks above.
- §8 (acceptance criteria) → verified in Task 7.

**2. Placeholder scan:** No TBD/TODO. Every code block contains real code.

**3. Type consistency:**
- `viewportWidth` / `viewportHeight` defined in Task 3 Step 1 (PreviewFrameProps), consumed in Task 3 Step 4 (JSX) and Step 5 (presetKey derivation).
- `viewportSize` defined in Task 4 Step 1, consumed in Task 4 Step 4.
- `presetKey` defined in Task 3 Step 5, consumed in Task 3 Step 4 (CustomSelect value + matchValue).
- `handleViewportSizeChange` / `handleViewportPresetSelect` / `handleFitToggle` defined in Task 4 Step 2, passed as props in Step 4.
- `findMatchingPresetKey` / `isPresetMatch` / `VIEWPORT_PRESETS` / `VIEWPORT_PRESET_KEYS` / `ViewportPresetKey` / `ViewportPreset` defined in Task 2 Step 3, consumed in Task 3 Step 5 + Task 4 Step 2.
- `placeholder` prop defined in Task 1, consumed in Task 3 Step 4.

All consistent.

**4. Build dependency note:** Tasks 2 and 3 leave the codebase temporarily broken (Task 2 deletes `viewportDimensions` from PreviewFrame but doesn't fix all references; Task 3 fixes references but introduces new props that App.tsx doesn't pass). The user agreed to this during brainstorming. The intermediate "build fails" states are fine — only Task 4 Step 6 must show a green build.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-21-canvas-toolbar-refactor.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?