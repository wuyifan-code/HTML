# Apple-Level UI Polish — Design Spec

- **Date:** 2026-07-05
- **Project:** html-finetune (React 19 + Vite + TS)
- **Branch:** UI
- **Author:** ZCode (brainstorming → spec)
- **Status:** Draft → user review

## 1. Goal

Take the **already-extensive** UI/UX to a **deeper, Apple-grade** quality on four targeted
slices, all approved by the user in a single message:

1. **Topbar / Toolbar brand refinement** — title bar precision, brand hierarchy,
   SF-symbol–like icons, glass titlebar, hover/active parity with macOS.
2. **Panel show/hide iOS-style motion** — left/right panels collapse with a real
   spring/Cupertino feel (no width-jump), resizer surfaces when hovering the gutter,
   predictive content exit in the collapse direction.
3. **Inspector numeric + color spring animations** — value change micro-feedback,
   color picker popover spring entrance, dropdown/popover cubic-bezier(0.32, 0.72, 0, 1)
   entry.
4. **Global motion tokens / Cupertino easing alignment** — single source of truth
   referenced everywhere; replaces the ~12 remaining `cubic-bezier(0.4, 0, 0.2, 1)`
   literals in CSS that bypass the motion token table; respect `prefers-reduced-motion`.

This spec is **focused, not** a full UI rewrite. Existing motion palette, glass
tokens, press-scale tokens, dialog/drawer/toast surfaces, and the motion-token test
suite in `src/test/motionTokens.test.ts` are reused as the foundation.

## 2. Non-goals

- No new feature surfaces (no new panels, no new exports, no new providers).
- No theme system rewrite — `.theme-dark` rules stay; we only add tokens.
- No animation library (framer-motion, motion-one, GSAP, etc.) — pure CSS +
  existing React state. Rationale: existing animation footprint is CSS-only and
  adding a library would balloon bundle.
- No spec rewrite of the 2026-06-26 editor-redesign spec or 2026-06-21 canvas
  toolbar refactor; we honor them.

## 3. Scope & Decisions

### 3.1 Topbar / Toolbar brand refinement

**Surface.** Files: `src/components/Header.tsx`, `src/components/Toolbar.tsx`,
`src/styles.css` selectors `.app-header`, `.brand-*`, `.toolbar`, `.toolbar-group`,
`.toolbar-separator`, `.ds-btn` (only topbar-visible variants).

**Apple references we will model on.**

- **macOS title bar:** translucent, hairline (1px) bottom divider, slightly tinted
  via `saturate(180%) blur(20px)`. Already partially in place via
  `--surface-vibrancy` on dialog/drawer; we extend it to `.app-header` in light
  theme and to `--surface-glass-strong` in dark.
- **SF Symbols sizing:** icons sit on a `28×28` (sm) hit area inside an icon-only
  button. We standardize toolbar icon size to **14px / 1.75 stroke** (already in
  use) and the visible button box to **28×28**, replacing today’s `ds-btn--sm`
  icon button which visually renders at 26px.
- **Brand hierarchy:** single monogram mark (already `HFT`) + product name +
  muted version. The current breadcrumb (folder / file) is functional; we tighten
  its separator and color contrast.

**Concrete CSS changes.**

- `.app-header` — add `backdrop-filter: var(--surface-vibrancy); background:
  var(--surface-glass); border-bottom: 1px solid var(--border-neutral-l1);`
- `.brand-mark` — radius `--radius-8` (already there) and consistent **20×20**
  square (was 24×24 in some renders); brand text `--text-default` at
  `font-weight: 600` size `--text-sm` (12px), version muted `--text-tertiary`
  size `--text-xs` (11px); breadcrumb inherits `--text-tertiary`.
- `.brand-divider` — height `12px` × `1px` line `--border-neutral-l2`.
- `.toolbar` — row gap `--space-2`; group separators reduced to **1px** lines of
  `--border-neutral-l1`, vertical padding `--space-2`.
- `.toolbar-group-tail` — same padding rules; right-edge button does not have
  extra margin.
- `:hover` on toolbar buttons — lift via `--press-scale-button` (already in test
  suite `.ds-btn:active`). We add a parallel `:hover` slightly inset shadow on
  `--elev-raised`.
- Press feedback — `:active` uses `transform: scale(var(--press-scale-button));`
  with `--motion-fast --ease-emphasized`.

**Visual acceptance.**

- Title bar visually identical between hover and non-hover states aside from icon
  tint shift.
- Tools in 5 logical groups (undo/redo, import/copy, export, modal toggle,
  history) sit at equal spacing.
- No toolbar overflow at ≥1280px width on the current sample HTML.

### 3.2 Panel show/hide iOS-style motion

**Surface.** Files: `src/styles.css` selectors `.app-side-panel`,
`.app-side-panel--collapsed`, `@keyframes panel-content-return-*`, `.app-resizer`,
`.app-resizer::before`, plus App.tsx toggle plumbing in
`src/App.tsx` (only if a JS-class swap is needed).

**Current state.** Width transitions over `320ms cubic-bezier(0.4, 0, 0.2, 1)`,
content slides 12px horizontally on *re-entry*. Collapse to `width: 0 + opacity: 0`
fires instantly from CSS, with no exit animation.

**Apple references we will model on.**

- **Spring entrance / exit.** Side panels in iOS Settings push in from the edge
  with `--motion-spring` (360ms) `--ease-emphasized`. Exit is shorter
  (`--motion-exit`, 200ms `--ease-exit`). Width interpolation uses
  `--motion-spring --ease-soft-end`.
- **Edge-aware content.** Left panel content **slides from left**, right panel
  content **slides from right** on enter; on exit they slide **off the same edge**
  (not a fade).
- **Resizer.** Hover gutter reveals a 1px brand-colored highlight (already
  partly done). On `:hover` the resizer background becomes `--bg-brand` with
  40% scaleY of an inner bar — kept as is, plus an opacity fade on the highlight
  using `--motion-fast`.

**Concrete CSS changes.**

```css
.app-side-panel {
  transition:
    width var(--motion-spring) var(--ease-soft-end),
    border-color var(--motion-base) var(--ease-standard),
    background-color var(--motion-base) var(--ease-standard);
  /* remove opacity 0 on collapsed — width 0 already hides content; keep on
     purely-VFX surfaces only */
}
.app-side-panel--collapsed {
  width: 0 !important;
  border-left-color: transparent;
  border-right-color: transparent;
}

.app-side-panel--left:not(.app-side-panel--collapsed) > * {
  animation: panel-content-return-left var(--motion-spring) var(--ease-emphasized) both;
}
.app-side-panel--left.app-side-panel--collapsing-out > * {
  animation: panel-content-exit-left var(--motion-exit) var(--ease-exit) both;
}
.app-side-panel--right:not(.app-side-panel--collapsed) > * {
  animation: panel-content-return-right var(--motion-spring) var(--ease-emphasized) both;
}
.app-side-panel--right.app-side-panel--collapsing-out > * {
  animation: panel-content-exit-right var(--motion-exit) var(--ease-exit) both;
}

@keyframes panel-content-return-left  { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes panel-content-return-right { from { opacity: 0; transform: translateX(+12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes panel-content-exit-left    { from { opacity: 1; transform: translateX(0); }    to { opacity: 0; transform: translateX(-12px); } }
@keyframes panel-content-exit-right   { from { opacity: 1; transform: translateX(0); }    to { opacity: 0; transform: translateX(+12px); } }
```

**JS plumbing.** A new `panelPhase` state on `App.tsx`: `"expanded" | "collapsing-out" | "collapsed"`. On user click, transition to `collapsing-out`, after `--motion-exit` remove `app-side-panel--collapsed` and add `--collapsing-out`. After `--motion-spring` clear `--collapsing-out`. Or, simpler: drop JS entirely and use CSS keyframe `forwards` with `animationend`. We choose the **JS-free** option (CSS only) to keep the toggling dumb; an outline `#app-shell` listens for `transitionend` if the timing slips, but we initially ship CSS-only and add a fallback later if needed.

**Visual acceptance.**

- Width slides smoothly from 280/360 → 0 over **360ms** with the
  `--ease-soft-end` curve, no visible jump.
- Content within the panel moves **with** the resize then fades after.
- Resizer only highlights on `:hover`; never shows on rest.

### 3.3 Inspector numeric + color spring animations

**Surface.** Files: `src/components/ColorField.tsx`,
`src/components/StyleEditorPanel.tsx`, `src/styles.css` selectors
`.color-popover`, `.ds-input`, `.ds-input:focus`, `.inspector-row`, plus all
focusable text/select/counter inputs in inspector.

**Apple references we will model on.**

- **Numeric stepper:** when value changes, the digit briefly scales
  (`scale(1.06)`) at the change moment, then settles (`scale(1)`). Use
  `--ease-spring-pop` for the settle only, not for opacity/background.
- **Color swatch:** on popover open, the popover enters with `--motion-spring`
  `--ease-emphasized` and a tiny `scale(0.96) → scale(1)`. Background swatch has
  a `--press-scale-icon` on click plus a brief color ring that pulses once.
- **Inputs:** `:focus` halo uses `--focus-halo` token with `--motion-fast`
  `--ease-standard`. Active border uses `--border-brand`.

**Concrete CSS changes.**

- `.ds-input:focus` — keep current focus-halo behavior but reduce shadow size
  from 0 0 0 3px (already there in spirit) to `0 0 0 4px` ring stacked with
  halo: `box-shadow: 0 0 0 2px var(--bg-base-default), 0 0 0 4px
  var(--focus-halo);`. Transition uses `--motion-fast --ease-standard`.
- `.color-popover` — add
  `transform-origin: var(--color-popover-origin, 0 0); animation:
  color-popover-in var(--motion-spring) var(--ease-emphasized) both;` and a
  closing class for `--motion-exit --ease-exit`.
- `.ds-input--numeric.is-changed` — JS toggled class on committed value change,
  runs keyframe `numeric-pop var(--motion-base) var(--ease-spring-pop) both`.
- `:active` on color swatch + numeric stepper buttons uses
  `--press-scale-icon`.

**JS plumbing.**

- `useEditorStore` already exposes a `commit` style state. Add a tiny
  `lastCommittedAt` ref-based trigger in `ColorField.tsx` and `StyleEditorPanel.tsx`
  so that the `is-changed` class lasts only `--motion-base` and is then
  removed — we use **setTimeout(removeClass, 220)** locally; no global state.
- Popover exit on outside click — add `.color-popover.is-closing` for `--motion-exit`,
  then on `transitionend` set `isOpen=false` (already a pattern in the file).

**Visual acceptance.**

- Numeric fields do not jiggle on every keystroke; only commit (Enter / blur /
  stepper button) fires a brief spring.
- Color picker pops open like a SwiftUI popover (200–360ms).
- All animations respect `@media (prefers-reduced-motion: reduce)`.

### 3.4 Global motion tokens / Cupertino easing alignment

**Surface.** `src/styles.css` only.

**Discoveries.** 12+ call-sites currently hardcode `cubic-bezier(0.4, 0, 0.2, 1)`
even though `--ease-standard` exists; `transition: ...320ms cubic-bezier(...)`
where `--motion-slow` exists. Additionally `App.tsx` JSX style attribute on the
file input in `Toolbar.tsx` uses literal pixel positioning unrelated to tokens
(unchanged here — out of scope).

**Apple-aligned canonicalisation decisions.**

| Existing literal                     | Replace with          | Rationale                                  |
|--------------------------------------|-----------------------|--------------------------------------------|
| `cubic-bezier(0.4, 0, 0.2, 1)`       | `var(--ease-standard)`| Identity                                  |
| `320ms` as a transition value         | `var(--motion-slow)`  | Apple-spring range                         |
| `220ms` as transition value          | `var(--motion-base)`  | Apple-base                                 |
| `130ms` as transition value          | `var(--motion-fast)`  | Apple-fast                                 |
| `cubic-bezier(0.22, 1, 0.36, 1)`     | `var(--ease-soft-end)`| Already defined, retire literal            |
| `cubic-bezier(0.16, 1, 0.3, 1)`      | `var(--ease-emphasized)`| Same                                    |

**Adding new tokens (Apple-only).**

- `--motion-pane-enter: 360ms` (alias of `--motion-spring`, retained for
  semantic naming in panel contexts)
- `--motion-pane-exit: 220ms` (alias of `--motion-base`)
- `--press-scale-numeric: 1.04` — for the numeric-pop spring
- `--press-scale-swatch: 0.94` — for color swatch click
- `--topbar-blur: saturate(180%) blur(20px)` (token for title bar blur)

**Reduced-motion contract.** Reuse existing
`@media (prefers-reduced-motion: reduce)` block (already enforced by tests). New
animations must explicitly include `(prefers-reduced-motion: no-preference)` or
use `animation: ... var(--motion-*) var(--ease-*)` so the global block kills them.
The test in `motionTokens.test.ts → prefers-reduced-motion fallback` already
guards this; we extend with one more test asserting that the new
`numeric-pop` keyframe is also zeroed out under reduced motion.

### 3.5 Test plan

New tests in `src/test/applePolish.test.ts`:

1. `--motion-pane-enter`, `--motion-pane-exit`, `--press-scale-numeric`,
   `--press-scale-swatch`, `--topbar-blur` declared in styles.css.
2. `.app-header` uses `var(--surface-vibrancy)` (or equivalent Apple vibrancy
   stack).
3. `.app-side-panel` transition uses `var(--motion-spring)` and
   `var(--ease-soft-end)`; no `cubic-bezier(0.4, 0, 0.2, 1)` literal in
   `.app-side-panel { transition: ... }`.
4. `.app-side-panel--left:not(.app-side-panel--collapsed) > *` animation uses
   `var(--motion-spring)` and `var(--ease-emphasized)`.
5. New `@keyframes panel-content-exit-*` defined.
6. `.color-popover` uses `var(--motion-spring)` and `var(--ease-emphasized)`.
7. `@keyframes numeric-pop` defined and used under `.is-changed`.
8. `prefers-reduced-motion` zero-out applies to all new keyframes.
9. `Toolbar.tsx` no longer writes `transition` inline that bypasses tokens.
10. `Header.tsx` does not introduce inline `style={{ transition: ...}}`.

Tests are existing infrastructure (vitest + readFileSync on styles.css).
No new runner, no new fixtures.

### 3.6 Files touched (summary)

- **Modify:** `src/styles.css` (sole CSS home for §3.2, §3.3, §3.4), `src/components/ColorField.tsx` (closing animation class), `src/components/StyleEditorPanel.tsx` (numeric `is-changed` toggle).
- **New test:** `src/test/applePolish.test.ts`.
- **Spec doc:** `docs/superpowers/specs/2026-07-05-apple-level-ui-polish-design.md` (this file).
- **Out of scope (this spec):** `Header.tsx` JSX, `Toolbar.tsx` markup, App.tsx layout — they remain unchanged structurally; only their CSS is touched.

## 4. Risks & Open Questions

- **Risk:** panel collapse exit animation begins before content has finished its
  exit, producing visual stutter. **Mitigation:** the new keyframes use
  `forwards` (`both`), and we keep the `isOpen=false` toggle tied to
  `animationend`, not `transitionend`.
- **Risk:** brand hierarchy change increases topbar height by 1–2px, causing
  layout shifts in the topbar strip. **Mitigation:** we keep topbar height
  unchanged at `var(--topbar-height)` (56px); internal padding adjustments
  preserve outer box.
- **Open question:** should `.color-popover` exit also unmount via portal? —
  **Decision:** No; keep `display:none` after exit keyframe completes, as today.
- **Open question:** apply to mobile-sheet panels? — **No**, mobile uses
  `workspace-mobile-shell` overlay rules which already use tokenized motion;
  we leave them alone.

## 5. Implementation Plan (high level)

1. **Tokens first.** Add the new tokens to `:root` (and `.theme-dark` where
   applicable). New tests for token declaration are colocated.
2. **Panel CSS rewrite.** Replace transition + keyframes as per §3.2; add
   exit keyframes; smoke-test in browser at ≥1280px / 768px / 375px.
3. **Topbar CSS polish.** Apply §3.1 changes to `.app-header`, `.brand-*`,
   `.toolbar`. No JSX changes; verify via DOM snapshots (existing tests in
   `visualPolish.test.ts` cover toolbar structure).
4. **Inspector + color polish.** CSS-only for `.ds-input`, `.color-popover`.
   JS only adds 2 small effects: commit-tap `is-changed` and popover
   `is-closing`. No new state in store.
5. **Test gate.** Run `npm run test` and `npm run build`; both must pass. New
   test file should fail if any literal `cubic-bezier(0.4, 0, 0.2, 1)` remains
   inside `.app-side-panel { transition: ... }` block.

## 6. Acceptance Criteria

A reviewer should be able to:

- Open the app at 1280×800 and see (a) a softly blurred title bar, (b) panels
  that close with a 360ms spring, (c) inspector numeric field changes that
  briefly bounce, (d) color picker popover that opens with a soft scale-in.
- Trigger toggle of `prefers-reduced-motion` in OS settings and observe no
  animations on the four surfaces.
- Run `npm run test` and see new tests pass without breakage of
  `motionTokens.test.ts`.
- Run `npm run build` and see a clean tsc + vite build (no type or bundling
  regression).

## 7. Out of Scope (deferred to a follow-up spec)

- Toolbar button icons SF-symbol-glyph pairings (using `@lobehub/icons`
  selectively).
- Migrating the resizer handle to a **grip** widget (today a 1px bar).
- History drawer sheet detents (currently full-height).
- Mobile bottom-sheet gesture polish (already partial; defer).
- Topbar context menus (font/viewport/zoom) deep polish.
