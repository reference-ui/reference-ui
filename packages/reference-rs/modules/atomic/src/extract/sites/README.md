# Extract / sites

Discovers style-bearing **call sites** and their **origin label**.

Styletrace traces wrappers to Reference primitives and knows export names.
Sites uses that, then finds expressions:

- JSX StyleProps (`bg`, `mt`, `borderBottom`, `_hover`, …)
- `css({ … })` / `css.raw`
- `recipe({ … })` / `recipe.raw` → `recipes/`
- Origin: `Tabs.Tab`, `Box`, `css` in `Card.tsx` — traces on wants, not class identity

React/TSX only. The function names are `css` and `recipe`, from
`@reference-ui/react`. Not PascalCase guessing. Not an extra jsx name list.

## Example (Panda)

`vendor/panda/crates/pandacss_extractor/src/{jsx,calls,matcher}.rs`.
They look for `css()`, `cva()`, `sva()`. We look for `css()` and `recipe()`.
Function-name allowlist only as a hint. Not Vue/Svelte/Astro.

## Must not

- Choose values (leaves).
- Guess primitives by PascalCase.
