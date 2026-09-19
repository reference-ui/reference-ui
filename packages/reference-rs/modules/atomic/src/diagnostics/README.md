# Diagnostics

Fail-closed reporting, optional lint. **Not** a fallback evaluator.

1. **Traces** — unsupported AST, unknown token. Keep source text. No
   silent missing atom for a want we collected. Unknown dynamics get a
   diagnostic, not `vm`, not a vanished sibling.
2. **Lint (optional)** — nested ternaries on style props. Prefer `recipe()`
   or `data-*`. Leaves still insert both branches.

Every diagnostic carries a stable failure-class code from the `codes`
table (`ATM-W-…` warnings, `ATM-E-…` errors) plus the human message, so
hosts filter on the code and never parse the text. Extract warnings are
located: both expression walkers take the offending `Span` and resolve
it through `line_col` (UTF-16 columns, matching editor carets), so the
author jumps to the sub-expression that stopped extraction. The one-line
`{file}:{line}:{col} {code} {message}` rendering is shared by the CLI,
Neo, and the station specs instead of being reimplemented per consumer.

## Must not

- Fail the build on nested ternary in v1 (warn).
- Skip collection because lint fired.
- Execute the module graph “to see if we can resolve it.”
- Rename a code once a golden pins it; extend the table instead.
- Emit a diagnostic without a code; the constructors require one.
