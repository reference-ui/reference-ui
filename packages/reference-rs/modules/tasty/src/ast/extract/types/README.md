# Types

Lowers Oxc `TSType` annotations into `TypeRef` values: keywords, references, composites, tuples,
conditional and mapped types, and template literals. Constructs without a structured lowering stay
`Raw` source text, which is an IR choice and never a diagnostic.

## Binders

A lowering pass carries the names that enclosing binders bind: a function or constructor type's
parameters, a method or call signature's own parameters, a mapped type's key, and the `infer`
variables of a conditional's extends clause, which bind in its true branch only. A reference to a bound
name is emitted with its own name as its target id and with the `type_parameter` flag set (see
`bound_reference`). No symbol id has that shape, so the resolver never attaches it to a same-named
top-level symbol. The resolver clears the target before a symbol leaves resolution and keeps the flag,
which is how a bound name stays distinct from an unresolved external one. Interface and type-alias
parameters are not visible to extraction; the resolver binds those for the whole declaration and flags
them the same way.

## Tuples

A labeled rest element (`...rest: boolean[]`) is one element that carries both its label and its rest
flag. Other tuple elements lower through the normal type path, with a synthetic reparse for the variants
the structured arms do not cover.
