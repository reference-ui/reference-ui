# Atlas cases

Each direct subfolder of this directory is one Atlas scenario.

The intended layout mirrors Tasty closely, but Atlas is still earlier in its
implementation. Each case should own:

- `input/app/` — the project root Atlas analyzes
- `input/demo-ui/` or other support packages — local library-style modules used by the app
- `api.test.ts` — scenario-local assertions
- `output/` — reserved for known analysis output once Atlas emits real artifacts

Current seed case:

- `demo_surface/` — local wrappers, local composition, and library component usage
- `aliases_and_renames/` — renamed local imports still map back to the canonical component
- `namespace_package_usage/` — namespace imports still resolve included package components
- `default_exports/` — default-exported components and default imports still map cleanly
- `barrel_reexports/` — local barrel exports still resolve component identity and usage
- `default_reexport_aliases/` — `export { default as Button }` chains still resolve canonical component identity and aliased call sites
- `local_namespace_barrels/` — local namespace imports routed through barrels still resolve component inventory and usage
- `wrapped_components/` — `memo(...)`, `forwardRef(...)`, destructured props, and aliased wrapper call sites still map cleanly
- `dynamic_values/` — dynamic JSX expressions still count prop usage without inventing literal value observations
- `same_name_collisions/` — same-named local components remain distinct by source and usage
- `package_barrels/` — local wrappers and included package surfaces resolve through package entrypoint re-exports
- `package_default_barrels/` — package default exports forwarded through entrypoint barrels still resolve inventory and interface mapping
- `co_usage_pairs/` — common co-usage stays deterministic and ranks more-common neighbors higher
- `unresolved_props_type/` — unresolved props types preserve partial results and emit diagnostics
- `unsupported_inline_types/` — unsupported inline props annotations emit diagnostics instead of vanishing silently

Atlas global setup now writes known outputs per case under `output/`:

- `analysis.json` — structured Atlas analysis for the case app root
- `diagnostics.json` — current Atlas diagnostics payload for the case

As Atlas grows, the same folders should keep driving real end-to-end analysis
and golden outputs.

Current release-bar case families are finite and focused:

- direct local components
- local wrappers and composition
- aliased imports and renamed call sites
- default exports and default imports
- local barrel re-exports
- default re-export alias chains
- local namespace barrel imports
- namespace package usage
- package barrel resolution
- package default-export barrel resolution
- same-name local collisions
- dynamic prop expressions
- deterministic co-usage
- unresolved props diagnostics
- unsupported inline props diagnostics

Those are release-bar cases because they support the real Atlas contract:

- components available
- component usage
- interface/props mapping
- common co-usage

Implementation-detail hardening cases still matter, but they are secondary to
those outputs:

- `wrapped_components/` — ensures helper forms like `memo(...)` and
  `forwardRef(...)` do not break the core contract

Recommended next hardening cases:

- `package_default_barrels/` — package entrypoints that forward default exports
- `local_namespace_barrels/` — local namespace imports routed through barrel files
- `deeper_wrapper_indirection/` — one more helper layer that should still preserve the same outputs
