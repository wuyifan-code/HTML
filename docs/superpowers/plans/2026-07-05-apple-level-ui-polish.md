# Apple-Level UI Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring html-finetune's UI to Apple-grade polish on four approved slices (topbar/toolbar brand refinement, panel show/hide iOS spring, inspector numeric + color popover spring animations, global motion tokens / Cupertino easing alignment) by editing `src/styles.css` and small JSX surfaces, gated by `npm run test` and `npm run build`.

**Architecture:** Reuse the existing motion token palette in `src/styles.css` (lines 175-200) plus `--surface-vibrancy`/`--surface-glass-strong` glass tokens, `--press-scale-*` press tokens, and the existing `@media (prefers-reduced-motion: reduce)` block. All animation is CSS-only except two tiny JSX additions (numeric `is-changed` toggle in `StyleEditorPanel.tsx`, popover `is-closing` toggle in `ColorField.tsx`). New tests live in `src/test/applePolish.test.ts` and reuse the `readFileSync`-on-`styles.css` pattern from `motionTokens.test.ts`.

**Tech Stack:** React 19 + TypeScript + Vite + vitest; existing CSS-first motion surface; lucide-react icons already in use.

---

## Files Touched

| File | Action | Responsibility |
|---|---|---|
| `src/styles.css` | Modify | All token additions + topbar/toolbar/panel/inspector CSS changes |
| `src/components/ColorField.tsx` | Modify | Add `is-closing` class on popover for exit animation, unmount on `animationend` |
| `src/components/StyleEditorPanel.tsx` | Modify | Add `.is-changed` class toggle on numeric inputs at commit time |
| `src/test/applePolish.test.ts` | Create | New vitest tests for tokens + 4 surfaces + reduced-motion parity |
| `docs/superpowers/specs/2026-07-05-apple-level-ui-polish-design.md` | (already exists) | Source of truth |

---

### Task 1: Add new motion tokens to `:root`

**Files:**
- Modify: `src/styles.css:175-210`

- [ ] **Step 1: Write the failing test (token declaration)**

Append to `src/test/applePolish.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf-8");

describe("apple-level polish tokens", () => {
  it("declares new pane / press / blur tokens", () => {
    expect(css).toMatch(/--motion-pane-enter:\s*360ms/);
    expect(css).toMatch(/--motion-pane-exit:\s*220ms/);
    expect(css).toMatch(/--press-scale-numeric:\s*1\.04/);
    expect(css).toMatch(/--press-scale-swatch:\s*0\.94/);
    expect(css).toMatch(/--topbar-blur:\s*saturate\(180%\)\s*blur\(20px\)/);
  });
});
```

- [ ] **Step 2: Run the test, expect FAIL**

Run: `cd "D:\Trae\Html Write" && npx vitest run src/test/applePolish.test.ts`
Expected: FAIL — tokens not yet declared in styles.css.

- [ ] **Step 3: Add tokens to `:root`**

In `src/styles.css`, immediately after the `--focus-halo` block (around the end of the `:root` motion tokens area, before any non-token rule), insert:

```css
  /* ----- Apple-level polish additions ------------------------- */
  --motion-pane-enter: 360ms;   /* alias of --motion-spring for semantic use */
  --motion-pane-exit: 220ms;    /* alias of --motion-base for semantic use */
  --press-scale-numeric: 1.04;  /* numeric-pop spring scale (1.04 → 1) */
  --press-scale-swatch: 0.94;   /* color swatch press feedback */
  --topbar-blur: saturate(180%) blur(20px);
```

- [ ] **Step 4: Run the test, expect PASS**

Run: `cd "D:\Trae\Html Write" && npx vitest run src/test/applePolish.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "D:\Trae\Html Write"
git add src/styles.css src/test/applePolish.test.ts
git -c user.name="wuyifancode" -c user.email="wuyifancode@local" commit -m "feat(ui): add apple-level motion + press + blur tokens"
```

---

### Task 2: Panel show/hide — replace transition and add exit keyframes

**Files:**
- Modify: `src/styles.css:4448-4505`

- [ ] **Step 1: Append failing tests**

Append to `src/test/applePolish.test.ts`:

```ts
  it(".app-side-panel transition uses motion-spring / ease-soft-end tokens", () => {
    const m = css.match(/\.app-side-panel\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/width\s+var\(--motion-spring\)/);
    expect(m![1]).toMatch(/var\(--ease-soft-end\)/);
    // 禁止重新引入裸的 cubic-bezier(0.4,0,0.2,1) 字面值
    expect(m![1]).not.toMatch(/cubic-bezier\(\s*0\.4\s*,\s*0\s*,\s*0\.2\s*,\s*1\s*\)/);
  });

  it(".app-side-panel--left entry animation uses motion-spring + ease-emphasized", () => {
    const m = css.match(/\.app-side-panel--left:not\(\.app-side-panel--collapsed\) > \*\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--motion-spring\)/);
    expect(m![1]).toMatch(/var\(--ease-emphasized\)/);
  });

  it(".app-side-panel--right entry animation uses motion-spring + ease-emphasized", () => {
    const m = css.match(/\.app-side-panel--right:not\(\.app-side-panel--collapsed\) > \*\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--motion-spring\)/);
    expect(m![1]).toMatch(/var\(--ease-emphasized\)/);
  });

  it("declares panel-content-exit-left and panel-content-exit-right keyframes", () => {
    expect(css).toMatch(/@keyframes\s+panel-content-exit-left/);
    expect(css).toMatch(/@keyframes\s+panel-content-exit-right/);
  });
```

- [ ] **Step 2: Run tests, expect FAIL**

Run: `cd "D:\Trae\Html Write" && npx vitest run src/test/applePolish.test.ts`
Expected: FAIL on `transition uses motion-spring / ease-soft-end tokens` and `panel-content-exit-*` assertions.

- [ ] **Step 3: Rewrite the `.app-side-panel` block + add exit classes/keyframes**

In `src/styles.css` replace lines 4448-4480 (the `.app-side-panel` block + the two `:not(.app-side-panel--collapsed) > *` rules + the two `@keyframes panel-content-return-*` blocks) with:

```css
.app-side-panel {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background: var(--bg-base-secondary);
  border-color: var(--border-neutral-l1);
  overflow: hidden;
  position: relative;
  transition:
    width var(--motion-spring) var(--ease-soft-end),
    border-color var(--motion-base) var(--ease-standard),
    background-color var(--motion-base) var(--ease-standard);
}
.app-side-panel--left  { width: var(--source-col);    border-right: 1px solid var(--border-neutral-l1); }
.app-side-panel--right { width: var(--inspector-col); border-left:  1px solid var(--border-neutral-l1); }
.app-side-panel--collapsed {
  width: 0 !important;
  border-left-color: transparent;
  border-right-color: transparent;
}

/* Predicted-direction content entry */
.app-side-panel--left:not(.app-side-panel--collapsed) > * {
  animation: panel-content-return-left var(--motion-spring) var(--ease-emphasized) both;
}
.app-side-panel--right:not(.app-side-panel--collapsed) > * {
  animation: panel-content-return-right var(--motion-spring) var(--ease-emphasized) both;
}

/* Directional exit (matches entry edge) */
.app-side-panel--left.app-side-panel--collapsing-out > * {
  animation: panel-content-exit-left var(--motion-exit) var(--ease-exit) both;
}
.app-side-panel--right.app-side-panel--collapsing-out > * {
  animation: panel-content-exit-right var(--motion-exit) var(--ease-exit) both;
}

@keyframes panel-content-return-left  { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes panel-content-return-right { from { opacity: 0; transform: translateX(+12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes panel-content-exit-left    { from { opacity: 1; transform: translateX(0); }     to { opacity: 0; transform: translateX(-12px); } }
@keyframes panel-content-exit-right   { from { opacity: 1; transform: translateX(0); }     to { opacity: 0; transform: translateX(+12px); } }
```

- [ ] **Step 4: Run tests, expect PASS**

Run: `cd "D:\Trae\Html Write" && npx vitest run src/test/applePolish.test.ts`
Expected: PASS for the four new tests in Task 2.

- [ ] **Step 5: Commit**

```bash
cd "D:\Trae\Html Write"
git add src/styles.css src/test/applePolish.test.ts
git -c user.name="wuyifancode" -c user.email="wuyifancode@local" commit -m "feat(ui): panel spring + directional exit keyframes"
```

---

### Task 3: Topbar / Toolbar brand refinement CSS

**Files:**
- Modify: `src/styles.css` — selectors around `.app-header`, `.brand-*`, `.toolbar`, `.toolbar-group`

- [ ] **Step 1: Append failing tests**

Append to `src/test/applePolish.test.ts`:

```ts
  it(".app-header uses surface-vibrancy + topbar-blur stack", () => {
    const m = css.match(/\.app-header\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--surface-vibrancy\)|var\(--topbar-blur\)/);
    expect(m![1]).toMatch(/backdrop-filter:/);
  });

  it(".toolbar-separator is a 1px hairline using border-neutral-l1", () => {
    const m = css.match(/\.toolbar-separator\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/1px/);
    expect(m![1]).toMatch(/var\(--border-neutral-l1\)/);
  });
```

- [ ] **Step 2: Run tests, expect FAIL**

Run: `cd "D:\Trae\Html Write" && npx vitest run src/test/applePolish.test.ts`
Expected: 2 failing tests (topbar surface + toolbar-separator hairline).

- [ ] **Step 3: Add / harden `.app-header` and `.toolbar-separator`**

Find the existing `.app-header { ... }` rule and append (or replace) with these declarations; keep all existing rules that follow. Concretely, in the same `:root` → global layout area where topbar sits, ensure the following classes exist (added if missing) immediately before or after the existing `.app-header`:

```css
.app-header {
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  height: var(--topbar-height);
  min-height: var(--topbar-height);
  background: var(--surface-glass);
  backdrop-filter: var(--surface-vibrancy);
  -webkit-backdrop-filter: var(--surface-vibrancy);
  border-bottom: 1px solid var(--border-neutral-l1);
  padding: 0 var(--space-4);
  gap: var(--space-3);
}
.app-header:hover { backdrop-filter: var(--topbar-blur); }

.toolbar-separator {
  width: 1px;
  align-self: stretch;
  margin: var(--space-2) var(--space-1);
  background: var(--border-neutral-l1);
  flex-shrink: 0;
}
```

If those selectors already exist in styles.css, merge the new declarations rather than duplicating them. Read `src/styles.css` lines around 380–420 to find `.app-header` and confirm before patching.

- [ ] **Step 4: Run tests, expect PASS**

Run: `cd "D:\Trae\Html Write" && npx vitest run src/test/applePolish.test.ts`
Expected: PASS for both new tests in Task 3.

- [ ] **Step 5: Run full test suite to confirm no regressions**

Run: `cd "D:\Trae\Html Write" && npm run test`
Expected: all suites green.

- [ ] **Step 6: Commit**

```bash
cd "D:\Trae\Html Write"
git add src/styles.css src/test/applePolish.test.ts
git -c user.name="wuyifancode" -c user.email="wuyifancode@local" commit -m "polish(ui): topbar vibrancy + toolbar hairline separator"
```

---

### Task 4: Inspector — DS input focus ring + reduced-motion contract

**Files:**
- Modify: `src/styles.css` — `.ds-input:focus` block

- [ ] **Step 1: Append failing test**

Append to `src/test/applePolish.test.ts`:

```ts
  it(".ds-input:focus uses --focus-halo and motion-fast easing", () => {
    const m = css.match(/\.ds-input:focus\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--focus-halo\)/);
    expect(m![1]).toMatch(/var\(--motion-fast\)/);
  });
```

- [ ] **Step 2: Run test, expect FAIL or PASS depending on existing state**

Run: `cd "D:\Trae\Html Write" && npx vitest run src/test/applePolish.test.ts`
If PASS already, skip Step 3 — leave the existing rule as-is (this is a safety test only).
If FAIL, proceed to Step 3.

- [ ] **Step 3: Strengthen the focus ring (only if Step 2 failed)**

Locate `.ds-input:focus { ... }` in `src/styles.css` (one occurrence). Ensure its declarations include:

```css
  border-color: var(--border-brand);
  box-shadow: 0 0 0 2px var(--bg-base-default), 0 0 0 4px var(--focus-halo);
  transition: border-color var(--motion-fast) var(--ease-standard),
              box-shadow var(--motion-fast) var(--ease-standard);
```

If multiple rules target `.ds-input:focus`, only touch the **first** simple block; the rest are variants (input--invalid, etc.).

- [ ] **Step 4: Run test, expect PASS**

Run: `cd "D:\Trae\Html Write" && npx vitest run src/test/applePolish.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "D:\Trae\Html Write"
git add src/styles.css src/test/applePolish.test.ts
git -c user.name="wuyifancode" -c user.email="wuyifancode@local" commit -m "polish(ui): ds-input focus ring uses focus-halo + motion-fast"
```

---

### Task 5: Color popover — spring entrance + exit class

**Files:**
- Modify: `src/styles.css` — `.color-popover` block
- Modify: `src/components/ColorField.tsx` (add `is-closing` state for exit)

- [ ] **Step 1: Append failing tests**

Append to `src/test/applePolish.test.ts`:

```ts
  it(".color-popover uses motion-spring + ease-emphasized for entry", () => {
    const m = css.match(/\.color-popover\s*\{([\s\S]+?)\n\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--motion-spring\)/);
    expect(m![1]).toMatch(/var\(--ease-emphasized\)/);
  });

  it(".color-popover.is-closing uses motion-exit + ease-exit", () => {
    const m = css.match(/\.color-popover\.is-closing\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--motion-exit\)/);
    expect(m![1]).toMatch(/var\(--ease-exit\)/);
  });
```

- [ ] **Step 2: Run tests, expect FAIL**

Run: `cd "D:\Trae\Html Write" && npx vitest run src/test/applePolish.test.ts`
Expected: FAIL on `.color-popover.is-closing` (likely); `.color-popover` may already pass — verify by reading lines.

- [ ] **Step 3: Update `.color-popover` and add `.color-popover.is-closing`**

Locate `.color-popover { ... }` in `src/styles.css`. Add/merge these declarations inside the rule body:

```css
  transform-origin: var(--color-popover-origin, top left);
  animation: color-popover-in var(--motion-spring) var(--ease-emphasized) both;
```

Add a NEW rule immediately after:

```css
.color-popover.is-closing {
  animation: color-popover-out var(--motion-exit) var(--ease-exit) both;
}
```

Append the new keyframes once, anywhere near the existing popover rules:

```css
@keyframes color-popover-in {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes color-popover-out {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.97); }
}
```

- [ ] **Step 4: Wire `is-closing` in `ColorField.tsx`**

In `src/components/ColorField.tsx`, locate the `closePopover` function (around line 85). Replace it with:

```tsx
const closePopover = useCallback((restoreFocus = false) => {
  setIsClosing(true);
  if (restoreFocus) {
    const focusSwatch = () => swatchRef.current?.focus();
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(focusSwatch);
    } else {
      window.setTimeout(focusSwatch, 0);
    }
  }
}, []);

const handleClosingEnd = useCallback(() => {
  setIsOpen(false);
  setIsClosing(false);
}, []);
```

Add the corresponding state declaration just after `const [isOpen, setIsOpen] = useState(false);` (around line 55):

```tsx
const [isClosing, setIsClosing] = useState(false);
```

Locate the popover portal JSX in `ColorField.tsx` (it will be a `<div className="color-popover" ...>` somewhere later in the file). Patch the className to `color-popover${isClosing ? " is-closing" : ""}` and add `onAnimationEnd={handleClosingEnd}` to the same element. If the popover JSX uses `display: none` based on `isOpen`, keep that — the `isOpen=false` swap still happens, just via the closing path.

- [ ] **Step 5: Run tests, expect PASS**

Run: `cd "D:\Trae\Html Write" && npx vitest run src/test/applePolish.test.ts`
Expected: PASS for both new tests.

- [ ] **Step 6: Commit**

```bash
cd "D:\Trae\Html Write"
git add src/styles.css src/components/ColorField.tsx src/test/applePolish.test.ts
git -c user.name="wuyifancode" -c user.email="wuyifancode@local" commit -m "feat(ui): color-popover spring entrance + is-closing exit"
```

---

### Task 6: Numeric input `is-changed` spring micro-feedback

**Files:**
- Modify: `src/styles.css` — `.ds-input--numeric.is-changed` rule + keyframe
- Modify: `src/components/StyleEditorPanel.tsx` — toggle class on commit

- [ ] **Step 1: Append failing tests**

Append to `src/test/applePolish.test.ts`:

```ts
  it("declares @keyframes numeric-pop used by .ds-input--numeric.is-changed", () => {
    expect(css).toMatch(/@keyframes\s+numeric-pop/);
    const m = css.match(/\.ds-input--numeric\.is-changed\s*\{([\s\S]+?)\}/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/var\(--press-scale-numeric\)/);
    expect(m![1]).toMatch(/var\(--ease-spring-pop\)|var\(--motion-base\)/);
  });

  it("prefers-reduced-motion fallback also zeroes numeric-pop and color-popover animations", () => {
    const reduced = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]+?)\n\}/);
    expect(reduced).toBeTruthy();
    // The reduced-motion override block applies globally via *, so all keyframes are
    // transitively zeroed. We assert the global override block still exists.
    expect(reduced![1]).toMatch(/animation-duration:\s*0\.001ms\s*!important/);
    expect(reduced![1]).toMatch(/transition-duration:\s*0\.001ms\s*!important/);
  });
```

- [ ] **Step 2: Run tests, expect FAIL on numeric-pop**

Run: `cd "D:\Trae\Html Write" && npx vitest run src/test/applePolish.test.ts`
Expected: FAIL on `numeric-pop` / `.ds-input--numeric.is-changed`.

- [ ] **Step 3: Add the keyframe + class rule**

In `src/styles.css`, add (anywhere reasonable, e.g. after the `.color-popover` block):

```css
.ds-input--numeric.is-changed {
  animation: numeric-pop var(--motion-base) var(--ease-spring-pop) both;
}

@keyframes numeric-pop {
  0%   { transform: scale(1); }
  40%  { transform: scale(var(--press-scale-numeric)); }
  100% { transform: scale(1); }
}
```

- [ ] **Step 4: Add JSX toggle in `StyleEditorPanel.tsx`**

Open `src/components/StyleEditorPanel.tsx`. Within the file, identify the `<input className="ds-input ds-input--numeric ...">` elements (search for the literal className string `ds-input--numeric`). Wrap them so a `.is-changed` class can be appended on commit time.

If the existing markup looks like:

```tsx
<input className="ds-input ds-input--numeric" value={draft.fontSize} onChange={...} />
```

Change it to a small helper at the top of the file:

```tsx
function NumericChangeClass({ on }: { on: boolean }) {
  return on ? " is-changed" : "";
}
```

And at each numeric input, add `className={`ds-input ds-input--numeric${NumericChangeClass({ on: justCommitted })}`}`. To keep scope tight, the simplest viable change is to **locate one** numeric input (e.g., the font-size field) and patch only its className to:

```tsx
className={`ds-input ds-input--numeric${commitPulse ? " is-changed" : ""}`}
```

with `commitPulse` as a local boolean state cleared via `setTimeout(220)`. This proves the wiring without rewriting every numeric input. Pattern (paste the closest numeric input block's onChange/onBlur plus a small `commitPulse` state, render the input with the conditional class). Skip if no numeric input currently exists in this file; in that case, add the test for the keyframe only (Keyframe-Only Acceptance — see below).

**Keyframe-Only Acceptance (fallback):** if `StyleEditorPanel.tsx` has no `ds-input--numeric` literal, the test still passes because it asserts the rule + keyframe exist; the JSX wiring becomes a future polish task and is tracked as deferred (see §7 of spec).

- [ ] **Step 5: Run tests, expect PASS**

Run: `cd "D:\Trae\Html Write" && npx vitest run src/test/applePolish.test.ts`
Expected: PASS for new tests in Task 6.

- [ ] **Step 6: Commit**

```bash
cd "D:\Trae\Html Write"
git add src/styles.css src/components/StyleEditorPanel.tsx src/test/applePolish.test.ts
git -c user.name="wuyifancode" -c user.email="wuyifancode@local" commit -m "feat(ui): numeric-pop spring micro-feedback on commit"
```

---

### Task 7: Full suite + build gate

**Files:** none new

- [ ] **Step 1: Run the entire vitest suite**

Run: `cd "D:\Trae\Html Write" && npm run test`
Expected: every existing test plus all new tests in `applePolish.test.ts` green. If any new test fails, fix the CSS / JSX to satisfy the assertion; do **not** weaken the assertion.

- [ ] **Step 2: Run the production build**

Run: `cd "D:\Trae\Html Write" && npm run build`
Expected: tsc + vite build exit 0 with no type errors.

- [ ] **Step 3: If either gate fails, fix and re-run both**

Iteration loop: read the failure, patch the smallest surface, re-run both `npm run test` and `npm run build`, repeat until both green.

- [ ] **Step 4: Final summary commit (no-op if no changes)**

```bash
cd "D:\Trae\Html Write"
git status
# If anything still uncommitted, commit with:
git -c user.name="wuyifancode" -c user.email="wuyifancode@local" commit -m "chore: apple-level ui polish — all 4 slices green"
```

## Acceptance / Done criteria

1. `npm run test` exits 0 and `applePolish.test.ts` reports all 11 new tests green.
2. `npm run build` exits 0.
3. `git log --oneline` on `UI` branch shows 7 feature commits added on top of `235ab1f` (the spec commit).
4. Files touched: only `src/styles.css`, `src/components/ColorField.tsx`, `src/components/StyleEditorPanel.tsx`, and the new `src/test/applePolish.test.ts`.
5. No animation library added. No theme rewrite. No new feature scope.
