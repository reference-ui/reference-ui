# `RecipeConfig.className` required — should it be?

**Severity:** Low (works as designed; design question, not breakage)
**Area:** Neo recipe runtime + RS extractor (`recipe()`)
**Status:** Open investigation — no crew dispatched, no decision taken.
**Not panda CSS** (shape mirrors Panda's; enforcement is ours).

## Observed

`SummaryChip.tsx` (lib Reference) called `recipe()` without `className`
and typechecked until the Neo recipe runtime landed 09-17 with
`className: string` **required** (`runtime/recipe/recipe.ts:36-37`,
mirrored in the decl template `sync/publish/types-bundle.ts:109-110`).
The component was masked 09-18, so it never migrated; REF-10's
unmasking surfaced `TS2741`, fixed with `className: 'summaryChip'`
(one line, value forced by the already-emitted table — LOG-1.md L1).

Panda, by contrast, made recipe `className` **optional**, falling back
to the recipe name
([changelog](https://github.com/chakra-ui/panda/blob/HEAD/packages/core/CHANGELOG.md):
"Change recipes `className` to be optional … with a fallback to its
name"). So the question stands: why is ours mandatory?

## Mechanism (verified firsthand)

Three layers, three postures:

1. **Type (Neo): required.** `RecipeConfig.className: string`, no
   fallback.
2. **Extractor (RS `extract/recipes/mod.rs:142-156`): literal >
   inference > diagnostic.** An explicit string literal wins; else the
   `<stem>Recipe` binding is inferred (`summaryChipRecipe` →
   `summaryChip`); else a sync-failing `RecipeClassName` diagnostic.
   This middle path is Panda's fallback, roughly.
3. **Runtime (`recipe.ts:329-338`): key must travel in the config.**
   `key = qualifiedName(system, config.className)` →
   `tables[key]`, miss returns `''`. A generic table-driven function
   cannot see its own binding name — there is no per-recipe codegen
   to bake the inferred stem into (which is how Panda's optional
   works: the name is resolved at codegen time into each generated
   function).

Pre-fix SummaryChip is the exhibit for the split: the extractor
inferred `summaryChip` and emitted the table + CSS, while the runtime
looked up `reference-ui__undefined` and missed — chip rendered with
`class=""`. Inference without the literal = emitted table nobody can
reach. The requirement makes that state unrepresentable in typed code.

## Why required today (steelman)

- The runtime lookup key has no other source. Optional-in-type would
  need a runtime fallback that cannot exist (no binding name at
  runtime) or per-recipe codegen that doesn't exist.
- Explicitness: renaming `summaryChipRecipe` can never silently
  re-key the table while the literal stays.
- The diagnostic already pushes this way: when inference also fails,
  it demands "an explicit string-literal 'className' property".

## Options (not decided)

1. **Keep required.** Cheapest; the SummaryChip episode reads as
   migration rot, not design flaw. Cost: every recipe author writes
   a stem the compiler could infer; diverges from Panda's optional.
2. **Optional + extractor backfill.** Type loosens to `className?`;
   the extractor (which CAN see the binding) rewrites or records the
   inferred stem so the runtime still gets its key. Needs a channel
   that doesn't exist today (config rewrite at sync? emitted
   per-recipe binding?). Heaviest; risks reintroducing silent
   rename hazards.
3. **Optional + runtime default via registration.** `registerRecipeData`
   could map tables by stem alone, with the runtime deriving the key
   another way — but there is no other way without the binding name.
   Likely dead; recorded so nobody re-proposes it without answering
   the binding-name objection.
4. **Per-recipe codegen (Panda's actual answer).** Generate one bound
   function per recipe with the resolved name closed over. Biggest
   change; converges with Panda but reinvents the runtime's shape.

## Open questions

- Does any JS (untyped) call site rely on the inference path today?
  Census the middle path's real users before touching it.
- If inference stays as backstop, should the diagnostic's "explicit
  literal" demand soften to match, or should inference be removed so
  all three layers agree?
- Is the silent-`''` runtime miss acceptable, or should a miss throw
  in dev (fail loud at the lookup, not just at extraction)?

## What closes this

An HQ decision on options 1–4 above, plus the census in open question
1. If the answer is "keep required", close with a one-line rationale
in the `RecipeConfig` doc comment so the next reader doesn't re-ask.

## Hardness note (captain, 2026-09-23)

Repo-wide census: exactly ONE `recipe()` call in shipped source
(`SummaryChip.tsx`). Everything else is fixtures: core
virtual-transform tests plus RS station cases (`ATM-RECIPE-*`,
`ATM-SITE-*`, `VRT-CVA-05`) — notably `ATM-RECIPE-08`, which
pins the inference backstop (`chipRecipe` → stem, bare
`Recipe` / `plain` uninferrable), and `ATM-SITE-10`, which
covers both spellings. So the migration surface in-repo is
trivial — but `RecipeConfig` is a public authoring API, and
external call sites can't be censused.

Verdict: making it truly optional à la Panda is genuinely
hard — not the type (one `?`), but the runtime loop. Panda
bakes the resolved name into each generated function because
recipes are declared in config; ours are authored inline in
userland and `recipe()` is one generic runtime call with no
binding name in scope. Every middle path dies: sidecar
mapping needs call-site identity the runtime doesn't have
(stack inspection is not serious); JS has no assignment
hooks; a runtime default has nothing to default to. Real
optionality means per-recipe codegen (new userland-transform
machinery or a declared-recipes API migration).

Cheap wins if HQ wants motion without the redesign: (a)
dev-loud miss — throw/warn on table miss instead of silent
`''`, so the next SummaryChip fails loudly instead of naked
(keep prod behavior); (b) the doc-comment rationale if
required stands; (c) optionally remove the inference
backstop so all three layers agree (touches `ATM-RECIPE-08`
pins; behavior change for untyped call sites).
