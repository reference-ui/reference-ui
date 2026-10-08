# §1 nested-import spread drop reproduces: `color` vanishes with zero diagnostics, at `record_spread`'s identifier arm

## Station input (`/tmp/forge-s1/src`, mission §1 verbatim shape)

| File | Content |
|---|---|
| `base.ts` | `export const base = { color: 'red' }` |
| `tokens.ts` | `import { base } from './base'` + `export const button = { ...base, padding: '4px' }` |
| `app.ts` | `import { button } from './tokens'` + `export const a = css(button)` |

Compiled via the atomic extractor (`packages/reference-rs/dist` `compile()`, lib-system-spec fixture, probe `/tmp/forge-s1/probe.mjs`).

## Result: color gone, zero diagnostics

| Check | Observed |
|---|---|
| `wants` | `[{padding, 4px}]` only — no `color` want |
| `css.classes` | `{"padding:4px": ...}` only |
| `diagnostics` | `[]` |
| Sheet | has `padding: 4px`, no `color: red` |
| Control (`/tmp/forge-s1c`, same-file `...spreadBase`) | `color:plum` + `padding:9px` both fold, `[]` diagnostics |

The drop is specific to the import hop: same-file spread folds, nested-import spread drops silently.

## The drop point (line-cited)

| Claim | Evidence |
|---|---|
| Identifier spread copies keys only on `BindingInit::Object` | `packages/reference-rs/modules/atomic/src/extract/scope/value.rs:206-214` — `if let Some(...) = object_binding(...)` then bare `return;`, no else, no residue marker |
| The gate requires an `Object` init | `packages/reference-rs/modules/atomic/src/extract/scope/value.rs:184-195` (`object_binding`, check at :190) |
| Import bindings always carry `init: None` | `packages/reference-rs/modules/atomic/src/extract/scope/collect.rs:717-727` (`import_binding`, `init: None` at :724) |
| Overlay collects each file against the merged literal bag, never the graph | `packages/reference-rs/modules/atomic/src/extract/resolver/overlay.rs:38-59` (`scope::collect` at :52; `merged_bags` at :28-34) |
| The merged bag is poison-only, never a value source for spreads | `packages/reference-rs/modules/atomic/src/extract/scope/collect.rs:33-36` + `:55-56` (`strip_stale`, `attach_pure_fns` only) |
| Literal lowering also skips identifier spreads (inline only) | `packages/reference-rs/modules/atomic/src/extract/constants/entries.rs:85-98` (`None` for names; "the scope layer owns identifiers" :84) |
| So `tokens.ts::button` bakes `{padding}` permanently | `packages/reference-rs/modules/atomic/src/extract/resolver/overlay.rs:63-79` (`set_object` overwrites the slot; the "color rides along" comment at `packages/reference-rs/modules/atomic/src/extract/constants/index.rs:201-204` never fires for imports) |
| Extract-time import lookup only reads already-baked bags | `packages/reference-rs/modules/atomic/src/extract/resolver/mod.rs:229-245` + `:268-287` (`resolve_file_imports`/`export_value`) |

Chain: `tokens.ts` overlay declares `base` as `Import` (`init: None`) → `record_spread` identifier arm misses → `button` bakes without `color` and without a marker → `app.ts` imports the already-colorless object through `export_value` → `css(button)` mints padding only, with nothing left to diagnose.

## Why the fix must be demand-driven, not a reordered pass

1. **No bag ever holds the missing datum.** Literal lowering drops identifier spreads (`entries.rs:85-98`) and the scope overlay resolves table-local inits only (`value.rs:206-214`, `collect.rs:724`). Re-running the overlay over any merge of these bags is a fixpoint — same input, same colorless output. Pass order cannot create information no pass produces.
2. **The datum lives across an edge, not in a phase.** `base.ts::base` exists only as another file's scope-resolved value, reachable via the `ImportRef` edge (`packages/reference-rs/modules/atomic/src/extract/scope/binding.rs:36-45`) through the graph. Reading it means resolving the binding's value in its origin file when the spread demands it — memoized, origin-first — which is demand-driven by definition.
3. **Cycles defeat ordering.** A `base.ts ↔ tokens.ts` cycle has no phase order that puts both origins first; only an in-progress set that refuses (with the `ATM-W-UNFOLDABLE-SPREAD` residue the mission prescribes) terminates. Ordering assumes a DAG the input need not be.

Slice note: Slice 3 owns both the demand-driven `value_of(Origin)` fold and the residue-marker diagnose floor, pre-stationed as `ATM-SITE-78` / `NEO-SITE-29`.
