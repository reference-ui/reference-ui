# Parse

The internals of the nesting gate. Its public API is in the parent `parse.rs`, which owns the one production `Parser::new`
call in reference-rs. The gate is a single linear pre-scan over the source bytes that counts the open constructs. Brackets and
the `${` of template literals count the moment they open. A TypeScript generic `<` and a JSX element are guesses, so each counts
only once its closer is seen, and a comparison, a shift or a misread tag that never closes costs nothing. Strings, regex literals,
comments and template text are read past whole, and JSX text, which is raw, is read as text.

Two wider limits back the scan up against a construct it misreads. No more than eight times `MAX_NESTING` constructs may be open
at once, counted or not, which refuses an unclosed nest. A raw bracket count that reads every `(`, `[` and `{` as a bracket, with
no lexing rule at all, refuses a source whose count passes eight times the limit. A count of opener bytes sits in front of the
whole gate: a source with no more than `MAX_NESTING` of them cannot reach any limit, so it skips the scan.

The unit tests pin the limit and its line, the skipped runs, the JSX and regex rules, the unclosed `<` and the two wider limits.
They check the opener count against the scan on token soups and the scan against generated nests of known depth. Measurements
run only when `SHARED_MEASURE_OUT` is set: the scan's throughput, the time of an adversarial source, and a survey of every
source under `SHARED_DEPTH_ROOTS`.
