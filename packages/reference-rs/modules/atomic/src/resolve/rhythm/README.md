# Resolve / rhythm

Native port of Reference’s `r` multiplier.

Authoring: `mt="2r"`, `gap="1/3r"`, mixed strings like `4r 2r`. Output is
the same calc the current helper already documents:

- `1r` → `var(--spacing-root)`
- `2r` → `calc(2 * var(--spacing-root))`
- `1/3r` → `calc(var(--spacing-root) / 3)`

Rhythm belongs here so stylesheet and `css()` share it. Matrix
`matrix/spacing` is the spec. Do not change the public `r` grammar.

## Must not

- Change the public `r` grammar.
- Apply rhythm to non-length props by accident (color, `display`, …).
