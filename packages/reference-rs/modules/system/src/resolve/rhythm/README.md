# Resolve / rhythm

Native port of Reference’s `r` multiplier.

Authoring: `mt="2r"`, `gap="1/3r"`, mixed strings like `4r 2r`. Output is
the same calc the current helper already documents:

- `1r` → `var(--spacing-root)`
- `2r` → `calc(2 * var(--spacing-root))`
- `1/3r` → `calc(var(--spacing-root) / 3)`

This is **our** extension, not a Panda primitive. Today it lives in
`packages/reference-core/src/system/panda/config/extensions/rhythm/` and
runs as a JS `transform` Panda v2 cannot execute from Rust. That is exactly
the split-brain. Rhythm belongs here so stylesheet and `css()` share it.

## Files (when coded)

- `mod.rs` — `resolve_rhythm(value) -> AtomValue`
- Port the parser in `helpers.ts` (`resolveRhythm`, fraction forms,
  value-parser-ish splitting for lists). No PostCSS-in-Rust unless a tiny
  tokenizer is honestly smaller.

## Lift

- **Ourselves:** `getRhythm` / `resolveRhythm` semantics. Matrix
  `matrix/spacing` is the spec.
- **Panda:** nothing. They do not own `r`.

## Must not

- Change the public `r` grammar.
- Apply rhythm to non-length props by accident (color, `display`, …).
