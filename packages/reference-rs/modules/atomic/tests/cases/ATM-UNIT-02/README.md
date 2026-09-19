# ATM-UNIT-02

Numeric and string spellings of the same number must canonicalise to one atom. Non-canonical forms are refused with diagnostics.

SPEC-V2-79 arm (Overmatch Ph3): finite numeric strings (`'1e3'`, `'.5'`,
`'01'`) canonicalize to the numeric atom and dedupe with the bare number;
the fence is Rust `f64` parsing, exactly like v2's `trimmed.parse::<f64>()`
(`atomic.rs:239`), so hex, `Infinity`, and `NaN` spellings still refuse.

S20 contrast arm (`contrast.ts` + the refuse asserts): v2's
`canonical_number` (`pandacss_encoder/src/lib.rs:512`) returns `None`
for `'01'` (leading-zero guard), `' 1'`/`'1 '` (no trim), and
hex/`Infinity`/`NaN`/`''` — the finite ones stay distinct strings, the
rest become invalid CSS. We trim-then-numerify the finite spellings
(`' 1'`/`'1 '` join `1`/`'01'` in the one `m_1` rule, silently) and
refuse hex/`Infinity`/`NaN` with `ATM-W-NON-CANONICAL-NUMERIC`.

`''` refuses with `ATM-W-INVALID-CSS-VALUE` (v2 emits `margin: ;`),
completing the S20 refuse half.
