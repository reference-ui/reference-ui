OPERATION: DONE

# Mission: Operation Forge

Status: `done` (2026-09-19). Slices 0–5 landed. Census 126. Ledger §5:
no open items; the quoted statement lost its "except". Slice 6 (tasty
adoption) left as the mission-sanctioned optional follow-up. Map:
[operation-forge-map.md](operation-forge-map.md). Successor work on
diagnostics after harvest: [Error Correct](../operation-error-correct.md).
Doom is the red-team that follows ([doom-agent.md](../doom-agent.md)).

Signal protocol (line 1 of this file): `OPERATION: READY` = the plan has
enough context for research agents to challenge it; `OPERATION: GO` = the
watcher starts implementation, slices in order. GO is written only after
the READY-phase asks (end of file) come back without a blocker.

Folded in and retired: `extract-information-layer.md` (the floor is
Part I of this file) and `operation-forge-thoughts.md` (HQ's reactions,
now the verdicts on §1–§4). Overmatch:
[`operation-overmatch.md`](operation-overmatch.md).
Ledger: `packages/reference-neo/docs/evidence/overmatch-ledger.md` §5.
Warning census: lib neo sync, 2026-09-19, **213** diagnostics.

## The claim this operation is for

Overmatch already wrote:

> We extract atomic CSS from your tokens, styles and code — and on the
> extraction language we match Panda v2 everywhere it resolves (81 of 81
> catalog entries pinned by green stations, 4 with stated carve-outs) and
> exceed it in 19 pinned superiority rows — except: the S13 value-import
> rider and the four carve-outs…

Forge retires the "except," then decides the **support surface** that
sentence is allowed to mean. Two ideas do the work:

1. **The information layer** (Part I). The engine is already very good at
   *program shapes* — spreads, helpers, aliases, mutation, imports. It is
   missing the dumb layer underneath: *if a string in the source is
   complete CSS or a complete rhythm literal, it is information*, whether
   or not the site that carries it can be named. We know what CSS looks
   like. We know what `13r` looks like. We know what `rgba()` looks like.
   Read them wholesale. Runtime looks them up. Nothing is interpreted.
2. **The module graph** (Part IV-B). Cross-file is the one place the
   engine still goes silent (§1). The fix is not a bigger fold table; it
   is a subsystem that reads the program as one virtual page — every
   import resolved to the binding it names, in the file that declared it,
   on demand — and is shared with Tasty and StyleTrace, which each carry
   their own copy of the same ladder today.

Once those two exist, most of the leftover rows are one-file changes or a
sentence in the ledger. Part II signs them anyway. Nothing here is
skipped because the layer exists.

## What this is not

- Not a recatalog. SPEC-V2-NN IDs do not move.
- Not Doom. Doom is the red-team that follows
  (`../doom-agent.md`). Forge decides the *shape* so Doom isn't
  inventing architecture; Doom seed 1 is fortified here (§1, Slice 3).
- Not firstThatWorks, not full StyleTrace, not a product slice.
- Not a JS evaluator, not a runtime CSS engine. Build reads source;
  runtime looks up a map. Nothing fills a template hole or runs `i`.
- Not "fix every Book warning." Rest-spreads and runtime identifiers stay
  dynamic and stay warned. We pick the rows that **lie** or that **fail
  to fold a static shape**.

---

# Part I — The information layer (the floor)

## The claim

Panda's extractor is site-driven: a value counts when it occupies a style
position the fold table can see. This layer is **information-driven**:

> Look at the source. If a string matches CSS, or matches our rhythm
> grammar, it is information. Do not care whether it sat in a `css()`
> object, a helper return, an array, or a const bag. If it is in the
> program as a complete static value, extract it — onto the props the
> program can ask for it on — and let runtime pick.

The bytes `red`, `#ff0000`, `rgba(0,0,0,0.5)`, `13px`, `13r`,
`translateX(1.25rem)` are CSS (or rhythm) whether or not we can name the
binding that carries them at runtime. The source is a living CSS document
and it will get more like one.

The only limitation an author has: **define the values somewhere in your
source.** A palette in an array is fine. A hex in a helper return is
fine. A `translateX(${n}px)` is not a value; it is arithmetic, and the
place for arithmetic is the native `style` attribute (or GSAP, which the
lib already uses) — that path bypasses build-time and runtime CSS alike,
and it is the right tool for measured, animated, or computed values.
That is the seam between build and runtime, and it is honest.

## Where it sits

Today's pipeline is host-first: find the site → walk the expression →
fold what the table allows → resolve tokens/rhythm → mint into the one
`AtomSet` → emit sheet + class map (one namer,
`stylesheet/name/mod.rs`). Runtime `css()` (neo
`src/runtime/css/css.ts`) looks up the five-tuple
`(system, when, prop, value, important)` in `runtime-data.mjs` and
applies the precomputed class. A miss emits no class and a dev
`console.warn`. It never hashes, never injects, never resolves tokens or
rhythm in the browser — the lookup key is the **authored string**.

The layer is a **harvest pass** beside the site walk, feeding the same
`AtomSet` and the same namer. No second map. Site extract still decides
what *this render* wants; harvest decides which static values exist in
the program at all, so a runtime lookup can find them.

```ts
// Button.tsx
css({ color: 'red' })                    // site mints color:red

// Card.tsx
function Card({ color }: { color: string }) {
  return css({ color, padding: '4px' })  // site cannot see `color`
  // → sheet: padding: 4px | map: "padding:4px"
  // → ATM-W-DYNAMIC-IDENTIFIER 'color'  (still warns; the site *is* dynamic)
}

<Card color="red" />
// runtime asks "color:red" → present (Button's site minted it; harvest guarantees it either way)
// runtime asks "color:hotpink" → present iff 'hotpink' is written somewhere in source
// runtime asks "color:#bada55" → absent unless written; paints nothing; dev warn
```

## The alphabet

Two grammars, both treated as CSS-shaped values, never as tokens.

### 1. CSS values

| Kind | Recognizer | Examples |
|---|---|---|
| Named colors | closed table (the 148 CSS named colors + `transparent`, `currentColor`) | `red`, `rebeccapurple`, `transparent` |
| Hex | `#` + 3/4/6/8 hex digits | `#f00`, `#ff000080` |
| Color functions | prefix table + balanced parens | `rgb()`, `rgba()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()`, `color-mix()`, `light-dark()` |
| Lengths | number + unit table, or `0` | `13px`, `1.25rem`, `50%`, `2vw`, `0` |
| Math / transform / misc functions | prefix table | `calc()`, `min()`, `max()`, `clamp()`, `translateX()`, `translate()`, `scale()`, `rotate()`, `url()`, `var()` |
| CSS-wide keywords | closed table | `inherit`, `initial`, `unset`, `revert`, `revert-layer`, `none`, `auto` |

The Rust engine today knows eight keywords (`resolve/tokens/mod.rs`
`is_css_color_keyword`). The full named-color set exists only in
reference-core's Panda utilities
(`packages/reference-core/src/system/panda/config/extensions/color/utilities.ts`
`CSS_COLOR_KEYWORDS`). Forge moves the alphabet below the cut, into
**canon** (`canon/src/css/values/`), where the property table already
lives. Token paths (`ui.focus.ring`, `gray.800`) stay the token
resolver's job; the alphabet is not a second dictionary.

### 2. Rhythm (`Nr`)

Our unit. The grammar `resolve/rhythm` already owns (`matrix/spacing` is
the spec): `1r`, `2r`, `0.5r`, `1/3r`, `-4r`, lists (`4r 2r`, `1px solid
1/3r`). The harvest recognizer **is** `resolve_single_rhythm` /
`resolve_fragments` — a value is rhythm if the lowering accepts every
fragment. No second `r` parser. `13r` in an array is still `13r`; resolve
lowers it to `calc(13 * var(--spacing-root))` when it becomes an atom.

## Harvest, not fold

Fold asks: *can I name this expression?* Harvest asks: *is there a
complete CSS-shaped literal in this program?*

```ts
const getColor = () => 'red'
const calledColor = getColor()
const palette = ['red', '#0af', 'rgba(0,0,0,0.5)', 'oklch(0.7 0.1 180)']
const space = '13r'

css({ color: calledColor })          // §5 still folds this (the name is a static CSS value)
css({ color: palette[i] })           // site dynamic → ATM-W-DYNAMIC-MEMBER; `color` becomes a sink
css({ margin: space })               // folds today (local const)
// harvest → map: "color:red", "color:#0af", "color:rgba(0,0,0,0.5)", "color:oklch(0.7 0.1 180)"
// runtime css({ color: palette[i] }) paints whichever of the four `i` picks
```

Position does not matter: object member, array member, function return,
template literal with **no** holes, `as const` bag, a file the site walk
never chased. A string that is not a complete value is not information:
`'hello'`, `'sm'`, `'ui.button.mutedBackground'` are not this layer.

## Sinks — which props a harvested value lands on

Atom identity is still `(prop, value, when)`. A harvested value with no
prop is not an atom. Forge does **not** mint every color onto all 71
color-bearing props (canon `COLOR_PROPERTIES`) — that is bloat with no
consumer. It mints onto **sinks**:

> A **sink** is `(prop, when)` at a site where the walk refused the value
> position as dynamic (`ATM-W-DYNAMIC-IDENTIFIER`, `-MEMBER`,
> `-EXPRESSION`, `-TEMPLATE`, `-BINARY`, `-UNARY` — a dynamic ternary
> arm lands in one of these). The sink's *kind* is the prop's value kind
> (color / length / transform / keyword) from canon.

Harvest mints each harvested value onto every sink of a compatible kind,
carrying the sink's `when`. The only way a runtime lookup for an unminted
`(prop, value)` can happen is through a dynamic site on `prop` — so
sinks are exactly the holes harvest needs to fill, and nothing else. A
program with no dynamic sites harvests nothing. A `{...props}` spread
has no prop and is **not** a sink: what paints through a rest-spread is
whatever other sites minted.

```ts
// one sink: (color, [_hover]) — from the dynamic `tone`
css({ _hover: { color: tone } })
// harvest → map: "_hover:color:red", "_hover:color:#0af", …  (every harvested color, under _hover)
```

## The authorship rule (wholesale)

The unit of harvest is a **wholesale value**: a complete CSS or rhythm
literal visible in the source. Not a fragment, not a template with a
hole, not a number we would have to compute.

**Wholesale — extracted.**

```ts
const space = { sm: '1r', md: '2r', lg: '4r' }
const hexes = ['#0af', '#ff0000', '#111827']
const washes = ['rgba(0,0,0,0.5)', 'rgba(255,255,255,0.04)']
const tones = ['oklch(0.7 0.1 180)', 'oklch(0.5 0.15 145)']

css({ margin: space[k], color: hexes[i], bg: washes[j] })
// sinks: (margin), (color), (backgroundColor)
// → "margin:1r" "margin:2r" "margin:4r" (lowered to calc(N * var(--spacing-root)))
// → "color:#0af" "color:#ff0000" "color:#111827" "color:rgba(…)" ×2 "color:oklch(…)" ×2
// → "backgroundColor:…" same eight colors
// runtime picks; a pick that was never written paints nothing
```

**Not wholesale — refused at the site, never invented by harvest.**

```ts
`2${n}r`                  // not a rhythm value
`#${hex}`                 // not a color
`rgba(${r},${g},${b},1)`  // not a color
`translateX(${n}px)`      // not a transform
prefix + 'red'            // open concat with a param
```

That is the lie styled-components sold: because you *can* interpolate CSS
at runtime, it felt like the product. A new string at runtime is a new
value nobody extracted. This engine will not pretend to compile it. Put
measured and computed values on `style`.

**Strings only.** Numeric literals are not harvested (a number has no
CSS-shaped signature; harvesting every integer in a program onto
`zIndex` / `opacity` sinks is noise). Numbers reach dynamic sinks through
`staticCss`, which already exists for exactly that.

## Forks — decided

| # | Question | Verdict |
|---|---|---|
| **H1** Always-on named colors? | **No. Harvest-only, for named colors too.** The alphabet *recognizes* `red` (never a token path, never warned); an atom is minted only when the name is written in a compile input and a sink exists. 148 names × 71 color props pre-minted is the bloat this layer refuses. Projects that want a pre-minted set say so with `staticCss`. |
| **H2** Which props? | **Sinks.** Legal-on-prop by kind, restricted to `(prop, when)` pairs the walk refused as dynamic. No sink, no atom. |
| **H3** Closed-set depth — chase imported palettes? | **Moot.** Harvest is position-free over every compile input, so the import edge is irrelevant. Corpus = the compiled sources, not `node_modules` (externals load values-only for the walk; they are not harvested). |
| **H4** False positives (`status = 'red'` as a business enum)? | **Accept.** Cost is one class in the sheet, only if a `color`-kind sink exists. Runtime still has to ask for it. Do not try to prove intent. |

## What the layer closes

| # | Layer closes | Still Forge (structure) |
|---|---|---|
| **§1** nested import spread | `'red'` / `'4px'` mint if a sink exists; runtime `css(button)` can paint. | The silent drop. Harvest can *hide* the miss — paint works, extract said nothing. Fold anyway (Slice 3). |
| **§2** refused leaf paints | **Closes it — this is the runtime contract, signed below.** | — |
| §3 poison | — (both colors would harvest; which is live is a write question) | Precision (Slice 3). |
| §4 null-const | — (`null` is a hole, not CSS) | Init arm (Slice 1). |
| **§5** helper init | `'red'` / `'13r'` in the helper body mint. | The name still lies "dynamic". Fold (Slice 2). |
| **§6** namespace values | `t.brand === 'red'` paints without value tables. | Token paths / default objects stay refused by dialect. |
| §7 `__proto__` | — | Out of axis. |
| §8 wording | — | Sentence signed below. |
| **§9** freestyle CSS | **Closes it — the alphabet is why `rgba()` was never a path.** | One resolver fence (Slice 1). |
| §10 radius longhands | — (`full` is a token) | Prop map (Slice 1). |
| §11 unique-name `sm` | — (`'sm'` is not CSS; excluded by the authorship rule) | Resolver + host surface (Slices 1, 5). |
| **§12** host keys in a bag | Nested `'0.5rem'` / `'transparent'` mint if sinks exist. | Bag semantics (Slice 2). |
| §13 const alias | **No.** Inner `'2px'` would mint unconditioned; the site needs `when: [_focusVisible]`; `ui.focus.ring` is a token. | Member-path init (Slice 2). |
| Book noise: 15 ternary / 10 identifier | Values authored anywhere in lib **paint** through those sites. | Still warn; the site is dynamic. |
| Book noise: 74 `{...props}` | No sink (no prop). What consumers wrote at call sites paints because *those* sites minted. | Still warn. |

## What it is not

- Not a JS evaluator: no `eval`, no module graph execution, no solving
  `i`, no filling `${n}`.
- Not a runtime CSS engine: build-time harvest, runtime lookup.
- Not token resolution: `gray.800` stays `resolve/tokens`. A named CSS
  color is not a token path.
- Not `staticCss`: that enumerates *theme categories* from BaseSystem;
  harvest enumerates *literals in source*.
- Not a replacement for the fold table: §1/§3/§5/§12/§13 keep their
  picks.
- Not "scan every quote in the git tree": corpus is program literals in
  compile inputs.

---

# Part II — The rulings

Class stems in the `→` lines use the namer's spelling as pinned in
stations (`c_red`, `bg-c_blue`, `p_4px`, `m_13r`, `hover:c_red`); the
system prefix (`@reference-ui/lib__`) is omitted. Map keys are the
runtime's five-tuple spelled the way `css.json` pins them
(`"color:red"`, `"_hover:color:red"`).

## At a glance

| # | Shape | Today | Verdict |
|---|---|---|---|
| 1 | Import, compose, re-export, `css()` the composition | padding lands, color vanishes, **no warning** | **A — fold**, via the module graph (Slice 3) |
| 2 | Refused leaf, another site already minted that atom | can still paint (global class map) | **A — accepted, signed**; the layer is the floor |
| 3 | Mutation poison across files / member writes | walk origin-precise; bag name-wide | **C** — root poison stays; cross-file precise by construction (Slice 3) |
| 4 | `const n = null; css({ color: n })` | warns "dynamic identifier" | **A — silent strip**, like literal null |
| 5 | `const x = getColor(); css({ color: x })` | call-site folds, init does not | **A — fold** (post-attach init pass) |
| 6 | `import * as t; css({ color: t.brand })` / default-as-object | refused (v2 refuses too) | **A — match v2, permanently**; S13 struck |
| 7 | `__proto__` keys / `mergeProps` drop | voyage-log leftover | **A — out of axis**, closed |
| 8 | Mutation contract wording | SITE-28 green, unsigned | **A — signed below** |
| 9 | `bg="rgba(0,0,0,0.5)"` / `translateX(1.25rem)` | paints, warns "unknown token path" | **A — alphabet fence**; the warning was a lie |
| 10 | `borderTopLeftRadius="full"` | corners warn and pass `full` through raw | **A — map every radius longhand to `radii`** |
| 11 | `size="sm"` / `fontSize="sm"` / `boxShadow="lg"` | unique-name steals `radii.sm`; wrong story | **A — no unique-name across categories**; colors keep a *true* warning |
| 12 | `{...{ css: {…}, style: {…}, color: '…' }}` on a host | "Unknown style property `css` / `style`" | **A — a JSX bag has attribute semantics** |
| 13 | `_focusVisible={focusRing}`, `focusRing` a const member alias | "not a static style object (identifier)" | **A — member-path init records objects** |
| 14 | `<Button size="sm">` where `size` is the component's variant | `size` macro expands to width/height, then §11 | **A — declared component props shadow StyleProps** |

---

## 1. Nested imported-object spread

**Verdict: A — fold it.** Not left for Doom cycle 1: Doom reproduces
against a fixed shape, it does not invent one.
**Why it matters:** the one hole in the no-silence rule. Filed as Doom
seed 1 (`../doom-agent.md` §8). SPEC-V2-55 / 76.

### What already works

Spreading an **imported** object **at the `css()` call** (`ATM-SITE-39`):

```ts
// styles.ts
export const hover = { color: 'red' }

// app.ts
import { hover } from './styles'
css({ ...hover, backgroundColor: 'blue' })
// → sheet: color: red; background-color: blue | map: "color:red", "backgroundColor:blue"
```

Composing with a **same-file** const, then importing the result
(`ATM-SITE-28` R3b):

```ts
// tokens.ts
const spreadBase = { color: 'plum' }
export const spreadButton = { ...spreadBase, padding: '9px' }

// app.ts
import { spreadButton } from './tokens'
css(spreadButton)
// → sheet: color: plum; padding: 9px
```

### What breaks

Import, compose, re-export, then `css()` the composition:

```ts
// base.ts
export const base = { color: 'red' }

// tokens.ts
import { base } from './base'
export const button = { ...base, padding: '4px' }

// app.ts
import { button } from './tokens'
css(button)
// today → sheet: padding: 4px            color is gone, zero diagnostics
// Forge → sheet: color: red; padding: 4px | map: "color:red", "padding:4px"
```

A theme-token file composing a base recipe. Not a trick.

### Why (line-cited)

- `extract/scope/value.rs` `record_spread`: an identifier spread copies
  keys only when `object_binding` finds a `BindingInit::Object`. An
  `Import` binding carries `init: None` (`scope/binding.rs`), so the
  arm hits `return;` with nothing recorded — **and no residue marker**,
  which is why the use site has nothing to diagnose.
- `extract/resolver/overlay.rs` `overlay_scope_values` bakes each file's
  root values by running `scope::collect(program, merged_bag)` against
  the **merged literal bag**, not the `ProjectGraph`. The graph exists
  by then (`load_externals` has run), but the overlay never asks it.
  Origin-file imports are simply not chased at collect time.
- `extract/resolver/mod.rs` parses every source three times (insert,
  overlay, extract). `constants/index.rs` even carries the aspirational
  comment for this exact shape ("color rides along"); the import path
  never fills it.

### The fix shape

Not a fourth pass over the bag. The module graph (Part IV-B) makes
value resolution **demand-driven**: `value_of(Origin)` resolves a
binding's value in its own file, memoized, chasing import bindings
through the graph to their origin and resolving *that* first, with an
in-progress set so a cycle refuses instead of recursing. `...base` in
`tokens.ts` then reads `base.ts::base` as a complete object exactly as a
same-file const would. Until a binding resolves, a spread of it records
a **residue marker** so the use site says so — the diagnose floor lands
in the same slice as the fold, so silence is gone even where the graph
refuses (cycle, unresolvable specifier, external without values):

```ts
// unresolvable case (cycle / missing file)
css(button)
// → sheet: padding: 4px
// → ATM-W-UNFOLDABLE-SPREAD: spread of `base` in tokens.ts:3 could not be read (cycle base.ts ↔ tokens.ts)
```

Station: `ATM-SITE-78` (this three-file shape, plus a barrel
`export * from` hop and a cycle arm). Neo: `NEO-SITE-29` (paints red).

---

## 2. Refused leaves can still paint — the runtime contract

**Verdict: A — accepted, and signed here.** B (fail-closed per site)
is a second identity against one-namer / one-map; it is a different
compiler.

```ts
// Button.tsx
css({ color: 'red' })                      // → map: "color:red"

// Card.tsx
function Card({ color }: { color: string }) {
  return css({ color, padding: '4px' })    // → map: "padding:4px"; sink (color, [])
}

<Card color="red" />                       // runtime "color:red" → hit → paints red
<Card color="salmon" />                    // hit iff 'salmon' is written anywhere in source
<Card color="#123456" />                   // absent → no class, dev warn (NEO-MERGE-06 shape)
```

**The sentence (quotable):**

> Extraction refusal is about the *site*, not the *value*. A site the
> walk cannot read mints nothing and says so. The values the program
> wrote are still information: the harvest mints every complete CSS or
> rhythm literal in the compile inputs onto every sink that could ask
> for it. Runtime paints any `(prop, value, when)` the sheet holds and
> nothing else. A value the program never wrote never paints.

HQ's framing, kept verbatim in spirit: if the runtime passes a color we
extracted, it lights up; if it passes one we did not, it does not, and
that is the seam between build time and runtime. Fine.

No runtime change: neo `css()` already looks up the authored string. The
floor under this sentence is Part I (Slice 4). Station: `ATM-HARVEST-01`
(`'red'` lives only in an array; a dynamic `css({ color })` site exists;
`"color:red"` is in the map). Neo: `NEO-CSS-14` (paints in a browser).

---

## 3. Poison precision

**Verdict: C — keep member-root poison; cross-file poison is precise to
the origin binding.** The second half is not a follow-up mission: it
falls out of the module graph, because import bindings stop consulting
the name-wide bag. Fixed in Slice 3; ledger rows 35/53 flip to HAVE
there.

Same-file is settled and green (`ATM-SITE-28`):

```ts
let color = 'red'
color = 'blue'
css({ color })
// → nothing for color; ATM-W-MUTATED-BINDING 'color' (reassigned at app.ts:2:1)
// never the stale red
```

Member write poisons the **root**. HQ: an edge case and incorrect
usage; the contract says so and moves on:

```ts
let theme = { primary: 'red' }
theme.primary = 'blue'
css({ color: theme.primary })
// → nothing for color; ATM-W-MUTATED-BINDING 'theme' (written at app.ts:2:1)
// the write is on `.primary`; the poison is on `theme`. Don't mutate style objects.
```

Cross-file, reframed with a raw value the way HQ asked (a token path was
the wrong example — `amber.500` is the token resolver's story):

```ts
// tokens.ts
export let glow = '#f59e0b'          // never written here

// unrelated.ts
let glow = '#111'
glow = '#222'                        // a different binding, same name

// app.ts
import { glow } from './tokens'
css({ color: glow })
// walk today  → sheet: color: #f59e0b   (origin unmutated; `poison_is_precise_to_the_origin_file`)
// bag today   → can over-drop: the *name* glow was written somewhere (fail-closed, wrong)
// Forge       → sheet: color: #f59e0b   always. Import bindings resolve to Origin or refuse; no bag.
```

Mechanics: `scope/lookup.rs` `ImportLookup::Binding { fallback }` and
the name-wide `scoped.mutation()` check on uses are retired for import
bindings in Slice 3. An import resolves through the graph to
`Origin(file, name)`; its mutation state is the origin file's. A name
the graph cannot resolve diagnoses at the site. Station: `ATM-SITE-84`
(this shape; the walk and the site agree).

---

## 4. null-const

**Verdict: A — silent strip, like literal null.** HQ agrees: once `n`
is resolved, the value is a hole; warning "dynamic" is a lie.

```ts
css({ color: 'brand', backgroundColor: null })   // entry 03 / NEO-CSS-05: strips, silent

const n = null
css({ color: n, padding: '4px' })
// today → sheet: padding: 4px; ATM-W-DYNAMIC-IDENTIFIER 'n'
// Forge → sheet: padding: 4px; no diagnostic
```

Mechanics: `scope/init.rs` `literal_leaf` and `constants/collect.rs`
`literal_leaf` have no `NullLiteral` arm, so `const n = null` indexes
nothing and the use falls to the dynamic-identifier path. `AtomValue::Null`
already exists and `fold/unary.rs` already strips it. Add the arm; the
identifier path then sees a Null leaf and takes the existing strip.
Station: `ATM-SITE-82`.

---

## 5. Pure helper in a const init (39-F3)

**Verdict: A — fold.** Two spellings of one program must not split the
dialect. Entry 39 becomes clean HAVE.

```ts
const getColor = () => 'red'
css({ color: getColor(), margin: '13r' })
// → sheet: color: red; margin: calc(13 * var(--spacing-root)) | map: "color:red", "margin:13r"

const calledColor = getColor()
css({ color: calledColor, margin: '13r' })
// today → margin only; ATM-W-DYNAMIC-IDENTIFIER 'calledColor'
// Forge → identical to the line above
```

Mechanics: `fold/fence_attach.rs` `attach_pure_fns` lowers *callable*
inits onto bindings; `scope/init.rs` `binding_init` has no
`CallExpression` arm. Add a **post-attach init pass** in scope collect:
after descriptors are attached (local or via the graph), a
`CallExpression` init whose callee is a known `PureFn` and whose args
fold evaluates through the existing fence and records the result as
`BindingInit::Scalars` / `Object` / `Array`. Same fence, no interpreter.
Harvest already minted `'red'` and `'13r'`; this pass silences the site.
Station: `ATM-SITE-80` (`ATM-SITE-31` `f3` arm flips from
refuse-with-diagnostic to fold; README updated).

---

## 6. Namespace / default *value* imports (S13)

**Verdict: A — permanently match v2.** Named imports are the dialect.
S13 is struck from unfinished work.

```ts
// tokens.ts
export const brand = 'red'
export default { color: 'red', padding: '4px' }

// app.ts
import * as t from './tokens'
import tokens from './tokens'
css({ color: t.brand })     // → nothing for color; ATM-W-DYNAMIC-MEMBER; sink (color)
css(tokens)                 // → nothing; ATM-W-NON-OBJECT-CSS-ARG (identifier 'tokens')
// harvest: 'red' is written in tokens.ts → "color:red" minted → runtime t.brand === 'red' paints
```

Site identity through a namespace (`ui.css(...)`, `ATM-SITE-55` /
`NEO-SITE-28`) is pinned and unaffected. The module graph's export table
**records** default and namespace edges as data — barrels need the same
table for `export * from` (a Slice 3 requirement) — but atomic does not
fold *values* through `import *` or `default`. They refuse with the
diagnostics above, which is the contract. Token paths (`export const
brand = 'gray.800'` read as `t.brand`) and default-as-style-object still
need named imports. Do not build S13 to get `red` through a namespace;
harvest already did.

---

## 7. `__proto__`

**Verdict: A — out of axis. Closed.** Panda `mergeProps` drops
`__proto__` so a spread cannot pollute `Object.prototype`. Neo merges
cascade slots, not objects; MERGE-01 / 02 / 05 cover the outcome.
`css({ ['__proto__']: {…} })` is not an extraction shape anyone writes;
no key-ban, no station. The voyage-log line closes with this sentence.

---

## 8. Mutation wording

**Verdict: A — sign SITE-28.** §3 is C; nothing later falsifies this.

The arms, in one place:

```ts
let color = 'red'; color = 'blue'
css({ color })                          // → drop + ATM-W-MUTATED-BINDING naming the assignment

let count = 1; count += 1
css({ order: count })                   // → drop (compound is a write)

let bump = 2; bump++
css({ order: bump })                    // → drop (update is a write)

let theme = { primary: 'red' }; theme.primary = 'blue'
css({ color: theme.primary })           // → drop; poison is the root `theme`

let picked = 'red'; for (picked of ['blue']) {}
css({ color: picked })                  // → drop (for-of head is a write)

let palette = { color: 'red' }; palette.color = 'blue'
css({ ...palette, padding: '4px' })     // → padding: 4px only; palette dropped, named

delete obj.prop                         // SPEC-V2-81
css({ ...obj })                         // → drop + `deleted at file:line:col`
```

**The sentence (quotable):**

> A tracked write to a binding — assignment, compound assignment,
> update, `for-of` / `for-in` head, `delete` — poisons that binding in
> its own file: uses drop with a located `ATM-W-MUTATED-BINDING` naming
> the write, never a stale value. A write through a member path
> (`theme.primary = …`) poisons the root binding (`theme`), not the
> path. Across files, poison is precise to the origin binding: a
> same-named write in another file never blocks an import that resolves
> to an unmutated export. Unmutated `let` / `var` / `export let` fold
> like `const`.

The cross-file clause is delivered by Slice 3; the ledger quotes the
sentence when 35/53 flip. The Ph1 quarantine ends with this file.

---

## 9. Freestyle CSS is not a token path

**Verdict: A — the alphabet fences the resolver.** The engine already
paints these (`NEO-CSS-07`); the warning told authors they were wrong.
They were not. **Seen:** 13 Book hits (`rgba(…)` × 12,
`translateX(1.25rem)` × 1).

```ts
css({ color: 'rgba(255,255,255,0.04)' })
// → sheet: color: rgba(255,255,255,0.04)   paints. Good.

<Overlay.Backdrop bg="rgba(0,0,0,0.5)" />
// today → paints AND ATM-W-UNKNOWN-TOKEN-PATH `rgba(0,0,0,0.5)`
// Forge → paints, silent

style={{ transform: checked ? 'translateX(1.25rem)' : 'translateX(0)' }}
// today → ATM-W-UNKNOWN-TOKEN-PATH `translateX(1.25rem)`
// Forge → silent (rgb(251 146 60 / 0.3) already passed — it has a space)
```

### Why

`resolve/tokens/mod.rs` `looks_like_token_path`: "not empty, not `#`,
no space, contains `.`, first segment has a letter." `rgba(0,0,0,0.5)`
has a `.` in `0.5` and no space; its first dotted segment `rgba(0,0,0,0`
has letters → true. Comma-`rgba` is the spelling authors write. The
resolver asked the token question first.

### The fix

Ask the alphabet first. In `resolve_token_value`, after the `var(`
early-return: if `canon::classify_css_value(v)` or the rhythm recognizer
accepts the whole value, pass through with no dictionary lookup and no
diagnostic. **CSS wins over tokens for complete CSS values** — already
the contract for `black` / `white` today. A dotted value with no `(`
that the alphabet rejects still warns `UNKNOWN-TOKEN-PATH` — that is
the 31 missing `ui.*` names, and those warnings are true. Station:
`ATM-TOKEN-14` (comma-rgba, `translateX`, `color-mix`, `calc`, `url`,
`oklch` all silent; `ui.missing.path` still warns).

---

## 10. Corner radius longhands take radii tokens

**Verdict: A — map every radius longhand to `radii`.** Typegen already
types them `StylePropValue<RadiusToken>`; the types and the resolver
disagree. **Seen:** Calendar range cells, 4 warnings.

```ts
<Button borderRadius="full" />
// → sheet: border-radius: var(--radii-full)

<Td borderTopLeftRadius={rangeStart ? 'full' : undefined} />
// today → ATM-W-TOKEN-CATEGORY-MISMATCH; passthrough `full` (not CSS; the pill doesn't round)
// Forge → sheet: border-top-left-radius: var(--radii-full)
```

Mechanics: `resolve/tokens/scale.rs` `shape_category` maps only
`borderRadius | rounded`. Add the twelve longhands canon already knows
(`borderTopLeftRadius`, `borderTopRightRadius`,
`borderBottomLeftRadius`, `borderBottomRightRadius`,
`borderStartStartRadius`, `borderStartEndRadius`,
`borderEndStartRadius`, `borderEndEndRadius`, and the side groups
`borderTopRadius` / `borderBottomRadius` / `borderLeftRadius` /
`borderRightRadius`). Mirror in `static_css` wildcard expansion, as the
file header instructs. Station: `ATM-TOKEN-15`.

---

## 11. Unique-name steals `radii.sm` for the wrong prop

**Verdict: A — no unique-name lookup across categories; color props
keep a true warning.** **Seen:** 18 Book hits; lead spelling `size="sm"`
(which §14 removes from the resolver entirely).

```ts
<Span fontSize="sm" />
// today → ATM-W-TOKEN-CATEGORY-MISMATCH "token `sm` belongs to category `radii`…"; passthrough
// Forge → passthrough `font-size: sm`, silent — same as `fontSize="larger"` or `width="auto"` today.
//         (invalid CSS; the browser drops it; nothing paints — the honest outcome for a scale the lib does not have)

<Div color="md" />
// today → the radii story
// Forge → ATM-W-UNKNOWN-COLOR "`md` is neither a color token nor a CSS color"

<Div borderRadius="sm" />
// → sheet: border-radius: var(--radii-sm)   unchanged
```

### Why

`lookup_entry` misses `sizes.sm` (lib has no `sizes` / `fontSizes` /
`shadows` scales), then `warn_unresolved_token` calls
`token_by_unique_name("sm")`, finds `radii.sm`, and prints a story about
radii. The author typed a control size.

### The fix

- Bare (non-dotted) values on a prop that **owns a category** miss
  silently and pass through — consistent with every other bare word.
  `token_by_unique_name` stays only for custom properties (`--brand:
  red.500`), which `lookup_entry` already special-cases.
- `TokenCategoryMismatch` stops being emitted. The code stays in
  `codes.rs` for wire stability (never rename a pinned code); document
  it as retired.
- Color props get the one true diagnostic the alphabet makes possible,
  because the color grammar is closed: a bare value on a color prop
  that is neither a token nor alphabet-CSS is `ATM-W-UNKNOWN-COLOR`.
  Length props do not get an equivalent (their keyword set is open).

Adding `sizes` / `fontSizes` / `shadows` scales to the lib theme is a
theme conversation, not Forge. Station: `ATM-TOKEN-16`.

---

## 12. Host keys in a JSX spread bag

**Verdict: A — a spread bag on a JSX host has attribute semantics, not
`css()` semantics.** **Seen:** 46 warnings, all from `disclosureChrome.ts`
spread onto Accordion / Collapsible triggers.

```ts
export const dividerTrigger = {
  color: 'design.text.base',
  borderBottomColor: 'gray.700',
  _hover: { bg: 'ui.button.mutedBackground' },
  css: { paddingInline: '0.5rem', backgroundColor: 'transparent', /* … */ },
  style: { borderRadius: 0, display: 'flex' } as CSSProperties,
}

<Collapsible.Trigger {...dividerTrigger}>
// today → color, borderBottomColor, _hover extract; ATM-W-UNKNOWN-PROPERTY "css", "style"
// Forge → css: recursed as the css prop → padding-inline: 0.5rem; background-color: transparent; …
//         style: silent (native style prop — the host's business)
//         data-*, aria-*, onClick, className: silent (DOM namespace, SITE-07/08)
```

The same keys written as JSX attributes never warned:

```ts
<Collapsible.Trigger color="design.text.base" css={{ paddingInline: '0.5rem' }} style={{ borderRadius: 0 }} />
```

### Why

`extract/jsx/mod.rs` hands `{...bag}` to `walk_spread_argument` with an
`object_walk` context, and `expressions/object.rs`
`handle_object_property` fires `UnknownProperty` for any key that is not
a condition or a known style prop. That rule is right for `css({ css: 1
})` — nonsense CSS. It is wrong for a bag whose keys are *attributes*.

### The fix

`ObjectWalk` carries a `bag: BagSemantics::{StyleObject, JsxAttributes}`
flag. Under `JsxAttributes`: `css` and `r` recurse exactly like their
attribute spellings (`walk_style_attr` / `walk_r_attr`), condition props
and style props extract, everything else is silent. `UnknownProperty`
never fires from a JSX bag. `css({ css: 1 })` keeps its warning. Station:
`ATM-SITE-83`.

---

## 13. Const alias of a nested style object

**Verdict: A — member-path inits record objects, not just leaves.** Same
program as the inline spelling; refusing one spelling of "name a static
thing" while accepting the other is the §5 dialect split. **Seen:**
Slider, 1 hit, plus every other `focusRing` site in
`core/theme/primitives/shared.ts`.

```ts
export const focusRingStyles = {
  outline: '2px solid transparent',
  _focusVisible: { outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '2px' },
} as const

export const focusRing = focusRingStyles._focusVisible

<Slider.Thumb _focusVisible={focusRing} />
// today → ATM-W-NON-OBJECT-JSX-STYLE "'_focusVisible' … not a static style object (identifier 'focusRing')"
// Forge → map: "_focusVisible:outline:2px solid", "_focusVisible:outlineColor:ui.focus.ring" (→ var(--colors-ui-focus-ring)),
//              "_focusVisible:outlineOffset:2px"   — identical to the inline spelling
<Slider.Thumb _focusVisible={focusRingStyles._focusVisible} />   // already folds today
```

### Why

`scope/collect.rs` `member_init` stores only `BindingInit::Scalars` from
`member_path_leaves`; when the path lands on a nested object
(`PathHit::Object`) the leaves are empty and the init is `None`, so the
JSX block lookup misses. `scope/value.rs` also notes "member spreads
(`...styles.hover`) ride a follow-up: recording them needs member-path
reads at collect time." One feature closes both.

### The fix

`member_init` records `BindingInit::Object(nested)` when the path lands
on an object, with `Dep` provenance so `strip_stale` still poisons it if
the root is written. `record_spread` gains a `StaticMemberExpression`
arm through the same read (`...styles.hover`). Station: `ATM-SITE-81`
(alias as JSX condition block; alias spread into `css()`; member spread).

---

## 14. Declared component props shadow StyleProps

**Verdict: A — a host's own declared props are not style props on that
host.** New row, so §11 leaves no "unless HQ wants a fourteenth" behind.

```ts
<Button variant="secondary" size="sm" />
// today → `size` is a REFERENCE_PROPS macro → width: sm; height: sm → §11 radii story ×2
// Forge → `size` is Button's variant prop; the resolver never sees it. No wants, no warning.

<Div size="2r" />
// → sheet: width: calc(2 * var(--spacing-root)); height: … — Div declares no `size`; the macro stands.
```

Mechanics: styletrace already traces each host's props declaration to
decide the StyleProps surface. Expose the host's **own declared prop
names** on `StyleSurface` (`owned_props`); atomic's `is_style_attr_name`
becomes host-aware (`ctx.host_owns(tag, name)` short-circuits). Owned
names that collide with `is_known_style_prop` — `size`, `weight`,
`variant`, anything a component declares — are attributes on that host.
Work sits in styletrace (surface) + atomic `hosts/` (consumer). Station:
styletrace unit + `ATM-SITE-85` (Button `size` silent, Div `size` folds).

---

# Part III — Book census and target

Lib neo sync, 2026-09-19: **213**. Every row is either a gap Forge
closes or noise that is honest.

**Gaps — closed by Forge (82)**

| n | Terminal | Row | Slice |
|---|---|---|---|
| 12 | unknown token path `rgba(…)` | §9 | 1 |
| 1 | unknown token path `translateX(1.25rem)` | §9 | 1 |
| 4 | token `full` is `radii`, used on `borderTop*Radius` | §10 | 1 |
| 18 | token `sm`/`lg` is `radii`, used on `width`/`height`/`fontSize`/`boxShadow` | §11 + §14 | 1, 5 |
| 46 | Unknown style property `"css"` / `"style"` | §12 | 2 |
| 1 | JSX `_focusVisible` is not a static style object (`focusRing`) | §13 | 2 |

**Noise — honest, stays (131)**

| n | Terminal | Why it stays |
|---|---|---|
| 74 | Dynamic object spread (`{...props}` / `{...style}`) | Rest on a styled host is runtime. Production will do this. Siblings kept, warn, move on. Values consumers author at call sites paint (their sites mint). |
| 31 | unknown token path `ui.button.mutedBackground` (and `ui.panel.background`, `ui.status.error.*`, `design.positive.text`, `design.bg.muted`) | **Not in the dictionary.** `colors.ui.button` has `background`, `foreground`, `disabled.*`; nearest real token is `ui.table.row.mutedBackground`. Lib authorship, not an extract hole. |
| 15 | Dynamic non-literal expression (ternary `height={scale.height}`) | Runtime value. After Slice 4 the authored arms paint. |
| 10 | Dynamic identifier (`offset`, `color`, `theme`, `css={css}` as a param) | Fail-closed on a name we cannot see. After Slice 4 the authored values paint. |
| 1 | StyleTrace failed to read `react.d.mts` | Host path. Out of axis. |

**Target: 213 → 131**, every remaining line true, countable by code.
Today the neo sync printer (`src/sync/index.ts` `reportWarningDiagnostics`)
prints messages only — neo's `NativeDiagnostic` has no `code` field even
though the Rust `Diagnostic` carries `ATM-W-*`. Slice 0 surfaces the
code (`[neo] sync warning ATM-W-UNKNOWN-TOKEN-PATH: …`) so this census
and every Doom cycle can be measured by `rg -c`, not by reading prose.

---

# Part IV — Architecture

Two subsystems. Both are compilers' furniture, not features: small
enough to analyze, fail explicitly, pass state in types, no `#[allow]`,
files under 365/500, functions under 80, ≤ 5 args via context structs
(`AGENTS.md` §4). Both parse with the workspace's one parser
(`oxc_parser` 0.115).

## A. Alphabet + harvest

**Alphabet — `canon/src/css/values/`** (canon has no deps; the property
table is already there).

- `named_colors.rs`: the 148 CSS named colors + `transparent` +
  `currentcolor`, sorted, binary-searched, case-insensitive. Seed from
  reference-core's `CSS_COLOR_KEYWORDS`; that TS set becomes a consumer
  later, not a second source of truth now.
- `functions.rs`: color-function prefixes; math/transform/misc
  prefixes; balanced-paren check on the whole string.
- `lengths.rs`: unit table (`px rem em % vw vh vmin vmax dvh svh lvh ch
  ex cap ic lh rlh cqw cqh cqi cqb cqmin cqmax deg rad turn s ms fr`) +
  `0`. Reuse `resolve/shorthands/parser.rs` `is_length_width` as the
  seed, then make canon the owner and the parser a consumer.
- `classify.rs`: `pub fn classify_css_value(&str) -> Option<ValueKind>`
  with `ValueKind::{Color, Length, Transform, Math, Url, Keyword}`, and
  `pub fn prop_accepts(prop, ValueKind) -> bool` from the property
  table (`is_color_prop` for Color; spacing/size/inset/radius/border-
  width/font-size/line-height/letter-spacing/gap for Length; `transform`
  for Transform; Math → Length props; Url → background/mask/list-style).
- Rhythm stays atomic's: `atomic::extract::harvest::classify` =
  rhythm-recognizer (`resolve::rhythm::resolve_single_rhythm` /
  fragments) **then** `canon::classify_css_value`.

**Harvest — `atomic/src/extract/harvest/`**

- `literals.rs`: one visitor over each compile input's AST collecting
  `StringLiteral` and hole-free `TemplateLiteral` values; classify;
  dedupe into `HarvestPool: BTreeMap<ValueKind, BTreeSet<Box<str>>>`.
  Strings only. Compile inputs only.
- `sinks.rs`: the walk records a `Sink { prop, when, kind }` whenever it
  emits a `Dynamic*` diagnostic in value position (one hook in
  `ExtractContext::warn`-adjacent code, not fifteen call sites). Spread
  sinks are not recorded (no prop).
- `mint.rs`: after the site walk, `pool × sinks` (kind-compatible) →
  `Want { prop, value, when, origin: Origin::Harvest }` into the same
  wants vector. Resolve runs unchanged (rhythm lowers, tokens are never
  consulted for alphabet values per §9). `AtomSet` dedupes against site
  atoms. One namer.
- Diagnostics: no new warnings. One `ATM-I-HARVEST-SINK` info per sink
  (`"color under [_hover]: 9 harvested values minted"`) so stations can
  assert counts and the Book can explain itself. Info codes are already
  reserved (`ATM-I-…`).
- Resolver fence (§9): `resolve_token_value` consults `classify` before
  the dictionary.

**Runtime:** no change. neo `css()` keys by authored string.

## B. Module graph — shared crate `modules/module-graph` (`module_graph`)

Three copies of the same ladder exist today:

| Owner | Where | Has | Lacks |
|---|---|---|---|
| atomic | `extract/resolver/{specifier,tsconfig,package,bare}.rs` (+ `exports`, `walk`, `overlay`, `cache`; ~2.7k lines incl. identity) | relative, `tsconfig` `paths`/`baseUrl`, extension + index probing, `node_modules`, `package.json` `exports` incl. `*` patterns, `export … from` hops, cycle guard, per-compile cache | `export * from`, default / namespace edges, FS abstraction, one-parse |
| tasty | `scanner/packages/*`, `scanner/paths/*`, `ast/resolve/index.rs` | declaration-oriented extensions (`.d.ts/.d.mts/.d.cts/.ts/.tsx`), `exports` conditions, `@types` fallback, ancestor `node_modules`, symlinks, `export *` fan-out with cycle guard, proptests on path normalization | `tsconfig` paths, open `.js/.jsx` probes, `exports` `*` patterns, FS abstraction, `export * as ns` |
| styletrace | `resolver/path.rs` + `tasty::resolve_external_import_path` | runtime extensions (`.mts`), `dist → src` sync-root remap | everything else (delegates packages to tasty) |

Atomic's is the strongest template (aliasing, values). Tasty's has the
declaration policy and the `export *` fan-out. The shared crate takes
the **path / specifier / `package.json` / `tsconfig` ladder and the
module record + origin walk**, and leaves each consumer its semantics:
atomic keeps values (bags, `ResolvedExport`, `PureFn` descriptors),
tasty keeps its type IR, styletrace keeps the JSX host tracer.

**Owns**

1. `fs.rs` — `trait FileSystem { read_to_string, is_file, is_dir,
   read_dir, canonicalize }`; `DiskFs`; `MemoryFs` for tests and
   virtual compiles. No consumer touches `std::fs` for module
   resolution after adoption.
2. `key.rs` — normalized absolute path keys (atomic `normalize_key`,
   tasty `file_id`) as one `ModuleKey`.
3. `ladder/` — `SpecifierLadder::resolve(from, specifier) ->
   Result<ModuleKey, Unresolved>`: relative join; `tsconfig` `paths` /
   `baseUrl` (lifted from atomic); extension probing under an
   `ExtensionPolicy::{Source, Declarations}` (atomic vs tasty); index
   probing; `.js/.mjs/.cjs → .ts/.tsx/.d.ts` sibling remap; ancestor
   `node_modules`; `package.json` `exports` with conditions and `*`
   patterns (atomic), `types` / `typings` / `module` / `main`, `@types`
   fallback (tasty); symlinks via `canonicalize`.
4. `record.rs` — `ModuleRecord::collect(&Program) -> ModuleRecord {
   imports: Vec<ImportEdge { local, imported: Named | Default |
   Namespace, specifier }>, exports: ExportTable { Local(name),
   Hop(name → (specifier, imported)), Star(specifier), Default(local |
   hop) } }`. Allocator-agnostic: the **consumer parses once** and hands
   `&Program`; the graph never owns an AST (oxc allocator lifetimes stay
   with the consumer).
5. `graph.rs` — `ModuleGraph<L: Loader>`: demand-driven `ensure(key)`
   through a consumer `Loader` (read via `FileSystem`, parse, collect the
   record, and whatever consumer-side values it wants to attach);
   `is_input(key)` (site set vs values-only) is consumer data.
6. `walk.rs` — `resolve_binding(from, local) -> Result<Origin { file,
   name }, Refused>`: follows `Hop`, fans out through `Star` (exactly one
   declaring target wins; two → `Refused::Ambiguous`), memoized, with
   `Refused::{Cycle, Unresolved(specifier), MissingExport, Namespace,
   Default}` as **data** — consumers word the diagnostic.
7. `tests/` — `MemoryFs` fixtures for every ladder rung, the tasty
   proptests lifted, `export *` ambiguity, cycles, aliasing, symlinks.
   The crate is provable on its own, without atomic or tasty.

**Does not own:** values, types, JSX hosts, ASTs, diagnostics wording.

**Atomic adoption (Slice 3)**

- `extract/resolver/` collapses to a thin `ValueGraph` over
  `module_graph`: `value_of(Origin) -> Option<ResolvedExport>`,
  demand-driven and memoized, chasing import bindings inside the origin
  file through `resolve_binding` and resolving *their* origins first
  (in-progress set → `Refused::Cycle`). This replaces
  `overlay_scope_values` and the merged-bag bake; it is what folds §1.
- One parse per source file per compile (down from three).
- Import bindings never consult the name-wide bag (§3). Unresolved →
  residue marker at the spread + site diagnostic (§1 diagnose floor).
- `export * from` barrels resolve for named imports (new); default /
  namespace edges are recorded and refused with today's diagnostics (§6).
- `ATM-SITE-39 / 55 / 77 / 28 / 31` goldens must not change except
  where a coincidence-fold through the bag becomes an honest diagnostic
  (READY ask 3 lists those in advance).

**StyleTrace adoption (Slice 3, same crew):** `resolver/path.rs` and the
`tasty::resolve_external_import_path` call become `SpecifierLadder`
with `ExtensionPolicy::Source` + the sync-root remap kept as a styletrace
`Loader` concern.

**Tasty adoption (Slice 6, optional, last):** `scanner/packages/*` →
`SpecifierLadder` with `ExtensionPolicy::Declarations`; `export *`
fan-out → `walk.rs`. Tasty's vitest is already red on golden drift
(ledger §6); adoption lands behind its own goldens and never gates
Forge.

## Requirements (testable)

**R-A — alphabet + harvest**
- A1. `classify_css_value` accepts every example in Part I's alphabet
  table and rejects `'hello'`, `'sm'`, `'ui.button.mutedBackground'`,
  every template with a hole. Unit-tested in canon.
- A2. `resolve_token_value` never emits `UNKNOWN-TOKEN-PATH` or
  `TOKEN-CATEGORY-MISMATCH` for a value the alphabet or rhythm
  recognizer accepts (§9).
- A3. Harvest mints only `pool × sinks` of compatible kind, with the
  sink's `when`. A program with zero dynamic sites emits zero harvest
  atoms. Spread sinks do not exist.
- A4. Strings only; compile inputs only; no numbers; no `node_modules`.
- A5. Harvest never emits a warning. One `ATM-I-HARVEST-SINK` per sink.
- A6. One `AtomSet`, one namer, no new artifact. `runtime-data.mjs`
  schema unchanged (`schemaVersion: 1`).
- A7. Zero ghost classes (standing gauge `ATM-GHOST-01`).

**R-B — module graph**
- B1. The crate compiles and tests with `MemoryFs` only; no `std::fs`
  outside `DiskFs`.
- B2. Every rung of the ladder has a fixture: relative, alias, index,
  extension remap, `exports` conditions, `exports` `*`, `types` /
  `main`, `@types`, ancestor `node_modules`, symlink.
- B3. `resolve_binding` returns `Refused` (never `None`, never a panic,
  never stale) for cycle, missing export, unresolvable specifier,
  ambiguous star, namespace, default.
- B4. Atomic parses each source exactly once per compile.
- B5. The nested-import spread (§1) folds; the cycle arm diagnoses.
- B6. Import bindings do not fall back to the bag; §3's shape folds
  `#f59e0b`.
- B7. Existing atomic stations stay green except the pre-listed
  coincidence-folds (READY ask 3), each of which becomes a located
  diagnostic, not silence.
- B8. StyleTrace's `neo_decl_roots` fixture and the lib tree resolve to
  the same hosts before and after adoption (zero drift, the styletrace
  mission's own gauge).

**R-C — rulings**
- C1–C14. One station per row as named in Part II; the Part III census
  drops to 131 on the lib Book (`pnpm --dir packages/reference-lib sync`,
  counted by code).
- C15. Ledger §5 rows: S13 struck; 39-F3 → HAVE; 35/53 → HAVE; Ph1
  wording quarantine lifted; `__proto__` closed; null-const closed;
  Doom seed 1 fortified; runtime-table coincidence signed.

**R-D — gates**
- D1. `pnpm agentrs q` zero errors on every touched file. Files already
  over the cap that a slice touches — `scope/collect.rs` (838),
  `expressions/object.rs` (842), `expressions/walk.rs` (710) — are split
  **first**, in their own commit, behavior-neutral, goldens unchanged.
- D2. No `#[allow(clippy::…)]`. Context structs over argument soup
  (`ObjectWalk`, `ExtractContext`, `ValueGraph`, `Ladder`).
- D3. Neo cases via `pnpm agentneo`; Rust via `pnpm agentrs`; lib CT
  untouched (no lib edits in Forge; the 31 missing `ui.*` tokens are a
  lib follow-up, not this mission).

---

# Part V — Slices

Order is dependency order. Each slice is one crew, one lane, one commit
series, its own stations. No slice reaches into another's files except
through the shared crate's API.

| # | Slice | Lane | Rows | Stations | Depends on |
|---|---|---|---|---|---|
| 0 | **Paperwork + census by code.** Sign §2 / §8 sentences into the ledger; strike S13; close §7; update `doom-agent.md` §8 to point at Slice 3; neo sync printer surfaces `ATM-W-*` codes. | agent-neo (printer), docs | §2, §6, §7, §8 | — | — |
| 1 | **Resolver quick wins + alphabet tables.** canon `css/values/`; §9 fence; §10 longhands; §11 no cross-category unique-name + `UNKNOWN-COLOR`; §4 null arm. Four independent one-file changes on a shared table. | agent-rs | §4, §9, §10, §11 | `ATM-TOKEN-14/15/16`, `ATM-SITE-82` | — |
| 2 | **Scope collect.** Split the three over-cap files (D1). §13 member-path object inits + member spreads; §5 post-attach init fold; §12 `BagSemantics`. | agent-rs | §5, §12, §13 | `ATM-SITE-80/81/83` | 1 (alphabet not required, but ship after the splits) |
| 3 | **Module graph.** New crate; atomic `ValueGraph` adoption (one parse, demand-driven origins, `export *`, no bag for imports, residue marker); styletrace ladder adoption; §1 fold; §3 precision; sign the cross-file clause of §8. | agent-rs (crate + atomic), styletrace | §1, §3, §8 | crate tests; `ATM-SITE-78/79/84`; `NEO-SITE-29` | 2 (scope changes land first so §1's bake has one home) |
| 4 | **Harvest.** `extract/harvest/`; sinks; mint; info code; the §2 floor. | agent-rs + agent-neo | §2, value halves | `ATM-HARVEST-01..04`; `NEO-CSS-14` | 1 (alphabet), 3 (one parse — harvest rides the same visitor) |
| 5 | **Host surface.** `StyleSurface.owned_props`; atomic host-aware `is_style_attr_name`. Re-run the Book census; assert 131. | agent-rs (styletrace + atomic) | §14, §11 tail | styletrace unit; `ATM-SITE-85`; census log in `docs/evidence/` | 1 |
| 6 | **Tasty adoption** (optional, never gates Forge). | agent-rs | — | tasty goldens | 3 |

**Stations, by name.** Suggested IDs; the slice owner confirms free slots
against `atomic/SPEC.md` and the neo group `SPEC.md`/`TESTS.md`. Every
station README: first line is the claim, name the symbols, cite
siblings, end with `> Search terms:`.

- `ATM-HARVEST-01` — `'red'` only in an array; dynamic `css({ color })`
  exists; `"color:red"` is in `css.json`; one `ATM-I-HARVEST-SINK`.
- `ATM-HARVEST-02` — `` `2${n}r` `` and `` `#${hex}` `` mint nothing;
  the site still warns `DYNAMIC-TEMPLATE`.
- `ATM-HARVEST-03` — sink under `_hover` mints `"_hover:color:…"` only;
  no unconditioned twins.
- `ATM-HARVEST-04` — zero dynamic sites → zero harvest atoms (a static
  program's sheet is byte-identical before and after Slice 4).
- `ATM-SITE-78` — §1 three-file fold + `export *` barrel + cycle arm.
- `ATM-SITE-79` — named import through `export * from` with an
  ambiguous twin → `Refused::Ambiguous` diagnostic.
- `ATM-SITE-80/81/82/83/84/85` — §5, §13, §4, §12, §3, §14 as named.
- `ATM-TOKEN-14/15/16` — §9, §10, §11.
- `NEO-SITE-29` — §1 paints red in a browser. `NEO-CSS-14` — a
  dynamic-site color from a palette array paints; an unwritten color
  does not and the dev console says so once.

**Evidence lands in** `packages/reference-neo/docs/evidence/` (census
before/after by code; the READY-phase answers). Probe scripts live in
`/tmp`, never in the tree. No `--update-goldens` sweeps; every golden
change is attested per pair.

---

## READY-phase asks (read-only; answer in `docs/evidence/`, then HQ flips GO)

1. **Reproduce §1 as a station draft** (`/tmp`, then `ATM-SITE-78`
   input): confirm the drop is `scope/value.rs` `record_spread`'s
   identifier arm (line-cite) and that `overlay_one_file` runs `tokens.ts`
   without `base.ts`'s object in reach. Evidence that the fix must be
   demand-driven, not a reordered pass.
2. **Size the harvest on the lib Book.** Count distinct alphabet-shaped
   string literals in `packages/reference-lib/src` by kind, and count
   sinks by `(prop, when, kind)` from today's 213 diagnostics. Report the
   product. This is H2's evidence; if the product is in the thousands,
   it is a note for Slice 4's sink filter, not a blocker.
3. **Disable the bag fallback for import bindings in a scratch build**
   and run the atomic stations. List every golden that changes. Each is
   either a coincidence-fold (becomes a diagnostic — accept) or a ladder
   gap (fix in the crate). Nothing else may change.
4. **Ladder divergence table.** Run atomic's, tasty's, and styletrace's
   resolvers over one fixture set (relative, alias, index, `.js` remap,
   `exports` conditions, `exports` `*`, `@types`, symlink) and tabulate
   where they disagree. Divergences that would change an existing
   station's output are Slice 3 notes; the table is the crate's first
   test plan.
5. **`export *` in the wild.** Grep lib, core, neo worlds, and matrix
   for `export * from` barrels that a `css()` or StyleProps site imports
   through. Evidence for B-req 6's star fan-out.
6. **Runtime proof without a TS change.** A `/tmp` neo world where
   `'red'` lives only in an array, a dynamic `css({ color })` site
   exists, and the harvested atom is hand-added to `css.json` — confirm
   the page paints red with no runtime edit. Pre-station for `NEO-CSS-14`.
7. **Naming pass** against `packages/reference-neo/docs/DOMAIN.md` and
   the atomic READMEs: `module_graph`, `ModuleRecord`, `ImportEdge`,
   `ExportTable`, `Origin`, `Refused`, `SpecifierLadder`, `FileSystem`
   / `DiskFs` / `MemoryFs`, `ValueGraph`, `HarvestPool`, `Sink`,
   `ValueKind`, `BagSemantics`, `owned_props`. Better names welcome
   before code; the shapes are not up for renegotiation.

**Blocker** = anything that makes one-namer / one-map impossible for
harvest, or makes the module graph unable to answer an existing atomic
station identically (outside the pre-listed coincidence-folds), or makes
zero styletrace host drift impossible. Everything else is a note for the
slice that owns it.

## How this closes

1. Slices 0–5 land in order; Slice 6 is optional and never gates.
2. The lib Book census reads **131**, all honest, counted by code.
3. Ledger §5 is empty except "Entries 14 and 81 pinned"; the quoted
   statement loses its "except" clause.
4. Doom seed 1 is fortified by `ATM-SITE-78`; the doom protocol's cycle 1
   crew (c) starts from a fixed shape.
5. Forge does not write the satisfaction marker. Doom still waits on the
   user's explicit "satisfied."
