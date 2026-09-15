# Extract / css

Finds `css()` / `css.raw()` calls and hands their arguments to
`extract/expressions`.

```ts
css({ mt: '2r', _hover: { bg: 'n300' } })
css.raw({ p: '1r' })
css(cond ? { color: 'red' } : { color: 'blue' })
```

Every object argument is a style object. A ternary argument scoops both
object branches. This module does not walk JSX and does not walk
`recipe()`.

## Must not

- Choose values (expressions).
- Extract `sva` / `cva` / unknown helpers.
