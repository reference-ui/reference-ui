# Extract / sites

Discovers style-bearing **call sites** and their **origin label**.

Panda only sees `Box` / `styled.div` unless you teach it names. Styletrace
already traces wrappers to Reference primitives and knows export names.
Sites uses that, then finds expressions:

- JSX StyleProps (`bg`, `mt`, `borderBottom`, `_hover`, …)
- `css({ … })` / `css.raw`
- `cva` / `sva` objects → `recipes/`
- Origin: `Tabs.Tab`, `Box`, `css` in `Card.tsx` — traces on wants, not class identity

React/TSX only.

## Files (when coded)

- `mod.rs` — site iterator
- `jsx.rs`, `css_fn.rs`, `recipe_fn.rs`

## Lift

- **Styletrace:** `trace_style_jsx_names`, `collect_reference_style_prop_names`.
- **Panda:** `extractor/src/jsx.rs`, `calls.rs`, `matcher.rs`. Function-name
  allowlist only as a hint. Not Vue/Svelte/Astro. Not PascalCase guessing.

## Must not

- Choose values (leaves).
- Guess primitives by PascalCase.
