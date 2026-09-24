# Neo tools

Small checked-in utilities that support the Neo package. Each tool runs by an
explicit documented command; nothing here hooks into install or build lifecycles.

## Reference component mirror

The mirror script copies the living Reference presentation set out of
reference-lib source and into the gitignored browser-component mirror under the
Neo reference module. Only the two living roots cross the seam; the lib-owned
shell, fixtures, and theme stay behind. Every copied file gains a provenance
header naming its lib source, and package type imports are rewritten to the
neighboring browser adapter so the mirror compiles against Neo runtime types.
Consumer-resolved design-system imports pass through untouched, exactly as the
core copy tool leaves them.

Run it from the Neo package directory whenever the lib source moves:

```sh
cd packages/reference-neo && node tools/mirror-reference-component.mjs
```

The run takes a lock file, wipes the mirror directory first, and reports how
many files it wrote. The mirror directory itself is gitignored; the tool that
fills it is the checked-in artifact.

## Tasty declaration vendor

The vendor script copies the reachable `@reference-ui/rust` tasty declaration
closure out of the built RS dist and into the committed
`src/native/generated/tasty/` tree. Only specifier strings move: every extensionless
relative import becomes its explicit NodeNext form, so the vendored tree
typechecks under neo's module resolution while the RS source tree stays
untouched. Every copied file gains a provenance header pinning the RS version
and the regen command; nothing is hand-mimicked, so the copy cannot drift from
the upstream surface it shadows. The package tsconfig maps the three tasty
subpaths onto the vendored tops; runtime resolution is unaffected (paths are
type-only). The reference-types bundle leg consumes tasty values through
node resolution to the RS dist and passes explicit tsconfigRaw, so these
paths entries — which point at declaration files — never feed a bundle.

The `src/entry/types.d.mts` template type-imports the tasty handle names
rather than inlining them, so an RS rebuild that renames a handle breaks
the package typecheck loudly instead of drifting silently. No regen step
exists or is needed for the template: no RS rebuild means no action, and
if tsc ever names a tasty import there, update the import list.

Run it from the Neo package directory after an RS rebuild, and use `--check`
to verify the committed tree is fresh:

```sh
cd packages/reference-neo && node tools/vendor-rust-tasty-dts.mjs
cd packages/reference-neo && node tools/vendor-rust-tasty-dts.mjs --check
```

The run wipes the generated tasty directory first and reports how many files it wrote
and how many specifiers it rewrote. Both the tool and its output are
checked in, so fresh checkouts typecheck with no extra step.

## Primitives roster vendor

The vendor script copies the committed primitives generator output (E1 vocabulary
JSON plus the E4 raw-types closure) out of the linked `@reference-ui/rust` module
sources and into the committed `src/native/generated/primitives/` shelf. E1 copies
byte-exact, since JSON carries no header; every E4 declaration file gains a
provenance header pinning the RS version and the regen command, with relative
specifiers rewritten to their explicit NodeNext form exactly like the tasty vendor.
The executable roster and its runtime trio are deliberately not copied: they ship
live through the `@reference-ui/rust/primitives` subpath, so the shelf holds data
and types only and can never drift from the code that renders.

Run it from the Neo package directory after re-running the primitives generator,
and use `--check` to verify the committed shelf is fresh:

```sh
pnpm --filter @reference-ui/rust run primitives && cd packages/reference-neo && node tools/vendor-rust-primitives.mjs
cd packages/reference-neo && node tools/vendor-rust-primitives.mjs --check
```

The run writes the shelf in place (the authored shelf README is not a payload and
is never touched) and sweeps vendored payloads the fresh set no longer contains.
`--check` reports `missing:`/`stale:`/`extra:` lines plus the regen command and
exits 1 on any drift. The quality gate runs `--check` first and fails on drift, and
CI runs the same command, so a stale shelf breaks loudly in both places.

Release checklist for the primitives contract, in order: re-run the RS generator
until its own golden is green; rebuild the RS JS dist so the live roster entry
stays coherent with the vendored pair; re-run this vendor tool; confirm `--check`
prints fresh; confirm the quality gate is green. No step is optional and no step
reorders: each one consumes the bytes of the previous.

## Compiled bin build

The build script compiles the shippable `neo` bin. Node refuses to
type-strip files under `node_modules`, so the packed package cannot ship
`bin/neo.ts` source the way dev runs it — the bin must be compiled JS.
The build transpiles `src/` + `bin/` into the gitignored `dist/` tree with
tsc (layout-preserving on purpose: sync resolves esbuild alias entries and
reads declaration assets from paths computed off `import.meta.url`, so a
single-file bundle would break resolution), then lays the alias-entry
twins plus the runtime-read `types.d.mts` beside the emit, asserts the
alias-literal set is exactly the known one (drift fails loudly), and makes
`dist/bin/neo.js` executable. `package.json` points `bin` and the
`./runtime` export at the emit; `prepack`/`prepublishOnly` run the build,
and `files` carries `dist` only.

Run it from the Neo package directory after pulling or editing neo
sources, and before any `.bin/neo` invocation in a fresh checkout:

```sh
cd packages/reference-neo && node tools/build-bin.mjs
```

The run is idempotent and typechecks as it emits (tsc errors fail the
build). Direct-source invocations (`node bin/neo.ts`, the CLI specs) keep
working without it — only the installed-shim shape needs the emit.

## Quality gate

The quality directory holds the agentneo quality-gate implementation; its own
README describes the checks.
