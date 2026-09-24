# REPORT — Remaining Issues (W4 cutover)

Plain-language breakdown of everything still open, with the smallest
code that shows each problem. Status as of 2026-09-24, HEAD 4c33dd981.

## 0. The governing law: user space stays as is

`reference-lib` is user space. It has not changed since Panda v1;
every breakage in this voyage came from tightening underneath it.
Therefore:

- We do not touch user space. No sweeps, no drive-bys, no "surgical"
  exceptions — 52 sites is not surgical, and the count doesn't matter:
  the principle holds at 1 site.
- Any tightening that breaks user space is void as specified. The
  fix goes below user space (Neo), or the tightening relocates to a
  position user space never touches.
- This replaces the earlier recommendation. The library sweep is
  rejected and will not be crewed.

Everything below is read through this lens.

## Summary

| Issue | State | Needs |
|---|---|---|
| Variant collision | Resolved by reframe | S4 rework crew |
| S4 / S5A landings | Rework, then land | Re-verify |
| Ruling-8 arm | Moot, reverting | Nothing |
| Ruling-4 tension | Landed, FYI | Nothing |
| sync.test.ts tripwire | Loud warning | S6 splits file |
| Kill-leg flakes | Noise, handled | Nothing now |

## 1. Variant collision (resolved by reframe, not by sweep)

**What's broken.** Same facts, new meaning. Library components
spread their own open props (`variant?: unknown` inside, inherited
from the raw E4 shelf shape) into the bound per-tag props. S4
narrowed the per-tag `variant`, so 52 spread sites across 18
components fail typecheck and the two chain gates go red:

```tsx
// Accordion.tsx:132 — typical of all 52 sites (user space, untouchable):
<Div
  ref={ref}
  data-reference-accordion=""
  onKeyDown={handleKeyDown}
  {...props}   // props.variant is unknown; Div wants never | string
>
```

```
error TS2322: Type 'unknown' is not assignable to type '(string & {}) | undefined'.
```

Census (kept as evidence of scale — this is why per-tag
narrowing, not the library, had to give):

| Component | Sites |
|---|---|
| Calendar | 7 |
| Tree | 5 |
| Overlay | 5 |
| Listbox | 5 |
| Splitter | 4 |
| Slider | 4 |
| NumberField | 4 |
| Toast | 3 |
| Switch | 2 |
| Menu | 2 |
| DateField | 2 |
| Combobox | 2 |
| Collapsible | 2 |
| Tabs | 1 |
| Reference | 1 |
| Popover | 1 |
| Field | 1 |
| Accordion | 1 |

**Why no bake-side trick saves per-tag narrowing.** This is a proof,
not an opinion. Two requirements, one position:

```ts
// Requirement A (user space, immovable — 52 live spread sites):
const props: LibProps = getProps()  // variant?: unknown inside
<Div {...props} />                  // MUST compile
// → per-tag variant must accept unknown.

// Requirement B (S5's flip as briefed):
const bad: DivProps = { variant: { tone: 'not-a-tone' } }  // MUST fail
// → per-tag variant must reject this object.
```

No type satisfies both: the only types `unknown` fits into are
`unknown` and `any`, and both accept every object. QED. Per-tag
variant narrowing is void — not disliked, unsatisfiable. (Every
alternative dies the same way: omitting the prop breaks all direct
authors; the string arm still rejects `unknown`.)

**The resolution: the narrowing relocates.** The per-tag position
goes back to exactly what user space has always spread into:

```ts
// Per-tag (user-space-facing): open, as since Panda v1:
variant?: unknown
```

The precision S4 built survives where user space never spreads:

```ts
// 1. The exported alias (precise union/never, still emitted):
import type { PrimitiveVariantProp } from '@reference-ui/react'
const bad: PrimitiveVariantProp = { tone: 'not-a-tone' }  // FAILS, as ruled
const good: PrimitiveVariantProp = { tone: 'accent' }     // passes (tone recipe)

// 2. The recipe call (typed by its own definition, authors write literals):
button({ variant: { tone: 'not-a-tone' } })  // FAILS via RecipeVariantProps
```

Neither position ever receives an `unknown` spread (proven: library
spreads land on per-tag props only; recipe calls take author
literals), so user space stays green while bad variants are still
caught where authors write them.

**What changes.** S4 rework (small, Neo-side): the per-tag line
reverts to `variant?: unknown` (arm included — it also rejects
`unknown`), the alias stays precise, PGEN-22's variant legs and the
unit variant tests re-target from `DivProps` to the alias position,
then the full proof bar re-runs. S5's PGEN-17 flip re-briefs from
`DivProps` to the alias + recipe-call positions (its current probe
tests `DivProps` directly, which is now provably the wrong
position). PGEN-15 (css) is unaffected — css narrowing produced
zero library errors, as did the compiled prop-name list.

**The risk.** An author writing a bad variant object directly on a
primitive gets no red squiggle at that exact spot anymore; the
check catches it at the alias/recipe positions instead. That is the
cost of the law, and it is contained: primitives are overwhelmingly
consumed through components and recipes, not hand-written with
variant objects.

## 1b. Css narrowing survives via accommodation (c) (adjudicated)

**What happened.** The rework's loud finding (1 css failure at Divider,
merging two style objects via spread) adjudicated to TWO independent
poisons, proven with a 2×2 matrix on real bake text: (a) the array
arm — spreading an array type yields array-method shapes, not css;
(b) the font-scope union — spreading two union-typed values makes
cross-scope hybrids no member accepts. Dropping the array arm alone
still fails; flattening scopes alone still fails; both together:
Divider green, bogus-key still red, array-css red (zero usage
anywhere in user space — census-proven).

```ts
// Before (both poisons live — removed by (c), kept here as history):
export type PrimitiveCssProp = SystemStyleObject | Array<SystemStyleObject>
// After (accommodation (c) — mirrors the StyleProps precedent one line up):
export type PrimitiveCssProp = Omit<SystemStyleObject, 'font' | 'weight'> & { font?: unknown; weight?: unknown }
```

**Precision cost.** Font/weight *values* go `unknown` at the css
position — identical to the already-landed props position, with
zero tests pinning font-token rejection. Bogus-key rejection
(PGEN-15's guarantee) intact.

**Status.** Implementer dispatched with exact bytes; verifier +
landing follow. Voiding css narrowing was refused — the law voids
only what no accommodation saves.

## 2. S4 / S5A landings (rework + css fix, then land)

**What's open.** S4's LAND verdict covered the narrowed per-tag line,
so the rework voids it: S4 must be re-verified after the revert.
S5A (recipe collector) is unaffected — it touches collect/, not the
bake — and its LAND stands; it lands after S4 as before (its tests
import S4's exports).

**The fix.** Rework crew → verifier → land S4 → land S5A → T1/T2
must go green (the bake returns to the per-tag shape user space has
always consumed; css/prop-name narrowing already proved clean).

**The risk.** Rework drift (crew touches more than the variant
line). Mitigation: the brief names the exact lines; the verifier
diffs the arc against this report.

## 3. Ruling-8 arm (moot — reverting with the line)

**What happened.** The per-tag `(string & {})` arm was added to keep
landed PARITY-01 green under narrowing. With per-tag narrowing void,
the arm goes away with it and the P7 conflict evaporates: P7 returns
to the open shape it has always been green under, with zero P7 edits
then and zero now.

**HQ decision, reframed.** Not "keep or revert the arm" anymore but:
accept the relocation (per-tag open, precision at alias + recipe
calls). The old ruling-8 letter (per-tag narrowing) is void under
the user-space law by the proof in §1.

## 4. Ruling-4 tension (landed, FYI only)

**What happened.** HQ ruled the entry imports the primitives roster
from tracked source, never dist. In packed installs no source tree
exists, so the letter is unsatisfiable there. Both legs resolve the
roster live through the workspace package's exports map instead —
same bytes in the workspace, working bytes in packed installs.

**The risk of reverting.** Packed installs break outright (the
original T1 failure). There is no third reading.

**Recommendation.** Keep. No action.

## 5. sync.test.ts tripwire (loud warning for S6)

**What's wrong.** The file sits at exactly 500 lines; the quality
gate fails above 500. Any line added anywhere in the file fails the
gate. It got here honestly (a repin had to squeeze to net +1).

**The fix.** S6 splits the file before touching it.

**The risk.** Forgetting, then chasing a red gate mid-cutover.
Carried loudly so nobody has to rediscover it.

## 6. Kill-leg flakes (noise, handled)

**What's wrong.** The sync-lock kill tests occasionally observe the
victim process as still alive when asserted (`exitCode null`
instead of 75). Load-sensitive timing, foreign files, never in the
arc under test. Seen across many crews; always green on isolated
re-run.

**The fix.** None scheduled. Discipline is: attribute every red by
name, re-run isolated, require a full green before landing.

**The risk.** Noise masking a real regression. Mitigation is the
discipline above — it has held so far.

## 7. Remaining program (for the map)

- **S4 (+rework +css) + S5A: LANDED** (36th, 37th). Chain green.
- **S5 flips: LANDED** (39th). PGEN-15 as briefed; PGEN-17 at alias
  + recipe-call positions with a live tone recipe.
- **S6 deletes (last).** Tear down the old hand-written paths in
  dependency order; the tags file goes last (and split sync.test.ts
  first — §5).
- Then W4 (the per-system cutover) is done.

## 8. Carried, no action

- PGEN-22 README says "three negatives," lists four; two prose
  soft-pins. Cosmetic; fold into the S4 rework touch or any later
  PGEN edit.
- Recipe collection inherits the evaluator's shared-scope pattern
  (an upstream file declaring a top-level `const recipe` would
  collide, exactly as `const tokens` does today). No current file
  does. In-kind exposure, not new.
- Two `playwright/ct.ts` type errors (mount/screenshot vocabulary)
  show in lib's local typecheck and involve none of the new types;
  presumed pre-existing — confirm on HEAD if lib is ever typechecked
  for another reason. (No sweep means no sweep crew to do it;
  harmless either way since T1 never gated on them.)
