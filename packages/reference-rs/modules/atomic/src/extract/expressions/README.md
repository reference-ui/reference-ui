# Extract / expressions

Walks a **style expression** and inserts **wants**. Never fold. No
evaluation. No execution.

This is not a JSX module. `extract/jsx`, `extract/css`, and
`extract/recipes` find the host; this pass decides what is inside it.
The same walkers run for:

```tsx
<Div mt="2r" bg={isSelected ? 'n300' : 'n100'} />
```

```ts
css({ mt: '2r', _hover: { bg: 'n300' } })
recipe({ base: { color: 'white' } })
```

A want is `(prop, value, when)`. Runtime concatenates the subset this
render needs. Do not build a hashed table keyed by the whole object
(`mt+n300` vs `mt+n100`). Do not call `isSelected`.

## Two walkers

**Expression walk** — one property, one AST expression. JSX
`bg={…}`, a longhand in `css({ color: 'red' })`, a ternary, an array.

**Object walk** — a style object: `css({ … })`, `recipe({ base, variants })`,
`_hover={{ … }}`, `r={{ … }}`. Each key is a condition, the `r` prop, a
known style prop (then expression walk), or a spread.

jsx, css, and recipes choose which walker. This pass does not know if the
host was a tag or a call.

## Literals

A string, number, or boolean is one want. `null` / `undefined` /
`void 0` insert nothing — never a `Null` leaf.

```tsx
<Div mt="2r" opacity={0.5} hidden={false} />
```

Wants: `mt=2r`, `opacity=0.5`, `hidden=false`.

Inline important is still a literal:

```tsx
<Div mt="2r!" />
css({ p: '1r!important' })
```

The `!` flag lands on the want. Naming `mt_2r!` is stylesheet’s job.

Static templates (`\`2r\``) are literals. `` `2${n}r` `` is dynamic:
diagnostic, no want.

Type wrappers are transparent: `( '2r' )`, `'2r' as const`,
`'2r' satisfies string`, `'2r'!` unwrap and walk the inner expression.

## Branching — scoop, do not eval

Both sides of a ternary are wants. The test expression is ignored.

```tsx
<Div bg={isSelected ? 'n300' : 'n100'} />
```

Wants: `bg=n300`, `bg=n100`. Two atoms. Runtime picks.

Nested:

```tsx
<Div
  borderBottom={
    isLine && orientation === 'horizontal'
      ? isSelected
        ? '3px solid'
        : '3px solid transparent'
      : undefined
  }
/>
```

Two wants (`3px solid`, `3px solid transparent`). The `undefined`
alternate is omitted. Sibling `borderColor` on the same host is a
separate want. Shorthand cascade is `resolve/shorthands`, not “emit
them as one hashed block.”

Logical operators are **symmetric**. Collect literals from both
operands. Guard-only left sides (`false &&`, `undefined`, `null`,
comparisons) are not style values and are skipped.

```tsx
<Div
  border={false && '1px solid'}
  color={'red' || 'blue'}
  bg={isSelected && 'n200'}
/>
```

Wants: `border=1px solid`, `color=red`, `color=blue`, `bg=n200`.
`false` is a guard, not a border.

## Objects, conditions, `r`

Object walk is how `css()` and nested JSX condition props share one
model.

```ts
css({
  color: 'red',
  _hover: { bg: 'n200' },
  _dark: { _hover: { borderColor: 'gold' } },
})
```

- `color=red` unconditioned
- `bg=n200` with `when: [_hover]`
- `borderColor=gold` with `when: [_hover, _dark]` — outer to inner,
  same order the author wrote

JSX is the same object walk:

```tsx
<Div color="blue.600" _hover={{ color: 'red.500' }} />
```

The `r` prop is an object whose **keys** are breakpoints, not style
props. This pass asks `resolve/r` for the query, then walks the nested
styles under that `when`:

```tsx
<Div r={{ 300: { p: '1r' }, md: { mt: '2r' } }} />
```

Wants: `p=1r` when `@container (min-width: 300px)`, `mt=2r` when
`@container (min-width: 768px)`. Numeric keys are language. Named keys
look up `config/breakpoints.rs`. Unknown names warn and skip.

## Responsive arrays

Index → breakpoint name from the compile-time scale. Index 0 is
`base`. Holes (`null`, elision) skip.

```tsx
<Div mt={['1r', '2r', null, '4r']} />
```

Wants: `mt=1r` when `base`, `mt=2r` when `sm`, skip, `mt=4r` when
`lg` (or whatever slot 3 is on the ingested scale). A ternary inside a
slot still scoops both branches, tagged with that slot’s condition.

## Spreads and siblings

Inline object spreads merge. Dynamic spreads warn and **keep
siblings**.

```ts
css({
  color: 'red',
  ...{ margin: '10px' },
  ...(cond ? { padding: '10px' } : { gap: '8px' }),
  width: props.w,
})
```

Wants: `color=red`, `margin=10px`, `padding=10px`, `gap=8px`.
`width` is a diagnostic. `maybeFn()` is the same: do not eval, keep
`color`. Per-member failure is not a reason to drop the object.

Computed keys (`{ [dynamicKey]: '10px' }`) warn. No want for that
entry.

## Local constants

File-top `const` scalars and style objects can be substituted without a
VM:

```ts
const space = '2r'
const theme = { primary: 'n300' }
css({ mt: space, color: theme.primary })
```

`props.w`, imported bindings, and anything that is not that style object stay
dynamic (diagnostic). That is not an interpreter.

## After this pass

Resolve turns a want into atoms (rhythm, tokens, shorthands, `font` /
`weight` / `container` / `size`). Expressions do not print CSS, name
classes, or expand `2r` → `calc(...)`. If a literal never became a
want, resolve never sees it.

## Must not

- `truthy()` on user expressions, or run the author’s module graph.
- Collapse a site’s wants into one class because they sat on one host.
- Treat JSX as a special value language. The host is jsx / css / recipes;
  the expression is this pass.
- Fold `undefined` to a `Null` leaf (Panda’s evaluator). Omission is
  the correct empty.
