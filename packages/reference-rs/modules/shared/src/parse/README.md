# Parse

The internals of the nesting gate. Its public API is in the parent `parse.rs`, which owns the one production `Parser::new`
call in reference-rs. The gate is a single linear pre-scan over the source bytes that tracks the open brackets, the
TypeScript generic `<` openers, the `${` expressions of template literals, and skips string literals, template text and
comments; it reports the deepest nesting it reaches, or the refusal at the line where the limit is crossed. The unit tests
pin the limit, the skipped regions and the Oxc failure shape, and two measurements run only when `SHARED_MEASURE_OUT` is
set: the pre-scan's throughput and the deepest nesting over `SHARED_DEPTH_ROOTS`.
