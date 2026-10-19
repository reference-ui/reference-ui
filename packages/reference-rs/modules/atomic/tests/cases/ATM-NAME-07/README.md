# ATM-NAME-07 — Allowlist-escape

Selector escaping is an allowlist: every character outside `[A-Za-z0-9_-]`
is escaped, including `*` from `'& > *'`. Runtime names stay unescaped.
Contract: SPEC.
