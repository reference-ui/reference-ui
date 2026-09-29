# FINISH-05 — React-17 shadow-composition anomaly root-cause

CLOSED — crew ran ~01:00–02:05 UTC 2026-09-29, in-box. Captain-verified: NF byte-clean, probe deleted, raw logs confirm 64/64 anomaly-order r17 + 116/116 majors + FF/WK 58/58.

Scope: NumberField/ dir only. Sibling crew on Toast/Tooltip/Tree — never touch.
Anomaly: NFLAST4.md — programmatic staging after shadow composition-invalidation
swallowed on React 17 only. Repro: COMP-04 order with stage/reset after the
composition block, --react 17.

## 01:20 — Probe round 1 (r17 genuine 17.0.2, temp Finish05.ct.spec.ts)

- P1 visibility: `docInput:0, shadowInput:2, nodeInput:2` — synthetic
  non-composed events ARE shadow-trapped on 17; React blind (`log:none`).
- P2 anomaly order + double stage: `v1=abc v2=abc log=12001` — NO
  SWALLOW. Anomaly NOT reproduced with stage-immediately-after-fallout.
- P3 plain staging: `v=abc` fine. P4 composed:true: `v=xyz vAfter=xyz`.
- Full log: /tmp/finish05-r17-probe1.txt ("E2E: 4 | Passed: 4").
- Next: exact-replica probe (toHaveValue assertions + reset click, as
  in original order) ×2; then stage-after-set-5005 variant.

## 01:30 — Probe round 2 (exact replica + late variant + r19 parity)

- P5 exact original order (toHaveValue + reset after composition):
  `FINISH05-P5 major=17.0.2 ANOMALY-ORDER-GREEN` — green on genuine
  r17 (/tmp/finish05-r17-p5a.txt, "E2E: 1 | Passed: 1").
- Full probe file on r19: all 6 green; P1 trap counters IDENTICAL to
  r17 (`docInput:0`, `log:none`) — the shadow trap is
  major-independent (/tmp/finish05-r19-probe.txt, "E2E: 6 | Passed: 6").
- Probe round 2 on r17: all 6 green incl. P6 late variant
  (`v=abc`) — P5 two-in-a-row GREEN (/tmp/finish05-r17-probe2.txt).
- Harness/engine/story unchanged since NFLAST-4 landing (AXE infra
  predates it and is additive-only); the anomaly cannot be an
  already-fixed regression.

## 01:50 — Full-suite anomaly-order run (H-A: suite-context dependence)

- Temporarily restored the anomaly order in the REAL COMP-04 (moved
  the stage+reset block back after the composition block), ran the
  FULL suite on genuine r17:
  "react17 NF-COMP-04 ... PASSED (790ms) / E2E: 64 | Passed: 64 |
  Failed: 0" (/tmp/finish05-r17-full-anomaly-order.txt; 64 = 58
  suite + 6 temp probes).
- Temp reorder reverted via `git checkout`, probe spec deleted.
  `git status --porcelain -- NumberField/` EMPTY — zero residue.

## 02:05 — VERDICT: no defect — transient, workaround accepted (no fix)

No root fix: there is no defect to fix. Evidence:

1. The suspected mechanism (fallout-swallow interplay on 17's shadow
   event path) is UNREACHABLE in this fixture: P1 proves the
   synthetic composition/input events are shadow-trapped on ALL
   majors (`docInput:0`, identical counters 17 vs 19), so React —
   on every major — never sees compositionstart, never arms
   `compositionFalloutRef`, and never observes the staging input.
   A 17-specific engine interplay cannot exist where the engine
   observes nothing on any major.
2. The anomaly order is green on genuine r17 three independent ways:
   isolated exact-replica ×2 (P5 two-in-a-row) + full 64-test suite
   with the anomaly order in the real spec. The single NFLAST-4
   observation (made under a 15-min cap, never re-verified in
   isolation) matches the carried kill-leg-flake class
   (load-sensitive noise, green on isolated re-run — FINISH.md
   Carried list), not a systematic 17-only behavior.
3. Behavior-neutrality of the landed (workaround) order is proven
   both ways: the staging/reset assertions are engine-blind DOM
   operations (native setter + native reset) whose predicates are
   identical in either position, and BOTH orders are empirically
   green on r17 — order cannot affect engine state the engine never
   observes.

Recommendation: PERMANENTLY ACCEPT the landed order (zero churn —
keep the workaround text in the spec as-is; it is harmless and
already captain-verified). Do not staff further. Close FINISH item 6.

Five-leg re-proof on the landed order (this session, quoted):
- `pnpm agentct NumberField` → "Unit: passed | 131 tests" +
  "react19: 58 passed | 0 failed" (/tmp/finish05-gate-default.txt)
- `--e2e --react 17,18` → "react17: 58 passed / react18: 58 passed |
  0 failed" (/tmp/finish05-gate-1718.txt)
- FF vehicle → "PASSED: 58 passed (0 failed) in 15.9s"
  (/tmp/finish05-gate-ff.txt)
- WK vehicle → "PASSED: 58 passed (0 failed) in 15.0s"
  (/tmp/finish05-gate-wk.txt)

HQ SIGN-OFF (captain countersign): "FINISH item 6 — React-17
shadow-composition anomaly accepted as unreproducible transient
(single observation, 3× isolated + full-suite green on genuine
17.0.2, suspected mechanism proven unreachable by shadow-trap
counters identical on 17/19). Landed COMP-04 order kept as-is;
no engine change. HQ: captain-ruled per 2026-09-29 autonomy directive (reversible; veto reopens FINISH item 6). Date: 2026-09-29"

## RESUME CHECKLIST (close)

- Done: verdict ACCEPT (no fix), rationale + HQ sign-off line above.
- Tree: NumberField/ byte-clean vs HEAD (temp reorder reverted,
  probe spec deleted). Own files: this log only.
- Raw logs: /tmp/finish05-r17-probe1.txt, -r17-p5a.txt,
  -r19-probe.txt, -r17-probe2.txt, -r17-full-anomaly-order.txt,
  -gate-default.txt, -gate-1718.txt, -gate-ff.txt, -gate-wk.txt.
- Sibling crews untouched (Toast/Tooltip/Tree + others never opened
  for edit). Never committed, per crew law.
- DONE.
