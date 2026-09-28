# CT Snapshot Tolerance Audit — sharp mission

Status: **COMPLETE**

READ-ONLY audit: no source/baseline modified, no commits. Methods: spec census,
baseline PNG inspection (viewed 16), pixel-area measurement (`/tmp/tol_audit.py`
+ inline scripts, throwaway), token-definition lookup, git archaeology
(fix commit vs baseline-freeze commit per component). No CT suite run — all
pass/fail claims are arithmetic (diff-area estimate vs budget), stated as such.

## Census

- Total `await snap(` calls in `packages/reference-lib/src/components/**/*.ct.spec.ts`: **344**
- Global default `maxDiffPixelRatio: 0.02` (`playwright/playwright.config.ts:26`):
  **308 calls inherit it** (89.5%). Viewport is fixed 800×480 = 384,000px, so the
  default budget is **7,680px per snapshot**. Deterministic setup otherwise
  (animations disabled, caret hidden, fixed viewport, dark scheme, `snap()` is a
  thin `toHaveScreenshot` wrapper in `playwright/ct.ts:105`).
- Explicit per-call tolerances (**36 calls**):
  - `maxDiffPixelRatio: 0.001` ×31 — Tabs 9, Tree 4, Accordion 5, Field 3,
    Collapsible 7, NumberField 3. All locator-scoped. **Legit noise guards**
    (budgets ≈5–30px); the pattern to copy.
  - `maxDiffPixelRatio: 0.002` ×1 + `maxDiffPixels: 5` ×1 — Overlay edge-sheet
    handle/content. **Legit, tightest in repo**; model for geometry micro-states.
  - `maxDiffPixelRatio: 0.15` ×3 — FocusLock `fl-dom-invalid-error` (:216),
    `fl-init-negative-focused` (:242), `fl-stack-c-open` (:548). Budget
    **57,600px** each. **Pure mask, no noise justification** (static lab pages).
- Zero `toHaveScreenshot` uses outside `snap()`; none in matrix/pipeline.
- Coverage side-note (not tolerance, found in passing): `snap()` no-ops off the
  React19 gallery (`ct.ts:113`) → snapshots cover React 19 only; drift on
  React 17/18 is masked 100%. Announcer has 0 snaps (correct: aria-live);
  Icon/Reference have no CT specs (uncovered, not a tolerance issue).

## Why 2% is a mask, not a guard (measured)

Non-background pixel count (= all assertable content) vs the 7,680px budget:

| Baseline | Content px | % of frame | Budget multiple |
|---|---|---|---|
| datefield-resting | 2,935 | 0.76% | budget is **2.6× all content** |
| listbox-selected-banana | 10,396 | 2.71% | B-38 row ≈7,100px ≈ **1.87% — passes with ~500px headroom** |
| pill-activity-selected | 11,491 | 2.99% | a label-color flip ≈400px ≈ 0.1% — invisible |
| gate7-close-button | 70,269 | 18.3% | B-37 button move ≈1–2k px ≈ 0.5% — invisible |
| fl-dom-invalid-error | 126,770 | 33.0% | 0.15 budget = 57.6k px; guarded error text ≈2k px = 3.5% of budget |

Real rendering noise under this deterministic setup (same Chromium, fonts, AA)
is tens of pixels (<0.05%). Nothing justifies 7,680px, let alone 57,600px.

## Baselines-depict-fixed-bugs instances: 20 baselines, 4 root causes

### 1. Listbox B-38 — 7 baselines (KNOWN, confirmed + extended)
Fix (uncommitted worktree): `Listbox.tsx` selected-row bg
`ui.button.background` (near-white in dark mode) → `ui.table.row.mutedBackground`.
Baselines still show the near-white row — viewed: `listbox-selected-banana`,
`listbox-multi-selected`, `listbox-default`, `listbox-multi-default`; bright-area
≈8.1k px (≈1 row) also implicates `listbox-hover-banana`,
`listbox-hover-disabled`, `listbox-keyboard-focused`, `listbox-sections`.
Single-row diff ≈1.87% < 2% → all 7 pass masked.
`listbox-multi-selected` (2 white rows, ≈3.7%) is arithmetically expected to
FAIL — the only B-38 baseline the suite can see (unobserved, no suite run).

### 2. DateField locale display — 8 baselines (KNOWN, confirmed, mechanism found)
`3b79407fa` + required-locale migration changed input display ISO → locale
(spec asserts `8/15/2026`; `DateField.tsx:489` throws without locale) but the
09-13 baselines were never regen'd. All 8 `datefield-*` baselines show ISO input
text (viewed: resting, selected). Text diff ≈0.2–0.4% « 2%.

### 3. Field bleed, same DateField cause — 2 baselines (NEW)
`field-date-compound` and `field-surface` (frozen 09-25) embed `<DateField>`
and show `2026-09-10` ISO input text — viewed both. (Also note for regen
eyeball: the default trigger renders a 📅 emoji glyph in these baselines.)

### 4. Toast B-37 close-inside — 3 baselines (NEW)
`16323d2b7` moved the close × from straddling-corner (absolute) to
inline-trailing inside the card, with bbox assertions added to gate7 tests —
but baselines not regen'd. Viewed all 3: `gate7-close-button` (× on top-left
corner), `gate7-rtl-layout` (× on top-right corner), `default-toast-open`
(× on corner). Notably `default-toast-open`'s test has NO bbox assertion —
the stale snapshot is its only visual proof. Move ≈0.3–0.5% « 2%.
`defined-toast-success` checked: no corner ×, unaffected.

### 5. Tabs B-08 — special case: page-mask over a direction-disputed fix (NEW)
Uncommitted worktree: pill-selected text `ui.button.foreground` →
`design.text.base`, comment claims foreground "(≈white)" is unreadable on
gray.200. Token defs say otherwise for dark mode (the CT mode): foreground =
gray.950 (near-black, `tokens.ts:166`), base = gray.50 (near-white,
`design.ts:26`). Baseline measurement confirms: pill text pixels are
(3,7,18)--class dark, readable. **As drafted, B-08 fixes light mode while
breaking dark mode** (white-on-gray.200). Tolerance angle: the glyph flip is
≈400px ≈ 0.1% — page snap `pill-activity-selected` (2%) is blind either way
and cannot adjudicate; the 0.001 locator snap `pill-list-activity-selected`
(~15px budget) WILL flag it. ESCALATE: B-08 needs a per-mode computed-color
assertion (B-38 pattern) before landing; eyeball the locator diff on regen.

### Ruled OUT (pixel-neutral, evidence in hand)
- Tree H-2 (`13813a4fd`): old `var(--colors-ui-focus-ring, {…})` and new
  `ui.focus.ring` resolve to the same custom property; baseline ring proves the
  var existed. Hygiene only. Its stylesheet-text probe (no placeholder) is the
  right proof shape.
- Tooltip B-09 (`b8095957d`): `.ref-span → color: inherit` is global but only
  changes Spans on non-default surfaces; no snapshotted fixture puts a Span on
  a chip (new story has no snapshot; proof is computed-style + contrast — the
  right pattern).
- Button B-40: new story only, existing fixtures untouched.
- NumberField data-pressed (`c88c5844b`): types only.
- Splitter H-1/B-28: prop plumbing stripped before DOM; no render-path change.
- Slider W-35 (dev warn), Presence W-09 (callback prop): non-visual.
- Unexamined, judged low-risk (behavioral props, fixtures unlikely to render
  them): Combobox W-24, Calendar W-20/W-21, Menu W-28.

## Proposed tolerance policy

- **P1. Global default 0.02 → 0.002** (`playwright.config.ts:26`). 768px @
  800×480 ≈ 10× measured-noise headroom. Listbox row (1.9%), DateField text
  (~0.3%), Toast close move (~0.5%) all then fail — as they should.
- **P2. Locator-pairing rule.** Every page snap asserting a named visual state
  gets a tight locator snap (≤0.001 ratio or ≤25px absolute) on the assertable
  element. 7 components already do this; extend to the other ~22.
- **P3. Zero/near-zero where pixels are the contract.** Token/color contracts →
  computed-style assertions, not snapshots (B-38/B-09/B-37 precedents).
  Geometry micro-states (handles, pills, chips) → `maxDiffPixels` ≤ 5–25
  (Overlay precedent). Page snaps remain only as layout tripwires at 0.002.
- **P4. Ban per-call ratio ≥ 0.01** without a `// TOL:` comment naming the noise
  source. Delete the three 0.15s (replace with locator snaps or drop where
  `toBeFocused`/`toContainText` already proves behavior).
- **P5. Same-commit regen rule.** A render-affecting fix regens that component's
  baselines in the same commit (Menubar `87b89303b` precedent did this);
  reviewer eyeballs the failure diff (telemetry reporter already prints
  bbox + mean colors — keep it). B-38/B-37/DateField-locale are the case
  studies for what happens without it.
- **P6. Decide the React 17/18 gap** (per-major baselines or explicit accept).
- **P7 (follow-up). Near-miss radar:** periodic zero-tolerance canary run that
  reports per-snapshot diff sizes without failing (telemetry reporter only
  fires on failure today, so near-misses are currently unobservable).

## Concrete spec edits (LIST ONLY — not made)

1. `packages/reference-lib/playwright/playwright.config.ts:26`:
   `maxDiffPixelRatio: 0.02` → `0.002`.
2. `FocusLock/__e2e__/FocusLock.ct.spec.ts:216` (`fl-dom-invalid-error`):
   replace page snap with locator on `[data-testid="fl-dom-03-error"]` at
   `maxDiffPixels: 25`, or drop (text assertion already proves it).
3. Same file `:242` (`fl-init-negative-focused`): locator on `init-negative`
   at 0.001, or drop (`toBeFocused` proves it).
4. Same file `:548` (`fl-stack-c-open`): locator on `stack-c` at 0.001, or drop.
5. Add 0.001 (or ≤25px) locator snaps alongside existing page snaps in:
   Listbox, DateField, Toast (close-bearing states), Button, Calendar,
   Combobox, Menu, Popover, Portal, Presence, Primitives, RovingFocus,
   Showcase, Slider, Slot, Splitter, Switch, Tooltip, Measure,
   ReferenceLibrary, Menubar, Overlay, OverlayFocus, OverlayExotica, plus the
   page-only remainder states in Field, NumberField, Tree, Tabs, Accordion,
   Collapsible. (Mirror the existing `snap(list, …, { maxDiffPixelRatio: 0.001 })`
   shape; see Tabs.ct.spec.ts:46-47.)
6. Regen + human-eyeball the 20 stale baselines (§1–4 above) after P1 lands.
7. Add computed assertions: Tabs B-08 per-mode pill-text color (block landing
   until dark-mode direction is resolved); Toast `default-toast-open` close
   bbox (mirror the gate7 B-37 block).
8. Process: `test-component` skill gains a baseline-regen reminder when a
   component `.tsx`/story/render path changes.

## Highest-risk masks (ranked)

1. **Global 2% default (308 snaps)** — budget exceeds the entire assertable
   content of small-component frames (DateField 0.38×). Silently blesses any
   single-element restyle. Fix: P1+P2.
2. **FocusLock 0.15 trio** — 57.6k px budgets; the guarded signals are ~2k px.
   Worst ratio in repo. Fix: edits 2–4.
3. **Tabs B-08 page snap** — a live fix-in-progress whose dark-mode direction
   is inverted per token defs, invisible to its own page snapshot. Fix: P3 +
   edit 7 + escalate correctness.
4. **Toast `default-toast-open`** — stale B-37 baseline is the SOLE visual proof
   (no bbox assertion unlike its gate7 siblings). Fix: regen + edit 7.
5. **React 17/18 no-op** — complete, silent non-coverage. Fix: P6 decision.
