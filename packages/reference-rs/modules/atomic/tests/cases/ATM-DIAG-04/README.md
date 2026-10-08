# ATM-DIAG-04

Located diagnostics beyond extract: every diagnostic the compiler emits
carries `file:line:col` of the offending site, so a warning without a
position — unactionable in an editor — cannot ship.

`input/src/located.ts` pairs the two halves on known lines: a dynamic
identifier (`height: depth`, line 4) and a token-resolution warning
(`caretColor: 'ui.missing.path'`, line 5), beside a static `mt: '2r'`
sibling that still extracts. The spec pins the extract refusal at
4:11 and asserts the resolve warning carries its own line and column,
then asserts the blanket claim over every diagnostic.

Mechanism: extract call sites locate through `warn(span, …)` resolved
via `line_col` (green since `ATM-DIAG-05`); `resolve/tokens`
`warn_unresolved_token` (`resolve/tokens/mod.rs`) still pushes
`Diagnostic::warning` with no location. Related: `ATM-DIAG-02`
(fail-closed warnings), `ATM-DIAG-05` (extract precision, template),
`ATM-DIAG-06` (UTF-16 columns), `ATM-TOKEN-12` (first located token
diagnostic), `ATM-TOKEN-14` (passthrough trigger). Contract:
[SPEC.md](../../../SPEC.md) (`ATM-DIAG-04`, open). Operation Error
Correct Slice 0; observed red hinge: the `ATM-W-UNKNOWN-TOKEN-PATH`
warning carries no file/line/column.
Search: diagnostics location resolve token position line_col unlocated.
