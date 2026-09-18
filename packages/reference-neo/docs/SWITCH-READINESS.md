# Switch readiness (MVP) — reference-core's Panda pipeline (G6, captain, 2026-09-17)

Question (the MVP gate): what would it take for `packages/reference-lib`
to point its `.reference-ui/` at Neo? Evidence: 128/128 cases green, q 0 errors (7
pre-existing warnings), 208 unit tests, PARITY-01..04 green, 152-entry
absence census equal to the SPEC union, full catalog in 39.2s wall.

## What still has to happen (cutover blockers, not voyage work)

- **Watch loop** (`ref sync --watch` alignment/discovery/deletion). Neo is
  serial `sync()`; SYNC-06/07 prove the serial equivalents only.
- **Vite plugin or CLI hook.** `neo sync|clean` (bin/neo.ts) works in a case
  world; no bundler plugin wires it into a dev server yet.
- **Book integration.** The component workshop still renders through core.
- **Matrix packages.** The hermetic React/bundler matrix still tests core's
  pipeline; Neo's contracts there are unproven.
- **`strict`/`layers` config (D17).** Typegen stays callable but unexposed;
  strictTokens narrowing is an approved absence.
- **D19 `types/` leg.** 13 lib-src files cannot build under Neo until the
  Reference-browser voyage ships an emitter. Largest single blocker.

## Which absences would bite lib authors first

1. **D19 `types/`** — real files fail, not edge cases. Bites on day one.
2. **RS-14 extract shapes** (SITE-01/02/03: ternaries, const maps, spreads).
   Utilities emit; runtime `css()` returns `''`. Common authoring.
3. **RS-17 `_file`** — 3 lib uses; warns `Unknown condition` today.
4. **RS-12 parent combinators** — `input:hover &` yields zero classes,
   zero diagnostics. Silent.
5. **RS-16 keyframe refs** — token/rhythm refs print literally; the
   hand-written `var(--…)` workaround is documented and proven.
6. **RS-18 locations, RS-19 bool macro, RS-22..25** — diagnostics-only,
   unowned authoring, or probe-cited; bite later or never.

## Remaining RS lane (all in-progress, owned by the RS liaison)

RS-5, RS-11, RS-12, RS-14, RS-15, RS-16, RS-17, RS-18, RS-19, RS-22, RS-23,
RS-24, RS-25, RS-13 (trust infra), RS-6 (docs). Landed: RS-1/2/3/4/7/8/9/10.
RS-20/21 R1-cleared to probes, never filed. Liaison order in PLAN §5.3.

## §0.3 note (read into the record)

Item 1's "none blocked-on-rs" cannot mean a drained lane: §12 itself asks
which RS items *remain*, and G3/G4 explicitly permit blocked rows with
owned in-progress RS rows. Ticked reading: zero `open`/`in-progress`
(true), 12 blocked rows each citing an in-progress owned RS row (true,
census-verified). Items 2–5 tick clean (D1 re-verified: one doc comment
plus the constant; determinism proven by double-sync diff).

## S3 revisit (Voyage Two, captain, 2026-09-18)

Evidence: 141/141 cases green (138 unique product rows, all `done`, plus
CSS-02 cross-listed in RESP and 3 harness-infra cases green rowless by
design per PLAN §8.1); q 0 errors (7 pre-existing warnings); 211 unit
tests; PARITY-01..04 green; atomic vitest 188/189 with the sole red the
filed RS-32 stop-line; cargo 215/0.

RS lane: drained. RS-1..RS-19 and RS-22..RS-30 all `done` with stations;
RS-20/21 R1-cleared and never filed; RS-31 voided (mis-laned, landed as
NEO-PRIM-11). Only RS-32 open — recipe/globalCss diagnostic hygiene
(warning dedupe + `fontFamily` lookup); output-correctness-neutral.
The G6 bite list (RS-14/RS-17/RS-12/RS-16) is fully retired.

Recommendation: ORBIT-ready. The cutover blockers above stand unchanged
(D19 `types/` leg largest; watch loop, Vite hook, Book, matrix unproven)
— but every voyage-side item is closed. RS-32 may land before orbit or
ride it; it changes warning counts only. No switch tonight per standing
orders; orbit-then-landing is HQ's call at dawn.

## Recommendation: HARDEN (bounded), then cut over

Do not cut over today: D19 + RS-14/RS-17/RS-12 touch real lib authoring.
But the landing is already cheap by construction — lib's component suite
plus snapshot tests are the final gate, pixel-for-pixel, maintained by
someone else. Post-voyage shape (human 2026-09-17): ORBIT first (Neo
shadowing core's output, diffing sheets, running lib's suite against Neo
output uncommitted), then the LANDING SEQUENCE as its own thing. Harden
during orbit: drain RS-14/RS-17/RS-12, scope D19. Everything else is
absent-by-decision with lib's snapshots as witnesses.
