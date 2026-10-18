# NEO-CSS-11 — authored custom properties keep casing (`--testVariable0`)

The world sets `--testVariable0` on a holder and reads it back through
`color: var(--testVariable0)` on a nested probe. The spec checks the sheet
carries the cased declaration and no lowercased twin, and the probe paints
the colour while `getPropertyValue` returns it under the exact name.

Evidence: Panda v1 test "preserves casing for css variable"; ATM-NAME-*
(selector allowlist leaves custom-property casing alone).

> Search terms: case-sensitive, camelCase, uppercase, CSS variables, cased vars, css/custom-properties, css/casing, NEO-CSS-04
