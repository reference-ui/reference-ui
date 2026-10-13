# Resolver Module

This folder contains the recursive reference-resolution passes used by
`ast/resolve`.

The top-level resolve layer builds lookup indexes and chooses which parsed file
is being processed. The `resolver/` submodule performs the actual work of
walking symbol shapes and nested `TypeRef` values to attach target ids.

## Binders

A symbol's own type parameters shadow same-named symbols across its whole shape: its `extends`,
underlying type, members, references, and parameter constraints and defaults. A reference to such
a name is bound (it is marked with its own name and with the `type_parameter` flag), so no top-level
symbol captures it. Extraction marks the nested binders the same way (see `ast/extract/types`).
Once a symbol's resolution is done, `binders.rs` clears the target and keeps the flag, so the output
carries no symbol target and is still never a dependency. An inner binder that shares its name with a
declaration's parameter keeps a `#binder` marker as its target, so a name-based substitution in the JS API cannot
take it for that parameter. Expansion instantiates a shell's
underlying type, where the alias's own parameters are not bound yet: a bare name that matches one
is substituted by its argument, whatever its source module. A default is instantiated where the
parameters before it already hold their arguments, so `B = A` takes `A`'s argument. A later
parameter named in a default stays unbound rather than resolving in the outer scope. A parameter
with no argument and no default becomes a flagged reference. Evaluation never dereferences a flagged
reference, because it names no symbol.

## Boundaries

- `extract` produces unresolved shells and references
- `resolver/` resolves them against indexes built by `resolve/index.rs`
- `generator` consumes the fully resolved graph
