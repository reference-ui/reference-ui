# `RecipeConfig.className` required — should it be?

**Severity:** Low (works as designed; design question, not breakage)
**Area:** Neo recipe runtime + RS extractor (`recipe()`)
**Status:** Investigation crew dispatched 2026-09-23 (captain) — findings to LOG-2.md, no decision taken.
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

## Design thinking (HQ push, 2026-09-23)

HQ's push: the binding name is right there — trace it, and
only warn on in-situ/anonymous calls. That reframes the
problem correctly: the gap is TRANSPORT, not knowledge.
The extractor already knows the stem (inference exists and
is test-pinned); the runtime is the only layer that can't
see it. HQ's proposal is complete except for one transport
mechanism to carry the inferred stem into the runtime
config. The in-situ half already exists as behavior: the
`RecipeClassName` diagnostic sync-fails on uninferrable
shapes — HQ's "warn them" is today's error, just raised at
sync rather than at build.

Transport candidates, ranked:

1. **Build-time injection transform — REJECTED by HQ
   (2026-09-23).** A bundler `transform` hook would rewrite
   `const XRecipe = recipe({...})` → injects `className:
   'X'` when absent and inferable; in-situ/non-inferrable
   emits HQ's build warning. Type loosens to optional;
   runtime untouched. Costs: genuinely new machinery —
   `referenceVite()` today does HMR/watch orchestration +
   optimizeDeps excludes, zero source transforms (verified
   `core/src/vite/plugin.ts`), and the transform would
   belong in the Neo plugin surface post-M-runner retarget,
   not core's. Must run identically in dev serve + build or
   behavior diverges; must agree EXACTLY with the RS
   inference rule (two implementations, one rule — pin with
   shared fixtures, e.g. `ATM-RECIPE-08` shapes). Bundler
   coverage is kind: Neo has no webpack target (Obj-2 audit
   R4), so vite-only suffices for Neo's world; legacy
   webpack stays on required-literal. THE objection to beat:
   every execution path that bypasses the transform reopens
   the hole (plain-node SSR, tests importing raw source
   without the vite plugin, exotic bundlers) — runtime miss
   returns, silent unless the dev-loud miss ships with it.
2. **Keep required (status quo).** Zero work. The honest
   defense beyond architecture: the literal names the thing
   that appears in CSS (`summaryChip__base`,
   `summaryChip_t_soft`), and literal-vs-binding agreement
   is already coherent (literal is single source of truth at
   both layers — no silent disagreement state). Cost: the
   usability tax HQ names stands, forever, on a public API.
3. **Declared-recipes API migration (Panda's actual answer).**
   Recipes move to config, generator emits bound functions.
   Converges with Panda; churns the authoring API; biggest
   change. In-repo surface is 1 call site, but external
   authors pay the migration.
4. **Runtime stack inspection.** Not serious (minification,
   cost, fragility). Recorded closed.

Usability stakes (HQ: "it's a language thing"): every
recipe author hand-writes a stem the compiler already
knows. That is pure tax in the conventional case, and the
tax compounds the oddity that the compiler infers beside
the literal anyway.

Decision inputs still needed: (a) enumerate supported
execution paths that bypass a vite transform — if that set
is must-support, option 1 needs the dev-loud miss as a
companion or dies, and required stands; (b) sequence AFTER
Objective 1 lands (transform work, if any, builds on the
final extractor; don't overlap the RS resolution wave).

## Extractor, not transform (HQ direction, 2026-09-23)

HQ killed the bundler transform: no new machinery of that
kind — the build-time extractor is the tool that sees
names. Agreed and recorded (option 1 above now REJECTED).

Straight talk on what the extractor can and can't do alone:
it can trace every binding (inference exists, test-pinned),
warn/fail on in-situ (diagnostic exists), and emit
tables+CSS under traced stems. What it CANNOT do is deliver
the stem to the generic runtime call — `recipe(config)`
still needs the key in the object, and no extractor output
reaches inside that call. Transport options, exhaustive:
(a) the literal (status quo); (b) per-recipe codegen + API
migration — Panda's answer (declared recipes, baked names);
(c) content-addressed tables (runtime hashes config,
extractor stamps qualifiedName — new RS↔JS canonical-hash
contract, duplicate-content stem collisions, skew = silent
miss; clever-fragile, not recommended); (d) stack
inspection (not serious). The extractor closes knowledge +
diagnostics + emission; only (b) or (c) close runtime, both
heavy.

Panda findings (HQ's memory, checked): default output is
READABLE (`button button--size-small`, pattern
`<recipe-className>--<variant>`); hashing is OPT-IN (`hash:
true` → `.adfg5r`). And the kicker for our design: Panda's
optional-className works because config-declared recipes
carry identity (the config key) that codegen bakes into
each generated function — the exact channel our inline
authoring lacks. Our emitted CSS already shares Panda's
readable posture (`summaryChip__base`, `summaryChip_t_soft`)
— no hashes anywhere. "Instead of generated bollocks" is
already our emit.

Direction (HQ): variable-name tracing as shared tooling
across recipe AND css extraction — one name authority:
trace bindings, warn on untraceable (in-situ), check
literal-vs-binding agreement, feed emission. No crew
dispatched; the transport question above decides whether
the literal can ever go.
