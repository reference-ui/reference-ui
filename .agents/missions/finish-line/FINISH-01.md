CLOSED
# FINISH-01 — Axe scanner halves (slice A + B shared log)

Captain closeout 2026-09-29: all 15 scanner halves verified firsthand (full r19 suite + scan on 17/18 per component) and landed per-arc (f2436d1..b48e6f8). Pre-existing reds handed to FINISH-02: Calendar 3, Menubar 18, Popover r17 PO-LAYER-01, Toast r18 TO-ENV-03, Tooltip CLOSE-01/FOCUS-03 (+r17 GROUP-01/02/03, CLOSE-03). Only captain-observed transient: 1 Toast r19 red under FINISH-02 contention, green on immediate re-run ×2.

Slices: A (NumberField, Accordion, Calendar, Combobox, Listbox, Menu, Menubar) — crew finish-01-A. B — separate crew. Append-only: never rewrite another crew's sections.

## Slice-A start (2026-09-29)
- Infra confirmed: `packages/reference-lib/playwright/axe.ts` (`expectNoAxeViolations` + `scanAxe`, defaults disable landmark-one-main/page-has-heading-one/region). Untouched per brief.
- Mount root is `#root` (`playwright/ct.ts`); Portal defaults to `document.body` → popover components (Menu/Menubar/Combobox) scan whole page (gallery holds one story), non-portal components scope `include: '#root'`.
- Order: NumberField first (unblocks FINISH-05), then Accordion, Calendar, Combobox, Listbox, Menu, Menubar.

## NumberField (slice A — DONE 2026-09-29)
- Scanner half: new `NF-A11Y-01 scan` CT test (assertion half = NF-A11Y-01..06 unit suite). Mounts labeled StepperFixture, asserts accessible name, `expectNoAxeViolations(page, { include: '#root' })`. No disables, no portals.
- Proof r19: `E2E: 58 | Passed: 58 | Failed: 0` + `Unit: passed | 131 tests`; `✔ [PASSED] react19 NF-A11Y-01 scan (817ms)` → axe: 0 violations.
- Proof majors: `E2E: 116 | Passed: 116 | Failed: 0 (react17: 58, react18: 58)`; scan passed both (`react18 ... (759ms)` quoted; r17 pass in same run).
- Resume: nothing. File: `packages/reference-lib/src/components/NumberField/__e2e__/NumberField.ct.spec.ts`.

## Accordion (slice A — DONE 2026-09-29)
- Scanner half: appended to existing `AC-A11Y-01` (KeyBoundaries mount: expanded/collapsed/disabled headers), `expectNoAxeViolations(page, { include: '#root' })`. No disables, no portals. No stale comment present.
- Proof r19: `E2E: 21 | Passed: 21 | Failed: 0` + `Unit: passed | 32 tests`.
- Proof majors: `E2E: 42 | Passed: 42 | Failed: 0 (react17: 21, react18: 21)`.
- Resume: nothing. File: `packages/reference-lib/src/components/Accordion/__e2e__/Accordion.ct.spec.ts`.

## Calendar (slice A — DONE w/ scoping + pre-existing reds 2026-09-29)
- Scanner half: new `CA-A11Y-01 scan` CT test, 7 settled states (SingleDate, BritishGrid en-GB, RtlGrid ar-AE, Constrained bounds+unavailable, OutsideMonth padded, RangeMachine pending + complete), each `include: '#root'`.
- Disposition: `aria-allowed-attr` scoped with `// AXE:` rationale — Day manages `aria-selected` on native buttons by design (CA-DAY-06 managed/stripped, pinned by assertion halves); axe rejects it on implicit button role. Raw: `axe: 1 violation(s): aria-allowed-attr [critical] ... (42 nodes)` on SingleDate (`/tmp/finish01A-calendar-scan1.txt`). All other rules run on all states.
- Proof r19: `E2E: 85 | Passed: 85 | Failed: 0` + `Unit: passed | 68 tests`.
- Proof majors: scan test `✔ react17 (4068ms)` + `✔ react18 (4069ms)` in full runs. Full-suite 17/18 NOT green due to 3 PRE-EXISTING reds, all reproduced on pristine stash (not absorbed): r17 CA-RANGE-14 (`/tmp/finish01A-calendar-r14-pristine.txt`), r18 CA-KEY-03 + CA-DAY-08 (`/tmp/finish01A-calendar-r18-pristine.txt`) — all timeout-shaped (~5.8s), FINISH-02 owns.
- Resume: nothing for FINISH-01. File: `packages/reference-lib/src/components/Calendar/__e2e__/Calendar.ct.spec.ts`.

## Slice-B start (2026-09-29)
- Crew FINISH-01-B. Infra confirmed: `packages/reference-lib/playwright/axe.ts` untouched per brief.
- Scope rule: non-portal comps `include: '#root'`; Popover/Tooltip portal to document.body (via Overlay.Portal → Portal default) so whole-page scan (gallery holds one story). Toast host renders in place (ToastSystem, no portal) → `#root`.
- Order: Popover, Slider, Splitter, Switch, Tabs, Toast, Tooltip, Tree.

## Popover (slice B — DONE w/ scoping + pre-existing red 2026-09-29)
- Scanner half: new `PO-A11Y-01 scan` CT test (assertion half = PO-DOM-01/02 per SPEC coverage line). Mounts Basic, opens popover, whole-page scan (Content portals to document.body; gallery holds one story).
- Disposition: `aria-dialog-name` scoped with `// AXE:` rationale — dialog name is application-owned (Content defaults role=dialog, passes aria-label/aria-labelledby through, must not invent a name); Basic deliberately renders unnamed content. Raw: `aria-dialog-name [serious]` on #popover-content-1. All other rules run.
- Proof r19 (two-in-a-row): `E2E: 19 | Passed: 19 | Failed: 0` + `Unit: passed | 20 tests` (`/tmp/finish01B-popover-r19.txt`, `/tmp/finish01B-popover-r19b.txt`); `✔ [PASSED] react19 PO-A11Y-01 scan (936ms)` → axe: 0 violations.
- Proof majors: scan `✔ react17 (863ms)` + `✔ react18 (912ms)`. Full suite 37/38: r17 PO-LAYER-01 red is PRE-EXISTING — reproduced isolated on pristine stash (`/tmp/finish01B-popover-layer17-pristine.txt`: `E2E: 1 | Passed: 0 | Failed: 1`, dialog-content not found), not absorbed. FINISH-02 owns.
- Resume: nothing for FINISH-01. File: `packages/reference-lib/src/components/Popover/__e2e__/Popover.ct.spec.ts`.

## Slider (slice B — DONE 2026-09-29)
- Scanner half: appended to existing `SD-A11Y-01` (A11yFixture: scalar, range, disabled, vertical, RTL thumbs), `expectNoAxeViolations(page, { include: '#root' })`. No disables, no portals. No stale comment present.
- Proof r19 (two-in-a-row): `E2E: 36 | Passed: 36 | Failed: 0` + `Unit: passed | 68 tests` (`/tmp/finish01B-slider-r19.txt`, `/tmp/finish01B-slider-r19b.txt`); `✔ [PASSED] react19 SD-A11Y-01 (2810ms)` → axe: 0 violations.
- Proof majors: `E2E: 72 | Passed: 72 | Failed: 0 (react17: 36, react18: 36)`; scan `✔ react17 (1293ms)` + `✔ react18 (1150ms)`.
- Resume: nothing. File: `packages/reference-lib/src/components/Slider/__e2e__/Slider.ct.spec.ts`.

## Splitter (slice B — DONE w/ scoping 2026-09-29)
- Scanner half: appended to existing `SP-A11Y-01` (A11ySweep: horizontal, vertical, three, mixed, collapsed), `include: '#root'`. Replaced the stale "No axe-style checker" comment with assertion-half wording. No portals.
- Disposition: `scrollable-region-focusable` scoped with `// AXE:` rationale — Panel sets overflow:auto by design, so overflowing app content reads scrollable; the collapsed "Sidebar" text overflows its 5% panel by construction. Keyboard reach of panel content is app-content-owned; auto-tabindex per panel needs a design call. Raw: `scrollable-region-focusable [serious]` (1 node, `/tmp/finish01B-splitter-r19.txt`). All other rules run on all 5 layouts.
- Proof r19 (two-in-a-row): `E2E: 79 | Passed: 79 | Failed: 0` + `Unit: passed | 34 tests` (`/tmp/finish01B-splitter-r19b.txt`, `/tmp/finish01B-splitter-r19c.txt`); `✔ [PASSED] react19 SP-A11Y-01 (2813ms)` → axe: 0 violations.
- Proof majors: `E2E: 158 | Passed: 158 | Failed: 0 (react17: 79, react18: 79)`; scan `✔ react17 (1266ms)` + `✔ react18 (1351ms)`.
- Resume: nothing. File: `packages/reference-lib/src/components/Splitter/__e2e__/Splitter.ct.spec.ts`.

## Combobox (slice A — DONE w/ scoping 2026-09-29)
- Scanner half: axe scans added to existing `CB-A11Y-01 scan` loop (closed + open per shape, 8 shapes); stale "no axe in repo" comments replaced in both structural + scan tests. Whole-page scope (popover portals to body).
- Dispositions (`// AXE:`): (1) `label` + `aria-input-field-name` scoped — names application-owned (CB-SELECT-01 parity, scanA11y docstring); open-popover unlabeled input is that line. Raw: `aria-input-field-name [serious] ... .reference-ui__flex-dir_column` (`/tmp/finish01A-combobox-scan1.txt`). (2) `button-name` scoped — select-only Trigger is native button + role=combobox (frozen CB-SELECT-06), axe misfires despite "Bravo" text (probe `/tmp/finish01A-combobox-probe.txt`). (3) EmptyPopoverLog OPEN axe-scan narrowed out — Combobox.Empty (= ListboxEmpty role=status) inside role=listbox trips `aria-required-children`; Listbox-owned surface, `exclude` does not suppress parent-side rule (probe `/tmp/finish01A-combobox-probe2.txt`). Shape keeps closed axe-scan + both relationship scans; rule active elsewhere.
- Proof r19: `E2E: 105 | Passed: 105 | Failed: 0` + `Unit: passed | 94 tests`.
- Proof majors: `E2E: 210 | Passed: 210 | Failed: 0 (react17: 105, react18: 105)` (`/tmp/finish01A-combobox-majors.txt`).
- Resume: nothing. File: `packages/reference-lib/src/components/Combobox/__e2e__/Combobox.ct.spec.ts`.

## Listbox (slice A — DONE 2026-09-29)
- Scanner half: appended to existing `LB-A11Y-01` (A11yShapes: single/multiple/disabled/empty/horizontal/virtualized), `expectNoAxeViolations(page, { include: '#root' })`. Stale "no axe" NOTE deleted. No disables. (No Listbox story renders ListboxEmpty, so the Combobox-deferred empty-node disposition needs no Listbox rule change.)
- Proof r19: `E2E: 72 | Passed: 72 | Failed: 0` + `Unit: passed | 12 tests`.
- Proof majors: `E2E: 144 | Passed: 144 | Failed: 0 (react17: 72, react18: 72)`; scan `✔ r17 (12598ms) ✔ r18 (12842ms)`. First majors run had 1 transient r18 red under contention (concurrent Combobox majors in same tree), green on re-run, nothing absorbed.
- Resume: nothing. File: `packages/reference-lib/src/components/Listbox/__e2e__/Listbox.ct.spec.ts`.

## Switch (slice B — DONE 2026-09-29)
- Scanner half: appended to existing `SW-A11Y-01` (beforeEach ParityFixture mount; asserts section-a11y-01's 5 switches), narrowed `include: '[data-testid="section-a11y-01"]'` with rationale — the shared mount holds ~20 sections owned by other cases (several deliberately unnamed), so #root-scoping would adjudicate other cases' fixtures. No disables, no portals. No stale comment present.
- Proof r19 (two-in-a-row): `E2E: 22 | Passed: 22 | Failed: 0` + `Unit: passed | 9 tests` (`/tmp/finish01B-switch-r19.txt`, `/tmp/finish01B-switch-r19b.txt`); `✔ [PASSED] react19 SW-A11Y-01 (900ms)` → axe: 0 violations.
- Proof majors: `E2E: 44 | Passed: 44 | Failed: 0 (react17: 22, react18: 22)`; scan `✔ react17 (881ms)` + `✔ react18 (880ms)`.
- Resume: nothing. File: `packages/reference-lib/src/components/Switch/__e2e__/Switch.ct.spec.ts`.

## Tabs (slice B — DONE 2026-09-29)
- Scanner half: appended to existing `TB-A11Y-01` (A11yMatrix: horizontal, vertical, one-disabled, all-disabled in settled states), `expectNoAxeViolations(page, { include: '#root' })`. No disables, no portals. No stale comment present.
- Proof r19 (two-in-a-row): `E2E: 26 | Passed: 26 | Failed: 0` + `Unit: passed | 62 tests` (`/tmp/finish01B-tabs-r19.txt`, `/tmp/finish01B-tabs-r19b.txt`); `✔ [PASSED] react19 TB-A11Y-01 (8682ms)` → axe: 0 violations.
- Proof majors: `E2E: 52 | Passed: 52 | Failed: 0 (react17: 26, react18: 26)`; scan `✔ react17 (9569ms)` + `✔ react18 (9332ms)`.
- Resume: nothing. File: `packages/reference-lib/src/components/Tabs/__e2e__/Tabs.ct.spec.ts`.

## Menu (slice A — DONE 2026-09-29)
- Scanner half: open + closed `expectNoAxeViolations(page)` added to existing `MN-A11Y-01` (Parity mount). Whole-page scope (content portals to body). Zero disables.
- Disposition: fixed story labeling — `aria-label="Actions"` on Parity `<Popover.Content>` (dialog name is app-owned; Popover passes it through; same convention as Combobox `aria-label="Results"`). Raw before fix: `aria-dialog-name [serious] ... #popover-content-1` (`/tmp/finish01A-menu-scan1.txt`).
- Proof r19: `E2E: 92 | Passed: 92 | Failed: 0` + `Unit: passed | 43 tests`.
- Proof majors: `E2E: 184 | Passed: 184 | Failed: 0 (react17: 92, react18: 92)`.
- Resume: nothing. Files: `Menu/__e2e__/Menu.ct.spec.ts`, `Menu/Menu.story.tsx` (1 attr).

## Menubar (slice A — DONE w/ pre-existing reds 2026-09-29)
- Scanner half: open + closed `expectNoAxeViolations(page)` added to existing `MB-A11Y-01` (Basic mount). Whole-page scope. Zero disables.
- Disposition: fixed story labeling — `aria-label` File/Edit/View on Basic `<Menubar.Content>` ×3 (passthrough to Popover.Content confirmed). Raw before fix: `aria-dialog-name [serious]` (`/tmp/finish01A-menubar-scan1.txt`).
- Proof r19: `E2E: 23 | Passed: 23 | Failed: 0` + `Unit: passed | 20 tests`.
- Proof majors: scan test `✔ react17 (1064ms)` + `✔ react18 (1081ms)` in full runs. Full-suite 17/18 NOT green: 18 PRE-EXISTING reds (9/major: MB-DOM-01, MB-KEY-02..06, MB-KEY-09, MB-FOCUS-01, MB-RTL-01 — all focus/keyboard, timeout-shaped ~5.5-7s), reproduced on pristine stash for sampled MB-DOM-01 + MB-KEY-02 (`/tmp/finish01A-menubar-pristine.txt`); r19 fully green WITH the story edit, proving it benign. FINISH-02 owns.
- Resume: nothing for FINISH-01. Files: `Menubar/__e2e__/Menubar.ct.spec.ts`, `Menubar/Menubar.story.tsx` (3 attrs).

## Slice-A close (2026-09-29)
All 7 scanner halves green or explicitly scoped on 17/18/19. Full-suite green on 19 for all 7; 17/18 full-green except pre-existing reds (Calendar 3, Menubar 18 — all pristine-reproduced, FINISH-02 territory, nothing absorbed). `playwright/axe.ts` untouched. Slice-A crew never committed, per crew law.

## Toast (slice B — DONE w/ narrowing + pre-existing red 2026-09-29)
- Scanner half: appended to existing `TO-A11Y-01` (Harden: all positions, interactive toast, both announcers, open modal), `include: '#root'`, `exclude: '[data-testid="toast-input"]'` with rationale — the excluded node is app-authored custom-toast content (toast.custom renders whatever the app passes; the story's raw input carries no label or authored colors), so label/contrast stay covered on every component-owned node. No disableRules, no portals. No stale comment present.
- Disposition: narrowing, not a disable. Raw: `color-contrast [serious]` + `label [critical]`, both on input[data-testid="toast-input"] only (`/tmp/finish01B-toast-r19.txt`).
- Proof r19 (two-in-a-row): `E2E: 60 | Passed: 60 | Failed: 0` + `Unit: passed | 52 tests` (`/tmp/finish01B-toast-r19b.txt`, `/tmp/finish01B-toast-r19c.txt`); `✔ [PASSED] react19 TO-A11Y-01 (967ms)` → axe: 0 violations.
- Proof majors: scan `✔ react17 (1035ms)` + `✔ react18 (1101ms)`. Full suite 119/120: r18 TO-ENV-03 red is PRE-EXISTING — reproduced isolated on pristine stash (`/tmp/finish01B-toast-env03-18-pristine.txt`: r18 0/1, shadow-app not found), not absorbed. FINISH-02 owns.
- Resume: nothing for FINISH-01. File: `packages/reference-lib/src/components/Toast/__e2e__/Toast.ct.spec.ts`.

## Tooltip (slice B — DONE w/ pre-existing reds 2026-09-29)
- Scanner half: new `TT-A11Y-01 scan` CT test (assertion half = TT-DOM-01/02 role/describedby/content checks). Mounts Basic, honest keyboard Tab opens Content, whole-page scan (Content portals to document.body; gallery holds one story). No disables, no stale comment (no prior CT A11Y test; SPEC TT-A11Y-01 unchecked).
- Proof scan (two-in-a-row r19 + majors): `✔ [PASSED] react19 TT-A11Y-01 scan (974ms)` in full run + isolated `E2E: 1 | Passed: 1` (`/tmp/finish01B-tooltip-scan-r19b.txt`) → axe: 0 violations; majors `✔ react17 (724ms)` + `✔ react18 (985ms)`.
- Full-suite reds all PRE-EXISTING (additive test+import cannot affect them; reproduced on pristine stash, not absorbed): r19 TT-CLOSE-01 + TT-FOCUS-03 (`/tmp/finish01B-tooltip-reds-pristine.txt`: 0/2, nested-content timeouts); r17 TT-GROUP-01/02/03 + TT-CLOSE-01 + TT-FOCUS-03 + TT-CLOSE-03 (`/tmp/finish01B-tooltip-r17reds-pristine.txt`: 0/6); r18 TT-CLOSE-01 + TT-FOCUS-03 (same pair/shape as r19). FINISH-02 owns.
- Resume: nothing for FINISH-01. File: `packages/reference-lib/src/components/Tooltip/__e2e__/Tooltip.ct.spec.ts`.

## Tree (slice B — DONE 2026-09-29)
- Scanner half: appended to existing `TR-A11Y-01` (Parity mount, expanded multi-branch settled state), `expectNoAxeViolations(page, { include: '#root' })`. No disables, no portals. No stale comment present.
- Proof r19: full-suite `E2E: 67 | Passed: 67 | Failed: 0` + `Unit: passed | 7 tests` (`/tmp/finish01B-tree-r19b.txt`); scan `✔ react19 TR-A11Y-01 (12467ms)` → axe: 0 violations. Scan two-in-a-row: also `✔ (13736ms)` in r19c + `✔ (29971ms)` in r19a.
- Proof majors: `E2E: 134 | Passed: 134 | Failed: 0 (react17: 67, react18: 67)`; scan `✔ react17 (12752ms)` + `✔ react18 (12384ms)`.
- Transients (not absorbed, all re-run green): r19a 7× TIMEDOUT TR-DOM-01/03/05/08 + TR-TYPE-03/04/05 → isolated `E2E: 7 | Passed: 7` (`/tmp/finish01B-tree-reds-iso.txt`); r19c 9× mount-setup TIMEDOUT + TR-KEY-01 gallery fetch flake (`Failed to fetch dynamically imported module ... Tree.story.tsx`) → TR-KEY-01 isolated `E2E: 1 | Passed: 1` (`/tmp/finish01B-tree-key01-iso.txt`). Contention-shaped throughout (scan itself took 12–30s per run).
- Resume: nothing. File: `packages/reference-lib/src/components/Tree/__e2e__/Tree.ct.spec.ts`.

## Slice-B close (2026-09-29)
- All 8 scanner halves green or explicitly scoped on 17/18/19: Popover, Slider, Splitter, Switch, Tabs, Toast, Tooltip, Tree. Full-suite green on 19 for 7 (all except Tooltip); pre-existing reds documented with pristine-stash repro for Popover r17 PO-LAYER-01, Toast r18 TO-ENV-03, Tooltip TT-CLOSE-01/TT-FOCUS-03 (+ r17 GROUP-01/02/03, CLOSE-03) — all FINISH-02 territory, nothing absorbed. `playwright/axe.ts` untouched. Slice-B crew never committed, per crew law.
