# Extract / constants

File-top `const` literals the expression walker may substitute.

```ts
const space = '2r'
const theme = { primary: 'n300' }

css({ mt: space, color: theme.primary })
```

Not a host. jsx / css / recipes still find the expression. This folder
only indexes bindings that are obviously literals so we do not need a
VM for `theme.primary`. Object entries carry every static leaf —
literals, branching arms, one nested level — and dynamic values record
an empty marker so the use site diagnoses them (SITE-50/77).

Imports, `props.w`, functions, and spreads are out. `{...base}` where
`base` is a const object unpacks through SITE-11.

## Must not

- Evaluate JavaScript.
- Become a fourth extract surface next to jsx / css / recipes.
