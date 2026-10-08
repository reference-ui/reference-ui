# ATM-DIAG-05

Diagnostic precision: every refusal the extractor emits carries
`file:line:col` of the offending sub-expression plus a stable
machine-readable code (`ATM-W-…` / `ATM-E-…`), so the author can jump to
the exact node that stopped extraction and tooling can filter by failure
class instead of parsing messages.

`input/src/precise.ts` places eleven refusals on known lines: a dynamic
call argument, a dynamic member, two dynamic identifiers (same mistake,
same code), an interpolated template, a computed key, an unknown prop, a
dynamic spread, a non-object condition value, an unknown `r` breakpoint,
and a mutated binding. The spec pins each diagnostic's line, column, and
code, and asserts the static `mt: '2r'` sibling still extracts.

Mechanism: `ExpressionWalk::warn` and `ObjectWalk::warn` take the
offending `Span` and resolve it through `line_col`; `Diagnostic` carries
a `DiagnosticCode` from the `diagnostics/codes` table, rendered as
`{file}:{line}:{col} {code} {message}`. Messages and warn-vs-silent
behavior are unchanged from `ATM-DIAG-02`. Related: `ATM-DIAG-02`
(fail-closed warnings), `ATM-DIAG-04` (positions beyond extract, open),
`ATM-SITE-28` (mutated bindings). Contract: [SPEC.md](../../../SPEC.md).
Overmatch SPEC-V2-77, Ph1.
