---
date: 2026-09-24
cycle: night-g1
module: typegen/emit/recipes
theories_spent: 1
verdict: break-found
---

# Colliding recipe stems emit duplicate aliases (tsc TS2300, zero diagnostics)

## Hypothesis

Gap pursued: `recipe_types`
(`packages/reference-rs/modules/typegen/src/emit/recipes.rs:15-30`)
pushes one `PascalCase(name)VariantProps` alias per recipe with no
stem-uniqueness guard, while recipe names are arbitrary distinct map
keys. Two recipes whose names PascalCase to one stem (`button` +
`Button`, or the kebab/camel twins `my-button` + `myButton`) emit the
same alias twice in one `.d.ts`.

Fresh ground: tonight's hunt covered atomic spans, the registry
orphan, Neo error codes, tasty export-map chains, atlas package
silence, and the (accepted) STT throw shape; `search "recipe stem
collision duplicate alias pascal"` returns no prior report, and no
log mentions PascalCase, stem collision, or TS2300. The repo's own
recipe stations cover only the per-name validity guard (`123`
skipped, sibling prints) — no station puts two recipes on one stem.

Red test (`/tmp/doom-g1-emit-repro.mjs`, blind-runnable via repo
tsx, exits 1): control single-`button` spec emits one
`ButtonVariantProps` and tsc accepts it (both green); the
`button`+`Button` spec emits the alias twice, tsc rejects with
`TS2300: Duplicate identifier 'ButtonVariantProps'` at both sites,
and `emitDtsDetailed` returns `diagnostics: []` — wrong output in
total silence. Cross-check: both names are legal inputs —
`BaseSystem::from_json` keeps both keys, classNames are
case-sensitive so the pair is a legitimate system, and atomic's
`ATM-E-DUPLICATE-RECIPE` gate compares exact classNames
(`assembly.rs`), so the pair flows through the real pipeline
unrefused to typegen.

Not pursued (protocol stops at the first candidate break):
styletrace surface misresolution / unresolved-surface
false-positive/negative twins remain untried.

## Verdict

`break-found`. Repro: `/tmp/doom-g1-emit-repro.mjs` (run:
`packages/reference-neo/node_modules/.bin/tsx
/tmp/doom-g1-emit-repro.mjs [repo-root]`; exits 1 with the duplicate
alias, the TS2300 lines, and the empty diagnostics shown; writes
nothing to the tree, scratch under `os.tmpdir()` only).

Violated contract:

- The recipe printer's validity guard (`emit/recipes.rs` doc: "Names
  that cannot PascalCase to a TypeScript identifier are skipped";
  SPEC lane "Recipe names that cannot PascalCase to a TypeScript
  identifier (`123`) are skipped"): each name is individually valid
  but the pair is jointly invalid, and the guard checks names one at
  a time, so invalid TypeScript ships.
- The tsc-acceptance bar the module holds itself to (`SPEC.md`:
  STYLE/STRICT lanes "proven by `tsc --noEmit`"; `tests/tsc.ts`
  harness with `skipLibCheck: false`): the colliding emit fails
  `tsc --noEmit` with TS2300, breaking every consumer's typecheck.
- The "typed facts, not silent skips" diagnostics contract
  (`diagnostics/README.md`; "report it and keep siblings" Must-not):
  the emit degrades (one recipe's type unusable — the whole file
  errors) with no `TGN-*` row; no code exists for the collision.
- Same-shape precedent inside the module: unknown/duplicate strict
  names are skipped-with-or-without-rows by an explicit `seen` set
  (`emit/strict.rs:normalize`); the recipe loop has no `seen` set at
  all.

Severity: user-facing. Kebab/camel or case-variant recipe pairs are
an ordinary large-system shape; one such pair poisons the entire
shared `.d.ts` (SPEC: "Multiple recipes share one emit string") so
no consumer typechecks, and the empty diagnostics give the author
nothing pointing at the cause. Fix shape (first-stem-wins plus a
`TGN-W-*` row vs coded refusal) left to architect consult.
