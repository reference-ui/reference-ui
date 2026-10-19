# ATM-TOKEN-26 — A token value that names another token without braces warns ATM-W-UNBRACED-TOKEN-REF and suggests the braced ref

A tokens() leaf whose whole value is a bare dotted path prints verbatim into `@layer tokens`, which is invalid CSS, so the compiler warns and suggests the braced reference. `colors.accent` with value `gray.900` (a path within its own category) and `colors.alias` with value `colors.gray.900` (a full key) each warn once, both suggesting `{colors.gray.900}`, and both print as written. A braced value (`{colors.gray.900}`), a token whose value is its own name (`borderStyles.solid = solid`), and complete CSS (`sizes.hairline = 1px`) never warn.
Symbols: `warn_unbraced_token_ref`, `named_token_key`, `DiagnosticCode::UnbracedTokenRef`.
Siblings: `ATM-TOKEN-11` (a braced `{path}` token value prints as a `var()` alias), `ATM-TOKEN-12` (an unknown braced reference is an error).
Contract: SPEC.

> Search terms: unbraced token reference, bare dotted path, token value, tokens layer, suggests braces, ATM-W-UNBRACED-TOKEN-REF, gray.900
