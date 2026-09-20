# ATM-DIAG-14

Source modes: `.ts`, `.tsx`, `.js`, and `.jsx` use the one compiler
parse; JSX mode, parse errors, and UTF-16 locations do not drift
between extraction and diagnostics.

`input/src/modes/mt.{ts,tsx,js,jsx}` carry the same declaration with a
distinct color per mode so each mode's extraction is pinned
independently. `unicode.ts` places a dynamic identifier after an emoji
(UTF-16 column 54; byte-based would read 56) and `broken.jsx` carries a
parse error that must stay located without stopping the other modes.

RED (Slice 0): diagnostics has no independent analysis over the shared
parse yet, so per-mode expectation agreement is unobservable — the
opt-in channel assertions fail. Parse-error locations and the UTF-16
extract position are pins on current behavior (`line_col`,
`lib.rs` single parse). Architect Q3 (`VOYAGE-LOG-2.md`): the
StyleTrace dependency-boundary parse is grandfathered; the single-parse
rule binds the Atomic Oxc pipeline plus the new analysis. Related:
`ATM-DIAG-03` (parse errors), `ATM-DIAG-06` (UTF-16), `ATM-DIAG-08`
(expectations), `ATM-DIAG-12` (surfaces). Contract:
[SPEC.md](../../../SPEC.md). Symbols: `AnalysisInput`, `SourceId`,
`compilerDiagnostics`. Search: diagnostics source modes single parse
jsx drift utf-16 compiler channel.
