# Mission: Operation Error Correct

Status: `idea` (HQ review required — no crews launch until the shape is signed).

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

## Philosophy

- Every emitted warning must point at a real failure the author can act
  on. If the UI paints, the compiler stays quiet (or whispers in a
  debug channel — see open questions).
- Warnings must be *reference-UI-related*: tied to what the author did
  with our framework, not to shapes the engine merely finds exotic.
- Contrived book scaffolding (the Icon scale tables) is not a use case
  to contort for — but it shouldn't make the compiler scream either.

## The two failure modes

With the harvester split up, only two things can actually defeat it:

1. **Values from outside the source.** API responses, user input,
   storage — information that was never written in any TSX/TS compile
   input, so no pool can hold it. Genuinely unknowable at build time.
   (Compile inputs = TS/TSX/JS/JSX sources; JSON is outside.)
2. **Values computed at runtime.** Built RGB strings, arithmetic,
   interpolation — things the harvester can't deterministically pick
   out because they aren't wholesale literals. (The honest home for
   these is the native `style` prop — Forge's seam stands.)

Everything else — mapped tables, spreads, params with defaults,
member reads — is harvester's to catch, however the author spins it.

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

Future (not this operation): a detector for "doing stuff the
harvester can't deterministically pick out." Wide nets penalize
correct usage — this needs its own design pass once warnings are
honest.

## Machinery available (no new subsystems)

- **Pool + sinks.** The literals pool is position-free; sinks mark the
  dynamic holes. Coverage per sink is computable.
- **`ATM-I-HARVEST-SINK`.** Per-sink backfill counts already exist —
  the data warnings need, currently emitted after the fact.
- **Pool-first sketch.** Build the pool before the site walk; at each
  Dynamic refusal, check pool coverage for the sink kind. Uncovered →
  warning stays (true hole). Covered → demote to info/debug.
- **Runtime backstop (already exists).** The dev-console miss warning
  on actual lookup failure stays the ground truth for what didn't
  paint.

## The honest caveat

Coverage is not a guarantee. A pool holding *some* compatible values
doesn't mean it holds the one runtime asks for. Any demoted warning
must be phrased as what it is ("dynamic site, N covering values in
pool") — never as a promise it paints.

## Every want ends in one of four states (HQ)

A want is the unit of demand. Each one is already classifiable today:

1. **Resolved** — the site walk minted an atom. Filled by definition.
2. **Refused + backfilled** — dynamic site, harvest minted onto its
   sink. Paints (for values in the pool). Current warnings lie here.
3. **Refused + uncovered** — dynamic site, zero compatible pool values.
   True hole, cannot paint. The only state that deserves a build
   warning. Computable in `mint` today (the complement of the
   `HARVEST-SINK` infos) — just never reported.
4. **Runtime-only** — the value never existed at build (backend, input).
   Detectable only at lookup time, where the dev-console miss warning
   already fires with the actual value in hand.

The "reverse style trace" is therefore not a new subsystem: it's
reporting state 3 at build time and keeping state 4 at runtime. The
join that's missing is small — gate `Dynamic*` warnings on sink
coverage (pool-first), and let the runtime miss stay the backstop
for values no build could ever know.

## Runtime misses (separate doc, opt-in)

Build-time verdicts are the default channel — always on,
certain-only. The opt-in runtime miss reporter (cap/collapse,
generated-pattern detection, pool-stats context, trimmed stacks)
lives in
[operation-error-correct-runtime.md](./operation-error-correct-runtime.md).
It is not the first port of call; it is an option. Boundary
holds: runtime reports *what missed*, never *why* — shape
diagnosis lives at build.

## The audit (the work, once signed)

1. All 21 dynamic sites + the 74 rest-spreads: per-site verdict —
   covered or uncovered (pool evidence), paints or not (browser or
   sheet evidence), honest or lying (warning text vs reality).
2. Deliverable: a warning policy — which codes demote to info/debug,
   which stay warnings, exact new wordings, and the pool-first (or
   alternative) design to implement it.
3. Lens: book/story scaffolding vs shipped components, counted
   separately so demo code never sets policy.

## The three tiers (HQ): never "probably"

Build time speaks in certainties or stays silent:

1. **WILL NOT paint → warning.** Uncovered sink (state 3, zero pool
   values — nothing runtime does can fill it) and computed shapes
   (the template-hole exemplar — non-extraction is certain). The
   message names the fix (`style` prop / write the value).
2. **MAY paint → silent** (or debug info with pool counts). Covered
   dynamics. The probability lives here, unspoken; runtime reports
   facts if a miss actually happens.
3. **Runtime decides the rest** — via the opt-in reporter
   (separate doc), never the default channel.

## The warning bar: every surviving warning earns its place

Each warning code that survives the audit gets a conformity station
proving all three, or it doesn't ship:

1. **Fires where claimed** — positive pin on the exact shape.
2. **Miss proven** — browser station asserting the UI genuinely does
   not paint there (negative paint proof, NEO-CSS-14 style).
3. **Fix named works** — applying the message's suggested fix makes
   the warning go away *and* the UI paint.

A warning that can't pass all three is a crappy error, and crappy
errors don't ship. This is the "well tested, well thought out"
system: the compiler only speaks when it can prove the failure and
sell the cure.

## The submodule charter (HQ)

The verdict layer is its own submodule inside the compiler — not
scattered conditionals. Clean inputs (sinks with refused-site
spans, the final AtomSet, pool stats), clean outputs (verdicts
per sink/site with wordings that name fixes). The walk and mint
stay dumb and best-effort and untouched; all cleverness lives in
one room with its name on the door.

Name (HQ): **diagnostics** — boring, but clear. It extends the
existing `diagnostics/` home (codes already live there) rather
than minting a new top-level name.

Bias, stated once: **warnings are sound, coverage is best-effort.**
Every warning true; not every truth warned. A hole we stay silent
on is a documented coverage gap (the runtime backstop covers it).
A warning that fires wrongly is a defect, and its own station
catches it. This is the forgivable/unforgivable line for every
future contributor.

## Open questions for HQ

1. Demote-to-debug vs remove: do covered-dynamic sites whisper
   (debug channel) or go fully silent?
2. What is the debug channel? Flag, env var, separate log stream?
3. Do rest-spread warnings (`{...props}`) survive at all, given
   harvester + call-site minting?
4. Book-vs-shipped: does the census split, or does one number rule?
5. The future detector (§"Where errors should live") — in scope to
   sketch, or parked entirely?

## Exemplar: warn here, 100% (HQ)

```tsx
minW={`${minWidth}px`}
minH={`${minHeight}px`}
```

Template holes producing values (`${x}px`) are deterministically
detectable: static skeleton + holes in a style position. The
harvester can never pick these out (not wholesale — Forge's rule
stands), the numbers come from runtime state, and no pool coverage
argument applies. This is failure mode 2 wearing a name tag.

The current `DYNAMIC-TEMPLATE` wording ("template part 1
(identifier 'minWidth')") is accurate but useless. The replacement
must say the actionable thing: *computed value — put it on the
native `style` prop.* This is the bar every surviving warning has
to clear: deterministic, specific, actionable.

## Non-goals

- `ATM-W-UNKNOWN-TOKEN-PATH` is a separate conversation (HQ) — untouched.
- No resolver/extract behavior changes until the warning policy is signed.
- No Doom, no Slice 6, no lib edits.
