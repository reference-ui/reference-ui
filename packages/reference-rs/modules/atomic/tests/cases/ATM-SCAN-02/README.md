# ATM-SCAN-02

Discovery entry set is include-scoped: a forwarding wrapper outside `include` is not a host even when an in-scope file renders it, unless an in-scope wrapper imports it — then it is an edge target and the importing wrapper traces under its own name.
Twin of ATM-SCAN-01 (extraction scoping). Siblings: ATM-SITE-56 (discovery), `entry_scope` (disk-seam entry/edge rule).
Contract: [SPEC.md](../../../SPEC.md).

> Search terms: entry set, include scope, edge target, discovery, tracedJsxHosts
