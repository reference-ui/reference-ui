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
- `unresolved_props_type/` — unresolved props types preserve partial results and emit diagnostics
- `unsupported_inline_types/` — unsupported inline props annotations emit diagnostics instead of vanishing silently

Atlas global setup now writes known outputs per case under `output/`:

- `analysis.json` — structured Atlas analysis for the case app root
- `diagnostics.json` — current Atlas diagnostics payload for the case

As Atlas grows, the same folders should keep driving real end-to-end analysis
and golden outputs.

Recommended next hardening cases:

- `dynamic_values/` — dynamic JSX expressions that should count prop usage without claiming a literal value
- `same_name_collisions/` — multiple components with the same name from different local sources
- `package_barrels/` — included package entrypoints that re-export components or prop types
- `default_reexport_aliases/` — `export { default as Button } from './Button'` style chains
