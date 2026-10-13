# TST-IMP-03 — Re-exports from a missing relative module warn TST-W-UNRESOLVED-IMPORT instead of vanishing silently

Verifies that both an `export * from` and an `export { X } from` naming a missing relative module each produce
one unresolved-import warning, one per specifier, and that the names they would provide never reach the manifest.
Verifies that the barrel's own declarations still emit beside the dangling re-exports.
Proves primary SPEC ID anchor TST-IMP-03.
