CLOSED — FINISH-07 snapshot-tolerance measurement crew (branch reference-system, box 60 min, READ-ONLY; captain-verified, census 349 confirmed firsthand)
Started: 2026-09-29 (UTC). Config stays 0.02 until HQ rules. Runner only. No commits.

## T+00 — kickoff + sources
- Brief: FINISH.md Part B FINISH-07 (feeds HQ item 5); DECISIONS.md §5 still open (5a+5b recommended, HQ questioned 0.002 as "the extreme other end").
- Problem statement + 20 regen'd baselines: `.agents/missions/sharp/tolerance.md` (COMPLETE, READ-ONLY audit, no suite run — all pass/fail claims arithmetic).
- Method plan (all non-mutating):
  - Signal floor: pixel-diff old-vs-new baseline PNGs straight from git history (regen commits landed per DECISIONS §5) with a /tmp script. No test runs needed.
  - Noise floor: zero-tolerance canary run via a /tmp config override (repo untouched) on a sampled subset of CT specs; failure messages report exact diff px/ratio per snapshot. Repeat 2× for stability.
  - Worked examples: FocusLock 0.15 trio + Tabs B-08 page snap — content-px + budget math, verified from live baselines.
- Raw logs → /tmp/finish07-*.txt. Reds attributed by name, isolated re-run.

## T+15 — census + signal floor (pixelmatch-true, no runner needed)
- Census: 349 `await snap(` calls in 33 CT spec files (audit said 344 — +5 since).
  Explicit: 31×0.001, 1×0.002, 3×0.15 → 314 inherit global 0.02 (7680px @800×480).
  Config confirmed `maxDiffPixelRatio: 0.02`, viewport 800×480, dark, anim-disabled, caret-hidden.
- Signal method: `/tmp/finish07-pm.mjs` — pixelmatch@7.2.0 `{threshold:0.2}`
  (= Playwright toHaveScreenshot comparator settings) on old-vs-new baseline blobs
  straight from git. Regen commits: `187333660` (13 DateField/Field/Toast) + `2655d4bcc` (8 Listbox).
- TRUE comparator-equivalent signal floor (21 baselines, 3 landed restyles):

| change | baseline | diffPx | ratio |
|---|---|---:|---:|
| Toast B-37 × move | default-toast-open | 108 | 0.028% |
| Field ISO→locale | field-date-compound, field-surface | 273 | 0.071% |
| Toast B-37 × move | gate7-close-button, gate7-rtl-layout | 553 | 0.144% |
| DateField ISO→locale text | datefield-resting/escaped/focused/selected/trigger | ~1382–1416 | 0.36–0.37% |
| DateField ISO→locale+picker | alt-down-open/day-hover/picker-open | ~4769–5356 | 1.24–1.39% |
| Listbox B-38 1-row | 7× listbox-* (1 white row) | ~7623–7652 | 1.985–1.993% |
| Listbox B-38 2-row | listbox-multi-selected | 14878 | 3.87% |

- Audit's mask claim CONFIRMED exactly: Listbox 1-row = 7636px = 1.9885% < 2%
  (passes with ~44px headroom); 2-row = 3.87% would fail. PIL-exact counts overcount
  (no AA exclusion); pixelmatch is truth. Raw: re-run `node /tmp/finish07-pm.mjs --commit <sha>`.

## T+30 — canary rig + positive control
- `/tmp/finish07-canary.config.mjs`: plain-ESM mirror of the CT config (react19,
  absolute paths) with ONLY `maxDiffPixelRatio: 0`. (First attempt, /tmp .ts importing
  the base config, failed: CJS-compiled `import.meta` — see `/tmp/finish07-canary-tabs.txt`
  head from the dead run; .mjs mirror fixed it. Repo untouched throughout.)
- Tabs pilot: 26/26 PASS at zero tolerance → all 22 Tabs snaps bit-identical to
  09-18 baselines. Surprising → positive control required.
- CONTROL: copied Tabs snapshots to /tmp, doctored `pill-activity-selected` with a
  10×10 red block (100px), ran TB-DOM-05 via `/tmp/finish07-control.config.mjs`:
  FAILED as expected — "93 pixels (ratio 0.01…) are different. Snapshot:
  pill-activity-selected.png" (100 doctored → 93 after pixelmatch AA-exclusion).
  Canary PROVEN strict; failure format gives exact px counts (printed ratio is
  2-decimal coarse — always use pixel counts). Raw: `/tmp/finish07-control.txt`.

## T+45 — noise floor (main canary, N=102)
- Run: 5 spec files (Toast 26 + DateField 8 + Listbox 8 + FocusLock 29 + NumberField 12
  = 83 snap calls) + Tabs pilot (22) = 105 calls; 3 FocusLock-trio calls keep per-call
  0.15 (config cannot override) → **N=102 measured**. 280 passed, 11 failed (3.4m).
  Raw: `/tmp/finish07-canary-main.txt`.
- Distribution: **91 snaps at exactly 0px (89%)**. All 11 nonzero are coherent
  single-region blobs (bbox analysis), ZERO scattered AA jitter:

| snapshot | pm px | ratio | bbox (tol30) | verdict |
|---|---|---:|---|---|
| fl-live-open (FocusLock) | 4538 | 1.18% | full-width band y50–147 | drift/nondet suspect; code (FOCUS 09-28) newer than baselines (09-13) |
| numberfield-resting | 306 | 0.080% | input x80–235 y32–65 | probable drift; code (NFLAST 09-28/29) newer than baselines (09-18) |
| numberfield-mouse-focused | 310 | 0.081% | same input box | same |
| numberfield-keyboard-focused | 1086 | 0.283% | input+ring x79–239 y28–69 | same |
| numberfield-stepper-focused | 300 | 0.078% | same input box | same |
| numberfield-disabled | 32 | 0.008% | input x84–245 y16–49 | same (smallest nonzero) |
| basic-stack-resting (Toast) | 102 | 0.027% | card x414–758 y378–429 | nondet-fixture suspect; code (09-10) OLDER than baselines (09-27 regen) |
| basic-stack-hover-expanded | 330 | 0.086% | card x414–758 y210–429 | same |
| gate6-modal-a-paused-toast | 711 | 0.185% | card x414–775 y398–438 | same (paused-timer suspect) |
| gate7-card-resting | 553 | 0.144% | card x414–775 y398–438 | same |
| gate7-classnames | 1164 | 0.303% | card x414–756 y378–431 | same |
| Tabs 22 + DateField 8 + Listbox 8 + 25 FocusLock sibs + 7 NF + 21 Toast | 0 | 0 | — | exact-zero noise |

- Stability: isolated Toast re-run reproduced all 5 Toast counts BIT-EXACT
  (102/330/711/553/1164) → deterministic drift/nondeterminism, NOT random noise.
  Raw: `/tmp/finish07-canary-toast2.txt`.
- **Noise floor = 0px observed stochastic noise; conservative ceiling 32px**
  (smallest nonzero, itself coherent/probable-drift).

## T+60 — worked examples, reds, close
- FocusLock 0.15 trio (live baselines): content 122–140k px (32–36% of frame);
  guarded signals ~2k px (audit's error-text est.); 57,600px budget = ~28× the signal.
  Pure mask — replace with ≤25px locator snaps or drop (text/focus assertions prove
  behavior). Trio noise NOT directly measured (per-call 0.15 overrides canary 0) —
  inferred ≈0 from 25 bit-identical sibling FocusLock page snaps on the same static
  lab pages. HQ repro: temp spec, same targets, budget 0 (needs a tree edit — C-SNAPSHOT).
- Tabs B-08: landed 09-27 as `color: gray.950` static-dark (`9dd974776`, NO baseline
  change) + contrast-pin computed assertion. 09-18 pill baselines pass at ZERO tolerance
  against new code → B-08 pixel-neutral in dark CT mode (PROVEN, and the page snap is
  blind by construction — the fix moves light-mode pixels only, CT is dark-only).
  The landed contrast-pin assertion is the real proof = P3 pattern validated live.
  All 9 Tabs 0.001 locator snaps + 3 NumberField 0.001 snaps passed at budget.
- REDS ATTRIBUTED (isolated Toast re-run: 13 failed = 5 SNAP + 8 BEHV):
  - 5 SNAP: above, deterministic, reproduced exact.
  - 8 BEHV (TO-COMP-01/02, TO-TIME-05/13/14, TO-CLOSE-04, TO-ANN-08, TO-ENV-04,
    TO-RIVAL-SWIPE-PHYSICS 30.7s timeout): `ERR_CONNECTION_REFUSED :3101` /
    `Failed to fetch dynamically imported module` — vite webServer died mid-run
    (shared :3101 via reuseExistingServer; concurrent box activity). INFRA, not
    product; same tests passed 4 min earlier in the combined run. Snapshot data
    unaffected. Raw: `/tmp/finish07-canary-toast2.txt:401+`.
- TREE CAVEAT: concurrent FINISH crews edited 4 spec files mid-box (Accordion,
  Calendar, Combobox, NumberField — all additive test appends; verified NF diff is a
  new axe test only, no snap/fixture changes). "Quiet tree" was approximate; snapshot
  numbers unaffected. I changed NOTHING except this log; NO commits.
- Method notes: (a) pixelmatch@7.2.0 standalone vs Playwright 1.62.1's bundled
  comparator may skew slightly — control experiment bounds the behavior. (b) Failure
  ratios print at 2 decimals — pixel counts are the measurement. (c) Canary
  threshold kept at production 0.2 (color sensitivity), only the budget went to 0.

## RECOMMENDATION (to HQ, DECISIONS §5)
**Default `maxDiffPixelRatio: 0.001` (384px @800×480) + mandatory locator pairing
(`maxDiffPixels: 25` absolute, or ≤0.001 ratio on large regions) + ban per-call ratio
≥0.01 without a `// TOL:` comment naming the noise source.** (P1 at 0.001 not 0.002; P2/P4 as audited.)
- Headroom math: noise ceiling 32px → 384px budget = **12× headroom** (∞× over the
  0px observed stochastic noise: 91/102 snaps bit-identical, zero jitter anywhere).
- Signal: catches Listbox 1-row (7.6k, 20× margin), DateField-picker (5k, 13×),
  DateField-text (1.4k, 3.6×), **gate7 close-move (553px, 1.4× margin)** —
  which the audit's 0.002 (768px) would STILL mask. HQ's "extreme other end" worry
  is backwards: 0.002 remains lax for the small-signal class; 0.001 is the
  evidence-backed point and the measured zero-noise makes it safe.
- Sub-384px signals (Field ISO text 273px, Toast-default × move 108px) CANNOT be
  caught by any sane page default (would need ≤0.00028) — that's the locator rule's
  job: inside a targeted locator both trip a 25px budget at ≥4× margin (108/25).
- Flip-day work list (= the policy working, not flake risk): the 11 canary reds —
  NF 5 (probable NFLAST drift, baselines 09-18 < code 09-28/29 — P5 case study #4),
  Toast 5 (nondeterministic fixture suspects — disposition: regen-with-eyeball or
  fixture-harden), fl-live-open (same). Trio → locator snaps per audit edits 2–4.

## Resume checklist (CLOSED)
- [x] Census confirmed: 349 snaps / 33 files; 314 inherit 0.02; viewport 800×480
- [x] Noise floor table: N=102, 91 at 0px, 11 coherent deterministic (table above)
- [x] Signal floor table: 21 baselines, 7 rows, pixelmatch-true (table above)
- [x] Worked examples: FocusLock trio (28× mask) + Tabs B-08 (neutral, proven at 0)
- [x] Recommendation: 0.001 + ≤25px locator rule + ≥0.01 ban, headroom math above
- [x] Tree: changed nothing but this log; no commits; raw logs in /tmp/finish07-*
