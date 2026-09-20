# Reaper READY ask 1 — fixture shape: "messy enterprise" as a fixture

Date: 2026-09-20. Author: Reaper Phase R1 crew (read-only).
Mission: `docs/missions/operation-reaper.md` READY ask 1.

## Proposed holes (~29 sinks, rest-dominated)

Every prop below verified canonical in `canon/src/css/properties.rs` (name → css / class prefix).
Hole authoring follows the station precedents: dynamic identifier (`css({ color })` with a
`string` param, ATM-HARVEST-01) or explicit `css({ color: null })` (ATM-SEAM-07). Both refuse
as a `Dynamic*` sink (`sinks.rs::is_sink_code`).

**Color (7):** `color` (color / `c`), `backgroundColor` (background-color / `bg-c`),
`borderColor` (border-color / `bd-c`), `borderBottomColor` (border-bottom-color / `bd-b-c`),
`fill` (fill / `fill`), `stroke` (stroke / `stroke`), `outlineColor` (outline-color / `outline-c`).

**Length, padding / margin / width family (19):** `padding`, `paddingTop`, `paddingRight`,
`paddingBottom`, `paddingLeft`, `paddingBlock`, `paddingInline`, `margin`, `marginTop`,
`marginRight`, `marginBottom`, `marginLeft`, `marginBlock`, `marginInline`, `width`,
`minWidth`, `maxWidth`, `height`, `fontSize` — all in `LENGTH_PROPERTIES`
(`canon/src/css/values/classify.rs:37`).

**Url (1):** `backgroundImage` (`URL_PROPERTIES`). **Transform (1):** `transform`.
**Keyword witness (1):** `display` (sink kind falls through to Keyword; carries the
`none` / `inherit` pool values through the validity gate).

**Conditioned (2, small by design):** `_hover` color hole + `md` width hole
(ATM-HARVEST-03 pattern). Proves `when` copies per-sink rather than multiplying the pool.

**Deliberately included alias:** one `bg` hole (`bg` → `background`, `dialect.rs:331`).
Twins `background`, adds no class — proves the twin-skip half of net-new vs gross.

**Deliberately excluded:** `gap` / `offset` (record-time filtered as §14 owned props,
`sinks.rs:16` — they would silently never sink); `size` (macro, lowers to width+height,
not a hole); `variant` / `colorMode` (runtime-owned, zero declarations). Optionally one
`gap` site as a documented negative control that must NOT appear in the census.

## Proposed pool (~320–380 distinct wholesale strings, naturally written)

Sized between M300 and M500 so the fixture lands inside the bounds, not on them:

| Kind | n | Authored as |
|---|---|---|
| Length | ~150 | `px` scale (4–64), `rem` scale, `%`, `vh`, `r` singles + a few `r` lists (`4r 2r`) |
| Color | ~130 | 15 named + ~50 hex + ~35 spaceless `rgba()` + ~30 `oklch()` |
| Url | ~8 | `url(/assets/…)` strings in an assets module |
| Transform | ~6 | `translateX/scale` strings in a motion module |
| Keyword | 7 | `inherit initial unset revert revert-layer auto none`, each at a real site |
| Rhythm-overlap | — | counted inside Length (rhythm classifies Length, `classify.rs:20`) |

Layout: `palette.ts` (hexes, half in an unread array à la HARVEST-01), `spacing.ts`,
`type.ts`, `assets.ts`, `motion.ts`, plus `components/*.tsx` with static `css()` leaves
re-using **half** the hexes — the fixture must grow both the leaf-only and the unbound
populations (ask 3), so the split is designed in, not hoped for. No token-definition
files (that is lib's shape, below — excluded on purpose).

Expected cross (order of): 7 color sinks × ~130 + 19 length × ~150 + small terms ≈
**~4k classes**, plus CSS-wide 7 × 5 … 24 × 5. Thousands, rest-shaped, human-surfaced.

## Why this is not lib's shape

Lib (forge-ready-02): **10 sinks (1 color + 9 length)**, pool 518 dominated by token
definitions (216 `oklch()` in `colors.ts`) — lib measures token-definition bleed across
a tiny sink surface. The fixture inverts both axes: ~30 sinks across five kinds with a
pool of authored loosies and zero token files. Lib answers "what does harvest cost us
today"; the fixture answers "what does harvest cost a messy app".

## Proposed folder

- Fixture sources: `packages/reference-rs/modules/atomic/tests/fixtures/harvest-enterprise/src/`
  (`tests/fixtures/` exists today for JSON; a source subdir is new but consistent).
- Committed reader: `packages/reference-rs/modules/atomic/tests/harvest-census.test.ts`
  (fits `vitest.config.ts` include `tests/**/*.test.ts`; precedent: `seam.test.ts`,
  `merge-eviction.test.ts` at the same level).
- Rejected: a `tests/cases/` folder — cases are stations and Slice 1 mints none; and a
  neo world case — the fixture is a compile input, not a browser world (the CSSOM timing
  world is separate temp scratch, ask 4).

The `react.mjs` cell (R1) comes from the same reader: compile with `LIB_SYSTEM_SPEC`
(`tests/helpers.ts:49`), then `writeStyledDir` + `publishReactBundle` into a temp outDir
and read the bytes — the exact functions lib sync uses (`sync/publish/styled.ts:10`,
`sync/react.ts:47`). Precondition: `dist/namer.mjs` built (`build:js`), documented in
the test header. R3's "reproducible from the compile output" is satisfied strongest by
asserting the evidence numbers in this committed test, with `reaper-01-real-compile.md`
as the human record.
