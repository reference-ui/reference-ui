# wants-combobox crew log — W-24

Status: **COMPLETE** (2026-09-27, branch `reference-system`, no commits — captain commits)

Scope kept: only `packages/reference-lib/src/components/Combobox/*` + this log.
Deps: B-21/B-22 landed (commit `4df9bb4d3`).

## Shipped

**`autocomplete` += `'inline'`** (`combobox-context.ts`, `autocomplete.ts`, `Combobox.tsx`)
- `completesInline(mode)` gate: `inline` + `both` complete the active label with
  suffix-only selection; `none`/`list` leave typed text alone. `aria-autocomplete`
  mirrors the prop verbatim (`inline` is a valid ARIA 1.2 token).
- New catalog case `CB-MODE-08` (TESTS.md + SPEC `[x]`).

**`allowCustomValue`** (default `false`, Ark-exact name)
- Single decision point `resolveUnmatchedText()` (Zag `isCustomValue` rule:
  `inputValue !== valueAsString`): exact text commits (empty → `null`, never
  normalized); `false` restores committed text. Silent when already committed;
  no text callback on the custom path (input already shows the text); B-36
  identical-value silence; inert under select-only and two-authority conflict.
- Wired into Enter (no mounted active), Tab (no keyboard-active), blur, and
  outside-press. Active option always wins. Escape always reverts (TESTS freeze).
- Open Enter now always resolves the session and always `preventDefault`s while
  open (uniform RAC "prevent default on Enter if isOpen", CB-COMMIT-08's ported
  rule). Closed Enter stays native. Zag's custom branch skips prevention only
  because Zag tolerates rather than commits custom text there — ours commits,
  so the form must not also fire (deliberate, documented in code).
- Proves `CB-CUSTOM-01`, `CB-CUSTOM-02`, `CB-COMMIT-02` (SPEC `[x]`).

**`closeOnBlur`** (default `true`, kept deliberately — see flags)
- Blur/outside-press now resolve via `resolveUnmatchedText()` (custom commit
  when allowed, else revert) + dismiss. Unchanged for `false`.
- In-dialog proof: existing B-22 Tab test green; added unmatched pointer-blur
  in dialog (revert + close + backward trap wrap, dialog stays open) and
  `closeOnBlur={false}` in dialog (open + text preserved across blur, Tab
  traversal wraps with popup open, never lands on an option).

## Contract-change decision (surfaced)

- Existing unit `CB-NAV-07` pinned open-Enter-with-stale-active as fully native
  (`preventDefault === false`). Signed-off `CB-COMMIT-02` now specifies that
  exact input as revert + dismiss (a handled key → prevented, per the ported
  RAC rule). TESTS.md CB-NAV-07 only requires *"an otherwise native editing
  key"* to stay native — Enter-while-open is not in that class post-COMMIT-02
  (even Zag prevents there: fixture text `bravo` ≠ label `Bravo` = willBeRejected).
  Updated the test to assert native behavior on Backspace and no-commit-to-removed
  on Enter. All NAV-07-meaningful assertions preserved.

## Flags for HQ

1. **`closeOnBlur` NO-TRACE verdict: KEEP the boolean deliberately.** The
   dialog-blur case can NOT ride existing outside-interaction handlers: Tab-blur
   is a focus event invisible to outside-press accounting, and Tab-inside-dialog
   is inside the dialog layer so the layer system never fires. The prop is
   load-bearing both ways (new `DialogComboPersist` CT pins the `false` half
   in-dialog). Outside-press already rides Overlay's accounting via
   `handleOutsidePress`; `closeOnBlur=false` consistently disables both.
2. **`inline` vs `both` share completion mechanics** (only the mirrored ARIA
   token differs). The list half is mode-independent in this lib (popup opens
   on edits in every mode; filtering is app-owned), so a behavioral split
   (e.g. inline suppressing the popup) would need unmounted matching machinery
   the contract never asked for. Revisit if a consumer needs inline-without-list.
3. **Tab is a key, not blur**: Tab keeps key semantics (commit/resolve + close)
   regardless of `closeOnBlur`; `closeOnBlur=false` governs the blur-event path
   only (CB-REVERT-07 pins programmatic blur). Changing Tab-under-`false` to
   fully native is a separate design call (commit-or-not question) — not taken.
4. **Custom + id/label split**: blur/Enter commits the RAW input string even if
   it equals an option's label but not its value (no normalization, per
   CB-CUSTOM-01). Consumers with id≠label who filter-to-empty on label text get
   label-as-value. Documented behavior, worth one docs line in the docs phase.

## Verification (test-component, React 19)

- `pnpm --dir packages/reference-lib sync` first (CSS 256KB).
- Unit: **84/84 pass** (`pnpm agentct Combobox --unit`), incl. 6 new W-24 pins.
- E2E: **77/77 pass** (`pnpm agentct Combobox --e2e`, React 19), incl. 7 new
  specs + extended CB-DOM-02/CB-MODE-06. Zero snapshot drift (no `snap()` added;
  logic-only change). Screenshots spot-checked: CUSTOM-01 end state
  (`change:Zen Den` + round-trip + dismiss) and dialog revert end state.
- Videos: `.webm` (unviewable here; no motion aspect to this change).
- `tsc --noEmit`: zero Combobox errors (NumberField/Slot errors are other crews').
- Env notes (not code): `@reference-ui/icons` dist was unbuilt (ran repo
  `build:deps`); generated dirs (`.reference-ui`, icons `dist`) vanished
  mid-session, rebuilt; first two e2e runs flaked on gallery
  `Failed to fetch dynamically imported module` under load (31→11→0 fails).

## Files changed

- `combobox-context.ts` — `ComboboxAutocomplete` += `'inline'`; context +=
  `allowCustomValue`, `resolveUnmatchedText`.
- `autocomplete.ts` — `completesInline()` gate.
- `Combobox.tsx` — `allowCustomValue` prop; `getCommittedLabel` /
  `resolveUnmatchedText`; Enter/Tab/blur/outside-press wiring; inline display.
- `Combobox.story.tsx` — `LogCombobox` += `filter`/`allowCustomValue`,
  custom round-trip in `onChange`; new `InlineLog`, `CustomLog`, `NoCustomLog`,
  `DialogComboPersist`; mode-switch `inline` button.
- `Combobox.test.tsx` — 6 new unit pins; CB-NAV-07 key-choice update (above).
- `__e2e__/Combobox.ct.spec.ts` — 7 new specs; CB-DOM-02 + CB-MODE-06 extended.
- `Combobox.md`, `TESTS.md` (CB-MODE-08), `SPEC.md` (COMMIT-02/CUSTOM-01/02/
  MODE-08 proven; counts 62/97, 84 unit, 77 CT).
