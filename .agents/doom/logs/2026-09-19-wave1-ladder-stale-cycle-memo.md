---
date: 2026-09-19
cycle: wave1
module: module-graph/walk/memo
theories_spent: 1
verdict: break-found
---

# Stale Cycle from the walk memo on reuse

## Hypothesis

Gap: `BindingWalk::resolve_export` memoizes every outcome under
`(file, export)` (`src/walk/mod.rs`), but `Cycle` refusals are
path-dependent — a pair cycles only because an ancestor of *this*
lookup sits on the visited stack. A later lookup on the same walk
replays the cached `Cycle` instead of resolving. Red test
(`reused_walk_does_not_return_a_stale_cycle`): world `a = *b,*c`,
`b = *a`, `c declares v`; one walk resolves `(app→a, v)` then
`(app2→b, v)`. First is `Ok(c, v)`; second returns
`Err(Cycle{trail:[a:v, b:v, a:v]})` — a trail through a file the
second query never visited. Controls: a fresh walk answers
`(app2→b, v)` with `Ok(c, v)`, and reversed order resolves both —
identical queries, history-dependent answers. Doom log was empty at
consult (thin-log signal for module-graph). Unspent, seen in research:
tsconfig `paths` precedence flips with cargo feature unification
(`serde_json` without `preserve_order` iterates `Map` alphabetically
in isolated builds, authored order in workspace builds); `exports`
targets and subpaths with `..` escape the package dir unconfined.

## Verdict

`break-found`. Repro: `/tmp/doom-wave1-ladder-t1` — run
`cargo test --offline --test memo_poison` there (1 red, 2 green
controls; no tree changes needed). Violated contract: the walk's own
reuse promise — "Records never change mid-compile, so one walk can
serve every lookup" and "a memo cache replays repeated lookups"
(`src/walk/mod.rs`), plus "never a panic, `None`, or stale answer"
(`tests/walk_refused.rs` header). Severity: curiosity, latent —
`modules/atomic/src/extract/resolver/mod.rs:164` (the only in-tree
`BindingWalk::new` outside tests) builds one walk per binding, so no
current consumer reuses walks; any future consumer that does gets
bogus cycle diagnostics on star/cycle worlds.
