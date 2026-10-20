# CORE-PGEN spec harnesses

Set-parity helpers diffing the vendored shelf against the live tables with loud diffs naming every missing or extra member, plus a temp-project tsc harness emitting pass/fail verdicts with capped diagnostics. Each spec feeds its own parity triangle and consumers; the harnesses own no verdict alone.
