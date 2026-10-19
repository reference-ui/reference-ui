# ATM-SITE-56 — Zero-config discovery

Zero-config discovery: a local Card forwarding StyleProps into Div extracts with `jsxHosts` absent and no declarations on disk, and `tracedJsxHosts` carries `Card`.
Random (bare `div`, the CORE-SITE-12 antihost shape) and Label (no style props at its boundary) are not traced: Random's `color` lowers under own as an untraced component (styling plan S3), silently, and Label's use site carries no style prop.
Contract: [SPEC.md](../../../SPEC.md). Siblings: ATM-SITE-13 (fail-closed empty graph), ATM-SCAN-02 (entry scoping), ATM-SEAM-05 (result field).

> Search terms: discovery, tracedJsxHosts, zero-config, antihost, StyleSurface
