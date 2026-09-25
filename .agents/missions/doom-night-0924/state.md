Status: COMPLETE — all 12 finds confirmed, 1 clean; morning report written; holding for landing orders

# Doom Night 2026-09-24 — captain's board

HQ orders (23:5x): doom swarms on diagnostics core + full error-code
integrity audit. Rounds to a natural stop (exploration → sharp edges →
calm), not all night. General Neo/RS voyage after, only if time.
Landing tomorrow — NO commit tonight.

## Stop rule

- Diagnostics rounds capped at R3. Stop after any round with zero new
  sharp (user-facing or integrity) breaks.
- Reproduce crews ride the following round (1 per break-found).
- Captain triages (BREAK vs CURIO); fortify + chain review + commit
  are tomorrow's landing sequence.
- General voyage: 1 round, ≤4 hunters, after diagnostics conclude
  (calm or R3 cap), as the final round, time permitting — per HQ's
  "last voyage tonight" order. Otherwise hold for morning orders.

## Rounds

| Round | Hunters | Status | Breaks | Clean |
| --- | --- | --- | --- | --- |
| R1 diagnostics | atomic BREAK, tasty BREAK, trio BREAK, neo BREAK, audit BREAK(curio) | closed | 5 | 0 |
| R2 repro+banked | repro 5/5 ✓, stardefault BREAK, tasty2 BREAK | closed | 2 | 0 |
| R3 final-diag | repro-star ✓, repro-typeof RACE, defaultas BREAK, sttthrow CLEAN | closed | 1 | 1 |
| R4 solo-repro | typeof ✓, defaultas ✓ | closed | - | - |
| G1 general | sync BREAK, extract BREAK, frag BREAK(minor), emit BREAK | closed | 4 | 0 |
| G2 final-repro | extract ✓, emit ✓, sync ✓, frag ✓ | closed | - | - |

## Findings inbox

1. `2026-09-24-night-r1-tasty.md` — BREAK CONFIRMED (user-facing, R2 reproduced):
   two-hop named reexport chains dropped silently, empty barrel map,
   diagnostics []. Repro: /tmp/doom-r1-tasty-two-hop.sh. Needs R2
   reproducer. Banked gaps for R2: star-fold default exclusion,
   cross-file typeof, `export { default as X } from`.
2. `2026-09-24-night-r1-trio.md` — BREAK CONFIRMED (user-facing, R2 reproduced):
   included package scan/read failure drops silently (`continue`,
   diagnostics []), components vanish; lesser failure (unresolvable
   include) warns, and local scan failure mints ATL-E-SCAN-FAILED —
   same condition, divergent signal. Repro:
   /tmp/doom-r1-trio-atlas-pkg-silence.sh. Needs R2 reproducer.
   Carried: styletrace coded throws bury code under prose prefixes
   vs tasty/typegen code-first.
3. `2026-09-24-night-r1-neo.md` — BREAK CONFIRMED (user-facing, R2 reproduced):
   sync error throws drop stable codes (message+location only);
   sole error surface, so CLI failures + --json stderr causes are
   codeless and `rg -c` error censuses impossible. Repro:
   /tmp/doom-r1-neo-red.mjs. Needs R2 reproducer. Also confirms
   clean: WARNING_HINTS coverage, fold-count reconciliation.
   Carried: dedupe-vs-presentation identity gap (no trigger found).
4. `2026-09-24-night-r1-audit.md` — BREAK CONFIRMED (curiosity, R2 reproduced):
   REGISTRY.md normative "Valid:" example cites orphan code
   ATL-W-UNRESOLVED-PROPS (real: -TYPE); occurs nowhere else. Full
   73-code table verified (defined-once, emit sites, repro rows,
   hints, gates, wire values all resolve) + 7 lesser observations
   (L1–L7) for architects. Repro: /tmp/doom-r1-audit-repro.sh.
   Needs R2 reproducer (trivial).
5. `2026-09-24-night-r1-atomic.md` — BREAK CONFIRMED (user-facing minor, R2 reproduced):
   bare JSX attr refusals (`<Div color />`) warn
   ATM-W-INVALID-CSS-VALUE at -:-:- while every sibling spelling
   is located; span available at emit site, never recorded.
   Repro: /tmp/doom-r1-atomic-bare-attr.mts. Needs R2 reproducer.
6. `2026-09-24-night-r2-stardefault.md` — BREAK CONFIRMED
   (user-facing, R3 reproduced): star barrel mints phantom
   "default" binding (tsc: TS1192, no default export); inverse
   of the R1 drop. Repro: /tmp/doom-r2-stardefault-default.sh.
7. `2026-09-24-night-r2-tasty2.md` — BREAK CONFIRMED
   (user-facing, R4 solo re-run reproduced, tree pristine):
   cross-file typeof over imported static value resolves None,
   diagnostics empty, while local twin resolves; tsc accepts.
   The idiomatic tokens/theme pattern. Repro:
   /tmp/doom-r2-tasty2-cross-file-typeof.sh. (R2 attempt was an
   infra race on the shared test registry, not a verdict.)
8. `2026-09-24-night-r3-defaultas.md` — BREAK CONFIRMED
   (user-facing, R4 solo re-run reproduced): `export { default as
   X } from` drops barrel binding unconditionally + silently
   (shells keyed by declared name, never "default"); tsc accepts.
   Repro: /tmp/doom-r3-defaultas-repro.sh.
9. `2026-09-24-night-r3-sttthrow.md` — CLEAN-HUNT (0 theories):
   prose-buried throw shape confirmed real but contractless; every
   candidate contract killed firsthand. CURIO carried for architects
   (byte parity if a consumer ever anchored-parses). Night's first
   clean — honest triage, no theater.
10. `2026-09-24-night-g1-emit.md` — BREAK CONFIRMED
    (user-facing, G2 reproduced): colliding recipe stems
    (`button`+`Button`) emit duplicate ButtonVariantProps aliases;
    tsc TS2300, diagnostics []. No stem-uniqueness guard (strict
    lane has a `seen` set; recipes don't). Repro:
    /tmp/doom-g1-emit-repro.mjs.
11. `2026-09-24-night-g1-frag.md` — BREAK CONFIRMED (minor,
    G2 reproduced): extends `@layer` statement prints raw names
    while blocks escape them — invalid CSS for scoped names,
    wrong cascade order for comma names. Repro:
    /tmp/doom-g1-frag-red.mjs.
12. `2026-09-24-night-g1-extract.md` — BREAK CONFIRMED
    (user-facing, G2 reproduced 1 passed / 3 failed): const-resolved
    `!` markers pushed raw on value paths → unqueryable plan keys,
    silent no-paint, orphan sheet rule, bogus UnknownColor warning.
    Inline twin splits and paints. Repro:
    /tmp/doom-g1-extract-repro.sh.
13. `2026-09-24-night-g1-sync.md` — BREAK CONFIRMED
    (user-facing, G2 reproduced): watch freezes trigger scope at
    boot; widened include compiles on the config resync but later
    adds under the new glob are silently missed (stale matcher) —
    watch/one-shot diverge, only restart recovers. Repro:
    /tmp/doom-g1-sync-watch-include.mjs. Carried: foreign-cwd
    watch roots may crash subscribe (observed in-harness,
    real-bin crash unrun).

## Wake protocol

On each hunter result: file verdict above, read its log firsthand.
When a round closes: spawn reproducers for breaks, brief next round
or call calm. Never message a hunting crew.
