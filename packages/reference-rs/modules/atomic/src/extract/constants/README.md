# Extract / constants

File-top `const` literals the expression walker may substitute.

```ts
const space = '2r'
const theme = { primary: 'n300' }

css({ mt: space, color: theme.primary })
```

Not a host. jsx / css / recipes still find the expression. This folder
only indexes bindings that are obviously literals so we do not need a
VM for `theme.primary`.

Imports, `props.w`, functions, and spreads are out. `{...base}` where
`base` is a const object is still unproven (SITE-11).

## Must not

- Evaluate JavaScript.
- Become a fourth extract surface next to jsx / css / recipes.
