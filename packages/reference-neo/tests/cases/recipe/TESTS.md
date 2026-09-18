# RECIPE ledger

`id | claim | status | engine | host | proof | evidence`

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NEO-RECIPE-01 | Recipe variants resolve to closed classes (base, two axes, compound) | done | ATM-RECIPE-01, ATM-RECIPE-02, ATM-RECIPE-05 | `recipe.ts` | each selection paints its computed styles; compound fires only when both predicates hold | `[atm]` |
| NEO-RECIPE-02 | `defaultVariants` apply when a variant is omitted | done | ATM-RECIPE-04 | `recipe.ts` | computed height from default size | `[panda-v1]` `core/__tests__/recipe.test.ts:104` defaults; `[atm]` P2 #17 |
| NEO-RECIPE-03 | Boolean variants `true`/`false` select distinct classes | done | ATM-RECIPE-04 | `recipe.ts` | computed display for each | `[panda-v1]` `core/__tests__/rule-processor.test.ts:1162` "cva - boolean variant" |
| NEO-RECIPE-04 | Compound variants emit after simple variants and require every predicate | done | ATM-RECIPE-05 | — | on/off combinations incl. hover+dark compound (deepens RECIPE-01) | `[panda-v1]` `core/__tests__/static-css.test.ts:2102`; `[atm]` RECIPE-05 |
| NEO-RECIPE-05 | `recipe(...).raw(props)` returns a style object that `css()` paints identically | done | ATM-RECIPE-02 | `recipe.ts` | computed equality of raw-fed vs class-fed nodes | `[decision D16]`; `[panda-v1]` `generator/src/artifacts/js/cva.ts:63` `raw: resolve` |
| NEO-RECIPE-06 | Class identity is `${system}__${className}`; duplicate `className` in one system fails sync | done | ATM-RECIPE-06 | `sync` | class prefix in DOM; `sync()` rejects on duplicate | `[atm]` P2 #18 |
| NEO-RECIPE-07 | A recipe defined as a non-object-literal fails sync with a located diagnostic | done | ATM-RECIPE-06 + RS-18 located diagnostics (landed, no station by design) | — (no change: `sync` surfaces `file:line:column` via `diagnosticLocation`) | `sync()` rejects with the inline-literal refusal at `app.ts:8:col`; no half-written folder; RECIPE-06 extended with the dup file:line:column | `[atm]` RECIPE-06 |
| NEO-RECIPE-08 | Responsive variant value `{ base: 'solid', md: 'outline' }` switches at the container width | done | ATM-RECIPE-07 | `recipe.ts` | resize across `md` flips computed variant styles | `[panda-v1]` `core/__tests__/recipe.test.ts:226` responsive variant |
| NEO-RECIPE-09 | `_hover` inside a variant paints on the variant class, not a separate atom | done | ATM-RECIPE-02 | — | hover computed; utility count unchanged | `[panda-v1]` `core/__tests__/recipe.test.ts:220` solid hover |
| NEO-RECIPE-10 | Variant + `css()` utilities on the same node: utilities win via layer order | done | ATM-RECIPE-03, ATM-LAYER-04 | — | computed override | `[atm]` ATM-RECIPE-03, ATM-LAYER-04 (P2 #19) |

## RS lane (added by this cartography)

**RS-8 — landed** as station ATM-RECIPE-07 (unblocked NEO-RECIPE-08).
No ATM-RECIPE station covered responsive variant values: `grep -ri
"responsive|ConditionalValue|breakpoint"` over all six station
specs/READMEs, `atomic/src/recipes/`, and the SPEC RECIPE rows returns
nothing, and `ConditionalValue` exists nowhere under
`packages/reference-rs/modules/typegen/` or `packages/reference-neo/src/`.

- Input: `recipe({ className: 'buttonStyle', variants: { variant: { solid:
  {...}, outline: {...} } } })` selected with `{ variant: { base: 'solid',
  md: 'outline' } }`.
- Expected CSS (Reference spelling per D8, cf. Panda shape at
  `core/__tests__/recipe.test.ts:226`): `.buttonStyle--variant_solid {...}`
  plus `@container (min-width: <md>) { .md\:buttonStyle--variant_outline
  {...} }` including the variant's condition descendants
  (`:is(:hover, [data-hover])`, `[data-disabled]`); runtime table carries
  the per-breakpoint selection so the host helper emits both classes.
- Waiting Neo case: NEO-RECIPE-08 (done).

**RS-18** (filed by the T8 mop cook; blocks NEO-RECIPE-07). Recipe
error diagnostics carry no source location, so a failing `recipe()`
call cannot be "located" the way the row claims (cf. NEO-SITE-06, whose
located warning the spec pins to the world's `app.ts`, and the RS-3 /
ATM-TOKEN-12 file+line+column precedent). R1 2026-09-17 via
`compileSync`: both the non-object-literal refusal and the duplicate
refusal serialize as bare `{severity: 'error', message}` with no
`file`/`line`/`column` — `Diagnostic::error` pushed bare in
`extract/recipes/mod.rs` and `lib.rs compile_recipes`, and the
ATM-RECIPE-06 `diagnostics.json` golden pins the same bare shape. The
fail-closed half works (`sync()` rejects); only the location half gaps.

- Input: `const dyn = { className: 'dyn' }; recipe(dyn)` (or two
  `recipe({ className: 'dupBadge', ... })` calls in one system).
- Expected: the error diagnostic carries `file`/`line`/`column`
  pointing at the offending call (wants already carry all three from
  the same extraction pass), so `sync()` rejects with an `app.ts:2`
  style location via `diagnosticLocation`.
- Should become: location fields on the three ATM-RECIPE-06 refusal
  diagnostics (missing/dynamic className, non-object arg, duplicate),
  golden update included, at the liaison's call.
- Waiting Neo case: NEO-RECIPE-07 (no case folder until the location
  half lands; the rejection-message half is already proven by
  NEO-RECIPE-06's duplicate-world probe).

N2 update 2026-09-17 (cook): RS-18 landed (located diagnostics, no
station by design) — both refusals carry `file`/`line`/`column`
(R1 `/tmp/n2cook-r1.mjs` green). NEO-RECIPE-07 done (located
inline-literal refusal); NEO-RECIPE-06's spec extended with the dup
`file:line:column` assertion, still green.
