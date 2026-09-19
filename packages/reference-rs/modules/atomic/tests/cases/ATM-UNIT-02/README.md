# ATM-UNIT-02

Numeric and string spellings of the same number must canonicalise to one atom. Non-canonical forms are refused with diagnostics.

SPEC-V2-79 arm (Overmatch Ph3): finite numeric strings (`'1e3'`, `'.5'`,
`'01'`) canonicalize to the numeric atom and dedupe with the bare number;
the fence is Rust `f64` parsing, exactly like v2's `trimmed.parse::<f64>()`
(`atomic.rs:239`), so hex, `Infinity`, and `NaN` spellings still refuse.
