# Neo Plan — Tokyo era (the one plan)

> Status: **thinking doc + discussion map**. Restarted 2026-09-23 by HQ
> (supersedes the 2026-09-17 parity campaign — see git history). RS has
> proved its point; nights are doom-testing; days are Neo. Nothing here
> is ordered into steps until the map converges; serialization comes
> after. Tokyo ground rule holds throughout: no architectural work
> until the stability gate (chain green everywhere) is green — this
> file is thinking, not execution.

## 0. Where Neo stands

- Neo is the TypeScript above the RS cut: fragments, publish, runtime,
  sync, and the generated folder consumers import. (~197 cases, ~320
  unit tests — re-verify with `pnpm agentneo list` and the suite.)
- Voyage record: Obj1 (reference + tasty bridge) and Obj3 (lib sync
  648→319ms) landed. Obj2's packed-extends merge landed and is green
  natively (23 chain flips); hermetic diverges (HERMDIV interim in
  [LOG-2](../../docs/MISSIONS/LOG-2.md): fixture `css` resolves to the
  fixture's own runtime natively, the consumer's in-container).
- Operation Tokyo ([brief](../../docs/MISSIONS/OPERATION_TOKYO.md)) owns
  what comes next.
- Evidence museum: `packages/reference-legacy/` (frozen `main` core,
  read-only law in its README). Tokyo steals solved structure from it;
  nothing imports it.

## 1. HQ's thesis (the shape of the rethink)

- `sync` is a kitchen sink. Core did something heinous but was
  architected; Neo's proposition is simpler (just use the native
  stuff) and its architecture should be simpler than core's, not
  messier.
- Past the compiler, these are solved problems — structure, pass
  boundaries, packaging, diagnostics. Don't re-derive from ground
  principles what core already ironed out. Steal the bones (PostCSS
  packaging et al), leave the heinousness, filter the panda-isms by
  writing the after photo in Neo.
- The chain sits firmly in Neo's remit. Its tests are the contract:
  harden and probe them, never dissolve them.

## 2. Sequencing

1. **Stability gate** (Tokyo §2): HERMDIV confirmed + fixed, chain green
   everywhere, suites green, Obj2 closed or handed over.
2. **Survey**: fill Tokyo §4 (red-flag catalogue) — sync's
   responsibilities enumerated, CORE-BONES entries with legacy
   file:line, publish-shape and natives-seam mapped.
3. **The big plan**: written in Tokyo §5 at READY, slices in order,
   every slice behind `pnpm agentneo q` + cases + hermetic re-gate on
   publish/runtime touches.

## 3. The map (discussion items — NOT sequenced)

Each item: HQ's point, captain's comment, open threads. An item
graduates when its threads close with file:line or measured evidence.

### 3.1. Packager concept — install it (HQ: first ring)

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

### 3.2. PostCSS module + CSS as its own module (HQ: definite need)

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
analysis. NOTE — split by 3.6 below: PostCSS is for CSS we do NOT
control (authored input, boundary validation, hardening). Open threads:
dependency shape (full `postcss` + companions as in legacy, or narrower?
— legacy's exact pins are the default candidate); module home
(`src/css/` vs `src/lib/css/` — see 3.3); whether the merge migrates
into it wholesale at stability-fix time or the migration waits for the
rearch slices.

### 3.3. Layout: lib as the machinery home, subsystems stay top-level (HQ, REVISED)

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
`lib/` remains the machinery home for true libs (symlink, microbundle,
paths); subsystems (collect, packager, sync-spine) stay top-level.

Decided layout (HQ art direction):

```text
src/collect/
├── index.ts          barrel (re-export surface + lib as today)
├── constants.ts      extracted constants (was: buried)
├── README.md         the serious one — what collection is
├── surface/          was api/ — the collector calls authors touch
│   ├── README.md     surface contract: what's public, what's not
│   ├── index.ts      barrel
│   ├── font.ts       (+ .test)
│   ├── globalCss.ts  (+ .test)
│   ├── keyframes.ts  (+ .test)
│   └── tokens.ts     (+ .test)
└── lib/              everything else — the machinery
    ├── README.md     machinery map: scan→evaluate→merge→collect
    ├── bootstrap.ts  (+ .test)
    ├── collector.ts
    ├── evaluate.ts   (+ .test)
    ├── merge.ts      (+ .test)
    ├── runner.ts
    ├── types.ts
    └── scan/         crossings, goldens, helpers, identity,
                      native, nativeWalk, retention (+ fixtures)
```

Rationale (HQ): "collect itself has an API" so `api/` misnames it —
`surface/` says what it is. `lib/` holds the rest honest. READMEs at
all three levels because this is serious kit. README law (all Neo
READMEs): purpose-first, never directory tours — say what the thing IS
and does; ASCII diagrams welcome.

Open threads: remaining move-list (css module home — 3.2 — plus
stragglers); whether other top-level dirs want the same
subsystem-vs-lib test applied.

### 3.4. Liquid: gone and staying gone (HQ: it was a Panda-era constraint)

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

### 3.5. Regex-on-CSS ban as adopted law (HQ: core settled this)

HQ: core settled this.
Captain: confirmed in the museum (hardening map — adopted postcss +
postcss-selector-parser with coverage for braces-in-comments/strings
and comma-containing selector functions, so the transform path no
longer relies on "raw brace matching or naive `selector.split(',')`").
Proposed law: from the PostCSS module landing onward, no new
regex/brace/split handling of CSS text anywhere in Neo; the existing
`packed-css.ts` hand-rolls are grandfathered only until the migration
in 3.2 and tracked as the known violators. Enforcement question open:
gate rule (`agentneo q` addition), review convention, or both. Also
open: whether the ban extends to non-CSS text (fragments/scan) or
stays CSS-scoped.

### 3.6. Seam, not surgery: the compiler should emit streams (HQ: packed-css is Panda-era)

HQ: `packed-css.ts` (`matchCloseBrace` and friends) is a seam problem.
We fully control the native compiler — it can hand us exactly what we
need in separate streams/chunks (the layout bit, everything else),
instead of us doing brittle manipulation on its text output. Re-parsing
our own compiler's emission is Panda-era thinking.

Captain: agree, and it splits 3.2 in half. PostCSS is for CSS we do
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

### 3.7. Sync as a tight engine block: the CLI recipe (HQ: style IS the point)

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
(packager→3.1, css→3.2, collect→3.3, jsx/emit wherever the survey lands
it). The recipe shape also answers "where does the chain merge live":
not in sync — sync calls it. Open threads: CLI framework — legacy used
commander, Neo's `bin/neo.ts` is hand-rolled (USAGE string, manual
argv); adopt commander or keep hand-rolled and tight? Whether
`--watch` stays a sync mode or becomes its own command next to it.
What (if anything) replaces the event bus for cross-subsystem signals
(HQ: not event bus — so: direct calls? a tiny typed emitter? nothing?).

### 3.8. author/ vs entry/ + public/private split (HQ: confusing as drawn)

HQ: `entry/` plus `author/` is confusing — and `author/` mixes public
API (`defineConfig`, `tokens()`) with internals no one should touch
(`createTokensCollector`, `createKeyframesCollector`, ...). Legacy had
`entry/` but never `author/`.

Captain: legacy's shape is the clarifier — `public.ts` ("Public
authoring surface... Keep this separate from the executable CLI
entry") vs `entry/` (react/system/types: the generated-consumer
entries) vs `index.ts` (the CLI). Neo's `author/` ≈ legacy's
`public.ts` and Neo's `entry/` ≈ legacy's `entry/`.

Census (2026-09-23, every importer in-tree): from `@reference-ui/neo`
anyone imports exactly `defineConfig` (217), `tokens` (155),
`globalCss` (50), `font` (11), `keyframes` (8) — plus types. NOBODY
imports any `create*Collector` factory, anywhere. The factories are
dead public surface: pure confusion, zero users. Worse, the id isn't
even a real export — `package.json` has no `"."`; the id resolves via
bundler alias + tsconfig paths pointed at `author/` by convention.

Direction (HQ decided: kill `author/`): the id keeps answering from a
minimal root barrel with the true public set; factories stay defined
in `collect/surface` files but leave the public id — that
non-re-export IS the split. Wiring that moves with it: tsconfig paths
(both ids), `config/bundle.ts` alias + `config/constants.ts`,
vite/test-harness aliases by grep, `system-surface.d.ts` relocated.
Open threads: real `"."` export in package.json; what `entry/`'s exact
Neo roster is (react/types today — system?); where the public types
live (HQ: with types — Neo has no top-level `types/` home yet).

## 4. Standing constraints (carried, not re-debated)

- Chain tests stay. Neo never imports core/lib/legacy paths. Cases +
  Playwright prove behavior; goldens prove strings. No matrix/Dagger in
  the inner loop; hermetic tiers re-gate publish/runtime changes.
- No new LiquidJS in Neo. No regex/brace-matching on CSS once the
  PostCSS module lands (core's hardening bar, adopted).
- README law: purpose-first, never directory tours; ASCII welcome.
- Workflow: [agent-neo](../../.agents/skills/agent-neo/SKILL.md)
  (`pnpm agentneo`). Cases live in `tests/`; the index in READMEs.

## 5. Open questions (think here)

- What are sync's actual responsibilities today, one per line? Where
  are the cut lines — what becomes passes, packages, or deleted code?
- What did core's PostCSS/packager/sync-session shape get right that
  Neo's publish legs should adopt? (Cite legacy file:line, not memory.)
- What is the narrowest typed seam across the RS cut? What leaks today?
- Hermetic/natives: what must be byte-identical across platforms, and
  what is allowed to differ? (HERMDIV fallout.)
- Minimal system-package ship-list: what files MUST a packed system
  contain, and what is always external? (3.1+3.2.)
- PostCSS dependency shape: legacy's full trio or narrower?
- Does the `packed-css.ts` → CSS-module migration ride the
  stability-fix wave or wait for rearch slices?
- Gate rule or convention for the regex ban? CSS-scoped or wider?
- Stream vocabulary: what chunks does the compiler emit, and does the
  structured-payload fix ride stability or rearch?
- What counts as "Neo is done"?
