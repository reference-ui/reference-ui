# module_graph

One specifier ladder, one module record, and one origin walk, shared by the
Reference UI compilers. Atomic, tasty, and styletrace each carried their own
copy of the climb from an import specifier to a file plus their own export
fan-out; this crate is the merged half they agree on, proven on its own with
`MemoryFs` fixtures and no dependency on any consumer.

The mental model is a pipeline with three handoffs. The ladder turns a
specifier authored in one file into a canonical key by walking every rung in
order — relative join, `tsconfig` bases, ancestor `node_modules` with
`exports` mapping, manifest entry fields, and the `@types` fallback — probing
each base with the policy's extension, index, and runtime-remap spellings.
Two extension policies keep both constituencies honest: `Source` probes
sources first for value compilers, `Declarations` probes declarations first
for type scanners. The graph memoizes one record per key through a consumer
loader, loading demand-first so a compile only reads what a walk touches.
The walk follows named import edges through the ladder, `export … from` hops
across files, and `export *` stars that fan out to exactly one distinct
origin; everything else is `Refused` data — cycles with trails, unresolvable
specifiers, missing exports, ambiguous stars, and the namespace and default
edges the value dialect refuses.

Boundaries are the point. Consumers parse once with the workspace oxc parser
and hand over `&Program`; the graph never owns an AST and never sees a value,
a type, a host, or a diagnostic string. Records hold import edges, export
shapes, star sources, and declared names — enough to answer "where is this
binding declared" and nothing more. The filesystem sits behind a five-method
trait so virtual compiles and tests run the same ladder as disk builds, with
symlinks canonicalized so linked packages share one key. Decisions the legacy
ladders left open are pinned here and tested as such: `exports` conditions
read `types`, `import`, `default`, `require` with fallthrough to the next
entry whose target exists; type fields keep tasty's priority over `exports`;
stars never carry `default`; and `export * as ns` has no member shape, so it
records nothing and lookups miss honestly.
