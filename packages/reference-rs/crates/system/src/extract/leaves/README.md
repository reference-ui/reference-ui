# Extract / leaves

Walks a style expression and **inserts wants**. Panda tried to fold the
expression first. We never do: no folding, no evaluation, no execution.

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
  Never "left didn't fold, so only the right operand counts."
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

## Files (when coded)

- `mod.rs` — walk OXC, insert wants
- `object.rs`, `literal.rs`

## Panda

`extractor/src/literal.rs` (`expression_to_literal` at :226, PORT NOTE folding
at :300), `style_tree.rs` (`finish_ternary` at :242).
`design-notes/literal-evaluator.md` is the spec of what we are not building.

Be accurate about what they got right, or we will "fix" a working feature:

- **They already expand ternary branches.** A non-foldable test produces
  `Literal::Conditional` and the encoder emits every branch. Flat
  `bg={isSelected ? 'n300' : 'n100'}` works in v2. Our difference is that we
  never *try* to fold the test first, we flatten nesting, and `undefined` is
  never a leaf.
- **Three specific things to not copy:**
  1. `undefined` → `Some(Literal::Null)` (`literal.rs:511`) — a `Null` *leaf*.
  2. `finish_ternary` nesting `Conditional([Conditional([A,B]), Null])`
     instead of flattening — the encoder then drops it.
  3. **Asymmetric logical operators** (`literal.rs:684`): a non-foldable
     `&&` / `||` / `??` returns *only the right operand*, and a foldable falsy
     left short-circuits and discards the right. `false && '1px solid'` loses a
     literal that is plainly in the source.

## Must not

- `truthy()` on user expressions.
- Execute callbacks, or run the author's module graph, to learn a value.
- Collapse a site’s wants into one class.
