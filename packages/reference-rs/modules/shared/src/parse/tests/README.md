# Tests

Unit tests for the nesting gate. `tests.rs` pins the limit and its line, the skipped literal regions, TypeScript generics against
plain JavaScript, and the Oxc failure shape of a refusal. The JSX tests pin the element levels, the miscount risks (comparisons,
generics, arrow generics, text that mentions `<`), the generic function types that TSX first reads as elements, and the bypass
that hid nesting behind them. The regex tests pin what a slash starts and the bypasses a quote or a backtick in a regex opened.
The unclosed-`<` tests pin that comparisons, shifts and unclosed generics count nothing and that open constructs are capped, and
the raw tests pin the mode-free bracket net and check the opener count against the scan. The generated tests build random nests of
known depth and chains of every kind of construct to the limit, and the measurements run only when `SHARED_MEASURE_OUT` is set.
