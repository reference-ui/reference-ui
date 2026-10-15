# ATM-COND-05 — Dialect-utility station

Dialect utilities `container`, `font`, `weight`, and `size` lower like
core box-pattern transforms. Tracking comes from the lib font table.
Bare `weight` names beside a family scope to that family's weights
(`sans` thin → 200, `serif` normal → 373, `mono` normal → 393);
family-less weights keep the CSS keywords, and a keyword the family's
scale omits (`mono` black) falls back to its CSS keyword (900).
Contract: [SPEC.md](../../../SPEC.md).
