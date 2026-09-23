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
