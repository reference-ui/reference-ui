# Resolver

Binding-aware import resolution for cross-file style values and pure
helpers. Each file's import bindings resolve to the declared export in THAT
file — never to a project-wide name bag — so two files declaring the same
name never cross. The project graph holds every compiled file's constant
bag plus its export shapes, import edges, and lowered helper descriptors;
the walk follows `export … from` hops and import-then-export edges with a
`(file, export)` visited set for cycles, caching every outcome (hit or
miss) for the compile. A second pass overlays each file's scope-resolved
top-level values (alias chains, identifier values, static spreads) onto
its bag entry, so cross-file objects arrive as complete as same-file ones.

Specifiers follow the TypeScript ladder: relative joins, `tsconfig`
`paths`/`baseUrl`, extension and index probing, then `node_modules` with
`package.json` `exports` mapping. Targets outside the compiled sources —
packages and scope-excluded files — load into the graph as values-only, so
the value graph follows imports wherever they lead while the site set stays
put. Unresolvable specifiers, missing exports, cycles, and namespace or
default imports answer `None`: values fall back to the merge bag, while
helpers never fall back — an unbound callee refuses with a diagnostic.
Identity through re-exports rides alongside in its own slice.
