---
date: 2026-09-20
cycle: wave6
module: tasty/resolve/exports
theories_spent: 1
verdict: break-found
---

# Star-ambiguous barrel name binds to first source instead of staying unresolved

## Hypothesis

Gap pursued: `collect_file_exports`
(`packages/reference-rs/modules/tasty/src/ast/resolve/index.rs:196-206`)
folds `export *` targets with `exports.entry(name).or_insert(symbol_id)`
— first star source wins. ESM semantics say otherwise: a name provided
by two or more star targets is ambiguous and the barrel does NOT export
it at all (tsc reports TS2308 on the barrel; the import binds nothing).
Tasty's export index feeds `resolve_import_target_id`
(`ast/resolve/resolver/resolve.rs:36-48`), so a consumer's
`import { Widget } from './barrel'` gets a `target_id` pointing at one
arbitrary source, which the emitter then hardens into a local reference
descriptor (`generator/symbols.rs:247-261`, id `_<16hex>`).

Fresh ground: prior tasty hunts covered the scanner boundary (wave1)
and same-file interface merging (wave4, since fortified as M1–M3 in
`ast/resolve/merge.rs`); the doom log has no tasty export-map entry,
and the wave2 star finding is the module-graph crate (a different gap
in different code). TST-RXP-02 pins single-hop chains and star-as but
never asserts star-conflict or export-map attribution.

Red test: `a.ts` and `b.ts` each `export interface Widget` (members `a`
/ `b`); `barrel.ts` star-re-exports both; `consumer.ts` imports
`Widget` from the barrel. Assert the emitted `Use.w` reference stays
unresolved (external descriptor, `id == "Widget"`).

Result: RED. `Use.w` emits
`{"id":"_ef8d2136fd30c930","name":"Widget","library":"user"}` — a hard
local binding to one source. Flipping the star order in the barrel flips
the bound id (`_abb29de16163f27f`), proving first-wins order dependence.
`bundle diagnostics` is `[]`; the only signal anywhere is the manifest's
generic duplicate-name warning (about global name lookup, not about the
barrel's export map or this reference). Cross-check: `tsc --noEmit`
on the same fixture fails with `error TS2308: Module './a' has already
exported a member named 'Widget'`.

## Verdict

`break-found`. Repro: `/tmp/doom-wave6-tasty-star-ambiguity.mjs`
(blind-runnable, `node /tmp/doom-wave6-tasty-star-ambiguity.mjs
[repo-root]`; exit 1 = break; prefers fresh `dist/native` binding;
includes the order-flip control). Violated contract: tasty's
export-map/reference resolution must model ESM export semantics — an
ambiguously star-exported name is absent from the barrel, so an import
of it must stay unresolved, never bind to an arbitrary source. The
emitted artifacts instead serve a fabricated binding (wrong symbol
identity, contradicting the "First-Class Symbols" invariant that
references maintain identity), silently and order-dependently.
In-bounds: complete static TS input, no will-never-work shape;
silence-plus-wrong-answer where ESM says unresolvable. Severity:
user-facing — doc links, display members, and every reference consumer
follow the fabricated binding; index-barrel `export *` collisions are
an idiomatic author shape. Fix shape (exclude ambiguous star names vs
refuse-with-diagnostic) left to architect consult.

Untried gaps banked (no theories spent): multi-hop named-reexport
chains (`resolve_symbol_id` in `index.rs:213-226` follows only one
`reexport_target` hop into locally-declared shells, so 2-hop chains
likely drop silently); `export *` re-exporting `default` (the star fold
copies every binding including `"default"`, which ESM star never
re-exports); cross-file `typeof` queries (`resolve_type_query_expression`
in `resolver/resolve.rs:63-73` reads only the local file's
`value_bindings`); silent `export enum` / namespace drops (statement
dispatch in `ast/extract/statements/exports.rs` handles only
interface/type-alias, with no diagnostic — weaker, scope-adjacent).
