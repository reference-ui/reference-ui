---
date: 2026-09-20
cycle: wave4
module: tasty/resolve+emit/identity
theories_spent: 1
verdict: break-found
---

# Same-file merged interfaces lose one declaration silently

## Hypothesis

Gap pursued: tasty mints symbol ids as `sym:{file_id}#{name}` with no
span (`scanner/paths/mod.rs:16-18`), so two same-name declarations in
one file share one id. `resolve_ast` then folds them through
`symbols.extend(id -> symbol)` (`ast/resolve/index.rs:36-40`) —
last-wins, no diagnostic. Declaration merging (`interface Widget`
twice, unioned members) is legal, idiomatic TS, and nothing in the
tasty docs carves it out (grep for "merg" finds no statement; doom log
has no merging entry). Red test: emit a user file with two `export
interface Widget` blocks (`alpha`, `beta`) and assert the Widget
chunk carries both members, or that the author is warned.

Result: RED. Manifest holds one `Widget` entry whose chunk members are
`["beta"]` only; `alpha` is gone. `manifest.warnings` is `[]` and
bundle `diagnostics` is `[]` — total silence at every layer.

## Verdict

`break-found`. Repro: `/tmp/doom-tasty-merge-repro.mjs` (blind-runnable,
`node /tmp/doom-tasty-merge-repro.mjs [repo-root]`; exit 1 = break;
prefers fresh `dist/native` binding). Violated contract: emitted
artifacts must faithfully represent authored declarations — the
manifest/chunk serve a half-interface as the whole, with no warning
or diagnostic anywhere (contrast the cross-file same-name path, which
at least warns duplicate + throws ambiguous at lookup). In-bounds:
complete static TS input, no will-never-work shape (no interpolation,
no runtime-only values, no external config, no spread); pure
silence-where-signal-is-owed, the skill's misdiagnosis clause.
Severity: user-facing — reference docs and every member consumer
(display, flatten, projection) inherit the loss. Fix shape (merge vs
refuse-with-diagnostic) left to architect consult.
