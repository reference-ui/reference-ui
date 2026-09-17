# Coverage audit: core vs Neo emitted artifacts

Read-only scout report for reference-neo. Question: inventory every emitted
artifact type in core's and Neo's current output trees, and check each against
Neo case coverage and PLAN §4.1. Sources: the on-disk trees, Neo publish code,
existing case specs, and `PLAN.md` §4.1. No repo files were modified except this report.

## 1. Executive summary

1. Core's tree (`packages/reference-lib/.reference-ui/`) holds ~1100 files across 4 packages plus `virtual/`/`tmp`/panda scaffolding, while Neo emits a uniform 13 files per world (`packages/reference-neo/src/sync/publish.ts:28-33`, `packages/reference-neo/src/sync/react.ts:49-98`).
2. Of PLAN §4.1's 17 expected paths (`packages/reference-neo/PLAN.md:222-232`), Neo writes 10, misses 7 (`system.mjs`, `system.d.mts`, `compile-request.json`, `runtime-data.d.mts`, `styled/types/*`, `react.mjs` naming, `react/styles.css`).
3. Neo currently writes 3 of §4.1's forbidden paths (`packages/reference-neo/PLAN.md:234-239`): `styled/global.css` stub (`packages/reference-neo/src/sync/publish.ts:80-84`), `styled/css.mjs` (`packages/reference-neo/src/sync/publish.ts:159`), and empty `tmp/` (`packages/reference-neo/src/config/evaluate.ts:22-24`).
4. Only `NEO-SYNC-01` asserts folder shape, and it asserts the forbidden `global.css` *exists* (`packages/reference-neo/tests/cases/NEO-SYNC-01/specs/sync.spec.ts:16-26`); no case asserts any absence, link, export map, or types artifact.
5. `system/baseSystem.mjs` exists in Neo but is a stub (`{name, fragment, css, jsxElements}`), not the contract `PortableBaseSystem` (`packages/reference-neo/src/sync/publish.ts:38-43`); `system/.` exports only baseSystem, not the authoring surface.
6. React entry naming diverges: core emits `react.mjs`+`react.d.mts`+`styles.css` copy, Neo emits `index.mjs`+`index.d.mts` with no CSS export (`packages/reference-neo/src/sync/react.ts:60-73`).
7. Panda-obsolete trees (`styled/css|jsx|patterns|recipes`, `helpers.js`, `panda.config.ts`, `virtual/`) are correctly absent from Neo; `node_modules/@reference-ui/*` junctions are present and match §4.1.
8. Every gap below already has a reserved §8 row (SYNC-02..13, PRIM-10, TYPE-01..06, GLOBAL-09, PARITY-02..04); no new rows are needed, but SYNC-01 must be rewritten when SYNC-02 lands (D2/D4).

## 2. Inventory table

Legend: **E** = §4.1 expected, **F** = §4.1 forbidden, **—** = not in §4.1 inventory.
Coverage: **covered** (a case asserts it), **half** (read but not asserted as an artifact), **unproven** (no case touches it).

| # | Artifact type | Core today (lib tree) | Neo today (world tree) | §4.1 | Case coverage | §8 row |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `system/package.json` (+exports map) | yes (`.`→system.mjs, `./baseSystem`) | yes (`.`, `./baseSystem` → baseSystem only) | E | half (SYNC-01 existence only, not exports) | NEO-SYNC-05 |
| 2 | `system/system.mjs` + `system.d.mts` (authoring entry) | yes (tokens/font/keyframes/globalCss/getRhythm) | **missing** | E | unproven | NEO-SYNC-12, NEO-TYPE-05 |
| 3 | `system/baseSystem.mjs` + `.d.mts` | yes (core `BaseSystem` shape) | stub shape, local interface | E | half (SYNC-01 existence only, not shape) | NEO-SYNC-03 |
| 4 | `system/evaluated-system.json` | yes | yes | E | half (existence only) | NEO-SYNC-02 |
| 5 | `system/compile-request.json` | yes (schemaVersion/spec/jsxHosts/roots) | **missing** | E | unproven | NEO-SYNC-04 (RS-1) |
| 6 | `system/jsx-elements.json` | yes (154 merged) | yes (empty merged) | E | half (existence only) | NEO-SYNC-02 |
| 7 | `system/font-registry.json` | yes | missing | — | unproven | none (absorb into SYNC-12 or approved absence) |
| 8 | `system/{entry,lib,system,types}/` packaged types | yes (41 files under `system/`) | missing | — | unproven | NEO-TYPE-05 or approved absence |
| 9 | `styled/package.json` | yes (12 Panda export maps) | yes (no exports map) | E | half (existence only) | NEO-SYNC-02 |
| 10 | `styled/styles.css` | yes (27k lines, panda theme attr) | yes (native sheet) | E | covered (7 sync cases read + paint) | NEO-SYNC-02 |
| 11 | `styled/global.css` | yes (Panda base + banner) | stub (1 comment line) | F | covered-against-plan (SYNC-01 asserts it exists) | NEO-SYNC-02 (D2), NEO-GLOBAL-09 |
| 12 | `styled/runtime-data.mjs` (+`.d.mts`) | yes, both | `.mjs` only, **no `.d.mts`** | E | half (RECIPE-01, CSS-02 import `.mjs`; shape never asserted) | NEO-SYNC-02 |
| 13 | `styled/css.mjs` (bound executable css) | n/a (Panda `css/` instead) | yes (bundled, pre-registered) | F | half (worlds import it; no case asserts the artifact) | NEO-SYNC-13 (D4) |
| 14 | `styled/types/*.d.ts` (native typegen) | yes, Panda-shaped (14 files, `@pandacss/dev`) | **missing** | E | unproven | NEO-TYPE-01/02/03/06 |
| 15 | `styled/css|jsx|patterns|recipes|helpers.js` | yes (Panda machinery) | absent (correct) | F | unproven (no absence assertion) | NEO-SYNC-02 |
| 16 | `styled/tokens|themes|extensions/` | yes (Panda unions, themes, config ext) | absent (correct) | — | unproven (no absence assertion) | NEO-SYNC-02 or approved absence |
| 17 | `react/package.json` (+exports map) | yes (`.`, `./styles.css`) | yes (`.` only, no CSS) | E | half (SYNC-01 existence only) | NEO-SYNC-05 |
| 18 | `react/react.mjs` + `react.d.mts` | yes (`react.mjs`, 2781 lines) | `index.mjs`+`index.d.mts` (wrong names) | E | half (PRIM-01 asserts `index.mjs`) | NEO-SYNC-05 (D5), NEO-PRIM-10 |
| 19 | `react/styles.css` (copy) | yes (duplicate of styled sheet) | **missing** | E | unproven | NEO-SYNC-05 (D5) |
| 20 | `react/{entry,system,types}/` + `types.generated.d.mts` | yes (101-tag decls, public graph) | missing (single `index.d.mts`) | — | unproven | NEO-PRIM-10, NEO-TYPE-01 |
| 21 | `node_modules/@reference-ui/*` links | panda symlinks under outdir (P) | 3 junctions in project (correct) | E | unproven | NEO-SYNC-05 |
| 22 | `types/` fourth package (`@reference-ui/types`) | yes (543 files, Tasty runtime) | absent | — | unproven | none (needs approved absence: Tasty out of voyage) |
| 23 | `panda.config.ts` | yes (260 KB driver) | absent (correct) | F | unproven (no absence assertion) | NEO-SYNC-02 |
| 24 | `virtual/` (336 files) + `tmp/` session files | yes | `tmp/` empty dir only (eval side effect) | F | unproven (no absence assertion) | NEO-SYNC-02 |
| 25 | Determinism / stale-cleanup behaviour | n/a | `rmSync` full clean each sync | — (DoD §0.3.4) | unproven | NEO-SYNC-06, NEO-SYNC-07 |

Counts via `rg --files <dir> | wc -l`: lib `styled/` 135, `system/` 41,
`react/` 44, `types/` 543, `virtual/` 336; Neo worlds 13 files each
(`for d in packages/reference-neo/tests/cases/NEO-*/world/.reference-ui` —
all 7 sync worlds plus the playground report 13).
Case refs via `rg -n "reference-ui|baseSystem|runtime-data|styles\.css|
global\.css|css\.mjs|index\.mjs|react\.mjs|system\.mjs|compile-request|
evaluated-system|jsx-elements|types/|font-registry|node_modules"
packages/reference-neo/tests/cases/*/specs/*.spec.ts` (12 spec files total).

## 3. Findings by family

### 3.1 System package (data + authoring entry)

- **Input:** `sync()` evaluates fragments to a spec and publishes `system/`
  (`packages/reference-neo/src/sync/index.ts:49-56`).
  **Expected (§4.1):** 7 files: package.json, system.mjs/d.mts, baseSystem.mjs/d.mts,
  evaluated-system.json, compile-request.json, jsx-elements.json.
  **Actual:** 5 files; `system.mjs`/`system.d.mts` and `compile-request.json` are missing,
  and `baseSystem.mjs` is `{name, fragment, css, jsxElements}` rather than
  `PortableBaseSystem` (`packages/reference-neo/src/sync/publish.ts:38-43`).
  Core's `system.mjs` exports the authoring surface consumers import 45×
  (`tokens`, `font`, `keyframes`, `globalCss`, `getRhythm`), and its
  `compile-request.json` pins `schemaVersion/spec/jsxHosts/sourceRoot/declarationRoot`.
- **Input:** SYNC-01 spec file list.
  **Expected:** assert the §4.1 expected set.
  **Actual:** asserts the 5 present files only
  (`packages/reference-neo/tests/cases/NEO-SYNC-01/specs/sync.spec.ts:16-26`).
  No case imports `@reference-ui/system` or checks `baseSystem` shape.

### 3.2 Styled package (sheet + runtime data)

- **Input:** native compile result → `writeStyledDir` + `publishRuntimeBundle`.
  **Expected (§4.1 + D2/D4):** package.json, styles.css, runtime-data.mjs+d.mts,
  types/*.d.ts; no global.css, no css.mjs.
  **Actual:** styles.css, runtime-data.mjs (no `.d.mts`), stub global.css, bundled css.mjs,
  no types dir (`packages/reference-neo/src/sync/publish.ts:76-99,140-163`).
- **Input:** the 7 sync-case specs.
  **Expected:** sheet reads plus artifact assertions.
  **Actual:** all 7 read `styled/styles.css` and assert paint (covered); RECIPE-01 and
  CSS-02 import `runtime-data.mjs` to drive runtime assertions (half: data consumed,
  ABI never asserted); global.css is asserted present, inverting D2.

### 3.3 React package (bundle + CSS specifier)

- **Input:** `publishReactBundle({outDir, systemName, stylePropNames})`.
  **Expected (§4.1 + D5):** react.mjs, react.d.mts, styles.css, package.json with
  `.` and `./styles.css` exports.
  **Actual:** index.mjs, index.d.mts, package.json with `.` only; no styles.css
  (`packages/reference-neo/src/sync/react.ts:49-98`).
  Core's package resolves `.`→`react.mjs` and `./styles.css`, and lib/Book import
  the CSS specifier — the one consumer path with no Neo equivalent.
- **Input:** PRIM-01 spec.
  **Expected:** entry census (101 tags, css, recipe, type names).
  **Actual:** asserts `react/index.mjs` exists plus paint and data-layer
  (`packages/reference-neo/tests/cases/NEO-PRIM-01/specs/prim.spec.ts:20-23`);
  exports, CSS specifier, and the type-name surface are unproven.

### 3.4 Links, session, and obsolete paths

- **Input:** `linkGeneratedPackages(cwd, outDir)` writes 3 junctions
  (`packages/reference-neo/src/sync/publish.ts:182-188`).
  **Expected (§4.1):** links exist; verified on disk for SYNC-01
  (`world/node_modules/@reference-ui/{system,styled,react}` → outdir).
  **Actual:** present but unproven — no spec resolves a specifier through them.
- **Input:** config evaluation temp root.
  **Expected (§4.1):** no `tmp/` under the outdir.
  **Actual:** `evaluateConfig` creates `<outdir>/tmp/` and removes only the inner
  `config-eval-*` dir, leaving an empty `tmp/` after every sync
  (`packages/reference-neo/src/config/evaluate.ts:22-34`; confirmed empty by
  `find .../world/.reference-ui/tmp -type f` returning nothing).
- **Input:** Panda-obsolete set (`styled/css|jsx|patterns|recipes`, `helpers.js`,
  `panda.config.ts`, `virtual/`, panda symlinks).
  **Expected:** absent.
  **Actual:** absent (correct) — but no spec asserts absence, so a regression
  would be silent until NEO-SYNC-02.

## 4. Implications for Neo cases

| Gap | Reserved case(s) | Note |
| --- | --- | --- |
| Folder inventory present/absent | NEO-SYNC-02 | Must also **rewrite SYNC-01**: drop the `global.css` existence assert, or SYNC-01 contradicts D2 forever |
| `baseSystem` contract shape | NEO-SYNC-03 | Assert `PortableBaseSystem` keys, not just file existence |
| `compile-request.json` frozen shape | NEO-SYNC-04 | Blocked on RS-1 (frozen `NativeCompileRequest` in `compile()`) |
| Export maps + `react.mjs` naming + `./styles.css` + links | NEO-SYNC-05 | Includes D5 rename `index.mjs`→`react.mjs` and the CSS copy (core `copyFrom`, `packages/reference-core/src/packager/packages.ts:55-62`) |
| Byte-determinism, stale cleanup | NEO-SYNC-06, NEO-SYNC-07 | SYNC-07 can plant a junk file; note `sync()` already full-cleans (`packages/reference-neo/src/sync/index.ts:40`) |
| `system.mjs` authoring surface + `getRhythm` | NEO-SYNC-12 | Core entry to mirror: `packages/reference-core/src/packager/packages.ts:29-45` |
| styled data-only (remove `global.css`, `css.mjs`; bind css in react) | NEO-SYNC-13, NEO-GLOBAL-09 | D2 + D4; `css.mjs` bundle step moves, not deleted |
| Empty `tmp/` side effect | NEO-SYNC-02 (forbidden list) | One-line fix in `evaluate.ts` (rmdir tempRoot) or accept-and-amend §4.1; recommend fix |
| React entry census (101 tags, css/recipe, type names) | NEO-PRIM-10 | Extends PRIM-01's single-file assert |
| `styled/types/*`, token/variant/condition unions, no `@pandacss` | NEO-TYPE-01/02/03/06 | TYPE-01 also covers the `react/types` graph now missing |
| Family + consumer + panda-ism censuses | NEO-PARITY-02/03/04 | PARITY-04's rg pass covers rows 15/16/23 absences at the world level |

No new §8 rows are proposed: 25/25 artifact rows map to reserved ids or to
named approved absences (§5). The only sequencing note is SYNC-01's rewrite,
which must land in the same slice as SYNC-02 to keep `agentneo run` green.

## 5. Out of scope (with reasons)

- **`types/` fourth package (`@reference-ui/types`, Tasty runtime).** Not in §4.1;
  Tasty/Reference browser work is explicitly deferred past this voyage
  (core-api-parity "later"; PLAN group table gives PARITY no `src/` ownership).
  Recommend an approved absence in the SYNC group SPEC, not a case.
- **`system/font-registry.json` and `system/{entry,lib,system,types}/` packaged types.**
  Core-internal packaging details with no consumer import census behind them
  (consumers import values/types from `.` and `./baseSystem`, not these paths).
  Defer to SYNC-12/TYPE-05 cartographers to absorb or mark absent.
- **`virtual/` workspace and `tmp/` session files (`session.json`, lock).**
  Core watch-mode machinery; Neo is serial `sync()` with no workers or watch loop
  (PLAN §0.2 "Simplicity stays"). Only the `tmp/` *absence* is in scope (row 24).
- **Panda `styled/tokens|themes/` value endpoints.** Superseded by native
  typegen (`styled/types/*`) and token islands; no consumer path needs Panda's
  `token()` or `ThemeName`. Absence assertion rides with NEO-SYNC-02.
- **Sheet *content* families (layers, conditions, recipes, rhythm).** Owned by the
  parallel lib-sheet coverage scout; this report covers artifact *types* only.
- **`book-perf.jsonl`, `.reference-ui/node_modules/@pandacss` symlinks.**
  Incidental/legacy scaffolding; covered by the PARITY-04 no-panda-isms rg,
  not worth dedicated rows.
