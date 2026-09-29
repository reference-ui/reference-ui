# SPLIT — objective log

IN PROGRESS

Scope: Splitter cluster (F59–F68) + 4a execution (HQ: proceed if
clean). Phase 0: locate 4a (grep DECISIONS.md + Splitter docs) +
settle F59–F68 probes (end-counts, selection lock, cleanup,
F64 rounding tolerance?). Implement 4a + fixes ONLY if the text
and mechanism are clear; ambiguous → hold-and-report with evidence
(the "if ok" gate — never grind, never guess). SPEC'd behavior
only: NO prop/type/export changes. Box: 75 min. Crew writes below.

## 21:47 UTC — Phase 0 locate DONE + probes launched
- 4a text (root DECISIONS.md:181): "Delete the legacy names (clean
  shipped API)." HQ: "RULED 4a (delete; pre-production, no such
  thing as legacy, maintain no legacy props)" (DECISIONS.md:19-21;
  "Execution ON HOLD" there superseded by LOG.md: "Splitter 4a
  if-clean" + this mission's if-ok gate). Text unambiguous.
  Cleanliness TBD: alias use in Splitter.tsx:72-82,201,211-227
  (+stories/tests?); must check no out-of-dir consumer breaks.
- F59–F68 texts: SWEEP.md:149-165 (FF: F59-64; WK: F62,64-68).
- VP 800x480 (sweep-ct.config.ts); failing drags release at
  (1270,y)/(640,690) = OUTSIDE viewport → FF no-end class suspect.
  WK userSelect: `style.userSelect` reads `undefined` per F66/F68
  (expando, no real lock → F65/F67 selection leaks).
- Probe: Splitter/__e2e__/SplitProbe.ct.spec.ts (throwaway, delete
  after). Running FF+WK now via sweep config.

## 22:15 UTC — Phase 0 verdicts + Phase 1 implemented
- F59-61 FF end-counts: TEST ARTIFACT. Outside-viewport release
  (640,690)/(1270,y) vs 800x480 VP: FF delivers NOTHING outside
  (PROBE-END-OUTSIDE trace ends at last inside move, ends=0,
  resizing stuck true); inside-VP control ends=1. Fix: coords to
  (640,470)/x=798 — still outside-handle/beyond-group-edge.
- F63 FF COMP-02 signals: SAME CLASS. Drag 404+120=524px exits VP;
  FF sends buttons=0 garbage move (0,-85) → correct SP-DRAG-09(iii)
  abort. Fix: +60px (stays in VP, still clamps 76,24).
- F62 cancel attr (both): TEST ARTIFACT. Explicit
  releasePointerCapture fires lostpointercapture ONLY on Chromium
  (probe lost=1 vs FF 0 vs WK 0; implicit release fires
  everywhere). Fix: dispatch synthetic lostpointercapture — the
  abort handler is what's held.
- F64 rounding (both): TEST ARTIFACT. Denominator identical all
  engines (400/9/-4/-4 → 399.0); divergence is origin clientX
  rounding (Chromium fractional vs FF/WK integer) against the
  float synthetic move. Math: 50/399→52.531, 50.117/399→52.561.
  Fix: ±0.05 (toBeCloseTo,1) on 3 signals + ends text.
- F65/F67 WK selection: PRODUCT BUG (Splitter.tsx). WK has no
  userSelect IDL (`propType: undefined`) and ignores unprefixed
  user-select (setProperty no-op, computed ""); assignment was a
  dead expando → selection "\nRight (40%)". Fix: setProperty
  user-select + -webkit-user-select, exact restore. PROVEN:
  manual prefixed lock → selection "".
- F66/F68 WK cleanup undefined: SAME ROOT (never-assigned IDL
  reads undefined). Fix: test reads
  getPropertyValue(std)||getPropertyValue(webkit) (16 sites).
- F63 vs F67 "same case?": NO — different engines, different
  mechanisms (FF viewport abort vs WK missing lock).
- 4a: text unambiguous (DECISIONS.md:181 + LOG "if-clean"). CLEAN?
  NO — consumer-smoke template (out-of-dir,
  scripts/consumer-smoke/template/src/app.tsx:288,292) uses
  minSize/maxSize → deletion breaks it; outside my file set.
  → HOLD 4a, report. Full grep cut off; confirming.
- Implemented: Splitter.tsx lock fix + restoreInline; spec:
  coords, synthetic lostcapture, epsilon, 16 lock-reads.

## 22:32 UTC — FINAL: cluster CLOSED, 4a HELD (report)
- SUITES: Chromium `pnpm agentct Splitter` 79/79 e2e + 35 unit;
  FF 79/79; WK 79/79 (sweep config, --ignore-snapshots).
  F59–F68 all green on all engines. Probe spec DELETED.
- Files touched (in-set only): Splitter.tsx (lock+restoreInline),
  Splitter.ct.spec.ts (coords/lostcapture/epsilon/16 reads).
- 4a HELD (if-ok gate): text clear, execution NOT clean.
  Evidence: consumer-smoke template
  (scripts/consumer-smoke/template/src/app.tsx:288,292 — OUT OF
  DIR) renders minSize/maxSize, and run.mjs runs a `tsc types
  check` on the scaffolded consumer → alias deletion fails the
  smoke. Also in-dir contract tests
  (Splitter.contract.test.tsx:359-388) pin the aliases, and
  Splitter.story.tsx:1687-88 + DECISIONS smoke-shape note agree.
  Deletion needs a crew holding scripts/consumer-smoke too.
- Resume checklist: (1) crew with Splitter+smoke scope deletes
  alias props/resolution/css-strip (Splitter.tsx:72-82,201,
  211-227), (2) rewrites contract tests + story to min/max,
  (3) migrates smoke template (minSize→min etc.), (4) reruns
  agentct Splitter + consumer-smoke + FF/WK Splitter suites.

## Captain verification + landing

- Firsthand: Chromium 79/79 + unit 35/35; FF 79/79; WK 79/79
  (output captured to file per the vehicle lesson). Matches crew.
- Fix reviewed: prefixed+unprefixed setProperty lock with exact
  restore (removeProperty when absent) — clean, commented, no
  API change. Spec verdicts sound (viewport coords, synthetic
  lostcapture, epsilon, 16 lock-reads).
- 4a hold ACCEPTED: out-of-dir consumer-smoke template + tsc
  gate makes deletion unclean from a Splitter-only lane. Queued:
  follow-up crew with Splitter+scripts/consumer-smoke scope.
- Committed (arc + this log). Cluster CLOSED, 4a HELD-clean.
