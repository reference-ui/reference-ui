# Morning report — Doom Night 2026-09-24

Mission: doom swarms on diagnostics core + full error-code integrity
audit, rounds to calm (cap R3), then a general Neo/RS voyage. No
commits — landing held for HQ.

## Verdict

12 finds, **12 confirmed** by independent blind replay, 1 clean hunt.
Zero false positives. The night never went calm — every round stayed
sharp, so diagnostics ran to the R3 cap and the voyage ran as ordered.

## Confirmed breaks (user-facing first)

| # | Log | Break | Severity |
| --- | --- | --- | --- |
| 1 | night-r1-tasty | Two-hop named reexport chains dropped silently, empty barrel map, diagnostics [] | user-facing |
| 2 | night-r1-trio | Included package scan/read failure drops silently, components vanish | user-facing |
| 3 | night-r1-neo | Sync error throws drop stable codes (sole error surface codeless) | user-facing |
| 5 | night-r1-atomic | Bare JSX attr refusals warn at -:-:-, siblings located | user-facing minor |
| 6 | night-r2-stardefault | Star barrel mints phantom "default" (tsc TS1192) | user-facing |
| 7 | night-r2-tasty2 | Cross-file typeof resolves None, diagnostics empty | user-facing |
| 8 | night-r3-defaultas | `export { default as X } from` drops unconditionally + silently | user-facing |
| 10 | night-g1-emit | Colliding recipe stems emit duplicate aliases, tsc TS2300, diagnostics [] | user-facing |
| 12 | night-g1-extract | Const-resolved `!` → unqueryable plan keys, silent no-paint, orphan rule, bogus warning | user-facing |
| 13 | night-g1-sync | Watch freezes trigger scope at boot; widened include silently missed | user-facing |
| 11 | night-g1-frag | Extends `@layer` statement raw while blocks escape (invalid CSS / wrong cascade) | minor |
| 4 | night-r1-audit | REGISTRY.md normative example cites orphan code | curiosity |

Plus #9 (night-r3-sttthrow): CLEAN-HUNT, 0 theories — prose-buried
throw shape confirmed real but contractless; CURIO carried.

## Integrity audit (HQ-ordered "verify them all")

All 73 codes verified: defined exactly once, emit sites with matching
severities, repro rows pinned, hint table complete, gates identical
Rust/JS, every wire value in goldens/specs resolving. Full table in
the audit log appendix, plus 7 lesser observations (L1–L7) for
architects. Only crisp violation is #4 above.

## Repro index (all blind-runnable, all self-cleaning)

- /tmp/doom-r1-tasty-two-hop.sh, /tmp/doom-r1-trio-atlas-pkg-silence.sh
- /tmp/doom-r1-neo-red.mjs, /tmp/doom-r1-atomic-bare-attr.mts
- /tmp/doom-r1-audit-repro.sh, /tmp/doom-r2-stardefault-default.sh
- /tmp/doom-r2-tasty2-cross-file-typeof.sh
- /tmp/doom-r3-defaultas-repro.sh (+ /tmp/doom-r3-defaultas-red-test.rs)
- /tmp/doom-g1-emit-repro.mjs, /tmp/doom-g1-extract-repro.sh
- /tmp/doom-g1-frag-red.mjs, /tmp/doom-g1-sync-watch-include.mjs

CAUTION: the tasty plant-bearing repros share one test registry
(tasty src/tests/mod.rs). Run them strictly solo — concurrent runs
race the pristine check (observed once, resolved by solo re-run).

## Landing checklist (tomorrow, per red-team loop)

For each confirmed break: Rule (oracle draws the fortify boundary) →
Fortify (separate crew, pins + regression station, no weakened tests,
per-pair repins) → Chain review (blind repro, suites, diff vs ruling)
→ commit on VERIFIED.

Suggested order: #3 (error codes — touches tonight's CLI surfaces),
#1/#6/#7/#8 (tasty resolve cluster, likely one boundary), #12
(silent no-paint), #2, #13, #5, #10, #11, #4 (one-line doc fix).

## Open questions for HQ

1. Untried surfaces for a future night: styletrace surface
   misresolution, foreign-cwd watch crash (carried, real-bin unrun),
   computed-member/chain/array-slot `!` siblings (same root as #12).
2. Audit L4 (ATM-E-PARSE vs TST-W-PARSE-ERROR severity latitude) and
   L1–L3/L5–L7 wording nits — architect pass, no crews needed.
3. The night never calmed: tasty resolve + emit paths may warrant a
   second targeted night after fortify.
4. Tonight's CLI commit (14 files, verified green) still uncommitted —
   land it first, before any fortify, to keep the CLI contract fixed.
