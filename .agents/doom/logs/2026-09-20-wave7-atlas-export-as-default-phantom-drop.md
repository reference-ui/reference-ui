---
date: 2026-09-20
cycle: wave7
module: atlas/discovery+resolve
theories_spent: 1
verdict: break-found
---

# Atlas drops local `export { Card as default }` and mints phantom `default`

## Hypothesis

Gap: `collect_export_named_declaration`
(`packages/reference-rs/modules/atlas/src/parser/mod.rs:303-332`) treats a
local `export { Card as default }` specifier as an ordinary rename: it clones
the local component under the exported name `"default"` into
`exported_components` but never sets `default_component`. Every default-import
resolution path (`resolve_default_component_export_target`,
`resolve_named_component_export_target_inner`'s `"default"` arm in
`resolver.rs:389-391,439-465`) consults only `default_component` plus the
`named_component_reexports["default"]` with-source chain — never the
`exported_components["default"]` entry. Net effect is double: the real
component is untracked under its name with its call sites unattributed, AND a
phantom component literally named `"default"` is tracked (count 0), with zero
diagnostics.

Red test: `/tmp/doom-wave7-atlas-export-as-default.cjs` (blind-runnable,
plain node against the fresh `dist/native` binding; `pnpm agentrs b`
verified current; fixture realpathed per the wave5 `/tmp`-symlink note).
Probe: `function Card` + `export { Card as default }`, default-imported and
rendered once. Control (pinned EXPT-01 shape): `export default function
Control`, default-imported and rendered once.

## Verdict

`break-found`. Repro exit 1: all three control checks green
(`Control count=1`, interface mapped); all four probe checks red — `Card`
absent, a phantom `{name: "default", count: 0, iface: "CardProps"}` tracked,
`diagnostics: []`. Severity: user-facing — silent discovery loss plus
hallucinated inventory entry on a mainstream ESM default-export shape.

Violated contracts:
1. `tests/cases/ATL-EXPT-01-default-exports/README.md`: "default-exported
   components are accurately tracked through default imports" — `Card` is
   default-exported and default-imported, yet vanishes.
2. `tests/cases/ATL-REXP-02-default-aliases/README.md`: atlas claims
   default-alias-chain competence (`export { default as X } from`); the
   local mirror shape (`export { X as default }`) is not just unresolved
   but corrupted into a phantom.
3. Module invariant (`modules/atlas/README.md`): "Diagnostics Over Guesses
   — Unsupported or unresolved inputs surface explicitly through
   diagnostics ... rather than hallucinated or guessed data" — here a
   hallucinated `default` component ships with neither data nor diagnostic.

In-bounds: fully static TSX, one default import per component, no
will-never-work shape. Doom-log consult: `search "atlas"` returns only the
wave5 direct-default-call report (since fortified — the CallExpression arm
now exists at `parser/mod.rs:418-440`); no committed fixture covers local
`export { X as default }` (grep over all case inputs confirms the gap is
unexplored). Atlas log remains thin (2 reports) — still scheduling signal.

Unspent research (fodder, no red test written, no theory spent):
(a) star-export ambiguity resolves first-wins in
`resolve_named_component_export_target_inner` (`resolver.rs:416-427`) and
last-wins in `collect_star_reexport_components` (`resolver.rs:341-348`) —
atlas analog of the wave6 tasty star finding, explicitly in-brief;
(b) single-pass order dependence: `export default Foo` /
`export { Foo }` placed before Foo's declaration miss `local_components`
(parser iterates statements in order, ESM hoisting ignored);
(c) `export * as ns from` is dropped (`mod.rs:176-181` requires
`exported.is_none()`), so namespace-member usage through such barrels can
never resolve via `namespace_map`.
