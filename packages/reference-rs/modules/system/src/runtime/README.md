# Runtime

The browser face of the namer. Not a “tables” product. Not an IR.

Named `runtime`, not `css`, because `stylesheet` is what emits CSS. This
module emits the **lookup** the browser concatenates with. One namer, two
consumers: `stylesheet` prints rules, `runtime` spells the same class names.
The disk artifact keeps its Panda-compatible path, `.reference-ui/styled/css`.

Panda codegen writes `styled-system/css/css` — a JS `css()` that looks
up spelled class names and concatenates them. That file **is** this
module’s output. We generate it (or an equivalent JSON map core inlines)
from `stylesheet/name`, in the same `compile()` as the sheet.

```text
css({ mt: '2r', bg: isSelected ? 'n300' : 'n100' })
  → "mt_2r bg_n300"   or   "mt_2r bg_n100"
```

Open composition. The merged object never had to be compiled as a blob.

Recipes get a small closed map (`cva` / `sva` variant → class). StyleProps
on a recipe host still go through this concatenator.

## Files (when coded)

- `mod.rs` — `CssRuntime` (`ts-rs`) — the type name stays `CssRuntime`; it is
  the `css()` runtime's data
- serializer: JSON for N-API, or a generated JS module — pick one format,
  generate it here, do not hand-maintain `css.js`

## Panda

| File | Job |
| :--- | :--- |
| `vendor/panda/crates/pandacss_codegen/src/artifacts/css/mod.rs` | generated `css` + utility map |
| `artifacts/css_index.rs` | `css/index` barrel |
| `artifacts/conditions/mod.rs` | runtime condition helpers |
| `artifacts/cva.rs`, `sva.rs` | recipe runtime |
| `crates/pandacss_project/src/codegen.rs` | when they emit artifacts |

**Do not lift** `artifacts/jsx/*`, `types/*`, `patterns/*`, `themes/*`.
That is the styled-system farm. Our disk is `.reference-ui/styled/`
(sheet + this module's `css` artifact), already owned by core.

## Must not

- Reimplement resolve in TypeScript.
- Key the map by a hash of the whole style object.
- A second namer.
- A `js/system/tables` folder that “owns” this. JS only calls `compile()`.
