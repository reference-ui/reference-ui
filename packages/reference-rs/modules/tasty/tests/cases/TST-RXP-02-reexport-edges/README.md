# TST-RXP-02 reexport edges

Verifies re-export edge cases including type-only re-exports, mixed re-exports, and ambient modules.
Ensures symbols across barrel exports and circular references are resolved.
Proves primary SPEC ID anchor TST-RXP-02.

Also covers star ambiguity (wave 6 find q): `star-ambiguity-a/b.ts`
both export `StarWidget`, the barrel star-re-exports both, and the
consumer import stays an unresolved external descriptor with exactly
one diagnostic naming the barrel, the name, and both sources.
