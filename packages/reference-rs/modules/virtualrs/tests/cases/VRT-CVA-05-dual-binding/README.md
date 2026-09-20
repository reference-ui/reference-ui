# VRT-CVA-05 dual binding

Verifies a single import declaration carrying BOTH canonical CVA bindings
(`cva` and `recipe`) normalizes every call site to the emitted canonical
`cva` imported from `src/system/css`, with no dangling `recipe(` references.
Proves SPEC anchor `VRT-CVA-05`.
