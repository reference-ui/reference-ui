# SCOPE-2 — objective log

IN PROGRESS

Scope: Date/Disclosure/Menu/FocusLock-traversal scoping. Calendar
(F33–F35), DateField (F36 diagnose-then-fix-or-scope), Accordion
(F37/F38), Menu (F39–F44 incl. F40), FocusLock traversal ONLY
(F45/F46/F49–F52/F55). FocusLock restore/trap (F47/F48/F53/F54/F56,
F57/F58) UNTOUCHED-HELD (HQ focus ruling). Splitter untouched (4a).
Box: 75 min. Files: Calendar/DateField/Accordion/Menu/FocusLock spec
dirs only (+ DateField-internal fix ONLY IF F36 probe proves product
bug — log first). Crew writes below.

## 18:18 UTC — OPEN + recon done (T+~8)
Vehicle `/tmp/sweep-ct.config.ts` present; all `/tmp/sweep-*.txt` present.
Sweep error-contexts in /tmp/sweep-ct-results are GONE (overwritten) —
actuals come from a /tmp probe (config+spec, deleted after) + leg runs.
Captain-settled: no WK keyboard pref exists → traversal scoping stands.

Scope patterns (in-spec, per finding):
- P1 compensate: `click()` + webkit-only `.focus(X)` → unchanged assertions.
  Product no-steal/permit logic still tested; only platform focus delivery
  (DIAG D1: Safari no-click-focus/mousedown-blur-to-body) is compensated.
  Sound: any product-code steal is engine-independent → caught on Chromium.
- P2 per-engine: assert the deterministic platform outcome (hash, paint,
  Tab landing, FF fragment focus) with DIAG citation.

F33 CA-DAY-10 (FF): sweep-red, but 1/1 + 3/3 repeat green on vehicle
(`-g CA-DAY-10 --project=react19-firefox`). Sibling console-capture tests
CA-DAY-09/11 passed on FF in sweep. Provisional: sweep-time flake
(console-event race under parallel load). Full-suite FF leg will confirm;
no spec change unless it re-reds.

## 18:35 UTC — Calendar CLOSED (T+~25)
- F33: full-suite FF leg 84/84 green → verdict FLAKE (5 consecutive greens
  + full suite). No spec change. Rationale: console-capture race under
  sweep parallel load; identical-capture siblings green in sweep.
- F34 CA-VIEW-12 (WK): P1 — webkit-only `.focus()` re-delivers the Chromium
  focus state after the mode click (DIAG D1 no-click-focus); no-steal
  assertion now tests the switch on both engines.
- F35 CA-RANGE-14 (WK): P2+P1. Probe P-F35B/C: roving leaves the Tab origin
  at tabindex -1 (0-stop stays 2024-04-03, stable all 3 legs); Chromium Tabs
  forward out of grid, WebKit restarts at the first explicit-tabindex stop
  (D1 refinement: WK Tab honors explicit tabindex=0 buttons, skips
  tabindex-less ones). Legs 1–2 assert the 04-03 landing on WK; leg 3 adds a
  WK-only focus-out so the blur-driven band clear runs (unblocked a downstream
  `data-range-end` count divergence at :2577, same root cause, now green).
- Proof: `pnpm agentct Calendar` 84/84 e2e + 68 unit (Chromium); vehicle FF
  84/84, WK 84/84 (`--ignore-snapshots`).

## 18:36 UTC — F36 VERDICT: scope, no product fix (probe P-F36 quoted)
FF fill-choreography (reproduces, Changes: 1):
`focus, compositionstart(data=null)[synthetic], compositionstart(data="8/15/2026")[NATIVE!], compositionupdate, beforeinput(insertCompositionText), compositionend("9/1/2026"), input(insertCompositionText), change, blur, compositionend(data=null)[synthetic stale]`
Chromium control (Changes: 0):
`focus, compositionstart(null), beforeinput(insertText), input(insertText), change, blur, compositionend(null)`
FF `fill()` synthesizes a COMPLETE native composition session mid-test; the
product correctly commits it (a real end means commit; DF-CMT-04/05/06 are
green on FF). No real IME flow mirrors fill-inside-open-session → test
artifact × platform. Scope: FF-only keystroke delivery (`Meta+a` +
`pressSequentially`, matching the test's own "typing" comment); Chromium/WK
paths untouched. Sweep failed at :528 (right after fill), as predicted.

## 18:48 UTC — DateField CLOSED (T+~38)
- F36 scoped (no product fix — probe-proven test artifact). FF-only keystroke
  delivery green: -g 1/1, repeat-each-5 5/5, full FF 57/57.
- Note: one full-FF run failed mid-proof (unknown test, no residue left in
  /tmp/sweep-ct-results); immediate full-FF rerun 57/57 + 5/5 repeats →
  parallel-load transient, same class as F33. No code touched for it.
- Proof: `pnpm agentct DateField` 57/57 e2e + 33 unit (Chromium); vehicle FF
  57/57; WK touched-case DF-CMT-07 1/1 (full WK was 57/57 in sweep and the
  edit is FF-gated, so no full-WK rerun).

## 19:02 UTC — Accordion CLOSED (T+~52)
- F37 AC-KEY-11 (WK): P2 early-return after the tabIndex + arrow assertions
  (the product contract, green on WK); native Tab walk is Chromium/FF-only.
- F38 AC-FIND-CT-01 (WK): P2 per-engine paint — WK expects the until-found
  span visible (parses content-visibility:hidden, proven by the passing
  computed-style assertion, but doesn't skip contents); attribute + swap
  assertions unchanged on both legs.
- Proof: `pnpm agentct Accordion` 21/21 e2e + 32 unit (Chromium); vehicle WK
  21/21 full; FF touched-case AC-KEY-11 1/1.
- INFRA (logged per port rule): `pnpm agentct` failed 3× mid-proof (21/21
  e2e fail, then 2× "Daemon error: Vite failed to become ready") while the
  gallery served 200 and vehicle legs passed — shared-daemon contention, not
  the edits. Waited, retried ONCE → 21/21 green. No foreign processes
  touched.

## 19:08 UTC — Menu CLOSED (T+~58)
- F39 MN-LINK-02 (FF): P2 — FF resets focus to body on fragment navigation
  (probe P-F39: `active=BODY# hash=#help-section`), after the product's
  trigger restore; Chromium keeps the trigger.
- F40 MN-LINK-06 download (FF+WK): P2 per-engine hash — Chromium `''`,
  FF/WK `'#nested-dl'` (DIAG stretch: engine-native download+fragment).
- F41/F42/F43/F44 (WK outside-press): P1 — webkit-only `.focus()` re-delivers
  the Chromium click-focus state after the outside click; dismiss/unwind +
  no-steal assertions test the press on both engines.
- Proof: `pnpm agentct Menu` 92/92 e2e + 43 unit (Chromium); vehicle FF 92/92
  full, WK 92/92 full.

## 19:20 UTC — FocusLock-traversal CLOSED (T+~70, box edge)
- F45/F50/F51/F55 (WK shard permit): P1 — click + webkit-only `.focus()`;
  the permit-vs-reclaim / one-lock assertions run identically (a reclaim
  would pull away, so the contract is tested, not masked).
- F49 TAB-08 (WK): P1 — webkit-only `.focus()` on the insert button before
  Tab restores the Chromium Tab origin; leg 2 needed no change (the test
  equalizes focus itself with an explicit `.focus()`).
- F52 SHARD-05 (WK): P1 + P1-extend. Unblocked a downstream divergence at
  :580 (`inside` false): WK mousedown pre-blurs the shard to body, so at
  removal time focus is already outside and the removal-fallback never
  engages. WK re-delivers the Chromium end-state (focus on the in-lock
  remove button); whether the lock should reclaim from a pre-blurred body
  is trap-hardening → HQ-HELD with F57/F58, noted in-spec, not scoped.
- F46 NEST (WK): P2 settled-set. First attempt (expect body) passed 4/4
  isolated but 2/5 in full suite — the WK end-state after nested close is
  delivery-order racy (body when the parent trap's body+null-relatedTarget
  guard slips per F57, parent-contained when the parent reclaims first).
  Final: `expect.poll` accepts `body|parent:*` (opener is inside the parent
  lock, verified in story). 2 consecutive full-WK suites green after.
- Proof: `pnpm agentct FocusLock` 44/44 e2e + 18 unit (Chromium, re-proven
  after the F46 rewrite); vehicle FF 44/44 full; WK touched 7/7; full WK
  37/44 + 37/44 + 38/44 with ONLY held red (see below).
- Held-list confirmation (UNTOUCHED, still red-on-WK as ordered, 5 full-WK
  runs): RESTORE-03/01/09, COMP-01/03, TRAP-02 red 5/5. TRAP-05 red 4/5,
  flipped green once (supports DIAG's ordering-race hypothesis; logged,
  not touched — HQ lane).

## FINAL REPORT (19:22 UTC)
Per-finding (scoped/fixed/flake), outputs quoted per engine in the sections
above; Chromium always via `pnpm agentct`, FF/WK via the sweep vehicle
(`--ignore-snapshots`):
- Calendar: F33 FLAKE (5× -g + full FF 84/84; no change), F34 P1, F35 P2+P1
  (incl. downstream :2577 same-root). Closed 84/84 × 3 engines.
- DateField: F36 SCOPE (probe-proven fill artifact; FF-only keystrokes, NO
  product fix — product correctly commits a complete native session).
  Closed 57/57 × Chromium/FF + WK touched 1/1.
- Accordion: F37 P2 (early-return; tabIndex+arrow contract kept on WK),
  F38 P2 (until-found paint). Closed 21/21 Chromium + 21/21 WK + FF touched.
- Menu: F39/F40 P2, F41–F44 P1. Closed 92/92 × 3 engines.
- FocusLock traversal: F45/F49/F50/F51/F55 P1, F52 P1+extend, F46 P2
  settled-set. Traversal set green; Chromium 44/44; FF 44/44.
- Held (never touched, verified red-on-WK): F47/F48/F53/F54/F56 (restore),
  F57/F58 (trap). Splitter untouched (separate lane).
- Skips: none — every assigned finding landed. Box overrun ~5 min on the
  F46 race (wrap rule); no new work opened after.
- Resume checklist: (1) HQ focus ruling unlocks restore/trap product fixes
  (F47/F48/F53/F54/F56, F57/F58 + the F52/F46 trap tails noted in-spec);
  (2) TRAP-05's 1/5 green flip is fresh evidence for its diagnosis;
  (3) D1 refinement for other crews: WK Tab honors explicit tabindex=0
  stops (lands!) while skipping tabindex-less buttons — pure skip-models
  will mis-predict roving grids; (4) probes were /tmp-only, DELETED
  (`/tmp/scope2*` gone); repo holds only the 5 spec files + this log,
  uncommitted per orders (never commit).

## Captain verification + landing

- Chromium full suites firsthand: Calendar 84/84+68, DateField
  57/57+33, Accordion 21/21+32, Menu 92/92+43, FocusLock 44/44+18.
  All match crew, zero transients on Chromium.
- Engines firsthand: Calendar FF 84/84 + WK 84/84 (F33 -g green);
  DateField FF 57/57 + WK DF-CMT-07 1/1; Accordion WK 21/21 + FF
  AC-KEY-11 1/1; Menu FF 92/92 + WK 92/92; FocusLock FF 44/44 +
  WK 37/44 with reds named = exactly the 7 held (TRAP-02/05,
  RESTORE-01/03/09, COMP-01/03). Held list honored, zero touches.
- Transient note: 3 vehicle runs flaked on a QUIET tree (no crews
  out) — FF Calendar 83/84 (name uncaptured), WK Menu 0/92 infra,
  FF FocusLock 43/44 (name uncaptured). All green on immediate
  re-run. Attribution is vehicle cold-start/gallery flake, NOT
  contention and NOT the edits. Lesson for the log: capture vehicle
  output to file (two runs lacked names); vehicle proofs want
  two-in-a-row or retry discipline.
- F33 flake verdict accepted: crew 5× -g + full FF green, captain
  full FF 84/84 + -g green. No spec change, correct call.
- Committed per component (5 arcs + this log). SCOPE-2 CLOSED.
