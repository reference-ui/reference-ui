# Panda v2 map

Example spec. `vendor/panda` is a gitignored checkout of
`@pandacss/dev@2.0.0-beta.17`. It is the autopsy and the **process map**.
We do not become their v3. We copy how they split work: extract → encode →
stylesheet, plus a separate `css()` artifact.

Their process crates are our **modules** inside the `atomic` crate. Do
not split extract / atom / stylesheet into 12 crates to match them.
Sibling products (canon, base-system, typegen) are different jobs, not
that split.

Their recipe helper is `cva` / `sva`. Ours is `recipe()`, from
`@reference-ui/react`. Their `css()` is the same job as ours. This file
is where their call sites live. We do not ship their names.

Checkout: `/Users/ryn/Developer/reference-ui/vendor/panda`
Design notes: `vendor/panda/design-notes/crate-layering.md`, `stylesheet.md`

## Process line (theirs → ours)

Panda (`design-notes/crate-layering.md`): **extract → encode → emit**.

| Panda crate | Key files (under `vendor/panda/`) | Our module | Take | Leave |
| :--- | :--- | :--- | :--- | :--- |
| `pandacss_extractor` | `crates/pandacss_extractor/src/{extract,jsx,calls,matcher}.rs` | `src/extract/sites` | Where they look: JSX attrs, `css()`, recipes (`cva`/`sva` in their source; ours is `recipe()`) | Vue/Svelte/Astro, `include` globs as a substitute for styletrace |
| `pandacss_extractor` | `src/literal.rs`, `style_tree.rs`, `pure_fn.rs`, `scope.rs` | `src/extract/leaves` | Walk the expression | **`expression_to_literal` eval / fold / `undefined`→Null.** `design-notes/literal-evaluator.md` |
| `pandacss_encoder` | `crates/pandacss_encoder/src/lib.rs` (`Atom`, `process_atomic`) | `src/atom` | `(prop, value, conditions)` records, `FxHashSet` dedup | Their `Literal` IR |
| `pandacss_utility` | `src/lib.rs` (`format_class_name`, `transform`), `normalize.rs`, `runtime_class.rs` | `src/resolve/*` + `src/stylesheet/name` | Shorthand expand, class spelling, **one namer** (`runtime_class_name_for_atom`) | Host JS `transform()` callbacks (that is the split-brain) |
| `pandacss_recipes` | `crates/pandacss_recipes/src/lib.rs` | `src/recipes` | Closed variant tables / compound | Encoding StyleProps into the recipe class; their `sva` slot-recipe helper |
| `pandacss_stylesheet` | `src/lib.rs` (`compile`, `StylesheetOutput`), `emitter.rs`, `layers.rs`, `grouped.rs`, `preflight.rs`, `static_css.rs`, `conditions.rs` | **`src/stylesheet`** | CSS string, layer preamble + emit | LightningCSS optimizer, `split_css` zoo in v1, **their five-layer list** (ours is six: `reset, global, base, tokens, recipes, utilities`) |
| `pandacss_codegen` | `src/artifacts/css/mod.rs` (`css/css`), `artifacts/cva.rs`, `conditions/mod.rs` | **`src/runtime`** | Class-map lookup + concat | `styled-system/{jsx,types,patterns,themes}` artifact farm; we author `css()` / `recipe()` in TypeScript |
| `pandacss_tokens` | `src/{from_config,builder,token}.rs` | `src/resolve/tokens` + `src/config` | Path → `var(--…)` | Second OKLCH pipeline (ours is `tokens()` / Atlas) |
| `pandacss_config` | `src/lib.rs` (`UserConfig`) | `src/config` | Tokens, conditions, recipes, globalCss, keyframes | `hooks`, plugin callbacks, `jsx` array as the wrapper list |
| `pandacss_project` | `src/lib.rs` (`Project`, `System`), `codegen.rs`, `system.rs` | `src/lib.rs` `compile()` | One façade: extract → atoms → stylesheet + css | Watch transform cache, WASM, Parcel |

`pandacss_fs` / `pandacss_shared` / `pandacss_tracing` / napi/wasm bindings:
infrastructure. We already have Oxc via styletrace, N-API via `crates/napi`.

There is **no** crate named `generator`. CSS is `pandacss_stylesheet`.
Runtime JS is `pandacss_codegen`.

## Two artifacts (do not merge)

Panda host cadence (`design-notes/output-and-host-layer.md`):

| Artifact | Panda | Ours | Disk after cutover |
| :--- | :--- | :--- | :--- |
| Stylesheet | `pandacss_stylesheet::compile` → `styles.css` | `stylesheet::compile` | `.reference-ui/styled/styles.css` |
| `css()` runtime | `pandacss_codegen` → `styled-system/css/css` | `runtime::compile` | `.reference-ui/styled/css` (same concat map, same namer) |

If those disagree, Tabs gets a ghost class. That is why they are two
outputs of **one** `compile()`, not a CLI CSS pass and a later JS pass.

## Styletrace vs Panda matcher

Panda learns JSX names from `UserConfig.jsx` / `styled.div` / PascalCase
guessing (`extractor/src/jsx.rs`, `matcher.rs`).

We already know:

- which names are StyleProps — `styletrace::collect_reference_style_prop_names`
- which tags keep those props wired to Reference primitives —
  `styletrace::trace_style_jsx_names`

`extract/sites` **calls** that crate. It does not reimplement wrapper
tracing. Panda’s `jsx` extra-names array is the fallback we delete.

## What this file is not

Not a license to vendor their `literal.rs`. Not a license to grow
`styled-system/jsx`. Not a 12-crate split of `system`. Not a license to
export `cva` / `sva` as the author API.
