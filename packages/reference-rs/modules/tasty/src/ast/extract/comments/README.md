# Comments

Finds leading comments adjacent to AST nodes and parses lightweight JSDoc-style
metadata (summary + `@tag` blocks) used for symbol and member descriptions.

## Files

- `leading.rs` — locate the contiguous comment block before a span; normalize text
- `parse.rs` — `CommentMetadata`, JSDoc line/tag parsing
- `mod.rs` — re-exports the public surface for `extract`
