# Combo-List Crew Log — playtest mission

Status: COMPLETE (2026-09-27)
Scope: `packages/reference-lib/src/components/Combobox` + `packages/reference-lib/src/components/Listbox` only. Overlay untouched (read-only diagnosis for B-22). No commits (captain commits).

## Verdicts

| ID | Verdict | Proof |
|---|---|---|
| B-20 stale text on Esc/blur | FIXED-in-src, regression-covered | New B-20 Esc + blur CT green; no code change needed |
| B-21 opens on mere focus | FIXED-in-src, regression-covered | New B-21 CT green (`handleFocus` already no-op) |
| B-22 dialog popup + trap escape (High) | FIXED-in-src, regression-covered | New B-22 CT green (Tab closes popup; Cancel→title wrap); no Combobox/Overlay change |
| B-02 spurious (de)selection | FIXED (code) | Guards in press/click/keydown; new CT fails pre-fix (`events→None`, exact repro), passes post-fix |
| B-34 aria-multiselectable | FIXED-in-src (LB-DOM-02 green) | No change |
| B-38 dark-mode selected bg | FIXED (code) | Standalone selected → `ui.table.row.mutedBackground` (Menu/Tree parity); new CT fails pre-fix (L=0.985), passes post-fix |
| B-36c identical onChange | FIXED (code) | `handleSelect` silent on identical; new CT fails pre-fix, passes post-fix |

## Files changed

- `Listbox/Listbox.tsx` — B-02 guards (containment + interactive-descendant in `handlePressStart`/`handleClick`/`handleKeyDown`); B-38 standalone selected wash (combobox active-highlight keeps button tokens)
- `Combobox/Combobox.tsx` — B-36 identical-value silence in `handleSelect` (text sync + dismiss still run)
- `Listbox/Listbox.story.tsx` — `RowActions` story (⋯ Popover in multi row)
- `Combobox/Combobox.story.tsx` — `DialogCombo` story (sched-shaped controlled-open dialog) + `Input` import
- `Listbox/__e2e__/Listbox.ct.spec.ts` — B-02, B-38 tests
- `Combobox/__e2e__/Combobox.ct.spec.ts` — B-20×2, B-21, B-22, B-36 tests; CB-SELECT-04 moved to changed-value commit (B-36 contract)
- `Combobox/Combobox.test.tsx` — CB-SELECT-04 unit moved to changed-value commits (B-36 contract)
- `Combobox/SPEC.md` — one-line Commit-row contract note

## Suites (React 19, this session)

- Listbox unit: 12/12 pass
- Listbox e2e: 26/27 — 1 fail is `listbox-multi-selected.png`, the INTENDED B-38 pixel change (#eef0f1→#293443 on selected rows, verified in actual PNG)
- Combobox unit: 77/77
- Combobox e2e: 70/70
- Typecheck: zero errors in Combobox/Listbox files (other errors are other crews' in-flight work)

## Flags for HQ

1. `listbox-multi-selected.png` baseline depicts the B-38 bug — needs human-gated refresh (`pnpm agentct Listbox --e2e --update-snapshots --confirm` after visual approval). Single-selection baselines depict it too but pass by the 2% tolerance; refresh the whole dir at once.
2. B-36 is a contract change: identical-value commits now silent on ALL paths (Enter/Space/click/Tab), LB-SINGLE-05 parity. Two CB-SELECT-04 tests updated (intent preserved: exactly-once, no-toggle, now on changed values). Revert path if HQ disagrees: drop the `nextVal !== value` guard, narrow to Tab/blur.
3. Flakes: CB-CLOSE-01/02 failed once under full-suite load; pass isolated + on clean re-run (surface untouched by this diff). Concurrent crews share the daemon and test-results dir; videos not retained.
4. B-22 note: clicking Cancel activates it and closes the dialog (correct app behavior); the trap repro Tabs through Cancel instead. No Overlay change was needed — src blur handling + FocusLock shards behave.

## Work log

- Opened log, read MISSIONS doc + src + sched BookingDialog repro.
- Baselines green (Listbox 25/25, Combobox 65/65) before edits.
- Implemented B-02, B-38, B-36c; added RowActions + DialogCombo stories and 7 CT tests.
- Proved B-02/B-36/B-38 fail pre-fix via stash (B-38 needed an oklch 0..1 parser fix first).
- Full suites green except the intended B-38 snapshot; CB-SELECT-04 updated for the B-36 contract; typecheck clean for scope.
