# Playtest WANTS — pursue verdicts (streamlined)

Source: `PLAYTEST-REQUIREMENTS.md` Part 2 (36 filed asks, 26 accepts, 10 rejects
under the Q1/Q2/Q3 default-deny filter). This doc is the captain's pursue/drop
call per want, with routing. Full rationale lives in the source; one line each
here.

**Sequencing (HQ 2026-09-27): docs phase deferred.** All docs items below
(W-11, W-13, W-19, W-30, W-32, W-26, W-27; bugs B-05/B-06/B-07/B-25) are
parked until wants land + lib is productionized. The docs crew does NOT
dispatch in the bug wave; W-31's CI gate still rides packaging (process,
not docs).

## RIDES BUG CREWS (accepted via a bug — no separate work)

- W-01 shipped stylesheet story → packaging crew via B-13.
- W-26 documented consumer setup → packaging crew via B-13.
- W-27 dialog minimum-CSS recipe → docs crew via B-25.
- W-33 submenu parity → menu crew via B-32.
- W-34 working collapse → fields crew via B-31.
- W-03 dark-surface text → primitives crew via B-09 (fix IS the want).
- W-28 Menu choice items → menu crew via B-04 (build, don't delete docs).
- W-11 cancel-dismiss docs → docs crew (document/test `preventDefault` or add `dismissable`).
- W-13 Listbox.md two lines → docs crew.
- W-19 Tree selection model → docs crew.
- W-30 docs↔impl sync → docs crew (all scope except B-04, which rides menu).
- W-31 CI consumer smoke → packaging crew (kills the B-11 stale-dist class).
- W-32 styling contract docs → docs crew.

## PURSUE AFTER BUGS (accepted features, sequenced on their bug deps)

- W-02 NumberField `commitBehavior` — PURSUE after B-19 (needs the input session first).
- W-04 loud dev failure for uncompilable style props — PURSUE after B-10 root-caused.
- W-09 Presence `onExitComplete` — PURSUE after B-01 (must fire through the wedge case).
- W-15 Tabs `keepMounted` — PURSUE after unit 155 lands (Tabs dir busy).
- W-16 Tabs unmatched-`value` dev warning — PURSUE after unit 155 lands.
- W-17 Tree `*` key — PURSUE (standalone, no deps).
- W-20 Calendar custom day rendering — PURSUE after B-18 (must compose with fixed keyboard).
- W-21 `isDateUnavailable`/`firstDayOfWeek` — PURSUE after B-24 + B-17.
- W-24 Combobox `autocomplete`/`allowCustomValue`/`closeOnBlur` — PURSUE after B-21/B-22.
- W-25 NumberField `formatOptions` — PURSUE after B-19.
- W-29 Menubar coordination — PURSUE after B-27/B-32 (needs menu bugs settled).
- W-35 clamp-or-warn contract — PURSUE after B-29 (generalizes the Slider fix).

## DROP (agree with the source Q1 rejects)

- W-05 imperative value read — DROP (ref mirror is reasonable userland).
- W-06 Field label/error helpers — DROP (hand-wired twice; boilerplate, not a gap).
- W-07 default Slider `aria-valuetext` — DROP (`formatValue` exists; passing it is trivial).
- W-08 Listbox uncontrolled — DROP (consistent with controlled-only stance).
- W-10 Presence-owned `data-state` — DROP (docs pattern works; W-09 covers the edge).
- W-12 toaster follows system — DROP (`theme="dark"` is reasonable).
- W-14 Tree reveal API — DROP (ancestor walk over owned data is routine).
- W-18 imperative focus handles — DROP (role queries shipped; ugly but reasonable).
- W-22 `DateField.Range` — DROP as feature (phantom-docs half absorbed by W-30).
- W-23 `invalid`/`required` — DROP (app-land error states proven reasonable).

## Counts

13 ride bug crews · 12 pursue-after-bugs · 10 drop · 1 rewrapped (W-02 carries two
asks; W-22's docs half rides W-30). Net new crewable features after bugs: 12.
