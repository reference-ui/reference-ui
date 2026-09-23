IN PROGRESS

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
