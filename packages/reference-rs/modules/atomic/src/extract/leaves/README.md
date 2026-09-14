# Extract / leaves

Walks a style expression and **inserts wants**. Never fold. No evaluation.
No execution.

```tsx
<Div mt="2r" bg={isSelected ? 'n300' : 'n100'} />
```

Wants: `mt=2r`, `bg=n300`, `bg=n100`. Three atoms. Runtime concatenates
the subset this render needs. Do not build a 2-row hashed table
(`mt+n300` vs `mt+n100`). Do not call `isSelected`.

Also walk:

- `_hover: { color: 'n300' }` → want with `when: [_hover]` (same prop,
  extra condition on the atom key)
- `&&` / `||` that carry a style literal
- breakpoint arrays
- static templates

Rules:

- `undefined` / omitted / non-style identifier → no insert. Never a `Null` leaf.
- `&&` / `||` / `??` are **symmetric**: collect literals from both operands.
- Per-member: `css({ color: 'red', width: props.w })` still keeps
  `color`. Dynamic `width` is a diagnostic, **not** a VM, not a drop of
  `color`.
- Unsupported AST: diagnostic, keep sibling wants.

Tabs:

```tsx
borderBottom={
  isLine && orientation === 'horizontal'
    ? isSelected
      ? '3px solid'
      : '3px solid transparent'
    : undefined
}
```

Two wants (`3px solid`, `3px solid transparent`) plus sibling
`borderColor`. They become **independent atoms**. Shorthand cascade is
`resolve/shorthands`’s job, not “emit them as one hashed block.”

## Must not

- `truthy()` on user expressions.
- Execute callbacks, or run the author's module graph, to learn a value.
- Collapse a site’s wants into one class.
