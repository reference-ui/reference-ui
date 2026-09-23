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
`src/vendor/rust-tasty/` tree. Only specifier strings move: every extensionless
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

The run wipes the vendor directory first and reports how many files it wrote
and how many specifiers it rewrote. Both the tool and its output are
checked in, so fresh checkouts typecheck with no extra step.

## Quality gate

The quality directory holds the agentneo quality-gate implementation; its own
README describes the checks.
