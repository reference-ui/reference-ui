# TST-RXP-02 reexport edges

Verifies re-export edge cases including type-only re-exports, mixed re-exports, and ambient modules.
Ensures symbols across barrel exports and circular references are resolved.
Proves primary SPEC ID anchor TST-RXP-02.

Also covers star ambiguity (wave 6 find q): `star-ambiguity-a/b.ts`
both export `StarWidget`, the barrel star-re-exports both, and the
consumer import stays an unresolved external descriptor with exactly
one diagnostic naming the barrel, the name, and both sources.

Doom-night fortify pins (tasty resolve cluster):
- B — `export *` never re-exports `default` (`star-default-*`): the
  barrel carries no `"default"`, the phantom default-import consumer
  stays unresolved, and an explicit `export { X as default }` seed
  alongside the star survives. Silent exclusion is correct ESM; no
  diagnostic exists for it.
- A — transitive named re-exports (`two-hop-*`): `barrel -> mid ->
  orig` binds the barrel name to the canonical origin symbol and the
  downstream consumer edge carries that target id.
- D — `export { default as X } from` (`default-as-*`) onto a
  default-exported *type* binds the barrel name to the canonical
  symbol with the consumer target id; the pre-existing
  `ReexportDefaultAsNamed` fixture (default-exported value literal)
  stays unresolved by design, since value literals mint no symbol.
- Cycle — the `circular-a ↔ circular-b` pair terminates; the
  declaring file's binding wins and `circular-consumer` resolves.
