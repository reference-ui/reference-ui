# C-NF — NumberField flip crew (C-W02 + C-NF-FLAGS merged) — IN PROGRESS

Started 2026-09-29. Branch `reference-system`. Owner: flip crew C-NF.
Scope: `packages/reference-lib/src/components/NumberField/` ONLY. Never touch Overlay/ or others.

## 0. Opening survey (key finding: NFLAST already landed the rulings)

- `git log` shows NFLAST (99→134), NFLAST-3 (134→139), NFLAST-4 (139→144) all landed + FINISH-01 axe half.
- Spot greps: NF-MATH-03/04/09/10/11/12, NF-MATH-13, NF-EDIT-03/05, NF-COMMIT-01/04/05/08/11, NF-DYNAMIC-01, NF-MATH-06/15 all present in `NumberField.test.tsx`; NF-COMMIT-06 present in CT; B-19 CT re-pin present ("Live meanings publish raw (2, then 2.5)").
- Old W-02 RAC titles ("lattice anchors at a finite min", "midpoint ties round half up", "revert with onInvalidCommit and no onChange", "publish once at commit, never mid-keystroke") are GONE from unit titles (only stale-free comments remain).
- So the flip work = AUDIT each ruled clause against tree + close genuine gaps + re-pin docs + five-leg gate. Pre-release cheap, but no churn where already correct.
- Tree note: `M packages/reference-lib/src/components/Overlay/dismiss/listeners.ts` is UNCOMMITTED sibling-crew work — DO NOT TOUCH. Untracked FINISH-02F-F59.md likewise.

## Ruling-by-ruling audit (against DECISIONS.md NFLAST record)

### (a) snap lattice — TO VERIFY
- [ ] zero-anchored k*step in engine
- [ ] away-from-zero ties
- [ ] exact/exceeded non-grid bounds preserved as endpoints
- [ ] order endpoint→lattice→authored rounding→final clamp
- [ ] steppers/keys clamp-step-then-lattice (freeze decision 6)
- [ ] W-02 snap unit titles re-pinned (appear done — confirm titles verbatim)

### (b) validate RETAIN-AND-REPORT — TO VERIFY
- [ ] finite under/over/off-step requests rounded raw candidate via onChange
- [ ] managed invalid state reports each constraint + blocks submit
- [ ] native flags false, no setCustomValidity
- [ ] onInvalidCommit ADVISORY (fires alongside onChange; out-of-range wins)
- [ ] W-02 validate titles re-pinned to NF-MATH-13/NF-COMMIT-06 (confirm)

### (c) LIVE-REQUEST with dedupe — TO VERIFY
- [ ] newly parseable live edits request raw parsed numbers immediately
- [ ] dedupe per meaning; incomplete grammar never publishes
- [ ] accepted echoes preserve dirty text/caret; stale replacements zero-callback
- [ ] B-19 unit + CT re-pins (appear done — confirm)

### Intl i–xvi + paste xi–xvi/i–x — TO VERIFY (spot-check engine + titles)

### Docs — TO AUDIT
- [ ] NumberField.md / SPEC.md / TESTS.md: no stale freeze-vs-engine contradictions

## 1. Audit verdict (all three rulings + Intl/paste already in engine)

Engine (`NumberField.tsx`) verified clause-by-clause against DECISIONS.md:
- (a) `snapValueToLattice` (L52): zero-anchored, away-from-zero ties
  (`floor(q+0.5)`/`ceil(q-0.5)`), endpoint preservation (`value<=min→min`,
  `value>=max→max`); `runCommit` snap branch (L2554): lattice →
  `displayRoundTrip` → final clamp. Steppers/keys: `stepLatticeInDirection`
  + endpoint clamp, mode-independent (v-keep); keys route via
  `increment`/`decrement` (L2702+).
- (b) `runCommit` validate branch (L2538): requests rounded raw candidate,
  advisory `onInvalidCommit` after `onChange`, range-first; `ownedInvalid`
  (L2320) union + submit blocking; no `setCustomValidity` for constraints.
- (c) live path (L2438): raw parse, immediate request, dedupe vs
  controlled + `lastLiveRef`; incomplete grammar silent; echo/stale
  handling at L2168+.
- Intl i–xvi + paste xi–xvi/i–x: spot-confirmed in engine + unit/CT
  titles (numberingSystem precedence, exceptZero, width variants L241,
  accounting, U+0609, orphan, fallout, PARSE-07/15/16, EDIT-02/07/12,
  DYNAMIC-05, ENV-02).
- vi-keep note: ruling says "keep modest parser" but C-NF-FLAGS orders
  Intl i–xvi per the SPEC'd record; full parser landed (NFLAST-2) +
  green — the specific order wins. Flagged, moving on.

## 2. Re-pins applied (docs/comments/titles only — zero behavior change)

1. `NumberField.tsx` L574: W-02 comment → ruled snap/validate/none.
2. `NumberField.tsx` L2316: dropped stale "(flagged for HQ…)" on 'none'.
3. `NumberField.story.tsx` L139: B-19 comment → live `[2, 2.5]` wording.
4. CT L653: W-02 title "with one onChange" (asserted 3!) → "publishes live
   raw meanings then coerces typed 2.5 to 3 at commit".
5. `NumberField.md` Defaults + authority para → ruled snap/validate/none
   + advisory onInvalidCommit.
6. `NumberField.md` Deliberately-left + `TESTS.md` NF-TYPE-02 +
   Deliberately-left: "commit callbacks, reason/detail rejected" → second
   numeric channels rejected; advisory onInvalidCommit carved out
   (matches shipped API + types test, which never rejected it).
7. `SPEC.md`: Production row, live-request bullet, work-order §3,
   port parenthetical → landed state.

## 3. Gate runs

### Leg 1: `pnpm agentct NumberField` (unit + CT r19) — GREEN ×2
- Run 1 (`/tmp/c-nf-leg1.txt`): `E2E: 58 | Passed: 58 | Failed: 0 / react19: 58 passed | Unit: passed | 131 tests`, EXIT=0.
- Run 2 (`/tmp/c-nf-leg1b.txt`, two-in-a-row): identical 58/58 + 131, EXIT=0.

### Legs 2–3: `--e2e --react 17,18` — GREEN
- (`/tmp/c-nf-leg2.txt`): `E2E: 116 | Passed: 116 | Failed: 0 / react17: 58 / react18: 58`, EXIT=0.

### Leg 4: FF r19 — GREEN
- (`/tmp/c-nf-ff.txt`): `[agent] Playwright suite PASSED: 58 passed (0 failed)`, EXIT=0. Vehicle: `CT_REACT=19 CT_PORT=3117 … --project=react19-firefox --ignore-snapshots`.

### Leg 5: WK r19 — GREEN
- (`/tmp/c-nf-wk.txt`): `[agent] Playwright suite PASSED: 58 passed (0 failed)`, EXIT=0. Vehicle: `CT_REACT=19 CT_PORT=3118 … --project=react19-webkit --ignore-snapshots`.

Zero reds across all five legs; zero narrowing; no sibling-contention transients observed. Runner only throughout.

## 4. Dispositions (75-min mark: no new implementation)

- DONE: (a)(b)(c) + i–xvi verified in engine; tests + docs re-pinned; five-leg gate green, quoted above.
- Ambiguity flagged: vi-keep ("modest parser") vs C-NF-FLAGS Intl order — kept the landed full parser (specific order wins). See §1.
- Diff: 6 files, all NumberField/, comments/docs/one CT title, zero behavior change. Sibling `Overlay/dismiss/listeners.ts` modification untouched.
- NEVER committed (per crew law — captain verifies + commits per-arc).

## Resume checklist
- [x] Log exists, first line IN PROGRESS (status: DONE below)
- [x] Audit complete per ruling (§1)
- [x] Gaps fixed — none behavioral; 10 re-pin edits (§2)
- [x] Docs re-pinned (§2 items 5–7)
- [x] Five-leg gate green quoted (§3)

# C-NF VERDICT: DONE — five-leg gate green, no commit (captain's per-arc land)

## Captain closeout (firsthand 2026-09-29)
- Engine audit CONFIRMED: (a) zero-anchored `value/step` + `floor(q+0.5)`/`ceil(q-0.5)` ties + endpoint preservation; (b) validate requests rounded-raw + advisory range-first onInvalidCommit; (c) live raw + dedupe vs controlled/lastLive. Old W-02 RAC titles gone (0 matches).
- Diff is comment/doc/title-only (2 .tsx comment blocks, 1 CT title rename, .md re-pins) — zero behavior change, as claimed.
- vi-keep tension RATIFIED: ruling said "keep modest parser" but ordered Intl i–xvi; the full SPEC'd parser is landed + green — deleting it would be perverse. vi-keep is superseded by the landed implementation (recorded here, reversible by veto).
- Re-proof: captain r19 58/58 + unit 131; crew five-leg (r19 ×2, majors 116, FF 58, WK 58) quoted in log.
- FINISH-06 note: per-flip 06 deferred to the C-NF+C-NAME wave close (C-NAME mid-flight; tree not clean for a 06).
- [ ] Log exists, first line IN PROGRESS
- [ ] Audit complete per ruling
- [ ] Gaps fixed (list below)
- [ ] Docs re-pinned (list below)
- [ ] Five-leg gate green quoted (unit + CT×17/18/19 + FF + WK)
