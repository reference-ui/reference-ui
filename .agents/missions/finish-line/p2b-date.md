# P2B date chain — report (COMPLETE)

Date: 2026-09-28. Crew: finish-line date. Chain order: DateField → Calendar → Field.
No commits (captain commits). HQ calls proceeded on maintainer takes — flagged with [HQ].

## DateField: 45/64 → 60/64 ✅ (code + docs done; full-suite green pending)

Landed PATCHES #2, PATCHES #5, FEATURES #2. All listed scope complete.

### Stepping (PATCHES #2) — `DF-KEY-01/02/03/04/07` ✅
- Wired ArrowUp/Down (±1, Shift = ±10) per caret segment with Gregorian carry;
  each step commits one ISO (`DateField.tsx` `handleKeyDown`).
- [HQ] Step landing outside min/max or on an unavailable date locks out
  (no publish, text kept) — Calendar-disabled parity. Contract was silent.
- `DF-KEY-05/06` no-op proofs still green (null/incomplete, disabled/read-only).
- Proofs: CT `DF-KEY-01/04/07` (EngineFixture, en-GB) + unit `DF-KEY-02/03`
  (new `DateField.step.test.tsx`, happy-dom + createRoot per TESTS `[unit]` law).

### Submit/reset (PATCHES #5) — `DF-FRM-03/05` ✅
- Form observers: failed boundary blocks until resolution; dirty submit
  processes once then blocks for explicit retry; reset reformats both… (single:
  the input) without callback; capture-phase app veto leaves session intact.
  Mirrors NumberField NF-FORM-06/07/08 rules text (NumberField itself has no
  implementation — all `NF-FORM-*` still `[ ]`).
- New keystroke clears a failed boundary (fresh session = documented resolution).
- Native `form.reset()` mutates the hidden input behind React's tracker, so the
  hidden input remounts per reset-epoch (canonical serialization preserved).
- Proofs: CT `DF-FRM-03/05` on new `SubmitResetFixture` (submit observed via
  `defaultPrevented` in the app handler — DateField's native form listener
  lands before React root listeners).

### Range namespace (FEATURES #2) — `DF-RANGE-01..06`, `DF-COMP-05/06` ✅
- New `DateFieldRange.tsx` (~1150 lines): `DateField.Range/Start/End`, two
  endpoint dirty sessions, draft/committed snapshots, pending-in-draft Calendar
  anchors, focused-endpoint pane sync, split (`{start,end}`) or shared (string)
  form names, per-endpoint stepping + submit/reset.
- [HQ] Folded picker applies on completion — no Apply button; `canApply=false`
  blocks commit, never close. (FEATURES #2 open choice; took the
  apply-on-selection shape.)
- [HQ] Pending Calendar anchor stays in the draft (never publishes); the anchor
  click restarts the draft and clears the end buffer so two clicks always
  complete. Only complete ranges and `null` reach `onChange`.
- [HQ] Accepted live echo reformats both endpoints (nothing pending when draft
  and committed agree) — simpler than single-field keystroke preservation.
- [HQ] Range root seeds only bezel + shared event handlers to both endpoints;
  per-endpoint Part-Resolution Law is explicit-props vs managed.
- Shared slot context extracted to `DateFieldSlots.ts` so `Trigger`/`Picker`
  unfold under both hosts (behavior-neutral move).
- `DateField.Calendar` is now range-aware (binds `mode="range"` + draft +
  pane under Range; single-host path unchanged) and its managed props are
  omittable (`DateFieldCalendarProps` — needed for `<DateField.Calendar />`).
- Observables: `data-can-apply`, `data-active-endpoint`,
  `data-reference-date-endpoint`.
- Proofs: 8 CT titles on `RangeFixture` / `UnfoldedRangeFixture` /
  `SingleUnfoldedFixture` + 1 Range guard unit test in `DateField.test.tsx`.

### Not in scope (still open)
- `DF-CAL-04` (PATCHES #4 slotted binding incl. `isDateUnavailable` threading
  for the single alias) and `DF-ENV-02` (PATCHES #8 RTL). `DF-CAL-04`'s fixture
  needs the Calendar Day-parts renderer — deliberately left until the Calendar
  leg lands.
- Book stories for Range (view-story showcase) — not required for proof.

### Verification
- `pnpm agentct DateField`: **57/57 CT + 33/33 unit green** (final clean pass
  after the Calendar leg; 8 frozen snapshots unmodified).
- Mid-mission full runs flaked 1–17 mount errors ("Failed to fetch dynamically
  imported module") under shared-Vite contention with the concurrent Calendar
  leg — zero assertion failures; resolved by re-running clean.

## Calendar: 78/132 → 111/132 ✅ (delegated crew; verified)

Finish-line calendar crew (detail: `.agents/missions/finish-line/p2b-calendar.md`).
Landed FEATURES #5 (Weekdays/Days/Day + exact 10-field render state +
CA-DAY-08..11 diagnostics), FEATURES #9 (preview machine + Tab-commit,
CA-RANGE-01..16), CA-VIEW-13 first fixture (per-part defaulting at Calendar
and Grid level), PATCHES #1 ports (CA-DAY-13 SSR/hydration, CA-DAY-14
StrictMode 17/18/19, CA-ENV-03 shadow, CA-ENV-04 chromium) + CA-KEY-09 bonus.
New `[x]` (33): CA-DAY-01..14, CA-RANGE-01..16, CA-ENV-03/04, CA-KEY-09.
- [HQ] Tab-commit (not abandon); exactness diagnostic kept; per-part
  defaulting (reverses SPEC's `children ?? defaults` note); pending shape
  already `{start,end:null}` — no change needed.
- Deliberate frozen-visuals split: `selected`/`aria-selected`/`data-in-range`
  are range-inclusive, but `data-selected` + paint stay endpoint/interior-only
  so the 7 baselines pass unmodified. `aria-selected` on both td and button
  (W-20 compat). Honest coverage notes (chromium-only DAY-07/ENV-04, synthetic
  touch CA-RANGE-11) in the leg report.
- No `matrix/` dir exists — SPEC's `matrix/...` paths are stale; colocated
  suites ARE the port.
- First attempt died on model-stream idle timeout (zero file changes);
  relaunched clean.
- Verification (crew): `pnpm agentct Calendar` **84 CT + 68 unit green**,
  `pnpm agentct Calendar --react all -g "CA-DAY-14"` green on 17/18/19.

## Field: 19/20 hosted proofs (code done; CT [PENDING])

- PATCHES #2: extended `FI-COMP-02` with hosted typing/publish (fill ISO +
  Enter → `Value: 2026-10-15`, wrap/trigger hold, Calendar portalled) and added
  `FI-COMP-02 (range bezel)` (one bezel, two embedded endpoints, typing
  publishes, range Calendar portalled). No `Field.tsx` change.
- PATCHES #3: extended `FI-COMP-04` with hosted commit (option Bob → one scalar
  `onChange("Bob")`, app chip appears, input cleared, no Combobox token nodes)
  and remove (chip Alice → gone, `onChange` silent). Dependency satisfied:
  Combobox `CB-COMMIT-01..09` / `CB-SELECT-*` all `[x]`, and Combobox SPEC
  lists `FI-COMP-04` commit/remove as handed-off cross-owned proofs.
- Ring-on-opener still waits on the `FI-CSS-06` theme fix (not this mission).
- Verification: targeted `-g "FI-COMP-02|FI-COMP-04"` 3/3 green; full
  `pnpm agentct Field` **105/105 green** (substring match: Field 21 +
  DateField 57 + NumberField 27) + unit green.

## Files changed (date crew, no commits)

- `packages/reference-lib/src/components/DateField/DateField.tsx` (stepping,
  submit/reset, slot-context import, Range statics, range-aware Calendar alias)
- `packages/reference-lib/src/components/DateField/DateFieldRange.tsx` (new)
- `packages/reference-lib/src/components/DateField/DateFieldSlots.ts` (new)
- `packages/reference-lib/src/components/DateField/index.ts` (barrel)
- `packages/reference-lib/src/components/DateField/DateField.step.test.tsx` (new)
- `packages/reference-lib/src/components/DateField/DateField.test.tsx` (Range guards)
- `packages/reference-lib/src/components/DateField/DateField.story.tsx` (4 fixtures)
- `packages/reference-lib/src/components/DateField/__e2e__/DateField.ct.spec.ts` (+13 titles)
- `packages/reference-lib/src/components/DateField/SPEC.md`,
  `TESTS.md` (COMP-05/06 specified), `DateField.md` (takes pinned)
- `packages/reference-lib/src/components/Field/Field.story.tsx` (changes spy,
  RangeHostedFixture)
- `packages/reference-lib/src/components/Field/__e2e__/Field.ct.spec.ts`
  (COMP-02 extended + range title, COMP-04 extended)
- `packages/reference-lib/src/components/Field/SPEC.md`
- `packages/reference-lib/src/components/Calendar/*` (calendar crew — see
  p2b-calendar.md)

## Tree-state note for the captain

Neither crew committed (per instructions). Exception outside our control:
P2C commit `043342219` swept working-tree `Field/Field.story.tsx`, which by
then contained our P2B additions (Combobox changes spy + `RangeHostedFixture`)
alongside P2C's own `NumberField.Group` fixture updates — one mixed commit.
Our content is intact and verified green in place; everything else listed
above remains uncommitted for the captain.
