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

### 3.2. Stylesheet: no Neo module until a forcing load (HQ: the seam constructs, RS prints)

Terminology law (HQ): the concept is *stylesheet* — never `css`
(the `css()` function owns that word in-domain). SUPERSEDED:
"definite need" for a Neo PostCSS module. HQ's steer: change the
SEAM so construction is easy, not the parser stack — RS compiles
and prints stylesheets, Neo assembles streams, and no CSS parser
enters Neo until a concrete load forces it. NIGHT-2's touchpoint
census (T1–T20) stands as the map; its home/deps picks are
MOTHBALLED, not decided. Consequence: `reset.ts` (#15–17) stays
in sync/ (spec-side injection, seam-independent) until a
stylesheet home exists or the seam absorbs it. The 3.5 regex ban
stands — stronger now: construction only, neither regex nor
re-parse. A future parser needs a named forcing load (today's
candidates, all unforced: foreign-payload boundary validation,
`var()`/token-value analysis, hardening probes).

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

Open threads: remaining move-list (stylesheet home MOTHBALLED
per 3.2 — plus stragglers as found); the subsystem-vs-lib test is
standing discipline (applied: watch→lib).

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

FILED (wave-8 prose sweep — S5's not-taken, captain-ordered): the
packed-css ban is now law, not migration. S5 deleted
`src/sync/packed-css.ts` (128 lines: `mergePackedStylesheets`,
`stripResetLayer`, `PackedUpstream`) plus its 364-line battery, and
moved the extends chain onto `streams` (`css?: string` gone from
the base-system shape, `.css` text readers gone with it).
FORBIDDEN from this line on: reintroducing any of the four names
in any form; `css?: string` on system/base shapes; `.css` text
readers over baseSystem/upstream payloads — construction only,
neither regex nor re-parse (3.2's law). EXEMPT (S4-audited, not
violations): recipe style OBJECTS, the react `css()` fn,
`styles.css` filenames, absence-pins asserting `!('css')`, and
`css?:` Record/prop-typed (font config, vendored
primitives/react-surface) — never `string`. Provenance: the 3
marked comments (`streams.ts:6`, `streams.test.ts:4`,
`streams-goldens.test.ts:4-5`). Living proof: zero packed-css
bytes outside those comments with units + cases + hermetic green
— the PGEN station (`tests/cases/pgen/`, 8/8) is the newest green
rung on the cutover tree.

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
not by PostCSS rewrite. DECIDED (HQ, Final): stream vocabulary is
per-layer (names as data + one string per layer block + package
name — WAVE1-D17-SEAM rec A, "not a question"), hard cut behind
a schema bump, no additive fallback. DECIDED (HQ, Final):
**A — end-to-end structured in one cutover.** RS emits the
structured stylesheet, baseSystem carries it, extends/layers
build over data — nobody anywhere walks CSS trees, regexes, or
value-parses (the legacy sins stay dead). This supersedes the
seam map's "published css stays string / T2-T8 untouched"
scoping: D17 includes the baseSystem shape change, extends
readers, and the full hermetic re-gate. S1 (capture) stands;
S2/S4/S5 re-scope around the carried payload (shape spec crew
→ S2 → S4 → S5). What still needs PostCSS on any path:
nothing (3.2's law).

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
not in sync — sync calls it. DECIDED (HQ, Final): watch goes to
lib — `sync/watch.ts` whole + `picomatch.d.ts` → `src/lib/watch/`
(with parcel/picomatch deps), no split (the second-consumer
trigger stands). CLI framework: Commander adopted (W2-CLI
landed). `--watch` stays a sync flag routed by cli/ (driver home
was this verdict). CLOSED (HQ): nothing — no event bus needed.
Cross-subsystem signals are direct calls; re-open only if a real
need ever appears.

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
Delegated to captain (HQ: do what feels best, work done beats
work queued). Ruling: public types live with the types leg (the
packager output surface; `system/base` contract types stay
domain-side — no top-level `types/` home); entry/ roster stays
react/types unless the system package needs an authored entry
(surveyed at W4 briefing, work proceeds meanwhile); the `"."`
export rides that survey. HQ veto at review, not a pre-pick.

### 3.9. Primitives generation as its own spec'd module (HQ: probably lives in RS)

HQ: the generator should be its own module with a test station
verifying emitted primitives carry proper style props; it must take
typegen into account; and it feels like it belongs in reference-rs —
one way to generate stuff, distributed through the vendor mechanism.
Also: `vendor/` is misnamed. We are the vendor.

Captain: the duplication is catalogued — `tags.ts` hand-copies canon's
tag set, the style-prop list hand-mirrors typegen's shape (the
generator header admits it: "mirrors the typegen shape until typegen
wires in"), `react-surface.d.ts` hand-mirrors both. The honest split:
vocabulary is RS-owned (canon tags + typegen prop defs,
vendored mechanically like tasty, freshness-gated); *per-system
emission* stays Neo (it needs the system name + compiled style props
at sync time). Proposed module spec:
- SOURCE: canon (tags, aliases, conditions) + typegen (prop defs,
  unions) — no new authority, wire the two that exist.
- GENERATOR: emits the tag set + prop vocabulary as committed
  artifacts (data, not prose); explicit regen command + `--check`
  freshness, same contract as `vendor-rust-tasty-dts.mjs`.
- TEST STATION: verifies the emitted surface — every canon tag has a
  primitive, every primitive carries its proper style props, set
  parity with canon fails the gate on drift.
- CONSUMERS: Neo's per-system entry assembly reads the vendored
  vocabulary instead of `tags.ts`; `tags.ts` and the hand-mirrored
  surface types delete.
- HOME: HQ leans RS (one generator, one language source). Counter to
  resolve: the vendor tool + station could live either side of the
  cut — decide by who owns freshness failures.
- SHAPE (HQ, converging): RS generates the actual raw files —
  primitives AND their types in one place, names from typegen's
  single source of truth (seamless: the names typegen knows are the
  names emitted). Neo holds the test station: behavior cases (do
  these primitives actually work?) plus type cases (validity +
  invalidation — what must typecheck, what must fail). Primitives
  must be strongly typed; everything else is pretty much just CSS.
  This is a big overnight brief (see §4): the night crew specs the
  emission shapes + the station case list + the seam contract —
  implementation waves sequence in the morning.
DECIDED (HQ, Final): emit **101** — CONFIRMED after the gap
review challenged it. Namespace law (HQ, supersedes the curation
rule): SVG is a different namespace — classes land on the `<svg>`
element itself, and everything after `<svg>` stays native SVG
elements, always. No Tier-1 fold-in, no SVG wave ever, no
deferred set in the vocabulary; F1's camelCase column is moot
(React DOM owns native spellings, not us). Acknowledged edge:
`image` is styleable but native-by-namespace. NIGHT-5 amended:
E1 carries exactly 101, PGEN-07..10 + PGEN-21 drop from the
station, set-parity pins 101 (PRIM-09 holds); W6 is answered
(never) and closes.
RENAME DECIDED (HQ, Final): `native/generated/` — the vendor
contract migrates there (tasty done, primitives next, contracts
after), the `upstream/` lean is dead.
DECIDED (HQ, Final): **Rank 1 SPLIT** — generator in
`modules/primitives/` (reference-rs), drawn through
`native/generated/primitives/`. RS emits, Neo proves, the seam
carries finished files.
Shapes SPECIFIED by NIGHT-5 (E1 JSON data + E4 d.ts closure,
W1 implements) — HQ veto at review, not a pre-pick. Open
threads: whether per-system emission ever follows below the cut
or stays Neo permanently (revisit only with measured cause).

### 3.10. jsx-elements artifact leaves sync for the tracer side (HQ: homeless join)

The `JsxElementsArtifact` (`sync/jsx-elements.ts`, 35 lines) joins
three name sources into `{ primitives, upstream, local, merged }`:
upstream from `config.extends`, local from configured names plus
engine-traced hosts, merged as the union. `primitives` is `[]` until
the 3.9 roster lands a producer. User value: zero-config styled
hosts (`<Card p="1r">` paints with no registration), the config
escape hatch for names tracing can't infer (generated surfaces,
member spellings), and extends chains carrying the roster downstream
so layered systems keep compiling upstream components' styles.

Why sync is wrong: `sync/index.ts` calls it twice, once per side of
`compile()` — pre-compile configured-only into `request.jsxHosts`
(frozen D12), post-compile configured ∪ traced into
`system/jsx-elements.json` + `baseSystem.jsxElements` (NEO-SYNC-15
pins the split). It is vocabulary both sides speak, not engine-block
machinery; the dependency arrows already point away (collect's
goldens battery and `packager/types.ts` import it).

HQ decision (pre-night interview, Final): tracer-side, not packager.
The artifact exists to carry discovery — configured names are the
fallback, traced names are the point. Concretely beside the
scan/discovery code under `src/collect/`, placed per collect's
surface/lib + README law by the moving crew. NIGHT-3's "stays" (#11)
is overridden. Forward: `native/generated/primitives` feeds the
`primitives` field; sync passes the roster through and owns none of
it.
SUPERSEDED by §3.11: the chaining half is base-system assembly, so
the join moves once to `system/base` (collect consumes, not hosts).
The collect-vs-packager reasoning stands; the home gains a third
option that fits better.

### 3.11. `src/system/`: home for the portable-system domain only (HQ: serious kit, serious address)

HQ: the base-system domain is homeless (type in `config/`, assembly
in `publish/`, roster in `sync/`) and deserves a real home with
serious tests — legacy precedent is real (`system/base`,
`system/runtime`, `system/stylesheet`). Lean: `system/base` for the
contract, possibly `system/collect` and `system/runtime` under it.

Captain's judgment (HQ accepted): tight, not legacy-literal.
`src/system/` owns the portable-system domain only — base assembly,
the roster + extends-chaining, the `BaseSystem` contract types, with
serious tests. `collect` and `runtime` stay top-level: collect is
input-side (source→spec), base is output-side (spec→published
system) — different directions, and theme-grouping ("all system
stuff") rebuilds the drawer one level up. The 3.3 top-level ruling
stands. The overloaded word (`BaseSystem`, `SystemSpec`,
`@reference-ui/system`, generated `outDir/system/`) stays meaningful
only if the folder's scope stays narrow.

Relationships (the tension resolution — producers vs assemblers):
- `collect` keeps one job: discover (fragments, hosts). Standalone.
- `system/base` assembles portability from discovery + config. It
  consumes collect's output; collect never imports system.
- `packager` owns the act of publishing; `system/` owns what is
  published. `publish/system.ts` splits: the pure build (roster
  chain, base assembly) moves to `system/base` under heavy tests;
  the thin write-to-disk stays a packager leg.
- The 3.10 join is assembly, not discovery — one move to
  `system/base`; collect's goldens battery imports it (healthy
  consumer arrow). The traced half still leaves TS at seam time.
LANDED (W2 N-3): contents per WAVE1-SYSTEM-BASE S0/S1/S3/S4/S5/S6;
split at packager/system.ts:104/105. Remaining: whether Neo's
top-level `primitives/` docks under `system/` after 3.9 lands
(aligned, not now); the `src/system` vs `out/system` naming
collision watch.

### 3.12. `src/cli/`: the user-facing command layer, thin by law (HQ: no logic in the binary)

HQ: `src/cli/sync`, `src/cli/clean` — the CLI is the user-facing
surface and nothing else. No actual/build/compile logic; that
separation is what keeps module boundaries honest.

Captain: the bin was guiltier than it looked. `bin/neo.ts` (134
lines) hosted three commands' worth of logic — LANDED overnight
(W2-CLI): `src/cli/` owns one file per command plus shared
helpers under Commander, `bin/neo.ts` is a trampoline. The
tasty-drain essay relocated to `reference/bridge`, clean unifies
on `cleanDir`, the watch driver stayed put.

The thinness law (what cli/ may and may not own):
- OWNS: argv→options mapping, exit codes, human printing (`[neo]`
  lines), process lifecycle (SIGINT/SIGTERM, the watch
  never-promise). Errors name the cause and exit nonzero — here.
- MUST NOT own: the link list (packager's PACKAGES — NIGHT-1's
  derivation moves with `cmdClean`, still derived); the wipe
  (`cmdClean` uses raw `rmSync` while `sync/clean.ts` has the
  retrying `cleanDir` — unify on the primitive, cli calls it); the
  tasty drain (becomes one subsystem call, or pushes into the sync
  recipe — the REF-10 knowledge leaves the command); compile,
  publish, link construction (subsystem calls, never inlined).
Watch splits in two: cli/ owns the `--watch` flag routing
unconditionally; the driver's home is WAVE1-WATCH's 11 AM verdict
(stays vs splits) — this item does not preempt it.
Framework target (HQ): Commander.js. Overkill for today's two
verbs + one flag, correct as the declared target — hand-rolled
parsing rots at the third command, which is when logic creeps back
into the binary. Commander owns argv shape only; the thinness law
above is unchanged.
Output contract (HQ, verbatim shape): success emits ONE minimal
line — `⎔ ref sync ⫶ 100 ms ⫶ 1.0 MB` — glyph + command + stats,
nicely coloured, separators in a darker muted tone (never bright).
Warnings fold onto the line — `⫶ ⚠ 3 warnings [--verbose]` — by
default; verbose lists them instead. Errors are the exception:
full cause, loud. Standard path stays whisper-quiet.
LANDED (W2-CLI): per-command files + shared helpers; tasty drain
stays a named subsystem call (essay to bridge); clean unified on
`cleanDir` (retry verified, no HOLD needed). DECIDED (HQ, Final):
it's `ref`
— always was. `ref sync`. The binary renames `neo` → `ref`
(mechanical wave + conscious pin updates: NEO-CLI pins `[neo]`
strings today, and the rename re-pins them deliberately).

### 3.13. Watch rebuild is level-triggered: the folded next tick (HQ: no compile queues)

HQ thought (2026-09-24 morning): AI agents spit multiple changes —
two files in 50ms draining a buffer, ten files mid-compile. If watch
events were a queue, one compile with ten mid-flight changes would
schedule ten recompiles after it. That is backwards.

Rule: while a compilation runs, watch events ACCUMULATE into a
single dirty bit; at compile end they fold into ONE "next tick".
Loop: `while dirty { dirty = false; compile() }`. Ten files during
one compile = exactly one recompile after. Trigger sources collapse
— fs events, the session-lock SIGUSR2 poke, future manual triggers
all just set dirty. Failure does not swallow the bit (failed
compile + dirty → retry, same loop). Continuous change means
continuous rebuild — correct, not starvation: the tree converges to
latest instead of replaying history. Scope: the `lib/watch` driver
loop only (one-shot `sync()` has no loop to fold). Orthogonal to
the session lock (intra-process scheduling vs inter-process mutual
exclusion) — the two compose. STATUS: planned, unbuilt — small
follow-up arc after the sync-lock crew lands (same loop file,
stepped commit, no mid-flight rebrief).

## 4. Run log (updated as we talk — the plan tracks reality)

### Done (landed, verified, committed)

- Packager concept installed (`src/packager/`, 14 files) from legacy's
  solved shape; HERMDIV fixed through its externals policy; chain
  green native + hermetic (3.1's first proof — the concept pays rent).
- `lib/symlink` ported from legacy (one-word names, README,
  `symlink-dir` latest) and ADOPTED: every link call-site routes
  through it; v10 API fix included.
- Neo README rewritten mission-first ("the TypeScript portion of the
  compiler"); README law set (purpose-first, never directory tours).
- Map decisions: 3.3 collect layout (surface/ + lib/, 3 READMEs), 3.8
  fork B (`author/` dies), 3.9 primitives spec + `vendor/` rename
  queued. One-plan merge done (Tokyo folded into this file).
- Voyage Obj1/Obj2/Obj3 COMPLETE — the stability gate's chain half is
  green; full-gate sign-off is the morning call.

### In flight (right now)

- COLLECT-REFACTOR LANDED (e091c008a): fragments→collect with
  surface/ + lib/ + constants + 3 READMEs; 337 units + q + chain 6/6
  + T1 re-proven firsthand on final bytes. (Crew aimed pre-art;
  captain applied the delta.)
- AUTHOR-KILL LANDED (4386d9d9b): `author/` deleted, id answers
  from root `src/index.ts` (5 fns + types, factories unexported),
  all wirings repointed, real `"."` export added. 337 units + q +
  chain 6/6 + T1 + FULL 197/197 re-proven firsthand on final bytes.

### Overnight run (DISPATCHED 2026-09-23 ~21:00 — walk-away-proof)

Five crews, zero HQ decisions needed mid-flight. NIGHT-1 is the only
writer (fully-specified fixes); NIGHT-2..5 are read-only (survey/spec,
LOG-2.md sections only). All report, never land; captain verifies +
lands in the morning.

1. **Packager follow-ups** (execution, small, fully specified): derive
   clean's link list from PACKAGES (fixes the `neo clean` types-link
   orphan the symlink crew withheld); unify the needle-list copies
   the collect crew logged as smells. Proof: units + q + chain + T1.
2. **PostCSS adoption survey** (read-only): map every CSS-text
   touchpoint in Neo (merge, scoping, emission, validation) +
   legacy's exact PostCSS usage file:line + propose the CSS module
   shape with dependency options. No implementation. Delivers 3.2's
   decision brief for the morning.
3. **Sync responsibility enumeration** (read-only): every
   responsibility inside `sync/` today, one per line, with file:line
   + proposed item home (packager/css/collect/stays). Delivers 3.7's
   cut list for the morning.
4. **Primitives home brief** (read-only): RS-side vs Neo-side for the
   3.9 generator + test station, argued both ways with the tasty
   vendor + canon consult paths as evidence. Delivers the home
   decision for the morning.
5. **Primitives codegen spec** (read-only, the big one): spec the 3.9
   end-state — RS emission shapes (raw primitive files + types,
   names from typegen, single source of truth), the Neo test-station
   case list (behavior per primitive family + type-validity and
   type-invalidation cases), and the seam contract (what crosses the
   cut, in what form, freshness rule). No implementation. Delivers
   the implementation-ready spec + sequenced wave list for the
   morning.

Explicitly NOT overnight: the `vendor/` rename (needs HQ's name),
`author/`--adjacent judgment calls, anything touching the
collect/author landing zone until both are green and committed.

## 5. Standing constraints (carried, not re-debated)

- Chain tests stay. Neo never imports core/lib/legacy paths. Cases +
  Playwright prove behavior; goldens prove strings. No matrix/Dagger in
  the inner loop; hermetic tiers re-gate publish/runtime changes.
- No new LiquidJS in Neo. No regex/brace-matching on CSS once the
  PostCSS module lands (core's hardening bar, adopted).
- README law: purpose-first, never directory tours; ASCII welcome.
- Workflow: [agent-neo](../../.agents/skills/agent-neo/SKILL.md)
  (`pnpm agentneo`). Cases live in `tests/`; the index in READMEs.

## 6. Open questions (think here)

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
