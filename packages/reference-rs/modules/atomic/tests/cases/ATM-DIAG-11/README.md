# ATM-DIAG-11

Unknown values stay compiler-only: identifiers, member expressions,
`` `${n}px` `` and `` `${color}` `` templates, call expressions, `a + b`
binaries, and object spreads never become userspace warnings. The extractor
refuses them, but refusal alone proves no exact runtime miss, so the default
channel stays silent and the facts live on the compiler channel.

`input/src/unknowns.ts` places one of each unknown shape beside a static
`mt: '2r'` sibling that still extracts. The spec asserts the default
compile contains none of the `ATM-W-DYNAMIC-*` / `ATM-W-UNFOLDABLE-*`
codes. RED: they warn on default today (`ATM-DIAG-02` / `ATM-DIAG-05` pin
that behavior), so the assertion fails until the audience policy lands.

Mechanism: the proof engine classifies these AST values as unknown (no
exact expected lookup), and audience policy routes unknown-value facts to
the compiler channel only. Related: `ATM-DIAG-02` (fail-closed warnings),
`ATM-DIAG-05` (diagnostic precision), `ATM-DIAG-07` (channel isolation),
`ATM-SITE-33` (binary folds and refusals). Contract: [SPEC.md](../../../SPEC.md).
Operation Error Correct, Slice 0.
