---
date: 2026-09-20
cycle: wave5
module: atlas/discovery
theories_spent: 1
verdict: break-found
---

# Atlas drops direct `export default <wrapper-call>` components

## Hypothesis

Gap: `collect_default_export`
(`packages/reference-rs/modules/atlas/src/parser/mod.rs:335-420`)
matches FunctionDeclaration / Identifier / ArrowFunctionExpression /
FunctionExpression but has no CallExpression arm, so a component
default-exported through a wrapper call in one statement —
`export default memo(function Card(...) {...})` — falls into
`_ => {}`. The variable-declarator path (`component_from_expression`)
already unwraps arbitrary call wrappers, but the default-export path
never reaches it: no `local_components` entry, no
`exported_components` entry, no `default_component`, hence no alias
key — the component is untracked, its call sites unattributed, with
zero diagnostics.

Red test: `/tmp/doom-wave5-atlas-direct-default-call.mjs` (blind-
runnable; loads the fresh `dist/native` binding `analyzeAtlas`,
builds a 4-component fixture app in a realpathed tmp dir). Probes:
`export default React.memo(function DirectDefault ...)` and
`export default React.forwardRef<...>(function DirectRefDefault ...)`.
Controls (both pinned shapes): `export const NamedTwin =
React.memo(...)` (WRAP-01 FancyButton shape) and
`const IdentDefault = React.memo(...); export default IdentDefault`
(WRAP-01 SearchInput shape), each consumed once from a page.

## Verdict

`break-found`. Repro exit 1 on a fresh binding (`pnpm agentrs b`
verified current): both probes `not tracked at all`,
`diagnostics: []`; both controls green
(`count=1`, interface mapped). Severity: user-facing — silent
discovery loss on a mainstream wrapped-default-export shape, plus
silently unattributed call sites.

Violated contracts:
1. `tests/cases/ATL-WRAP-01-memo-forwardref/README.md`: "Asserts
   tracking for both named and default-exported wrapped component
   forms" — the direct default-exported wrapped form vanishes.
2. Module invariant (`modules/atlas/README.md`): "Diagnostics Over
   Guesses — Unsupported or unresolved inputs surface explicitly
   through diagnostics" — here neither data nor diagnostic.
3. JS scope (`modules/atlas/js/README.md`): "default-exported
   function components consumed through default imports" are in
   scope and Atlas "should already be trustworthy about component
   identity" — the inner function is exactly that, consumed
   through a default import.

In-bounds: fully static TSX, named imports, `import * as React`
mirrors the committed WRAP-01 fixture (namespace imports are
explicitly in atlas scope: "alias tracking for ... namespace
package imports"). No will-never-work shape. Doom-log consult:
`search "atlas"` returned zero matches — first atlas hunt; thin
log is signal for scheduling.

Unspent research (fodder, no red test written, no theory spent):
(a) `parse_wrapper_type_arguments` takes `nth(1)` (forwardRef's
slot) for all wrappers, so `memo<Props>` type args can never
resolve an interface; (b) declarator annotations
(`const Card: React.FC<Props> = ...`) are never read;
(c) `| undefined`/`| null` union members nuke `allowed_values`;
(d) `/tmp`-symlink roots + `..` imports miss via the
canonicalize fallback (repro realpaths the fixture to isolate).
