# Extract / css

Finds `css()` / `css.object()` calls and hands their arguments to
`extract/expressions`.

```ts
css({ mt: '2r', _hover: { bg: 'n300' } })
css.object({ p: '1r' })
css(cond ? { color: 'red' } : { color: 'blue' })
```

`css()` returns a class string. `css.object()` is the same style
object, kept as an object — merge later, pass `css={…}`, return from
a helper. Extract still has to walk it: those leaves are utilities.

Every object argument is a style object. A ternary argument scoops both
object branches. This module does not walk JSX and does not walk
`recipe()`.

## Must not

- Choose values (expressions).
- Extract `sva` / `cva` / unknown helpers.
