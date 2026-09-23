# Neo Tokyo Plan — discussion map (NOT sequenced)

> Status: **discussion draft** 2026-09-23. This is the massive plan file:
> HQ comments, captain comments, open threads. Nothing here is ordered
> into steps yet — serialization happens after the map converges.
> `PLAN.md` stays minimal and points here. Tokyo ground rule holds: no
> architectural work until the stability gate (chain green everywhere)
> is green — this file is thinking, not execution.

## Goal

Rethink reference-neo's architecture outside-in — package shape first,
then publish, then sync — stealing solved structure from the frozen
core, with CSS parsing, layout, and module boundaries decided on
evidence and written down before anything moves.

## Success Criteria

- Every map item below has converged: HQ's point and the captain's
  comment agree on a direction, or the disagreement is written down as
  an open question with an owner.
- The converged map serializes into ordered work units (that step is
  explicitly not this file yet).
- No work unit starts before Tokyo §2 (stability gate) is green.

## Context And Current Facts

- Neo layout (`packages/reference-neo/src/`): `author config constants
  entry fragments lib primitives runtime sync vendor`, where `lib/` is
  thin (`microbundle paths`) and `fragments/` sits top-level (`api base
  lib`).
- Legacy layout (`packages/reference-legacy/src/`): `bundlers clean
  config entry lib packager reference session sync system tokens types
  virtual vite watch webpack`, where `lib/` is the machinery home
  (`fragments` with collector/runner/scanner, `fs log microbundle
  paths`, plus `event-bus profiler thread-pool` etc).
- Neo ships **no CSS parsing**: `package.json` has neither postcss nor
  liquid; the packed-extends merge (`src/sync/packed-css.ts`) hand-rolls
  brace matching (`matchCloseBrace`) and naive `split(',')`
  (`contributedNames`) — the exact techniques core hardened away.
- Legacy shipped the full stack: `postcss ^8.5.23`,
  `postcss-selector-parser ^7.1.1`, `postcss-value-parser ^4.2.0`,
  `liquidjs ^10.27.1` (its `package.json`), used across
  `system/stylesheet` (portable/packaging transforms), panda config
  extensions (font, rhythm, shorthands), and render templates.
- Liquid in Neo: absent by decision, not accident —
  `src/primitives/generate/generate.ts` notes string building replaces
  core's Liquid templates. Remaining "liquid" mentions are prose/SPEC
  text.
- Core's hardening precedent is written down, not lore:
  `packages/reference-legacy/src/system/stylesheet/README.md` ("This
  document is the hardening map") records adopting postcss +
  postcss-selector-parser with coverage for braces-in-comments/strings
  and comma-containing selector functions, so the transform path no
  longer relies on "raw brace matching or naive `selector.split(',')`".
- HERMDIV interim ([LOG-2](../../docs/MISSIONS/LOG-2.md)): fixtures
  externalize `@reference-ui/react` without shipping a bundle; native
  resolves fixture `css` to the fixture's own junction, the container
  to the consumer's. A package-shape failure — the packager question
  below is load-bearing for the stability gate, not just the rearch.

## Constraints And Non-goals

- Tokyo ground rule: stability (chain green native + hermetic + matrix)
  before architecture. This file plans; it authorizes nothing.
- Chain tests stay (Tokyo §3). Neo never imports core/lib/legacy paths.
- No new LiquidJS in Neo. No regex/brace-matching on CSS once the
  PostCSS module lands (core's hardening bar, adopted).
- Non-goal: serializing steps, assigning owners, estimating. Later file
  state, explicitly not now.

## The Map

### 1. Packager concept — install it (HQ: first ring)

HQ: Neo builds and packages into `.reference-ui`, so packager-as-concept
makes sense. Review what's important to us; this gets into the heart of
chaining. Workers/threading almost certainly unneeded.

Captain: agree, and HERMDIV makes it urgent, not just architectural.
Neo already *has* an unacknowledged packager (`publishSyncFolder` +
system/styled/react legs + runtime/react/types bundles + scope links);
naming it forces the questions nobody owns today: the shippable unit
(ship-list), the externals policy (who provides `@reference-ui/react`
for a packed fixture — the HERMDIV hole), the layout, the assembly
order. Take from legacy's `packager/` the bones — entry, layout,
exports/package-json story, small named ordered postprocess passes
(`inject-layer-name`, import rewrites). Leave the workers, thread pool,
and ts fan-out: natives compile fast and serial, and re-adding workers
would be a failure signal. Open threads: the minimal ship-list for a
system package; whether fixtures ship their own runtime bundle or the
consumer adopts the upstream runtime (HERMDIV fix fork); what (if
anything) of legacy's `postprocess/` survives de-panda'd.

### 2. PostCSS module + CSS as its own module (HQ: definite need)

HQ: Neo must be load-bearing on the PostCSS selector pass and value
parser. CSS gets its own module. No regex on CSS — core's hardening
phase settled that.

Captain: agree outright; our own tree is exhibit A. `packed-css.ts` is
raw brace matching plus naive comma-split — a correct, well-tested
regression to exactly what core's hardening map bans by name, including
the two named edge classes (braces in comments/strings, comma
functions). The CSS module should own parse (PostCSS), merge, scoping,
and emission; sync/publish consume it and never touch CSS text
directly. The selector pass owns layer/scope questions (`[data-layer]`
scoping, statement order); the value parser owns `var()`/token-value
analysis. Open threads: dependency shape (full `postcss` + companions
as in legacy, or narrower? — legacy's exact pins are the default
candidate); module home (`src/css/` vs `src/lib/css/` — see item 3);
whether the merge migrates into it wholesale at stability-fix time or
the migration waits for the rearch slices.

### 3. Layout: lib as the machinery home, subsystems stay top-level (HQ, REVISED)

HQ (revised — supersedes "fragments in lib"): fragments is not a lib,
it is a whole subsystem and stays top-level. The name itself is wrong:
it is a collection system — `collect` is the leading candidate. The
`base/` + `lib/` split inside annoys (grab-bag base, duplicated scan
concepts, meaningless boundary); constants should come out to a root
`constants.ts`; it needs a serious README. Barrel export and the `api/`
shape are liked and stay.

Captain: the listing supports every clause — `api/` is clean
(font/globalCss/keyframes/tokens + barrel), `base/` mixes evaluate +
merge + scan + bootstrap + goldens, `lib/` re-hosts scanner concepts.
Refactor crew dispatched (motion + naming only, zero logic change):
restructure inside, `collect` rename, constants, README, full-suite
proof. `lib/` remains the machinery home for true libs (symlink,
microbundle, paths); subsystems (collect, packager, sync-spine) stay
top-level. Open threads: remaining move-list (css module home — item
2 — plus stragglers); whether other top-level dirs want the same
subsystem-vs-lib test applied.

### 4. Liquid: gone and staying gone (HQ: it was a Panda-era constraint)

HQ: heavy Liquid use came from building a compiler on top of Panda;
that constraint is gone.

Captain: agree, and Neo already voted: string building replaced core's
templates in primitives generation, and no liquid dependency exists.
Direction: templates die with the Panda constraint — wherever output
shaping needs structure (stylesheet assembly, codegen), it goes through
typed builders/AST (PostCSS for CSS), never a template engine. Legacy's
`.liquid` files remain exhibits for *what* was emitted, never *how*.
Open threads: inventory of remaining string-built emitters in Neo that
want builder/AST treatment during the rearch (not now).

### 5. Regex-on-CSS ban as adopted law (HQ: core settled this)

HQ: core's hardening phase banned regex on CSS; Neo inherits the rule.

Captain: confirmed in the museum (hardening map, §Context). Proposed
law: from the PostCSS module landing onward, no new regex/brace/split
handling of CSS text anywhere in Neo; the existing `packed-css.ts`
hand-rolls are grandfathered only until the migration in item 2 and
tracked as the known violators. Enforcement question open: gate rule
(`agentneo q` addition), review convention, or both. Also open: whether
the ban extends to non-CSS text (fragments/scan) or stays CSS-scoped.

### 6. Seam, not surgery: the compiler should emit streams (HQ: packed-css is Panda-era)

HQ: `packed-css.ts` (`matchCloseBrace` and friends) is a seam problem.
We fully control the native compiler — it can hand us exactly what we
need in separate streams/chunks (the layout bit, everything else),
instead of us doing brittle manipulation on its text output. Re-parsing
our own compiler's emission is Panda-era thinking.

Captain: agree, and it splits item 2 in half. PostCSS is for CSS we do
NOT control (authored input, boundary validation, hardening). For CSS
we DO control — our own compile output, our own published payloads —
the answer is structured emission, not parsing: the natives hand over
typed chunks (per-layer / per-concern streams, or a sheet object), and
the TS side assembles without ever matching a brace. The merge is the
sharp end: today it re-parses upstream packed css *text* that we
ourselves published — the structured fix is publishing structured
payloads (`baseSystem` carries streams, merge assembles streams).
`packed-css.ts` as written is therefore doubly provisional: wrong layer
(text surgery on controlled output) as well as wrong technique (regex).
It stands only until the stability gate is green, then dies by seam,
not by PostCSS rewrite. Open threads: the stream vocabulary (what
chunks — layers? concerns? both?); whether structured payloads ride the
HERMDIV stability fix or the rearch slices; what (if anything) still
needs PostCSS on the controlled path (validation? normalization?).

### 7. Sync as a tight engine block: the CLI recipe (HQ: style IS the point)

HQ: sync should feel like an engine block — extremely tight. Legacy's
`command.ts` + `run` + `index` is what a sync command should look
like: the CLI layer that calls down into all the other subsystems, a
clear recipe. No event bus. Tools live around it, not in it. This is
stylistic and proud of it — tight as hell.

Captain: the listings prove the gap. Legacy `sync/command.ts` is a
~15-line recipe (`bootstrap`, then `initShutdown initFailureBoundary
initLogging initEvents initSession initComplete initWatch initVirtual
initReference initConfig initPanda initPackager initTsPackager` —
bean-for-bean a hub that owns nothing). Neo's `sync/` is 2600+ lines
across 19 entries with compile-files, jsx-elements, native, packed-css,
phases, publish/, react, reference-types, reset, watch, and clean all
resident — the kitchen sink, itemized. Direction: sync shrinks to
command (argv→options) → run (ordered subsystem calls) → index
(exports), and everything it currently hosts drops into its item home
(packager→1, css→2, fragments→3, jsx/emit wherever the survey lands
it). The recipe shape also answers "where does the chain merge live":
not in sync — sync calls it. Open threads: CLI framework — legacy used
commander, Neo's `bin/neo.ts` is hand-rolled (USAGE string, manual
argv); adopt commander or keep hand-rolled and tight? Whether
`--watch` stays a sync mode or becomes its own command next to it.
What (if anything) replaces the event bus for cross-subsystem signals
(HQ: not event bus — so: direct calls? a tiny typed emitter? nothing?).

### 8. author/ vs entry/ + public/private split (HQ: confusing as drawn)

HQ: `entry/` plus `author/` is confusing — and `author/` mixes public
API (`defineConfig`, `tokens()`) with internals no one should touch
(`createTokensCollector`, `createKeyframesCollector`, ...). Legacy had
`entry/` but never `author/`.

Captain: legacy's shape is the clarifier — `public.ts` ("Public
authoring surface... Keep this separate from the executable CLI
entry") vs `entry/` (react/system/types: the generated-consumer
entries) vs `index.ts` (the CLI). Neo's `author/` ≈ legacy's
`public.ts` and Neo's `entry/` ≈ legacy's `entry/` — the two doors
are right, but `author/` leaks internals where legacy's `public.ts`
exports only public things. Direction: split the barrel — public
surface (what authors import) vs internal factories (what the
collector/sync import), with the internal side unimportable from the
public id. Open threads: whether the internal factories move under
`collect/` (they serve collection) with `author/` keeping pure
re-exports; what `entry/`'s exact Neo roster is (react/types today —
system?); whether `author/` keeps its name once split.

## Explicitly Not Yet

- Step order, owners, estimates, commit/PR splits.
- The task system: the `tests/tasks/` inbox stub (commit `c04398e27`)
  is withdrawn by this file — plan-doc-first, task mechanics later.
- Any fix-vs-rearch boundary decisions beyond "stability gate first".

## Validation Plan (how a map item graduates)

- Each item graduates when its open threads close with file:line or
  measured evidence, not vibes — same bar as Tokyo §4.
- PostCSS adoption validates against core's own edge classes
  (braces-in-comments/strings, comma selector functions) plus Neo's
  merge goldens, which must pass unchanged on the new module.
- Packager shape validates hermetically: the HERMDIV fix is its first
  proof (fixture/consumer resolution identical native vs container).
- Layout moves validate by zero behavior diff: motion-only commits,
  full Neo suite + affected cases green before and after.

## Open Questions

- Minimal system-package ship-list: what files MUST a packed system
  contain, and what is always external? (Items 1+2.)
- PostCSS dependency shape: legacy's full trio or narrower?
- Does the `packed-css.ts` → CSS-module migration ride the
  stability-fix wave or wait for rearch slices?
- Gate rule or convention for the regex ban? CSS-scoped or wider?
- Stream vocabulary: what chunks does the compiler emit, and does the
  structured-payload fix ride stability or rearch?
- What counts as "Neo is done" (carried from PLAN.md §3)?
