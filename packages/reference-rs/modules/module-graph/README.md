# module_graph

Resolves import specifiers to files and walks exports to where a binding is
declared, shared by the Reference UI compilers.

## What it provides

- **Ladder** (`SpecifierLadder`): relative specifiers join the importer's
  directory. Bare ones try the nearest `tsconfig.json` `paths`/`baseUrl` (with
  `TsconfigPolicy::Follow`), then each ancestor `node_modules`: `exports` or
  entry fields, the direct path, a root's `@types` twin. Bases probe the literal
  file, then extensions and indexes; `.js` tries source siblings first. Hits
  canonicalize, so symlinks share a key.
- **Policies** (`ExtensionPolicy`): `Source` probes sources first (value
  compilers); `Declarations` probes declarations first (type scanners).
  `RootEntryPolicy` orders a package root's `exports`, `module`, and `main`
  against its top-level `types`/`typings`: `SourceFirst` by default, so a
  declaration beside a source entry never shadows it; `TypesFirst` is opt-in
  for consumers that resolve declarations, and no production ladder sets it.
- **Records** (`ModuleGraph`): `ModuleRecord::collect` reads a parsed program
  into value import edges, an export table, and declared names. The graph
  memoizes one record per `ModuleKey`, loaded on first use.
- **Origin walk** (`BindingWalk`): follows named imports, `export … from` hops,
  and `export *` stars to the declaration. Failures are `Refused` data: cycles,
  unresolved specifiers, missing exports, ambiguous stars, default or namespace.
- **Filesystem** (`FileSystem`): five methods (`read_to_string` through
  `canonicalize`); `DiskFs` uses disk, `MemoryFs` backs tests.

## Where it is used

- `atomic`: resolves import values and walks binding origins.
- `styletrace`: resolves bare and relative imports within its trace sessions.

It takes a parsed `oxc` `&Program`, never owns an AST, and produces no
diagnostics: `Refused` values are data that consumers word.
