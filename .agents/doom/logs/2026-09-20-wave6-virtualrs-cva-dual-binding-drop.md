---
date: 2026-09-20
cycle: wave6
module: virtualrs/cva/import-rewrite
theories_spent: 1
verdict: break-found
---

# CVA rewrite drops the second binding of a dual `cva` + `recipe` import

## Hypothesis

Gap pursued (Theory 1, spent): a single import declaration carrying
BOTH canonical CVA bindings (`cva` and `recipe`, per
`CVA_BINDINGS = ["cva", "recipe"]` in
`modules/virtualrs/src/constants.rs`). The pins cover each binding
alone — VRT-CVA-01 (`cva as buttonCva` → `cva(`) and VRT-CVA-03
(`recipe as buttonRecipe` → `cva(`) — and VRT-CVA-02 pins
first-declaration-only across two declarations (leaving the second
declaration intact, output stays valid). Nothing pins one declaration
holding both. Red test: both call sites must resolve to the emitted
canonical `cva` import, no dangling references.

Thin-log signal: doom-log search for "virtualrs" returns no prior
virtualrs hunt (nearest hit is the shared-slice panic that only
mentions virtualrs as a consumer). This module was unhunted ground.

Research (free, unspent): read `cva.rs`, `css.rs`, `utils.rs`
(`collect_import_parts` keeps only the first matched local binding:
`if state.local_binding_to_normalize.is_none()`), `constants.rs`,
plus VRT-CVA-01/02/03/04 fixtures and goldens. Untried gaps banked
for scheduling, no theories spent: (a) `normalize_bound_calls` is a
bare substring regex (`escape(local) + "\\("`, no word boundary) —
likely rewrites member calls (`obj.alias(`), prefixed identifiers
(`xalias(` → corrupt), and string/comment text; (b) responsive
`normalize_breakpoint_width` accepts any `f64` parse (`NaN`, `inf`,
`-5`, `1e3`) and emits it verbatim into `@container (min-width:
…px)` — plausibly invalid CSS.

## Verdict

`break-found`. User-facing: the compiler silently emits code that
throws `ReferenceError` at runtime.

Repro: `/tmp/doom-wave6-virtualrs-t1-dual-binding.mjs` (blind-runnable
`node`, exit 1, loads `dist/native/virtual-native.darwin-x64.node`
directly; run firsthand 2026-09-20).

Input:

```tsx
import { cva, recipe } from '@reference-ui/react'
const a = cva({})
const b = recipe({})
```

Output (actual):

```tsx
import { cva } from 'src/system/css';

const a = cva({})
const b = recipe({})
```

The `recipe` specifier is deleted from the import but its call site
survives untouched — `recipe` is now unbound. The aliased variant
(`import { cva as c1, recipe as r1 }`, `c1({})`/`r1({})`) breaks
identically: `c1(` → `cva(`, `r1(` left dangling with its import
deleted (probed firsthand, same session).

Violated contract:

- `modules/virtualrs/README.md`, CVA Transformation: "rewriting both
  the import declarations and the call sites to ensure canonical
  `cva` usage in the emitted output" — the second binding's call
  sites are neither rewritten nor preserved.
- VRT-CVA-03 pin: `recipe` call sites become `cva(` — violated when
  `recipe` shares its declaration with `cva`.
- Compiler self-consistency: a transform must never delete an import
  specifier while leaving call sites that reference it. The output
  does not parse-bind; it dies at runtime with no diagnostic.

Root cause (read, not fixed): `utils.rs::process_import_specifier`
stores only the first `Matched` local binding, and the second
binding's specifier is swallowed (not pushed to `remaining_parts`
either, since it classifies `Matched`). `render_rewritten_imports`
then emits a single canonical `cva` import while
`normalize_bound_calls` renames at most one binding's calls.

Physics check: in bounds. Named imports in a TSX compile input,
complete static literals, no interpolation, no runtime-shaped data —
nothing on the will-never-work floor. VRT-CVA-02 does not cover this:
it pins leaving the second *declaration* intact (valid output); this
deletes within one declaration (invalid output).

Baseline note: `pnpm agentrs v virtualrs` is red at baseline (10
failed / 16) on a semicolon drift — received imports carry `;`,
committed goldens do not. Pre-existing, unrelated to this find; this
break (dangling reference, not punctuation) reproduces through the
same current binding the suite itself uses.
