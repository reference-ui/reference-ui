# ATL-OBS-01 — observed props survive nested braces, arrow bodies and bare attributes

Verifies that a configured element passed `style={{ a: { b: 1 } }}`, `onClick={() => go()}` and a bare `disabled` reports exactly those three props, parsed from the AST rather than the tag text.
Asserts that `children` is counted only for the usage that has children, and that a bare attribute records the literal value `true`.
Proves ATL-OBS-01, the `usage::observe` pass.
