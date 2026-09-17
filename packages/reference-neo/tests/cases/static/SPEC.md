# STATIC — pre-generated atoms

## 1. Purpose

Some values are known only at runtime (a prop, a state pick), so no call
site exists for extraction to find. `staticCss` answers by pre-generating
atoms: declared property × value × condition wants join AST-extracted wants
before resolve, and the sheet carries utilities nobody authored inline.
Engine stations prove emission strings and runtime keys; these cases prove
paint (a runtime `css()` value finds its atom) and the fail-closed negative
(a value outside the set yields a diagnostic, never a ghost class).

## 2. Dialect the author writes

A `staticCss` map on the base system spec, property → value list
(`contracts/types.ts`: `staticCss: Record<string, string[]>`): listed
values (`bg: ['n100','n200']`), `'*'` wildcard over the property's token
category (`color: ['*']`), and conditions (`color` under `_hover`).
Declared wants dedup with AST wants to one atom / one class. The world
declares the map; `sync` carries it to the engine untouched; runtime
`css({ color: pickAtRuntime })` resolves against the pre-generated atoms.
This group owns nothing in `src/` (PLAN §8.11): if `sync` drops the map,
that is a SYNC-group gap to escalate, not STATIC host work.

## 3. Engine stations leaned on

All confirmed present (`ls` + README read 2026-09-17, each with
`input/`, `output/`, `spec.ts`):

| Station | Proves | Used by |
| --- | --- | --- |
| ATM-STATIC-01 | `staticCss` is a third want source; wildcards + lists become utilities and runtime keys, so `bg={prop}` looks up | NEO-STATIC-01 |
| ATM-STATIC-02 | Overlapping AST + static wants dedup to one atom / one class | NEO-STATIC-01/02 |
| ATM-STATIC-03 | Conditions (`_hover`), non-color wildcards (`borderRadius: ['*']` over `radii`), and a warning for an unsatisfiable request (`unknownProp`) | NEO-STATIC-01/03 |
| ATM-GHOST-02 | Runtime class-map `(when:)prop:value` spellings match sheet selectors | NEO-STATIC-03 (shared with MERGE-06) |

Host: `—` for all rows. No RS rows: every cited station exists and is green.

## 4. Decisions

- **D11** (taken): dynamic values → diagnostic, no ghost class. STATIC-03 is
  the static-side proof and **pairs with NEO-MERGE-06** (the runtime-side
  proof of the same rule): MERGE-06 shows a bare runtime value with no atom
  yields no class + one dev diagnostic; STATIC-03 shows the same for a
  value outside the declared static set, plus the sync-time diagnostic for
  an unsatisfiable `staticCss` request. Cooks keep the two consistent.
- **D7/D14** (taken): `colorPalette` virtual tokens are out. Panda's
  `color: ['*']` expanded `colorPalette.200` too; Reference's wildcard
  expands real tokens only, so STATIC-02's count is the token count.

## 5. Approved absences

- Panda `recipes: { buttonStyle: ['*'] }` / compound-variant statics
  (`static-css.test.ts:343,2100`): recipe emission belongs to RECIPE; no
  static-recipe case here.
- Static slot recipes / patterns: slots out per D9, Panda patterns pack out.
- `colorPalette` no-op atoms in wildcard counts: D7/D14 absence (see §4).
- Named `@container` statics (`containerNames`, `@pb/sm`): RESP owns
  container proof (RESP-07).

## 6. Out of scope (not Reference's dialect)

| Panda feature | Reason |
| --- | --- |
| `staticCss` cache hit/miss, wildcard memo, `*.bench.ts` | Engine perf, not CSS |
| Arbitrary freeform condition strings in `staticCss` (`'.mobile &'`) | Not proven; STATIC-03 covers named conditions |
| `sva` / slot anatomy in staticCss | Out per D9 |
| `textStyles` / `layerStyles` statics | No first-class text/layer styles |
| `prefix` + hash / custom `toHash` | Panda config hooks; Neo has its own class grammar |
