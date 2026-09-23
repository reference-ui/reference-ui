# Matrix decommissioning report

Objective 2, HQ-directed. This report is the justification for retiring the
matrix as the behavior-proof home for Reference UI — for every suite
except chain. Per HQ's reversal the chain tiers were restored to
matrix/tests/chain/ (engineering safety: chain answers
between-packages/between-environments questions; it stays in one
place to test and reason about), and per HQ's dual-coverage ruling
they stay dual-covered with Neo CHAIN-01…06 (matrix = second lens,
Neo = fast loop). Chain is the KEPT COUNTEREXAMPLE to the
decommission thesis, not a port. The kept gate is 11 tiers + mcp.
It rides the Objective 2 landing commit.

Sources read firsthand (not from summaries): LOG-2.md (audit map, Phase 1
PORT acceptances, install-dimension verdicts, §6 home table, HQ REVERSAL +
HQ DUAL-COVERAGE rulings); the pipeline
registry code (`pipeline/src/registry/pack.ts`, `load.ts`,
`package-prep.ts`), the matrix runner (`pipeline/src/testing/matrix/runner/
package-runner.ts`, `consumer.ts`, `ref-sync.ts`,
`node-modules/install.ts`), `pipeline/config.ts`, `pipeline/dependencies.ts`;
the kept suites (`matrix/tests/chain/T2`, `matrix/tests/mcp` harness); and
the landed Neo PORT cases (`NEO-CHAIN-01`…`NEO-CHAIN-06`, `NEO-CLI-01`,
`NEO-CLI-02`, `NEO-WATCH-01`) plus the Neo case runner
(`packages/reference-neo/tests/shared/runner.ts`).

---

## 1. Steelman: what HQ's discovery actually proved

HQ's founding observation is correct and this report does not relitigate
it: **single-environment testing leaves real uncertainty on the table.**
The registry README says it outright — "some of the most important
failures only appear after packaging and distribution" — and the
machinery was built to close exactly that gap. Here is what
Verdaccio-in-a-container proves that one dev environment cannot, stated
precisely:

1. **Packaged-artifact fidelity.** `pack.ts` stages each package,
   rewrites `workspace:*` to concrete versions (`package-prep.ts`),
   runs `pnpm pack`, and then *gates* on the tarball containing every
   declared packaged path (`tarballContainsDeclaredPackagedPaths`).
   A workspace checkout resolves imports through symlinks into source
   trees; it can never tell you that `files`, `exports`, or `dist`
   output is wrong. Only installing the tarball answers that.
2. **Declared-dependency completeness.** The Dagger consumer installs
   with `pnpm install --registry <staged-url>` (`install.ts`) into a
   virgin `node_modules` on `node:24-bookworm` (`dependencies.ts`).
   Anything the code imports but does not declare — phantom deps that
   resolve in the monorepo through hoisting or sibling checkouts —
   fails there and only there.
3. **The install lifecycle itself.** Bin shims resolve, `prepack` legs
   run, engine constraints and peer resolution bite, under a real
   package manager against a real (local) registry. `load.ts` publishes
   via `npm publish` into managed Verdaccio and rebuilds the registry
   when artifact hashes change — an actual publish/install round-trip,
   not a simulation of one.
4. **The cross-package graph over packed artifacts.** The consumer
   materializer (`consumer.ts`) rewrites every `workspace:` dep to a
   staged `file:.matrix-tarballs/*.tgz` specifier, so downstream suites
   consume upstream *tarballs*, in dependency order, with built
   `dist/` output — the "someone else's base system" framing HQ named.
   Ordering failures and packed-shape drift surface here.
5. **Checkout-independence.** The container shares nothing with the dev
   machine except the tarballs. Stale `dist/`, leftover `.reference-ui/`,
   global installs, shell env, and "works on my machine" state are all
   excluded by construction (`DISABLE_DAGGER_CACHE`, fresh container
   per entry, `pipeline/config.ts`).

All five are genuine. The question this audit answered is not whether
they are real, but **which suites need them** — and the answer is: far
fewer than the 19-suite matrix charged them to.

---

## 2. The split: install-boundary uncertainty vs behavior semantics

The audit's central finding is a conceptual split, and the whole
decommission rests on it:

- **Packaging/install-boundary uncertainty** is about the artifact *as
  distributed*: what is in the tarball, what resolves after install,
  what the bin does on a foreign filesystem, how packed packages
  compose. It is container-local by nature. Only pack → publish →
  virgin-install → run answers it.
- **Behavior semantics** is the compiler as a pure function of its
  inputs: given these sources plus this config, `sync` emits these
  bytes and the browser paints these pixels. The function is
  deterministic; its output is identical in any container. The
  container adds no information once the inputs are fixed — only
  latency and flake surface.

Three defenses of the split, all firsthand:

**The runner's own phase structure concedes it.** `package-runner.ts`
runs three phases: `install` → `setup` (`neo sync`) → `test`. Every
behavior assertion in every suite executes in the `test` phase, against
post-setup output. For a suite whose assertions touch only post-setup
behavior, the `install` phase is a *constant*: it cannot change the
verdict, because nothing in the assertions reads it. The
install-dimension investigation verified this leg by leg for the two
hardest cases (distro, watch): no leg asserted tarball contents,
installed layout, bin shims, virgin-env resolution, or multi-node
behavior (LOG-2.md, install-dim §§1–2). What those legs asserted was
CLI lifecycle and resync→paint loops — pure behavior.

**The Neo home executes the same function, not a mock of it.** This is
the "mock theater" objection, and it fails on the code. The Neo runner
(`shared/runner.ts`) performs, per case: real esbuild build of the
world sources (`buildWorld`), real `sync(worldDir)` through the
production `src/sync/index.ts` (`runSyncHook`), real HTTP serve, real
Chromium launch, and spec assertions reading real computed styles and
real emitted bytes. The case specs reach past the browser into
`evaluated-system.json` (deep-equal on merged tokens),
`jsx-elements.json` (merge pins), `styles.css` (rule pins), and
`baseSystem.mjs` (republish pins). There are no stubs between the
assertion and the engine except the ones the matrix itself uses
(Playwright, a static server). Section 3 cites what each PORT case
executes; the pattern is uniform.

**The toolchain inputs are pinned, not ambient.** Same Neo sources,
same reference-rs native binary (rebuilt and golden-pinned on the
landing tree), same React 19, same Chromium protocol. The matrix added
exactly one behavior-relevant input the native loop lacks — the
installed-filesystem layout — and §4 keeps precisely the suites whose
assertions read that input.

The honest boundary of the split: it holds for deterministic behavior.
Anything timing-, network-, or registry-implementation-dependent stays
on the boundary side. The audit found no behavior suite in that class
except the keeps named in §4.

---

## 3. Why each PORT/DROP is proof-equivalent

Rule used throughout: one coverage home per behavior — EXCEPT chain
rows, where HQ's dual-coverage ruling voids one-home (a DUAL cites
the Neo case plus the kept matrix tier; reviewers verify both homes
green, not zero-residual). A PORT cites the
new Neo case plus the deleted matrix file; a DROP cites the pre-existing
Neo home; DROP\* marks legacy machinery that dies with core and needs
no home (H6). The full table is the appendix; what follows is the
per-suite reasoning with what the Neo case actually executes.

### 3.1 Chain tiers: KEPT + dual-covered (HQ reversal + dual-coverage)

HQ's reversal restored every chain e2e tier to `matrix/tests/chain/`:
T1/T3/T6/T7/T9/T10/T11/T12/T13 rejoin kept T2/T8, so the full
11-tier gate stays in matrix and the audit's chain PORT/DROP verdicts
are reversed (all other suites' verdicts stand). HQ's dual-coverage
ruling keeps Neo CHAIN-01…06 alongside as the fast loop — matrix is
the second lens for between-packages/environments behavior, Neo the
fast loop; both homes green at landing; the one-home check is void
for chain rows. The extends semantic under test is unchanged:
upstream fragments evaluate in `extends[]` order, scalars later-win,
`_private` strips at the boundary, jsx merges, downstream
republishes. What follows is the fast-loop evidence (each Neo case
below) paired with its matrix lens (each tier re-proves the same
behavior over packed, registry-installed fixtures in a virgin
container).

- **NEO-CHAIN-01** (DUAL with T6 transitive; T10-extends a strict
  assertion-subset of the same row): runner syncs the transitive world for real; spec
  pins three computed-style paints (`rgb(49,46,129)`, `rgb(224,231,255)`,
  `rgb(20,184,166)` — outer-local plus transitive-inner), deep-equals
  merged `evaluated.tokens.colors` across both depths, and pins the
  merged `jsx-elements.json` (`upstream`/`merged` both
  `[DemoComponent, MetaExtendDemo]`).
- **NEO-CHAIN-02** (DUAL with T7 diamond; T12-extends subset),
  **NEO-CHAIN-03** (DUAL with T11 parallel; T13-extends identical),
  **NEO-CHAIN-04** (DUAL with T9-extends legs + prelude-order extends half;
  topology is the previously untouched T4), **NEO-CHAIN-05** (new
  depth-3 coverage per CHAIN_REPORT §4.3; no tier twin — Neo-only new
  coverage, kept per the dual ruling): same
  execution shape — real sync, real paints, merged-artifact pins.
  T10/T12/T13 fold into their rows as strict subsets rather than
  new cases.
- **NEO-CHAIN-06** (real-sync extends regression; no tier source):
  the structural fix, kept as the fast shape pin while the tiers
  re-cover the scenario e2e. The world carries a real upstream package; the
  spec runs real `sync()` on it, reads the published `baseSystem.mjs`
  off disk (singular `fragment`, non-empty, no `fragments`/`cssChunks`/
  `runtime` survivors), rewrites the downstream `ui.config.ts` mid-run
  to extend it (REF-04 pattern), re-syncs, and pins validation passing
  plus evaluated adoption plus sheet vars plus fragment republish plus
  two paints (`rgb(14,165,233)`, `rgb(254,243,199)`). It carries a
  load-bearing negative control: a plural publisher fails the spec.
  This case exists because CHAIN-01…05 use hand-built upstream
  stand-ins (`{name,fragment,jsxElements}`), which once masked a
  real publish/consume shape drift; CHAIN-06 tests the real box.
- **T1/T3 single-hop extends** → pre-existing NEO-SYNC-10 (strict
  behavior-subsets; no new case justified), DUAL with the restored
  T1/T3 tiers.

Restored T3/T9/T10/T12/T13 re-cover their own layers legs in matrix;
the hybrid both-buckets shape stays with T8; T5-new (parallel layers,
never authored) stays held for D17 (H3) — see §5.

### 3.2 Distro CLI lifecycle → NEO-CLI-01 (+ NEO-CLI-02)

Matrix source: `matrix/distro/tests/unit/distro.test.tsx` ~L280–446.
The install-dim leg table (LOG-2.md §1) found every leg behavior-only:
idempotent re-sync, stale rewrite, SIGTERM recovery, clean-restore —
nothing asserting shipped layout, tarball contents, or shims. The
virtual-mirror legs (L288–358) are DROP\* (Neo has no mirror by design,
SYNC-02); the L440 skip stays skipped; type describes already live
with TYPE.

**NEO-CLI-01** drives the real spawned binary (`process.execPath` +
`bin/neo.ts` — `neo` is not on PATH, so this is the sanctioned
invocation, same as `bin/neo.test.ts`): leg 1 byte-identical re-sync,
leg 2 cold sync rewriting three poisoned artifacts, leg 3 SIGTERM
mid-publish (5ms hot-poll tripwire on first published file, retry loop
to catch the ~200ms sync) plus heal, leg 4 clean removing the folder
and scope links plus restore. Every leg ends on an import probe that
resolves the sync-made scope links from the world root and reads
`react.css` plus `baseSystem.name` — the same consumer-surface proof
the matrix's node import probe gave, minus the container.

**NEO-CLI-02** (no matrix source) closes the native gap the
investigation flagged: nothing spawned `neo sync --watch`. It spawns
the resident binary, proves boot via the `watching <dir>` stdout line
(subscriptions live, no settle sleep), proves resync via a token edit
(`resync` + `change` stdout lines plus the sheet pin flipping
`--colors-brand`), and proves SIGTERM → exit 0 graceful shutdown.

### 3.3 Watch contract → NEO-WATCH-01 + NEO-SYNC-14

Matrix source: `matrix/watch/tests/e2e/watch-contract.spec.ts` (3
tests). The loop-over-what analysis (LOG-2.md §2): the watcher consumes
workspace files and emits local files; installed packages are never
re-read by the loop. Fully install-agnostic. The `virtualRecipeFilePath`
and `panda.config.ts` pins are DROP\* legacy; webpack dual-consumption
retires per H5/R4.

**NEO-WATCH-01** uses in-process `watchSync` (SYNC-14's proven
machinery; `onResync` replaces the `session.json` sentinel Neo never
emits) plus a real browser: css edit → sheet realigns + repaint,
token-value edit → repaint, fragment add → variable paints, fragment
delete → variable unpaints — each leg asserting both the sheet bytes
and the computed-style paint/unpaint through query-keyed reloads.
Node-side discovery/debounce/config-dep stays with pre-existing
NEO-SYNC-14. (Mid-spec `buildWorld` re-runs before reload are the
honest dev-loop order, not scaffolding: case pages load `dist/`.)

### 3.4 Micro-ports (P3) → existing groups

Each of these ports 1–8 matrix assertions into the Neo group that owns
the behavior, executing real sync + real browser paint:

| Neo case | Matrix source | What it executes |
|---|---|---|
| NEO-PRIM-13 | primitives L247 (category-prefixed colors) | `colors.red.600`/`yellow.100`/`blue.600` probes plus a bare-spelling control paint identical token colors; sheet carries the three `var(--colors-*)` rules; no raw `colors.*` in any declaration value (`/:\s*colors\./` pin) |
| NEO-CSS-15 | css L277–302 (viewport pair) | one `css()` call with an 840px `@media` branch; sheet block plus both halves (760px base, 960px queried) |
| NEO-COND-18 | css-selectors L65–75 (siblings) | `& +`/`& ~` leaders in `css()` context; both combinators in the sheet, exactly 2 utilities, four paints (peer/overlay on, leader/spacer off) |
| NEO-PRIM-14 | color-mode L96–112 (portal island) | light host + in-tree dark island + second root into a body-level host (the Neo portal shape — the entry exports no `createPortal`); host/BODY placement, `data-layer` + `data-color-mode` stamps, host-light/both-dark paints, zero `[data-panda-theme]` anywhere. Panda spelling deliberately NOT ported |
| NEO-RESP-10 | responsive viewport-contract, whole file (8 tests) | css + recipe + mixed (`r` + `@media` on one call) width/height branches across 220/320px shells; all 8 oracle legs in file order incl. the 4 mixed cells |
| NEO-PRIM-15 | spacing L143–175 (corner pairs) | six primitive probes, one per pair shorthand at `2r`; all twelve addressed corners at 8px (physical + LTR logical) plus expanded longhands in the sheet. `box.d.ts` leg NOT ported (DROP\*) |
| NEO-RECIPE-12 | recipe L265–274 (conjunction, carried optional) | recipe base with `@container` branch + variant with `@media` branch on one shared class; wide+980 paints all four, narrow+980 paints viewport-only |

Declined with reason: the typescript strict-wrapper (Neo's
`defineConfig` has no `strict` surface; TYPE-02 pins the real-union
equivalent — nothing clean to port).

### 3.5 DROPs (pre-existing homes)

- **recipe / primitives / system / tokens rests** → RECIPE/PRIM/SYNC/
  CSS/TOKEN/RESP/MERGE/PARITY ids catalogued in the MAP (Worker B).
  The audit verified the shared suite shape firsthand
  (`workspace:*` deps, `defineConfig`, identical generated
  `vite.config.ts`) and found zero `pack`/registry/Dagger reads in
  any test file: no suite shells the boundary, so none needs it.
- **reference (both files)** → NEO-REF 26/26. H1 resolved by the
  Objective 1 landing (RS fix, 26/26 on the live shape). The
  stale-shape StyleProps assertions die with the suite — re-baselining
  the matrix oracle was ruled MOOT because Neo is the coverage home.
- **css / css-selectors / color-mode / font / responsive / spacing
  rests** → the MAP's A2 id lists (TOKEN-10, GLOBAL-08, LAYER-03,
  TYPE-01, PRIM-10, TYP-FONT, etc.). Recorded divergences (panda-theme
  spellings, `box.d.ts`, pattern-pack surface) are NOT ported.
- **distro rest** → SYNC/TYPE ids; `generated-output.test.ts` is
  DROP\* (Panda-shaped pins Neo forbids per SYNC-02/D2/D4).
- **session (all 3)** → no home: the `tmp/session.json` sidecar is
  retired and `getSyncSession` has no live consumer. Retired contract,
  not relocated coverage.
- **typescript** → TYPE-01/02/03/04 (strict flavor = D17/typegen
  equivalent, pinned).
- **virtual (all)** → no home by design: Neo deliberately emits no
  `.reference-ui/virtual` mirror (`sync/index.ts:149`, SYNC-02
  inventory). The `_reference-component/` list's successor shape is
  covered by REF-01.
- **playwright (both)** → SYNC-01 + NEO-SMOKE-01 + NEO-PLAY-B-01.
  The container-image pin (`v1.62.1-jammy`) is runner infrastructure,
  not behavior, and retires with the suite.

### 3.6 The webpack5 axis

Twelve suites declared a `webpack5` axis. The audit's finding (R4,
accepted): it was bundler-parity, never behavior proof — no webpack leg
asserted anything about compiler output that the vite7 leg did not
also assert, and Neo has no webpack target. Default: retire all axes
with their suites. The narrowest possible preservation (watch
dual-consumption) was explicitly declined under H5. This is a genuine
reduction in cross-bundler evidence; it is accepted because the
evidence was parity-shaped, and parity across a bundler Neo does not
target proves nothing about the shipped compiler.

---

## 4. What stays, and why each needs the boundary machinery

The kept gate is **11 chain tiers
(T1/T2/T3/T6/T7/T8/T9/T10/T11/T12/T13) + mcp ×19**. T2/T8/mcp
survive for distinct boundary reasons — each asserts something whose
inputs include the installed-filesystem layout, which no native case
can construct. The restored tiers survive per HQ's reversal: chain
answers between-packages/between-environments questions and stays in
one place to test and reason about (engineering safety), dual-covered
with Neo CHAIN-01…06 (matrix = second lens, Neo = fast loop).

**chain-t2 — the sole `layers:` prover + the install-space framing.**
Its `ui.config.ts` puts a packed `@fixtures/layer-library` baseSystem
in `layers:` (a surface Neo's `ReferenceUIConfig` deliberately does
not type — D17 deferred, H3), and its spec pins a layer-scoped token
paint (`rgb(99,102,241)`) that resolves only inside the same CSS layer.
The fixture arrives as a staged tarball through the registry install;
the "someone else's base system" standpoint is the test. Until D17
lands, no Neo world can even express the config, let alone prove it.
(T2 also doubles as the install-graph smoke: every kept tier re-proves
installed-bin-in-virgin-container on every run, which is what let
distro fully release.)

**chain-t8 — the policy proof.** Same baseSystem in *both* buckets
(`extends` and `layers`) over packed packages; its ui.config comment
claims allow-and-document as current policy while CHAIN_RULES.md calls
it unresolved. Either way the matrix proof asserts behavior over the
packed boundary that has no Neo home until the policy is settled by a
compiler/HQ decision (H4) and D17 lands. Content untouched by the
migration (import line only).

**Restored chain tiers (T1/T3/T6/T7/T9/T10/T11/T12/T13 e2e) —
the second lens.** Each restored tier re-proves its extends (and
layers, where the tier has them) legs over packed, registry-installed
fixtures in a virgin container — the installed-layout input §2 names
— while the paired Neo case proves the same semantics natively in
seconds. Both homes green at landing; the one-home check is void for
these rows.

**mcp ×19 — the installed-artifact standard, permanent.** Every one of
the 18 test files drives the installed server: global setup boots the
real bin resolved from `node_modules/@reference-ui/mcp/bin/mcp.mjs`
(`helpers/server.ts`), the artifact cache requires built
`dist/mcp-child.mjs` (`helpers/artifact.ts`), and `server.test.ts:24`
asserts `npm_config_registry` — staged-registry proof. Legs span tools,
resources, icons, project discovery/switching, paths/symlinks,
registry lifecycle, and resilient boot, over HTTP transport to the
installed CLI. The `get-tokens` `_private` legs consume the PACKED
`@fixtures/extend-library` — packed-boundary proof with no native
equivalent. The ×19 survived an explicit slim-out stress test
(LOG-2.md install-dim §3): the colocated `packages/reference-mcp`
unit tests already are the native-units home, moving legs natively
would dual-home behavior while dropping the tarball/bin/layout
dimension, and nibbling files saves nothing since boot cost is shared
via global setup. No Neo-side MCP server exists, so no PORT is
possible even in principle.

---

## 5. Honest residue: what nothing proves after this

1. **A true npmjs round-trip.** The staged registry is Verdaccio on
   localhost, and the consumer installs with pnpm. What that does not
   exercise: the real registry implementation, CDN behavior,
   replication lag, provenance/attestation, `npm`-client (vs pnpm)
   resolution, and auth/2FA publish paths. Accepted because the
   exercised surface (pack → publish → view → install tarball) is the
   stable protocol subset, and — decisive — **no deleted suite
   asserted any of the unexercised surface either**. The old gate did
   not prove it; the new gate does not lose it.
2. **Truly foreign environments.** One Node image (`node:24-bookworm`),
   one Playwright image (`v1.62.1-jammy`), one package manager, one
   React line (19 — the react17/18 axes never existed in-tree; all
   suites were single-react19, verified across all 29 matrix.json
   files). No Windows/macOS consumer, no older Node, no
   offline/airgapped install. Same acceptance as (1): the matrix never
   had this breadth, so none of it is lost. If HQ later wants a second
   Node line or an npm-client leg, it is additive to the kept gate.
3. **Layers breadth (RETIRED by the restoration; T5-new remains).**
   Restored T3/T9/T10/T12/T13 re-cover their own layers legs in
   matrix and T8 keeps the hybrid both-buckets shape — the
   T2/T8-standpoint holding is over, and with it the P-chain-2
   PORT-after-D17 backlog (a future native layers home would land
   as DUAL rows, not replacements). What remains is T5-new
   (parallel layers, never authored), still held for D17 (H3).
   If D17 changes layers semantics, the restored tiers' layers
   legs are the tripwire.
4. **T8 policy content.** The kept proof asserts current behavior
   (allow-and-document default, H4), not settled policy. A future
   policy decision must re-examine T8 rather than inherit it.
5. **Legacy-spelling oracles.** Panda chrome (`data-panda-theme`),
   the virtual mirror, `box.d.ts`, the pattern-pack surface, the
   session sidecar: unobserved after this by design (H6). A bug living
   *only* in those spellings dies silently — but those spellings die
   with core in the same commit, so there is no consumer left to meet
   the bug. The risk is exactly zero for shipped surfaces and nonzero
   only for archaeology.
6. **Native-target platform breadth.** Unchanged by this decommission
   (the matrix builds the missing linux Rust target in Dagger when
   needed; local runs use the host binary). Out of scope then and now;
   noted so nobody claims this report covers it.
7. **Docs paint shift (F-PUB-2).** Fixing the publish shape healed
   silently dropped lib tokens in docs; paint may legitimately shift
   where they now resolve, and no docs visual gate exists to confirm.
   Flagged, not chased — orthogonal to the matrix question.

---

## 6. Recommendation

Land the decommission as mapped in LOG-2.md Phase-3-map §§1–6:

- **Delete** 17 suites (css, css-selectors, color-mode, font,
  responsive, spacing, recipe, primitives, system, tokens, reference,
  distro, session, typescript, virtual, playwright, watch) with
  reference-core in the single Objective 2 commit. No chain tier is
  deleted — all 11 e2e tiers stay at `matrix/tests/chain/`.
- **Keep** the 11-tier chain gate + mcp running on the *existing*
  registry + Dagger machinery — the machinery is not decommissioned,
  its load is: staged Verdaccio publish, virgin-container install,
  and `neo sync` setup continue to prove the install boundary on
  every run, and the chain tiers re-prove between-packages behavior
  over packed fixtures.
- **Leave `pipeline/` in place** (purity verdict: only
  `src/testing/matrix/` is matrix-pure; ship/dev/release share the
  rest).
- **Prove the landing** with the gate (§5 of the map, as amended by
  the HQ rulings): hermetic 11 tiers + mcp green, scoped batteries
  green, both homes green for every chain DUAL row (Neo case +
  matrix tier), and the one-coverage-home grep check for non-chain
  rows only (zero residual assertions of ported/dropped non-chain
  behavior in matrix, or the commit does not land — void for chain).

Future work this report does not authorize but files: D17 layers
surface + layers-leg DUALs, T8 settle-then-DUAL, Leg A typegen
widening, F-AXIS-1/2/3 + F-AXIS-4, recipe-classname implementation —
all parked as VOYAGE follow-ups with owners to be staffed.

The matrix answered HQ's one question — "someone downloads from npm
into a virtual env; layers and extends work" — with nineteen suites
where the chain gate plus mcp suffice. After this commit it answers
that question with eleven tiers, keeps the installed-artifact standard
with mcp, and everything else is answered natively, by the same
compiler, against the same oracles, in seconds instead of containers.
Chain is the kept counterexample that proves the rule: decommission
where behavior is single-homed in Neo, keep where the packed boundary
is the test. That is the decommission: not less proof, but proof where
the uncertainty lives.

---

## Appendix: the full home table (from LOG-2.md §6, accepted)

**DUALs** (HQ dual-coverage: Neo id + kept matrix tier, both green
at landing; one-home check void): CHAIN-01+T6 (+T10-extends
subset); CHAIN-02+T7 (+T12-extends subset); CHAIN-03+T11
(+T13-extends identical); CHAIN-04+T9-extends +
prelude-extends-half (topology = untouched T4); CHAIN-05 new
depth-3 (CHAIN_REPORT §4.3; no tier twin — Neo-only new coverage,
kept per the dual ruling); CHAIN-06 real-sync extends regression
(shape-drift pin; no tier source — tiers re-cover the scenario e2e,
CHAIN-06 pins it fast); SYNC-10+T1-extends + T3-extends
(single-hop subsets, pre-existing).

**PORTs** (Neo id + matrix file deleted in the same commit):
CLI-01←distro L280–446 (virtual-mirror L288–358 retired,
L440 skip stays skipped, types with TYPE); CLI-02←bin `--watch` flag
path (no matrix source — closes the native gap); WATCH-01 +
SYNC-14←watch-contract all 3 tests (webpack leg retired per H5/R4);
PRIM-13←primitives L247; CSS-15←css L277–302; COND-18←css-selectors
L65–75; PRIM-14←color-mode L96–112 (panda spelling NOT ported);
RESP-10←responsive viewport-contract whole file; PRIM-15←spacing
L143–175 (`box.d.ts` NOT ported); RECIPE-12←recipe L265–274.
DECLINED with reason: typescript strict-wrapper (TYPE-02 equivalent),
T5-new (layers, H3).

**DROPs** (pre-existing home): recipe/primitives/system/tokens rests
(MAP §B ids); reference both files → NEO-REF 26/26 (H1 resolved by
Obj-1 landing); css/css-selectors/color-mode/font/responsive/spacing
rests (MAP A2 ids); distro rest + generated-output DROP\*;
session all 3 (sidecar retired); typescript (TYPE-01..04); virtual all
(no-mirror design); playwright both (SYNC-01/SMOKE-01/PLAY-B-01).

**KEEPs** (matrix file stays): chain T1/T2/T3/T6/T7/T8/T9/T10/T11/T12/T13
e2e (full 11-tier gate at `matrix/tests/chain/`; T2 sole layers prover
pre-D17, T8 policy proof; restored legs retire P-chain-2, T5-new still
held for D17); mcp ×19 (permanent, installed-artifact standard).
Restored tiers re-cover their own layers legs; T8 keeps hybrid
both-buckets.

**DROP\*** (no home needed, retired-by-design, H6): virtual-mirror
legs, Panda pins/chrome, `box.d.ts`, pattern-pack surface, session
sidecar, playwright self-test, distro generated-output,
virtual-output pins, retired `strict`/`mcp`-config spellings.

Check procedure (binding at landing): grep matrix for residual
assertions of ported/dropped non-chain behavior — zero hits or the
commit does not land (void for chain DUAL rows); every PORT row shows
Neo id + deleted matrix file; every DUAL row shows Neo id + kept tier,
both green; every DROP row shows the pre-existing home; every KEEP row
shows the file.
