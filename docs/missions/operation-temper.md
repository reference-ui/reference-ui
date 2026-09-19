# Mission: Operation Temper

Status: `idea` (HQ, 2026-09-19). Successor to Overmatch, which is
**concluded** — catalog 81/81, ledger quoted, no more language rows.
This is the heat-treat: eight leftover rulings, each with a snippet,
so the quoted sentence is actually true.

Overmatch: [`completed/operation-overmatch.md`](completed/operation-overmatch.md).
Ledger: `packages/reference-neo/docs/evidence/overmatch-ledger.md` §5.
Stations cited here are on disk and green.

## The claim this operation is for

Overmatch already wrote:

> We extract atomic CSS from your tokens, styles and code — and on the
> extraction language we match Panda v2 everywhere it resolves (81 of 81
> catalog entries pinned by green stations, 4 with stated carve-outs) and
> exceed it in 19 pinned superiority rows — except: the S13 value-import
> rider and the four carve-outs…

Temper retires the “except.” Each section below is one verdict. Write
the pick on the **Verdict** line. Suggested picks are suggestions.

One of them is not a taste call. **§1 is silence on idiomatic code.**
That one has to fold or diagnose before the claim is clean.

## What this is not

- Not a recatalog. SPEC-V2-NN IDs do not move.
- Not Doom. Doom is the red-team that follows (`doom-agent.md`); §1 is
  already filed there as seed 1. Temper decides the *shape* so Doom
  isn’t inventing architecture.
- Not firstThatWorks, not StyleTrace, not a product slice.

## The eight, at a glance

| # | Shape | Today | Suggested |
|---|---|---|---|
| 1 | Import, compose, re-export, `css()` the composition | padding lands, color vanishes, **no warning** | **A — fold it** |
| 2 | Refused leaf, another site already minted that atom | can still paint (global class map) | **A — accept, write it down** |
| 3 | Mutation poison across files / member writes | walk is origin-precise; bag still name-wide | **C — root poison in-file; origin-precise cross-file** |
| 4 | `const n = null; css({ color: n })` | warns “dynamic identifier” | **A — silent strip, like literal null** |
| 5 | `const x = getColor(); css({ color: x })` | call-site folds, init does not | **A — fold, same fence** |
| 6 | `import * as t; css({ color: t.brand })` | not resolved (v2 refuses too) | **A — match v2, stop listing it** |
| 7 | `__proto__` keys / Panda `mergeProps` drop | voyage-log leftover, no station | **A — out of axis** |
| 8 | Mutation contract wording | SITE-28 green, sentence unsigned | **A — sign SITE-28 once §3 is picked** |

---

## 1. Nested imported-object spread

**Verdict:** open
**Why it matters:** the one hole in the no-silence rule.
**Filed:** `doom-agent-protocol.md` §8. SPEC-V2-55 / 76.

### What already works

Spreading an **imported** object **at the `css()` call** is fine.
`ATM-SITE-39`:

```ts
// styles.ts
export const hover = { color: 'red' }

// app.ts
import { hover } from './styles'
css({ ...hover, backgroundColor: 'blue' })
// → color + background. Good.
```

Composing with a **same-file** const, then importing the result, is
also fine. SITE-28 R3b:

```ts
// tokens.ts
const spreadBase = { color: 'plum' }
export const spreadButton = { ...spreadBase, padding: '9px' }

// app.ts
import { spreadButton } from './tokens'
css(spreadButton)
// → color + padding. Good.
```

### What breaks

Put those two together — import, compose, re-export, then `css()` the
composition:

```ts
// base.ts
export const base = { color: 'red' }

// tokens.ts
import { base } from './base'
export const button = { ...base, padding: '4px' }

// app.ts
import { button } from './tokens'
css(button)
```

**Today:** padding lands, color vanishes, **zero diagnostics**. Same
shape as the working cases; the only difference is that the spread’s
source lives one file further back.

That’s a theme-token file composing a base recipe. Not a trick.

### Why

Ph4 can follow `import { button }` to `tokens.ts` and see `padding`.
The `...base` inside that object was recorded as a spread, but the
overlay never walks `base` back to `base.ts` **at collect time**.
Same-file `spreadBase` is in scope, so it folds. Cross-file `base` is
an import, so that slice of the object is just gone. Gone-without-a-warning
is the fail-open the crate treats like a ghost class.

### Fork

| | Result for the snippet above |
|---|---|
| **A. Fold it** | `css(button)` emits `color: red` and `padding: 4px`, same as if `base` were local. Chase origin-imports during collection. |
| **B. Diagnose it** | Keep padding, drop color, but warn at the spread (or at the `css()` use) that `base` couldn’t be read. Legal under fold-or-diagnose; worse product — this is a static object. |
| **C. Leave it for doom cycle 1** | Don’t pick A/B here; first doom crew reproduces, architect signs the shape, then build. Process, not a third behavior. |

Suggested: **A**. B is how we treat *dynamic* spreads (`...unknown`).
This source is a const object with a known origin. C is sequencing,
not a reason to keep today’s silence.

---

## 2. Runtime-table coincidence — refused leaves can still paint

**Verdict:** open
**Why it matters:** a “fix” here fights atomic identity. Architect
ruling, not a blind patch. Not a station gap.

The engine emits one global class map: `(prop, value, when)` → class.
Site A mints an atom; site B can look it up at runtime even if extract
refused B’s leaf.

```ts
// Button.tsx — static, mints color:red into the sheet and the map
css({ color: 'red' })

// Card.tsx — extract refuses the identifier (dynamic)
function Card({ color }: { color: string }) {
  return css({ color, padding: '4px' })
  // compile: padding atom + diagnostic on `color`. no color class on this site.
}

// runtime: <Card color="red" />
```

If runtime `css()` looks up `color`/`red` in the **global** map, Card
paints red because Button already minted it. Extract said no; the sheet
said yes.

| | Meaning |
|---|---|
| **A. Accepted** | Atomic sharing is the product. Extraction refusal means “this site will not mint,” not “this value must never paint.” Document it. |
| **B. Fail-closed** | A refused leaf must not paint even if the class exists. Runtime would have to know which sites minted which atoms — a second identity, against one-namer / one-map. |

Suggested: **A**, in writing. B is a different compiler.

---

## 3. Poison precision — name-wide vs the binding

**Verdict:** open
**Why it matters:** SPEC-V2-35 / 53 are HAVE* until this is a sentence
HQ will quote. Related to §1 (how far a cross-file object reaches)
and §8 (the quarantined wording).

Same-file mutation is settled and green (`ATM-SITE-28`):

```ts
let color = 'red'
color = 'blue'
css({ color })
// zero wants, warning: Dynamic mutated binding 'color' (reassigned at …)
// never the stale 'red'
```

Member write poisons the **root**:

```ts
let theme = { primary: 'red' }
theme.primary = 'blue'
css({ color: theme.primary })
// drops. the write is on `.primary`; the poison is on `theme`.
```

The walk itself is already origin-file precise (unit test
`poison_is_precise_to_the_origin_file`): a `let x = …; x = …` in
`other.ts` does **not** block `import { x } from './tokens'` when
tokens exported a const `x`. Ph4 did that.

What is still name-wide: bag-fallback reads and baked entries. Any
write to the name `glow` in the project can poison a fallback reader
of `glow`, including a different binding.

```ts
// tokens.ts
export let glow = 'amber.500'          // never written here

// unrelated.ts
let glow = 'x'
glow = 'y'                             // a different binding, same name

// app.ts
import { glow } from './tokens'
css({ color: glow })
// walk: should fold (origin is the unmutated export)
// bag fallback: can over-drop because the name `glow` was written somewhere
```

The note said name-wide was temporary “until the binding walk lands.”
The walk landed. Precision was never revisited.

| | Contract |
|---|---|
| **A. Keep name-wide on fallback** | Cheap, still fail-closed (never stale-resolves). Accept over-drop as the bag’s price. Write that down so §8 can close. |
| **B. Follow the walk everywhere** | Only readers of *that* origin poison. Drop the bag for values the walk can answer. Same family of work as S13’s export tables. |
| **C. Keep member-root poison; tighten only cross-file names** | `theme.primary =` still poisons `theme`. Cross-file `glow` only poisons the origin file’s `glow`. |

Suggested: **C** is the honest current-plus. A is “we meant the
over-drop.” B is a follow-up mission, not a one-line fix.

---

## 4. null-const — identifier null vs literal null

**Verdict:** open
**Why it matters:** no owning catalog entry. Voyage-log leftover.
Observed by a Ph5 probe, not pinned.

Literal null is a hole. Entry 03 / `NEO-CSS-05`:

```ts
css({
  color: 'brand',
  backgroundColor: null,   // strips, silent, siblings kept
})
```

A const bound to null is currently an identifier:

```ts
const n = null
css({ color: n })
// today: warning `Dynamic non-literal identifier 'n'`, skip, siblings kept
```

Unary already treats a folded null leaf as a strip
(`fold/unary.rs`: `const n = null; -n` — null strips). So the engine
*can* see const-null as Null; the `css({ color: n })` path just
doesn’t use that.

| | `const n = null; css({ color: n })` |
|---|---|
| **A. Same as literal null** | Silent strip, like entry 03. `n` resolved; the value is the hole. |
| **B. Keep today’s warning** | Identifiers that aren’t style values stay fail-closed. `null` as a name is not the same authorship as a `null` literal in the object. |

Suggested: **A**. Once you resolve `n`, you have Null. Warning that it
is “dynamic” is a lie — it isn’t.

---

## 5. Pure helper in a const init (39-F3)

**Verdict:** open
**Why it matters:** SPEC-V2-39 is HAVE* until this is fold or
accepted-refuse. Pinned at `ATM-SITE-31` (`pure.ts` `f3`).

Call-site folds:

```ts
const getColor = () => 'red'
css({ color: getColor(), margin: '13r' })
// color folds to red, margin kept. Good.
```

Park the same call in a const, then use the name:

```ts
const getColor = () => 'red'
const calledColor = getColor()
css({ color: calledColor, margin: '13r' })
// today: margin kept; color warns DynamicIdentifier 'calledColor'
// v2 folds both spellings
```

The fence folds **at call sites only**. A post-attach init pass would
fold `calledColor` after helpers are known. The two spellings are the
same program.

| | |
|---|---|
| **A. Fold it** | Init pass after attach. `calledColor` === `getColor()` at a call site. Entry 39 becomes clean HAVE. Same `pure_fn` fence — no interpreter. |
| **B. Keep the diagnostic** | Two spellings, two outcomes, both honest. Drop the * and write “inits don’t fold helpers.” Smaller engine. |

Suggested: **A**. B is a dialect split authors will hit the first time
they extract a helper into a variable.

---

## 6. Namespace / default *value* imports (S13)

**Verdict:** open (currently **deferred with cause**)
**Why it matters:** optional superiority. v2 refuses too. Matching v2
is already HAVE. Exceeding needs export value tables that do not exist.

S12 (pinned, `ATM-SITE-55` / `NEO-SITE-28`) is **site identity**
through a namespace, not a value:

```ts
import * as ui from './ui'          // ui re-exports css from Reference
ui.css({ color: 'plum' })           // live site. Good.
```

S13 would be **values** through a namespace or default:

```ts
// tokens.ts
export const brand = 'red'
export default { color: 'red', padding: '4px' }

// app.ts
import * as t from './tokens'
import tokens from './tokens'
css({ color: t.brand })             // today: not resolved (no value table)
css(tokens)                         // today: not resolved
```

v2 refuses both (`cross-file-resolution.md:95-96`). Named
`import { brand } from './tokens'` already folds.

| | |
|---|---|
| **A. Permanently match v2** | Named imports are the dialect. `import *` / `default` as values stay refused (diagnose, don’t silence). Strike S13 from unfinished work. |
| **B. Build export value tables** | `t.brand` and `import tokens from` fold like named. Real scope, separate slice. |

Suggested: **A**. Authors who want the fold already have named
imports. Don’t hold the claim for a rider v2 also lacks.

---

## 7. `__proto__` — host plumbing vs extraction

**Verdict:** open (voyage log only; no Overmatch station)
**Why it matters:** almost certainly out of axis. Needs a one-line
close so it stops touring the open list.

Panda `mergeProps` drops `__proto__` so a spread can’t pollute
`Object.prototype`. Neo does not merge objects that way; it merges
**cascade slots**. Merge SPEC §5 already files this as covered by
MERGE-01 / 02 / 05:

```ts
css({ color: 'ember' }, { color: 'ocean' })
// both atoms in the sheet; the node paints ocean (last-wins per slot)
```

The leftover question is only whether this is an **extraction** shape:

```ts
css({ ['__proto__']: { color: 'red' } })
css({ ...{ __proto__: { color: 'red' } } })
```

| | |
|---|---|
| **A. Out of axis** | Host / merge plumbing. Covered by MERGE. No Temper row. Close the voyage-log item. |
| **B. Extraction refuse** | Diagnose `__proto__` / `constructor` keys at extract, like a forbidden ident. New station, new claim. |

Suggested: **A**, unless someone has a failing extract probe. Don’t
invent a key-ban to retire a log line.

---

## 8. Mutation wording — green station, unsigned sentence

**Verdict:** open (quarantined)
**Why it matters:** no phase may quote the mutation contract until
HQ signs it. Behavior is `ATM-SITE-28`, green.

The arms, in one place:

```ts
let color = 'red'
color = 'blue'
css({ color })                          // drop + name the assignment

let count = 1
count += 1
css({ order: count })                   // drop (compound is a write)

let bump = 2
bump++
css({ order: bump })                    // drop (update is a write)

let theme = { primary: 'red' }
theme.primary = 'blue'
css({ color: theme.primary })           // drop; poison is the root `theme`

let picked = 'red'
for (picked of ['blue']) {}
css({ color: picked })                  // drop (for-of head is a write)

let palette = { color: 'red' }
palette.color = 'blue'
css({ ...palette, padding: '4px' })     // palette dropped, padding kept

delete obj.prop                         // SPEC-V2-81: same as a write
css({ ...obj })                         // drop + `deleted at file:line:col`
```

Unmutated `let` / `var` / `export let` fold like `const`.

What was never signed is the **sentence**: is member-root poison
(`theme.primary =` poisons all of `theme`) the contract, or a Ph1
shortcut? Until §3 is picked, this wording cannot say “precise to
the written path” or “precise to the binding name.”

| | |
|---|---|
| **A. Sign SITE-28 as the contract** | Root poison, for-of, delete, compound, update — all writes. Quote the README. Close the quarantine. Precision follow-up (if any) is §3, separately. |
| **B. Keep quarantine until §3** | Don’t publish mutation text that a later precision pass would falsify. |

Suggested: **A** the moment §3 is C or A. If §3 is B, wait and sign
once.

---

## How this closes

1. HQ writes a letter on every **Verdict** line.
2. Engine work is only the picks that change behavior: likely §1 A,
   maybe §4 A and §5 A, maybe §3 C. The rest is a sentence in the
   ledger.
3. Ledger §5 carve-outs either retire or become Temper pins.
4. Doom still waits on the user’s explicit “satisfied.” Temper does
   not write that marker.
