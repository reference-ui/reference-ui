# ATM-SITE-45 — `token()` call surface

Overmatch Ph3 (SPEC-V2-61): `token(path)` and `token.var(path)` fold when the
callee binds a `token` import from a Reference package — evaluated our way,
as `{path}` references that print theme-live `var()` aliases, never
parse-time hex (identical paint in the default theme, and only ours stays
correct after a theme change). Unknown paths with a fallback carry it (known
paths ignore it); without one they error with no ghost. Const paths, const
fallbacks, static-template paths, import aliases (including above a forward
import — imports hoist), `token()` consts, and JSX attrs all fold. Arity,
spread, empty, dynamic, multi-leaf, template, and foreign-member shapes warn
against the surface; shadowed, foreign-package, and unbound callees are not
token calls and warn generically.

Interpolated-template paths refuse until the template fold (SPEC-V2-67)
lands to compose with; fallbacks are verbatim (no brace expansion).

Panda: `token_calls.rs:92` (call), `:202` (var), `:268` (fallback), `:354`
(alias), `:382` (identifier path), `:470` (fallback ignored).
