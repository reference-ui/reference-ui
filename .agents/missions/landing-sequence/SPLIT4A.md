# SPLIT4A — objective log

IN PROGRESS

Scope: execute ruled 4a (delete legacy alias props) with
Splitter + scripts/consumer-smoke scope (SPLIT.md resume checklist:
delete alias props/resolution/css-strip, rewrite contract tests +
story to min/max, migrate smoke template, rerun agentct Splitter +
consumer-smoke + FF/WK Splitter suites). HQ ruled delete (DECISIONS
:19-21, :181); SPLIT crew held it only for scope cleanliness.
This IS the API-shape exception HQ already ruled — delete exactly
the ruled aliases, nothing else. Box: 60 min. Crew writes below.

## T+0 — Phase 0 locate DONE, executing
- Ruling confirmed: root DECISIONS.md:19-21 + :181 (4a delete).
- Path correction: smoke is at
  packages/reference-lib/scripts/consumer-smoke (SPLIT.md said
  scripts/consumer-smoke — does not exist). Template app.tsx:288,292
  confirmed minSize/maxSize; run.mjs:89-94 tsc gate confirmed.
- Alias users (bounded grep): Splitter.tsx (props 212-223,
  destructure 233-234, resolution 244-247), contract tests 342-398,
  story LegacyProps 1660-1723, ct.spec B-28 test (mounts story),
  smoke app.tsx:288,292. probe.mjs LEAK_PROPS is a detector (keep).
  splitter-math minSize/maxSize = solver-internal field names (keep).
  No snapshots touch LegacyProps. reference-docs hits = generated.
- Plan: (1) Splitter.tsx delete; keep Omit exclusion so names stay
  gone, never CSS props. (2) Contract: rewrite B-28 to min/max,
  delete precedence test. Story LegacyProps→NoLeakProps + testids;
  ct.spec mount/testids/DOM-names to match. (3) Smoke minSize→min.
  (4) agentct + smoke + FF/WK.

## T+15 — Edits COMPLETE, proof starting
- Splitter.tsx: deleted minSize/maxSize prop decls + JSDoc,
  destructure lines, ?? resolution (min/max direct); kept Omit
  exclusion + index strip. No other prop/type/export touched.
- Contract: B-28 rewritten to min/max (aria 10/90, DOM names
  min/max/index, leak regex kept as must-never-surface guard);
  precedence test DELETED. Story LegacyProps→NoLeakProps,
  min={10} max={90}, testids noleak-*; ct.spec mount/testids/
  DOM-names updated, console regexes kept.
- Smoke app.tsx:288 minSize/maxSize→min/max, :292 minSize→min;
  index props untouched (pre-existing, out of scope).
- SPEC.md Vitest 35→34. Solver-internal minSize/maxSize
  (splitter-math + toSolverConstraints) and probe.mjs LEAK_PROPS
  intentionally kept. Historical doc notes (DECISIONS.md:150,
  SPEC.md:49) left as record.
- Launching: pnpm agentct Splitter.

## T+30 — agentct GREEN + smoke verdict (migration green, gate red-elsewhere)
- `pnpm agentct Splitter`: E2E 79/79 (react19), Unit 34/34.
  Full log tail quoted in crew result; videos under
  packages/reference-lib/playwright/test-results/.
- Smoke: `check:dist` PASS, `tsc --noEmit` PASS (alias deletion
  type-checks in the scaffolded consumer), `mount-splitter` PASS,
  `b11-splitter-failfast/message/diagnostic-fired` PASS,
  `no-mount-failures` PASS, `zero-true-gap-style-warnings` PASS.
  Full log: /tmp/split4a-smoke.txt.
- Smoke gate red on 3 checks, ALL owned elsewhere (quoted):
  1. `FAIL zero-unexpected-console-errors — Reference UI: Tabs
     renders Tab/Panel parts with no Tabs.List...` (Tabs crew)
  2. `FAIL zero-b03-noise — 1 element.ref errors (B-03,
     presence crew)`
  3. `FAIL zero-race-style-warnings — 10 dev-race warnings
     (H-6 class, timing-flaky)`
  Zero Splitter-attributed noise (allowlisted 2 = expected B-11
  fail-fast). Migration did NOT fight back: tsc + mount + B-11
  Splitter checks all green. No baseline re-run (mechanism is
  conclusive; files outside my lane).
- Next: FF + WK Splitter vehicle FULL green.

## T+45 — FINAL: 4a EXECUTED, all lanes green (report)
- DELETION LIST (Splitter.tsx): `minSize?`/`maxSize?` prop decls +
  JSDoc; `minSize: legacyMinSize` / `maxSize: legacyMaxSize`
  destructure lines; `?? legacy` resolution (min/max direct);
  alias comment. Kept: Omit exclusion (names stay gone, never CSS
  props — new 4a comment), `index` strip, solver internals,
  everything else. No other prop/type/export changed.
- REWRITES: contract B-28 → min/max (precedence test deleted);
  story LegacyProps→NoLeakProps (min={10} max={90}, noleak-*
  testids); ct.spec B-28 mount/testids/DOM-names; SPEC.md Vitest
  35→34; smoke app.tsx:288,292 minSize/maxSize→min/max.
- PROOF (quoted):
  - agentct: `E2E: 79 | Passed: 79 | Failed: 0 / react19: 79
    passed | 0 failed / Unit: passed | 34 tests`
  - smoke: tsc PASS, `mount-splitter` PASS, b11-splitter PASS x3,
    `no-mount-failures` PASS; gate red ONLY on Tabs-diagnostic /
    B-03 / H-6 checks (quoted T+30 note, owned elsewhere).
  - FF: `✔ [agent] Playwright suite PASSED: 79 passed
    (0 failed)` (/tmp/split4a-ff.txt)
  - WK: `✔ [agent] Playwright suite PASSED: 79 passed
    (0 failed)` (/tmp/split4a-wk.txt)
- Tree: 6 files modified (Splitter dir x5 + smoke template),
  tarball artifact removed, dist rebuilt (gitignored). UNCOMMITTED
  per orders. No holds — nothing to resume.

## Captain verification + landing

- Firsthand: Chromium 79/79+34u; FF 79/79; WK 79/79. Smoke:
  tsc progression + mount-splitter + b11×3 + no-mount-failures
  all PASS. Deletion reviewed: exactly the ruled aliases; Omit
  exclusion kept so the names stay gone. Matches crew.
- The 3 foreign smoke reds (Tabs diagnostic, B-03 presence,
  H-6 race) reproduce identically firsthand — real open items
  in untouched files, NOT 4a-caused. Dispatched SMOKEREDS
  micro-crew (diagnose-then-fix, 45-min box) so the gate goes
  fully green; 4a lands on its own green contract.
- Committed (arc + this log). 4a EXECUTED.
