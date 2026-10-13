# TST-EXT-05 — heritage-args: the type arguments of an extends clause are dependencies at any depth

`interface Direct extends Base<UserT>` must list `Base` and `UserT` as user-owned dependencies. The walk that
collects them reads each heritage clause and then its type arguments, so an argument at any depth counts:
`Nested extends Base<Wrap<UserT>>` lists `Wrap` and `UserT`. `UserT` is an interface, and the dependency list
reaches it through the heritage arguments. `Aliased extends Base<AliasT>` takes a type alias as its argument, and
the alias also lands in the symbol's `types` list, which the Rust reference walk fills.
The `extends` descriptor keeps its type arguments either way, which the spec checks as a control.
