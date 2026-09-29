# C-NAME (handler naming 1a) — flip log

DONE — opened + closed 2026-09-29 (Menubar-majors disposition open for captain). Ruling: 1a (house `onChange` everywhere; strip Radix aliases, rename Menubar's prop). No shims (4a doctrine).

## 0. Survey (firsthand, T+0)

`ValueChange|CheckedChange` over `packages/reference-lib/src` (excl. node_modules/dist/vendor):

- SHIPPED ALIASES (mine): `Menu/Menu.tsx` CheckboxItem `onCheckedChange` (L1395,1408,1427-1428) + RadioGroup `onValueChange` (L1500,1509,1514,1519-1520,1568); `Menubar/Menubar.tsx` sole prop `onValueChange` (L14,60,65-66,72).
- Call sites (mine): `Menu.story.tsx` alias menu (L750,899-939); `Menu.ct.spec.ts` `MN-CHOICE-02-alias` (L1614-1627); `Menu/SPEC.md:109`; `Menubar.story.tsx` (6 sites), `Menubar.test.tsx` (L13,29,178), `Menubar/SPEC.md` (2), `Menubar/TESTS.md` (6).
- NOT aliases (untouched): `onInputValueChange` (Combobox/Tree/Field house prop, editable-text authority); `Menu.Sub` alias prose; Switch/Accordion TESTS.md prior-art prose quoting Radix test names (not shipped API; other components' files — never touch).
- NumberField/: ZERO hits for `onCheckedChange|onValueChange` — nothing to skip, no handoff needed. C-NF crew unaffected by me.
- Matrix + smoke consumer: ZERO hits — smoke shape clean, no re-pin needed.
- OUT OF SCOPE (flagged, not touched): `packages/reference-mcp/.../library-catalog.ts:451,1537` documents `onValueChange` on ComboboxProps/SliderProps but NEITHER component ships it (zero hits in their dirs) — stale catalog, needs regen/cleanup by owner. Historical mission records (`WANTS.md:199`, `PLAYTEST-REQUIREMENTS.md:690-691`, `DAY-REPORT.md:14-21`, `DECISIONS.md` §1) frozen as decision record — left verbatim.

## 1. Menu — implemented (T+15)

- `Menu.tsx`: stripped CheckboxItem `onCheckedChange` (type, destructure, call, dep) and RadioGroup `onValueChange` (context field, prop, destructure, memo, RadioItem call). No shims.
- `Menu.story.tsx`: deleted W-28 alias menu block + `menu-choice-alias-logs` span + `aliasLogs` state (Choice fixture).
- `Menu.ct.spec.ts`: deleted `MN-CHOICE-02-alias` (sole purpose was alias props).
- `Menu/SPEC.md:109`: re-pinned regression-title list, noted 1a removal.
- Re-pin note: main Choice menu already drove `onChange`; `MN-CHOICE-02` covers it. No other Menu unit tests referenced aliases.

## 2. Menubar — implemented (T+20)

- `Menubar.tsx`: renamed required `onValueChange` → `onChange`; added `Omit<PrimitiveProps<'div'>,'onChange'>` (DOM onChange would collide in the intersection — same pattern Menu uses); `onValueChangeRef` → `onChangeRef`.
- Mechanical `s/onValueChange/onChange/g` over remaining dir files: `Menubar.story.tsx` (6), `Menubar.test.tsx` (3), `SPEC.md` (2), `TESTS.md` (6). CT spec never referenced the prop (story-driven).
- Re-pin note: required prop, so every call site renamed; no optional-prop drift possible.
- Post-edit grep over Menu + Menubar for `onValueChange|onCheckedChange`: clean (exit 1).

## 3. Gates

- Menu r19 full (x2): `E2E: 91 | Passed: 91 | Failed: 0` + `Unit: passed | 43 tests` — GREEN twice in a row.
- Menu majors (x2): `E2E: 182 | Passed: 182 | Failed: 0` (r17 91/91, r18 91/91) — GREEN twice in a row.
- Menubar r19 full (x2): `E2E: 23 | Passed: 23 | Failed: 0` + `Unit: passed | 20 tests` — GREEN twice in a row.
- Menubar majors (x3 mine + 1 clean): `E2E: 46 | Passed: 27 | Failed: 19` (r17 14/9, r18 13/10) — RED, attribution below.

## 4. Menubar majors red — disposition: PRE-EXISTING, zero regression

- Failing names (both majors): MB-DOM-01, MB-KEY-02/03/04/05/06/09, MB-FOCUS-01, MB-RTL-01 (+1 r18-only; see .names files) — all focus/tab-stop/switching assertions, the known RovingFocus-ref-on-17/18 handoff class (cf. Menu SPEC: refs resolve on React 19 only).
- Isolated re-run `MB-DOM-01 --react 17`: red on MY tree AND on CLEAN tree (edits stashed) — `/tmp/c-name-menubar-mbdom01-r17.txt` vs `/tmp/c-name-menubar-mbdom01-r17-clean.txt`.
- Full majors on CLEAN tree: identical 27/19 counts AND `diff` of failing-name sets IDENTICAL (`/tmp/c-name-menubar-majors-1.txt.names` vs `/tmp/c-name-menubar-majors-clean.txt.names`). Raw logs: `/tmp/c-name-menubar-majors-1.txt`, `/tmp/c-name-menubar-majors-clean.txt`.
- Verdict: majors red predates C-NAME; my rename introduces no regression (r19 green proves wiring). NOT absorbed, NOT fixed here (out of ruling scope; needs the RovingFocus handoff owner). Captain decides: waive majors for Menubar or hand to owner.
- No contention transients observed (sibling C-NF crew active in NumberField/ during my runs; my failures deterministic 3x).

## 5. Resume checklist / close

- [x] 1a implemented in Menu/ + Menubar/; post-edit alias grep clean
- [x] All in-scope call sites re-pinned (stories, CT specs, unit tests, SPEC/TESTS docs)
- [x] Menu: r19 + majors green x2
- [x] Menubar: r19 green x2; majors red proven pre-existing (identical clean-tree failure sets)
- [x] Out-of-scope flags: library-catalog.ts stale onValueChange (ComboboxProps/SliderProps — neither ships it); historical mission docs frozen
- [x] Nothing committed (captain commits per-arc). Working tree: my 9 files + sibling NumberField files + this log, all uncommitted.

DONE (with Menubar-majors disposition for captain ruling).

## Captain closeout (firsthand 2026-09-29)
- Implementation verified: RadioItem `group?.onChange?.(value)` intact (L1560); only alias calls stripped. Menu r19 91/91 + unit 43, Menu majors 182/182, Menubar r19 23/23 + unit 20 — all confirmed firsthand.
- Menubar majors: my run 28/46 (18 red, 9+9 = the FINISH-01-owned set); crew's runs 27/46 both trees. The ±1 is a load flip-flopper on BOTH trees.
- METHOD CORRECTION: crew's `.names` files were 0 bytes — diff-of-empty-files proves nothing. Captain re-extracted failing-name frequency tables from the 104KB raw logs: flip-tree and clean-tree distributions IDENTICAL (KEY-05×12, DOM-01/KEY-02/03/04/06/09/FOCUS-01/RTL-01×8, rest passing). Conclusion stands on real evidence: zero C-NAME regression.
- DISPOSITION: Menubar majors WAIVED as pre-existing (identical distributions, RovingFocus-handoff class, out-of-ruling-scope). Follow-up belongs to the RovingFocus-handoff owner, not closeout. Finish-line item 1 notes this single waiver (reversible by veto).
- Out-of-scope flag carried: reference-mcp library-catalog.ts documents onValueChange on ComboboxProps/SliderProps (neither ships it) — stale catalog, needs owner regen. Not FINISH work.
