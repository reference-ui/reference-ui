# Diagnostics

Fail-closed reporting, optional lint. **Not** a fallback evaluator.

1. **Traces** — unsupported AST, unknown token. Keep source text. No
   silent missing atom for a want we collected. Unknown dynamics get a
   diagnostic, not `vm`, not a vanished sibling.
2. **Lint (optional)** — nested ternaries on style props. Prefer recipes
   or `data-*`. Leaves still insert both branches.

## Must not

- Fail the build on nested ternary in v1 (warn).
- Skip collection because lint fired.
- Execute the module graph “to see if we can resolve it.”

## Panda

`pandacss_shared::Diagnostic` / `diagnostic_codes`. Extractor also
emits diagnostics from fold failure — we emit them from “could not
insert this want,” never as a cue to eval.
