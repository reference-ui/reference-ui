# Reaper READY ask 4 — CSSOM harness: Node css-tree + Chromium timing

Date: 2026-09-20. Author: Reaper Phase R1 crew (read-only).
Mission: `docs/missions/operation-reaper.md` READY ask 4 (shares Jettison ask 6).

## Verdict: YES on both halves. The harness question is already answered and measured; the Node half needs no new dependency.

## Chromium half — answered by `jettison-ready-06-cssom-probe.md`

The Jettison probe (2026-09-20, deleted after 4 green runs; repro steps in that file)
settled the exposure question this ask shares:

- `document.styleSheets` exposes every linked same-origin `styles.css` with readable
  `cssRules`, enumerable `@layer` blocks, no `SecurityError` — **exposure CONFIRMED**.
- The Neo world harness serves worlds over local HTTP (`tests/shared/runner.ts` +
  `server.ts`); a `case.json` without `"sync"` is serve-only, so a timing world is a
  static dir + a spec — no sync needed.
- Measured cost context: 2,203 rules → ~0.8 ms Set-build; 34,003 rules → 12–16 ms;
  full reload of 36k rules / 1.27 MB → **101–104 ms navigation+parse on localhost**.

R2 wants CSSOM *parse time*, not Set-build time, so Slice 1 times a different thing
through the same door: a temp world linking the fixture `styles.css` and the M500 sheet
(2.2k-rule and 34k-rule cases), measuring navigation/Performance timing around load
(median of 7, cold-vs-warm noted). Method limits carry over from the probe:
localhost only (no throttle in the harness), Chromium only, JIT spread (cold iter ~2×
median at 34k). Same hygiene: delete the temp case + `.artifacts/` + run-log scrub
after the run — R3's "nothing cited lives outside the repo" holds because both sheets
are regenerable (fixture compile; M500 from the Method recipe), so the temp world is
scratch, not a citation.

## Node half — css-tree is already in the tree

`css-tree@3.2.1` (+ `@types/css-tree`) is a devDependency of `packages/reference-rs`
(`package.json:117-121`), installed at `packages/reference-rs/node_modules/css-tree`.
The rs-side census test (ask 2) can `parseSync` both sheets and record wall time with
no new dependency. Neo has no css-tree dep and needs none — R2's Node timing lives on
the rs side, beside the census.

## Slice 1 record list (R2)

Per sheet (fixture, M500): rule count, Node `css-tree` parse ms (median of 7),
Chromium linked-sheet load ms (median of 7 + cold first-iter). M500₇ optional per the
mission — the temp world can carry it for free if the cook wants the third row.
