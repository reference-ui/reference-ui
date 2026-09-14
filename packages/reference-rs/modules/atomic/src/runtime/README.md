# Runtime

The browser face of the namer. Not an IR. Not a generated JavaScript
function.

`stylesheet` prints CSS. This module emits the **lookup** that authored
`css()` in `@reference-ui/react` concatenates with. One namer, two
consumers: the sheet prints rules, `runtime` spells the same class names.
`compile()` returns `CssRuntime` as data. The `css()` helper itself is
authored TypeScript in `reference-core`. Do not generate a `css.js`.

```text
css({ mt: '2r', bg: isSelected ? 'n300' : 'n100' })
  → "mt_2r bg_n300"   or   "mt_2r bg_n100"
```

Open composition. The merged object never had to be compiled as a blob.

`recipe()` is the closed exception: a small variant → class table that
rides alongside this map. StyleProps on a recipe host still go through
this concatenator. There is no second helper name. The author API is
`css()` and `recipe()`.

Disk: `.reference-ui/styled/css`.

## Example (Panda)

They generated `styled-system/css/css` — a JS `css()` that looks up
spelled class names. We emit the map; core authors `css()`. Recipe
runtime on their side is `artifacts/cva.rs` / `sva.rs`. Ours is authored
`recipe()`.

| File | Job |
| :--- | :--- |
| `vendor/panda/crates/pandacss_codegen/src/artifacts/css/mod.rs` | generated `css` + utility map |
| `artifacts/css_index.rs` | `css/index` barrel |
| `artifacts/conditions/mod.rs` | runtime condition helpers |
| `artifacts/cva.rs`, `sva.rs` | their recipe runtime |
| `crates/pandacss_project/src/codegen.rs` | when they emit artifacts |

**Do not lift** `artifacts/jsx/*`, `types/*`, `patterns/*`, `themes/*`.

## Must not

- Reimplement resolve in TypeScript.
- Key the map by a hash of the whole style object.
- A second namer.
- Generate executable `css.js`. Core authors `css()`; we emit the map.
