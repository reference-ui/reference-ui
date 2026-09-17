# Emitted-output coverage map — 2026-09-17

Converged by one oracle from three W0 scout reports per PLAN §6.5: `coverage-lib.md`
(L: lib tree + consumer paths), `coverage-core-neo.md` (C: core/Neo trees vs §4.1),
`coverage-imports.md` (I: Book/CT/matrix/tsconfig specifier census). It maps every
emitted artifact type to a verdict and a §8 row, so W1 cartographers start from this
map instead of memory. Tree note: lib tree 1101 files, `react/` 44 (live `rg --files`;
L's 1110/50 counted a now-gone `.ref-ui-tsgo-*` staging dir — counts are volatile:
Tasty chunks + staging).

## Legend

**E** = §4.1 expected, **F** = §4.1 forbidden, **—** = not in the §4.1 inventory.
**covered** = a case asserts it. **half** = read but never asserted as an artifact.
**unproven** = no case touches it. **covered-against-plan** = asserted present while
the plan says forbidden (must flip in the landing slice). **approved-absence** = deliberately
not reproduced, with the reason recorded in the group SPEC.

## Inventory

| # | Artifact | Core today (lib tree) | Neo today (world tree) | §4.1 | Verdict | §8 row |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `system/package.json` (+exports) | yes (`.`→system.mjs, `./baseSystem`) | yes (`.`, `./baseSystem` → baseSystem only) | E | half (existence only) | SYNC-05 |
| 2 | `system/system.mjs` + `.d.mts` | yes (31 lib-src + 10 matrix real + 4 matrix pins) | missing | E | unproven | SYNC-12, TYPE-05 |
| 3 | `system/baseSystem.mjs` + `.d.mts` | yes (core shape) | stub `{name,fragment,css,jsxElements}` | E | half (existence only) | SYNC-03 |
| 4 | `system/evaluated-system.json` | yes | yes | E | half (existence only) | SYNC-02 |
| 5 | `system/compile-request.json` | yes (frozen keys) | missing | E | unproven | SYNC-04 (RS-1) |
| 6 | `system/jsx-elements.json` | yes (154 merged) | yes (empty merged) | E | half (existence only) | SYNC-02 (merged-count pin → note a) |
| 7 | `system/font-registry.json` | yes | missing | — | unproven | absorb into SYNC-12 or approved absence |
| 8 | `system/{entry,lib,system,types}/` packaged types | yes (41 files) | missing | — | unproven | TYPE-05 or approved absence |
| 9 | `styled/package.json` | yes (12 Panda maps) | yes (no exports map) | E | half (existence only) | SYNC-02 |
| 10 | `styled/styles.css` | yes (27k lines) | yes (native sheet) | E | covered (7 sync cases) | SYNC-02 |
| 11 | `styled/global.css` | yes (Panda base + banner) | 1-line stub | F | covered-against-plan (SYNC-01 asserts exists) | SYNC-02 (D2), GLOBAL-09 |
| 12 | `styled/runtime-data.mjs` (+`.d.mts`) | yes, both | `.mjs` only, no `.d.mts` | E | half (imported, shape unasserted) | SYNC-02 |
| 13 | `styled/css.mjs` (bound executable css) | n/a (Panda `css/` instead) | yes, forbidden-present | F | half (worlds import it; must move) | SYNC-13 (D4) |
| 14 | `styled/types/*.d.ts` (native typegen) | yes, Panda-shaped (14) | missing | E | unproven | TYPE-01/02/03/06 |
| 15 | `styled/css\|jsx\|patterns\|recipes\|helpers` | yes (Panda machinery) | absent (correct) | F | unproven (no absence assert) | SYNC-02 |
| 16 | `styled/tokens\|themes\|extensions/` | yes (Panda unions/themes) | absent (correct) | — | unproven | SYNC-02 or approved absence |
| 17 | `react/package.json` (+exports) | yes (`.`, `./styles.css`) | yes (`.` only) | E | half (existence only) | SYNC-05 |
| 18 | `react/react.mjs` + `.d.mts` | yes (`react.mjs`, 2781 lines) | `index.mjs`+`index.d.mts` (wrong names) | E | half (PRIM-01 asserts `index.mjs`) | SYNC-05 (D5), PRIM-10 |
| 19 | `react/styles.css` (copy) | yes (duplicate of styled sheet) | missing | E | unproven | SYNC-05 (D5) |
| 20 | `react/{entry,system,types}/` + `types.generated` | yes (101-tag decls, public graph) | missing (single `index.d.mts`) | — | unproven | PRIM-10, TYPE-01 |
| 21 | `node_modules/@reference-ui/*` links | panda symlinks | 3 junctions (correct) | E | unproven | SYNC-05 |
| 22 | `types/` fourth package (`@reference-ui/types`) | yes (543 files, Tasty) | absent | — | unproven → approved absence | none (note b) |
| 23 | `panda.config.ts` | yes (260 KB driver) | absent (correct) | F | unproven (no absence assert) | SYNC-02 |
| 24 | `virtual/` (336 files) + `tmp/` session | yes | `tmp/` empty dir, forbidden-present | F | unproven (no absence assert) | SYNC-02 (note d) |
| 25 | Determinism / stale cleanup | n/a | `rmSync` full clean each sync | — (DoD §0.3.4) | unproven | SYNC-06, SYNC-07 |

## Verdict summary

Covered: `styled/styles.css`. Covered-against-plan: `styled/global.css` (SYNC-01
asserts the file D2 forbids — the landing slice rewrites SYNC-01). Half: the three
`package.json`s, `baseSystem`, `evaluated-system.json`, `jsx-elements.json`,
`runtime-data.mjs`, `css.mjs`, `react/index.mjs`. Unproven: everything else —
`system.mjs`, `compile-request.json`, `styled/types/*`, `react/styles.css`, links,
all absences, `types/`, `font-registry.json`, determinism/cleanup.

## §8 mapping

SYNC-02..13, PRIM-10, TYPE-01..06, GLOBAL-09, PARITY-02..04 — every id verified
present in PLAN.md. No new rows.

## Converge notes

a. `jsx-elements.json` merged content (`local`/`merged` multi-component counts) has
no pinning row — fold it into SYNC-04 (or SYNC-02 spec detail), not a new row.
b. `types/` (543 files, 13 lib-src importers): mark unproven → approved absence.
Caveat: `parity:130` claims “PLAN: tasty not tonight” but PLAN.md has zero Tasty
hits — the deferral lives in evidence only, so the SYNC SPEC must carry the absence.
13 lib-src files cannot build under Neo until the later leg.
c. SYNC-01 must be rewritten in the SAME slice SYNC-02 lands: its spec asserts the
forbidden `global.css` exists (spec line 23), contradicting D2 until rewritten.
d. `tmp/`: one-line fix (rmdir tempRoot in `src/config/evaluate.ts` — verified
mkdir-tempRoot/rm-inner-only) or amend §4.1; the absence rides with SYNC-02.
e. Consumer surface: 4 bare specifiers, all §4.1-expected (`@reference-ui/react`,
`react/styles.css`, `@reference-ui/system`, `system/baseSystem`). `styled/*`
tsconfig/vite entries are dead config — move in lockstep with out-of-scope
internals (I4/I5, SYNC-13/D4). Book vite alias pins literal `react.mjs` and bypasses
generated `system.mjs` (latent trap F6/F7 — decide in SYNC-12).

## Conflicts resolved

- `react/` file count: 44 live (C) beats 50 (L) — L counted the staging dir, now
gone; lib total 1101.
- System importers: C's “45×” conflated files with match-lines — “31 lib-src +
10 matrix real + 4 matrix pins” (I) wins.
- `virtual/`: L “N/A by design, unasserted” vs C row 24 — the absence assertion
rides with SYNC-02; no case for the mirror itself.
- `global.css`: L “existence only / false confidence” vs C “covered-against-plan” —
same finding, C's term wins; SYNC-01 rewrite required (note c).

## W1 input

SYNC cartographer starts from rows 1–25 + notes a–e; TYPE from rows 2/8/14/20;
PRIM from rows 18/20; GLOBAL from row 11; PARITY from rows 15/16/23 + note e.
All other groups are unaffected by this map.
