# TST-IMP-04 — An unresolved bare package import stays silent

Verifies that a type imported from a bare package specifier that is not installed emits no warning at all, since
the package may be a type the consumer never needed to resolve.
Verifies that the reference stays an external reference keyed by the package name.
Proves primary SPEC ID anchor TST-IMP-04.
