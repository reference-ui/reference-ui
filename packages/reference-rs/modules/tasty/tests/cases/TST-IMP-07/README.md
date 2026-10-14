# TST-IMP-07 — An import-equals alias of a namespace member resolves to the referenced symbol with no unsupported-syntax warning

Verifies `import X = <entity>`, the alias form declaration files use for namespaces and their members. A top-level
alias of an import namespace member (`import Span = diagnostics.ByteSpan`) and a top-level alias of a namespace declared
in the same file (`import Round = Shapes.Circle`) both lower to the referenced symbol, as does an exported alias
(`export import Ring = Shapes.Circle`) that another module imports by name. An alias declared inside a namespace block
(`import Mark = diagnostics.ByteSpan`) resolves inside that block.
Verifies that no `TST-W-UNSUPPORTED-SYNTAX` warning is emitted for an entity alias, since tasty models it.
Proves primary SPEC ID anchor TST-IMP-07.
