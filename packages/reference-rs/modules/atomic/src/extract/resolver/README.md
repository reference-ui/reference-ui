# Resolver

Binding-aware import resolution for cross-file style values. Each file's
import bindings resolve to the declared export in THAT file — never to a
project-wide name bag — so two files declaring the same const name never
cross. The project graph holds every compiled file's constant bag plus its
export shapes and import edges; the walk follows `export … from` hops and
import-then-export edges with a `(file, export)` visited set for cycles,
caching every outcome (hit or miss) for the compile.

Specifiers follow the TypeScript ladder: relative joins, `tsconfig`
`paths`/`baseUrl`, extension and index probing, then `node_modules` with
`package.json` `exports` mapping. Targets outside the compiled sources —
packages and scope-excluded files — load into the graph as values-only, so
the value graph follows imports wherever they lead while the site set stays
put. Unresolvable specifiers, missing exports, cycles, and namespace or
default imports answer `None`, and the scope chain falls back to the merge
bag. Identity through re-exports and imported pure-helper descriptors ride
alongside in their own slices.
