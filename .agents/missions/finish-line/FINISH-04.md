CLOSED — FINISH-04 per-browser baseline diffs crew (in-box; captain-verified: 277 scratch PNGs, Tabs-FF A-vs-B 22/22 identical re-run firsthand).

CAPTAIN'S RULING (finish-line item 5; per 2026-09-29 autonomy directive, reversible by veto): ADOPT per-browser baselines for r19. Evidence is decisive — page snaps already pass shared-Chromium with 7.2× headroom, locator 0.001 snaps fail cross-engine on 11/19 FF + 18/19 WK (plus 2 size-mismatches at any budget), determinism is perfect (121/121) so adoption loses zero detection power. EXECUTION SEQUENCED AFTER PART C: C-SNAPSHOT regens baselines same-commit anyway, so adoption rides that regen wave (adopt-then-regen now would be pure rework). Drift-eyeball gate stands (Field ≤5693px + Collapsible 411px must be eyeballed before anything becomes truth). Interim middle path (shared-Chromium page snaps on FF/WK) folded into the adoption wave, not before. Remaining first-set (Presence/Portal/Menubar) + rest generate during that wave with this log's exact vehicle.
Started: 2026-09-29 (UTC). Sibling owns Toast/ + Announcer/ — never touched; all output to /tmp/finish04-* scratch. Runner only. No component/baseline files touched.

## T+00 — kickoff + sources
- Objective (delegated): candidate FF + WK baselines for fully-green-both-engines set FIRST (Field, Tabs, Collapsible, Menubar, Presence, Portal), then rest (priority: green-on-all-4 r17/r18 legs + r19 sweep greens). NOTE: brief names Menubar "fully-green" but FINISH-02 30/30 table has Menubar 14/23 on all 4 legs (owned 9) — flagged, candidates for Menubar only where behavior-green.
- Context: FINISH-02.md 30/30 table (all green legs ran --ignore-snapshots; pinned baselines are Chromium-raster). FINISH.md Part B file does not exist in repo — delegated objective is the brief.
- Comparator: pixelmatch@7.2.0 threshold 0.2 (FINISH-07 /tmp/finish07-pm.mjs = Playwright toHaveScreenshot comparator-equivalent).
- Vehicle: CT_REACT=<major> CT_PORT=3117/3118 pnpm agent playwright --dir packages/reference-lib --config=/tmp/finish04-ct.config.ts <spec> --project=react<major>-<firefox|webkit> [--update-snapshots], snapshotPathTemplate → /tmp/finish04-candidates/ scratch. NEVER over pinned baselines.
- Raw logs → /tmp/finish04-*.txt. Reds attributed by name, isolated re-run. Two-in-a-row before trusting a candidate. S2 probe if anything restarts.

## T+15 — rig + vehicle correction (r19-only snaps)
- Census: 349 `await snap(` calls (matches FINISH-07 exactly) across 30 components with snaps; Announcer/Icon/Reference have 0. Pinned PNGs: 380 files (extra = stale/renamed, e.g. FocusLock 30 files vs 29 calls, Overlay 34 vs 17, Popover 18 vs 13, Tooltip 19 vs 13, Tree 15 vs 13).
- Sibling check: F30 crew IN PROGRESS (Toast/Announcer + Measure/Overlay spot, r18 legs on shared 3118) — contention expected, re-run isolated. Tree moved at box start: Toast.story.tsx + Announcer.ct.spec.ts fixes LANDED (git clean except untracked crew logs + new FINISH-02F-F59.md filing 02-F59). "Quiet tree" is approximate — verify at close.
- Runner lesson: `pnpm agent playwright` REQUIRES `--dir <target>` first (else defaults to nonexistent matrix/overlays). Correct form: `pnpm agent playwright --dir packages/reference-lib --config=... <spec> --project=...`.
- S2 probe 3118: `GALLERY_RUNTIME=18.3.1`, `1 passed (7.8s)` (/tmp/finish04-probe-18.txt) — genuinely r18.
- VEHICLE CORRECTION: `snap()` is a hard no-op off-r19 (`playwright/ct.ts:140: if (!(await isReact19Gallery(page))) return`). Field r18-Chromium -u run wrote ZERO files (scratch empty, pinned untouched — git clean) while passing 21/21 behavior. Candidates MUST come from r19 galleries. New vehicle: CT_REACT=19 on private port 3119 (3101 occupied, 3117/3118 are r17/r18) — pure engine delta vs r19-pinned Chromium baselines, no major confound. Bonus: Field r18-Chromium behavior 21/21 green (snaps skipped).
- Rig: /tmp/finish04-ct.config.ts (scratch snapshotPathTemplate + refuse-if-unset guard + react<major>-chromium control project), /tmp/finish04-pm.mjs (pixelmatch t=0.2 + bbox/density class; self-test 17/17 IDENTICAL).

## T+30 — Field engine delta: page budget absorbs, locator snaps don't
- S2 r19: `GALLERY_RUNTIME=19.2.4` on fresh private 3119 (was 000, self-booted; /tmp/finish04-probe-19.txt).
- Field r19 runs: Cr-A `21 passed (37.8s)`, FF-A `21 passed (50.1s)` — zero behavior reds, 17 PNGs each in scratch.
- DRIFT column (pinned vs Cr-fresh): 10/17 IDENTICAL; 7 drifted up to 5693px/1.48% (keyboard-focused). field-compound = 273px — exactly FINISH-07's ISO→locale signal size, on the sibling snap. Tree drift (code newer than baselines), NOT engine delta. Candidates adopted now would bake this drift — flagged for recommendation.
- ENGINE column (Cr-fresh vs FF-fresh, same tree/window): page snaps 26–739px (0.007–0.19%, dens ≤0.14, text-AA regions) — ALL « 2% page budget (7680px). BUT the two 0.001 locator snaps FAIL cross-engine: field-control-resting/warning 128px vs ~10px budget (1.31%), field-root-resting 239px vs ~53px budget (0.45%). The FINISH-07 locator pattern REQUIRES per-browser baselines; the page default does not. All diffs raster-only class (no behavior reds either leg).

## T+45 — Field CLOSED (trusted), Tabs in flight
- Field determinism: FF A-vs-B `identical=17/17`, WK A-vs-B `identical=17/17`, Cr A-vs-B `identical=17/17` — zero stochastic noise on all 3 engines. FF + WK candidates TRUSTED.
- WK engine delta (Cr-A vs WK-A): page snaps 44–1072px (0.01–0.28%), locator 188px/1.92% (budget ~10px → FAIL), root 454px/0.85% (budget ~53px → FAIL). Same raster-only shape as FF, slightly larger.
- Method locked: Cr 1× per component (Field proved Cr determinism + FINISH-07 N=102), FF/WK A+B (two-in-a-row). Drift column (pinned vs Cr-fresh) + engine columns (Cr-fresh vs FF/WK-fresh) per component.
- Tabs Cr-A: `26 passed (45.4s)` (/tmp/finish04-tabs-19cr-A.txt).

## T+60 — Tabs CLOSED (trusted), STOP-ADDING per box rule
- Tabs drift column: pinned vs Cr-fresh `identical=22/22` — baselines fresh (matches FINISH-07 zero-tolerance pass).
- Tabs runs: FF-A `26 passed (57.8s)`, FF-B `26 passed (1.1m)`, WK-A `26 passed (57.3s)`, WK-B `26 passed (56.6s)` — zero behavior reds.
- Tabs FF engine delta: 20/22 diffs 10–152px (max 0.13%), + 2 SIZEMISMATCH pill-list-* 254x42→255x42 (1px wider on FF — fails at ANY budget).
- Tabs WK engine delta: 20/22 diffs 64–436px (max 0.88%), + SAME 2 SIZEMISMATCH 254x42→255x42. All raster-only class.
- Tabs determinism: FF A-vs-B `identical=22/22`, WK A-vs-B `identical=22/22`. Candidates TRUSTED.
- STOP-ADDING (box rule): Collapsible already in flight (Cr-A `25 passed (40.7s)`) — finish it, then table + recommendation. Presence/Portal/Menubar + rest → resume checklist with exact vehicle.

## T+75 — Collapsible CLOSED, DIFF TABLE, RECOMMENDATION, BOX END
- Collapsible runs: Cr-A `25 passed (40.7s)`, FF-A `25 passed (55.1s)`, FF-B `25 passed (58.5s)`, WK-A `25 passed (55.6s)`, WK-B `25 passed (56.9s)` — zero behavior reds. Determinism FF + WK `identical=13/13`. Candidates TRUSTED.
- Collapsible drift: 7/7 locators identical; 6/6 page snaps drifted ~411–413px (0.107%, same bbox x362-775 — one coherent element, tree drift).
- Box totals: 16 runs, 0 behavior reds (Field 6×21/21, Tabs 5×26/26, Collapsible 5×25/25). Determinism 121/121 A-vs-B identical (all engines). All diffs raster-only class (green behavior both legs of every comparison; densities ≤0.23, text/AA regions).
- Exact 0.001 budgets (px): Tabs h-list 16.5, h-root 63.6, pill-list 10.7, pill-root 61.6, v-list 12.3, v-root 78.7; Field control 9.8, root 53.1; Collapsible content 17.2, dflt-root 56.4, root-opened 56.4, root-closed/resting 37.2, trigger 15.8, dflt-collapsed 37.2.

### Diff table (pixelmatch t=0.2; drift = pinned-vs-Cr-fresh, engine = Cr-fresh-vs-FF/WK-fresh; verdict = vs stated budget)
Field (17):
| snapshot | drift px | FF px (ratio) | WK px (ratio) | FF verdict | WK verdict | class |
|---|---|---|---|---|---|---|
| field-amount | 0 | 26 (0.007%) | 48 (0.013%) | page PASS | page PASS | raster |
| field-compound | 273 (0.071%) | 341 (0.089%) | 396 (0.103%) | page PASS | page PASS | raster (+drift=FINISH-07 signal size) |
| field-control-resting [0.001] | 0 | 128 (1.31%) | 188 (1.92%) | FAIL (10× over) | FAIL (19× over) | raster |
| field-control-warning [0.001] | 0 | 128 (1.31%) | 188 (1.92%) | FAIL | FAIL | raster |
| field-date-compound | 0 | 147 (0.038%) | 364 (0.095%) | page PASS | page PASS | raster |
| field-embedded-chrome | 0 | 509 (0.133%) | 581 (0.151%) | page PASS | page PASS | raster |
| field-keyboard-focused | 5693 (1.48%) | 239 (0.062%) | 454 (0.118%) | page PASS | page PASS | raster |
| field-mouse-focused | 3637 (0.95%) | 239 (0.062%) | 462 (0.120%) | page PASS | page PASS | raster |
| field-prefix-suffix-focused | 1026 (0.267%) | 26 (0.007%) | 52 (0.014%) | page PASS | page PASS | raster |
| field-prefix-suffix | 1022 (0.266%) | 26 (0.007%) | 44 (0.011%) | page PASS | page PASS | raster |
| field-prohibited-props | 0 | 146 (0.038%) | 173 (0.045%) | page PASS | page PASS | raster |
| field-resting | 3633 (0.95%) | 239 (0.062%) | 454 (0.118%) | page PASS | page PASS | raster |
| field-root-resting [0.001] | 0 | 239 (0.45%) | 454 (0.85%) | FAIL (4.5× over) | FAIL (8.5× over) | raster |
| field-state-chrome | 0 | 739 (0.19%) | 1072 (0.28%) | page PASS | page PASS | raster |
| field-status-warning | 0 | 239 (0.062%) | 440 (0.115%) | page PASS | page PASS | raster |
| field-surface | 0 | 488 (0.127%) | 797 (0.208%) | page PASS | page PASS | raster |
| field-token-picker | 416 (0.108%) | 27 (0.007%) | 207 (0.054%) | page PASS | page PASS | raster |
Tabs (22, drift 0/22):
| snapshot | FF px (ratio) | WK px (ratio) | FF verdict | WK verdict | class |
|---|---|---|---|---|---|
| horizontal-default | 82 (0.021%) | 234 (0.061%) | page PASS | page PASS | raster |
| horizontal-disabled-hover | 64 (0.017%) | 366 (0.095%) | page PASS | page PASS | raster |
| horizontal-hover-password | 82 (0.021%) | 243 (0.063%) | page PASS | page PASS | raster |
| horizontal-password-selected | 84 (0.022%) | 320 (0.083%) | page PASS | page PASS | raster |
| horizontal-settings-focused | 64 (0.017%) | 375 (0.098%) | page PASS | page PASS | raster |
| pill-activity-focused | 55 (0.014%) | 107 (0.028%) | page PASS | page PASS | raster |
| pill-activity-selected | 55 (0.014%) | 107 (0.028%) | page PASS | page PASS | raster |
| pill-default | 51 (0.013%) | 287 (0.075%) | page PASS | page PASS | raster |
| pill-hover-activity | 53 (0.014%) | 293 (0.076%) | page PASS | page PASS | raster |
| vertical-billing-selected | 152 (0.040%) | 436 (0.114%) | page PASS | page PASS | raster |
| vertical-default | 81 (0.021%) | 110 (0.029%) | page PASS | page PASS | raster |
| vertical-hover-billing | 81 (0.021%) | 114 (0.030%) | page PASS | page PASS | raster |
| vertical-integrations-focused | 109 (0.028%) | 173 (0.045%) | page PASS | page PASS | raster |
| horizontal-list-default [0.001] | 21 (0.127%) | 134 (0.81%) | FAIL (21 vs 16.5) | FAIL | raster |
| horizontal-list-password-selected [0.001] | 17 (0.103%) | 145 (0.88%) | FAIL (17 vs 16.5) | FAIL | raster |
| horizontal-root-default [0.001] | 82 (0.129%) | 234 (0.37%) | FAIL (82 vs 63.6) | FAIL | raster |
| pill-list-activity-selected [0.001] | SIZE 254→255 | SIZE 254→255 | FAIL (any budget) | FAIL (any budget) | 1px layout |
| pill-list-default [0.001] | SIZE 254→255 | SIZE 254→255 | FAIL (any budget) | FAIL (any budget) | 1px layout |
| pill-root-default [0.001] | 51 (0.083%) | 287 (0.47%) | PASS (51 vs 61.6) | FAIL | raster |
| vertical-list-billing-selected [0.001] | 10 (0.081%) | 65 (0.53%) | PASS (10 vs 12.3) | FAIL | raster |
| vertical-list-default [0.001] | 10 (0.081%) | 64 (0.52%) | PASS | FAIL | raster |
| vertical-root-default [0.001] | 81 (0.103%) | 110 (0.14%) | FAIL (81 vs 78.7) | FAIL | raster |
Collapsible (13; drift: 6 page ~411–413px/0.107%, 7 locators 0):
| snapshot | FF px (ratio) | WK px (ratio) | FF verdict | WK verdict | class |
|---|---|---|---|---|---|
| resting-closed | 5 (0.001%) | 230 (0.060%) | page PASS | page PASS | raster |
| hover-trigger | 5 (0.001%) | 230 (0.060%) | page PASS | page PASS | raster |
| opened | 33 (0.009%) | 294 (0.077%) | page PASS | page PASS | raster |
| closed | 5 (0.001%) | 230 (0.060%) | page PASS | page PASS | raster |
| default-open-resting | 82 (0.021%) | 162 (0.042%) | page PASS | page PASS | raster |
| default-open-collapsed | 6 (0.002%) | 36 (0.009%) | page PASS | page PASS | raster |
| collapsible-root-resting [0.001] | 5 (0.013%) | 230 (0.62%) | PASS (5 vs 37.2) | FAIL | raster |
| collapsible-trigger-resting [0.001] | 5 (0.032%) | 230 (1.45%) | PASS (5 vs 15.8) | FAIL | raster |
| collapsible-root-opened [0.001] | 33 (0.059%) | 294 (0.52%) | PASS (33 vs 56.4) | FAIL | raster |
| collapsible-content-opened [0.001] | 28 (0.16%) | 64 (0.37%) | FAIL (28 vs 17.2) | FAIL | raster |
| collapsible-root-closed [0.001] | 5 (0.013%) | 230 (0.62%) | PASS | FAIL | raster |
| collapsible-default-open-root [0.001] | 82 (0.15%) | 162 (0.29%) | FAIL (82 vs 56.4) | FAIL | raster |
| collapsible-default-open-collapsed [0.001] | 6 (0.016%) | 36 (0.097%) | PASS | PASS (36 vs 37.2!) | raster |
Summary: page snaps (33) 33/33 PASS both engines (max 1072px/0.28%); 0.001 locator snaps (19) FF 8/19 pass, WK 1/19 pass; size mismatches 2 (both engines). 121/121 A-vs-B identical.

### RECOMMENDATION: ADOPT per-browser baselines (human-gated on drift eyeball)
- Headroom math: page 2% budget absorbs all engine raster with ≥7.2× headroom (7680/1072); locator 0.001 budgets fail cross-engine on 11/19 FF + 18/19 WK, and 2 snaps fail at ANY budget (254→255 size). Determinism is perfect: 121/121 A-vs-B identical = 0px stochastic noise on all 3 engines, so per-browser baselines lose no detection power — FINISH-07's 0.001+25px program transfers to FF/WK intact.
- Risk math: adoption cost is mechanical — ~10KB/PNG × 380 × 3 ≈ 11MB total, one-line template change (`{projectName}` token; scratch already uses that layout), 3-engine regen discipline per restyle. The REAL risk is drift-baking: Field pinned is stale (up to 5693px/1.48%), Collapsible mildly (411px coherent) — adopting candidates blindly re-pins drift as truth on all 3 engines. Gate: eyeball the 13 drifted snaps first (regen-with-eyeball or fixture-harden per FINISH-07's flip-day list), Tabs-style fresh sets adopt as-is.
- Defer alternative: keep Chromium-only snapshots; FF/WK stay behavior-only. Costs nothing but strands the 0.001 locator program on Chromium forever (58–95% of locator snaps can never run off-Chromium; 2 never at any tolerance). Interim middle path (zero cost): run page snaps on FF/WK against SHARED Chromium baselines (proven 7.2× headroom) — needs only an engine-aware skip for 0.001 asserts in snap(), no new baselines.
- Scope note: adoption covers r19 only (snap() is a hard no-op off-r19 by design); r17/r18 legs stay behavior-only regardless. Candidates live ONLY in /tmp/finish04-candidates/ (A + B sets) — nothing presented as truth, nothing committed.

## Resume checklist
1. Remaining FIRST-set: Presence (12 snaps), Portal (13), Menubar (4 — behavior-red caveat: check r19 FF/WK behavior first; owned reds are r17/r18-confirmed, sweep had r19 23/23).
2. Then rest by priority: green-on-all-4-r17/r18-legs (Listbox, Tree, DateField, NumberField, Menu, Splitter, Accordion, Button, Primitives, ReferenceLibrary, Slot, Switch) + r19 sweep greens. NEVER Toast/Announcer (sibling-owned).
3. Exact vehicle per component C (5 runs): `CT_REACT=19 CT_PORT=3119 FINISH04_SNAPDIR=/tmp/finish04-candidates/<A|B> pnpm agent playwright --dir packages/reference-lib --config=/tmp/finish04-ct.config.ts 'src/components/<C>/__e2e__/<C>.ct.spec.ts' --project=react19-<chromium|firefox|webkit> --update-snapshots` — Cr-A, FF-A/B, WK-A/B. Diffs: `node /tmp/finish04-pm.mjs <dirA> <dirB>`.
4. Gallery 3119 (r19 19.2.4) left running; S2 re-probe if restarted. 3101/3118 belong to others — do not touch.
5. Tree at close: I touched ONLY this log (zero component/baseline files, nothing committed). Mid-box landings by others: F30 (Toast/Announcer flushSync), MOD (Tooltip pressTab) — none touch Field/Tabs/Collapsible rendering. Untracked `Overlay/__e2e__/zz-f59-probe.ct.spec.ts` is a sibling temp — leave alone. CLOSED.
