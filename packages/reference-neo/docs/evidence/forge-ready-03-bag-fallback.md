# Disabling the import bag fallback changes exactly one station (ATM-SITE-31): the `xwidth` cross-file capture refuses — a ladder gap, not a coincidence-fold

Scratch (fully reverted, sha256-identical): `import_*` return empty on missing `ResolvedExport`, `mutation()`/`mutated()` skip imports. Baseline 209/209 cases green; scratch breaks only SITE-31 (`wants` 51→50, diags 14→15; sheet and map byte-identical).

## Scratch edit (reverted and verified)

| # | Mechanism | File:line (original) | Scratch |
|---|---|---|---|
| 1 | `Binding` fallback field | `packages/reference-rs/modules/atomic/src/extract/scope/lookup.rs:43-48` | kept field; cut the four reads below |
| 2 | scalar fallback | `packages/reference-rs/modules/atomic/src/extract/scope/lookup.rs:186-191` (`scalar_leaves(local)` at :190) | return `&[]` |
| 3 | member fallback | `packages/reference-rs/modules/atomic/src/extract/scope/lookup.rs:271-276` (`object_prop` at :274) | return `None` |
| 4 | object fallback | `packages/reference-rs/modules/atomic/src/extract/scope/lookup.rs:292-297` (`object` at :295) | return `None` |
| 5 | array fallback | `packages/reference-rs/modules/atomic/src/extract/scope/lookup.rs:313-318` (`array` at :316) | return `None` |
| 6 | name-wide poison | `packages/reference-rs/modules/atomic/src/extract/scope/lookup.rs:329-336` (`mutation` at :329, `mutated` at :334; call sites :175,:206,:260,:281,:302) | `mutation()`→`None`, `mutated()`→`false` when `resolve()` is `Lookup::Import` |

Revert: six reverse edits, `diff` identical to `/tmp` backup, sha256 `9791a159…b306f926` both sides, `git status` clean except pre-existing, native rebuilt pristine.

## Method

| Step | Command | Result |
|---|---|---|
| Baseline | `pnpm agentrs v atomic` | 209/209 cases pass; 1 pre-existing `token10.test.ts` failure (6× duplicate `spacing`/`opacity` message, unrelated) |
| Scratch build | `pnpm agentrs b` + `pnpm agentrs v atomic` (read-only goldens, no update flag) | 208/209 pass; only `ATM-SITE-31` fails |
| Diff probe | `/tmp/forge-ready03-site31.mjs`, `/tmp/forge-ready03-diff.mjs` via `dist/atomic.mjs` `compile()` | sheet identical, map identical, +1 diagnostic (below) |
| Revert | reverse edits + `pnpm agentrs b` | source sha256-identical; tree pristine |

## Golden changes (one station)

| Station | Golden | Change | Class |
|---|---|---|---|
| ATM-SITE-31 | `diagnostics.json` | +1 `ATM-W-DYNAMIC-EXPRESSION` for `width` at `input/src/xfile.ts:6:50` (`xwidth(4)` refuses; golden has only `:8` `xroll`) | **ladder gap** — fix in crate |
| ATM-SITE-31 | `styles.css` | byte-identical (31112 chars) | — |
| ATM-SITE-31 | `css.json` | identical (37 keys, no missing/added) | — |
| (spec, not golden) | `wants` 51→50, `stylePlans` 37→37 | lost want is a duplicate `width:4px` (plan already exists); `spec.ts:53-54` fails | — |

No other station changes. `ATM-SITE-39/55/77/28` stay green as the mission requires.

## Why this one break, and why it is a ladder gap

| Claim | Evidence |
|---|---|
| The refusing call is `xwidth(4)` (`xfile.ts:6`), whose helper captures `xunit` from another file | `packages/reference-rs/modules/atomic/tests/cases/ATM-SITE-31/input/src/xfile.ts:2-6` imports `xwidth`; `packages/reference-rs/modules/atomic/tests/cases/ATM-SITE-31/input/src/helpers.ts:1` imports `xunit`, `:19` defines `xwidth = (n) => \`${n}${xunit}\``; `packages/reference-rs/modules/atomic/tests/cases/ATM-SITE-31/input/src/unit.ts:1` exports `xunit = 'px'` |
| Helper descriptors bake at overlay time against the merged bag via `ProjectBag` | `packages/reference-rs/modules/atomic/src/extract/fold/fence_attach.rs:48-53` (`ProjectBag(project)`); `packages/reference-rs/modules/atomic/src/extract/resolver/overlay.rs:20-24` (merged bags) + `:52` (`scope::collect`); `packages/reference-rs/modules/atomic/src/extract/scope/collect.rs:56` calls `attach_pure_fns` |
| `ProjectBag` imports always take the bag arm (`import_value` is `None` at `lookup.rs:79-83`), so the scratch starves the `xunit` capture → no descriptor → `import_pure_fn` (`lookup.rs:217-219`, already fallback-free) returns `None` → call refuses | `packages/reference-rs/modules/atomic/src/extract/scope/lookup.rs:79-83`, `:186-191`, `:217-219` |
| The fold is correct and must be preserved: single exporter, unambiguous (`xunit` only in `unit.ts`) | input files above; no other `xunit` declarator in the station |
| Direct helper imports are unaffected (already binding-precise, no fallback) | `packages/reference-rs/modules/atomic/src/extract/scope/lookup.rs:217-219`; clash/hop/alias/re-export arms in `xclash-a.ts`, `xclash-b.ts`, `xhop.ts`, `xalias.ts`, `xreexport.ts` stay green |
| `SITE-28` poison arms unaffected (cross-file `glow`/`shifted` uses are `Unbound`, not `Import`) | `packages/reference-rs/modules/atomic/tests/cases/ATM-SITE-28/input/src/app.ts:4-5` uses bare names with only `spreadButton` imported; `Unbound` arms at `lookup.rs:181,266,287,308` untouched |

Ladder gap: Slice 3's `ValueGraph` must resolve helper captures through the graph (`helpers.ts::xwidth` ← `unit.ts::xunit`) at descriptor-bake time; otherwise the correct `xwidth(4)→4px` fold regresses to a diagnostic. Not a coincidence-fold to accept.

Slice note: Slice 3 owns graph-backed helper captures (`value_of(Origin)` chasing import bindings inside the origin file) plus the residue-marker diagnose floor.
