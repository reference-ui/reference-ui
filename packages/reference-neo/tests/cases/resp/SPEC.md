# RESP — container breakpoints and responsive arrays

Purpose: prove that Reference's responsive dialect paints by **container
width**, not viewport width. Named breakpoints (`sm`/`md`/…), range
conditions (`mdDown`, `mdOnly`, `smToLg`), numeric `r` keys, and array
values with `null` holes all lower to `@container` queries; the browser
proof flips a container element's width and reads computed style.

## The dialect the author writes

- Named conditions: `sm: { … }`, `md: { … }`, or per-prop objects
  `width: { base: '50px', md: '60px' }`. `base` is the unprefixed class.
- Responsive arrays: `width: ['50px', '60px']` maps index 0 → base, 1 →
  first breakpoint, and so on. `null` (and `undefined`) holes skip a slot
  (D10): `['50px', null, '60px']` emits base + `md`, no `sm` rule.
- Nested conditions require every query: `sm: { md: … }` paints only when
  both container widths hold.
- Range conditions bound the query: `mdDown` → `@container
  (max-width: 767.98px)`; `mdOnly` → `@container (min-width: 768px) and
  (max-width: 1023.98px)`; `smToLg` → `@container (min-width: 640px) and
  (max-width: 1023.98px)`. The 0.02px epsilon keeps adjacent ranges from
  overlapping at the boundary (Panda used 0.0025rem; same idea, px units).
- Numeric custom keys: `r={{ 300: … }}` lowers to a concrete `@container
  (min-width: 300px)`, alongside named keys in the same object.
- Container roots: a responsive utility matches only inside an ancestor
  with `container-type`. Authors get that from `container: true` (macro →
  `container-type: inline-size` utility) or from `globalCss` (e.g. `:root`
  / `body`). Without a root the engine emits the rule **plus a warning**
  diagnostic; the rule then silently never matches.

## Engine stations this group leans on

All confirmed present under
`packages/reference-rs/modules/atomic/tests/cases/` (each with
`README.md`, `spec.ts`, `input/`, `output/`):

- ATM-COND-01 — `sm`/`md`/`lg`/`xl`/`2xl` → `@container (min-width: Npx)`.
- ATM-LEAF-05 — array index → breakpoint scale; `null` holes skip.
- ATM-COND-07 — numeric `r` keys → concrete `@container`; unknown names
  warn and skip.
- ATM-COND-13 — `mdDown`/`mdOnly`/`smToLg` bounded queries; unknown
  `*Down` warns.
- ATM-COND-15 — `@container` without a `container-type` root warns.
- ATM-COND-16 — `container` macro forms; named `@container card` queries.
- ATM-ORDER-01 — at-rule blocks sort by parsed magnitude: min-width
  ascending, max-width descending. (ORDER-02..04 cover bucket/pseudo/
  shorthand order and belong to COND/CSS/MERGE.)

## Decisions that apply

- **D8** — `@container (min-width: Npx)` stays; no `@media screen`
  breakpoints. Neo proves the container-root requirement and the
  `container: true` macro; named ranges are proven, not invented.
- **D10** — responsive arrays with `null` holes are in; typegen agrees on
  `Array<T | null>`.
- **D18** — `NEO-CSS-02` (responsive lowering parity) keeps its id and its
  `css/` folder; RESP cross-references it instead of duplicating it.
  NEO-RESP-09 extends it with a runtime/build-time class-equality claim.

## Approved absences

- `@media screen` viewport breakpoints (D8). Panda v1 emitted
  `@media screen and (min-width: 40rem)` for `sm:` (`atomic-rule.test.ts`
  "responsive array"); Reference's dialect is `@container` and the lib
  sheet carries zero `sm:` classes and zero `min-width` queries, so there
  is nothing to be viewport-compatible with.
- `hideFrom` / `hideBelow` helpers (`atomic-rule.test.ts:671`,
  `utility.test.ts`). Panda display utilities over viewport media; no
  Reference author API ships them, no lib family needs them.
- `{sizes.x}` inside a query (`serialize.test.ts:47`). Reference has no
  `sizes` token category (lib sheet: no `--sizes-*` decls), so a query
  token ref has nothing to resolve against. Pure numeric keys
  (`r={{ 300: … }}`) are the dialect instead.

## Out-of-scope (Panda, not Reference's dialect)

| Panda feature | Why not a case |
| --- | --- |
| `@breakpoint` directive expansion (`breakpoints.test.ts`) | Panda config macro; Reference authors write condition keys, the engine prints `@container` directly |
| Viewport `@media` ranges / `mdDown` rem epsilon (`breakpoints.test.ts:143`) | Same range idea, different medium; RESP-05 proves the px-epsilon `@container` form the engine emits |
| RTL × responsive combos (`atomic-rule.test.ts:99/142`) | `_ltr`/`_rtl` are COND's approved absence (lib has 0 `[dir=rtl]`); no responsive axis to cross |
| Named `@container pb (…)` via `containerNames` (`static-css.test.ts:2162`) | Panda staticCss option shape; engine-side named queries are ATM-COND-16's golden, no Neo authoring surface exists |
| `sort-mq` plugin ordering of `@media` (`sort-mq.test.ts`) | Plugin internals; RESP-06 proves the equivalent `@container` order in the sheet + cascade |
| Recipe responsive variants (`recipe.test.ts:226`) | RECIPE-08's row, not this group's |
| `globalCss` nested responsive keys (`global-css.test.ts:13`) | GLOBAL's rows; RESP worlds use `css()`/StyleProps only |
