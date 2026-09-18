# SYNC — generated folder and contracts

Purpose: after `sync()`, the `.reference-ui/` tree matches PLAN §4.1 exactly
(expected present, forbidden absent), byte-deterministic, with loud config and
compile errors — and every consumer specifier resolves. This group owns the
folder; every other group's worlds sync through it.

## Dialect

The author writes `ui.config.ts` (`name`, `include`, `extends?`,
`jsxElements?`, `normalizeCss?`, `debug?`) plus fragment sources
(`tokens()`, `font()`, `keyframes()`, `globalCss()`, `extendPattern()`).
Unknown config keys pass through unvalidated (core parity). There is no
author `outdir` field; output is always `.reference-ui/`.

## Engine stations (all confirmed: folder + README present)

- `ATM-SITE-*` (SITE-01..16) — extraction wants; SITE-13 landed (RS-5,
  owned by SITE not SYNC).
- `ATM-DIAG-01..03` — diagnostics shape; SYNC-11 leans on them.
- `ATM-ORDER-01..04` — deterministic ordering; SYNC-06 leans on them.
- `BAS-EXTEND-*` landed (RS-4): upstream adoption proven — SYNC-10 unblocked.
- Frozen `NativeCompileRequest` landed (RS-1): `compile()` accepts the frozen
  shape alongside legacy, `compile-request.json` is written — SYNC-04 done.

## Decisions

D2 (no `styled/global.css`), D4 (styled is data-only; bound `css()`/`recipe()`
move to react), D5 (filenames + exports map), D6 (system authoring surface +
`getRhythm`), D12 (frozen `NativeCompileRequest` + `compile-request.json`),
D19 (`types/` deferred, see below). All taken 2026-09-17.

Coverage-map notes, all absorbed, no new rows: (a) `jsx-elements.json`
merged-content pin rides SYNC-04; (c) SYNC-01 is rewritten in the same slice
SYNC-02 lands (it currently asserts the D2-forbidden `global.css` exists);
(d) the `tmp/` absence rides SYNC-02; (e) the 4 bare consumer specifiers
(`@reference-ui/react`, `react/styles.css`, `@reference-ui/system`,
`system/baseSystem`) are pinned by SYNC-05/12, the Book vite-alias trap is
decided in SYNC-12, and dead `styled/*` tsconfig/vite entries move in
lockstep with SYNC-13/D4.

## Approved absences

- `types/` fourth package (`@reference-ui/types`, 543 files, Tasty/Reference
  browser) — deferred per D19 (human). Caveat: 13 lib-src importers cannot
  build under Neo until the later leg; the W4 census re-checks this.
- `system/font-registry.json` — absent from §4.1; fold into SYNC-12 or record
  absence there (font data ships via `FontRegistry` types, not a JSON file).
- `system/{entry,lib,system,types}/` packaged core types (41 files) — TYPE-05
  covers the Neo replacement; Panda-shaped leftovers are not reproduced.
- `styled/tokens|themes|extensions/` — Panda unions/theme JSON; absent is
  correct, asserted by SYNC-02.
- Panda bugs (D7): `.size_md{width:md}`, leftover `{colors.ui.focus.ring}`
  class, `--made-with-panda` banner, `*` transform-var dump — never parity.

## Out of scope (not Reference's dialect)

| Feature | Reason |
| --- | --- |
| `panda.config.ts` driver, `styled/css\|jsx\|patterns\|recipes\|helpers` | Panda machinery; §4.1 forbids, SYNC-02 asserts absent |
| `virtual/` mirror (336 files) | Panda coercion chassis; never (core-api §2.5) |
| Watch / Vite / Webpack / CLI `ref` / session | Later-leg host chassis, not folder contracts |
| `strict`, `layers`, `mcp` config | Deferred/dropped per core-api §2.1 |
| `cva` alias, `css.raw` | D3/D16: zero lib call sites; `recipe` / `recipe().raw()` only |
