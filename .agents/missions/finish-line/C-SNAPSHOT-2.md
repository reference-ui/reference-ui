IN PROGRESS — C-SNAPSHOT-2 extended crew (regen + per-browser adoption + orphan prune). Branch reference-system, box 90 min. Runner only. NEVER commit.
Started: 2026-09-29 (UTC).

Brief: captain's full-r19 sweep exposed 0.001 reds beyond the 6 C-SNAPSHOT sets (Accordion legacy-smoke ×2, Calendar ×2, Popover Escape snap, Showcase ×3, Splitter SP-DOM-01…, truncated) + an unattributed unit failure. ONLY crew running. Scope: snapshot/config/test surfaces ONLY. NEVER component product logic, stories, non-snap assertions. Unit failure: fix ONLY if snapshot/tolerance-surfaced; else FILE with repro.

Evidence read: C-SNAPSHOT.md (policy live, 6/6 green, CARRY 1 + CARRY 2 exact vehicles, load-flip + abort-hiding lessons), FINISH-04.md (diff table + vehicle), FINISH-07.md (flip-day list).

Approval record: captain's autonomy directive (user 2026-09-29) + brief = explicit approval for `--update-snapshots --confirm` on scoped regen sets ONLY, never blindly. Every adoption needs eyeball classification in this log.

## T+00 — kickoff
- Tree at start: CLEAN (C-SNAPSHOT landed: dea406ee2 log, a21644351 20 baselines, 02f306ee0 policy).
- Raw logs → /tmp/c-snapshot2-*.txt. Reds attributed by name, isolated re-run, two-in-a-row.
- Sweep launched: bare `pnpm agentct` → /tmp/c-snapshot2-sweep.txt (running).
- ORPHAN CENSUS (prelim, counts): 349 calls / 380 PNGs (matches F04 exactly). Deltas: FocusLock 29/30 (+1), Overlay 17/34 (+17), Popover 13/18 (+5), Tooltip 13/19 (+6), Tree 13/15 (+2). All others exact.
- ORPHAN NAMES (unique-name diff; raw /tmp/c-snapshot2-orphan-census.txt): FL(1): fl-trap-open. OV(17): drawer-×4 (all-dismissed, nested-popover-open, open, resting), overlay-anchored-×3, overlay-dialog-×3, stacked-modals-×7. Popover(5): click-dismissed, click-open, click-resting, hover-dismissed, hover-resting. Tooltip(6): focus-dismissed, focus-open, focus-resting, hover-dismissed, hover-open, hover-resting. Tree(3): tree-focused-folder, tree-focused-readme, tree-multi-root-default. = 32 name-orphans vs 31 file-delta (2 dup call names: Overlay 17/16u, Tree 13/12u; implies 1 call name may LACK a png — sweep will reveal). DELETE GATE: sweep green + rg-no-reference-anywhere (incl. zz-f59-probe temp) + in-doubt-keep. Order: regen → prune → adopt-rename (fewer files to mv).

## T+15 — UNIT FAILURE ATTRIBUTED: product-logic, FILED not fixed
- Sweep unit leg: 951/956, sole red file NumberField.test.tsx (126 tests, 5 failed). Names: NF-PARSE-19 (5000ms timeout — possible load flake, needs isolated re-run), NF-PARSE-15 (`seen` Array(14) vs [0..9] — numbering-system vector), NF-COMMIT-04 (`data-editing` null vs ''), NF-COMMIT-05 (`[-5, 0]` vs `[-5]`), NF-KEY-06 (detail pending).
- Attribution: ALL product behavior assertions (Intl parsing, commit semantics, keyboard stepping) — ZERO snapshot/tolerance surface. Out of scope (product frozen). → FILE with repro, do NOT fix. Note: C-SNAPSHOT saw NF unit 131/131; now 126 tests/5 red → spec or product moved post-C-SNAPSHOT.
- Repro (isolated, post-sweep): `pnpm agentct NumberField --unit`. Raw: /tmp/c-snapshot2-sweep.txt (FAIL blocks).

## T+30 — SWEEP RED LIST: 15 e2e (13 snap + 2 behav) + 5 unit(filed)
- E2E: 1223 | 1208 passed | 15 failed. Unit: 951/956 (1 file). EXIT=1. Raw: /tmp/c-snapshot2-sweep.txt.
- 13 SNAP reds (comparator px / telemetry px, bbox, color):
  1. Accordion single-resting 1235/1368, x361-775 y43-206, #374151→#121213 (gray→near-black)
  2. Accordion multiple-both-open 826/912, same bbox+color (same signature)
  3. Calendar single-resting 3178/10175, x16-275 y25-321, #494b4f→#55575b (grid region)
  4. Calendar range-resting 3316/10576, x16-275 y25-323, same region
  5. Popover escape-open 5874/41770 (10.88%!), x16-283 y16-231, #0e0e0f→#292d35
  6. Splitter resting 1573/99043 (25.79%!), x185-775 y24-223, #0c121f→#0a0b0f
  7. Splitter vertical-resting 999/60704 (15.81%), x24-343 y74-263, #0b0c0f→#0f1622
  8. Showcase showcase-resting 448/494, x296-503 y344-377, #f19301→#333e50 (ORANGE→dark)
  9. Showcase shebang-tier1-modal-open 7420/9715, x230-579 y89-193, #d7dadd→#172c3e (light→darkblue)
  10. Showcase showcase-active 448/495, x296-698 y227-302, #f19201→#333e50 (same orange sig)
  11. Tree tree-default-expanded 1200/16639 (4.33%), x283-775 y24-177, #1f2a3a→#0b0c0d
  12. Tree tree-arrowleft-collapsed 3129/3249, x283-775 y24-111, #abafb6→#121213 (lightgray→black)
  13. Tree tree-multilevel 1192/15351 (4.0%), x323-775 y24-213, #1f2a3a→#0c0c0d
- 2 BEHAV reds (Tooltip, both nested-dialog tests): TT-CLOSE-01 toBeVisible nested-tooltip-content NOT FOUND (tip never opened); TT-FOCUS-03 toHaveAttribute on nested-tooltip-trigger. Zero snap involvement → product/load class; isolated re-run decides flake-vs-FILE.
- Order of battle: (a) Tooltip isolated now (flake-or-file) + eyeball diffs in parallel; (b) serial-confirm each red component (abort-hiding); (c) scoped -u + eyeball classification; (d) prune; (e) adopt Presence/Portal/Menubar if box allows, else carry; (f) proof sweep.

## T+45 — Tooltip FILED (deterministic behavior) + Accordion DONE (8 regen)
- TOOLTIP isolated (`pnpm agentct Tooltip --e2e`): 13/15, SAME 2 reds (TT-CLOSE-01 toBeVisible nested-tooltip-content not found; TT-FOCUS-03 toHaveAttribute). Deterministic, zero snap involvement → PRODUCT failures, FILED, not fixed. Repro: /tmp/c-snapshot2-tooltip.txt. (Carries into proof sweep as known reds.)
- ACCORDION serial: 19/21, same 2 reds bit-exact (1235/826) → load-independent. Eyeball single-resting: expected FULL-width accordion vs actual NARROW (~330px) — coherent layout drift. Source: story `maxW="100r"` added by 52c25b2d6 P2D (09-28), baselines pinned 09-18 (b593ce019). 1235px < 7680px old budget → masked at 0.02, exposed at 0.001 = policy working. REAL DRIFT → ADOPT.
- Abort-hiding: test1 fails at line 35 → hides 8 snaps; test2 fails at line 93 → hides 3. Serial -u rewrote 8 page PNGs exactly; 5 locator PNGs byte-identical (crops unaffected). -u run hit daemon-death INFRA (ERR_CONNECTION_REFUSED :3101, tests 8-21) AFTER snap tests 1-7 passed — regen complete, failures unrelated.
- Post-regen old-vs-new: 6× same-signature (1235/826), 2× larger (trigger-1/3-focused 3029/3027) — eyeballed: full-width focus ring → narrow-container ring, same width cause. Adoption STANDS.
- Verify: **21/21** + unit 32/32. (`/tmp/c-snapshot2-accordion-verify.txt`)

## T+60 — Calendar DONE (7 regen) + daemon-death INFRA ×2
- CALENDAR serial: 83/85, same 2 bit-exact (3178/3316) → load-independent. Eyeball: expected Aug-2026 grid WITHOUT outside days + "August 2026 ▼" + 2-letter headers vs actual WITH outside days (Jul 26-31/ Sep 1-5) + no chevron + 3-letter headers = REAL feature drift. Source: Calendar.tsx P2B 0a3ee0e7b (09-28), baselines pinned c983e676f (matrix migration). → ADOPT.
- Abort-hiding: test1 fails line 28 → hides 4; test2 fails line 63 → hides 1. -u attempt #1: 0/85 — daemon :3101 DEAD on arrival (infra, no files touched). Revived via `pnpm agentct Calendar --e2e` (83/85 parallel, same 2). -u #2 serial: 85/85, all 7 PNGs rewritten. (Daemon-death #2 this box; C-SNAPSHOT had 2 as well — recurrent infra flake, always revived by agentct.)
- Post-regen old-vs-new: all 7 in 3175–3453 band; range-selected diff eyeballed = same outside-days signature. Adoption STANDS.
- Verify: **85/85** + unit 68/68. (`/tmp/c-snapshot2-calendar-verify.txt`)

## T+70 — Popover DONE (2 regen)
- POPOVER serial: 18/19, sole red escape-open bit-exact 5874 → load-independent. Eyeball: expected SMALL popover ("Popover title", "Open popover") vs actual RICH Basic story (header + content + input + close + "Outside Button"). Source: Basic-story enrichment (string blame c983e676f 09-13), escape-open.png pinned ANCIENT (d513c58be). 5874 < 7680 → masked at 0.02, exposed at 0.001 = policy working. REAL DRIFT → ADOPT.
- Abort-hiding: escape test fails line 50 → hides line 57 (escape-dismissed). Serial -u: 19/19, exactly 2 PNGs rewritten. Post-regen: escape-dismissed new = correct closed state (focused "Open Popover" + "Outside Button", focus returned). Adoption STANDS.
- Verify: **19/19** + unit 20/20. (`/tmp/c-snapshot2-popover-verify.txt`)

## T+75 — BOX LINE: stop adding sets; Splitter DONE (7 regen, verify→proof)
- SPLITTER serial: 77/79, same 2 bit-exact (1573/999) → load-independent (telemetry 99k/60k raw-diff is AA-noise the comparator excludes; comparator truth stands). Eyeball: expected FULL-width vs actual NARROW (~330px) 40/60 panes — same width class as Accordion. Source: story container `width="100r"` added by P2F b32b3f946 (09-28), baselines pinned c983e676f. REAL DRIFT → ADOPT.
- Abort-hiding: SP-DOM-01 fails line 107 → hides 4; SP-DOM-02 fails line 403 → hides 1. Serial -u: 79/79, all 7 PNGs rewritten. Post-regen old-vs-new 999–4099 (state-dependent, same cause); vertical-resized-51 eyeballed = correct narrow 51/49 + focused handle. Adoption STANDS.
- BOX RULE: per-component parallel verifies for Splitter/Showcase/Tree deferred to the final proof sweep (serial==parallel counts already proven bit-exact per component, so parallel equivalence holds; -u serial pass = baseline proof). Adoption (CARRY 1) formally CARRIED — no box left.
- Verify: serial -u 79/79; parallel proof via final sweep.

## T+80 — Showcase DONE (11 regen, two-in-a-row serial)
- SHOWCASE serial: 0/3, same 3 bit-exact (448/448/7420) → load-independent.
- showcase-resting/active eyeball: ONLY diff = "Custom warning styling" Field lost its ORANGE border (#f19301→dark). Same Field-border-restlyle wave as C-SNAPSHOT Field sets. REAL DRIFT → ADOPT (flag: warning affordance visibly weaker — captain may want product eyes).
- shebang-tier1 eyeball: old baseline shows "All 12 cluster…" tooltip; actual doesn't. Root-caused, NOT baked blindly: trigger is Tooltip openDelay={50} on health badge (Overlay.book.tsx:647-657, FullShebangCascade re-exported); test never hovers/focuses it (click + 400ms + snap) → absence is CORRECT current behavior; old pin captured an incidental tooltip. Book evolved post-baseline (04cd19bda etc. > c983e676f). → ADOPT.
- Tool-tip cross-check: tier5-tooltip-open NEW shows its tooltip correctly (test DOES trigger it) → hover path works; tier1 absence is trigger-absence, not the filed TT product bug. Caveat logged: TT fix may re-flip tier1 if focus paths change.
- Abort-hiding: test2 fails line 63 → hides 2; test3 fails line 98 → hides 7 (line 90 shebang-resting passed). -u #1 hit daemon-death #3 (0/3, nothing written); revived via agentct (0/3 parallel, same reds); -u #2 serial 3/3, 11 PNGs rewritten (shebang-resting + unwind-tier1-all-closed byte-identical).
- Post-regen old-vs-new: 448×3 orange sig; 612×2; 770; 917; 3051/3091 tier-pair; 6791 modal-active (eyeballed: clean modal + stepped NF 43 + disabled switches, sane); 7420 tier1. tier4-diff eyeballed = modal text/chrome restyle. Two-in-a-row serial (u + confirm 3/3) proves cascade deterministic — no TOL needed. Adoption STANDS.
- Verify: serial 3/3 ×2; parallel proof via final sweep.

## T+85 — Tree DONE (9 regen) + ORPHAN CORRECTION
- TREE serial: 51 passed / 16 failed = 3 snap reds bit-exact (1200/3129/1192) + 13 daemon-death INFRA (death #4: 12× refused + 1× fetch-fail late in file). Snap data (tests 1-3, pre-death) VALID. Parallel confirm via agentct (revive): 64/67, same 3.
- Eyeball: expected FULL-width tree + full-width selection bar vs actual NARROW (~270px) — same width class. BUT: story maxW="80r" predates baselines (c983e676f) → mechanism is NOT a new story constraint (unlike Accordion/Splitter); likely Div/maxW-application or Tree change post-pin (Tree.tsx: P2A 80f4f6a7b etc.). Mechanism open, drift deterministic+coherent → REAL DRIFT → ADOPT.
- Abort-hiding: DOM-01 fails line 28 → hides 8; KEY-02 fails 142 → hides 1; DOM-02 fails 175 → hides 1 (tree-multi-root-default!). All 13 Tree snaps live in the 3 red tests → targeted serial -u `-g "TR-DOM-01:|TR-KEY-02:|TR-DOM-02:"`: 3/3 in 13.2s, 9 page PNGs rewritten, 4 locator PNGs byte-identical (crop-immune, same as Accordion).
- ORPHAN CORRECTION: tree-multi-root-default is CALLED (line 176 `snap(multiRoot, …)` — camelCase target missed by my `[a-z]+` census pattern) → NOT an orphan. Tree orphans = 2 (tree-focused-folder, tree-focused-readme), total orphans = 31 = file delta exactly. No missing PNG anywhere.
- Post-regen old-vs-new: 1064–1200 band ×7 (same narrow sig) + 3129/3215 arrow-pair; arrowright-child-focused eyeballed = correct narrow + focus ring. Adoption STANDS.
- Verify: targeted serial -u 3/3; parallel proof via final sweep.

## T+90 — ORPHAN PRUNE COMPLETE (31 deleted, exact parity)
- Gate: every orphan name rg'd repo-wide (excl. __snapshots__) — 28/31 zero refs. 3 substring suspects cleared precisely: Popover hover-open.png is LIVE (Popover.ct.spec.ts:166 — never listed); Tooltip hover-open/focus-open orphans stand (no exact snap() in Tooltip spec; hits are longer names/docs/prose); click-open refs are prose/testIDs. zz-f59-probe temp no longer exists. Per-dir resolution means cross-component same-names can't collide.
- DELETED (git rm, 31): FL fl-trap-open; OV drawer-×4, overlay-anchored-×3, overlay-dialog-×3, stacked-modals-×7; Popover click-×3 + hover-dismissed/resting; Tooltip focus-×3 + hover-×3; Tree tree-focused-folder + tree-focused-readme.
- Post-prune: FL 29/29, OV 17/17, Pop 13/13, TT 13/13, Tree 13/13; total 349 PNGs = 349 calls. Called-set ≡ pinned-set (modulo 5 cross-component shared names: resting, single-resting, etc. — per-dir template keeps them distinct).
- Regen total this box: 8+7+2+7+11+9 = 44 PNGs (git status confirms 44 M).

## T+95 — UNIT TRIAGE UPDATE + proof sweep launched
- ISOLATED `pnpm agentct NumberField --unit`: **131/131 PASS** (2 files) — the sweep's 5 failures (126 tests in NumberField.test.tsx: PARSE-19/15, COMMIT-04/05, KEY-06) do NOT reproduce isolated. Verdict: suite-order/worker-dependent (full-70-file-run-only), still product-assertion surfaces (Intl/commit/stepping), still NOT mine. Filing updated: repro = bare `pnpm agentct` unit leg only. Proof sweep below doubles as the two-in-a-row check — if the 5 vanish there too, they were sweep-load flakes; if they persist, suite-pollution, filed for owner.
- Proof: bare `pnpm agentct` → /tmp/c-snapshot2-proof.txt (running).

## T+110 — CLOSE. Verdict: ALL 0.001 REDS OWNED; adoption CARRIED
- PROOF SWEEP: E2E **1221/1223** — sole reds = the 2 FILED Tooltip behavior failures (TT-CLOSE-01, TT-FOCUS-03). All 13 snapshot reds + all abort-hidden (44 PNGs) GREEN in parallel. Unit: 952/956 — 4 NF fails (PARSE-19, PARSE-15, COMMIT-05, KEY-06; COMMIT-04 flipped to pass vs sweep 1) — full-suite-only, membership unstable across runs, isolated 131/131 → suite-load/pollution flake class, product surfaces, FILED. Raw: /tmp/c-snapshot2-proof.txt. EXIT=1 solely on filed items.

### Final disposition table (15 sweep reds + 5 unit)
| # | red | disposition | proof |
|---|---|---|---|
| 1–2 | Accordion legacy-smoke ×2 (+11 hidden) | ADOPT 8 (P2D maxW story drift) | 21/21+32u, proof green |
| 3–4 | Calendar ×2 (+5 hidden) | ADOPT 7 (P2B outside-days feature) | 85/85+68u, proof green |
| 5 | Popover Escape (+1 hidden) | ADOPT 2 (Basic-story enrichment, ancient pin) | 19/19+20u, proof green |
| 6–7 | Splitter SP-DOM-01/02 (+5 hidden) | ADOPT 7 (P2F width=100r story drift) | serial 79/79, proof green |
| 8–10 | Showcase ×3 (+9 hidden, 2 identical) | ADOPT 11 (Field-border wave + book evolution + incidental-tooltip pin) | serial 3/3 ×2, proof green |
| 11–12 | Tooltip TT-CLOSE-01/TT-FOCUS-03 | FILED product (deterministic behav, 2-in-a-row) | repro /tmp/c-snapshot2-tooltip.txt |
| 13–15 | Tree ×3 (+10 hidden, 4 locator-identical) | ADOPT 9 (narrow-container drift, mechanism open) | targeted serial 3/3, proof green |
| U1–U5 | NF unit PARSE-19/15, COMMIT-04/05, KEY-06 | FILED product (full-suite-only flake; isolated 131/131; proof shows 4/5, membership flipped) | repro = bare agentct unit leg |
- TOL count this box: ZERO (every red classified real-drift/filed; no nondet needed tolerance).
- Tree: 44 M (regen) + 31 D (orphans) + this log (untracked). All owned. NO commits (captain verifies + commits per-arc).
- INFRA tally: daemon :3101 died 4× this box (all revived via agentct; 2× mid--u with zero wrong writes — -u failures leave baselines untouched, verified via git status).
- CARRY 1 — PER-BROWSER ADOPTION (unchanged from C-SNAPSHOT CARRY 1, still valid): template one-liner + bulk git mv + serial FF/WK generation; priority Presence/Portal/Menubar then F04 list; all /tmp vehicles persist; F04 /tmp candidates remain STALE (more regens landed under them). Needs a fresh 90-min box.
- CARRY 2 — BROAD SWEEP: DONE by this crew (proof sweep above). FINISH-06 full gate still captain's.
- Resume checklist: [ ] captain firsthand verify + commit per-arc (44M+31D) [ ] TT-×2 + NF-unit filings to owners [ ] adoption box (CARRY 1) [ ] FINISH-06. Raw logs: /tmp/c-snapshot2-*.txt + /tmp/c-snapshot2-eye/ + /tmp/c-snapshot2-serial.mjs (all /tmp, uncommitted).
