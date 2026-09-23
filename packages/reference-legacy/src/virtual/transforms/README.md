# Virtual Transforms

The `transforms` module owns the ordered file-transform pipeline used by the virtual mirror and the reserved style collection.

## Layout

- `index.ts`: orchestrates the full ordered transform pipeline
- `integration.test.ts`: real transform integration coverage for normal files and reserved `__reference__ui` bundles
- `apply-responsive-styles/`: responsive `r` lowering
- `css-imports/`: CSS import retargeting
- `cva-imports/`: recipe/cva import retargeting
- `mdx-to-jsx/`: MDX compilation
- `neutralize-style-calls/`: Panda-visibility neutralization outside the reserved style collection

## Ordering

The transform order stays intentional:

1. MDX to JSX
2. cva/recipe import retargeting
3. css import retargeting
4. responsive lowering
5. style-call neutralization for non-reserved files only

The folder names describe the transform target rather than repeating the verb `rewrite` in every filename.