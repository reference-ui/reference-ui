COMPLETE

# LOG-2 — Objective 2: matrix chain gate + core retirement

Brief: [VOYAGE.md](./VOYAGE.md) Objective 2. Lands one commit.
Crew shape: voyage captain protocol (cartographers →
implementers → reviewers; captain verifies firsthand and commits).

## Status

Briefed 2026-09-22. Scope: audit every matrix suite (chain, css,
recipe, primitives, distro, mcp, system, tokens, …) — keep only
chain/ship-contract coverage, port the rest to Neo or drop; shrink
top-level `fixtures/` (11 entries); retire reference-core and migrate
live dependents reference-icons + reference-docs (both verified on
`@reference-ui/core`); restructure to `matrix/cases|tests` +
`matrix/fixtures`; `pipeline/` move conditional on verify. test-core
pipeline stays out except objective-ordered proof runs.

## Pending

Suite-by-suite audit: keep (chain/ship) vs port to Neo vs drop.

## MAP — audit crew lead dispatched (2026-09-23) — WORKING

Scope (strict): READ-ONLY everywhere except this log. No source
edits, no suite runs, no Dagger, no installs. Never commit, never
touch the index. Objective 2 IMPLEMENTATION held for Objective 1's
landing — map only. Governing skill `test-core` loaded first (CLI
for orientation only; no pipeline/matrix suites run).

Context read: VOYAGE.md Obj 2 (brief), LOG.md (master), LOG-1.md
Wave-4/F (Neo coverage state: NEO-REF 24/26 green, 2 known
StyleProps reds on D-OPEN-1, Crew F refutation — compiler
capability gap, HQ morning call; full closure STANDS as landing
shape; Crew L landed). Neo coverage = CURRENT tree (Waves 1–4 +
Crew L + unit suites); HQ-dependent verdicts flagged, reds never
relitigated.

Initial recon (lead, read-only):
- matrix/: 19 suites — chain (T1–T13, no package.json at chain/
  root; T1 has own package.json — per-tier shape TBD by worker),
  color-mode, css, css-selectors, distro, font, mcp, playwright,
  primitives, recipe, reference, responsive, session, spacing,
  system, tokens, typescript, virtual, watch (all others carry
  @matrix/* package.json).
- fixtures/: 11 entries confirmed — atlas-project, demo-ui,
  extend-library, extend-library-2, layer-library,
  layer-library-2, meta-extend-library, meta-extend-library-2,
  meta-extend-library-sibling, styletrace-consumer,
  styletrace-library.
- pipeline/: own package `@reference-ui/pipeline` (private),
  src/{build,clean,cli.ts,dev,lib,registry,release,testing},
  setup/{local.sh,macos.sh} — purity TBD by worker D.
- Neo cases: tests/cases/{cond,css,global,harness,layer,merge,
  namer,parity,prim,recipe,ref,resp,site,static,sync,token,type}
  + shared/ — coverage mapping TBD per worker against suites.

Dispatch: 4 nested read-only workers over disjoint audit pieces
(results returned to lead; lead alone writes this log):
- Worker A: chain (T-tier contract) + css-family (css,
  css-selectors, color-mode, font, responsive, spacing).
- Worker B: behavior suites (recipe, primitives, system, tokens,
  reference) — HQ-flag discipline on StyleProps/css assertions.
- Worker C: infra suites (distro, mcp, session, typescript,
  virtual, playwright, watch).
- Worker D: fixtures plan recon + pipeline-purity + core-removal
  (icons/docs reconfirm + importers census + mcp→S6) +
  restructure naming evidence + Neo unit-suite coverage summary.

Verdict scale (per brief): KEEP = genuinely needs shipped
package / Dagger-hard hermetic proof (chain contract,
pack/publish/install, interpackage deps, built-package fixtures,
distro/MCP real-artifact surfaces); PORT = Neo case needed
(covered-elsewhere behavior not yet in Neo); DROP = already
covered in Neo (current tree). One-coverage-home rule shapes
every verdict.

## MAP — worker returns B/C/D filed (lead, 2026-09-23)

Workers B, C, D returned full reports (recovered verbatim from
the result envelopes; `text_len == final_message_chars` for all
three — complete). Worker A's final arrived as a 136-char stub
("already delivered above" — nothing arrived); followup rejected
(child terminal). Redispatched as Worker A2 (same scope, delivery
rule hardened). A2 pending; synthesis after.

Shared shape (Worker B, verified per file, all 5 behavior
suites): package.json deps only `@reference-ui/core` +
`@reference-ui/lib` (`workspace:*`) + React 19; generated
`@reference-ui/react|system|styled|types` resolve via node_modules
symlinks into `ref sync`-built `.reference-ui/*`; ui.config.ts =
`defineConfig({name, include:['src/**'], extends:[baseSystem]})`;
vite.config.ts identical pipeline-generated
(`react() + referenceVite() + entry shim`); no suite shells
pack/publish/install or reads Dagger/CI-only env.

### Worker B — behavior suites (recipe, primitives, system, tokens, reference)

- **recipe**: 3 files (e2e system-contract 26 tests: recipe axes/
  compound/capsule/`@media`/`@container` branches; unit rebuild
  class-stability; unit runtime sheet-hygiene). Hermetic-need:
  none beyond `ref sync` + servers. Neo: NEO-RECIPE-01/02/03/04/
  08, PARITY-01 P9/P13, NEO-SYNC-06/07/14, NEO-CSS-05,
  NEO-PARITY-04. Micro-gap (non-blocking): media+container
  conjunction on one class unpinned as a unit. Verdict: **DROP
  all 3** (optional micro-probe, not a blocking PORT).
- **primitives**: e2e primitives-contract ~50 tests (semantics,
  data-layer, style props, css prop, fonts, containers, rhythm/
  calc, variant contract, css-prop stability across resync);
  unit generated-output (artifact existence, Panda-mirror pins,
  `:where` variant pins, stability); unit runtime variant
  projection. Hermetic-need: `ref sync` CLI only; Panda-mirror
  pins (`virtual/`, `styled/extensions`, `panda.config`) are
  Neo-forbidden (SYNC-02) → legacy-only. Neo: PRIM-01/02/05/06/
  07/08/09/10, SYNC-04/06/14/15, CSS-06/07/10/12, TOKEN-04/07/08/
  10, RESP-07/08, MERGE-03/04, PARITY-01 P3/P10. **Gap**: direct
  category-prefixed style-prop values (`color="colors.red.600"`)
  + no-raw-`colors.x` sheet pin — no Neo world pins the
  `colors.*` literal spelling. Static: 6 reds Sep-16
  (data-layer, css-prop position, jsxElements radius, calc
  rhythm) — week-old, indicative only. Verdict: **DROP e2e
  except PORT one micro-case** (category-prefixed `colors.*`
  values + no-raw-leak pin); **DROP** both unit files.
- **system**: e2e system-contract 24 tests (tokens→paint,
  color-mode islands via `data-panda-theme`, spacing/radii,
  globalCss/keyframes, layer composition, mounted-sheet pins);
  e2e system-font-contract 4 tests; unit runtime smoke. No
  hermetic-need. Neo: TOKEN-05/10/11, PRIM-07, COND-04,
  CSS-12, EDGE-02, GLOBAL-02/08, LAYER-01/02/04, PARITY-01
  P6/P8. `data-panda-theme` spellings are a RECORDED DIVERGENCE
  (PARITY-04 cites the matrix pin) — behavior covered, spelling
  must not port. Verdict: **DROP all 3**.
- **tokens**: e2e 5 tests (tokens→paint, rename-rebuild with
  browser poll); unit runtime smoke; unit tokens-output 6 tests
  (`panda.config.ts` pins, var pins, stale-removal). Hermetic:
  `ref sync` CLI; `panda.config.ts` pins Neo-forbidden.
  Neo: TOKEN-01/05/06, CSS-01, SYNC-06/07/14. Static: e2e
  rename RED Sep-16 — toolchain failure (`No native runtime
  plans registered`), harness-level. Verdict: **DROP all 3**.
- **reference** (HQ-FLAGGED): e2e reference-contract 18 tests
  (incl. StyleProps page, extends fixture); unit
  reference-output 7 tests (Tasty artifacts, StyleProps 100+
  members, built-types package shape + symlink + live import,
  rename refresh). `matrix.json`: **`refSync: full` (only
  one), bundlers vite7-only, `runTypecheck: true`** + local-dev
  override config. Strongest hermetic-need of the five, but no
  registry/Dagger step; built-package link+import re-proven by
  NEO-REF-01. Neo: 24/26 per brief (REF-01/02/03/04/05/09/11 +
  unit suites; `accentColor`↔`WebkitAppearance` substitution,
  order-insensitive extends per D-OPEN-2). **HQ-FLAG**: e2e-2
  (StyleProps page → REF-03/18 red), e2e-3 halves, unit-3 +
  style halves of unit-1 (→ REF-02/02 red) depend on HQ's Obj-1
  call (Crew F refutation stands; not relitigated). Static: 1
  red Sep-16 (missing-symbol harness-level). Verdict: **DROP
  both test files, HQ-FLAGGED** for the StyleProps-bearing
  assertions. No KEEP, no PORT.
- Globals: NONE of the 5 consumes top-level fixtures/;
  interpackage behavior only `extends:[baseSystem]` from lib
  source (Neo SYNC-10/17, LAYER-02 cover adoption). **Lead
  decision noted**: recipe/primitives/system/tokens declare a
  `webpack5` axis (reference vite7-only) — bundler-parity, not
  behavior proof; no per-behavior KEEP in B scope. All
  test-results error-contexts Sep-16 (~1wk old).

### Worker C — infra suites (distro, mcp, session, typescript, virtual, playwright, watch)

- **distro**: unit distro.test.tsx 729 lines (sync/clean
  round-trips, SIGTERM-interrupted recovery, rename/delete
  cleanup, idempotence, import probes, type surface incl.
  strict-colors) + unit generated-output (legacy filenames,
  exports map, sheet parse). Hermetic-need: STRONGEST in batch
  — real `ref` CLI, SIGTERM kill, real tsc, Panda-shaped
  output. Neo: SYNC-02/03/05/06/07/12, TYPE-01..05/07, clean.ts
  cover shape/determinism/stale/type-surface; NOT covered:
  interrupt-recovery, `ref clean` round-trip, import-probe
  (PORT-able vs `neo sync`); Panda-shaped assertions
  UN-PORTABLE (Neo D2/D4 forbid). Verdict: **SPLIT — KEEP the
  CLI-lifecycle core** (distro.test.tsx ~L280-446: idempotent
  re-sync, cleanup, stale rewrite, SIGTERM recovery,
  clean-restore) **until PORT lands** (one Neo CLI-lifecycle
  case vs `neo sync`); **DROP** generated-output + type
  describes. **HQ-FLAG**: strict-colors + StyleProps/css/token
  assertions L458-546 sit on HQ's Obj-1 surface.
- **mcp** (19 test files + helpers): every file drives the
  INSTALLED server (global-setup boots real bin;
  helpers/server.ts resolves `node_modules/@reference-ui/mcp/
  bin/mcp.mjs`; artifact.ts requires built `dist/mcp-child.mjs`;
  npm_config_registry asserted). Tools, resources, icons,
  project-discovery/switching, paths/symlinks, registry
  lifecycle, resilient boot. Fixtures: ONLY suite of the 7
  consuming top-level fixtures/ — `@fixtures/extend-library`
  (package.json:18, ui.config.ts:3, `extends`) for the
  upstream-`_private` non-leak proof. Neo: ZERO MCP/tool
  coverage (grep clean); overlaps only approximate (SYNC-17
  strip ≠ MCP visibility; REF-02 ≠ tool projection). No
  Neo-side MCP server exists → un-portable. **Core import
  correction (brief said "mcp imports")**: no test/src file in
  `matrix/mcp` imports core directly; the surface is consumed
  one layer down by `packages/reference-mcp` (reference.ts:3-7,
  join.ts:6 — `{createReferenceDocument,
  createReferenceUiTastyApi, ReferenceDocument}` from
  `@reference-ui/core/reference`, provided by core
  package.json:40-42). Verdict: **KEEP entire suite, all 19
  files** — canonical shipped-package/Dagger-hard proof.
  **HQ-FLAG**: (a) reference.ts/join.ts core/reference imports
  (S6 handoff sufficient — not relitigated); (b)
  reference-adjacent assertions (get-component*, primitive-
  observation, style-props exclusion/reference); (c) `_private`
  strip + icons import-string pin.
- **session**: unit public-api (core `getSyncSession` vs tmpdir
  JSON — pure unit), unit session-manifest (legacy sidecar
  contract after one-shot sync), unit runtime smoke. Neo has
  NO session concept (SYNC-02 folds `tmp/` absence; D2
  forbids). Verdict: **DROP all 3** (legacy sidecar retired;
  core-only API has no Neo target).
- **typescript** (no tests/ dir — typecheck-only; assertions in
  src/*.assertions.ts; `runTypecheck: true`; `strict:
  ['colors','radii']`): sync-regenerates-types + tsc-narrowing
  contract. Neo: TYPE-01/02/03/04 subsume (strict flavor =
  D17/typegen `emit_dts_with`, open-hatch equivalent pinned).
  Verdict: **DROP (covered)**; optional small PORT for exact
  strict-wrapper flavor. **HQ-FLAG**: whole suite is
  strict-token typing surface.
- **virtual**: 4 unit files (`.reference-ui/virtual` mirror
  incl. `_reference-component/` 10-file list, orphans/missing,
  byte-identity, smoke). Neo deliberately has NO virtual
  mirror (`sync/index.ts:149`; SYNC-02 inventory excludes it).
  Verdict: **DROP all** (retired contract). **HQ-FLAG (minor)**:
  `_reference-component/` list is reference-adjacent; REF-01
  covers the successor shape.
- **playwright**: e2e smoke (install+sync+browser in container;
  trivial assertions; image pin `v1.62.1-jammy`) + unit smoke.
  Neo: SYNC-01 + NEO-SMOKE-01 + NEO-PLAY-B-01 subsume the loop;
  container-image pin is runner infra, not behavior. Verdict:
  **DROP both** (if any Dagger image-smoke must survive, one
  line in the KEEP rationale, not this suite).
- **watch**: e2e watch-contract 502 lines, 3 tests (live `ref
  sync --watch` + session.json sentinel + file-mutation→browser
  round-trips; dual-bundler consumption dimension; config-dep
  + discovery/deletion) + unit smoke. Neo: SYNC-14 covers
  node-side watch (add/change/delete, debounce, config-dep);
  REF-04 covers rename+ browser leg. NOT covered: (a)
  dual-bundler consumption (no Neo webpack target —
  un-portable); (b) browser-paint leg off live watch resync
  (PORT-able). Verdict: **SPLIT — PORT watch-contract.spec.ts**
  (one Neo case: live-edit→paint loop; until authored, keep
  this file as the only live-watch proof); **DROP** unit smoke;
  webpack dual-consumption narrow-KEEP only if HQ requires
  cross-bundler watch proof post-VOYAGE.

### Worker D — fixtures / pipeline / core-removal / restructure / Neo units

- **Fixtures (11)**: 7 chain fixtures STAY (extend×2, layer×2,
  meta×3 — consumed by chain T1–T13 via `workspace:*` +
  baseSystem imports + packed via pipeline/config.ts:35-41;
  extend-library also by matrix/mcp + both metas). 4 non-chain
  (atlas-project, demo-ui, styletrace-*) have ZERO matrix
  consumers; only physical-dir readers are styletrace suites
  (fixtures.test.ts + tracing.rs; atlas uses vendored copies +
  string literals) → shrink/die or move styletrace-local, NOT
  matrix/fixtures.
- **Pipeline-purity**: NOT a clean move. Matrix-pure ONLY:
  `src/testing/matrix/` (+ managed templates). NOT pure:
  `src/release/` (npm ship path), `src/dev/` (docs/lib dev
  loops), `src/build/` (+`build/rust` — registry-target +
  native builds; cited by reference-rs DIST.md), `src/registry/`
  (release staging shares it), `config.ts` (release lists),
  `dependencies.ts` (shared node image), `setup/` (rust
  targets), `scripts/run-if-env-absent.mjs` (lib/core builds).
  External consumers: root `pipeline`/`release`/`setup:local`
  scripts; `pnpm agent` runner; lib+core package.json scripts;
  reference-rs DIST contract; docs/lib `pipeline dev`;
  docs prose. Verdict: **do NOT move wholesale** — honest
  shape is a split (matrix runner → matrix; ship/dev/release
  → stay), or leave `pipeline/` in place.
- **Core-removal reconfirm (CURRENT tree)**: (a) icons: peer
  `*` + dev `workspace:*`, ui.config.ts defineConfig,
  build.mjs ensure-core-cli step resolving
  `../reference-core/dist/cli/index.mjs` — LIVE, reconfirmed.
  (b) docs: runtime `workspace:*`, ui.config.ts defineConfig,
  vite.config.ts:22-23 dynamic `referenceVite()` (serve only),
  `ref sync` in dev/build scripts — LIVE, reconfirmed. (c)
  mcp→S6: imports live in **`packages/reference-mcp`**
  (join.ts:2-6, reference.ts:3-7 + config/paths/tokens/
  constants surfaces across ~15 files — deepest importer);
  Neo S6 = `src/reference/api.ts` ("Objective 2 migrates mcp
  onto it") exporting the full needed surface (incl.
  createReferenceDocument, createReferenceUiTastyApi,
  formatReferenceType, ReferenceDocument/MemberDocument types)
  — sufficient by export-name match, reconfirmed. (d) Census:
  matrix boilerplate triple (package.json + ui.config.ts +
  vite.config.ts) in EVERY suite + all chain T-tiers (only
  non-boilerplate: session public-api.test.ts:2
  `getSyncSession`); all 7 chain fixtures + atlas-project
  (defineConfig + core build scripts); packages/reference-mcp
  ~15 files; reference-lib (dep + build:deps + ui.config +
  book vite); pipeline (config lists, runner manifest gate,
  managed bundler templates, node cache, test literals); Neo
  boundary is string-literal aliases only (no real imports;
  biome bans them); core self-refs die with the package; ZERO
  in demo-ui/styletrace fixtures and outside the above.
- **Restructure naming**: suites are "packages" today
  (matrix.json → `@matrix/*` discovery; `tests/{unit,e2e}/`
  per suite; no `cases/` anywhere under matrix; "matrix
  tests"/"matrix packages" in docs). Neo/RS "cases" is taken
  twice (Neo Playwright cases + RS station cases) with
  discovery + tooling assuming cases≠matrix — adopting
  `matrix/cases` creates a THREE-way collision. Verdict:
  **`matrix/tests`** (zero discovery-contract rename, zero
  collision, matches existing per-suite `tests/` + docs).
  `matrix/fixtures`: consumers resolve via workspace package
  refs (rewritten to tarballs at pack), NOT relative paths;
  shared-base DAG cross-consumed → **flat**
  `matrix/fixtures/{extend-library,…}` preserving
  `@fixtures/*` names + registry staging.
- **Neo unit backstop**: 40 colocated `src/**/*.test.ts`
  (config/collectors/merge/native-scan/scanner/sync/runtime/
  primitives/reference/infra) + ~30 RS module vitest files +
  12 shared harness helpers + **205 case specs across 17
  groups** (cond 18, css 14, global 13, harness 5, layer 5,
  merge 8, namer 4, parity 7, prim 12, recipe 11, ref 26,
  resp 9, site 30, static 3, sync 19, token 14, type 7).

### Lead verification spot-checks (read-only, 2026-09-23)

Reconfirmed firsthand (no trust without bytes): icons
package.json:50/:54 + ui.config.ts:1/:4 + build.mjs:25 (D said
:26 — off by one, substance holds) + ensure-core-cli.mjs:8/:15;
docs package.json:7/:8/:13 + ui.config.ts:1/:4 +
vite.config.ts:22-23; reference-mcp core imports (join.ts:6,
reference.ts:7, tokens.ts:1, paths.ts:2, config/paths/constants
surfaces, package.json:48); Neo S6 api.ts export blocks
(:7/:13/:18/:24); pipeline/config.ts REGISTRY (7 fixtures +
icons/rust/core/lib/mcp) + RELEASE (5 packages) lists. All
Worker D Part-3 claims hold; line-nit on build.mjs only.
Also confirmed firsthand: root scripts `pipeline`/`release`/
`setup:local` consume pipeline/ (purity blocker); workspace
globs include `matrix/*/*` (chain tiers) + `fixtures/*`;
Objective 1 working-tree payload present, index untouched by
this crew (only LOG-2.md writes).

## MAP — worker A2 filed + lead firsthand cross-checks (2026-09-23)

A2 returned complete (`text_len == final_message_chars` =
15885). Chain + css-family scope covered.

### Worker A2 — chain (11 tiers) + css-family (6 suites)

- **T-tier inventory**: T1/T2/T3/T6/T7/T8/T9/T10/T11/T12/T13
  exist; **T4/T5 missing, not covered elsewhere**
  (CHAIN_REPORT.md:163-168 "still-untouched"; partial overlap
  only via T9 + unit `collectUpstreamSystems` per CHAIN.md:241).
  Uniform shape: vite7-only, react19, watch-ready; ui.config =
  extends[]/layers[] of built `@fixtures/*` baseSystems; e2e
  `Tn-contract.spec.ts` each; T1/T2/T3 add unit runtime smoke.
- **Fixture consumption**: ui.config imports baseSystem from
  `@fixtures/<lib>/baseSystem`; src renders fixture demo
  components. Fixtures are BUILT packages (tsup + bootstrap +
  chained `build`, `prepack → build`); pipeline builds
  upstream fixtures then syncs per entry (CHAIN_REPORT:116-127).
- **Hermetic-need (chain)**: interpackage built-artifact flow,
  NOT shipped-tarball/Dagger in test code (zero pack/tsup/tgz
  hits in tier tests/src). Hard need = multi-package build
  ordering (consumer sync requires fixtures' dist/ +
  published baseSystem.fragment/css).
- **Neo chain coverage**: single-hop extend (SYNC-10),
  `_private` strip (SYNC-17), owner passthrough (TOKEN-09),
  two-system nesting + data-layer scoping (LAYER-02). GAPS:
  transitive chains, diamonds/shared-base, multi-upstream
  prelude order, T8 policy, ALL `layers:` legs (**Neo D17
  defers the `layers` config surface, BAS-LAYER unproven**).
- **Chain verdicts**: T1 e2e DROP; **T2 e2e KEEP** (sole
  `layers:` prover; PORT after D17); T3 PORT (layers half
  D17-blocked); T6/T7/T11 PORT; **T8 e2e KEEP** (policy proof;
  needs compiler/HQ decision before port); T9/T10/T12/T13 PORT
  (layers legs D17-blocked); T1/T2/T3 unit DROP; T4/T5
  PORT-as-new if wanted.
- **css**: e2e ~28 tests + unit runtime. No hermetic-need
  (local `.reference-ui` reads; rebuild shells in-repo CLI).
  Neo covers all but viewport `@media (min-width:840px)`
  probes (Neo D8 container-first, no screen breakpoints).
  Verdict: **PORT the 2 viewport-mq tests, DROP rest + unit**.
- **css-selectors**: e2e 13 tests + runtime + virtual-output
  (Panda-neutralization pins — legacy machinery). GAP: `& +` /
  `& ~` siblings in `css()` context only. Verdict: **PORT 2
  sibling tests, DROP rest** (virtual-output DROP* legacy).
- **color-mode**: e2e 11 tests (islands/scopes/toggles/portal)
  + smoke. GAP: portaled island only (pins
  `data-panda-theme='dark'` — Panda chrome Neo drops per
  D1/GLOBAL-09; port must re-target). Verdict: **PORT portal
  test only, DROP rest**.
- **font**: e2e 4 tests + unit 213 lines (mirror legs legacy).
  Neo: TOKEN-10, GLOBAL-08, LAYER-03, TYPE-01, PRIM-10,
  TYP-FONT. Verdict: **DROP all**.
- **responsive**: system-contract 10 tests (container legs →
  DROP) + **viewport-contract 8 tests (whole-file PORT, HQ D8
  call)** + runtime DROP + generated-output DROP (mirror
  DROP* legacy).
- **spacing**: e2e ~18 tests + unit. GAPs: corner-pair
  shorthands (PORT 2 tests); `patterns/box.d.ts` leg =
  approved absence (DROP* legacy). Verdict: **PORT 2
  corner-pair tests, DROP rest**.
- **Css-family fixtures**: NONE consumes top-level fixtures/
  (only responsive's local `output-fixtures` naming).
- **HQ-flags**: (1) panda-theme chrome in color-mode oracle;
  (2) pattern-pack type surface; (3) DROP* legacy virtual
  machinery — assumes cutover obsoletes, else KEEP; (4) Crew F
  staleness adjacency (spacing/font type-surface pins);
  (5) viewport-`@media` vs D8 (PORT vs approved absence).

### Lead firsthand cross-checks on A2 (read-only)

Verified: chain test-file inventory (T1-T3 e2e+unit, T6-T13
e2e-only; css-family e2e+unit, +viewport-contract and
generated-output/virtual-output extras where A2 said);
per-tier `@fixtures/*` deps (T1 extend, T2 layer, T3 both, T6
meta, T7 meta+sibling, T8 extend, T9 4-way, T10 layer+meta,
T11 meta+meta-2, T12 meta+sibling, T13 layer+meta+meta-2 —
matches A2's table exactly); css-family zero `@fixtures`
refs; matrix.json axes (css-family vite7+webpack5 except
css-selectors vite7-only; chain vite7-only); T8 ui.config
(same baseSystem in BOTH buckets; its comment claims
"allow-and-document" as current policy); T12 ui.config
(extends=[sibling], layers=[meta] — matches A2); T2 e2e
(layer-scoped token proof); T6 ui.config (transitive via
outer only). A2 fully corroborated.

### Lead reconciliation notes (brief vs worker tensions)

- **R1 — chain gate shape (ACCEPT A2)**: brief names "the
  chain contract" first among keeps. A2 keeps T2+T8 (2 of 11
  tiers) — that IS the lean gate. The hermetic-installed
  dimension (fixtures packed + registry-installed in Dagger
  runs per Worker D) survives implicitly: every kept tier
  runs over installed fixtures, so T2/T8 double as the
  install-graph smoke. No extra tier needed. Extends-side
  behaviors PORT to Neo multi-package worlds without
  violating one-coverage-home.
- **R2 — B's "(only one)" correction**: Worker B called
  matrix/reference the only `refSync: full` suite — wrong;
  css-selectors is also `refSync: full` (verified firsthand).
  No verdict impact (both DROP-class), recorded for accuracy.
- **R3 — T8 policy tension**: T8's ui.config comment claims
  allow-and-document as CURRENT policy, while CHAIN_RULES.md
  calls T8 "unresolved policy, not settled behavior". Either
  way A2's KEEP-until-decided stands; HQ/captain settles
  (default: the coded allow-and-document), then PORT.
- **R4 — webpack5 axis**: declared by recipe, primitives,
  system, tokens, css, color-mode, font, responsive, spacing,
  session, virtual, watch (12 suites); vite7-only for chain,
  reference, css-selectors, distro, mcp, typescript,
  playwright. It is bundler-parity, never behavior proof; Neo
  has no webpack target. RECOMMEND: retire all webpack5 axes
  with their suites (default); preserve at most ONE webpack
  leg post-VOYAGE only if HQ explicitly requires
  cross-bundler evidence (narrowest: watch dual-consumption).
- **R5 — brief's dependent list is UNDERCOUNTED**: brief says
  icons + docs ("verified 2026-09-22"). Current-tree census
  adds: packages/reference-mcp (~15 files, deepest),
  packages/reference-lib (dep + build:deps + ui.config + book
  vite), all 7 chain fixtures + atlas-project, pipeline
  (config/runner/templates), and every matrix suite's
  boilerplate triple. Implementation scopes below cover all.
- **R6 — kept suites need a runner retarget**: kept tiers
  (T2/T8/mcp/distro-interim/watch-interim) import
  defineConfig/referenceVite from core and run `ref sync`
  via the pipeline runner. Core removal while they stay
  green REQUIRES retargeting runner + kept suites + fixtures
  to Neo (Crew M3 scope). Not optional; encoded in ordering.
- **R7 — interim keeps order before removal**: watch-keep
  leans on core's `session.json` sentinel (Neo emits none);
  distro-keep leans on `ref` CLI lifecycle. P-cli-1 +
  P-watch-1 (Phase 1) must land BEFORE core deletion (R1),
  or the interim keeps must be Neo-retargeted first —
  implementers do not get to delete core under red keeps.

## MAP — FINAL suite-by-suite verdicts (lead-accepted, all 19 suites)

KEEP = stays in matrix (file-level below). PORT = new Neo
case(s) authored (backlog P-ids). DROP = already covered
(current tree) or retired-by-design (DROP* = legacy machinery
that dies with core; see H6).

| Suite | Verdict |
|---|---|
| chain-t1 | DROP e2e + unit (SYNC-10/17) |
| chain-t2 | **KEEP e2e** (sole `layers:` prover; →PORT after D17); DROP unit |
| chain-t3 | PORT e2e (layers half D17-blocked); DROP unit |
| chain-t6/t7/t11 | PORT e2e (transitive/diamond/parallel) |
| chain-t8 | **KEEP e2e** (policy proof; →PORT after H4); no unit |
| chain-t9/t10/t12/t13 | PORT e2e (layers legs D17-blocked) |
| chain-t4/t5 | PORT-as-new if wanted (missing coverage) |
| css | PORT 2 viewport-mq tests (H2); DROP rest + unit |
| css-selectors | PORT 2 sibling tests; DROP rest (virtual-output DROP*) |
| color-mode | PORT portal test re-targeted (H1); DROP rest + unit |
| font | DROP all (mirror legs DROP*) |
| responsive | PORT viewport-contract whole file (H2); DROP rest (mirror DROP*) |
| spacing | PORT 2 corner-pair tests; DROP rest (`box.d.ts` DROP*) |
| recipe | DROP all 3 (optional conjunction micro-probe) |
| primitives | PORT 1 micro-case (`colors.*` literal + pin); DROP rest |
| system | DROP all 3 (panda-theme spelling NOT ported) |
| tokens | DROP all 3 |
| reference | DROP both files — **HQ-FLAGGED H1** (StyleProps → REF-02/02 + REF-03/18 reds) |
| distro | **KEEP CLI-lifecycle core** (~L280-446) until P-cli-1; DROP rest — H1 on strict-colors block |
| mcp | **KEEP all 19 files** (permanent; no Neo MCP server) — H1 flags (a)(b)(c) |
| session | DROP all 3 (sidecar retired; API core-only) |
| typescript | DROP (covered); optional strict-wrapper PORT — H1 whole suite |
| virtual | DROP all (no-mirror design) — H1 minor (reference list) |
| playwright | DROP both (runner self-test retires) |
| watch | **KEEP watch-contract interim** until P-watch-1; DROP unit; webpack leg per R4 |

PORT backlog (Phase 1 authors): P-chain-1 (T6/T7/T11
transitive/diamond/parallel — multi-package worlds);
P-chain-2 (T3/T9/T10/T12/T13 — extends legs now, layers legs
after D17); P-chain-3 (T4/T5-new, optional); P-cli-1 (Neo
CLI-lifecycle: kill-recovery + clean-restore — releases
distro KEEP); P-watch-1 (live-edit→paint browser leg —
releases watch KEEP); P-prim-1 (`colors.*` literal
micro-case); P-css-1 (2 viewport-mq probes, H2); P-csssel-1
(2 sibling tests); P-colormode-1 (portal island,
re-targeted); P-resp-1 (viewport-contract, H2); P-spacing-1
(2 corner-pair tests). Optional: recipe conjunction probe,
typescript strict-wrapper flavor.

KEEP summary (the lean gate): chain-t2, chain-t8, distro
CLI-lifecycle core (interim), mcp ×19 (permanent),
watch-contract (interim). Everything else leaves matrix.

HQ-flag rollup: H1 Obj-1 call (reference StyleProps DROP;
distro strict-colors; typescript; virtual-minor; color-mode
attr; spacing/font adjacency); H2 D8 viewport-vs-container
(css probes, resp file — PORT vs approved absence); H3 D17
layers (T2/T3/T9/T10/T12/T13 layers legs — KEEP until D17);
H4 T8 policy (settle, then PORT); H5 webpack axis (default
retire per R4); H6 DROP* legacy machinery (dies with
cutover; KEEPs instead only if HQ retains core pipeline).

## MAP — fixtures plan (decision-ready)

- **7 chain fixtures → `matrix/fixtures/` FLAT, keep
  `@fixtures/*` names**: extend-library, extend-library-2,
  layer-library, layer-library-2, meta-extend-library,
  meta-extend-library-2, meta-extend-library-sibling.
  Rationale: only chain tiers + matrix/mcp consume them, all
  via workspace package refs (rewritten to tarballs at pack)
  + baseSystem subpath imports + pipeline registry list —
  never relative paths; the shared-base DAG is
  cross-consumed (flat, not per-suite). Move = git mv +
  update: pnpm-workspace globs, pipeline/config.ts registry
  paths + WORKSPACE_PACKAGE_ROOTS, managed packaging paths.
- **4 non-chain fixtures → styletrace-local, NOT
  matrix/fixtures**: atlas-project, demo-ui,
  styletrace-consumer, styletrace-library. Zero matrix
  consumers; only physical-dir readers are styletrace suites
  (`modules/styletrace/tests/fixtures.test.ts`,
  `src/tests/tracing.rs`; atlas uses vendored copies +
  string literals). Move to
  `packages/reference-rs/modules/styletrace/test-fixtures/`
  as PLAIN DIRS (drop workspace-package status): rewrite
  `@fixtures/demo-ui` imports in atlas-project src +
  tsconfig to relative; update the 2 styletrace readers'
  `traceFixtureDir(...)` paths; delete 4 package.json
  workspace entries via the move (workspace glob change
  covers). If the RS crew objects at implementation time,
  fallback = keep as workspace packages under the new home
  (least churn) — lead recommends plain-dir rewrite (2
  files import, small).
- **Top-level `fixtures/` REMOVED** (directory deleted;
  workspace `fixtures/*` glob replaced by
  `matrix/fixtures/*`; styletrace-local dirs need no glob).

## MAP — pipeline-purity verdict: DO NOT MOVE (verified)

`pipeline/` is NOT purely about matrix — verified per dir,
not assumed. Matrix-pure ONLY: `src/testing/matrix/` (+
managed templates). Ship/dev/release/general: `src/release/`
(npm ship path), `src/dev/` (docs/lib dev loops), `src/build/`
(+`build/rust`, cited by reference-rs DIST.md),
`src/registry/` (release staging shares it), `config.ts`
(release lists), `dependencies.ts` (shared node image),
`setup/` (rust targets), `scripts/run-if-env-absent.mjs`
(lib/core builds). External consumers: root
`pipeline`/`release`/`setup:local` scripts, `pnpm agent`
runner, lib+core build scripts, reference-rs DIST contract,
docs prose. The brief's move condition ("ONLY if purely
about matrix") FAILS → **leave `pipeline/` in place**
(recommendation; zero churn, ship/dev paths untouched).
Honest alternative if HQ insists: split matrix runner →
`matrix/pipeline`, ship/dev/release stay — recorded, not
recommended (renames discovery paths, managed-template
headers, every matrix package.json setup/test script, the
agent runner).

## MAP — core-removal plan (current-tree census)

DELETE: `packages/reference-core/` (workspace `packages/*`
glob drops it automatically; lockfile regen at
implementation time) + remove `'@reference-ui/core'` from
pipeline/config.ts REGISTRY + RELEASE lists. Core self-refs
(emitters, bins, virtual/paths) die with the package.

MIGRATE, in dependency order (each = implementer scope):
- **M-mcp (deepest, ~15 files)**: `packages/reference-mcp`
  off `/reference` (join.ts, reference.ts → S6
  `packages/reference-neo/src/reference/api.ts`, verified
  sufficient by export-name match), `/config` (getConfig,
  ReferenceUIConfig, entry), `/paths` (resolveRefConfigFile,
  GlobalProjectRegistry, resolveCorePackageDir,
  getOutDirPath), `/tokens` (loadMcpTokens,
  flattenTokenFragments), `/constants` (DEFAULT_OUT_DIR) +
  package.json:48 dep + 4 test-file imports/mocks. Each
  non-S6 surface needs a Neo-target mapping (or local
  vendoring) — implementer maps firsthand; MAP does not
  assume targets exist.
- **M-icons**: package.json:50/:54 deps, ui.config.ts
  defineConfig, scripts/build.mjs:25 ensure step +
  ensure-core-cli.mjs (`../reference-core/dist/...` +
  `ref build`) → Neo author surface + ensure-neo equivalent.
- **M-docs**: package.json:13 dep + :7/:8 `ref sync`
  scripts, ui.config.ts defineConfig, vite.config.ts:22-23
  dynamic referenceVite() (serve only) → Neo equivalents.
- **M-lib** (brief missed it): package.json:49 dep + :31
  `build:deps` → core build, ui.config.ts:8 defineConfig,
  book/vite.config.ts:6 referenceVite → Neo equivalents.
- **M-fixtures**: all 7 chain fixtures' ui.config.ts
  defineConfig + package.json core build scripts
  (`pnpm --filter @reference-ui/core run build`) → Neo
  equivalents (fixtures must keep building — kept tiers
  consume them). Atlas-project dies/moves with the
  styletrace-local set (its ui.config goes with it).
- **M-runner** (required by R6): pipeline matrix runner +
  managed templates — `ref` CLI invocations → `neo`,
  generated vite7/webpack5 configs' core imports → Neo,
  runner manifest gate (`@reference-ui/core` in manifest),
  node cache, unit-test literals; kept suites' boilerplate
  triple (T2/T8/mcp/distro-interim/watch-interim
  package.json + ui.config.ts + vite.config.ts) → Neo
  surface. Watch-interim sentinel note: core `session.json`
  `buildState=ready` has NO Neo emitter — either P-watch-1
  lands first (preferred, R7) or the keep is re-expressed.
- **M-docs-prose**: docs/REFERENCE_UI.md, RELEASE.md,
  BOOK.md, reference-rs DIST.md + archive refs (sweep, no
  behavior).
- **Zero-touch (census-clean)**: demo-ui/styletrace
  fixtures, `.agents` sources (CLI strings only), Neo src
  (string-literal aliases; biome bans real imports).

PRECONDITION (Phase 0 seam census, read-only, blocks all M-
scopes): confirm Neo's author-surface names firsthand
(defineConfig? Vite plugin? sync CLI bin name/flags? watch
sentinel?) — MAP records the requirement, implementers
resolve it; no retarget lands on assumed names.

## MAP — restructure plan

- **Suites → `matrix/tests/<suite>`** (crew picks
  **`tests`**): zero discovery-contract rename, zero
  collision with Neo/RS "cases" (twice-taken + tooled),
  matches per-suite `tests/{unit,e2e}` + "matrix tests" docs
  vocabulary. Move KEPT suites only (chain-t2, chain-t8,
  mcp, distro-slimmed, watch-interim); dropped suites are
  DELETED, not moved. `chain/` group dir survives as
  `matrix/tests/chain/T{2,8}`. Pipeline discovery root
  (`src/testing/matrix/discovery`) updated to the new depth
  + its unit tests; matrix package.json setup/test relative
  paths (`../../pipeline`) + managed-template headers
  updated. Matrix-root docs (CHAIN.md, CHAIN_RULES.md,
  CHAIN_REPORT.md, README, TEST_*) stay at `matrix/`.
- **`matrix/fixtures/`** flat, per fixtures plan above.
- **Top-level `fixtures/` removed**; workspace globs:
  `fixtures/*` → `matrix/fixtures/*` (styletrace-local set
  needs no glob as plain dirs); `matrix/*/*` glob still
  covers `matrix/tests/chain/*` — verify at implementation
  (else add `matrix/tests/*` explicitly).
- **pipeline/ stays** (purity verdict above).

## MAP — scoped implementation plan (AFTER Objective 1 lands)

STRICT: no implementation until Objective 1 lands (Neo tree
final incl. HQ call outcome). HQ/captain pre-decisions H1–H6
(or defaults: H1 per packet, H2→PORT, H3→keep-until-D17,
H4→coded allow-and-document, H5→retire, H6→cutover).

- **Phase 0 — seam census** (1 crew, read-only, blocks M-*):
  Neo author-surface names + CLI bins/flags + sentinel
  equivalents; deliverable = retarget table in LOG-2.
- **Phase 1 — PORT crews** (disjoint by Neo case group):
  P1 chain-extends (P-chain-1/2/3 → new NEO-CHAIN-*,
  multi-package worlds); P2 lifecycle (P-cli-1 + P-watch-1
  → releases distro + watch interim keeps — MUST land
  before R1 per R7); P3 micro-ports (P-prim-1, P-css-1,
  P-csssel-1, P-colormode-1, P-resp-1, P-spacing-1 +
  optionals → extend existing groups). Proof per case:
  `agentneo run <id>` green (scoped runs only).
- **Phase 2 — migration crews** (disjoint by package):
  M1 reference-mcp (+ matrix/mcp boilerplate); M2
  icons + docs + lib; M3 fixtures (7) + pipeline runner/
  templates/discovery + kept-suite boilerplate.
- **Phase 3 — removal + restructure** (disjoint):
  R1 core deletion + config lists + lockfile + globs +
  docs-prose (AFTER P2 + M3 per R7; verifies zero
  `@reference-ui/core` importers via census re-run);
  R2 suite drops (delete) + `matrix/tests` + `matrix/fixtures`
  moves + styletrace-local moves + path updates.
- **Reviewers — hermetic proof plan** (scoped Dagger runs
  ONLY, per VOYAGE ground law — no verification theater):
  `@matrix/chain-t2`, `@matrix/chain-t8`, `@matrix/mcp`
  (all 19), distro lifecycle subset (until P-cli-1),
  watch-contract (until P-watch-1) — each green via
  `pnpm agent test --packages=<pkg>`. Plus the
  **one-coverage-home check**: every kept behavior covered
  EXACTLY once — PORTs cite new Neo case id + matrix file
  deleted in the same commit; DROPs cite the pre-existing
  Neo case/unit id from this map; KEEPs cite the matrix
  file; reviewers grep matrix for residual assertions of
  ported/dropped behavior (zero hits or the commit doesn't
  land). DROP* legacy files need no Neo counterpart
  (retired-by-design; H6).
- **Landing**: ONE commit (Obj 2 landing law), captain
  re-runs decisive suites firsthand + commits named files.

## MAP COMPLETE (audit crew lead, 2026-09-23)

All 19 matrix suites verdict-filed (KEEP/PORT/DROP with
file-level splits); fixtures plan (7→matrix/fixtures flat,
4→styletrace-local, top-level removed); pipeline-purity
verdict (DO NOT MOVE, evidence-filed); core-removal plan
(R5-corrected census: mcp-package + lib + fixtures +
pipeline beyond the brief's two, with seam-census
precondition); restructure (`matrix/tests` + `matrix/fixtures`);
scoped Phase 0–3 implementation plan with disjoint crews,
ordering constraints (R6/R7), hermetic proof plan, and the
one-coverage-home check. HQ flags H1–H6 + reconciliation
notes R1–R7 filed above. Worker A lost in transit (stub
only), re-covered by A2 + lead firsthand cross-checks.
READ-ONLY held: this log is the crew's sole write; index
untouched; no suites run. IMPLEMENTATION HELD for
Objective 1's landing.

## Tick (captain, 2026-09-23)

Lead LIVE (recon + 4 nested workers out, verdict scale set)
— no intervention. POINTER (no reply needed): LOG-1 Crew Q
§Q4 packet filed — matrix oracle StyleProps assertions are
red-on-current-behavior under EITHER Obj-1 option unless the
RS fix lands. Factor into the reference/css verdicts and
HQ-flag discipline.

## MAP acceptance (captain, 2026-09-23)

MAP ACCEPTED. All 19 suites verdict-filed with file-level
splits and Neo-case citations; fixtures plan decision-ready
(7 flat to matrix/fixtures, 4 styletrace-local, top-level
removed); pipeline DO NOT MOVE with per-dir evidence (brief's
purity condition fails — accepted, zero churn);
core-removal census R5-corrected beyond the brief's two
(mcp-package deepest, +lib, +fixtures, +pipeline, +suite
boilerplate); restructure picks `matrix/tests` (brief let
the crew choose — collision reasoning sound); Phase 0–3
plan properly ordered under R6/R7 (PORTs + M3 before R1;
seam census preconditions all retargets); hermetic proof
plan scoped (kept packages only, no theater) with the
one-coverage-home check. Lead diligence noted: Worker A
lost in transit, re-covered by A2 + firsthand cross-checks;
B's "only one" error caught in R2; line-nit on build.mjs
caught. HQ flags H1–H6 filed — H1 rides Obj 1's morning
call; H2–H6 are pre-decisions with map-suggested defaults
(H2→PORT, H3→keep-until-D17, H4→coded allow-and-document,
H5→retire, H6→cutover) for HQ/captain at implementation
dispatch. Q4 pointer absorbed (reference DROP HQ-flagged,
oracle-red carried, not relitigated). Captain checks: zero
writes in matrix/fixtures/pipeline/core, tip unchanged,
index clean. IMPLEMENTATION HELD for Objective 1's landing
— nothing further dispatches on Obj 2 tonight.

## Phase 0+1 dispatch (captain, 2026-09-23)

Objective 1 LANDED (c62838b32) — Obj 2 implementation
UN-HELD, in sequence. Pre-decisions: H1 RESOLVED by the
landing (RS fix + 26/26 on the live shape; reference DROP
stands; matrix re-baseline MOOT — Neo is the coverage home
and stale-shape assertions die with the suite); H2→PORT
(P3 carries the viewport tests); H3 noted (layers legs
held for D17 — T2/T8 stay the layers proof meanwhile);
H4/H5/H6 deferred to Phase 2/3 dispatch (map defaults
stand: allow-and-document, retire, cutover).
Dispatch, all parallel and disjoint: Phase 0 seam census
(read-only Neo author-surface retarget table — blocks all
M-scopes); P1 chain-extends (P-chain-1/2/3 → new
NEO-CHAIN-* multi-package worlds, extends legs ONLY);
P2 lifecycle (P-cli-1 + P-watch-1 → NEW Neo groups only,
releases distro + watch interim keeps — must land before
R1); P3 micro-ports (prim/css/csssel/colormode/resp/
spacing + optionals → extend EXISTING groups only). Proof
per case: agentneo run green, scoped runs only. Crews log
here, never commit. Phase 2 (migrations) waits Phase 0's
table; Phase 3 (removal + restructure) waits Phase 1+2.

## P3 micro-ports (crew, 2026-09-23) — WORKING

Scope (strict): extend EXISTING Neo case groups only (new cases under
`packages/reference-neo/tests/cases/` + ledger rows in group TESTS.md).
No src, no matrix, no RS, no lib changes. Never commit, never touch
the index. Governing skill `agent-neo` loaded first.

### P3 recon (read-only)

- Matrix sources fingered: primitives `index.tsx:52-58` + spec L247
  (`colors.red.600` etc.); css `styles.ts` viewportProbeClass + spec
  L277-302 (840px); css-selectors `styles.ts:16-25` + spec L65-75
  (`& +`/`& ~`) + `App.tsx:36-54`; color-mode spec L96-112 +
  `index.tsx:122-128` (portal); responsive `viewport-contract.spec.ts`
  whole file + `styles.ts` (800px/700px/mixed); spacing spec L143-175
  + `index.tsx:53-76` (6 pair props); recipe spec L265-274
  (conjunction, optional).
- Engine pre-checks (read-only): `colors.*` resolves build-side
  (`atomic/src/resolve/tokens/mod.rs:207` + `tests.rs:48`; runtime
  matches by identical authored spelling — empirical run confirms);
  `@media (min-width)` in css() proven (SITE-09); `& + &` proven
  (PARITY-01 P2), `& ~` in globalCss (GLOBAL-06); all six pair
  shorthands lower (`atomic/src/resolve/shorthands/pair.rs`);
  recipe `@media` base proven (PARITY-01 P9); colorMode flows via
  React context (`primitives/runtime/context.ts`) so second-root
  islands (PARITY-01 P1 precedent; entry exports no `createPortal`)
  are the Neo portal shape.
- PARITY-01 census probes (P1/P2/P4/P9/P13/P20) touch these
  behaviors at census depth; per the map the dedicated PORT cases
  below are the coverage homes with the matrix's full assertions.
- Optional triage: recipe conjunction — carry iff P-resp-1's recipe
  leg proves recipe+`@media`+`r` conjunction clean; typescript
  strict-wrapper — SKIP (Neo `defineConfig` has no `strict`
  surface, verified in `src/config/types.ts`; TYPE-02 pins the
  real-union equivalent; nothing clean to port).
- Case ids (all existing groups, next-free verified, no reservations
  in PLAN.md/SPEC.md/TESTS.md): NEO-PRIM-13 (P-prim-1), NEO-PRIM-14
  (P-colormode-1), NEO-PRIM-15 (P-spacing-1), NEO-CSS-15 (P-css-1),
  NEO-COND-18 (P-csssel-1), NEO-RESP-10 (P-resp-1),
  NEO-RECIPE-12 (optional conjunction).

## P2 lifecycle ports (crew, 2026-09-23) — WORKING

Scope (strict): NEW Neo case groups ONLY (new files under
`packages/reference-neo/tests/cases/` — nothing else). No extends
to existing groups (P3 owns those), no src, no matrix (interim
keeps stay until Phase 3), no RS, no lib. Never commit, never
touch the index. Governing skill `agent-neo` loaded first;
VOYAGE.md Obj 2 + LOG-2 map (P-cli-1/P-watch-1, R7 ordering)
+ captain's Phase 0+1 dispatch read. Obj 1 tree (c62838b32)
is final — build on it, don't touch it.

### P2 recon (read-only)

- Distro source: `matrix/distro/tests/unit/distro.test.tsx`
  L280-446 is the interim-KEEP CLI-lifecycle core — L280-286
  idempotent re-sync, L288-354 stale virtual cleanup after
  rename/delete, L356-358 virtual-tree exact-sync pin,
  L360-400 stale runtime rewrite on cold sync, L402-418
  SIGTERM-interrupt recovery, L420-438 clean-restore
  round-trip, L440-442 skipped sentinel test. L288-358 are
  virtual-mirror legs — NOT portable (Neo has no virtual
  mirror by design, `sync/index.ts:149` + SYNC-02). The
  L440 skip stays skipped. Port: idempotent re-sync, stale
  rewrite, interrupt recovery, clean-restore.
- Watch source: `matrix/watch/tests/e2e/watch-contract.spec.ts`
  (502 lines, 3 tests) — test 1 css/primitive/recipe/token
  edits → resync → paint, test 2 config-dep edit → resync →
  paint, test 3 fragment add → paint / delete → unpaint, all
  keyed off core's `session.json` sentinel (Neo emits none
  — R7). Node-side legs already Neo-covered (SYNC-14:
  add/change/delete + debounce + config-dep per the map);
  the gap is ONLY the browser-paint leg. Webpack
  dual-consumption is OUT (H5 default retire, HQ silent).
- Neo neighbors: SYNC-14 (in-process `watchSync` + resync
  counting + byte-clean `finally` — the machinery both new
  cases mirror), SYNC-01 (synced-folder shape pins + probe
  paint), REF-04 (mid-run rewrite → re-sync → re-goto with
  a query key + restore spelling in `finally`).
- CLI invocation (firsthand): `neo` is NOT on PATH (no
  root `.bin` entry); the sanctioned spawn is
  `execFile(process.execPath, [BIN_PATH, ...args])` per
  `bin/neo.test.ts` — Node 24 strips the bin's TS
  directly. Verified `neo sync <absdir>` wall 175ms with
  a 62ms in-process sync — the kill window needs a hot
  poll, not a sleep: trip on first published file after
  `neo clean`, SIGTERM the child directly (no pnpm
  wrapper, no detached group), retry the cycle until an
  attempt dies by signal with the tripwire fired.
- Import probe (firsthand, on SYNC-14's synced world):
  `node --input-type=module -e` with cwd=worldDir resolves
  the sync-made scope links — `typeof react.css ===
  'function'` + `baseSystem.name` read clean. No DOM
  touch at module top-level. Viable as the post-recovery
  proof on every leg.
- Sync write order (firsthand, `src/sync/index.ts:124-239`):
  `cleanDir` first, scan/eval/native-compile, then
  sequential publish legs (folder → request JSON → runtime
  → react → types → reference-types → scope links). A
  SIGTERM mid-publish leaves a partial folder (SYNC-11
  atomicity covers thrown failures only) — exactly the
  corrupt state the recovery leg heals. Stable content
  pins: `function tokens(` in `system.mjs`, system name
  in `baseSystem.mjs`, probe for the react bundle.
- Server/reload (firsthand, `tests/shared/server.ts`):
  static files served live from the world dir with NO
  cache headers and no validators — a re-goto refetches
  the resynced sheet. Query-keyed re-gotos anyway (REF-04
  precedent) plus short computed-style polls for
  apply-lag robustness.
- Watch-loop rebuild note: case pages load `dist/` (built
  once pre-serve), so an `src/app.ts` edit needs a
  mid-spec `buildWorld` re-run before the repaint assert
  — the honest dev-loop order (edit → resync + rebuild →
  reload → paint). Token/fragment edits need no rebuild.
- Gate scope (firsthand): `agentneo q` gates world `.ts`
  sources too (headers required) — every authored `.ts`
  file (specs + world sources + `ui.config.ts`) carries
  a 2-6 sentence header, INCLUDING the mid-run rewrite
  spellings (REF-04 pattern), so the tree is gate-clean
  at rest no matter where a run dies.

### P2 plan (two cases, two new groups, no collisions)

- `NEO-CLI-01` (new group `cli/`, P-cli-1): node-side CLI
  lifecycle vs the real spawned `neo` binary — idempotent
  re-sync (byte-identical sheet), stale runtime rewrite,
  SIGTERM-interrupt recovery, clean-restore round-trip.
  Releases the distro interim KEEP (`distro.test.tsx`
  ~L280-446; virtual-mirror + skipped legs retired, not
  ported — see recon).
- `NEO-WATCH-01` (new group `watch/`, P-watch-1): live
  watch resync → browser paint via in-process `watchSync`
  (SYNC-14's proven machinery; `onResync` replaces the
  `session.json` sentinel Neo never emits) — css edit →
  repaint, token-value edit → repaint, fragment add →
  paint, fragment delete → unpaint. Releases the
  watch-contract interim KEEP. Webpack leg NOT ported
  (H5 retire).
- Group `README.md` per new group (ref-group pattern).
  No DOMAIN.md change needed (it names runtime concepts,
  not case groups — no group names live there).

### P2 implementation (new files only, 16 total)

`tests/cases/cli/` (group README + NEO-CLI-01: case.json,
README, world index.html + ui.config.ts + theme/tokens.ts +
theme/uses.ts, specs/lifecycle.spec.ts) and
`tests/cases/watch/` (group README + NEO-WATCH-01: case.json,
README, world index.html + ui.config.ts + src/app.ts +
src/tokens.ts, specs/watch-loop.spec.ts). No other writes
except this log; index untouched.

- CLI-01 drives the REAL spawned binary
  (`process.execPath` + `bin/neo.ts`, the
  `bin/neo.test.ts` invocation — `neo` is not on PATH).
  Kill leg: `neo clean`, spawn one-shot `neo sync`,
  5ms-poll for the first published file, direct SIGTERM
  (no pnpm wrapper, no detached group), retry the ~200ms
  cycle (cap 10) until an attempt dies by signal with the
  tripwire fired — the 62ms sync outruns any single
  attempt. Every leg ends on import-probe `ok`
  (`@reference-ui/react` css + `@reference-ui/system/
  baseSystem` name, resolved via the sync-made scope
  links); a heal `neo sync` runs in a `finally`.
- WATCH-01 uses in-process `watchSync` (SYNC-14's exact
  machinery: resync-delta waits, 500ms settle, byte-clean
  `finally`) plus the browser: `onResync` replaces the
  `session.json` sentinel Neo never emits. Call-site edits
  re-run mid-spec `buildWorld` before reload (edit →
  resync + rebuild → reload → paint); token/fragment edits
  need no rebuild. Changed spellings derive from canonical
  by single-line `.replace`, so restores cannot drift;
  all spellings carry gate headers (REF-04 pattern).
  Evaluated fns close over nothing (Playwright
  serializes); the fragment var name is a literal inside
  its reader. Query-keyed re-gotos (REF-04 precedent) +
  10s computed-style polls.

### P2 proof (scoped runs only, all firsthand)

- `pnpm agentneo run NEO-CLI-01` → PASS
  (lifecycle.spec.ts), twice, consecutive.
- `pnpm agentneo run NEO-WATCH-01` → PASS
  (watch-loop.spec.ts), twice, consecutive.
- `pnpm agentneo q` over the 8 authored `.ts` files → 0
  errors, 0 warnings, at rest after the runs.
- Byte-clean: sha256 of all 6 world sources matches the
  pre-run baseline after every run; `src/fragment.ts`
  absent at rest; inventory exactly the 16 intended files.
- No-panda pass: one hit, the CLI README's boundary
  sentence ("Panda-shaped output pins are
  Neo-forbidden") — explanation, not carried chrome.
- FINDING (harness quirk, out of P2 scope — flagged, not
  fixed): dir-scoped `q` walks gitignored
  `world/.reference-ui/` sync output and fails (359
  errors on my dirs post-run). Pre-existing: landed
  SYNC-14 fails identically (121 errors). Proof above is
  file-scoped to authored sources.

### P2 release statements (one-coverage-home)

- DISTRO interim KEEP (`matrix/distro/tests/unit/
  distro.test.tsx` ~L280-446) → RELEASED by NEO-CLI-01:
  idempotent re-sync → leg 1, stale rewrite → leg 2,
  SIGTERM recovery → leg 3, clean-restore → leg 4.
  Virtual-mirror legs (L288-358) retired by design
  (no-mirror, SYNC-02) — no home needed; L440 skip stays
  skipped; type describes already live with TYPE.
- WATCH interim KEEP (`matrix/watch/tests/e2e/
  watch-contract.spec.ts`, all 3 tests) → RELEASED by
  NEO-WATCH-01 + NEO-SYNC-14: test-1 css/token paint →
  legs 1-2, test-2 config-dep mechanism (value change →
  repaint) → leg 2, test-3 fragment add/delete paint →
  legs 3-4; node-side discovery/debounce/deps stay with
  SYNC-14. Webpack dual-consumption NOT ported (H5
  retire stands). Unit smoke already DROP (SYNC-01
  handshake).

## P2 DONE (crew, 2026-09-23)

Cases added: NEO-CLI-01 (P-cli-1), NEO-WATCH-01 (P-watch-1)
— two new groups, 16 new files, proofs above, both interim
keeps released per R7 ordering (before Phase 3 R1). No
commits, index untouched, scope held.
## P1 chain-extends (crew, 2026-09-23) — WORKING

Scope: NEW NEO-CHAIN-* group only (new files under
packages/reference-neo/tests/cases/chain/). Extends legs ONLY;
layers legs OUT per H3; T8 policy OUT per H4 (not mine).
Governing skill agent-neo loaded first. Never commit, never
touch the index.

Recon (read-only, firsthand): all 8 tier specs + src/index +
ui.config (T3/T6/T7/T9/T10/T11/T12/T13); fixture token sources
(extend/meta/sibling/extend-2/meta-2 values + RGB oracles);
CHAIN_REPORT §4.3 (T4 untouched-parallel-extends, T5
untouched-parallel-layers, depth≥3 suggested) + CHAIN.md:241
(collectUpstreamSystems owns declared-order narrowly);
Neo extends mechanics (BaseSystem {name,fragment,jsxElements},
upstream fragments evaluate in extends[] order then local,
later-wins on scalars per merge.ts, _private strips at the
boundary, jsx merged uniqueSorted); world conventions
(SYNC-10 stand-in upstream shape, LAYER-02 theme+src include,
TOKEN-09/CSS-01 runtime css() painting, runner-generated
node_modules via linkGeneratedPackages, case.json sync:true).

Case plan (5 new cases, one group `chain/` + group SPEC/TESTS):
- NEO-CHAIN-01 transitive (T6): app extends outer only; outer
  fragment republishes inner. Matrix source:
  matrix/chain/T6/tests/e2e/T6-contract.spec.ts.
- NEO-CHAIN-02 diamond (T7): two outers republish one base.
  Source: matrix/chain/T7/tests/e2e/T7-contract.spec.ts.
- NEO-CHAIN-03 parallel chains (T11): two disjoint transitive
  paths. Source: matrix/chain/T11/tests/e2e/T11-contract.spec.ts.
- NEO-CHAIN-04 multi-direct extends + declared-order later-wins
  (T9 extends legs; topology = untouched T4 parallel-extends).
  Neo has no per-upstream @layer prelude (single package wrap),
  so declared-order ports as later-entry-wins on a shared leaf.
  Source: matrix/chain/T9/tests/e2e/T9-contract.spec.ts
  (extends legs + prelude-order extends half ONLY).
- NEO-CHAIN-05 depth-3 transitive (P-chain-3 NEW coverage per
  CHAIN_REPORT §4.3; no matrix source — new). T5-new NOT
  authored: parallel layers, held for D17 per H3.

Extends-leg home map (every tier leg homed, no double-homes):
T6→CHAIN-01; T7→CHAIN-02; T11→CHAIN-03; T9-extends→CHAIN-04;
T3-extends (single-hop adopt) → pre-existing NEO-SYNC-10 (no
new case: strict behavior-subset); T10-extends ⊂ T6 → CHAIN-01;
T12-extends ⊂ T7 → CHAIN-02; T13-extends = T11 → CHAIN-03.
Per-tier cases for T10/T12/T13 would assert strict subsets of
CHAIN-01/02/03 — two homes for one behavior, refused under the
voyage one-coverage-home law. Layers legs of T3/T9/T10/T12/T13
stay homed at kept matrix chain-t2/t8 until D17 (H3); hybrid
both-buckets-at-once has no Neo home yet — D17 follow-up, not
this crew. T1-extends stays homed at SYNC-10 (map DROP, kept).

### P3 P-prim-1 DONE — NEO-PRIM-13 (category-prefixed color values)

- Case: `prim/NEO-PRIM-13` (7 tracked files: case.json, README,
  specs/prefixed.spec.ts, world/index.html, world/ui.config.ts,
  world/src/app.tsx, world/src/tokens.ts). World renders the
  category-prefixed probe (`colors.red.600`/`colors.yellow.100`/
  `colors.blue.600`) plus a bare-spelling control over tailwind-value
  tokens. Spec pins: both paint identical token colours; sheet
  carries the three `var(--colors-*)` rules; no raw `colors.*` path
  in any declaration value (`/:\s*colors\./`).
- Proof: `pnpm agentneo run NEO-PRIM-13` → PASS prefixed.spec.ts
  (first run green); `pnpm agentneo q` over authored files → 0
  errors, 0 warnings. (Whole-dir `q` sweeps gitignored
  `world/.reference-ui` sync output — authored-files-only is the
  meaningful gate; same for all P3 cases.)
- Matrix source (Phase 3 one-coverage-home): DROP
  `matrix/primitives/tests/e2e/primitives-contract.spec.ts`
  "primitive resolves category-prefixed color tokens in the browser"
  (L247) — coverage home is NEO-PRIM-13.

### P3 P-css-1 DONE — NEO-CSS-15 (viewport media probes)

- Case: `css/NEO-CSS-15` (6 tracked files; no tokens fragment —
  literal values only, SITE-09 shape). One `css()` call with base +
  `@media (min-width: 840px)` branches; spec pins the sheet block
  and both viewport halves (760px base, 960px queried).
- Proof: `pnpm agentneo run NEO-CSS-15` → PASS viewport.spec.ts
  (first run green); `pnpm agentneo q` authored files → 0/0.
- Matrix source (Phase 3): DROP `matrix/css/tests/e2e/css-contract.spec.ts`
  "keeps the viewport media-query probe on its base branch below
  the viewport threshold" + "applies the viewport media-query branch
  above the viewport threshold" (L277-302) — home is NEO-CSS-15.

### P3 P-csssel-1 DONE — NEO-COND-18 (sibling combinators)

- Case: `cond/NEO-COND-18` (6 tracked files; no tokens — literal
  values, COND-06 shape). Leaders carry `'& + [data-slot=peer]'`
  (14px margin) and `'& ~ [data-slot=overlay]'` (15px padding);
  spec pins both combinators in the sheet, exactly 2 utilities,
  and the four paints (peer/overlay on, leader/spacer off).
- Proof: `pnpm agentneo run NEO-COND-18` → PASS siblings.spec.ts
  (first run green); `pnpm agentneo q` authored files → 0/0.
- Matrix source (Phase 3): DROP `matrix/css-selectors/tests/e2e/
  css-selectors-contract.spec.ts` "adjacent sibling selector applies
  margin to the following peer" + "general sibling selector applies
  padding to later overlay siblings" (L65-75) — home is NEO-COND-18.

## Phase 0 — seam census (crew, 2026-09-23) — DONE

Read-only census on the landed Obj-1 tree (c62838b32; verified
`git log` tip + index untouched by this crew). Governing skill
`test-core` loaded first; no suites run (recon only per brief).
Every name below is firsthand with file:line — no trust without
bytes. Paths `packages/reference-neo/...` abbreviated `neo/...`,
`packages/reference-core/...` as `core/...`.

### A. Neo author surface (confirmed)

- **defineConfig**: `defineConfig(cfg)` in
  `neo/src/config/types.ts:98`, re-exported by the author barrel
  `neo/src/author/index.ts:5`. Import id `@reference-ui/neo`
  (doc comment types.ts:90; world shape e.g.
  `tests/cases/token/NEO-TOKEN-01/world/ui.config.ts:1`).
- **Config types**: `ReferenceUIConfig` (types.ts:26: include,
  name, extends, jsxElements, staticCss, normalizeCss, debug,
  logs) + `BaseSystem` (types.ts:9). Deliberately UNTYPED:
  `mcp`, `strict`, `layers`, `useReference*`,
  `skipTypescript` (neo's own parity table
  `docs/evidence/core-api-parity.md:38-43`).
- **Collectors**: tokens/keyframes/font/globalCss/extendPattern
  + `create*Collector` + types, all via author/index.ts:6-33.
- **Store**: setConfig/setCwd/getConfig/getCwd/getOutDir/
  clearConfig — `neo/src/config/store.ts` (same six names as
  core `config/index.ts:11`; in-memory only, no worker
  snapshot).
- **Loader**: `loadUserConfig` / `loadUserConfigWithDependencies`
  (`neo/src/config/load.ts:19/:26`, async).
- **Errors**: ConfigNotFoundError/ConfigValidationError/
  LoadConfigError (`neo/src/config/errors.ts`, same names as
  core).
- **validateConfig** (`neo/src/config/validate.ts:189-198`):
  validates known fields, returns the object AS-IS — unknown
  fields (`mcp`, `strict`, `debug`, `layers`) PASS THROUGH at
  runtime (corroborated parity.md:49). extends entries require
  fragment/css/jsxElements (:197).
- **Paths**: `resolveRefConfigFile` (`lib/paths/ref-config.ts:20`,
  ui.config.ts/js/mjs), `getOutDirPath` (`out-dir.ts:12`),
  `getOutDirTmpPath`/`getProjectTmpDirPath` (`tmp-dir.ts:16/:11`),
  barrel `lib/paths/index.ts:7-9` — whose header states the
  virtual dir + global registry deliberately do NOT come
  across.
- **Constants**: `DEFAULT_OUT_DIR = '.reference-ui'`
  (`neo/src/constants.ts:5`; name+value identical to core
  `constants.ts:27`).
- **CLI**: `neo` bin → `bin/neo.ts` (package.json:19-21).
  Verbs ONLY `sync [dir]`, `clean [dir]`, `sync --watch [dir]`
  (USAGE :14, isVerb :118-120). No `build`, no --build/--debug,
  no `mcp`. `.ts` bin runs on type stripping (engines
  node>=22.18; host v24.16.0; Dagger image `node:24-bookworm`
  per pipeline/dependencies.ts:9).
- **watchSync(cwd, callbacks)** (`sync/watch.ts:281`):
  onChange/onResync/onError only; SyncResult = {outDir, spec}
  (sync/index.ts:38). Writes NO sentinel file. CLI prints
  `[neo] resync → <outDir>` (bin/neo.ts:92).
- **sync(cwd)** (`sync/index.ts:124`): publishes system leg
  (baseSystem.mjs/.d.mts — system.ts:246 + styled.ts:65,
  system.mjs re-exports baseSystem :192, evaluated-system.json
  :249, jsx-elements.json :250), compile-request.json
  (index.ts:211), runtime/react/types/reference-types legs,
  then junctions node_modules/@reference-ui/{system,styled,
  react,types} (links.ts:10,25).
- **S6** (`src/reference/api.ts:7-32`): createReferenceUiTastyApi
  + 2 getters, createReferenceDocument,
  formatReferenceTypeParameter, formatReferenceType,
  createReferenceType(+Parameter), 7 doc types.
- **Bundler aliasing**: ui.config bundling aliases 6 ids
  (core, core/config, cli, cli/config, neo, neo/config —
  CONFIG_EXTERNALS config/constants.ts:13-20) to the author
  entry (bundle.ts:58-65). Fragment files alias 5 ids (neo,
  neo/config, system, core/config, cli/config —
  bootstrap-import-map.ts:19-25). Bare `@reference-ui/core`
  is in NEITHER the fragment map NOR the scan needles
  (fragments/base/index.ts:47-53) — verified zero consumer
  `src/` hits, so no live gap, but migrated fragment files
  must use neo/system ids.
- **Exports map**: neo package.json:15-18 exposes ONLY
  `./runtime` (css/recipe, runtime/index.ts) + `./package.json`.
  No `.`, `./config`, `./paths`, `./constants`, `./reference`
  — bare `@reference-ui/neo` does NOT resolve under Node.
  (Specifier wiring → flag F1.)

**Confirmed ABSENT from neo src/bin/tools (zero hits,
non-test)**: referenceVite/referenceWebpack (only vite
mention is a `@vite-ignore` comment, config/evaluate.ts:30);
session.json/buildState/getSyncSession; GlobalProjectRegistry;
resolveCorePackageDir/resolveCoreDistPath/getVirtualDirPath;
loadMcpTokens/flattenTokenFragments/McpToken. Neo's parity
table corroborates session/vite as MISSING/later (parity.md:
46-47, :125-131) but is STALE on CLI/watch/clean (claims
MISSING — all three landed: bin/neo.ts, watch.ts, clean
verb) — trust firsthand over that doc except for the
deliberate drops (mcp/strict/layers/registry/virtual).

### B. Retarget table (core surface → Neo target)

| # | Core surface (from) | Consumed by | Neo target (exact) | Disposition |
|---|---|---|---|---|
| 1 | defineConfig (core public.ts:8) | icons/docs/lib/fixtures/kept-matrix ui.config.ts | defineConfig, neo/src/config/types.ts:98 + bundler alias bundle.ts:65 | RETARGET id to `@reference-ui/neo`. ui.config is TYPECHECKED in icons (tsconfig.json include) + kept suites (T2/watch tsconfig include ui.config.ts) → those need a tsconfig paths entry (F1); NOT typechecked in lib/docs/fixtures (includes cover src/book only) → id swap alone suffices there |
| 2 | ReferenceUIConfig/BaseSystem (core config) | mcp config.ts:2, primitive-usage.ts:3; ui.configs | neo/src/config/types.ts:26/:9 | RETARGET; mcp VENDORS `McpAwareConfig = ReferenceUIConfig & {mcp?}` locally (mcp field untyped in Neo, runtime passes through per validate.ts:198) |
| 3 | getConfig/setConfig/setCwd/loadUserConfig/errors (core config/index.ts:11-13) | mcp build.ts:4, child-process/entry.ts:2-8 | neo store.ts + load.ts:19 + errors.ts (same names) | RETARGET same-name (mcp uses no worker snapshots) |
| 4 | resolveRefConfigFile (core paths) | mcp project-manager.ts:5, workspace-discovery.ts:4 (:104/:169/:204/:248) | neo/lib/paths/ref-config.ts:20 | RETARGET same-name |
| 5 | getOutDirPath (core paths) | mcp pipeline/paths.ts:2 | neo/lib/paths/out-dir.ts:12 | RETARGET same-name |
| 6 | DEFAULT_OUT_DIR (core constants.ts:27) | mcp queries.test.ts:3 (test-only) | neo/src/constants.ts:5 | RETARGET (identical). Other core constants (GENERATED_*/DTS_INCLUDE/SYNC_OUTPUT_DIR_GLOB) are core-internal-only — no migration needed |
| 7 | /reference 5 names (core reference/api.ts:2/8/13/19/20) | mcp reference.ts:3-7, join.ts:2-6 | S6 neo/src/reference/api.ts:8/:14/:19/:25/:26 | RETARGET same-name (behavior = Obj-1 landing, not relitigated) |
| 8 | GlobalProjectRegistry read/upsert (core global-registry.ts:31/68) | mcp project-manager.ts:4 (:116/:130), workspace-discovery.ts:4 (:266) + 2 test files | NO TARGET (explicitly excluded, neo paths/index.ts:4) | VENDOR LOCALLY (small JSON registry in mcp; behavior-preserving, recommended) or RE-EXPRESS (drop cross-project memory, scan on demand) — M-mcp picks |
| 9 | resolveCorePackageDir (core paths) | mcp instructions.ts:5/:39 — fallback lookup of core's src/mcp/instructions.md | NO TARGET (zero PackageDir hits in neo) | VENDOR trivially (own-package-dir) or DROP the fallback (mcp-local candidates + fallback constant suffice) |
| 10 | loadMcpTokens(cwd,config)/flattenTokenFragments/McpToken (core tokens/load.ts:141/86, types.ts) | mcp tokens.ts:1 (RE-EXPORTS both), build.ts:12 | NO TARGET (zero hits in neo) | RE-EXPRESS onto Neo fragment evaluation (author collectors / prepareFragments+evaluate) or `evaluated-system.json` spec.tokens (contracts/types.ts:29, published system.ts:249). `_private` strip semantics (core load.ts:90) must be re-proven. The tokens.ts:1 re-export is a downstream API surface — M-mcp owns break-vs-shim |
| 11 | referenceVite (core vite/plugin.ts:47 — HMR + optimizeDeps excludes) | docs vite.config.ts:22-23 (serve-only), lib book/vite.config.ts:6/:30, kept-matrix vite.configs (T2:4/:11, T8/watch/distro same), pipeline vite7 liquid template :4 | NO TARGET (zero hits; parity.md:47 MISSING/later) | DROP everywhere (dev-only cost: no generated-file HMR, no managed optimizeDeps excludes). Lib book aliases already target Neo-layout generated entries (book/vite.config.ts:36-48) — only the plugin line goes |
| 12 | referenceWebpack (core webpack/plugin.ts:21) | pipeline webpack5 liquid template :8 | NO TARGET | DROP with the R4 webpack-axis retirement (no keep needs it) |
| 13 | session.json buildState=ready/completedAt (core session files.ts:17, types.ts:7/12, public.ts:72) | runner wait-ready.mjs:46-77 (polls `.reference-ui/tmp/session.json`), watch e2e sentinel; matrix/session suite is DROPPED | NO TARGET (zero session.json/buildState in neo; watchSync callbacks-only) | RE-EXPRESS wait-ready.mjs to poll a Neo-emitted signal (outDir artifacts exist, or `[neo] resync` stdout neo.ts:92). P-watch-1 owns the Neo-side story; M-runner owns the helper rewrite. getSyncSession itself has NO live consumer (only dropped matrix/session tests + dying core plugins) — nothing to migrate |
| 14 | `ref sync` incl. --watch (core index.ts:14-20) | docs pkg :7/:8, fixtures sync/dev scripts (:25/:27 pattern), matrix pkg `sync`, runner package-runner.ts:67 (`pnpm exec ref sync`) | `neo sync [dir]` / `neo sync --watch [dir]` (bin/neo.ts:20-31/:86-111) | RETARGET. --watch ✓ (:127); --build/--debug have no counterpart — no consumer uses them on this path |
| 15 | `ref build` = sync --build, real node_modules copies (core index.ts:22-27) | icons build.mjs:29 | NO TARGET (isVerb sync\|clean only neo.ts:118-120; neo always junctions links.ts:25) | RE-EXPRESS as `neo sync`; M-icons verifies rollup/tsc/materialize-runtime.mjs over junctions |
| 16 | `ref clean` (core index.ts:29-32) | distro CLI-lifecycle tests (P-cli-1 releases) | `neo clean [dir]` (bin/neo.ts:59-70) | RETARGET. Nit (F2): neo clean removes system/styled/react links (:13) but NOT the `types` link links.ts:10 leaves — flag to P2, not blocking |
| 17 | `ref mcp` spawns ref-mcp (core index.ts:34-71) | CLI users only | NO TARGET NEEDED | mcp bins mcp/reference-mcp/ref-mcp (mcp package.json:12-15) survive in the mcp package; core's `mcp` bin alias dies harmlessly |
| 18 | `ref sync --watch` (runner path) | runner run-watch-session.mjs:19 (`pnpm exec ref sync --watch`) | `neo sync --watch` (neo.ts:86) | RETARGET invocation; readiness gate per row 13 |
| 19 | Runner/packaging keys: managed dep (managed/package-json/index.ts:51), node-cache override (node-modules/cache.ts:61), manifest gate `@reference-ui/core` (runner/run.ts:112-116), pipeline/config.ts REGISTRY+RELEASE lists | pipeline matrix runner | `@reference-ui/neo` as packed host + `neo` bin provider | RETARGET keys/lists; gate semantics re-expressed (neo replaces core as the packed host). Modes (watch-ready T2/T8, full mcp/distro, watch-full watch — matrix.json) + mode-name renames are M-runner calls (ref-sync.ts:57-69) |
| 20 | config `mcp:{include,exclude}` (core ReferenceUIMcpConfig; read mcp config.ts:6-7, primitive-usage.ts:49/55) | docs ui.config.ts `mcp.include` | TYPE: none (deliberately dropped parity.md:40); RUNTIME: passes through (validate.ts:198) | KEEP the field in ui.config (works at runtime; docs doesn't typecheck ui.config — tsconfig include is src+vite.config). Type side owned by M-mcp row 2 |
| 21 | config `strict:['colors']` | distro ui.config.ts (interim keep) | TYPE: none (deferred parity.md:38); RUNTIME: passes through | KEEP until P-cli-1 releases the keep; no action |
| 22 | baseSystem.mjs/.d.mts artifacts | icons build.mjs requiredFiles + pkg exports ./baseSystem (:27-30); lib src/index.ts:7; fixtures pkg exports + build-package.mjs:10-11; tiers + mcp suite baseSystem imports | neo publishes both (system.ts:246, styled.ts:65) + system.mjs re-export (:192) | COMPATIBLE — no change. Already proven: lib syncs via neo today (lib package.json:31-33) |
| 23 | ensure-core-cli (icons scripts/ensure-core-cli.mjs:8 — builds core dist CLI) + `pnpm --filter @reference-ui/core run build` legs (7 fixtures pkg:22/26, lib build:deps pkg:31) | icons build.mjs:25, fixtures, lib | NOTHING TO TARGET (neo bin is source-direct .ts, no build) | DELETE the step/legs. node>=22.18 type stripping holds on host (v24) + Dagger (node:24-bookworm) |
| 24 | `@reference-ui/core` deps: lib runtime dep (lib pkg deps), icons peer `*` (:50)+dev (:54), fixtures deps (:32/36/39), docs dep (:13), mcp dep (:48), matrix managed dep (row 19) | shipped + dev graphs | `@reference-ui/neo` (private, unpublished) where a bin/loader is needed; else delete | lib runtime dep DELETE (only book/vite.config.ts imports core — dev-only; dist clean). icons peer DELETE (cannot peer a private package — F5), devDep→neo for the bin. fixtures/docs/matrix deps SWAP to neo (bin providers). mcp dep → F4 crowbar (bundle, don't externalize) |
| 25 | docs prose: 15 files under docs/ mention `@reference-ui/core` (Architecture, STRUCTURE, REFERENCE_UI, RELEASE, PUBLIC API, FEATURES×2, bugs/JANK, perf wave-4, evidence pins, missions/completed/styletrace, archive×4) + BOOK.md `ref sync`/referenceVite prose (:50/:64/:109/:156/:163) + reference-rs DIST.md pipeline refs + lib/icons READMEs | docs | — | SWEEP text, no behavior. LEAVE historical: CHANGELOGs, forensics logs, typegen SPEC.md, virtualrs doc comment (lib.rs:1), archive/ (frozen by policy unless the sweep says otherwise) |

Cross-cutting flags for implementers:

- **F1 specifier wiring (all library retargets)**: neo's exports
  map exposes only `./runtime` (package.json:15-18), so
  `@reference-ui/neo` / subpaths do NOT resolve under Node
  today. ui.config RUNTIME is already fine (sync bundles by
  absolute path, bundle.ts:58). ui.config TYPECHECK needs a
  per-consumer tsconfig paths entry where ui.config is
  included (icons + kept matrix suites — verified firsthand
  above). mcp src (runs typechecked + bundled) needs EITHER
  new exports entries in neo package.json (additive,
  Phase-2-legal) OR tsup alias + tsconfig paths — M-mcp's
  call. Worlds pattern to copy: neo tsconfig.json:40.
- **F2**: `neo clean` leaves the `types` junction (bin/neo.ts:13
  lists 3 links, links.ts:10 links 4). P2/implementer nit.
- **F3**: parity.md is stale on CLI/watch/clean (all landed);
  reliable only for deliberate drops.
- **F4 shipped-mcp crowbar**: mcp SHIPS (public, tsup →
  dist, bin→dist/cli.mjs) with default externalization
  (tsup.config.ts: no external/noExternal — deps external).
  Core is externalized today (published ✓). Neo is
  private/unpublished → M-mcp MUST bundle/inline the Neo
  modules (noExternal) or vendor them, else shipped installs
  break. (Bundling also moots the .ts-source + node18-target
  concerns — esbuild strips types at build.) mcp types ship
  from src (types: ./src/index.ts) — src must not leak
  unresolvable neo ids into declarations.
- **F5**: icons' `@reference-ui/core: "*"` peer cannot become a
  neo peer (private). Delete, don't swap. (icons ships only
  dist + baseSystem artifacts — files list has no ui.config —
  so no runtime neo dep ships.)
- **F6**: lib already syncs via `node
  ../reference-neo/bin/neo.ts sync` (lib package.json:31-33)
  — M-lib/M-fixtures retargets are pre-proven, not novel.

### C. Per-scope verdicts

- **M-mcp: GO (with vendoring + re-expression)**. Same-name
  targets exist for /reference (row 7), /config incl. loader+
  errors (rows 2-3), resolveRefConfigFile + getOutDirPath +
  DEFAULT_OUT_DIR (rows 4-6). Must VENDOR: project registry
  (row 8), McpAwareConfig type (row 2), coreDir fallback
  (row 9). Must RE-EXPRESS: tokens incl. `_private` strip +
  re-export compat (row 10). Must wire specifiers + bundle
  Neo in (F1/F4). All tractable, all owned — no blocker.
- **M-icons: GO**. defineConfig swap (row 1, +tsconfig paths —
  icons typechecks ui.config), `ref build`→`neo sync` +
  junction verification (row 15), delete ensure step +
  core-build leg (row 23), peer/dev cleanup (row 24/F5),
  artifacts compatible (row 22). No NO TARGET without a path.
- **M-docs: GO**. Scripts + dep swap (rows 14/18/24), id swap
  (row 1 — no tsconfig friction, ui.config unincluded), drop
  serve-only referenceVite (row 11, dev-HMR cost accepted),
  keep `mcp` block (row 20).
- **M-lib: GO (smallest)**. ui.config id swap (row 1 — lib
  doesn't typecheck ui.config; book/vite IS typechecked but
  its core import is deleted with the plugin), drop
  referenceVite (row 11), delete core-build leg (row 23) +
  runtime dep (row 24). Pre-proven by F6.
- **M-fixtures: GO**. 7× id swap (row 1 — fixtures don't
  typecheck ui.config), sync/dev `ref`→`neo` (row 14),
  delete core-build legs (row 23), keep lib-sync/bootstrap
  (bootstrap-runtime.mjs symlinks lib's neo-built
  .reference-ui — compatible), artifacts compatible (row 22),
  no needle gap (verified). Atlas-project moves with the
  styletrace-local set — no retarget.
- **M-runner: GO (with re-expression)**. Invocation swaps
  (rows 14/18), managed dep/cache/gate/lists (row 19), drop
  plugin lines from both liquid templates (rows 11-12),
  kept-boilerplate triples (rows 1/11/24 + tsconfig paths per
  row 1), `strict` passthrough (row 21). Must RE-EXPRESS
  wait-ready.mjs (row 13) — the one real design task in the
  scope, owned. Mode names + webpack leg per R4/H5 stay
  M-runner calls.
- **M-docs-prose: GO**. Row 25 file list; sweep only, no
  behavior; historical files explicitly left.

**PHASE 0 DONE.** Retarget table: LOG-2.md §Phase 0 tables A–C
above. Verdicts: M-mcp GO (vendor+re-express), M-icons GO,
M-docs GO, M-lib GO, M-fixtures GO, M-runner GO (re-express),
M-docs-prose GO. No scope is NO-GO; every NO TARGET has a
named disposition (vendor locally vs re-express) with the
exact seam cited. READ-ONLY held (this log section is the
crew's sole write); index untouched; nothing committed; no
Obj-1 path relitigated; no suites run.

### P3 P-colormode-1 DONE — NEO-PRIM-14 (portal island)

- Case: `prim/NEO-PRIM-14` (7 tracked files). Light host (plain
  `data-color-mode="light"`) + in-tree dark island + second root into
  a body-level host (PARITY-01 P1 precedent; entry exports no
  `createPortal`) rendering island > child, so the child inherits
  dark through island context with no dark DOM ancestor — the portal
  invariant. Token leaf values match the matrix constants.
- Spec pins (matrix L96-112 re-targeted): host at BODY and outside
  `#light-host`; island stamps `data-layer` + `data-color-mode=
  "dark"`; child stamps `data-color-mode="dark"`; host light /
  both darks paint; zero `[data-panda-theme]` in document or sheet.
  One fix during authoring: SpecPage `evaluate` is single-arg (no
  Playwright second arg) — helper rewritten, then green.
- Proof: `pnpm agentneo run NEO-PRIM-14` → PASS portal.spec.ts;
  `pnpm agentneo q` authored files → 0/0.
- Matrix source (Phase 3): DROP `matrix/color-mode/tests/e2e/
  system-contract.spec.ts` "portaled island preserves dark colorMode
  and token resolution outside light host DOM" (L96-112) — home is
  NEO-PRIM-14. Panda spelling NOT ported anywhere.

### P1 build + proof (crew, 2026-09-23)

Authored new group `packages/reference-neo/tests/cases/chain/`:
SPEC.md + TESTS.md + 5 leaf cases (case.json + README + specs/
+ world/ each; worlds use runtime css() painting per TOKEN-09/
CSS-01, upstream stand-ins per SYNC-10/LAYER-02, zero local
tokens so every probe proves extends adoption). No other files
touched; sibling P2/P3 dirs (cli, watch, cond, css, prim)
present in tree, never opened for edit.

Proofs (scoped runs only, each green):
- `pnpm agentneo run NEO-CHAIN-01` → PASS transitive.spec.ts
- `pnpm agentneo run NEO-CHAIN-02` → PASS diamond.spec.ts
- `pnpm agentneo run NEO-CHAIN-03` → PASS parallel.spec.ts
- `pnpm agentneo run NEO-CHAIN-04` → PASS multi-extends.spec.ts
- `pnpm agentneo run NEO-CHAIN-05` → PASS depth.spec.ts
- `pnpm agentneo q` over all 23 authored .ts files → 0 errors,
  0 warnings. (Whole-dir gate also walks gitignored
  world/.reference-ui/ build output — pre-existing behavior,
  same on green SYNC-10; zero violations in authored files.)
- `pnpm agentneo list` discovers all 5 ids; panda-grep clean;
  DOMAIN.md has no chain entry (no collision, no update).

Matrix-source citations for Phase 3 (one-coverage-home):
- NEO-CHAIN-01 ← matrix/chain/T6/tests/e2e/T6-contract.spec.ts
  (also homes T10 extends legs: strict assertion-subset)
- NEO-CHAIN-02 ← matrix/chain/T7/tests/e2e/T7-contract.spec.ts
  (also homes T12 extends legs: strict assertion-subset)
- NEO-CHAIN-03 ← matrix/chain/T11/tests/e2e/T11-contract.spec.ts
  (also homes T13 extends legs: identical assertion set)
- NEO-CHAIN-04 ← matrix/chain/T9/tests/e2e/T9-contract.spec.ts
  (extends legs + prelude-order extends half ONLY; topology =
  untouched T4; layers legs + cross-bucket order stay held)
- NEO-CHAIN-05 ← NEW (CHAIN_REPORT §4.3 depth≥3; no matrix file)
- T3-extends → pre-existing NEO-SYNC-10 (single-hop adopt;
  behavior-subset, no new case). T5-new refused (layers, H3).
- Layers legs of T3/T9/T10/T12/T13 stay homed at kept matrix
  chain-t2/chain-t8 until D17. T8 policy untouched (H4, not P1).

P1 DONE: 5 cases added, all green, gate clean, every extends
leg homed, layers legs explicitly out.

### P3 P-resp-1 DONE — NEO-RESP-10 (viewport contract)

- Case: `resp/NEO-RESP-10` (6 tracked files; literals only). Three
  classes: css width branch @800px, recipe height branch @700px
  (`className: 'viewport'`), mixed css with `r: {260}` + `@media`
  800px on one call; 220/320px shells. Spec replays all 8 oracle
  legs in file order incl. the 4 mixed cells.
- Proof: `pnpm agentneo run NEO-RESP-10` → PASS viewport.spec.ts
  (first run green); `pnpm agentneo q` authored files → 0/0.
- Matrix source (Phase 3): DROP `matrix/responsive/tests/e2e/
  viewport-contract.spec.ts` WHOLE FILE (8 tests) — home is
  NEO-RESP-10. Recipe+`@media`+`r` conjunction proven clean here,
  so the optional recipe conjunction probe is CARRIED.

## P1 acceptance (captain, 2026-09-23)

P1 ACCEPTED. 5 NEO-CHAIN cases (01 transitive, 02 diamond,
03 parallel, 04 multi-extends/later-wins, 05 depth-3 new),
each green on its scoped run, q 0/0 over all 23 authored
files, list-discovered, panda-grep clean. Home map is
disciplined: T10/T12/T13 folded as strict subsets (no
double-homes), T3-extends to pre-existing SYNC-10,
layers legs + T5-new + T8 explicitly refused/held per
H3/H4, every port citing its matrix source for Phase 3.
Scope held (new chain/ group only; siblings never opened).
Firsthand re-runs wait for the Obj-2 landing. P0/P2/P3
still out; Phase 2 waits on Phase 0's formal return.

### P3 P-spacing-1 DONE — NEO-PRIM-15 (corner-pair radius shorthands)

- Case: `prim/NEO-PRIM-15` (8 tracked files incl. theme.ts). Six
  primitive probes, one per pair shorthand at `2r`; spec pins all
  twelve addressed corners at 8px (physical + LTR logical) and the
  expanded longhands in the sheet.
- One fix during authoring: first run painted 0px — the sheet rules
  existed (`rounded-tl_2r` etc.) but `calc(2 * var(--spacing-root))`
  had no basis; added the CSS-12 `theme.ts` rhythm-root fragment
  (`--spacing-root: 0.25rem`), then green. World gap, not engine.
- Proof: `pnpm agentneo run NEO-PRIM-15` → PASS pairs.spec.ts;
  `pnpm agentneo q` authored files → 0/0.
- Matrix source (Phase 3): DROP `matrix/spacing/tests/e2e/
  system-contract.spec.ts` "physical border radius pair shorthands
  resolve to both addressed corners" + "logical border radius pair
  shorthands resolve to the expected corners in LTR" (L143-175) —
  home is NEO-PRIM-15. The `box.d.ts` leg is NOT ported (DROP*
  legacy stands).

### P3 optional recipe conjunction DONE — NEO-RECIPE-12

- Case: `recipe/NEO-RECIPE-12` (7 tracked files). Recipe base with
  `@container (min-width: 320px)` border branch + `alert` variant
  with `@media (min-width: 900px)` padding branch; one shared class
  on narrow/wide probes. Spec: wide+980 paints all four (the
  conjunction), narrow+980 paints viewport-only. Clean as
  predicted by RESP-10 — carried.
- Proof: `pnpm agentneo run NEO-RECIPE-12` → PASS
  conjunction.spec.ts (first run green); `q` → 0/0.
- Matrix source (Phase 3): DROP `matrix/recipe/tests/e2e/
  system-contract.spec.ts` "responsive recipe applies viewport media
  and container-query branches together on one class" (L265-274) —
  home is NEO-RECIPE-12.
- Optional typescript strict-wrapper: DECLINED (logged in recon —
  no Neo `strict` surface; TYPE-02 is the equivalent home).

## HQ direction — the matrix job (captain, 2026-09-23)

HQ: matrix exists to answer ONE question — launch reference
UI, release it, someone downloads from npm into a virtual
env, layers and extends work. Heavy-duty e2e, slow to spin
up. Everything provable natively moves OUT into native
structures; matrix keeps only that job. Distro, watch,
chain named as the archetypal keeps.
Captain's reading (stated, correctable): "natively" = Neo
cases for behavior/browser + RS seams for compiler units
(the voyage brief's PORT destination all along); "reference
RS" read as the native toolchain, not RS-seams-only. The
map's one-coverage-home law already executes this
direction; in-flight P1/P2/P3 work stands — no crews
paused or rebriefed. Open reshapes for Phase 3 (not now):
whether distro/watch interim keeps become PERMANENT SLIM
tiers (install-dimension only) instead of full release —
with HQ. Extends note: kept T2/T8 retain extends legs over
packed packages, so packed-boundary extends stays proven
while Neo carries behavior breadth — no hole unless HQ
rules otherwise.

## P2 acceptance (captain, 2026-09-23)

P2 ACCEPTED. NEO-CLI-01 (4 lifecycle legs incl. SIGTERM
recovery) + NEO-WATCH-01 (4-leg paint loop), each PASS
twice consecutive, q 0/0 file-scoped, byte-clean worlds,
no-panda clean, release statements filed per-leg (distro
L280-446 incl. virtual-mirror retirement + skip/type
carve-outs; watch-contract all 3 tests + SYNC-14 split).
Scope held (new cli/ + watch/ groups only). Harness-quirk
finding matches the carried gate follow-up (dir-scoped q
vs gitignored world output, SYNC-14 corroborated) — same
item, no new action. NOTE vs HQ's matrix-job steer: P2's
cases stand as Neo behavior coverage regardless; whether
the distro/watch keeps fully RELEASE or become permanent
slim tiers is now a Phase-3 reshape with HQ, not P2's
call to finalize. Firsthand re-runs wait for landing.

### P3 ledger rows + final gate

- TESTS.md rows appended (additive only, verified via `git diff`):
  prim +3 (13/14/15), css +1 (15), cond +1 (18), resp +1 (10) with
  the `01..09`→`01..10` range-header bump, recipe +1 (12).
- No-panda pass: `panda` occurs only in NEO-PRIM-14's spec/README
  as absence-pins + re-target explanation (compliant); zero
  `virtual`/mirror and zero `box.d.ts` content in all P3 files.
  Recorded divergences NOT ported: panda-theme spellings,
  virtual-mirror legs, box.d.ts leg. Kept suites, DROP* legacy,
  and StyleProps-assertions beyond the map untouched.
- Consolidated `pnpm agentneo q` over all 47 P3 authored files →
  0 errors, 0 warnings, 25 linted files. Worktree check: my
  footprint = 7 new case dirs + 5 TESTS.md row-edits + this log;
  siblings' `chain/`/`cli/`/`watch/` dirs untouched; no src,
  matrix, RS, or lib changes; index untouched; nothing committed.
- All 7 proofs are scoped `agentneo run <id>` greens on final
  artifacts (PRIM-14/15 re-run green after their fixes; the rest
  first-run green with no later edits).

## P3 DONE (crew, 2026-09-23)

All six micro-ports + the carried recipe optional are landed in the
working tree as new cases inside existing groups, each green on its
scoped proof and clean on the gate.

| Item | Neo case (coverage home) | Proof |
|---|---|---|
| P-prim-1 | prim/NEO-PRIM-13 (prefixed + bare paint equal; no-raw-leak pin) | PASS prefixed.spec.ts; q 0/0 |
| P-css-1 | css/NEO-CSS-15 (840px halves) | PASS viewport.spec.ts; q 0/0 |
| P-csssel-1 | cond/NEO-COND-18 (`& +`/`& ~` in css()) | PASS siblings.spec.ts; q 0/0 |
| P-colormode-1 | prim/NEO-PRIM-14 (portal island, re-targeted) | PASS portal.spec.ts; q 0/0 |
| P-resp-1 | resp/NEO-RESP-10 (8-leg viewport contract) | PASS viewport.spec.ts; q 0/0 |
| P-spacing-1 | prim/NEO-PRIM-15 (6 pairs, 12 corners) | PASS pairs.spec.ts; q 0/0 |
| recipe-opt | recipe/NEO-RECIPE-12 (media+container conjunction) | PASS conjunction.spec.ts; q 0/0 |

Declined: typescript strict-wrapper (no Neo `strict` surface;
TYPE-02 is the equivalent home — nothing clean to port).

Matrix-source citations for Phase 3 one-coverage-home (DROP with
the suite; home = Neo case above):
- P-prim-1: `matrix/primitives/tests/e2e/primitives-contract.spec.ts`
  L247 "primitive resolves category-prefixed color tokens in the
  browser" (+ fixture `matrix/primitives/src/index.tsx:52-58`).
- P-css-1: `matrix/css/tests/e2e/css-contract.spec.ts` L277-302
  (viewport pair) (+ `matrix/css/src/styles.ts` viewportProbeClass).
- P-csssel-1: `matrix/css-selectors/tests/e2e/
  css-selectors-contract.spec.ts` L65-75 (sibling pair) (+
  `matrix/css-selectors/src/styles.ts:16-25`, `App.tsx:36-54`).
- P-colormode-1: `matrix/color-mode/tests/e2e/system-contract.spec.ts`
  L96-112 (portal island) (+ `matrix/color-mode/src/index.tsx:122-128`).
- P-resp-1: `matrix/responsive/tests/e2e/viewport-contract.spec.ts`
  WHOLE FILE, 8 tests (+ `matrix/responsive/src/styles.ts`).
- P-spacing-1: `matrix/spacing/tests/e2e/system-contract.spec.ts`
  L143-175 (physical + logical pairs) (+
  `matrix/spacing/src/index.tsx:53-76`).
- recipe-opt: `matrix/recipe/tests/e2e/system-contract.spec.ts`
  L265-274 (conjunction) (+ `matrix/recipe/src/styles.ts`
  recipeMatrixResponsiveCardRuntime).

## P3 acceptance (captain, 2026-09-23)

P3 ACCEPTED. 7 items (6 micro-ports + recipe optional),
each green on its scoped run + q 0/0, all inside existing
groups (prim ×3, css, cond, resp, recipe) — zero new
top-level groups, verified in status. Citations filed with
spec lines AND fixture files for Phase 3. Typescript
strict-wrapper declined with reason (no Neo strict
surface; TYPE-02 equivalent) — sound, matches H1-flag
discipline. Panda spellings not ported anywhere.
Phase 1 COMPLETE (P1+P2+P3 all accepted). Phase 2 waits on
Phase 0's formal return (table filed, crew wrapping) +
HQ's Q3/Q4 steers.

## HQ law — matrix keeps what native can't prove (captain, 2026-09-23)

HQ refined the steer: distro + watch are INVESTIGATE, not
rule — a hunch that closer inspection may fully port them.
The principle (HQ's words, adopted as the Phase-3 bar):
matrix keeps exactly what can't be proved in local tests
or in one set of environments. MCP confirmed permanent
(whole-standard standpoint — matches the map's ×19 keep).
The install-space framing ("I just installed reference UI
/ someone else's base system") is T2/T8's kept job.
Dispatched a read-only install-dimension investigation
(distro legs + watch legs + MCP second opinion) → verdicts
(RELEASE vs SLIM-KEEP with exact kept lists) land before
Phase 3 dispatch. P2's Neo cases stand either way.

## Install-dimension investigation (crew, 2026-09-23) — WORKING

Scope (strict): READ-ONLY everywhere except this log. Distro legs
+ watch legs + MCP second opinion only. Chain tiers (T2/T8),
all other suites, and any implementation OUT. Governing skill
`test-core` loaded first (recon only — no suites run). Orders:
VOYAGE.md Obj 2, this log's map verdicts + P2 section +
acceptance, Phase 0 rows 13/16/F2, HQ law (matrix keeps exactly
what can't be proved in local tests or in one set of
environments). P2's NEO-CLI-01 / NEO-WATCH-01 stand as behavior
coverage either way — this crew decides only what must ALSO stay
in matrix.

### Method

Read firsthand: `matrix/distro/tests/unit/distro.test.tsx`
(all 729 lines) + `generated-output.test.ts`,
`matrix/watch/tests/e2e/watch-contract.spec.ts` (all 502 lines)
+ unit `runtime.test.ts`, all `matrix.json` modes (19 suites +
11 chain tiers), `matrix/mcp` helpers (`server.ts`,
`artifact.ts`, `fixtures.ts`, `global-setup.ts`) + per-file
installed-server census, P2 case specs, pipeline runner
(`package-runner.ts` install/setup/test phases,
`ref-sync-support/run-watch-session.mjs` + `wait-ready.mjs`,
`ref-sync.ts`, `consumer.ts`, `discovery/index.ts`).

Install-mechanics baseline (firsthand, shapes every verdict):
every matrix package installs in Dagger from packed tarballs via
the staged registry (`resolveMatrixInternalTarballSpecs` +
`createMatrixInstallCommand(REGISTRY_URL_IN_CONTAINER)`), then
runs setup (`pnpm exec ref sync` for `full` mode) or a shared
watch session (`run-watch-session.mjs` → `pnpm exec ref sync
--watch` for `watch-ready` AND `watch-full`). Post-migration
M-runner retargets these invocations to `neo` (Phase 0 rows
14/18/19). Consequence: EVERY kept tier re-proves
installed-bin-in-virgin-container on every run — distro/watch
legs can claim an install dimension only if they exercise
something BEYOND that baseline.

### 1. DISTRO — leg-by-leg install dimension

| Leg (distro.test.tsx) | What it runs | Beyond a local neo binary? |
|---|---|---|
| L280-286 idempotent re-sync | `pnpm exec ref sync` twice in virgin container | NO. Bin resolution via installed shim is re-proven by every kept tier's setup phase (mcp `full`, T2/T8 `watch-ready`). Behavior = NEO-CLI-01 leg 1 (byte-identical re-sync). |
| L288-354 stale virtual cleanup | rename/delete + resync, virtual-mirror asserts | NO — retired. No Neo mirror by design (SYNC-02); no home needed. |
| L356-358 virtual-tree exact-sync | mirror/source listing equality | NO — retired, same. |
| L360-400 stale runtime rewrite | poison 3 artifacts → cold sync → content pins + node import probe | NO. Import probe resolves sync-made links — NEO-CLI-01's PROBE_SCRIPT does the identical probe natively. Nothing asserts shipped layout, tarball contents, or bin shims. |
| L402-418 SIGTERM recovery | kill `pnpm exec ref sync` (detached group) → heal → pins + probe | NO. Kill-through-pnpm-wrapper is runner scaffolding, not shipped behavior; shipped behavior (partial publish + heal) = NEO-CLI-01 leg 3. Single node image (`node:24-bookworm`) — no multi-node dimension exists to keep. |
| L420-438 clean-restore | clean → assert gone → sync → probe | NO. = NEO-CLI-01 leg 4. Phase 0 row 16/F2 nit (`neo clean` leaves the `types` junction) is a follow-up, not a keep reason — leg 4 passed. |
| L440 skip | skipped sentinel test | Stays skipped. |
| L447-656 type describes (token-aware props, css(), token-contract tsc, barrels) | real `tsc` + type asserts | NO. Provable in one env (TYPE-01..05/07 + local tsc; tsc pinned in devDeps, same binary locally). H1 strict-colors resolved by Obj-1 landing. |
| generated-output.test.ts (9 tests) | generated manifest/exports/sheet pins | NO — DROP*. Panda-shaped pins Neo forbids (SYNC-02/D2/D4). |
| baseSystem/jsx-elements portability | generated artifact shape | NO — legacy shapes / Neo-covered. |

No leg asserts packed-tarball contents, installed layout,
virgin-env resolution, multi-node versions, or real bin
shimming beyond what kept-tier setup phases already prove.
Virgin-env binary self-sufficiency (declared-deps completeness)
is the one real dimension in this space — and T2/T8/mcp setup
phases prove it on every run without distro.

**DISTRO verdict: full RELEASE.** P-cli-1 (NEO-CLI-01) suffices
for behavior; kept tiers carry the install baseline. No slim
tier, no kept list.

Runner fallout (for M-runner, not a keep reason): distro is one
of exactly three `runTypecheck: true` suites (verified:
distro, reference, typescript — all DROP-class). Full release
ORPHANS the runner's `tsc --noEmit` phase. Disposition: M-runner
DELETES the typecheck phase. `full`-mode standalone setup
survives via kept mcp — no other runner path depends on distro.

### 2. WATCH — loop-over-what per leg

| Leg (watch-contract.spec.ts) | Loop | Packed-vs-linked matters? |
|---|---|---|
| Test 1: css/primitive/recipe/token edits → resync → paint | file mutation → live watcher → local sync output → browser reload | NO. Watcher consumes workspace files, emits local files; installed packages are never re-read by the loop. = NEO-WATCH-01 legs 1-2 + SYNC-14. The `virtualRecipeFilePath` pin is DROP* legacy. |
| Test 2: config-dep edit → resync → paint | same loop, config file as trigger | NO. Mechanism = NEO-WATCH-01 leg 2 (value change → repaint) + SYNC-14 node-side config-dep. Install-agnostic. |
| Test 3: fragment add → paint / delete → unpaint | same loop, file add/delete as trigger | NO. = NEO-WATCH-01 legs 3-4 + SYNC-14. `panda.config.ts` pins DROP* legacy. |
| Webpack dual-consumption | second bundler consumer | OUT per H5 retire (unchanged). |
| Unit runtime.test.ts (marker + Div resolve) | none | NO. SYNC-01 handshake. |

The whole watch contract is install-agnostic: fully covered by
NEO-WATCH-01 + SYNC-14.

**NATIVE GAP flagged (not a keep reason):** no native test spawns
the `neo sync --watch` BINARY — NEO-WATCH-01 uses in-process
`watchSync`, NEO-CLI-01 spawns one-shot `sync`/`clean` only.
The bin `--watch` flag path (`bin/neo.ts:86-111`) is therefore
unproven natively. Per HQ law it is provable locally, so it must
NOT anchor matrix. Recommend a native follow-up (extend
NEO-CLI-01 with a `--watch` spawn leg, or a NEO-CLI-02) — owned
outside Phase 3, tracked so the flag path isn't orphaned by both
homes at once.

**Runner-orchestration answer:** `run-watch-session.mjs` +
`wait-ready.mjs` are exercised by BOTH watch modes
(`package-runner.ts:199` — `watch-ready` and `watch-full` share
the session). Kept T2/T8 are `watch-ready` → the orchestration
stays live post-migration, and the Phase 0 row-13 wait-ready
re-expression is still required for them. ORPHANED by a watch
release: ONLY the `watch-full` variant (`waitFor=complete`,
`completedAt` gate, 120s default) — watch is its sole consumer
(all other suites are `full` or `watch-ready`, verified across
all 30 matrix.json files). Disposition: M-runner DELETES the
`watch-full` mode + complete-gate branch with the suite.

**WATCH verdict: full RELEASE.** No slim tier, no kept list.

### 3. MCP second opinion — ×19 stress test

Census (firsthand): all 18 test files drive the INSTALLED
server — 12 via the shared global-setup client
(`connectSharedMatrixMcp`), 6 via own `startMcpServer`
(cross-platform-paths, multi-project-workspace,
project-failure-modes, registry-lifecycle-stress,
resilient-boot, symlinks). Zero pure-unit files. Install
dimensions in the harness: bin resolved from packed
`node_modules/@reference-ui/mcp/bin/mcp.mjs`, built
`dist/mcp-child.mjs` required, `npm_config_registry` asserted
(`server.test.ts:24` — staged-registry proof), HTTP transport
to the installed CLI. Legs span tools, resources, icons,
project-discovery/switching, paths/symlinks, registry
lifecycle, resilient boot — the whole standard against the
shipped artifact. `get-tokens` `_private` legs consume the
PACKED `@fixtures/extend-library` — packed-boundary proof,
matrix-only.

Slim-out candidates examined, all rejected:
- Behavior legs → native? `packages/reference-mcp` already has
  10+ colocated pipeline unit tests — that IS the native units
  home. Moving tool-output legs natively would dual-home
  behavior AND drop the packed-artifact dimension (tarball
  contents, bin+dist layout, virgin-registry resolution).
  Violates one-coverage-home for zero gain.
- Source-tree fallback paths in helpers (`server.ts:27`,
  `artifact.ts:14-15`)? Path robustness for local runs, not a
  native headedness — the suite's contract is the installed
  artifact, asserted explicitly.
- Any single file provable natively without losing the
  standpoint? No — the standpoint IS installed-artifact proof,
  and every file participates in it. Nibbling one file saves
  nothing (the installed boot cost is shared via global setup)
  while punching a hole in the standard.

**MCP verdict: confirm ×19.** No slim-outs. HQ affirmed, stress
test holds.

### Phase-3 instructions

- DISTRO: DELETE the suite outright. No slim tier. M-runner
  deletes the now-orphaned `tsc --noEmit` typecheck phase (no
  kept suite sets `runTypecheck`). Behavior home: NEO-CLI-01.
- WATCH: DELETE the suite outright. No slim tier. M-runner
  deletes the `watch-full` mode + `waitFor=complete` gate
  (sole consumer gone); keeps + re-expresses
  run-watch-session/wait-ready for T2/T8 (Phase 0 row 13).
  Behavior home: NEO-WATCH-01 + SYNC-14. Native follow-up:
  `--watch` binary-spawn leg (CLI-01 extension or CLI-02).
- MCP: KEEP all 19 files permanently. Migrate boilerplate per
  M-mcp/M-runner (F1 specifier wiring, F4 shipped-crowbar
  bundling). No native split.
- Kept-gate shape after Phase 3: chain-t2, chain-t8, mcp ×19.
  No distro/watch residue.

## INSTALL-DIM DONE (crew, 2026-09-23)

Three verdicts: DISTRO full RELEASE (P-cli-1 suffices; no kept
list; M-runner deletes orphaned typecheck phase) — WATCH full
RELEASE (NEO-WATCH-01 + SYNC-14 cover; no kept list; M-runner
deletes `watch-full` mode, keeps orchestration for T2/T8; native
`--watch`-spawn gap flagged as follow-up) — MCP confirm ×19 (no
slim-outs; whole-standard standpoint holds). Kept gate: T2/T8 +
mcp. Read-only held (this section the sole write); index
untouched; nothing committed.

## Install-dim acceptance (captain, 2026-09-23)

ACCEPTED. Verdicts: DISTRO full RELEASE (kept-tier setups
re-prove the install baseline every run — distro adds no
dimension beyond NEO-CLI-01), WATCH full RELEASE (loop is
install-agnostic; covered by NEO-WATCH-01 + SYNC-14), MCP
confirm ×19 (installed-artifact standpoint, zero pure-unit
files, packed-boundary legs). HQ's hunch resolved toward
full port — the closer inspection found no keep reason.
Kept gate after Phase 3: chain-t2, chain-t8, mcp ×19.
M-runner dispositions recorded for Phase 2: DELETE the
orphaned `tsc --noEmit` phase (all 3 runTypecheck suites
are DROP-class) + DELETE `watch-full` mode/complete-gate
(watch sole consumer); keep + re-express orchestration
for T2/T8. NATIVE GAP (crew-flagged): nothing spawns
`neo sync --watch` — micro-crew dispatched now (CLI-01
leg or CLI-02) so the flag path isn't orphaned by both
homes at once. Read-only held; firsthand re-runs at
landing.

## Phase 0 acceptance + Phase 2 dispatch (captain, 2026-09-23)

PHASE 0 ACCEPTED. Retarget table (25 rows, all firsthand
file:line) + F1–F6 flags + per-scope verdicts: all seven
M-scopes GO, every NO TARGET with a named disposition.
Read-only verified (zero writes across matrix/pipeline/
fixtures/core/mcp/icons/docs/lib). Notable: parity.md
ruled stale except deliberate drops (trust firsthand);
lib/docs pre-proven via F6; mcp tokens re-export flagged
as downstream-API surface (M-mcp owns break-vs-shim).
Q3 DEFAULT LIVE (HQ steer pending — default stands unless
overruled): vendor/re-express first everywhere; F1
additive neo exports entries REQUIRE sign-off — M-mcp
implements tsup-alias + tsconfig-paths, and if insufficient
files NEED-EXPORTS with evidence and moves on (no waiting,
no exports without a follow-up ruling). Q4 (styletrace
plain-dir move) still open for Phase 3 — does not gate
Phase 2. H4 default (allow-and-document) stands for T8
boilerplate; policy content untouched.
Phase 2 dispatched, 6 crews parallel + disjoint (7th slot
held: CLI-watch still running): M-mcp (retargets +
registry/McpAwareConfig/coreDir vendors + tokens
re-expression + F1/F4 wiring), M-icons (swap + junction
verification + cleanup), M-docs+lib (both small scopes;
lib = 4 named edits ONLY, readmes excluded), M-fixtures
(id/script/leg swaps, NO moves), M-runner (templates +
invocations + keys/lists + kept-boilerplate + wait-ready
re-expression + install-dim deletions: typecheck phase,
watch-full mode), M-docs-prose (row-25 sweep incl. ONE
RS file DIST.md refs-only — prose, reviewed at landing).
Scoped proofs only (tsc, colocated units, targeted builds;
NO Dagger — hermetic proof is the landing gate). Crews log
here, never commit. Phase 3 waits on Phase 2 + CLI-watch.

## CLI-watch gap crew (2026-09-23) — WORKING

Scope (strict): `packages/reference-neo/tests/cases/cli/` ONLY.
No other groups, no src, no matrix, no RS, no lib. Never commit,
never touch the index. Governing skill `agent-neo` loaded first;
VOYAGE.md Obj 2 + LOG-2 P2 section + install-dim §2 NATIVE GAP +
captain's acceptance read.

### Recon (read-only, firsthand)

- Gap: no native test spawns the real `neo sync --watch` binary.
  NEO-CLI-01 spawns one-shot `sync`/`clean` only (lifecycle.spec.ts);
  NEO-WATCH-01 uses in-process `watchSync` (watch-loop.spec.ts).
  The bin `--watch` path (`bin/neo.ts:86-111` cmdWatch) is unproven.
- Bin surface: cmdWatch runs baseline `watchSync` (which itself runs
  one baseline sync, then subscribes — `src/sync/watch.ts:281-284`,
  onResync fires only for watch-driven resyncs, never baseline),
  prints `[neo] sync <ms> → <dir>/.reference-ui` + `[neo] watching
  <dir> — Ctrl-C to stop`, installs SIGINT/SIGTERM → stop() →
  exit 0/1, stays resident. The `watching` line therefore proves
  subscriptions live — no settle sleep needed (better than
  WATCH-01's 500ms sleep).
- Routing negatives already homed: `bin/neo.test.ts` pins `--help`,
  unknown command, `clean --watch` rejection, and `sync --watch`
  failing loud with no config. This crew proves ONLY the resident
  path against a real world — no double-homing.
- Invocation precedent (CLI-01): `spawn(process.execPath,
  [BIN_PATH, ...])`, BIN_PATH resolved from the spec via
  `../../../../../bin/neo.ts`; node v24 type-strips the bin.
- Runner: `sync:true` case.json → build + sync + serve + browser
  goto of index.html before the spec (shared/runner.ts), so the
  world carries a loadable index.html like CLI-01's; the spec
  itself is node-only ({ case }) like lifecycle.spec.ts.
- ID check: `NEO-CLI-02` zero hits across packages/reference-neo —
  free, no PLAN.md/SPEC.md/TESTS.md reservation (cli/ group keeps
  P2's README-only shape, no TESTS.md ledger).

### Decision: NEO-CLI-02 (new case, not a CLI-01 leg)

Logged reason: NEO-CLI-01 is P2-ACCEPTED with filed per-leg
release statements mapping its 4 one-shot legs to distro lines.
A resident-process leg (stdout streaming, debounce timing,
signal shutdown) is a different process shape that would strain
the case's one-shot coherence and force re-proof of an accepted
artifact. A focused CLI-02 keeps CLI-01 byte-untouched and is
the single home for the bin `--watch` flag path. (Install-dim
allowed either; captain's acceptance allowed either.)

### Case plan — NEO-CLI-02: spawned `sync --watch` boot, resync, shutdown

Three legs, flag-path only (not a second watch loop — one
mutation type, one resync signal + output-change assert):
1. Boot: spawn real `neo sync --watch <worldDir>`; `watching
   <dir>` stdout line names the world (flag routes to cmdWatch,
   baseline sync ran, subscriptions live).
2. Resync: token-value edit → `[neo] resync →` stdout line
   (resync signal) + `[neo] change theme/tokens.ts` line (bin
   onChange wiring) + sheet pin flips `--colors-brand` to the
   new value (output change); restore → second resync + pin
   flips back.
3. Shutdown: SIGTERM → child exits 0 (graceful shutdown path,
   bin/neo.ts:97-102 — intercepted signal, not death by signal).
Finally: child reaped (SIGKILL fallback), canonical spelling
restored, one-shot heal sync (CLI-01 precedent), so the world
is byte-clean and green for the next run whatever fails.

### Implementation (new files only, 7 + 1 README row)

`tests/cases/cli/NEO-CLI-02/` (case.json, README, specs/
watch-flag.spec.ts, world index.html + ui.config.ts +
theme/tokens.ts + theme/uses.ts) + one additive bullet in
`tests/cases/cli/README.md`. NEO-CLI-01 byte-untouched. Index
untouched, nothing committed.

- Spec spawns the REAL binary (`process.execPath` + `bin/neo.ts
  sync --watch <worldDir>`, CLI-01 precedent, piped stdio).
- Boot leg waits for `watching <dir>` naming the world + the
  baseline `[neo] sync ` line — subscriptions-live proof, no
  settle sleep (improvement on WATCH-01's 500ms).
- Resync leg: token edit → `resync` stdout line (delta-counted,
  WATCH-01 pattern) + `change theme/tokens.ts` line + sheet pin
  `--colors-brand: #0e5c3f`; restore → second resync + pin back
  to `#7c3aed`. Changed spelling derives by single-line
  `.replace`, so restores cannot drift (WATCH-01 precedent).
- Shutdown leg: SIGTERM → exit 0 with null signalCode (graceful
  path, bin/neo.ts:97-102 — intercepted, not death by signal).
- Finally: quiet reap (SIGTERM → grace → SIGKILL fallback, never
  throws), canonical spelling restore, one-shot heal sync
  (CLI-01 precedent).

### Proof (scoped runs only, all firsthand)

- `pnpm agentneo run NEO-CLI-02` → PASS (watch-flag.spec.ts),
  twice, consecutive (both first-run green, no fixes needed).
- `pnpm agentneo q` over the 4 authored `.ts` files → 0 errors,
  0 warnings.
- Byte-clean: sha256 of all 4 world sources matches the pre-run
  baseline after every run; inventory exactly the 7 intended
  files (+ 1 README row).
- No-panda pass over authored files: clean (zero hits).
- `pnpm agentneo list` discovers NEO-CLI-02; no orphaned
  `neo sync --watch` processes after the runs (pgrep self-match
  ruled out via follow-up ps — no neo.ts processes live).
- No-flake note: resync waits are delta-counted with 90s
  budgets; shutdown polls exit fields (no event-attach race).

### Gap-closure statement

The install-dim §2 NATIVE GAP is closed natively: the bin
`--watch` flag path (`bin/neo.ts:86-111`) is now proven end to
end by NEO-CLI-02 — spawned watcher boots against a real world,
a file mutation triggers a resync asserted both as the stdout
resync signal and as the changed sheet bytes, and SIGTERM shuts
the resident process down clean. One-coverage-home: CLI-02 owns
the resident flag path; CLI-01 keeps one-shot lifecycle;
WATCH-01 + SYNC-14 keep loop breadth + paint; `bin/neo.test.ts`
keeps routing negatives. Nothing anchors matrix — Phase 3
deletes the watch suite outright per the install-dim verdict.

## CLI-WATCH DONE (crew, 2026-09-23)

Case: NEO-CLI-02 (new, in cli/ group) — 3 legs (boot, resync,
shutdown) over the spawned `neo sync --watch` binary. Proofs:
agentneo run green twice consecutive, agentneo q 0/0 over
authored files, byte-clean worlds, no-panda clean,
list-discovered, no orphans. Scope held (cli/ only + this log);
no commits, index untouched. CLI-WATCH DONE.

## CLI-watch acceptance (captain, 2026-09-23)

CLI-WATCH ACCEPTED. NEO-CLI-02 (boot/resync/shutdown over
the spawned binary), green twice consecutive, q 0/0,
byte-clean, list-discovered. New-case-over-extension call
was right (CLI-01's release statements stay intact,
one-shot coherence preserved). Scope held (cli/ only;
outside-cli writes in tree are M-fixtures', in scope).
The --watch flag path is no longer orphaned. Phase 1 +
gap fully closed; Phase 2 crews in flight.

## Tick (captain, 2026-09-23)

All six M-crews `running`, freshly dispatched, no log
sections yet — expected at this age (skill load + map
read + recon first), not deadlock. Liveness evidence:
M-scope work products already in tree (fixtures swaps
visible). No ping, no intervention. CLI-watch accepted
since last tick (flag path closed). Phase 3 waits on
Phase 2.

## M-fixtures (crew, 2026-09-23) — WORKING

Scope (strict): top-level `fixtures/**` ONLY. No moves
(Phase 3), nothing else. Never commit, never touch the
index. Governing skill `test-core` loaded first; VOYAGE.md
Obj 2 + LOG-2 Phase 0 rows/F-flags/fixtures plan + Phase 2
dispatch read. Sibling scopes (M-docs+lib etc.) untouched.

### Recon (read-only, firsthand)

- 7 chain fixtures share one shape: `package.json` scripts
  `sync`/`build`/`dev` + `@reference-ui/core: workspace:*`
  devDep; `ui.config.ts` imports defineConfig from
  `@reference-ui/core` (metas add a `@fixtures/*/
  baseSystem` import); `tsconfig.json` includes src only in
  ALL 7 → ui.config NOT typechecked → row-1 id swap alone
  suffices (no F1 tsconfig friction). Metas add an upstream
  `@fixtures/* run build` leg; layer fixtures lack the
  `./baseSystem` export (kept as-is, not my call).
- src imports are generated-package ids only
  (`@reference-ui/react`, `@reference-ui/system`,
  `/baseSystem` subpath; 19 hits, zero bare-core) → no
  needle gap, confirmed. Only other core hits: 3× `ref
  sync` in src/index.ts doc comments + `layer-library/
  project.json:13 "dependsOn": ["reference-core:build"]`
  (nx form of the row-23 core-build leg — in scope,
  deleted). Fixture READMEs: zero `ref` mentions.
- Row 22 verified firsthand: neo publishes both artifacts
  the exports map + build-package.mjs require —
  `system/baseSystem.d.mts` (publish/system.ts
  writeSystemDir) + `system/baseSystem.mjs` (publish/
  styled.ts via baseSystemMjsSource) + system.mjs
  re-export. COMPATIBLE, no change.
- bootstrap-runtime.mjs symlinks lib's neo-built
  `.reference-ui` (present: react/styled/system/tmp/
  types) → KEPT as-is per orders. `debug: false` in
  ui.config kept (runtime passthrough, untypechecked).
- Atlas-project: NOT retargeted — moves with the
  styletrace-local set in Phase 3 per orders. demo-ui /
  styletrace-*: census-clean, zero-touch.

### Edits (18 files, no moves)

Per fixture (7× package.json + 7× ui.config.ts): id swap
to `@reference-ui/neo` (row 1); `sync`/`dev` `ref`→`neo`
(row 14); `build` core-build leg deleted, lib-sync +
  upstream legs kept (row 23); devDep swapped core→neo
  `workspace:*` as the `neo` bin provider (row 24).
  Plus: layer-library/project.json dependsOn deleted
  (row 23); 3× src/index.ts `ref sync`→`neo sync` comment.
  Full list: 7 package.json, 7 ui.config.ts,
  layer-library/project.json, extend/layer/meta
  src/index.ts. `git diff --stat -- fixtures/`: 18 files,
  +39/−40. Residual sweep (`reference-ui/core`,
  `reference-core`, `ref sync/build`, `ensure-core`,
  `dependsOn`, excl. node_modules/dist/.reference-ui):
  ZERO hits.

### Proofs (scoped only, all firsthand)

- `./node_modules/.bin/neo --help` in-fixture → exit 0,
  usage printed: script/bin resolution PROVEN through the
  swapped devDep (a sibling ran the tree-wide install
  mid-session — `neo` now in every fixture `.bin`;
  pnpm-lock.yaml regen covered by that install; I ran no
  install myself — shared-file discipline held).
- `tsc --noEmit -p tsconfig.json` (fixture-local tsc):
  ALL 7 exit 0, zero output.
- JSON validity: all 7 package.json + project.json parse.
- All 7 `.reference-ui/system/` carry baseSystem.mjs +
  .d.mts (6 untouched-core-built + 1 restored, see below).

### BLOCKER — neo-sync smoke red on a neo-src port gap (out of scope)

`neo sync` FAILS on extend-library (then all 7 by shared
shape — components all `import * as React from 'react'`
+ top-level `tokens()`): `Dynamic require of "react" is
not supported` from the fragments-eval bundle
(fragments/base/index.ts:262 ← :194 ← sync/index.ts:143).
A/B PROOF it is pre-existing, not my regression:
identical failure with the ORIGINAL `@reference-ui/core`
ui.config id; and `ref sync` (core bin, same fixture,
same tree) goes GREEN in 2.87s. Root cause (firsthand):
fragment bundles are IIFE + `react` is in
DEFAULT_EXTERNALS (microbundle/externals.ts) → esbuild
emits a `require("react")` shim → ESM eval has no
require. Core survives this ONLY via its
`reactStubPlugin` (core lib/microbundle/plugins/
react-stub.ts — "Node ESM eval never crashes with
'Dynamic require of react is not supported'"), wired as
`reactStub: true` at 3 call sites of core
lib/fragments/runner.ts (:29/:111/:163). Neo's
microbundle/plugins/ carries alias ONLY — react-stub was
NEVER ported, and neo fragments/lib/runner.ts passes no
such option. ANY fragment file importing react (every
fixture component) therefore crashes neo sync. Fix =
port react-stub to neo src — OUTSIDE M-fixtures scope
(fixtures/** only); no fixture-side workaround exists
short of de-Reacting the components (destroys their
purpose) or restructuring tokens out (surface change
needing chain proof — refused). HANDOFF TO CAPTAIN: crew
a neo-src fix (port core's react-stub plugin + wire the
3 runner call sites) BEFORE Phase 3 — kept tiers T2/T8
consume fixture baseSystems and cannot build otherwise.
The "each touched fixture syncs via neo" smoke is
RE-RUNNABLE the moment that lands (one command per
fixture, leaves before metas); everything else in this
scope is proven.
- Collateral handled: the first failing neo sync wiped
  extend-library/.reference-ui (cleanDir-before-eval). I
  restored it via core `ref sync` under a temporary
  core-id ui.config (immediately re-applied neo; final
  state verified: 1 neo hit, zero core hits tree-wide in
  scope). No other fixture's .reference-ui was touched —
  after the first failure I ran zero further syncs.

## M-FIXTURES DONE (crew, 2026-09-23)

Migration edits COMPLETE: 18 files (+39/−40), zero
residual core refs, tsc 7/7 green, bin resolution proven,
row-22 artifacts verified compatible, bootstrap kept,
atlas noted for the Phase 3 styletrace-local move, no
moves, no commits, index untouched, scope held.
RESIDUAL (1, blocking only the smoke): neo-src
react-stub port gap (above) — `neo sync` red on all 7
fixtures until a neo-src crew ports core's
react-stub plugin; pre-existing (A/B-proven), same-tree
`ref sync` green. Re-run smoke after that fix; nothing
in fixtures/ will need to change.

## M-icons (crew, 2026-09-23) — WORKING

Scope (strict): `packages/reference-icons/**` ONLY, EXCLUDING
README (M-docs-prose owns all readmes). Never commit, never
touch the index. Governing skill `test-core` loaded first
(scoped checks only — NO Dagger/matrix runs). Orders:
VOYAGE.md Obj 2, LOG-2 Phase 0 rows 1/15/22/23/24 + F5,
captain's Phase 2 dispatch.

### M-icons recon (read-only, firsthand)

- Core touchpoints (grep, excl. node_modules/dist/
  .reference-ui): package.json:50 peer + :54 devDep,
  ui.config.ts:1 defineConfig id, build.mjs:25 ensure step
  + :27 `ref build`, ensure-core-cli.mjs (core dist CLI
  path + `--filter @reference-ui/core run build`). README
  has zero `core` hits — nothing to hand off.
- tokens.ts (`import { tokens } from
  '@reference-ui/system'`) needs NO change: neo's
  fragment bootstrap map aliases `@reference-ui/system`
  → author entry
  (fragments/base/bootstrap-import-map.ts:22), same
  spelling lib uses under neo today (F6 pre-proven).
  createIcon/types/src imports are `@reference-ui/react`
  only — engine-neutral.
- ui.config props (name/include/jsxElements/extends/
  debug) all exist in neo's ReferenceUIConfig
  (config/types.ts:26-74) — id swap is type-exact, no
  excess props.
- Neo layout vs core (lib's neo-built tree as predictor,
  icons' core-built tree as baseline): neo react.mjs is
  self-contained (sole external `react`); neo
  styled/ is data-only D4 — NO css/, jsx/, patterns/
  dirs. Neo react.d.mts carries exactly 2 bare
  `@reference-ui/styled` specifiers (import L6 + export
  L336); the earlier `@reference-ui/neo` grep hit was
  the generator banner comment only.
- Consequence: `dist/runtime/reference-ui/styled/css/
  index.js` (build.mjs requiredFiles + the 9-entry
  runtimeRewrites list) is core-layout-only and can
  NEVER resolve under neo. Re-expression required, not
  optional: materialize-runtime.mjs gets the neo
  rewrite (`@reference-ui/styled` →
  `../styled/index.d.ts`); requiredFiles re-pins the
  styled leg to `styled/styles.css` (sheet payload) +
  `styled/index.d.ts` (type root the .d.mts chain
  resolves). BaseSystem artifacts compatible per row
  22 (system.mjs re-exports baseSystem; only
  `./baseSystem.mjs` relative import in the leg).
- links.ts replaceLink rm-rf's real dirs then junctions
  — core-`build` real-dir links are auto-replaced by
  `neo sync`; no manual cleanup needed.
- Nested `packages/reference-icons/pnpm-lock.yaml` is
  tracked but standalone-shaped (importer `.`), with no
  core/neo entries — stale artifact, left untouched;
  root lockfile regen is R1's. No `pnpm install` from
  this crew (out of scope + sibling interference).

### M-icons implementation (6 changes, all in scope)

1. `ui.config.ts:1` — defineConfig id `@reference-ui/core`
   → `@reference-ui/neo` (row 1).
2. `tsconfig.json` — paths `@reference-ui/neo` →
   `../reference-neo/src/author/index.ts` + companion
   `allowImportingTsExtensions` (neo sources import
   with `.ts` extensions; flag is constraint-satisfied
   by noEmit/emitDeclarationOnly in both configs).
   Worlds pattern per F1.
3. `scripts/build.mjs` — deleted ensure-core-cli step
   (row 23); `pnpm exec ref build` → `pnpm exec neo
   sync` (row 15; pnpm-bin shape, ship-safe for
   staged-registry installs — a relative
   `../reference-neo/bin/neo.ts` path would not exist
   there); requiredFiles re-pinned: core-only
   `styled/css/index.js` → `styled/styles.css` (sheet
   payload) + `styled/index.d.ts` (type root the
   packaged .d.mts chain resolves, row 22).
4. `scripts/materialize-runtime.mjs` — 9-entry core
   runtimeRewrites → single neo rewrite
   `@reference-ui/styled` → `../styled/index.d.ts`
   (neo react.mjs is self-contained JS with zero
   styled hits; the .d.mts carries exactly 2 bare
   styled specifiers — verified on icons' own output).
5. `scripts/ensure-core-cli.mjs` — DELETED (row 23; neo
   bin is source-direct `.ts`, nothing to prebuild).
6. `package.json` — peer `@reference-ui/core: "*"`
   DELETED (F5, never a private peer); devDep
   `@reference-ui/core` → `@reference-ui/neo`
   `workspace:*` (bin provider, row 24).
- Untouched by design: tokens.ts + createIcon/types
  (`@reference-ui/system`/`@reference-ui/react` are
  engine-neutral under neo's bootstrap map + scope
  links), rollup config (externals unchanged),
  README (M-docs-prose), nested pnpm-lock (stale).
- Post-edit grep: zero `reference-ui/core`,
  `reference-core`, `ensure-core`, `ref build` hits in
  scope (excl. gitignored output + stale nested lock).

### M-icons proofs (scoped only, all firsthand)

- Verification harness (gitignored only, no lockfile):
  hand-replicated pnpm's workspace links —
  `node_modules/@reference-ui/neo` symlink +
  `node_modules/.bin/neo` shim cloned from the `ref`
  shim shape — so the landed `pnpm exec neo sync`
  runs pre-R1. R1's regen produces these for real.
- `pnpm exec neo sync` → green (1232–2685ms);
  node_modules scope links are junctions post-sync
  (core-build real dirs auto-replaced by
  links.ts replaceLink — no manual cleanup).
- `pnpm run build` (== `pnpm --filter
  @reference-ui/icons run build`, lib's build:deps
  entry) → exit 0, THREE consecutive full runs
  (generate 3857 icons + sync + rollup 3857 entries
  `created dist in 2s` + tsc + materialize +
  requiredFiles assert). Zero build warnings (the 4
  `warning` greps are icon filenames in the entry
  list). Rollup/tsc/materialize all ran OVER the
  junctions — chain holds (row 15).
- `tsc -p tsconfig.json` → clean (ui.config WITH the
  neo id typechecks; --traceResolution confirms the
  `@reference-ui/neo` paths hit from ui.config.ts).
  `tsc -p tsconfig.build.json` → clean.
- requiredFiles all exist with real payloads:
  baseSystem.mjs 238KB, baseSystem.d.mts, dist/index
  .mjs 249KB/.d.ts, runtime react.mjs 149KB, styled
  styles.css 12KB + index.d.ts.
- Artifacts (row 22): node import of
  `.reference-ui/system/baseSystem.mjs` →
  name `reference-icons`, schema 1, 1 fragment;
  `system.mjs` re-export ok; package `./baseSystem`
  export targets exist. /tmp tsc probe from a neutral
  dir over dist/types + dist runtime react + baseSystem
  → PROBE-TYPES-CLEAN (full published type chain
  resolves, incl. the rewritten
  `../styled/index.d.ts` edge).
- Packaged rewrites verified: dist .d.mts carries zero
  bare `@reference-ui/*` specifiers (banner comment
  only); dist/createIcon.mjs + dist/types.d.ts point
  at `./runtime/...` relative entries.
- Tree: exactly the 6 intended changes (5 M + 1 D);
  src/jsx-names.ts regenerated byte-identical (no
  diff); index untouched; nothing committed.
- Self-clobber (honest): one mid-verification `tsc -p
  tsconfig.build.json --noEmit false` re-emitted dist
  .d.ts AFTER materialize, wiping the types.d.ts
  rewrite. Caught by the rewrite grep, restored via
  materialize + a final clean end-to-end build (exit
  0, rewrite intact). Final dist is exactly what
  build.mjs produces.

### M-icons residual (for captain — out of M scope)

- R-MICONS-1 (engine output shape, NEW consumer-env
  edge): neo's packaged `react.mjs` carries a REAL
  static `import { createRoot } from
  "react-dom/client"`; core's packaged runtime
  imported only react + jsx-runtime (verified on the
  pre-rebuild dist). react-dom is NOT an icons dep,
  so `dist/index.mjs` fails to import where react-dom
  is absent (`Cannot find package 'react-dom'` —
  reproduced; the ONLY missing package). Fix lives in
  the engine (lazy/optional createRoot) or in the
  published contract (react-dom peer) — both outside
  M-icons scope (no neo-src, no contract calls).
  Flagged, not fixed. All ordered proofs hold
  regardless (build/tsc/requiredFiles/baseSystem/type
  chain all green).

## M-ICONS DONE (crew, 2026-09-23)

Files changed (6, `packages/reference-icons/` only):
M ui.config.ts, tsconfig.json, scripts/build.mjs,
scripts/materialize-runtime.mjs, package.json;
D scripts/ensure-core-cli.mjs. README untouched.
Proofs: build exit 0 ×3 end to end over junctions,
tsc clean incl ui.config, requiredFiles resolve,
baseSystem + published type chain resolve.
Residual: R-MICONS-1 (react-dom/client static edge —
engine/contract call). Index untouched, uncommitted,
scope held.

## M-fixtures acceptance + react-stub fix dispatch (captain, 2026-09-23)

M-FIXTURES ACCEPTED with one external residual. Migration
edits complete: 18 files (+39/−40), zero core refs, tsc
7/7, bin resolution proven, bootstrap/exports kept,
atlas noted for Phase 3, no moves. Scope verified (only
the 4 named file shapes). Collateral (wiped .reference-ui
on first failing sync) restored via core bin + final
state verified — gitignored output only, no payload
impact. Discipline noted: A/B-proved the blocker as
pre-existing (original-id fails identically, `ref sync`
green 2.87s) instead of working around it.
BLOCKER RULED REAL: neo sync crashes on ANY fragment
file importing react (`Dynamic require`, fragments-eval
IIFE + react external) — core's reactStubPlugin was never
ported to neo (alias-only plugins dir, no runner option).
Pre-existing, exposed by migration (NEO-REF worlds never
tripped it: their fragment files don't import React).
Blocks the fixture smokes + kept T2/T8 baseSystem builds
→ must land BEFORE Phase 3 hermetic proof. Fix crew
dispatched now (agent-neo): port the plugin + wire the
runner call sites + regression test + re-run the 7
fixture smokes + NEO-REF 26/26 still green. No fixture
changes needed after. Other M-crews unaffected (M-icons
reads this log for its junction verification).

## M-docs+lib (crew, 2026-09-23) — WORKING

Scope (strict): (A) packages/reference-docs/** EXCLUDING
readmes/prose (M-docs-prose owns those): package.json
scripts + dep swap (rows 14/18/24), ui.config id swap
(row 1), DROP serve-only referenceVite (row 11), KEEP
`mcp` block (row 20). (B) packages/reference-lib/**
EXACTLY 4 EDITS: ui.config id swap (row 1), DROP
referenceVite (row 11), DELETE core-build leg (row 23),
DELETE runtime core dep (row 24). No other lib file, no
README. Never commit, never touch the index. Governing
skill `test-core` loaded first (scoped checks only; NO
Dagger/matrix runs). Orders read: VOYAGE.md Obj 2,
LOG-2 Phase 0 rows 1/11/14/18/20/23/24 + F6, captain's
Phase 2 dispatch.

### Recon (read-only, firsthand)

- Neo bin: `neo` → `./bin/neo.ts` (neo package.json:19-21,
  node shebang, type-stripped on host v24.16.0). Docs'
  `.bin/ref` shim precedent (via core workspace dep) proves
  the mechanism: swapping the dep to `@reference-ui/neo`
  links a `neo` shim, so scripts retarget bare `ref sync` →
  `neo sync` / `ref sync --watch` → `neo sync --watch`
  (rows 14/18). Lib needs NO neo dep (F6: direct `node
  ../reference-neo/bin/neo.ts sync`, package.json:32/:35).
- Docs tsconfig include = src + vite.config.ts (ui.config
  unincluded → no tsconfig friction, per row 1). Lib
  tsconfig include = src + book + playwright (ui.config
  unincluded; book/vite.config.ts IS included — its core
  import dies with the plugin line, per Phase 0 M-lib GO).
- Docs vite.config: the `async ({ command })` signature
  exists ONLY for the serve-only dynamic import; dropping
  the block requires simplifying the signature (docs
  tsconfig has noUnusedParameters) — part of the row-11
  drop, not a 4th docs edit.

### Baselines (pre-edit, firsthand)

- `tsc --noEmit` docs: exit 1, 13 pre-existing errors (7×
  `../reference-core/src/types/...` TS2307 styled-module
  resolution failures + 6× mdxComponents TS2590/prop
  errors). Saved to /tmp/mdocs-tsc-before.txt.
- `tsc --noEmit` lib: exit 1, exactly the D-OPEN-4 2
  pre-existing ct.ts errors (:92 MountFn, :108
  toHaveScreenshot). Saved to /tmp/mlib-tsc-before.txt.
- Bar: ZERO NEW errors in each package, not zero total.

### Edits (6 files, scope-held)

M-docs (3 files):
1. package.json:7-8 `ref sync` → `neo sync`, `ref sync
   --watch` → `neo sync --watch`; :13-14 dep swap
   `@reference-ui/core` → `@reference-ui/neo` (sorted
   after lib). Rows 14/18/24.
2. ui.config.ts:1 id swap to `@reference-ui/neo`; `mcp`
   block (:10-12) KEPT untouched. Rows 1/20.
3. vite.config.ts: dropped the serve-only `if (command ===
   'serve')` referenceVite block + simplified the now-dead
   `async ({ command })` signature to `() =>`. Row 11
   (dev-HMR cost accepted per map).
M-lib (3 files, EXACTLY the 4 named edits):
4. ui.config.ts:8 id swap to `@reference-ui/neo`. Row 1.
   (Stale header comment "Uses reference-core ..." LEFT
   untouched — a 5th change needs a ruling, not a guest.
   Flagged as residual R-MDL-1 below.)
5. book/vite.config.ts: dropped `referenceVite` import (:6)
   + plugins-array entry (row 11); Neo-layout aliases
   (:35-47) untouched.
6. package.json:31 build:deps core leg deleted (keeps the
   icons leg + run-if-env-absent gate). Row 23.
7. package.json:49 runtime `@reference-ui/core` dep line
   DELETED (not swapped — F6 path needs no dep). Row 24.
- Zero-residual grep over all 6 files for
  `@reference-ui/core|referenceVite|ref sync|ref
  build|ensure-core`: zero hits. No README/prose touched;
  no other lib file touched. `pnpm install` relinked
  (docs `.bin/neo` shim present; pre-existing TS-peer
  warnings only).

### Proofs (scoped only, all firsthand)

- Docs `neo sync` (via new `.bin/neo` shim = retargeted
  script path): exit 0, 4354ms then 3741ms (re-run) —
  scripts resolve, new ui.config id loads, `mcp` block
  passes through without failure.
- Docs `pnpm run build` (content-collections + neo sync +
  vite build, no referenceVite): exit 0, 132 modules,
  dist emitted.
- Docs `vite --port 5174` serve: ready in 762ms,
  curl / → HTTP 200; server killed after (port verified
  down). Dev boot holds without the plugin.
- Lib `pnpm run sync` (F6 path, new ui.config id): exit 0,
  1517ms — pre-proven Neo sync still holds, confirm-done.
- Lib tsc after: exit 1, 2 errors, byte-IDENTICAL to
  baseline (diff clean) — ZERO NEW. D-OPEN-4 pair stands.
- Docs tsc after: exit 1, 16 errors, deterministic
  across re-runs — set differs from the 13-error stale
  baseline. Attribution (all firsthand, NOT assumed):
  (a) zero errors mention reference-core/referenceVite/
  vite.config — my file edits contribute ZERO tsc
  errors (none are typechecked inputs for src errors);
  (b) the 7 toolchain module-resolution failures are
  GONE (core left the graph); (c) 3 src errors are
  STABLE across both runs (marginY/paddingX lines 119/
  125/154 — pre-existing src issues); (d) DECISIVE:
  temp-reverted ui.config + direct core-bin `ref sync`
  FAILS on the current tree (exit 1, packager-ts
  `Tokens` TS2305 — full log /tmp/mdocs-coresync-fail.
  txt), so NO fresh-core baseline exists — docs lived
  on stale output and core cannot regenerate it. State
  fully restored after (neo ui.config + `neo sync`
  exit 0). The 16 are docs-src-vs-FRESH-neo-types
  mismatches; fixing docs src or neo typegen is OUT of
  M-docs scope (no-src rule; Neo landed Obj-1).
- M-fixtures' react-fragment neo blocker (logged above):
  NOT tripping here — docs + lib syncs exit 0
  firsthand. Unaffected.
- NO matrix/Dagger runs (per orders).

### Residuals

- R-MDL-1 (trivial): lib ui.config.ts header comment
  still says "Uses reference-core as the live
  config/runtime pipeline." Guest-scope left it; one-word
  fix for whoever owns lib next (Obj-5).
- R-MDL-2 (for captain): docs tsc 13(stale)→16(fresh)
  per attribution above — needs a follow-up ruling
  (docs-src conformance crew vs accepted-red), NOT a
  Phase-2 M-docs action. Evidence: /tmp/mdocs-tsc-
  before.txt / -final.txt, /tmp/mdocs-coresync-fail.txt.
- Lockfile: root `pnpm install` rewrote pnpm-lock.yaml in
  the working tree (mechanical relink consequence for
  the dep swap/proofs); Phase 3 R1 regens anyway.

## M-DOCS+LIB DONE (crew, 2026-09-23)

Files changed (6, scope-held): packages/reference-docs/
package.json (scripts + dep swap), ui.config.ts (id
swap, mcp kept), vite.config.ts (referenceVite block +
dead signature dropped); packages/reference-lib/
ui.config.ts (id swap), book/vite.config.ts (plugin
dropped), package.json (core-build leg + runtime dep
deleted). Proofs: docs neo sync/build/serve green
(exit 0/0/HTTP 200), lib F6 sync green, lib tsc
byte-identical (zero new), docs tsc attributed (my
edits zero; core-sync impossible on current tree).
Residuals R-MDL-1 (one stale comment word) + R-MDL-2
(docs-src-vs-fresh-types follow-up ruling). No
commits, index untouched, no prose touched, no Dagger.

## Neo-react-stub (crew, 2026-09-23) — WORKING

Scope (strict): neo src ONLY — (1) port react-stub plugin
to neo microbundle/plugins/, (2) wire analogous neo
fragments runner call sites, (3) ONE regression test.
No fixture edits, no matrix/RS/lib changes. Never commit,
never touch the index. Governing skill `agent-neo` loaded
first; VOYAGE.md Obj 2 + LOG-2 M-fixtures BLOCKER +
captain's acceptance read. Sibling M-crews untouched.

### Recon (read-only, firsthand)

- Core mechanism (both sides verified): plugin
  `packages/reference-core/src/lib/microbundle/plugins/
  react-stub.ts` (:37 `reactStubPlugin`, filter
  `react|react-dom|react/jsx-runtime|react/jsx-dev-runtime`
  + subpaths, `react-stub` namespace, in-memory proxy
  stub); option `reactStub?: boolean` in core
  microbundle/types.ts:26; wired FIRST in core
  plugins/index.ts:11-13 (before alias); consumed at 3
  call sites of core lib/fragments/runner.ts (:29
  bundleFragments, :111 runSingle, :163 runPlanner).
- Neo gap confirmed: `src/lib/microbundle/plugins/`
  carries alias.ts + index.ts ONLY (no reactStub
  branch); `src/lib/microbundle/types.ts` has no such
  field; neo `src/fragments/lib/runner.ts` has the 3
  analogous sites (:27-31 bundleFragments, :69-72
  runSingle, :121 runPlanner `microBundle(filePath,
  {})`) passing no such option. Neo
  build-options.ts:55 already funnels through
  `getPlugins(options)` → wiring index.ts suffices.
- Core HAS a colocated unit test (react-stub.test.ts:
  real-esbuild IIFE build of react-importing stdin,
  asserts `react_default.createElement` present,
  `require("react")` absent, <1500 bytes). Decision:
  mirror it colocated in neo — reason: one-coverage-home
  discipline (same behavior, same relative path as core
  + alias.test.ts convention), real-esbuild assertion
  is the true regression pin for this crash. esbuild
  identical both trees (`^0.28.1`, resolved 0.28.2) →
  byte-budget assertion ports safely.
- Neo conventions honored: `.ts` import extensions,
  3-line `//` file headers (gate-mandated; core's plugin
  file has none), no-panda (grep clean), name
  `react-stub.ts` mirrors core exactly per orders.

### Edits (5 neo-src files, nothing else)

- NEW `src/lib/microbundle/plugins/react-stub.ts`
  (52 lines): byte-identical stub contents + filter +
  namespace/onLoad behavior; neo header + kept
  behavior JSDoc.
- NEW `src/lib/microbundle/plugins/react-stub.test.ts`
  (31 lines): mirrored regression test (neo header,
  `./react-stub.ts` import).
- `src/lib/microbundle/types.ts:32`: added
  `reactStub?: boolean` (core's doc line).
- `src/lib/microbundle/plugins/index.ts:8,15-16`:
  import + `if (options.reactStub)` FIRST (core order).
- `src/fragments/lib/runner.ts:29,71,123`: the 3
  analogous call sites (`reactStub: true` — :29/:71 in
  microOptions literals, :123 inline `{ reactStub:
  true }`, mirroring core :29/:111/:163).
- Diff: 3 tracked files +9/−1, 2 new files. No
  fixture/matrix/RS/lib/pre-existing-neo-test edits.

### Proofs (scoped, all firsthand)

- New regression test GREEN: `vitest run
  src/lib/microbundle/plugins/react-stub.test.ts` →
  1 passed.
- Adjacent suites GREEN: `vitest run
  src/lib/microbundle src/fragments/lib` → 6 files,
  22 tests, all passed.
- `pnpm agentneo q` over all 5 touched files → 0
  errors, 0 warnings.
- Mechanism proven end-to-end (/tmp scratch, no tree
  writes): `bundleFragments` on a temp fragment
  importing `react` + `@reference-ui/system` →
  5147 bytes, zero `require("react")`, Node ESM
  `import()` of the IIFE succeeds (the exact eval that
  threw `Dynamic require of "react"` before), tokens
  collector collected. Ordered crash GONE.
- NEO-REF 26/26 STILL GREEN (runner change
  regression-proof): per-case `pnpm agentneo run`
  exits all 0, zero FAIL — 01:1, 02:2, 03:18,
  04:1, 05:2, 09:1, 11:1 = 26 PASS. (`agentneo run`
  typechecks first → types green as side-effect.)

### Smoke attempt + SECOND BLOCKER (out of scope — handoff)

- `pnpm sync` in fixtures/extend-library (the correct
  smoke: bootstrap leg + `neo sync`) is RED — but at a
  NEW, later point: esbuild BUILD error `No matching
  export in "react-stub:react-dom/client" for import
  "createRoot"` from
  `packages/reference-lib/.reference-ui/react/
  react.mjs` (reached via the `@reference-ui/react`
  import in DemoComponent.tsx:2). The ordered `Dynamic
  require` eval crash is GONE — this is a distinct,
  second pre-existing port gap.
- Root cause (firsthand): neo's
  `src/fragments/base/bootstrap-import-map.ts` (5 ids)
  lacks core's `@reference-ui/react` → source-entry
  alias (core `src/system/base/fragments/
  bootstrap-import-map.ts:23`, plus 4 styled ids
  :24-27). So neo fragment bundles resolve
  `@reference-ui/react` to lib's BUILT react.mjs,
  which imports `react-dom/client` (`createRoot`) —
  a named export the stub (core-identical, correctly)
  does not provide → build error. Core never trips
  this because the alias redirects to stub-clean
  source (`src/entry/react.ts`: primitives + runtime
  re-exports, no react-dom/client edge).
- Shared-shape proof it blocks all 7: grep shows ALL
  7 chain fixtures' components import
  `@reference-ui/react` (extend ×2, layer ×2,
  meta ×3). Per M-fixtures precedent (one fixture
  demonstrated + shared shape), I ran the smoke on
  extend-library ONLY — no info in 7 identical reds,
  no need for 7 wipes.
- Worse: neo has NO react source entry to point such
  an alias at — `src/author/index.ts` exports
  defineConfig + collector calls ONLY (tokens,
  keyframes, font, globalCss, extendPattern; no `css`,
  no runtime). Choosing the alias target is a DESIGN
  decision (new neo react entry? bundle from
  elsewhere?), firmly outside "wire the plugin at
  call sites" + "Nothing else in neo src". NOT
  implemented — no scope freelancing.
- HANDOFF TO CAPTAIN: the ordered react-stub gap is
  CLOSED (mechanism + wiring + test + 26/26), but the
  7 smokes need a follow-on crew: port core's
  `@reference-ui/react` (+ evaluate the 4 styled ids)
  bootstrap alias to neo's map, incl. deciding/
  building the neo-side alias target. Files:lines
  both sides above. No fixture changes needed for
  either gap.
- Collateral handled (mine, restored): my first run
  used bare `./node_modules/.bin/neo sync` (skipped
  bootstrap → links dangled post-cleanDir →
  `Could not resolve "@reference-ui/react"`;
  procedure error, noted so no one repeats it: the
  smoke is `pnpm sync`, bootstrap leg required).
  Both runs wiped extend-library/.reference-ui
  (cleanDir-before-eval, gitignored). Restored via
  core `ref sync` under a temporary core-id ui.config
  (M-fixtures' procedure) → GREEN in 3.20s
  (M-fixtures' A/B re-confirmed same-tree), neo id
  immediately re-applied. Final verified: ui.config
  1 neo hit, zero core refs (no matches in
  package.json/ui.config.ts/src/index.ts),
  `.reference-ui/system/` carries baseSystem.mjs +
  .d.mts, scope links → own `.reference-ui` (as
  M-fixtures left it), `git status -- fixtures/` =
  exactly M-fixtures' 18 files. Zero tree damage.

## Neo-react-stub BLOCKED-HANDOFF (crew, 2026-09-23)

Ordered gap CLOSED, smokes NOT green — no DONE claim.
Delivered: react-stub plugin ported (behavior-mirrored),
wired at all 3 analogous neo runner sites, 1 colocated
regression test (mirrored from core's, reason logged),
q 0/0, adjacent 22/22, mechanism proven ESM-clean,
NEO-REF 26/26 green. RESIDUAL (1, blocking the smokes):
neo bootstrap-import-map lacks core's
`@reference-ui/react` alias and neo owns no react
source entry to target — needs a captain-scoped
follow-on (design decision, not a wiring step).
Footprint: 5 neo-src files + this log; index untouched,
no commits, scope held.

## M-docs+lib acceptance + conformance dispatch (captain, 2026-09-23)

M-DOCS+LIB ACCEPTED. 6 files, scope verified (lib = 3
files/4 edits, no README; docs = 3 files). Proofs:
docs sync/build/serve green, lib F6 sync green, lib tsc
byte-identical (D-OPEN-4 pair stands, zero new), docs
edits zero-attribution. R-MDL-1 (lib comment word) →
carried to Obj-5 (LOG-5 note). Core `ref sync` failing
for docs (packager-ts TS2305) noted-MOOT: core dies in
Phase 3, fixtures' ref-sync proven green, docs now syncs
via neo — nothing will run core-sync for docs again.
R-MDL-2 RULED: conformance crew, not accepted-red. Captain
read both tsc files firsthand: migration REMOVED core's
7 TS2307s (good); remaining 16 are docs-src-vs-fresh-types
(TS2353 excess props, TS2322 legacy refs — repetitive,
3 files). Red-before/red-after, but the tree got redder
and "zero new" was my bar — a bounded attempt is worth
it. Dispatched docs-conformance micro-crew (docs src
ONLY, tsc green, no behavior/visual/deps/neo changes;
any leg needing typegen or visual change STOPS and files
NO-GO — no rabbit holes). Lockfile regen rides Phase 3 R1.

## M-mcp (crew, 2026-09-23) — WORKING

Scope (strict): packages/reference-mcp/** ONLY. Governing skill
`test-core` loaded first (scoped checks only; no Dagger/matrix).
Orders: VOYAGE.md Obj 2, Phase 0 rows 2-10/24 + F1/F4, captain's
Phase 2 dispatch (Q3 default + F1 gate). Never commit, never touch
the index.

## M-icons acceptance + react-dom-edge dispatch (captain, 2026-09-23)

M-ICONS ACCEPTED. 6 files, scope verified (icons only,
README untouched), build ×3 over junctions, tsc clean
incl ui.config, requiredFiles + baseSystem + published
type chain resolve. Self-clobber caught by own grep and
restored via clean rebuild — discipline noted.
R-MICONS-1 RULED: engine fix attempted, contract change
withheld. Neo's packaged react.mjs static-imports
react-dom/client; core's didn't — icons now fails to
import where react-dom is absent (reproduced, only
missing package). Migration-caused shipped-artifact
regression: must fix before landing ("icon components
render from a real build" is in the done criteria).
Principle: migrations don't regress shipped behavior —
engine fix first, peer-dep contract only if infeasible
(HQ's call then, with evidence). Dispatched neo-src
micro-crew: read the createRoot usage, minimal fix
(defer/split/guarded — crew determines), prove icons
imports WITHOUT react-dom + portal/island green WITH it
+ NEO-REF 26/26 still green + q clean. Infeasible →
NEED-CONTRACT filing, no unilateral peer deps.

## M-docs-prose (crew, 2026-09-23) — WORKING

Scope (strict): PROSE ONLY. Row-25 file list (Phase 0 §B row
25): 15 docs/ files mentioning `@reference-ui/core` + BOOK.md
`ref sync`/referenceVite prose + lib/icons READMEs + exactly ONE
RS file (`packages/reference-rs/modules/styletrace/DIST.md`,
pipeline refs only). Leave historical, untouched: CHANGELOGs,
forensics logs, typegen SPEC.md, virtualrs lib.rs:1 doc comment,
archive/ (frozen). No code, no configs, no behavior. Never
commit, never touch the index. Governing skill `test-core`
loaded first (recon only — no suites run; prose needs none).
Orders read: VOYAGE.md Obj 2, LOG-2 map + row 25, captain's
Phase 0 acceptance + Phase 2 dispatch (M-docs-prose: row-25
sweep incl. ONE RS file DIST.md refs-only, reviewed at
landing).

### Census (firsthand, read-only)

- Row-25 "15 docs/ files" verified exact: 11 live + 4 archive.
  Archive×4 (`CSS_VALUE_PARSE`, `MCP_RESTRUCTURE`,
  `OVERLAY_THEME`, `MCPV2`) LEFT frozen per orders.
- Row-25 paths corrected (stale, resolved firsthand): BOOK.md is
  `docs/BOOK.md` (no root BOOK.md); DIST.md is
  `packages/reference-rs/DIST.md` (no
  `modules/styletrace/DIST.md`; the only DIST.md in RS).
- `packages/reference-rs/DIST.md`: CLEAN, no edit — zero
  `@reference-ui/core`/`reference-core`/`ref sync`/referenceVite
  hits; only `pipeline/src/build/rust/targets.ts` refs, which
  stand (pipeline stays per purity verdict).
- `packages/reference-icons/README.md`: CLEAN, no edit — zero
  core/ref hits in the whole file (33 lines).
- No `@reference-ui/core@x.y` version pins anywhere in scope
  (the "never the number" clause is moot — no numbers exist).
- Neo verified private + scriptless firsthand
  (`packages/reference-neo/package.json`: `"private": true`, no
  `scripts` key): any `install @reference-ui/neo` / `pnpm
  --filter @reference-ui/neo run build` spelling would be
  FALSE. Three sites needed drop/rephrase instead of swap
  (RELEASE public list, STRUCTURE install block + workflow
  step, VARIANTS build step, REFERENCE_UI §24.11 step).
- Nested lib/icons `*.md` with the id: only CHANGELOGs
  (historical-leave) + lib README (swept). No other readmes.

### Sweep policy (minimal CORRECT edit per file)

1. `@reference-ui/core` → `@reference-ui/neo` everywhere in
   scope (proof-gated), EXCEPT where the swap would assert a
   falsehood — then drop/rephrase with no id literal:
   RELEASE L89 (public list; neo is private → line deleted),
   JANK L55-56 (mechanism → "the engine package's"),
   VARIANTS L310 (no neo build script → "the engine package
   build"), REFERENCE_UI L884 (MCP consumer is
   `@reference-ui/mcp`, not neo — M-mcp's package).
2. `ref sync` → `neo sync` everywhere (incl. `--watch`,
   `pnpm exec`); bare-`` `ref` ``-binary → `` `neo` `` where it
   denotes the binary (REFERENCE_UI L15/L25/L86/L90);
   `ref clean` → `neo clean` once (REFERENCE_UI L91, true
   equivalent, same CLI table). `ref mcp`/`ref build` LEFT
   (no Neo equivalent; history under the framing note).
3. referenceVite (no Neo equivalent, Phase 0 row 11 DROP):
   dropped where incidental (BOOK L265/L310/L326/L416/L541),
   glossed `(removed with core)` where definitional (BOOK
   L109/L156/L259 + `shouldDeferHotUpdate` L247/P0-7 moot
   notes). `neo sync` is NOT substituted as the mechanism
   (no HMR integration exists — that swap would be false).
4. `packages/reference-core/…` paths + bare `reference-core`
   prose LEFT (outside the ordered patterns; remapping to Neo
   paths would falsify — those trees differ). They dangle
   after R1: recorded as cutover follow-up, not fixed here.
5. One-line cutover note added to the 4 deep-core docs
   (Architecture, STRUCTURE, REFERENCE_UI, JANK): names swept
   to Neo, paths/mechanism describe the pre-cutover tree. No
   rewrites anywhere.
6. "core-synced" adjectives (evidence pins L39, styletrace
   L402/L406) LEFT — established term, not an ordered pattern;
   coining "neo-synced" would be scope drift.

### Edits (13 files changed, 2 verified-clean)

- docs/Architecture.md: note + `neo sync` ×4 sites (L278
  table, L658 diagram, L787-788 commands) + id→neo (L404,
  pipe alignment preserved).
- docs/STRUCTURE.md: note + install block → retired-note (neo
  private, no install surface) + commands → `neo sync` +
  workflow L354/L357 rephrased.
- docs/REFERENCE_UI.md: note + id ×4 (L15/L390/L797/L821) +
  `ref sync`→`neo sync` ×15 sites + bare-`ref`→`neo` ×4 +
  `ref clean`→`neo clean` + L884 → `@reference-ui/mcp`.
  `ref mcp` ×4 left (no neo verb).
- docs/BOOK.md: `ref sync`→`neo sync` ×8 sites (incl. dev
  script L64/L583, diagrams, feel contract) + referenceVite
  dropped ×5 / glossed-removed ×3 + `shouldDeferHotUpdate`
  gloss + P0-7 moot note + `syncMs` clock label de-Panda'd
  (L332; neo runs no Panda).
- docs/RELEASE.md: deleted `@reference-ui/core` from the
  public-packages list (nothing replaces it — neo private).
- docs/PUBLIC API.md: defineConfig import → `@reference-ui/neo`
  (true: Neo author barrel).
- docs/FEATURES/PORTAL_COLOR_MODE.md: id→neo ×2 (Owner,
  §2.1 header). Core file paths left (dangle, per policy 4).
- docs/FEATURES/VARIANTS.md: L310 → "the engine package
  build" (no neo build script); L317 → `neo sync`.
- docs/bugs/JANK.md: note + L3 → retired-engine framing +
  L55-56 → "the engine package's".
- docs/evidence/styletrace-ready-ask2-pins.md: L39 →
  (`neo sync`, `@reference-ui/neo`); numbers untouched.
- docs/missions/completed/styletrace.md: L402 defineConfig →
  `@reference-ui/neo`.
- docs/perf/waves/wave-4/integrate-intmcp.md: L131 →
  `@reference-ui/neo/*` dist (git-hash anchors keep history).
- packages/reference-lib/README.md: built on → `@reference-ui/neo`
  (true: F6) + `neo sync` comment.
- CLEAN (no edit): packages/reference-icons/README.md,
  packages/reference-rs/DIST.md (the ONE allowed RS file).

### Proofs

- Scope grep-zero: `@reference-ui/core` ×0 and `ref sync` ×0
  across all 15 scoped files (exit 1 both); leak check of the
  15 paths against repo-wide `git grep -l` → empty.
- Intentional residuals in scope: `referenceVite` ×3 (BOOK,
  all `(removed with core)`-glossed) + `shouldDeferHotUpdate`
  ×2 (glossed/moot-noted) + `ref mcp` ×4 (REFERENCE_UI, no
  neo verb, history under framing note).
- Diff reviewed file by file: 13 files, +70/-67, every hunk
  matches the per-file plan above. No code/config/behavior
  touched; index untouched; nothing committed.
- Repo-wide remaining (182 tracked files with the id): all
  outside this scope — sibling Phase-2 scopes (mcp/icons/
  docs+lib/fixtures/runner), Phase-3 matrix/fixtures/R1
  material, historical set (archive×4, CHANGELOGs, forensics,
  typegen SPEC, virtualrs), LOGs, skills infra, lockfile.

### Flags for captain (out of scope, not touched)

- F1: root `README.md` has 2 `@reference-ui/core` hits — NOT
  in row 25, owner unclear (M-docs+lib excludes readmes).
  Needs an owner (R1 or follow-up).
- F2: `matrix/TEST_COVERAGE.md` has 6 id hits — matrix doc,
  assumed Phase 3's with the suite drops.
- F3: `packages/reference-neo/PLAN.md` + `docs/evidence`
  under neo (6 files) mention core — Neo-owned, not row 25.
- F4: `packages/reference-core/` path links + bare
  `reference-core` prose left per policy 4 dangle after R1
  (notably PORTAL L42/L63, VARIANTS §§1-2, JANK locations,
  the three architecture maps). Follow-up: link sweep or
  accept as cutover residue.

## M-DOCS-PROSE DONE (crew, 2026-09-23)

13 files changed (+70/-67, prose only), 2 verified-clean
(icons README, RS DIST.md — the one allowed RS file, refs
checked, no edit needed). Scope grep-zero holds for
`@reference-ui/core` and `ref sync`; residuals are the
documented removed-verb glosses (`referenceVite`/
`shouldDeferHotUpdate` in BOOK, `ref mcp` in REFERENCE_UI).
No tests run (prose; per orders). Index untouched, nothing
committed. Flags F1–F4 above need owners (root README
unowned; TEST_COVERAGE → Phase 3; neo docs → Neo crews;
dangling core paths → follow-up).

## React-stub mechanism acceptance + bootstrap follow-on (captain, 2026-09-23)

MECHANISM ACCEPTED, smokes TRANSFERRED. Ordered gap
closed + proven: plugin ported (behavior-mirrored), wired
at all 3 neo runner sites core-order-first, 1 colocated
regression test, q 0/0, adjacent 22/22, ESM-clean proof,
NEO-REF 26/26 green. Footprint verified exact (5 neo-src
files). The `Dynamic require` crash is GONE — new failure
is a distinct second port gap (esbuild: stub lacks
createRoot because neo resolves @reference-ui/react to
lib's BUILT react.mjs).
SECOND GAP RULED: mirror core (source entry), not built
output. Core aliases to stub-clean SOURCE
(src/entry/react.ts); aliasing to neo's built react.mjs
would invert the architecture AND collide with rdomedge's
work area. Direction: build the neo react source entry
mirroring core's surface exactly (primitives + runtime
re-exports, stub-clean, no additions) + port the
bootstrap alias (+ evaluate each of the 4 styled ids:
port-or-drop with reason). Follow-on dispatched (agent-
neo): entry + alias + styled-ids evaluation + the 7
fixture smokes + 26/26 + q. No fixture changes. Parallel-
safe vs rdomedge (map+entry vs runtime edge — complementary).

## M-docs-prose acceptance (captain, 2026-09-23)

M-DOCS-PROSE ACCEPTED. 13 prose files (+70/−67), 2
verified-clean (icons README, RS DIST.md — captain
confirmed zero core refs in DIST.md firsthand: zero RS
writes in Phase 2). Grep-zero holds for the id + `ref
sync` (only archive/ frozen hits remain — verified).
Sweep policy sound (drop/rephrase where swap would lie;
neo-private respected; no-HMR honesty kept). Flag owners
assigned: F1 root README → Phase 3 sweep; F2
TEST_COVERAGE → Phase 3 (assumption confirmed); F3 neo
PLAN.md + evidence → Phase 3 sweep (cutover grep-zero
needs it); F4 dangling core paths → landing decision
(link sweep if cheap, else accepted residue).

## Docs-conformance (crew, 2026-09-23) — WORKING

Scope (strict): `packages/reference-docs/src/**` ONLY. No configs,
no deps, no builds, no Neo changes, no other packages. Never
commit, never touch the index. Governing skill `test-core`
loaded first (scoped tsc/build/serve only; NO Dagger/matrix).
Orders: VOYAGE.md Obj 2, LOG-2 M-docs+lib section (R-MDL-2,
/tmp/mdocs-tsc-before.txt + /tmp/mdocs-tsc-final.txt), captain's
acceptance (conformance crew, any leg needing typegen or
visual change STOPS and files NO-GO).

### Recon (read-only, firsthand)

- Fresh `tsc --noEmit` in docs reproduces the filed 16 exactly
  (4× TS2353 in css() literals, 9× TS2322 LegacyRef-vs-Ref on
  primitive spreads, 2× marginY excess, 1× paddingX excess).
- TS reports only the FIRST excess prop per literal (verified
  pattern: display hides padding/fontSize/textDecoration in
  navLinkClass; paddingX hides paddingY at mdx:155). Latent
  count behind the 4 css() sites is ~16 props, not 4.
- Type shape (fresh neo output, firsthand):
  `css()` takes narrow `CssStyles = SystemStyleObject`
  (styled/types/index.d.ts: styled = FontProps + color-token
  props + radius-token props ONLY — no display/padding/
  fontSize/flex/fontWeight/textDecoration/...). Primitives
  take the WIDE react `StyleProps` (react.d.mts:8-12 — every
  `StylePropName` → unknown). Primitive `css` prop is wide
  open (`PrimitiveCssProp = Record<string, unknown>`).
  `StylePropName` contains my/mx/px/py + margin/padding +
  display/flex/fontWeight/textDecoration — but NOT
  marginY/marginX/paddingX/paddingY (membership grepped).
- MDX side: `MDXComponents[Key] = Component<
  JSX.IntrinsicElements[Key]>` (@types/mdx types.d.ts) with
  React 18 `LegacyRef` (string-including); neo primitives
  take React 19-style `Ref` (no string). The 9 ref errors
  are this single seam, spread via `{...props}` / `{...rest}`.
- Runtime oracle (docs `.reference-ui/react/styles.css`,
  neo-built): EVERY disputed css() prop COMPILED —
  `d_block`, `text-decoration_none/underline`,
  `text-underline-offset_2px`, `font-weight_600`,
  `flex_1_1_0%`, `min-w_0`, `cursor_pointer`, `rounded_md`,
  `shadow_*`, `hover:c_*` all present. The css() TS2353s
  are a PURE typegen gap (narrow param vs compiling
  runtime). Conversely marginY/paddingX/paddingY compiled
  to NOTHING — no `my_*`/`mx_*`/`px_*`/`py_*` utilities,
  no margin-block/padding-inline rules; Hr's bottom-8r and
  blockquote's top-4r halves are absent from the sheet, and
  no 1r/0.5r padding utilities exist. Docs currently renders
  WITHOUT those spacings (silent core→neo visual delta).
- Engine census (read-only): zero marginY/paddingX/my/mx/px/py
  in authored neo cases, zero in RS atomic src, zero in lib
  src. Engine shorthands = dimensional (margin/padding/inset
  multi-value) + border + flex + corner-pairs only
  (resolve/shorthands/{mod,dimensional,border,flex,pair}.rs).
  Axis shorthands are absent from parse/compile AND typegen.
- Docs src inventory: css( ×4 (the 4 error sites), marginY ×2
  (mdx:119,125), paddingX ×1 + paddingY ×1 (mdx:154-155).
  No other src files error or carry these patterns.

### Leg verdicts (per stop rules)

- Leg A — css() TS2353 ×4 sites: NO-GO. Every excess prop is
  a LIVE sheet rule; dropping/replacing = VISUAL change.
  Needs NEO TYPEGEN change (css() should take the wide
  style object like primitives). Casts would be
  type-suppression, not conformance — refused.
- Leg B — ref TS2322 ×9: GO docs-side. Omit-`ref` props
  annotations: type-only, zero runtime diff, satisfies holds
  by contravariance (ref is optional in MDX props).
- Leg C — axis shorthands (marginY×2, paddingX, paddingY
  latent): NO-GO. Dropped at runtime today + no engine
  support; my/px/py spellings are runtime-unproven AND would
  be a visual change (spacings appear that are missing now).
  Needs NEO parse/compile + typegen + a UX ruling on the
  silent core-era delta. Filed, not fixed.

### Implementation (Leg B only, 1 file)

`src/components/mdxComponents.tsx`: added `MdxProps<T> =
Omit<JSX.IntrinsicElements[T], 'ref'>` + annotated all 11
element renderers (h1/h2/h3/p/ul/ol/li/strong/hr/blockquote/
code). Type annotations erase at compile — zero runtime diff
(diff: 14+/11-, annotation-only, reviewed). `pre` untouched
(no spread, no error). hr/blockquote/code-inline annotated
uniformly though they stay red on Leg A/C props.

### Proofs (scoped only, all firsthand)

- tsc: 16 → 7, ZERO new. All 9 LegacyRef-vs-Ref errors gone;
  `satisfies MDXComponents` holds (contravariance confirmed
  empirically — no new errors). Residual is EXACTLY the
  filed NO-GO legs, enumerated: DocSidebar.tsx(7,3)
  display + (16,3) fontWeight [Leg A]; ThemeToggle.tsx(6,5)
  flex [Leg A]; mdxComponents.tsx(23,3) textDecoration
  [Leg A], (122,68) + (128,7) marginY [Leg C], (157,9)
  paddingX [Leg C, paddingY latent behind it]. Evidence:
  /tmp/mdocs-tsc-conformance.txt (7 errors: 4× TS2353,
  3× TS2322, exit 1).
- vite build (content-collections + vite, sync-independent):
  exit 0, 132 modules, dist emitted. Serve: HTTP 200 +
  `<title>Reference UI Docs</title>` on :5174; server
  killed after, port verified down. No behavior change
  (annotation-only diff).
- FULL `pnpm run build` is RED — attributed, not mine:
  `neo sync` fails at ui.config load (`Cannot find package
  'react-dom'` from icons dist runtime) = R-MICONS-1
  sibling fallout (icons dist rebuilt neo-side after
  M-docs+lib's green run). A/B-PROVEN pre-existing: same
  failure with mdxComponents.tsx reverted to HEAD (working
  tree only, index untouched; file restored after,
  diff-verified). Unfixable in docs-src scope (no deps,
  no configs, no neo changes) — owned by R-MICONS-1.
- NO matrix/Dagger runs (per orders). No commits, index
  untouched, scope held (src/** only, 1 file).

## DOCS-CONF DONE (crew, 2026-09-23)

Leg-exact NO-GO list (tsc exit 1 with ONLY these 7):
Leg A (css() narrow-CssStyles typegen gap, all props live
sheet rules — needs neo typegen widening): DocSidebar
display + fontWeight, ThemeToggle flex, mdx linkClass
textDecoration. Leg C (axis shorthands absent from
engine parse/compile/typegen + dropped at runtime —
needs engine work + UX ruling on the silent delta):
mdx marginY×2, paddingX (+ latent paddingY).
CLOSED: Leg B, all 9 ref errors, via 1-file
annotation-only conformance (mdxComponents.tsx).
Proofs: tsc 16→7 zero-new (/tmp/mdocs-tsc-conformance.txt),
vite build exit 0, serve HTTP 200, diff annotation-only.
Residual outside legs: full-build sync red via R-MICONS-1
(A/B-proven pre-existing, out of scope).

## React-dom-edge (crew, 2026-09-23) — WORKING

Scope (strict): neo react runtime createRoot usage ONLY — the import,
the export, and every use site. No other neo src (react-stub crew owns
microbundle/plugins + fragments runner — untouched), no matrix/fixture/
lib/RS changes, no peer deps. Never commit, never touch the index.
Governing skill `agent-neo` loaded first; VOYAGE.md Obj 2 + LOG-2
R-MICONS-1 + captain's engine-first ruling read.

### Recon (read-only, firsthand) + usage analysis

- Failure REPRODUCED first: `node -e import('./dist/index.mjs')` in
  packages/reference-icons → `Cannot find package 'react-dom'
  imported from .../dist/runtime/reference-ui/react/react.mjs`.
  Packaged react.mjs static imports: `react-dom/client` + `react`
  only. react-dom is nowhere in icons deps (deps: material-symbols
  only; peer: react) — the ONLY missing package, as M-icons filed.
- The generated entry's createRoot is a PURE pass-through re-export:
  generate.ts:31 imports it, :47 re-exports it; NOTHING in the entry
  or runtime calls it internally (zero createRoot hits in
  primitives/runtime, reference/, entry/ — factory.test.ts uses
  react-dom/server directly, unaffected). Core NEVER had it (zero
  createRoot hits in all of reference-core src; core's react.mjs
  imported only react + jsx-runtime per M-icons' pre-rebuild dist).
  Neo's re-export dates to voyage-one with no focused rationale —
  convenience, not contract.
- Use-site census (all in-repo): 37 case-world app.tsx import
  createRoot from '@reference-ui/react' (ref 3, parity 4, prim 15,
  type 7, site 8, sync 1 — PRIM-12 already imports from
  react-dom/client directly) + playground/src/main.tsx:2. NOBODY
  else: lib tests/stories, docs, icons src all import
  react-dom/client directly (the ecosystem norm).
- Why defer/split/guarded all FAIL (logged reasoning for the ruling):
  defer-to-first-use and guarded-load cannot preserve the SYNC
  createRoot() API in an ESM bundle — dynamic import() is async and
  no sync require exists in browser ESM; any lazy wrapper breaks all
  37 worlds + playground with MORE machinery and a WORSE contract
  than core's. Split-subpath needs a second bundle leg + map entry
  AND still rewrites all 37 world imports — strictly more than
  deletion for zero benefit, since no consumer needs the entry to
  PROVIDE createRoot. DELETION restoring core's contract is the
  minimal engine fix — NEED-CONTRACT not needed.
- Migration path is PRE-PROVEN both ends: world builds are
  transpile-only (shared/build.ts — bare specifiers pass through)
  and the harness server injects "react-dom/client" →
  /__neo__/react.mjs (vendor bundle exports createRoot) into EVERY
  world import map at serve time — PRIM-12 passes on exactly this
  path today. Package typecheck resolves react-dom/client via
  @types/react-dom at the neo root (PRIM-12 proves it). Playground
  vite resolves upward to the same copy (no config change needed).

### M-mcp recon (read-only, firsthand)

- Census: 17 src files import `@reference-ui/core/*`
  (reference/join/tokens/paths/config/primitive-usage/build,
  project-manager/workspace-discovery/instructions/entry, 6 test
  files). No other mcp file touches core. `src/index.ts` exports
  server/cli/project-manager/model-state/pipeline-types only —
  `pipeline/tokens` and `pipeline/build` are NOT public API.
- Neo closure traced per file (all firsthand): config
  store/load/errors/evaluate/validate/types, lib/paths barrel,
  constants, S6 api (tasty/api + browser-model → only
  `@reference-ui/rust/tasty`, public), fragments scanner/runner/
  tokens-collector, microbundle (→ `esbuild` + relative only).
  External bare ids in the closure: `esbuild` (new mcp runtime
  dep), `fast-glob` (already a dep), `@reference-ui/rust/*`
  (already a dep, public exports incl. `./tasty`), node
  builtins. Zero other workspace ids.
- `CONFIG_FRAGMENT_SOURCE_PROPERTY` (`__refConfigFragmentSource`)
  and `UPSTREAM_FRAGMENT_SOURCE` (`upstream system fragment`)
  literals are IDENTICAL in core and Neo — vendored flatten
  works unchanged on Neo-collected fragments.
- Neo publishes both `types/tasty/manifest.js` (mcp's manifest
  gate) and `system/evaluated-system.json`.
- `packages/reference-core/src/mcp/` DOES NOT EXIST — the
  instructions.ts core fallback never fires (dead candidate).
- Index-reachability (F4): from `src/index.ts`, value-reachable
  files needing core surfaces are ONLY `pipeline/paths.ts`
  (getOutDirPath), `project-manager.ts` + `workspace-discovery.ts`
  (resolveRefConfigFile + registry). `build.ts` and the whole
  reference/join/tokens/config/primitive-usage subtree are
  reachable ONLY via `child-process/entry.ts` (not exported).

### M-mcp decisions (with evidence)

- **Rows 4-6 VENDORED, not retargeted** (deviation from the row
  table, F4-ordered): TS2307 experiment proves an unresolvable
  id in shipped `src` breaks consumers even with skipLibCheck
  (scratch fakepkg repro: `error TS2307: Cannot find module
  '@nonexistent/pkg'`). The three index-reachable consumers
  would leak the ids into declarations. New `src/neo/paths.ts`
  carries byte-identical `resolveRefConfigFile`/`getOutDirPath`/
  `DEFAULT_OUT_DIR`. F4 allows vendoring explicitly. No drift
  surface (layout constant + file-existence probe).
- **Row 8 VENDOR** (recommended option): `GlobalProjectRegistry`
  copied behavior-preserving to `src/server/project-registry.ts`
  (same file, same shape, same sanitizing read, same
  `setRegistryPathForTesting`). Re-expression refused: lastActive
  ordering + global_registry discovery tier are live,
  matrix-covered behavior.
- **Row 9 DROP**: core fallback never fires (dir absent
  in-tree); mcp-local candidates + fallback constant suffice.
- **Row 2 McpAwareConfig VENDORED** in `pipeline/config.ts`
  (`mcp` selectors + useReference* flags, all optional).
- **Row 10 RE-EXPRESS onto Neo fragment evaluation** (not the
  JSON route): `loadMcpTokens` mirrors core's collect flow
  line-for-line with Neo's scanner/runner/tokens-collector, so
  freshness semantics (in-memory extends, fresh eval) are
  preserved; the JSON route would add stale-config behavior +
  merged `fontWeights` tokens core never emitted. Flatten +
  `_private` boundary vendored unchanged (same literals).
- **Break-vs-shim: BREAK, no shim.** `tokens.ts:1` re-export had
  zero importers outside its colocated test (build.ts imported
  core directly; index never exported it; package exports expose
  only `.` and `./cli`). Same names + signatures kept, so even
  unseen relative importers keep working.
- **F1: alias+paths SUFFICIENT — no NEED-EXPORTS.** 11 virtual
  ids wired identically in tsconfig paths + tsup esbuild-alias
  plugin + new vitest.config alias. No neo exports added.
- **Loader entry-fix (F4 runtime catch)**: Neo's config bundler
  and fragment bootstrap resolve the author entry from
  `import.meta.url`, which breaks once bundled into mcp dist.
  mcp vendors the 2 small functions (`src/neo/config-bundle.ts`,
  `src/neo/config-load.ts`, delegating to Neo's
  evaluate/validate/errors/microbundle) and resolves the entry
  explicitly (`src/neo/author-entry.ts`: shipped
  `dist/neo-author.mjs` sibling first, Neo source fallback for
  dev/vitest). tsup gains the `neo-author` entry (5.6KB,
  bundled from Neo source — tracks Neo automatically).
- `ref sync` user strings → `neo sync` (build.ts,
  project-context.ts, README, tools.md); classifiers match both
  spellings (back-compat, model-state/entry tests keep passing).
- `esbuild ^0.28.1` (neo's version) added as runtime dep; core
  dep removed. Lockfile regen rides Phase 3 R1 (not run here —
  out of scope). Stale `@reference-ui/styled`→core tsconfig
  mapping removed (zero importers).

### M-mcp implementation (24 modified + 4 new paths, mcp only)

- New: `src/neo/paths.ts`, `src/neo/author-entry.ts`,
  `src/neo/config-bundle.ts`, `src/neo/config-load.ts`,
  `src/server/project-registry.ts`,
  `src/pipeline/tokens-load.test.ts`, `vitest.config.ts`.
- Retargeted (neo ids, entry-tree only): reference.ts, join.ts,
  build.ts (getConfig + `./tokens`), entry.ts (store + errors +
  local loader), config.ts (types), primitive-usage.ts
  (McpAwareConfig), tokens.ts (re-expressed).
- Vendored/rewired (declaration-safe): pipeline/paths.ts,
  project-manager.ts, workspace-discovery.ts, instructions.ts
  (fallback dropped), model-state.ts + project-context.ts
  (strings), tsconfig (11 paths + allowImportingTsExtensions,
  rootDir dropped for cross-root imports under noEmit),
  tsup.config (alias plugin + neo-author entry), package.json,
  README/tools.md prose.
- Tests updated: reference/join/queries/build/project-manager/
  workspace-discovery (ids, mocks, messages). tokens.test.ts
  UNCHANGED (re-proof as-is).

### M-mcp proofs (scoped only, all firsthand)

- `pnpm --filter @reference-ui/mcp run typecheck` → CLEAN.
- `vitest run` → 16 files, 89/89 green (incl. 4 `_private`
  flatten re-proofs unchanged + 2 new Neo-evaluation
  integration tests: upstream strip + local keep through real
  scan→bundle→eval→flatten).
- `tsup build` → green, 4 entries incl. `dist/neo-author.mjs`.
- Dist import scan: ZERO bare `@reference-ui/neo*` /
  `@reference-ui/core*` imports (only occurrence is the
  `defineConfig` usage-hint string in the bundled error
  message); externals exactly `esbuild`, `fast-glob`,
  `@reference-ui/rust/atlas`, `@reference-ui/rust/tasty`.
- Declaration-leak check: typecheck with paths wiped fails ONLY
  in entry-tree files (entry, neo/*, build, config, join,
  reference, tokens) — every `types`-reachable file resolves
  with NO neo wiring. Shipped declarations clean (F4).
- Dist smoke (self-owned /tmp/mcp-smoke fixture, real `neo
  sync`, staged tasty dir): `dist/mcp-child.mjs build` →
  `ok:true`, model.json tokens exactly
  `[colors._private.localSecret, colors.localPublic,
  colors.upstreamPublic]` (upstream secret absent) — the full
  row-10 boundary through the shipped layout, incl. the
  `dist/neo-author.mjs` candidate + bundled S6
  `createReferenceUiTastyApi` against the real manifest.
  (Needed a temporary esbuild symlink simulating post-install
  state — removed after; lockfile regen is R1's.)
- `pnpm pack` layout: tarball carries `dist/neo-author.mjs`,
  `bin/mcp.mjs`, dist, src. No Dagger/matrix runs per orders.
- Scope: `git status` mcp footprint == inventory above; index
  untouched; nothing committed. (Non-mcp modifications in tree
  belong to sibling crews.)

## M-MCP DONE (crew, 2026-09-23)

Files changed: 24 modified + `src/neo/` (4), `project-registry.ts`,
`tokens-load.test.ts`, `vitest.config.ts` (all under
packages/reference-mcp). Proofs: tsc clean, 89/89 unit green
(incl. `_private` re-proof + Neo-eval integration), tsup green,
dist import scan clean, declaration-leak check clean, packed
layout ships neo-author, /tmp dist E2E proves the token boundary
through the shipped layout. Break-vs-shim: BREAK, no shim
(zero external importers; same names/signatures). NEED-EXPORTS:
none (alias+paths sufficient). Residuals: (1) lockfile regen for
the esbuild-add/core-drop rides Phase 3 R1 — shipped installs
need it; local dist smoke used a temporary symlink, since
removed. (2) Rows 4-6 vendored, not retargeted (F4-ordered,
TS2307-proven — see decisions). (3) Component-discovery leg of
the smoke stayed at 0 components (atlas needs real component
patterns; that engine is untouched) — S6 runtime proven via
createReferenceApi against the real manifest.

## M-mcp acceptance (captain, 2026-09-23)

M-MCP ACCEPTED (deepest migration). 24 modified + 4 new,
all inside reference-mcp (its README/tools.md edits are
its own package docs — no overlap with the prose crew's
row-25 scope). Proofs: tsc clean, 89/89 unit (incl
_private re-proof + Neo-eval integration), tsup green,
dist import scan clean, declaration-leak clean, packed
layout ships neo-author, /tmp dist E2E proves the token
boundary through the shipped layout. F1 gate HELD:
NEED-EXPORTS none, alias+paths sufficient, zero neo
exports added (Q3 default vindicated). Break-vs-shim:
BREAK justified (zero external importers, same
names/signatures). Rows 4-6 vendored-not-retargeted
accepted (F4 shipped-crowbar + TS2307 proof; leak checks
green). Residuals carried: (1) lockfile regen rides R1
(shipped installs need it); (2) discovery leg 0-component
in the /tmp smoke (minimal fixture) — backstopped by the
kept ×19 mcp suite at the landing hermetic proof, which
exercises discovery against real fixtures.

## Docsconf acceptance + Leg C engine discovery (captain, 2026-09-23)

DOCS-CONF ACCEPTED. Verified firsthand: 1-file diff is
annotation-only (MdxProps alias + 11 renderer
annotations); the proof-file 7 are leg-exact (Leg A:
display/fontWeight/flex/textDecoration css() excess-prop
errors, all live rules; Leg C: marginY×2 + paddingX
shorthand errors; zero ref errors remain = Leg B closed,
zero-new). Landing posture: baseline 16 → 7 is a strict
improvement; the 7 land as FILED engine gaps (docsconformance
over accepted-red: every remaining error is named, not
waved). LEG C DISCOVERY (flagged to HQ): axis shorthands
are absent from engine parse/compile/typegen AND dropped
silently at runtime — a genuine reference-rs gap needing
engine work plus a UX ruling on the silent delta. Parked
as a VOYAGE follow-up (outside Objectives 3-5 scope).

## M-runner (crew, 2026-09-23) — WORKING

Scope (strict): `pipeline/**` + KEPT-SUITE matrix files ONLY
(chain-t2/chain-t8/mcp package.json + vite.config.ts +
tsconfig.json + ui.config.ts + matrix.json). No dropped-suite
files, no Neo src, no RS, no lib. Never commit, never touch
the index. Governing skill `test-core` loaded first (scoped
checks only; NO Dagger/matrix runs — hermetic proof is the
landing gate). Orders read: VOYAGE.md Obj 2, LOG-2 Phase 0
rows 1/11/12/13/14/18/19/21/24 + F1 + install-dim Phase-3
instructions + R4/H5, captain's Phase 2 dispatch. M-mcp's
filed scope (reference-mcp package ONLY) confirms no overlap
on matrix/mcp suite files. No installs run (lockfile is R1's).

### Recon (read-only, firsthand)

- Install-dim claims VERIFIED firsthand across all 29
  matrix.json files (install-dim said 30 — count nit, no
  substance impact): `runTypecheck: true` in EXACTLY distro,
  reference, typescript (all DROP-class) → typecheck phase
  orphaned, deletion ordered. `watch-full` sole consumer =
  matrix/watch → mode + complete-gate deletion ordered.
- Neo seam re-verified (not trusted from Phase 0): bin verbs
  + `[neo] sync/resync/watching` stdout (bin/neo.ts:20-31/
  :86-111), links-last publish order (sync/index.ts:200-226
  + publish/links.ts:8,25), SYNC-11 atomicity (failure wipes
  outDir), defineConfig strictness (config/types.ts:98, no
  `layers`/`mcp`/`strict` in ReferenceUIConfig), author
  barrel path (src/author/index.ts:5), neo no-build-script
  (package.json has NO scripts field → registry build step
  skips it via the build-script filter), `neo` NOT in
  RELEASE (private, unpublished — never added).
- Kept matrix.json files need NO changes (T2/T8 watch-ready,
  mcp full, all vite7-only, no runTypecheck keys) —
  verified, not churned. Row 21 (`strict`): distro-only,
  distro fully RELEASED → no action. T8 policy CONTENT
  untouched (import line only) per H4.
- plan.test.ts live-tree tests were RED AT HEAD: no suite
  named `lib` exists (name census over all 29 matrix.json
  files) and no suite declares react17 (all single react19)
  → both retargeted to real kept-gate suites, intent kept.
- setup-metrics.ts: ZERO consumers repo-wide (definition +
  own test only) — pre-existing dead code parsing `ref →`
  output. Left untouched (not in ordered work); noted for
  Phase 3 cleanup, not this crew.

### Mode-name decisions (my call per row 19)

- Modes: KEEP `full` + `watch-ready`, DELETE `watch-full`
  only. No renames: renaming the contract key/value across
  26 files Phase 3 deletes is pure churn; kept gate keeps
  stable names into the landing runs.
- `refSync` matrix.json key, `ref-sync.ts` / `ref-sync-support/`
  file names, `[matrix ref sync]` markers, `REF_SYNC` env
  namespace: ALL KEPT. They read as "reference sync", name
  no dead binary, and renaming churns the staged-path +
  parse contract for zero behavior gain.
- `waitFor` dimension (`ready`|`complete`): DELETED whole
  (strategy field, env var, wait-ready branch, 120s/30s
  bifurcation → single 30s). `runTypecheck`: DELETED whole
  (config field, parse, strategy, runner phase, abort
  labels). Stale keys in dropped suites' matrix.json files
  are silently ignored — zero dropped-file edits needed.
- Webpack5 template: plugin lines DROPPED per rows 11-12,
  template + strategy code KEPT (R4/H5 default: axes retire
  with the suites in Phase 3; no HQ override came).
  Webpack template export simplified async→sync (no await
  left; webpack accepts plain-object configs).
- Discovery hardening (required by the deletion, in-scope):
  filtered discovery now pre-screens by declared name, so
  the still-present retired watch suite cannot break
  TARGETED runs/cli/tests during the Phase-2 window.
  Unfiltered discovery still throws the clear retired-mode
  error until Phase 3 deletes the suite. Without this,
  even `--packages=@matrix/chain-t2` throws pre-Phase-3.

### wait-ready re-expression (row 13, design)

Neo emits no sentinel. Readiness = the artifacts T2/T8
tests consume: `<outDir>/system/system.mjs` (folder-publish
proof) + `node_modules/@reference-ui/react` (links-leg
proof — links land LAST after a complete publish;
existsSync follows junctions so dangling reads missing).
Dagger consumers are fresh per run → no stale-artifact
risk; no stdout/log scraping (files prove more than log
lines). Env: SESSION_PATH→OUT_DIR override, WAIT_FOR gone,
TIMEOUT/POLL names kept (single 30s default). No fail-fast
branch (baseline failure exits the watch process → the
session runner's exit race already reports it). Full proof
rides the landing hermetic runs; fixture probe below is
the lightest honest check.

### Edits (40 files, scope-held)

- pipeline/config.ts: REGISTRY core→neo swap (packed host);
  RELEASE core removed (nothing ships on core; neo never
  added — private).
- discovery/index.ts (+README +test): mode union 2,
  runTypecheck gone, filtered pre-screen, retired-mode
  rejection test added.
- runner/ref-sync.ts (+test): strategy = {mode} only;
  waitFor env export gone; watch-full test deleted.
- runner/package-runner.ts: `neo sync` setup cmd, typecheck
  phase + cmd deleted, watch branches collapsed, waitFor
  passthrough gone, neo-worded messages, neoVersion keys.
- runner/run.ts + types.ts: manifest gate → neo + error
  text; coreVersion→neoVersion.
- node-modules/cache.ts (+test): override key + option
  retargeted; fixtures renamed (incl. hash-slice fix:
  neohash→`neohash1` expectation).
- runner/consumer.test.ts: fixture/expectation renames.
- managed/package-json/index.ts (+test): managed dep neo,
  default sync script `neo sync`; tarball-spec literals.
- vite7/webpack5 liquid templates (+bundlers test +
  template READMEs): plugin lines dropped.
- managed/tsconfig comment, matrix README, setup label
  (+setup test fixture): `neo sync` wording.
- runner/plan.test.ts + reporting.test.ts: runTypecheck
  fixtures out; 2 drifted live-tree tests retargeted to
  the kept gate (lib/react17 never existed in tree).
- release/publish.test.ts: core→false pin added (lib→true),
  sort expectation = filter-drops-core order (algorithm
  untouched; Kahn's + lex tie-break verified firsthand).
- dev/materialize.ts: bin rewrite ref→neo (fn + regex +
  2 comments).
- ref-sync-support/run-watch-session.mjs: `neo sync
  --watch` cmd, dead waitFor const removed, messages.
- ref-sync-support/wait-ready.mjs: REWRITTEN (above).
- Kept suites T2/T8/mcp: package.json dep+sync swaps,
  vite.config plugin drops (byte-parity with fresh
  template renders, proven), ui.config id swaps (T8
  policy + mcp `mcp:` block untouched), T2/T8 tsconfig
  F1 paths entries (mcp needs none — ui.config
  unincluded). matrix.json files verified, unchanged.
- `git diff --stat -- pipeline/ matrix/`: 40 files,
  scope-held; zero dropped-suite/Neo/RS/lib touches.

### M-runner proofs (scoped only, all firsthand, NO Dagger)

- `node --check` on both staged .mjs helpers: OK.
- All 9 kept JSON files parse (3 package.json + 2
  tsconfig + mcp tsconfig + 3 matrix.json).
- Kept vite.configs byte-identical to fresh template
  renders (tsx render + cmp, 3/3 PARITY-OK).
- Pipeline unit suite (`pnpm --dir pipeline exec tsx
  --test`, node:test — NOT Vitest/Playwright, so raw
  subshell is compliant; `pnpm agent run` misroutes
  `test:*` into the matrix CLI): 177/178. The 1 fail
  (`build/rust` native-API-contract) is PRE-EXISTING and
  out of scope — both files byte-identical to HEAD
  (`git status` empty for pipeline/src/build/), pure
  function over a hardcoded Buffer, node-builtins-only
  imports; RS contract drifted past the test's list.
- Pipeline typecheck: 6 errors, ALL in RS
  native-contract.ts (TS2835, untouched frozen tree) —
  ZERO errors in any of the 40 touched files.
- wait-ready fixture probe (/tmp/wait-ready-probe.mjs,
  kept out of the repo per scratch rules): 6/6 legs
  green — ready-exit, timeout message naming both
  missing paths, folder-only waits, link-only waits,
  OUT_DIR override, mid-wait publish detected.
- T2/T8 `tsc --noEmit` (informational — nothing runs it
  post-deletion): NO TS2307 on `@reference-ui/neo` →
  F1 paths entries resolve. Residuals documented below.
- Residual greps over scope: zero live `@reference-ui/
  core`, `exec ref`, `watch-full` (except the intentional
  retired-mode rejection test), `runTypecheck` (except
  dropped suites' ignored keys), `referenceVite/Webpack`
  (except intentional release-contract pins + inert
  fixture names in release/registry/build/materialize
  tests — behavior-neutral, left). `[matrix ref sync]`
  markers + module names kept per the no-rename decision.
- Index untouched (`git diff --cached` empty); no
  commits; no installs; no matrix/Dagger runs.

### M-runner residuals (for captain/Phase 3)

- R-MR-1: T2/T8 ui.config `layers:` is a TS2353 excess
  prop under Neo's strict ReferenceUIConfig (firsthand
  tsc), + TS5097 `.ts`-extension noise through the neo
  source barrel (no allowImportingTsExtensions in kept
  tsconfigs). Blocks NOTHING (runner typecheck phase
  deleted; ui.config runtime bundles by absolute path).
  Durable fix = D17 `layers` surface + neo exports
  entries (NEED-EXPORTS-class follow-up, nobody's
  Phase-2 scope). Runtime path is what matters and it
  is coherent.
- R-MR-2: unfiltered discovery/planning throws the
  retired-mode error on matrix/watch until Phase 3
  deletes the suite (filtered runs + tests are green
  via the pre-screen). No action — resolves itself.
- R-MR-3: pipeline typecheck red (RS native-contract
  TS2835 ×6) + 1 rust-compat unit fail — both
  pre-existing, both outside this scope (RS frozen).
- R-MR-4: setup-metrics.ts dead (zero consumers) —
  Phase 3 cleanup candidate, not this crew.
- R-MR-5 (not mine, read-back): M-fixtures' react-stub
  blocker + neo-react-stub fix crew — kept T2/T8 need
  fixture baseSystems; landing hermetic runs wait on it.

## M-RUNNER DONE (crew, 2026-09-23)

M-RUNNER DONE. 40 files changed (27 pipeline + 13 matrix
kept-suite... precisely: 29 pipeline + 11 matrix — see
stat), proofs: node --check OK, kept JSON parse OK,
template byte-parity 3/3, pipeline units 177/178 (1
pre-existing RS-contract fail, out of scope), pipeline
tsc zero-errors-in-scope (6 pre-existing RS errors),
wait-ready fixture probe 6/6, residual greps clean.
Mode-name decisions: keep `full`/`watch-ready` +
`refSync` key + module/marker names; delete `watch-full`
+ `waitFor` + `runTypecheck` whole; webpack template
kept minus plugin lines (R4/H5 default); filtered
discovery pre-screen added (interim necessity). T8
policy content untouched; `strict` no-action (distro
released); matrix.json files verified-unchanged. No
commits, index untouched, scope held, no Dagger.
Residuals R-MR-1..5 above (all owned elsewhere or
self-resolving in Phase 3).

## Axis-shorthands crew dispatched (captain, 2026-09-23)

HQ-directed: dedicated crew, axis shorthands ONLY
(marginX/marginY/paddingX/paddingY). Scope: rs
parse/compile/typegen + canon language update + neo
runtime application (no silent drop) + cargo and vitest
unit tests. Acceptance oracle: docs tsc shows ONLY the 4
Leg A errors. Out of scope: Leg A narrowing,
loud-on-unknown-props (filed as follow-up, not decided),
all other families. Collision rule vs sibling neo crews
(STOP + NEED-SPLIT on shared files). Rides the Objective
2 landing commit uncommitted.

### Implementation (createRoot removal + use-site migration)

Fix: DELETED the createRoot pass-through re-export (value + types),
restoring core's contract — the generated entry is react-only again.
Every in-repo consumer migrates to direct `react-dom/client` import
(the PRIM-12/lib precedent, pre-proven in the harness). No peer deps,
no contract change, no defer/split machinery (all rejected with
reasoning above — sync API cannot lazy-load in ESM).

Src (5 files): generate.ts (drop import + value/type re-exports, why-
comment on the entry doc), react-surface.d.ts (drop L333),
generate.test.ts (3 pins flipped to `not.toMatch(/react-dom|
createRoot/)` — single-line form keeps the describe under the warn
line), sync/react.ts (`external: ['react']` + header), sync/
reference-types.ts (drop the 2 react-dom externals + comment: entry
is react-only so nothing leaks through the alias).
Spec (1): PRIM-12 foreign.spec.ts L23 flipped to assert ABSENCE
(`!bundle.includes('react-dom')`) — the regression pin for R-MICONS-1.
Worlds (37 app.tsx, incl. untracked P3 PRIM-13/14/15): createRoot
moved to `import { createRoot } from 'react-dom/client'` in PRIM-12
position; 7 TYPE headers reworded one word ("Primitives import…").
Parity multiline imports preserved (first script revision collapsed
them — caught in diff review, redone as 2-line diffs each).
Playground (1): main.tsx import moved + stale comment fixed (vite
resolves upward; verified `import('react-dom/client')` resolves ok
from playground/; package typecheck covers the file, 0 diagnostics).
Left alone deliberately: microbundle externals + react-stub
(sibling crew's fragments-eval usage, different machinery),
factory.test.ts react-dom/server (direct consumer import, correct),
temp-consumer `react-dom/client` paths maps in PRIM-10/TYPE-01/
PARITY-01 specs (harmless unused shims; removing would churn specs
outside the proof set for zero behavior delta), evidence/
styletrace-baseline (read-only freeze).

### Proofs (all firsthand, scoped runs only)

1. Icons failure → fixed (same command, same env): BEFORE —
`import('./dist/index.mjs')` → `Cannot find package 'react-dom'
imported from .../dist/runtime/reference-ui/react/react.mjs` (exit 1,
M-icons' exact repro). AFTER rebuild — packaged react.mjs imports
ONLY `react`, zero react-dom in value or .d.mts → `IMPORT OK: 3857
exports` (exit 0).
2. Portal/island WITH react-dom green: NEO-PRIM-12 PASS (flipped pin:
no react-dom edge + foreign root paints), NEO-PRIM-14 PASS portal,
NEO-PRIM-05 PASS layer (2nd multi-root world), NEO-PARITY-01 PASS
×4 (incl. types.spec temp-consumer) + 02/03/04 PASS (all portalHost
worlds), NEO-COND-18 PASS siblings. Every multi-root world in the
tree is green on direct react-dom import.
3. NEO-REF 26/26 STILL green: `agentneo run NEO-REF` → 26 PASS / 0
FAIL (01:1, 02:2, 03:18, 04:1, 05:2, 09:1, 11:1); status `ref: 7
pass, 0 fail`. Obj-1's landing unregressed.
4. Gate: `agentneo q` 0 errors 0 warnings on all 5 src files + the
flipped spec; unit `vitest run generate.test.ts` 10/10; package
typecheck 0 diagnostics on every agentneo run (all 37 worlds
typecheck). 28/37 worlds gate-clean; the other 10 world errors (9×
header-not-first in old prim/type worlds, 1× PRIM-09 census `Map`
shadow) + 3 playground errors (missing header, Shell cyclomatic 15
/ 242 lines) are PRE-EXISTING — proven firsthand by gating HEAD
copies (same errors + the TS2305 my migration resolves). Zero NEW
gate errors introduced; Map/header-placement fixes refused as
out-of-scope (Map rename risks census semantics; Shell split
violates skill §8 no-restructure).
5. Icons build exit 0 (twice, quiet rerun for the record):
generate 3857 + neo sync + rollup `created dist in 2.3s` + tsc +
materialize + requiredFiles, over the fixed generator.
Insurance (all green): PRIM-10 surface census, PRIM-13/15, TYPE-01/
02, PRIM-01, SITE-10, SYNC-15 — every touched group has a green run.
types.mjs carries zero react-dom (externals removal leaks nothing).
No-panda: zero hits in the diff. Index untouched, nothing committed.

## RDOM DONE (crew, 2026-09-23)

R-MICONS-1 fixed in the engine: the generated react entry no longer
re-exports createRoot (react-only, core contract restored) and all 37
in-repo world consumers + the playground shell import createRoot from
their own react-dom. Files: 5 neo src + 1 spec + 37 worlds + 1
playground + this log (list above). Proofs: icons dist imports clean
(3857 exports, was `Cannot find package 'react-dom'`), portal/island
cases green with react-dom (PRIM-12/14/05, PARITY-01–04, COND-18),
NEO-REF 26/26 still green, q 0-new-errors (10 world + 3 playground
pre-existing, HEAD-proven), icons build exit 0. No peer deps added,
no contract change. Residual: none functional — the 13 pre-existing
gate errors are HEAD-identical world/playground shape issues for
their owners, not this fix.

## RDOM acceptance — R-MICONS-1 CLOSED (captain, 2026-09-23)

RDOM ACCEPTED. Verified firsthand: icons dist imports
clean (3857 exports, my own node run — was `Cannot find
package 'react-dom'`), zero react-dom edges in icons
dist, footprint clean (pipeline/* = live M-runner scope
per row 19; pnpm-lock rewrite = M-docs+lib's mechanical
install relink, R1 regens anyway). Crew proofs hold:
portal/island cases green, NEO-REF 26/26, q 0-new-errors
(13 pre-existing HEAD-proven), icons build exit 0. No
peer deps, no contract change — core's react contract
restored by deletion. R-MICONS-1 is CLOSED; the icons
gate is unblocked.

## Bootstrap-alias (crew, 2026-09-23) — WORKING

Scope (strict): new neo react source entry file(s) +
`src/fragments/base/bootstrap-import-map.ts` (alias +
per-styled-id evaluation) + ONE regression test. No other
neo src, no fixture edits (smokes only), no matrix/RS/lib.
Never commit, never touch the index. Governing skill
`agent-neo` loaded first; VOYAGE.md Obj 2 + LOG-2
react-stub smoke-attempt + captain's mirror-core ruling
read. Rdomedge crew's runtime edge untouched.

### Recon (read-only, firsthand)

- Core entry `packages/reference-core/src/entry/react.ts`
  (8 lines): `export * from '../system/primitives'` (:5),
  `export { css, cva as recipe } from '../system/runtime'`
  (:6), `export type * from '../types'` (:8, type-only).
- Core primitives barrel
  (`system/primitives/index.tsx`): 101 `export const`
  components + `useColorMode, LayerScopeContext,
  ColorModeContext, DocumentContext` (:17) + `TAGS as
  HTML_TAGS, type Tag as HtmlTag` (:18) + types (:19).
  Imports `box` from `@reference-ui/styled/patterns/box`
  (:5) — the reason core's map carries styled ids.
- Core map (`system/base/fragments/
  bootstrap-import-map.ts:19-28`): 8 ids — system×3,
  `@reference-ui/react` → `src/entry/react.ts` (:23),
  4 styled ids (:24-27). Core scan needles do NOT
  include react/styled (base/fragments/index.ts:45-49)
  — files are discovered via system ids; the react
  import rides along. No needle change needed.
- Neo gap confirmed: `src/fragments/base/
  bootstrap-import-map.ts` 5 ids, no react; neo
  `src/author/index.ts` = defineConfig + collectors
  only (no css/runtime) — no alias target existed.
- Neo TAGS ≡ core TAGS (diff: header + export keyword
  only); `toJsxName` over neo TAGS = core's 101 names
  byte-identical incl. Obj/Var specials (diff-verified).
- Neo runtime `css(...styles:
  Array<CssStyles|CssStyles[]>)` (runtime/css/css.ts:213)
  matches factory `CssFn` EXACTLY; no `cva` anywhere in
  neo src — `recipe` is the name, same as core's
  exported name. Import-safe (module lets/consts only;
  css() throws only when CALLED unregistered — never
  called at eval, same posture as core).
- Entry-graph bare-id audit: only `@reference-ui/rust/*`
  (type-only except namer, which the publish leg bundles
  every sync) + stubbed `react`. Zero
  system/react/styled self-edges; `react-dom/client`
  NOWHERE in the graph (rdomedge's area untouched).
- Fixture imports (all 7): `css` and/or `Div, Span`
  from `@reference-ui/react`; styled ids appear ONLY in
  tsconfig paths (type resolution), zero src imports.
- `src/entry/` holds the `@reference-ui/types` source
  entry (types.tsx) — `src/entry/react.ts` fits the dir
  AND mirrors core's path exactly. DOMAIN.md has no
  conflicting entry naming. No bare `primitives`
  imports exist → new barrel changes no resolution.

### Surface mirror (line-by-line vs core react.ts)

- Core :5 `export * from '../system/primitives'` →
  `export * from '../primitives/index.ts'`: 101
  factory-built components (names diff-identical, same
  order) + the 4 shared context names + `TAGS as
  HTML_TAGS, type Tag as HtmlTag`. Runtime count 108
  (101+4+1+css+recipe), verified at runtime.
- Core :6 `export { css, cva as recipe }` → `export {
  css, recipe } from '../runtime/index.ts'`: exported
  names identical; neo's internal name is `recipe`
  (no `cva` exists — nothing to alias).
- Core :8 `export type * from '../types'` → DROPPED,
  justified: (1) type-only, erased by esbuild before
  eval — zero runtime effect; (2) no consumer
  typechecks against the bootstrap entry (fixture
  tsconfigs point at `.reference-ui` artifacts; the map
  feeds esbuild only); (3) neo has no design-system
  source types module — types ship per-system generated
  (react.d.mts) + typegen. Fabricating aliases would be
  worse. Same erasure reason drops core primitives'
  `PrimitiveElement/Props/<Name>Props` types (no neo
  source equivalents; per-system generated).
- `Map` keeps its core export name through a local
  alias (`MapPrimitive as Map`): a binding named Map
  shadows the global, which the gate forbids. Observed
  surface identical; verified `Map.displayName` at
  runtime.
- Eval-only honesty (logged, not hidden): the shared
  splitter carries `[]` compiled names and layerName is
  `''` — fragment evaluation imports these components
  but never renders them (no ReactDOM at eval), so
  resolution never runs. Core's equivalent (real
  box()/css() wiring, also never rendered at eval) has
  the same posture.
- Deliberately NOT carried: `Fragment, createElement,
  createRoot` (neo GENERATED entry re-exports these,
  but core's SOURCE entry does not — the ruling says
  mirror the source; createRoot is the avoided edge).

### Styled ids verdict (all 4 DROP, per-id reasons)

Interaction with the pre-existing `@reference-ui/system`
alias first: neo's system id → author entry covers
collector calls (tokens() etc.) exactly like core's
system id → system entry; NEITHER entry re-exports
styled, so the system alias neither covers nor conflicts
with the styled question in either tree. The verdict
rests solely on importer absence + D4:

- `@reference-ui/styled/css` (css/cx/cva/sva): DROP —
  no fragment file imports it (grep-verified, only
  tsconfig paths); fragments get css/recipe via the new
  react alias; neo has no styled runtime source (D4
  data-only — porting would invent a second Atomic).
- `@reference-ui/styled/css/cva`: DROP — subpath of the
  above; same three reasons.
- `@reference-ui/styled/jsx` (Box/Flex/Stack JSX
  patterns): DROP — core's own primitives don't import
  it; no fragment imports it; no neo source.
- `@reference-ui/styled/patterns/box`: DROP — core's
  primitives import it, but neo's factory primitives
  resolve through css() with no box edge, so the single
  importer doesn't exist in neo; no fragment imports
  it either. This is the load-bearing DROP: the alias
  exists in core ONLY for its primitives' box edge.
- Pinned: the regression test asserts all 4 absent, so
  a future port is a conscious change, not drift.

### Edits (3 new + 1 ordered + 1 entailed pin)

- NEW `src/entry/react.ts` (14 lines): the react source
  entry — 2 re-export lines mirroring core + header +
  the type-line drop note.
- NEW `src/primitives/index.ts` (122 lines): the
  primitives barrel — contexts + HTML_TAGS/HtmlTag +
  101 factory components (lines generated
  deterministically from TAGS via node one-liner, names
  diff-identical to core).
- EDIT `src/fragments/base/bootstrap-import-map.ts`
  (+11/−5): `@reference-ui/react` → entry/react.ts +
  the styled-DROP note in the doc comment.
- NEW `src/fragments/base/bootstrap-import-map.test.ts`
  (the ONE regression test, 4 its): alias → existing
  react.ts; 4 styled ids absent; production-path
  `bundleFragments` of a css+Div+Span probe builds
  with `"Div"` present, no `require("react")`, no
  `react-dom/client`; bundle dynamic-imported in Node
  ESM with css/Div/Span functions + displayNames via a
  cleaned-up globalThis probe.
- ENTAILED (beyond the named files, logged, not
  hidden): `src/fragments/base/index.test.ts` pinned
  the map with exact `toEqual` on 5 ids — the ORDERED
  alias invalidates it. Updated to the new ordered
  shape (6 ids, exact toEqual kept, zero weakening) +
  test renamed author-entry→source-entries. Leaving it
  red would violate the ordered adjacent-green proof;
  reverting the alias would violate the ruling. No
  other test touched.

### Proofs (scoped, all firsthand)

- New test GREEN 4/4 first run; negative control
  (/tmp scratch): same probe WITHOUT the alias fails
  `Could not resolve "@reference-ui/react"`, WITH it
  builds 87599 bytes — the pin is load-bearing.
- `tsc --noEmit` package-clean (exit 0).
- `agentneo q` over all 5 touched files → 0 errors,
  0 warnings (first run flagged `Map` shadowing —
  fixed via the export alias above, no suppression).
- Adjacent suites GREEN: `vitest run src/fragments
  src/lib/microbundle src/primitives src/runtime` →
  31 files / 215 tests passed; `vitest run src/sync`
  → 3 files / 36 passed. No-panda clean on new files.
- Entry surface at runtime: 108 exports, all 10 spot
  names present (Map/Div/Span/css/recipe/contexts/
  HTML_TAGS=101).
- NEO-REF 26/26 STILL GREEN: per-case runs all exit 0
  (01:1, 02:2, 03:18, 04:1, 05:2, 09:1, 11:1).
- Smokes 4/7 GREEN (`pnpm sync` = bootstrap leg + `neo
  sync`): extend-library 125ms, extend-library-2 135ms,
  layer-library 135ms, layer-library-2 149ms.
  `./baseSystem` resolves to sync output (not dist),
  so leaves-first ordering suffices; leaves exercise
  BOTH react import shapes (css + Div/Span) while
  metas' components import css only — the alias is
  fully proven by leaves.

### Smoke attempt + THIRD BLOCKER (out of scope — handoff)

- The 3 metas (`meta-extend-library`,
  `meta-extend-library-2`, `meta-extend-library-sibling`)
  are RED at config load, BEFORE fragment work:
  `Config field 'extends' is invalid. Entry 0 must
  include synced system data (fragment, css, or
  jsxElements). Run sync on the upstream package
  first.` Upstreams WERE freshly synced (above) — the
  failure is a producer/consumer shape drift, not
  ordering.
- Root cause (firsthand): neo's publisher emits
  `fragments: PortableFragment[]` (PLURAL array of
  {source,code} + cssChunks + runtime —
  `src/sync/publish/system.ts:60`, top-level keys
  verified: schemaVersion/name/fragments/cssChunks/
  runtime/jsxElements), but THREE consumers agree on
  the singular shape: the validator
  (`src/config/validate.ts:147` requires non-empty
  `fragment`|`css`|non-empty-`jsxElements` — here
  `fragment`/`css` undefined, `jsxElements` []),
  the type (`src/config/types.ts:9-18` — `fragment:
  string` required), and the extends reader
  (`src/fragments/base/index.ts:91,102` — maps
  `system.fragment`, drops undefined). Even if
  validation passed, upstream fragments would be
  SILENTLY DROPPED. NEO-CHAIN cases never tripped it
  (hand-built `{name,fragment,jsxElements}` stand-ins,
  never real sync output); matrix still consumes via
  core until M-runner lands.
- Shared-shape proof it blocks exactly the 3 metas:
  all 3 import upstream baseSystem in extends[] (grep);
  all 4 leaves have `extends: []` and sync green.
- NOT implemented — a shape DESIGN decision (republish
  singular `fragment`? move consumer+validator+type to
  `fragments[]`?) with chain-behavior implications
  (kept T2/T8 consume baseSystems) in neo src beyond
  my files. Firmly captain-scoped follow-on territory,
  exactly like this crew's own dispatch.
- HANDOFF TO CAPTAIN: the ordered bootstrap gap is
  CLOSED (entry + alias + styled verdicts + test +
  4/7 smokes + 26/26), but the 3 meta smokes need a
  follow-on crew: reconcile published-baseSystem shape
  vs extends validator/reader/type. Files:lines both
  sides above. No fixture changes needed for any gap.
- Collateral: ZERO. Meta failures are load-time
  validation errors — they throw before cleanDir, so
  all 3 metas' `.reference-ui/` stand untouched
  (verified present); `git status -- fixtures/` =
  exactly M-fixtures' 18 files. No restore needed
  (procedure on standby, unused).

## Bootstrap-alias BLOCKED-HANDOFF (crew, 2026-09-23)

Ordered gap CLOSED, smokes 4/7 — no full-DONE claim.
Delivered: neo react source entry mirroring core's
surface exactly (108 runtime names, justified type
drops), `@reference-ui/react` bootstrap alias ported,
4 styled ids evaluated (all DROP, reasons + pins),
1 colocated regression test (4/4, load-bearing), q 0/0,
adjacent 215/215 + sync 36/36, NEO-REF 26/26 green,
tsc clean, leaves 4/4 green. RESIDUAL (1, blocking the
3 meta smokes): published-baseSystem `fragments[]` vs
extends singular-`fragment` drift (validator + reader +
type agree against the publisher) — needs a
captain-scoped follow-on (shape decision, not a wiring
step). Footprint: 3 new + 2 edited neo-src files + this
log; index untouched, no commits, scope held except the
one entailed test pin (logged above).

## Axis-shorthands (crew, 2026-09-23) — WORKING

Scope (strict): marginX/marginY/paddingX/paddingY ONLY.
RS parse/compile/typegen + canon language update + neo
runtime application + cargo and neo vitest. Never commit,
never touch the index. Governing skills `agent-rs` +
`agent-neo` loaded first; VOYAGE.md Obj 2 + LOG-2 Leg C
(docsconf verdicts + captain's acceptance) read. Sibling
scopes (createRoot sites, entry/microbundle/plugins,
fragments runner) untouched — collision rule held.

### Recon (read-only, firsthand)

- Gap confirmed: zero `marginX|marginY|paddingX|paddingY`
  hits in RS src, neo src, lib src, matrix, fixtures.
  Only hits repo-wide: core's Panda-generated
  `style-props.d.ts`/`system.d.ts` (legacy), built dists,
  and docs `mdxComponents.tsx` (:122/:128 marginY,
  :157/:158 paddingX/paddingY).
- Panda legacy mapping (core `style-props.d.ts:6836+`):
  marginX→marginInline, marginY→marginBlock,
  paddingX→paddingInline, paddingY→paddingBlock. Same
  logical targets as the existing mx/my/px/py twins
  (canon `overlay/aliases.ts:15-16,22-23`).
- Canon is the keystone, verified call-site by call-site:
  atomic extract gates on `is_known_style_prop`
  (`harvest/sinks.rs:52`, UnknownProperty drop), resolve
  gates + canonicalizes (`resolve/mod.rs:147,214`),
  stylesheet name + declaration canonicalize
  (`name/mod.rs:15`, `cascade/mod.rs:81`), runtime
  artifact `stylePropNames` unions CANONICAL+ALIASES
  (`runtime/plan.rs:203-217`), NamerTables.aliases from
  ALIASES (`runtime/tables/mod.rs:101-106`), typegen
  spacing keys from box-spacing aliases
  (`typegen/emit/style.rs:120-130`), styletrace reads
  names from generated .d.ts (no list), tasty has no
  prop list. Neo react entry/types + splitter bake the
  artifact list (`sync/react.ts`, `generate.ts`,
  `split.ts:52`) — no hardcoded neo prop list. So: 4
  canon aliases + regen flow to parse/compile/typegen/
  namer/splitter with ZERO neo-src edits (no NEED-SPLIT).
- Compile shape is single-declaration, not two: marginY
  and my MUST share class `my_8r` (same canonical
  `marginBlock` → same prefix), so marginY emits
  `margin-block:` exactly as my does today. Task's
  "top+bottom" = the block axis in horizontal writing
  mode. Two-declaration expansion would fork the twin's
  class — refused for coherence.
- Runtime silent-drop site: `split.ts:61` — unknown keys
  land on the element, never in style resolution. After
  re-sync the 4 ride the baked list into `css()`.

### Census (shorthand family — file, don't build)

Panda-legacy axis members missing from canon (all
logical-mapped in `style-props.d.ts`, verified lines):
- F-AXIS-1: insetX/insetY → insetInline/insetBlock
  (:6836/:6848).
- F-AXIS-2: borderX/borderY → borderInline/borderBlock
  (:7767/:7807) + borderXWidth/borderXC/borderYWidth/
  borderYC (:7781/:7795/:7821/:7835).
- F-AXIS-3: scrollMarginX/scrollMarginY →
  scrollMarginInline/scrollMarginBlock (:7995/:8007) +
  scrollPaddingX/scrollPaddingY (:8019 + mate).
- Considered, NOT gaps: gapX/gapY (Panda never had
  them); d/pos/rounded/shadow/c (canon CAN-ALIAS-04
  deliberately refuses); ps/pe/ms/me (same refusal).
- F-AXIS-4 (ordered): loud-errors-on-unknown-props —
  genuine UX question, filed undecided per brief.

### Plan

1. Canon: 4 aliases in `overlay/aliases.ts`, extend
   ALIAS-01/03 test emitters + SPEC rows, regen + fmt,
   `agentrs c/v canon`.
2. Atomic: cargo unit test (resolve all 4, rhythm css
   value) + seam golden ATM-SHORT-12 (next free; SHORT-10
   skipped pre-existing, SHORT-11 unlisted in SPEC
   pre-existing — neither touched) + SPEC row.
3. Typegen: SPACING_KEYS += 4, regen goldens, `c/v`.
4. Neo vitest: new `src/sync/axis-shorthands.test.ts`
   (real sync over temp project; sheet rules + artifact
   names + splitter routing + css() naming). Native
   rebuild first (`agentrs b`).
5. Oracle: re-sync docs, docs tsc → ONLY the 4 Leg A
   errors. Gates: `agentrs q` all touched RS files,
   `agentneo q` touched neo files. Then DONE.

### Implementation (firsthand)

- Canon: 4 aliases in `overlay/aliases.ts` (marginX→
  marginInline, marginY→marginBlock, paddingX→
  paddingInline, paddingY→paddingBlock — Panda-legacy
  logical mapping, same targets as mx/my/px/py); ALIAS-01/
  03 test emitters + SPEC rows extended; regen + `cargo
  fmt -p canon`. Generated diff is exact: 4 ALIASES rows
  in sorted position + `maybe_alias` length set
  `1|2|4|7`→`1|2|4|7|8`. (Bench-file fmt churn reverted.)
- Atomic: new `resolve/axis_tests.rs` (3 tests: one
  rhythm atom each + class/declaration pins, short-twin
  convergence, zero diagnostics) wired in `mod.rs`;
  seam golden ATM-SHORT-12 (JSX input, sheet/classes/
  diagnostics spec, committed output goldens); SPEC row +
  proof-map row + SHORT counts 9→10. (SPEC totals
  223-vs-203 already stale pre-existing — left.)
- Typegen: SPACING_KEYS += 4; goldens regen — purely
  additive (4 StyleProps lines ×3 files + 4 strict
  union members, zero removals).
- Neo: ZERO src edits (no NEED-SPLIT — all flows are
  data: artifact stylePropNames + NamerTables.aliases +
  baked splitter list). New `src/sync/
  axis-shorthands.test.ts` proves runtime application
  over a real sync.
- Compile shape held single-declaration: marginY emits
  `margin-block:`, sharing `my_*` with its twin (two
  declarations would fork the twin's class — refused,
  logged in recon).
- Census pins moved by the language change (re-pinned
  with attribution): harvest-census reactRaw/reactGzip
  149479/32889 → 149593/32898 (A/B-proven: +42 raw is
  the 4 baked names; +72/+9 is pre-existing in-flight
  tree drift, flagged re-verify at landing);
  `aliases_cover_the_dialect` 315 → 319 + 4 spot maps.
- Twin-coexistence stays OUT of the seam case by gauge
  law: co-compiling marginY+my trips ATM-GHOST-04
  injectivity (cf. quarantined LEAF-05, list may only
  shrink) — convergence pinned in cargo instead.

### Proofs (scoped, all firsthand)

- `agentrs c canon` green; `agentrs v canon` 15/15.
- `agentrs c atomic` green, 658 (incl. 3 new axis).
  Full workspace `agentrs c` green.
- `agentrs v atomic` green, 302/302 (13 files, incl.
  new SHORT-12 + re-pinned census). Full `agentrs v`:
  every project green EXCEPT virtualrs 10/17 —
  PRE-EXISTING (import-semicolon printer drift,
  zero canon linkage, tree untouched) — FINDING, not
  mine; tasty/atlas/styletrace/typegen/canon/runtime
  all green.
- `agentrs c typegen` 40/40; `agentrs v typegen` 21/21.
- Neo `vitest run src/sync/axis-shorthands.test.ts`
  4/4 (sheet rules, artifact names+aliases, splitter
  routing, css() naming + no-ghost sheet pins).
- ORACLE MET: docs re-synced (`neo sync` exit 0,
  1530ms; sheet now carries `my_4r`/`my_8r`/`px_1r`/
  `py_0.5r`, react.d.mts StylePropName carries the 4);
  docs `tsc --noEmit` shows EXACTLY the 4 Leg A
  TS2353s (DocSidebar display + fontWeight,
  ThemeToggle flex, mdx textDecoration) — Leg C gone,
  zero-new.
- Gates: `agentrs q` over all 8 touched RS files →
  ALL PASSED; `agentneo q` on the neo test → 0/0.
- Footprint: 3 new paths + 14 modified RS files +
  this log; index empty; nothing committed; no
  sibling files touched; no matrix/core/lib/docs/
  icons/mcp/runner package edits (docs .reference-ui
  regen is gitignored build output).

### Follow-ups filed (not built)

- F-AXIS-1/2/3 (census above): insetX/Y, border-axis
  family, scroll-margin/padding-axis — Panda-legacy
  members still missing from canon. Note: `borderX`
  refusal is PINNED by `aliases.test.ts` (locked-vs-
  refused set test) — F-AXIS-2 must move that pin with
  HQ approval, not silently.
- F-AXIS-4 (ordered): loud-errors-on-unknown-props —
  genuine UX question, undecided.
- FINDING: virtualrs 10/17 red pre-existing
  (semicolon drift, no canon path) — owner needed,
  outside this scope.
- Census-note for landing captain: harvest-census
  react pin absorbs +72/+9 in-flight drift beyond my
  +42 — re-verify the pin on the landing tree.

## AXIS-SHORTHANDS DONE (crew, 2026-09-23)

All four axis shorthands parse, compile (single
logical declarations on twin classes), typegen
(StyleProps + strict unions), and apply at runtime
(splitter + css() over the real artifact, no silent
drop). Oracle met, both gates green, scope held.

## Recipe-classname-investigation (crew, 2026-09-23) — DONE

Read-only crew. Read `docs/bugs/recipe-classname-required.md`
in full; verified every cited site firsthand and went
deeper where it was thin. No repo edits except this
section. New findings below are marked NEW (not in the
bug doc).

### Verdict on HQ's hunch ("should not be difficult")

REFUTED for true optionality, CONFIRMED for the cheap
wins. The type change is one `?`; the runtime loop is
the whole job, and every transport dies on a path the
fix must support (census below). The captain's hardness
note stands. What this crew adds: exact file/function
sites, the transport census with a new killer fact (Neo
has NO bundler-plugin surface at all — a transform
would be greenfield, not an extension), an
already-present inference gap (`export default`
without literal fails today), proof core never had
`className` (Neo-only tax, zero legacy migration), and
proof the shared-css naming rule from HQ's direction
cannot mean what it says (in-situ is css()'s native
shape).

### (1) Effort estimate (crew-terms)

- TRUE OPTIONAL via per-recipe codegen / declared
  recipes (Panda's answer): LARGE. New userland
  codegen or API migration, new emission leg, spec +
  station + neo-case coverage, external authors pay
  the migration. Multi-crew.
- TRUE OPTIONAL via content-hash transport: MEDIUM
  build, LARGE risk. New RS↔JS canonical-hash
  contract, duplicate-content stem collisions, skew =
  silent miss. Clever-fragile; not recommended.
- TRUE OPTIONAL via sync-rewrites-user-source:
  MEDIUM build, LARGE risk. Sync today emits
  artifacts only (never touches userland); rewriting
  user source fights watch mode, git, and formatter
  ownership. Not recommended.
- Bundler transform (already REJECTED by HQ):
  would-be MEDIUM, now moot — plus the killer fact
  below (no Neo plugin surface exists).
- Cheap wins: dev-loud miss SMALL (one crew, one
  runtime file + test updates); doc-comment rationale
  TRIVIAL; remove-the-inference-backstop SMALL (RS +
  2 stations + SPEC + NEO-RECIPE-11 rewrite, but a
  behavior change for untyped sites); literal-vs-
  binding agreement diagnostic SMALL (new WARN, zero
  existing pins break — no fixture disagrees today);
  binding-tracing shared-helper refactor SMALL (zero
  behavior change).

### (2) EXACT change sites

RS extractor (all under
`packages/reference-rs/modules/atomic/src/`):
- `extract/recipes/mod.rs:142-156`
  `extract_class_name` — literal > inference >
  diagnostic. Any inference change lands here.
- `extract/recipes/mod.rs:161-167`
  `infer_binding_class_name` — the `strip_suffix
  ("Recipe")` rule; bare `Recipe` → None.
- `extract/recipes/mod.rs:169-186`
  `extract_literal_class_name` — non-empty literal
  gate + refusal message.
- `extract/mod.rs:414-423`
  `visit_variable_declarator` — sets `recipe_binding`
  for the declarator subtree (ANY declarator, nested
  included; restored after). The tracing root HQ's
  direction builds on.
- `extract/mod.rs:425-430`
  `visit_export_default_declaration` — sets
  `default_recipe_export` only.
- `extract/mod.rs:536-541` `binding_ident_name` —
  destructured patterns → None → diagnostic.
- `extract/mod.rs:495-512` `visitor_context` —
  copies binding state into each call's `ctx`.
- `extract/recipes/mod.rs:70-93`
  `record_result_binding` / `result_binding_name` —
  NEW GAP (verified): inference reads ONLY
  `ctx.recipe_binding`, so `export default
  recipe({...})` WITHOUT a literal FAILS today
  (binding None → diagnostic) even though the
  'default' pseudo-binding exists for call
  resolution. The middle path already has a hole.
- `diagnostics/codes.rs:77,205`
  `RecipeClassName` → `ATM-E-RECIPE-CLASSNAME`
  (error severity via `Diagnostic::error` at
  `extract/recipes/mod.rs:149-154`).
- `assembly.rs:251` `DuplicateRecipe` — dup
  `(system, className)` gate; works on resolved
  stems regardless of literal/inferred source.
- `extract/recipes/selection.rs:28-34`
  `RecipeBinding` — cross-file call-site resolution
  rides the resolved `class_name`; untouched by
  transport work but consumes its output.

Neo recipe runtime + decl template:
- `packages/reference-neo/src/runtime/recipe/recipe.ts:36-37`
  `RecipeConfig.className: string` (required).
- `packages/reference-neo/src/runtime/recipe/recipe.ts:329-365`
  `recipe()` — `:336` key =
  `qualifiedName(system, lowered.className)`, `:338`
  miss → silent `return ''`.
- Verified: the file contains NO `console`,
  `process.env`, `DEV`, or warning path — only one
  `throw` (`:334`, called-before-register). A
  dev-loud miss is greenfield, including the
  dev-vs-prod split mechanism (no precedent in this
  file).
- `packages/reference-neo/src/sync/publish/types-bundle.ts:109-110`
  — the WIDE authoring `RecipeConfig`
  (`RecipeStyleObject`) shipped to users in
  styled/types. The `?` must land here too, or users
  still fail typecheck against generated types while
  the runtime source loosens. TWO type sites, not one.
- `packages/reference-neo/src/entry/react.ts:11` —
  `export { css, recipe } from '../runtime/index.ts'`;
  bundled prebuilt into `react.mjs` by
  `src/sync/react.ts` (~:104-112). The runtime ships
  as ONE shared bundle; per-recipe stems live in
  user code, which sync never rewrites. This is the
  transport crux in one paragraph.

css() extraction (shared name-authority direction):
- `extract/css/mod.rs:51` `css::extract` — verified:
  ZERO reads of `ctx.recipe_binding` anywhere under
  `extract/css/` or `extract/jsx/`. css() is
  content-addressed (atoms); it needs no names.
- NEW: HQ's "trace bindings, warn on untraceable
  (in-situ)" CANNOT apply one rule to both APIs:
  in-situ is css()'s NATIVE shape
  (`className={css(...)}` in JSX, ATM-SITE-73; bare
  `css({...})` statements everywhere). A shared
  warn-on-in-situ rule would fire on every normal
  css() call. Shared tooling can only mean shared
  TRACING INFRA (the `ExtractVisitor` binding
  context), with per-API rules. css() has no literal
  to agree with either, so "check literal-vs-binding
  agreement" is recipe-only. The css half of the
  direction is either a no-op refactor or scope
  expansion with no consumer — recommend the
  refactor reading only.

Canon / spec (language-visible?):
- Canon: NO. Zero `recipe` references in
  `modules/canon/src/`. `className` is not
  platform-dictionary visible.
- Spec: YES. `modules/atomic/SPEC.md` ~:722-724
  (ATM-RECIPE-06 row still says "must require
  explicit `className` … only admits valid explicit
  identities" — ALREADY STALE since -08 admitted
  inference; any decision must rewrite this row)
  and ~:729-731 (ATM-RECIPE-08 inference row, pins
  RS-33).
- Legacy core: `reference-core/src/types/public/recipe.ts:34-39`
  `RecipeDefinition` has NO `className` field at
  all; core runtime (`customCvaFn` → Panda styled
  cva) resolves through atoms, never a named table.
  NEW: the required literal is a NEO-ONLY
  invention. Core/legacy-webpack is unaffected by
  either decision — no legacy migration exists.

Sync fail channel (already supports HQ's "warn"):
- `packages/reference-neo/src/sync/index.ts:50-54`
  `throwOnErrorDiagnostics` (called :193) —
  error diagnostics sync-fail (atomic folder,
  :121-122). `:65-69` `reportWarningDiagnostics` —
  warnings print LOUD, never throw. Downgrading
  `RecipeClassName` to warn is plumbing-free
  (`ctx.warn` precedent: `extract/css/mod.rs`
  `NonObjectCssArg`) — but warn-only WITHOUT
  transport still emits no table (extract returns
  None), so the runtime miss persists. Warn needs
  transport to mean anything.

### (3) Transport question + path census

Question: what carries the traced stem into the
generic `recipe(config)` call? Answer: NOTHING
exists, and every candidate breaks on at least one
must-support path:

- (a) The literal (status quo): works everywhere.
  Cost is the usability tax on a public API.
- (b) Per-recipe codegen / declared recipes: the
  only complete transport (Panda's). LARGE (above).
- (c) Content-hash: runtime hashes config,
  extractor stamps qualifiedName. New canonical-hash
  contract across RS↔JS; duplicate-content stems
  collide; any skew = silent miss. Fragile.
- (d) Sidecar mapping keyed by call-site identity:
  dead — the runtime call has no identity (same
  generic function every site; no assignment hooks
  in JS).
- (e) Sync rewrites user source (inject the
  literal): sync is artifacts-only today
  (`.reference-ui/` legs in `sync/publish/`); no
  precedent, fights watch + git + formatters.
- (f) Stack inspection: not serious (minification,
  cost). Closed.

Path census — what bypasses ANY build-time
injection, verified:
1. Vite dev/build (real apps): Neo has NO vite
   plugin of its own — zero `referenceVite` refs
   in `packages/reference-neo/src/` (only
   `docs/evidence/` mentions). `referenceVite`
   lives in core and does HMR/watch only. A
   transform would need a NEW Neo plugin surface,
   running identically in dev serve + build.
2. Plain-node SSR: specs import
   `@reference-ui/neo/runtime` directly in node
   (NEO-RECIPE-11 `identity.spec.ts` does
   exactly this). No bundler, no transform.
3. Raw-source tests: `recipe.test.ts` imports
   `recipe.ts` directly; RS stations compile
   strings. No transform.
4. Harness worlds: built by PLAIN esbuild
   `transform` (`tests/shared/build.ts:5,40`) —
   no plugins. Even Neo's own e2e path bypasses
   a vite transform.
5. Exotic bundlers: userland choice; cannot be
   covered by vite-only machinery.

If transport is absent on ANY path, the runtime
lookup misses and returns `''` — silent unstyled
render, PINNED as today's behavior
(`recipe.test.ts:78-81`). So optionality without
the dev-loud miss companion reopens a silent hole
on paths 2–5 at minimum. The dev-loud miss is not
optional garnish; it is the load-bearing half of
any optionality.

### (4) Test-surface inventory

| Pin | What it holds | What a fix needs |
|---|---|---|
| ATM-RECIPE-06 (station) | 3 diagnostics w/ pinned line/cols: non-suffixed `r1` missing-identity [4,19], dynamic [10,19], dup [18,12]; 1 dup table | Inference removal: unchanged shape, message may change. Optionality: `r1` arm DIES (non-suffixed becomes warn-or-admit — needs the new rule). |
| ATM-RECIPE-08 (station) | Inference parity: `chipRecipe`→`chip`, full class list, runtime key `@reference-ui/lib__chip`; 2 refusal arms (bare `Recipe` [20,23], `plain` [25,22]) | Inference removal: case deleted/rewritten, SPEC row -08 deleted. Optionality + warn: refusal arms become warn arms; spec asserts tables + warnings. |
| ATM-SITE-10 (station) | Explicit `className:'button'` extracts when import-live; shadowed `recipe()` ignored | Untouched by all options (explicit path). |
| `recipe.test.ts:78-81` | Silent miss: unknown recipe → `''` | Dev-loud miss: test rewritten (throw in dev, `''` in prod — needs the split mechanism decided). |
| `recipe.test.ts` CONFIG (:34-44) + suite | All configs carry explicit `className` | Optionality: add className-less configs resolving via transported stem (impossible until transport exists — this test is the definition of done). |
| NEO-RECIPE-11 (case) | EMISSION parity only: world app hardcodes class strings for paint; spec resolves via explicit `recipe({className:'chip'})`. README scope note admits the split | Optionality: case rewritten so the WORLD's own className-less call resolves at runtime (needs transport + a real browser round-trip, not hardcoded classes). Inference removal: case deleted. |
| NEO-RECIPE-06/07 (cases) | Dup + non-literal sync failures | Untouched (dup/non-literal rules independent of identity source). |
| `extract/tests.rs` | NO inference unit tests (only `recipe_bindings` plumbing :525,568) | Inference rule changes need no unit updates; station-level only. |
| VRT-CVA-05 (virtualrs) | cva/recipe binding normalization (core virtual) | Untouched — different layer, no className involvement. |
| SPEC.md -06/-08 rows | Language-visible contract (see §2) | Any decision rewrites ≥1 row. |

Untyped-call-site census (open Q1): in-repo, the
ONLY shipped `recipe()` call is SummaryChip (now
literal-carrying). Everything else is fixtures.
External call sites cannot be censused — but note
core's type NEVER had `className`, so untyped/JS
core authors calling without the literal exist in
principle; Neo sync of such sources is exactly
what ATM-RECIPE-08's inference admits and what
inference-removal would newly refuse.

### (5) Risks + recommended sequencing

Risks:
- R1 (transport skew): any two-implementation
  rule (RS inference + a second injector) must
  agree EXACTLY; pin with shared fixtures
  (ATM-RECIPE-08 shapes). Applies to transform
  (rejected) and content-hash alike.
- R2 (silent rename hazard): if inference ever
  becomes load-bearing at runtime, renaming
  `chipRecipe` silently re-keys CSS. The literal
  is the only rename-proof key. Any optionality
  reintroduces this by construction.
- R3 (half-optionality): loosening the type
  without transport recreates the SummaryChip
  exhibit (emitted table nobody can reach) as a
  SUPPORTED state. The `?` must never land alone.
- R4 (css scope creep): literal reading of the
  shared-tooling direction adds naming behavior
  to an API with no naming consumer. Take the
  refactor reading.
- R5 (spec rot): SPEC -06 row already
  contradicts -08. Whatever HQ decides, rewrite
  the rows in the same diff.

Sequencing:
1. AFTER Objective 1 finality: anything touching
   `extract/recipes/mod.rs`, the `extract/mod.rs`
   walker, SPEC rows, or ATM stations (inference
   removal, agreement diagnostic, shared-tracing
   refactor, warn-downgrade). The RS resolution
   wave owns these files; don't overlap.
2. INDEPENDENT of Obj-1 (Neo runtime only):
   dev-loud miss (`recipe.ts:338` + `recipe.test.ts`
   + a Neo case for the loud path) and the
   doc-comment rationale. Either can land now —
   but the dev/prod split mechanism needs an HQ
   decision first (no precedent in the runtime).
3. css() shared-tooling: shrinks to a SMALL
   post-Obj-1 refactor (extract binding-context
   helper, zero behavior change) under the
   recommended reading; EXPANDS effort under the
   literal reading with no consumer. Recommend
   HQ confirm the refactor reading.
4. Per-recipe codegen (if HQ wants true
   optionality): dedicated objective, post-Obj-1,
   own design doc. Not a crew-sized task.

DONE: estimate LARGE for true optionality (refutes
HQ's hunch), SMALL for each cheap win (confirms it).
Sites: RS `extract/recipes/mod.rs:142-186`,
`extract/mod.rs:414-430,495-541`, `diagnostics/codes.rs:77`,
`assembly.rs:251`; Neo `runtime/recipe/recipe.ts:36-37,329-338`,
`sync/publish/types-bundle.ts:109-110`,
`sync/index.ts:50-69`, `entry/react.ts:11`,
`sync/react.ts`; spec `SPEC.md` -06/-08 rows;
canon untouched; core untouched. Transport verdict:
no channel exists; sync is artifacts-only, Neo has
no plugin surface, and paths 2–5 (node SSR,
raw-source tests, esbuild harness worlds, exotic
bundlers) bypass any injection — the dev-loud miss
is load-bearing for any optionality.

## Pubshape (crew, 2026-09-23) — WORKING

Scope (strict): neo src publish boundary + neo-owned drift-encoding
tests/specs + ONE real-sync chain regression test + 3 meta smokes.
Captain's ruling read (singular fragment again, plural keys cut,
validator/type/reader stay). Never commit, never touch the index.
Governing skill `agent-neo` loaded first (+ `benchmark` for the
perf guard). No matrix/fixture edits planned (census-held zero).

### Census (read-only, firsthand) — zero plural readers, cut approved

- `fragments[]`/`cssChunks[]`/`runtime` off published baseSystem:
  ZERO production readers repo-wide. Fixtures only re-export
  baseSystem (src/index.ts pass-through); chain tiers pass the
  object into extends[]/layers[] (zero `.fragments`/`.cssChunks`/
  `.runtime` hits in matrix); pipeline/mcp/icons/docs/lib read
  none of the three keys. CHAIN_RULES:57-58 speaks singular
  (`baseSystem.fragment` owns fragment transitivity,
  `baseSystem.css` owns style transitivity).
- Core publishes AND consumes singular (create.ts:19-26
  {name,fragment,jsxElements} + updateBaseSystemCss; reader
  fragments/index.ts:35 maps system.fragment; validator
  core config/validate.ts:201) — matches the ruling's cite.
- The ONLY plural readers are neo's own drift footprints (all
  neo-owned, updated by this crew, not a census veto):
  NEO-SYNC-03 portable.spec.ts (pins plural + asserts NO
  flattened survivor — the drift encoded as law), LAYER-02
  packages.spec.ts:79 + world app.ts:33 (`cssChunks[0]`),
  src/sync/sync.test.ts:286-299.
- `PublishInput.fragments?`/`runtime?`: ZERO producers
  (sync/index.ts passes neither) — dead options, removed.
- Staging dance (stage/take/Map): consumers are system.ts +
  styled.ts ONLY (the "deepsee worker" pairing in the comment
  has no in-tree caller) — deleted with the runtime key.
- `styled/runtime-data.mjs` (react entry via sync/react.ts:87
  + specs) is the live runtime channel and STAYS — baseSystem
  carried a duplicated copy (SYNC-03:107 deepEqual pin).
- Ruled published shape: exactly `{name, fragment, css,
  jsxElements}` — conforms to the untouched neo BaseSystem
  type, core-style. T2/T8 viability: verified (passthrough
  only, singular vocabulary); the layers-consumption gap is
  the pre-existing D17 deferral (H3), not this crew.

### Pubshape implementation (firsthand)

- Reconciled `src/sync/publish/system.ts` to the ruled shape:
  published baseSystem is exactly `{name, fragment, css,
  jsxElements}` (`fragment` = the existing portable bundle,
  core-style; `css` = portable stylesheet). Deleted the
  plural keys, `runtime`, `schemaVersion`, the sha256 hash,
  `emptyRuntime`, `PublishInput.fragments?/runtime?` (zero
  producers), and the whole stage/take/Map dance (consumers
  were system.ts + styled.ts only — the "deepsee worker"
  pairing has no in-tree caller); `writeSystemDir` writes
  baseSystem.mjs directly. `publishRuntimeBundle` keeps the
  styled/runtime-data.mjs leg (the live runtime channel:
  react entry + specs). Both generated d.mts files declare
  the singular `BaseSystem` (self-contained, no cross-
  package type import). Validator + type + extends reader
  UNTOUCHED per the ruling.
- Updated the drift footprints (all neo-owned): SYNC-03 spec
  rewritten to the singular shape (+ README + TESTS.md row),
  LAYER-02 spec + world app + README (`cssChunks[0]` → `css`),
  SYNC-12 type line, sync.test.ts publisher assertions.
- NEO-CHAIN-06 (new, 8 files): the structural fix. World
  carries a real upstream package; spec syncs it via real
  `sync()`, extends the artifact on disk (mid-run ui.config
  rewrite, REF-04 pattern — static import at rest would
  break checkout-clean typecheck), re-syncs, and pins
  validation + evaluated adoption + sheet vars + fragment
  republish + two paints; try/finally restores canonical +
  heal sync. GREEN first run after a var-spelling fix (engine
  kebab-cases: `--colors-real-accent`). NEGATIVE CONTROL:
  plural publisher → spec FAILs (`upstream publishes the
  singular fragment`) — load-bearing, then restored.
  Ledger row + SPEC dialect note added.
- Smokes 7/7 GREEN (`pnpm sync` per fixture): 4 leaves +
  meta, meta-2, sibling. Adoption verified beyond green:
  meta sheet carries upstream vars, meta fragment
  republishes the upstream fragment text.
- Adjacent consumers: lib sync green (singular base,
  236KB fragment); docs sync green AND now adopts lib
  tokens (slate/gray/red/… in evaluated + 451 sheet
  vars) — pre-fix docs was silently dropping them
  (plural base passed validation via jsxElements while
  the reader dropped the fragments). Healed by this fix.

### Pubshape proofs (all firsthand, scoped)

- `agentneo run NEO-CHAIN-0{1..6}`: 6/6 PASS (06 twice).
- `agentneo run NEO-REF`: 26 PASS / 0 FAIL (counted).
- `agentneo run NEO-SYNC-03`, `NEO-LAYER-02`: PASS.
- `vitest run src/sync/sync.test.ts`: 18/18.
  `vitest run src/sync src/fragments src/config`:
  155/156 — the 1 red is `scan-goldens` native-runtime
  sha pin, caused by the sibling RS crew's 10:45 binary
  rebuild (file untouched by me, engine output golden —
  NOT this change; see finding F-PUB-1).
- `agentneo q` over all 14 touched/new .ts files: 0
  errors, 2 pre-existing warns (sync.test.ts length,
  SYNC-12 fn length — zero lines added to either).
- `tsc --noEmit`: exit 0. No-panda clean on all touched.
- PERF GUARD (bench:neo seed-7 before/after): css bytes
  d=0 all scales; dataBytes +144 constant = the sibling
  binary rebuild (10:45, mid-window; my diff cannot
  affect runtime-data — same writer, untouched compile
  path); syncMs +2-7% inside sample variance (small
  108-206ms, medium 162-316ms ranges) + parallel-crew
  contention; enterprise rerun 958.8ms reproduces.
  NO material regression — NO PERF handoff.
- T2/T8 viability: verified (ui.configs pass baseSystem
  objects through; zero plural-key reads in matrix;
  CHAIN_RULES speaks fragment/css). Layers-consumption
  gap = pre-existing D17 deferral (H3), not this crew.

### Pubshape findings (for captain, out of scope)

- F-PUB-1: `scan-goldens` red on current tree (native
  runtime sha) — sibling axis-shorthands binary rebuild,
  untouched golden file. Their landing updates it; do
  not "fix" from here.
- F-PUB-2: pre-fix docs lived on silently dropped lib
  tokens (green sync, missing adoption). Fixed as a
  side effect; docs paint may legitimately shift where
  lib tokens now resolve — no docs visual gate exists
  to confirm, flagged not chased.
- F-PUB-3: `PLAN.md` campaign rows (SYNC-03 row :732,
  frozen-contracts :53, RS-4 :412) still name the plural
  shape. Left per P1 precedent (campaign record; live
  ledgers updated).

## Pubshape DONE (crew, 2026-09-23)

Publisher emits the singular BaseSystem again; plural +
runtime + schemaVersion keys cut (census: zero production
readers); NEO-CHAIN-06 proves real-sync extends end to end
(green + load-bearing negative control); 7/7 fixture
smokes green with adoption verified; NEO-REF 26/26,
NEO-CHAIN 6/6, q 0 errors, tsc clean, perf guard passed
without handoff. Footprint: 5 neo-src files (4 modified,
tests in sync.test.ts), SYNC-03/LAYER-02/SYNC-12 specs +
READMEs, chain TESTS/SPEC rows, new NEO-CHAIN-06 (8
files), this log. No matrix/fixture edits (census-held
zero), no commits, index untouched.

## Pubshape acceptance (captain, 2026-09-23)

PUBSHAPE ACCEPTED. Verified firsthand, all decisive
proofs: publisher emits exactly {name, fragment, css,
jsxElements} (read the reconciled function + emitted
decl interface); plural-reader census holds (only
repo-wide hits are gitignored stale sync output under
the dropped responsive suite); NEO-CHAIN-06 PASSES on
my own run (real-sync extends end to end); all 3 meta
smokes green on my own runs (84/499/75ms, exit 0 —
previously threw the extends validation error). Perf
guard reviewed: css bytes d=0, syncMs +2-7% inside
variance, +144 dataBytes attributed to the sibling RS
binary rebuild with mechanism — no handoff, accepted.
The published-shape drift is closed; the chain path now
tests the real box, not stand-ins.

## Shorthands acceptance — Leg C CLOSED (captain, 2026-09-23)

AXIS-SHORTHANDS ACCEPTED. Verified firsthand: the
oracle holds — docs tsc shows EXACTLY the 4 Leg A
errors (display/fontWeight/flex/textDecoration), Leg C
(marginY×2/paddingX) gone; neo axis-shorthands runtime
test PASSES (real sync, shorthands apply, no silent
drop); cargo axis_shorthands 3/3 green. Footprint 15
files, all in-scope (canon aliases/dialect/tests/SPEC,
atomic resolve + ATM-SHORT-12 + SPEC, typegen style
tests + 3 goldens, 1 neo test) — no sibling collisions.
Leg C is CLOSED; docs stand at baseline-16 → 4, all
remaining filed as the Leg A typegen gap.

## M-runner acceptance — Phase 2 COMPLETE (captain, 2026-09-23)

M-RUNNER ACCEPTED (last migration home). Verified
firsthand: pipeline units 177 pass / 1 fail with the
fail in HEAD-identical rust-contract files (genuinely
pre-existing); pipeline tsc exactly 6 errors, all
TS2835 in RS native-contract territory (frozen, outside
scope — zero in-scope errors); wait-ready re-expressed
to Neo artifact polling (system.mjs + scope links, no
session sentinel); 40-file footprint, matrix.json files
untouched. Mode-name + template decisions stand as
filed. Residuals: R-MR-1 (layers TS2353, NEED-EXPORTS
class — carried, blocks nothing), R-MR-2 (self-resolves
on watch-suite deletion), R-MR-3 (both halves verified
pre-existing by me), R-MR-4 (setup-metrics dead code —
Phase 3 cleanup), R-MR-5 (react-stub — resolved, metas
green). ALL Phase 2 migrations + follow-ons accepted.
Phase 3 (removal/restructure/hermetic proof/landing) is
next; cartographer dispatched below.

## Phase-3-map

Phase-3 cartographer (2026-09-23) — READ-ONLY mapping, no
implementation. Sources read in full: VOYAGE.md Objective 2 +
LOG-2.md map (§MAP audit, all Phase 2 crew DONEs +
acceptances, every residual). Firsthand recon below is
read-only (repo untouched except this section; no commits,
index clean).

Standing state (accepted, not relitigated): the kept gate
is **chain-t2 + chain-t8 + mcp ×19**. DISTRO and WATCH are
**fully RELEASED = DELETED outright** per the accepted
install-dim verdicts — any "kept distro/watch" phrasing in
briefs is stale; their proof is their Neo homes plus
absence-from-tree (§4). Phase 2 is COMPLETE (all
migrations + follow-ons accepted). Everything rides the
ONE Objective 2 landing commit.

### §1 — Action items by owner-crew scope (disjoint)

**R1 — core deletion + workspace shape + lockfile + CI
trigger.** Files: `packages/reference-core/`,
`pnpm-workspace.yaml`, `pnpm-lock.yaml`,
`.github/workflows/docs.yml`. Internal order: delete first,
globs + regen only after R2's moves (regen must see the
final package shape); R1 alone runs installs
(shared-file discipline: no other crew installs).
1. `git rm -r packages/reference-core/` (core self-refs —
   emitters, bins, virtual/paths — die with it; `packages/*`
   glob drops it automatically).
2. `pnpm-workspace.yaml`: replace `- fixtures/*`,
   `- matrix/*`, `- matrix/*/*` with `- matrix/tests/*`
   (covers `matrix/tests/mcp`), `- matrix/tests/*/*`
   (covers `matrix/tests/chain/T{2,8}`), `- matrix/fixtures/*`.
   (Verified firsthand: no package.json directly under
   `matrix/`; tiers sit 3 deep post-move so the old globs
   miss them. Styletrace-local plain dirs need no glob
   under Q4a; Q4b fallback adds the new home's glob.)
3. Regen: full `pnpm install` (not --lockfile-only — must
   relink bins: `neo` shims in moved fixtures, docs, kept
   suites; covers core removal + icons/devDep swaps +
   fixture/doc/matrix dep swaps + mcp esbuild-add/core-drop
   + lib dep delete + membership changes). Then verify a
   clean resolve + `neo` shim present in every moved
   fixture and kept suite.
4. `docs.yml`: remove the `packages/reference-core/**`
   trigger path (L15); ADD `packages/reference-neo/**`
   per Q-3-14 (docs now syncs via neo).
5. Zero-census re-run (the R1 proof): repo-wide grep for
   `@reference-ui/core` (code importers — must be ZERO
   outside the allowed-residual list in §5.15),
   `reference-core`, `ref sync`/`ref build`, `ensure-core`,
   `dependsOn`. Allowed residuals enumerated in §5 — R1
   files the residual list, captain confirms.

**R2 — deletes + moves + depth mechanics + discovery.**
Skills: `test-core` (+ `agent-rs` for gate commands only —
the 2 RS reader edits are path strings, no compiler
logic). Files: `matrix/`, `fixtures/`, the Q4
destination, `pipeline/config.ts` (roots only),
`pipeline/src/build/workspace.ts`,
`pipeline/src/testing/matrix/discovery/`,
`pipeline/src/testing/matrix/managed/` (tests only if
needed), `pipeline/src/release/publish.test.ts` (1 line),
`.agents/skills/test-core/scripts/run.mjs` (spec-finder
only), the 2 RS reader files. R2 proves its own depth
fixes scoped (smokes + renders + tsc-negatives below);
reviewers re-run the battery in §5.
1. DELETE (wholesale, `git rm -r`, not moved): 17 suites —
   css, css-selectors, color-mode, font, responsive,
   spacing, recipe, primitives, system, tokens, reference,
   distro, session, typescript, virtual, playwright, watch
   — plus 9 chain tiers — T1, T3, T6, T7, T9, T10, T11,
   T12, T13. (T4/T5 never existed — nothing to delete.
   Dropped suites' stale matrix.json keys — runTypecheck,
   watch-full — die with them, zero edits. R-MR-2
   self-resolves on the watch deletion.)
2. MOVE kept only (`git mv`): `matrix/chain/T2` →
   `matrix/tests/chain/T2`, `matrix/chain/T8` →
   `matrix/tests/chain/T8`, `matrix/mcp` →
   `matrix/tests/mcp`. Remove the emptied `matrix/chain/`.
   `@matrix/*` package names UNCHANGED (Q-3-15 confirm).
   matrix.json files verified-unchanged (M-runner
   precedent — re-verify post-move).
3. `git mv` 7 chain fixtures → `matrix/fixtures/` FLAT,
   `@fixtures/*` names preserved (extend-library,
   extend-library-2, layer-library, layer-library-2,
   meta-extend-library, meta-extend-library-2,
   meta-extend-library-sibling).
4. Q4 move per ruling (Q-3-1): under Q4a, the 4
   non-chain fixtures → plain dirs (recommended home:
   `packages/reference-rs/modules/styletrace/test-fixtures/`,
   names preserved): move `src/`; DELETE package
   scaffolding (4× package.json — incl. atlas's core dep —
   + atlas/demo-ui tsconfigs + atlas ui.config.ts, which
   still imports core defineConfig and was never
   retargeted) after verifying no consumer needs them;
   rewrite cross-imports to relative: atlas→demo-ui (3
   src files: UserBadge, AppCard, Button + tsconfig paths
   die with the file) and styletrace-consumer→
   styletrace-library (`src/index.tsx:4/:6`); update BOTH
   RS readers to the new repo-root-relative paths
   (`modules/styletrace/tests/fixtures.test.ts`
   ~L77-106 and `src/tests/tracing.rs` ~L167-208 — FIVE
   paths each, not four: demo-ui, **extend-library** (a
   chain fixture the readers also trace → new path
   `matrix/fixtures/extend-library/src/components`),
   styletrace-library, styletrace-consumer, atlas-project;
   helpers join repo root: `fixtures.rs:11-18`,
   `helpers.ts:81` — verify firsthand). Gates:
   `agentrs c/v styletrace` green. Under Q4b fallback:
   move as workspace packages + add the home glob (R1).
5. Depth fixes (all firsthand-verified shapes):
   a. Kept package.json setup/test scripts (managed,
      depth-computed via `pipelineRelDir`
      `managed/package-json/index.ts:92-94`): T2/T8
      `../../../pipeline` → `../../../../pipeline`; mcp
      `../../pipeline` → `../../../pipeline`. Regen via
      the managed renderer or hand-edit + fresh-render
      byte-parity (`tsx` render + `cmp`, M-runner
      precedent) — 3/3 PARITY-OK is the proof.
   b. T2/T8 tsconfig F1 paths entries:
      `../../../packages/reference-neo/src/author/index.ts`
      → `../../../../packages/...`. Proof: tsc shows NO
      TS2307 on `@reference-ui/neo` (R-MR-1 layers
      TS2353 remains — accepted, §2).
   c. All 7 `bootstrap-runtime.mjs`: `resolve(packageRoot,
      '..', '..', 'packages', 'reference-lib')` → one
      more `'..'` (fixtures/* → matrix/fixtures/*).
      Proof: 7/7 `pnpm sync` green post-move.
   d. Audit (one grep each, fix if hit): other
      root-relative climbs in fixture scripts
      (build-package.mjs clean on extend's — verify all
      7), fixture tsconfig paths, relative cross-package
      imports in kept suites (expected zero — package
      ids only, T2/mcp verified).
6. Discovery + enumeration to the new depth:
   a. `discovery/index.ts:48`: `matrixRootDir` →
      `resolve(repoRoot, 'matrix', 'tests')`; extend the
      one-level group scan (~L290-297) to recursive
      descent (needs `tests/chain/T2`: two group levels);
      update the header comment (L5-6) + group example.
      Update `discovery/index.test.ts` (L191-192 pin
      dropped suites `matrix/distro`, `matrix/playwright`
      → kept-gate paths; M-runner `plan.test.ts`
      precedent).
   b. `pipeline/config.ts:2`: `WORKSPACE_PACKAGE_ROOTS`
      → `['packages', 'matrix']` (drop dead `'fixtures'`
      root); `workspace.ts:148-188`: same recursive
      group descent (today one level for `matrix` only —
      misses `tests/chain/T2`, finds `tests/mcp` and
      `fixtures/*` without the fix). Update/extend any
      test covering the enumeration (R2 finds it).
   c. `run.mjs` spec-finder (`findSpecByPathOrName` +
      `matrix/${pkg}` returns ~L988/L1084/L1137/L1145):
      audit consumers of the returned `pkg` string,
      then retarget enumeration to `matrix/tests/` +
      add chain-group descent (it lacks group support
      today — chain tiers unresolvable even pre-move).
      Proof: resolution probe on a kept suite (no full
      runs).
   d. `pipeline/src/release/publish.test.ts:68`:
      `sourceDir: 'fixtures/extend-library'` →
      `'matrix/fixtures/extend-library'` (mechanical
      truthfulness; suite stays green). The
      `core→false` pin in the same file STAYS — it is
      the nothing-ships-on-core contract proof, not
      residue.
7. Residue sweep: `git status` shows no `fixtures/` and no
   `matrix/chain/`; untracked residue under deleted/moved
   dirs (node_modules, `.reference-ui`) removed
   explicitly per-dir (no `git clean`); pipeline unit
   suite still 177/178 with the SAME 1 pre-existing
   RS-contract fail.

**R-prose — all Phase-3 prose.** Files: root `README.md`,
all 8 `matrix/*.md`, `docs/**` (named files below),
`packages/reference-neo/PLAN.md` +
`packages/reference-neo/docs/evidence/`. Policy: M-docs-prose
sweep policy (swap id→neo / ref→neo where true,
drop/rephrase where swap would lie, never falsify).
1. F1: root README (2 id hits — read context, apply
   policy).
2. F2: `matrix/TEST_COVERAGE.md` REWRITE (6 id hits +
   19-suite inventory now stale): kept gate (T2/T8/mcp)
   + pointers to Neo homes (§6 table). Sweep don't
   rewrite: CHAIN.md, CHAIN_RULES.md, CHAIN_REPORT.md
   (tier-path links `matrix/chain/T*` → kept
   `matrix/tests/chain/T*`; dropped-tier refs marked
   historical), README.md (re-verify post-M-runner),
   PROMPT.md / COVERAGE_EXTRA.md / TEST_MIGRATION.md
   per Q-3-13 (default: sweep stale lists; delete only
   with zero live citations + landing nod).
3. F3: neo `PLAN.md` + 6 evidence files (generated-
   folder-shape, landing-lib-consumption,
   neo-state-2026-09-17, core-api-parity,
   landing-lib-tests, coverage-imports — id hits
   verified): sweep to id-grep-zero where the text
   asserts live truth. F-PUB-3's plural-shape campaign
   rows STAY (campaign record; rephrase only if an id
   hit forces it — if both can't hold, file back to
   captain, don't falsify).
4. F4 cheap-sweep attempt per Q-3-3: repo-wide grep for
   `packages/reference-core/…` links + bare
   `reference-core` prose; fix cheaply (notably PORTAL
   L42/L63, VARIANTS §§1-2, JANK locations, the three
   arch maps). Anything needing a rewrite stays as
   accepted residue (captain landing call).
5. Fixture-path prose: `docs/RELEASE.md:38`
   (`fixtures/*` → `matrix/fixtures/*`),
   `docs/REFERENCE_UI.md:32` (fixtures row), plus
   DOCREFS hits (PRIVATE TOKENS.md, VARIANTS.md,
   mcp-default-project.md, CHAIN_REPORT.md). Verify
   `docs/perf/waves/wave-2/report-swarm-hashers.md:67`
   refers to the styletrace-local `fixtures/sync-root`
   (unaffected) and leave it; leave lib's Cosmos
   `fixtures/` prose (unrelated local dir).
6. R-MDL-1 (lib ui.config.ts:5 "Uses reference-core…")
   is NOT R-prose: Obj-5 owned, stays. (Prose-only, no
   ordered-pattern hit — grep-zero-safe.)

**R-clean — dead code.** Files: named only.
1. R-MR-4: DELETE `pipeline/src/testing/matrix/
   setup-metrics.ts` + `setup-metrics.test.ts` (zero
   consumers re-verified first). Parses `ref →` output
   — doubly dead post-cutover.
2. Nested `packages/reference-icons/pnpm-lock.yaml`
   (stale May-8 standalone shape) per Q-3-11 (default:
   verify no consumer → delete).
3. Webpack5 template + strategy code per Q-3-10
   (default: LEAVE dormant — explicit M-runner
   acceptance stands; zero consumers post-Phase-3).
4. Retired-mode pre-screen per Q-3-12 (default: LEAVE
   as tested hardening once R-MR-2 self-resolves).

**R-golden — landing-tree golden consistency.** Skills:
`agent-rs` + `agent-neo`. Files: pinned goldens only
(scan-goldens pin; harvest-census pin only if drift).
1. F-PUB-1: rebuild the RS NAPI binary on the final
   tree (`agentrs b`), run `scan-goldens.test.ts`
   (`packages/reference-neo/src/fragments/base/`):
   verify the new output == axis intent (canon aliases
   only — diff the mechanism, don't eyeball), then
   REGEN the pin per Q-3-5. (One commit ⇒ "their
   landing updates it" means THIS landing; pubshape was
   rightly refused the fix, R-golden owns it.)
2. Harvest-census re-verify (axis census-note:
   `atomic/src/runtime/tables/tests.rs` — pin absorbs
   +72/+9 in-flight drift beyond the +42; re-verify on
   the landing tree, re-pin only to intended output).
3. Gates: `agentrs c/v` for canon/atomic/typegen/
   styletrace green (virtualrs excluded per Q-3-6);
   `agentneo q` on touched pins.

**Reviewers + captain — proof + landing (§4–§6).**
Consolidated scoped battery, Dagger hermetic runs,
one-coverage-home check, firsthand re-runs, ONE commit.

**Explicitly NOT Phase 3** (no crew, no freelancing):
pipeline→matrix/pipeline move (DO NOT MOVE stands —
purity condition fails: matrix-pure ONLY
`src/testing/matrix/` + templates; ship/dev/release/
general dirs + external consumers; M-docs-prose DIST.md
reconfirm; MAP-accepted); T8 PORT (after H4 settle,
future); D17 layers work; Leg A typegen (filed gap);
F-AXIS-1/2/3 + F-AXIS-4 (parked, Q-3-7);
recipe-classname implementation (parked, Q-3-7);
NEED-EXPORTS additions (Q3 default stands, Q-3-8);
R-MDL-1 (Obj-5); F-PUB-3 rows (campaign record).

### §2 — Carried states (all residuals, owned)

- **Leg A OPEN (filed engine gap)**: css() narrow-CssStyles
  typegen gap — exactly 4 docs tsc TS2353s (DocSidebar
  display + fontWeight, ThemeToggle flex, mdx
  textDecoration). Every excess prop is a LIVE sheet rule
  (runtime oracle verified) ⇒ docs-side fix = visual
  change ⇒ refused; needs neo typegen widening (future
  objective). Landing posture: tsc red-at-exactly-4,
  zero-new (Q-3-4).
- **Leg B CLOSED**: 9 ref errors via 1-file
  annotation-only conformance (mdxComponents.tsx,
  contravariance holds).
- **Leg C CLOSED**: axis-shorthands 4/4 (canon aliases +
  atomic resolve + ATM-SHORT-12 + typegen keys + neo
  runtime test; single-declaration twin classes; oracle
  met — Leg C errors gone, docs 16→4).
- **R-MR-1 (carried, blocks nothing)**: T2/T8 ui.config
  `layers:` TS2353 + TS5097 `.ts`-noise via the F1
  paths entries. Durable fix = D17 layers surface + neo
  exports entries (NEED-EXPORTS-class, Q-3-8 — NOT Phase
  3). Nothing typechecks kept ui.config post-deletion
  (runner phase deleted); runtime bundles by absolute
  path. R2 gives the F1 entries mechanical depth
  updates only.
- **R-MR-2 (self-resolves)**: retired-mode throw on
  matrix/watch until R2 deletes the suite; filtered runs
  already green via the pre-screen.
- **R-MR-3 (accepted pre-existing, RS frozen)**: pipeline
  tsc 6× TS2835 in RS native-contract territory +
  1 rust-compat unit fail (both files HEAD-identical).
  Gate = same-reds, zero-new.
- **R-MR-4 → R-clean** (setup-metrics delete, §1).
- **R-MR-5 RESOLVED**: react-stub → bootstrap-alias →
  pubshape chain closed; 7/7 smokes green with adoption
  verified (meta sheet vars + fragment republish; docs
  silently-dropped lib tokens healed as a side effect).
- **R-MICONS-1 CLOSED**: createRoot pass-through deleted
  (core react-only contract restored); 37 worlds +
  playground on direct react-dom/client; icons dist
  imports clean (3857 exports); portal/island cases
  green; NEO-REF 26/26 held. Phase 3 re-proves on
  post-regen real links (§5.6).
- **R-MDL-1 → Obj-5** (lib ui.config.ts:5 comment word;
  prose, grep-zero-safe, stays).
- **R-MDL-2 → Leg A filed** (conformance ruled, B closed,
  C closed, A parked; core `ref sync` for docs MOOT —
  core dies, docs syncs via neo).
- **F-PUB-1 → R-golden** (scan-goldens red = sibling
  axis binary rebuild; regen on the landing tree, §1).
- **F-PUB-2 (accepted, no gate)**: docs paint may shift
  where lib tokens now resolve — no docs visual gate
  exists; flagged, not chased.
- **F-PUB-3 (stays)**: PLAN.md plural-shape campaign
  rows — campaign record per P1 precedent; R-prose
  preserves (§1).
- **Axis FINDING → Q-3-6**: virtualrs 10/17 red
  pre-existing (semicolon printer drift, zero canon
  linkage) — owner needed, excluded from gate
  (pending ruling).
- **Axis census-note → R-golden** (re-verify pin on the
  landing tree, §1).
- **NEED-EXPORTS-class**: zero filings outstanding —
  M-mcp proved alias+paths sufficient (F1 gate held, no
  neo exports added); R-MR-1's durable fix is the only
  member and is explicitly NOT Phase 3 (Q-3-8). The
  class stays closed; R2/R1 add no exports entries.
- **Dangling core paths → R-prose attempt + Q-3-3**
  (policy-4 leftovers: PORTAL L42/L63, VARIANTS §§1-2,
  JANK locations, 3 arch maps + any
  `packages/reference-core/…` links).
- **Recipe outcome**: investigation DONE (read-only) —
  true-optional = LARGE (HQ hunch refuted), cheap wins
  SMALL each, no transport channel exists (dev-loud
  miss is load-bearing for any optionality), exact
  sites + test inventory filed. No Obj-2 implementation
  (Q-3-7).
- **Shorthands outcome**: axis DONE + accepted (oracle
  met, both gates green); F-AXIS-1/2/3 + F-AXIS-4
  parked (Q-3-7; F-AXIS-2's borderX refusal is PINNED —
  moving it later needs HQ approval).
- **T2/T8 layers-permanence (H3)**: T2/T8 stay the SOLE
  layers provers until D17; dropped tiers' layers legs
  (T3/T9/T10/T12/T13) + hybrid both-buckets + T5-new
  have no Neo home yet — explicitly held, not dropped
  (§6 notes the homing). Extends legs STAY in kept
  tiers over packed packages (HQ's extends note —
  packed-boundary extends stays proven while Neo
  carries breadth) — Q-3-2 confirms, no slimming crew.
- **T8-policy (H4)**: default coded allow-and-document
  stands; policy CONTENT untouched (M-runner import-line
  only). Settle-then-PORT is future work (needs
  compiler/HQ decision) — no T8 PORT in Phase 3 (Q-3-2).

### §3 — Sequence + dependencies

0. **Rulings first**: Q-3-1…Q-3-15 (§7) before
   implementers start. Q4 (styletrace home) and Q-3-2
   (kept shape) are the hard gates — R2 cannot move
   without them.
1. **Wave 1 (parallel, disjoint)**: R1-delete (core dir)
   ∥ R2 (all deletes + moves + depth + discovery) ∥
   R-prose ∥ R-clean ∥ R-golden. Install discipline:
   ONLY R1 installs, and only in step 2 — everyone
   else reads the log for the regen announcement.
2. **R1 globs + regen** (after R1-delete + R2-moves
   complete; R-prose/R-clean/R-golden need not have
   finished — none changes package shape). Then R1's
   zero-census + bins proof.
3. **Scoped-gate battery** (§5.4–5.14): crews prove own
   edits first, reviewers consolidate.
4. **Hermetic proof** (§4): Dagger T2 + T8 + mcp. Gates
   on steps 1–3 (kept suites must be moved, retargeted,
   installed, and scoped-green before containers run).
5. **One-coverage-home check** (§6) + **icons/docs
   migrated proof** (§5.6–5.8 consolidated).
6. **Captain firsthand re-runs** (decisive suites) +
   footprint review → **ONE commit** (Obj-2 landing law).

What must land before the hermetic proof: all Wave-1
edits, R1 regen, golden consistency (R-golden), and the
scoped battery green — containers never run on a tree
with known-red scoped gates.

### §4 — Hermetic proof coverage (Dagger, objective-ordered)

CORRECTION (accepted-verdict wins): there are NO kept
distro/watch suites — install-dim released both fully
and Phase 1's P2 acceptance + CLI-watch closed their
native homes. "Kept distro/watch green in Dagger" is
void; their proof is (a) NEO-CLI-01 (4 one-shot legs) +
NEO-CLI-02 (resident --watch flag path) + NEO-WATCH-01
(4-leg paint loop) + SYNC-14 green natively, and (b)
both suite dirs absent from the tree. The hermetic proof
runs exactly the kept gate (names unchanged by moves):
- `@matrix/chain-t2` — sole `layers:` prover + packed
  fixtures + staged-registry install + virgin-container
  setup (the install-space framing: "someone else's
  base system" over REAL packed artifacts).
- `@matrix/chain-t8` — policy proof over the same
  packed boundary (content untouched per H4).
- `@matrix/mcp` (all 19 files) — the whole standard
  against the shipped artifact (bin + dist layout,
  virgin-registry resolution, packed-boundary
  `_private` legs over `@fixtures/extend-library`).
Each green via `pnpm agent test --packages=<pkg>`
(canonical fallback `pnpm pipeline test
--packages=<pkg>`). Per VOYAGE ground law this is THE
objective-ordered proof run — no other matrix/Dagger
runs exist in Phase 3 (no theater). Plus: the
one-coverage-home check (§6) and the icons/docs
migrated proof (§5.6–5.8: real-link build/import/type
chain + docs build/serve + tsc-at-4).

### §5 — Landing-gate definition (ALL green before the commit)

Hermetic (Dagger): (1) `@matrix/chain-t2` green.
(2) `@matrix/chain-t8` green. (3) `@matrix/mcp` green,
all 19 files.
Scoped native: (4) pipeline units 177/178 with the
SAME 1 pre-existing RS-contract fail (zero-new).
(5) pipeline tsc exactly the 6 pre-existing TS2835 in
untouched RS native-contract territory (zero in-scope).
(6) icons (post-regen REAL links — first proof without
the hand harness): build exit 0 + dist import 3857
exports + requiredFiles payloads + /tmp neutral-dir
published-type-chain probe clean. (7) fixtures 7/7
`pnpm sync` green post-move + meta adoption spot (sheet
vars + fragment republish). (8) docs full build exit 0
(R-MICONS-1 fallout gone) + serve HTTP 200 + tsc
EXACTLY the 4 Leg A errors (zero-new vs accepted).
(9) mcp post-regen: typecheck clean + vitest 89/89 +
tsup green + packed layout ships neo-author (esbuild
real, no symlink). (10) neo: REF 26/26 + CHAIN 6/6 +
CLI-01 + CLI-02 + WATCH-01 + SYNC-03 + LAYER-02 +
SYNC-12 + package tsc clean + q clean on touched.
(11) RS: `agentrs c/v styletrace` green post-move
(reader paths) + canon/atomic/typegen suites green.
(12) scan-goldens green + harvest-census re-verified
(R-golden). (13) discovery/workspace enumeration green
on the new tree (updated unit tests) + unfiltered
discovery no longer throws (R-MR-2 resolved).
(14) run.mjs spec-finder resolution probe on a kept
suite (R2 demonstrates, captain confirms).
Static: (15) zero `@reference-ui/core` code importers +
zero live `ref sync`/`ref build` refs, EXCEPT the
allowed list: BOOK's 3 `(removed with core)`-glossed
referenceVite + 2 shouldDeferHotUpdate notes,
REFERENCE_UI's 4 `ref mcp` history lines (no neo verb),
the release-contract `core→false` pin (+ its sort
expectation), inert `core` test-literal names M-runner
left in release/registry/build/materialize tests,
R-MDL-1's prose word (Obj-5), archive/ + CHANGELOGs +
forensics + typegen SPEC + virtualrs doc comment
(frozen history), LOGs. R1 files the actual residual
list; captain diffs it against this list. (16) `pnpm
install` clean post-regen; `neo` shims present in all
moved fixtures + docs + kept suites. (17) footprint =
intended files only; index clean until the captain
commits.
ACCEPTED REDS (not gates, all filed): docs tsc 4 Leg A
(Q-3-4); virtualrs 10/17 (Q-3-6); R-MR-3 reds;
13 pre-existing world/playground gate errors
(HEAD-proven, owners elsewhere); R-MR-1 layers TS2353
(blocks nothing); F-PUB-2 (no gate exists); R-MICONS-1
stays closed (re-proven in (6), not re-litigated).

### §6 — One-coverage-home final table (reviewers check)

PORTs (Neo id + matrix file deleted in the same
commit): CHAIN-01←T6 (+T10-extends subset);
CHAIN-02←T7 (+T12-extends subset); CHAIN-03←T11
(+T13-extends identical); CHAIN-04←T9-extends +
prelude-extends-half (topology = untouched T4);
CHAIN-05←new depth-3 (CHAIN_REPORT §4.3);
CHAIN-06←real-sync extends regression (shape-drift
pin); SYNC-10←T1-extends + T3-extends (single-hop
subsets, pre-existing); CLI-01←distro L280-446
(idempotent/stale-rewrite/SIGTERM/clean legs;
virtual-mirror L288-358 retired, L440 skip stays
skipped, types with TYPE); CLI-02←bin `--watch` flag
path (no matrix source — closes the native gap);
WATCH-01 + SYNC-14←watch-contract all 3 tests (paint
legs + node-side split; webpack leg retired per
H5/R4); PRIM-13←primitives L247; CSS-15←css L277-302;
COND-18←css-selectors L65-75; PRIM-14←color-mode
L96-112 (panda spelling NOT ported); RESP-10←responsive
viewport-contract whole file; PRIM-15←spacing L143-175
(box.d.ts NOT ported); RECIPE-12←recipe L265-274
(conjunction, carried). DECLINED with reason:
typescript strict-wrapper (no Neo `strict` surface;
TYPE-02 equivalent), T5-new (layers, H3).
DROPs (pre-existing home cited from the map):
recipe/primitives/system/tokens rests (RECIPE/PRIM/
SYNC/CSS/TOKEN/RESP/MERGE/PARITY ids in MAP B);
reference both files → NEO-REF 26/26 (H1 resolved by
Obj-1 landing; stale-shape assertions die with the
suite); system panda-theme spellings NOT ported
(recorded divergence); css/css-selectors/color-mode/
font/responsive/spacing rests (map A2 ids); distro
rest (SYNC/TYPE ids) + generated-output DROP*;
session all 3 (sidecar retired, no home); typescript
(TYPE-01..04); virtual all (no-mirror design);
playwright both (SYNC-01/SMOKE-01/PLAY-B-01).
KEEPS (matrix file stays): T2 e2e (sole layers
prover; →PORT after D17); T8 e2e (policy proof;
→PORT after H4 settle); mcp ×19 (permanent,
installed-artifact standard). Dropped tiers' layers
legs (T3/T9/T10/T12/T13) + hybrid both-buckets stay
homed at T2/T8 until D17 — behavior covered, not
assertion-identical (P1 filed, H3).
DROP* (no home needed, retired-by-design, H6):
virtual-mirror legs, Panda pins/chrome, box.d.ts,
pattern-pack surface, session sidecar, playwright
self-test, distro generated-output, virtual-output
pins, `strict`/`mcp`-config spellings where retired.
Check procedure (MAP reviewers' plan, still binding):
grep matrix for residual assertions of ported/dropped
behavior — zero hits or the commit doesn't land;
every PORT row shows Neo id + deleted matrix file;
every DROP row shows the pre-existing home; every
KEEP row shows the file.

### §7 — Open questions needing ruling BEFORE implementers start

HQ (2): **Q-3-1 (Q4, hard gate for R2)** — styletrace
home: (a) plain dirs under
`modules/styletrace/test-fixtures/` (RECOMMENDED —
readers need src only; delete the 4 package.jsons +
atlas/demo-ui tsconfigs + atlas ui.config.ts so atlas's
core refs die with the scaffolding; rewrite atlas→
demo-ui + consumer→library imports to relative) vs
(b) workspace packages under a new home (+ glob).
Confirm RS accepts the new home either way.
**Q-3-7 (parked-work confirm)** — F-AXIS-1/2/3 +
F-AXIS-4 + recipe-classname implementation all parked
as VOYAGE follow-ups, none in Phase 3? (Note: F-AXIS-2's
borderX refusal is test-PINNED — moving it later needs
HQ approval, filed.)
Captain (13): **Q-3-2 (hard gate for R2)** — confirm
T2/T8 keep extends legs over packed packages + layers-
permanence until D17; NO slimming, NO T8 PORT in Phase
3 (H4 default stands). **Q-3-3** — F4: R-prose attempts
the cheap link sweep, unfixable stays as accepted
residue (landing confirm)? (RECOMMENDED yes.)
**Q-3-4** — docs-tsc-red-at-exactly-4 lands as the filed
Leg A typegen gap (build must be green)? (RECOMMENDED
yes.) **Q-3-5** — R-golden owns scan-goldens regen on
the landing tree (verify-then-regen) + harvest-census
re-verify? (RECOMMENDED yes — one commit, no separate
"their landing".) **Q-3-6** — virtualrs 10/17 excluded
from the gate + follow-up owner? (RECOMMENDED exclude.)
**Q-3-8** — NEED-EXPORTS-class stays closed in Phase 3
(no neo exports entries; R-MR-1 durable fix is future)?
(RECOMMENDED yes — Q3 default stands.) **Q-3-9** —
confirm DO NOT MOVE stands (settled, no re-litigation)?
**Q-3-10** — webpack5 template: leave dormant
(RECOMMENDED — M-runner acceptance stands) vs delete?
**Q-3-11** — nested icons pnpm-lock: verify-then-delete
(RECOMMENDED) vs leave? **Q-3-12** — retired-mode
pre-screen: leave as tested hardening (RECOMMENDED) vs
remove with its test? **Q-3-13** — matrix planning docs
(PROMPT/COVERAGE_EXTRA/TEST_MIGRATION): sweep lists,
delete only with zero citations + landing nod
(RECOMMENDED)? **Q-3-14** — docs.yml: drop core path,
add neo path (RECOMMENDED)? **Q-3-15** — confirm
@matrix/* names unchanged by moves (hermetic commands
stay `@matrix/chain-t2` etc.)?

PHASE-3-MAP DONE (cartographer, 2026-09-23). Map covers:
§1 every action in 5 disjoint owner-crews + reviewers
(R1 delete/globs/regen/census; R2 deletes/moves/depth/
discovery/Q4; R-prose F1/F2/F3/F4 + matrix docs +
fixture-path prose; R-clean setup-metrics + ruled dead
code; R-golden scan-goldens + census; pipeline move
explicitly excluded with evidence); §2 all carried
states (Leg A open/B+C closed, R-MR-1..5, R-MICONS-1
closed, R-MDL-1/2, F-PUB-1/2/3 + axis findings,
NEED-EXPORTS closed, dangling paths, recipe + shorthands
outcomes, H3/H4 permanence); §3 sequence (rulings →
Wave 1 → regen → scoped battery → hermetic → home-check
→ one commit); §4 hermetic coverage (T2+T8+mcp; distro/
watch correction filed); §5 exact landing gate (17
items + allowed-residual list + accepted reds); §6
final home table; §7 15 ruling questions (2 HQ, 13
captain). READ-ONLY held: this section is the crew's
sole write; no commits, index untouched.

## Phase-3 captain rulings (captain, 2026-09-23)

Map accepted (§1-§6 stand as filed). ALL 13 captain
questions ruled per cartographer recommendation: Q-3-2
YES (T2/T8 keep packed extends legs, layers-permanence
to D17, no slimming, no T8 PORT); Q-3-3 YES (cheap link
sweep, residue accepted at landing); Q-3-4 YES
(docs-tsc-at-4 lands as filed Leg A, build green);
Q-3-5 YES (R-golden owns verify-then-regen);
Q-3-6 YES (virtualrs excluded, filed as follow-up for
HQ to staff); Q-3-8 YES (NEED-EXPORTS stays closed);
Q-3-9 YES (DO NOT MOVE stands, settled); Q-3-10 LEAVE
dormant; Q-3-11 verify-then-delete; Q-3-12 LEAVE
hardening; Q-3-13 sweep, delete only zero-cited +
landing nod; Q-3-14 YES (docs.yml core→neo); Q-3-15 YES
(names unchanged). Wave 1 dispatched: R1 / R-prose /
R-clean / R-golden. R2 HELD for HQ Q-3-1 (Q4 home).
Q-3-7 (parked-work confirm) to HQ alongside — gates
nothing.

## R-prose (crew, 2026-09-23) — WORKING

Scope (strict): Phase-3-map §1 R-prose items 1–6 ONLY
(root README F1; matrix docs F2; neo PLAN.md + evidence F3;
F4 cheap link sweep; fixture-path prose item 5). R-MDL-1 is
NOT mine (Obj-5). Prose files only — no code, no configs.
Never commit, never touch the index. Sweep policy:
swap id→neo / ref→neo where true, drop/rephrase where swap
would lie, never falsify. Rulings read: Q-3-3 YES
(cheap-sweep, residue accepted at landing), Q-3-13 (sweep
lists; delete only with zero live citations + landing nod).

### Recon (read-only, firsthand)

- Root README: 2 id hits (L10/L49) + `ref`-CLI section +
  `packages/reference-core` row/link + `fixtures/*` row +
  command block naming scripts absent from root
  `package.json` (`build`, `test`, `test:core`,
  `test:e2e` gone; `test:rust` is `test:rs`; `dev` is a
  docs/lib router). `packages/reference-neo/README.md`
  exists (link target). mcp bins verified
  (`mcp`/`reference-mcp`/`ref-mcp`).
- Matrix docs: TEST_COVERAGE 501 lines / 6 id hits (REWRITE
  per order); CHAIN/CHAIN_RULES carry no tier-path links
  (note-only sweep); CHAIN_REPORT carries tier + fixture
  paths (retarget kept, mark dropped historical).
  Citation census: PROMPT.md + COVERAGE_EXTRA.md ZERO
  live citations (delete-eligible, nod pending —
  sweep + file, no delete); TEST_MIGRATION.md cited by
  `docs/FEATURES/DATA_THEME.md:331` (live) → sweep only.
- F3: PLAN.md 1 id hit (L43 boundary rule — the name IS
  the rule, keep) + campaign-record lines (D20, RS-4,
  SYNC-03, frozen-contracts, working rules — F-PUB-3
  STAYs + voyage history, keep). All 6 evidence files
  are dated probe/recon reports (Sep 16–18) — the core
  mentions are probe-record content, not live truth.
- F4 census: named-file cheap fixes verified firsthand
  (Neo `splitPrimitiveProps`/`resolveVariantAttr`/
  `variant?: unknown` for VARIANTS; NEO-SYNC-17 spec for
  PRIVATE TOKENS boundary; mcp `tokens.test.ts` exists;
  `project-context.ts:53` already says `neo sync`).
  Out-of-named-scope core-path files (VITE, RESPONSIVE,
  STRICT_TOKENS, DATA_THEME, TYPES, LAYERS, CORE,
  missions, wave reports) → residue list, no edits.
- Item 5: RELEASE L38 + REFERENCE_UI L32 swap clean;
  PRIVATE TOKENS L79 `@fixtures/*` name preserved
  (no-op); VARIANTS L323 is lib-Cosmos prose (leave);
  mcp-default-project paths Q-3-1-blocked (R2 HELD —
  file, don't guess); wave-2 :67 verified styletrace-local
  (`fixtures/sync-root` in the styletrace native-failure
  context — left); `matrix:setup` absent from root
  scripts, true command is `pnpm pipeline setup --sync`
  (`pipeline/src/cli.ts:104-115`).

### Edits (16 prose files, scope-held)

- F1 root README: L9 package→neo, L10 id→neo,
  L13→`matrix/fixtures/*`, L14→`matrix/tests/`, command
  block rewritten to real root scripts (verified vs
  `package.json`, `scripts/dev.mjs`, lib `dev`),
  L46-50 `neo`/`mcp` CLI lines (mcp bins verified),
  L62 link→neo README (exists).
- F2 TEST_COVERAGE.md REWRITE (~110 lines): kept gate
  (T2/T8/mcp + hermetic commands) + PORT/DROP/DROP*
  home tables transcribed from §6 + check procedure.
- F2 sweeps: matrix README (kept-gate snapshot,
  `pipeline setup --sync`, `neo sync`); CHAIN +
  CHAIN_RULES cutover notes (no tier-path links in
  either); CHAIN_REPORT note + kept-path retargets
  (T8, fixtures) + dropped marked historical;
  PROMPT / COVERAGE_EXTRA / TEST_MIGRATION
  historical notes (bodies untouched).
- F3: ZERO edits (finding): PLAN.md L43 is the live
  boundary rule (the name IS the rule); D20/RS-4/
  SYNC-03/frozen-contracts/L455/L1049/L1137 are
  campaign record (F-PUB-3 STAYs + voyage working
  rules); all 6 evidence hits are dated probe/recon
  reports (Sep 16–18) where the core mention is the
  probe content. Sweeping any of them falsifies.
- F4 cheap fixes: PORTAL L42 (dropped dead pointer,
  claim stands) + L63 (→neo compiler, true per §2.1
  header); VARIANTS §§1-2 remapped to verified Neo
  shape (`split.ts` extract, `context.ts`
  `resolveVariantAttr`, `variant?: unknown`,
  no `VariantProps` — all firsthand); PRIVATE TOKENS
  L72→SYNC-17 (spec verified: nested strip +
  preserve + provenance/types pins), L75→mcp package
  path (file exists, 89/89 green), L78→`matrix/tests/`
  path, L82-88 T1 bullet→SYNC-17 runtime pins
  (map: T1 DROP via SYNC-10/17); BOOK L156/L247
  delinked (glosses kept, §5.15-safe);
  REFERENCE_UI L27 rephrased to neo truth (swap
  alone would lie — neo owns no virtual FS /
  plugins / MCP).
- Item 5: RELEASE L38 + REFERENCE_UI L32/L33
  (`matrix/fixtures/*`, `matrix/tests/*`);
  mcp-default-project L22→`neo sync` (code at
  `project-context.ts:53` verified); PRIVATE TOKENS
  L79 no-op (`@fixtures/*` names preserved);
  VARIANTS L323 + wave-2 :67 + lib Cosmos left
  (verified unrelated/local).

### Proofs

- Edited-file grep for `@reference-ui/core`:
  ZERO hits. `ref sync`/`ref build`: only the two
  disclosed historical notes/bodies (CHAIN_REPORT,
  TEST_MIGRATION). `referenceVite`: only BOOK's 3
  §5.15-allowed glosses (delinked). VARIANTS §§1-2:
  zero core refs.
- `git status` footprint = exactly the 16 files +
  this log; `git diff --cached --name-only` holds
  ONLY siblings' staged deletes (R1 core rm +
  R-clean setup-metrics/nested lock) — zero of my
  files staged; I never touched the index, never
  committed, no code/configs touched.

## R-PROSE DONE (crew, 2026-09-23)

16 prose files swept per §1 R-prose items 1–5 (item 6
R-MDL-1 untouched, Obj-5). F3 correctly yields zero
edits (boundary rule + probe records + F-PUB-3 STAYs).

### Accepted-residue list (for the landing call)

- R1 (arch maps): REFERENCE_UI.md ~50 core
  paths/mechanism lines, JANK.md ~15 bug locations,
  Architecture.md + STRUCTURE.md core trees — all
  under their cutover notes; remap = rewrite.
- R2 (VARIANTS remainder): §3 registry
  (`PrimitiveVariantRegistry` has NO Neo
  counterpart — grep clean), Phase-1 core file
  steps, Tier 2–5 + Phase 2–3 deleted-suite refs
  (`matrix/primitives|system|typescript|chain/T1|T6`).
- R3 (PORTAL remainder): L106/L232/L328
  `matrix/color-mode` refs (suite deleted; outside
  the ordered patterns — needs an owner or accept).
- R4 (unnamed core-path docs, untouched per
  scope): VITE.md, RESPONSIVE.md, STRICT_TOKENS.md,
  DATA_THEME.md, TYPES.md, LAYERS.md, CORE.md,
  missions/operation-jettison.md,
  missions/completed/operation-forge.md,
  perf/wave-4/integrate-intmcp.md.
- R5 (Q-3-1-blocked): mcp-default-project.md
  L12/L20/L21 atlas paths — R2 HELD for HQ's home
  ruling; prose follows the ruling, not precedes it.
- R6 (Q-3-13 deletes, zero citations, NEED LANDING
  NOD): `matrix/PROMPT.md`, `matrix/COVERAGE_EXTRA.md`
  — recommend delete at landing. TEST_MIGRATION.md
  STAYS (live citation DATA_THEME.md:331).
- R7 (observed, not mine):
  `matrix/chain/T8/tests/e2e/T8-contract.spec.ts:31`
  comment names reference-core (kept-suite code;
  R1's census owns it).

## R1 (crew, 2026-09-23) — WORKING

Scope (strict): `packages/reference-core/` delete +
`pnpm-workspace.yaml` globs + `pnpm-lock.yaml` regen +
`.github/workflows/docs.yml` trigger swap +
zero-census. Phase-3-map §1 R1 + §5 items 15/16/17 +
captain's rulings (Q-3-14 YES) read in full. Never
commit, never `git add`, never touch another session's
files. This crew alone installs (shared-file
discipline). Two-phase: delete + docs.yml now, then
AWAIT THE CAPTAIN'S GO for globs + regen (after
R2-moves-complete).

### R1 phase 1 — delete + docs.yml (crew, 2026-09-23)

- `git rm -r packages/reference-core/`: 517 tracked files
  staged deleted (43257 deletions), verified the ONLY
  staged paths in the index (`git diff --cached
  --name-only` shows zero non-core entries). Leftover
  ignored build output (node_modules, dist,
  .reference-ui, .ref, generated src/system/styled +
  src/reference) removed explicitly via `rm -rf` on
  that one dir — zero untracked non-ignored entries
  existed. `packages/` now 6 dirs + target/.
- `docs.yml`: `- packages/reference-core/**` removed,
  `- packages/reference-neo/**` added (Q-3-14 YES) —
  working-tree edit ONLY, unstaged (no `git add`).
- Untouched as ordered: `pnpm-workspace.yaml` (old
  globs intact for R2's moves), `pnpm-lock.yaml` (its
  `M` flag is a sibling session's pre-existing
  install, not mine — no install run by this crew
  yet), every other session's file.

## R1-DELETE-COMPLETE (crew, 2026-09-23)

Phase 1 done: core dir deleted (staged), docs.yml
swapped (unstaged). Index discipline held, nothing
committed. HELD for the captain's GO: workspace globs
+ full `pnpm install` regen + clean-resolve verify +
neo-shim presence + zero-census (§5 items 15/16/17)
run ONLY after R2-moves-complete is announced.

## R-golden (crew, 2026-09-23) — WORKING

Scope (strict): pinned goldens ONLY — scan-goldens pin regen
(F-PUB-1) + harvest-census re-verify (axis census-note).
No compiler logic changes. Skills `agent-rs` + `agent-neo`
loaded first; Phase-3-map §1 R-golden (items 1-3) + §5 item
12 + captain's rulings Q-3-5 (YES verify-then-regen) /
Q-3-6 (virtualrs excluded) read in full. Never commit,
never touch the index, never touch another session's
files. Final DONE only after R1-REGEN-COMPLETE.

## R1 phase-1 verified (captain, 2026-09-23)

R1-DELETE-COMPLETE verified firsthand: 517 staged
paths, ALL under packages/reference-core/ (zero
stray staging); docs.yml core→neo trigger swap
correct. R1's run ended at the gate (result_ready),
so phase 2 (globs + regen + zero-census) will be a
fresh dispatch once R2 moves complete. Note: the
staged delete is the ordered mechanism — §5.17's
"index clean" means no STRAY staging, and this
isn't stray; the landing commit takes the tree whole.
Still awaiting HQ Q-3-1 (R2 dispatch) + Q-3-7.

## R-clean (crew, 2026-09-23) — WORKING

Scope (strict): Phase-3-map §1 R-clean items 1-4 ONLY +
captain's rulings Q-3-10 (LEAVE dormant), Q-3-11
(verify-then-delete), Q-3-12 (LEAVE hardening) read in
full. Named files only — no freelancing. Never commit,
never touch the index beyond the ordered deletes, never
touch another session's files.

### Item 1 — setup-metrics.ts + test: VERIFIED ZERO, DELETED

- Pre-delete census (firsthand): `setup-metrics` hits
  outside the two files = LOG-2.md prose only; exported
  symbols (`parseRefSyncSetupMilestones`,
  `formatRefSyncSetupMilestoneSummary`,
  `MatrixSetupMilestone`) = ZERO hits outside the two
  files (logs excluded). M-runner's R-MR-4 reconfirmed.
- Doubly-dead content confirmed by read: parses `ref →`
  sync output (L10 prefix pattern) incl. Panda/virtual
  milestone spellings — dead binary + dead shapes.
- Acted: `git rm` both files (ordered deletes, staged).
- Post-delete proof: pipeline units 176/175/1 — exactly
  the M-runner baseline (178/177/1) minus the 2 removed
  tests, same single pre-existing RS-contract fail
  (`build/rust/compatibility.test.ts`, R-MR-3, frozen,
  untouched). Pipeline tsc = exactly the 6 pre-existing
  TS2835 in RS native-contract territory, zero
  in-scope. Residual greps re-run: zero hits.

### Item 2 — nested icons pnpm-lock: VERIFIED NO CONSUMER, DELETED

- Shape (firsthand): 1443 lines, single importer `.`
  (standalone, May-8 bootstrap commit, untouched
  since) — the ONLY nested pnpm-lock in the repo (no
  other packages/*/matrix/*/fixtures/* hits).
- Consumer census (firsthand): zero references to the
  nested path repo-wide (logs excluded); no lockfile
  keys in pnpm-workspace.yaml or icons package.json;
  CI uses root `--frozen-lockfile` only (root lockfile
  is the sole install input in workspace mode). The
  two generic `pnpm-lock.yaml` code hits are not
  consumers of THIS file: materialize.ts:30 preserves
  the dev-workspace's own generated lock by name, and
  cache.ts:25 hashes the ROOT lockfile via a repo-root
  pathspec (the nested file only ever entered a
  content fingerprint through the generic package-dir
  pathspec — deletion just re-fingerprints, one
  rebuild, no semantic read).
- Acted: `git rm` the file (ordered delete, staged).

### Item 3 — webpack5 template + strategy: VERIFIED DORMANT, LEFT

- Kept gate matrix.json (T2/T8/mcp) read firsthand:
  ALL `bundlers: ["vite7"]` — zero webpack5.
- All 12 webpack5 declarers (color-mode, css, font,
  primitives, recipe, responsive, session, spacing,
  system, tokens, virtual, watch) are DROP-class on
  R2's §1 delete list → zero consumers post-Phase-3.
- Dormant code left untouched per Q-3-10: template
  (`managed/bundlers/webpack5/index.ts` +
  `webpack.config.cjs.liquid` + README) + strategy
  branches (`managed/bundlers/index.ts:11/:24/:49`,
  `managed/playwright/index.ts:23-29`,
  filename lists in `runner/consumer.ts:56/:184` +
  `setup/index.ts:40`, `knownMatrixBundlerStrategies`
  in `discovery/index.ts:17`). M-runner acceptance
  stands; no HQ override came.

### Item 4 — retired-mode pre-screen: VERIFIED, LEFT AS HARDENING

- Verified firsthand, untouched per Q-3-12:
  `discovery/index.ts:249-273` `shouldParseDir`
  pre-screen (filtered runs skip unselected suites'
  invalid configs) + the retired-mode rejection in
  `readMatrixPackageConfig` (:196-203, `watch-full`
  refused) + its test
  (`discovery/index.test.ts:63` "rejects the retired
  watch-full refSync mode") + the kept-gate filtered
  plan test (`runner/plan.test.ts:124-133`, comment
  cites the mid-migration retired watch suite).
- R-MR-2 self-resolves on R2's watch deletion (not my
  scope); the pre-screen stays as tested hardening
  after.

### Index + footprint

- Staged non-core paths = EXACTLY the 3 ordered
  deletes (520 staged total = R1's 517 + my 3 —
  R1's set untouched, zero stray staging).
- Footprint: 3 staged deletes + this log section.
  No other session's files touched, nothing
  committed, no installs (R1-only discipline held).

## R-clean DONE (crew, 2026-09-23)

R-clean DONE. Item 1 DELETED (verified zero consumers
+ suite/tsc proofs), item 2 DELETED (verified no
consumer), items 3-4 VERIFIED and LEFT per Q-3-10 /
Q-3-12. Named files only; index holds exactly the 3
ordered deletes atop R1's set.

## R-clean acceptance (captain, 2026-09-23)

R-CLEAN ACCEPTED. Verified firsthand: exactly the 3
ordered deletes staged (setup-metrics.ts + test,
nested icons lock), files gone from the tree, webpack5
template + retired-mode pre-screen left in place, zero
setup-metrics consumers, pipeline units 175/1 on my
own run — exactly the M-runner baseline minus the 2
removed tests, same single pre-existing RS fail.
GATE-NUMBER UPDATE: §5.4's "177/178 same-1-fail" is
now 175/176 same-1-fail post-delete; reviewers use
the new numbers. The crew's late find corroborates no
other nested lockfiles in the main tree (only other
sessions' worktrees, untouched per constraints).

### R-golden progress (crew, 2026-09-23) — regen done, awaiting R1

F-PUB-1 (scan-goldens): rebuilt the RS NAPI binary on the
current tree (`agentrs b` green), ran
`src/fragments/base/scan-goldens.test.ts` — red ONLY at
`runtimeSha` (L151) on the first scale; stylesheet sha,
bytes, portable sha, all scan goldens, and TS fidelity
passed before it. Mechanism diff (not eyeball): the new
runtime carries exactly the axis intent — `namer.aliases`
319 entries incl. marginX→marginInline, marginY→
marginBlock, paddingX→paddingInline, paddingY→
paddingBlock (the Panda-legacy logical mapping), and
`stylePropNames` 1393 sorted entries with the 4 at sorted
positions; zero axis strings anywhere else in the runtime
JSON. Reconstruction proof: stripping exactly those 8
entries reproduces the OLD pinned sha byte-exactly on all
4 scales (small/medium/enterprise/churn) ⇒ new output ==
old output + exactly the 4 canon aliases, zero other
drift. REGEN per Q-3-5: `runtimeSha` re-pinned in all 4
`scan-goldens.<scale>.json` fixtures (1 line each, the
only field moved — all other asserted fields verified
identical pre-write). Post-regen run: GREEN (all 4
scales, incl. ×3 determinism).

Harvest-census: `agentrs v
modules/atomic/tests/harvest-census.test.ts` 4/4 PASS on
the current tree; measured reactRaw/reactGzip 149593/32898
== the axis pin exactly — the in-flight +72/+9 the axis
crew flagged has settled into the pin with zero further
drift. Per map ("pin only if drift"): NO re-pin, pin
stands as intended output. (react.mjs publishes from
`result.runtime.stylePropNames`, the same artifact the
scan-goldens mechanism proof covers.)

Gates (all firsthand, this tree): `agentrs c` canon 58,
atomic 658, typegen 40, styletrace 49 — all green;
`agentrs v` canon 15/15, atomic 302/302 (13 files),
typegen 21/21, styletrace 28/28 — all green; virtualrs
not run (excluded per Q-3-6); `agentneo q` on the 4
touched pins → 0 errors, 0 warnings. Footprint: 4
fixture JSONs (1 line each) + this log; no compiler
logic touched; index untouched by this crew (staged
entries present are R1/R2's deletes, not mine);
nothing committed.

HELD FOR R1: final re-verify + DONE only after
R1-REGEN-COMPLETE lands in this log (no marker as of
this writing — the sole grep hit is the WORKING
sentence above). Re-verify then = `agentrs b` +
scan-goldens + harvest-census + the §1-item-3 gates.

## R-prose acceptance (captain, 2026-09-23)

R-PROSE ACCEPTED (roster still shows running; the log
is the durable channel and the work is complete +
verified). Verified firsthand: F1 root README zero
core-id hits; F2 TEST_COVERAGE rewritten to the kept
gate (T2/T8/mcp table + hermetic commands) and CHAIN
docs retargeted to matrix/tests/chain; F3 correctly
zero edits (PLAN.md + evidence untouched, F-PUB-3
campaign rows preserved); F4 cheap sweep held —
PORTAL hits exactly the filed L106/232/328 remainder;
R-MDL-1 untouched per scope (Obj-5). Residue R1-R7
accepted as filed: R1-R4 rewrite-grade (landing call),
R5 Q-3-1-blocked (prose follows the ruling), R6
PROMPT/COVERAGE_EXTRA delete NEEDS LANDING NOD (zero
citations; TEST_MIGRATION stays — live citation),
R7 kept-suite comment → R1's census.

## Health tick (captain, 2026-09-23)

Obj-1 COMPLETE (landed). Obj-2 Phase 3 Wave 1: R1
phase-1 verified + parked (fresh dispatch for phase 2
after R2 moves), R-prose ACCEPTED, R-clean ACCEPTED,
R-golden interim (regen complete, parked for R1 regen,
final verify = fresh dispatch), R2 HELD for HQ Q-3-1.
Objs 3/4/5 untouched, in order. Roster: 1 running
(rprose, DONE filed — exiting); all others result_ready.
Deadlock test: no stuck crews (parked crews are gated
by design, runs ended; nothing to interrupt). No HQ
park/stop. Blockers: HQ Q-3-1 (Q4 home → R2 dispatch)
+ Q-3-7 (parked-work nod, gates nothing). No commits
this tick (Obj-2 single landing commit far off).

## Q-3-1 ruled (c) + R2 / styletrace dispatched (captain, 2026-09-23)

HQ ruled Q-3-1 as NEITHER plain dirs NOR workspace
packages: the 4 styletrace fixtures become proper
CASES with IDs, consistent with repo case conventions
(station-style: id + input/output), plus a
consistency + coverage pass over all styletrace cases.
R2 dispatched with the Q4 move REMOVED (keeps only
the extend-library reader-path line in the 2 RS
readers); dedicated styletrace crew owns the 4
fixtures' conversion, the other 4 reader lines, the
atlas core-ref cleanup (dangling NOW post-delete),
and the R5 atlas-path prose lines. Line-level file
sharing on the 2 readers, disjoint lines. Both ride
the Obj-2 landing commit.

## Styletrace-cases (crew, 2026-09-23) — WORKING

Scope (strict): HQ Q-3-1 ruling (neither plain dirs nor
workspace packages) — the 4 non-chain fixtures become
proper CASES with IDs in module idiom + consistency and
coverage pass over styletrace testing. Skills: `agent-rs`
loaded first; styletrace README + ATM/VRT/ATL/TST case
shapes + Phase-3-map §1 R2-item-4 read in full. Never
commit, never install, index only for ordered moves/
deletes, never touch another session's files. Rides the
Obj-2 landing commit.

### Recon (read-only, firsthand)

- 4 fixtures verified at top level: `fixtures/
  styletrace-library` (pkg + 2 src), `fixtures/
  styletrace-consumer` (pkg + 1 src, imports the
  library), `fixtures/demo-ui` (pkg + tsconfig + 5
  src), `fixtures/atlas-project` (pkg + tsconfig +
  ui.config.ts + snapshot + 3 components + 3 pages).
- Station contract verified: `testing/runner.ts`
  (spec.id must equal folder; required README.md +
  spec.ts + input; output goldens) + styletrace
  `CASE_FOLDER` snake_case. ATM/VRT/ATL/TST all
  PREFIX-coded; styletrace's 16 are uniformly
  snake_case behavior-coded — internally consistent,
  so the 4 new IDs follow the module idiom (shape is
  the HQ bar: id + input/output + pins).
- Only physical-dir readers of the 4: the 2 RS
  readers (fixtures.test.ts ~L76-103, tracing.rs
  ~L166-213, five paths each incl. R2's
  extend-library). Atlas uses vendored copies +
  string literals only (helpers pin case inputs;
  react.rs/tests.rs are literal asserts). Matrix/
  pipeline/mcp: zero code consumers (mcp
  `.responses/` is write-only debug output,
  gitignored, asserts nothing).
- Atlas ui.config.ts imports `@reference-ui/core`
  (dangling post-R1-delete, dies with scaffolding);
  pages/ never traced by styletrace (atlas behavior;
  atlas vendored its own copies in ATL-SURF-01 etc).
- R2 in flight (staged deletes/moves incl.
  matrix/tests/mcp); readers' extend-library lines
  still old paths — re-verify before my reader edit.

### Plan (behavior-coded IDs, fixture origin in READMEs)

- `named_barrel` ← styletrace-library (named barrel
  re-export of a wrapper; [MyStyleComponent]).
- `named_barrel_package` ← styletrace-consumer
  (consumer re-exports + wraps a packaged barrel via
  mock `fixture-style-library`; twin of
  node_modules_wrapper/export_star_package).
- `plain_react_library` ← demo-ui (zero Reference
  imports, multi-file + barrel; []).
- `plain_react_wrappers` ← atlas src/components
  (forwarding chains ending at plain-React UI via
  mock `fixture-demo-ui`; []; pages/ + configs die).
- Readers: fixtures.test.ts drops my 4 tests (station
  suite picks them up); tracing.rs converts my 4 to
  `materialize_station` (same assertions). R2's
  extend-library lines untouched. R5 prose: 3 atlas
  paths to the new case home.

### Edits (all firsthand)

- 4 cases created (11 sources via `git mv`, 7 mock
  files + 4 spec + 4 README + 4 goldens + 2 mock
  package.jsons new): `named_barrel`,
  `named_barrel_package` (mock `fixture-style-library`
  with exports map; consumer import rewritten to the
  mock), `plain_react_library`,
  `plain_react_wrappers` (mock `fixture-demo-ui` with
  exports map; 3 component imports rewritten).
  Headers added to all inputs (origin + role).
- Scaffolding deleted (`git rm`, staged): 4
  package.jsons, 2 tsconfigs, atlas ui.config.ts
  (dangling core defineConfig — dead), 3 atlas pages
  (never traced; atlas vendored its own), plus
  `rm -rf` of ignored node_modules × 4 + atlas
  `.reference-ui` + emptied src dirs; 4 dirs gone,
  `fixtures/` left empty for R2/R1 (not mine).
- Readers: fixtures.test.ts minus my 4 tests (7
  left); tracing.rs 4 tests converted to
  `materialize_station` with `station_` names (same
  assertions). R2's extend-library lines verified
  byte-intact after (their 1-line-per-file diff
  landed mid-flight; sharing held).
- Consistency: 11 goldens normalized to the writer's
  canonical pretty format via `--update-goldens`
  (value/order-identical, verified by diff; second
  update run = zero drift). All 20 cases audited:
  id == folder (suite-enforced), input/ + spec.ts +
  README (title == id, verified) + canonical
  output/components.json.
- R5 prose: mcp-default-project.md L12/L20/L21 →
  the plain_react_wrappers case home.

### Proofs

- `agentrs v styletrace` 28/28 (7 fixtures + 21
  cases); `agentrs c styletrace` 49/49. New cases
  proven green by name-filtered runs (2 + 2) BEFORE
  the old tests were removed (fidelity: same
  assertions, new homes).
- `agentrs q` on the cases dir + both readers: 69
  files, zero violations.
- No other suite regressed: `agentrs c atlas`
  16/16, `agentrs v atlas` 60/60 (closest neighbor;
  census showed zero other physical readers).
- Baseline note: first `agentrs c styletrace` run
  showed 1 transient fail (48/1); immediate re-run
  49/49 — flake under concurrent R2 moves, not mine.

### Coverage map (README contract → home; no SPEC.md exists)

- Direct/rest/chain/alias/star-barrel/namespace/
  default/forwardRef/factory/pipeline forwarding →
  direct_wrapper, rest_spread_wrapper,
  wrapper_chain, reexport_alias, export_star_barrel,
  namespace_import, default_export_package,
  forward_ref_wrapper, icon_factory,
  direct_style_pipeline (+ tracing.rs scratch twins
  for body-destructure, pipeline-literal,
  jsx-fallback).
- Named barrel (local + packaged) → named_barrel,
  named_barrel_package (NEW). Subpath → subpath_
  package. node_modules re-export → node_modules_
  wrapper. Entry scope → entry_scope. Exports-map +
  index-fallback + subpath end-to-end in cases;
  field ladder (types/typings/module/main) → module-
  graph ladder_* tests (correct home).
- Negatives → negative, plain_react_library,
  plain_react_wrappers (NEW ×2). Parse isolation →
  parse_failure_isolated. Sync roots/hints/errors/
  bindings → fixtures.test.ts + hermetic_roots,
  neo_decl_roots, trace_gate, owned_props,
  prop_resolution.

### FILED (not fixed — beyond conversion scope)

- F-STC-1: namespace import THROUGH a package
  entrypoint — README claims it, only local
  namespace_import exists. Suggested
  `namespace_package` case (`import * as Lib` over
  a mock package).
- F-STC-2: pipeline helpers (css/box/splitCssProps)
  re-exported through a local module — README
  claims "through imported modules", only same-file
  (direct_style_pipeline) + factory-across-modules
  (icon_factory) exist. Probe the machinery first:
  case if it follows, compiler gap if not.
- F-STC-3: `.changeset/config.json` ignore entries
  for the 4 deleted `@fixtures/*` packages +
  docs/RELEASE.md L95-100 list now stale (R2's
  suite deletes compound the list). Needs an owner
  — suggest R1 phase 2 or the landing sweep.

### Footprint + index

- Staged (ordered only): 11 rename adds + 21
  deletes under my 4 fixture dirs (1063 staged
  total = 1042 + my 21, closes exactly). Unstaged:
  4×(README + spec + output) + 2 mock trees, 11
  normalized goldens, reader edits (my lines +
  R2's lines, disjoint), R5 prose, this log.
- Never installed, never committed, no chain
  fixture / matrix / workspace-config / lockfile
  touched.

## Styletrace-cases DONE (crew, 2026-09-23)

4 fixtures → 4 ID'd cases (named_barrel,
named_barrel_package, plain_react_library,
plain_react_wrappers) with assertions preserved 1:1;
scaffolding deleted incl. atlas's dangling core refs;
readers converted (R2's lines intact); R5 prose
retargeted; consistency + coverage pass complete with
3 FILED follow-ups (F-STC-1/2/3). Gates: styletrace
c/v green, q 69/69, atlas unregressed. Rides the
Obj-2 landing commit.

## Health tick (captain, 2026-09-23)

Obj-1 COMPLETE. Obj-2 Phase 3 Wave 1: R1 parked
(phase 2 = fresh dispatch after R2 moves), R-prose +
R-clean ACCEPTED, R-golden interim parked (final =
fresh dispatch after R1 regen), R2 + stcases working.
Objs 3/4/5 untouched. Roster: 2 running (R2, stcases),
all else result_ready; peers unchanged (5 reachable,
none mission crews). Liveness: stcases ALIVE (63-line
WORKING + staged fixture-move product); R2 young —
running, no section or product yet, still inside
normal map-read startup (NOT a deadlock signal; watch
next tick — still silent then = intervene). No HQ
park/stop. No commits (landing far off). Next: R2
moves → R1 phase 2 → regen → scoped battery → hermetic.

## R2 (crew, 2026-09-23) — WORKING

Scope (strict): Phase-3-map §1 R2 items 1–7 + §5 items
7/13/14 + captain's rulings (Q-3-2: no slimming, extends
legs stay) read in full, AS AMENDED by HQ Q-3-1(c):
item 4's Q4 4-fixture move REMOVED — sibling styletrace
crew owns those 4 fixtures + their reader lines. I own
only item 4's extend-library path line in the 2 RS
readers. Constraints held: never installed (R1 alone
installs), never committed, index only for ordered
git rm/mv, never touched another session's files.
`test-core` (+ `agentrs` for gate commands only) loaded
first.

### Item 1 — DELETE (git rm -r, staged)

17 suites (css, css-selectors, color-mode, font,
responsive, spacing, recipe, primitives, system,
tokens, reference, distro, session, typescript,
virtual, playwright, watch) + 9 tiers (T1, T3, T6,
T7, T9, T10, T11, T12, T13). Zero unstaged mods
lived under any delete target (verified pre-rm).
359 staged delete-paths, all 26 targets covered
(firsthand per-target census). R-MR-2's watch-full
config died with the suite (self-resolve confirmed
in the discovery proof below).

### Item 2 — kept moves (git mv, staged)

`matrix/chain/T2` → `matrix/tests/chain/T2`,
`matrix/chain/T8` → `matrix/tests/chain/T8`,
`matrix/mcp` → `matrix/tests/mcp`. Names unchanged
(`@matrix/chain-t2`, `@matrix/chain-t8`, `@matrix/mcp`
per Q-3-15); all 3 matrix.json byte-identical to
HEAD blobs (cmp). node_modules traveled with the
moves (whole-dir mv); their intra-links are stale
by one depth — R1's regen relinks, not mine.

### Item 3 — 7 chain fixtures (git mv flat, staged)

All 7 → `matrix/fixtures/` flat, `@fixtures/*`
names preserved (verified per package.json).
`fixtures/` retains ONLY the 4 Q4 dirs
(atlas-project, demo-ui, styletrace-consumer,
styletrace-library) — sibling scope, untouched.

### Item 4 — NARROWED: extend-library line only (2 edits)

- `modules/styletrace/tests/fixtures.test.ts:82`:
  `fixtures/extend-library/src/components` →
  `matrix/fixtures/extend-library/src/components`.
- `modules/styletrace/src/tests/tracing.rs:176`: same
  string swap. (Map's `src/tests/` shorthand = this
  file; verified the only tracing.rs with the pin.)
Helpers verified firsthand to join repo root
(fixtures.rs workspace_root + helpers.ts
getWorkspaceFixtureDir). Exactly 1 line touched
per file (4 diff lines total); sibling's station
rewrites of the other 4 tests landed around my
lines with zero clobber either direction
(re-verified post-landing: my lines intact, their
4 conversions theirs).

### Item 5 — depth fixes

a. Kept package.json setup/test scripts: T2/T8
   `../../../pipeline` → `../../../../pipeline`, mcp
   `../../pipeline` → `../../../pipeline`. Proof:
   fresh render via the managed renderer
   (createManagedMatrixPackageJson + new packageDir)
   → setup/test lines byte-equal in all 3 —
   **3/3 PARITY-OK**.
b. T2/T8 tsconfig F1 paths entries one level
   deeper. Proof: tsc shows NO TS2307 on
   `@reference-ui/neo` — only the accepted R-MR-1
   `layers` TS2353 per tier. (Ambient react TS2307s
   are stale-link noise pending R1 regen.)
c. All 7 `bootstrap-runtime.mjs`: one more `'..'`
   (7/7 uniform); node resolve sanity lands on
   `packages/reference-lib`.
d. Audits: fixture scripts (no other climbs),
   fixture tsconfig paths (all local
   `./.reference-ui/*` — safe), kept-suite
   cross-package imports (zero relative — package
   ids only). Audit FINDS, fixed under the
   "fix if hit" clause: (i) all 7 fixture
   tsconfigs + mcp tsconfig `extends:
   ../../tsconfig.base.json` no longer resolved
   (matrix/tsconfig.base.json absent) → one more
   `../` (8 files); (ii) layer-library
   project.json repo-root-relative sourceRoot/cwd
   + $schema depth → retargeted (package-name
   over-match caught and restored to
   `@fixtures/layer-library`).

### Item 6 — discovery + enumeration

a. `discovery/index.ts`: matrixRootDir →
   `matrix/tests`; one-level group scan → bounded
   recursive descent (node_modules/dot-dirs never
   groups; descent stops at matrix.json dirs);
   header + group example updated.
   `discovery/index.test.ts`: pins → kept-gate
   paths (T2/mcp true; matrix/fixtures +
   reference-neo false) + retitled.
b. `pipeline/config.ts`: WORKSPACE_PACKAGE_ROOTS →
   `['packages', 'matrix']` (dead `'fixtures'`
   dropped). `workspace.ts` matrix branch → same
   bounded recursion (finds 3-deep T2/T8 +
   fixtures/*). No dedicated enumeration unit
   test exists (R2 looked) — discovery tests +
   probes below are the proof.
c. `run.mjs` spec-finder: consumer audit —
   returned `pkg` flows to `targetPackage` →
   `resolvedTarget` (repo-relative suite dir) in
   both the playwright and vitest resolvers, plus
   the grep-match path. Retargeted: shared
   recursive `listMatrixSuiteDirs()` walker over
   `matrix/tests/` (chain-group descent — tiers
   unresolvable even pre-move, now fixed);
   `findSpecByTestId` + `findSpecByPathOrName`
   return repo-relative suite dirs; pkgHint
   matching ranks exact-base/rel, rel-suffix,
   basename-fuzzy (basename-only: no `tests`
   false-positives); `isKnownPackage` + both
   resolvers learn the new depth. Dead
   overlays/lib/primitives fallbacks LEFT
   (pre-existing staleness, out of scope).
   Seam note: `findSpecByPathOrName` +
   `findSpecByTestId` added to the export block
   (additive, zero behavior change) so the
   ordered §5.14 probe has a seam — disclosed.
d. `publish.test.ts:68` sourceDir →
   `matrix/fixtures/extend-library`. The
   `core→false` pin untouched (contract proof).

Move-orphaned test fixed (disclosed):
`setup/index.test.ts:38-39` hard-coded
`matrix/mcp` dir (generator stats it) → new path;
verified the new dir satisfies every assertion
(unit tests + global-setup present, no e2e).
Sweep confirms zero other stale absolute pins.

### Item 7 — residue sweep

All 26 delete-shells held ignored build output
only (node_modules, .reference-ui, dist,
test-results) — removed explicitly per dir, no
`git clean`. `matrix/chain/` removed (rmdir clean
after). Final `matrix/`: 8 docs + fixtures/ +
tests/. `git status` shows no `fixtures/` (top)
removal — top-level `fixtures/` still holds the
sibling's 4 Q4 dirs (their conversion in flight,
untouched).

## R2-MOVES-COMPLETE (crew, 2026-09-23)

All moves landed: 26 delete targets staged, 3
kept suites + 7 fixtures moved (names unchanged,
matrix.json byte-identical), `matrix/chain/`
gone, residue swept. Index: 1063 staged paths =
R1's 517 + R-clean's 3 + styletrace-sib's 10 Q4
scaffolding rms + 11 Q4 case renames + R2's 371
deletes + 151 renames — zero staged adds/modifies
(all R2
content edits unstaged in worktree, no `git add`
run). `git ls-files`: 151 files at new paths, 0
at old; staged blobs identical to HEAD (pure
moves). Captain: R1 phase 2 (globs + regen) GO
when ready — the package shape is final. FLAG
for R1: map §1-R1 item 2's glob plan assumed Q4a
plain dirs (no glob); HQ ruled Q-3-1(c)
station-cases — R1 must check with the styletrace
crew whether their home needs a glob before
finalizing `pnpm-workspace.yaml`.

### R2 proofs (all firsthand, all green)

- 5a byte-parity: **3/3 PARITY-OK** (managed
  renderer fresh-render vs hand-edited lines).
- 5b tsc: NO TS2307 on `@reference-ui/neo` in
  T2+T8 (only accepted R-MR-1 TS2353 ×2).
- §5.7 fixtures: **7/7 sync green** post-move +
  meta adoption spot (upstream `fixtureDemo*`
  vars + local `meta-extend-*` vars in meta's
  sheet; `baseSystem.mjs` republishes the
  fragment). METHOD NOTE (honest): run as the
  sync-script equivalent — `bootstrap-runtime.mjs`
  + source-direct `neo` bin (F6 precedent) —
  because the `neo` shims + scope links are
  stale by one depth until R1 regen (relative
  `neo` link + absolute old-path scope links,
  both verified). Fixture-side depth mechanics
  (my scope) proven; reviewers re-run the
  literal `pnpm sync` post-regen for the §5.7
  final.
- Pipeline units: **176/175/1 bare** — exactly
  the R-clean gate (same single pre-existing
  RS-contract fail). NOTE: the 176th is the
  known `test-presence.ts` source-file phantom
  (bare discovery matches node's `test-*`
  pattern; 0 assertions) — my quoted-glob run
  shows the real 175/174/1. Either invocation:
  zero-new.
- Pipeline tsc: exactly the 6 pre-existing
  TS2835 in RS native-contract territory
  (R-MR-3), zero in-scope.
- §5.13 discovery: unfiltered
  `listMatrixPackageDefinitions()` → exactly
  `@matrix/chain-t2, chain-t8, mcp`, NO THROW
  (R-MR-2 resolved); discovery+publish unit
  files 24/24. Workspace enumeration →
  3 kept + 7 fixtures, ENUMERATION-COMPLETE.
- §5.14 run.mjs: RESOLUTION-PROBE-PASS —
  isKnownPackage true for mcp/@matrix/mcp/T2/T8
  (+ tests/mcp spelling), false for deleted css;
  spec queries resolve to `matrix/tests/...`
  incl. file:line form; deleted-suite query null.
- §5.11 (my lines): styletrace vitest
  extend-library 1 passed; cargo
  `fixture_extend_library` 1 passed (48
  filtered). Re-run green on the final
  sibling-rewritten file shape.
- Footprint: session-window writes = exactly
  my scope files (6 pipeline + run.mjs + 6
  tier/mcp json + 15 fixture files + 2 RS
  lines); sibling RS-case files untouched;
  no installs (lockfile's `M` is the
  pre-existing sibling session's, not mine);
  nothing committed.

## R2 DONE (crew, 2026-09-23)

Items 1–7 landed, every §1 proof green, §5
items 7/13/14 demonstrated (7 with the honest
shim caveat for post-regen re-run). Q-3-2 held:
no slimming attempted, kept tiers' extends legs
untouched (T2/T8 e2e + src byte-untouched
except ordered boilerplate depth lines).
Disclosed extras: setup/index.test.ts orphan
pin, run.mjs finder exports, tsconfig-extends ×8
+ project.json depth finds. Handoff: R1 phase 2
→ regen → scoped battery (incl. literal 7/7
`pnpm sync`) → hermetic. R2 DONE.

## R2 acceptance (captain, 2026-09-23)

R2 ACCEPTED (the big move). Verified firsthand:
deleted suites/tiers gone (matrix/chain/ included);
T2/T8/mcp live under matrix/tests with all 3
matrix.json byte-identical to HEAD; 7 fixtures flat
under matrix/fixtures with @fixtures/* names
preserved; depth mechanics exact (T2 setup/test
../../../../pipeline, tsconfig F1 ../../../../neo,
bootstrap 3×up); reader extend-library line retargeted
to matrix/fixtures; pipeline suite 175/1 on my run
(same single pre-existing fail); index exactly 1063
staged paths, pure deletes+renames, zero adds/modifies.
Q-3-2 held (no slimming). Disclosed extras accepted.
Carried: literal 7/7 `pnpm sync` re-run post-regen
(shim caveat — reviewers + my landing re-run); R1
FLAG (stcases home glob question) attached to the R1
phase-2 dispatch. SEQUENCING: R1 phase 2 HOLDS for
stcases DONE (package shape + glob answer) — regen
must see the final tree.

## Decomm-report (crew, 2026-09-23) — WORKING

Scope (strict): MATRIX-DECOMMISSIONING.md at the repo root
+ this log section. No other writes. Never commit, never
touch the index, never touch another session's files.

Firsthand reads: LOG-2.md MAP + P1/P2/P3 acceptances +
install-dim §§1–3 + §6 home table (full file); pipeline
registry (pack.ts/load.ts/package-prep.ts), runner
(package-runner.ts/consumer.ts/ref-sync.ts/install.ts),
config.ts REGISTRY/RELEASE lists, dependencies.ts pins;
kept T2 (spec/ui.config/package.json) + mcp harness
(server.ts/artifact.ts/global-setup.ts/server.test.ts:24);
Neo CHAIN-06 real-upstream.spec.ts + case.json, CLI-01
lifecycle.spec.ts, WATCH-01 watch-loop.spec.ts, CHAIN-01
transitive.spec.ts (head), shared/runner.ts (sync hook +
serve + browser pipeline).

## Decomm-report DONE (crew, 2026-09-23)

MATRIX-DECOMMISSIONING.md written at the repo root
(untracked, unstaged — rides the Obj-2 landing commit).
Covers all six ordered items: (1) steelman naming the 5
things Verdaccio-in-Dagger proves one env cannot;
(2) install-boundary vs behavior-semantics split with
3 firsthand defenses (runner phase structure, Neo
runner executes the same function, pinned toolchain);
(3) per-suite PORT/DROP proof-equivalence citing what
each case executes (CHAIN-01…06 incl. 06's negative
control, CLI-01/02, WATCH-01+SYNC-14, 7 micro-ports,
DROP homes, webpack-axis retirement); (4) keeps
(T2 layers prover, T8 policy proof, mcp ×19
installed-artifact standard) with per-keep boundary
reasons; (5) 7-item honest residue (npmjs round-trip,
foreign envs, layers breadth, T8 content,
legacy spellings, native targets, F-PUB-2); (6) land
recommendation + appendix home table. Footprint: the
report + this log section; index untouched (1063
staged paths all siblings'); nothing committed.

## HQ REVERSAL — chain tiers restored (captain, 2026-09-23)

HQ RULED: restore ALL chain tiers in matrix (engineering
safety: chain answers between-packages/between-environments
questions; it stays in one place to test and reason
about). This reverses the audit's chain PORT/DROP
verdicts only — distro/watch/etc. decommissions stand.
EXECUTION: R-restore crew restores e2e tiers
T1/T3/T6/T7/T9/T10/T11/T12/T13 to matrix/tests/chain/
(R2 depth mechanics, matrix.json byte-identical,
discovery verify); unit dirs censused, restored unless
proven runner-mechanics with a Neo home (call filed).
Neo CHAIN-01..05 (tier ports) DELETED as duplicates
(one home = matrix); CHAIN-06 KEPT (captain's call:
no tier source, it is the publisher-shape pin — tiers
re-cover the scenario e2e, CHAIN-06 pins it fast;
HQ may overrule). SYNC-10 (pre-existing) stays.
R-prose2 reworks TEST_COVERAGE + CHAIN docs + VARIANTS
residue for the restored gate. Decomm-report crew
REBRIEFED (chain = the kept counterexample). §6/§5
updated at landing: hermetic proof now 11 tiers + mcp.
SEQUENCE: R1 phase 2 holds for restore + stcases DONE.
Q-3-7 still open.

## R-prose2 (crew, 2026-09-23) — WORKING

Scope (strict): HQ-reversal prose follow-up ONLY — (1)
matrix/TEST_COVERAGE.md kept-gate rewrite to the restored gate,
(2) CHAIN.md / CHAIN_RULES.md / CHAIN_REPORT.md unmark, (3)
VARIANTS R2 re-evaluation, (4) R6 confirm. Prose files only, no
code. Never commit, never touch the index, never touch another
session's files. Sweep policy: true swaps only, never falsify.
Rides the Obj-2 landing commit. Read in full: LOG-2 ## HQ
REVERSAL + ## R-PROSE DONE (R1-R7) + ## Phase-3-map §1 R-prose
item 2.

### Recon (read-only, firsthand)

- TEST_COVERAGE.md (current): kept-gate table names T2/T8/mcp +
  a 7-row NEO-CHAIN PORT table + "dropped tiers' layers legs
  homed at T2/T8" — all reversed by HQ. Lifecycle /
  micro-ports / DROPs / DROP* sections stand (decommissions
  unaffected).
- Restored-tier package names verified at HEAD:
  `@matrix/chain-t1|t3|t6|t7|t9|t10|t11|t12|t13`, all
  watch-ready/vite7/react19 (matrix.json byte-identical per
  the restore order; Q-3-15 names-unchanged precedent).
- Tier topology descriptions sourced from CHAIN.md compiler
  questions + CHAIN_REPORT §1 (33/33 table) + §3.2
  behavior-evidence table — all read firsthand.
- "Sole" wording call: restored mixed tiers (T3/T9/T10/T12/
  T13) exercise layers legs in combination, so a bare "T2
  sole layers prover" would falsify. T2 IS the only
  single-mode (isolated) layers tier — T5 doesn't exist —
  so the D17 note lands as "sole single-mode layers
  prover". H4 note on T8 stands verbatim.
- R-restore (not mine) owns the tree mechanics; unit-dir
  census pending there — prose cites tier dirs + packages +
  e2e-backed commands only, no per-tier unit claims.
- Observed-stale, OUT of scope (filed, not fixed):
  matrix/README.md L22-23 snapshot (names T2/T8/mcp lean
  gate), TEST_MIGRATION.md historical note ("except chain
  T2/T8"), PROMPT.md historical note (self-resolves if R6
  delete lands). MATRIX-DECOMMISSIONING.md is the
  rebriefed decomm crew's; §5/§6 updates are the
  captain's at landing.

### Edits (5 prose files, scope-held)

- (1) TEST_COVERAGE.md: kept-gate table rewritten to the
  RESTORED gate — 12 rows (11 tiers T1/T2/T3/T6/T7/T8/T9/
  T10/T11/T12/T13 with `matrix/tests/chain/T*` paths +
  mcp ×19), 12 hermetic `pnpm agent test` commands
  (package names verified at HEAD, matrix.json
  byte-identical per the restore order). T2/T8 "sole
  provers" framing dropped; D17 note lands as "sole
  single-mode layers prover" (true: T5 doesn't exist,
  mixed tiers exercise layers legs in combination —
  stated), H4 note verbatim. Chain PORT table replaced
  with the RESTORED subsection (tiers = home, CHAIN-01..05
  deleted as duplicates, CHAIN-06 + SYNC-10 kept
  alongside, T4/T5 + depth-3 still uncovered).
  Lifecycle / micro-ports / DROPs / DROP* untouched.
- (2) CHAIN.md + CHAIN_RULES.md cutover notes rewritten
  (11 live tiers, no dropped-tier framing, T8/H4
  untouched). CHAIN_REPORT.md: note + §2.3 + §4.2 + §6
  unmarked (all tier paths `matrix/tests/chain/T*`;
  results/findings stand as run).
- (3) VARIANTS R2 re-evaluated: §5 header + Tier 5 +
  Phase-5 mermaid repathed `matrix/chain/...` →
  `matrix/tests/chain/...` (live again). Tier 1–4
  (`matrix/typescript|primitives|system`), Phase 1–3
  core-file steps, `PrimitiveVariantRegistry` (no Neo
  counterpart) stay residue — untouched.
- (4) R6 CONFIRMED unaffected: bounded search over
  matrix/docs/pipeline/packages/.agents finds ZERO
  citations of PROMPT.md / COVERAGE_EXTRA outside LOG-2;
  TEST_MIGRATION's live citation intact
  (DATA_THEME.md:331) → PROMPT/COVERAGE_EXTRA delete
  still needs the landing nod, TEST_MIGRATION stays.

### Proofs

- Edited-file grep `@reference-ui/core`: ZERO (5/5).
  Stale `matrix/chain/` refs in edited files: ZERO.
- `git diff --cached --name-only` filtered to my files:
  EMPTY — index untouched, nothing committed, no code
  touched. Footprint = the 5 prose files + this log.

## R-PROSE2 DONE (crew, 2026-09-23)

Restored-gate prose landed: TEST_COVERAGE rewritten (12-row
gate + commands + restored-chain subsection), CHAIN docs
unmarked, VARIANTS tier refs repathed with the dead remainder
held as residue, R6 reconfirmed. Observed-stale out-of-scope
items for the landing call: matrix/README.md L22-23 snapshot,
TEST_MIGRATION.md historical note (PROMPT.md's resolves with
the R6 delete). Rides the Obj-2 landing commit.

## HQ DUAL-COVERAGE ruling (captain, 2026-09-23)

HQ RULED: dual coverage stands — restored matrix chain
tiers + Neo CHAIN-01..06 BOTH stay (matrix = second
lens, Neo = fast loop). R-restore COUNTERMANDED (item
4 dropped; all Neo chain cases untouched — amendment
queued, confirmation pending). CONSEQUENCES: the
one-coverage-home check is VOID for chain rows (§6
PORT rows become DUAL rows; reviewers verify both
homes green, not zero-residual); distro/watch/etc.
decommissions unaffected (still single-homed in Neo).
Decomm report (just delivered) needs a dual-coverage
amendment — captain reviewing now.

## Report-amend (crew, 2026-09-23) — DONE

Scope (strict): MATRIX-DECOMMISSIONING.md ONLY + this log
section. Never commit, never touch the index, never touch
another session's files.

### Recon (read-only, firsthand)

- Report read in full (453 lines): steelman §1, split §2,
  per-suite §3 (chain §3.1 as PORT → NEO-CHAIN-01…06 under
  the one-home rule), keeps §4 (T2/T8/mcp), residue §5
  (item 3 layers-breadth held at T2/T8 by standpoint),
  recommendation §6 (delete 17 suites + 9 tiers; keep
  T2/T8/mcp; gate with grep check), appendix home table
  (CHAIN PORT rows, T2/T8/mcp KEEPs).
- LOG-2.md ## HQ REVERSAL read in full: restore ALL chain
  e2e tiers T1/T3/T6/T7/T9/T10/T11/T12/T13 to
  matrix/tests/chain/ (R2 depth, matrix.json
  byte-identical); audit's chain PORT/DROP verdicts
  reversed ONLY — distro/watch/etc. stand; hermetic proof
  now 11 tiers + mcp. (Its item 4, Neo CHAIN deletion, was
  countermanded by the later ruling — all Neo chain cases
  untouched.)
- LOG-2.md ## HQ DUAL-COVERAGE ruling read in full:
  restored matrix chain tiers + Neo CHAIN-01..06 BOTH stay
  (matrix = second lens, Neo = fast loop); one-home check
  VOID for chain rows (§6 PORT rows become DUAL rows;
  reviewers verify both homes green, not zero-residual);
  distro/watch/etc. unaffected (still single-homed Neo).

### Amendments (surgical; evidence preserved, thesis reframed)

- Header: decommission now "for every suite except chain";
  reversal + dual-coverage stated up front; chain named the
  KEPT COUNTEREXAMPLE; kept gate = 11 tiers + mcp. Sources
  line adds the two HQ rulings.
- §3 rule: one-home holds EXCEPT chain rows (DUAL = Neo
  case + kept tier, both homes green).
- §3.1 rewritten as KEPT + dual-covered: 9 tiers restored
  to matrix/tests/chain/ rejoin T2/T8 (11-tier gate);
  audit's chain PORT/DROP verdicts reversed, all other
  verdicts stand; dual rationale (matrix = second lens for
  between-packages/environments behavior, Neo = fast
  loop). All per-case execution evidence kept (paints,
  deep-equals, pins, CHAIN-06 negative control), arrows
  reframed as DUAL rows; CHAIN-05 noted Neo-only new
  coverage (no tier twin); CHAIN-06 the fast shape pin;
  restored tiers re-cover their own layers legs, T8 keeps
  hybrid both-buckets, T5-new still held for D17.
- §4: kept gate = 11 tiers + mcp; T2/T8/mcp paragraphs
  byte-untouched; new restored-tiers paragraph (second
  lens over packed fixtures; one-home void).
- §5 item 3 RETIRED by the restoration (P-chain-2 backlog
  gone; future native layers homes land as DUAL rows);
  T5-new remains. Items 1–2/4–7 untouched.
- §6: delete 17 suites, zero chain tiers; keep 11-tier
  gate + mcp; proof = hermetic 11 + mcp, both homes green
  per DUAL row, grep check for non-chain rows only;
  future-work legs refiled as DUALs; closing thesis
  reframed (eleven tiers answer HQ's question).
- Appendix: CHAIN/SYNC-10 rows moved PORT→DUAL block;
  PORTs now CLI/WATCH/micros only; KEEPs = full 11-tier
  gate + mcp ×19; check procedure voids chain rows.
- Untouched by design: §1 steelman, §2 split, §3.2–3.6,
  §5 residue evidence, DROPs/DROP*; no settled verdict
  relitigated.

### Verification (read-only)

- Stale-framing sweep over the report: zero hits for `9
  chain`, `with three`, `17-item`, `Dropped tiers`, `stay
  homed`, `two homes`, chain `←T` arrows, `layers-leg
  PORTs`, `settle-then-PORT`.
- One-home mentions audited: every occurrence now carries
  the chain exception or non-chain scope.
- Re-read amended §3 rule, §3.1, §4 lede + restored
  paragraph, §5 item 3, §6, appendix — coherent; report
  453 → 510 lines.
- Footprint: MATRIX-DECOMMISSIONING.md + this log section
  only; never committed, index untouched, no other
  session's files touched.

## HQ direction — engine test layer (captain, 2026-09-23)

HQ confirmed the layered model: chain restored in
matrix (broad, right-environment proof — R-restore in
flight) + keep building the faster, more detailed test
layer BENEATH it in the actual engine (reference-rs:
station cases, canon specs, shape/mechanics pins).
Standing direction, carried beyond Obj-2: granularity
lives in the engine where it runs fast and always;
chain stays broad so every red is a boundary signal.
Current carriers: styletrace-cases crew (fixtures →
ID'd station cases, in flight), CHAIN-06-style pins
(fast contract coverage under the e2e). Coverage-gap
audits ride future objectives, not Phase 3.

## R-restore (crew, 2026-09-23) — WORKING

Scope (strict): HQ REVERSAL items 1/2/3/5 ONLY. Item 4
(Neo CHAIN-01..05 delete) COUNTERMANDED by the HQ
DUAL-COVERAGE ruling (both homes stay; one-home check
VOID for chain) — all Neo chain cases untouched. Matrix
chain tiers T1/T3/T6/T7/T9/T10/T11/T12/T13 restore to
matrix/tests/chain/ + R2 depth mechanics + unit census +
proofs. Never install, never commit, index only for
ordered restores/moves, never touch another session's
files, stay out of stcases' styletrace files + R-prose2's
prose files + the decomm report. Rides the Obj-2 landing
commit. Read in full: LOG-2 ## HQ REVERSAL + ## HQ
DUAL-COVERAGE ruling + ## Phase-3-map §1 R2 (items 1/2/5,
esp. depth mechanics 5a/5b + disclosed finds 5d) + R2
WORKING/DONE + R2 acceptance (precedent proofs).

## Report-amend acceptance (captain, 2026-09-23)

REPORT-AMEND ACCEPTED. Verified firsthand: header +
§3 rule + §3.1 reframed (chain KEPT + dual-covered,
11-tier gate at matrix/tests/chain/, one-home void
for chain rows, DUAL rows cite both homes). Report
ready for HQ probing; rides the landing commit.

### R-restore items 1+2 — restore + depth mechanics (crew, 2026-09-23)

Restored all 9 e2e tiers T1/T3/T6/T7/T9/T10/T11/T12/T13:
`git checkout HEAD -- matrix/chain/Tn` + `git mv` to
`matrix/tests/chain/Tn` (one chain home alongside T2/T8).
112 paths, ALL R100 pure renames (staged blobs
HEAD-identical, zero adds/modifies in the index);
`matrix/chain/` removed after emptying. `@matrix/*`
names unchanged; matrix.json ZERO edits (11/11
PARITY-OK vs HEAD via cmp, incl. T2/T8 re-verified).

Per-tier boilerplate (worktree only, 36 files = 9x4 —
staged stays HEAD blobs, R2's T2/T8 AM-pattern):
package.json setup/test one deeper
(`../../../../pipeline`) + sync `neo` + dep core->neo;
ui.config.ts line-1 id swap (bodies untouched, H4-style);
vite.config.ts referenceVite drop (9/9 byte-identical to
T2's current); tsconfig F1 neo path one deeper (T1/T3/T6
byte-identical to T2's, T7/T9/T10/T11/T12/T13 to T8's).
R2's disclosed finds audited: zero tsconfig `extends`
keys + zero project.json in all 11 tiers. Residual core
grep over the 9 tiers: ZERO hits. Tier README titles
(`# matrix/chain/Tn`) left stale — uniform with R2's
T2/T8 precedent; all-11 normalize rides the landing
sweep (flagged, not freelanced).

### R-restore item 3 — unit census (crew, 2026-09-23)

FACT: only T1/T3 unit dirs were deleted; T2's unit was
MOVED whole by R2 (R100, in the kept gate today). All
three files are byte-near-identical 3-assert smokes
(marker string + Index() truthy + root test-id).
- T1 tests/unit: RESTORE (done, rode the tier restore).
- T3 tests/unit: RESTORE (done, rode the tier restore).
- T2 tests/unit: KEEP (already present, no action).
Bar analysis: the no-restore bar is conjunctive (proven
runner-mechanics WITH a named Neo home). The marker leg
is mechanics, but no Neo case homes tier-src-against-
packed-fixtures resolution (SYNC-01 handshakes Neo
worlds, not chain tiers; the true render home is each
tier's own kept e2e spec — matrix, not Neo). Bar not
cleared + T2 precedent + uniform tier shape + HQ "one
place" rationale ⇒ restore. Filed per tier, no silent
drops.

### R-restore item 4 — DROPPED (dual-coverage)

Not executed per the HQ DUAL-COVERAGE ruling (both
homes stay; one-home check VOID for chain). All 6 Neo
chain cases + TESTS/SPEC ledgers byte-untouched
(verified: 6 dirs present, TESTS.md 11 lines). SYNC-10
untouched (was never in the delete set).

### R-restore proofs (all firsthand)

- matrix.json byte-parity: 11/11 PARITY-OK (cmp vs HEAD).
- Managed-renderer parity (R2 5a precedent, extended to
  all tiers): 11/11 PARITY-OK (setup/test/sync + neo
  dep, fresh render vs hand edits).
- Per-tier depth spot-verify: 9/9 package.json scripts+
  deps exact; 9/9 vite/tsconfig byte-match T2/T8
  templates; 9/9 ui.config neo id; zero core residuals.
- Discovery: unfiltered `listMatrixPackageDefinitions`
  → exactly the 11 `@matrix/chain-t*` + `@matrix/mcp`,
  NO THROW (R-MR-2 stays resolved). Workspace
  enumeration → 11 tiers + mcp + 7 fixtures,
  ENUMERATION-COMPLETE.
- Pipeline suite (`pnpm --dir pipeline exec tsx
  --test`, node:test): 176 tests / 175 pass / 1 fail —
  the single fail is the pre-existing RS-contract
  `compatibility.test.ts` (R-MR-3; `pipeline/src/build/
  rust/` untouched, verified). Matches the 175/1 gate.
- tsc per restored tier: ZERO `@reference-ui/neo`
  TS2307 in all 9 (F1 paths resolve); T3 shows the
  accepted R-MR-1 `layers` TS2353 exactly like T2
  (proves the barrel read). Remaining errors are
  pre-regen missing-node_modules noise (react/fixtures).
- Footprint: index = 112 ordered R100 renames only;
  worktree = 36 boilerplate edits + this log. No
  installs, no commits, no sibling files, no styletrace
  files, no prose/decomm files, no Neo writes.
- Carried (not mine): literal 7/7→11/11 `pnpm sync`
  re-run post-R1-regen (restored tiers have no
  node_modules yet — same shim caveat R2 filed);
  README-title sweep; R1 FLAG (stcases home glob) still
  stands; hermetic proof now 11 tiers + mcp (§4/§5/§6
  updates are the captain's at landing).

## R-RESTORE DONE (crew, 2026-09-23)

9 tiers restored to matrix/tests/chain/ (112 R100
renames, matrix.json 11/11 byte-identical), depth
mechanics + migration applied per tier (36 files,
renderer-parity 11/11), unit census filed (T1+T3
restored, T2 kept), item 4 correctly not executed
(dual-coverage), discovery 11+mcp no-throw, pipeline
175/1 same-single-fail. Rides the Obj-2 landing commit.

## R-restore acceptance (captain, 2026-09-23)

R-RESTORE ACCEPTED. Verified firsthand: 11 tiers live
under matrix/tests/chain/, matrix.json 11/11
byte-identical to HEAD, depth mechanics exact on
restored tiers (spot T6: ../../../../pipeline +
../../../../neo), unit smokes live in T1/T2/T3 with
filed restore rationale (bar analysis stands), all 6
Neo CHAIN cases present (countermand honored, item 4
correctly not executed), pipeline suite 175/1 same
single pre-existing fail. Chain is whole in matrix
and dual-covered in Neo. R1 phase 2 now waits ONLY
on stcases DONE.

## Styletrace-cases acceptance (captain, 2026-09-23)

STYLETRACE-CASES ACCEPTED. Verified firsthand: 4
ID'd cases live under modules/styletrace/tests/cases/
(named_barrel, named_barrel_package,
plain_react_library, plain_react_wrappers); top-level
fixtures/ EMPTY (all 11 moved out — dir removal to R1
phase 2); atlas core refs zero; R5 prose retargeted
to the new case home; styletrace vitest PASSED +
cargo 49/49 on my runs. R1 FLAG ANSWERED: new home
has no package.json (plain dirs) — NO glob needed.
F-STC-1/2 carried as engine-coverage follow-ups
(namespace-package case, pipeline-through-modules
case); F-STC-3 (changeset ignores + RELEASE.md list)
assigned to R1 phase 2. R1 PHASE 2 DISPATCHED (both
gates through: R2 moves + stcases DONE).

## R1-phase-2 (crew, 2026-09-23) — WORKING

Scope (strict): Phase-3-map §1 R1 items 2/3/5 + §5 items 15/16 +
captain's R2/stcases acceptances + F-STC-3. This crew alone installs.
Never commit, never touch another session's files.

### Lockfile pre-inspection (ordered FIRST)

`git diff pnpm-lock.yaml` before my regen: 41 lines (+19/−22) — the
sibling M-docs+lib session's mechanical relink on the PRE-MOVE tree
(shape: `fixtures/*` importer keys, pre-R2 paths): 7× fixture devDep
core→neo swaps, docs dep swap, lib dep delete, + 2 vitest-resolved
esbuild peer flips (0.27.3↔0.28.2, one hunk each direction — resolver
noise, no intent). No package-shape intent beyond the dep swaps.
SUPERSEDE (plainly, per orders): the mission-ordered regen below
replaces this diff wholesale — post-move importer keys
(`matrix/fixtures/*`, `matrix/tests/...`), dropped importers gone,
kept-suite dep swaps, mcp esbuild-add/core-drop, icons swap, core
importer gone. The sibling's dep-swap INTENT is preserved inside the
regen (same swaps, final paths); its bytes are not. No other sibling
file touched.

## R-prose2 acceptance (captain, 2026-09-23)

R-PROSE2 ACCEPTED (roster running, DONE filed —
exiting). Verified firsthand: TEST_COVERAGE names
all 11 tiers at matrix/tests paths, CHAIN docs carry
zero historical marks, VARIANTS tier refs repathed to
matrix/tests. Observed-stale items (matrix README
L22-23, TEST_MIGRATION note) carried to the landing
call alongside R6.

## Health tick (captain, 2026-09-23)

Obj-1 COMPLETE. Obj-2 Phase 3: Wave 1 + restore ALL
accepted (R1p1, R-prose, R-clean, R2, stcases,
R-restore, R-prose2, report-amend); R1 phase 2 (regen)
WORKING and alive — ordered lockfile pre-inspection
first (41-line sibling relink understood + logged),
workspace.yaml in motion. Objs 3/4/5 untouched.
Roster: 2 running (r1p2 working, rprose2 exiting);
all else result_ready. Deadlock test: clean, no
interventions. No HQ park/stop. No commits. Next:
R1-REGEN-COMPLETE → golden final + scoped battery →
hermetic (11 tiers + mcp) → landing.

### R1 phase 2 — globs + regen + proofs (crew, 2026-09-23)

**Globs** (`pnpm-workspace.yaml`, worktree edit): `- fixtures/*`,
`- matrix/*`, `- matrix/*/*` → `- matrix/tests/*`,
`- matrix/tests/*/*`, `- matrix/fixtures/*`. NO styletrace glob:
R1 FLAG answered — new home carries zero package.json (verified
firsthand: `find ... -name package.json` under the cases dir empty),
plain dirs need no glob.

**Regen**: full `pnpm install` (not --lockfile-only), exit 0,
"Scope: all 30 workspace projects", 3.9s. Warnings only (pre-existing
noise, all firsthand): 3× `@types/node` bin ENOENT (typings carry no
bin), 2× unmet peers (swc-node @swc/core, content-collections
typescript — both pre-date this mission). Frozen re-run exit 0
(505ms) → resolve clean. Lockfile: +151/−3516 (dropped importers
gone); zero `reference-core` / `@reference-ui/core` / `fixtures/` /
`matrix/chain/` / `matrix/<suite>:` importer keys; 7
`matrix/fixtures/*` + 11 `matrix/tests/chain/*` + `matrix/tests/mcp`
importers live; mcp `esbuild ^0.28.1` real (0.28.2). panda-playground
glob points at nothing (no such dir — pre-existing, pnpm tolerates,
not mine). Sibling M-docs+lib diff SUPERSEDED per the pre-inspection
above (intent preserved, bytes replaced); no other sibling file
touched.

**§5.16 proof — neo shims 20/20 present + executing**: docs, all 11
tiers (T1/T2/T3/T6/T7/T8/T9/T10/T11/T12/T13), mcp, all 7 fixtures.
Execution-smoked firsthand: T2 `.bin/neo --help`, meta fixture
`.bin/neo --help`, `pnpm --filter @matrix/mcp exec neo --help` — all
print usage, exit 0. §5.16 HOLDS.

**F-STC-3**: `.changeset/config.json` ignore −21 entries (4 deleted
`@fixtures/*`: atlas-project, demo-ui, styletrace-consumer,
styletrace-library + 17 R2-deleted `@matrix/*` suites; all 11
chain-t entries KEPT — tiers restored; `@matrix/lib` KEPT —
phantom, never a real suite, not in R2's delete list — observed-
stale, filed not fixed). JSON re-parsed valid. `docs/RELEASE.md`
L95-100 −4 dead fixture lines (extend/layer-library +
reference-docs stay; list was already illustrative-subset, kept
that shape).

**fixtures/ dir**: was byte-empty (11/11 moved out by R2/stcases);
`rmdir` clean. (Staged `D ` entries under it are siblings' ordered
deletes/renames — git tracks files, not dirs; nothing staged by me.)

### R1 phase 2 — zero-census re-run (§5.15, actual residual list)

Method: `git grep` over tracked + `grep -r` over every untracked
Phase-3 path (mcp neo/ + new tests, neo entry/react-stub/primitives/
axis-test, all new Neo cases incl. chain/cli/watch, ATM-SHORT-12,
4 stcases homes, decomm report), node_modules/.reference-ui excluded.
DECISIVE (all firsthand):
- Live `from/require('@reference-ui/core')` code importers: **ZERO**.
  Only hits: archive prose (OVERLAY_THEME:222), evidence prose
  (neo-state :416 — describes the gate), bundle.test.ts ×2 QUOTED
  fixture strings proving the alias (not imports).
- `ref build`: **ZERO live** (archive + 3 CHANGELOGs only).
- `ensure-core`: **ZERO in code** (VOYAGE.md brief prose only).
- `dependsOn` × core: **ZERO** (nx.json generic `^build`, lib/rs
  self-build; layer-library fixed by R2 — absent).
- `ref sync` binary invocations in code/configs/scripts: **ZERO**.
- pnpm-lock.yaml: zero core-id hits (above).

Allowed-list confirmations (present exactly as §5.15 permits —
no action): BOOK 3 `(removed with core)` referenceVite glosses + 2
shouldDeferHotUpdate notes; REFERENCE_UI `ref mcp` exactly 4
(re-counted); publish.test.ts `core→false` pin + sort; inert core
literals in release/registry/build/materialize tests (shape-verified:
fixture dicts, tmpdir scaffolds, version maps); R-MDL-1
(lib ui.config.ts:5, Obj-5); archive/ + CHANGELOGs + forensics +
typegen SPEC + virtualrs lib.rs:1; LOGs.

BEYOND-allowed actuals (captain diffs at landing):
- **B1 intentional-compat (recommend accept)**: neo
  CONFIG_EXTERNALS core ids + fragment bootstrap
  `@reference-ui/core/config` alias + scan needles + test pins
  (Phase-0-documented legacy-ui.config support; biome ban is the
  enforcer); mcp `author-entry.ts:17` candidate + back-compat
  classifiers (`entry.ts:74`, `model-state.ts:48` + test — M-mcp
  filed, accepted); `[matrix ref sync]` markers + `ref-sync*`
  module names + describe strings (M-runner no-rename, accepted).
- **B2 stale comments in live src (comment-only, zero behavior;
  recommend landing-sweep-or-accept)**: T8 spec :31 (R7 —
  "reference-core moves to dedupe"); docs `docs-theme.fragments.ts:5`
  + lib `index.ts:5` + lib Reference `fixtures/index.tsx:1` +
  `PaperApiReference.book.tsx:6` + `tokens.ts:7` (all say `ref sync`;
  tokens.ts also names a core path); `pipeline/matrix.md:168`
  ("`sync` remains `ref sync`" — false post-cutover).
- **B3 stale live configs (recommend landing fix — actually
  broken/stale)**: `.cursor/mcp.json:10` (invokes deleted
  `../reference-core/bin/ref.mjs mcp` — cursor server launch
  broken); `.changeset/status.json` (tracked generated snapshot
  naming core 0.0.24→0.0.25 — delete-or-regen); run.mjs
  `clean === 'core'` → `packages/reference-core` mapping + help
  example (dead dir); `.gitignore:57-58` core generated-dir rules
  (harmless dead rules).
- **B4 carried prose (already filed, re-confirmed present)**:
  R-prose R1 (arch maps under cutover notes), R2/R4 (VARIANTS/
  PORTAL remainders, unnamed core-path docs), F3 zero-edit
  rationale (PLAN.md boundary rule + dated probe records),
  VOYAGE/AGENTS.md/skills/RS-docs/neo-case-READMEs/evidence,
  CHAIN_REPORT/TEST_MIGRATION historical notes, STRICT_TOKENS/
  VITE/wave-3 `ref sync` prose, atomic SPEC :919 generic usage.
- **B5 RS test-data strings (not importers; suites green)**:
  ATM-TOKEN-10 baseSystem.json + token10.test.ts fragment path,
  TST-STY-01 input comments, named_colors.rs doc line,
  prop_resolution.rs expect string.
- **B6 N/A**: decomm report :425 (names core as its subject).
- **B7 false positives (not residuals)**: Presence.tsx:137
  ("node ref synchronously"), neo `init.ts:3` + `sync/index.ts:93`
  ("ref syncs" = generic reference-syncs shorthand in neo's own
  loop comments).

Footprint: `pnpm-workspace.yaml` (globs), `pnpm-lock.yaml` (regen),
`.changeset/config.json` + `docs/RELEASE.md` (F-STC-3), `fixtures/`
rmdir, this log. Index untouched (never `git add`), nothing
committed, no installs by any other crew, no sibling files touched.
Gates: §5.15 filed (zero importers + list above), §5.16 green
(20/20 shims + frozen-clean).

## R1-REGEN-COMPLETE (crew, 2026-09-23)

Regen final: workspace globs on the post-move shape (no styletrace
glob — plain dirs verified), full `pnpm install` exit 0 + frozen
re-run exit 0, `neo` present and executing in docs + all 11 tiers +
mcp + all 7 fixtures, lockfile zero core-id/old-path keys,
zero-census filed (ZERO live importers/invocations; residuals B1–B7
above for the captain's diff), F-STC-3 landed (changeset −21,
RELEASE.md −4), `fixtures/` removed. R-golden final + reviewers
trigger off this marker.

## R1-phase-2 acceptance (captain, 2026-09-23)

R1-PHASE-2 ACCEPTED. Verified firsthand: globs exact
(matrix/tests/*, */*, fixtures/*, no styletrace glob);
fixtures/ gone; neo shims present (spot T2 + extend);
lockfile zero @reference-ui/core + zero old-path
importers (54 fixtures/ hits all new-path matrix/
fixtures/* + @fixtures/* ids). B-list diffed vs
§5.15: B1/B4/B5/B6/B7 ACCEPTED (compat/filed/
test-data/N-A/false-positive); B2 comment-only
(landing-sweep-or-accept; pipeline/matrix.md:168
false line joins the sweep); B3 LANDING-SWEEP
(.cursor/mcp.json broken bin path, status.json
snapshot, run.mjs dead mapping, gitignore dead rules
— small mechanical fixes, post-hermetic crew).
Dispatched: R-golden-final + reviewers (scoped
battery §5.4-14 + dual-home check). Hermetic crew
goes after REVIEW-DONE.

## R-golden-final (crew, 2026-09-23) — WORKING

Scope (strict): R-GOLDEN-FINAL crew (Objective 2 Phase 3). Pinned goldens
only, no compiler logic. Skills `agent-rs` + `agent-neo` loaded first;
LOG-2 ## R-golden WORKING (interim: regen complete + mechanism proof) +
## R1-REGEN-COMPLETE read in full. Never install, never commit, never
touch the index, never touch another session's files.

### R-golden-final re-verify (crew, 2026-09-23) — GREEN

Post-R1-REGEN-COMPLETE tree, fresh `agentrs b` rebuild first (green,
3.04s release) so the binary matches the final tree:

- **scan-goldens** (`packages/reference-neo/src/fragments/base/
  scan-goldens.test.ts`): GREEN — 1 test, all 4 scales
  (small/medium/enterprise/churn) incl. ×3 determinism, 9.07s.
  The interim `runtimeSha` re-pins hold on the post-regen tree
  with zero further drift — no mechanism diff needed, no regen.
- **harvest-census** (`modules/atomic/tests/harvest-census.test.ts`):
  4/4 PASS. Axis pin stands, no re-pin per map ("pin only if
  drift").
- Pin-diff confirm: the 4 fixture JSONs carry exactly the interim
  regen (4 `runtimeSha` line-swaps only, all other fields
  identical); this crew moved zero bytes.
- Gates (all firsthand): `agentrs c` canon/atomic/typegen/
  styletrace — all PASSED; `agentrs v` canon/atomic/typegen/
  styletrace — all PASSED; virtualrs not run (excluded per
  Q-3-6); `agentneo q` over the 4 pin fixtures → 0 errors,
  0 warnings (0 lintable files — JSON pins, same as interim).
- Index untouched (1063 staged paths all siblings'; zero
  golden/census entries); never installed, never committed,
  no compiler logic touched. §5.12 HOLDS.

## GOLDEN-FINAL-DONE (crew, 2026-09-23)

scan-goldens green + harvest-census 4/4 on the post-regen tree with a
fresh binary; all §1-item-3 gates green; zero files changed by this
crew (the interim re-pins stand as the intended output). Rides the
Obj-2 landing commit.

## Reviewers (crew, 2026-09-23) — WORKING

Scope (strict): Objective 2 Phase 3 scoped battery + dual-home check
on the post-regen tree. Verify + report, NO code fixes — file
failures, don't fix. Read in full: LOG-2 ## Phase-3-map §5
(items 4-14; §5.4 number STALE — post-R-clean gate is 175/176
same-1-fail per R-clean acceptance; §4 hermetic now 11 tiers +
mcp per HQ REVERSAL; §6 chain rows DUAL per HQ DUAL-COVERAGE) +
all crew DONEs + captain acceptances. Constraints: read-only
except this LOG-2.md section (builds/syncs/tests write gitignored
output only; if any command dirties a TRACKED file, stop and
report). Never install, never commit, never touch the index.
NO Dagger (hermetic crew follows). Baseline tracked-modified
count captured to /tmp/reviewers-baseline.txt before runs.

### Battery results (all firsthand, post-regen tree)

| # | Gate | Result |
|---|---|---|
| 4 | Pipeline units 175/176 same-1-fail | **PASS** — 176 tests / 175 pass / 1 fail; the single fail is `src/build/rust/compatibility.test.ts` (R-MR-3 pre-existing RS-contract drift, `pipeline/src/build/` untouched) |
| 5 | Pipeline tsc exactly-6-pre-existing | **PASS** — exit 1 with exactly 6 errors, all TS2835 in `packages/reference-rs/modules/runtime/js/shared/native-contract.ts` (untouched RS territory, zero in-scope) |
| 6 | Icons post-regen REAL links | **PASS** — `pnpm run build` exit 0 (3857 icons + neo sync + rollup + tsc + materialize + requiredFiles assert); `dist/index.mjs` imports clean with **3857 exports**; all 7 requiredFiles present with real payloads; zero bare `@reference-ui/*` imports in dist (7 banner comments only); /tmp neutral-dir tsc probe over dist/types + dist runtime react + baseSystem → exit 0 (**PROBE-TYPES-CLEAN**, incl. the `../styled/index.d.ts` rewrite edge) |
| 7 | LITERAL `pnpm sync` + meta adoption | **PASS** — literal `pnpm sync` (cwd per dir, no equivalents) green **18/18: 7/7 fixtures + 11/11 tiers**; meta spot: sheet carries upstream `fixtureDemoAccent` + local `meta-extend-*` vars, baseSystem exactly `{name,fragment,css,jsxElements}` with upstream fragment text republished (fixtureDemoAccent ×2) + evaluated-system adoption |
| 8 | Docs build + serve + tsc-at-4 | **PASS** — full `pnpm run build` exit 0 (132 modules); serve HTTP **200** + `<title>Reference UI Docs</title>` (server killed after, port verified down); tsc **EXACTLY the 4 Leg A TS2353s** (DocSidebar display + fontWeight, ThemeToggle flex, mdx textDecoration), zero-new |
| 9 | MCP post-regen | **PASS** — typecheck exit 0; vitest **16 files / 89/89**; tsup exit 0, 4 entries incl. `dist/neo-author.mjs` (5.6KB); `pnpm pack` tarball ships neo-author + bin + dist; esbuild **0.28.2 real** via pnpm store (no manual symlink) |
| 10 | Neo cases + tsc + q | **PASS** — REF **26/26** (exit 0, 26 PASS / 0 FAIL), CHAIN **6/6**, CLI-01, CLI-02, WATCH-01, SYNC-03, LAYER-02, SYNC-12 all PASS; package tsc exit 0; `agentneo q` over all 126 touched .ts/.tsx → 13 errors + 4 warns, **all HEAD-proven pre-existing** (9 world header-not-first incl. 7 TYPE + PRIM-01/07, PRIM-09 Map shadow, 3 playground Shell/header; warns: sync.test.ts 495-vs-HEAD-492 length, SYNC-12/PRIM-09 fn length, playground cognitive — every diff confined to import/comment lines) = **0 new** |
| 11 | RS c/v canon/atomic/typegen/styletrace | **PASS** — `c`: canon 58, atomic 658 (+1+1+7+5 all ok), typegen 40, styletrace 49, all exit 0; `v`: canon 15/15, atomic **302/302** (13 files), typegen 21/21, styletrace **28/28** (virtualrs not run, excluded per Q-3-6) |
| 12 | scan-goldens + harvest-census | **PASS** — scan-goldens 1/1 green (R-golden regen pin holds on this tree); harvest-census 4/4 green (pin stands, zero drift) |
| 13 | Discovery enumeration 11+mcp + no-throw | **PASS** — unfiltered `listMatrixPackageDefinitions()` → exactly 11 `@matrix/chain-t*` + `@matrix/mcp`, **NO THROW** (R-MR-2 resolved); workspace enumeration → 12 matrix + 7 fixtures, ENUMERATION-COMPLETE |
| 14 | run.mjs resolution probe | **PASS** — RESOLUTION-PROBE-PASS 12/12 on R2's filed claims: isKnownPackage true for mcp/@matrix/mcp/tests/mcp/T2/T8, false for deleted css/@matrix/css; `T2/T2-contract` → `matrix/tests/chain/T2`; restored `T6/T6-contract` → `matrix/tests/chain/T6`; file:line `T8/…:20` → target with line; deleted-suite query null |

Two probe self-corrections (filed honestly, both my-probe bugs, zero code impact):
- run.mjs: my first probe expected `@matrix/chain-t8` + `chain-t6` spellings and a full `matrix/…` path query plus T2 `:31` (file has 26 lines). The implementation (byte-identical to R2's proved state) recognizes dir names (T2/T8/mcp) + spec names; full `@matrix/chain-t*` spellings and full-path queries return false/null — same as R2 filed, not a regression. Corrected probe passes 12/12.
- discovery probe: first revision read `.name` off `MatrixPackageDefinition` (field is `.packageName`) — fixed, then green.

### Dual-home check (HQ DUAL-COVERAGE: §6 chain rows are DUAL)

| DUAL row | Matrix home | Neo home |
|---|---|---|
| CHAIN-01 + T6 (+T10-extends subset) | T6 ✓ + T10 ✓ e2e present | CHAIN-01 PASS ✓ |
| CHAIN-02 + T7 (+T12-extends subset) | T7 ✓ + T12 ✓ e2e present | CHAIN-02 PASS ✓ |
| CHAIN-03 + T11 (+T13-extends) | T11 ✓ + T13 ✓ e2e present | CHAIN-03 PASS ✓ |
| CHAIN-04 + T9 (topology = T4) | T9 ✓ e2e present | CHAIN-04 PASS ✓ |
| CHAIN-05 (Neo-only new, no tier twin — filed) | n/a | CHAIN-05 PASS ✓ |
| CHAIN-06 (shape pin, no tier source — filed) | n/a | CHAIN-06 PASS ✓ |
| SYNC-10 + T1 + T3 | T1 ✓ + T3 ✓ e2e present | SYNC-10 PASS ✓ (extends.spec.ts, run for this check) |
| KEEP T2 / T8 / mcp ×19 (single-homed matrix) | T2 ✓ T8 ✓ e2e present; mcp 18 .test.ts + global-setup + helpers ✓ = kept ×19 | n/a |

Every DUAL row shows BOTH homes (tier present + Neo case green).
Corroboration: `matrix/` = 8 docs + fixtures/ + tests/ only; top-level
`fixtures/` gone; all 11 tier e2e specs present; all 6 `cases/chain/`
dirs present and green. SYNC-14 PASS (watch.spec.ts, run as the
WATCH-01 split-home confirmation). Tier *greenness* rides the hermetic
crew's Dagger runs (after REVIEW-DONE) — presence + sync-green (item 7)
is this crew's side.

### Cleanliness + evidence

- Tracked worktree diff-set after the full battery is **byte-identical
  to the pre-run baseline** (`diff` exit 0) — all runs wrote gitignored
  output only. Never installed, never committed, index untouched
  (staged = 789 D + 274 R100, zero adds/modifies — ordered
  deletes/renames only; math closes: 517+3+371+10−112 = 789,
  151+11+112 = 274).
- Evidence: `/tmp/reviewers-*` (64 files: per-case agentneo logs,
  pipeline/mcp/rs/tsc outputs, literal-sync per-dir logs,
  discovery/run.mjs/type probes + scripts).

## REVIEW-DONE (crew, 2026-09-23)

Items 4–14 **ALL PASS**, dual-home check **ALL DUAL ROWS BOTH-HOMES
GREEN/PRESENT**, zero failures filed, zero tracked files dirtied.
NO Dagger run (hermetic crew follows per dispatch).

## Golden-final acceptance (captain, 2026-09-23)

GOLDEN-FINAL ACCEPTED. scan-goldens PASSED on my own
run (post-regen tree, no drift from the interim
re-pins); crew reports harvest-census 4/4 + c/v gates
green with zero re-pin needed. §5.12 holds. Awaiting
reviewers for the hermetic trigger.

## Review acceptance — hermetic triggered (captain, 2026-09-23)

REVIEW ACCEPTED. Battery 11/11 PASS with firsthand
evidence per item (literal 18/18 syncs, icons/docs/mcp/
neo/RS/discovery/run.mjs all green with the accepted
reds exactly as filed); dual-home table complete —
every DUAL row both-homes present/green, CHAIN-05/06
honestly filed Neo-only; probe self-corrections filed
honestly; tracked tree byte-identical pre/post; index
math closes (789 D + 274 R100, zero adds/modifies).
My firsthand commit re-runs come at landing (per
skill: before committing, not before hermetic).
HERMETIC CREW DISPATCHED (Dagger 11 tiers + mcp —
the objective-ordered proof run, no theater).

## Hermetic (crew, 2026-09-23) — WORKING

Scope: `@matrix/chain-t1,-t2,-t3,-t6,-t7,-t8,-t9,-t10,-t11,-t12,-t13`
(11 tiers) + `@matrix/mcp` (all 19 files) via the hermetic runner.
Governing skill `test-core` loaded first. Read-only except this
section; never install/commit/index. Baseline git diff-set captured
to /tmp/hermetic-git-baseline.txt (1296 lines) before runs.

Env note (firsthand): Docker daemon DOWN at dispatch
(`docker info` fails, no /var/run/docker.sock, `colima status` =
not running). Colima already installed — started it
(`colima start`, env-only, no repo/install/index touch);
`pnpm agent status` then showed Docker Runtime Active (colima).
Left running for follow-up crews.

### Proof runs (2, both via `pnpm agent test`, no raw runner)

- Run 1 (full scope): `pnpm agent test
  --packages=@matrix/chain-t1,@matrix/chain-t2,@matrix/chain-t3,
  @matrix/chain-t6,@matrix/chain-t7,@matrix/chain-t8,
  @matrix/chain-t9,@matrix/chain-t10,@matrix/chain-t11,
  @matrix/chain-t12,@matrix/chain-t13,@matrix/mcp`
  → FAILED (exit 1) in the shared setup phase, before any
  per-package Dagger work. Full log: /tmp/hermetic-run.log
  (177 lines).
- Run 2 (confirmatory): `pnpm agent test --packages=@matrix/mcp`
  → FAILED identically (same step, same 14 errors).
  Full log: /tmp/hermetic-run-mcp.log.
- No further selections run: both runs die at the same shared
  gate, so per-tier re-runs would be identical-failure theater.
  Zero tiers reached Dagger; zero per-tier results obtainable.

### HERMETIC-RED — per-tier table

| Package | Result |
|---|---|
| @matrix/chain-t1 | BLOCKED (setup) |
| @matrix/chain-t2 | BLOCKED (setup) |
| @matrix/chain-t3 | BLOCKED (setup) |
| @matrix/chain-t6 | BLOCKED (setup) |
| @matrix/chain-t7 | BLOCKED (setup) |
| @matrix/chain-t8 | BLOCKED (setup) |
| @matrix/chain-t9 | BLOCKED (setup) |
| @matrix/chain-t10 | BLOCKED (setup) |
| @matrix/chain-t11 | BLOCKED (setup) |
| @matrix/chain-t12 | BLOCKED (setup) |
| @matrix/chain-t13 | BLOCKED (setup) |
| @matrix/mcp (×19) | BLOCKED (setup) |

0 green, 0 tier failures (nothing ran), 12 blocked at
`Preparing workspace packages and registry... → Build
@fixtures/extend-library` (host-side `prepack` build chain).

### Failure verbatim (filed, NOT fixed)

`tsc -p tsconfig.build.json` in
`matrix/fixtures/extend-library`: **Found 14 errors in 2 files**
(DemoComponent.tsx 12, LightDarkDemo.tsx 2):

- 12× TS7016/TS7026: no declaration file for `react` /
  `react/jsx-runtime` (react@18.3.1), no `JSX.IntrinsicElements`.
- 2× TS2353: `borderRadius` (DemoComponent:33) and `borderStyle`
  (:54) do not exist in `CssStyles[] | SystemStyleObject`.

Root cause A — R2-move staleness (the 12 react errors):
package-local `node_modules` symlinks are DANGLING. R2 moved
packages one level deeper (`fixtures/` → `matrix/fixtures/`,
`chain/T*` → `tests/chain/T*`), invalidating pnpm's relative
links: e.g. `matrix/fixtures/extend-library/node_modules/
@types/react` → `../../../../node_modules/...` now resolves to
nonexistent `matrix/node_modules` instead of root. All 7
fixtures carry exactly 2 dangling links each (@types/react +
@reference-ui/neo); tier dirs likewise (T2 sample: happy-dom,
vitest, typescript, postcss, scheduler, ...). tsc therefore
finds no react types (root `node_modules/@types` holds only
`node`). Remedy is `pnpm install` — FORBIDDEN to this crew
(never install); captain rules.

Root cause B — REAL Neo typegen gap (the 2 TS2353s, true set
wider): fresh `neo sync` output (regenerated inside the run,
not stale) types `css()`'s param as the NARROW
SystemStyleObject (`styled/types/index.d.ts`, 156 lines:
color-ish props + font/container/r ONLY — zero layout/
spacing/radius keys). Fixture src (`DemoComponent.tsx`,
byte-identical to HEAD per `diff` vs `git show HEAD:...`,
tsconfigs also identical) uses borderRadius/borderStyle/
padding/display/flexDirection/gap/borderWidth — all absent
from the narrow type; tsc reports the first per literal
(hence exactly 2). At HEAD this same build passed under
core-generated types, so Neo narrowed `css()`'s accepted
surface (react.d.mts widens only primitive *Props, not
`css()`). No native gate typechecks world call-sites
(Playwright/esbuild + Biome-lint only), so this is the first
typecheck of `css()` literals against Neo types anywhere.
Captain rules: engine widen vs fixture-src narrowing. Even
after a fresh install clears cause A, cause B still reds
this build.

Runner note (filed): `--packages=@matrix/mcp` did NOT narrow
discovery — Run 2's header lists all 12 packages, same as
Run 1. Harmless here (post-Phase-3 matrix IS exactly the
kept 12), but M-runner/captain should know the flag was
decorative in these runs.

### Cleanliness

Tracked diff-set after both runs is byte-identical to the
pre-run baseline (`diff` exit 0 vs
/tmp/hermetic-git-baseline.txt, excluding this log's own
lines). Never installed, never committed, index untouched.
Colima left running. Evidence: /tmp/hermetic-run.log,
/tmp/hermetic-run-mcp.log, /tmp/hermetic-git-baseline.txt,
/tmp/hermetic-git-{after,final}.txt.

## HERMETIC-RED (crew, 2026-09-23)

Kept gate NOT proven: 12/12 packages blocked in shared setup
(fixture `tsc` 14 errors), 0 Dagger executions. Two filed
root causes: (A) R2-move dangling node_modules symlinks
(needs `pnpm install` — not mine to run); (B) Neo typegen
narrow `css()` surface vs HEAD-identical fixture src (needs
captain's fix-vs-accept ruling). No code touched, no fixes
attempted, per dispatch.

## HERMETIC-RED triage (captain, 2026-09-23)

Kept gate NOT proven: 12/12 blocked in host-side setup
(fixture prepack tsc), 0 Dagger executions — the gate
is UNTESTED, not failed (nothing tier-specific red).
Cause A (12 react errors): dangling node_modules
symlinks post-move/restore — remedy fresh install.
R-INSTALL dispatched (sole installer, verifies links
heal). Cause B (2 TS2353, set wider): REAL Neo
typegen gap — fresh sync emits NARROW css() param
(156-line SystemStyleObject, zero layout/spacing/
radius) vs HEAD-identical fixture src using live
layout props. Same class as filed Leg A; possibly
same root (one widen may close both). Fixture-src
narrowing REJECTED (live rules — would gut the proof).
FORK to HQ: (1) engine-widen now (real fix, may close
Leg A too, delays landing ~1 crew cycle + re-verify)
vs (2) scoped assertion at 2 fixture call sites
(honest, commented, Leg-A-pointer; tiers prove
identical CSS; lands tonight). Runner note filed:
--packages flag decorative (harmless — matrix IS the
kept 12). Hermetic re-run after A+B resolved.

## R-install (crew, 2026-09-23)

WORKING (sole installer): package set final, running ONE full
`pnpm install` to heal post-restore dangling links, then
verifying firsthand (links + fixture tsc + git cleanliness).

## HQ ruling — typegen squad (captain, 2026-09-23)

HQ RULED the Cause-B fork: ENGINE FIX NOW (fork
option 1). Typegen narrowing is an engine failure —
full squad (architect → implementers → reviewers) to
widen the emitted css() surface for real + build a
serious native TS test suite around typegen (tsc-
based: positive surface coverage + @ts-expect-error
negatives; new home, NOT matrix — the typescript
suite stays dropped). Landing waits for the squad +
full re-verify + hermetic re-run. R-INSTALL (cause A)
proceeds independently. Architect dispatched first;
implementers/reviewers follow its design.

## R-INSTALL DONE (crew, 2026-09-23)

Cause A HEALED: all post-restore dangling links resolve,
fixture tsc shows ONLY the 2 cause-B TS2353s, tracked
tree undamaged. Install + verify only; never committed.

### Procedure (filed honestly — plain install does NOT heal)

1. `pnpm install` (plain): exit 0 in 578ms, "Already up
   to date" — zero link changes (spot links still
   DANGLING, mtimes untouched). pnpm v10.29.3 does not
   revalidate existing symlinks it considers current.
2. `pnpm install --force`: exit 0, 1282 resolved/refetched
   — still zero link changes (same stale targets). Force
   refetches the store but skips in-place relink equally.
3. Pilot: `rm -rf` extend-library/node_modules (gitignored,
   only 10 regenerable .bin shims inside) + `pnpm install`
   → all 4 links recreated at CORRECT depth, RESOLVE.
   Mechanism proved: pnpm links fresh dirs correctly but
   never rewrites live stale symlinks.
4. Full heal: cleared the 9 stale pnpm-managed dirs only
   (6 fixtures × 2 dangling + T2 × 15 + T8 × 15 + mcp ×
   12; mcp's 1 real file was a stale Sep-7 vitest cache
   results.json) + ONE `pnpm install` → exit 0, 673ms,
   ZERO warnings (the 3 `.bin/node` ENOENT WARNs from
   runs 1–3 self-resolved — same root cause).

### V1 — links (all firsthand)

Ordered spots, all RESOLVE at correct depth (5-up fixture
scoped / 4-up fixture top / 6-up tier scoped / 5-up tier
top): extend-library @types/react + @reference-ui/neo,
T2 happy-dom + vitest + typescript + postcss + scheduler.
Full sweep: 19/19 pnpm-managed matrix node_modules show
0 dangling (7 fixtures + 11 tiers + mcp). Untouched by
design: mcp/.reference-ui/node_modules (1 dangling, neo-
managed, not pnpm's — next `neo sync` owns it) and all
0-dangling dirs (T1/T3/T6/T7/T9–T13 were already fresh).

### V2 — tsc (extend-library, gate preconditions)

Pre-install baseline (firsthand): 14 errors = 12 react
(TS7016/TS7026, cause A) + 2 TS2353 (cause B:
borderRadius 33:9, borderStyle 54:11). Post-heal bare
tsc showed 2 TS2307 `@reference-ui/react` — MY artifact
(the rm also removed neo-sync's shim links, which pnpm
never creates; the gate always syncs before tsc). Ran
the pipeline-identical precondition (`pnpm --filter
@fixtures/extend-library run sync`, exit 0, writes only
ignored .reference-ui/ + node_modules) → tsc now shows
EXACTLY the 2 cause-B TS2353s (same lines/codes), all
12 react errors gone. Cause A closed; cause B stands
verbatim for the typegen squad. All tsc runs used
--outDir /tmp (dist/ untouched).

### V3 — tracked-tree cleanliness

`git status` entry-count 1296 before/after; the ONLY
tracked file written in my window is LOG-2.md (this
crew's ordered log lines + captain's concurrent HQ-
ruling append — another session's lines, not mine,
verified intact above). pnpm-lock.yaml md5 IDENTICAL
before/after (cbae157f…): zero churn, stronger than
ordered — no pins moved (pin-set md5 a6b5f5b8…
identical), worktree diff shape unchanged (287 files,
+20 insertions = 6 mine + 14 captain's, deletions
identical). No code edits, no commits, no sibling files.
Evidence: /tmp/rinstall-{heal,pilot}.log,
/tmp/rinstall-tsc-{pre,post2}, /tmp/rinstall-git-*.txt.

## R-install acceptance — Cause A HEALED (captain, 2026-09-23)

R-INSTALL ACCEPTED. Verified firsthand: links resolve
at correct depth, react types present, fixture tsc
shows EXACTLY the 2 cause-B TS2353s (12 react errors
gone). STANDING FINDING (recorded): pnpm v10.29.3
never rewrites live stale symlinks — plain AND
--force installs no-op on them; post-move heals
require clearing stale node_modules dirs + reinstall.
Future moves take note. Cause B now the sole hermetic
blocker — typegen squad (architect working) owns it;
hermetic re-run after the squad lands + re-verify.

## Typegen-architect (crew, 2026-09-23) — DONE

Scope (strict): DESIGN ONLY, read-only except this
section. No repo edits, no suites run, no commits, no
index touch. Governing skill `agent-rs` loaded first.
Read in full: LOG-2 §Hermetic/WORKING + HERMETIC-RED +
triage + HQ ruling; Leg A state (docsconf verdicts +
acceptance + shorthands acceptance); axis-shorthands
WORKING/DONE incl. the SPACING_KEYS precedent; Phase 0
retarget table; R-install acceptance. Every file:line
below is firsthand.

### (1) DIAGNOSIS — the narrowing rule, why it is lossy, one fix or two

The rule lives in
`packages/reference-rs/modules/typegen/src/emit/style.rs`
(`collect_props`, :72-92 + `gather`, :58-70). Per
project it emits `StyleProps` keys from exactly three
families, each GATED on that project defining tokens
of the matching category (`has_category`, :164-169):

- color keys (`color_prop_names`, :109-118 —
  `canon::COLOR_PROPERTIES` + color-resolving aliases),
  gated on a `colors` category;
- spacing keys (`spacing_prop_names`, :120-130 —
  aliases/canonicals whose canonical starts with
  `padding`/`margin`), gated on a `spacing` category;
- radius keys (`radius_prop_names`, :132-140 —
  canon names ending in `Radius`), gated on a `radii`
  category;
- plus unconditional `container`, `r`, and the
  `FontProps` mix-in. Raw `font`/`weight`/`container`/
  `r` CSS names are deliberately omitted
  (`is_omitted_css`, :105-107).

WHY it is lossy, in two independent dimensions:

(a) Category gating drops live families. The
extend-library proof: its tokens are colors-only, so
fresh `neo sync` emits `SpacingToken = never` /
`RadiusToken = never` and a 156-line
`styled/types/index.d.ts` (verified firsthand,
`matrix/fixtures/extend-library/.reference-ui/
styled/types/index.d.ts`) with ZERO spacing/radius
keys — while its own `DemoComponent.tsx:30-57` uses
`padding` + `borderRadius` with literal values. The
gate buys nothing: values already carry the open
`(string & {})` hatch, so token-less projects can
still spell every value — they just lose the KEYS.
Same for `docs`: `ThemeToggle` uses `borderRadius:
'md'` + `padding: '2r 3r'` behind the first-reported
`flex` error (latent set, docsconf-filed).

(b) Whole families are never emitted for ANY
project. Layout (`display`, `position`, `flex`,
`flexDirection`, `gap`, `width`, `zIndex` …),
typography (`fontSize`, `fontWeight`,
`letterSpacing`, `textDecoration`, …), border
non-color (`borderStyle`, `borderWidth`, …),
effects (`boxShadow`, `cursor`, `transition`,
`opacity` …), the `size` reference prop
(`css({size:'20px'})` in NEO-CSS-10/NAMER-02
worlds), and `--custom` properties (NEO-CSS-04
`'--foo': 42`) have no emitter. The header comment
says it outright: "not the full CSS table and not
`gap`" (style.rs:4-5). The compiler accepts all of
them — `resolve/mod.rs:147` gates only on
`canon::is_known_style_prop` (any of 1073
`CANONICAL_PROPERTIES` + 319 `ALIASES` + reference
props + `--*`), and the runtime artifact bakes the
same full set (`atomic/src/runtime/plan.rs:203-217`
`build_style_prop_names`). Principle violated:
KEYS follow the token spec, but the compiler
follows canon. Keys must follow the compiler;
values follow the spec.

Loss ledger vs live users (firsthand call-sites):
fixture `DemoComponent` needs `borderRadius`
(gated-away) + `padding` (gated-away) + `display`/
`flexDirection`/`gap`/`borderStyle`/`borderWidth`
(never-emitted); docs Leg A needs `display`/
`fontSize`/`fontWeight`/`flex`/`textDecoration`/
`minWidth`/`letterSpacing`/`cursor`/`transition`/
`boxShadow`/`textUnderlineOffset` (all
never-emitted) + latent `borderRadius`/`padding`.

ONE FIX, not two. Leg A and Cause B are the same
narrow type from the same emitter: docs `CssStyles`
is `SystemStyleObject` (`neo/src/sync/publish/
types-bundle.ts:88`), and fixture `css()` takes
that same alias (`react.d.mts` named graph,
types-bundle.ts:98). Primitives never reddened
only because `stylePropsWiring` (:47-57) widens
react `StyleProps` over the full artifact
`StylePropName` list — `css()`/`SystemStyleObject`
is the one unwidened consumer. A single typegen
widen closes both.

Why native never caught it (filed so the suite
design answers it): `packages/reference-neo/
tsconfig.json:17-19` maps `@reference-ui/react`
to the WIDE source `react-surface.d.ts`
(`CssStyles = Record<string, unknown>`, :335-336),
so all 37 world typechecks pass regardless of
generated output. Only three gates touch the
narrow generated types: Neo `type/` cases (real
generated `.d.mts` via world tsconfig paths),
fixture prepack `tsc -p tsconfig.build.json`, and
docs `tsc --noEmit`. The suite below extends the
first; the re-verify runs the other two.

### (2) WIDENING DESIGN

Rule change (in `emit/style.rs` only; `strict.rs`,
`fonts.rs`, `tokens.rs` untouched except as noted):

- KEY SET = the runtime-accepted set, mirroring
  `build_style_prop_names` (plan.rs:203-217):
  every `CANONICAL_PROPERTIES` name + every
  `ALIASES` alias + `size` + `container` + `r`,
  MINUS `font`/`weight` (FontProps owns them,
  keep `is_omitted_css`) MINUS `variant`/
  `colorMode` (primitive metadata, keep excluded).
  New size ≈ 1073 + 319 + 3 − 4 ≈ ~1390 keys,
  still BTreeMap-sorted/deterministic.
- DROP the `has_category` gates on keys. Keys
  become project-independent (same keys for the
  colors-only fixture and the full style dump);
  only token unions / FontRegistry / conditions
  stay per-project.
- VALUE ASSIGNMENT (precedence order): `container`
  → `CONTAINER_VALUE`, `r` → `RHYTHM_VALUE`
  (unchanged); current color rule →
  `COLOR_VALUE`; current spacing rule →
  `SPACING_VALUE` (`gap` stays OUT of spacing —
  it falls to Open, values still accepted);
  current radius rule → `RADIUS_VALUE`; every
  other key → NEW `OPEN_VALUE =
  "StylePropValue<string | number>"`. Numbers are
  required: NEO-CSS-04 pins `width: 42`,
  `opacity: 1`, `zIndex: 0` compiling.
- ADD a `--*` template-literal index to
  `StyleProps`: ``[K in `--${string}`]?:
  StylePropValue<string | number>``. Precise
  (does not weaken excess-prop checks on named
  keys, unlike a string index), covers NEO-CSS-04
  `'--foo': 42`. TS 4.4+ feature; repo is TS 5.x.
- KEEP token-family values string-hatched
  (`Token | (string & {})`, no `| number`):
  minimal churn, no live call-site needs numeric
  color/spacing/radius in `css()` (`margin: 0`
  exists only in wide-typed `globalCss`,
  `system-surface.d.ts:19`). File numeric-token
  values as a follow-up, not this fix.
- STRICT stays category-gated (hardening
  REQUIRED): `strict::normalize` currently skips
  empty key sets (:106) — with ungated keys that
  check goes dead, and `strict: ['spacing']` on a
  token-less project would narrow keys to
  `SpacingToken = never` + keywords. Pass
  category presence into `StrictKeys`/`normalize`
  so wrappers still emit only for present
  categories. Strict key SETS are unchanged
  (same color/spacing/radius rules).

Golden impact (all `modules/typegen/tests/goldens/`):

- `styles.d.ts`, `styles-fonts.d.ts`: StyleProps
  block grows ~150 → ~1390 lines. PURELY
  ADDITIVE (axis-shorthands precedent:
  SPACING_KEYS += 4 was 4 lines ×3 files, zero
  removals — this is the same shape, larger).
  Token lines, FontProps, SystemStyleObject tail:
  byte-identical.
- `styles-strict.d.ts`: same StyleProps growth;
  `ColorPropKeys`/`RadiiPropKeys`/
  `SpacingPropKeys` unions UNCHANGED on the style
  fixture (all three categories present) —
  implementer verifies by diff, not by trust.
- `tokens`, `recipes`, `recipes-two`, `compound`,
  `fonts` goldens: unchanged.
- Regen mechanism: `TYPEGEN_UPDATE_GOLDENS=1
  pnpm agentrs c typegen` (mod.rs golden helper).
- Cargo tests: `style.rs` gains an `OPEN_KEYS`
  const (e.g. `display`, `flexDirection`, `gap`,
  `borderStyle`, `borderWidth`, `fontSize`,
  `size`) + `--*` index pin; `strict.rs` pins
  hold; `forbid.rs` needles (`BoxProps`,
  `patterns/`, `recipes/`, …) must stay absent;
  `boundary.rs` contains-pins hold.

Blast radius — every generated-types consumer +
re-verify per consumer (implementer C scope):

| Consumer | Effect | Re-verify (all firsthand) |
|---|---|---|
| 7 `matrix/fixtures` | regen grows; fixture tsc is THE Cause-B proof | `tsc -p tsconfig.build.json` per fixture → 0 errors (extend-library was the 2×TS2353 red) |
| 11 `matrix/tests/chain` tiers | regen only; no pipeline typecheck phase (deleted) | hermetic re-run `pnpm agent test` kept scope → green |
| `packages/reference-docs` | regen; tsc 4 Leg-A TS2353s → 0 | `neo sync` + `tsc --noEmit` clean + vite build exit 0 + serve 200 (docsconf precedent) |
| `packages/reference-icons` | regen; no `css(` sites; tsc in build.mjs | `pnpm run build` exit 0 (tsc leg + requiredFiles) |
| `packages/reference-lib` | regen; no `css(` in src (grep book/stories too) | lib build + book typecheck green |
| `packages/reference-mcp` | none expected (no css-type consumption; row-10 reads fragments) | mcp unit suite 89/89 still green |
| Neo `type/` cases 01-07 | must stay green (TYPE-02 negative is at a `ColorToken` union position — widening-safe) | `agentneo run NEO-TYPE` (each id) green |
| Neo worlds/package | none (wide source types unchanged) | package `tsc --noEmit` 0 + NEO-REF 26/26 green |
| RS `styletrace` | none expected (hand-written decl fixtures, shape-based — `neo_decl_roots.rs`); wiring shape unchanged | `agentrs c/v styletrace` green |
| RS `atlas`/`tasty`/`virtualrs`/`canon` | none (no prop lists; canon untouched) | `agentrs c/v` adjacent green |
| `matrix/mcp` ×19 | via fixture builds + server | hermetic re-run green |

`types-bundle.ts` `stylePropsWiring` needs NO
change: `Exclude<StylePropName, keyof
NarrowStyleProps>` legally shrinks as Narrow
widens; react `StyleProps` stays a superset.
`react-surface.d.ts` wide source: untouched.

### (3) TS-SUITE DESIGN — native homes, real output, full surface

HOME (per HQ: native, matrix stays dropped — the
`typescript` suite stays dropped):

- RS: extend `modules/typegen/tests/` — the
  `tsc.ts` temp-dir harness + `style-05.test.ts`
  pattern already exist; grow them, no greenfield
  harness.
- Neo: extend the EXISTING `type/` group
  (`tests/cases/type/NEO-TYPE-08`, +09 only if
  pos/neg split demands it; TESTS.md row) — the
  group already compiles temp consumers against
  REAL generated `.d.mts` via world tsconfig
  paths (TYPE-02 precedent).

RS suite (runs under `pnpm agentrs v typegen`,
fast tsc in temp dirs):

- T1 FULL-SURFACE POSITIVE: build the consumer
  source PROGRAMMATICALLY from canon
  (`CANONICAL_PROPERTIES` + `ALIASES` + `size`/
  `container`/`r` — import the lists, do not
  hand-enumerate) assigning every key in
  `SystemStyleObject` fresh literals, against
  REAL `emitDtsSync` output (never the golden
  file) for TWO specs: the full style dump AND a
  colors-only spec shaped like extend-library
  (the Cause-B shape — keys must not depend on
  categories). tsc exit 0. Chunk if slow;
  measure first (~1400 keys is one literal, tsc
  handles Panda's 8000-line equivalent today).
- T2 PER-FAMILY VALUE PROBES: token literal +
  arbitrary string per token family; number on
  Open keys (`width: 42`, `zIndex: 0`,
  `opacity: 1` — NEO-CSS-04 values); responsive
  arrays incl. `null`; nested `_hover`/`@sm`;
  `'& > span'` selector; `'--foo': 42`. tsc
  exit 0.
- T3 NEGATIVES (`@ts-expect-error`, fresh
  literals so TS2353 fires): `definitelyNotAProp`,
  a near-miss typo (`colour`), a junk key nested
  under `_hover`. Each unused-`expect-error`
  directive fails the run if the emitter ever
  widens to accept it — self-policing.
- T4 STRICT PINS: strict `['colors']` output
  still rejects a non-token string on a color
  key (`@ts-expect-error`) while Open keys stay
  open; strict on a colors-absent spec emits NO
  `StrictColorProps` wrapper (category-gate
  hardening pin). tsc exit 0 / directed.

Neo suite (one case, real sync — the Cause-B +
Leg-A regression pin in one):

- NEO-TYPE-08: world with colors-only tokens
  (Cause-B shape). Spec materializes a temp
  consumer (TYPE-02 precedent — cannot live in
  repo: the harness pre-run typecheck resolves
  react to the wide surface) calling REAL
  generated `css()` with the UNION of the
  fixture prop set (`borderRadius`, `padding`,
  `display`, `flexDirection`, `gap`,
  `borderStyle`, `borderWidth`) + the docs Leg-A
  set (`fontSize`, `fontWeight`,
  `textDecoration`, `flex`, `minWidth`,
  `letterSpacing`, `cursor`, `transition`,
  `boxShadow`, `textUnderlineOffset`) +
  numerics (`width: 42`) + `'--custom': 1` →
  `tsc --noEmit` exit 0 against the world's own
  `.reference-ui`. Negative file (bogus prop,
  group precedent: expect exit ≠ 0 with TS2353,
  or `@ts-expect-error` expecting exit 0 —
  implementer picks per TYPE-02/03 precedent,
  reviewer confirms).
- Gate: `agentneo run NEO-TYPE-08` green + `q`
  0/0 on authored files.

Non-goals: no matrix work, no `runTypecheck`
resurrection, no Panda-shape pins (SYNC-02
forbids), no per-token-value exhaustiveness
(token unions already pinned by TYPE-02 +
goldens).

### (4) CREW PLAN — disjoint scopes + reviewer gates

- IMPLEMENTER A — RS widen (`modules/typegen/
  src/emit/style.rs` + `src/tests/` + goldens
  ONLY): the rule change + strict category-gate
  hardening + `OPEN_KEYS`/index pins + golden
  regen + `agentrs c/v typegen` green + `agentrs
  q` on every touched file (quality law:
  CC ≤ 10, no clippy allows, 2-6 sentence
  headers hold).
- IMPLEMENTER B — TS suites (RS
  `modules/typegen/tests/*.ts` + Neo
  `tests/cases/type/NEO-TYPE-08` + TESTS.md row
  ONLY): T1-T4 + NEO-TYPE-08 per §3. B develops
  against the LIVE emitter: reds on the pre-fix
  tree PROVE the gap (record them), green after
  A lands. B may land before A (failing) only
  if the captain wants the red-first proof in
  tree; default: B lands after A, all green.
- IMPLEMENTER C — consumer re-verify (NO
  tracked-src edits; regens are gitignored
  `.reference-ui` output + this log): re-sync
  every consumer, run the §2 table left to
  right, file the per-consumer PASS/FAIL table
  with firsthand commands. C owns the docs
  4→0 and fixture 2→0 typecheck proofs.
- REVIEWER GATE 1 (rule): key-set derivation
  mirrors `build_style_prop_names` EXACTLY —
  reviewer diffs the two sets programmatically
  (allowed delta: only the four documented
  exclusions + `size`/`--*` additions); strict
  category-gate proven by T4; forbid needles
  absent; `agentrs q` clean.
- REVIEWER GATE 2 (suite): suite RED on the
  pre-fix emitter (stash-check A, run B —
  must fail; unstash — must pass); negatives
  genuinely invalid (not canon/alias/reference/
  condition/`--*`/`&*` — reviewer greps canon);
  T1 enumerates from canon lists, not a
  hand-picked subset.
- REVIEWER GATE 3 (consumers + hermetic):
  §2 table fully green firsthand; then hermetic
  re-run (`pnpm agent test`, kept scope) green
  — the gate Cause B blocked.
- LANDING: squad rides the Objective 2 landing
  commit uncommitted (axis-shorthands
  precedent); captain commits per Obj-2 law.
  R-install's Cause-A heal stands independent;
  no coordination needed beyond the shared
  hermetic re-run.

DONE: diagnosis (narrowing rule + two loss
dimensions + one-fix verdict), widening design
(rule/key-family change + golden impact + full
consumer blast radius + per-consumer re-verify),
TS-suite design (RS T1-T4 + NEO-TYPE-08, native
homes, real-output positives + expect-error
negatives, matrix stays dropped), crew plan
(A/B/C disjoint + three reviewer gates). No
implementation — build crew is unblocked.

## Architect acceptance + A/B dispatched (captain, 2026-09-23)

ARCHITECT ACCEPTED: diagnosis (collect_props two loss
dimensions + loss ledger), ONE-FIX verdict (Leg A =
Cause B, same emitter), widening design (rule + golden
impact + 12-row consumer blast radius), TS-suite
design (RS T1-T4 + NEO-TYPE-08, native homes, real
output), crew plan (A/B/C + 3 reviewer gates). No
implementation (as briefed). Dispatched Typegen-A (RS
widen) + Typegen-B (TS suite, red-first then green
after A) in parallel, disjoint files. C (consumer
re-verify) + reviewer gates follow A/B DONE.

## Health tick (captain, 2026-09-23)

Obj-1 COMPLETE. Obj-2: hermetic RED triaged (A healed
+ accepted, B = typegen squad in flight); architect
DONE + accepted; A/B working. Objs 3/4/5 untouched.
Roster: tgarch exiting (DONE filed), tga/tgb running,
all else result_ready; peers unchanged (5, none
mission). Deadlock test: clean. No HQ park/stop. No
commits. Next: A/B DONE → C → reviewer gates →
hermetic re-run → landing sweep → commit.

## Typegen-B (crew, 2026-09-23) — DONE

Scope (strict): RS `modules/typegen/tests/*.ts` + Neo
`tests/cases/type/NEO-TYPE-08` + TESTS.md row ONLY. No
installs, no commits, no index touch. Sibling A owns
`src/emit` + `src/tests` + goldens (disjoint, not
crossed). Governing skills `agent-rs` + `agent-neo`
loaded first; architect §3 + §4 (IMPLEMENTER B) read in
full and binding.

Plan: T1 (canon-enumerated full-surface positive, real
`emitDtsSync` output, full dump + colors-only specs) +
T2 (per-family value probes) + T3 (`@ts-expect-error`
negatives, fresh literals) + T4 (strict pins) in one
new `tests/surface.test.ts`, growing `tests/tsc.ts`
with shared assert helpers (style-05 pattern, no
greenfield harness); NEO-TYPE-08 (colors-only world,
real generated `css()` union call + TS2353 negative,
TYPE-02 precedent). Pre-fix reds filed below as the
gap proof; DONE after A lands, all green.

Pre-fix tree verified firsthand: `src/emit/style.rs`
has no OPEN keys; working-tree golden diff is the
axis-shorthands payload (`marginX/marginY/paddingX/
paddingY`, +4 lines), not A's widening.

### Pre-fix reds (filed — the gap proof, all firsthand)

RS `pnpm agentrs v typegen`: 28/35 green (all
pre-existing seam/style-05/strict green, no
collateral); 6 gap reds + 1 fixed test bug:
- T1 enumeration integrity GREEN: 1391 keys from
  canon lists (1073 + 319 + refs + container −
  owned), contains display/fontSize/gap/
  borderStyle/size/container/r, excludes
  font/weight/variant/colorMode.
- T1 full dump RED: TS2353 on first
  never-emitted key ('MozAnimation'); emitted
  block 152 keys vs 1391-key consumer. ~300ms —
  no chunking needed.
- T1 colors-only RED: same TS2353; emitted
  block 99 keys (spacing/radius gated away).
- T2 families/arrays/nesting GREEN (anchors);
  T2 numerics RED (width/zIndex/opacity
  unknown); T2 '--foo' RED (no --* index).
- T3 all GREEN (bogus keys rejected pre- and
  post-fix; `colour` carries TS2561
  did-you-mean, pinned as such — first run
  caught my own TS2353 over-pin, fixed).
- T4 strict-colors rejection GREEN; T4
  open-under-strict RED (width/display
  unknown); T4 colors-absent RED on the tsc
  half (TS2353: 'color' gated away on the
  radii-only spec) with the no-StrictColorProps
  string pin GREEN.
- `agentrs q` clean on `tests/surface.test.ts`
  (new, T1-T4) + `tests/tsc.ts` (grown with
  expectTscOk/expectTscReject).

Neo `pnpm agentneo run NEO-TYPE-08`: RED —
positive.ts(4,3) TS2353 'borderRadius' does
not exist in 'CssStyles[] | SystemStyleObject'
on the colors-only world (Cause-B reproduced;
negative + paint legs unreached). Control
NEO-TYPE-02 PASS (harness healthy).
`agentneo q` 0 errors / 0 warnings on authored
files (case-dir invocation also walks
gitignored `.reference-ui` sync output —
scoped to the 9 authored files).

Waiting on Typegen-A DONE, then re-run all
green per default (land after A).

### Post-A greens (filed — all firsthand, same commands)

A DONE + captain-accepted (D1 approved: `--*`
index as leading `& {...}` member, same
contract). Rebuilt widened binary in tree:
- `pnpm agentrs v typegen`: 4 files / 35 tests
  green — all 6 gap reds flipped (T1×2,
  T2 numerics, T2 custom-prop, T4
  open-under-strict, T4 colors-absent); T3 +
  anchors stayed green throughout.
- `pnpm agentneo run NEO-TYPE-08`: PASS —
  positive union exit 0, negative TS2353,
  brand paint + flex display legs green.
- `agentrs q` clean on both RS files;
  `agentneo q` 0 errors / 0 warnings on all 9
  authored files.
- Footprint: `surface.test.ts` (new) +
  `tsc.ts` (assert helpers) + NEO-TYPE-08
  (new, 8 files) + TESTS.md row. A's
  `src/emit` + `src/tests` + goldens never
  touched; no installs, commits, or index
  touches. Reviewer gate 2 + implementer C
  unblocked.

## Typegen-A (crew, 2026-09-23) — WORKING

Scope (strict): `modules/typegen/src/emit/style.rs` +
`src/tests/` + goldens ONLY. Sibling B owns
`tests/*.ts` + NEO-TYPE-08 — read (this section cites
them) but never edited. Never install, never commit,
never touch the index. Governing skill `agent-rs`
loaded first; architect §1/§2/§4 read in full.

### Recon (read-only, firsthand)

- Narrowing rule confirmed at `style.rs:72-92`
  (`collect_props` + three `has_category` gates) +
  `gather :58-70`. Family builders `:109-148`
  preserved verbatim; only the gates + key universe
  change.
- Canon facts: `REFERENCE_PROPS =
  [colorMode, r, size, variant, weight]`
  (`dialect.rs:360`); `container` + `size` + `font`
  are canonical (`find_property` some);
  `weight`/`variant`/`colorMode` are reference-only;
  none of the seven is an alias; 1073 canonical +
  319 aliases (design arithmetic holds).
- Runtime mirror: `plan.rs:203-217`
  `build_style_prop_names` = canonical + aliases +
  reference minus variant/colorMode. Typegen delta
  after widen: minus `font`/`weight` only.
- Existing `tests/*.ts` (B-owned, read-only
  here): strict.test.ts negatives are TS2322
  value-shape fails (widening-safe); style-05 +
  seam are contains-pins (safe). No narrowness
  asserts to collide with.
- `emit/mod.rs:7` header ("color or spacing
  tokens") is stale pre-existing (N5 proves
  StyleProps on empty systems) — outside scope,
  flagged, not touched.

### Plan

`style.rs`: ungated `collect_props` (families first
via existing builders, then container/r, then Open
fill over the runtime-mirrored universe minus
font/weight); new `PropKind::Open` =
`StylePropValue<string | number>`; `--*` index line;
strict hardening as a category-presence pre-filter
in `style.rs` (keeps `strict.rs` byte-identical per
the ONLY scope — contract-identical to passing
presence into `normalize`). Tests: `OPEN_KEYS` +
index pin (new TYP-STYLE-06; 05 is B's tsc test),
strict-03 gap flip to Open pin, new TYP-STRICT-06
absent-category pin + mod.rs colors-only helper.
Then `q` per file, golden regen, additive-diff
proof, `c`/`v` green.

### Implementation (7 files, scope-held)

`src/emit/style.rs`: ungated `collect_props`
(family builders byte-identical, then
container/r, then Open fill over
`open_prop_names` mirroring
`build_style_prop_names` line-for-line minus
font/weight); new `PropKind::Open` =
`StylePropValue<string | number>`; strict
hardening as a category-presence pre-filter
(`present_strict` — `strict.rs` byte-identical
per the ONLY scope, contract-identical to the
designed presence-passing); `--*` index as a
LEADING intersection member (see deviation D1).
`src/tests/`: new TYP-STYLE-06 (`OPEN_KEYS` 7 +
index pin + variant/colorMode exclusion),
TYP-STRICT-03 gap flip to Open pin, new
TYP-STRICT-06 absent-category pin + mod.rs
colors-only helper. 3 style goldens regenned.

### Deviation D1 — index shape (forced by tsc)

The design's literal spelling (index INSIDE the
named-keys literal) is illegal TS: tsc rejects
the golden with TS7061 "A mapped type may not
declare properties or methods" (9 golden-based
positives red firsthand). Fix: the index rides
its own leading `& {...}` member of the
StyleProps alias — same type, same contract,
excess checks intact (B's T3 TS2353/TS2561 pins
green). Side benefit: the golden diff stays
LITERALLY additive (a trailing member would
rewrite the `};` line).

### Diff evidence (vs ORIGINAL pre-widen goldens, by diff)

- 5 non-style goldens byte-identical (md5).
- styles/styles-fonts/styles-strict: 0 removed
  lines each, +1241 each (1239 named Open keys +
  index + `} & {`); every added line a prop line
  or the index.
- StyleProps 152 → 1392 value lines (1391 named
  keys, byte-sorted, + index); families 97 Color
  + 32 Spacing + 21 Radius + container + r +
  1239 named Open; token/FontProps/tail lines
  untouched by construction of the diff.
- Strict unions on the style fixture:
  ColorPropKeys/RadiiPropKeys/SpacingPropKeys all
  byte-identical; font/weight/variant/colorMode
  0 hits in the StyleProps block.
- Baselines: /tmp/tga-goldens-before/ (md5s in
  this crew's WORKING window).

### Gates (all firsthand)

- `agentrs c typegen`: 42/42 green (40 + 2 new).
- `agentrs v typegen`: 4 files / 35 tests green —
  incl. B's in-tree T1/T2/T4 live-emit positives
  after one `agentrs b` rebuild (B's 6 reds were
  TS2353-on-stale-binary red-first, not TS7061;
  rebuilt binary + fixed emit = all green).
- `agentrs q`: all 7 touched files pass, exit 0 —
  one carried WARNING: `value_for` cognitive 18
  (>15 warn, <20 fail) from the 6th match arm;
  kept the exhaustive match over metric-gaming
  (a table would lose exhaustiveness).
- Footprint: exactly the 7 scoped files;
  `tests/*.ts` + NEO-TYPE-08 never touched (B's
  `tsc.ts` M + `surface.test.ts` ?? in tree are
  B's); staged area elsewhere is other crews' —
  zero staged changes in typegen/; no installs,
  no commits.

## TYPEGEN-A DONE (crew, 2026-09-23)

Widen landed per the binding design with one
tsc-forced shape deviation (D1, same contract):
keys mirror the runtime set (1391, sorted,
project-independent), token families keep values
+hatch, Open `string|number`, `--*` index,
strict still category-gated with unchanged key
sets. Goldens purely additive by diff; c 42/42,
v 35/35, q clean on all 7 files. Reviewer gates
1–3 + implementer C unblocked.

## Typegen-A acceptance (captain, 2026-09-23)

TYPEGEN-A ACCEPTED. Verified firsthand: golden
purely additive (3739+/0- across 3 files), all
previously-missing families present (display/padding/
borderRadius/gap/fontSize/marginY/borderStyle + `--*`
index at :65), cargo typegen 42/42 on my run. D1
deviation APPROVED (same contract: tsc forbids the
index inside the named-keys literal, TS7061 — the
leading `& {...}` member is the correct spelling).
Reviewer gate 1 + implementer C unblocked; B lands
green on this emitter.

## Health tick (captain, 2026-09-23)

Obj-1 COMPLETE. Obj-2: typegen squad — A DONE +
accepted (widen live), B working exactly on-plan
(pre-fix reds filed, Cause-B reproduced, control
green, q clean; now unblocked by A DONE → green
runs). Objs 3/4/5 untouched. Roster: B running, all
else result_ready. Deadlock test: clean, no pings.
No HQ park/stop. No commits. Pending HQ: patterns/
Map crew nod, Q-3-7, R6 landing nod. Next: B DONE →
C (consumer re-verify) + reviewer gates → hermetic
re-run → landing sweep → commit.

## Assessor: patterns verdict + Objective 2 state (2026-09-23)

GENERAL ASSESSOR, Objective 2, HQ-directed. Assessment
only: read-only throughout (this section is the sole
write); probes were reads + greps only, no installs,
no suites run, index untouched, nothing committed.
Every file:line below is firsthand on the current
tree (HEAD = pre-Obj-2-landing; core dir deleted in
the staged tree, so core cites are `git show HEAD:`
/ `git grep HEAD`).

### (1) PATTERNS VERDICT — Pandaism charge SUSTAINED, delete with no replacement

**Pipeline trace (firsthand).** Author call
`extendPattern()` + `box-pattern` collector live at
`packages/reference-neo/src/fragments/api/patterns.ts`
(:26 fn, :16-20 config `box-pattern` /
`__refBoxPatternCollector`). It is byte-identical in
shape to core's at HEAD (`system/api/patterns.ts`)
except the docstring: core says "Extend the **Panda**
box pattern ... during config generation"; Neo
scrubbed it to "Extend the box pattern ... during
sync" — the rename without the rehoming.
Callers: ZERO in userland. Repo-wide
`git grep "extendPattern(" HEAD`: only core-internal
(`container.ts:11`, `size.ts:17`, `r.ts` top-level
side-effect, the generated font-pattern file),
tests (core + Neo `patterns.test.ts`, Neo
`evaluate.test.ts` fixture string), generated shims
(`sync/publish/system.ts` template), SPEC prose, and
docs prose. No fixture, lib src, docs src, matrix
suite, or Neo world calls it — a worktree world grep
hits ONLY gitignored `.reference-ui/system.*`
generated output (the published shim, not authorship).
Collection path: registered in
`fragments/base/index.ts:135`, bucket pulled at :319,
merged into the spec ONLY as provenance rows at :336
via `patternProvenance` (:432-437:
`{source, kind:'fragment'}` — no keys, no payload).
`EvaluatedSystemSpec` (from `@reference-ui/rust/
contracts`) has NO patterns field: the extension
objects (properties + transform closures) are
evaluated, bucketed, and dropped. Publish path:
`sync/publish/system.ts:61-63` + `:95` stamp an
`extendPattern` shim into EVERY generated
`system/system.mjs` + `system.d.mts`; declared wide
(`Record<string, unknown>`) at
`author/system-surface.d.ts:22-23`; re-exported by
three barrels (`fragments/api/index.ts:27-32`,
`fragments/index.ts:10-27`, `author/index.ts:29-33`).
Downstream consumers: NONE, verified four ways. (a)
RS: zero `extendPattern|box-pattern` hits across all
of `packages/reference-rs`. (b) Provenance is
write-only metadata in `evaluated-system.json`; no
reader consumes `kind:'fragment'` rows (MCP reads
`spec.tokens` only). (c) Box primitive: Neo HAS no
`box()` — factory primitives resolve through `css()`
(`primitives/runtime/factory.ts:51`, header :3);
core's primitives imported `{ box } from
'@reference-ui/styled/patterns/box'` (HEAD
`system/primitives/index.tsx:5`). Neo `styled/` is
data-only per D4; `styled/patterns/` is a FORBIDDEN
output path (PLAN.md:252); `sync/publish/styled.ts`
has zero pattern hits. (d) Codegen/typegen: nothing
emits or reads pattern extensions (typegen
forbid-needles keep `patterns/` out, per the
architect's §2).
What breaks if it goes: only pins, no behavior. The
deletion surface is ~10 src/test files + prose:
`patterns.ts` + `patterns.test.ts` (delete),
3 barrel line-blocks, `system-surface.d.ts:22-23`,
`system.ts` shim lines (mjs + d.mts),
`fragments/base/index.ts` (:26 import, :135
registration, :319 bucket, :336 spread, :432-437
helper), `evaluate.test.ts` (MORE_FILE :46/:71-75 +
`toHaveLength(6)` :244 + `kind:'fragment'` :262),
SYNC-12 spec (:23/:47/:95 surface lists) + README
(:5), `sync/SPEC.md:12` dialect line, `type/SPEC.md:40`
D6 line, live doc `REFERENCE_UI.md:549` (table row),
`CORE.md` (3 hits) + `Architecture.md` (3 hits, under
the cutover note — R1-residue class). Leave frozen:
PLAN.md D6/SYNC-12 rows (campaign record), evidence/
probes, archive/. TYPE specs pin nothing directly
(verified — only SYNC-12 asserts the surface).
**Panda comparison.** Panda CSS's `patterns` are
named style-prop→CSS functions in `panda.config`;
`box` is the base pattern every styled primitive
funnels through. Core's `extendPatterns()` (HEAD
`system/panda/config/extensions/api/
extendPatterns.ts:69`) merged collected extensions
into `pandaConfig.patterns.extend.box` — serializing
JS transform closures via `transform.toString()` +
`new Function` (:6-17, :52-60) — invoked from the
`panda.liquid:84` template with
`[responsiveExtension, ...patternExtensions,
...fontPatternExtensions]`. Core's internal callers
(container/r/size/font) were all Panda-box props,
and Neo has rehomed EVERY one natively: font→`font()`
collector, r→`lowerResponsiveStyles` (parity.md:84),
container→D8 container-first, size→canon/compile
(per the typegen architect's loss ledger). The probe
already smelled it: parity.md:62 "Not re-exported
from core `entry/system.ts` ... copied (Neo more
public than core system entry)" and :212 open
question 10 — "Intentional expansion, or should it
stay internal until box-pattern runtime exists?" —
never answered, and no box-pattern runtime ever
came. Structural reason it CANNOT work in Neo:
transforms are JS closures while the published
baseSystem is `{name, fragment, css, jsxElements}`
strings (pubshape ruling) — closures can't cross
that boundary, and there is no Panda config to
merge into. It survives because the voyage copied
all five collectors as a set (parity.md:147 "same
counts") while the consumer lived in the Panda half
that was deliberately never ported (parity.md:153
"no"). Pandaism, confirmed — the one collector
whose engine was retired.
**Replacement: DELETE, no successor API.** Zero
callers, zero consumers, internal extensions
rehomed. Not recipe-adjacent (recipes are the
variant system, unrelated), not a first-class API
(a future user-macro wish would be a canon/compile
feature, not a fragment collector — don't build a
placeholder). Effort: SMALL, one micro-crew
(mechanical delete + re-proof: adjacent vitest,
SYNC-12, package tsc, q). NOT in the Obj-2 landing
— the tree is in hermetic verification; freeze
discipline says follow-up objective.

### (2) GENERAL STATE — Objective 2

**Landed (all accepted, spot-verified):** MAP audit
(19 suites) + install-dim (distro/watch full
release, mcp ×19) + Phase 0 seam census (25-row
retarget table) + Phase 1 (P1 5 CHAIN + P2 CLI-01/
WATCH-01 + P3 7 micros + CLI-02 gap-close) +
Phase 2 migrations (mcp/icons/docs+lib/fixtures/
runner/prose) + engine follow-ons (react-stub,
rdomedge createRoot delete, bootstrap-alias + neo
react entry, pubshape singular BaseSystem,
axis-shorthands Leg C closed, recipe investigation
read-only) + Phase 3 Wave 1 (R1 delete+regen,
R-prose, R-clean, R2 moves, styletrace-cases,
R-restore 11 tiers, R-prose2, report-amend) +
reviewers battery 11/11 + R-golden-final. HQ
reversals absorbed: chain tiers restored (11-tier
gate), DUAL-COVERAGE (one-home check void for
chain rows only), engine-test-layer direction.
**In flight:** (a) TYPEGEN SQUAD (Cause-B fork,
HQ-ruled engine-fix-now): architect DONE+accepted,
Typegen-A DONE+accepted (widen live: 1391 keys,
goldens +3739/0-, c 42/42; D1 `& {...}` index
deviation approved), Typegen-B WORKING (red-first
proof filed: 6 RS reds + NEO-TYPE-08 red on
`borderRadius`; tree confirms `surface.test.ts` +
NEO-TYPE-08 present; now unblocked → green runs,
then DONE). (b) HERMETIC RE-RUN: first run RED at
shared setup, 0 Dagger executions — Cause A healed
(R-install: stale pnpm symlinks, standing finding
that plain/--force install never rewrites live
stale links) + accepted; Cause B = the squad's
widen. Re-run fires after C + reviewer gates.
(c) LANDING SWEEP (post-hermetic): R1 B2 comment
residue (sweep-or-accept) + B3 live fixes
(`.cursor/mcp.json` broken bin path, changeset
status.json, run.mjs dead core mapping, gitignore
dead rules). (d) Pending HQ: Q-3-7 parked-work
confirm (gates nothing), R6 landing nod
(PROMPT/COVERAGE_EXTRA delete), and the "patterns/
Map crew nod" line in the last tick — "Map crew"
appears NOWHERE else in any log or VOYAGE (grep
clean); ambiguous whether this assessment
satisfies the patterns half and what the Map half
is. Needs one captain line.
**Remaining-risk list (honest):** R1 hermetic
re-run is the true gate — nothing tier-specific
has run in Dagger yet (first attempt died pre-
container). R2 typegen consumer blast radius (12
rows: fixtures/docs/icons/lib/mcp/tiers/type
cases) is still unverified until implementer C
runs. R3 Leg A closure rides the same widen
(docs 4→0 tsc) — one fix, one proof, still open.
R4 landing-commit size (1063 staged + ~240
worktree/untracked) concentrates all risk in one
captain commit — mitigated by reviewers' battery
+ firsthand re-runs, not eliminated. R5 accepted
reds must stay exact (docs tsc 4, virtualrs
10/17, R-MR-3 pair, 13 pre-existing gate errors)
— any drift voids the gate math.
**Fresh-eyes spot-checks (all held, no smells
found):** staged index = exactly 789 D + 274 R100
= 1063, zero adds/modifies (reviewers' math
closes); `matrix/tests/chain/` = 11 tiers,
`matrix/fixtures/` = 7, top-level `fixtures/`
gone; untracked set = exactly the expected new
files (mcp neo/, neo entry/react-stub/primitives/
axis-test, chain/cli/watch/TYPE-08/micro cases,
ATM-SHORT-12, 4 styletrace cases, decomm report);
Typegen-B footprint present as filed. Acceptances
show firsthand verification discipline throughout
(captain re-ran decisive proofs: CHAIN-06, meta
smokes, icons import, scan-goldens). Only
observations: (i) the "Map crew" ambiguity above;
(ii) the last tick's "patterns/Map crew nod" is
the only forward pointer to THIS assessment — HQ
should confirm it closes that line; (iii) no
verification theater detected — crews filed reds
honestly (hermetic, docsconf NO-GOs, D1
deviation, R-install's plain-install no-op).

### (3) RECOMMENDATIONS (ordered, owner + size)

1. Typegen-B green + DONE (Obj-2 typegen squad,
   SMALL, in flight): re-run T1-T4 + NEO-TYPE-08
   on the widened emitter, file greens. Unblocks
   everything below.
2. Implementer C consumer re-verify (Obj-2 typegen
   squad, MEDIUM): run the architect's 12-row
   blast-radius table left to right firsthand —
   fixtures tsc 2→0, docs 4→0 + build/serve,
   icons/lib/mcp/type-cases/tiers. Closes Cause B
   + Leg A with evidence, not inference.
3. Reviewer gates 1-3 (Obj-2 typegen squad,
   SMALL): key-set mirror diff, red/green
   stash-check, consumer-table confirm. Then
   HERMETIC RE-RUN (Obj-2, MEDIUM wall-clock):
   `pnpm agent test` over the 11 tiers + mcp —
   the objective-ordered proof, first real
   Dagger execution of the kept gate.
4. Landing sweep crew (Obj-2 Phase 3, SMALL):
   B3 live fixes + B2 sweep-or-accept + R6
   delete with the landing nod + observed-stale
   prose (matrix README L22-23, TEST_MIGRATION
   note). Then captain firsthand re-runs + ONE
   commit.
5. HQ nods, one line each (HQ, TRIVIAL): Q-3-7
   parked-work confirm; R6 delete nod; clarify
   "Map crew" + confirm this assessor section
   closes the patterns half.
6. patterns/ deletion micro-crew (follow-up
   objective, NOT Obj-2, SMALL): execute §(1)'s
   deletion surface + re-proof. Owner: whichever
   objective owns Neo author-surface hygiene
   (Obj-5 if it touches lib surface, else a
   Neo-hardening follow-up). Explicitly after
   the Obj-2 landing — freeze holds.
7. Parked-work staffing (HQ, planning): Leg A is
   about to close via the widen — confirm;
   F-AXIS-1/2/3 + F-AXIS-4 + recipe-classname +
   F-STC-1/2 + virtualrs owner + T8-policy/
   D17-layers futures all need homes outside
   Objectives 3-5 scope. Cheapest: one HQ
   staffing line at the Obj-2 landing.

DONE: patterns = Panda carryover, delete with no
replacement (SMALL, post-landing); Obj-2 stands
at typegen-B-green → C → gates → hermetic re-run
→ sweep → commit, with the hermetic re-run the
one unproven gate and three HQ one-liners (Q-3-7,
R6, Map-crews-clarify) outstanding.

## Assessor acceptance + Map line (captain, 2026-09-23)

ASSESSOR ACCEPTED. Patterns verdict stands:
Pandaism SUSTAINED — zero userland callers, bucket
feeds provenance rows only, no RS/Box/codegen
consumers, closures cannot cross the string publish
boundary, all internal extensions rehomed. Verdict:
DELETE with no replacement, SMALL, POST-LANDING
(freeze holds through hermetic + commit; owner =
follow-up objective). General state + risks R1-R5 +
recs 1-7 all consistent with the captain's picture;
no smells found, index math re-closed by fresh eyes.
MAP LINE (closes the assessor's ambiguity flag): the
tick's "Map crew" refers to a CHAT proposal (captain
to HQ, 2026-09-23): core primitives = 101 exports,
neo = 100, delta exactly `Map` (presumed deliberate,
JS-global collision, UNFILED). Proposal: micro-crew
files the Map decision + pins the primitive surface
with a parity test. Awaiting HQ nod alongside Q-3-7
+ R6. This assessment CLOSES the patterns half
(verdict delivered); the deletion itself is the
post-landing follow-up.

## Axis-test relocated (captain, 2026-09-23)

HQ: axis-shorthands.test.ts does not belong in
src/sync/. Moved to src/runtime/css/ (colocated with
css.test.ts — the suite proves css() naming + runtime
artifact + splitter + sheet over real sync; sync is
the fixture-driver, not the subject). Imports
repointed, suite re-run green at the new path.
Captain-executed (secretarial move, verified).

## Axis-test move corrected (captain, 2026-09-23)

Correction to the previous entry (which was logged
before the re-run — my error): the first import
repoint under-climbed (../sync vs ../../sync) and
the suite failed on collection. Fixed, re-run GREEN
at src/runtime/css/axis-shorthands.test.ts. Lesson
re-filed: log the proof after the run, not with it.

## Patterns-delete (crew, 2026-09-23) — WORKING

Scope (strict): PATTERNS-DELETE crew (Objective 2,
HQ-directed — delete with no replacement, NOW; HQ
overrode the post-landing freeze recommendation).
Governing skill `agent-neo` loaded first. Binding
scope: LOG-2.md ## Assessor §1 (pipeline trace +
deletion surface + Panda comparison), read IN FULL.
Named files only, no freelancing. Never install,
never commit, never touch the index, never touch
another session's files (typegen-B owns
typegen/tests + NEO-TYPE-08 — not crossed). Rides
the Obj-2 landing commit (worktree deletes via
plain `rm`, unstaged).

### Census (read-only, firsthand — scope confirmed)

- Tracked `extendPattern|BoxPattern|box-pattern|
  __refBoxPattern` hits under packages/reference-neo:
  exactly the ordered set (patterns.ts +
  patterns.test.ts, 3 barrels, system-surface.d.ts,
  sync/publish/system.ts, base/index.ts,
  evaluate.test.ts, SYNC-12 spec + README, sync
  SPEC.md, type SPEC.md) + FROZEN (PLAN.md campaign
  rows, 9 evidence/ files). `git grep` verified.
- Outside neo: `extendPattern` in docs/Architecture.md
  (3), docs/CORE.md (3), docs/REFERENCE_UI.md (:549
  row + legacy boxPattern prose), archive/
  STYLED-SYSTEM-MIGRATION.md (frozen, left).
- `box-pattern|BoxPattern` descriptive-legacy hits
  NOT in scope (named-files-only; filed as accepted
  residue at DONE): RS canon comments (size.rs, r/,
  container.rs — "core's box-pattern transform"),
  atomic SPEC.md:581, ATM-COND-05 README, TST-STY-02
  `ReferenceBoxPatternProps` (tasty projection type
  name), RESPONSIVE.md:205/:220, remaining
  boxPattern architecture prose in
  REFERENCE_UI/CORE/Architecture (cutover-note
  class, same as R-prose R1).
- No other collector pins: base/index.test.ts clean
  of Pattern/pattern; `kind:'fragment'` only in
  base/index.ts + evaluate.test.ts; no world src
  calls extendPattern (only gitignored .reference-ui
  outputs, which regen clean).
- Barrel header `fragments/api/index.ts:2` says
  "five collectors" — falls to "four" with the
  delete (same-file truthfulness, part of the
  mechanical delete).

### Edits (16 named files, no freelancing)

- DELETED (plain `rm`, unstaged): `src/fragments/
  api/patterns.ts` + `patterns.test.ts`.
- 3 barrels: `fragments/api/index.ts` (block +
  five→four header), `fragments/index.ts` (4
  names), `author/index.ts` (block).
- `author/system-surface.d.ts`: :22-23 gone.
- `sync/publish/system.ts`: mjs shim 3 lines +
  d.mts 1 line gone.
- `fragments/base/index.ts`: :26 import, :135
  registration, :319 bucket, :336 spread,
  :432-437 helper gone.
- `fragments/base/evaluate.test.ts`: MORE_FILE
  import + call removed, toHaveLength(6)→(5),
  `kind:'fragment'` pin removed — remaining 5
  pins exact, no weakening.
- SYNC-12 spec (3 sites) + README :5; sync
  SPEC.md:12; type SPEC.md:40 D6 line.
- REFERENCE_UI.md:549 row (list entry);
  CORE.md 3 (:200 list, :261 comment line,
  :341 table row — :200 already overflowed its
  box pre-edit, shortening is toward aligned);
  Architecture.md 3 (:145 tree line, :467 row,
  :765 row, all under the cutover note).
- FROZEN left: PLAN.md rows, 9 evidence/
  files, archive/, LOG history.

### Grep-zero evidence (all firsthand)

- `git grep extendPattern` outside LOG-2.md +
  frozen (PLAN.md, evidence/, archive/): ZERO
  (exit 1). Same for `__refBoxPatternCollector|
  createBoxPatternCollector|BoxPatternExtension|
  BoxPatternProperty`: ZERO.
- Filesystem grep over docs/packages/matrix/
  pipeline (excl. node_modules/.reference-ui/
  dist/frozen): ZERO for the same families.
  The only repo-wide hits live under
  `.muse/worktrees/` (other sessions'
  checkouts — out of bounds, untouched) and
  gitignored `.reference-ui/` outputs (regen
  clean on next sync; SYNC-12's fresh sync
  already proved the shim-free entry).
- Accepted residue (named-files-only bars the
  fix; descriptive-legacy, not the collector):
  RS "core's box-pattern transform" comments
  (size.rs, r/, container.rs) + atomic
  SPEC.md:581 + ATM-COND-05 README, TST-STY-02
  `ReferenceBoxPatternProps` (tasty type name),
  RESPONSIVE.md:205/:220, remaining boxPattern
  architecture prose in REFERENCE_UI/CORE/
  Architecture (cutover-note class, R-prose-R1
  kin). Zero `BoxPatternExtension|Property`
  anywhere live.

### Re-proof (all firsthand, post-delete tree)

- Fragments vitest: 16 files / 88 passed
  (incl. updated evaluate + scan-goldens).
- `sync.test.ts`: 18/18 (publish-leg
  adjacent; src/author carries no tests).
- `agentneo run NEO-SYNC-12`: PASS
  authoring.spec.ts (fresh sync, shim-free
  entry asserted).
- Full neo `tsc --noEmit`: exit 0.
- `agentneo q` over the 8 touched .ts files:
  0 errors, 3 non-failing warns — all
  pre-existing on lines this crew only shrank
  (base/index.ts length 437→427 + params-5,
  SYNC-12 fn length, the latter pubshape-filed).
- NEO-REF: 25/26. The 1 red is REF-09's
  `SystemProperties == 99` pin, got exactly
  1391 = Typegen-A's filed widened key count
  (tasty over typegen decls; a removal cannot
  add 1292 members). Pre-existing widen
  fallout, squad-owned (implementer C
  consumer re-verify hasn't run — typegen-B
  still WORKING); not this crew. All other
  25 green incl. every fresh-sync path.

### Footprint + index

- Exactly the 16 named files: 14 ` M` + 2
  ` D`, all unstaged. Index holds 1063 staged
  paths, zero mine. Never installed, never
  committed, typegen-B's files never opened.

## PATTERNS-DELETE DONE (crew, 2026-09-23)

Box-pattern collector deleted with no
replacement: 2 files removed, 14 edited,
grep-zero holds outside frozen + filed
residue, re-proof green except the squad-owned
REF-09 widen pin (exact-count attribution).
Rides the Obj-2 landing commit.

## Typegen-B acceptance (captain, 2026-09-23)

TYPEGEN-B ACCEPTED. Verified firsthand: RS typegen
seam 35/35 (4 files) + NEO-TYPE-08 PASS on my runs;
crew filed the red→green flip per test (6 gap reds
to green, anchors green throughout) + both q clean.
Reviewer gate 2 + implementer C unblocked. C
dispatched (12-row consumer blast radius, left to
right, firsthand).

## Typegen-C (crew, 2026-09-23) — WORKING

Scope (strict): CONSUMER RE-VERIFY. No tracked-src edits —
re-syncs write gitignored `.reference-ui` output only + this
log section. Never install, never commit, never touch the
index, never touch another session's files. Governing skills
`agent-rs` + `agent-neo` loaded first; architect §2
blast-radius table + Typegen-A/B DONEs + both acceptances
read IN FULL and binding.
If any consumer FAILS: file it verbatim (no fix), continue
the table, report BLOCKED with the red rows. If a command
would dirty a TRACKED file: stop and report.

### C recon (read-only, firsthand)

- Blast table = 11 listed consumer rows (§2 table) + the
  captain's "12-row" label; C scope per dispatch enumerates 8
  proof groups (fixtures/docs/icons/lib/mcp/Neo-type/Neo-pkg+REF/RS).
  Chain-tiers + matrix/mcp hermetic rows belong to reviewer
  gate 3's `pnpm agent test` re-run, NOT to C (no Dagger in C
  scope) — carried as DEFERRED below, not claimed.
- `.reference-ui` (gitignore:52), `dist` (gitignore:10 +
  package ignores), docs `.content-collections`
  (gitignore:55) all ignored — re-syncs/rebuilds cannot
  dirty tracked files. Baseline saved:
  /tmp/tc-status-before.txt (1315 paths); backup tarball
  /tmp/tc-refui-backup.tgz (all consumers' .reference-ui).
- NEO-REF 26/26 = 26 spec files across 7 case dirs
  (01×1 + 02×2 + 03×18 + 04×1 + 05×2 + 09×1 + 11×1).
- Lib `tsc --noEmit` includes book/** (tsconfig.json) =
  the book typecheck. MCP `test` = typecheck + vitest run.

### C row 1 — 7 matrix/fixtures: PASS

- `pnpm run sync` (bootstrap + `neo sync`) in each of the 7
  fixtures → all exit 0 (`[neo] sync 72–212ms`).
- `./node_modules/.bin/tsc -p tsconfig.build.json` in each
  → all `TSC_EXIT=0`, zero output. extend-library (the
  Cause-B 2×TS2353 red) → 0. PROOF CLOSED.
- Widened-output spot check (extend-library colors-only):
  1399 optional keys; `display?`/`fontSize?`/`gap?` =
  `StylePropValue<string|number>` (Open), `borderRadius?`/
  `padding?` = family values. Keys present WITHOUT their
  token categories — the gate is gone.

### C row 2 — packages/reference-docs: PASS

- `cd packages/reference-docs && ./node_modules/.bin/neo sync`
  → exit 0 (`[neo] sync 3652ms`).
- `./node_modules/.bin/tsc --noEmit` → exit 0, zero output.
  The 4 Leg-A TS2353s → 0. PROOF CLOSED.
- `pnpm run build` (content-collections + neo sync + vite
  build) → exit 0, 132 modules, dist emitted.
- `./node_modules/.bin/vite --port 5174` + `curl /` →
  HTTP 200; server killed after (port verified down).
  (Managed-session terminate timed out twice; killed the
  port listener directly — my process only.)

### C row 3 — packages/reference-icons: PASS

- `cd packages/reference-icons && pnpm run build`
  (`node scripts/build.mjs`: 3857 icons, neo sync,
  tsup, tsc leg, requiredFiles) → `BUILD_EXIT=0`,
  dist recreated 13:48. (File-list stdout flooded the
  tool window; exit line recovered from the saved full
  output + fresh dist timestamps.)

### C row 4 — packages/reference-lib: SPLIT (typecheck PASS / build FAIL)

- `cd packages/reference-lib && pnpm run typecheck`
  (build:deps icons rebuild + `neo sync` 776ms + `tsc
  --noEmit` over src+book+playwright) → exit 1 with
  EXACTLY the 2 accepted D-OPEN-4 errors
  (`playwright/ct.ts:92` MountFn TS2345, `:108`
  toHaveScreenshot TS2339 — same lines as the M-docs+lib
  baseline). Book contributes zero. ZERO NEW → typecheck
  leg PASS.
- `pnpm run build` → `BUILD_EXIT=1`. Verbatim failure:
  `✘ [ERROR] Could not resolve "./tasty/runtime.js"` —
  `.reference-ui/types/types.mjs:6389:59`
  (`loadRuntimeModule: ... () => import("./tasty/
  runtime.js")`), ESM build failed, tsup never reaches
  the tsc leg. Build leg FAIL — filed, not fixed.
- Attribution (read-only, firsthand — widen-independent
  on its face): the import is emitted by Neo's
  reference-types leg (`src/sync/reference-types.ts:20`,
  last committed c62838b32 Obj-1 — predates the widen,
  untouched by Typegen-A/B whose footprint is style.rs +
  tests + 3 style goldens); the pre-C backup output
  (13:45, before any C sync) contains the SAME import
  (count 1) — my re-sync introduced nothing; no
  `types/tasty/` dir is published (only package.json +
  types.d.mts + types.mjs). Module-resolution red,
  disjoint from StyleProps keys. Needs an owner outside
  C scope (no tracked-src edits allowed.)

### C row 5 — packages/reference-mcp: PASS

- `cd packages/reference-mcp && pnpm test` (typecheck +
  vitest run) → `TEST_EXIT=0`, 16 files / 89 tests, all
  passed. 89/89 HOLDS (typecheck leg clean — exit 0
  covers both).

### C row 6 — Neo type/ cases 01–08: PASS

- `pnpm agentneo run NEO-TYPE-01` … `-08` (each id,
  scoped) → all `EXIT=0`, `[NEO-TYPE-0N] PASS
  type.spec.ts` ×8. TYPE-02's negative holds on the
  widened emitter; TYPE-08 (the Cause-B + Leg-A union
  pin) green.

### C row 7a — Neo package tsc: PASS

- `cd packages/reference-neo &&
  ../../node_modules/.bin/tsc --noEmit -p tsconfig.json`
  → exit 0, zero output. (Every `agentneo run` also
  re-pins this as its preflight — 8/8 above.)

### C row 7b — NEO-REF 26 specs: 25/26 (1 FAIL, filed)

- `pnpm agentneo run NEO-REF-01` → PASS (1 spec).
- `... NEO-REF-02` → PASS (2 specs).
- `... NEO-REF-03` → PASS (18 specs).
- `... NEO-REF-04` → PASS (1 spec).
- `... NEO-REF-05` → PASS (2 specs).
- `... NEO-REF-09` → EXIT=1. Verbatim:
  `[NEO-REF-09] FAIL projector.spec.ts: SystemProperties
  carries 99 members, got 1391` / `1391 !== 99`.
- `... NEO-REF-11` → PASS (1 spec).
- Tally 25/26. The 1 red is the predicted widen fallout
  (patterns-delete §Re-proof flagged the same pin):
  tasty projects SystemProperties over typegen decls
  and the count moved 99 → exactly 1391 = Typegen-A's
  filed widened key count. A removal cannot add members
  — widen-attributed, not a regression signal. The fix
  (re-pinning the count) is a tracked-src edit → OUT of
  C scope. Filed, not fixed.

### C row 8 — RS styletrace + adjacent (canon/atomic/typegen): PASS

- `pnpm agentrs c styletrace` → exit 0, 49 passed.
- `pnpm agentrs v styletrace` → exit 0, 2 files / 28
  tests passed.
- `pnpm agentrs c canon` → exit 0, 58 passed.
- `pnpm agentrs v canon` → exit 0, 1 file / 15 tests.
- `pnpm agentrs c atomic` → exit 0, 658+1+1+7 passed.
- `pnpm agentrs v atomic` → exit 0, 13 files / 302
  tests passed.
- `pnpm agentrs c typegen` → exit 0, 42 passed (A's
  gate re-pinned).
- `pnpm agentrs v typegen` → exit 0, 4 files / 35
  tests passed (B's suite re-pinned).

### CONSUMER-VERIFY-BLOCKED (crew, 2026-09-23)

Per-consumer table (all firsthand, exact commands above):

| Consumer | Verdict |
|---|---|
| 7 matrix/fixtures (sync + tsc build) | PASS — 7/7 tsc exit 0; extend-library 2×TS2353 → 0 |
| reference-docs (sync + tsc + build + serve) | PASS — tsc 4 Leg-A → 0, build 0, serve 200 |
| reference-icons (build) | PASS — tsc leg + requiredFiles, exit 0 |
| reference-lib typecheck (sync + tsc incl. book) | PASS — only the 2 accepted D-OPEN-4, zero new |
| reference-lib build | **FAIL** — tsup `Could not resolve "./tasty/runtime.js"` (types.mjs:6389); widen-independent on evidence, needs owner |
| reference-mcp (typecheck + vitest) | PASS — 89/89 |
| Neo type/ 01–08 | PASS — 8/8 |
| Neo package tsc | PASS — exit 0 |
| NEO-REF 26 specs | **25/26 FAIL** — REF-09 `1391 !== 99` widen pin, needs re-pin owner |
| RS styletrace c/v + canon/atomic/typegen c/v | PASS — all green (49/28, 58/15, 667/302, 42/35) |
| 11 chain tiers (hermetic) | DEFERRED — reviewer gate 3 `pnpm agent test` owns (no Dagger in C scope) |
| matrix/mcp ×19 (hermetic) | DEFERRED — reviewer gate 3 owns |

Docs 4→0 and fixture 2→0 typecheck proofs: BOTH CLOSED
firsthand. No command dirtied a tracked file (porcelain
1315→1315, empty diff; only gitignored outputs + this log
section written). No installs, no commits, no index
touches, no sibling files touched.
BLOCKED on 2 red rows (lib build, REF-09) — both filed
verbatim above with firsthand attribution, neither
fixable in C scope.

## Patterns-delete acceptance (captain, 2026-09-23)

PATTERNS-DELETE ACCEPTED. Verified firsthand:
patterns.ts + test gone, CORE.md/REFERENCE_UI.md
swept clean, SYNC-12 PASS on my run. Remaining refs
classified: 7 fixture dist/ hits = gitignored stale
build output (heals on rebuild — C + hermetic
rebuild); Architecture.md 3 hits = legacy pipeline
prose under the cutover note (R-prose-R1 residue
class — landing call); RS comments/SPEC/README hits
= filed descriptive residue. REF-09 red correctly
attributed to the widen (99→1391, a removal cannot
add members) — pin update rides C's findings → small
fix crew after C reports. The pandaism is dead.

## Health tick (captain, 2026-09-23)

Obj-1 COMPLETE. Obj-2: typegen squad A/B DONE +
accepted, C working; patterns-delete DONE + accepted
(REF-09 pin update queued behind C). Objs 3/4/5
untouched. Roster: C running, all else result_ready.
Deadlock test: clean (C fresh, WORKING filed). No HQ
park/stop. No commits. Pending HQ: Q-3-7, R6 nod,
Map pin nod, patterns-verdict close confirm. Next:
C DONE → pin-fix micro-crew → reviewer gates →
hermetic re-run → landing sweep → commit.

## Typegen-C acceptance — BLOCKED filed honestly (captain, 2026-09-23)

TYPEGEN-C ACCEPTED (BLOCKED verdict stands as filed).
Owned proofs BOTH CLOSED firsthand: fixture 7/7 tsc
0 (Cause B dead) + docs 4 Leg-A → 0 with build/serve
green (Leg A dead — one-fix verdict confirmed in the
wild). Everything else PASS except 2 red rows, both
filed verbatim with attribution, neither C-scope:
(1) REF-09 1391-vs-99 widen pin (needs re-pin);
(2) lib build tsup tasty/runtime.js unresolvable
(emitter untouched since Obj-1, pre-existing in
pre-C backup — needs root-cause + fix; breakage
window = anywhere since Obj-1 landing, lib build
was never re-run in Phase 3 before C). Dispatched:
FIX micro-crew (REF-09 re-pin + lib-build root-cause
fix) + REVIEWERS (gates 1+2 now, gate 3 + hermetic
re-run after FIX-DONE).

## Typegen-reviewers (crew, 2026-09-23) — WORKING

Scope (strict): VERIFY + REPORT ONLY. No code fixes, no
installs, no commits, no index touches, no sibling files
touched. Read IN FULL and binding: LOG-2 ## Typegen-architect
§4 (reviewer gates 1-3) + Typegen-A/B DONEs + both acceptances
+ Typegen-C consumer table. Gates 1+2 run NOW (independent of
the FIX crew); gate 3 + hermetic re-run wait for
the Typegen-fix DONE marker in this log (no poll-spin —
this crew files gates 1-2, then parks until FIX-DONE lands).

## Typegen-fix (crew, 2026-09-23) — WORKING

Scope (strict): TYPEGEN-FIX micro-crew (Objective 2 squad fallout, 2 items).
Read IN FULL and binding: LOG-2 ## Typegen-C (table + C row 4 lib-build
verbatim/attribution) + ## Typegen-architect §2 (widen design) + ##
PATTERNS-DELETE DONE (REF-09 attribution). Named files only (the pin + the
lib-build root cause). Never install, never commit, never touch the index,
never touch another session's files. Governing skills `agent-neo` (+
`agent-rs` for read-only canon/typegen evidence) loaded first.

### Typegen-reviewers GATES-1-2 (crew, 2026-09-23) — BOTH PASS

Method notes: verify-only held (zero tracked-src edits;
stash-check via file-copy aside/restore — index untouched,
style.rs md5 f401dc5a… identical before/after, typegen
porcelain byte-identical after, staged count still 1063).
Every command below firsthand.

GATE 1 (rule) — PASS.
- Mirror diff PROGRAMMATIC (`/tmp/typegen-gate1-diff.py`,
  parses Rust canon sources + style golden): canon 1073 ✓,
  aliases 319 ✓, REFERENCE_PROPS [colorMode,r,size,variant,
  weight]; runtime `build_style_prop_names` set = 1393;
  emitted named keys = 1391; delta = EXACTLY {font,weight}
  runtime-only + zero emitted-only + `--*` index present +
  keys byte-sorted (MozAnimation..zoom). GATE1-MIRROR PASS.
  (Gate wording mapped: variant/colorMode are excluded on
  BOTH sides by the runtime formula itself; font/weight are
  the typegen-side FontProps exclusions; size rides in both
  sets as canonical; `--*` is the type-level addition.
  Emitted set read from styles.d.ts — golden==live proven
  by the goldens asserts inside `c typegen` + T1 live green;
  keys are project-independent post-widen.)
- Strict category-gate proven by T4: tokenLightSpec verified
  radii-only (NO colors); T4 colors-absent half asserts no
  `StrictColorProps` + open color accepted; `present_strict`
  pre-filter read at style.rs:72-78 + `normalize` empty-skip
  at strict.rs:99-113; new Rust pins typ_style_06 /
  typ_strict_06 present and green. PASS.
- Forbid needles absent: forbid.rs needles (BoxProps/
  FlexProps/StackProps/GridProps/patterns/, recipes/,
  tokens.mjs/token(, atomic-import ban) all asserted in
  `pnpm agentrs c typegen` → 42/42 green, exit 0. PASS.
- `agentrs q` on A's exact 7 files → exit 0, 0 violations,
  1 warning: `value_for` cognitive 18 (warn >15, fail >20)
  — the carried warning A filed, unchanged. PASS.

GATE 2 (suite) — PASS.
- Stash-check (stash = HEAD style.rs + `agentrs build`,
  narrow markers 0; unstash = byte-identical restore +
  rebuild): STASHED → `agentrs v typegen` exit 1 with
  EXACTLY B's 6 filed gap reds (T1×2, T2 numerics, T2
  custom-prop, T4 open-under-strict, T4 colors-absent; 3
  anchor files green) + `agentneo run NEO-TYPE-08` exit 1
  (`positive.ts(4,3) TS2353 'borderRadius'` — B's exact
  Cause-B signature). UNSTASHED → `v typegen` exit 0
  (4 files / 35 tests) + NEO-TYPE-08 PASS. RED/GREEN
  PROVEN firsthand. PASS.
- Negatives genuinely invalid: `definitelyNotAProp` +
  `colour` = 0 hits in canon css/properties.rs +
  dialect.rs + conditions.rs (sanity: same method finds
  color/display/container/size/r); neither is a reference
  prop; neither starts with `--`/`&` (index/selector
  channels cannot admit them); T4's strict negative is a
  value-shape TS2322 pin, not a key. PASS.
- T1 enumerates from canon lists: `widenedKeys()` iterates
  `loadDialect(loadPlatformCss())` outputs
  (canonicalProperties/aliases/referenceProps) + container,
  minus OWNED exclusions; `loadDialect` builds from
  @webref tables + overlay (data-driven, zero hand list);
  only literals are the four documented exclusions. PASS.
- Harness soundness (observed, supports gate 2): tsc.ts
  runs real tsc strict + skipLibCheck:false; expectTscOk/
  expectTscReject both pin TS2589-blindness; T3/T4
  negatives use two-half pins (bare must fail with the
  code, @ts-expect-error must pass — self-policing).

GATE 3: PARKED awaiting ## Typegen-fix DONE (FIX crew:
REF-09 re-pin + lib-build root-cause fix). Then: C-table
re-confirm green firsthand + hermetic `pnpm agent test`
re-run over the kept scope via test-core.

## Reviewer gates 1-2 acceptance (captain, 2026-09-23)

GATES 1-2 ACCEPTED. Gate 1: programmatic mirror diff
exact (1393 runtime vs 1391 emitted, delta precisely
{font,weight}, strict proven, forbids absent, q clean
save the carried value_for warning). Gate 2:
stash-check red/green proven firsthand with exact
signatures (6 gap reds + TYPE-08 borderRadius TS2353
on narrow; 35/35 + TYPE-08 PASS on wide), negatives
verified genuinely invalid against canon. Method
clean (file-copy stash, index untouched, tree
byte-identical after). Gate 3 + hermetic re-run
queued behind FIX-DONE (fresh dispatch if the
reviewers' run ended).

## HQ test-overlap acceptance (captain, 2026-09-23)

HQ boiled down the axis-test discussion: single alias
truth in canon (verified: zero alias literals in Neo
runtime source; css() resolves via registered baked
tables, version-guarded), Neo-side suite overlaps
engine coverage in places — ACCEPTED as
defense-in-depth (engine pins the language, Neo pins
the bake→register→resolve chain). No audit crew.

## Axis-test renamed by use (captain, 2026-09-23)

HQ: name by use, not feature. axis-shorthands.test.ts
→ runtime/css/application.test.ts (reads as css
application; header leads with application, keeps
axis-shorthands as the vehicle for grep). Suite
re-run green at the new name. Captain-executed.

### Typegen-fix ITEM 1 — REF-09 re-pin: DONE

Red confirmed firsthand (`agentneo run NEO-REF-09` → FAIL
`SystemProperties carries 99 members, got 1391`). 1391 VERIFIED
programmatically, not trusted (`/tmp/fix-verify-ref09.mts`, read-only):
the REF-09 world's emitted `styled/types/index.d.ts` StyleProps block
(lines 53..1443) carries exactly 1391 named keys (sorted), the tasty
`SystemProperties` display members are exactly 1391, and the two SETS
are IDENTICAL (zero diff both directions). Exclusions hold
(font/weight/variant/colorMode absent — architect §2); spots present
both sides (accentColor/container + display/gap/size/r/borderRadius/
marginY). Cross-checks: Typegen-A filed 1391 named keys (green goldens),
Typegen-B T1 enumerates 1391 from canon lists (green); the world is
colors-only (SpacingToken = never), so the old 99 was the pre-widen
gated count on exactly this shape (B filed colors-only 99-key emission).
Re-pinned 99 → 1391 in `specs/projector.spec.ts` (assert + 2 comments,
widen comment + `LOG-2 ## Typegen-architect §2` pointer) + `README.md`
(3 numeric claims + drift-attribution sentence). No TESTS.md in ref/
(README-only group). Proof: NEO-REF 26 PASS / 0 FAIL (counted,
`agentneo run NEO-REF`), incl. `[NEO-REF-09] PASS projector.spec.ts`.

### Typegen-fix ITEM 2 — lib build: ROOT CAUSE + FIX + PROOFS

SYMPTOM (C row 4, reproduced): `pnpm run build` in
packages/reference-lib fails at tsup —
`Could not resolve "./tasty/runtime.js"` from
`.reference-ui/types/types.mjs:6389`, tsc leg never reached.

DIAGNOSIS (all firsthand):
- EMITTER: `src/sync/reference-types.ts:20`
  (`TYPES_RUNTIME_SPECIFIER`, rewritten into types.mjs by
  `rewriteTypesRuntimeImport`; the placeholder originates in
  `reference/browser/Runtime.ts:234`). Untouched since Obj-1
  (c62838b32) — C's attribution reconfirmed.
- PUBLISHER: NOBODY in the one-shot path. `types/tasty/` is
  session-owned: `sync()` schedules it via `initReference`
  (setImmediate background loop, `sync/index.ts:229-230`) and the
  CLI (`bin/neo.ts`) `process.exit()`s before the loop ever runs.
  `cleanDir` wipes any stale copy at every sync start. So after ANY
  one-shot `neo sync`, the package advertises `./tasty/*` exports
  + a bundled `./tasty/runtime.js` import pointing at files that
  cannot exist. tsup (which bundles `@reference-ui/types` — not
  in its externals) then fails resolving the edge.
- WHEN (bisected with evidence): BROKEN SINCE THE OBJ-1 LANDING
  COMMIT, latent until C ran it. (a) Pre-Obj-1 lib never imported
  `@reference-ui/types` (Reference export commented + tsconfig
  exclude, `git show c62838b32^:…/src/index.ts:18-22`); REF-10
  restored it at c62838b32 → tsup first touched types.mjs there.
  (b) One-shot tasty-darkness is ACCEPTED Obj-1 S5 design —
  LOG-1:1202-1204 + :1350 + :1383 "bin/ scope to revisit, not this
  wave"; no Obj-1 gate ran lib tsup (REF-10 = typecheck + Book
  render). (c) Core era was green because core's one-shot CLI
  drained its workers before exit — matrix oracle asserted
  `.reference-ui/types/tasty should exist` post-`ref sync`
  (`git show HEAD:matrix/reference/…/reference-output.test.ts:37`).
  Neo regressed that contract by deferring bin/. (d) EXONERATED:
  widen is style-only (A footprint = style.rs + tests + 3 style
  goldens); patterns-delete touched the system leg only, never
  reference-types/tasty; lib never moved (R-install healed its
  links, verified absolute+resolving); regens destroyed nothing
  (pre-C backup `/tmp/tc-refui-backup.tgz` has ZERO tasty entries
  repo-wide — absence predates C).
- SECOND RED (exposed by the fix, same build): tsc build leg
  4× TS2591 `process` in warn.ts:5 + toastRuntime.ts:112. Root:
  ship code uses the `process` ambient with no declared node
  types (lib @types = react + react-dom only); the wide
  typecheck masks it via vite's incidental
  `/// <reference types="node" />` (80 node files in noEmit
  program vs 0 in build program, `--listFilesOnly` both), the
  narrow build config has no such path. Latent since 2026-09-09/
  10 (usage commits d01932140/fa7b4695b, after the 08-22 build
  config) — never exercised because tsup failed first since
  Obj-1 (and the Reference mask hid tsup before that).

FIX (root, no shims/assertions/stubs, 5 tracked files + the pin):
1. `src/reference/bridge/init.ts`: pending set → promise map +
   new `flushReferenceBuild(sourceDir)` drain (single build, single
   log; session dedupes concurrent rebuilds per key — verified in
   `reference-rs/dist/tasty/build.mjs:1901-1912`). In-process sync/
   watch path UNCHANGED (background loop only, S5 intact).
2. `src/reference/bridge/index.ts`: barrel re-export (1 line).
3. `bin/neo.ts` cmdSync: await the drain after `sync()`; tasty
   failure fails loud (`sync failed: reference tasty build
   failed: …`, exit 1). This is the Obj-1 deferred bin/ scope,
   now due. Resident `--watch` untouched (loop lands it).
4. `packages/reference-lib/src/components/Overlay/shared/warn.ts`
   + `src/components/Toast/toastRuntime.ts`: bare `process` →
   file-local `globalThis` narrowing with identical semantics in
   every state (verified case-by-case incl. the pathological
   env-undefined throw in toast). No dep added (never-install
   held), no ambient vendored, no shared helper.
5. Hygiene (gitignored only, no install): removed 3 DANGLING +
   UNDECLARED symlinks in docs/node_modules (react-live,
   sandpack-react, monaco-react — zero package.json hits, Sep-11
   residue, store targets pruned) that the tasty scan trips over.
   Census: exactly those 3 repo-wide across all synced projects
   (lib/icons/mcp/neo/fixtures/tiers clean); removal changes no
   resolvable behavior (dead pointers).

PROOFS (all firsthand):
- `pnpm run sync` (lib, one-shot CLI) → exit 0, `types/tasty/`
  lands (manifest.js + runtime.js + chunks + decls). Before: absent.
- `pnpm run build` (lib, FULL: icons build:deps + sync + tsup +
  tsc + materialize) → exit 0, twice (14:05 + final). tsup emits
  dist/index.mjs 3.00MB + theme 74.84KB; .d.ts + runtime/ land
  with fresh stamps (all legs ran, none skipped).
- Docs (regression from the drain, then green): first post-fix
  docs sync failed LOUD naming the dangling react-live link
  (fatal drain working as designed); after hygiene: docs build
  exit 0 + tsc clean (Leg A 4→0 HOLDS) + tasty lands.
- Fixture extend-library: sync 111ms + tsc build exit 0.
- Units: bin/neo.test.ts + bridge/init.test.ts +
  reference-types.test.ts = 24/24; toastRuntime.test.ts 38/38;
  lib noEmit still exactly the 2 D-OPEN-4 (zero new); lib build
  tsc zero output.
- Suites: NEO-REF 26/26, NEO-CLI-01 PASS, NEO-CLI-02 PASS,
  NEO-WATCH-01 PASS (all post-fix; CLI kill-leg + watch paths
  tolerate the drain).
- Gate: `agentneo q` over the 4 neo files = 0 errors, 0 warnings.
  The 2 lib files trip 4 errors + 2 warns, ALL HEAD-proven
  pre-existing (identical findings on `git show HEAD:` bytes;
  none on my lines) — lib proofs are tsc + vitest instead.
- Footprint: exactly the 6 named files + this log, all unstaged;
  index untouched (1063 staged paths all siblings'); no installs,
  no commits, no sibling files.

FINDINGS FILED (out of scope, not fixed): F-FIX-1: the RS tasty
walker fails the WHOLE scan on one dangling symlink under
node_modules despite `tasty-build.ts`' comment claiming the
`!node_modules/**` negation makes it safe — negation filters
results but the walker still descends/follows. RS crew owns
(prune traversal or tolerate ENOENT). F-FIX-2: toastRuntime.ts
carries HEAD-identical gate findings (header/complexity/length)
for its owner.

## TYPEGEN-FIX DONE (crew, 2026-09-23)

Both items closed: REF-09 re-pinned to the verified 1391 with
NEO-REF 26/26 green; lib `pnpm run build` exit 0 end to end via
the root fix (one-shot CLI drains the session-owned tasty phase;
ship code freed of its undeclared `process` ambient) with docs,
fixtures, CLI, watch, and unit suites all re-proven green and
zero new gate findings. Reviewer gate 3 + hermetic re-run
unblocked (fresh Dagger installs carry no stale links).

## Typegen-fix acceptance (captain, 2026-09-23)

TYPEGEN-FIX ACCEPTED. Verified firsthand: REF-09
PASS (re-pinned to the verified 1391) + lib build
exit 0 end to end (root fix: one-shot CLI drains the
session-owned tasty phase; ship code freed of its
undeclared process ambient). Both fallout reds
closed. Gate 3 + hermetic re-run dispatched fresh
(reviewers' run ended after gates 1-2).

## Gate-3 (crew, 2026-09-23) — WORKING

Scope (strict): GATE-3 (Objective 2 — consumer confirm +
hermetic re-run). Verify + report ONLY. Never install,
never commit, never touch the index, never touch another
session's files. Governing skill `test-core` loaded first.
Read IN FULL and binding: LOG-2 ## Typegen-architect §4
(gate 3) + ## Typegen-C (consumer table) + ## TYPEGEN-FIX
DONE + both acceptances. (1) Re-confirm C's consumer table
green firsthand on the fixed tree. Any red: file verbatim,
fix nothing, report RED. (2) If all green: HERMETIC RE-RUN
via `pnpm agent test` over the kept scope (11 chain tiers +
mcp), never raw.

### Gate-3 phase 1 — C-table re-confirm: 8/8 GREEN (all firsthand)

| Consumer | Proof |
|---|---|
| 7 matrix/fixtures | `pnpm run sync` exit 0 + `tsc -p tsconfig.build.json` exit 0, all 7 |
| reference-docs | `neo sync` 0 + `tsc --noEmit` 0 (Leg A 4→0 HOLDS) + `pnpm run build` 0 + serve HTTP 200 (port verified down after) |
| reference-icons | `pnpm run build` exit 0, `created dist in 2.1s`, 0 error hits, dist + baseSystem fresh |
| reference-lib | typecheck exit 1 with EXACTLY the 2 accepted D-OPEN-4 (ct.ts:92/:108, zero new); `pnpm run build` exit 0, dist/index.mjs 3.16MB fresh (FIX-DONE HOLDS) |
| reference-mcp | `pnpm test` exit 0, 16 files / 89 tests passed — 89/89 HOLDS |
| Neo type/ 01–08 | `agentneo run` 8/8 PASS (TYPE-02 negative + TYPE-08 union pin hold) |
| Neo pkg tsc + REF | `tsc --noEmit -p tsconfig.json` exit 0; REF 1+2+18+1+2+1+1 = 26/26 PASS incl. REF-09 re-pin (FIX-DONE HOLDS) |
| RS spot | `agentrs c/v styletrace` 49/28 green; `agentrs c/v typegen` 42/35 green |

Both FIX-DONE closures re-proven green firsthand. Evidence:
`/tmp/g3-fixture-*-{sync,tsc}.log`, `/tmp/g3-docs-{sync,tsc,
build}.log`, `/tmp/g3-icons-build.log`,
`/tmp/g3-lib-{typecheck,build}.log`, `/tmp/g3-mcp-test.log`,
`/tmp/g3-type-0{1..8}.log`, `/tmp/g3-neo-tsc.log`,
`/tmp/g3-NEO-REF-*.log`, `/tmp/g3-rs-{st,tg}-{c,v}.log`.

### Gate-3 phase 2 — HERMETIC RE-RUN: RED (infra, filed, not fixed)

Command (via test-core, never raw — run-1's exact scope):
`pnpm agent test --packages=@matrix/chain-t1,@matrix/chain-t2,
@matrix/chain-t3,@matrix/chain-t6,@matrix/chain-t7,
@matrix/chain-t8,@matrix/chain-t9,@matrix/chain-t10,
@matrix/chain-t11,@matrix/chain-t12,@matrix/chain-t13,
@matrix/mcp` → HERMETIC_EXIT=1. Full log: /tmp/g3-hermetic-run.log
(57 lines). `pnpm agent status` pre-run: PRI 46, Docker Active
(colima), registry Active.

Shared setup (the old RED gate): FULLY GREEN — all 12 steps ✔:
7 fixture builds (4.1–8.0s), icons (23.4s), lib (6.4s),
rust (1.7s), mcp (1.4s), rust npm target dirs. Cause A
(stale links) + Cause B (narrow typegen) confirmed healed
through setup — the run died strictly AFTER, at the first
Dagger snapshot.

Failure verbatim (log line 50, the only error):
`failed to get snapshot: failed to snapshot: failed to sync:
failed to copy contents: write /var/lib/dagger/worker/
snapshots/snapshots/1/fs/Users/ryn/Developer/reference-ui/
.muse/worktrees/subagent-v2-01a0c59e-e36c-7f83-b1df-
781f527ec8ac-01a0c724-701c-7211-808d-3f540721171d/packages/
reference-rs/dist/cargo/x86_64-apple-darwin/release/deps/
libnum_bigint-a598f330ed4d5249.rlib: no space left on device`

Per-tier table: 12/12 BLOCKED at snapshot (0 green, 0 tier
failures — zero Dagger executions, nothing ran):
chain-t1/t2/t3/t6/t7/t8/t9/t10/t11/t12/t13 + mcp ×19.

Attribution (read-only, firsthand): the runner snapshots the
whole workspace dir INCLUDING `.muse/worktrees/` — 107
foreign checkouts totaling 217G (`du -sh`), each carrying
node_modules + cargo dist. ENOSPC fires inside the Dagger
worker snapshot area while copying another session's
`.rlib`. Host root has 760Gi free; colima VM root 18G free
(6%) — the exhaustion is the snapshot copy sinking 217G of
foreign checkouts into container storage, not host capacity.
Product-code red: NONE observed. Remedy (captain-owned, NOT
this crew — verify+report only, never touch another
session's files): exclude `.muse/` from the Dagger context,
prune/reap the 107 stale worktrees, or grow engine disk —
then re-run this exact command. No re-run here: one ordered
run, red filed; a retry without relief fails identically.

Cleanliness: mid-run the captain landed 5 obj2 commits
(14:32, `obj2: mission logs` tip d17b67d8f — this crew's
WORKING section rode it at LOG-2.md:8694), so the
pre/post-run diff-set comparison is moot. My tracked writes
= this log section only; current worktree shows exactly 3
modified tracked files, all another session's (LOG-3.md +
2 benchmark reports) — untouched. Never installed, never
committed, index untouched. No extra runs.

## HERMETIC-RED-2 (crew, 2026-09-23)

Consumer table 8/8 green firsthand; hermetic re-run RED at
the Dagger snapshot phase (ENOSPC copying 217G of foreign
`.muse/worktrees` checkouts into the worker) with the
shared setup fully green and zero tier executions. Filed
verbatim with logs + repro above; fixed nothing.

## Health tick (captain, 2026-09-23)

Obj-1 COMPLETE. Obj-2: typegen squad fully landed +
accepted (A/B/C/FIX, gates 1-2); gate-3 crew WORKING
(fresh, charter filed, consumer re-confirm + hermetic
re-run). Objs 3/4/5 untouched. Roster: gate-3 running
alone, all else result_ready. Deadlock test: clean
(crew minutes old, normal startup). No HQ park/stop.
No commits. Pending HQ: Q-3-7, R6 nod, Map pin nod,
patterns-close confirm, + the unspecified extra crew
(HQ asked, purpose open — asked back). Next: gate-3
DONE → landing sweep → firsthand re-runs → commit.

## HERMETIC-RED-2 triage (captain, 2026-09-23)

Gate-3 consumers 8/8 GREEN (both FIX closures
re-proven, Leg A holds at 0); hermetic RED at the
Dagger snapshot phase: ENOSPC copying 217G of
FOREIGN .muse/worktrees checkouts (107 stale sibling
checkouts) into container storage. Zero tier
executions — product red NONE. Remedy: exclude
.muse/ from the Dagger context (FIX-2 crew: verify
nothing in .muse/ is runner-referenced, add the
exclude, re-run hermetic). NOT pruning the 107
worktrees (another session's files — flagged to HQ).
Re-run-3 rides FIX-2.

## Fix-2 (crew, 2026-09-23) — RED-3

Scope (strict): FIX-2 (Objective 2 — Dagger context exclude +
hermetic re-run-3). HERMETIC-RED-2: snapshot ENOSPC sinking
217G of foreign .muse/worktrees checkouts; product green.
Governing skill `test-core` loaded first. LOG-2 ## Gate-3 +
## HERMETIC-RED-2 read IN FULL (verbatim error + attribution).
Named files only (context definition + this log). Never
install, never commit, never touch the index, never touch
another session's files. Do NOT prune/move/touch the foreign
worktrees themselves.

### Fix-2 recon (read-only, firsthand)

Causal chain (all verified per file): `pnpm agent test` →
`runMatrixBootstrapInDagger`
(`pipeline/src/testing/matrix/runner/run.ts:100`)
`buildWorkspacePackages(..., {requiredRustTargets:
[linux-x64-gnu]})` → `prepareAndWriteRustBuildRegistryArtifacts`
(`build/rust/index.ts:68`) →
`materializeReferenceRustTargetTarballs` → last green log
line "Prepare @reference-ui/rust npm target dirs ✔"
(`build/rust/targets.ts:614`) →
`stageRequiredContainerBuiltReferenceRustBinaries` (:646) →
`buildLinuxReferenceRustBinaryWithDagger` (:455) →
`repoSource()` (:238-242) →
`dag.host().directory(repoRoot, {exclude: repoSourceExcludes})`
(`/tmp/g3-hermetic-run.log` line 50 dies on the next line
after the ✔ — exactly this snapshot). Only 3
`host().directory` calls exist in `pipeline/src`; the other
two (`runner/consumer.ts:47/:174`) are include-scoped to the
package/generated dirs — `repoSource()` is the SOLE
repoRoot-wide snapshot, and its fs path
`.../fs/Users/ryn/Developer/reference-ui/.muse/worktrees/...`
matches the verbatim error exactly.

Step (2) — nothing under `.muse/` is runner-referenced
(firsthand): zero `.muse` hits across `pipeline/` (*.ts,
*.mjs, *.sh, *.liquid, *.json, excl. node_modules), zero in
`pipeline/setup/` + `pipeline/scripts/`, zero Dockerfiles in
`pipeline/`, zero in `.agents/skills/test-core/scripts/`;
no `dagger.json`/`.dagger` engine config. (Dagger
`host().directory` honors only include/exclude, not
gitignore/dockerignore — the exclude list is the whole
mechanism.)

### Fix-2 edit (1 file)

`pipeline/src/build/rust/targets.ts:84-96` —
`repoSourceExcludes` gains `'.muse'` (whole dir, NOT just
`.muse/worktrees/`). Justification: (a) step (2) proves
nothing under `.muse/` participates in the container build
(pnpm install + cargo over workspace source); (b) `.muse/`
is agent/session scratch by nature — the minimum fix leaves
every future sibling dir as a re-sink hole; (c) matches the
existing `'.git'` whole-dir precedent (Dagger's own
`exclude: ["node_modules", ".git"]` idiom). No unit tests
cover the list; no other file touched.

### Fix-2 snapshot-size evidence (gdu, exclude-faithful)

- Post-fix snapshot remainder: **34G**, of which **33G is the
  MAIN checkout's own `packages/reference-rs/dist/cargo`**
  (23M native + 29M npm beside it); everything else 1.1G.
- Zero worktree bytes remain in the snapshot: the `.muse/`
  sink is closed by construction (pruned at the root).
- Corroborated firsthand: `.muse/worktrees` = 217G / 107
  entries (`du -sh`; matches Gate-3 exactly). `git status`
  shows other sessions' files (LOG-3.md, ui.config.ts,
  benchmark reports, one untracked lib test) — untouched;
  this crew's tracked writes = targets.ts + this log only.
- FLAG FOR THE RE-RUN (observed, not fixed — out of scope):
  Gate-3 measured colima VM root 18G free; the 34G remainder
  (33G cache-shadowed `dist/cargo` — the container mounts a
  cache volume OVER `/workspace/.../dist/cargo` at
  targets.ts:263, so those snapshot bytes are pure waste)
  may ENOSPC on its own. If re-run-3 reds there, that is a
  SECOND, distinct sink with its own verification burden —
  this crew files it verbatim as RED-3 and fixes nothing
  further per charter.

### HERMETIC RE-RUN-3: RED (new product bug, filed, not fixed)

Command (via test-core, never raw — run-1's exact scope):
`pnpm agent test --packages=@matrix/chain-t1,@matrix/chain-t2,
@matrix/chain-t3,@matrix/chain-t6,@matrix/chain-t7,
@matrix/chain-t8,@matrix/chain-t9,@matrix/chain-t10,
@matrix/chain-t11,@matrix/chain-t12,@matrix/chain-t13,
@matrix/mcp` → HERMETIC_EXIT=1. Full log:
/tmp/fix2-hermetic-rerun3.log (169 lines). `pnpm agent status`
pre-run: PRI 46, Docker Active (colima), registry Active.

The FIX-2 remedy WORKED — first run ever past the snapshot:
repoRoot snapshot passed (no ENOSPC; the flagged 34G
`dist/cargo` remainder did NOT sink — mechanism unprobed),
Dagger linux rust build +
`Pack @reference-ui/rust-linux-x64-gnu` ✔, all 15 packs ✔,
all 15 registry loads ✔ (`Prepared workspace packages and
registry in 2456.2s`), registry ping ✔, t1/t10/t12 installs
(~80s each) ✔. First tier executions in Obj-2 history.

Failure verbatim (chain-t1 test phase — a NEW product/
packaging red, distinct from HERMETIC-RED-2's infra sink):
`Error [ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING]:
Stripping types is currently unsupported for files under
node_modules, for "file:///consumer/node_modules/.pnpm/
@reference-ui+neo@file+.matrix-tarballs+reference-ui-
neo-0.0.0-eb760033.tgz/node_modules/@reference-ui/neo/bin/
neo.ts"` (Node.js v24.18.1, `node:internal/modules/
typescript:183`) → `neo sync watch exited before reaching
runtime-ready output (code=1, signal=null)` → `exit code: 1`.
The packed `@reference-ui/neo` tarball ships `bin/neo.ts`
(TypeScript source relying on type-stripping); Node 24
refuses to type-strip files under `node_modules`, so the
installed `neo` bin cannot boot in ANY consumer. Touches
Phase 0 row 23's "neo bin is source-direct .ts, no build"
assumption — captain rules the remedy (compiled bin vs
otherwise); NOT this crew (fix nothing further).

Per-tier table (fail-fast cascade):

| Package | Result |
|---|---|
| @matrix/chain-t1 | FAILED (test phase, verbatim above, exit 1) |
| @matrix/chain-t10 | ABORTED before setup (fail-fast) |
| @matrix/chain-t12 | ABORTED before setup (fail-fast) |
| @matrix/chain-t11 | STALLED — 4th slot, zero log bytes, 30+ min idle (engine 1% CPU, runners 0%) → run SIGINTed by this crew (own process) |
| @matrix/chain-t2/t3/t6/t7/t8/t9/t13 | NEVER STARTED (fail-fast) |
| @matrix/mcp (×19) | NEVER STARTED (fail-fast) |

0 green, 1 tier failure, 11 blocked-or-stalled.

Repro: the command above (staging alone costs ~41 min;
warn the next crew). Evidence: /tmp/fix2-hermetic-rerun3.log
+ `.pipeline/testing/matrix/matrix-chain-t1-{install,setup,
test}.log` (gitignored run scratch).

Cleanliness: tracked writes = `pipeline/src/build/rust/
targets.ts` (the 1-file exclude) + this log section only;
other sessions' files (LOG-3.md, ui.config.ts, benchmark
reports, one untracked lib test) untouched. Never installed,
never committed, index untouched. No orphans (`pgrep`
clean); colima + verdaccio left running. No extra runs.

## HERMETIC-RED-3 (crew, 2026-09-23)

Fix-2 exclude verified working (snapshot + staging + first
tier executions all green); re-run-3 RED on a NEW product
bug — packed `neo` bin ships source-direct `.ts`, which
Node 24 refuses to type-strip under `node_modules`
(`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`), failing
chain-t1 and fail-fasting the other 11 packages. Filed
verbatim with logs + repro above; fixed nothing further.

## Health tick (captain, 2026-09-23)

Obj-1 COMPLETE. Obj-2: 9 stepped commits landed;
gate-3 consumers 8/8, hermetic RED-2 (ENOSPC/foreign
worktrees, zero executions); FIX-2 working (exclude +
re-run-3). Obj-3: research accepted, implementer
working (negation + guard + medians). Landing voyage
split (LOG-4/5 adopted). Roster: fix2 + obj3-impl
running, all else result_ready. Deadlock test:
clean, both crews fresh with plans filed. No HQ
park/stop. No commits this tick (logs in flight).
Pending HQ: Q-3-7, R6 nod, Map pin nod,
patterns-close confirm, relative-dir bug crew nod,
worktree-prune note (217G foreign). Next: FIX-2
verdict → landing sweep → re-runs → close Obj-2.

## HQ Neo-coherence notes (captain, 2026-09-23)

HQ: RS is solid engine code; Neo feels like a thin
wrapper without the same rigor/art/coherence. No
action now (explicitly not a refactor order) — seeds
for the Neo-finishing groundwork: (1) DTS files
spread through Neo src (core deliberately kept
generated types out of source — strange to have them
in-tree); (2) `lowerResponsiveStyles` looks cursed;
(3) general source-coherence pass so Neo reads like
an engine. DOCS-SWEEP crew dispatched (audit +
verified cleanup of docs/, bugs/, evidence/, loose
root files; case index + doom-agent kept; LOGs live,
recommend-only).

## Docs-sweep (crew, 2026-09-23)

State: WORKING → AUDIT (filed this section). Method: every verdict
below was checked firsthand against the tree (read + scoped grep, no
vibes). Commit base: `8c45a9a6b` + working tree (4 pre-existing
dirty files from other crews — untouched).

### Protected set (identified firsthand, zero touches)

- Case index: `docs/missions/test-index.md` (Capability Test Index,
  idea, 27 lines) + the Neo case catalog it points at
  (`packages/reference-neo/tests/`, `PLAN.md` NEO-* cases).
- Doom-agent files: `docs/missions/doom-agent.md` (154 lines,
  protocol armed, satisfaction marker outstanding) +
  `.agents/skills/doom-agent/` (SKILL.md + ops).
- `LOG-*.md`: mission-live; post-voyage archival recommendation only
  (see §8). This crew appends here only.
- `packages/*/src`: never touched (read-only greps for verification).

### 1. docs/bugs/ — verdicts

- `atlas-disabled-styleprop.md` — OPEN, verified firsthand.
  `isStylePropName('disabled')` is true via
  `style-props.ts:212`
  (`/^(?:_)?(?:hover|focus|active|disabled|...)$/` matches the bare
  HTML attribute, not just `_disabled`). No HTML/ARIA cross-check
  exists. Disposition: KEEP.
- `atlas-usedwith-bloat.md` — OPEN, verified firsthand.
  `finalize_components` (`usage/mod.rs:153-157`) emits every
  co-occurrence with no threshold and no cap; `score_usage(count,
  file_presence_count)` goes VeryCommon on tiny denominators.
  Disposition: KEEP.
- `atlas-non-identifier-props.md` (`}` as prop) — AMBIGUOUS, stays.
  All current prop-name paths are typed-AST only
  (`literals.rs` Identifier/NamespacedName,
  `parser/utils.rs:55-62` StaticIdentifier/String/Numeric; spreads
  yield None) — no path can produce `}`; but the suggested
  identifier filter was never added and no fix commit exists, so a
  live Atlas run is needed to close it. Disposition: KEEP + reason
  filed here.
- `mcp-default-project.md` — OPEN, verified firsthand.
  `pickDefault` (`project-manager.ts:178-206`) never consults
  `hasArtifacts`; `executeWithProject` returns the exact quoted
  "has not been synced yet" error on missing artifacts instead of
  falling back to universal mode (fallback exists only when no
  project resolves at all). Neither numbered fix is implemented.
  Disposition: KEEP.
- `mcp-select-project-schema.md` — OPEN, verified firsthand.
  `select_project` inputSchema (`tools.ts:63-77`) accepts only
  `path`; `project` still fails validation. Disposition: KEEP.
- `recipe-classname-required.md` — mission-live investigation with
  HQ direction thru 2026-09-23 (extractor, not transform).
  Disposition: KEEP, no touch. Filed staleness note (not fixed,
  mission-live): its "verified `core/src/vite/plugin.ts`" pointer
  died with core (`c75a22488`); conclusion (option 1 REJECTED)
  stands.
- `JANK.md` — VERIFIED STALE. Every `Location:` path 404s (core
  retired in `c75a22488`; spot-checked store.ts, log/index.ts,
  clean/command.ts — all gone); zero carryover of any of the 7
  mechanisms or §2 markers in `packages/reference-neo/src/` or
  `packages/reference-rs/modules/` (bounded grep, empty); and
  `bugs/README.md`'s own trigger ("Review JANK.md when that swap
  lands") has fired — the swap landed. No row is actionable.
  Disposition: DELETE (+ README updates). Git history preserves it.

### 2. docs/evidence/ — all KEEP, no touches (immutable per its README)

- Canonical 4 (`flame3`, `counters3`, `alloc3`, `phases1b`): cited
  by `operation-flamegraph-recon-v2.md`, `operation-flamegraph-
  correct.md`, and `CORES.md`. KEEP.
- Siblings (`flame2`, `latest`s, `counters2`, `alloc2`, `phases1`,
  `repro1–7a/b`, `scancensus4`): cited by recon v1/v2, the
  correct-logs cobj files, `CORES.md` §0.1 (repro7a/b ±3ms),
  wave-2/3 swarm reports, and the archived perf-swarm log; the
  `latest`-trap is documented in `evidence/README.md`, not a live
  hazard. `meta.json` git-status snapshots are historical captures.
  KEEP.
- `styletrace-ledger.md`: cited 2× by `completed/styletrace.md`.
  KEEP. `styletrace-ready-ask1–5.md`: 1:1 answers to the mission's
  READY-asks § ("answer in `docs/evidence/`"), all verdicts
  recorded; ask1 additionally cited by the wave-2 nameset report
  (which already flags its "873" as superseded — the staleness is
  recorded at the citer, correct for a challenge record). KEEP.

### 3. docs/missions/ — verdicts

- `test-index.md`, `doom-agent.md`: HQ-keep, no touch (see §0).
- `tooltip-focus-preset.md`, `quarantine-recon.md`: LANDING-live
  (Obj A work doc; Obj B dependency). KEEP.
- `operation-jettison.md`: landed (rulesVersion skew refusal +
  schemaVersion 2 enforced in neo runtime with tests — read
  firsthand), acceptance pending per missions README. KEEP.
- `operation-reaper.md`: AMBIGUOUS, stays with filed reason.
  missions README claims "D1 DECLINED 2026-09-20" but the file
  itself carries no D1 verdict (line 1 still `OPERATION: GO`,
  status `ready`, D1 only as a future gate). README-vs-file
  disagreement is mission-live; not this crew's to resolve.
- `operation-error-correct.md` + `-runtime.md` companion +
  `error-correct-ledger.md`: READY/idea, mission-live. KEEP.
- `mcp-book-seeing.md`: cited as "Full crew manual" by the
  `view-story` skill (`SKILL.md:37`). KEEP.
- `first-that-works.md`: decision record ("we do not implement"),
  cited by forge + overmatch + missions README. KEEP.
- `completed/*` + `flamegraph-logs/*` + `flamegraph-correct-logs/*`:
  provenance for done ops; the cobj/obj logs are per-objective
  records, not duplicates. KEEP.
- `operation-fasthull.md` — SPENT, misplaced as `active`. Status
  line serves "tonight's hyperspace voyage"; that voyage brief is
  archived/superseded and the perf campaign is complete
  (`VOYAGE-PERF-SWARM-LOG.md`: "Campaign complete"); no skill or
  live doc cites the file (only historical `meta.json` status
  captures + missions README). Disposition: MOVE to `completed/`
  with status-line close + missions README row move, per the
  missions rule ("Finished missions move to `completed/`").

### 4. docs/perf/ — all KEEP, no touches

- `waves/`: live `agent-perf` corpus — `perf-index.json` root is
  `docs/perf/waves` (104 entries, built 2026-09-22). KEEP.
- `cores/` (overnight + backfill): cited by mission-live `CORES.md`
  (§stride table, §S2.3 backfill packet). KEEP.
- Twin `log-archive-2026-09-22.md` (wave-2 vs wave-3): differ
  (1865 vs 70 lines) — not duplicates. KEEP both.

### 5. docs/ top level + FEATURES/ — verdicts

- `Architecture.md`, `CORE.md`, `STRUCTURE.md`, `REFERENCE_UI.md`:
  bannered historical by the obj2 prose sweep. KEEP.
- `ATOMIC.md`: living overview, all anchors exist
  (atomic README + SPEC + forge). KEEP.
- `BOOK.md`: living; runtime + `dev:lib` verified; its 3
  `referenceVite` mentions are explicitly marked "(removed with
  core)". KEEP.
- `RELEASE.md`: changesets + `pnpm pipeline`/`release` + docs.yml
  all verified present. KEEP.
- `LAYERS.md` — AMBIGUOUS, stays. Mechanism section describes the
  deleted Panda pipeline, but the concept is live (neo
  `config/types.ts` carries `layers`, T2 is the layers prover).
  Filed recommendation (not applied — content edits out of minimal
  scope): give it the obj2 cutover banner.
- `PUBLIC API.md` — VERIFIED STALE. 4 of 5 sections import from
  `@reference-ui/react` / `@reference-ui/system`, which do not
  exist (package names today: neo, lib, mcp, icons, rust,
  reference-docs); only the neo `defineConfig` line is true.
  Cited only by historical indexes. Disposition: DELETE (+
  `docs/README.md` bullet removal; `Architecture.md:231` row left —
  that whole table maps the retired engine).
- `FEATURES/VITE.md` — VERIFIED STALE. `referenceVite`/
  `referenceWebpack` have zero code references repo-wide; BOOK.md
  records "(removed with core; Neo has no Vite plugin)"; the
  doc's "Code:" paths are deleted. Disposition: DELETE (+
  FEATURES README row removal).
- `FEATURES/STUFF.md` — VERIFIED DUPLICATE. 8-line untitled paste
  fragment; every sentence (fragment collector, no `.raw()`, deep
  merge, base/variant example, Rust AST, under-recipes layer)
  appears expanded in `CSS_COMPOSITION.md`. Disposition: DELETE (+
  FEATURES README row removal).
- Rest of FEATURES: KEEP. Spot-verified live or decision-record:
  VARIANTS (`data-variant` in lib theme + CT; stale core impl
  pointers noted, contract live), TYPES (proposal; ambiguous,
  stays), STRICT_TOKENS (`strict` live in RS typegen),
  PRIVATE TOKENS (`_private` in neo fragments + tests),
  CSS_COMPOSITION (design intent; stale `src/virtualrs` pointer
  now `modules/virtualrs`, root CSS_FRAGMENTS.md never existed —
  noted, doc kept), RESPONSIVE + RESPONSIVE_API (complementary
  research vs API; `r` live in `lowerResponsiveStyles.ts` +
  NEO-RESP cases), CONTAINER_QUERIES (direction decision),
  BREAKPOINTS_PRESETS (research summary, matches current `r`
  behavior), PORTAL_COLOR_MODE (`data-color-mode` in Portal CT),
  DATA_THEME (self-declared superseded plan with D1 banner).
- `docs/archive/`: frozen per charter. KEEP all, no touch.

### 6. Root *.md — verdicts

- `VOYAGE.md`, `LANDING.md`, `CORES.md`, `AGENTS.md`, `README.md`,
  `SECURITY.md`: live (voyage law / mission contracts / entry
  points). KEEP.
- `MATRIX-DECOMMISSIONING.md`: KEEP AT ROOT. Claims verified
  firsthand (11 tiers at `matrix/tests/chain/`, exactly as
  reported); cited 5× by mission-live LOG-2; voyage-landing
  artifact in the VOYAGE/LANDING/CORES family, not engineering-map
  material for docs/.
- `LOG-*.md`: mission-live. Recommendation only: post-voyage,
  archive LOG-1/LOG-2 to `docs/archive/` when the voyage closes;
  leave the decision + move to the captain.

### 7. Loose files — verdicts

- `sync-perf.html`: KEEP AT ROOT. Cited by bare name (no
  directory) from `CORES.md:822`, wave-4 scanrecon4, and the
  frozen archive perf log — moving it breaks all three cites.
- `test-script.mjs`: target
  (`packages/reference-lib/playwright/test-results/results.json`)
  is gone; zero citations; tracked scratch. CODE, so out of this
  crew's delete scope ("docs/prose files only") — RECOMMEND
  deletion, not applied.
- `test-standalone.spec.ts`: 8-line probe; no root Playwright
  config runs it; zero citations; tracked scratch. Same:
  RECOMMEND deletion, not applied.
- `test-results/`, `scripts/dev.mjs`, `matrix/*.md`, package
  READMEs, `.agents/skills/`: out of audit scope, untouched.

### 8. Phase-2 execution plan (deletes verified-stale only)

DELETE: `docs/PUBLIC API.md`, `docs/FEATURES/VITE.md`,
`docs/FEATURES/STUFF.md`, `docs/bugs/JANK.md`. MOVE:
`docs/missions/operation-fasthull.md` → `completed/`.
Index updates: `docs/README.md` (PUBLIC API bullet, JANK line),
`docs/bugs/README.md` (JANK section, swap-landed note),
`docs/FEATURES/README.md` (VITE + STUFF rows),
`docs/missions/README.md` (fasthull row). Nothing else.

### Docs-sweep DONE (crew, 2026-09-23)

State: AUDIT → DONE. Executed exactly the §8 plan, nothing else.

Deleted (verified-stale, each firsthand): `docs/bugs/JANK.md`
(127 lines, all rows pointed at retired core, zero carryover),
`docs/PUBLIC API.md` (29 lines, nonexistent `@reference-ui/react`
+ `/system` imports), `docs/FEATURES/VITE.md` (26 lines, zero code
refs, BOOK marks the plugin removed), `docs/FEATURES/STUFF.md`
(9-line fragment, fully absorbed by `CSS_COMPOSITION.md`).
Moved: `operation-fasthull.md` → `completed/` with status close +
3 link-depth fixes (29-line diff, all links resolve-verified).
Index updates: `docs/README.md`, `docs/bugs/README.md`,
`docs/FEATURES/README.md`, `docs/missions/README.md`.

Left intentionally (filed in audit, not applied): `Architecture.md:231`
PUBLIC API row (whole table maps the retired engine); archive +
evidence `meta.json` old-fasthull paths (frozen history);
FEATURES README DATA_THEME "(still owed)" vs the doc's own D1
superseded banner (scrub-landed state unverified — needs a
`data-panda-theme` census, not a guess); `LAYERS.md` cutover banner
(content edit, out of minimal scope); `test-script.mjs` +
`test-standalone.spec.ts` deletion (code, out of docs/prose scope —
RECOMMENDED); LOG archival (captain's call post-voyage); Reaper
README-vs-file D1 disagreement (mission-live, flagged for
captain/HQ).

Working tree: this crew's files only + 3 pre-existing dirty files
from other crews (benchmark reports, targets.ts) untouched. No
install, no commit, no index touch. `packages/*/src` never written.

## Health tick (captain, 2026-09-23)

Obj-1 COMPLETE. Obj-2: 9 stepped commits landed;
FIX-2 working (dagger exclude + second-sink analysis
filed, re-run-3 pending); docs-sweep auditing
(per-file verdicts with firsthand verification).
Obj-3 COMPLETE + landed. Landing split. Roster:
fix2 + docssweep running, all else result_ready.
Deadlock test: clean (both substantive + writing).
No HQ park/stop. No commits this tick. Pending HQ:
Q-3-7, R6 nod, Map pin nod, patterns-close confirm,
relative-dir bug crew nod, worktree-prune note.
Next: FIX-2 verdict → landing sweep → re-runs →
close Obj-2.

## Health tick (captain, 2026-09-23)

Obj-1/Obj-3 COMPLETE + landed. Obj-2: 9 stepped
commits in; FIX-2 + docs-sweep running. Landing
split. Liveness by products (logs quiet this
interval, both crews in long-work phases):
fix2 editing pipeline targets.ts (context/cache
fix); docssweep restructuring docs/ (deletes +
README rewrites in flight). Deadlock test: clean —
no pings. No HQ park/stop. No commits. Pending HQ
unchanged (6 items). Next: FIX-2 verdict → landing
sweep → re-runs → close Obj-2.

### Docs-sweep addendum (late grep result, no verdict change)

A slow repo-wide grep (superseded during the audit) landed after DONE
with one new fact: `referenceVite` is also named in three files under
`packages/reference-neo/docs/evidence/` — `voyage-log.md:9` (dated
2026-09-18 log entry, pre-retirement state), `landing-lib-
consumption.md:22,110` (consumption map, disposition "(b) — no Neo
bundler plugin"), `core-api-parity.md:47,125,126` (parity table,
MISSING / "later leg"). All three agree with the filed verdict
(removed with core; Neo has no bundler plugin); none asserts a live
plugin, and none is code. `FEATURES/VITE.md` DELETE stands. The
three files are outside this crew's scope (packages docs) — no
touch; the "later" in core-api-parity is flagged for whoever owns
that parity table.

## Docs-sweep acceptance — phase 1 (captain, 2026-09-23)

DOCS-SWEEP ACCEPTED as PHASE 1 (cleanup). Verified
firsthand: 4 verified-stale deletes executed, fasthull
move + link fixes landed, indexes updated with proper
removal notes. Left-intentional list filed honestly
(arch-table row, frozen metas, DATA_THEME scrub state,
LAYERS banner, code deletions RECOMMENDED for the
landing sweep, LOG archival for post-voyage, Reaper
disagreement flagged mission-live). GAP: the crew
executed the original brief, not HQ's coherence
amendment — no TARGET SHAPE, no update-or-delete
pass. Dispatched DOCS-COHERENCE follow-up (target
shape + outdated-content updates on top of this
audit). Reaper flag + code-deletion recs ride the
landing sweep / HQ note.

## Docs-coherence (crew, 2026-09-23) — WORKING

Scope (strict): docs/prose files only, no code. Never install,
never commit, never touch the index, never touch another
session's files. Input: LOG-2.md ## Docs-sweep audit + DONE +
left-intentional list + phase-1 acceptance, read IN FULL — not
redone. NOT mine: code deletions (landing sweep), LOG archival
(captain post-voyage), Reaper disagreement (mission-live, stays
flagged), frozen archive/evidence metas.

State: WORKING. Base: `8c45a9a6b` + working tree (phase-1
changes present uncommitted; 3 pre-existing dirty files from
other crews — benchmark reports, targets.ts — untouched).

## Docs-coherence TARGET SHAPE (crew, 2026-09-23)

Filed before execution. Phase-1's tree shape is kept — the
coherence gap is status discipline + stale content, not layout.

### Top-level layout (what lives where)

- `docs/README.md` — the index. Four blocks, no more: Start here
  (living guides), Architecture-historical (bannered), Open
  issues, Archive.
- Living guides at top: `REFERENCE_UI.md` (orientation),
  `ATOMIC.md` (compiler), `BOOK.md` (playground contract),
  `RELEASE.md` (publish). Each carries a Status line; executed
  plans inside them are marked, not silently left.
- Historical maps at top: `Architecture.md`, `CORE.md`,
  `STRUCTURE.md`, `LAYERS.md` — all carry the obj2 cutover
  banner ("maps the retired engine; paths/mechanism are
  pre-cutover history"). No new top-level guides without an
  index row.
- `FEATURES/` — product contracts, proposals, research. Every
  file states its kind up top: contract (live mechanism with
  file cites), proposal (what's decided vs open), research
  (snapshot + pointer to the live doc). No file presents a
  dead mechanism in the present tense.
- `bugs/` — open, actionable issues only (phase-1 verified-open
  bar). Fixed bugs leave; the README is the whole index.
- `missions/` — active ops + ideas, one file each; `completed/`
  for done. Ledger/companion files sit next to their op AND
  are indexed (no unindexed strays). `done` rows live on the
  closed line, never in the active table.
- `evidence/` — immutable measurement records (own README
  rules). `perf/` — live agent-perf corpus. `archive/` —
  frozen. None of the three take edits.

### Naming rules (observed, now written)

- Top-level guides: `UPPERCASE.md`, underscores.
- `FEATURES/`: `UPPERCASE.md`, underscores. `PRIVATE TOKENS.md`
  keeps its space (grandfathered; links use `%20`). No new
  spaces, no new casing styles.
- `bugs/`: kebab-case, area-prefixed (`mcp-*`, `atlas-*`,
  `recipe-*`).
- `missions/`: kebab-case; operations `operation-<name>.md`;
  companions `<name>-ledger.md` / `<name>-recon.md`; crew
  notes keep their plain name but MUST be indexed.

### Index discipline

- Every directory has `README.md`; every file is indexed with
  a status word; zero orphans (verified by listing, not
  memory).
- Deletes/moves update the index in the same change with a
  one-line removal note (JANK precedent, phase 1).
- Dangling pointers are resolved, never left (Arch-row
  precedent, this crew).
- Rewritten claims cite the tree firsthand (file:line or
  verified-absent); freshening prose from memory is forbidden.

### Execution (this crew, docs/ only)

A. Owned leftovers: Arch :231 row annotate (historical map —
annotate, don't delete); LAYERS cutover banner; DATA_THEME
scrub-state header + README row fix (census LANDED).
B. Updates: PORTAL_COLOR_MODE (D1 retarget + completion
marks); VARIANTS (symmetry row + proposal banners);
BOOK (2 panda rows); CSS_COMPOSITION (2 pointers + status);
TYPES (proposal-status banner); STRICT_TOKENS (status +
command/path retargets); RESPONSIVE (research-snapshot
header).
C. Index: missions README — 3 stray rows + fasthull to closed.
D. Deletes: none (nothing new meets the verified-stale bar).
E. Duplicates: no merge (4 responsive docs are complementary
research/API/direction/presets; cross-linked via headers).
F. Flagged for owners (out of docs/ scope, not edited):
package component docs with `data-panda-theme` mentions
(OVERLAYS.md:237, Overlay.md:151, Overlay/SPEC.md,
Portal.md, Portal/NEXT.md), BOOK.md §2.1 dead `src/Book/`
links + §2.3 deleted Cosmos files, `matrix/TEST_MIGRATION.md`
panda pin. Code deletions + LOG archival + Reaper stay with
their owners per brief.

## Docs-coherence DONE (crew, 2026-09-23)

State: WORKING → TARGET SHAPE → DONE. Target shape filed
above; executed exactly it. Every rewritten claim verified
firsthand (file:line or verified-absent); nothing freshened
from memory.

### A. Owned leftovers — all resolved

- **Arch :231**: annotated, not deleted — the doc is a
  historical map of the retired engine, so the row stays with
  "(file deleted 2026-09-23 — post-cutover stale; row maps
  the pre-cutover tree)".
- **LAYERS banner**: cutover note in the Architecture.md:6
  style. Verified wording: mechanism is retired Panda/core;
  concept live via Neo `BaseSystem.css`
  (`config/types.ts:13`) + kept prover `matrix/tests/chain/T2`
  (`layers: [baseSystem]`, `:16`); the `layers` config key
  itself deferred in Neo (untyped).
- **DATA_THEME scrub state**: census LANDED as `data-color-mode`
  per D1 (full-tree `rg`, 60+ files triaged). Proof filed in
  the doc header: `context.ts:14` + alias-free reader
  (`:84-92`), NEO-PRIM-07/COND-04/TOKEN-05/PRIM-14/PARITY-04
  TESTS rows, single-stamp Book decorator, Toast `data-theme`
  chrome intact. README row fixed ("(still owed)" → LANDED).
  Body retained verbatim as the superseded plan.

### B. Updates (outdated-but-salvageable)

- **PORTAL_COLOR_MODE.md** (largest): 26 retired-attribute
  mentions retargeted to `data-color-mode`; §2.1 rewritten to
  real Neo paths (`context.ts`, `factory.ts`); §2.3 matrix
  suite → Neo case homes; Law 1 rewritten for D1;
  DocumentContext propagation landed in Law 3/5 + §7.2;
  deletion list + Phases 1–4 marked ✅ with file:line proof
  (surface deleted, Div hosts, single-stamp decorator,
  canonical reader, PT-THEME-01–06 + OV-THEME-01/02 +
  NEO-PRIM-14); §9 grep item checked. Laws, ownership, and
  open gaps (§7.1/7.3/7.4, Phase 5) stand.
- **VARIANTS.md**: symmetry row retargeted; §3 bannered
  proposal-unimplemented (live seam: uniform `variant?:
  unknown`, `generate.ts:96`); §6 bannered pre-cutover plan
  with live coverage cites; §7 bannered history; `file://`
  absolute link → relative; Panda-config line reworded.
- **BOOK.md**: decorator row (dead `src/Book/` link → live
  `book/` path + `data-color-mode`); §8.2 paren swept.
- **CSS_COMPOSITION.md**: status line; dead root-file pointer
  dropped with note; `src/virtualrs` → `modules/virtualrs`.
- **TYPES.md**: proposal-status banner (core paths retired;
  strict direction live in RS typegen `strict.rs`; Neo
  publish side; `strict:` key not a surface; open question).
- **STRICT_TOKENS.md**: status banner (live emit option, key
  not wired); 4 dead-command/path pointers swept.
- **RESPONSIVE.md**: research-snapshot header (Panda/core/
  box-pattern historical; box retirement pinned by
  `bootstrap-import-map.test.ts:71`; live pointers to
  `lowerResponsiveStyles.ts`, RESPONSIVE_API, PRESETS).

### C. Index

- missions README: 3 strays indexed (ledger, recon report,
  crew note — each got a Status line in-file); done rows
  (Flamegraph ×2, Fasthull) moved out of the Active table to
  the closed line. Zero orphans verified by listing (FEATURES,
  bugs, missions, top level); all new links resolve-verified.

### D/E. Deletes / duplicates

- Deletes: NONE — nothing new meets the verified-stale bar
  (all stale-but-meaningful bodies retained as bannered
  records).
- Duplicates: NO MERGE — the 4 responsive docs are
  complementary (research/API/direction/presets), now
  cross-linked via headers.

### F. Flagged for owners (out of docs/ scope, not touched)

- Package component docs with retired-attribute mentions:
  `OVERLAYS.md:237`, `Overlay.md:151`, `Overlay/SPEC.md`,
  `Portal.md`, `Portal/NEXT.md` (1–2 lines each; lib-docs
  owner).
- `BOOK.md` §2.1 remaining dead `src/Book/` links + §2.3
  Cosmos files (all 3 verified deleted; Book owner).
- `matrix/TEST_MIGRATION.md:109` panda pin (matrix docs).
- Per brief, still with their owners: code deletions
  (`test-script.mjs`, `test-standalone.spec.ts` → landing
  sweep), LOG archival (captain post-voyage), Reaper
  README-vs-file disagreement (mission-live).

Working tree: this crew touched docs/ + LOG-2.md only (13
files). No installs, no commits, no index touches,
`packages/*/src` never written. Pre-existing dirt from other
crews (benchmark reports, targets.ts) untouched. Phase-1
entries in status are that crew's, not mine.

## HERMETIC-RED-3 triage (captain, 2026-09-23)

FIX-2 exclude VERIFIED working (snapshot + staging +
first tier executions green). Re-run-3 RED on a NEW
REAL product bug: packed neo bin ships source-direct
.ts, Node 24 refuses type-stripping under node_modules
→ installed bin cannot boot in ANY consumer. This is
the hermetic gate WORKING — no native run installs
the packed tarball, so only Dagger could catch it.
Phase-0 row-23 assumption ("no build") OVERTURNED.
CAPTAIN'S REMEDY: compiled bin (prepack build, bin
points at built output, files[] carries it) — the
standard shippable-bin shape. FIX-3 dispatched
(packaging + neutral-consumer boot proof + hermetic
re-run-4). Constraint: repo dev keeps working.

## Docs-coherence acceptance (captain, 2026-09-23)

DOCS-COHERENCE ACCEPTED. Verified firsthand: Arch
row annotated (not deleted), DATA_THEME header
carries the census proof, PORTAL retargeted (27
data-color-mode), scope clean (docs + LOG-2 only;
bench/targets dirt belongs to others). Target shape
filed + executed; leftovers resolved; no-merge call
sound (complementary docs, cross-linked); owner
flags filed (lib-docs lines, Book links,
TEST_MIGRATION pin, code deletions → sweep, LOG
archival → post-voyage, Reaper → mission-live).
Docs are coherent. Commit rides the next checkpoint.

## Fix-3 (crew, 2026-09-23) — WORKING

Scope (strict): FIX-3 (Objective 2 — compiled neo bin +
hermetic re-run-4). HERMETIC-RED-3: packed `@reference-ui/neo`
ships `bin/neo.ts`; Node 24 refuses type-stripping under
node_modules, so the installed bin cannot boot anywhere.
CAPTAIN'S REMEDY (binding): compiled bin. Governing skill
`test-core` loaded first. LOG-2.md ## Fix-2 + ## HERMETIC-RED-3
+ triage read IN FULL (verbatim error + attribution).
Packaging files + this log only. Never install (except the
/tmp neutral consumer), never commit, never touch the index,
never touch another session's files.

### Fix-3 recon (read-only, firsthand)

- Bin chain: `bin/neo.ts` → `src/sync/index.ts`,
  `src/reference/bridge/init.ts`, `src/sync/watch.ts`,
  `src/lib/paths/out-dir.ts`. Closure traced programmatically
  (/tmp/fix3-closure.mjs): 65 files; true bare deps = node
  builtins + esbuild/fast-glob/picomatch/@parcel/watcher/
  `@reference-ui/rust/*` — ALL in package.json dependencies.
  No react/styled/self ids (3 tracer suspects + 3 unresolved
  relatives all verified as generated-code string literals).
- Single-file bundling is ARCHITECTURALLY WRONG here (kills
  the naive tsup/esbuild-bundle shape): (a) esbuild alias
  entries resolve from `import.meta.url` at DIFFERENT depths
  (`src/config/bundle.ts:36-39` up-one vs
  `src/fragments/base/bootstrap-import-map.ts:21-24` up-two —
  no single bundle site satisfies both); (b) sync reads
  package-relative assets at runtime (`src/entry/types.d.mts`
  via reference-types.ts:134, `entry/types.tsx` via :83,
  runtime/factory/split/context paths via react.ts:34/91-93);
  (c) 7 computed-path literals hardcode `.ts`/`.tsx`. A bundle
  breaks all three; a layout-preserving transpile keeps every
  computation byte-correct with ZERO src changes.
- tsup rejected with reason (mcp's precedent is app-bundling):
  breaks (a), and tsup is not a neo dep (charter forbids
  installs). tsc 7.0.2 is in devDeps (no install needed);
  `tsconfig.build.json` naming matches the RS precedent
  (`tsc -p tsconfig.build.json` in reference-rs build:js).
- Staging mechanics (pipeline/src/registry/pack.ts:156-162 +
  package-prep.ts:214-243): whole-dir copy (dist rides along
  when prebuilt) then `pnpm pack` with
  `npm_config_ignore_scripts=true` — PREPACK NEVER RUNS in
  staging, so the worktree must carry a prebuilt dist. The
  post-pack declared-paths check (files[] + main + types +
  exports targets) fails loud on missing legs.
- Exports `./runtime`: 29 spec importers in dev (self-link +
  exports map), ZERO in packed contexts (matrix kept tiers,
  fixtures, icons/docs/lib/mcp src, pipeline — all verified).
  Pointed at dist (`./dist/src/runtime/index.js`): every
  packed byte loads without stripping, no stowaways. files[]
  = ["dist"] only (tarball: 239 entries, zero src/tests/
  tools, zero `bin/neo.ts`).
- In-repo invocation census: direct-source (`node
  ../reference-neo/bin/neo.ts` in lib scripts; CLI-01/02
  specs + bin/neo.test.ts spawn `bin/neo.ts`) vs
  installed-shim (`.bin/neo` in docs/fixtures/icons/matrix,
  `pnpm exec neo`, pipeline runner). Installed shims BAKE
  the target at link time (verified: fixture shim execs
  `@reference-ui/neo/bin/neo.ts`) — they re-point at dist
  on the next `pnpm install`, which this crew cannot run
  (never install). So: shims keep working via source TODAY,
  dist after build-once + next install (documented).

### Fix-3 implementation (6 paths: 4 tracked M + 2 new)

- NEW `packages/reference-neo/tsconfig.build.json`: extends
  base; outDir dist, rootDir `.`, declaration true (see the
  regression note), rewriteRelativeImportExtensions;
  include src+bin; exclude tests/fixtures/tools/playground/
  benchmark/dist.
- NEW `packages/reference-neo/tools/build-bin.mjs`: tsc emit
  → fail-closed alias-literal assertion over the 4
  path-computing files (exact-set match, drift = build
  failure) → 7 esbuild-entry twins (transpiled JS under the
  computed `.ts`/`.tsx` names; node never loads them) + 1
  verbatim asset (`entry/types.d.mts`) → shebang assert +
  chmod 755 on `dist/bin/neo.js`. Idempotent, exit-nonzero
  on any failure.
- `packages/reference-neo/package.json`: bin →
  `./dist/bin/neo.js`; exports `./runtime` →
  `./dist/src/runtime/index.js`; files `["dist"]`; scripts
  build/prepack/prepublishOnly (direct `node` invocation,
  npm-portable).
- `tools/README.md` + `README.md`: build-once documentation
  (constraint 3, staging caveat included).
- REGRESSION caught by own proof (fixed in scope):
  declaration-less emit degraded `./runtime` to `any` and
  the `.ts` twins hijacked type resolution — package tsc
  went 8 errors (2 TS7016 twin-hijack + 6 TS7006 cascade in
  resp specs). Fix: declaration true → tsc back to ZERO
  errors, specs keep strict inference. No src touched.

### Fix-3 proofs (all firsthand)

- Build: `[neo build] dist ready: 236 files`, bin boots
  (`--help` exit 0, shebang + 755). No `.test.js`,
  all 7 twins + asset present, zero remaining relative
  `.ts` imports. `agentneo q` on the build script: 0/0.
- prepack PROVEN: `rm -rf dist` → `pnpm pack` →
  `dist/bin/neo.js` exists (hook fires during pack).
- Dist sync: exit 0, 240–274ms, zero diagnostics.
  Equivalence vs source bin: styles.css byte-identical;
  fragment delta = esbuild path comments ONLY
  (`src/…` vs `dist/src/…`); react.mjs = same 147
  bundled functions (md5-equal name sets), minified
  idents reassigned; baseSystem name/exports equal.
- Constraint-3 per-path table (every in-repo `neo` path):

| Path | Shape today | Proof |
|---|---|---|
| lib `pnpm run sync` | source direct | exit 0, 3236ms |
| fixture `pnpm sync` | shim→source | exit 0, 115ms |
| docs `pnpm exec neo sync` | shim→source | exit 0, 4565ms |
| icons / chain-t2 / mcp shims | shim→source | `--help` exit 0 (×3) |
| `bin/neo.test.ts` | spawns source | `agent vt`: PASSED |
| NEO-CLI-02 | spawns source --watch | `agentneo run`: PASS |
| NEO-CSS-02 / RECIPE-01 / RESP-01 | specs→dist runtime | `agentneo run`: exit 0 (×3) |
| dist `sync` (fixture) | dist direct | exit 0 + equivalence above |
| dist `clean` (empty dir) | dist direct | exit 0, routing ok |
| dist `sync --watch` (fixture) | dist direct | boot line + SIGTERM→exit 0 |
| installed-shim→dist cutover | next `pnpm install` | proven by neutral consumer below (fresh shim → `dist/bin/neo.js`) |
| pipeline runner invocations | hermetic installs | re-run-4 below |

- CLI-01 not re-run: byte-identical spawn mechanism to
  CLI-02 over a byte-untouched source file (noted, not
  assumed — same `BIN_PATH`, same execFile shape).
- NEUTRAL-CONSUMER BOOT PROOF (exact RED-3 scenario):
  packed `reference-ui-neo-0.0.0.tgz` (119KB) + rust
  tarball (packed with pipeline-identical
  `npm_config_ignore_scripts=true`; rust's own prepack is
  red in-tree — verbatim `Error: Refusing to pack
  @reference-ui/rust with stale or unstamped native
  binaries:`, rust-owned, out of scope, staging-immune
  since staging ignores scripts) → installed into
  /tmp/fix3-consumer (file: + override) under Node
  v24.16.0. Installed layout `dist/ package.json
  README.md` (no src, no `.ts`); fresh shim →
  `neo/dist/bin/neo.js`; `neo --help` exit 0 (the
  `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` is
  GONE); `neo sync` exit 0, 363ms, full folder +
  scope links; baseSystem imports (neo-cli-watch);
  sheet carries the brand token; installed
  `@reference-ui/neo/runtime` loads (function).
- Footprint: exactly the 6 paths above + this log;
  index clean (`git diff --cached` empty); 26 other
  dirty paths belong to sibling sessions (docs-sweep,
  fix-2, bench) — untouched. dist/ gitignored (no
  tree dirt). No installs in-repo.

### HERMETIC RE-RUN-4: RED (packaging green, tiers red on product)

Command (via test-core, never raw — run-1's exact scope):
`pnpm agent test --packages=@matrix/chain-t1,@matrix/chain-t2,
@matrix/chain-t3,@matrix/chain-t6,@matrix/chain-t7,
@matrix/chain-t8,@matrix/chain-t9,@matrix/chain-t10,
@matrix/chain-t11,@matrix/chain-t12,@matrix/chain-t13,
@matrix/mcp` → HERMETIC_EXIT=1. Full log:
/tmp/fix3-hermetic-rerun4.log (232 lines). `pnpm agent status`
pre-run: PRI 46, Docker Active (colima), registry Active,
queue idle.

The FIX-3 remedy WORKED — RED-3 is fixed. Staging ran the
new build itself (`Build @reference-ui/neo (502ms)` — the
pipeline's build phase executes `pnpm --filter <pkg> run
build` for registry packages with a build script,
pipeline/src/build/index.ts:27/50, so staging is
self-sufficient; prepack covers real publishes; README
corrected accordingly), packed the dist tarball, and every
executed tier boots + syncs the INSTALLED bin in virgin
containers: `[neo] sync 14xms → /consumer/.reference-ui` +
`[neo] watching /consumer` on all 4. Zero
`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`. Staging:
93.6s (rust artifacts cached from re-run-3); installs
27.4s clean; T1 unit 3/3 PASSED. First green tier
executions through the installed bin in Obj-2 history.

Failure verbatim (Playwright assertion reds, NOT setup/
packaging — infra healthy, tests execute against live
paints, mixed pass/fail):
- @matrix/chain-t10: `1 passed | 2 failed (3)`
- @matrix/chain-t11: `1 passed | 2 failed (3)`
- @matrix/chain-t12: `1 passed | 2 failed (3)`
- @matrix/chain-t1: unit `3 passed (3)`; Playwright
  `4 passed | 3 failed (7)`, with sync warnings
  `[neo] sync warning ATM-W-UNKNOWN-TOKEN-PATH: unknown
  token path '_private.brand' (/consumer/src/index.tsx:37:18)`
  and `(:38:24)` (same two lines, verbatim ×2).
- Per-assertion names were NOT persisted (runner captures
  the summary only; `.pipeline/testing/matrix/
  matrix-chain-t*-test.log` are empty; no --verbose flag
  exists — only --trace for Dagger). Filed everything the
  run emitted; the inference below is labeled inference.

Per-tier table (fail-fast cascade, re-run-3 shape):

| Package | Result |
|---|---|
| @matrix/chain-t1 | FAILED (unit 3/3; playwright 4/7) |
| @matrix/chain-t10 | FAILED (playwright 1/3) |
| @matrix/chain-t11 | FAILED (playwright 1/3) |
| @matrix/chain-t12 | FAILED (playwright 1/3) |
| @matrix/chain-t2/t3/t6/t7/t8/t9/t13 | NEVER STARTED (fail-fast) |
| @matrix/mcp (×19) | NEVER STARTED (fail-fast) |

4 red, 8 never-started. Repro: the command above
(staging now ~94s cached).

ATTRIBUTION (firsthand, packaging EXONERATED — fix
nothing further per charter): decisive control on the
real T1 suite dir — source bin sync vs dist bin sync:
BOTH exit 0 with the SAME 2 `_private.brand` warnings,
logs identical modulo timing (203ms/108ms). The warnings
(and tier behavior) are engine/input-determined (native
atomic), with zero source-vs-dist delta — consistent
with the fixture equivalence (CSS byte-identical,
path-comments-only fragment delta, 147/147 bundled
functions). INFERENCE (labeled): failures concentrate
on map-filed product gaps, all first contact between
core-shaped tier oracles (never executed under neo
before re-run-3, which died at boot) and neo behavior —
`layers:` legs (T10 line 30, T12 line 30; Neo D17
defers the surface), `_private` legs (T1 lines 42/60;
strip semantics), multi-chain endpoint paints (T11).
Whether these tiers slim to install-dimension per HQ
law or neo closes the gaps is a CAPTAIN/HQ call, not
packaging. This crew fixes nothing further.

## HERMETIC-RED-4 (crew, 2026-09-23)

Fix-3 packaging verified green end to end (compiled bin
boots + syncs in every installed context: 4/4 hermetic
tiers, /tmp neutral consumer, all in-repo paths); re-run-4
RED on tier Playwright assertions (t1 4/7, t10/t11/t12
1/3 each; 8 packages fail-fasted). Source-vs-dist control
proves zero packaging delta — product/oracle divergence
(layers D17, _private, multi-chain first contact). Filed
verbatim with logs + repro above; fixed nothing further.

## Health tick (captain, 2026-09-23)

Obj-1/Obj-3 COMPLETE + landed. Obj-2: 9 stepped
commits in (a 10th commit is Obj-3's); docs coherent
+ accepted; FIX-3 working
(compiled bin + boot proof + re-run-4) — charter
filed, package.json already in motion. Landing split.
Roster: fix3 running alone. Deadlock test: clean.
No HQ park/stop. No commits this tick. Pending HQ
unchanged (6 items). Next: FIX-3 verdict → landing
sweep → re-runs → close Obj-2.

## HERMETIC-RED-4 triage (captain, 2026-09-23)

FIX-3 packaging VERIFIED green (installed bin boots +
syncs in all contexts; first green tier executions in
Obj-2 history). Re-run-4 RED on tier ASSERTIONS (t1
4/7, t10/t11/t12 1/3; 8 packages fail-fasted, incl.
all of mcp). Source-vs-dist control proves ZERO
packaging delta — this is first contact between
core-shaped tier oracles and neo behavior: layers
legs (D17, surface deferred), _private legs (strip
semantics), multi-chain paints. Landing with red
tiers is impossible; closing D17 pre-landing is
impossible — each failing assertion needs triage
(neo-bug → fix now; surface-gap → park with pointer;
oracle-drift → ruled update). Per-assertion names
were NOT persisted (runner summary-only) + fail-fast
hid 8 packages. TRIAGE crew dispatched: full
enumeration without fail-fast, per-assertion capture,
classification + recommended disposition per row, no
fixes. HQ rules dispositions on the table (touches
the reversal premise — full facts first).

## Triage (crew, 2026-09-23) — WORKING

Scope (strict): TRIAGE (Objective 2 — enumerate every failing
tier assertion). No fixes — enumerate + classify. Governing
skill `test-core` loaded first. LOG-2.md ## Fix-3 +
## HERMETIC-RED-4 (verbatim + control) read IN FULL. Verify +
report only. Never install, never commit, never touch the
index, never touch another session's files.

Recon (read-only, firsthand):
- Fail-fast is HARD-CODED: `pipeline/src/testing/matrix/
  runner/run.ts:170-200` (`while (!failed)` +
  `shouldStop: () => failed`, zero flags). Per-package
  hermetic runs required for all 12.
- Per-assertion names are UNPERSISTABLE by the runner:
  hermetic Playwright is pinned to a summary-only reporter
  (`package-runner.ts:68` `--reporter=/tmp/r.js`,
  `playwright-reporter.ts` counts only; native tier configs
  use `reporter: 'line'`). Firsthand fallback: run tier
  specs natively (line reporter) against neo-synced
  consumers; hermetic per-package runs confirm counts.

## Docs-milspec (crew, 2026-09-23) — WORKING

Scope (strict): docs/ + live prose references only. Never install,
never commit, never touch the index, never touch another
session's files. Input: LOG-2.md ## Docs-sweep + ## Docs-coherence
TARGET SHAPE + DONE + both acceptances, read IN FULL — built on,
not over. FROZEN (zero touches): LOG-*.md, docs/archive/,
docs/evidence/, docs/perf/, code. Plain `mv` for renames (no
`git mv` — the index is untouched; git detects renames at commit);
macOS case-only renames go through an explicit two-step temp name.

State: WORKING. Base: `8c45a9a6b` + working tree (phase-1 +
coherence changes present uncommitted; sibling dirt in
packages/reference-neo + pipeline/targets.ts untouched — none of
my reference-sweep targets overlap it, verified via git status).

Pre-execution findings (firsthand, shape the scheme):
- F1: `docs/CORE.md` carries NO cutover banner — both prior
  crews misclaimed it ("bannered historical", sweep §5;
  "all carry the obj2 cutover banner", coherence TARGET
  SHAPE). `grep -i cutover|retired|historical` on the file is
  empty. Milspec adds the banner (core's retirement in
  `c75a22488` is verified history, not memory).
- F2: `docs/missions/completed/operation-overmatch.md:105,837`
  link `first-that-works.md` relatively — that file lives in
  `missions/`, not `completed/`. Pre-existing dangle; milspec
  repoints to `../FIRST_THAT_WORKS.md`.
- F3: `.agents/skills/doom-agent/SKILL.md` cites
  `docs/missions/operation-forge.md` — missing `completed/`,
  pre-existing dangle; and `docs/missions/doom-agent-protocol.md`,
  which never existed (folded into `doom-agent.md` per its own
  header). Milspec repairs both to existing files.
- F4: `docs/BOOK.md:320,451,523,524` link `.agents/...` and
  `AGENTS.md` relative to `docs/` — both 404 from there.
  Pre-existing dangles; milspec repoints to `../../.agents/…`
  and `../AGENTS.md` (targets verified to exist).
- F5: `docs/missions/operation-jettison.md` line 1 reads
  `OPERATION: GO` and the missions index rows it `active`
  (implementation complete, acceptance pending), but its
  in-file status still says `ready`. Milspec aligns the
  in-file status to `active` (two in-tree witnesses, no memory).
- F6: `docs/missions/flamegraph-logs/` + `flamegraph-correct-logs/`
  are provenance for CLOSED ops (every file opens COMPLETE)
  yet sit under active `missions/` and are indexed nowhere —
  orphans by the coherence index rule. Milspec moves them
  under `COMPLETED/` (exact active/COMPLETED split) and indexes
  them in the COMPLETED README.
- F7: `docs/missions/completed/README.md` indexes only 4 of 10
  files (Flamegraph x4 + Fasthull missing). Milspec rewrites it
  complete (10 files + 2 log dirs).

## Docs-milspec SCHEME (crew, 2026-09-23)

Filed before execution; the renames below execute uniformly.
Supersedes the coherence naming rules only; layout, index
discipline, and verdicts stand.

### S1. All-caps naming (mechanical)

Every file/dir under docs/ except frozen is UPPER_SNAKE
(uppercase, `_` separators; `.md` extension stays lowercase).
Mechanical map: uppercase + `-`/space → `_`.

- Dirs: `bugs/` → `BUGS/`, `missions/` → `MISSIONS/`,
  `missions/completed/` → `MISSIONS/COMPLETED/`,
  `missions/flamegraph-logs/` → `MISSIONS/COMPLETED/FLAMEGRAPH_LOGS/`,
  `missions/flamegraph-correct-logs/` →
  `MISSIONS/COMPLETED/FLAMEGRAPH_CORRECT_LOGS/` (F6).
  `FEATURES/` unchanged. `archive/`, `evidence/`, `perf/`
  FROZEN — their lowercase names stay by exemption.
- `README.md` keeps its name in every directory (index
  convention; renderers depend on it).
- `FEATURES/PRIVATE TOKENS.md` → `NEO_PRIVATE_TOKENS.md`
  (the `%20` grandfathering dies with the space).
- Mission/log/bug files: pure mechanical uppercase
  (e.g. `operation-error-correct.md` →
  `OPERATION_ERROR_CORRECT.md`, `obj1-flame.md` →
  `OBJ1_FLAME.md`, `cobj1-aggregation.md` →
  `COBJ1_AGGREGATION.md`).

### S2. Module scoping (prefix scheme)

Scope codes: HIST (retired-engine record), NEO
(@reference-ui/neo), RS (@reference-ui/rust), LIB
(@reference-ui/lib), MCP (@reference-ui/mcp). Repo scope =
unprefixed at top level only (the top level IS repo scope —
no `REPO_` stutter). One rule per directory:

- Top level: repo-wide docs stay unprefixed
  (`REFERENCE_UI.md`, `RELEASE.md`); module-owned guides
  take a prefix (`ATOMIC.md` → `RS_ATOMIC.md` — the native
  compiler in reference-rs; `BOOK.md` → `LIB_BOOK.md` — the
  lib playground); bannered-historical maps take `HIST_`
  (`Architecture.md` → `HIST_ARCHITECTURE.md`, `CORE.md` →
  `HIST_CORE.md`, `STRUCTURE.md` → `HIST_STRUCTURE.md`,
  `LAYERS.md` → `HIST_LAYERS.md`).
- `FEATURES/`: every contract/proposal/research takes its
  implementing module's prefix (these are the general docs).
  Responsive family uniformly NEO (`r` lowers in
  `lowerResponsiveStyles.ts`): `NEO_RESPONSIVE.md`,
  `NEO_RESPONSIVE_API.md`, `NEO_CONTAINER_QUERIES.md`,
  `NEO_BREAKPOINTS_PRESETS.md`. Typegen pair uniformly RS
  (direction landed in `modules/typegen/`): `RS_TYPES.md`,
  `RS_STRICT_TOKENS.md`. `CSS_COMPOSITION.md` →
  `NEO_CSS_COMPOSITION.md` (fragment collector → Neo
  fragments). `PRIVATE TOKENS.md` → `NEO_PRIVATE_TOKENS.md`
  (`_private` in Neo fragments + tests). `VARIANTS.md` →
  `LIB_VARIANTS.md` (universal prop + house styles in lib).
  `PORTAL_COLOR_MODE.md` → `LIB_PORTAL_COLOR_MODE.md`
  (Owner: Portal in lib — stated in-doc).
  `DATA_THEME.md` → `NEO_DATA_THEME.md` (canonical
  attribute + reader in Neo `context.ts`).
- `BUGS/`: the area prefix uppercased IS the scope — no
  double prefix. `MCP_*` (server), `ATLAS_*` (RS Atlas
  module via MCP), `RECIPE_*` (Neo recipe runtime).
- `MISSIONS/` + `COMPLETED/` + log dirs: exempt (mission
  records, not module docs; scope is the voyage, stated in
  the index; `OPERATION_` kind-prefix retained).

### S3. Elegance pass (headers + scaffolding only)

- Title line: `# Title Case Name`, no filename echoes
  (`# CORE.md` → `# Reference Core — Vision`,
  `# DATA_THEME.md — …` → `# Color-Mode Attribute Scrub`).
- Uniform status block under the title: `**Status**: …`
  (+ `**Scope**: …` + existing Owner/Related lines kept).
  Status values derive from verified in-doc content only
  (living guide / historical record / contract / proposal /
  research / open / idea / ready / active / done / ledger /
  report / crew note). Missions keep the line-1
  `OPERATION: <STATE>` convention; `Status:` normalizes to
  the bold form without content change — except F5
  (jettison `ready` → `active`) and added lines for
  TOOLTIP_FOCUS_PRESET (`idea`, LANDING Obj A work doc),
  OPERATION_FORGE_MAP (`done`), and the two recon reports
  (`done`; v1 notes supersession per v2's own header).
- `HIST_CORE.md` gains the cutover banner (F1; verified
  history, Architecture.md:6 style).
- Bodies untouched (retained-verbatim records stay verbatim;
  only link targets move).

### S4. Reference sweep (zero dangling, resolve-verified)

- In-docs: every link target updated per the rename map
  (mechanical `sed` per mapping + read-back).
- Repo-wide live prose: root `README.md` (4 bullets),
  `LANDING.md` (2 links), `.agents/skills/view-story/SKILL.md`
  (manual link), `.agents/skills/doom-agent/SKILL.md` (3
  cites incl. F3 repairs), `Portal/NEXT.md`,
  `Overlay/Overlay.md`, `ATM-DIAG-09`/`ATM-DIAG-13` READMEs,
  `modules/atomic/SPEC.md`, `diagnostics/README.md`,
  `styletrace/README.md`, `reference-neo/PLAN.md`,
  `matrix/CHAIN_REPORT.md:157`. Incidental pre-existing
  dangles repaired: F2, F4.
- Left to age (frozen, enumerated not edited): LOG-*.md,
  `docs/archive/` (5 files cite missions paths),
  `docs/evidence/` (README, styletrace-ledger, ask1),
  `docs/perf/waves/wave-2/memo-shot3.md`,
  `.agents/doom/logs/`, `packages/*/docs/evidence/`,
  `matrix/CHAIN_REPORT.md:203` (`FIXTURE_AUTHORING.md`
  proposal — never existed, not a moved doc).
- Verification: resolve every `](…)` `.md` link in every
  edited file + grep the tree for each old path.

### S5. Missions discipline

- Active = the 10 mission files; COMPLETED = 10 op files +
  2 log dirs (F6 move). COMPLETED README rewritten complete
  (F7). Missions README rewritten with the exact split +
  the status vocabulary. Every mission file carries an
  in-file status line.

## Health tick + milspec intervention (captain, 2026-09-23)

Obj-1/Obj-3 COMPLETE + landed. Obj-2: 9 stepped
commits in; triage crew running (enumeration);
milspec crew INTERVENED (see below). Landing split.
INTERVENTION (genuine misalignment, §4-authorized):
milspec filed + began executing a scheme that
predates HQ's three amendments — it creates HIST_*
files HQ ordered deleted, keeps RELEASE.md HQ
ordered gone, omits LANGUAGE/, and exempts frozen
dirs from caps HQ ordered capped. Ordered: HALT,
read amendments, file reconciled scheme + executed/
undo accounting, await GO before re-executing.
Deadlock test: triage clean (long hermetic work);
milspec was moving, now parked by order. No HQ
park/stop. No commits. Pending HQ unchanged + this
fix in flight.

## Triage — per-package hermetic table (crew, 2026-09-23)

All 12 packages executed WITHOUT fail-fast (per-package runs;
fail-fast is hard-coded, `pipeline/src/testing/matrix/
runner/run.ts:170-200`, no flag). Counts:

| Package | Hermetic | Native (line reporter) | Match |
|---|---|---|---|
| @matrix/chain-t1 | unit 3/3; PW 4 passed / 3 failed (7) | same | EXACT |
| @matrix/chain-t2 | unit 3/3; PW 2 passed / 1 failed (3) | same | EXACT |
| @matrix/chain-t3 | unit 3/3; PW 3 passed / 4 failed (7) | same | EXACT |
| @matrix/chain-t6 | PW 2 passed / 3 failed (5) | same | EXACT |
| @matrix/chain-t7 | PW 2 passed / 3 failed (5) | same | EXACT |
| @matrix/chain-t8 | PW 1 passed / 3 failed (4) | same | EXACT |
| @matrix/chain-t9 | PW 1 passed / 5 failed (6) | same | EXACT |
| @matrix/chain-t10 | PW 1 passed / 2 failed (3) | same | EXACT |
| @matrix/chain-t11 | PW 1 passed / 2 failed (3) | same | EXACT |
| @matrix/chain-t12 | PW 1 passed / 2 failed (3) | same | EXACT |
| @matrix/chain-t13 | PW 1 passed / 3 failed (4) | same | EXACT |
| @matrix/mcp | 18 files, 73/73 GREEN | 8 reds = native-only artifact (see below) | N/A (green) |

11/11 chain counts hermetic==native; per-assertion names from
the native line reporter transfer with full confidence.
Only T1 emits sync warnings (same 2 verbatim, now at
`/consumer/` paths). Logs: `/tmp/triage/hermetic-{mcp,
t1,t2,t3,t6,t7,t8,t9,t10,t11,t12,t13}.log` (raw) +
`-clean.log` (ANSI-stripped); native
`/tmp/triage/native-{T1,...,T13,mcp}.log` + `clean-*.log`.

Hermetic verbatim (per-package summaries):
- t1: `Tests 3 passed (3)` + `Playwright 4 passed | 3 failed
  (7)` + the 2 `_private.brand` warnings + `matrix stdout:
  [matrix ref sync] wait-duration-ms=372`.
- t2: `Tests 3 passed (3)` + `Playwright 2 passed | 1
  failed (3)`. t3: `Tests 3 passed (3)` + `Playwright 3
  passed | 4 failed (7)`.
- t6/t7: `Playwright 2 passed | 3 failed (5)` each. t8:
  `1 passed | 3 failed (4)`. t9: `1 passed | 5 failed
  (6)`. t10/t11/t12: `1 passed | 2 failed (3)` each.
  t13: `1 passed | 3 failed (4)`.
- mcp: `Test Files 18 passed (18)` + `Tests 73 passed
  (73)` + `[pipeline] All 1 matrix package tests PASSED`.

## Triage — mechanism findings (crew, 2026-09-23)

Two mechanisms explain all 31 chain reds (both firsthand,
both uniform — zero exceptions):

**M1 — extends legs: tokens adopted, component rules missing
(23 reds).** Consumer sync adopts upstream FRAGMENTS only
(`getUpstreamFragments` takes `.fragment`,
`fragments/base/index.ts:88-95`); upstream portable CSS
(`baseSystem.css`, present in every fixture baseSystem) is
never merged — T1's sheet has ZERO `extend-library` hits,
only 4 own `chain-t1__*` classes. Built-fixture components
bind their OWN react bundle (fixture
`node_modules/@reference-ui/react` → fixture `.reference-ui/
react`, verified) and render `extend-library__*` classes
whose rules exist only in the fixture sheet, which the
consumer page never loads (fixture dist ships no CSS file;
consumer imports none). Token vars ARE present at consumer
`:root` (incl. transitive: T6 meta+fixture, T7
meta+sibling+fixture, T11 meta+meta2+secondary+fixture —
all verified in-sheet), so every paint fails as
absent-style: `rgba(0,0,0,0)` (bg) / `rgb(0,0,0)` (text).
This is NOT a broken merge path — no consumer code path
reads upstream `.css` at all — and naive concatenation is
NOT obviously correct (portable CSS carries a full reset
block; prelude order T9-L65 and scoping T1-L42 need design).
Neo's own comment assumes "upstream global CSS already
ships in upstream stylesheets"
(`fragments/base/index.ts:168-169`) — true nowhere at the
packed boundary. Gap name for pointers: **follow-up
PACKED-CSS** (packed-boundary portable-CSS adoption:
unimplemented surface, needs HQ design ruling —
merge-at-sync vs ship-and-import CSS vs scan-dist).

**M2 — layers legs: `layers:` silently ignored (7 reds).**
`validateConfig` passes `layers` through unvalidated
(Phase-0 row 1 verified); no sync path reads it. T2's sheet
has NO vars at all; T3/T9/T10/T12/T13 sheets carry extends
vars only, zero `--colors-layer-*`. Every layer paint gets
`rgba(0,0,0,0)`. Cited gap: **D17** (`layers` config
deferred past this voyage, `packages/reference-neo/
PLAN.md:213`).

**MCP native-artifact (0 hermetic rows).** Native mcp showed
8 HeroBanner-dependent reds; hermetic mcp is 73/73 GREEN.
Root cause of the native reds (firsthand): my triage `neo
sync` wiped `.reference-ui/`, so global-setup rebuilt
`mcp/model.json` fresh via mcp-child — and Atlas discovery
crashed on a NATIVE-ONLY pnpm self-link loop
(`.../extend-library/node_modules/@reference-ui/neo/
node_modules/@reference-ui/neo points to an ancestor`),
diagnostic `unresolved-include-package` verbatim in the
model, yielding 9 primitives + 0 project components.
Packed installs have no such loop. FINDING (robustness,
out of triage scope): Atlas glob-walk fails the whole
project discovery on a symlink loop instead of skipping
the looped subtree.

**Observation (out of scope, no row):** T1's sheet emits
`.chain-t1__c__private\.brand { color: _private.brand; }`
— a raw invalid declaration for the unknown token (browser
drops it, so both _private tests still PASS). Possible
NEO-BUG follow-up (invalid CSS emission), but it fails no
kept assertion.

## TRIAGE-DONE (crew, 2026-09-23)

Full per-assertion table: 31 chain reds, 0 mcp rows
(hermetic green). Disposition key: PARK = park-with-pointer
(HQ rules; touches the reversal premise). Zero fix-now
rows: no red is a small engine bug (M1 has no broken path
to repair, only an unimplemented surface; M2 is the filed
D17 deferral; H4 policy is unsettled by definition).
Zero ruled-update rows: no red pins a behavior Neo
specifies differently — T9-L65's prelude order and T8-L32's
layer block have no specified Neo packed behavior to pin
(they fail on absence, not difference), so they park
behind the merge question, not ahead of it.

| # | Tier test (spec:line) | Evidence (expected → received) | Class | Pointer | Disposition |
|---|---|---|---|---|---|
| 1 | T1 L21 DemoComponent bg (fixtureDemoBg) | rgb(15,23,42) → rgba(0,0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 2 | T1 L28 eyebrow (fixtureDemoAccent) | rgb(20,184,166) → rgb(0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 3 | T1 L35 copy (fixtureDemoText) | rgb(248,250,252) → rgb(0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 4 | T2 L18 layer paint (layerPrivateAccent) | rgb(99,102,241) → rgba(0,0,0,0) | SURFACE-GAP (M2) | D17 | PARK |
| 5 | T3 L23 extends bg | rgb(15,23,42) → rgba(0,0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 6 | T3 L30 extends eyebrow | rgb(20,184,166) → rgb(0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 7 | T3 L37 extends copy | rgb(248,250,252) → rgb(0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 8 | T3 L50 layer paint | rgb(99,102,241) → rgba(0,0,0,0) | SURFACE-GAP (M2) | D17 | PARK |
| 9 | T6 L20 meta bg | rgb(49,46,129) → rgba(0,0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 10 | T6 L27 meta copy | rgb(224,231,255) → rgb(0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 11 | T6 L34 transitive eyebrow | rgb(20,184,166) → rgb(0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 12 | T7 L21 left branch | rgb(49,46,129) → rgba(0,0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 13 | T7 L28 right branch | rgb(124,45,18) → rgba(0,0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 14 | T7 L35 shared base ×2 expects | rgb(20,184,166) → rgb(0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 15 | T8 L15 bg when duplicated (visible ✓, bg ✗) | rgb(15,23,42) → rgba(0,0,0,0) | SURFACE-GAP (M1; tier kept for H4) | follow-up PACKED-CSS | PARK |
| 16 | T8 L23 extends-side accent | rgb(20,184,166) → rgb(0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 17 | T8 L32 layer block ≥1 in sheet | ≥1 → 0 | SURFACE-GAP (H4 policy proof) | H4 | PARK |
| 18 | T9 L17 extends-1 bg | rgb(15,23,42) → rgba(0,0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 19 | T9 L24 extends-2 bg | rgb(6,78,59) → rgba(0,0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 20 | T9 L31 layer-1 paint | rgb(99,102,241) → rgba(0,0,0,0) | SURFACE-GAP (M2) | D17 | PARK |
| 21 | T9 L38 layer-2 paint | rgb(159,18,57) → rgba(0,0,0,0) | SURFACE-GAP (M2) | D17 | PARK |
| 22 | T9 L65 @layer prelude order | prelude "" (no statement rules) | SURFACE-GAP (M1; ordering half needs design ruling if merge lands) | follow-up PACKED-CSS | PARK |
| 23 | T10 L16 extends bg+eyebrow (visible ✓, bg ✗, eyebrow unreached) | rgb(49,46,129) → rgba(0,0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 24 | T10 L30 layer paint | rgb(99,102,241) → rgba(0,0,0,0) | SURFACE-GAP (M2) | D17 | PARK |
| 25 | T11 L17 chain-1 bg+eyebrow (bg ✗ first) | rgb(49,46,129) → rgba(0,0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 26 | T11 L31 chain-2 bg+eyebrow (bg ✗ first) | rgb(54,83,20) → rgba(0,0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 27 | T12 L16 extends-sibling bg+eyebrow (bg ✗ first) | rgb(124,45,18) → rgba(0,0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 28 | T12 L30 layers-meta bg (visible ✓, bg ✗) | rgb(49,46,129) → rgba(0,0,0,0) | SURFACE-GAP (M2) | D17 | PARK |
| 29 | T13 L18 chain-1 bg+eyebrow (bg ✗ first) | rgb(49,46,129) → rgba(0,0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 30 | T13 L31 chain-2 bg+eyebrow (bg ✗ first) | rgb(54,83,20) → rgba(0,0,0,0) | SURFACE-GAP (M1) | follow-up PACKED-CSS | PARK |
| 31 | T13 L42 layer paint | rgb(99,102,241) → rgba(0,0,0,0) | SURFACE-GAP (M2) | D17 | PARK |

Pointer totals: follow-up PACKED-CSS ×23, D17 ×7, H4 ×1.
Passing assertions (not rows, recorded for completeness):
all visibility/root tests (19), T1-L42 + T1-L60 _private
legs, all 9 unit tests (T1/T2/T3 ×3), all 73 mcp tests.
Scope held: verify + report only; no installs, no commits,
index untouched (`git diff --cached` clean at crew start —
re-verify at read time), no other session's files touched.
TRIAGE-DONE.

## Triage acceptance (captain, 2026-09-23)

TRIAGE ACCEPTED. Two mechanisms, zero exceptions,
all firsthand: M1 (23 reds) — extends adopts
upstream fragments only, portable CSS never merged
(no code path reads upstream .css; naive concat NOT
obviously correct — reset block, prelude order,
scoping all need design); M2 (7 reds) — layers
silently ignored (filed D17); H4 ×1. Zero fix-now,
zero ruled-update rows; mcp 73/73 green. Bonus
findings carried: Atlas symlink-loop robustness bug
(native-only, whole-discovery fail), _private raw
invalid-CSS emission (fails nothing). CAPTAIN'S
RECOMMENDATION to HQ: PARK all 31 (skip/xfail with
PACKED-CSS/D17/H4 pointers) — tiers stay as the
install-dimension gate + 19 visibility + _private
+ unit + 73 mcp greens; reds land via follow-ups.
Alternatives: close PACKED-CSS now (engine project
with a design fork — huge, not landing work) or
slim tiers (re-litigates the reversal). HQ RULES.

## HQ directives — missions ops + chain (captain, 2026-09-23)

HQ rapid directives (two turns, logged together):
(1) ALL LOGs + loose docs leave root (README stays
by convention). (2) JETTISON, REAPER, ERROR-CORRECT,
DOOM-AGENT-as-mission all COMPLETED. (3) OPERATION_
prefix redundant — strip. (4) LANDING is its own
mission. (5) No separate INITIATIVES folder —
initiatives (VOYAGE, LANDING as HQ strategic
commands) file alongside missions, tidied in place.
(6) star-captain → CAPTAIN (captain runs missions,
HQ runs initiatives). (7) OUR CHAIN IS BROKEN —
M1/M2 reds are fix-track, NOT parked: PACKED-CSS
design crew dispatched (merge design first, no
implementation); the PARK recommendation is HELD
for HQ's ruling on the design. No parking behind
HQ's back.

## Docs-milspec DONE (crew, 2026-09-23)

State: WORKING → SCHEME → DONE. Scheme above executed exactly;
no scope drift. Prose only: no install, no commit, no index touch.

### Rename map (all verified on disk post-move)

Top level: `Architecture.md`→`HIST_ARCHITECTURE.md`,
`CORE.md`→`HIST_CORE.md`, `STRUCTURE.md`→`HIST_STRUCTURE.md`,
`LAYERS.md`→`HIST_LAYERS.md`, `ATOMIC.md`→`RS_ATOMIC.md`,
`BOOK.md`→`LIB_BOOK.md`; `REFERENCE_UI.md`, `RELEASE.md`,
`README.md` stay (repo scope). FEATURES: `TYPES.md`→`RS_TYPES.md`,
`STRICT_TOKENS.md`→`RS_STRICT_TOKENS.md`, `PRIVATE TOKENS.md`→
`NEO_PRIVATE_TOKENS.md`, `CSS_COMPOSITION.md`→
`NEO_CSS_COMPOSITION.md`, `RESPONSIVE.md`→`NEO_RESPONSIVE.md`,
`RESPONSIVE_API.md`→`NEO_RESPONSIVE_API.md`,
`CONTAINER_QUERIES.md`→`NEO_CONTAINER_QUERIES.md`,
`BREAKPOINTS_PRESETS.md`→`NEO_BREAKPOINTS_PRESETS.md`,
`VARIANTS.md`→`LIB_VARIANTS.md`, `PORTAL_COLOR_MODE.md`→
`LIB_PORTAL_COLOR_MODE.md`, `DATA_THEME.md`→`NEO_DATA_THEME.md`.
`bugs/`→`BUGS/` + 6 files mechanical (`MCP_*`, `ATLAS_*`,
`RECIPE_*`). `missions/`→`MISSIONS/` + 11 files mechanical;
`completed/`→`COMPLETED/` + 9 files mechanical;
`flamegraph-logs/`→`COMPLETED/FLAMEGRAPH_LOGS/` (OBJ1–5),
`flamegraph-correct-logs/`→`COMPLETED/FLAMEGRAPH_CORRECT_LOGS/`
(COBJ1–6). Case-only moves went through explicit temp names;
each verified by listing (zero lowercase basenames remain
outside frozen dirs; `.md` extensions stay lowercase by scheme).

### Elegance + status changes

- Titles: `# CORE.md`→`# Reference Core — Vision`,
  `# DATA_THEME.md — …`→`# Color-Mode Attribute Scrub`.
- `HIST_CORE.md` gained the cutover banner (F1 — both prior
  crews misclaimed it present; grep-verified absent).
- Status/Scope blocks: top level (8 files), FEATURES (11),
  BUGS (6: Open + scope), MISSIONS (`Status:`→`**Status**:`
  normalized, content untouched except F5 jettison
  `ready`→`active` with GO + index as witnesses).
- Added status lines: TOOLTIP_FOCUS_PRESET (`idea`, LANDING
  Obj A), OPERATION_FORGE_MAP (`done`), RECON v1 (`done`,
  superseded per v2) + v2 (`done`, C-Obj 6).
- Bodies untouched except link targets (one sed collateral
  caught + reverted: `vendor/panda/design-notes/
  first-that-works.md` is lowercase on disk).

### Missions discipline

Active = 10 files; COMPLETED = 10 op files + 2 log dirs (F6
move; zero live pointers at the old log paths — verified).
COMPLETED README rewritten complete (F7: was 4/10 rows, now
10 files + both log dirs indexed). Missions README rewritten
with the exact split + status vocabulary. Every mission file
carries an in-file status line (verified by grep).

### Reference sweep (zero dangling in the sweep)

- In-docs: mechanical per-map sweep + read-back; 5 READMEs
  rewritten with new paths.
- Live prose updated (minimal diffs, 18+/18- across 12
  files + SPEC 1 line): root README, LANDING ×2,
  view-story SKILL, doom-agent SKILL (incl. F3 repairs:
  forge path gained `COMPLETED/`, protocol cite folded to
  `DOOM_AGENT.md`), Portal NEXT, Overlay.md, ATM-DIAG-09/13,
  atomic SPEC, diagnostics README, styletrace README,
  neo PLAN, CHAIN_REPORT:157.
- Incidental pre-existing dangles repaired: F2 (overmatch
  →`../FIRST_THAT_WORKS.md`), F4 (LIB_BOOK skill/AGENTS
  depth — first fix overshot to `../../`, resolver caught
  it, corrected to `../`), HIST_STRUCTURE:389
  (`../../Architecture.md`→`./HIST_ARCHITECTURE.md`).
- Left intentionally (not pointers at moved docs):
  HIST_STRUCTURE:384-388 (retired `src/…` paths),
  REFERENCE_UI 21 dead retired-tree links (bannered record),
  SPEC 3 PLAN links (pre-existing, untouched lines);
  frozen agers enumerated in S4 (LOGs, archive ×5,
  evidence ×3, perf memo-shot3, doom logs, packages
  evidence, CHAIN_REPORT:203 proposal).

### Verification

- Link resolver over the full edited set (74 files):
  238 `.md` targets checked, 29 failures — all 29 in the
  three left-intentional buckets above, zero in the sweep.
- Old-path grep over live prose: clean except 6
  non-path hits triaged by hand (crew/prose names,
  `[mission]` short cites, retired-name records, one
  vendor path) — none a pointer at a moved doc.
- Scope: this crew touched docs/ (in-scope only) + LOG-2.md
  + the 13 sweep files. Sibling dirt (neo README/reports/
  package.json/tools, pipeline targets.ts) untouched;
  none of my targets overlapped it.

### Captain flag (commit-time)

`core.ignorecase=true` makes 4 case-only renames invisible
to git (show as `M` under old-case paths; content lands,
case does not). At commit, force the case explicitly:
`git mv docs/bugs/README.md docs/BUGS/README.md`,
`git mv docs/missions/README.md docs/MISSIONS/README.md`,
`git mv docs/missions/completed/README.md
docs/MISSIONS/COMPLETED/README.md`,
`git mv docs/missions/completed/styletrace.md
docs/MISSIONS/COMPLETED/STYLETRACE.md`.
All other renames are D+?? pairs git rename-detects.

## Packedcss-design (crew, 2026-09-23) — DONE

Scope (strict): DESIGN ONLY (Objective 2, HQ-directed — OUR
CHAIN IS BROKEN, M1/M2 fix-track). No implementation, no
fixes. Governing skill `agent-neo` loaded first. Read IN
FULL: LOG-2.md ## Triage mechanism findings + ## TRIAGE-DONE
(M1/M2, 31-row table), `fragments/base/index.ts:88-95`
(getUpstreamFragments) + `:168-169` (false "already ships"
comment). Read-only except this section; probes are
artifact inspection + grep only (no syncs run, no /tmp
builds needed — the bytes below are all on-disk firsthand).
M2/D17 is NOT mine (boundary cited in §5).

### (1) DIAGNOSIS CONFIRMED — M1 reproduced firsthand on T1

Static leg (no code path): `getUpstreamFragments`
(`packages/reference-neo/src/fragments/base/index.ts:88-95`)
maps extends entries to `.fragment` only. Whole-`src`
non-test grep for any read of `system.css` /
`baseSystem.css` / css-off-extends returns exactly ONE hit:
the WRITE side (`sync/publish/system.ts:16`,
`css: input.portableStylesheet`). Zero readers — triage's
"no consumer code path reads upstream .css" holds.

Artifact leg (consumer sheet, T1 on disk):
- `matrix/tests/chain/T1/.reference-ui/styled/styles.css`
  (1662 B): ZERO `extend-library` hits; 4 own
  `chain-t1__*` classes; upstream token vars PRESENT at
  `:root` (`--colors-fixture-demo-bg/text/accent`,
  `--colors-light-dark-demo-*`) — adopted via fragments,
  exactly the triage split.
- Upstream payload exists and never loads:
  `matrix/fixtures/extend-library/.reference-ui/system/
  baseSystem.mjs` carries `css` (2998 B, 22
  `extend-library__*` component rules) — and the fixture
  ships NO css file (`files` = dist + baseSystem pair +
  README; no `.css` outside `.reference-ui/`), while the
  consumer page loads ONE sheet (generated `main.tsx`:
  `import '@reference-ui/react/styles.css'`). The rules
  the DemoComponent binds (triage-verified: fixture's own
  react bundle, `extend-library__*` classes) exist
  nowhere in the consumer document. Paints fail as
  absent-style — mechanism reproduced, not quoted.

Portable-css anatomy (firsthand, shapes the whole fork):
- Every `baseSystem.css` = `@layer <self> {` + inner
  prelude (`@layer reset, global, base, tokens, recipes,
  utilities;`) + `@layer reset {` full unscoped reset `}`
  + `@layer tokens {` vars under `[data-layer="<self>"]`
  `}` + `@layer utilities {` own classes `} }`.
- `stylesheet` vs `portableStylesheet` (T1 diff, firsthand)
  differ ONLY in token scoping: sheet hoists vars to
  `:root`, portable scopes under `[data-layer="<self>"]`.
- Transitivity: NONE today. Meta fixture css (2127 B) is
  own-layer only — zero inner `extend-library__` rules
  (rechecked; an early count of 8 was a substring false
  positive on `meta-extend-library__`). No merge path
  anywhere, at any depth.
- The contract ALREADY promises the fix: `BaseSystem.css`
  doc (`config/types.ts:13`) reads "including any bundled
  upstream stylesheets" — merge-at-sync is the intended
  design; the write side was never implemented. The
  `:168-169` comment ("upstream global CSS already ships
  in upstream stylesheets") is false nowhere more
  completely than the packed boundary: nothing ships it.

### (2) DESIGN FORK + RECOMMENDATION

Key structural insight (dissolves half the fork): each
upstream css is a SELF-CONTAINED `@layer <name> {...}`
block. Concatenation of layer-wrapped blocks is cascade-
correct by CSS first-declared-wins — the triage's "naive
concatenation is NOT obviously correct" reduces to exactly
three ruled questions: reset duplication, the T9 prelude
statement, and scoping. Each is ruled below.

**(a) merge-at-sync (RECOMMENDED).** Consumer sync reads
each extends entry's `baseSystem.css` (already packed,
already shipped — zero publish churn) and assembles:
`@layer <extends in declared order, deduped by name>,
<self>;` + upstream blocks verbatim-but-reset-stripped +
own block. TWO assemblies from one function: the served
sheet takes upstream portable blocks + own `stylesheet`
(`:root` hoist); the published `baseSystem.css` takes
upstream portable blocks + own portable block (self-
scoped vars) — transitivity by induction (depth-N free
once fixtures rebuild in pipeline order, which already
holds).
- Reset duplication: RULED — strip `@layer reset {...}`
  (balanced-brace, tolerant no-op when absent) from
  upstream blocks; the ONLY reset emitted is the
  consumer's own, iff consumer `normalizeCss !== false`.
  Rationale: reset selectors are global and unscoped;
  the app root owns the decision. Corollary (HQ-visible):
  a `normalizeCss: false` consumer opts its whole
  subtree out of resets, upstream included.
- Prelude order (T9-L65): RULED — the merge emits the
  top-level `@layer` STATEMENT the oracle reads
  (CSSLayerStatementRule `nameList`), listing exactly
  the merged set: extends in declared order, self last.
  Nested statements inside transitive blocks compose by
  first-declared-wins (each merge emits statement-first,
  blocks in statement order — a stated invariant).
  Layers-half honesty: `layer-library*` names join the
  statement ONLY when D17 lands layers legs (M2, not
  this crew) — until then T9's `toContain('layer-
  library')` asserts stay red behind D17, not PACKED-CSS.
- Scoping (T1-L42): RULED — upstream blocks merge
  VERBATIM (scoped vars stay under
  `[data-layer="<upstream>"]`), so T1-L42 + L60 negative
  legs stay green by construction (`_private` vars exist
  only in upstream scope; consumer `:root` never hoists
  them — fragment strip already guarantees that).
  Positive paints resolve via the consumer `:root` hoist
  (already present today). Override semantics fall out
  right: upstream-first order means consumer values win
  `:root`-vs-scope specificity ties (both 0,1,0) —
  later-wins, matching fragment scalar merge.
- Diamonds (T7/T12): statement dedups by system name
  (first occurrence positions); blocks may duplicate
  (identical bytes = harmless, bounded by diamond
  width; version skew = last-wins, deterministic).
  Optional hash-dedup hardening later, not for landing.
- Version skew: merge treats upstream css opaquely
  (reset-strip + verbatim embed); older payloads without
  statements merge fine.
- Sub-fork considered and ruled: (a1) TS-side reset-
  strip (RECOMMENDED — Neo-only, ~40 lines, golden-
  pinned against the stable engine emission shape) vs
  (a2) engine-emits-reset-free-portable (cleaner
  contract, but crosses the cut: RS change + contract
  bump + portableSha golden churn, for zero live-
  consumer benefit — nobody reads `.css` today).
  Revisit (a2) only if HQ prefers contract cleanliness
  over blast radius.

**(b) ship-and-import.** Fixtures ship `./styles.css`
(new emit step + `files` + `exports` × 7 fixtures);
consumers import it (generated `main.tsx` template
injects one import per extends entry, or fixture
`dist/index.mjs` self-imports). REJECTED: dodges
nothing — the T9 prelude statement still needs a
sync-side emitter (no importer can mint the combined
statement), reset duplication gets WORSE (no strip
point; N copies; `normalizeCss: false` can't opt out
of upstream resets), transitive/diamond ordering leans
on bundler CSS order (fragile), and publish-contract
churn is maximal (7 packages + pipeline templates +
main.tsx regeneration) for a second CSS delivery path
beside the `baseSystem.css` string that already ships.

**(c) scan-dist.** Consumer sync scans upstream `dist/`
(or `.reference-ui/`) for css. REJECTED outright: the
obvious scan targets are unpacked (`.reference-ui/
styled/` is gitignored, absent in installs) or
nonexistent (`dist/` ships no css today — same emit
work as (b) with no contract behind it). Staleness by
construction (dist vs baseSystem built at different
times; dist guarantees nothing). All of (b)'s churn,
none of (b)'s determinism.

**(d) engine-side merge** (pass upstream css into
`compileNative`, Rust assembles). CONSIDERED, REJECTED:
assembly is string surgery (strip + concat + statement)
needing zero compiler knowledge; TS-side keeps it
unit-testable in Neo without RS coordination or a
contract rev.

Comparison matrix:

| Axis | (a) merge-at-sync ✓ | (b) ship+import | (c) scan-dist |
|---|---|---|---|
| Correctness | statement+order owned where declared order is known; reset ruled; scoping verbatim | prelude still needs (a)'s emitter; bundler-order dependence | no contract; staleness structural |
| Watch-mode | NO novel gap (upstream rebuild staleness pre-exists identically for fragments — `bundle.ts:30` filters node_modules from dependencyPaths, `packages:'external'` — shared follow-up, out of scope) | murkier (node_modules HMR exclusions) | stale reads of half-built dist |
| Publish-contract churn | ZERO (reads already-shipped `baseSystem.css`; semantics finally match its own doc) | HIGH (7 fixtures + templates + main.tsx) | HIGH (emit step) + contractless |
| Tier-proof preservation | T1-L42/L60 green by construction; 22/23 M1 rows flip; T9-prelude honestly half-waits D17 | same flips + template risk | same flips + staleness risk |
| Blast radius | Neo `sync/` only | fixtures + pipeline + templates | fixtures + sync + ordering |

RECOMMENDATION: (a1) — merge-at-sync with TS-side
reset-strip. It is the only fork with zero publish
churn, it fulfills the contract's own documented
semantics, and every hard question in the brief gets a
ruling above, not a punt.

### (3) BLAST RADIUS

TOUCH (all `packages/reference-neo`, sync-side only):
- NEW `src/sync/` merge module (statement emit +
  reset-strip + assembly; the one function both
  assemblies share).
- `src/sync/index.ts` (two call sites: served sheet =
  statement + upstream blocks + own `stylesheet`;
  published portable = statement + upstream blocks +
  own portable block).
- `src/fragments/base/index.ts:168-169` (repair the
  false "already ships" comment to cite the merge).
- `src/config/types.ts:13` (sharpen `css` doc: merged
  extends-order + self, reset owned by publisher).
- Fixture + tier build ARTIFACTS only (rebuild with
  merging sync; zero fixture/tier source changes).
- Triage row 22 (T9 prelude) re-points PACKED-CSS →
  D17 after landing (statement carries extends+self;
  layer names await M2).

STAYS GREEN BY CONSTRUCTION (no-op proofs required):
- Every existing Neo case: merge no-ops on empty/
  missing upstream css (SYNC-10/CHAIN-*/LAYER-02
  stand-ins carry fragment-only payloads) — byte-
  identical sheets pre/post, proved by diff, not by
  re-run alone.
- Engine goldens (`portableSha` etc.): `compile()` is
  untouched — merge lives above the cut in TS sync.
- `mcp` 73/73: no css path.
- `sync.test.ts` pins: worlds without extends merge
  nothing.
- T1-L42/L60 `_private` negatives: verbatim scoped
  blocks + fragment strip unchanged.
- NO tier oracle changes: 31 rows keep their
  assertions; 22 flip red→green, 9 stay parked with
  the same expected→received signatures.

EXPLICITLY OUT: watch dependency tracking for
upstream rebuilds (shared fragments+css follow-up,
not PACKED-CSS); M2/D17 layers legs + T8-L32/H4
(§5 boundary).

### (4) CREW PLAN (disjoint scopes + proofs + gates)

- **Crew A — merge core** (NEW module only + its unit
  file; touches nothing else): statement order incl.
  diamond dedup-by-name; reset-strip byte-exact
  goldens (normal case, `normalizeCss: false`
  consumer, tolerant no-op on resetless/legacy
  payloads); verbatim-scoping pin (`[data-layer]`
  blocks intact, no `_private` hoist); transitive
  induction pin (synthetic two-level css composes
  statement-first). Proofs: new vitest file green +
  `agentneo q` clean. One-coverage-home: this file is
  the ONLY home for merge assertions.
- **Crew B — sync wiring** (`index.ts` call sites +
  the two comment/doc repairs; consumes A's API,
  stubs it if A is still flying): sheet assembly +
  portable assembly + empty-css no-op proof —
  byte-diff of served sheets AND published css for
  every existing extends world (SYNC-10, CHAIN-*,
  LAYER-02, TOKEN-09) pre/post change: zero bytes
  differ. Proofs: `sync` unit suites + those cases
  green + the diff transcript in LOG-2.
- **Crew C — chain proof** (no source; rebuild +
  run): rebuild all 7 fixtures with merging sync,
  re-sync + run T1/T3/T6/T7/T8/T9/T10/T11/T12/T13
  natively (line reporter): expect EXACTLY the 22
  M1 paint rows flip to green, T1-L42/L60 stay green,
  rows 4/8/17/20/21/22/24/28/31 stay red with
  unchanged signatures (7×D17 + H4 + re-pointed
  prelude). Proofs: per-tier native tables in LOG-2.
- **Gates**: C blocked on A+B landed; landing re-
  verify = captain's hermetic per-package runs
  (fail-fast is hard-coded — per-package, no
  shortcuts) + full `agentneo` sweep for regressions.
  Land criterion: 22 flips + 9 honest reds + zero
  Neo regressions + q clean.

### (5) BOUNDARY — M2/D17 is NOT PACKED-CSS

Untouched by this design and its crews: `layers:`
adoption (silently ignored today, `validateConfig`
passthrough — the 7 M2 reds, triage rows
4/8/20/21/24/28/31); the layers half of the T9
prelude statement (`layer-library*` names — row 22
re-points here); T8-L32 layer-block policy proof
(H4). Cited home: **D17** (`layers` config surface
deferred, `packages/reference-neo/PLAN.md:213`).
PACKED-CSS must not mint a layers semantic, must not
emit layer names it didn't merge, and must not touch
a layers oracle — the statement lists exactly the
merged set, and D17 extends it.

PACKEDCSS-DESIGN DONE: recommendation (a1)
merge-at-sync, rulings filed, blast radius closed,
three disjoint crews + gates. No code written, no
fixes made, index untouched.

## Milspec round 1 — partial (captain, 2026-09-23)

MILSPEC-1 executed the STALE scheme (queued HQ
amendments never landed before DONE): CREATED the
HIST files HQ ordered gone, kept RELEASE.md, no
LANGUAGE/, frozen dirs exempted from caps. ACCEPTED
PARTIALLY: the mechanical caps work stands (verified
renames, case-move discipline, missions structure,
elegance, link hygiene). Scheme deltas REJECTED.
MILSPEC-2 dispatched fix-forward: delete HIST_* +
RELEASE, ARCHITECTURE.MD as the ONE (salvage-true
or stub+file-unwritten), ARCHIVE/EVIDENCE/PERF caps
+ evidence triage, LANGUAGE/ rebuilt-verified,
root = README.MD + ARCHITECTURE.MD only with
placement map for strays. Same verified-firsthand
bar, no execution before its scheme reconciles every
HQ ruling line by line.

## Packedcss-design acceptance (captain, 2026-09-23)

DESIGN ACCEPTED. The structural insight dissolves
the fork (self-contained @layer blocks compose by
first-declared-wins); merge-at-sync (a1) with
TS-side reset-strip is the only zero-churn fork and
fulfills the contract's own documented semantics.
Every ruling sound: reset owned by consumer root,
prelude statement emitted, scoping verbatim (T1
negatives green by construction), diamonds deduped,
(b)/(c)/(d) rejected with mechanism. Blast radius
Neo-sync-only; land criterion exact (22 flips + 9
honest reds + zero regressions). Dispatched A
(merge core) + B (sync wiring) in parallel; C
(chain proof) after A+B. The 9 parked reds
(7×D17+H4+prelude) ride HQ's final land ruling.

## Ops-structure — PHASE 1 ASSESS (crew, 2026-09-23) — FILED, AWAITING GO

Scope: structure/prose only, no code. HQ directives (LOG-2
"HQ directives — missions ops + chain") + Docs-milspec
SCHEME read IN FULL first. No installs, no commits, index
untouched (read-only except this section). Phase 2 HELD for
captain GO — nothing below is executed.

### (a) Sequence assessment (all missions, verified vs tree)

Sequenced = slice/GO-protocol missions. Non-sequenced =
ideas, companions, reports, notes. Counts are firsthand:
active dir holds 11 mission files + README (milspec DONE
says "10" — undercount by 1, see list); COMPLETED holds 9
mission files (8 OPERATION_ + STYLETRACE) + README + 2 log
dirs (milspec "10 op files" holds only if README is the
10th — its table has 9 rows).

SEQUENCED — COMPLETED (all verified done, in COMPLETED/):
- OVERMATCH (done 2026-09-19, catalog 81/81), STYLETRACE
  (done, 6 slices, `OPERATION: DONE`), FORGE (done, slices
  0–5, `OPERATION: DONE`), FORGE_MAP (done), FLAMEGRAPH
  (done 5/5), FLAMEGRAPH_RECON (done, superseded, preserved),
  FLAMEGRAPH_CORRECT (done 6/6), FLAMEGRAPH_RECON_V2 (done),
  FASTHULL (done 2026-09-23). All carry in-file `done`
  status lines; COMPLETED README indexes all 9 + both log
  dirs. No action.

SEQUENCED — closing this phase (see (b) for verdicts):
- JETTISON (`OPERATION: GO`, status `active`, impl landed,
  acceptance unsigned) → COMPLETED per HQ.
- REAPER (line 1 `GO` but status line `ready` — record
  inconsistency, outcome decided) → COMPLETED per HQ.
- ERROR_CORRECT (`OPERATION: READY`, plan + executed Slice 0,
  acceptance unmet) → COMPLETED per HQ, with caveat.

NOT SEQUENCED — staying active:
- TEST_INDEX (idea), FIRST_THAT_WORKS (idea),
  TOOLTIP_FOCUS_PRESET (idea BUT live: LANDING Obj A work
  doc, cited LANDING.md:19 — stays until LANDING lands),
  QUARANTINE_RECON (report, cited LOG-5 + LANDING.md:66 —
  stays), MCP_BOOK_SEEING (crew note, cited by view-story
  SKILL.md:37 — stays), ERROR_CORRECT_RUNTIME (idea
  companion — moves WITH its parent to COMPLETED),
  ERROR_CORRECT_LEDGER (Slice-0 companion — moves WITH its
  parent to COMPLETED).
- DOOM_AGENT (idea → COMPLETED per HQ, see (b)).

### (b) Closeouts — verification (honest; nothing faked)

1. JETTISON → COMPLETED (HQ ruling STANDS; one unsigned
   gate flagged). Implementation evidenced in tree:
   `modules/atomic/js/namer/` (lexical/lower/shorthand/
   value/when/shape/slot/index + test pinning
   NAMER_RULES_VERSION), ATM-NAME-08 station, NEO `namer/`
   group (NAMER-01/02/03), 5 jettison-namer doom briefs in
   `.agents/doom/logs/` (2026-09-20 — the seed briefs RAN).
   NOT evidenced: formal R1–R15 sign-off (no DONE line in
   file; acceptance section lists the bar, no signature).
   Verdict: genuinely implemented; closeout honest, carry
   the unsigned sign-off as a one-line note in the
   COMPLETED index row, do not backdate a DONE line.
2. REAPER → COMPLETED (GENUINELY TERMINAL). D1: DECLINE
   filed 2026-09-20 (`packages/reference-neo/docs/evidence/
   reaper-d1-ruling.md`, 180-class floor, both rule-arms
   adjudicated); Slice-1 deliverable `reaper-01-real-
   compile.md` exists + 7 ready-ask evidence files; Slice 2
   correctly undispatched (gated on SIGN). Census stands as
   the sheet record. Residual: the mission file's own
   status line still says `ready` (stale — the outcome
   lives in README + evidence). Verdict: done by decision;
   closeout carries the outcome (one status-line update on
   the move, citing the ruling — proposed in scheme).
3. ERROR_CORRECT → COMPLETED (BY HQ RULING; implementation
   NOT verifiably done — flagged, not faked). File is still
   `OPERATION: READY` (never GO, no DONE line). Executed:
   Slice 0 ledger (ERROR_CORRECT_LEDGER.md, re-derived
   firsthand 2026-09-19/20) + ATM-DIAG-01..14 stations exist
   + `modules/atomic/src/diagnostics/` exists. NOT recorded:
   Slice 1+ execution, GO flip, or any of the 12 acceptance
   bullets (one-parse, independent analysis, no-"maybe").
   Verdict: closeout is a ruling, not a landing — file it
   that way (COMPLETED index row says "closed by HQ ruling;
   plan + Slice 0 executed, acceptance unmet"). Companions
   (LEDGER, RUNTIME) move with it.
4. DOOM_AGENT-as-mission → COMPLETED (BY HQ RULING; the
   standing function persists OUTSIDE missions). Mission doc
   is `idea`, protocol ARMED, but the arming marker
   (`docs/evidence/doom-armed.md`) was NEVER written (zero
   doom files in docs/evidence/) — the gate never fired.
   What persists regardless: `.agents/skills/doom-agent/`
   (live skill), `.agents/doom/` (runner + 10+ brief logs
   incl. the 5 jettison-namer seeds). Verdict: mission doc
   retires to COMPLETED; skill/logs are infrastructure, not
   mission scope — untouched. COMPLETED row notes the
   unfired marker so nobody re-arms from the mission file.

### (c) SCHEME — tidied docs/MISSIONS/ layout (proposed, NOT executed)

C0. Name of the dir: STAYS `docs/MISSIONS/` (caps per
executed milspec S1; HQ's amendments target HIST_/RELEASE/
frozen caps, not MISSIONS). No `initiatives/` folder —
VOYAGE.md + LANDING.md file alongside missions per HQ (C3).

C1. OPERATION_ strip (12 files). Mechanics (phase 2):
`OPERATION_JETTISON.md`→`JETTISON.md`,
`OPERATION_REAPER.md`→`REAPER.md`,
`OPERATION_ERROR_CORRECT.md`→`ERROR_CORRECT.md`,
`OPERATION_ERROR_CORRECT_RUNTIME.md`→
`ERROR_CORRECT_RUNTIME.md`, and in COMPLETED/:
`OPERATION_FASTHULL.md`→`FASTHULL.md`,
`OPERATION_FLAMEGRAPH*.md` (5)→`FLAMEGRAPH*.md`,
`OPERATION_FORGE.md`→`FORGE.md`,
`OPERATION_FORGE_MAP.md`→`FORGE_MAP.md`,
`OPERATION_OVERMATCH.md`→`OVERMATCH.md`.
Reference sweep (same crew, same commit): every
`OPERATION_` link/cite in MISSIONS README, COMPLETED
README, all 12 mission bodies (cross-links incl.
FORGE→`../OPERATION_ERROR_CORRECT.md`,
RECON_V2→`COMPLETED/OPERATION_FLAMEGRAPH_RECON.md`,
log-dir `Mission:` lines, `OPERATION_FORGE.md:1206`-style
line cites), plus live outside citers: RS_ATOMIC.md:8/351/
352/353, LANDING.md (post-move path), doom-agent SKILL.md
:51/:53, QUARANTINE/JETTISON/REAPER prose filename mentions.
Frozen citers LEFT (LOGs incl. this log, archive ×4+,
evidence, doom logs, CHAIN_REPORT:203 proposal).
Line-1 `OPERATION: <STATE>` markers + signal-protocol
prose: PROPOSE rewrite marker to `STATUS: <STATE>`
(mechanical, preserves the state signal on FORGE,
STYLETRACE, JETTISON, REAPER, ERROR_CORRECT) and LEAVE
prose ("Operation X", explainer paragraphs) as historical
record. GO rules; default if silent: markers rewritten,
prose left.

C2. LANDING as its own mission file. LANDING.md (root) →
`docs/MISSIONS/LANDING.md` (initiative filed alongside
missions per HQ (5); its mission-file status: active
landing sequence, objectives A/B). Internal links retargeted
(root-relative `./docs/MISSIONS/…` → `./…`; `./LOG-4.md` →
`./LOGS/LOG-4.md` per C4). LANDING.md:66 QUARANTINE cite
verified post-move.

C3. Initiatives alongside. VOYAGE.md (root) →
`docs/MISSIONS/VOYAGE.md`. VOYAGE.md:33/35/41 star-captain
lines become CAPTAIN lines in the same edit (C6). Internal
links retargeted (`./LOG-*.md` → `./LOGS/LOG-*.md`,
`./docs/…` → `../…`, `./LANDING.md` → `./LANDING.md`).

C4. Root LOGs + loose docs (README.md stays; AGENTS.md
STAYS — agent-discovery root contract, same class as
README; HQ's "all" cannot include the file that tells
agents where things are. GO may overrule).
- `docs/MISSIONS/LOGS/` (new dir, with README index):
  LOG.md (master, LIVE — Obj-2 section still updating),
  LOG-2.md (LIVE — crews writing now), LOG-1.md (frozen
  COMPLETE), LOG-3.md (landed COMPLETE — CORRECTION to
  brief: obj3 commit 8c45a9a6b is in tree and the log ends
  at implementer acceptance; NOT mission-live, files as
  frozen), LOG-4.md + LOG-5.md (IN PROGRESS, adopted by
  LANDING — file in LOGS/ with the LANDING-owned note in
  the LOGS README; they stay writable for the landing).
  Every moved log keeps first-line status; LOG.md objective
  links + all inter-log links retargeted in the same edit.
- MATRIX-DECOMMISSIONING.md (Obj-2 landing report,
  untracked) → `docs/MISSIONS/COMPLETED/
  MATRIX_DECOMMISSIONING.md` (done record; caps form per
  S1 — executed by docsmil per boundary C7, or pre-agreed
  exact name executed by this crew; GO picks).
- CORES.md (RS multi-core plan, adopted D1) → `docs/`
  top level as RS-scoped doc (exact prefixed name +
  execution: docsmil, per C7 — proposed `RS_CORES.md`).
- SECURITY.md → `docs/SECURITY.md` (GitHub recognizes
  root, `.github/`, AND `docs/` placements — convention
  preserved off-root).
- Post-move root holds: README.md, AGENTS.md (+ configs,
  packages, matrix, pipeline — untouched).

C5. MISSIONS/ end state (after C1–C4): active = VOYAGE.md,
LANDING.md, TEST_INDEX.md, FIRST_THAT_WORKS.md,
TOOLTIP_FOCUS_PRESET.md, QUARANTINE_RECON.md,
MCP_BOOK_SEEING.md + README.md + COMPLETED/ + LOGS/;
COMPLETED/ = 13 mission files (9 existing stripped +
JETTISON, REAPER, ERROR_CORRECT, ERROR_CORRECT_RUNTIME,
ERROR_CORRECT_LEDGER, DOOM_AGENT — 6 inbound) + report +
README + 2 log dirs. READMEs rewritten with the exact
split + the four closeout notes from (b).

C6. star-captain → CAPTAIN (enumerated, all surfaces).
Rename: `.agents/skills/star-captain/` → `.agents/skills/
captain/` + `SKILL.md:2` `name: star-captain` → `name:
captain` + `:6` `# Star Captain` → `# Captain`. (Case:
skill ids/paths are lowercase by convention — dir + id go
lowercase `captain`; PROSE references go `CAPTAIN` per HQ.
GO may order literal `CAPTAIN/` dir instead.)
Prose/code references (6 live hits, all in phase-2 scope):
VOYAGE.md:33/35/41 (3), agent-perf SKILL.md:3 (description),
red-team SKILL.md:59, agent-perf voyage-swarm.mjs:31/74/90
(3 — :31 is FUNCTIONAL: `read_skill for star-captain`).
EXEMPT frozen: LOG-2:10208 (the HQ directive line itself),
docs/archive/ ×4 (PERF-SWARM, WARPDRIVE, INTO-ABYSS,
HYPERSPACE). NEGATIVE FINDING: AGENTS.md carries ZERO
star-captain references (brief presupposed some) — no
AGENTS.md edit needed for C6. Memory-scope notes
(personal_project orchestration.md etc.) mention
star-captain but are outside the repo — noted, untouched.

C7. Boundary split with docsmil (parked on docs/ renames —
NO shared-file execution). They own: mechanical caps
renames everywhere in docs/ (their S1 map, incl. any
outstanding caps), HIST_/RELEASE/LANGUAGE/frozen-caps
reconciliation per HQ's three amendments (which live
OFF-log — not found in LOG.md/LOG-1..5/VOYAGE/LANDING;
docsmil holds that context), CORES.md prefixed naming.
We own: missions/ CONTENT assessment (this filing) +
mission files (C1 strip, C2/C3/C5 moves, C4 LOGS/
relocation, C6 rename) + ALL mission-path link updates
anywhere live (incl. inside RS_ATOMIC.md, LANDING.md,
doom-agent + view-story SKILL.md — files docsmil touched
before, but our links, our edit). Sequencing: docsmil
finishes caps + files DONE + freezes; ops-structure
executes after (handoff marker in LOG-2). Overlap
declaration: MISSIONS/README.md, COMPLETED/README.md,
RS_ATOMIC.md, both skill bodies, docs/README.md are
hand-off files — exactly one crew writes each, in window
order, never both. MATRIX_DECOMMISSIONING.md caps form:
whoever moves it uses the exact agreed name (C4), no
second rename pass.

OPEN for GO: (i) C1 line-1/prose tier ruling; (ii) C4
AGENTS.md stay vs move; (iii) C4 MATRIX_DECOMMISSIONING
mover (us vs docsmil); (iv) C6 dir case (`captain/` vs
`CAPTAIN/`); (v) C5 LOGS/ dir name vs flat-in-MISSIONS.

## OPS-STRUCTURE PHASE 1 COMPLETE (crew, 2026-09-23)

Assessment + scheme filed above. Verdicts: JETTISON
implemented/sign-off-unsigned, REAPER terminal-by-decision,
ERROR_CORRECT ruling-closeout (acceptance unmet, flagged),
DOOM_AGENT mission-retired (skill/logs persist). LOG-3
correction: landed, not live. AGENTS.md: zero star-captain
hits. Amendments live off-log (docsmil holds). One stale
read-only background grep (session 3697, superseded by
bounded search — terminate infra-timed-out twice, harmless).
AWAITING CAPTAIN GO — phase 2 not started.

## Packed-B (crew, 2026-09-23) — WORKING

Scope (strict): `packages/reference-neo/src/sync/index.ts` call
sites + `fragments/base/index.ts:168-169` comment repair +
`config/types.ts:13` doc sharpen ONLY. Consume A's merge API
(stub if A flying — land on the real API). Never install,
never commit, never touch the index, never touch sibling A's
merge module. Governing skill `agent-neo` loaded first;
LOG-2.md ## Packedcss-design §2(a1) + §4 Crew B read IN FULL.

## Packed-A (crew, 2026-09-23) — WORKING

Scope (strict): NEW merge module + its unit file ONLY, under
`packages/reference-neo/src/sync/`. Never install, never commit,
never touch the index, never touch sibling B's files (`index.ts`
+ comment/doc repairs). Governing skill `agent-neo` loaded first;
LOG-2.md ## Packedcss-design §2(a1) + §4 Crew A read IN FULL.

Plan: `src/sync/packed-css.ts` — one assembly function both
call sites share (served sheet passes its `:root`-hoisted own
block, published portable passes its self-scoped own block;
upstream payloads are portable in both). Statement emits the
merged set (extends expanded in declared order, self last,
deduped by first occurrence); reset-strip is balanced-brace
over `@layer reset {…}` with tolerant no-op on resetless/legacy
payloads; upstream blocks merge verbatim otherwise; empty/
missing upstream css no-ops byte-identical. Unit file pins:
statement order, dedup, reset-strip goldens (normal +
normalizeCss:false consumer + resetless/legacy no-op),
verbatim-scoping, transitive induction. This unit file is the
ONLY home for merge assertions.

### Implementation (2 new files, named scope only)

`src/sync/packed-css.ts` (128 lines): `mergePackedStylesheets(
upstreams: readonly {name, css?}[], own: string, selfName: string
): string` — the ONE function both assemblies share (served
sheet passes its `:root`-hoisted own block, published portable
passes its self-scoped own block; upstream payloads are portable
in both) — plus `stripResetLayer(css): string`. Statement =
extends expanded in declared order (a leading `@layer a, b;` in
an upstream payload contributes its closure — transitive
induction; legacy payloads contribute their bare name), deduped
by first occurrence, self forced last. Reset-strip is
balanced-brace over every `@layer reset {…}` plus one trailing
newline; resetless/legacy payloads pass through byte-identical
and an unmatched opener keeps the remainder verbatim. Empty/
missing upstream css no-ops: own returns byte-identical, no
statement emitted (Crew B's diff contract). Own block always
verbatim, so `normalizeCss: false` (resetless own) opts the
whole subtree out. NOTE for B/C: transitive closure names ride
the top statement (`base, mid, app`), which is what keeps
cascade order right once fixtures republish merged payloads —
nested statements then add nothing new (first-declared-wins).

`src/sync/packed-css.test.ts` (364 lines, 16 tests — the ONLY
home for merge assertions): statement order (declared + self
last + block order); diamond dedup (transitive T7-shape:
`base, outer-a, outer-b, app` with base bytes twice + nested
statements surviving; direct repeat); transitive pin (two-level
golden, statement-first with closure); reset-strip goldens
(normal byte-exact incl. nested-@media balanced proof, prelude
untouched, transitive strip; normalizeCss:false golden with
zero `@layer reset {` blocks; resetless/legacy/unbalanced
no-ops byte-identical); verbatim-scoping pin (`[data-layer]`
block intact incl. `_private` line, own `:root` part free of
`_private`, count preserved); both-assemblies pin (portable own
passes through unchanged); no-op pins (empty array + missing/
empty/whitespace css → `toBe` own).

### Proof (scoped, all firsthand)

- `pnpm --dir packages/reference-neo exec vitest run
  src/sync/packed-css.test.ts` → 16/16 PASS (hand-computed
  goldens matched on first run; no expected was pasted from
  actual).
- `pnpm agentneo q` over both files → 0 errors, 0 warnings
  (one file-lines warn at 446 interim lines compressed to 364
  via shared-literal goldens — no split, one-coverage-home held).
- No-panda pass over both files: zero hits. DOMAIN.md: no
  collision, no new load-bearing name, no update.
- Footprint: the 2 new files + this log only; `index.ts` in
  the tree is sibling B's concurrent work, never opened; no
  installs, no commits, index untouched.

## Packed-A DONE (crew, 2026-09-23)

Merge core landed: statement + reset-strip + assembly in one
shared function, 16/16 green, q 0/0. API for Crew B:
`mergePackedStylesheets(upstreams, own, selfName)` /
`stripResetLayer(css)` from `src/sync/packed-css.ts`.

## PACKED-A checkpoint — merge core landed (22ed06156)
- Crew filed DONE; captain firsthand: vitest packed-css.test.ts 16/16 green, agentneo NEO-SYNC-10 PASS unchanged (merge core new + unwired, zero behavior delta).
- Commit: obj2 merge core only (packed-css.ts + test, 492 insertions). Checkpoint 1 of stepped Obj2 law.
- PACKED-B wiring crew still running; PACKED-C chain proof spawns on B DONE.

### Packed-B recon (read-only, firsthand)

- Seam: the ONLY `publishSyncFolder` caller is
  `sync/index.ts:200` — served sheet `styled/styles.css`
  flows from `result.stylesheet` (via `writeStyledDir`),
  published portable `system/baseSystem.mjs → css` from
  `result.portableStylesheet` (via `publish/system.ts:16`).
  Upstream css rides `config.extends: BaseSystem[]`
  (`name` + optional `css`) — structurally identical to
  A's `PackedUpstream`, no adapter needed. Self name =
  `spec.name` (the published identity).
- Extends-world census: NO stand-in carries `css:`
  (grep-zero across all world ui.configs; validate.ts:197
  requires fragment only). TOKEN-09 has no extends at all
  (own-`_private` owner case — trivial no-op, kept in the
  diff set per the brief). SYNC-17 added as a bonus
  extends world (stand-in, `_private` strip).
- CHAIN-06 is NOT an empty-css world: its nested upstream
  publishes real css (1175 B, reset + `[data-layer]`
  tokens — the design's anatomy exactly), extended
  mid-run. Its spec asserts `includes` only (no byte
  pins), so the merge must keep it green while CHANGING
  its transient bytes — the feature proof, reported
  separately below, not folded into the no-op claim.

### Packed-B implementation (3 named files, real API, no stub)

A's `src/sync/packed-css.ts` landed mid-recon
(`mergePackedStylesheets(upstreams, own, selfName)` +
`PackedUpstream`, empty-css → own byte-identical) — wired
directly to the real API, no stub was ever needed:
- `sync/index.ts`: +import, +`mergePublishedStylesheets`
  helper (both assemblies, one function; `?? []` defaults
  inside the helper so `sync()` gains zero branches),
  +1 call line feeding `merged.stylesheet` /
  `merged.portableStylesheet` into `publishSyncFolder`.
- `fragments/base/index.ts:168-169`: false "already
  ships" comment repaired to cite the sync-time
  packed-css merge (line-neutral).
- `config/types.ts:13`: `css` doc sharpened to merged
  extends-order + own block, publisher owns the reset.
- Gate-driven refactor (skill §7.6): first shape pushed
  `sync()` to 122 lines (fail above 120) — extracted the
  helper, re-proved everything on final bytes (below).
- A's files (`packed-css.ts` + `.test.ts`) never opened
  for edit; `git status` = exactly the 3 named files +
  this log; index untouched; nothing committed.

### Packed-B proofs (all firsthand, final bytes)

- `pnpm agentneo q` over the 3 files → 0 errors
  (3 warns, all pre-existing-band: file-lines,
  params-5, sync-117; the refactor restored sync
  cyclomatic to its pre-change value).
- `vitest run src/sync` → 5 files, 53 passed (52 mine
  + A's new merge test, untouched). `vitest run
  src/fragments/base src/config` → 13 files, 90 passed.
- All 10 extends cases PASS post-change, final shape:
  SYNC-10, SYNC-17, CHAIN-01/02/03/04/05/06, LAYER-02,
  TOKEN-09 (each also PASS pre-change; SYNC-10 run
  twice pre-change with identical hashes =
  determinism pin, so the diffs below are meaningful).
- No-panda: zero hits in the diff.

### Packed-B no-op transcript (served sheet + published css)

sha256-16 + bytes of `world/.reference-ui/styled/
styles.css` (sheet) and `world/.reference-ui/system/
baseSystem.mjs` (pub, carries the `css:` field), fresh
`agentneo run` per case pre AND post. `diff pre post`
EMPTY — every row below held both runs:

| World | sheet | pub |
|---|---|---|
| SYNC-10 | cc9631f80819d422 1309B | 7e1fd7bd3a519d12 6502B |
| SYNC-17 | e510498d13314ca9 1301B | b965afb355e79eab 6589B |
| CHAIN-01 | c80ba5fd66ea27df 1435B | 3bb2e75358e82f87 1901B |
| CHAIN-02 | bcb6fdb244ad5b61 1446B | 96bf0d95560cd403 2026B |
| CHAIN-03 | 70cedea14076caf3 1576B | 2f4e95c37c5c0e6b 2190B |
| CHAIN-04 | d2efe423253a437c 1682B | bc25db637ce97476 2363B |
| CHAIN-05 | 04169da96cefcb89 1425B | 4166f0dd929a1cec 1919B |
| CHAIN-06 (at rest) | 0485710bda7ca1ec 1130B | 2e58c68127aee7c7 1326B |
| CHAIN-06 upstream | 0a887c81da647902 1124B | e2ce1a97f9a453f1 6251B |
| LAYER-02 | 7087d9d8f8ca7f4b 1312B | a463133ae1eb2730 6455B |
| TOKEN-09 | 5f773b124611b950 1319B | 0b9684491b569e39 6457B |

Zero bytes differ: 11 world-dirs × 2 artifacts.

### Packed-B CHAIN-06 extended-transient proof (intended change)

Mid-run extended state (spec-mirroring snapshot script,
canonical restored + heal sync in `finally`, tree
byte-clean after): pre sheet 1286 B → post 1578 B; pre
pub-css 1331 B → post 1623 B. Post artifacts verified
BYTE-EXACT against A's function on (upstream css, pre
own block): statement `@layer neo-chain6-up,
neo-chain6;` first, upstream block reset-stripped
(1175 → 258 B, `[data-layer="neo-chain6-up"]` scoping
intact), own block tail byte-identical — both
assemblies. Gate refactor re-verified behavior-identical
(diff of the two post snapshots empty). Case stays PASS.

## PACKED-B DONE (crew, 2026-09-23)

Wiring landed on A's real API (`mergePackedStylesheets`,
no stub needed): served sheet = statement + upstream
portable blocks + own stylesheet; published portable =
statement + upstream portable blocks + own portable
block. Proofs: sync suites 53/53, fragments+config
90/90, 10/10 extends cases green, q 0 errors, at-rest
byte-diff zero across all worlds (transcript above),
CHAIN-06 transient merge byte-exact + green. Scope held
(3 named files + log); A's module untouched; no
installs, no commits, index untouched.

## PACKED-B checkpoint — sync wiring landed (8fcb16b51)
- Crew filed DONE on A's real API (no stub needed). Wiring: mergePublishedStylesheets feeds both assemblies through mergePackedStylesheets; config.extends needed no change; types.ts comment updated.
- Captain firsthand: vitest 323/323 green, NEO-SYNC-10 PASS, NEO-SYNC-17 PASS. Non-extends no-op by construction (empty upstreams return own byte-identical, unit-pinned).
- Commit: wiring only (sync/index.ts + config/types.ts). package.json dist/bin change in tree is NOT B's (earlier RED-3 fix) — left uncommitted.
- Next: PACKED-C chain proof (22 expected flips, 9 parked reds stay red per triage).

## Docs-milspec-2 (crew, 2026-09-23) — WORKING

Scope (strict): docs/ + live prose references. Prose only.
Never install, never commit, never touch the index, never
touch another session's files. Input: LOG-2.md ## Docs-
milspec SCHEME + DONE (round 1) + ## HQ directives
(missions ops + chain) + the MILSPEC-2 brief, read IN FULL.
Round 1's mechanical caps work stands; its scheme deltas
are rejected per the captain's partial acceptance. FROZEN:
LOG-*.md; archive/evidence contents' history (moves
allowed, edits only per the brief). Plain `mv` for renames
(no `git mv`); case-only renames go through an explicit
two-step temp name (`core.ignorecase=true`).

State: WORKING. Base: `8c45a9a6b` + working tree (round-1
renames present uncommitted; sibling dirt in
packages/reference-neo + pipeline/targets.ts untouched —
verified zero overlap with my sweep targets; FIX-3's
tools/README.md + package.json + build-bin.mjs + reports
carry no docs/ cites I move).

Pre-execution findings (firsthand, shape the scheme):
- F1: HIST_ARCHITECTURE is purely historical (file-by-file
  map of the deleted `src/` tree; every section maps
  retired paths). Nothing salvageable verbatim → the ONE
  arch doc is a true stub, written verified-true.
- F2: REFERENCE_UI.md is 44% HIST appendices (§§23–24,
  408/934 lines) + retired-machinery sections (§§8–11:
  virtual fs, Panda system, Piscina workers, event bus) +
  21 dead core links (round-1 count). Pre-cutover record,
  not a living guide → owning subdir is ARCHIVE/.
- F3: FEATURES/README.md:3 already links RS_ATOMIC as the
  compile explainer → FEATURES/ owns RS_ATOMIC.md;
  LIB_BOOK.md joins it (LIB_ prefix matches the scheme).
- F4: ops crew has NOT acted (OPERATION_* names intact,
  JETTISON/REAPER/ERROR-CORRECT/DOOM-AGENT still active)
  → nothing to reconcile; missions/ content untouched.
- F5: every evidence top-level entry has a live cited
  consumer (triage table in DONE) → nothing files under
  ARCHIVE/; the triage verdict is stay-with-proof.
- F6: caps rename breaks skill TOOLING (code/data, outside
  prose-only scope — flagged, not edited): agent-rs
  run.mjs evidence defaults, agent-perf build-index.mjs
  WAVES path + generated perf-index.json (104 entries).
- F7: evidence/ + perf/ CONTENTS stay byte-identical
  (immutable bundles per EVIDENCE/README; live corpus +
  patches + generated index). HQ's ruling names the dirs;
  caps-ing contents would falsify frozen history.

## Docs-milspec-2 RECONCILED SCHEME (crew, 2026-09-23)

Filed before execution; answers EACH HQ ruling line by
line. No execution before this scheme.

### R1. Delete HIST_* + RELEASE.md (+ refs swept) — ruled

- DELETE (plain `rm`): HIST_ARCHITECTURE.md,
  HIST_CORE.md, HIST_LAYERS.md, HIST_STRUCTURE.md,
  RELEASE.md. History lives in git.
- HIST_LAYERS' live concept (portable `css` + T2 prover)
  is re-expressed verified-true in ARCHITECTURE.MD (one
  line + proof), not carried as prose.
- Refs swept: docs/README→README.MD rewrite (drops the
  HIST section + RELEASE bullet); REFERENCE_UI.md ~16
  HIST links + 1 RELEASE link de-linked to plain text;
  RS_ATOMIC.md:355 row reworded (HIST_LAYERS → crate
  README pointer); matrix/CHAIN_REPORT.md:157
  recommendation reworded (files removed, history in
  git). Verified repo-wide: no other HIST_/RELEASE.md
  cites outside frozen agers (LOGs, packages evidence).

### R2. ARCHITECTURE.MD as the ONE architecture doc — ruled

- Per F1, no salvage: write a TRUE STUB — what the
  architecture IS now, verified firsthand, file:line
  proof per claim (~80 lines: 6 packages, neo sync
  pipeline, author/runtime surfaces, generated scopes,
  RS tier, lib/mcp/icons/docs roles, matrix gate,
  no-bundler-plugin pin). Never aspirational prose.

### R3. ARCHIVE/ EVIDENCE/ PERF/ caps + triage — ruled

- Two-step `mv` (case-only): archive→ARCHIVE,
  evidence→EVIDENCE, perf→PERF. Contents byte-identical
  per F7.
- Triage: all 10 top-level evidence entries stay (F5);
  per-entry consumers tabled in DONE. Nothing moves.
- ARCHIVE/README.md: mechanical only — repair the
  round-1-broken `../FEATURES/PORTAL_COLOR_MODE.md` link
  (→ `LIB_PORTAL_COLOR_MODE.md`), add the REFERENCE_UI
  row. Archived bodies untouched.

### R4. LANGUAGE/ rebuilt-verified — ruled

- New `docs/LANGUAGE/` with exactly PUBLIC-API.MD,
  CSS.MD, PRIMITIVES.MD (no README — unrequested file).
- All three WRITTEN verified-true, file:line proof per
  claim, tight contracts (~60–100 lines each):
  PUBLIC-API = published packages + author surface +
  runtime surface + generated scopes + bin + lib
  exports; CSS = sheet contract (layer wrapper, prelude,
  reset/normalizeCss, token scoping, data-color-mode,
  utility shape, packed-css merge); PRIMITIVES = TAGS +
  factory + data-attr stamping + React 17/18/19 seam.
  Zero unwritten-with-reason (all verifiable).

### R5. Root = README.MD + ARCHITECTURE.MD only — ruled

- `README.md`→`README.MD` (two-step; HQ enumerated the
  caps name — round-1's renderer exception dies at root
  only; subdir READMEs keep `README.md`). Rewritten as
  the new-tree index.
- Placement map: RS_ATOMIC.md→FEATURES/RS_ATOMIC.md (F3),
  LIB_BOOK.md→FEATURES/LIB_BOOK.md (F3),
  REFERENCE_UI.md→ARCHIVE/REFERENCE_UI.md (F2, status
  line → archived-record + filed note; bodies verbatim;
  links depth-fixed, HIST/RELEASE de-linked).
- Post-move root listing holds exactly the two files
  (verified by listing).

### R6. Keep round-1's compatible work — ruled

- Kept verbatim: caps renames (BUGS/FEATURES/MISSIONS/
  COMPLETED + files), MISSIONS structure (F6/F7 moves),
  elegance (titles/status blocks), link hygiene.
- Ops boundary: missions/ CONTENT is ops-owned (HQ
  directives (2) COMPLETED moves + (3) OPERATION_ strip
  NOT executed here). My missions/ edits are mechanical
  link-target repairs only (FASTHULL archive link,
  JETTISON/REAPER RS_ATOMIC links, DOOM_AGENT + JETTISON
  live bare-path sweeps). Per F4 no reconciliation
  needed; no fork created.
- HQ directives (1)(4)(5)(6)(7): not docs — LOG moves
  are captain's (frozen), LANDING/initiatives/CAPTAIN/
  chain are out of scope. Noted, not executed.

### R7. Zero dangling links, resolve-verified — ruled

- Bar (round-1's): every `](…)` .md target in every
  edited/added/moved file resolves + old-path grep over
  live prose clean (triaged by hand).
- Sweep surface: in-docs links + bare live-pointer paths
  in live docs (CORES.md 6 paths, agent-perf SKILL.md 3
  lines, active MISSIONS bare paths) + VOYAGE.md (1
  archive link) + root README.md (REFERENCE_UI + archive
  links) + 5 RS SPEC/archive links + CHAIN_REPORT:157.
  LANDING.md missions links verified unaffected.
- Frozen verbatim (enumerated in DONE, not links or not
  mine): bare historical paths in COMPLETED logs
  (records of commands literally run), evidence
  meta/callers/html self-paths (immutable captures),
  packages evidence `docs/ATOMIC.md` cites (aging since
  round 1), LOGs, doom logs, CHAIN_REPORT:203
  never-existed proposal, LIB_BOOK §2.3 non-md links
  (pre-existing, Book owner, outside the .md bar).
- Tooling flagged for owners (F6), not edited.

## Docs-milspec-2 DONE (crew, 2026-09-23)

State: WORKING → SCHEME → DONE. Scheme above executed
exactly; no scope drift. Prose only: no install, no
commit, no index touch (verified clean at close).

### Executed (R1/R3/R5: deletes, renames, placements)

- DELETED (plain `rm`): `HIST_ARCHITECTURE.md`,
  `HIST_CORE.md`, `HIST_LAYERS.md`, `HIST_STRUCTURE.md`,
  `RELEASE.md`. History lives in git.
- Caps (two-step temp, verified on disk): `archive/` →
  `ARCHIVE/`, `evidence/` → `EVIDENCE/`, `perf/` →
  `PERF/`, `README.md` → `README.MD`. Contents
  byte-identical (zero git status under EVIDENCE/PERF).
- Placement map: `RS_ATOMIC.md` → `FEATURES/RS_ATOMIC.md`,
  `LIB_BOOK.md` → `FEATURES/LIB_BOOK.md`,
  `REFERENCE_UI.md` → `ARCHIVE/REFERENCE_UI.md` (status
  → archived-record + filed note; bodies verbatim).
- Root listing holds EXACTLY `README.MD` + `ARCHITECTURE.MD`
  (verified by listing). `LANGUAGE/` holds exactly the
  three files. FEATURES zero orphans (13 docs + README,
  14 index links).

### New docs (R2/R4: verified-true, proof per claim)

- `ARCHITECTURE.MD` — the ONE arch doc (true stub; F1
  no-salvage). 6 packages, sync pipeline, composition,
  pins, verification home.
- `LANGUAGE/PUBLIC-API.MD` — author + runtime surfaces,
  generated scopes, bins, sibling exports, retired pins.
- `LANGUAGE/CSS.MD` — sheet contract (statement, reset,
  tokens, utilities, privacy) against the live T1
  artifact + `packed-css.ts` + `context.ts`.
- `LANGUAGE/PRIMITIVES.MD` — 101 tags, generation,
  factory, stamped attrs. Zero unwritten-with-reason.

### Evidence triage (R3: all stay, consumers cited)

| Entry | Live consumer(s) |
|---|---|
| `flamegraph/enterprise-flame3` | RECON_V2:39, wave-2 reports (manifest/btreeset/nameset/shot2/asmfmt), EVIDENCE README canonical |
| `flamegraph/enterprise-flame2` | RECON_V2:40, CORRECT:69, COBJ1 |
| `flamegraph/enterprise-latest` | RECON-v1:26, FLAMEGRAPH:51, COBJ1/COBJ2 handoffs |
| `flamegraph/enterprise-repro1/2` | wave-2 repro/canonjson/proof/selpush/valgraph reports |
| `flamegraph/enterprise-repro3a/b` | wave-2 repro2 report |
| `flamegraph/enterprise-repro4a/b` | wave-3 repro3 report |
| `flamegraph/enterprise-repro5a/b` | cobj logs, wave-4 scanidentity |
| `flamegraph/enterprise-repro6a/b` | wave-4 reflame6 |
| `flamegraph/enterprise-repro7a/b` | wave-4 reflame7, CORES.md:820 |
| `counters/enterprise-counters2` | COBJ2:24, COBJ3:22-25 |
| `counters/enterprise-counters3` | RECON_V2:42, CORRECT:77, wave-2 shot2:15 |
| `counters/enterprise-latest` | RECON-v1:29, FLAMEGRAPH:61 |
| `counters/enterprise-scancensus4` | wave-4 scanrecon4:21, scanbundle:26, scanidentity:24 |
| `alloc/enterprise-alloc2` | COBJ2:24, COBJ3:23 |
| `alloc/enterprise-alloc3` | RECON_V2:41, CORRECT:83, CORES.md:821, memo-shot3:11 |
| `alloc/enterprise-latest` | RECON-v1:27, FLAMEGRAPH:54 |
| `phases/enterprise-phases1` | CORRECT:73, COBJ2:20/24, COBJ6:27 |
| `phases/enterprise-phases1b` | RECON_V2:43/74, CORRECT:87, COBJ6 |
| `styletrace-ledger.md` | STYLETRACE.md:265,546 |
| `styletrace-ready-ask1` | STYLETRACE READY-ask-1 + wave-2 nameset:26 |
| `styletrace-ready-ask2..5` | STYLETRACE READY-asks 2..5 (1:1, verified per file) |

Nothing filed under ARCHIVE/ — every entry live-referenced.

### Reference sweep (R7: zero dangling in the sweep)

- In-docs: depth fixes in the 3 moved files; 19
  HIST/RELEASE links de-linked; FEATURES README (+2
  index rows) + NEO_DATA_THEME + PORTAL sweeps;
  MISSIONS mechanical repairs (FASTHULL archive link,
  JETTISON/REAPER RS_ATOMIC links, DOOM_AGENT marker
  path); ARCHIVE/README PORTAL-link repair + new row.
- Live prose: VOYAGE (1), root README (3), CORES (7
  bare paths), agent-perf SKILL (3), 5 RS SPEC/archive
  links, CHAIN_REPORT:157 reword. LANDING verified
  unaffected (missions links only).
- Collateral caught + reverted: JETTISON sed caps'd 3
  package-local `packages/reference-neo/docs/evidence/`
  paths — restored; package-local `docs/evidence` cites
  (Neo cases, agent-neo SKILL, REAPER/JETTISON READY
  asks) verified unaffected.
- Verification: resolver over the edited set — 175 .md
  targets checked, 29 failures, ALL in the two
  left-intentional buckets (REFERENCE_UI 21 dead
  retired-tree links, archived-record verbatim; RS
  SPECs 8 pre-existing PLAN links on untouched lines).
  Re-run after final edits: 17/17 + 70-file pass clean
  outside those buckets. Old-path grep over live prose
  (docs non-frozen, matrix, pipeline, packages, skills
  .md, scripts, root, .github, .changeset): clean
  except enumerated agers + intentional history notes.
- Left verbatim (frozen or not mine): bare historical
  paths in COMPLETED logs (incl. STYLETRACE.md:411
  checklist), evidence meta/callers/html self-paths,
  EVIDENCE/README:37 + PERF memo-shot3 bare cites,
  ARCHIVE voyage-log old-case paths, packages evidence
  `docs/ATOMIC.md` cites (aging since round 1), LOGs,
  doom logs, CHAIN_REPORT:203 never-existed proposal,
  LIB_BOOK §2.3 non-md links (Book owner, outside bar).

### Flagged for owners (code/data, prose-only — not edited)

- `agent-rs/scripts/run.mjs` (`--out` evidence defaults
  + help `:550-553,:578,:591,:598`) and flame/alloc/
  counters.mjs header paths — default evidence filing
  still targets `docs/evidence/`.
- `agent-perf/scripts/build-index.mjs:10,:256`
  (`docs/perf/waves`) + generated
  `agent-perf/perf-index.json` (`:3` root + 104 report
  paths) — owner updates the path, regenerates.

### Captain flag (commit-time case forces)

`core.ignorecase=true` hides the case-only moves (dirs
show ZERO status). At commit, force explicitly (extends
round-1's 4-file list, still pending):
`git mv docs/Architecture.md docs/ARCHITECTURE.MD`,
`git mv docs/README.md docs/README.MD`,
`git mv docs/archive docs/ARCHIVE`,
`git mv docs/evidence docs/EVIDENCE`,
`git mv docs/perf docs/PERF`.
Without the dir forces, `ARCHIVE/REFERENCE_UI.md` (new)
would strand beside a lowercase `archive/` on
case-sensitive filesystems. Scope held: this crew
touched docs/ + LOG-2.md + 12 sweep files only;
sibling dirt (neo reports/package.json/tools/
fragments-base, pipeline targets.ts) untouched.

## PACKED-C chain proof (crew, 2026-09-23) — DONE

Scope (strict): PROOF ONLY. No source changes (all writes are
gitignored artifacts: `neo dist`, `.reference-ui/`,
`test-results/`, `/tmp/packedc/` logs). Procedure =
triage-identical: `neo sync` per dir + `pnpm agent
playwright --dir matrix/tests/chain/T<N> --no-build`
(line reporter). Baseline: ## TRIAGE-DONE 31-row table
(M1 x23 PACKED-CSS, M2 x7 D17, H4 x1); design predicted
22 flips + 9 stays (rows 4/8/17/20/21/22/24/28/31).

Setup: rebuilt `@reference-ui/neo` dist (was stale, zero
merge hits) via `pnpm --dir packages/reference-neo run
build`; re-synced 7 fixtures base-first (4 base + 3 meta,
all exit 0). Merge verified firsthand: meta baseSystem now
opens `@layer extend-library, meta-extend-library;` with
22 upstream `extend-library__*` rules, reset-stripped
upstream (sole reset = own block); T1 sheet went 0 -> 26
`extend-library` hits, statement-first.

### Per-tier counts (triage -> now)

| Tier | Triage PW | Now PW | Rows flipped |
|---|---|---|---|
| T1 | 4/3 | 7/0 PASS | 1,2,3 |
| T2 | 2/1 | 2/1 | - (row 4 stays) |
| T3 | 3/4 | 6/1 | 5,6,7 (row 8 stays) |
| T6 | 2/3 | 5/0 PASS | 9,10,11 |
| T7 | 2/3 | 5/0 PASS | 12,13,14 |
| T8 | 1/3 | 4/0 PASS | 15,16,17 * |
| T9 | 1/5 | 3/3 | 18,19 (rows 20,21,22 stay) |
| T10 | 1/2 | 2/1 | 23 (row 24 stays) |
| T11 | 1/2 | 3/0 PASS | 25,26 |
| T12 | 1/2 | 2/1 | 27 (row 28 stays) |
| T13 | 1/3 | 3/1 | 29,30 (row 31 stays) |

### Flip table: 23 flipped, 8 stay (deviation: row 17)

FLIPPED red->green (23): rows
1/2/3/5/6/7/9/10/11/12/13/14/15/16/17/18/19/23/25/26/27/29/30.
T1-L42/L60 `_private` negatives stay green (verbatim
scoping holds); all 19 visibility/root greens + 9 unit
greens undisturbed (unit suites not re-run, untouched path).

STAY RED (8, all D17): rows 4 (T2-L18), 8 (T3-L50), 20
(T9-L31), 21 (T9-L38), 22 (T9-L45 prelude), 24 (T10-L30),
28 (T12-L30), 31 (T13-L42). All 7 paint signatures
byte-identical to triage (`rgb(99,102,241)` /
`rgb(159,18,57)` / `rgb(49,46,129)` -> `rgba(0,0,0,0)`).
Row 22 prelude now reads
`"extend-library,extend-library-2,chain-t9"` (was `""`) --
statement emitted with exactly the merged set, failing
only on `toContain('layer-library')`: the designed
honestly-half-waits-D17 outcome; re-points PACKED-CSS->D17.

* DEVIATION row 17 (T8-L32, triaged H4): FLIPPED. Firsthand
cause: the oracle asserts `matches.length >= 1` for
`'@layer extend-library'` in the sheet -- the extends-side
merged block satisfies it. Triage's H4 pointer assumed the
counted block would come from layers adoption, but the
assertion text matches the extends block too. The H4
*policy* question (allow-and-duplicate: 1 vs 2 blocks) is
still open, but the test as written is green. Net: 23/8,
not 22/9 -- one MORE flip than predicted, same red
mechanism (D17) for every staying row, zero fix-now.

### Neo chain cases (agentneo, post-merge)

NEO-CHAIN-01 PASS (transitive), -02 PASS (diamond), -03
PASS (parallel), -04 PASS (multi-extends), -05 PASS
(depth), -06 PASS (real-upstream). 6/6.

### Command output (abridged, full logs /tmp/packedc/)

- `pnpm agent playwright --dir matrix/tests/chain/T1
  --no-build` -> `7 passed (2.8s)` + `PASS` banner.
- T2/T3/T9/T10/T12/T13 -> `2 passed 1 failed` /
  `6 passed 1 failed` / `3 passed 3 failed` /
  `2 passed 1 failed` / `2 passed 1 failed` /
  `3 passed 1 failed` (exit 1, all failures the D17
  rows above). T6/T7/T8/T11 -> `5/5/4/3 passed`, exit 0.
- Syncs: 7 fixtures + 11 tiers, all `sync_exit=0`; only
  T1 emits the 2 known `_private.brand` warnings.

PACKED-C DONE: merge flips every M1 paint row (22/22
predicted + H4 row 17 as documented deviation); staying
set = D17-only, signatures intact; neo chain 6/6 green.

## Tick (captain, 2026-09-23) — PACKED-C accepted, hermetic gate in flight
- PACKED-C DONE accepted: 23 flipped / 8 stay (row-17 H4 deviation documented, all stays D17 with intact signatures, neo chain 6/6). Captain firsthand: T1 7/0 PASS, T2 2/1 (single D17 row) — both match crew claims.
- Hermetic chain gate (all 11 @matrix/chain-t* packages, default env) launched by captain, running; Obj2 close + landing sweep gated on it.
- Core retirement confirmed landed (packages/reference-core gone; moved-from paths cleared in b833ed235).
- No live crews; nothing to unstick. No new dispatch — in-order law, Obj2 closes first.

## Tick (captain) — hermetic gate RED on real divergence, diagnosis deep in flight
- Hermetic chain gate does NOT match native: T1 hermetic 4/3 vs native 7/0 (same for T10/T11/T12 sampled). Signatures byte-equal triage rows 1/2/3 — but mechanism is NOT pre-merge: exfil probes prove the container's sheet IS merged (3776B, statement-first, 22 upstream hits), baseSystem/fragment/runtime-data/sheet byte-identical to native, browser RECEIVED the merged sheet.
- Divergence: container DOM carries ZERO extend-library__ classes (native emits them) — css() resolves nothing in-container. Only differing artifact: react.mjs bundle (149093 native vs 149652 container, all chunks differ) + React 19.2.4 native vs 19.3.0 container. Suspect chain: stylePropNames (compile-derived, feed the react entry) or esbuild-toolchain bundle difference. Next probe: stylePropNames membership/hash exfil.
- Ruled out: stale node_modules (fresh install reproduces), stale tarballs (purged + verified merge inside), watch-vs-oneshot (same sync()), cache-key staleness (key verified exact-fresh), fixture payloads (identical), configs (identical), browsers (same PW version).
- Diagnostic diffs in tree, UNCOMMITTED and never to land as-is: pipeline install.ts MATRIX_BUST_INSTALL_CACHE gate, pipeline reporter FAIL-ROW printer. Temp zz-debug specs removed after each probe. pipeline targets.ts diff is NOT captain's — untouched.
- No live crews (roster empty, no workflow runs, 6 foreign peers untouched). No dispatch — gate must go green before Obj2 close.

## Tick (captain) — HERMDIV crew running, checkpoint landed
- Checkpoint eeb062ae5 committed (107 files, tree clean): root→MISSIONS moves, milspec sweep, mission logs, hermetic ENOSPC+dist fixes. Diagnostic pipeline patches reverted before commit, not included.
- HERMDIV diagnosis crew dispatched (main/hermdiv-diagnosis/75, running): stylePropNames probe first, then react.mjs bundle inputs. No log writes yet — freshly dispatched, not stuck; no intervention per §4.
- No commits this tick (crew's wave in flight). No further dispatch — in-order law.

## HERMDIV interim (crew, filed at cancel) — root cause native-proven, hermetic probe unrun
- Packed extend/meta fixtures externalize @reference-ui/react but ship no bundle of their own (files = dist + baseSystem only, deps null).
- Natively, vite dev resolves the fixture dist's css import to the fixture's OWN .reference-ui/react junction (system extend-library) → emits extend-library__* classes → sheet-backed paint. Byte-level proof filed by crew.
- Hermetic half (unproven at cancel): container presumably resolves the same import to the CONSUMER's bundle (system chain-t1) → wrong-or-empty classes → triage-identical unstyled signatures despite merged sheet. Full evidence: subagent session log 01a0cf38-0ae5-7b53-8fb8-5212edf0ecc3 + tool-outputs 01a0cf40/01a0cf42.
- Crew leftovers reverted by captain (reporter patch, zz-debug spec). Tree clean.

## VOYAGE PARKED (HQ order) — RS proved, Neo polish is next
- Obj1 COMPLETE, Obj3 COMPLETE. Obj2 paused one gate from close: merge landed + native green, hermetic divergence diagnosed-natively (see HERMDIV interim above), hermetic confirmation + fix + re-gate outstanding.
- LANDING (Obj4/5) undispatched. Standing ticks: one-line entries, no action.
- RESUME CHECKLIST: (1) re-run HERMDIV hermetic probe to confirm consumer-bundle resolution; (2) fix (fixture ships bundle? consumer adopts upstream runtime? — crew recommendation pending); (3) hermetic 11-tier re-gate; (4) landing sweep + Obj2 close; (5) dispatch LANDING.

## Tick — parked; PKG-STABILITY wave running (no writes yet, fresh — not stuck), no action.

## NEO-PACKAGER (concept crew, 2026-09-23) — WORKING

Scope: packager concept + HERMDIV fix + proof. Neo
`src/packager/` (new) + leg consumption edits + 5 fixture
tsup externals + 2 SPEC ownership lines. No PostCSS, no
motion beyond the packager's home, no sync slimming, no
other Tokyo items. Never commit. Governing skills
`agent-neo` (cases + q after every generation step) and
`test-core` (matrix proof via `pnpm agent` only) loaded
first. PLAN_TOKYO.md items 1+7 + HERMDIV interim read.
Legacy is a museum: every path below is READ-ONLY, cited
file:line, never edited or imported.

### 1. Study — legacy's solved packager (evidence)

Shape (`packages/reference-legacy/src/packager/`, all
line cites firsthand): `packages.ts` holds declarative
defs (`SYSTEM_PACKAGE` :29, `REACT_PACKAGE` :49,
`STYLED_PACKAGE` :68, `TYPES_PACKAGE` :95, `PACKAGES`
:127; two install phases `RUNTIME_PACKAGES` :117 /
`FINAL_PACKAGES` :123); `package/` holds the
`PackageDefinition` type (`type.ts:19`: name, version,
entry, bundle flag, main, types, exports, `copyFrom`,
`postprocess`) plus `createBundleExports` (`exports.ts:4`)
and `getShortName` (`name.ts:2`); `layout.ts` resolves
dirs/entries (`getPackageDir` :7, `getEntryBasename` :12,
`getDeclarationBasename` :17, `getRuntimeEntryPath` :22);
`bundler/` executes a def (`index.ts:10`: entry then
assets then package.json); `install/` places + publishes
(`install/index.ts:52`: bundle → postprocess →
install-mode publish; `installPackages` :76 loops defs,
prunes broken scope links :96); `postprocess/` runs small
named ordered passes (`index.ts:22` registry:
`injectLayerName`, `rewriteTypesRuntimeImport`).

Externals policy — the HERMDIV answer
(`bundler/esbuild.ts:6-23`): the generated bundles
externalize `react`, `react-dom`, `react/jsx-runtime`,
`@reference-ui/styled(+/*)`, `@reference-ui/types(+/*)`,
node builtins, `fast-glob`, `esbuild` — and NOTABLY never
`@reference-ui/react` or `@reference-ui/system`: each
generated react/system bundle is SELF-CONTAINED for its
system. Legacy's answer to "who provides
`@reference-ui/react` for a packed fixture" is the
install modes (`install/build.ts:4` copy for
build/test flows vs `install/dev.ts:4` symlink for dev,
selected by `init.ts:16`): every project provides its
OWN generated packages into its OWN node_modules. That
worked hermetically because legacy `css()` was
system-agnostic (Panda serializer: same input, same
class string, whichever copy served it) — the provider
never mattered. Neo broke that property by binding
runtime data into the bundle (`sync/react.ts:32-41`
`registerRuntimeData(systemName, ...)`; `runtime/css/
css.ts:223` `name(query, tables, active.system)` prefixes
classes per system; single-system runtime, css.ts:103).

HERMDIV restated through the policy: extend/meta
fixture tsup configs externalize `@reference-ui/react`
(5 files, identical 4-line block) and ship only
dist + baseSystem (`files`, fixture package.json:18-23
— byte-identical shape pre/post migration, verified
`b833ed235^`). Natively the fixture dist resolves to
the fixture's OWN junction (own system → own classes →
paint); packed, the tarball carries no provider, so it
resolves to the CONSUMER's bundle (consumer system →
wrong classes → triage-identical unstyled signatures
despite the merged sheet). The in-tree precedent for
the fix fork already exists: layer fixtures' tsup
configs carry NO `@reference-ui/*` externals, so layer
dist bundles its own runtime (verified: layer dist
imports only `react`; 364KB self-contained). "Fixture
ships its own runtime bundle" is therefore not an
invention — it is the layer fixtures' shipped shape,
extended to extend/meta. "Consumer adopts the upstream
runtime" is REFUSED: `css()` cannot attribute a call to
a system, so adoption would need union emission (wrong
classes natively, miss-diagnostic spam) — dishonest.

Left behind, by name: `worker.ts`/`run.ts`/`init.ts`
(event-bus + thread-pool worker lifecycle),
`ts/` (dts fan-out — Neo's typegen + single
`types-bundle` leg cover it), `injectLayerName`
(Neo bakes `systemName` at generation,
`generateReactEntrySource({systemName})` — no
placeholder exists), build/copy install mode (no
consumer: no `neo build` verb; icons verified over
junctions per Phase 0 row 15), `writeIfChanged`
(`bundler/files.ts:52` — Neo rm-wipes outDir first,
so change-gating is dead code), dir-copy + TS-transform
assets (`bundler/files.ts:69-98` — Neo has one file
copy: the react styles.css), broken-symlink pruning
(unrequested behavior; F2 stays flagged).

### 2. Design — the Neo packager concept

Home: new top-level `src/packager/` (Tokyo item 3 may
later relocate it under `lib/` as motion-only; no
motion now beyond this home). Legs stay in
`sync/publish/` + `sync/react.ts` +
`sync/reference-types.ts` (no file motion — blame and
prose cites intact); the packager OWNS the defs, order,
manifests, externals, and passes, and the legs consume
them. One deliberate transitional edge: the assembly
imports not-yet-moved legs (documented in-file,
item-3-owned).

Module (new files): `packages.ts` (4 declarative defs
`SYSTEM/STYLED/REACT/TYPES_PACKAGE` + `PACKAGES`,
version stamp kept `0.0.0-neo`); `package/` (port of
legacy `type.ts`/`exports.ts`/`name.ts` verbatim —
already de-panda'd); `constants.ts`
(`GENERATED_VERSION`, `BASE_SYSTEM_HEADER`, moved from
`sync/publish/types.ts`); `types.ts` (`PublishInput`,
moved, + `AssemblyInput` with the runtime artifact);
`externals.ts` (THREE owned policies, zero-import leaf:
`REACT_BUNDLE_EXTERNALS` = `['react']`,
`TYPES_BUNDLE_EXTERNALS` = legacy's list owned,
`SHIPPABLE_UNIT_EXTERNALS` = `['react',
'react/jsx-runtime']` — the HERMDIV fix as code: NO
`@reference-ui/*` entry, so shippable units inline the
system-bound runtime); `layout.ts` (port of legacy
helpers); `manifest.ts` (`writePackageJson`, port of
legacy `package-json.ts`, unconditional write — see
study); `assets.ts` (narrowed `copyFrom` executor:
file-from-outDir only — the react styles.css);
`postprocess/` (registry + `rewriteTypesRuntimeImport`,
moved from `sync/reference-types.ts` with triple-guard
semantics intact — the ONE surviving pass);
`assembly.ts` (`assembleSystem`: the 8-step order —
system → styled → react-shell → runtime-data → react
bundle → types-decls → reference-types → links — moved
out of `sync()`'s call sequence; `compile-request.json`
stays a sync diagnostic, not packaging); `README.md`
(architecture, no filename tables).

Fudge migrated (each a named current sin): 4 scattered
manifest literals → defs; react-shell placeholder +
react.ts rewrite (`react-shell.ts:16-17` admits the
two-step) → shell writes the FINAL manifest from the
def, react.ts drops its write; unowned externals
literals (`sync/react.ts:101`,
`sync/reference-types.ts:25` "Core's externals")
→ `externals.ts`; order-in-comments ("after the react
leg… before the links leg") → `assembleSystem`;
free-floating `rewriteTypesRuntimeImport` → named
registry pass; `LINKED_PACKAGES` mirror (`links.ts:8`)
→ derived from `PACKAGES`. `sync/publish.ts` (barrel)
and `sync/publish/types.ts` delete; `sync()` keeps its
recipe and calls one packager entry. Output is
byte-identical by construction (same key order, same
values, same bytes) — proven by pre/post `diff -r`
over snapshotted `.reference-ui` trees, not by review.

Shippable system unit (ship-list): `dist/` (SELF-
CONTAINED: runtime inlined, only `react`,
`react/jsx-runtime`, `@fixtures/*` external) +
`baseSystem.mjs/.d.mts` pair + README. `files` arrays
already match — zero change there. Fix application:
5 fixture tsup configs (extend×2, meta×3) drop the 4
`@reference-ui/*` external lines and import
`SHIPPABLE_UNIT_EXTERNALS` from the packager (relative
import, precedent: `bootstrap-runtime.mjs` reaches
into `packages/` the same way); meta `@fixtures/*`
lines stay (package edges, not runtime); layer×2
untouched (already compliant — verified by dist
inspection). Prose: 2 SPEC ownership lines
(type/SPEC.md, layer/SPEC.md) repoint to the packager;
TESTS.md ledger rows stay verbatim (they record past
change sites, not current ownership).

No workers, no thread pool, no ts fan-out: natives
compile fast and serial (`sync()` already is); the
assembly is an ordered `await` chain like legacy's
`installPackages` loop (`install/index.ts:85`), minus
the event bus (Tokyo item 7: direct calls).

DOMAIN.md gains `packager` + `ship-list` in the same
pass (skill §7: language evolves with the code).

### 3. Implementation (as filed in §2, one convergence below)

New `src/packager/`: `constants.ts` (stamps, moved),
`package/` (type + exports + name + barrel, legacy
port), `externals.ts` (three policies, zero-import
leaf), `layout.ts` (port), `manifest.ts`, `assets.ts`
(narrowed), `types.ts` (`PublishInput` moved +
`AssemblyInput`), `packages.ts` (4 defs + `PACKAGES`),
`postprocess/` (registry + surviving pass),
`assembly.ts` (`assembleSystem`, 8 steps),
`README.md` (architecture, no filename tables).
Legs consume defs/manifests/externals/passes; the
react-shell placeholder dance is dead (shell writes
the final manifest; `react.ts` drops its write);
`sync()` calls one packager entry;
`sync/publish.ts` + `sync/publish/types.ts` deleted.
`benchmark/deepsee/worker-phases.ts` re-imports legs
directly (its measured step set preserved exactly —
no reference-types leg, as before). 2 SPEC
ownership lines repoint; TESTS.md ledgers verbatim
(history, not ownership); DOMAIN.md gains the two
entries. No file motion, no workers, no ts fan-out.

CONVERGENCE (captain, read): the PKG-STABILITY wave
landed the identical externals fix in the same 5
tsup configs mid-flight (literals + comments, dists
rebuilt 19:02-19:03) while this crew was
implementing the packager. Independent diagnosis,
same fork — the fix shape is doubly arrived-at.
This crew's delta on their files: the literals now
import `SHIPPABLE_UNIT_EXTERNALS` from the packager
(single owner per §2; values identical), all 5
rebuilt green. Their comments kept, ownership lines
added. If the waves land separately, either shape
proves the gate (same values); the import is the
drift-proof landing shape.

### 4. Proof (all firsthand, final bytes)

- Gate: `agentneo q` over packager + touched sync +
  benchmark → 0 errors (4 warns, all pre-existing
  band; `sync()` 117→108 lines). No-panda clean
  (DOMAIN hits are pre-existing retirement text).
- Units: `pnpm agent vt packages/reference-neo/src`
  → 44 files, 311 passed.
- Full Neo suite: `pnpm agentneo run` → 197/197 ok
  (last-run.json), chain 6/6.
- Byte-identity: pre-change `.reference-ui`
  snapshots (fixture + T1) vs post-change re-sync →
  `diff -rq` EMPTY both trees. Notes: esbuild
  stamps CWD-relative module comments into
  types.mjs, so the comparison syncs from the same
  CWD the snapshot used (tier dir); settle 2s
  before diffing (background tasty phase).
- Fixture dists (5 rebuilt): import only `react`
  (+ CSS-string false positives); zero
  `@reference-ui/*` edges. Layer×2 untouched
  (already compliant).
- Native chain (`neo sync` per dir + `pnpm agent
  playwright --dir matrix/tests/chain/T<N>
  --no-build`): T1 7/0, T2 2/1, T3 6/1, T6 5/0,
  T7 5/0, T8 4/0, T9 3/3, T10 2/1, T11 3/0,
  T12 2/1, T13 3/1 — PACKED-C table matched
  exactly with runtime-inlined dists.
- Hermetic 11-tier (`pnpm agent test
  --packages=@matrix/chain-t*,…`; fail-fast runner,
  so T6/T7/T8 batched + T2/T3/T9/T13 solo after
  the first batch parked): T1 7/0, T2 2/1, T3 6/1,
  T6 5/0, T7 5/0, T8 4/0, T9 3/3, T10 2/1,
  T11 3/0, T12 2/1, T13 3/1 — hermetic == native
  on all 11. D17 parks only (8 rows: 4/8/20/21/
  22/24/28/31); failing-set identity follows from
  equal counts + D17-unflippable (the layers
  feature exists in neither env — no diagnostic
  patch needed, none made). HERMDIV closed:
  T1 hermetic was 4/3, now 7/0.

Footprint: `src/packager/` (new) + 11 Neo edits +
2 deletions + benchmark import fix + DOMAIN + 2
SPEC lines + 5 tsup wirings + this log. No
diagnostic edits made, none to revert; no commits;
index untouched. Sibling dirt at start (reporter
patch, zz-debug spec) was reverted by its owner
mid-flight, not by this crew.

## NEO-PACKAGER DONE (concept crew, 2026-09-23)

Concept installed + HERMDIV fixed through it +
chain green native and hermetic with D17 parks
only. Gates: q 0 errors, units 311/311, Neo suite
197/197, byte-identity diffs empty, native 11/11
PACKED-C-identical, hermetic 11/11 == native.
Report, don't land.

## LEGACY-SURVEY (research crew, 2026-09-23) — FILED

Scope: READ-ONLY survey of `packages/reference-legacy/`
(frozen main-core; museum law read first — zero tree
writes; this log section is the only write). Context
read: `packages/reference-neo/PLAN_TOKYO.md` (map),
`docs/MISSIONS/OPERATION_TOKYO.md` §4 (red-flag
catalogue), NEO-PACKAGER § filed above. Every path
below is cited file:line firsthand on BOTH sides; no
vibes. Sibling NEO-PACKAGER owns packager/ — skimmed
only (§13), no duplication.

Verdict scale: STEAL = port the shape; STUDY = cite
as CORE-BONES evidence (with steal-trigger where one
exists); SKIP = panda-era/dead-constraint/already-
ported, with the reason. Splits name the part each.

### 1. session/ — HQ's seed question, answered

Problem: core's pipeline was multi-threaded,
long-lived (watch), and consumed across processes.
Vite/Webpack plugins run in the USER's bundler
process, not core's — nothing inside legacy src
imports them (verified: no consumers outside
session/vite/webpack/bundlers/public). They needed
a cross-process "logical build complete" signal so
HMR would not fire mid-pipeline on half-written
generated files. session/ is that protocol:
`session.json` manifest
(`SessionManifest{pid,mode,state,buildState,...}`,
types.ts:8) written atomically (tmp+rename,
files.ts:33) into outDir/tmp; `session.lock`
(O_EXCL acquire with stale-pid reclaim,
files.ts:87, EPERM-means-alive files.ts:120) so
exactly one `ref sync --watch` owns an outDir
(watch-lock.ts:10; one-shots DELIBERATELY skip the
lock, state.ts:19-21, so a config-applying one-shot
may run beside watch); `getSyncSession({cwd})`
(public.ts:58) walks up to find the outDir
(findOutDir :17), watches the DIRECTORY not the
file (inode-safe vs atomic renames, watch.ts:66),
self-promotes when outDir appears (watch.ts:90),
reconciles trailing-edge (watch.ts:58), dedupes
ready edges by `pid:updatedAt` signature
(public.ts:64), and isolates handler throws
(public.ts:86-90). Why core needed one: workers +
threads + external bundler processes = no shared
memory for readiness; the filesystem was the only
bus all three could see.

Neo: NO session concept at all (grep over
neo/src for session/HMR/onRefresh/RefreshEvent:
zero hits). `watchSync` (sync/watch.ts:281) resyncs
and reports via callbacks but publishes no
manifest; tmp helpers exist (lib/paths/tmp-dir.ts)
but serve only config/evaluate.ts temp eval, never
a manifest. SYNC-02 folds tmp/ absence by design;
matrix session suite was verdict DROP (retired
sidecar). Consequence: two `neo sync --watch` on
one outDir both rm-wipe + publish with no owner
guard — live interleave hazard (clean.ts retry
covers only Neo's own tasty writer, not a second
sync). Neo does not have the problem TODAY (no
bundler plugin to consume readiness) but WILL grow
it with its first plugin or editor integration.

Verdict: STEAL the watch lock (files.ts:87-110 +
watch-lock.ts:10 — tiny, prevents real corruption
today) / STUDY the manifest protocol (state.ts,
public.ts:58-96, watch.ts — CORE-BONES evidence;
steal-trigger: Neo's first bundler plugin, which
needs it as the flush signal; see §5 dependency).

### 2. watch/

Problem: stable tool-agnostic change detection over
@parcel/watcher: minimal roots derived per include
glob (static-prefix extraction roots.ts:10, nested
collapse roots.ts:42, deriveWatchRoots :55);
picomatch include filter PLUS exact config-
dependency set (dependency hit →
requiresFullResync, watcher.ts:38-62); .gitignore-
aware ignores (anchored-vs-basename translation
gitignore.ts:15, walked to repo root :74) + static
ignores (node_modules, outDir glob, .git,
gitignore.ts:5); FSEvents "Events were dropped"
swallowed (watcher stays functional; resync would
loop, worker.ts:28-34), other errors →
cooldown-gated full resync with circuit breaker
(max 3 consecutive, worker.ts:37-49).

Neo: SOLVED (ported). sync/watch.ts mirrors it
function-for-function: staticPrefix :55,
collapseRoots :71, deriveWatchRoots :80,
toIgnoreGlobs :115, getIgnoreGlobs :142,
toWatchChange :165, isDroppedEventsError :172,
createWatcherErrorHandler :240 — plus Neo-owned
improvements (trailing-edge debounce + serializing
scheduler :186-235, baseline-then-resync :281).
Two deltas only: no circuit breaker (cooldown
only, :240-249 — flapping backend resyncs
forever, every 5s) and every change costs a full
resync (no single-file path — correct at native
speed).

Verdict: SKIP (already stolen; the port IS the
evidence). STUDY delta: the circuit breaker
(worker.ts:43-49) as a one-line hardening note.

### 3. virtual/

Problem: Panda (the CSS compiler) needed to scan
code resolving to the generated system runtime
without mutating user source — so virtual/ built
a transformed source mirror under outDir/virtual
(README: "what Panda scans"): full snapshots
staged in `virtual.next` then published by atomic-
ish dir swap (staging.ts:42; publishStagedDir:
live→.prev, staged→live, EXDEV copy fallback,
restore-on-failure, lib/fs/publish-staged-dir.ts:
66); single-file watch sync with STREAMING marker
prefilter (transform only files containing
`@reference-ui/react`, tail-window scan without
reading whole files, fs/copy.ts:104-140);
MDX→JSX, cva/css import rewrites, responsive
lowering, style-call neutralization in fixed order
(transforms/index.ts:86); fragment-vs-source
classification (isFragmentFile: imports from
system/config surface → `virtual:fragment:change`
→ config/Panda rebuild WITHOUT reference
rebuild, fragments/detect.ts:24, run.ts:81);
breakpoint table memoized per root, invalidated
on fragment change (breakpoints/resolve.ts:64-84);
reserved `__reference__ui` style collection that
Panda scans directly (microbundle-inline locals,
transform, write, style/collection.ts:70).

Neo: deliberately MIRRORLESS — engine scans
sourceRoot directly ("no virtual mirror, no
staged declarations — both roots are the
project", sync/index.ts:167-172). SYNC-02
forbids the mirror; matrix virtual suite DROPped
as retired contract. The whole subsystem is
Panda-shaped: Panda needed import-rewritten
scannable input; natives do not.

Verdict: SKIP the mirror/transforms/collection
(dead Panda constraint). STUDY two atoms as
CORE-BONES: (a) staging-swap publish
(lib/fs/publish-staged-dir.ts:66) — legacy
failures restore previous-good; Neo's catch-clean
(sync/index.ts:253-255) deletes EVERYTHING, so a
failed sync leaves no folder rather than the last
good one (availability regression; natural home:
NEO-PACKAGER's assembly); (b) the streaming
marker prefilter (fs/copy.ts:104) as prior art
for scan avoidance if native scan ever regresses.

### 4. bundlers/ (shared plugin substrate)

Problem: two bundler plugins, one refresh
discipline — buffer generated-output writes,
flush only on session ready edges. bundlers/ is
the shared leaf: path classification vs
GENERATED_OUTPUT_ROOTS (outputs.ts:10);
@parcel/watcher subscription over outDir filtered
to managed roots (output-subscription.ts:7);
in-memory write buffer remember/flush/clear
(managed-writes.ts:6); project path resolution
(project-paths.ts:8); session-refresh wiring with
stop/dispose (sync-session.ts:6); internals-
injection seam for tests
(ReferenceBundlerInternals, types.ts:16).

Neo: no bundler plugins (grep for referenceVite/
handleHotUpdate in neo: zero src hits); WILL
grow it — any HMR story needs exactly this
discipline. Informal mirror only:
LINKED_PACKAGES (sync/publish/links.ts:8) vs
GENERATED_PACKAGE_NAMES (legacy constants.ts:8).

Verdict: STUDY now (CORE-BONES: buffer-until-
ready + managed-roots classification + internals
seam), STEAL on trigger: Neo's first bundler
plugin lands WITH this substrate, not after.

### 5. vite plugin

Problem: Vite dev HMR must never serve
half-written generated files or refresh the
browser before CSS+runtime are safe. Plugin
(vite/plugin.ts:47): optimizeDeps.exclude for
managed packages (optimize.ts:5,
MANAGED_PACKAGES constants.ts:11);
handleHotUpdate DEFERS managed-output updates AND
token/theme/system source updates (return [] to
swallow, :113-134) while remembering them
(policy: hot-update-policy.ts:21-27, project-
source leg :41-61); session-ready edge flushes
ONE batched native payload (invalidateModule +
deduped js/css updates, single timestamp,
hot-updates.ts:6-51); defensive posture
throughout (shape-check dev server :73,
warn-once :37, never break dev :99-106);
teardown on httpServer close + closeBundle
(:86-111).

Neo: nothing — no plugin, no HMR contract. Neo's
react package ships styles.css into
node_modules via junctions (links.ts:25) with no
invalidation story; consumers get full reloads at
best. WILL GROW; this is Neo's biggest missing
consumer-visible capability after the packager.

Verdict: STEAL (defer-until-ready policy +
single-flush payload builder are the load-bearing
shapes; warn-never-break is CORE-BONES
discipline). DEPENDS ON §1 manifest STEAL — the
flush signal has to exist first. Ranked with §1
as one program below.

### 6. webpack plugin

Problem: same refresh discipline for Webpack:
resolve aliases pin react/react-dom/scheduler +
all @reference-ui/* to project node_modules
(defeats duplicate copies, plugin.ts:33-61);
cache off, unsafeCache off, snapshot.managedPaths
emptied (generated files never snapshotted as
immutable, :62-69); watchOptions.ignored extended
via function/RegExp/string/array-preserving merge
to skip mcp+virtual churn (watch-options.ts:7-22);
session-ready flush → watching.invalidate()
(plugin.ts:121-127).

Neo: no webpack target at all. Voyage R4 (this
log, R4) recommends retiring every webpack5 axis
with its suite; no Neo consumer exists or is
planned.

Verdict: SKIP (dead constraint — no webpack
target). STUDY-only if resurrected: alias
pinning + snapshot busting (plugin.ts:28-69) and
the ignore-merge preserving user config shape
(watch-options.ts:39-57) are the two tricks,
cited here so nobody re-derives them.

### 7. clean/

Problem: `ref clean` removes outDir + every
node_modules/@reference-ui scope link, main-
thread only, exit 0 even when absent — with the
packager def list (PACKAGES × getShortName) as
the single source of "generated"
(clean/command.ts:15-37).

Neo: solved BETTER. bin/neo.ts cmdClean (:70-81)
removes outDir + links but verifies each link
target points inside outDir before unlinking
(isGeneratedLink :46-56 — a hand-placed dir is
never touched; legacy unlinks blindly). Two
drift nits filed (survey findings, NOT fixed —
read-only crew): NIT-1: bin/neo.ts:13
LINKED_PACKAGES misses 'types' (sync links 4,
publish/links.ts:8; clean removes 3) → `neo
clean` orphans the types junction (NEO-PACKAGER's
derive-from-PACKAGES plan fixes it). NIT-2: cmdClean
uses raw rmSync, not the ENOTEMPTY/EBUSY-retrying
cleanDir (sync/clean.ts:31) built for the
background tasty writer it races.

Verdict: SKIP (Neo's target-verified unlink is
the better shape). STUDY note: single-source the
link list from defs (already in NEO-PACKAGER §2).

### 8. tokens/

Problem: MCP/editor tooling needs a flat token
inventory (path/category/value/light/dark/
description, types.ts:1) built from the SAME
fragment sources sync uses: bundle local token
fragments + upstream fragments with stamped
provenance (wrapBundleWithSource via
`__refCurrentFragmentSource` global marker,
load.ts:53-59), eval in a temp file under
outDir/tmp/token-fragments (load.ts:99-138),
collect via collector script, flatten with
`_private` stripped ONLY for upstream fragments
(local `_private` kept, flattenTokenFragments
:86-97), last-write-wins by path, sorted.

Neo: mechanism SUPERSEDED, semantics ported.
`_private` strip lives in fragments/base/merge
(merge.test.ts:54-98); collection is native-
side; config bundle/evaluate (config/bundle.ts,
evaluate.ts) replaced the temp-eval idiom with
cleaner seams; S6 reference/api.ts owns the
MCP-facing surface (Worker D reconfirmed).

Verdict: SKIP (temp-bundle-eval is dead;
natives evaluate). STUDY atom: the flat McpToken
shape (tokens/types.ts:1) as the MCP contract
reference if S6's surface drifts.

### 9. events wiring (sync/events.ts + event-bus + thread-pool)

Problem: a Piscina multi-threaded pipeline (one
long-lived task per worker, bootstrap.ts:22-28,
config via workerData :23) needed cross-thread
orchestration: typed central registry (Events =
per-module slices, events.ts:15); BroadcastChannel
transport with envelope/parse helpers
(lib/event-bus/channel, README); orchestration
combinators — forWorker ready-gating,
combineTrigger barrier-with-flush, emitOnAny
fan-in, onReady, afterFirst (events.utils.ts:
46/116/69/104/82); watch-burst batching (50ms
settle so checkouts/large refactors rebuild
against the SETTLED snapshot, events.ts:31-74,
rationale comment :65-67); full-resync
serialization (in-flight + pending coalescing,
:122-154); config refresh on dependency change
preserving debug (:13-29). Hard-won caveat
documented: BroadcastChannel never self-delivers,
so main-thread completion/failure must observe
worker events directly (complete.ts:31-37).

Neo: HQ-REFUSED. "No event bus" (PLAN_TOKYO item
7); sync() is a serial await chain
(sync/index.ts:143-258). The problem (cross-
thread orchestration) does not exist: one
process, serial, fast natives. Neo's watch
scheduler (watch.ts:186-235: debounce +
serialize + coalesce-behind-in-flight) already
reimplements the burst/coalescing halves.

Verdict: SKIP the bus, pool, workers, ready-
gating (Tokyo item 7 refuses them outright).
STUDY as CORE-BONES: (a) the dependency-edge
documentation discipline — events.ts:76-95 phase
list + per-edge comments is what Tokyo's "recipe"
should read like (as direct calls); (b) the
mixed-A/B-state comment (:65-67) — steal the
COMMENT into Neo watch.ts schedule(); (c)
EVENT_READY.md — exhibit of ready-gating leaking
boot mechanics into orchestration (what-not-to-
do); (d) union-of-slices registry shape
(events.ts:15) — IF Neo ever needs cross-
subsystem signals, this is the shape.

### 10. shutdown / failure-boundary / completion

Problem: orderly teardown of a multi-handle
process + honest failure UX per mode. SIGINT/
SIGTERM → terminate tracked children (SIGTERM,
wait, SIGKILL), shutdown pool, close log relay +
bus, FORCE-EXIT after 5s (shutdown.ts:96-144,
force timer :106, terminateTrackedProcesses
:66); child pids tracked via process:spawned/
exit bus events; spawnMonitoredAsync
(lib/child-process/index.ts:21) captures
stdout/stderr and distinguishes signal-kills with
a user-facing message (:77-90);
uncaughtException/unhandledRejection → log + emit
sync:failed (manifest goes failed) + exit 1
(failure-boundary.ts:15-32); watch-vs-oneshot
UX split (watch: warn + "waiting for next
change" + `[ref sync] failed` stderr sentinel
for harnesses, logging/index.ts:86-104; one-shot:
error + exit 1, complete.ts:42-56); watch
readiness = stylesheet-on-disk AND runtime-copy-
complete with SEQUENCE GUARDS against stale-cycle
ready (changeSeq/buildingSeq/cssSeq/packageSeq,
watch-ready.ts:16-62); milestone timing lines
(duration-since-previous, logging/index.ts:58).

Neo: thin. bin/neo.ts cmdWatch wires SIGINT/
SIGTERM → handle.stop() (:108-115) but with NO
timeout/force-exit (a wedged native call wedges
Ctrl-C — stop() awaits the in-flight sync,
watch.ts:318-328, unbounded); NO failure net
anywhere (grep for uncaughtException/
unhandledRejection/SIGINT in neo/src: zero hits —
only bin/neo.ts:114-115); no tracked children
(Neo spawns nothing — no tsup/dts fan-out — so
that half is moot); watch resync failure logs
and keeps watching (watch.ts:299-306, stdout
console.log bin/neo.ts:104 — greppable but
unstamped, no stderr sentinel contract); no
milestone timing (phases.ts is bench-only,
env-gated :19).

Verdict: STEAL two atoms — (a) the uncaught-
failure boundary (failure-boundary.ts:15-32:
log + mark-failed + exit 1; Neo's mark-failed =
existing catch-clean, sync/index.ts:253 — the
gap is throws OUTSIDE sync() dying raw); (b) the
force-exit timeout (shutdown.ts:106-110: shutdown
that cannot hang). STUDY two — (c) watch-ready
sequence guards (watch-ready.ts:16-62: stale-
cycle protection travels WITH the §1 manifest
STEAL); (d) the `[ref sync] failed` stderr
sentinel (logging/index.ts:7,101-103) as
harness-contract precedent. SKIP the rest
(child tracking — Neo spawns nothing; pool/bus
teardown — no pool/bus).

### 11. microbundle (+ alias plugin)

Problem: in-memory esbuild bundling of config/
fragment sources with module-id aliasing
(aliasPlugin: exact-match onResolve to absolute
paths, e.g. @reference-ui/system → CLI entry,
plugins/alias.ts:8-17) plus shared option
assembly (build-options.ts) and externals
(externals.ts).

Neo: PORTED AND IMPROVED. Neo lib/microbundle
is self-described "Neo-owned copy" (file
headers); diff-verified vs legacy: panda
externals dropped (@pandacss/dev, tsup,
unconfig…), react/react-dom externalized,
sourcemap/outfile support added, js/map
disambiguated by extension (not output order),
plus Neo's own react-stub plugin
(plugins/react-stub.ts — zero-runtime proxy).

Verdict: SKIP (already stolen; Neo's deltas are
its own hardening — nothing to take back).

### 12. paths/ + global registry

Problem: one home for path resolution — outDir,
tmp (outDir/tmp + project tmp), virtual dir,
ref-config discovery, core self-location for
worker entries + bundled entry basenames
(lib/paths/index.ts:1-14; virtual-dir.ts:5;
core-dist, core-package-dir) — plus a GLOBAL
cross-project registry
(~/.reference-ui/registry.json: projectPath →
{configPath, lastActive}): sanitized on read
(:31-66), atomic tmp+rename writes (:88-98),
corruption → .bak + fresh (:57-65),
REF_REGISTRY_PATH override (:26), writes
never-fatal (:95-97). Writers: core registers
every project on config load (config/load.ts);
readers: the MCP server (project
discovery/switching — outside legacy src;
matrix/mcp scope per Worker C).

Neo: partially ported WITH INTENT. Neo
lib/paths/index.ts:1-6 carries ref-config +
out-dir + tmp and states "The virtual dir and
the global registry deliberately do not come
across." Both correct: no mirror (see §3), no
MCP server yet (no registry reader exists).

Verdict: SKIP virtual-dir (dead with the
mirror) + SKIP core self-location (no workers/
tsup fan-out to locate). STUDY the registry
(global-registry.ts:31-98 — sanitize-on-read,
atomic write, never-fail, test override) as
CORE-BONES with steal-trigger: the day Neo
grows MCP project switching, this file is the
spec.

### 13. packager/ skim (sibling-owned — no duplication)

Skim-confirmed the NEO-PACKAGER study §1
firsthand: PACKAGES/RUNTIME/FINAL split
(packages.ts:117-130), PackageDefinition +
createBundleExports + getShortName (package/),
layout helpers (layout.ts), bundle→postprocess→
publish order (install/index.ts:52), named
postprocess registry (postprocess/index.ts:22:
injectLayerName, rewriteTypesRuntimeImport),
externals policy (bundler/esbuild.ts:6-23 —
notably NEVER @reference-ui/react/system:
self-contained bundles), install modes
(build.ts:4 copy vs dev.ts:4 symlink). No
disagreement with any direction they logged —
their externals read (self-contained bundles as
the HERMDIV answer) matches the files, and
their leave-behind list (workers, ts/ fan-out,
injectLayerName, copy-mode install,
writeIfChanged, asset dir-copy) is sound. One
cross-link for their assembly: the §3 staging-
swap (publishStagedDir) belongs in their
`assembleSystem` consideration set — failure
atomicity is currently NOBODY's item (Neo
catch-clean deletes; legacy restored).

### 14. corroboration: the sync recipe (Tokyo item 7)

Legacy sync/command.ts:19-34 is the ~15-line
recipe Tokyo item 7 already crowns (bootstrap,
then init* hub owning nothing); run.ts:5 wraps
it via runCommand (lib/run/index.ts:14: catch →
red ✗ + exit 1); index.ts re-exports the thin
surface. Neo sync/index.ts:143 is the 100-line
kitchen-sink counter-exhibit (Tokyo item 7's
"2600+ lines across 19 entries" starts here).
Nothing new — recorded so the survey covers the
"session/…paths/registry" brief plus the recipe
it orbits: STEAL, already adopted by the map.

### Ranked STEAL list (top 5, by Tokyo leverage)

1. Session ready-edge protocol (§1: state.ts,
   files.ts:33-52, public.ts:58-96, watch.ts) —
   the cross-process readiness contract; unlocks
   the entire bundler/HMR story and any editor
   integration. Prerequisite for #2.
2. Vite defer-until-ready + single-flush payload
   (§5: hot-update-policy.ts:21, hot-updates.ts:6,
   plugin.ts:113-134) + bundlers/ substrate (§4)
   — Neo's biggest missing consumer-visible
   capability; lands as one program with #1.
3. Watch-lock O_EXCL single-owner (§1:
   files.ts:87-110, watch-lock.ts:10) — tiny,
   prevents the live concurrent-watch corruption
   hazard; stealable independently of #1.
4. Staging-swap publish (§3:
   lib/fs/publish-staged-dir.ts:66 via
   staging.ts:42) — failed syncs should restore
   previous-good, not delete (Neo
   sync/index.ts:253-255); home: packager
   assembly; CORE-BONES atomicity exhibit.
5. Failure boundary + force-exit shutdown (§10:
   failure-boundary.ts:15-32, shutdown.ts:106-110)
   — resident watch must neither hang on Ctrl-C
   (unbounded stop()) nor die raw on uncaught
   throws; smallest STEAL on the list.

Findings filed, not fixed (read-only crew):
NIT-1 (bin/neo.ts:13 misses 'types' in
LINKED_PACKAGES → orphaned junction after
`neo clean`; NEO-PACKAGER derivation fixes it),
NIT-2 (bin/neo.ts cmdClean bypasses cleanDir
retry, sync/clean.ts:31), watch circuit-breaker
delta (§2), mixed-A/B comment steal (§9b).

## Tick — parked; NEO-PACKAGER alive (WORKING § filed, fixture tsup + tree products landing), LEGACY-SURVEY DONE filed, no action.

## PKG-STABILITY (crew, 2026-09-23) — DONE

Scope (strict): stability fix ONLY — hermetic HERMDIV
confirmation + minimal package-shape fix + matrix chain
re-gate. No PostCSS migration (packed-css.ts untouched),
no layout moves, no sync slimming, no rearch. Skills
`agent-neo` + `test-core` loaded first (`pnpm agent`
only for matrix/playwright; no raw runners, no /tmp
consumer repros). Read: LOG-2 HERMDIV interim + ticks,
PLAN_TOKYO.md items 1+6. Crews never commit; report,
don't land.

### 1. CONFIRM — hermetic root cause, byte proof

Technique (ordered, both reverted after): temp exfil
spec `matrix/tests/chain/T1/tests/e2e/zz-debug.spec.ts`
(deliberately-failing expect carrying a JSON payload:
DOM class attributes, consumer-`css()` probe over the
tier's own bundle URL, loaded `react.mjs` resource
URLs, sheet stats + head, paint) + temporary FAIL-ROW
printer in `pipeline/.../playwright-reporter.ts`
`onTestEnd` (double-escaped `\\n`, 8000-char cap; full
output surfaces — no truncation in reporting.ts).

Native exfil (`pnpm agent playwright --dir
matrix/tests/chain/T1 --no-build -g zz-debug`):
DOM `extend-library__bg-c_fixtureDemoBg
extend-library__c_fixtureDemoText ...` (7 classes);
consumer probe `chain-t1__bg-c_fixtureDemoBg
chain-t1__c_fixtureDemoText` (DIFFERS from DOM → two
bundles); `reactUrls` TWO (`/.../T1/.reference-ui/
react/react.mjs` + `/@fs/.../fixtures/extend-library/
.reference-ui/react/react.mjs`); sheet 3660B, 27
extend hits, head `@layer extend-library, chain-t1;`;
paint `rgb(15, 23, 42)`.

Hermetic exfil (`pnpm agent test
--packages=@matrix/chain-t1`, FAIL-ROW output):
DOM `chain-t1__bg-c_fixtureDemoBg
chain-t1__c_fixtureDemoText ...` (same 7 slots,
CONSUMER prefix); consumer probe byte-EQUAL to DOM
(single bundle); `reactUrls` ONE (consumer's only);
sheet 3660B / 27 / same head — BYTE-IDENTICAL to
native; paint `rgba(0, 0, 0, 0)`.

Root cause CONFIRMED hermetically: the packed
fixture dist's `@reference-ui/react` import resolves
to the CONSUMER's bundle in the container (no nested
provider exists in the installed tarball) vs the
fixture's OWN junction natively. Consumer-system
`css()` emits `chain-t1__*` classes for fixture
components; the merged sheet carries only
`extend-library__*` rules → triage-identical unstyled
paint despite a byte-identical sheet. HERMDIV
interim's "presumably" is now measured fact.

### 2. FIX — minimal ship-shape change (5 files)

Fork analysis: (a) fixtures ship their own runtime
bundle, (b) consumer adopts the upstream runtime,
(c) minimal ship-list/externals change. (b) REFUSED
(engine rearch: `css()` cannot attribute calls to a
system — multi-system registry work, out of wave).
Ship-list needs NOTHING (`files[]` already ships
dist; bundling changes dist bytes only). So (a)==(c):
drop the 4 `@reference-ui/*` lines from the 5
extend/meta tsup `external` lists → fixtures inline
their own system-bound runtime at build, like the
layer fixtures ALREADY do (layer tsup has no such
externals; layer dist imports only `react` —
verified pre-fix). Kept external: `react`,
`react/jsx-runtime` (host-provided, dispatcher-safe),
meta `@fixtures/*` (declared deps, installed nested).

Why the externals existed: Panda-era leftover. Panda
classes are content-hashed and system-independent,
so the provider never mattered; Neo classes are
system-namespaced (`name(query, tables,
active.system)`), so the provider IS the emitted
prefix. A packed fixture must be self-providing.

Files (only): `matrix/fixtures/{extend-library,
extend-library-2,meta-extend-library,
meta-extend-library-2,
meta-extend-library-sibling}/tsup.config.ts`.
No neo/src, no pipeline, no matrix-suite changes.

CONVERGENCE (disclosed, not mine): sibling
NEO-PACKAGER crew independently diagnosed the same
fork mid-flight and refactored my 5 files' literals
into `SHIPPABLE_UNIT_EXTERNALS` imports from their
new `src/packager/externals.ts` (values identical:
`['react', 'react/jsx-runtime']` + meta `@fixtures/*`;
my comments kept + ownership lines). Current tree
carries their spelling; my proofs below ran on
values identical under both spellings (native T1 on
my literals; hermetic re-gate across the rewrite
window — externals values, hence dists, identical
either way). Landing-shape choice (literal vs
import) is the captain's; either proves the gate.

### 3. PROVE — gates (all firsthand, commands verbatim)

- Fixture builds (real path): `pnpm run build`
  (sync + tsup + tsc + build-package asserts) exit 0
  in all 5 changed fixtures. Dist sweep: all 7
  `dist/index.mjs` carry ZERO `@reference-ui/*` and
  ZERO `@fixtures/*` imports (only `react`);
  `registerRuntimeData` bundled (4 hits, extend).
  (One transient red mid-flight: source-shim sync
  failed on sibling's half-written packager edit;
  green on retry — sibling's tree, not this fix.)
- Native T1 post-fix: `pnpm agent playwright --dir
  matrix/tests/chain/T1 --no-build` → 7 passed (0
  failed). Bundled dist paints identically.
- Full Neo suite: `pnpm agentneo run` → 197/197 ok
  (exit 0, last-run.json), incl. CHAIN-01..06,
  CLI-01/02, WATCH-01, all REF. (No neo files
  touched by this wave; suite is regression proof.)
- Hermetic re-gate, per-package (fail-fast is
  hard-coded; D17 reds expected): `pnpm agent test
  --packages=@matrix/<pkg>` × 12:

| Pkg | Hermetic | Native | Match |
|---|---|---|---|
| chain-t1 | unit 3/3; PW 7/0 | 7/0 | EXACT, was 4/3 |
| chain-t2 | unit 3/3; PW 2/1 | 2/1 | EXACT (D17 row 4) |
| chain-t3 | unit 3/3; PW 6/1 | 6/1 | EXACT (D17 row 8) |
| chain-t6 | PW 5/0 | 5/0 | EXACT |
| chain-t7 | PW 5/0 | 5/0 | EXACT |
| chain-t8 | PW 4/0 | 4/0 | EXACT |
| chain-t9 | PW 3/3 | 3/3 | EXACT (D17 rows 20/21/22) |
| chain-t10 | PW 2/1 | 2/1 | EXACT (D17 row 24) |
| chain-t11 | PW 3/0 | 3/0 | EXACT |
| chain-t12 | PW 2/1 | 2/1 | EXACT (D17 row 28) |
| chain-t13 | PW 3/1 | 3/1 | EXACT (D17 row 31) |
| mcp | 18 files, 73/73 | — | GREEN (packed-fixture consumer) |

- D17-only rigor: native line-reporter capture on
  the 6 red tiers post-fix shows the failing titles
  are exactly triage rows 4 (T2-L18), 8 (T3-L50),
  20/21/22 (T9-L31/L38/L45-test=L65-assert),
  24 (T10-L30), 28 (T12-L30), 31 (T13-L42) — all
  layers legs. Hermetic counts equal native on all
  12 → same transfer rule as triage (names follow
  counts). Zero fix-now rows remain; the 8 reds are
  the filed D17 deferral (+HQ land ruling pending).
- Evidence: /tmp/pkgstab-{t1..t13,mcp}.log
  (hermetic), /tmp/pkgstab-nat-{T2,T3,T9,T10,T12,
  T13}.log (native titles). Full-run T1 exfil
  payloads in §1 (native + hermetic runs).

### Hygiene + DONE

Diagnostics reverted BEFORE the fix landed in the
gate: reporter patch restored byte-identical
(`git diff` empty), zz-debug spec deleted,
test-results removed. Final footprint: the 5 tsup
configs (externals values; spelling now the
sibling's import per CONVERGENCE) + this log.
Everything else in the tree is other sessions'
(LOGs, NEO-PACKAGER refactor). No commits, index
untouched, no installs in-repo beyond the ordered
builds (dists/.reference-ui gitignored).

PKG-STABILITY DONE: hermetic confirmation with byte
proof (consumer-bundle resolution) + minimal fix in
tree (fixtures self-provide the system-bound
runtime) + green gates (Neo 197/197, hermetic 12/12
count-identical to native, D17-only reds). HERMDIV
closed: T1 hermetic was 4/3, now 7/0. Report, don't
land. Open for captain: landing spelling
(literal-vs-import) + D17/H4 land ruling.

## OBJECTIVE 2 COMPLETE (captain, 2026-09-23) — chain gate green, core retired
- Chain gate: T1-T13 green native AND hermetic, verified FIRSTHAND by captain on final bytes (native 7/2/6/5/5/4/3/2/3/2/3 passed; hermetic identical incl. T1 7/0 flip from 4/3). 8 staying reds are the triaged D17 parks (rows 4/8/20/21/22/24/28/31), failing-set identity by elimination. Neo units 323/323, q 0 errors, chain cases 6/6, all firsthand.
- Path: typegen widen → PACKED merge (22ed06156, 8fcb16b51) → HERMDIV diagnosis (fixture runtime externalization) → NEO-PACKAGER concept from legacy (1395abd8d) fixing it through owned externals policy.
- Core retirement: packages/reference-core removed, moved-from paths cleared (b833ed235), museum preserved at packages/reference-legacy.
- Landing sweep: tree clean, zero diagnostic leftovers (no FAIL-ROW/bust/zz-spec), museum untouched. Voyage park still holds for new work: LANDING NOT dispatched — HQ's call.

## SYMLINK-ADOPT (crew, 2026-09-23) — all link handling onto src/lib/symlink/

### Hunt (whole neo tree, tests excluded)
Grep for `symlinkSync|unlinkSync|readlink|isSymbolicLink|junction|
symlink-dir` over `packages/reference-neo/{src,bin,tests}` plus a
`node_modules`-scope sweep found exactly two product ad-hoc sites —
`sync/clean.ts` carries no link code (retry-rm only, untouched):
- `src/sync/publish/links.ts` — `replaceLink` hand-rolled junction
  replace (lstat/unlink-or-rm + `symlinkSync(..., 'junction')`).
- `bin/neo.ts` — `isGeneratedLink` (lstat/readlink guard: symlink
  pointing inside outDir) + raw `unlinkSync` in `removeScopeLinks`.
- Fixture/assertion uses left alone per brief: `scan-native.test.ts`
  + `bin/neo.test.ts` plant links, `sync.test.ts` /
  `reference-types.test.ts` / case specs assert `isSymbolicLink`.

### Pre-existing break found in the module (fixed, not worked around)
The port landed red: `import symlinkDir from 'symlink-dir'` +
`symlinkDir.sync(...)` is the v9 API (legacy pins ^9.0.0); Neo
depends on ^10.0.3, whose surface is named `symlinkDirSync` only.
`createSymlink` was dead code (README: "Nobody yet") that could
never run — q failed TS2613 on it at HEAD (verified via stash),
and `agentneo run`'s typecheck gate would refuse every case. Now
`import { symlinkDirSync } from 'symlink-dir'`; v10 overwrites by
default and absorbs the dangling-link case `prepare()` misses
(`existsSync` follows links). No logic change otherwise.

### Module extension (genuine gap, with tests + README)
Legacy's clean removes scope entries unconditionally
(`removeSymlinkOrDir`); Neo's clean keeps hand-placed dirs — a
guard the module did not offer. Added `removeGeneratedLink(
linkPath, outDir): boolean` to `src/lib/symlink/index.ts`: true +
unlinked only when a symlink points at-or-inside outDir (lexical
check, no existence probe — clean wipes the folder first so
generated links dangle by then); missing paths, files, real dirs,
and outside links stay put. README owns-list + Consumers updated.

### Migration per site (ad-hoc copies deleted, no dead helpers)
- `links.ts`: `replaceLink` deleted; leg calls `createSymlink` per
  package. Precondition verified at every caller: assembly creates
  all four target dirs before the links leg; benchmark
  `worker-phases.ts` likewise (untouched). `reference-types.test.ts`
  fixture created only styled/react/types — added the missing
  `mkdirSync(outDir/system)` (it tests the ad-hoc code's caller).
  Behavior notes: already-correct links are now a no-op instead of
  unlink+recreate; missing targets fail loud (Windows-required)
  instead of silently dangling.
- `bin/neo.ts`: `isGeneratedLink` deleted; `removeScopeLinks` calls
  `removeGeneratedLink`. Behavior identical (same guard, same
  count); `neo clean` artifacts still covered by `bin/neo.test.ts`
  + NEO-CLI-01.
- Final grep: raw `symlink/unlink/readlink/isSymbolicLink` in
  product code lives only in `src/lib/symlink/{index,prepare}.ts`.

### Proof (all firsthand, this session)
- `pnpm agentneo q` (whole package): 0 errors, 17 warnings
  (non-failing; 1 is the new describe block over the 80-line warn
  line, rest pre-existing). Touched-paths gate run after every
  generation step, per skill.
- Full Neo unit suite (`pnpm exec vitest run` in
  `packages/reference-neo`): 48 files / 337 passed (323 Obj-2
  baseline + 4 port tests + 10 new for `createSymlink` /
  `removeGeneratedLink` incl. sibling-prefix trap + dangling-link).
- Chain cases (links leg touches every sync): NEO-CHAIN-01..06 all
  PASS (transitive, diamond, parallel, multi-extends, depth,
  real-upstream). Plus NEO-CLI-01 PASS (clean lifecycle incl.
  `neo clean` scope-link removal — the `removeGeneratedLink` proof).
- Native matrix tier T1: `neo sync` in `matrix/tests/chain/T1`
  exit 0, all four scope links land and resolve
  (`@reference-ui/{system,styled,react,types}`); `pnpm agent
  playwright --dir matrix/tests/chain/T1 --no-build` → 7 passed
  (0 failed) + PASS banner.
- Hygiene: 6 files changed, all Neo (`bin/neo.ts`, links leg,
  symlink module + tests + README, one fixture line); no
  matrix/fixture edits (T1 sync outputs gitignored); no commits;
  no diagnostic leftovers.

### Open for captain (flagged, not freelanced)
- `bin/neo.ts` hardcodes `LINKED_PACKAGES = [system,styled,react]`
  while the leg links all four PACKAGES incl. `types`: `neo clean`
  leaves the types link dangling. Legacy's clean iterates
  PACKAGES. One-line unification available; withheld as a behavior
  change beyond this brief.

SYMLINK-ADOPT DONE: every link call-site routes through
lib/symlink + suite/cases/T1 green. Report, don't land.

## COLLECT-REFACTOR (Tokyo item 3 — motion + naming only, zero logic change)

Crew brief: dissolve the `base/` + `lib/` split, rename
`src/fragments/` → `src/collect/`, extract root `constants.ts`, write
the serious README, prove behavior-identical. Crews never commit;
report, don't land.

### Layout rationale (one paragraph)

The old boundary was honest about nothing: `base/` held the pipeline
(prepare, evaluate, merge, bootstrap, goldens) while `lib/` held the
machinery the pipeline is made of (scan, bundle, collect), so every
real operation crossed it. The new layout is flat by stage with one
real subdirectory: `api/` keeps its exact shape (HQ: liked, stays);
`evaluate.ts` is the evaluate-once orchestration (prepare → evaluate →
spec assembly, kept whole because splitting it would redraw function
boundaries — a logic touch, not motion); `merge.ts` is the object-merge
primitives it calls; `collector.ts` / `runner.ts` / `types.ts` are the
collector seam, no longer pretending to be a library of something else;
`bootstrap.ts` is the lone bootstrap module; `scan/` is the one true
subdirectory because discovery is the one true sub-pipeline (TS
scanner, native single-read twin, differential-battery helpers, scale
goldens, and all eight scan suites colocated). The seven literals the
stages shared — including `CURRENT_FRAGMENT_SOURCE_GLOBAL_KEY`,
duplicated verbatim in two files — now live once in root
`constants.ts`. Kebab filenames de-kebabbed only where pure naming
(`scanner-native.ts` → `scan/native.ts`, `bootstrap-import-map.ts` →
`bootstrap.ts`, the `scan-*` test pile de-prefixed inside `scan/`);
every exported identifier (`scanFragmentFiles`, `prepareFragments`,
…) is byte-identical, so sync call-sites needed import-path-only
edits and the sibling SYMLINK-ADOPT crew's hot zone stayed cold.

### Rename map

- `src/fragments/` → `src/collect/` (top-level subsystem, stays
  top-level per HQ ruling).
- `base/index.ts` → `evaluate.ts` (re-exports
  `UPSTREAM_FRAGMENT_SOURCE` so its surface is unchanged).
- `base/index.test.ts` → `prepare.test.ts` (it tests the prepare flow;
  the vitest `doMock` of the dissolved barrel became two targeted
  mocks of `./scan/native.ts` + `./runner.ts` — the suite never
  touches the sync scan path, so the retarget is unobservable).
- `base/merge.ts` → `merge.ts`; `base/evaluate.test.ts` →
  `evaluate.test.ts`; `base/bootstrap-import-map.ts` → `bootstrap.ts`
  (path math `'..','..'` → `'..'` — same resolved entries, pinned by
  `bootstrap.test.ts` + the prepare bootstrap-map test, whose own
  `'..','..'` → `'..'` expectation math moved with it).
- `lib/collector.ts` → `collector.ts`; `lib/runner.ts` → `runner.ts`;
  `lib/types.ts` → `types.ts` (minus the moved source-tag const).
- `lib/index.ts` barrel DELETED (dissolved; every consumer rewired to
  the real homes).
- `lib/scanner.ts` → `scan/scanner.ts` (keeps re-exporting
  `RETENTION_EXCLUDE` so its surface is unchanged);
  `lib/scanner-native.ts` → `scan/native.ts`;
  `base/scan-native-helpers.ts` → `scan/helpers.ts`;
  `base/fixtures/` → `scan/fixtures/`.
- Scan suites: `scan-crossings` → `crossings`, `scan-goldens` →
  `goldens`, `scan-native-completeness` → `nativeCompleteness`,
  `scan-native-lifecycle` → `nativeLifecycle`, `scan-native` →
  `native`, `scan-retention` → `retention`, `scanner-identity` →
  `identity`, `scanner-native` (walk-completeness battery) →
  `nativeWalk` (avoids the `native.test.ts` collision).
- NEW: `constants.ts` (7 extracted literals, comments moved with
  them), `README.md` (what it collects, the
  scan→bundle→prepare→evaluate→merge pipeline, module layout in
  prose, what it does NOT own).
- External import-path-only edits (5 files, no logic): `src/author/`
  (4 lines), `src/sync/index.ts` (1 line), `src/sync/
  lib-barrel-negation.test.ts` (1 line),
  `benchmark/deepsee/worker-phases.ts` (1 line),
  `tools/build-bin.mjs` (path-literal registry entry).
- Docs: `docs/DOMAIN.md` records the decision (`collect` subsystem
  entry; `above/below the cut` + `fragments`-as-units updated in the
  same pass); `PLAN.md` subsystem enumeration; `src/README.md`
  directory ref; `tsconfig.build.json` comment (depth rationale
  reworded — see smells); 14 case-doc path cites incl. the
  `mergeCollectedSpec` line cite (`:255` → `evaluate.ts:286`).
- Deliberate NON-changes (zero behavior change): bench
  `fragments.prepare` / `fragments.evaluate` phase labels (emitted
  strings); test-local `NEEDLES` copies in `scan/helpers.ts` +
  `identity.test.ts` (battery self-containment); the
  `neo-scanner-identity-` tmpdir prefix; README pipeline prose
  ("fragments in" = the units, still true); `docs/evidence/` +
  `docs/archive/` (read-only/archived); `PLAN_TOKYO.md` item 3 (the
  brief record itself — captain marks convergence);
  `OPERATION_TOKYO.md` §domain line still says `fragments` —
  flagged for the captain (mission files are HQ records, not
  crew-editable).

### Smells found, NOT fixed (mandate: log, don't fix)

- `scan/helpers.ts` + `identity.test.ts` each carry a third and fourth
  copy of the needle list. Unifying them with `constants.ts` is a
  3-line change but touches battery self-containment; left for a
  followup crew with a differential re-proof.
- `evaluate.ts` (409 lines, was 426) and `mergeCollectedSpec`
  (5 params) and `classifyScanSuffix` (cyclomatic 12) all sit on the
  q-gate warn line — pre-existing shape, warn-only, non-failing.
- `tsconfig.build.json` FIX-3 comment cited "different depths" as the
  anti-bundling rationale; `collect/bootstrap.ts` now sits at the
  same depth as `config/bundle.ts`, so the comment was reworded to
  "per-module" (the mechanism — dist mirrors src — is unaffected and
  the build proves it).

### Proof (all observed this session, shared tree)

- `tsc --noEmit -p tsconfig.json` → clean, zero errors.
- `node tools/build-bin.mjs` → `dist ready: 302 files` (validates the
  build registry edit + bootstrap path math under the dist layout).
- `pnpm agentneo q` → `0 errors, 17 warnings, 214 files` (6 warns in
  collect/, all pre-existing shape per pre-move line counts).
- Full Neo unit suite (`vitest run`) → **48 files / 337 tests, all
  green** (incl. retargeted `prepare.test.ts`, goldens bit-exact
  reproduction, crossings census).
- FULL `pnpm agentneo run` → **197/197 `ok`** in
  `tests/.artifacts/last-run.json` (all cases, not just chain).
- Native T1 sync-consumer smoke: `neo sync` in `matrix/tests/chain/T1`
  → 122ms, exit 0; `playwright test` → **7/7 passed**.
- No-panda pass over `src/collect/`: clean. Sibling note: no hot-file
  collision — neither `src/sync/index.ts` nor
  `lib-barrel-negation.test.ts` was touched by SYMLINK-ADOPT; my
  sync edits are one import line each.

COLLECT-REFACTOR DONE: collect subsystem in place + full suite green
+ T1 smoke green. Report, don't land.

### Addendum — HEAD moved mid-run (no action, recorded)

Three captain commits landed during this crew's proof window
(`68521e9c3`, `5f42dd04e` item-8 census/decision, `b41eb42fb` README
rewrite) and the index was reset, so the motion sits unstaged
(`src/fragments/` deleted + `src/collect/` untracked in the worktree).
All three commits touch `PLAN_TOKYO.md` / `README.md` only — zero code
impact, all proofs above ran against this exact worktree, and the new
README carries no `fragments` refs. Item 8 ("author dies, fork B,
folded into collect wave") noted as a followup wave — outside this
crew's item-3 brief, not freelanced.

## Tick — all objectives COMPLETE; AUTHOR-KILL running (fresh, no writes yet — not stuck), collect surface/lib delta in captain's hands, no action.

## AUTHOR-KILL (Tokyo item 8, fork B — 2026-09-23) — DONE

Crew brief: delete `src/author/`, keep the `@reference-ui/neo` id
answering from a minimal root barrel with the true public set only.
Crews never commit; report, don't land.

### Coordination (sibling COLLECT-REFACTOR)

Arrived mid-rename (`collect/api/` live, `surface/` absent), so the
barrel waited per the brief: poll read-only, wire against the DECIDED
paths only, never freelance. The sibling converged `collect/surface/`
+ `collect/lib/` during the wait; the captain then landed it
(`e091c008a`, `863960c65` "author unblocked"). All edits below went
onto that converged tree. Two one-line repoints land in
`collect/lib/` (`bootstrap.ts` alias target, `prepare.test.ts`
expectation) — post-convergence wiring the wave requires, not
mid-flight interference. No hot-file collision: the sibling's motion
was committed before the first write.

### Census re-verified (read-only, this session)

- Value imports of the id in-tree: exactly `defineConfig`,
  `tokens`, `globalCss`, `font`, `keyframes` (+ types). The lone
  `baseSystem` hit is a generated-`.mjs` import, not the id.
- `create*Collector` importers outside `collect/`: zero (only the
  old `author/` re-export). Non-re-export IS the split.

### The kill

- NEW `src/index.ts`: root barrel, true public set only —
  `defineConfig` (+`BaseSystem`, `ReferenceUIConfig`) from
  `./config/types.ts`, the four collector calls (+ their types)
  from `./collect/surface/index.ts`. Factories stay defined in
  the surface files, not re-exported. Surface barrel imported
  directly (not the collect barrel) so config bundles never drag
  evaluate/scan machinery — same graph shape as the old entry.
- MOVED `src/author/system-surface.d.ts` →
  `src/system-surface.d.ts` (content untouched).
- DELETED `src/author/` entirely. Zero `author/` path survivors in
  code (grep over src/tests/tools/bin/playground/benchmark/tsconfig).
- Repoints: root `tsconfig.json` (both ids), `config/bundle.ts`
  alias target, `config/constants.ts` + `bundle.test.ts` prose,
  `tools/build-bin.mjs` TWINS (`src/index.js`→`src/index.ts`),
  13 world tsconfigs, `collect/lib/bootstrap.ts` (+ doc line),
  `collect/lib/prepare.test.ts`, `docs/DOMAIN.md` author-surface
  entry (`src/index.ts`, factories excluded).
- No vite alias, no harness-server alias, no world-HTML id map
  exists — verified by grep. All in-repo id imports are fixture
  strings or world sources resolved by sync aliases / tsconfig
  paths; nothing resolves the id through node_modules.

### Real "." export — DONE (was: assess)

Clean with the dist/bin story, so implemented, not logged:
`".": "./dist/src/index.js"` beside `./runtime`. Rationale:
tsc already emits `src/index.js` + `index.d.ts` (include: src,
declaration: true), the twin is laid by the TWINS edit and
asserted by the build registry, and no current resolver changes
behavior (all alias/paths-driven). Node probe post-build:
`import('@reference-ui/neo')` →
`defineConfig,font,globalCss,keyframes,tokens` exactly;
factory-leak probe negative. Follow-up noted: `@reference-ui/neo/config`
(and the core/cli compat ids) stay alias-only by design — no
`./config` subpath added, scope kept minimal.

### Proof (all observed this session, converged tree)

- `node tools/build-bin.mjs` → `dist ready: 333 files`
  (registry + twin math green under the new layout).
- `tsc --noEmit -p tsconfig.json` → clean.
- Full Neo units (`vitest run`) → **48 files / 337 tests, all
  green**.
- `pnpm agentneo q` → `0 errors, 17 warnings, 214 files`
  (warn count identical to the pre-wave proof).
- FULL `pnpm agentneo run` → **197/197 `ok`** in
  `tests/.artifacts/last-run.json`.
- Native T1 chain tier: `neo sync` in `matrix/tests/chain/T1` →
  116ms, exit 0; `playwright test` (via `pnpm agent run`) →
  **7/7 passed**.
- No-panda pass over new/changed sources: clean. No diagnostic
  leftovers (no scratch files; dist + last-run.json gitignored).

AUTHOR-KILL DONE: author/ gone + id answering + full suite green
+ T1 green. Report, don't land.

## NIGHT-5 — primitives codegen spec (Tokyo 3.9 end-state)

Read-only spec crew, 2026-09-23 overnight. Read Tokyo 3.9 fully
(`packages/reference-neo/PLAN.md` §3.9 + §4 overnight item 5) plus
every source below firsthand. Zero tree writes except this section.

ASSUMPTION (flagged per brief): no NIGHT-4 home section exists in
this log at filing time (`grep NIGHT` empty). Proceeding on the HQ
lean — **RS emits, Neo proves** (PLAN.md §3.9 SHAPE, converging).
If NIGHT-4 lands a different home, §4 waves re-sequence but §§1–3
survive: the artifact shapes and station list are home-agnostic.

### Evidence read (all firsthand, current tree)

- Neo hand-mirrors (the three copies 3.9 names): `src/primitives/tags.ts`
  (101 tags, HTML only), `src/primitives/generate/generate.ts`
  (`generateReactEntrySource` / `generateReactTypesSource`, header admits
  "mirrors the typegen shape until typegen wires in"),
  `src/primitives/generate/react-surface.d.ts` (hand-mirrored stable
  surface, `StylePropName = string` wide on purpose).
- Neo runtime trio: `src/primitives/runtime/{factory,split,context}.ts`
  (forwardRef factory, `ref-${tag}` marker, compiled-names splitter +
  `_`/`&`/`@` condition arms, Symbol.for contexts, `data-layer` /
  `data-color-mode` / `data-variant` stamps).
- Neo per-system assembly: `src/sync/react.ts` (`publishReactBundle` —
  react.mjs bundled, react external, no react-dom, css/recipe
  pre-registered over runtime-data) + `src/sync/publish/types-bundle.ts`
  (`publishTypesBundle` — live `import('@reference-ui/rust/typegen')`
  `emitDtsSync`, react StyleProps wired onto the styled index, named
  graph appended: `PrimitiveProps<T>`, `css`, `recipe`,
  `RecipeVariantProps`).
- RS sources of truth: canon `generate/overlay/primitives.ts` (101 HTML
  + 24 SVG tags, SVG in React camelCase), generated `src/html.rs`
  (`ELEMENTS` 125 entries, `Element{html,jsx}`, `PRIMITIVE_JSX`,
  `is_reference_primitive`; **SVG spellings lowercased — see F1**),
  `src/lib.rs` (`is_known_style_prop` = reference-prop || alias ||
  property, plus `--*`), `src/dialect.rs` (`ALIASES`, `REFERENCE_PROPS`
  = colorMode/r/size/variant/weight), `src/conditions.rs`
  (`NAMED_CONDITIONS`), `src/css/{properties,color}.rs`
  (`CANONICAL_PROPERTIES`, `COLOR_PROPERTIES`).
- Typegen contract: `SPEC.md` (28/28 proven; `emit_dts` open-mode,
  `emit_dts_with` strict; StyleProps = canon color props + `bg` +
  p/mt aliases + canonicals + canon `*Radius` + dialect
  container/recursive-`r` + FontProps; KNOWN GAPS: `gap` omitted,
  STYLE-02 box-spacing only; `rounded*` refused; `js/index.ts`
  `emitDtsSync` = JSON-over-napi, no fs).
- Distribution precedents: (a) tasty d.ts = VENDORED committed copy
  (`tools/vendor-rust-tasty-dts.mjs`, regen + `--check`, NodeNext
  rewrite, closure from dist tops); (b) typegen emit = LIVE sync-time
  `import('@reference-ui/rust/typegen')`. The spec below uses both,
  split by consumer (typecheck-time → vendored; sync-time → live).
- Station conventions: `tests/cases/{prim,type}/{SPEC,TESTS}.md`
  (PRIM-01..15 + TYPE-01..08 all done; ids append-only, never renumber;
  `case.json` = `{id, name, sync}`; type proofs = `tsc --noEmit` on
  positive + negative worlds, negative pinned to a TS error code).

### Findings that shape the spec (new, firsthand)

- **F1 — canon dropped the React SVG spellings.** Overlay source has
  `clipPath`, `linearGradient`, `radialGradient`, `foreignObject`;
  generated `html.rs` stores `clippath`, `lineargradient`,
  `radialgradient`, `foreignobject` (all 125 verified by grep). React
  DOM requires the camelCase host spellings for SVG. The emission
  vocabulary therefore needs a THIRD column (`dom`: React-correct host
  tag) that canon's Rust tables cannot supply today — but the TS
  overlay still holds it. The generator must capture it at
  generate-time (TS side), not reconstruct it in Rust.
- **F2 — the set grows 101 → 125 if canon rules.** Neo pins 101
  (`tags.test.ts`, PRIM-09 census); canon `ELEMENTS` = 125 (101 HTML +
  24 SVG: shapes path/circle/rect/line/polyline/polygon/ellipse,
  text/tspan, use/g/defs/image/view/symbol/switch/marker/pattern,
  clipPath/mask, linearGradient/radialGradient/stop,
  foreignObject). Extract already treats them as primitives
  (`is_reference_primitive`). Emitting all 125 adds public names
  (`Path`, `Circle`, `G`, `Text`, `Switch`, `View`, `Image`, `Use`,
  `Marker`, `Pattern`, `Symbol`, `ForeignObject`, …) — a public-surface
  decision for the morning (default recommended: emit all 125; the
  alternative — HTML-only with an SVG allowlist wave later — is W6).
- **F3 — typegen's prop list is computable but not exported.** The
  StyleProps key set (color props + aliases + radii + dialect keys +
  conditions) is assembled inline by the style printer (`src/emit/
  style.rs` over canon tables). No function returns the key list alone.
  The "single source of truth" needs a refactor, not just a call:
  build a `PropDefs` struct first, print `emit_dts` from it, expose the
  names over napi beside `emitDtsNative`.
- **F4 — per-system binding is three bakes.** `generateReactEntrySource`
  bakes exactly (systemName → layerName, stylePropNames → splitter,
  factory/split/context paths) and `publishReactBundle` prepends the
  css/recipe pre-registration header. That is the complete list of what
  MUST stay Neo-side (it needs sync-time inputs). Everything else in
  the entry — the per-tag roster, the Props shapes, the unions — is
  system-independent and can move below the cut.

### (1) RS emission shapes

**New home: `packages/reference-rs/modules/primitives/`** (one way to
generate stuff; consumes canon + typegen as libraries, adds zero new
authority). Layout:

```text
modules/primitives/
├── README.md            purpose-first (3.9's SOURCE/GENERATOR/CONSUMERS)
├── generate/
│   └── generate.ts      ENTRY POINT — see below
├── js/                  authored runtime home (moved verbatim, see E3)
│   ├── factory.ts       from neo src/primitives/runtime/factory.ts
│   ├── split.ts         from neo src/primitives/runtime/split.ts
│   └── context.ts       from neo src/primitives/runtime/context.ts
├── generated/           committed generator output (never hand-edited)
│   ├── vocabulary.json  E1 — the machine contract
│   ├── primitives.mjs   E2 — raw system-unbound component module
│   └── primitives.d.ts  E4 — raw types (tasty-closure style)
└── tests/               RS-side goldens (vocabulary snapshot)
```

**Entry point: `pnpm --filter @reference-ui/rust run primitives` →
`modules/primitives/generate/generate.ts`** (canon-script precedent:
`pnpm exec tsx ./modules/primitives/generate/generate.ts`). It takes
canon overlay (TS — keeps F1 camelCase) + `primitives_vocabulary()`
over napi (F3 — typegen's own key list) and emits E1/E2/E4 in one run.
Deterministic bytes (sorted keys, fixed header); exits nonzero on any
fail-closed violation (F1 spelling table incomplete, alias target
unknown, jsx collision — e.g. `Text`/`Map` — unresolved).

**E1 — `vocabulary.json` (data, not prose).** The single machine
contract; Neo's per-system emitter and the station parity cases read
this, never Rust tables directly:

```jsonc
{
  "version": 1,
  "elements": [
    // 125 entries, sorted by jsx; dom = React-correct host spelling
    { "dom": "div", "jsx": "Div", "family": "html-flow" },
    { "dom": "clipPath", "jsx": "ClipPath", "family": "svg-container" }
    // … Obj/Var escapes + single-letter (A/B/I/P/Q/S/U) preserved …
  ],
  "stylePropNames": ["--custom", "_dark", "..."], // EXACT typegen key set
  "conditions": ["_dark", "_hover", "@sm", "..."], // NAMED_CONDITIONS + note
  "aliases": { "bg": "backgroundColor", "mt": "marginTop" },
  "reserved": ["className", "children", "colorMode", "variant", "css", "ref"],
  "elementOverrides": { "caption": "HTMLTableCaptionElement", "menu": "HTMLMenuElement" }
}
```

Notes: `stylePropNames` MUST equal the key set typegen's StyleProps
printer emits (same `PropDefs`, mechanically — F3 refactor is what
makes "the names typegen knows are the names emitted" true rather
than aspirational). `conditions` documents the lexical rule the
splitter implements (`_`/`&`/`@` prefixes, mirroring canon
`is_condition`) plus the named list. Families (11): html-flow,
html-text, html-form, html-table, html-media, html-interactive,
svg-shapes, svg-text, svg-gradient, svg-container, special (Obj/Var,
Map, caption/menu, single-letters, voids).

**E2 — `primitives.mjs` (raw system-unbound components).** One module,
125 named exports (`Div`, …, `ClipPath`, …), each a thin
`createPrimitive({tag: dom, displayName: jsx, …})` call with the
THREE sync-time binds left open via a single `configurePrimitives({
layerName, stylePropNames, css })` seam (returns the bound roster; the
unbound module never renders — same "unreachable by construction"
contract as today's eval-safe barrel). Neo's `publishReactBundle`
replaces its `generateReactEntrySource` string-building with: import
E2 (live, see §3) + call `configurePrimitives` + existing css/recipe
pre-registration header + bundle. No per-tag string building remains
in Neo.

**E3 — authored runtime moves, verbatim.** `factory.ts`/`split.ts`/
`context.ts` relocate to `modules/primitives/js/` with behavior
byte-identical (forwardRef, `ref-${tag}` marker, splitter + condition
arms, Symbol.for contexts, attr stamping). Rust never prints React
runtime — that would be the Liquid sin in a new coat (PLAN.md §3.4).
RS-side vitest covers the trio (moved tests); Neo station behavior
cases prove them through the bound roster.

**E4 — `primitives.d.ts` (raw types, tasty-closure style).** Printed
from the same run: `PrimitiveTag` (125 literals), `StylePropName`
(EXACT union — replaces both the per-world baked union AND the wide
`string`), per-tag `${Jsx}Props` + const decls (today's
`generateReactTypesSource` shape, minus the bake), `PrimitiveElement`
+ caption/menu overrides, `PrimitiveProps<T>` generic, contexts +
`useColorMode`. Typegen precision rides the SAME file: E4 imports the
central typegen index for `StyleProps` narrowing (today's
`stylePropsWiring` merge, but printed once in RS from `PropDefs`
instead of string-spliced in Neo at publish time). `react-surface.d.ts`
and the hand-mirrored per-world splice delete.

**Explicit non-emits (tripwires):** no `Box`/`Flex`/`Grid` (map rule,
fail-closed in the generator); no polymorphic `as`; no `styled()`/
jsx-factory; no per-recipe modules; no atomic class names in d.ts;
no `rounded*` (canon has none); no viewport keys as condition
defaults (`@sm` only, D8); no `@pandacss/*`.

### (2) Neo test-station case list

**New group `pgen`** (`tests/cases/pgen/`, own SPEC.md/TESTS.md; owns
the vendored vocabulary + the bound roster). New ids (append-only;
PRIM/TYPE ledgers untouched — PRIM-09/PRIM-10/TYPE-01 get re-anchored
assertions in W5, not renumbers). Behavior cases render through the
RS-emitted bound roster; type cases `tsc --noEmit` positive + negative
worlds against the vendored E4 with the negative pinned to a TS code.

Behavior (do they render/emit/resolve) — one per family + cross-cuts:

| id | name | claim |
|---|---|---|
| NEO-PGEN-01 | html-flow renders | flow probes (Div/Section/Main/…) render own tagName, paint a style prop + `css` prop, stamp `ref-*` marker + `data-layer` |
| NEO-PGEN-02 | html-text renders | text/phrasing probes (P/Span/Em/Code/…) incl. single-letters (A/B/I/P/Q/S/U) render + resolve responsive arrays with `null` holes |
| NEO-PGEN-03 | html-form renders | form probes (Input/Select/Textarea/Button/Label/…) keep native behavior (value entry, label association, submit) with style props applied, no key leakage as attributes |
| NEO-PGEN-04 | html-table renders | table probes (Table/Thead/Tbody/Tr/Td/…) render inside a real `<table>` (no DOM-nesting repair) + `Caption` paints |
| NEO-PGEN-05 | html-media renders | media probes (Img/Audio/Video/Source/Track/…) carry native attrs (`src`, `alt`, `controls`) through untouched + void elements (Br/Hr/Img/Input/…) render childless |
| NEO-PGEN-06 | html-interactive renders | interactive probes (Details/Dialog/Form/Select/…) toggle/open natively; `_hover` + `_dark` arms paint through the roster |
| NEO-PGEN-07 | svg-shapes render | shape probes (Path/Circle/Rect/Line/Polyline/Polygon/Ellipse) render correct camelCase tagNames inside `<Svg>` + take style props (fill/stroke via props, not attrs) |
| NEO-PGEN-08 | svg-text renders | Text/Tspan render + paint; `text` collision probe: SVG Text vs HTML semantics stay distinct elements |
| NEO-PGEN-09 | svg-gradients render | LinearGradient/RadialGradient/Stop render camelCase tagNames; `fill="url(#…)"` reference resolves and paints |
| NEO-PGEN-10 | svg-containers render | container probes (G/Defs/Use/ClipPath/Mask/Pattern/Symbol/Switch/View/Marker/Image/ForeignObject) render camelCase tagNames — F1 regression net |
| NEO-PGEN-11 | special-cased roster | Obj/Var render `object`/`var`; Map renders `map` without shadowing global `Map`; caption/menu refs land on the override elements; Box/Flex/Grid absent from the roster (map rule, runtime side) |
| NEO-PGEN-12 | set parity with canon | roster jsx set == vendored vocabulary elements == live canon `PRIMITIVE_JSX` (125); any drift fails — the freshness gate at test time |
| NEO-PGEN-13 | prop parity with typegen | bound splitter key set == vendored `stylePropNames` == live typegen `PropDefs` names; alias probe (`bg`/`mt`) resolves identically through roster and `css()` |
| NEO-PGEN-14 | metadata + passthrough | `variant` stamps `data-variant` + recipe class; `colorMode` stamps `data-color-mode`; `id`/`aria-*`/`data-*`/handlers/`ref` reach the host; style keys never leak (roster-wide sweep, extends PRIM-06/08) |

Type cases (validity AND invalidation) — positive file exit 0,
negative file exit ≠ 0 with the pinned code:

| id | name | must typecheck | must FAIL |
|---|---|---|---|
| NEO-PGEN-15 | style props valid everywhere | every family's probe with token props + `css` object/array + `_hover`/`@sm` arms | bogus key in `css={{…}}` → TS2353 (per TYPE-08 precedent) |
| NEO-PGEN-16 | token unions real | known literal at `ColorToken` position; `colors.*` prefixed value where P-prim-1 allows | `color="nope"` at `ColorToken` position → TS2322 (open-hatch positions stay permissive per TYP-STRICT-04 — the case documents which positions are/aren't hatches) |
| NEO-PGEN-17 | recipe variants | optional-axis selection object; compound row subset | wrong axis value → error (plain unions, not `ConditionalValue`, per TYP-RECIPE-01) |
| NEO-PGEN-18 | conditions + responsive | `_hover`/`@sm` keys, `[null,'4r']` arrays; bare `sm` ABSENT from keys (re-anchors TYPE-04 on E4) | bare-`sm` keyed object → error |
| NEO-PGEN-19 | refs + elements | `ref` per-tag host type incl. caption/menu overrides; `PrimitiveProps<T>` generic with argument | `PrimitiveProps` bare (no arg) → TS2314 (per TYPE-07); `ref` of the wrong host → error |
| NEO-PGEN-20 | forbidden surface | — (pure invalidation) | `Box`/`Flex`/`Grid` import → error; `as` prop → error; `styled.div` → error; `slot` recipes → error; any `@pandacss/*` import in E4 → rg-clean (extends TYPE-06) |
| NEO-PGEN-21 | svg props | SVG presentation props through style keys; `css` on SVG probes | HTML-only prop misuse on SVG host where React types forbid → error (documents the boundary; kept narrow — React's own SVG types are the oracle) |
| NEO-PGEN-22 | per-system narrow | world importing the BOUND per-system entry: system token literal assigns, `StylePropName` is the exact union (not `string`, not `never`) | token from another system → error at the narrow position (proves the bake narrowed rather than widened) |

Re-anchor (no new ids): PRIM-09 census flips 101 → 125 with the SVG
families itemized (or holds 101 if W6 defers SVG — the case asserts
whichever the vocabulary carries; the number lives in ONE place:
E1); PRIM-10 import census runs against E4; TYPE-01 compiles against
the bound entry; TYPE-02/03/04/07/08 keep passing unmodified (they
prove the per-system surface, which is behavior-preserving).

### (3) Seam contract — what crosses the cut

| artifact | form | distribution | freshness rule |
|---|---|---|---|
| E1 `vocabulary.json` | JSON data (elements/props/conditions/aliases/reserved/overrides) | VENDORED committed copy: `src/vendor/rust-primitives/vocabulary.json` (tasty-style tool, see below) — read at sync runtime AND by station parity cases | regen + `--check`; PGEN-12/13 fail on drift (test-time gate) |
| E2 `primitives.mjs` + E3 runtime | authored + generated TS/JS sources | LIVE workspace import `@reference-ui/rust/primitives` (typegen precedent — `publishTypesBundle` dynamic-imports; bundler resolves at sync time, no committed copy) | no vendor copy to drift; RS `dist` build is the dependency (same as typegen today) |
| E4 `primitives.d.ts` | d.ts closure with explicit NodeNext specifiers | VENDORED committed copy: `src/vendor/rust-primitives/*.d.ts` (same tool run as E1 — one tool, one version stamp) — Neo typechecks without touching RS | regen + `--check` in the quality gate (see below) |
| typegen `PropDefs` names | napi JSON (`primitives_vocabulary()`) | build-time only: consumed by `generate.ts` during the RS run, never crosses to Neo directly (Neo sees them via E1/E4) | generator run is atomic: E1+E2+E4 from one `PropDefs` — no skew |

**Vendor tool: `packages/reference-neo/tools/vendor-rust-primitives.mjs`**
(tasty-vendor contract, adapted): resolves linked `@reference-ui/rust`
dist (must be built), copies E1 byte-exact + E4 closure with the same
FROM/IMPORT NodeNext rewrite, stamps `@generated from
@reference-ui/rust@<version>` + regen line, `--check` prints
`missing:`/`stale:` lines + regen command and exits 1. Wired into
`pnpm agentneo q` (same as the tasty check wiring — check how the
tasty `--check` is invoked by `q` today and mirror it) so CI fails on
stale vendor. Regen command (canonical, printed by the tool):
`cd packages/reference-neo && node tools/vendor-rust-primitives.mjs`
after `pnpm --filter @reference-ui/rust run primitives && pnpm
--filter @reference-ui/rust build`.

**Freshness layers (three, each with an owner):** (i) `--check` in `q`
— fails fast on stale bytes, owned by whoever touched RS; (ii)
PGEN-12/13 parity cases — fail on semantic drift (vendored vs live
canon/typegen), owned by the station; (iii) RS golden snapshot of E1
in `modules/primitives/tests/` — fails on unintended generator output
change, owned by RS (`--update-goldens` refresh, canon-style, never
silent).

**`vendor/` rename:** rides with this item per 3.9 (captain leans
`upstream/`; HQ decides). Explicitly NOT overnight — the tool + paths
above use `vendor/` and rename mechanically when HQ names it. Flagged,
not specified further.

### (4) Sequenced implementation waves (morning)

Each wave lands only on its proof gate; waves are ordered (later waves
consume earlier artifacts). No wave starts until the Tokyo stability
gate is green (PLAN.md §2 — this spec assumes it, does not declare it).

- **W0 — PropDefs refactor (RS, typegen-internal).** Refactor
  `src/emit/style.rs` to assemble a `PropDefs` struct (prop names,
  value domains, condition keys, aliases, dialect keys) FIRST, print
  `emit_dts`/`emit_dts_with` from it, expose `primitives_vocabulary()`
  over napi returning the names as JSON. No output change: all 8
  goldens byte-identical. PROOF: `pnpm agentrs c typegen` + `pnpm
  agentrs v typegen` green, `git diff` on goldens empty, new napi fn
  round-trips in a vitest.
- **W1 — generator + E1/E4 (RS, new `modules/primitives/`).**
  Author `generate/generate.ts` (overlay TS for F1 spellings + napi
  PropDefs + canon ELEMENTS/PRIMITIVE_JSX) emitting E1 + E4 with the
  fail-closed join (jsx collisions, alias targets, F1 table
  completeness, map-rule refusal). Commit E1/E4 + golden snapshot.
  PROOF: `pnpm run primitives` deterministic (run twice, `cmp` clean);
  E1 element count 125 with all 24 SVG `dom` spellings camelCase;
  `stylePropNames` diffed equal to typegen golden key extraction;
  `agentrs q` on the module green.
- **W2 — runtime move + E2 (RS).** Move factory/split/context (+
  tests) verbatim to `modules/primitives/js/`; emit E2 bound-roster
  module with the `configurePrimitives` seam. PROOF: moved vitest
  green in RS; E2 imports clean under node with the seam unbound;
  `agentrs t` (build→cargo→vitest→quality) green.
- **W3 — vendor tool + `q` wiring (Neo).** Author
  `tools/vendor-rust-primitives.mjs` (E1 byte-exact + E4 closure,
  `--check`), wire `--check` into `pnpm agentneo q`. PROOF: fresh run
  prints fresh; hand-corrupt one vendored byte → `--check` exits 1
  with `stale:` line; `q` surfaces it.
- **W4 — per-system assembly cutover (Neo).** `publishReactBundle`
  binds E2 via `configurePrimitives` (systemName/stylePropNames/css)
  instead of `generateReactEntrySource`; `publishTypesBundle` consumes
  E4 instead of splicing. `generate.ts` + `tags.ts` +
  `react-surface.d.ts` + eval-barrel `index.ts` delete (barrel becomes
  a re-export of the bound E2 or deletes if the alias target moves —
  decide at implementation; the alias in `config/bundle.ts` +
  tsconfig paths repoints). PROOF: full `pnpm agentneo run` green
  (existing PRIM/TYPE hold on the new plumbing — behavior-preserving);
  byte-compare of one generated world before/after (modulo header
  stamps); chain T1 green.
- **W5 — the station (Neo, `tests/cases/pgen/`).** Author SPEC.md +
  PGEN-01..22 worlds/specs; re-anchor PRIM-09 (125)/PRIM-10/TYPE-01.
  PROOF: `pnpm agentneo run pgen` (or per-case runs) all `ok`; each
  invalidation case observed RED-then-GREEN (negative world fails
  `tsc` with the pinned code before the fix-position lands — record
  the code per case); FULL run green.
- **W6 — SVG surface decision (HQ, may fold into W1).** If HQ defers
  the 24 SVG primitives: generator gains `--html-only` (E1/E4 carry
  101 + a `deferred: [svg…]` list), PRIM-09 holds 101, PGEN-07..10
  land as the SVG allowlist wave later. DEFAULT RECOMMENDED: no flag,
  emit 125. PROOF: HQ sign-off recorded in PLAN.md §3.9 + this log.

### Open threads for the morning (not decided here)

1. NIGHT-4 alignment: re-read its home section if filed; this spec
   assumes RS-emits/Neo-proves.
2. Emit 125 vs 101+deferred (W6; default 125).
3. `vendor/` → ? (HQ names; mechanical rename after).
4. Whether per-system emission ever follows below the cut (3.9's
   standing question — this spec keeps it Neo permanently; revisit
   only with measured cause).
5. Exact `configurePrimitives` signature (seam shape is specified,
   identifier-level API is implementation detail).

NIGHT-5 DONE: implementation-ready 3.9 spec filed (RS shapes + station
list + seam contract + waves). No implementation, no edits beyond this
section, no commits. Report only.

## NIGHT-4 primitives home brief (crew, 2026-09-23) — DONE

Scope (strict): READ-ONLY everywhere except this log.
Tokyo PLAN.md §3.9 (`packages/reference-neo/PLAN.md:264-311`)
read fully first. No edits, no commits, index untouched.
Question: RS-side vs Neo-side home for the 3.9 generator +
test station. Argued both ways below, then a ranked
recommendation. NIGHT-5 specs shapes + station case list +
seam contract — this brief decides only HOME.

### Shared ground (both cases accept)

- 3.9 SHAPE is converging (PLAN.md:294-303): RS generates
  the raw files (primitives + types, names from typegen);
  Neo holds the test station (behavior + type validity /
  invalidation). Primitives strongly typed; rest is CSS.
- The honest split is already drawn (PLAN.md:275-279):
  vocabulary is RS-owned, *per-system emission* stays Neo
  (needs system name + compiled style props at sync time).
- Three hand-mirrors must die (PLAN.md:272-275): tags.ts
  (copies canon), the style-prop union in generate.ts
  (mirrors typegen), react-surface.d.ts (mirrors both).
- The `vendor/` rename rides with this item, not
  separately (PLAN.md:304-307; captain leans `upstream/`).

### FINDING: the drift 3.9 predicts already exists (firsthand)

- Canon `ELEMENTS` = **125** entries (`grep -c` over
  `reference-rs/modules/canon/src/html.rs:22-148`): 101
  HTML + 24 SVG children (source:
  `canon/generate/overlay/primitives.ts:7-24`, SVG block
  :19-23, mapped wholesale by `generate/dialect.ts:70-74`
  into `emit/html.ts:10-71`).
- Neo `TAGS` = **101** HTML-only
  (`neo/src/primitives/tags.ts:6-108`, count pinned by
  `tags.test.ts:13`), header admits it: "Copied tag set"
  / "Neo-owned copy" (tags.ts:1-4).
- NOTHING pins the HTML-only filter or canon parity:
  tags.test.ts asserts count/shape/map-rule only. The SVG
  drop is silent — no gate would fire if canon added or
  removed a tag tomorrow. This is exactly the failure the
  3.9 set-parity gate ("every canon tag has a primitive")
  is specified to kill (PLAN.md:285-287). Note for
  NIGHT-5: the filter is also a semantic question (are
  SVG children primitives?), not just a mechanical move.

### RS-side case (generator below the cut)

1. **Sources are RS-native, consulted at compile time.**
   Canon owns tags + JSX names (src/html.rs:22-303),
   aliases + reference props (src/dialect.rs:360,
   `REFERENCE_PROPS`; resolve_alias :362-371), conditions
   (src/conditions.rs:9-98), properties (src/css/*), behind
   one re-export surface (src/lib.rs:8-24) whose header
   states the law: "the central dictionary consulted by
   all compiler stages". Consult paths today:
   typegen `emit/style.rs:101-176` (prop key set +
   color/spacing/radius walks + condition keys from
   `NAMED_CONDITIONS`), atomic
   `runtime/plan.rs:203-217` (`build_style_prop_names`
   from `CANONICAL_PROPERTIES` + `ALIASES` +
   `REFERENCE_PROPS`), atomic resolve + stylesheet legs
   (`resolve/mod.rs`, `shorthands/*`, `stylesheet/*`,
   `static_css.rs` — all `canon::` consumers). A Neo-side
   generator re-consults across NAPI or copies — the
   hand-mirror disease 3.9 exists to kill.
2. **One language source for names.** Typegen owns prop
   defs/unions: `emit_dts`/`emit_dts_with`
   (typegen/src/lib.rs:37-48) → `dts` assembly
   (emit/mod.rs:22-34: tokens + recipes + fonts + style)
   → `style_types` (emit/style.rs:43-60: `StyleProps`,
   `StylePropValue`, `StyleConditionKey`, `FontProps`,
   `SystemStyleObject`). Typegen already prints TS from
   Rust; raw primitive files + types are the same skill,
   tested by the same golden machinery
   (tests/goldens/*.d.ts, 7 files). "Names typegen knows
   = names emitted" is a *construction* only when the
   emitter links typegen — across the cut it degrades to
   a property somebody must test.
3. **Distribution is a solved template, not a prototype.**
   The tasty vendor tool
   (neo/tools/vendor-rust-tasty-dts.mjs) closes over the
   RS dist d.ts tree (TOPS :14, BFS :43-62), rewrites to
   explicit NodeNext (:64-86), stamps provenance (:88-101),
   and `--check`s freshness (:125-153); contract doc'd in
   tools/README.md:27-58 ("mechanically copied…
   regenerate after an RS rebuild"; `src/entry/types.d.mts`
   imports handle names so renames "break loudly instead
   of drifting silently", :42-46). Vocabulary/raw-file
   artifacts ride the identical contract. The value/type
   seam split already runs in production: tasty VALUES
   resolve live to RS dist
   (reference/bridge/tasty-build.ts:8-12,
   reference/browser/Runtime.ts:16-17) while TYPES come
   from `src/vendor/rust-tasty/` via tsconfig paths.
4. **Freshness ownership is crisp.** RS owns
   source→artifact: canon/typegen move ⇒ regen, gated by
   cargo + goldens in RS CI (precedent: canon
   src/tests.rs, typegen goldens + seam/surface tests).
   Drift fails at generation, not consumption.

### Neo-side case (generator above the cut)

1. **Per-system emission inputs exist only inside sync.**
   `ReactEntryInput` takes `systemName` + `stylePropNames`
   + 3 runtime paths (generate.ts:8-14); the entry bakes
   the layer name (:37), the splitter list (:36), one
   factory component per tag (:40-45), and a caller-
   provided `css` binding; the publisher prepends a
   runtime header pre-registering css()/recipe() over
   THIS system's runtime-data (sync/react.ts:32-41,
   publish :49-76). Callers pass `spec.name`
   (assembly.ts:30) and `runtime.stylePropNames`
   (assembly.ts:31) — the latter is
   `NativeRuntimeArtifact.style_prop_names`, RS-computed
   per compile (plan.rs:190-201). RS has no sync, no
   system name, no per-world evaluation: it cannot bake
   what it cannot see.
2. **The assembly is ordered and Neo-resident.**
   assembleSystem (assembly.ts:20-37): styled leg →
   react bundle (reads styled runtime-data) → types
   bundle post-wires react.d.mts (types-bundle.ts:78-140:
   swaps the wide StyleProps line for the typegen-
   precision merge + named graph) → links. Splitting
   emission across the cut ships half-baked artifacts in
   both directions; keeping the generator Neo-side keeps
   one ordered recipe.
3. **Vendor tool + freshness wiring + loud-break design
   already live Neo-side.** Tool, committed output
   (~40 files under src/vendor/rust-tasty/, pinned
   `@reference-ui/rust@0.0.42`), tsconfig path maps,
   and the break-loudly import discipline are all Neo
   files. Freshness failures are OBSERVED Neo-side (a
   stale copy breaks the package typecheck). Whoever
   owns the gate owns the home — the gate lives here.
4. **Station cases + runner already live Neo-side.**
   tests/cases/prim/ (15 cases, NEO-PRIM-01..15; SPEC
   owns `src/primitives/**` + `src/sync/react.ts` and
   proves the generated entry: 101 tag components,
   css/recipe bindings, DOM contract) + tests/cases/type/
   (8 cases; SPEC: post-sync tsc proofs over generated
   .d.mts — validity AND rejection, "reject bad
   literals") + generate.test.ts (emitted-shape asserts,
   strict-tsc compile probe of emitted types :87-137,
   surface-parity pins :144-178). agentneo + Playwright
   worlds exist only Neo-side; RS stations are
   golden/seam-level (atomic tests/cases "engine
   stations" per the PRIM SPEC, canon emit tests,
   typegen goldens). RS cannot run browser behavior
   without duplicating the runner — forbidden by the
   inner-loop law (PLAN.md §5).
5. **Live RS consult already works at sync time.**
   publishTypesBundle dynamically imports
   `@reference-ui/rust/typegen` and calls `emitDtsSync`
   mid-sync (types-bundle.ts:66-76); sync/native.ts
   imports `@reference-ui/rust/atomic` the same way.
   A Neo-side generator COULD consult canon/typegen over
   NAPI with zero vendored copies — one authority, no
   mirror.

### Rebuttals (why the cases don't cancel)

- Neo (1) is answered by the split both sides accept:
   system-INDEPENDENT vocabulary/raw files go RS;
   per-system baking (layer name, splitter, css binding)
   stays Neo. The generator question is only the former.
- Neo (5) trades determinism for adjacency: live NAPI
   consult couples every sync to the native binary and
   breaks the vendor contract's "fresh checkouts typecheck
   with no extra step + hermetic byte-determinism" —
   the reason tasty types are vendored, not imported.
- Neo (4) is agreed, not contested: the STATION stays
   Neo under every ranking below. A station argument is
   not a generator argument.
- RS-side inherits the open SVG question (see FINDING):
   emit all 125, or a platform partition? NIGHT-5 specs
   it; the home brief records that RS-side generation
   answers a semantic question, not just a move.

### Freshness hole found (home-independent, must close)

`--check` is convention-only today: Neo package.json has
NO vendor script (scripts: build/prepack/prepublishOnly),
zero vendor/fresh hits in tools/quality + the agent-neo
skill gate, zero hits across all 4 CI workflows. "Run it
explicitly after an RS rebuild" (tool header :5,
tools/README.md:48-54) is the entire enforcement. Any
home that reuses the vendor contract must wire `--check`
into `pnpm agentneo q` + CI, or the new artifacts drift
exactly like tags.ts did.

### RANKED recommendation (morning-ready)

**1. SPLIT per 3.9 SHAPE (recommend).** RS generator
(vocabulary/raw primitive files + types from canon +
typegen, one language source) + Neo station (behavior
cases per primitive family + type validity/invalidation
cases, where agentneo/Playwright live) + vendored
distribution (generalize the tasty-vendor contract).
Freshness split BY THE SEAM: RS owns source→artifact
(canon/typegen move ⇒ regen, failed by RS goldens/cargo
in RS CI); Neo owns artifact→tree (vendor `--check`
blocking in `agentneo q` + CI — closes the hole above),
backstopped by loud-break handle imports (tasty
precedent), surface-parity units (generate.test.ts
pattern), and the new set-parity gate. Why: each half
owns what it can observe; matches precedent on both
sides (RS golden stations, Neo case stations, tasty
vendor); kills all three hand-mirrors in one move
(tags.ts + style-prop union + react-surface.d.ts
delete; per-system assembly reads vendored vocabulary).

**2. ALL-NEO fallback (viable).** RS emits a vocabulary
DATA file (tags, JSX names, aliases, conditions, prop
defs) as a build artifact; a Neo-side generator consumes
it vendored (same `--check` contract) adjacent to
per-system emission. Take iff RS emission schedule slips
or HQ wants one fewer cross-cut codegen. Cost: the seam
carries data instead of finished files, so "names
typegen knows = names emitted" becomes a tested
property, not a construction — and the tsc-printing
skill gets built twice (typegen emit + Neo generator).

**3. ALL-RS (reject).** Generator + station both below
the cut. The station needs browser behavior proof; RS
has no Playwright runner and must not grow one (PLAN §5
inner-loop law). Reduces the station to string
assertions or duplicates agentneo — the "seeing is not
verifying" failure with extra steps.

HQ call needed: confirm rank 1 (or pick 2), plus the
`vendor/` rename (`upstream/` lean stands) and the SVG
scoping answer for NIGHT-5's spec. Implement nothing —
NIGHT-5 + morning waves sequence off this call.

## NIGHT-4 DONE (crew, 2026-09-23)

Home brief filed above: §3.9 read fully, RS-side and
Neo-side argued with file:line evidence (canon consult
paths, typegen emit paths, vendor tool contract,
generate.ts, tags.ts, react-surface.d.ts), one live
drift finding (101-vs-125 silent SVG drop, no parity
gate), one freshness hole (vendor `--check` manual-only:
no script, no q-gate, no CI), ranked recommendation
(1 split per SHAPE, 2 all-Neo fallback, 3 all-RS
reject) with seam-split freshness ownership. Read-only
held (this log section the sole write); index untouched;
nothing committed. Morning-ready for HQ's call.

## Tick — voyage complete; 5 night crews running (fresh, no writes — not stuck), no action.

## NIGHT-3 — sync enumeration: the cut list (crew, 2026-09-23) — DONE

READ-ONLY census of `packages/reference-neo/src/sync/` for Tokyo
PLAN 3.7 (sync as tight engine block). 41 responsibilities, one per
line, each with file:line + proposed home + one line of why. No
implementation, no edits (this section only), no commits.

Base path below: `packages/reference-neo/src/sync/`.

### Responsibility table

| # | Responsibility (file:line) | Home | Why |
|---|---|---|---|
| 1 | `sync()` recipe orchestration, index.ts:141-248 | stays-in-sync | This IS the tight engine block; everything else hangs off it |
| 2 | Config load + outDir resolution, index.ts:143-145 | stays-in-sync | Recipe inputs; config itself already lives in config/ |
| 3 | Atomic-folder guarantee (pre-clean + catch-wipe, SYNC-11), index.ts:146,242-244 | stays-in-sync | The recipe's transactional wrapper; packager defers atomicity to sync (assembly.ts:18) |
| 4 | Retention-token lifecycle (hold, drain-consume, finally-release, RSS relief), index.ts:155-157,185-207 | stays-in-sync | C3-in-reverse memory protocol with the native engine; engine-block machinery |
| 5 | ScopedCompileRequest assembly (jsxHosts, roots, include, logs), index.ts:171-184 | stays-in-sync | The frozen RS-cut input contract is built at the call site |
| 6 | Diagnostic discipline (throw/report/format, stable codes), index.ts:42-82,208-210 | stays-in-sync | Engine-block UX contract: loud never-throw warnings, censuses count by code |
| 7 | mergePublishedStylesheets dual-assembly wrapper, index.ts:121-132,217 | css/3.2 | Pure stylesheet math (served + portable); moves with packed-css.ts |
| 8 | compile-request.json diagnostic artifact, index.ts:227-235 | stays-in-sync | Self-declared "a sync diagnostic, not packaging" in its own comment |
| 9 | scheduleReferenceTastyPhase / REF-04 re-arm, index.ts:99-114,239 | stays-in-sync | Sync-end fire-and-forget; the await-never shape is sync-lifecycle law |
| 10 | Phase marks at milestones, index.ts:142,144,149,151,187-190,236,246 | stays-in-sync | Marks ARE the engine block's observable phase contract |
| 11 | resolveJsxElements config+traced→artifact, jsx-elements.ts:21-34 | stays-in-sync | Request-shape join owned by the engine block (pre-compile request + post-compile publish); packager needs only the type |
| 12 | compileNative dynamic-import seam, native.ts:84-87 | stays-in-sync | The engine block's single native call |
| 13 | releaseRetention error-path-only release, native.ts:93-96 | stays-in-sync | The finally-branch of the retention protocol (#4) |
| 14 | Scoped/Native request+result+diagnostic types, native.ts:15-74 | stays-in-sync | The RS-cut contract surface; narrow and sync-owned until the RS dist refresh lands |
| 15 | applyNormalizeCss spec prepend + provenance, reset.ts:63-70 | css/3.2 | Stylesheet-content concern (reset fragment → @layer reset), mirrors core stylesheet/reset.ts |
| 16 | createResetRules Andy Bell rules + RESET_FRAGMENT_SOURCE tag, reset.ts:9-57 | css/3.2 | CSS content + engine source-tag convention; travels with #15 |
| 17 | shouldInjectReset flag semantics, reset.ts:14-16 | css/3.2 | normalizeCss policy; travels with #15 |
| 18 | mergePackedStylesheets extends-chain merge, packed-css.ts:118-128 | css/3.2 | Pure CSS-string cascade assembly; zero sync lifecycle, sole caller is #7 |
| 19 | stripResetLayer + brace matching + layer-name collection, packed-css.ts:30-107 | css/3.2 | CSS text machinery serving #18 |
| 20 | markPhase/markPhaseAt + writePhasesFile + PHASE_EDGES, phases.ts:43-97 | stays-in-sync | Bench instrumentation of sync's own milestones; one disabled branch when unset |
| 21 | cleanDir retrying recursive remove, clean.ts:31-41 | stays-in-sync | The atomic-wipe primitive whose retry exists for sync's own tasty-writer overlap |
| 22 | collectCompileFiles include-scoped collection, compile-files.ts:21-34 | delete | Zero callers — dead since C3 single-read/retention (already flagged fasthull-recon-1.md:304); engine self-scans (RS-10). NativeSourceFile stays: ScopedCompileRequest.files still types the TS fallback |
| 23 | publishReactBundle react.mjs + map + react.d.mts, react.ts:49-97 | packager/3.1 | Publish leg already called from packager/assembly.ts:28; pure move (assembly.ts:3 blesses it) |
| 24 | publishReferenceTypesBundle types package, reference-types.ts:35-66 | packager/3.1 | Publish leg already called from assembly.ts:36; pure move |
| 25 | watchSync baseline+resync driver, watch.ts:281-331 | stays-in-sync | The --watch mode entry; a caller of sync(), not a recipe step — beside the block, not in it |
| 26 | createResyncScheduler debounce+serialize, watch.ts:186-235 | stays-in-sync | Watch-mode-only machinery; travels with #25 |
| 27 | deriveWatchRoots/staticPrefix/collapseRoots, watch.ts:55-88 | stays-in-sync | Include→roots derivation; travels with #25 |
| 28 | .gitignore→ignore-globs + ancestor walk, watch.ts:90-154 | stays-in-sync | Watcher filtering; travels with #25 |
| 29 | Parcel handler + error/cooldown handler, watch.ts:240-271 | stays-in-sync | Backend glue; travels with #25 |
| 30 | picomatch.d.ts typeless-module shim, picomatch.d.ts:4-6 | stays-in-sync | Exists solely for watch.ts:12's import; travels with #25 |
| 31 | writeSystemDir system leg (baseSystem, entry sources, spec+json, jsx json), publish/system.ts:106-120 | packager/3.1 | Called from assembly.ts:24; pure move |
| 32 | writeStyledDir styled leg (styles.css + manifest), publish/styled.ts:13-18 | packager/3.1 | Called from assembly.ts:25; pure move |
| 33 | publishRuntimeBundle runtime-data.mjs, publish/styled.ts:26-39 | packager/3.1 | D4 data-only publish; called from assembly.ts:27; pure move |
| 34 | writeReactDir react shell (manifest + styles.css copy), publish/react-shell.ts:15-20 | packager/3.1 | Called from assembly.ts:26; pure move |
| 35 | publishTypesBundle typegen index + subpath decls + react wiring, publish/types-bundle.ts:66-140 | packager/3.1 | Declaration leg called from assembly.ts:33; pure move |
| 36 | linkGeneratedPackages node_modules scope junctions, publish/links.ts:17-23 | packager/3.1 | Called from assembly.ts:37; pure move (junctions are publish-shape — HERMDIV/PUBLISH-SHAPE territory) |
| 37 | sync.test.ts (recipe tests) | stays-in-sync | Tests the recipe #1 |
| 38 | lib-barrel-negation.test.ts (scan→compile fingerprint) | stays-in-sync | Mirrors sync()'s full path; travels with the recipe |
| 39 | packed-css.test.ts | css/3.2 | Travels with #18/#19 |
| 40 | reset.test.ts | css/3.2 | Travels with #15-17 |
| 41 | reference-types.test.ts | packager/3.1 | Travels with #24 |

### Home tally

- packager/3.1: 9 items — 7 source files (react.ts, reference-types.ts, publish/*.ts ×5) + 1 test. All already called from packager/assembly.ts; mechanical move, zero behavior risk.
- css/3.2: 8 items — packed-css.ts, reset.ts, the index.ts:121-132 dual-assembly wrapper, + 2 tests. Pure content/math; sole sync caller is the recipe.
- collect/3.3: 0 items — real finding, not an omission. No fragment-collection responsibility remains in sync/ (prepare/evaluate already live in collect/); nothing to cut this way.
- stays-in-sync: 23 items — index.ts minus #7, jsx-elements.ts, native.ts, phases.ts, clean.ts, watch.ts, picomatch.d.ts, 2 tests. The engine block + its watch-mode driver.
- delete: 1 item — compile-files.ts (#22), dead code with a prior witness.

Post-cut sync/ shape: `index.ts` (recipe), `native.ts` (RS seam),
`jsx-elements.ts` (request shape), `clean.ts` (wipe primitive),
`phases.ts` (marks), `watch.ts` + `picomatch.d.ts` (watch driver), 2
tests. Post-cut imports into the recipe resolve to three homes:
collect (prepare/evaluate), css (reset/packed-merge), packager
(assembleSystem) — the domain map made visible.

Minor edge noted for the morning: packager/types.ts:6 imports the
JsxElementsArtifact *type* from sync/jsx-elements.ts; when the legs
move, either the type moves to packager/types.ts or the import stays
— one line, no behavior.

### Legacy comparison + proposed Neo recipe

Legacy target shape (`packages/reference-legacy/src/sync/command.ts`,
15-line body): bootstrap → a hub of 13 `init*` side-effect
registrations over a shared payload/session (shutdown, failure
boundary, logging, events, session, complete, watch, virtual,
reference, config, panda, packager, ts-packager). Evented, long-lived,
ambient.

Neo must NOT copy that shape — its proposition is the opposite: a
serial function, fragments → one native compile → publish, returning
`{ outDir, spec }`. What the cut takes from legacy is only the
*thin-hub* property: command.ts itself holds no logic, every leg is a
named import. The Neo recipe's call list once emptied (same order as
today's index.ts:141-248, homes annotated):

```
sync(cwd):
  loadUserConfig                 (config — external, unchanged)
  cleanDir                       (sync — wipe primitive #21)
  prepareFragments               (collect — external, unchanged)
  evaluatePreparedFragments      (collect — external, unchanged)
  applyNormalizeCss              (css/3.2 — #15)
  resolveJsxElements             (sync — request shape #11)
  compileNative / releaseRetention (sync — RS seam #12/#13, retention protocol #4)
  report+throw diagnostics       (sync — #6)
  resolveJsxElements (+traced)   (sync — #11)
  mergePublishedStylesheets      (css/3.2 — #7)
  assembleSystem                 (packager/3.1 — legs #23/#24/#31-36)
  write compile-request.json     (sync — #8)
  scheduleReferenceTastyPhase    (sync — #9)
```

13 calls vs legacy's 13 inits — parity of thinness, opposite
architecture: a function, not a hub. Watch (#25-30) stays a sibling
entry (`bin/neo.ts` → watchSync → sync loop), never a recipe step.

NIGHT-3 DONE: cut list filed, morning-ready. Report, don't land.

## NIGHT-2 — PostCSS adoption survey (decision brief for Tokyo PLAN.md 3.2)

Scope: READ-ONLY survey, no implementation. Delivers 3.2's decision
brief for the morning. No source edits made; this section is the only
write. Conventions: paths relative to repo root; `neo/` =
`packages/reference-neo/src/`, `legacy/` =
`packages/reference-legacy/src/`.

### 1. Every CSS-text touchpoint in Neo today

Technique legend: REGEX / BRACE (hand brace-match) / SPLIT (naive
string split) / VERBATIM (byte passthrough, no parse) / OBJECT
(operates on style objects, never CSS text) / SHAPE (validates config
shape, not CSS) / ENGINE (Rust side — out of TS scope, noted for the
seam).

| # | File:line | What it does | Technique today |
|---|-----------|--------------|-----------------|
| T1 | neo/sync/packed-css.ts:21 | `LEADING_STATEMENT` — matches upstream's leading `@layer a, b;` | REGEX (`/^\s*@layer\s+([^;{]+);/`) |
| T2 | neo/sync/packed-css.ts:24,47-54 | `RESET_OPEN` + `findResetBlock` — locates `@layer reset {` opener | REGEX for opener, BRACE (`matchCloseBrace`, :30-40) for close |
| T3 | neo/sync/packed-css.ts:62-71 | `stripResetLayer` — removes every reset block + one trailing newline | BRACE scan loop (T2) |
| T4 | neo/sync/packed-css.ts:79-87 | `contributedNames` — layer names from upstream statement | SPLIT on `,` (:83) + trim; no paren/comma-function awareness |
| T5 | neo/sync/packed-css.ts:89-101 | `collectLayerNames` — dedup'd statement order, self last | Set-dedup over T4 output (string compare) |
| T6 | neo/sync/packed-css.ts:118-128 | `mergePackedStylesheets` — statement + stripped upstreams + own block | String concat (`appendBlock`, :103-107); upstream blocks otherwise VERBATIM |
| T7 | neo/sync/index.ts:121-132 | `mergePublishedStylesheets` — runs T6 twice (served + portable) | Delegates to T6; no CSS logic of its own |
| T8 | neo/sync/index.ts:217 | Merge call site (`config.extends` + engine sheets) | Call site only |
| T9 | neo/sync/reset.ts:24-57 | `createResetRules` — Andy Bell reset as `GlobalStyleNode` object map | OBJECT (never CSS text); engine prints it into `@layer reset` |
| T10 | neo/sync/reset.ts:63-70 | `applyNormalizeCss` — unshifts reset fragment onto spec | OBJECT (array prepend) |
| T11 | neo/sync/native.ts:56-58 | `NativeCompileResult.stylesheet` / `portableStylesheet` contract | ENGINE — both sheets (served `:root`-hoisted, published self-scoped) are printed by Rust; TS receives opaque strings |
| T12 | neo/sync/publish/styled.ts:16 | Writes `styled/styles.css` | VERBATIM `writeFileSync` of merged sheet |
| T13 | neo/sync/publish/system.ts:15-22 | `publishedBaseSystem` — `css: input.portableStylesheet` into baseSystem.mjs | VERBATIM (`JSON.stringify`, :103) |
| T14 | neo/sync/publish/react-shell.ts:15-20 | Copies styled sheet into react leg | VERBATIM filesystem copy (packager/assets) |
| T15 | neo/collect/lib/evaluate.ts:290-314 | `mergeCollectedSpec` — globalCss fragments → spec entries | OBJECT (fragment maps → `EvaluatedSystemSpec.globalCss`); upstream globalCss collection suppressed (:150-151, :207-215) because packed-css merge (T6) carries it |
| T16 | neo/config/validate.ts:75-89,148-154 | `validateStaticCss` + extends-entry presence check (`sys.css` string non-empty) | SHAPE only — no CSS parse, no value validation |
| T17 | neo/config/types.ts:13,37 | `BaseSystem.css` doc ("merged portable CSS") + `name` as layer identity | Type-level only |
| T18 | neo/runtime/css/css.ts:126-147 | `stripImportantSuffix` / `splitImportant` — `!important` / trailing-`!` strip on authored values | SUFFIX match (`slice` + `toLowerCase` compare), not CSS parse |
| T19 | neo/runtime/css/plans.ts:55-62 | `splitSlot` — cascade slot family vs `@bp` suffix | `lastIndexOf('@')` vs `lastIndexOf(':')` (string positions on slot keys, not CSS) |
| T20 | neo/runtime/css/lowerResponsiveStyles.ts:74-76 | Emits `@container (min-width: ${width}px)` keys | OBJECT key construction; numeric-width guard (:83-91) |

Negative results (verified by grep — these do NOT exist in Neo):
- No CSS parser anywhere: zero `postcss`, `csstree`, `lightningcss`,
  `stylis`, `CSS.parse`, `walkDecls/walkRules` in `src/` (non-test).
  `postcss` is absent from `packages/reference-neo/package.json`.
- No CSS validation: nothing checks that a sheet parses, that braces
  balance, or that declarations are well-formed. T16 checks config
  shape only.
- No selector or value analysis in TS: layer/scope/hoist decisions
  live in the engine (T11). The `[data-layer]` scoping and `:root`
  hoisting named in PLAN 3.2's "selector pass owns layer/scope
  questions" have no TS-side code to own them — that sentence
  describes the desired module, not current code.
- T6's only consumers: `sync/index.ts` (T7/T8) + its own 364-line
  test (`packed-css.test.ts`). Nothing else imports it.

Grandfathered violators for the 3.5 ban (exact lines): T1 (:21), T2
(:24 + :30-54), T4 (:83). T3 composes T2. These are the "known
violators" the ban tracks until migration.

### 2. Legacy's exact PostCSS usage

Pins (`packages/reference-legacy/package.json:88-90`):
`postcss ^8.5.23`, `postcss-selector-parser ^7.1.1`,
`postcss-value-parser ^4.2.0`. All three used; none vendored.

**Stylesheet pipeline (uncontrolled input = Panda-emitted CSS):**

| File:line | Package(s) | Transform |
|-----------|-----------|-----------|
| legacy/system/stylesheet/transform/dropUnresolvedPrivateTokenDeclarations.ts:1,28-52 | `postcss` (`parse`, `walkDecls`, `walkRules`, `walkAtRules`) | Drop decls whose value matches `UNRESOLVED_PRIVATE_TOKEN_PATTERN` (:9, `_private.*` token leak), then prune emptied rules/at-rules. Byte-identical return when unmutated (:38). |
| legacy/system/stylesheet/transform/demotePandaGlobalCssLayer.ts:1,119-145 | `postcss` (`parse`, node find/clone, `params` rewrite) | Move Panda global.css base layer into a dedicated `global` layer; strict contract errors (`PandaCssContractError`) when Panda's emitted shape drifts. Note: layer-order list handled with plain `.split(',')` (:32-35, :48-51) — even legacy comma-splits *statement params*, which cannot contain functions. |
| legacy/system/stylesheet/transform/createPortableStylesheetFromContent.ts:1-2,68-79,138-160 | `postcss` (parse, find/remove `@layer tokens`, stringify) + `postcss-selector-parser` (`astSync`, :68-71) | Portable sheet: extract `:where(:root…)` token decls (:32-34), rewrite theme selectors to `[data-layer="<name>"]` pairs (:73-79), wrap in `@layer <name>` via Liquid render. The selector-parser use is exactly comma-safe selector-list splitting — the function T4 lacks. |
| legacy/system/stylesheet/postprocess/helpers.ts:42-73 | (orchestration, no direct import) | Order: demote → drop-unresolved → portable-ize; reset prepend (portable vs runtime spellings). |
| legacy/system/stylesheet/postprocess/index.ts:19-47 | (orchestration) | `postprocessCss`: read artifacts → local sheets → assemble with upstreams via `renderAssembledStylesheet` (Liquid, render/stylesheet.ts:23-37 — statement + verbatim concat, the direct ancestor of T6). |
| legacy/system/stylesheet/createPortableStylesheet.ts:10-20 | (file wrapper) | Read styles.css from disk → `createPortableStylesheetFromContent`. |

**Panda config extensions (value-level, authored/config input):**

| File:line | Package | Transform |
|-----------|---------|-----------|
| legacy/system/panda/config/extensions/api/font.ts:1,32-60 | `postcss-value-parser` | `parseFontFamilyName`: parse `font-family` value, take nodes before first top-level comma `div`, trim spaces, unquote single `string` node. |
| legacy/system/panda/config/extensions/rhythm/helpers.ts:1,159-161 | `postcss-value-parser` | `resolveRhythm`: parse value, `transformNodes` rewrites rhythm units (`2r`, `1/5r`) to `calc(var(--spacing-root)…)` in place, `toString()`. Non-string / `r`-less fast path (:150-157). |
| legacy/system/panda/config/extensions/shorthands/parser.ts:1,93-109 | `postcss-value-parser` | `splitShorthandTokens`: space-top-level token split that keeps `calc()`/`var()` groups intact (the value-side comma/function-safety Neo lacks). |

**Deliberately NOT PostCSS in legacy (do not cargo-cult):**
- `render/stylesheet.ts` (Liquid templates) — PLAN 3.4 already kills
  Liquid; assembly becomes typed builders/AST.
- `packager/postprocess/inject-layer-name.ts` — plain JS
  placeholder `replaceAll`, not CSS.
- `stylesheet/reset.ts` — static reset strings, no parse.
- The `:32-35`/`:48-51` comma-splits in demote — safe only because
  `@layer` statement params can't contain functions; NOT precedent
  for splitting selectors or values.

### 3. Proposed CSS module shape (options for HQ)

**What the survey says about scope (3.6 seam applied):**
- T6/T1–T5 (merge) operate on CSS we DO control (engine output +
  our own published payloads) → dies by seam (structured streams /
  structured `baseSystem` payloads), NOT by PostCSS rewrite. The
  module must not enshrine a PostCSS-based merge of our own text.
- T11 (emission, scoping, hoisting) is already engine-owned →
  stays out; the module consumes engine strings, never re-derives
  them.
- T12–T14 (file write/copy) are packager legs, not CSS logic →
  stays out (packager owns bytes on disk).
- T9/T10/T15/T18–T20 are OBJECT-level → stays out (style objects,
  slots, and values are pre-CSS; only T18's `!important` strip and
  the value-parser's future `var()` work touch the same concepts,
  at different layers).
- What NEEDS PostCSS (CSS we do NOT control): boundary validation
  of upstream `baseSystem.css` payloads at extends time (T16's
  presence check grows teeth: does it parse? does it carry the
  statement it claims?); selector-safe splitting if any future
  merge/debug path must read foreign statements; `var()`/token-value
  analysis per 3.2 HQ ("value parser owns `var()`/token-value
  analysis"); hardening probes (braces-in-comments/strings,
  comma-functions) as regression coverage, not production paths.

**Home — argue both:**
- (a) `src/css/` (top-level subsystem): CSS is a first-class
  concern with its own parse/merge/scope/emit vocabulary (PLAN 3.2
  says "CSS gets its own module"); matches the 3.3 ruling that
  subsystems stay top-level (`collect` precedent — "fragments is
  not a lib, it is a whole subsystem"); keeps the 3.5 ban's
  grandfathered-violator tracking visible; room for `surface/` +
  `lib/` + READMEs per the 3.3 README law.
- (b) `src/lib/css/` (machinery): if the 3.6 split holds, the
  module shrinks to parse/validate/analyze helpers consumed by
  sync/packager — machinery, like `lib/paths` and `lib/symlink`;
  avoids a top-level dir for what may be 2–3 small files plus
  tests; the merge (the "subsystem-sized" half) is leaving for the
  seam anyway.
- Survey lean: **(a) `src/css/`**, on the 3.3 subsystem test — the
  module owns a contract (the ban + boundary validation), not just
  helpers, and (b) would bury that contract. If HQ expects the
  post-seam remainder to stay tiny, (b) is the honest smaller
  footprint; revisit at migration time.

**Dependency shape:**
- (A) Full trio as legacy pins (`postcss` + `postcss-selector-parser`
  + `postcss-value-parser`): default candidate per 3.2; covers the
  named HQ loads ("selector pass and value parser"); legacy
  file:line above proves each earns its place (selector-list
  split, font/rhythm/shorthand values); single version story.
- (B) Narrower (`postcss` core only): suffices for boundary
  parse/validate + statement/declaration walks (the drop/demote
  class of transforms); defers companions until a concrete
  selector/value transform lands. Risk: re-deriving comma-safety
  by hand in the interim — exactly the banned regression.
- (C) Narrowest (zero new deps, seam-only): merge dies by streams,
  validation stays shape-level. Rejected by the survey — leaves
  the uncontrolled boundary (foreign `baseSystem.css`, authored
  values) with no parser, against HQ's "definite need."
- Survey lean: **(A) full trio at legacy's pins** (or newer
  patch-equivalents at install time). The three packages map 1:1
  to the three named loads (parse / selector / value); (B) saves
  kilobytes to re-incur the exact risk the ban exists for.

**What migrates vs stays out:**

| Migrates into the module | Stays out |
|--------------------------|-----------|
| T4's statement-name extraction → selector/statement-safe list split (the `splitSelectorList` analog; needed wherever foreign statements are read) | T6 merge logic → dies by seam (structured payloads), not rewritten on PostCSS |
| Boundary validation of upstream `css` (parse check, statement/shape contract) at extends time — T16's successor | T11 emission/scoping/hoisting (engine-owned) |
| `var()`/token-value analysis (new; HQ load) on value-parser | T12–T14 file write/copy (packager legs) |
| Hardening probes: braces-in-comments/strings, comma-functions (tests, per legacy coverage) | T9/T10 reset OBJECT handling (feeds engine, never CSS text) |
| T1/T2/T3 reset-strip → deleted at seam time; if any interim hardening is needed before streams land, a PostCSS `walkAtRules` strip replaces the brace matcher (short-lived, tracked) | T18/T19/T20 object/slot/key logic (pre-CSS layer) |

**Migration timing (open thread for HQ):** (i) wholesale at
stability-fix time — merge moves into the module on PostCSS even
though the seam will later delete it (double work, single safe
shape meanwhile); vs (ii) wait for the rearch slices — T1–T5 stay
grandfathered under the 3.5 ban until streams replace them (no
double work, longer regex lifetime). The survey notes T6's test
(364 lines) makes (ii) cheap to hold and (i) cheap to verify —
either is defensible; HQ picks.

DONE: decision brief filed — touchpoint table (§1), legacy usage
(§2), proposed shape with options (§3). Morning-ready for HQ to
pick: home (a/b), deps (A/B), timing (i/ii).

## NIGHT-1 — packager follow-ups (crew, 2026-09-23) — DONE

Scope (strict): two specified unifications in
`packages/reference-neo` only, nothing else. Governing skill
`agent-neo` loaded first. Never commit, never touch the index.
Report, don't land.

### Fix 1 — `neo clean` link list derived from PACKAGES

`bin/neo.ts` hardcoded `LINKED_PACKAGES =
[system,styled,react]` while the links leg
(`src/sync/publish/links.ts:11`) links all four PACKAGES incl.
`types` — `neo clean` orphaned the types junction (LEGACY-SURVEY
NIT-1; SYMLINK-ADOPT "Open for captain"). Now the bin imports
the same source the leg links and derives identically:
`PACKAGES.map((pkg) => getShortName(pkg.name))` (same two
modules: `packager/packages.ts` + `packager/layout.ts`). One
source; the next package lands in clean for free. `bin/neo.ts`
only; the leg untouched.

### Fix 2 — needle-list literals unified onto constants.ts

`src/collect/lib/scan/helpers.ts` (`export const NEEDLES`) and
`src/collect/lib/scan/identity.test.ts` (`const NEEDLES`) each
carried a verbatim copy of the 5-id discovery list
(COLLECT-REFACTOR smell §2). Both dupes deleted:
`FRAGMENT_IMPORT_NEEDLES` in `src/collect/constants.ts` is the
single source; helpers re-exports it as NEEDLES (its four
battery consumers — native, nativeLifecycle, goldens,
nativeCompleteness — untouched), identity.test.ts imports it
aliased as NEEDLES (3 use-sites untouched). The bootstrap
import-map (`collect/lib/bootstrap.ts`, `prepare.test.ts`
expectations) and `config/constants.ts` CONFIG_EXTERNALS are
different concepts/lists — deliberately left alone per the
no-beyond-unification order.

### Proof (all firsthand, this session)

- Full Neo units (`vitest run`): **48 files / 337 passed**.
- `pnpm agentneo q` (whole package): **0 errors, 17 warnings,
  214 files** (warn count identical to the pre-fix tree).
- Chain cases: NEO-CHAIN-01..06 **6/6 `ok`** in
  `tests/.artifacts/last-run.json`.
- Native T1 tier (`matrix/tests/chain/T1`): `neo sync` exit 0,
  all four scope links land; `neo clean` now reports **4
  links** and the types junction is gone (was 3, orphaned);
  resync restored; `pnpm agent playwright --dir
  matrix/tests/chain/T1 --no-build` → **7 passed (0 failed)**.
- Hygiene: 3 files changed, all Neo (`bin/neo.ts`,
  `scan/helpers.ts`, `scan/identity.test.ts`); no matrix/
  fixture edits (T1 sync outputs gitignored, world resynced
  to green); no commits; no diagnostic leftovers. The LOG.md
  + other LOG-2.md deltas in tree are siblings', not mine.

NIGHT-1 DONE: both fixes in tree + proof green, filed here.
Report, don't land.

## HQ direction — top-level `native/` + `native/generated/` (2026-09-23)

HQ riff, filed verbatim in spirit: sync is a kitchen sink; the RS
seam gets its own top-level folder called `native`. Inside it,
`native/generated/` hosts compiler-emitted artifacts the seam draws
from — the Rust contracts/vendor material, tasty bindings, and the
primitives roster (`generated/tasty`, `generated/primitives`).

Shape:
- `src/native/` — the RS-cut contract + call + retention protocol
  (ex-`sync/native.ts` grown into a subsystem; receives the 3.6
  streams when they land).
- `src/native/generated/` — generated artifacts drawn from Rust:
  contracts, tasty, primitives.

Morning notes: (a) this pre-answers NIGHT-4's home question on the
consume side — wherever primitives are *built*, Neo *draws* them via
`native/generated/primitives`; (b) CLOSED by HQ — they are
technically generated things that happen to be committed in source;
the name stands as honest.

## HQ quiet period + overnight orders (2026-09-23 ~21:00 BST)

- Quiet until **11:00 Thu Sep 24** — no questions to HQ before
  then unless literally everything is on fire. One-shot cron set
  (`7 11 24 9 4`) to lift the quiet and present the morning brief.
- Commit posture: commit often on green builds. Layers stays red —
  that never blocks commits on green tiers.
- Red markers: dead/wrong code (compile-files et al) gets flagged
  and, where proof is green, deleted — belongs-to-native noted.
- Standing orders for night crews: blocked → file a brief, move to
  the next task, never idle, never ping.

## Pre-night decision interview (HQ, 2026-09-23 ~21:00 BST) — SETTLED

Three blocking-before-midnight picks, HQ's words via structured
prompt. Status: FINAL (explicit HQ selection on each).

1. **Layers path: straight to seam.** No interim PostCSS rewrite
   of packed-css; T1–T5 stay grandfathered under the 3.5 ban until
   compiler-emitted streams replace them. Overnight crews scope
   (not harden) the seam.
2. **jsx-elements home: tracer-side.** `resolveJsxElements` leaves
   sync for the collect/tracer side — it emits styletrace input;
   publishing only carries the artifact. NIGHT-3's "stays" verdict
   on #11 is overridden.
3. **watch.ts: survey overnight, HQ picks at 11 AM.** A crew maps
   what the 331-line driver owns; stays-vs-splits decided morning.

Overnight scope authorized: land NIGHT-1; mechanical NIGHT-3 moves
(packager legs, css touchpoints, dead compile-files deletion) with
proof + stepped commits; native/ + native/generated/ restructure;
D17 seam scoping; watch survey. Open threads queued for 11 AM, not
worked around: NIGHT-2 home/deps picks, NIGHT-4 primitives build
home, watch verdict, D17 vocabulary.

## Overnight run — star-captain conn taken (2026-09-23 ~21:15 BST)

Pattern (HQ): cartographers map → implementers build → verifiers
think → captain re-proves firsthand and lands. Crews never commit;
captain commits named files, one verified arc per commit. No pings
to working crews, ever (ping-exit rule).

Objectives in order: N-0 land NIGHT-1 (captain) → N-1 mechanical
NIGHT-3 moves → N-2 native/ restructure → N-3 system/base build →
N-4 cartography (D17 seam scope, watch survey) for the 11 AM brief.

Wave 1 (dispatched): 3 cartographers (D17-SEAM, WATCH, SYSTEM-BASE
contents — read-only briefs) + 1 implementer (PACKAGER-LEGS, map
complete per NIGHT-3 #23,24,31-36). Verifiers follow each
implementer. N-0 runs inline (captain verify + land).

## WAVE1-WATCH — watch.ts survey for the 11 AM stays-vs-splits verdict (cartographer, 2026-09-23)

Scope: `packages/reference-neo/src/sync/watch.ts` (331 lines) read
firsthand + importer census by grep. READ-ONLY; this section is the
only write. All `watch.ts:<line>` refs below are current-tree.

### (1) Every responsibility in the file

| # | Responsibility | Location | Lines |
|---|---|---|---|
| R1 | Public contract: `WatchEvent`/`WatchChange`/`WatchCallbacks`/`WatchHandle` types | watch.ts:16-32 | 17 |
| R2 | Parcel→watch event map + timing/magic constants (`RESYNC_SETTLE_MS=60`, `ERROR_RESYNC_COOLDOWN_MS=5000`, `GLOB_MAGIC`, `STATIC_IGNORE`) | watch.ts:34-43 | 10 |
| R3 | Watch-root derivation: `normalizePattern`, `staticPrefix` (static head of an include glob), `isUnder`, `collapseRoots` (shortest-first nested dedupe), exported `deriveWatchRoots` | watch.ts:49-88 | 40 |
| R4 | `.gitignore`→watcher-ignore compiler: `isIgnorableLine`, `anchoredIgnoreTarget`, `basenameIgnoreGlobs`, `anchoredIgnoreGlobs`, `toIgnoreGlobs` (one line → globs), `readIgnoreFile`, `isWalkEnd`, `getIgnoreGlobs` (ancestor climb to repo/fs root) | watch.ts:90-154 | 65 |
| R5 | Event matching: `WatchState`, `toWatchChange` (include-glob OR exact config-dep hit), `isDroppedEventsError` | watch.ts:156-174 | 19 |
| R6 | Resync scheduler: `ResyncScheduler` iface + `createResyncScheduler` (trailing-edge debounce + drain-serialize: burst behind slow sync costs ≤1 extra pass; `settle()` cancels timer, drains in-flight) | watch.ts:176-235 | 60 |
| R7 | Watcher error policy: `createWatcherErrorHandler` (dropped-buffer silent, else report + cooldown-gated immediate resync) | watch.ts:240-250 | 11 |
| R8 | Parcel fan-in: `createParcelHandler` (one callback over all roots; matched events → onChange, one debounced resync per burst) | watch.ts:256-271 | 16 |
| R9 | Driver `watchSync`: baseline `loadUserConfigWithDependencies` + `sync()`, build `WatchState`/roots, wire scheduler+handler, `subscribe()` per root, `stop()` (settle + best-effort unsubscribe) | watch.ts:281-331 | 51 |

Largest blocks: R4 (65) + R6 (60) + R9 (51) + R3 (40) = 216/331
(65%). R4 is a pure function cluster (fs reads only); R6 is pure
control-flow (no fs, no parcel); R9 is the only impure orchestrator.

### (2) Imports in / out

**What watch.ts imports:**
- From `sync/`: exactly one — `sync, SyncResult` from `./index.ts`
  (watch.ts:14). Calls `sync(projectRoot)` twice (baseline :284,
  resync :301). Imports NOTHING else from sync/ (no phases, clean,
  native, publish, reset, packed-css, reference-types).
- From elsewhere in Neo: `loadUserConfigWithDependencies` from
  `../config/load.ts` (:13).
- External: `node:fs` (`existsSync`, `readFileSync`), `node:path`,
  `@parcel/watcher` (`subscribe`), `picomatch`.

**What imports watch.ts** (grep census, current tree):
- `bin/neo.ts:87` — `cmdWatch` lazy-imports `watchSync` (the only
  production caller; `neo sync --watch`).
- `tests/cases/sync/NEO-SYNC-14/specs/watch.spec.ts:12` — node-side
  watch contract (add/change/delete, debounce, config-dep).
- `tests/cases/watch/NEO-WATCH-01/specs/watch-loop.spec.ts:15` —
  live-edit→paint loop.
- Nothing under `src/` imports it — zero in-tree dependents. No
  test imports `deriveWatchRoots` (exported but exercised only
  through `watchSync`).

Coupling summary: watch is a **leaf**. One sync entry-point in
(`sync()`), one config loader in, one CLI caller out, two case
specs. Moving it breaks no `src/` importer.

### (3a) Case for STAYS (engine block's driver loop)

1. **Single-responsibility reads as one thing**: "keep a project
   directory converged via serial syncs" — R3/R4/R5 are input
   shaping, R6/R7/R8 are delivery control, R9 wires them. Splitting
   a 331-line leaf with zero in-tree dependents buys no
   decoupling; it buys file-hopping.
2. **The serial-sync invariant lives here**: R6's drain (syncing/
   queued/cancelled, :193-204) plus R7's cooldown is the exact
   machinery that makes "discovery, alignment, and deletion all
   ride the same full resync" (header :4-5) true under bursts,
   flapping backends, and teardown races. That invariant is the
   engine block's; the driver loop is its natural home.
3. **Only two seams touch sync/** (`sync()` in, nothing out) —
   staying costs sync/ nothing: no phases/native/publish
   entanglement to untangle, no circular-import risk.
4. **Churn profile is driver-like**: future watch work (extra
   roots, backend swap, settle semantics) edits R9+R6 together;
   colocation keeps the diff in one file and the two case specs
   green without cross-subsystem coordination.
5. **Counter to the size argument**: 331 lines is the *median* RF
   module, not an outlier, and 65 lines are the R4 ignore compiler
   with zero shared callers — extracting a private helper nobody
   reuses is ceremony.

### (3b) Case for SPLITS (own subsystem)

1. **R4 is a portable library hiding in a driver**: the
   `.gitignore`→globs compiler (65 lines, pure + fs reads, no
   parcel/sync/watch concepts) is independently testable and the
   likeliest reuse candidate (any future walker/scan dedupe, e.g.
   native-scan ignore parity). Home if split:
   `sync/watch/ignore-globs.ts` (stays near its only caller) or
   `infra/ignore/` if HQ wants cross-cutting reuse.
2. **R3+R5 are a matcher subsystem**: root derivation + change
   matching (59 lines combined) encode "what does this project
   watch" — config-include semantics distinct from "how does the
   loop run". Home: `sync/watch/roots.ts` + `sync/watch/match.ts`,
   or one `sync/watch/scope.ts`.
3. **R6 is a generic primitive**: the debounce+serialize scheduler
   mentions neither files nor sync; it wraps `() =>
   Promise<void>`. Home: `sync/watch/scheduler.ts`, or promoted to
   `infra/`/`utils/` if any second consumer appears (none today —
   split would be speculative).
4. **Natural split shape** (if HQ picks splits): `sync/watch/`
   with `index.ts` (R9 driver + R1 types + R8 handler, ~85 lines),
   `scope.ts` (R3+R5), `ignore-globs.ts` (R4), `scheduler.ts`
   (R6+R7) — four focused modules, each ≤90 lines, same package,
   same two spec files, zero `src/` importer churn (only
   `bin/neo.ts:87` re-points).
5. **Cost of splitting is near-zero**: leaf module, one CLI
   caller, two specs — the move is mechanical and provable in one
   `agentneo run` of SYNC-14 + WATCH-01.

### (4) Recommendation: STAYS (with a named future split trigger)

**Keep `watch.ts` whole in `sync/`.** Reasons:

- It is a leaf driver (one `sync()` in, zero `src/` dependents),
  and its 331 lines implement exactly one invariant — *every
  matched fs event converges through one serial debounced sync*.
  R3–R8 are all private legs of that invariant with no second
  caller; extracting them now creates four files and zero new
  reuse.
- The split axis will be obvious when it arrives: **the day a
  second consumer wants R4 (ignore compiler) or R6 (scheduler),
  split then** — R4 → shared ignore helper, R6 → infra primitive,
  driver stays. Until that consumer exists, the split is
  speculative structure.
- If HQ prefers visible subsystem boundaries anyway, the
  zero-regret middle path is a no-logic move to
  `sync/watch/index.ts` (same file, subsystem-shaped path),
  leaving R4/R6 extraction for the trigger above. Do NOT
  pre-split into four files on day one.

Proof for either verdict: `pnpm agentneo run NEO-SYNC-14` +
`pnpm agentneo run NEO-WATCH-01` green, plus `bin/neo.ts:87`
import path updated if moved. No other file in `src/` can break.

## Captain's NIGHT-3 review (2026-09-23) — overrides for the waves

Read firsthand. The 41-item census stands as the map; five rulings
where later HQ decisions or the seam interact:

1. #11 (jsx join stays) — SUPERSEDED by PLAN §3.10/3.11: one move
   to system/base. N-3 crew owns it.
2. #12-14 (native.ts stays) — SUPERSEDED by HQ native/ direction:
   top-level native/ owns the seam. N-2 crew owns it.
3. #31 (publish/system.ts pure move to packager) — REFINED by
   §3.11: WAVE1 legs crew moves it whole (lands in packager, where
   the write half lives permanently); N-3 crew then splits the
   build half out to system/base. No rebrief needed.
4. #18/#19 + #7 (packed-css + merge wrapper → css/) — HOLD. HQ
   picked straight-to-seam: the merge dies by streams, and moving
   code the seam deletes may be wasted motion. WAVE1-D17-SEAM
   rules: move-then-delete vs delete-in-place. #15-17 (reset.ts →
   css/) is seam-independent and proceeds in N-1 wave 2.
5. #22 (compile-files.ts) — DELETE approved (HQ red marker), green
   proof required. N-1 wave 2.
6. #25-30 (watch stays) — OPEN per HQ: WAVE1-WATCH surveys, HQ
   picks at 11 AM.
7. Minor edge (packager/types.ts:6 type import) — resolved by
   §3.11: the artifact type lives in system/base; packager/types
   and collect import it. N-3 owns the line.

## Captain's NIGHT-4/5 review (2026-09-23) — aligned, one collision

Read firsthand. NIGHT-4 (home brief) and NIGHT-5 (3.9 spec) agree:
RS-emits/Neo-proves SPLIT (N4 rank 1 = N5 assumption). N5 is
implementation-ready (E1/E2/E3/E4 shapes, PGEN-01..22 station,
seam table, W0-W6 waves). Findings banked: canon/Neo drift already
real (125 vs 101, silent SVG drop), F1 camelCase third column,
F3 PropDefs refactor, freshness hole (`--check` convention-only —
must wire into `agentneo q` + CI under any home).

COLLISION queued for 11 AM: N5 specs vendored paths under
`src/vendor/rust-primitives/` with the `vendor/ → upstream/` rename
still open — but HQ has since decreed `native/generated/` as the
consume-side home (contracts, tasty, primitives). Captain's lean:
the vendor contract migrates to `native/generated/`, the
`upstream/` rename dies, N5's tool targets the new paths. HQ
confirms in the morning; N5's shapes/waves are path-agnostic and
survive either way.

Other 11 AM picks from N4/N5: rank-1 confirm (or all-Neo fallback),
emit 125 vs 101+deferred (spec default 125), SVG scoping.
Sequencing: N5 waves are MORNING work (spec §4 gates on stability);
nothing overnight on primitives. W4 (assembly cutover) sequences
after N-1 lands (it rewrites the legs Wave 1 is moving).

## WAVE1-SYSTEM-BASE (cartographer, 2026-09-23) — READ-ONLY spec

Scope (strict): spec the exact contents of the new
`packages/reference-neo/src/system/base/` per PLAN.md §3.11
(portable-system domain only — base assembly, roster +
extends-chaining, BaseSystem contract types, serious tests).
READ-ONLY: this section is the sole write; no source edits,
no commits, no index touch.

TREE CAVEAT (firsthand): the WAVE1 legs crew moved
`sync/publish/*` → `packager/*` mid-survey (git status:
5 deletes + `sync/react.ts` + `sync/reference-types.*`
deleted, 8 creates under `packager/`; `sync/publish/` no
longer exists). This matches the logged N-3 sequencing
(legs land in packager whole; N-3 splits the build half
out) — so this section IS the N-3 split brief, and every
`packager/system.ts` line below was re-verified AFTER the
move (byte-identical to the old publish leg except
import paths, `packager/system.ts:9-13`).

### (1) Move-in inventory (every file:line, current tree)

MOVE (7 sources → `system/base/`):

1. `config/types.ts:9-17` — `BaseSystem` interface → `base/types.ts`.
   (`ReferenceUIConfig` + `defineConfig` stay: author surface.)
2. `config/validate.ts:10-13` (`BaseSystemField`,
   `BaseSystemValidationOptions`) + `:15-28`
   (`assertOptionalJsxElements`) + `:95-181`
   (`validateBaseSystems`, `assertBaseSystemObject/Name`,
   `assertRequiredFragment`, `validateBaseSystemEntry/Entries`)
   → `base/validate.ts`. The call at `:196-197` stays in
   `validateConfig` (config imports base — the healthy arrow).
3. `config/errors.ts:57-60` — `invalidBaseSystem` factory →
   `base/validate.ts` (sole consumer is the moving validator,
   verified: hits only at `validate.ts:23/:104/:119/:132/:152`).
   `config/errors.ts` keeps a re-export for compat.
4. `sync/jsx-elements.ts:1-35` WHOLE — `JsxElementsArtifact` +
   `uniqueSorted` + `resolveJsxElements` → `base/jsx.ts`. This
   is the §3.10 join + the §3.11 roster: upstream from
   `config.extends`, local from configured ∪ traced, merged
   union, `primitives: []` until the 3.9 roster lands.
5. `sync/packed-css.ts:1-128` WHOLE — `PackedUpstream`,
   `stripResetLayer`, `mergePackedStylesheets` → `base/packed-css.ts`.
   This is the css extends-chaining half. **SEAM-HOLD
   CAVEAT**: WAVE1-D17-SEAM holds `#18/#19+#7` (packed-css →
   css/) on "moving code the seam deletes may be wasted
   motion" — the same logic touches this move. Implementer
   checks the seam ruling first: merge survives → it moves
   here; streams delete it → delete-in-place wins and base/
   ships without this file. Everything else in this spec is
   seam-independent.
6. `collect/lib/evaluate.ts:137-146` — `createPortableFragmentBundle`
   → `base/fragments.ts`. Output-side assembly (it builds
   `baseSystem.fragment`); signature NARROWS to
   `(upstream: string[], local: string[])` so base never
   imports collect's `PreparedFragments`. Call site
   `sync/index.ts:221` adapts; `collect/index.ts:31` barrel
   DROPS the re-export (internal-only, verified: consumers
   are `sync/index.ts:221` + `prepare.test.ts:234` only).
7. `packager/system.ts:15-104` — ALL builders →
   `base/sources.ts` + `base/assemble.ts` (split line in §2).

STAY (explicitly not moving — the negative list is the spec):

- `collect/lib/evaluate.ts:70-86` (`getUpstreamFragments`,
  `getUpstreamFragmentNames`) STAYS in collect: it gathers
  eval inputs (discovery-side). Moving it would make
  collect import system — the exact arrow §3.11 forbids.
- `collect/lib/evaluate.ts:202-222` (eval script assembly),
  `:269-284` (`scopeUpstreamTokenFragment`), `:286-317`
  (`mergeCollectedSpec`) STAY: evaluation + merge are
  collect's input-side job.
- `packager/system.ts:106-120` (`writeSystemDir`) STAYS: the
  thin write-to-disk packager leg (§2).
- `packager/types.ts:8-15` (`PublishInput`) STAYS:
  packager-owned assembly contract; `:6` repoints its
  `JsxElementsArtifact` import to the new home (the logged
  "#25-30 minor edge" N-3 owns).
- `packager/constants.ts:7` (`BASE_SYSTEM_HEADER`) STAYS:
  packager-wide stamp (styled, types-bundle, reference-types
  legs all use it too). `base/sources.ts` imports the leaf
  const (`constants.ts` imports nothing — zero cycle risk);
  alternative (leg threads it as an arg) noted, not
  recommended.
- `packager/packages.ts:18-28` (`SYSTEM_PACKAGE`) STAYS:
  manifest owned by packager.
- `sync/index.ts:121-132` (`mergePublishedStylesheets`
  wrapper) STAYS: 3-line call-site glue, repoints its
  `packed-css.ts` import. Call sites `:171`/`:215` stay;
  `:22` import repoints.
- `src/index.ts:5` (`BaseSystem` re-export) repoints to the
  new home; `config/types.ts` keeps a `export type`
  re-export so deep `config/types` importers don't break.
- `src/system-surface.d.ts` untouched (world typings, names
  not sources).

REPOINT-ONLY (import line changes, zero logic moves):
`packager/types.ts:6`, `sync/index.ts:18-22`,
`collect/lib/scan/goldens.test.ts:22` (consumer at `:96-100`),
`sync/lib-barrel-negation.test.ts:19` (consumer at `:65`).

Legacy precedent (why "base" is the right word):
`reference-legacy/src/system/base/{create.ts (122 lines),
types.ts (12), fragments/, README}` — "Owns the portable
`baseSystem` concept", writes `baseSystem.mjs`/`.d.mts`.
Neo's `base/` mirrors it tight: NO scan (collect owns
discovery), NO panda/collector bundle (retired) — assembly
only.

### (2) The build/write split line in `packager/system.ts`

The line is `104/105`: everything pure moves, everything
fs stays. Above the line — zero `node:fs`, all move:

- `:15-22` `publishedBaseSystem` → `base/assemble.ts`, RENAMED
  signature: takes `{ name, fragment, css?, jsxElements }`
  instead of `PublishInput` (else base imports packager types
  while the packager leg imports base — a cycle for nothing).
  The leg adapts at the call.
- `:24-34` `baseSystemInterfaceSource`, `:36-38`
  `baseSystemTypesSource`, `:40-76` `systemEntrySource`,
  `:78-100` `systemTypesSource`, `:102-104`
  `baseSystemMjsSource` (already exported; no other callers —
  verified) → `base/sources.ts` verbatim.

Below the line — stays a packager leg permanently:

- `:106-120` `writeSystemDir`: mkdir + 7 writes
  (`baseSystem.mjs` ← assemble + mjs source;
  `baseSystem.d.mts`, `system.mjs`, `system.d.mts` ← sources;
  `evaluated-system.json` + `jsx-elements.json` ← inline
  `JSON.stringify`, publish-inventory dumps, NOT assembly;
  `package.json` ← `writePackageJson` + `SYSTEM_PACKAGE`).

Out-of-leg confirmations: `compile-request.json` is written
by `sync/index.ts:231-235`, which its own comment marks "a
sync diagnostic, not packaging" — stays in sync, untouched
by this move.

### (3) Proposed layout (collect surface/lib + README law applied)

Collect's law has two parts: the shape (surface/ + lib/)
and the discipline (purpose-first READMEs, NOT-owns lists,
2-6 sentence file headers, never directory tours). Base
has ONE face — no author imports (generated `baseSystem.mjs`
is data, not source) — so the shape does NOT split; the
discipline applies in full. Flat, README-guarded:

```text
src/system/
  README.md          # the portable-system domain thesis
  base/
    README.md        # the assembly story (below)
    index.ts         # barrel: contract + assembly, nothing else
    types.ts         # BaseSystem + BaseAssemblyInput + ExtendsCarrier (1–3)
    validate.ts      # extends-entry validators + invalidBaseSystem (2–3)
    jsx.ts           # JsxElementsArtifact + resolveJsxElements (4)
    packed-css.ts    # merge + strip + PackedUpstream (5, seam-gated)
    fragments.ts     # createPortableFragmentBundle, narrowed (6)
    sources.ts       # emitted-source builders (7a)
    assemble.ts      # published-system assembly root (7b)
    *.test.ts        # colocated serious tests (§4)
```

`types.ts` also defines the two structural inputs that keep
base a LEAF (imports nothing project-side): `ExtendsCarrier
{ extends?; jsxElements? }` for `resolveJsxElements`
(`ReferenceUIConfig` satisfies it structurally — no
config↔base type cycle, no call-site change) and
`BaseAssemblyInput` for the assembler (§2). Resulting
arrows: config→base, packager-leg→base, sync→base,
collect-goldens→base; base→nothing.

README theses (implementer drafts, reviewer holds the law):
`system/README.md` — "the portable-system domain: what a
system IS once published" + NOT-owns (discovery/collect,
compile, publish-act/packager, runtime). `base/README.md` —
"assembles portability from discovery + config: upstream
bundles + local IIFEs → fragment; upstream css + own block
→ portable sheet; configured ∪ traced names → roster; all
three + name → the published BaseSystem" + NOT-owns (eval,
compile, writes-to-disk, jsx tracing itself).

Naming-collision watch (§3.11 open thread): `src/system/`
vs generated `outDir/system/` share a word, never a path —
all imports relative, no id collision. If a future barrel
id (`@reference-ui/system`) confuses, the generated package
keeps the id (shipped contract) and src stays relative-only.

### (4) Serious-test list

RE-HOME with the code (move, don't rewrite):

- `sync/packed-css.test.ts` WHOLE (364 lines, 15 tests:
  `stripResetLayer` ×6, statement ×4, reset ×2, scoping ×1,
  assemblies ×3) → `base/packed-css.test.ts` verbatim.
- `config/validate.test.ts:182-244` (`validateConfig extends`,
  4 tests) → `base/validate.test.ts`.
- `collect/lib/prepare.test.ts:230`
  (`creates a portable fragment bundle in stable
  upstream-then-local order`) → `base/fragments.test.ts`,
  adapted to the narrowed signature.
- STAY PUT: `prepare.test.ts:114` (upstream filtering —
  collect behavior), `evaluate.test.ts:127` + `:257`
  (extends threading + provenance — eval behavior),
  `sync/sync.test.ts:203-248` (`sync extends adoption`,
  2 tests — pipeline integration, sync's contract),
  `goldens.test.ts` + `lib-barrel-negation.test.ts`
  (repoint imports only).

NEW unit batteries (genuine gaps — nothing pins these today):

- B1 emitted-source goldens: exact-string pins for the
  interface, entry, and both `.d.mts` builders (today only
  case specs touch these strings; SYNC-06 determinism would
  catch drift but never names the culprit builder).
- B2 assemble mapping: name/fragment/css/jsxElements from
  the narrow input, incl. css-absent → field undefined.
- B3 build→validate round-trip: `assemble` output passes
  `validateBaseSystemEntries` — the extends chain's founding
  invariant, currently unpinned anywhere.
- B4 jsx-resolve battery: trim/dedupe/sort, upstream merge,
  traced union, empty→`[]`, and the `primitives: []` pin
  (MUST fail loudly the day 3.9 lands a producer — that
  failure is the producer's first test).
- B5 fragment-bundle order: multi-upstream declared order
  preserved ahead of local (extends the single existing
  order test).
- B6 validation edges: non-object entry, whitespace-only
  name (the 4 moved tests cover the main shapes; these two
  branches have no pins).

CASE-LEVEL (existing homes — ZERO new cases required):
NEO-SYNC-10 (adoption baseline), NEO-SYNC-17 (strip) +
NEO-TOKEN-09 (owner passthrough, per SYNC-17's README),
NEO-LAYER-02 (nesting + portable-css injection),
NEO-SYNC-15 (configured-only request vs published union),
NEO-SYNC-04 (frozen `jsxHosts`), NEO-SYNC-06 (byte-identical
re-sync pins every builder), NEO-SYNC-07 (stale cleanup pins
the leg inventory). OPTIONAL (implementer's call, not a
gate): a 3-level transitive chain world — units pin two
levels (`packed-css.test.ts:296`), cases pin one hop
(SYNC-10); a third level is defense-in-depth, not a gap.

### (5) Ordered move slices for the implementer

S0 types: `types.ts` (+ narrow inputs) + re-exports;
repoint `index.ts:5`, `packager/system.ts:9`,
`config/validate.ts:6`, `collect/lib/evaluate.ts:10`.
Proof: `agentneo q` + full unit file green.

S1 roster: `jsx.ts` verbatim (+ `ExtendsCarrier` narrowing);
repoint §1 repoint-only list + `packager/types.ts:6`.
Proof: units + `goldens.test.ts` + `lib-barrel-negation`.

S2 css chain (SEAM-GATED): `packed-css.ts` + its test file
verbatim; repoint `sync/index.ts:28` + wrapper `:121-132`.
Skip-if-deleted per §1 caveat. Proof: packed-css suite +
SYNC-10 + LAYER-02.

S3 fragment bundle: `fragments.ts` (narrowed) + B5 test;
adapt `sync/index.ts:221`; drop `collect/index.ts:31`.
Proof: prepare suite + SYNC-10 + SYNC-17.

S4 contract enforcement: `validate.ts` (+ factory) + moved
extends tests + B6; `config/validate.ts:196-197` repoints;
`config/errors.ts` re-exports. Proof: validate suite +
evaluate suite + SYNC-10.

S5 leg split: `sources.ts` + `assemble.ts` (+ B1/B2/B3/B4);
`packager/system.ts` thins to imports + `writeSystemDir`;
`publishedBaseSystem` dies at the adapted call. Proof: full
units + SYNC-04/06/07/15 (the byte-shape quartet).

S6 address: both READMEs + `base/index.ts` + file headers
(2-6 sentences, README law); final proof = units + `q` +
`agentneo run` SYNC-10/15/17 + LAYER-02. NO chain/T1: pure
TS refactor, publish bytes unchanged (SYNC-06 is the proof).

Concurrency note: NIGHT-1 (packager follow-ups) is writing
`packager/` + needles concurrently — disjoint files from
this spec except shared import lines; implementer
re-verifies §1 line numbers at slice start, moves nothing
NIGHT-1 owns.

## WAVE1-D17-SEAM — layers-seam scope for the straight-to-seam decision (cartographer, 2026-09-23)

Scope: `packages/reference-neo/PLAN.md` §3.6 (+ §3.10/3.11 homes),
packed-css + merge + engine emission + publish legs, all read
firsthand. READ-ONLY; this section is the only write. Decision
recorded as **Final**: packed-css dies by seam, no interim PostCSS
hardening of the merge path — PostCSS stays for CSS we do NOT
control (3.2), streams for CSS we do.

### (1) What packed-css.ts + mergePublishedStylesheets do today

**`src/sync/packed-css.ts` (128 lines)** — `mergePackedStylesheets
(upstreams, own, selfName)` (:118-128) assembles one cascade-correct
sheet: a top-level `@layer a, b, …;` statement, then upstream blocks
verbatim-but-reset-stripped, then the own block verbatim. Pieces:
- `collectLayerNames` (:89-101) — statement names by first-occurrence
  dedupe, self last. Upstream names come from *re-parsing our own
  published text*: `contributedNames` (:79-87) reads the payload's
  leading statement via `LEADING_STATEMENT` regex (:21) — transitive
  induction (a merged publisher already lists its closure), else the
  bare system name.
- `stripResetLayer` (:62-71) — deletes every `@layer reset {…}` via
  `findResetBlock` (:47-54) + hand-rolled `matchCloseBrace` (:30-40).
  The consumer's own reset rides its block (so `normalizeCss: false`
  opts the whole subtree out).
- `appendBlock` (:103-107) newline join. No usable upstream css → own
  block returns byte-identical (no statement, no join).

**`mergePublishedStylesheets`** (`src/sync/index.ts:121-132`, called
once at :217) runs that merge **twice**: served sheet (upstream
portable blocks + own `:root`-hoisted block) and published portable
(upstream portable blocks + own self-scoped block). Upstream payloads
are `config.extends` `BaseSystem` entries structurally satisfying
`PackedUpstream {name, css?}` (packed-css.ts:10-13).

**Census (grep, current tree):** `BaseSystem.css` is produced only at
`sync/publish/system.ts:19`, presence-checked at
`config/validate.ts:148`, consumed only by the merge (:217).
`packed-css` importers: `sync/index.ts:28` + `packed-css.test.ts`
(364 lines, dies with it). Companion law: `collect/lib/
evaluate.ts:151` — upstream globalCss is suppressed at eval because
it ships via this merge (stays true under streams).

### (2) What the engine emits + where streams attach

**Result shape.** Rust `CompileResult`
(`modules/atomic/src/types.rs:74-102`): `stylesheet` +
`portable_stylesheet` (+ runtime, diagnostics, `traced_jsx_hosts`,
…). TS mirrors: `sync/native.ts` `NativeCompileResult:56-74`
(`portableStylesheet?` optional) and `contracts/types.ts:164-179`
(required — minor drift to reconcile in the slice).

**The single attach point** is `assembly.rs:101`
(`build_stylesheets_with`). The emitter (`stylesheet/emitter/
mod.rs:75-93`) already thinks in chunks, then concatenates before
crossing: `shared_layers` (:96-105, recipes+utilities printed once,
byte-identical in both sheets) + divergent system-layer heads
(reset+global+tokens). The two sheets differ **only in token
selectors** (`:root` vs `[data-layer]` —
`system_layers/mod.rs:220-244`); reset+global print identically via
`global::append_reset_css` (`global/mod.rs:21-41`,
`is_reset_fragment` :59-62 name match) and `append_global`
(system_layers:47-60). Package wrap: `wrap_package_layer`
(`layers/mod.rs`, preamble `LAYER_PREAMBLE` = the 6-layer contract).

**Wire precedent.** Slim N-API already ships structured-ish:
`SlimCompileResult` (`native.rs:175-207`) refolds portable as
head+shared-tail via `wire::split_shared_suffix` (`wire.rs:25-32`,
content-agnostic string algebra); JS rebuilds in
`modules/atomic/js/runtime.ts:53-68`. Streams extend this seam, and
`tracedJsxHosts?` is the additive-optional precedent
(`native.ts:66`, "absent on older engines").

Net: the emitter's push sequence IS the stream vocabulary waiting to
be captured — preamble / reset / global / tokens / tokens-portable /
recipes / utilities / package-wrap. Nothing needs inventing on the
RS side, only exposing.

### (3) Stream vocabulary + recommendation

Candidates:
- **A. Per-layer streams** — statement names as `string[]` data + one
  string per layer block (reset, global, tokens, tokensPortable,
  recipes, utilities) + package name as data. Mirrors the emitter 1:1.
- **B. Per-concern** — HQ's §3.6 hint "(the layout bit, everything
  else)": e.g. `{layout, theme, content, reset}`. Coarser, but the
  merge still needs per-system statement names → carries names
  alongside anyway, so it saves nothing and re-lumps reset handling.
- **C. Sheet object** — nested `{statement, blocks:{…}}`. Same content
  as A with deeper nesting; no added expressive power.

**Recommend A** (per-layer, B's naming discipline). The merge needs
exactly three things, and A is the minimal vocabulary satisfying
all three: (i) names as data (kills `LEADING_STATEMENT` regex),
(ii) reset as a separable chunk (kills `matchCloseBrace` — strip
becomes stream-drop), (iii) served-vs-portable token variants
(already the sole sheet divergence). B fails (ii); C is A with
indentation.

**Do NOT resurrect `cssChunks[]`.** `contracts/types.ts:181-198`
still declares `PortableCssChunk`/`PortableBaseSystem`, but the
Pubshape crew jettisoned the plural shape deliberately (this log
~:4372ff; NEO-SYNC-03 pins "no plural survivors"). Streams are
*keyed layer fields on the compile result*, not a hashed chunk list;
`BaseSystem.css` stays the published string (kept matrix T2/T8 tiers
passthrough singular `css` — untouched). Structured *published*
payloads are a D17-layers decision, not this seam.

**Wire + cut shape:** extend `SlimCompileResult` with an optional
streams object (small field count — ship verbatim, no refold
cleverness; the 14 MiB sheet stays whole-string on the slim path).
Recommend **hard cut behind a schema bump** over additive fallback
(sync sends `schemaVersion: 1`, native.ts:176; fallback paths would
double the merge code). Byte-identity constraint: stream assembly
must reproduce today's exact bytes — LAYER-01/02 pins, chain specs,
NEO-CHAIN-06 real-upstream — since each layer already prints as one
contiguous push, streams = capture the pushes.

### (4) TS receive side — dies / shrinks / lands

**DIE:**
- `src/sync/packed-css.ts` (128) + `packed-css.test.ts` (364).
- `mergePublishedStylesheets` (`sync/index.ts:121-132` + :217 call)
  → one stream-assembly call. First deletion proof of the 3.5
  regex-ban law.

**SHRINK (not die):**
- `sync/index.ts` — merge site becomes the assembly call;
  `PublishInput.stylesheet/portableStylesheet` stay strings
  (assembly *output*, never surgery input again).
- `sync/native.ts` — `NativeCompileResult` gains the streams field;
  seam file stays until the `native/` home lands (below).
- `config/validate.ts:147-157` — UNCHANGED (published `css` stays
  string; the `fragment/css/jsxElements` presence rule survives).

**LAND:**
- Stream assembly → **`src/system/base/`** per §3.11 (does not exist
  yet — N-3 owns the line per the 11 AM notes at this log's tail;
  coordinate file layout): `mergeStreams(upstreams, own, selfName)`
  pure + heavy unit tests ported from packed-css.test.ts (statement
  dedupe, diamond identical bytes, reset-drop, empty passthrough).
- Seam receive types → the native seam: `sync/native.ts` today, but
  HQ has decreed `native/generated/` as the consume-side home (see
  the NIGHT-4/5 review above) — the streams type should live with the
  vendored contracts, not hand-mirrored in sync/.
- `publish/system.ts` build/write split per §3.11: pure build (base
  assembly incl. stream merge) → `system/base`; `writeSystemDir`
  stays a packager leg.
- **Untouched:** `reset.ts` (spec-side injection stays — the engine
  still routes reset-named sources; only the TS *strip* side dies),
  `styled.ts`/`react-shell.ts` (consume assembled strings),
  `evaluate.ts:151` suppression, §3.10 jsx-elements join (already
  structured via `tracedJsxHosts`; moves to `system/base` once,
  orthogonal to streams).

### (5) Ordered slices for the morning

- **S1 (RS): capture.** Refactor `build_stylesheets_with` to build a
  streams struct, then concat (byte-identical; existing emitter +
  `cargo` tests prove). No seam change. (`agent-rs` loop + quality
  gate.)
- **S2 (RS): cross.** Extend `CompileResult` + slim N-API with the
  streams object; schema bump; proof channel keeps full strings.
- **S3 (TS seam): receive.** `sync/native.ts` += streams field;
  `contracts/types.ts` mirror + fixture (reconcile the
  optional/required drift noted in (2)).
- **S4 (TS assembly):** new `system/base/` assembler, pure +
  ported unit battery. (Needs N-3's file layout first.)
- **S5 (cutover):** `sync/index.ts` swaps the call; DELETE
  packed-css.ts + test. Prove: units + `agentneo q` + chain 6/6 +
  LAYER-01/02 + SYNC-10/17 + NEO-CHAIN-06 + T1/T2 hermetic re-gate
  (publish-shape touch → PLAN §2 gate rule).
- **S6 (hygiene):** tell NIGHT-2's CSS-touchpoint map the merge is
  resolved-by-seam (no PostCSS on the controlled path); file the
  3.5 ban's first deletion.

**Ordering/parallelism:** S1+S2 RS-serial; S3+S4 TS-side can run
parallel to S1 once the 11 AM call freezes the vocabulary (rec: A)
+ hard-cut + `system/base` layout; S5 after both; hermetic re-gate
on S5 only. **Watch-outs:** N-1 rewrites the publish legs Wave 1
is moving — S4/S5 sequence after N-1 lands (same rule as N5-W4);
kept T2/T8 tiers never see the seam (singular `css` preserved).

## WAVE1-PACKAGER-LEGS — NIGHT-3 packager move (implementer, 2026-09-23) — DONE

Mechanical N-1 move per the NIGHT-3 cut list (#23, #24, #31-36 +
#41 test) and the Captain's NIGHT-3 review ruling 3 (system.ts
moves whole; N-3 owns the later build/write split). Pure moves:
every moved file differs from HEAD in import lines only
(verified per file via `git show HEAD:<old> | diff - <new>`).
Zero behavior change; no commits (report, don't land).

### Files moved (8)

Base: `packages/reference-neo/src/`. Flat into `packager/`,
basenames preserved (no collisions with the existing
assembly/assets/constants/externals/layout/manifest/packages/
postprocess/types set):

| # | From | To |
|---|---|---|
| 23 | `sync/react.ts` | `packager/react.ts` |
| 24 | `sync/reference-types.ts` | `packager/reference-types.ts` |
| 31 | `sync/publish/system.ts` | `packager/system.ts` |
| 32+33 | `sync/publish/styled.ts` | `packager/styled.ts` |
| 34 | `sync/publish/react-shell.ts` | `packager/react-shell.ts` |
| 35 | `sync/publish/types-bundle.ts` | `packager/types-bundle.ts` |
| 36 | `sync/publish/links.ts` | `packager/links.ts` |
| 41 | `sync/reference-types.test.ts` | `packager/reference-types.test.ts` |

`sync/publish/` removed (empty after the move). Post-move
`sync/` matches the NIGHT-3 forecast minus the held/deferred
items: index, native, jsx-elements, clean, phases, watch +
picomatch.d.ts, packed-css + reset (+ tests), compile-files
(deletion owned by N-1 wave 2).

### Import sites updated (3, + the moved files' own imports)

- `packager/assembly.ts` — 7 leg imports `../sync/...` → `./...`;
  line-3 header comment updated (the "legs still live under
  sync/" sentence is now false; assembly body untouched, call
  order untouched).
- `benchmark/deepsee/worker-phases.ts` — 6 leg imports
  `../../src/sync/...` → `../../src/packager/...` (import-only).
- `tools/build-bin.mjs` — `PATH_LITERAL_SOURCES` keys
  `src/sync/react.ts` → `src/packager/react.ts`,
  `src/sync/reference-types.ts` →
  `src/packager/reference-types.ts` (path-string reference the
  packed-bin build asserts; literals themselves unchanged).

Inside the moved files: `../packager/*` → `./*`,
`../../packager/*` → `./*`, `../../config/*` → `../config/*`,
`../../lib/*` → `../lib/*`. `sync/index.ts` untouched (calls
`assembleSystem` only — confirmed by import census before the
move). `packager/types.ts:6` untouched per the Captain's ruling
7 (artifact type home is N-3's line).

Depth check (why zero-behavior holds for path computation):
`react.ts`/`reference-types.ts` resolve `runtime/` + `entry/`
via `import.meta.url` + `'..'` — same depth after the move
(`src/sync/` → `src/packager/`), so every computed path is
byte-identical. The five `publish/` legs use no
`import.meta.url` resolution. The moved test's `HERE,'..',...`
entry/decl/browser probes likewise resolve identically.

### Proof output

- Full Neo vitest: **48 files / 337 tests green**
  (`pnpm vitest run` in `packages/reference-neo`, exit 0).
- `pnpm agentneo q`: **0 errors, 17 warnings, 214 files** —
  identical to the pre-move baseline taken this session (0
  errors, 17 warnings, 214 files). Zero new errors.
- Chain cases: **NEO-CHAIN-01..06 all PASS** (`transitive`,
  `diamond`, `parallel`, `multi-extends`, `depth`,
  `real-upstream`; each `agentneo run` also typechecks green —
  the CLI refuses on red types).
- Post-move grep: zero remaining code references to
  `sync/publish`, `sync/react`, `sync/reference-types` outside
  prose docs (see surprises).

### Surprises

1. One self-caught miss mid-proof: `types-bundle.ts:9` carries a
   `../../packager/constants.ts` import I first read as
   import-free; the first vitest run flagged it (`Cannot find
   module`), fixed to `./constants.ts`, full suite green on
   re-run. Nothing else hid.
2. Prose pointers now stale (deliberately untouched — docs are
   not import sites, and `docs/evidence/` is read-only):
   `tests/cases/{prim,sync,type}/TESTS.md` + `SPEC.md` +
   `NEO-TYPE-07/README.md` cite `sync/react.ts` /
   `sync/publish/*.ts` as implementation homes, as do ~15
   evidence reports. Non-behavioral; suggest a doc sweep when
   N-1 lands, not inside this move.
3. `benchmark/deepsee/worker-phases.ts` was the only importer
   outside `src/` + the packed-bin map — a second caller chain
   beside `assembleSystem`, worth knowing for N5-W4 (assembly
   cutover rewrites the legs; the benchmark mirrors the call
   order and will need the same rewrite).

## WAVE1-NATIVE — top-level native/ restructure map (cartographer, 2026-09-23)

Scope: READ-ONLY; this section is the only write. HQ native/
direction + pre-night picks + captain's NIGHT-3/NIGHT-4/5 reviews +
NIGHT-3 cut list + NIGHT-4/5 + WAVE1-D17-SEAM + WAVE1-PACKAGER-LEGS
(all this log) read first. Every file:line verified firsthand in
the current tree (post-PACKAGER-LEGS: legs already in packager/,
sync/publish/ gone). Base below: `packages/reference-neo/src/`.

Settled law this map builds on: HQ shape (native/ = RS-cut
contract + call + retention protocol; native/generated/ =
committed codegen from Rust: contracts, tasty, primitives —
committed-but-generated name CLOSED); captain NIGHT-3 #2 (#12-14
stays SUPERSEDED, N-2 owns); HQ pre-night #2 (resolveJsxElements
→ collect/tracer); compile-files delete approved (captain NIGHT-3
#5 — zero importers reconfirmed: the only "compile-files" hit is
native.ts's own comment); NIGHT-5 waves are MORNING work (nothing
overnight on primitives); vendor/→upstream/ rename dead-lean, HQ
confirms AM (captain NIGHT-4/5 review) — ASSUMED below; if HQ
revives upstream/, slice 4 re-targets. D17-SEAM: streams receive
type lands with the native seam, never hand-mirrored in sync/.

### (1) Move-in table — every file:line, argued

| # | What (current file:line) | Verdict | Why |
|---|---|---|---|
| M1 | `sync/native.ts` whole, :1-96 | MOVE to native/ (split per §3) | It IS the seam; HQ names it the subsystem seed. 96 lines: types :15-74 + calls :84-96. |
| M2 | Retention lifecycle, `sync/index.ts:155-207` (NIGHT-3 #4) | MOVE the protocol, KEEP the recipe shape | #4's "engine-block machinery" rationale is answered by HQ: native/ owns the retention protocol. Move as 3 helpers in `native/retention.ts` — `attachScanRetention` (exactly-one-of token/files/neither, :185-186 + native.ts:39-42 invariant), `dropScanRetention` (post-drain clear + RSS relief, :192-198), `releaseScanRetention` (best-effort never-throw finally, :199-207) — plus `releaseRetention` moved from native.ts:93-96. Recipe keeps the try/finally with 3 one-line calls. REJECTED: a `withRetention` wrapper — it would hide the eval→compile order the recipe exists to show. Production side STAYS in collect: `PreparedFragments` (`collect/lib/evaluate.ts:47-66`) + `prepareFragments` wiring (:119-135) is the scan product, not the compile protocol. |
| M3 | Request assembly, `sync/index.ts:171-184` + `uniqueSorted` :84-86 (NIGHT-3 #5) | MOVE as `native/request.ts` builder | "Built at the call site" died by triplication: recipe :176-186 + `collect/lib/scan/goldens.test.ts` dietCompile :90-107 + `sync/lib-barrel-negation.test.ts` assembly :66-76 all hand-build the six frozen keys. One builder (`buildCompileRequest`, single object param — the gate fails >5 params) gives SYNC-04's pin one home and all three call sites collapse onto it. Builder takes `primitiveNames` as a PARAM (roster still lives in `primitives/tags.ts` until NIGHT-5 — no fake generated import) and plain `requested: string[]`, so it is decoupled from both the tracer move (HQ #2) and the system/base join (§3.10). `uniqueSorted` moves with it (single use :179; barrel test dedupes to the import). |
| M4 | Request/result/diagnostic types, `native.ts:15-74` (NIGHT-3 #14) | MOVE to `native/contract.ts` (part of M1) | The RS-cut contract surface, verbatim incl. the structural-carry comments (dist trails frozen source). `NativeSourceFile` keeps its only live user (`files` fallback — the `REFERENCE_UI_SCAN_NATIVE=0`/no-addon path in `collect/lib/scan/native.ts:191-198` is live); implementer drops the compile-files mention (:12-14) when N-1 wave 2 deletes it. D17-reported `portableStylesheet?` optional/required drift vs `contracts/types.ts` stays S3's reconcile, not this move's. |
| M5 | Diagnostic discipline, `sync/index.ts:42-82` (NIGHT-3 #6) | MOVE to `native/diagnostics.ts` | Private fns speaking ONLY `NativeDiagnostic`; zero sync-lifecycle touch (no phases/outDir/publish). Result-handling completes "the call". Recipe keeps 3 identical call lines (:208-210). Judgment, low-stakes either way — mover wins because the next native consumer (streams, S3) reuses it. |
| M6 | `collect/lib/scan/native.ts`, 239 lines | STAYS in collect | Fragment-discovery orchestration (fg enum :184-189, needle derivation, verbatim splitScan confirm :212-217, walk-completeness gate `isCompleteWalkInclude` :168-177) that calls native `scan()`. Only the consume side (drain/release) is native/'s protocol. Splitting its 3 structural ifaces out = two files, one caller. Mirrors stay triplicated (seam + scan + `scan/helpers.ts:117` + 15 case specs) by documented NodeNext necessity — consolidation is RS-dist-refresh work, explicitly not move work. |
| M7 | typegen call (`packager/types-bundle.ts:67`), tasty runtime imports (`reference/bridge/tasty-build.ts:8-12`, browser-model ×5) | STAY | native/ is the atomic scan/compile/retention cut, not every `@reference-ui/rust/*` import — else it becomes the new kitchen sink. `reference/tasty/api.ts` (Neo-authored wrapper, not generated) likewise stays. |
| M8 | `src/vendor/rust-tasty/` (sole child of vendor/) | REAL git mv → `native/generated/tasty/` | Committed mechanical copy of the RS dist tasty d.ts closure (`@generated` stamps, regen tool `tools/vendor-rust-tasty-dts.mjs`, tsconfig paths map `@reference-ui/rust/tasty*` → vendor). Move = mv + `VENDOR_DIR` retarget + re-stamp via the tool + tsconfig paths + `tools/README.md` + `packager/reference-types.test.ts:158` pin string (`'vendor/rust-tasty'`). `src/vendor/` dies. `src/entry/types.d.mts:20` untouched (mapped import, no path literal). |
| M9 | `native/generated/contracts/` | README placeholder (real vendoring is morning work) | Today contracts resolve live via node_modules, types-only, in 16 files — typecheck passes with zero vendoring. Vendoring now without `--check` wiring repeats the tags.ts drift NIGHT-4 flagged must-close (hole still open: zero gate/CI hits reconfirmed). D17-S3's need ("streams type with the vendored contracts, not hand-mirrored in sync/") is satisfied by `native/contract.ts` — "not in sync/" is the operative clause. README specs the future shape (source `dist/contracts/types.d.ts`, second tool TOPS set, tsconfig mapping, --check wiring prerequisite). |
| M10 | `native/generated/primitives/` | README placeholder (no RS emitter exists) | Honest: canon `ELEMENTS`=125 (`reference-rs/modules/canon`) is the future source per NIGHT-4/5, but NIGHT-5 E-waves are morning-gated on 11 AM picks (rank-1, 125-vs-101, SVG scoping). `primitives/tags.ts` (101, hand copy) stays authoritative; per-system emission (`primitives/generate/generate.ts`, `react-surface.d.ts`) untouched. README says exactly this + cites NIGHT-5. No re-export shim — that would fake generatedness. |

### (2) What the recipe keeps (call sites + minimal glue)

sync() keeps: config load, outDir, cleanDir/atomicity (:146,242-244),
prepare/evaluate calls, phase marks, `buildCompileRequest` +
`attachScanRetention` + `compileNative` + `drop`/`release` calls,
3 diagnostic calls, merge call (→css under N-1), assembleSystem,
compile-request.json write (:227-235 — operates on the built
request; strip-list stays), tasty-phase schedule. Keeps
(temporarily) the `PRIMITIVE_JSX_NAMES` import (`index.ts:24`) as
the builder's `primitiveNames` arg — migrates to
`./generated/primitives` at the NIGHT-5 cutover.

Blast radius is 5 real importers of the seam: `sync/index.ts:8-14`,
`sync/lib-barrel-negation.test.ts:20-24`,
`collect/lib/scan/goldens.test.ts:23`,
`benchmark/deepsee/worker-phases.ts:13` (its leg imports already
re-pointed by PACKAGER-LEGS; :13 remains), and dying
`sync/compile-files.ts:9`. Non-breakers: 15 case specs import
`@reference-ui/rust/atomic` directly (structural mirrors; comments
cite `src/sync/native.ts` → slice 5); `sync/watch.ts` (leaf, calls
`sync()` only); `bin/neo.ts`; `tools/build-bin.mjs` (no native
refs — no PATH_LITERAL entry); playground/ (zero refs).
Depth check (PACKAGER-LEGS precedent): `src/sync/` → `src/native/`
is same-depth, and no moved line uses `import.meta.url` — every
computed path is byte-identical.

### (3) Proposed layout

```
src/native/
  README.md            subsystem contract (seam table; no filename tables — gate)
  contract.ts          M4 types verbatim (~60 lines + header)
  compile.ts           compileNative + AtomicModule iface (~15)
  retention.ts         releaseRetention + attach/drop/release helpers (~45)
  request.ts           buildCompileRequest + uniqueSorted (~40)
  diagnostics.ts       M5 helpers, same private names (~45)
  generated/
    tasty/             M8 real mv (stamps re-run via the tool)
    contracts/README.md  M9 placeholder (future shape + --check prerequisite)
    primitives/README.md M10 placeholder (NIGHT-5 pointer + 11 AM picks)
```

No `index.ts` barrel (deep imports; revisit when D17 streams
land). Every new .ts file carries a 2-6 sentence header (gate);
new fns stay inside fail lines (12/20/5/120/500/4 — the builder's
object param is mandatory, not style). D17 handoff: S3 adds the
optional streams field to `native/contract.ts`
(`tracedJsxHosts?` additive precedent) + `contracts/types.ts`
mirror + fixture; `mergeStreams` still lands in `system/base`
per D17 §4 (N-3 owns the layout).

### (4) Serious-test list

Commands (all verified this session by PACKAGER-LEGS):
`pnpm vitest run` in `packages/reference-neo` (baseline 48 files /
337 green), `pnpm agentneo q` (baseline 0 errors / 17 warnings /
214 files), `pnpm agentneo run <id>` (refuses on red types — every
case run is the typecheck), `node tools/vendor-rust-tasty-dts.mjs
--check` from the package dir.

- Slice proofs: `q` over touched files after EVERY slice (headers,
  no-`any`, no suppressions); unit scope = `sync/sync.test.ts`,
  `sync/lib-barrel-negation.test.ts`, scan suite (`scan/native*`,
  `goldens`, `retention`, `crossings`), `packager/
  reference-types.test.ts` (pin update), primitives generate/tags
  + `bin/neo.test.ts` as untouched regression.
- Case proofs: NEO-SYNC-04 (frozen six request keys — THE move
  proof), NEO-SYNC-15 (traced hosts), NEO-SYNC-01/06/07/14
  (shape/resync/watch-adjacent), NEO-CLI-01 (spawned-binary
  end-to-end), NEO-CHAIN-01..06 (multi-package regression, per
  PACKAGER-LEGS precedent), one SITE recompile smoke (SITE-28 —
  comment-only, proves mirrors still describe the seam),
  NEO-REF-01 (post-tasty-move smoke).
- Byte-identity: `goldens.test.ts` shas must not move (builder
  dedupe is behavior-identical by construction); `q` warning
  count must not rise above 17.
- Grep-zero (post-slice-5): `sync/native` outside `docs/evidence/`
  (historical, untouched per PACKAGER-LEGS precedent) and zero
  `vendor/` refs outside it.

### (5) Ordered move slices for the implementer

- Precondition: N-1 wave 2 owns `index.ts` too (#7 merge wrapper,
  #15-17 reset, #22 delete). Slices 1/3/4 touch disjoint files and
  may run parallel to N-1; slice 2 sequences AFTER N-1 wave 2
  lands (or the captain interleaves — one owner of `index.ts` at
  a time either way).
- Slice 1 — seam landing: create `native/{contract,compile,
  retention,request,diagnostics}.ts` + `README.md` in final shape
  (cut/paste + M2/M3/M5 helper extraction), delete `sync/
  native.ts`, re-point the 4 living importers, update the 3 scan
  comments (`scan/native.ts:35`, `scan/helpers.ts:67`,
  `retention.test.ts:15`). Proof: `q` + vitest scan/sync scope +
  SYNC-04.
- Slice 2 — recipe surgery: `index.ts` takes the builder +
  attach/drop/release + moved-diagnostic calls; delete the moved
  helpers + `uniqueSorted`. Proof: `sync.test.ts` + barrel +
  SYNC-04/15 + CLI-01.
- Slice 3 — tasty vendor mv (M8 list). Proof: `--check` +
  typecheck-via-run + reference-types tests + REF-01.
- Slice 4 — generated/ README placeholders (M9/M10). Proof: `q`.
- Slice 5 — prose: 15 case-spec comments (`(see|mirrors)
  src/sync/native.ts` → `src/native/contract.ts`), deepsee
  comment if any. `tests/cases/sync/TESTS.md` SYNC-04/15 rows +
  SPEC cites DEFER to the N-1-landing doc sweep (PACKAGER-LEGS
  surprise-2 precedent — ledgers, not import sites).
  `docs/evidence/` never touched. Proof: the §4 greps.
- Implementer checks `docs/DOMAIN.md` before landing the five
  file names (nomenclature authority — not re-read on this map).
  No-panda pass on new/changed lines per skill §7.

## WAVE1-LEGS-VERIFY — adversarial review of the packager-legs move (verifier, 2026-09-23) — HOLD

Thinking hat, no source edits, nothing committed. Skill
`agent-neo` loaded first. Scope: the `## WAVE1-PACKAGER-LEGS`
report (8 files `src/sync/` → `src/packager/`).

### (1) Per-file drift check — PASS

`git show HEAD:<old> | diff - <new>` for all 8 pairs. Every
diff is a single hunk of `c`-only changes (no add/delete, line
counts identical), and every changed line is an `import` line:

- `react.ts`: 1 import (`../packager/externals` → `./externals`)
- `reference-types.ts`: 5 imports (`../packager/*` → `./*`)
- `system.ts`: 5 imports (`../../config` → `../config`,
  `../../packager/*` → `./*`)
- `styled.ts`: 4 imports (`../../packager/*` → `./*`)
- `react-shell.ts`: 4 imports (`../../packager/*` → `./*`)
- `types-bundle.ts`: 1 import (`../../packager/constants` →
  `./constants` — the surprise-1 fix is in)
- `links.ts`: 3 imports (`../../lib/symlink` → `../lib/symlink`,
  `../../packager/*` → `./*`)
- `reference-types.test.ts`: 3 imports (incl. `./publish/links`
  → `./links`)

Zero logic drift. The report's import-rewrite table is exact.

### (2) Stragglers — FAIL (one cross-package importer missed)

Passing parts: all 4 old paths dead (`sync/publish/`,
`sync/react.ts`, `sync/reference-types.ts`,
`sync/reference-types.test.ts`); zero code refs to
`sync/publish`, `sync/react`, `sync/reference-types`, or
`publish/<leg>` anywhere under neo `src bin benchmark tools
tests`; `sync/index.ts` and `packager/types.ts` untouched
(`git status` clean); the 3 import-site diffs match the report
exactly (assembly 7 imports + line-3 comment, worker-phases 6
imports, build-bin 2 map keys, all import/key-only); all 8
symbols assembly imports resolve to exports in the moved files;
assembly call order intact (L24–37).

Failing part: the implementer's post-move grep was scoped to
the neo package. A repo-wide sweep finds one live straggler
outside it:

- `packages/reference-rs/modules/atomic/tests/harvest-census.test.ts:22-23`
  still imports `../../../../reference-neo/src/sync/publish/styled.ts`
  (`publishRuntimeBundle`) and `../../../../reference-neo/src/sync/react.ts`
  (`publishReactBundle`) — both paths now dead.

The file is clean at HEAD (no other crew touched it), so the
breakage is purely move-caused. `PLAN.md:370/:377`
`publish/system.ts` hits are prose, not imports — not stragglers.

### (3) NIGHT-1's 3 files — PASS

`bin/neo.ts`, `src/collect/lib/scan/helpers.ts`,
`src/collect/lib/scan/identity.test.ts` all present in tree.
Their working-tree diffs vs HEAD are NIGHT-1's own work (needle
dedup to `FRAGMENT_IMPORT_NEEDLES`, `LINKED_PACKAGES` →
`PACKAGES.map`) — none of the three imported a moved leg at
HEAD, so the move correctly left them alone. (`bin/neo.ts`
does newly import `../src/packager/layout.ts` +
`../src/packager/packages.ts`, but those modules predate the
move — not move retargets.)

### (4) Re-run proof — neo green, RS red

All re-run firsthand this session, exact outputs:

- Full Neo vitest (`pnpm vitest run` in
  `packages/reference-neo`): **48 files / 337 tests passed**,
  exit 0 — matches the report.
- `pnpm agentneo q`: **0 errors, 17 warnings, 214 files in
  794ms** — matches the report byte for byte.
- Chain cases (`pnpm agentneo run NEO-CHAIN-0[1-6]`, each
  typechecks first): **all 6 PASS, exit 0**
  (`transitive`, `diamond`, `parallel`, `multi-extends`,
  `depth`, `real-upstream`). CHAIN-06 prints two
  `ATM-W-UNKNOWN-COLOR` sync warnings (world content, not a
  fault).
- Straggler confirmation (`pnpm agentrs v
  modules/atomic/tests/harvest-census.test.ts`): **FAIL at
  collection** — `Error: Cannot find module
  '../../../../reference-neo/src/sync/publish/styled.ts'
  imported from .../harvest-census.test.ts`, exit 1.
  (First attempt with a repo-relative path exited 1 with "No
  test files found" — filter must be RS-root-relative; not a
  result.)

### Verdict: HOLD

One reason: the move breaks `harvest-census.test.ts`, a live
file in the atomic RS suite (`tests/**/*.test.ts` include —
no skip), via 2 dead imports. Check (2)'s "zero remaining
imports" bar explicitly fails, and the report's "zero remaining
code references" claim is wrong repo-wide (its grep never left
the neo package).

Fix is a clean 2-line retarget (both targets exist and export
the needed symbols — verified in §(2) above):

- `:22` `.../src/sync/publish/styled.ts` →
  `.../src/packager/styled.ts`
- `:23` `.../src/sync/react.ts` → `.../src/packager/react.ts`

Re-proof to clear the HOLD: re-run the straggler file green
via `pnpm agentrs v modules/atomic/tests/harvest-census.test.ts`
(preconditions per its header: fresh `pool-census.json`, built
`dist/namer.mjs` — if the body then fails on preconditions,
that is RS-crew territory, but collection must go green), plus
one more full Neo vitest to confirm nothing else shifted.
Everything else in the move verified clean — no re-review of
(1)/(3) needed. Report, don't land: nothing committed.

## Wave law (2026-09-23) — repo-wide sweeps on every move

WAVE1-LEGS-VERIFY caught it: the implementer's post-move grep never
left the neo package, and a live cross-package importer broke
(`reference-rs/.../harvest-census.test.ts` → old leg paths).
Standing law for all move crews from here on: the straggler sweep
is repo-wide (`packages/`, every extension that can import TS) or
the proof is void. Verifiers re-sweep; captain spot-checks.

## Tick — Wave 1 nearly home, legs on HOLD pending fix, no commits (2026-09-23)

- Objectives: VOYAGE Obj 1-3 COMPLETE (LOG-1/2/3); Obj 4/5 moved
  to LANDING.md (IN PROGRESS, lib hardening — untouched this
  tick). Active mission is the overnight run N-0..N-4.
- Wave 1: 5/6 crews home (watch/seam/system-base/native maps
  filed; legs implementer done). Verifier returned HOLD on one
  cross-package straggler (harvest-census.test.ts → old leg
  paths); wave law filed (repo-wide sweeps or proof void).
- Live: 1 crew (wave1-legs-fix/93, running). Liveness from
  substance: its fix is already visible in tree
  (harvest-census.test.ts modified). No ping sent. Deadlock test:
  negative — crew minutes old and producing.
- Advance: nothing verified → nothing committed (HOLD stands
  until fix crew reports). No dispatch this tick; Wave 2 (N-1
  wave 2, N-2/N-3 implementers + verifiers) sequences off the fix
  report + captain's firsthand re-proof. HQ present and planning;
  no park ordered.

## WAVE1-LEGS-FIX — repair the packager-legs HOLD (fix crew, 2026-09-23) — DONE

Skills `agent-neo` + `agent-rs` loaded first. Scope: the
`## WAVE1-LEGS-VERIFY` HOLD only (2 dead import lines + repo-wide
re-sweep + proof). Nothing committed. Report, don't land.

### Fix (2 lines, the only source edit)

`packages/reference-rs/modules/atomic/tests/harvest-census.test.ts:22-23`
(`git status` confirms my sole source write — all other worktree
changes are sibling crews'):

- `:22` `.../reference-neo/src/sync/publish/styled.ts` →
  `.../reference-neo/src/packager/styled.ts` (`publishRuntimeBundle`)
- `:23` `.../reference-neo/src/sync/react.ts` →
  `.../reference-neo/src/packager/react.ts` (`publishReactBundle`)

Both targets export the needed symbols (verifier §(2) confirmed;
the green run below re-proves it).

### Straggler sweep (repo-wide, per the wave law)

Three sweeps over `packages/`, every TS-importing extension
(`ts/tsx/mts/cts/js/mjs/cjs/jsx`, plus `rs/json/sh` on the
string-literal pass), covering all 8 moves (`sync/react.ts`,
`sync/reference-types.ts`, `sync/publish/{system,styled,
react-shell,types-bundle,links}.ts`,
`sync/reference-types.test.ts`) as import paths AND
`src/sync/...` string literals (the `tools/build-bin.mjs`
`PATH_LITERAL` shape):

- Code hits: **zero** — no other live importer exists.
- Prose hits only: `tests/cases/{prim,sync,type}/TESTS.md` +
  `SPEC.md` + `NEO-TYPE-07/README.md` + ~15 `docs/evidence/`
  reports cite the old homes. Deliberately untouched per the
  PACKAGER-LEGS surprise-2 precedent (docs are not import
  sites; `docs/evidence/` is read-only; a doc sweep rides the
  N-1 landing, not this fix).

### Proof (all firsthand this session)

- Straggler file (`pnpm agentrs v
  modules/atomic/tests/harvest-census.test.ts`): **4/4 passed**
  (exit 0) — collection green AND body green (M-cells,
  sink census, react.mjs publish via the retargeted legs,
  css-tree timings). No precondition failure.
- Full Neo vitest (`pnpm vitest run` in
  `packages/reference-neo`): **48 files / 337 tests passed**,
  exit 0 — matches the move report and the verifier.
- `pnpm agentneo q`: **0 errors, 17 warnings, 214 files** —
  byte-identical to the pre-move baseline. Zero new errors.
- Chain cases (`pnpm agentneo run NEO-CHAIN-0[1-6]`, each
  typechecks first): **all 6 PASS** (`transitive`,
  `diamond`, `parallel`, `multi-extends`, `depth`,
  `real-upstream`).
- `pnpm agentrs q` over the touched file: **passed**
  (zero violations).

### Verdict: HOLD CLEARED (fix-crew recommendation)

The HOLD's single reason — 2 dead imports breaking a live RS
suite file — is repaired; the repo-wide re-sweep finds nothing
else live; every proof bar in the brief is green. The move's
(1)/(3) checks needed no re-review per the verifier. Captain's
firsthand re-proof + Wave 2 sequencing are the next step.

## HQ sign-off guidance (2026-09-23) — refine Neo, legacy as reference

HQ: the night's job is refining reference-neo. Consult legacy
wherever a solved problem exists — but the needed cleverness is
believed mostly extracted already (symlink, packager/micro-bundle
paths approved). Default to Neo-native solutions; raid legacy on
encounter, not on principle.

## Captain's seam ruling + Wave 2 dispatch (2026-09-23)

READ: WAVE1-D17-SEAM + WAVE1-SYSTEM-BASE firsthand. Ruling on the
packed-css tension: **delete-in-place wins, N-3 S2 SKIPPED.**
packed-css.ts + packed-css.test.ts stay in sync/ untouched until
morning S5 deletes both. Reasons: (1) HQ Final straight-to-seam —
moving code the morning deletes is wasted motion plus a second
proof cycle on a corpse; (2) the seam builds a NEW mergeStreams
assembler in system/base (S4), not the moved file — base/ never
needs the resident; (3) keeps the 3.5-ban violators visible in one
place until the ban's first deletion. N-3 runs S0/S1/S3/S4/S5/S6;
the #7 wrapper stays with no repoint. reset.ts (#15-17) HELD for
the 11 AM home pick (a/b undecided — no move to a vetoable home).
#22 delete proceeds (home-independent).

Sequencing: N-3 and N-2 share exactly one file (sync/index.ts) —
**one owner at a time, N-3 first, N-2 after it lands.** (N-2 slice
1's :8-14 repoint collides with N-3's :18-22; same-file concurrent
edits clobber. Safety over speed overnight.)
CLI rulings (§3.12 open threads, captain's calls): tasty drain
stays one flushReferenceBuild call, essay relocates to
reference/bridge; clean unifies on cleanDir with retry semantics
verified, HOLD-the-substep if uncertain (never guess); watch
driver untouched, flag routing only.

Wave 2 (dispatched, file-disjoint): deleter (#22 compile-files),
N-3 system-base implementer (S0/S1/S3/S4/S5/S6), cli implementer
(§3.12 + rulings). Verifiers follow each on report. N-2 native
implementer waits for N-3's landing.

## WAVE2-DELETE

Deleter report: dead `packages/reference-neo/src/sync/compile-files.ts`
(NIGHT-3 #22, HQ red marker) removed. REPORT ONLY — not landed, not
committed.

Pre-delete importer sweep (repo-wide): zero live importers. Only hits
are the definition itself, the known `sync/native.ts:12-14` comment
(untouched — another crew owns native.ts; its implementer drops the
mention), and docs/evidence/mission-log prose. No barrel re-export in
`sync/index.ts`; no `collectCompileFiles` call site anywhere in code.

Change: `D packages/reference-neo/src/sync/compile-files.ts` (35 lines).
Nothing else touched.

Proof (this session, post-delete):
- `pnpm agent vt packages/reference-neo`: 48 files / 337 tests, all PASS.
- `pnpm agentneo q`: 0 errors, 17 warnings — at cap, did not rise.
- `pnpm agentneo run NEO-SYNC-04`: PASS (compile-request.spec.ts).
- `pnpm agentneo run NEO-SYNC-06`: PASS (deterministic.spec.ts).
- `pnpm agentneo run NEO-SYNC-10`: PASS (extends.spec.ts).
- Case runs typecheck first and refuse on red — types green by pass.

## WAVE2-CLI (implementer, 2026-09-23)

Scope: `src/cli/` per PLAN.md §3.12 + the captain's CLI rulings
(Wave 2 dispatch). Governing skill `agent-neo` loaded first. Touch
list held: `bin/neo.ts`, `src/cli/*`, `package.json` + lockfile,
`reference/bridge` docs. `sync/clean.ts` UNTOUCHED — no export was
needed (`cleanDir` already exported). Never commit; report, don't
land.

### Layout (proposed + built)

`src/cli/` — one file per command plus shared helpers, Commander
owns argv shape only (`commander@^14.0.3`, matching mcp/legacy;
store-hit, lockfile +5/−2, commander-scoped):

- `index.ts` — `runCli(argv): Promise<number>`: program wiring,
  `command:*` unknown-verb usage error, per-command registration.
- `sync.ts` — `sync [dir] [--watch]`: one-shot run + `--watch`
  routing to the watch runner.
- `clean.ts` — `clean [dir]`: PACKAGES-derived link list, wipe via
  `cleanDir`, scope-link pruning, reporting. `--watch` declared
  hidden and rejected with the pinned `clean takes no --watch`.
- `watch.ts` — resident runner: boot lines, change/resync/error
  prints, signal shutdown, the never-promise. Flag routing only —
  the `watchSync` driver is imported, untouched.
- `output.ts` — USAGE block, `messageOf`, `printUsageError`.
- `README.md` — purpose-first, thinness law, no filename table.

`bin/neo.ts` is a 7-line trampoline (shebang + header + import +
run + exit). Lazy dynamic imports for sync/watch/bridge preserved,
so `--help`/`clean` never load the sync world.

### Rulings, as executed

- Tasty drain: ONE `flushReferenceBuild` call in `runSyncCommand`,
  bare — the REF-10 essay relocated to `flushReferenceBuild`'s
  JSDoc in `reference/bridge/init.ts` (failure consequence:
  types.mjs keeps its `./tasty/runtime.js` edge while
  types/tasty/ never lands → bundlers resolving
  `@reference-ui/types` fail).
- Clean unifies on `cleanDir` — NO HOLD. Verified firsthand, not
  guessed: the retry targets ENOTEMPTY/EBUSY/EPERM only, 6
  attempts, ≤105ms total backoff, then throws loud. The overlap
  it exists for is sync's pre-wipe racing the never-awaited
  background tasty phase on warm re-syncs; CLI clean meets that
  same class only from a concurrent watch/sync on the same dir
  (file landings vs recursive remove — structurally identical,
  retry converges). Uncontended, first attempt ≡ today's `rmSync
  recursive force` (`force` suppresses ENOENT in both; the only
  delta is sync/async on an already-async path). New:
  wipe/link failures print `[neo] clean failed: <cause>` exit 1
  (was an uncaught throw → stack + exit 1; same class, named
  cause per the law).
- LINKED_PACKAGES moves with `cmdClean`, still
  `PACKAGES.map(getShortName)` — T1 clean reports 4 links, the
  types junction gone.
- Watch driver untouched (flag routing only — 11 AM verdict owns
  the driver).

### Output contract (§3.12 open threads)

Every pinned string kept byte-identical: USAGE block, all
`[neo]` success/failure lines, `unknown command:`, `clean takes
no --watch`, watch boot/resync/change lines. Rationale:
NEO-CLI-02 pins `[neo] sync ` / `watching <dir>` / `resync` /
`change <path>` as substrings and the bin tests pin the usage
block — any glyph/color restyle breaks the pins. Full one-line
contract (glyph + command + stats, dim separators) is morning
polish against those pins, not this arc. Commander-native deltas
on UNPINNED paths only: extra positionals →
`error: too many arguments` (stderr, exit 1, replaces
`unexpected argument:`); `sync --help` now prints help exit 0
(was: treated as a dir, failed); bare `neo` prints help exit 1.
`neo` vs `ref` naming untouched (open thread stands).

### Proof (all firsthand this session)

- Full units: **53 files / 354 passed**, exit 0 on final bytes.
  (One mid-session run showed 4 failures at 49 files while a
  sibling crew was mid-write — tree-shift artifact, not this
  change: the rerun plus two confirmatory runs are fully green,
  and unit-side CLI coverage is only `bin/neo.test.ts` at 7/7.)
- `bin/neo.test.ts`: **7/7** (untouched file — routing contract
  holds through Commander).
- `tsc --noEmit`: clean. Dist build
  (`node tools/build-bin.mjs`): **green, 369 files** — one
  self-caught fix during the arc (trampoline dropped the
  shebang, build's assertion caught it, restored).
- `pnpm agentneo q`: whole-package **0 errors, 18 warnings, 225
  files**; scoped to my 7 files **0/0**. The 18th warning is the
  sibling's new `src/system/base/validate.test.ts` (N-3's file,
  pre-existing to me) — my contribution is zero warnings.
  No-panda pass over `src/cli` + bin: clean.
- `pnpm agentneo run NEO-CLI-01` → **PASS** (lifecycle.spec.ts).
- `pnpm agentneo run NEO-CLI-02` → **PASS** (watch-flag.spec.ts)
  — the moved `--watch` routing proven end to end (extra,
  beyond the brief's bar, because the flag path moved).
- T1 tier (`matrix/tests/chain/T1`, dist bin): `neo sync` exit
  0, 4 scope links land (lib+neo real links untouched);
  `neo clean` reports **4 links**, generated 4 gone; resync
  restores; `pnpm agent playwright --dir matrix/tests/chain/T1
  --no-build` → **7 passed (0 failed)**.
- Repo-wide sweep (moved symbols as imports + literals):
  **zero live stragglers** — only the new `src/cli/clean.ts`
  home, the pre-existing `packager/links.ts` publisher side,
  and CLI-01's own spec-local constant. Prose staleness
  (CLI-02 README's `bin/neo.ts:86-111` line ref, PLAN.md §3.12's
  pre-move description) rides the landing per the
  PACKAGER-LEGS precedent — docs are not import sites, and
  both files are outside my touch list.

### Footprint + notes for the captain

Footprint: M `bin/neo.ts` (134→7), M `package.json` (+1),
M `pnpm-lock.yaml` (+5/−2), M `bridge/init.ts` (JSDoc +3),
new `src/cli/` (5 `.ts` + README). Index untouched, nothing
committed. DOMAIN.md deliberately NOT touched (outside the
touch list — the `cli` name comes from §3.12, not from me; a
one-line entry disambiguating the `neo` user CLI from the
`agentneo` harness verbs is yours to add if wanted).

WAVE2-CLI DONE: §3.12 implemented under the thinness law —
trampoline bin, Commander argv, one-call tasty drain with the
essay at the bridge, clean unified on verified `cleanDir`,
watch routing without driver contact. Report, don't land.

## WAVE2-SYSTEM-BASE (implementer, 2026-09-23) — DONE

Slices S0/S1/S3/S4/S5/S6 per `## WAVE1-SYSTEM-BASE`;
S2 SKIPPED per the captain's seam ruling (packed-css.ts +
packed-css.test.ts stay in sync/ untouched; the #7 wrapper
stays with no repoint — neither touched). Skill `agent-neo`
loaded first. Every spec file:line re-verified at slice
start against the post-legs, post-NIGHT-1 tree — all held
verbatim except `sync/index.ts:18-22`, which is `:17-22` in
the current tree (import block one line up; substance
identical). Report, don't land: nothing committed.

### Files (13 new, 15 modified, 1 deleted)

New `src/system/base/`: `index.ts` (barrel: contract +
assembly, nothing else), `types.ts` (BaseSystem moved
verbatim + ExtendsCarrier + BaseAssemblyInput), `jsx.ts`
(roster join, ReferenceUIConfig narrowed to
ExtendsCarrier), `fragments.ts` (createPortableFragmentBundle
narrowed to `(upstream: string[], local: string[])`),
`validate.ts` (extends validators + invalidBaseSystem
factory), `assemble.ts` (assembleBaseSystem over
BaseAssemblyInput — the renamed publishedBaseSystem),
`sources.ts` (5 emitted-source builders, verbatim),
`fragments/validate/sources/assemble/jsx.test.ts` (moved
tests + B1-B6), `base/README.md`; new `src/system/README.md`
(domain thesis; both READMEs carry NOT-owns, no filename
tables). Modified: `config/types.ts` (interface moved out,
compat `export type` kept), `config/validate.ts` (thinned
to config-side checks + the base call), `config/errors.ts`
(static removed, module re-export kept), `config/
validate.test.ts` (moved block + its two consts out),
`collect/index.ts` (bundle re-export dropped),
`collect/lib/evaluate.ts` (bundle fn out, STAY ranges
untouched), `collect/lib/prepare.test.ts` (moved test out),
`collect/lib/scan/goldens.test.ts:22` (repoint),
`packager/system.ts` (thinned to imports + writeSystemDir),
`packager/types.ts:6` (repoint), `src/index.ts:5` (BaseSystem
re-homed), `sync/index.ts` (import repoints + :221 adapt
ONLY — diff-verified), `sync/lib-barrel-negation.test.ts:19`
(repoint). Deleted: `sync/jsx-elements.ts`. Wave-law catch
(spec-missed live consumer, same class as the legs HOLD):
`benchmark/deepsee/worker-phases.ts` (:20-21 repoints +
:124 narrowed adapt — tsconfig includes benchmark/, so the
S3 signature change would have red the package typecheck
without it). Untouched per spec: packed-css pair, #7
wrapper + merge call sites, reset.ts, compile-request.json
writer, system-surface.d.ts, packager constants/packages,
collect STAY ranges, sibling `src/cli/` + `reference/
bridge/init.ts` + lockfile. DOMAIN.md deliberately NOT
touched (outside the touch list; `base`/assembly language
is PLAN §3.11's, not mine — same call as WAVE2-CLI).

### Judgment calls (2, both flagged for the reviewer)

1. invalidBaseSystem's thrown TYPE narrows
ConfigValidationError → Error (message byte-identical).
The class ctor is private and base must stay a leaf, so
the moved factory cannot construct it; no instanceof or
class-name pin exists anywhere (verified: only message
regexes in tests, zero case-spec pins). validateConfig's
@throws doc updated honestly. Re-widen via a base-owned
subclass if the type matters — one follow-up, no test
churn (messages don't move).
2. Cross-subsystem imports are DEEP (`../system/base/
jsx.ts`, not the barrel): the slices land bottom-up with
the barrel last (S6), so deep is the zero-churn reading,
and it matches 8/9 existing sync/index.ts imports. The
barrel stands as the subsystem address for D17
mergeStreams importers. (The BASE_SYSTEM_HEADER import in
sources.ts is the spec's own sanctioned exception to the
leaf rule — acyclic, constants imports nothing.)

### Proof (all firsthand this session)

- Units: 53 files / 354 tests green (baseline 48/337;
337 + 22 new − 5 moved = 354 exact). Per-slice: S0
validate 16/16; S1 goldens + barrel-negation 2/2 (sealed
SHAs unmoved); S3 prepare + fragments 14/14; S4 validate
+ evaluate 26/26; S5 full suite; base batteries 22/22
(B1 goldens first-run green against the lib neo-built
oracle — banner-verified neo bytes, independently read).
- Gate: 0 errors, 17 warnings = baseline (one self-caused
warn mid-slice — validate.test.ts describe at 83 lines —
split into two describes, back to 17). No `any`, no
suppressions, headers on all 12 new `.ts` files,
no-panda clean, no-DOMAIN.
- Cases (each typechecks first — green 11×): SYNC-04/06/
07/10/15/17 + LAYER-02 per the S3/S4/S5/S6 proof bars,
PLUS SYNC-01/02/03/05 as publish-shape neighbors (S5
touches the singular-shape assembly) — all PASS.
SYNC-06 determinism is the byte-identity proof.
- Move fidelity: jsx.ts diff = 3 narrowing lines only;
all 5 builders awk-extracted IDENTICAL; sync/index.ts
diff = imports + :221 only.
- Straggler sweep (repo-wide, wave law): zero live refs
to `sync/jsx-elements`, `publishedBaseSystem`,
`ConfigValidationError.invalidBaseSystem`, or
BaseSystem-from-`config/types`; all bundle/validate/
assemble refs home in base. `dist/` hits are gitignored
stale build output (predates the legs move). New prose
staleness: `tests/cases/site/SPEC.md:9` cites the old
roster home — left for the N-1-landing doc sweep per the
legs precedent (docs are not import sites).
- Mid-slice note (no action): case proofs paused while a
sibling's in-flight `src/cli/` red the package typecheck
(commander); the CLI crew landed the fix mid-slice and
all 11 runs went green after — zero of my lines changed
in between.

WAVE2-SYSTEM-BASE DONE: `src/system/base/` built to spec
(S0/S1/S3/S4/S5/S6), B1-B6 + re-homes landed, units + q +
11 cases green, repo-wide sweep clean, S2 + wrapper + all
STAY ranges untouched. N-2 owns sync/index.ts next.

## WAVE2-BASE-VERIFY (verifier, 2026-09-23) — LAND

Thinking hat, zero source edits, nothing committed. Adversarial
review of the WAVE2-SYSTEM-BASE arc against the WAVE1-SYSTEM-BASE
spec (S0/S1/S3/S4/S5/S6; S2 SKIPPED per the seam ruling). Every
claim below is firsthand on the current tree (base + CLI arcs
both present, uncommitted; compile-files.ts delete already
landed as 5e049ef05). CLI scope untouched; all gates green so
no attribution split was needed.

(1) S2 SKIPPED honored. `sync/packed-css.ts` +
`sync/packed-css.test.ts` absent from git status (last touch
22ed06156, pre-arc). `sync/index.ts` diff = import repoints +
`:221` adapt ONLY (2 hunks); the #7 wrapper, both merge call
sites, and the packed-css import line are byte-identical to
HEAD. Zero repoints toward base/ from the css chain.

(2) Inventory matches §1 exactly. Modified: config/types.ts
(MOVE 1, compat `export type` kept), config/validate.ts (MOVE
2, thinned to config checks + the base call), config/errors.ts
(MOVE 3, static→re-export), sync/jsx-elements.ts DELETED (MOVE
4), collect/lib/evaluate.ts (MOVE 6, bundle fn out + BaseSystem
import re-homed), packager/system.ts (MOVE 7, thinned to leg),
plus the spec'd re-homes (config/validate.test.ts block + its
2 consts out; prepare.test.ts 1 test out), repoint-onlys
(packager/types.ts:6, sync/index.ts imports, goldens.test.ts:22,
lib-barrel-negation.test.ts:19), barrel drop
(collect/index.ts), and src/index.ts:5 re-home. New:
src/system/{README,base/*} only. STAY ranges diff-verified
untouched: evaluate STAY blocks, packager constants/packages,
wrapper, reset.ts, compile-request writer (no hunk),
system-surface.d.ts. ONE out-of-spec file, implementer-flagged:
benchmark/deepsee/worker-phases.ts — exact mirror of the
sync/index.ts S3 adapt (same 2 hunks), required because
tsconfig includes benchmark/. Same-class wave-law catch as the
legs HOLD; ACCEPTED, not a finding.

(3) base/ is a LEAF. Non-test imports: internal `./types.ts`
only (4 type-only) + the spec-sanctioned BASE_SYSTEM_HEADER
from constants.ts, which itself imports nothing (verified).
No base→config/collect/sync/packager arrow exists. Narrowing
proven, not asserted: goldens.test.ts passes `world.config`
(ReferenceUIConfig) unadapted into `resolveJsxElements`
(ExtendsCarrier) and the package typechecks (every case run
typechecks first). Arrows are config→base, packager-leg→base,
sync→base, index→base only. (validate.test.ts imports config —
test-only, and it is the spec'd re-home testing through
validateConfig; not shipped code.)

(4) Split line holds at 104/105. packager/system.ts is now
imports + `writeSystemDir` (mkdir + 7 writes, adapted
assembleBaseSystem call the only logic delta). All 5 builders
awk-extracted IDENTICAL to HEAD modulo the added `export`
keyword; baseSystemMjsSource byte-identical. jsx.ts diff = the
3 narrowing lines only.

(5) B1-B6 genuine, run green (5 files / 22 tests). B1: 4
exact-string goldens (interface, entry, both .d.mts — the
spec'd four). B2: mapping + css-absent→undefined. B3:
assemble→validateBaseSystemEntries round-trip. B4: 5 tests
(trim/dedupe/sort, cross-system merge, traced union,
empty→[], primitives pin). B4's pin fails loudly BY
CONSTRUCTION: the implementation hardcodes `primitives: []`,
so the day 3.9 lands a producer the test reds with no silent
pass path. B5: order test (moved, adapted) + declared-order +
2 extra edges. B6: non-object + whitespace-only name. Count
reconciles exactly: 337 + 22 (new-file tests) − 5 (re-homed
out) = 354.

(6) README law held. Both READMEs purpose-first with NOT-owns
(system: discovery/collect, compile, publish-act, runtime;
base: eval, compile, writes-to-disk, jsx tracing) and no
filename tables. All 12 new .ts headers are 4 sentences
(inside 2-6), takes/emits disciplined.

(7) Legacy-precedent claim sane. Zero `panda`/`scan` hits in
base/ non-test sources; no collector bundle, no discovery —
assembly only, mirroring legacy's base/ word without its
retired machinery.

Gates (firsthand, this session): units 53 files / 354 tests
PASS; `agentneo q` 0 errors / 17 warnings (at cap), scoped to
src/system 0/0 — the arc contributes zero warnings; NEO-SYNC-10
(extends), NEO-SYNC-15 (discovery), NEO-SYNC-17
(extends-private), NEO-LAYER-02 (packages) all PASS.
Repo-wide straggler sweep (bounded, excl. node_modules/dist):
zero live refs to `sync/jsx-elements`, `publishedBaseSystem`,
or `ConfigValidationError.invalidBaseSystem` — only the
self-reported tests/cases/site/SPEC.md:9 prose line, which
rides the landing per precedent.

Judgment calls reviewed, both ACCEPTED: (1) Error-narrowing on
invalidBaseSystem — message byte-identical, @throws doc honest,
and zero instanceof/class-identity pins anywhere in src/tests/
cases (swept: instanceof, toThrow(class), constructor.name —
all clean), so no catcher can miss; the base-owned-subclass
follow-up stays optional. (2) deep cross-subsystem imports —
matches 8/9 existing sync/index.ts convention, zero-churn with
the S6 barrel landing last; barrel stands for D17.

WAVE2-BASE-VERIFY: LAND. No HOLD reasons found; no findings
against cli/ scope from this review (out of scope, not
examined beyond shared-tree gate attribution, which is clean).

## WAVE2-CLI-VERIFY (verifier, 2026-09-23) — VERDICT: LAND

Adversarial review of the WAVE2-CLI arc (report at `## WAVE2-CLI`
above; PLAN.md §3.12 as the contract). Thinking hat only: zero
source edits, nothing committed. The system-base crew's files are
out of scope and untouched; its DONE section above corroborates
two of my readings (q at 17, mid-slice CLI/typecheck history).

### (1) Thinness law — HOLDS, no crept logic

Read all 5 `src/cli/` files + the 8-line `bin/neo.ts` firsthand
against PLAN §3.12's OWNS / MUST-NOT-own lists:

- `index.ts`: Commander wiring + `command:*` usage error + exit
  code plumbing. Pure argv/exit. Clean.
- `sync.ts`: `resolve(dir ?? cwd)` (argv→options), lazy subsystem
  imports, one `sync()`, one bare `flushReferenceBuild()`, prints,
  exit codes. The `build?.status === 'failed'` branch interprets
  a subsystem result into a named cause + exit 1 — that IS the
  law's "errors name the cause and exit nonzero — here", not
  compile logic. Clean.
- `clean.ts`: `getOutDirPath` + `existsSync` + `cleanDir` + the
  link-prune loop over the derived list via subsystem
  `removeGeneratedLink`. The loop moved verbatim with `cmdClean`
  exactly as §3.12 sanctions ("the link list ... moves with
  `cmdClean`, still derived"). No wipe logic inlined, no link
  construction. Clean.
- `watch.ts`: boot lines, change/resync/error prints, SIGINT/
  SIGTERM shutdown, the never-promise. Lifecycle + print only.
  Clean.
- `output.ts`: USAGE + `messageOf` + `printUsageError`. Clean.
- Bin: 134→8 lines, shebang + header + import + run + exit.
  Zero remaining command logic; the old `cmdSync`/`cmdClean`/
  `cmdWatch`/`removeScopeLinks`/`routeCommand`/`isVerb`/
  `printHelp` bodies are gone, not forked.

Flag check for stayed-or-crept compile/publish/link logic:
**none found**. Every subsystem seam is a call, never inlined.

### (2) Commander wiring — correct + minimal

- `commander@^14.0.3` in `packages/reference-neo/package.json`,
  matching `packages/reference-mcp/package.json:51` verbatim
  (dedupe/store-hit holds: the `commander@14.0.3` snapshot
  pre-existed in the lockfile — the diff adds only the importer
  spec row, no new snapshot).
- Wiring surface: `name`/`description`/`addHelpText` +
  `command:*` + two register fns + one hidden `--watch` option
  on clean. No plugins, no exitOverride, no custom parsers.
  Lazy dynamic imports preserved (`sync`/`watchSync`/bridge load
  only on their paths — `--help`/`clean` never touch the sync
  world; verified by reading the import sites).
- Lockfile `+5/−2`: the +3 commander rows plus two vitest peer-
  suffix lines flipping `esbuild@0.27.3`↔`0.28.2`. That flip is
  regen churn (commander has no deps; nothing in this arc
  resolves esbuild), almost certainly a concurrent-install
  artifact — zero new packages either way. The report's
  "commander-scoped" is true in substance (no new dep besides
  commander), imprecise on those two lines. NIT, no action.
- "Matching mcp/legacy": mcp verified; `reference-core` carries
  no commander dep, so the legacy half is vacuous. NIT, no
  action.

### (3) Tasty drain — one bare call, essay MOVED not duplicated

- `src/cli/sync.ts`: exactly one `flushReferenceBuild(cwd)`
  call, bare — the 6-line REF-10 essay comment from old
  `bin/neo.ts:28-38` is gone from the command path. The sync.ts
  file header carries one summary line ("drains the
  session-owned tasty phase with a single subsystem call") —
  a header description of what the file does, not the REF-10
  failure-consequence knowledge. Acceptable, not duplication.
- `reference/bridge/init.ts` diff is ONLY the `+3/−1` JSDoc
  hunk on `flushReferenceBuild` (failure consequence:
  `types.mjs` keeps its `./tasty/runtime.js` edge while
  `types/tasty/` never lands → bundlers resolving
  `@reference-ui/types` fail, REF-10 cited). No sibling overlap
  on that file — the hunk is the whole diff.
- Repo grep for the essay's distinctive strings finds them only
  in the bridge JSDoc. Moved, not duplicated. No HOLD.

### (4) clean-on-cleanDir — retry semantics reproduced, no HOLD needed

Re-derived firsthand from `src/sync/clean.ts` (untouched file):

- Retry targets `ENOTEMPTY`/`EBUSY`/`EPERM` only, 6 attempts,
  then throws loud. Sleep schedule `5ms×(attempt+1)` after
  attempts 0–4 totals **75ms max** — the report's "≤105ms" is a
  true bound (75 ≤ 105) but the exact figure is 75ms. NIT.
- The overlap it exists for: sync's pre-wipe racing the
  never-awaited background tasty phase's atomic-rename landings
  (clean.ts header + `cleanDir` JSDoc say exactly this — "the
  two overlap by design"). The report's
  "pre-wipe racing the background tasty phase on warm re-syncs"
  reproduces the documented rationale correctly.
- CLI-clean meets the same race class only via a concurrent
  watch/sync on the same dir (file landings vs recursive
  remove → ENOTEMPTY → backoff converges; a stuck writer fails
  loud after 6 — identical to sync's contract). Structurally
  sound; and `cleanDir`'s own JSDoc already blesses
  non-sync callers ("both sync wipes and test teardown"),
  so CLI adoption is inside the primitive's established
  contract, not a stretch.
- Uncontended equivalence is exact: `rm(dir, {recursive: true,
  force: true})` — the same options the old `rmSync` used;
  `force` suppresses ENOENT in both; sync/async differs on an
  already-async path only.
- New error surface (`[neo] clean failed: <cause>` exit 1 vs
  the old uncaught throw → stack + exit 1) is the same exit
  class with a named cause — the thinness law's error rule,
  on an unpinned path. Disclosed in the report.

**Confirmed: no HOLD was needed, and none was skipped.** The
reasoning verifies against the primitive's documented design.

### (5) LINKED_PACKAGES still PACKAGES-derived — YES

`src/cli/clean.ts:18` is `PACKAGES.map((pkg) =>
getShortName(pkg.name))` — byte-equivalent to the old bin line,
moved verbatim. The T1 "4 links" claim is consistent (the 4th
junction is the previously-orphaned `types` link NIGHT-1
re-derived). No mirrored list anywhere.

### (6) Watch driver untouched — YES, routing only

`git status` shows `src/sync/watch.ts` unmodified; `watch.ts`
imports `watchSync` and owns only flag routing + prints +
signals + the never-promise. The 11 AM verdict's driver
ownership is undisturbed. Clean.

### (7) Output contract — assessed HONESTLY

- Pinned strings kept byte-identical: verified firsthand
  (`frobnicate` → stdout usage + `unknown command:`,
  exit 1; `bin/neo.test.ts` 7/7 green inside the full unit
  run; CLI-02's substring pins untouched in code).
- Commander-native deltas confined to UNPINNED paths and all
  disclosed — each re-verified by direct bin probe: bare `neo`
  → help + exit 1 (Commander-native, to stderr); extra
  positionals → `error: too many arguments for 'sync'...`
  (stderr, exit 1); `sync --help` → help, exit 0.
- The full §3.12 one-line contract (glyph + command + stats)
  is explicitly NOT claimed — deferred to morning polish
  against the pins. The report refuses to restyle under pinned
  assertions. That is the honest call; concur.

### Gates (all firsthand, this session) — ALL GREEN, no attribution needed

- Units (`pnpm vitest run` in `packages/reference-neo`):
  **53 files / 354 tests passed**, exit 0 — exact match to the
  report's final-bytes figure. Includes `bin/neo.test.ts` 7/7
  (untouched file, routing contract holds through Commander).
- `pnpm agentneo q` (whole package): **0 errors, 17 warnings,
  229 files**. Zero warnings in CLI-scope files (`src/cli/*`,
  `bin/neo.ts`, `bridge/init.ts`) — all 17 sit in
  sibling/pre-existing files (collect, symlink test, reference,
  recipe, sync, shared, quality tools). The report's "18th
  warning = sibling validate.test.ts" is already stale in the
  expected direction: that file is gone from the tree (the
  system-base DONE above confirms the mid-slice split back to
  17) and the count is back at baseline. CLI contribution:
  zero warnings. No red, nothing to attribute.
- `pnpm agentneo run NEO-CLI-01` → **PASS**
  (lifecycle.spec.ts). The moved one-shot path is proven end
  to end on final bytes.
- Case runs typecheck first and refuse on red — types green by
  pass. (Also corroborated by the sibling's note that the
  mid-slice commander typecheck red was fixed by the CLI crew
  before either arc's proofs.)

### Footprint check

`M bin/neo.ts` (134→8), `M package.json` (+1), `M
pnpm-lock.yaml` (+5/−2), `M bridge/init.ts` (JSDoc hunk only),
new `src/cli/` (5 `.ts` + README). Every other modified file in
the tree belongs to sibling crews (system-base et al.). Index
untouched by me; nothing committed.

### Nits (all non-blocking, no action required)

- N1: lockfile "commander-scoped" — two vitest peer-suffix
  lines carry unrelated esbuild-version churn (concurrent
  regen noise, zero new packages).
- N2: "matching mcp/legacy" — mcp match verified; core has no
  commander dep, so the legacy half is vacuous.
- N3: backoff bound "≤105ms" — exact max is 75ms (5 sleeps;
  none after the final attempt). Bound holds.

WAVE2-CLI-VERIFY DONE: LAND. The thinness law holds with zero
crept logic, Commander is minimal and correctly wired, the
essay moved (not duplicated), cleanDir unification is verified
(no HOLD needed or skipped), PACKAGES derivation and the watch
driver are intact, and the output-contract deferral is honest.
Gates green on final bytes (units 53/354, q 0/17-with-zero-CLI,
NEO-CLI-01 PASS). Report, don't land.

## Captain's hold note (2026-09-23) — CLI LAND waits for base verdict

WAVE2-CLI-VERIFY returned clean LAND (thinness holds, Commander
minimal, essay moved, cleanDir verified, honest output deferral).
Captain's firsthand gates + landing HELD until WAVE2-BASE-VERIFY
reports: the base verifier is running gates in the shared tree now,
and concurrent Playwright runs risk mutual evidence corruption.
Then: one gate run, two stepped landings (CLI, then base), N-2
native implementer dispatches on the base landing.
