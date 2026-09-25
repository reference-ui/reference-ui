---
date: 2026-09-24
cycle: night-r2
module: tasty/resolve/typeof
theories_spent: 1
verdict: break-found
---

# Cross-file typeof query silently unresolved while local twin resolves

## Hypothesis

Gap pursued (brief item a): cross-file `typeof` queries —
`resolve_type_query_expression`
(`packages/reference-rs/modules/tasty/src/ast/resolve/resolver/resolve.rs:63-73`)
reads only the local file's `value_bindings`, never following
`import_bindings`, so `typeof` over an imported value may misresolve
or drop.

Fresh ground: the R1 report banked this gap untried. The repo's own
stations cover `typeof` only single-file: `TST-QRY-01` asserts
expression/kind for local `typeof themeConfig` /
`typeof tokens.spacing`, and `TST-VAL-01` asserts additive
`resolved` payloads for local value-derived types — no case imports
a value across files. The resolver already follows imports for
`Reference` edges (`resolve_import_target_id`), but the type-query
path has no import arm at all.

Red test (transient `cargo test -p tasty` plant, since removed):
`src/values.ts` exports `const tokens = { spacing: {...} } as const`;
`src/consumer.ts` does `import { tokens } from './values'` (named
import — the dialect; default/namespace value imports deliberately
avoided as triage floor) and declares
`export type SpacingScale = typeof tokens.spacing`;
`src/local.ts` holds the identical shape locally as control. Assert
both queries resolve to the `sm`/`lg` object.

Result: RED. The local control resolves (assertion passes); the
cross-file query carries `expression: "tokens.spacing"` with
`resolved: None` — a drop, not a misresolve — and `diagnostics` is
empty. Cross-check: `tsc --noEmit --strict` accepts the same
three-file fixture, so the input is legal, statically-resolvable TS.
Brief item (b) (`export { default as X } from`) untouched: protocol
stops at the first candidate break.

## Verdict

`break-found`. Repro: `/tmp/doom-r2-tasty2-cross-file-typeof.sh`
(blind-runnable, `bash /tmp/doom-r2-tasty2-cross-file-typeof.sh
[repo-root]`; exit 1 = break; runs the tsc ground-truth check,
plants the transient red test via `pnpm agentrs`, captures the
failure, deletes the plant, and verifies byte-identical restore plus
clean `git status` on touched paths).

Violated contract: value-derived types owe additive `resolved`
payloads — the `TST-VAL-01` station contract ("Verifies additive
resolved payloads for value-derived and indexed access types") —
and Tasty's stated cross-module fidelity (Identity / Navigation,
`packages/reference-rs/modules/tasty/src/README.md:74-79`:
"canonical export bindings" plus "`Reference` edges connecting
symbols to their dependency targets across modules"). The emitted
graph instead serves a `resolved`-less `TypeQuery` for a shape one
import hop from a proven-resolving local twin, with zero signal —
no `TST-*` code exists for it (contrast `TST-W-STAR-AMBIGUITY` for
the fortified star case). The `resolved` field is `Option`, but
`None`-here is not the documented fail-closed fallback: the input
is completely static and locally provable, and the resolver
structurally cannot even attempt it (`Resolver` holds only the
local `ParsedFileAst`). In-bounds: complete static TS input, no
will-never-work shape; pure silence-where-signal-is-owed /
partial mint, the brief's misdiagnosis clause.

Severity: user-facing — `import { theme } from './theme';
export type Theme = typeof theme` is the idiomatic tokens/theme
pattern, and every `keyof` / indexed-access / template chain built
on an imported value (the VAL-01 shapes, one hop away) silently
degrades to opaque `typeof ...` with no members and no diagnostic.
Fix shape (import-following value lookup vs refuse-with-diagnostic)
left to architect consult.
