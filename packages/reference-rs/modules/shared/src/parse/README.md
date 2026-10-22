# Parse

The internals of the nesting gate. Its public API is in the parent `parse.rs`, which owns the one production `Parser::new`
call in reference-rs. The gate is a single linear pre-scan over the source bytes that tracks the open brackets, the
TypeScript generic `<` openers, the `${` expressions of template literals, and, in `.tsx` and `.jsx` sources, the JSX
elements. A JSX element is one level from its start tag to its closing tag: the `scan/jsx.rs` module reads tags and the
text of their children, which is raw, and the `scan/stack.rs` and `scan/literals.rs` modules hold the open-construct stack and
the skipped strings and comments. The unit tests pin the limit, the skipped regions, the JSX rules and the Oxc failure shape,
and two measurements run only when `SHARED_MEASURE_OUT` is set: the pre-scan's throughput and the deepest nesting over
`SHARED_DEPTH_ROOTS`.
