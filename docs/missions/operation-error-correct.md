# Mission: Operation Error Correct

Status: `idea` (HQ 2026-09-19 — policy answers in; no crews launch until
the shape is signed).

Theme: *awareness*. Panda v1 and v2 silently failed: it either worked or
it didn't, and the compiler never told you which. Forge built the
machinery for a compiler that knows what it knows. This operation makes
it self-aware — warnings it can defend, silence everywhere else.

## The problem

Post-harvest, the `ATM-W-DYNAMIC-*` warnings are too pessimistic. The
harvester extracts wholesale values wherever they sit in source —
mapped, spun, tabled, spread — so a dynamic site usually still paints.
But the warnings still speak the old meaning ("dynamic site" = "won't
work"). A warning that fires on working UI is the worst kind of
diagnostic. Current census: 13 member + 5 identifier + 2 template + 1
non-object dynamics, plus 74 rest-spreads — most of them paint today.

HQ's rule: **no errors are better than crappy errors.** Panda's silence
wasn't best, but it beats warning on stuff that works.

The template sites (`minW={`${minWidth}px`}`) are the one place the
census is *under*-explaining, not over-warning. They are not "we
hate backticks." They are a **partial style definition**: a skeleton
plus a hole, assembling a CSS value at runtime. That is the first
line of defense — and the only new user-facing warning this
operation adds. Wholesale values, including interpolations that
already hold a complete CSS value, stay extractable.

## Philosophy

- Every emitted **user** warning must point at a real failure the author
  can act on. If we cannot prove the site is the wrong door, we stay
  quiet in userspace.
- Warnings must be *reference-UI-related*: tied to what the author did
  with our framework, not to shapes the engine merely finds exotic.
- Contrived book scaffolding (the Icon scale tables) is not a use case
  to contort for — but it shouldn't make the compiler scream either.
- Two audiences, one module: **userspace** (certain, rare, actionable)
  and **compiler** (maybes, coverage counts, our development). Never
  dump the second on the first.

## The two failure modes

With the harvester split up, only two things can actually defeat it:

1. **Values from outside the source.** API responses, user input,
   storage — information that was never written in any TSX/TS compile
   input, so no pool can hold it. Genuinely unknowable at build time.
   (Compile inputs = TS/TSX/JS/JSX sources; JSON is outside.)
2. **Partial values — assembled at runtime.** `${minWidth}px`,
   `#${hex}`, `n + 'px'`. The CSS value does not exist in source as
   a wholesale token; JS will glue it later. Native `style` is that
   door — Forge's seam stands. This is not "interpolation" as such:
   a template that already holds a complete CSS value is wholesale,
   and we extract it.

Everything else — mapped tables, spreads, params with defaults,
member reads — is harvester's to catch, however the author spins it.

Failure mode 2 is the one we can *see in the AST* when a style site
assembles a value from parts. That visibility is the first line of
defense. Failure mode 1 stays a runtime fact.

## The language rule (HQ)

Styles live in TypeScript and JavaScript (`.ts`/`.tsx`/`.js`/`.jsx`).
That is the language — the same way Sass lives in `.sass`/`.scss` files. Anything outside it (JSON theme
blobs, CMS payloads, fetched config) is an **external source**:
failure mode 1, never harvested, never folded, never warned about
beyond the site that consumes it. If you import it, it's runtime
data; if you want it compiled, write it in the language.

This needs no implementation — the extractor only parses
TS/TSX/JS/JSX, so the boundary already holds. It needs *saying*, once, in the
docs and in the warning policy: the compiler's world is the
compile inputs, full stop.

## Where errors should live

Authors touch the framework in two ways: style props on a host, and
the `css()` / `recipe()` functions. That interaction surface is where
errors get based — what was asked for *there*, and can it be honored?
A helper generating RGB strings three files over is not itself an
error; it may never reach a style prop (native `style`), or it may
arrive as a complete value harvest already caught. Judge at the site,
not at the shape.

The "future detector" that used to live in this paragraph is no
longer future. It is the first line of defense, scoped so it cannot
become a wide net.

## First line of defense: partial vs wholesale

The compile surface extracts **static wholesale** values: complete CSS
(or rhythm) tokens that exist in source — `red`, `200px`, `13r`,
`1px solid black`. Forge's authorship rule. Templates are not the
enemy. A template that *is* a wholesale value, or that *joins to
one* from static parts, is extract.

We cannot extract **partial style definitions**: a skeleton that
still needs a runtime hole to become a CSS value. `${minWidth}px`
is not a length in the file. `minWidth` is a number; `px` is glue.
The length exists later, in the browser. That screams runtime.
Native `style` is the door. Harvest must not invent that string.

**Be careful — interpolation of a whole CSS value is extract.**
`` `${'red'}` ``, `` `${brand}` `` where `brand` is `'red'`,
`` `${color}` `` where the hole *is* the color. In theory, and in
practice: if the parts fold, SITE-51 already joins them and we
mint. If the hole is a dynamic identifier with empty quasis, that
is `color={color}` wearing backticks — a maybe, harvest's job,
userspace silent. Do not warn just because they used `${}`.

Cheap, deterministic split at a known style site (traced primitive
prop, `css()`, `recipe()`):

| Shape | What it is | Userspace |
|---|---|---|
| Fully folds (SITE-51) | Static wholesale, possibly written in pieces | Extract. Silent. |
| Single hole, empty / whitespace-only quasis, unfoldable | Whole CSS value in the interpolation | Treat as the hole. Maybe. Silent. |
| Unfoldable hole **and** a non-empty skeleton (`px`, `#`, `solid`, extra holes, …) | Partial style definition | **Warn.** |
| `ident + 'px'` / `+ 'r'` / `+ '%'` (unfoldable ident) | Same partial, concat costume | **Warn.** |

**Direct** means that expression *is* the site's value. Not a name
three files over. Direct is what we can see without a wide net.

**The partial class** (same intent, same warning):

```tsx
minW={`${minWidth}px`}
minH={`${minHeight}px`}
css({ width: `${n}px` })
recipe({ base: { color: `#${hex}` } })
<Box minW={minWidth + 'px'} />
css({ border: `1px solid ${c}` })   // skeleton assembles the border
```

**Wholesale / maybe — not this class:**

```tsx
minW="200px"                             // static wholesale
minW={`200px`}                           // static template, no hole
css({ color: `${'red'}` })               // whole value, folds (SITE-51)
css({ color: `${brand}` })               // whole value if `brand` folds
css({ color: `${color}` })               // whole value wrap — maybe, like color={color}
minW={minWidth}                          // identifier — maybe; silent
<Box {...props} />                       // rest-spread — maybe; silent
border: '1px solid {colors.gray.800}'    // our token braces, not JS `${}`; folds
style={{ minWidth: `${minWidth}px` }}    // the correct door for partials; out of scope
```

`` `${n}px` `` where `n` is a const `200` folds to `'200px'` and
extracts. That is static wholesale, not a partial. The detector
fires only when a hole does **not** fold *and* the template is
still assembling.

### Harvest pins

Harvest already asks "is this a complete CSS-shaped literal?" — not
"did it sit in a template." Confirm that, don't invent a second
pool.

| Pin | What it proves | Status |
|---|---|---|
| `ATM-HARVEST-02` | `` `2${n}r` `` / `` `#${hex}` `` — holey **joins** mint nothing | have |
| `ATM-SITE-51` | Static pieces fold at the site (`` `${n}px` `` over const `n`, `` `${o.p}` ``) | have |
| `literals.rs` `strings_harvest_position_free_and_dedupe` | Hole-free `` `4r` `` is wholesale | have |
| `literals.rs` `whole_css_value_in_a_hole_harvests_the_inner_literal_not_the_join` | `'red'` / `'blue'` / `'#0af'` inside a hole harvest; `` `${n}px` `` and `n + 'px'` do not | **this operation** |
| `ATM-HARVEST-05` | Inner `'red'` mints onto `` `${color}` ``; `` `${n}px` `` on `width` stays a zero-count sink | **this operation** |

`HARVEST-05` still sees today's `DYNAMIC-TEMPLATE` on the wrap. That
warning is not the claim — the pool split is. Error Correct will
demote the wrap; keep the mint.

Do **not** reverse-trace bindings in this operation
(`const w = `${minWidth}px`; minW={w}`). That is a wide net. The
identifier at the site is a maybe. Compiler channel may record it.
Userspace does not.

This is one warning class with one wording, not a zoo of
`DYNAMIC-TEMPLATE` / `DYNAMIC-BINARY` user messages. The current
`DYNAMIC-TEMPLATE` text ("template part 1 (identifier 'minWidth')")
is accurate and useless. Replacement, every time:

> `minW` is a partial value (`${…}px`) — write a wholesale value, or use the native `style` prop

Same sentence for concat. The bar every surviving user warning has
to clear: deterministic, specific, actionable.

The Overlay book card (`Overlay.book.tsx` `minW={`${minWidth}px`}`)
will warn under this policy, and that is correct — it is assembling
a measured length. Book scaffolding does not get a pardon for
certain partials; it also does not set policy for maybes.

## Maybes go silent

The other policy is simple. Anything we cannot prove is a wrong door
is a **maybe**, and maybes do not speak in userspace.

Maybes include:

- Dynamic identifiers / members (`color={props.color}`, `css({ color })`)
- Rest-spreads (`{...props}`)
- Covered dynamic sites (harvest backfilled the sink — they paint for
  values in the pool)
- Uncovered dynamic sites (zero compatible pool values). Coverage is
  best-effort. A hole we failed to harvest is not a charge we can
  press against the author. Runtime miss is the backstop.

Today's `ATM-W-DYNAMIC-IDENTIFIER` / `-MEMBER` / `-EXPRESSION` /
rest-spread warnings are this class. They come off the user channel.
The data does not vanish — it reports to the compiler channel.

A hole we stay silent on is a documented coverage gap. A warning that
fires wrongly is a defect. That is the forgivable/unforgivable line.

## Diagnostics: the hub

Name (HQ): **diagnostics** — boring, but clear. It extends the
existing `diagnostics/` home (codes already live there) rather
than minting a new top-level name.

The walk, mint, harvest, resolve, and StyleTrace stay dumb and
best-effort. They **report candidates** into diagnostics. They do
not decide what the author hears. All cleverness — verdict,
wording, audience — lives in one room with its name on the door.

Two jobs, one module:

1. **Hub.** Other modules push facts: "refused this site as
   template", "sink `(minWidth, [])` covered with N lengths",
   "rest-spread here". Clean inputs (sinks with refused-site spans,
   the final AtomSet, pool stats, the site's AST class). Diagnostics
   classifies.
2. **Own user-facing set.** The certain warnings this module is
   willing to put its name on — starting with *partial style
   definitions at the interaction surface*, plus the errors that
   already earn their place (parse, recipe shape, unknown token path
   is a non-goal of *this* operation but still an error when it
   fires).

Two outputs:

| Audience | When | What |
|---|---|---|
| **Userspace** | Always on | Certain, actionable. Today: partial style definitions at a compile site (+ existing real errors). Printed as sync/CLI warnings. |
| **Compiler** | `logs` includes `'compiler'` | Maybes, sink coverage, harvest counts, dead-branch infos, anything we want while developing the compiler. Not a product warning. |

Default `compile()` result **drops** compiler-channel items unless
the flag is on. Hosts do not each re-filter — diagnostics is the
filter. Stations that pin compiler-channel items pass the flag.
Neo sync already prints only `warning` (not `info`); that stays the
userspace printer. Compiler-channel print, when enabled, is a
distinct line (`[neo] compiler`, not `[neo] sync warning`) so the
two never share a costume.

Bias, stated once: **warnings are sound, coverage is best-effort.**
Every user warning true; not every truth warned.

## `logs` in `ui.config.ts`

Compiler-level diagnostics are opt-in via an optional config field:

```ts
export default defineConfig({
  name: 'my-system',
  include: ['src/**/*.{ts,tsx}'],
  logs: ['compiler'],
})
```

Omit or `[]` — userspace only. That is the default.

**Name: `logs`.** Keep it. It is simple, it is clearly extra, and
the array is how this field grows.

Rejected:

- `debug: ['compiler']` — `debug?: boolean` already exists and
  gates core's JS `log.debug` (sync, virtual, workers). Wrong type,
  wrong job. Do not overload it. Do **not** treat `debug: true` as
  implying compiler logs; that would flood anyone who turned debug
  on for the JS logger.
- `diagnostics: { compiler: true }` — makes authors think
  diagnostics are a knob. Userspace warnings are not optional.
- `trace` — StyleTrace.
- `verbose` — implies more of the same, not a second audience.

`logs` names the *channel*, not the data type. The objects are still
diagnostics (coded, located). The field answers "which extra streams
are on?"

This operation adds one channel: `'compiler'`. Note, do not
implement, the next ones:

- `'runtime'` — the opt-in miss reporter in
  [operation-error-correct-runtime.md](./operation-error-correct-runtime.md)
- others as we earn them (`'sync'`, `'harvest'`, …)

The TypeScript shape starts as `logs?: Array<'compiler'>` and the
union grows. No per-channel option objects in this operation. Empty
array equals omit.

Plumbing when this ships: thread `logs` from `ui.config` onto the
compile request so the native compiler can honor it. Small flag, not
a new subsystem. Existing `debug?: boolean` stays exactly what it is.

## Machinery available (no new subsystems)

- **Pool + sinks.** The literals pool is position-free; sinks mark the
  dynamic holes. Coverage per sink is computable.
- **`ATM-I-HARVEST-SINK`.** Per-sink backfill counts already exist —
  the data the compiler channel needs, currently emitted after the fact
  as infos. They move onto the compiler channel (flag-gated), off the
  default result.
- **Pool-first sketch.** Still useful — as *compiler-channel phrasing*
  ("dynamic site, N covering values in pool"), not as a userspace
  demote/keep switch. Userspace no longer asks harvest to bless a
  `DYNAMIC-*` warning.
- **Runtime backstop (already exists).** The dev-console miss warning
  on actual lookup failure stays the ground truth for what didn't
  paint.
- **Site walk.** Template fold (SITE-51) and refusals already exist.
  The new work is splitting unfoldable templates: empty-quasi whole
  value → maybe; non-empty skeleton → partial → user warning.
  Concat-to-unit is the same partial. Other `Dynamic*` stay maybes.

## The honest caveat

Coverage is not a guarantee. A pool holding *some* compatible values
doesn't mean it holds the one runtime asks for. That is why coverage
never speaks in userspace, and why a compiler-channel line must be
phrased as what it is ("dynamic site, N covering values in pool") —
never as a promise it paints.

The partial-value warning has no such caveat. A skeleton plus a
runtime hole is not a wholesale value. A pool hit on some other
`'200px'` literal is not extracting the partial; it is not
mentioned in the message. Whole-value interpolations never sit
this warning — they extract or they go silent.

## Every want ends in one of four states (HQ)

A want is the unit of demand. Each one is already classifiable today:

1. **Resolved** — the site walk minted an atom. Filled by definition.
2. **Refused + backfilled** — dynamic site, harvest minted onto its
   sink. Paints (for values in the pool). Current user warnings lie
   here. **Userspace silent; compiler channel.**
3. **Refused + uncovered** — dynamic site, zero compatible pool values.
   True hole *given the pool we built*. Still a maybe: harvest is
   best-effort. **Userspace silent; compiler channel.** Runtime miss
   if a lookup actually fails.
4. **Runtime-only** — the value never existed at build (backend, input).
   Detectable only at lookup time, where the dev-console miss warning
   already fires with the actual value in hand.

**Beside the four states**, a partial is a site verdict, not a want
state: the slot was assembling a value, so no want is minted from
it. That is the userspace warning. Whole-value interpolations are
ordinary wants or ordinary maybes — they do not get a special
warning. A sink coverage report, if any, stays on the compiler
channel — one user line, not two.

The "reverse style trace" is therefore not a new subsystem: it is
seeing partials at the interaction surface, extracting wholesale
(including folded templates), plus honest silence on states 2–3,
plus the runtime miss reporter for state 4.

## Runtime misses (separate doc, opt-in)

Build-time verdicts are the default channel — always on,
certain-only. The opt-in runtime miss reporter (cap/collapse,
generated-pattern detection, pool-stats context, trimmed stacks)
lives in
[operation-error-correct-runtime.md](./operation-error-correct-runtime.md).
It is not the first port of call; it is an option. Boundary
holds: runtime reports *what missed*, never *why* — shape
diagnosis lives at build.

When that companion ships, its opt-in is the same `logs` field
(`logs: ['runtime']`, or `['compiler', 'runtime']`). Not a second
flag, not an env var.

## The audit (the work, once signed)

Policy is no longer "count and then invent." The audit *confirms*
the split and rewrites goldens.

1. All 21 dynamic sites + the 74 rest-spreads: per-site verdict —
   **partial** (user warning) vs **whole-value wrap / identifier /
   spread** (maybe, silent / compiler) vs **folded wholesale**
   (extract). Covered or uncovered is compiler-channel evidence,
   not a userspace switch.
2. Deliverable: the partial wording, the list of codes that leave
   userspace, the compiler-channel inventory (what
   `logs: ['compiler']` actually prints), and the hub's classify
   table. Confirm `` `${color}` `` does **not** warn.
3. Lens: book/story scaffolding vs shipped components, counted
   separately so demo code never sets policy. One policy anyway —
   certain partials warn in the book too.

## The three tiers (HQ): never "probably"

Build time speaks in certainties or stays silent:

1. **Partial style definition on a compile site → user warning.**
   Unfoldable hole plus a skeleton (`${…}px`, `#${…}`, `1px solid ${…}`,
   unit-concat) *directly* in a traced primitive prop, `css()`, or
   `recipe()`. Write a wholesale value, or use native `style`.
2. **Wholesale, or maybe a wholesale (identifier, whole-value
   wrap, member, spread) → extract or silent.** Folded templates
   extract. `` `${color}` `` is a maybe, same as `color={color}`.
   Compiler channel for the maybes.
3. **Runtime decides the rest** — via the opt-in reporter
   (separate doc), never the default channel. Partials already
   *are* runtime assembly; the warning is that they used the
   compile door to assemble.

There is no "probably will not paint" user warning. Uncovered is not
certain enough to speak.

## The warning bar: every surviving warning earns its place

Each **user** warning code that survives gets a conformity station
proving all three, or it doesn't ship:

1. **Fires where claimed** — positive pin on the exact partial
   (`${n}px`, `#${hex}`, unit-concat, assembled shorthand) at
   `css` / `recipe` / traced prop. Negative pin: `` `${color}` ``
   does not fire.
2. **Nothing to compile** — the partial contributes zero wants.
   A pool accident on some other wholesale literal does **not**
   disqualify the warning.
3. **Fix named works** — writing a wholesale value (or moving the
   assembly to native `style`) makes the warning go away *and* the
   UI paint.

A warning that can't pass that bar is a crappy error, and crappy
errors don't ship. Maybes never sit this bar; they never ship as
user warnings.

## The submodule charter (HQ)

Clean inputs, two outputs, one door. Walk and mint stay untouched
as reporters. Diagnostics owns:

- the candidate sink (codes, spans, AST class: partial-template,
  whole-value wrap, direct-concat, identifier, member, spread, …)
- the classify table (user vs compiler vs drop)
- user wording (partial value; write wholesale or use `style`)
- compiler wording (coverage counts, former `DYNAMIC-*` text — ours,
  not the author's)
- honor `logs`

## Signed (this review)

1. **Demote-to-debug vs remove.** Userspace silent. Whisper only on
   `logs: ['compiler']`. Not "demote to info that still rides the
   default compile output."
2. **The debug channel.** `logs` in `ui.config.ts`. Not an env var,
   not a log file, not `debug: true`. Compiler diagnostics still
   flow through the diagnostics module; the flag is the audience
   gate. Future channels join the same array.
3. **Rest-spreads.** Do not survive as user warnings. Harvester +
   call-site minting. Compiler channel.
4. **Book-vs-shipped.** Census splits so we can see the noise. One
   policy. Book partials warn; book spreads do not.
5. **The detector.** In scope. First line of defense, interaction
   surface only: unfoldable **partials** (skeleton + hole, unit
   concat). Whole-value interpolations extract or stay maybe. Not
   a whole-program reverse trace. Not a blanket "no `${}`."

## Non-goals

- `ATM-W-UNKNOWN-TOKEN-PATH` is a separate conversation (HQ) — untouched.
- No resolver/extract behavior changes until the warning policy is signed.
- No Doom, no Slice 6, no lib edits. (The Overlay book warning, when
  this ships, is a compiler change; moving that size onto `style` is
  a later lib edit, not this operation.)
- No chasing indirect partials through bindings.
- No warning on whole-value interpolations (`` `${color}` ``).
- No merging `logs` with `debug?: boolean`.
- No `'runtime'` channel implementation (companion doc).
