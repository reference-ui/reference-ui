# ATM-SITE-13 — Missing-graph

Styletrace gating fails closed: with no hosts resolvable (empty graph,
no Reference imports), style-bearing JSX extracts nothing and reports
one missing-graph error naming the file. Styleless files stay silent.
Contract: [SPEC.md](../../../SPEC.md).
