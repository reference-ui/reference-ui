COMPLETE

# LOG-1 — Objective 1: reference + tasty bridge

Brief: [VOYAGE.md](./VOYAGE.md) Objective 1. Lands one commit.
Crew shape: voyage captain protocol (cartographers →
implementers → reviewers; captain verifies firsthand and commits).

## Status

Step 0 done 2026-09-22: verbatim copy
`packages/reference-core/src/reference/` →
`packages/reference-neo/src/reference/` (71 files, stale PLAN.md left
behind). Copy arrives red.

## Pending cartography

Inventory verify against core source, duplication verdict on
`browser/` vs `browser-component/`, dead-code list, seam design.

## Voyage launch (captain, 2026-09-22)

HQ authorized launch; captain took conn. Dispatched cartography crew
lead (map-only, read-only except this log): inventory verify,
duplication verdict, dead-code list, seam design, parity checklist +
perf-law proof plan, scoped implementer plan. Implementers and
reviewers held until the map lands. Health-check tick armed (twice
hourly).

## Cartography (crew lead, 2026-09-22) — MAP COMPLETE

Method: read-only walk of core source, neo copy, lib seam surfaces,
matrix oracle, neo sync/publish/benchmark. No source edits (this log
only). Governing skill `agent-neo` loaded first.

### 1. Inventory verification — CONFIRMED, with one Step 0 smell

`diff -r packages/reference-core/src/reference
packages/reference-neo/src/reference` → single line: `Only in
.../core.../reference: PLAN.md`. Zero content drift: the copy is
byte-verbatim.

| dir | core | neo |
| --- | --- | --- |
| root (`api.ts`, `index.ts`, `run.test.ts`, +`PLAN.md` core-only) | 4 | 3 |
| `bridge/` (11: build-report, copy-browser-virtual, events, index, init, logging, paths, run, tasty-build, worker-types, worker) | 11 | 11 |
| `browser/` (10: component-api, components/index, index, MODEL.md, README.md, Reference.tsx, ReferenceRuntimeContext.tsx, ReferenceStatus.tsx, Runtime.ts, types.ts) | 10 | 10 |
| `browser-component/` (38: components 11 + shared 6, document 5, fixtures 9, root 5, theme 2) | 38 | 38 |
| `browser-model/` (8: README, document, index, member, summary, type, typeLabel, unionTypeLabel.test) | 8 | 8 |
| `tasty/api.ts` | 1 | 1 |
| total | **72** | **71** |

Smell (implementers must fix, Crew C): core tracks only **34** files —
`browser-component/` (38 files) is generated and gitignored
(`.gitignore:58`, produced by `tools/copy-reference-api-component.mjs`
via `prepare`/`prebuild`). Step 0 commit `b94874f40` committed **all
71 in neo, generated mirror included**. Neo must not ship committed
generated output: un-commit the mirror (`git rm --cached` +
gitignore) once the neo mirror tool exists. Port rule 4 ("no silent
copies") starts here.

Red-import census (what makes the copy red — Crew A/B scope): 8
bridge files reach outside `reference/`: `../../lib/thread-pool`
(workers, KEEP_ALIVE), `../../lib/event-bus` (emit, on),
`../../lib/log`, `../../lib/profiler`, `../../lib/paths`
(getOutDirPath, getVirtualDirPath, resolveCorePackageDir),
`../../virtual/fs/copy`, `../../sync/types` (SyncPayload),
`../../config` (ReferenceUIConfig); `run.test.ts` reaches
`../constants` + `../lib/*` mocks. Neo has: `getOutDirPath`
(`src/lib/paths`), `ReferenceUIConfig` (`src/config/types.ts`),
`DEFAULT_OUT_DIR` (`src/constants.ts`), `fast-glob`,
`@reference-ui/rust`. Neo deliberately has NO virtual dir ("deliberately
do not come across", `src/lib/paths/index.ts`), NO event bus, NO
workers/thread-pool, NO `react/types/*.d.ts` or
`styled/types/system-types.d.ts` legs, and links only
system/styled/react (`src/sync/publish/links.ts`, no types).

### 2. Duplication verdict — SOURCE-VS-MIRROR with a layer-inversion wart

Not a duplicate, not a clean layer. Evidence:

- `browser-component/` is a byte-mechanical mirror of
  `packages/reference-lib/src/components/Reference`, proven by
  `diff -r lib/.../Reference core/.../browser-component`: every file
  identical except the copy tool's three transforms (prepend
  `@ts-nocheck` + provenance header, rewrite `@reference-ui/types` →
  relative `../browser/component-api`, skip `.md` so `NEXT.md` and
  lib's README don't cross; README replaced by generated stub).
- `browser/` is the core-owned adapter+runtime layer: `Runtime.ts`
  (tasty browser runtime, `__REFERENCE_UI_TYPES_RUNTIME__`
  placeholder, document hook), `types.ts` (the
  `@reference-ui/types`-compatible surface), `component-api.ts`
  (the adapter the mirror imports), `Reference.tsx` (factory +
  default singleton), `ReferenceRuntimeContext.tsx`.
- The wart is bidirectional: mirror→browser via `component-api`
  (clean), but browser→mirror via `browser/components/index.ts`
  (10 re-exports into the mirror) and `browser/ReferenceStatus.tsx`
  (pure re-export of the mirror). Plus two shells around one render
  tree: shipped `browser/Reference.tsx` (what `src/entry/types.ts`
  bundles into `types.mjs`) vs orphaned mirror
  `Reference.tsx`/`ReferenceView.tsx` (zero importers outside the
  mirror; mirror `index.ts` itself has zero importers).
- History scar: mirror `theme/tokens.ts` header claims to mirror
  `reference-core/src/reference/browser/theme/tokens.ts`, a path
  that does not exist — tokens moved, comment didn't.

One clean target shape (implements port rules 2+4 within the
agent-neo gate, which bans neo→lib-source imports):

1. Mirror stays **generated, gitignored, explicit**: a checked-in
   neo-owned tool, documented invocation (not hidden lifecycle
   magic), provenance headers kept. Mirror file list = §3 living
   set only (partial mirror is fine — it's explicit).
2. Composition moves to the bundle entry: neo entry module composes
   runtime (`browser/`) + presentation (mirror). `browser/` keeps
   runtime+types+adapter only; `browser/components/index.ts` and
   `browser/ReferenceStatus.tsx` die as files (entry re-exports
   directly). Single import direction: mirror→browser,
   entry→both.
3. One shell: keep the shipped `browser/Reference.tsx`
   factory (it's the tested contract — matrix e2e's `?name=`
   pages); the mirror shell (`Reference`/`ReferenceView`) is not
   mirrored (lib keeps its own for Book/Cosmos).
4. Rejected: direct neo→lib-source imports (gate ban), vendor-and-own
   (lib stops being source of truth, breaks "frontend stays in lib").

### 3. Dead-code list — port the living, bury the dead

Living (port): `bridge/` init, worker, worker-types, run,
tasty-build, events, logging, build-report, paths (chain proven in
`src/sync/events.ts` + `events.test.ts`); `browser/` index,
component-api, types, Runtime, ReferenceRuntimeContext, Reference
(bundle entry surface, `src/entry/types.ts`); mirror `components/**`
(all 17) + `document/**` (all 5 — `ReferenceDocumentView`→`document/`
edge proven live); `browser-model/**` (all 7 + test);
`tasty/api.ts` (projector + options; consumed by tasty-build,
Runtime, matrix helpers); `api.ts` (live: `packages/reference-mcp`
imports `@reference-ui/core/reference` — handoff to Objective 2);
both test files (re-mock to neo seams); `browser/README.md` +
`MODEL.md` content (adapt into neo docs, not stray md).

Bury in neo (evidence each):
- `PLAN.md` — stays dead per port rule 1 (said "not building a
  frontend component yet"; component exists; success criteria
  since superseded by real TYPES_PACKAGE legs).
- `bridge/copy-browser-virtual.ts` + its events
  (`run:reference:component:copy`, `reference:component:copied`,
  `...copy-failed`) — VERIFY-THEN-BURY (Crew A proves, then
  buries): stated purpose "so Panda can scan styled primitives"
  is stale — `browser/` (the only copied tree) contains ZERO
  styled/css imports; zero consumers of `virtual/_reference-component`
  output; the copy's only load-bearing role is its completion
  event gating `virtual:complete`, a barrier that doesn't exist
  in neo's serial sync. Bury unless Crew A finds a consumer.
- `browser/components/index.ts`, `browser/ReferenceStatus.tsx` —
  the inversion (§2); absorbed into entry composition.
- `reference/index.ts` (`Reference` namespace) — zero importers
  anywhere; the shipped surfaces are `api.ts` + entry, not this.
- Mirror `Reference.tsx`, `ReferenceView.tsx`, `index.ts` —
  orphaned shell + orphan barrel (importer census §2).
- Mirror `fixtures/**` (all 9, incl. `Hello.book.jsx` scaffold) —
  zero importers; `.book.*` are lib-harness only; `fixtures/index.tsx`'s
  "tasty indexes these exports" claim is about lib's own sync
  tree, never the mirror (tasty scans outDir/virtual, not core src).
- Mirror `theme/**` — reachable only via the orphan mirror index;
  lib source stays live (tokens consumed via lib's own sync).
- Mirror `@reference-ui/react` / `@reference-ui/system` imports —
  NOT dead, load-bearing: the copy tool rewrites only
  `@reference-ui/types`; Div/Small/tokens resolve against the
  CONSUMER's generated packages at bundle time (see §4
  resolution law). Neo mirror tool must preserve this behavior.

### 4. Seam design — explicit lib↔neo seam (build directly)

Truth flows one way: lib source → (explicit tool) → neo gitignored
mirror → neo types-bundle leg → generated `@reference-ui/types` →
consumer. Never reverse; never hand-edit the mirror.

- S1 mirror tool (neo-owned, checked in, documented): partial mirror
  (§3 living set), same three transforms, provenance headers.
  Gitignored. Replaces core's prepare/prebuild magic with an
  explicit step the publish leg invokes and the docs name.
- S2 `component-api.ts`: the adapter surface (runtime provider +
  hooks + `formatReferenceTypeParameter` + `types.ts`). This is
  the `@reference-ui/types` contract the presentation consumes.
  Owned by Crew B, imported by the mirror, re-exported by S3.
- S3 neo entry (`entry/types-neo` or publish-leg equivalent):
  composes runtime + presentation, bundles `types.mjs` with
  externals `react, react-dom, react/jsx-runtime,
  @reference-ui/styled*, @reference-ui/types*,
  __REFERENCE_UI_TYPES_RUNTIME__` (core's list, `esbuild.ts`),
  then rewrites the placeholder → `./tasty/runtime.js` literal
  (core `rewrite-types-runtime-import.ts` semantics; app bundlers
  must see the real edge for the lazy chunk graph).
- S4 generated `@reference-ui/types` package: `types.mjs` +
  `types.d.mts` + `./manifest` + `./runtime` + `tasty/` artifacts
  (core TYPES_PACKAGE shape), linked into consumer
  `node_modules/@reference-ui/types` (extend neo `links.ts`
  LINKED_PACKAGES with `types`). Re-commission unblocks lib:
  restore `src/index.ts` Reference export + drop tsconfig
  `exclude: src/components/Reference/**` (the exact 2-edit
  tracker at `reference-lib/src/index.ts:18-22`, HQ 2026-09-18).
- S5 tasty leg: cold start pays tasty ONCE on a deprioritized
  background loop; ref syncs never await it. No event bus in neo:
  serial sync gains a non-blocking tasty phase (sync completes,
  manifest lands after). Scan roots retarget to neo outDir
  (note: only `styled/types/style-props.d.ts` of tasty-build's 4
  decl roots exists in neo output today — Crew A proves
  `P→SystemProperties` projection still resolves via
  neo-generated decls, else wires the missing surface).
- S6 `api.ts` equivalent: neo must offer the `./reference`
  surface (`createReferenceUiTastyApi`, options getters,
  `createReferenceDocument`, model factories + types) — mcp
  consumes it today; Objective 2 migrates mcp off core.

Resolution law (proven, not assumed): `import.meta.resolve` from
source locations shows BOTH `@reference-ui/react` (core mirror)
and `@reference-ui/types` (lib source) UNRESOLVED in-monorepo —
every `@reference-ui/*` edge in this module resolves against
consumer-local generated packages. Neo's bundle leg must run
where neo-generated react/system/styled resolve. Open
verification V1 (Crew C): pin the exact working resolution path
(core's in-monorepo success path is not fully closed — no alias
config, no core-local links; likely installed-layout walk-up).

What neo does NOT take: event bus + `ReferenceEvents` global map,
workers/thread-pool/piscina, virtual-fs copy, `system:panda` edges,
`packager-ts` two-pass barriers. Neo equivalents: serial phases +
publish legs + links.

### 5. Parity checklist + perf-law proof plan

Cases: new `NEO-REF-xx` group (`case.json` + README + `specs/` +
`world/`, per `NEO-SYNC-01` shape). Oracle mapping (behavior pinned
by matrix/core today):

- REF-01 package shape: `.reference-ui/types` + package.json
  (main/types/exports) + node_modules link + `tasty/manifest.js` +
  `tasty/runtime.js` + decls. ← matrix unit "creates the generated
  @reference-ui/types package…", install.test, TYPES_PACKAGE.
- REF-02 symbol queries: local interface members
  (label/disabled/variant), StyleProps projection (accentColor,
  container), composed alias, pinned alias, indexed-access
  readability, extends flattening (interface→alias), direct-alias
  identity. ← matrix unit tests 1–5.
- REF-03 render contract (all 18 e2e, port as specs): interface +
  Union chips; StyleProps page; extends fixtures; inherited
  sections + counts; complex interface; literal-union aliases
  (top-level + standalone/derived); tuples with labels; origin
  labels; generic headers (constraints/defaults); mapped/object
  aliases; discriminated unions; conditional→union; typeof
  projection; JSDoc pages; composed-alias projection;
  definition-first direct aliases; missing-symbol readable error.
  ← `reference-contract.spec.ts` (18 tests).
- REF-04 refresh: symbol rename re-syncs artifacts + browser.
  ← matrix unit "refreshes…after a source symbol rename".
- REF-05 runtime shell: loading/error/empty states, provider-required
  error. ← ReferenceStatus + ReferenceRuntimeContext.
- REF-06 model unit: union label cases. ← `unionTypeLabel.test.ts`
  (port into neo suite).
- REF-07 bridge run: diagnostics logged + structured complete;
  throw → failed emission. ← `run.test.ts` (re-mock to neo seams).
- REF-08 placeholder rewrite: bundle contains literal
  `./tasty/runtime.js`, zero placeholder residue. ← postprocess.test.
- REF-09 projector: `P→SystemProperties` via neo decls + bare-name
  fallback. ← `tasty/api.ts`.
- REF-10 re-commission: lib export restored + exclude dropped,
  lib typecheck green, Book fixtures render. ← seam S4.

Perf-law proof plan (hard constraint — no regression or it doesn't
land): `pnpm bench:neo --scale enterprise --seed 7 --runs N`
(N≥5; plans default seed IS 7 — never override). Same box,
before (pre-landing, tasty dark) vs after medians; guardrail =
pre-voyage same-box median (scoreboard: committed pin 744ms,
this-box scratch 787ms — cross-report numbers like latest's 1.05s
single-run are NOT comparable, medians decide). Tasty
deprioritization proof: REF case asserts sync output identical AND
sync-complete lands before tasty-manifest-ready (cold start pays
once, ref syncs run on their own). Tasty fully deprioritized —
background loop only.

### 6. Scoped implementation plan — strict disjoint crews

- Crew A — bridge: `src/reference/bridge/**` (retarget §1 census
  to neo seams; serial non-blocking tasty phase; scan roots to
  neo outDir), `run.test.ts` port, copy-browser-virtual
  verify-then-bury with proof. Touches nothing else.
- Crew B — runtime+model: `browser/{index,component-api,types,
  Runtime,ReferenceRuntimeContext,Reference}.ts*`,
  `browser-model/**`, `tasty/api.ts`, `unionTypeLabel.test`
  port, `api.ts` port. No mirror, no entry, no publish.
- Crew C — mirror+entry+publish: neo mirror tool + docs, mirror
  un-commit + gitignore, §3 bury execution, S3 entry, S4 types
  leg (bundle, placeholder rewrite, manifest/runtime packaging,
  `links.ts`+types, d.mts), V1 resolution proof. No bridge,
  no runtime logic.
- Crew D — cases+perf: `NEO-REF-xx` group (§5), bench:neo
  before/after medians, REF-10 re-commission (exactly 2 lib
  edits: `reference-lib/src/index.ts:22` restore +
  `reference-lib/tsconfig.json` exclude drop). No src changes
  beyond those two lines.

Order: B + C(mirror tool) parallel → A → C(entry/publish) →
D. Reviews: agentneo cases + targeted suites only; full runs on
explicit order. Hard constraints: port rules 1–4, perf law,
agent-neo gate (headers, no `any`, no suppressions, no lib/core
imports), one commit (captain lands).

Handoff to Objective 2: `packages/reference-mcp` imports
`@reference-ui/core/reference` (pipeline/reference.ts, join.ts) —
migrate to S6 when core retires. Matrix `matrix/reference` stays
the behavior oracle until then; its fate (chain-gate keep vs
Neo-port) is Objective 2's audit, not ours.

## Wave 1 dispatch (captain, 2026-09-22)

Map accepted: inventory byte-verbatim, verdict + dead-code + seam all
evidenced, phased plan filed. Tree check: only LOG-1.md modified —
cartographers held read-only. Per map order (B + C-mirror → A →
C-entry/publish → D), Wave 1 sends Crew B (runtime+model) and Crew C1
(mirror tool + bury + V1) in parallel on disjoint scopes. Crew A, Crew
C2, Crew D held for later waves. Crews never commit; index untouched
(no `git add`/`git rm` — captain handles the mirror un-commit at
landing).

## Crew B — runtime+model (2026-09-22) — WORKING

Scope (strict): `browser/{index,component-api,types,Runtime,
ReferenceRuntimeContext,Reference}.ts*`, `browser-model/**`,
`tasty/api.ts`, `api.ts`, unionTypeLabel.test port, browser
README/MODEL → neo docs. No mirror, no entry, no publish, no
bridge. Governing skill `agent-neo` loaded first.

### B0. Recon (read-only)

- Core entry `src/entry/types.ts` re-exports the whole shipped
  surface from `reference/browser`: `Reference`,
  `createReferenceComponent`, runtimes, provider, hooks, format,
  `types.ts`. The `?name=` oracle
  (`matrix/reference/src/index.tsx`) imports only `{ Reference }`
  from `@reference-ui/types` and renders `<Reference name/>`.
- `createReferenceComponent` has exactly one caller repo-wide:
  the `Reference` singleton line in `browser/Reference.tsx`
  itself. Everything else is re-export. Lib's own shell uses the
  provider pattern, never the factory.
- S2 surface pinned by mirror census: 11 mirror files import
  from `browser/component-api` (values: provider,
  `useReferenceDocumentFromContext`, `createDefaultReferenceRuntime`,
  `formatReferenceTypeParameter`; types via `export type *`).
  Current `component-api.ts` already covers all of it.
- S6 surface pinned by mcp census (`pipeline/reference.ts`,
  `pipeline/join.ts`): `createReferenceDocument`,
  `createReferenceUiTastyApi`, `formatReferenceType`,
  `ReferenceDocument`, `ReferenceMemberDocument`. Current
  `api.ts` already covers all of it.
- Stale test path (broken in core too): `unionTypeLabel.test.ts`
  points at `tasty/tests/cases/jsdoc/output/manifest.js`, which
  does not exist — the case was renamed to `TST-DOC-01-jsdoc`
  (tracked `output/manifest.js` confirmed via `git ls-files`).
- Red-import census (§1) touches only Crew A files; Crew B
  files import `@reference-ui/rust/tasty*` (linked in neo,
  dist built) plus intra-module relatives. No core/lib edges.
- Mirror view props read (seam typing only, no mirror edits):
  Frame `{children}`, DocumentView `{document}`,
  Loading/Empty `{name}`, Error `{name, errorMessage}`.

### B1. Design — Reference.tsx seam (composition → entry)

Per §2 target (browser/ keeps runtime+types+adapter only;
single direction mirror→browser, entry→both), the shell keeps
its factory in `browser/Reference.tsx` but takes presentation
as an injected `ReferenceViews` parameter — no static
mirror edge, no dependence on the dying shims
(`browser/components/index.ts`, `browser/ReferenceStatus.tsx`).
The composed `Reference` singleton moves to the entry (Crew C:
factory + default runtime + mirror views). Shipped
`@reference-ui/types` keeps exporting `Reference` +
`createReferenceComponent`, so the `?name=` pages are
unaffected. `browser/index.ts` exports the factory, never the
shims. No neo-internal importers of the barrel outside this
scope (verified by grep), so the reshape is contained to the
B→C seam.

## Crew C1 — mirror tool + bury + V1 (2026-09-22) — DONE

Scope: mirror-phase only. Neo mirror tool (new, checked in,
documented), gitignore edit, §3 bury (working-tree deletes,
index never touched), V1 resolution proof (read-only). No
bridge, no runtime logic, no entry/publish (C2 wave), no
reference-rs. Governing skill `agent-neo` loaded first.

### C1.0 Pre-work census (read-only)

- `browser/components/index.ts`: zero importers outside the
  module except `browser/Reference.tsx` (`./components`) —
  Crew B file, B rewires in parallel (B1 design confirms:
  factory takes injected views, shims die).
- `browser/ReferenceStatus.tsx`: sole importer
  `browser/Reference.tsx` (`./ReferenceStatus`). Same B handoff.
- `reference/index.ts` (Reference namespace): zero importers
  anywhere. Clean bury.
- Mirror `index.ts` (`../index`): importers are the 9 mirror
  fixtures only — all buried together. Clean.
- Gap found in the brief's bury list: mirror
  `ReferenceStatus.tsx` (3 state components, REF-05 shell) is
  neither in the §3 living set (root file, not
  components/document) nor in the bury enumeration. The tool
  spec (living set ONLY) governs: it is dropped by the
  regenerate. Importers after this wave: zero
  (browser/ReferenceStatus.tsx + mirror ReferenceView.tsx both
  buried). HANDOFF Crew B: the three states
  (Loading/Error/Empty `{name[, errorMessage]}`) need a new
  home in browser-owned code or entry composition.
- `bridge/copy-browser-virtual.ts`: NOT touched (Crew A
  verify-then-bury, later wave).

### C1.1 Mirror tool (added)

`packages/reference-neo/tools/mirror-reference-component.mjs`
(new, checked in) + `packages/reference-neo/tools/README.md`
(names the explicit invocation):
`cd packages/reference-neo && node
tools/mirror-reference-component.mjs`. No package.json
lifecycle magic (neo package.json keeps zero scripts).
- Partial mirror: `MIRROR_ROOTS = components, document`
  only (22 files). Shell, fixtures, theme never cross.
- Same three transforms as core's tool: prepend
  `@ts-nocheck` + provenance header, rewrite
  `@reference-ui/types` → relative `../browser/component-api`
  (same relative layout, identical specifiers), skip `.md`.
  `@reference-ui/react` / `@reference-ui/system` imports
  PRESERVED untouched (load-bearing; V1 confirms under both
  resolution regimes).
- Provenance names the neo tool; generated README names the
  explicit command. Lock file
  `.mirror-reference-component.lock` (self-cleaning).

### C1.2 Acceptance: tool run + diff — PASS

Ran the tool (reported `Mirrored 22 reference component
files`). Diff of the 22 living files before→after
(snapshot in /tmp, Step-0 tree was byte-verbatim per §1):
EXACTLY ONE line differs per file (line 5, the intentional
provenance delta: `mirrored into reference-core by
tools/copy-reference-api-component.mjs` → `mirrored into
reference-neo by tools/mirror-reference-component.mjs`).
44 changed diff-lines total (22×2), zero other bytes moved —
rewrites, react edges, bodies all identical to core's proven
output. Transform audit on the fresh mirror:
`@reference-ui/types` residue 0; react edges 19 mirror = 19
lib living source; system edges 0 = 0 (only importer was
buried theme); `@ts-nocheck` 22/22; `.md` crossed: generated
README only (lib NEXT.md/README skipped).

### C1.3 Gitignore (edited)

`.gitignore`: added
`packages/reference-neo/src/reference/browser-component/`
directly under the core line. File edit only.

### C1.4 Bury (working-tree deletes, plain `rm`, index clean)

- `browser/components/index.ts` (+ removed the emptied dir)
- `browser/ReferenceStatus.tsx`
- `reference/index.ts`
- Mirror side via the tool regenerate (rm -rf + living-only
  rewrite): `Reference.tsx`, `ReferenceView.tsx`, `index.ts`,
  `ReferenceStatus.tsx` (see C1.0 gap note), `fixtures/**`
  (all 9), `theme/**`, old README (replaced by neo stub).
- Verified after: `git status` shows all changes unstaged,
  staged set EMPTY — index never touched, no commits.

### C1.5 V1 resolution proof (read-only investigation) — PINNED

Question (§4 open verification): exact working resolution
path for the `@reference-ui/*` edges. Method: read
esbuild externals, TYPES_PACKAGE, resolveCorePackageDir;
inspected matrix/reference installed layout; replicated
`bundleWithEsbuild` EXACTLY (same options, cwd =
matrix/reference) with metafile + onResolve/onLoad probes;
audited fresh output vs the Sep-16 `.reference-ui` artifact.
- coreDir at bundle time = workspace
  `packages/reference-core` (resolveCorePackageDir workspace
  fallback — walkUpToPackage matches only package.json files
  literally named `@reference-ui/core` in ancestor dirs, never
  node_modules; bundle `// ../../packages/...` comments with
  cwd=matrix/reference confirm).
- `@reference-ui/react` (18 sites, all living mirror files):
  BUNDLE TIME, via esbuild tsconfig auto-discovery →
  `packages/reference-core/tsconfig.json` paths
  (`@reference-ui/react` → `./src/entry/react.ts` →
  `../system/primitives`) → primitives BUNDLED into types.mjs.
  Fresh output 281,171 bytes, 0 external react edges,
  metafile 55 inputs all core-src + reference-rs dist.
  NOT consumer node_modules.
- `@reference-ui/styled/*` (4 edges: css, css/cva,
  patterns/box, jsx, via the bundled primitives): EXTERNAL
  (ESBUILD_EXTERNALS) → CONSUMER RUNTIME: vite serving the
  consumer walks up to `consumer/node_modules/@reference-ui/
  styled` → symlink → `consumer/.reference-ui/styled`.
  Proven: matrix/reference links enumerated (core/lib →
  workspace packages; react/styled/system/types → absolute
  `.reference-ui/*` links), no vite alias, no hoisting (pnpm;
  root + core-local `@reference-ui` lack them).
- `@reference-ui/types`: ZERO module edges — the mirror tool
  rewrites every one to relative component-api at mirror time
  (0 residue proven C1.2). Externals entry precautionary.
  `__REFERENCE_UI_TYPES_RUNTIME__` → postprocess →
  `./tasty/runtime.js` literal (1 hit, 0 placeholder residue).
- `@reference-ui/system`: ZERO module edges in the shipped
  graph — sole importer theme/tokens.ts reachable only via
  the orphan mirror index (buried C1.4). The 2 bundle mentions
  are string literals in tasty/api.ts library-name lists. In
  lib's own builds, system resolves via lib tsconfig paths →
  `lib/.reference-ui/system` (generated).
- `react`, `react-dom`, `react/jsx-runtime`: external →
  consumer runtime (consumer's own React).
- Stale-artifact note (no action): the Sep-16
  `matrix/reference/.reference-ui/types/types.mjs` (171KB, 18
  EXTERNAL react edges) contradicts current config (react
  never in externals per `git log -S`; paths mapping since
  2026-03-21; value re-exports since 2026-03-10) — anomalous
  gitignored scratch, likely a dirty-tree build; same-stamp
  e2e test-results prove the runtime leg worked against it
  (vite walk-up). Rebuilds on next setup --sync.
- Implication for Crew C2 (S3/S4): neo's bundle leg must
  reproduce (a) the react paths-mapping (or equivalent alias
  → neo primitives entry) so Div/P bundle, (b) styled/types/
  react externals preserved for consumer runtime, (c) links.ts
  + types so consumer node_modules carries the generated
  packages. Scratch repro scripts kept at
  /tmp/c1-esbuild-*.mjs + /tmp/c1-fresh-types.mjs (re-runnable,
  outside the deliverable).

### C1.6 Gate + landing flags

- `pnpm agentneo q` on both new files: 0 errors, 0 warnings.
  PASS (headers, no `any`, no suppressions, node-only
  imports; lib is READ from disk, never imported).
- LANDING FLAG (captain/C2, not C1 scope): bare `q` walks
  `src/` with no gitignore awareness and no `@ts-nocheck`
  exemption, so the 22 generated mirror files trip
  `neo/header` (1-sentence lead). Equally true of the 38
  Step-0 files — strictly better now, but the gate needs a
  mirror-dir exclusion (or equivalent) before bare `q` can go
  green on the landed tree. Not fixed here: shared voyage
  infrastructure, captain coordinates.
- DANGLING EDGES (known, Crew B owns): `browser/Reference.tsx`
  still imports `./components` + `./ReferenceStatus` (both
  buried); B1 design already rewires to injected views. Tree
  is red in exactly the anticipated way; green is B+C2's job.

### C1.7 Captain landing checklist (un-commit paths)

At landing, un-commit the generated mirror (map §1 smell):
`git rm --cached -r
packages/reference-neo/src/reference/browser-component`
(covers all 38 formerly-tracked paths: 22 living modified +
16 tree-deleted incl. fixtures/theme/shell), with the C1.3
gitignore line making it stick. C1's commit payload: 2 new
files (tool + tools README), `.gitignore` edit, 3 non-mirror
deletes, mirror regenerate. Disjoint from Crew B's
in-flight files (api.ts, browser-model/**, browser/* kept
files, tasty/api.ts) — verified by status census.

### B2. Implementation (all in scope, index untouched)

- `browser/Reference.tsx` reshaped: `createReferenceComponent(
  runtime, views)` with injected `ReferenceViews` (Frame,
  DocumentView, Loading/Error/EmptyState, prop-typed from the
  mirror seam read); singleton removed (entry composes it).
  Zero gate errors in this file.
- `browser/index.ts`: exports factory + `ReferenceViews` type,
  runtimes, provider, hooks, `formatReferenceTypeParameter`,
  `types.ts`. No `Reference` singleton, no shim edges.
- `component-api.ts` (S2), `types.ts`, `Runtime.ts`,
  `ReferenceRuntimeContext.tsx`, `tasty/api.ts`, `api.ts` (S6):
  surfaces verified byte-sufficient against mirror + mcp
  censuses — headers added, one stale `@reference-ui/core`
  comment retargeted, placeholder semantics documented.
  No logic changes.
- `browser-model/`: headers on all 6 modules; all 36 relative
  specifiers across the scope converted to explicit `.ts`/`.tsx`
  (neo NodeNext convention; TS2835 family eliminated).
- `unionTypeLabel.test.ts` ported self-contained: the old path
  (`tasty/tests/cases/jsdoc/...`) is stale in core too (case
  renamed to `TST-DOC-01-jsdoc`), and committed `output/` holds
  goldens only (no loadable chunks — the RS harness compiles to
  gitignored `.scratch`). New test vendors the 50-line case
  input to `browser-model/__fixtures__/union-labels/` and
  compiles at test time via public `buildTasty` into a cleaned
  tmpdir. No RS-source imports, no scratch dependence.
- Docs: `browser/README.md` + `browser/MODEL.md` +
  `browser-model/README.md` adapted into
  `packages/reference-neo/docs/reference-browser.md`
  (architecture-first, no filename tables, `reference-unit` →
  `NEO-REF` cases); the three stray mds deleted from the
  working tree (`rm`, no `git rm`).

### B3. Proofs (scoped, current tree incl. C1's shim burial)

- `pnpm vitest run
  src/reference/browser-model/unionTypeLabel.test.ts` →
  **4/4 pass** (38ms tests). Runtime resolution of
  `@reference-ui/rust/tasty*` in neo needs no alias.
- `pnpm agentneo q` over all 15 Crew B files: 122 → **76
  errors**, all tasty-`d.ts`-chain rooted (49× TS2614 +
  cascade); zero errors in Reference.tsx, index.ts,
  component-api.ts, context, api.ts, barrels, fixtures.
  1 non-blocking complexity warn (typeLabel cyclomatic 9,
  pre-existing shape — left, warns don't block).
- Grep proof: zero `components` / `ReferenceStatus` /
  `browser-component` edges in Crew B files — C1's burial
  (shims + `reference/index.ts` deleted mid-flight) breaks
  nothing of mine. Mirror still consumes S2 (verified live).

### B4. BLOCKER + pending (for captain — objective-critical)

**Tasty `d.ts` vs neo NodeNext (blocks B/A/C2/D type-green).**
Every named import from `@reference-ui/rust/tasty*` is TS2614
in neo: RS dist `d.ts` re-exports are extensionless
(`dist/tasty.d.ts` → `./modules/tasty/js/index` →
`./api-types` …), unresolvable under neo's
`moduleResolution: NodeNext` (core is green only because it
uses `bundler`). Runtime is unaffected (vitest green).
Atomic's dist already uses explicit `.js` (its source does);
tasty's SOURCE is extensionless, so a dist rebuild alone
reproduces the wall. Neo-side-only escapes evaluated and
rejected: tsconfig `paths` can't fix the inner chain;
vendoring the `d.ts` tree + paths is shared-infra scope grab
(tsconfig.json is not in any crew's scope); shadow-declaring
the tasty class surface is rot-prone mimicry; dist patching is
gitignored-local false-green. **Fix needs a sanctioned call:**
(R1) RS source migration of tasty `js/` to explicit `.js`
extensions + dist rebuild (mechanical, atomic proves it),
or (R2) a captain-assigned shared crew for the vendored-`d.ts`
alternative. Until then, no crew importing tasty types can be
gate-green, and `agentneo run`'s package typecheck (Crew D's
gate) stays red.

Pending integration points: (P1) Crew C2 entry composes
`Reference = createReferenceComponent(
createDefaultReferenceRuntime(), mirrorViews)` and re-exports
the shipped surface (`Reference`, factory, runtimes,
provider, hooks, format, types) — singleton contract kept at
the entry, `?name=` pages unaffected. (P2) Crew C1's mirror
tool must keep `@ts-nocheck` + the `../browser/component-api`
rewrite (S2 path/surface frozen on my side). (P3) Crew D
`NEO-REF` cases + `agentneo run` package typecheck wait on the
B4 wall. (P4) Objective 2 migrates mcp onto S6 (`api.ts`
surface verified sufficient).

## CREW B DONE

Files changed (working tree, uncommitted): 6× `browser/`
(index, component-api, types, Runtime, ReferenceRuntimeContext,
Reference reshaped); 7× `browser-model/` (6 modules + test
rewritten); `tasty/api.ts`; `api.ts`; new
`browser-model/__fixtures__/union-labels/{index,types}.ts`;
new `docs/reference-browser.md`; deleted 3 stray mds. Proofs:
unionTypeLabel 4/4 green; gate residual 76 errors, 100%
tasty-`d.ts`-chain rooted, zero in Crew B logic; shim-burial
immune (grep-verified). Blocked-on-captain: B4 tasty-types
wall (R1/R2 decision) — the objective's type-green critical
path. Pending: P1 entry composition, P2 mirror-tool S2
rewrite, P3 NEO-REF cases, P4 mcp migration.

## Wave 1 acceptance + Wave 2 dispatch (captain, 2026-09-22)

Wave 1 ACCEPTED, both crews DONE and disjoint (C1 verified by
census; B's late doc addition disjoint). Captain checks: tip
unchanged (`8d91542f4`, no commits), index empty, new files
exist (mirror tool, B fixtures, `docs/reference-browser.md`).
Mirror regen diff is the 1-line-per-file provenance delta
only. C1→B handoff (REF-05 states' new home) closed by B's
injected-`ReferenceViews` design (B1/B2) — C2 composes.

B4 DECISION: **R2 sanctioned (neo-side shared crew).** R1
reopens `packages/reference-rs`, which voyage ground law
closed ("no diets, no refactors") — that needs HQ sanction
and HQ is asleep. R2 keeps RS untouched. If R2 proves
infeasible, Crew S files NO-GO with evidence and R1 goes to
HQ at wake. C1.6 gate flag accepted in the same crew:
generated-mirror-dir exclusion for bare `q`, nothing else.

Wave 2 sends Crew A (bridge per §6: neo-seam retarget,
non-blocking tasty phase, scan roots, copy-browser-virtual
verify-then-bury with proof, S5 decl-roots proof, run.test.ts
port) plus Crew S (shared infra: verify B4, minimal neo-side
fix, mirror gate exclusion) in parallel on disjoint scopes.
Crew A proceeds under the B4 wall with runtime proofs and
reports gate residual split wall-vs-own. Crews C2 and D held
for Waves 3 and 4.

## Tick (captain, 2026-09-22)

Roster: cartography/B/C1 result_ready (closed); Crew A + Crew S
running, freshly dispatched, no log writes yet — expected at
this age, not deadlock. Tree: Wave 1 payload intact (62 files
vs 61 + captain's LOG.md edit), tip `8d91542f4`, index empty,
no Wave 2 work products yet. No intervention — moving crews
are never pinged. No arcs to land; C2/D still held on A+S.

## Crew A — bridge (2026-09-22) — WORKING

Scope (strict): `src/reference/bridge/**` + `run.test.ts` port.
No runtime, no model, no mirror, no entry, no publish, no
tsconfig/gate. Governing skill `agent-neo` loaded first.

### A0. Recon (read-only) + design

Bridge is byte-identical to core (Step-0 verbatim, Wave 1 never
touched it). Census retarget (§1 → neo seams):

| core seam (bridge use) | neo answer |
| --- | --- |
| `../../lib/thread-pool` (workers, KEEP_ALIVE) | NOTHING — no workers; `worker.ts` bury (bus wiring + KEEP_ALIVE, dead without a bus) |
| `../../lib/event-bus` (emit, on) | NOTHING — no bus; `run.ts` returns `ReferenceBuildResult` (`complete`/`failed`) instead of emitting |
| `../../lib/log` (log.debug/error, emitLog) | `console.*` with `[neo] [ref]` prefix (neo convention is bare `console.warn('[neo] ...')`; no log module exists) |
| `../../lib/profiler` (startWorkerMemoryReporter) | NOTHING — dies with worker.ts |
| `../../lib/paths` (getOutDirPath, getVirtualDirPath, resolveCorePackageDir) | `getOutDirPath` only (`../../lib/paths/index.ts`); virtual + core-dir resolvers have no neo counterpart by design |
| `../../virtual/fs/copy` (copyToVirtual) | NOTHING — dies with copy-browser-virtual (below) |
| `../../sync/types` (SyncPayload) | payload shrinks to `{ sourceDir, config }` (what the phase actually reads); no SyncPayload in neo (sync takes `cwd`) |
| `../../config` (ReferenceUIConfig) | `../../config/types.ts` (same `include` + `name` fields the bridge reads) |
| `../constants` + `../lib/*` mocks (run.test.ts) | re-mocked to `./bridge/*` + return-value assertions (REF-07 neo reading: "failed emission" = returned failed result) |

Design (serial phase, all inside bridge/):
- `init.ts` becomes the S5 scheduler: `initReference(payload)`
  returns `void` (nothing to await — the perf law by signature),
  schedules one `onRunBuild` on `setImmediate` (next loop
  iteration: deprioritized past sync's in-flight work, no bus, no
  barrier). Once-per-process per sourceDir: skip when the tasty
  session already holds the build (`get`) or one is pending;
  failures clear pending so a later sync retries. Refresh-after-
  rename stays available via exported `rebuildReferenceTastyBuild`
  (C2 wires the trigger; not this wave).
- `run.ts`: same flow, returns `ReferenceBuildResult` (new
  `events.ts` payload types); `source: 'virtual'` → `'project'`
  (scan root is the project now); `virtualDir` dropped from state
  and log details.
- `tasty-build.ts`: scan rootDir = project (`sourceDir` — no
  virtual mirror exists to scan); component includes pass through
  project-relative as authored; decl roots retarget to the neo
  closure `styled/types/index.d.ts` + `styled/types/style-props.d.ts`
  (see A4: `SystemProperties = StyleProps` alias needs `./index.js`
  in-set; tasty resolves runtime-entry → `.d.ts` first,
  `relative.rs:49`). Core's other two roots
  (`react/types/*`) have no neo counterpart (`react/react.d.mts` is
  `.mts`, unscannable by the `.ts`-only walker, `file_discovery.rs`);
  nothing in the projection needs them (S5 proof below).
- `worker-types.ts` → `types.ts`, `ReferenceWorkerPayload` →
  `ReferenceTastyPayload` (no workers in neo; name the payload for
  what it feeds). `worker.ts` bury with proof (below).
- `events.ts`: bus map → serial result payloads
  (`ReferenceBuildComplete`/`ReferenceBuildFailed` + status union).
  The copy trio + `reference:ready` die with their owners.
- Logging: `logReferenceBuilt` → console.info, warning → warn,
  completion details → console.debug (one line per process; the
  built line is the loud one), failure → console.error with the
  error object passthrough. All `[neo] [ref]`-prefixed.
- Sync wiring is NOT this wave (sync/ outside scope): C2/D call
  `initReference({ sourceDir, config })` at sync end; order
  "sync completes, manifest lands after" falls out of
  end-of-sync scheduling + tasty build duration ≫ sync tail.
  Handoff P5 filed below.

### A1. Implementation (all in scope, index untouched)

Bridge is now 9 files: `types.ts` (new, replaces
`worker-types.ts`), `events.ts` (bus map → result payloads),
`logging.ts` (console, `[neo] [ref]`), `paths.ts`
(`getOutDirPath` retarget), `build-report.ts` (header; logic
identical), `tasty-build.ts` (project-root scan, neo decl
closure, node_modules prune — see A3/A4), `run.ts` (returns
`ReferenceBuildResult`), `init.ts` (S5 scheduler), `index.ts
(barrel). Buried by working-tree `rm`: `worker.ts` (bus
wiring + KEEP_ALIVE + profiler — dead without a bus),
`copy-browser-virtual.ts` (see A2), `worker-types.ts`
(superseded by `types.ts`). Zero stale references to any
buried module repo-wide in neo (grep-verified); zero
neo-external bridge importers, so the reshape is contained.

### A2. copy-browser-virtual VERIFY-THEN-BURY — verdict: BURY

Filed proof, all three map conditions confirmed:
1. `browser/` has ZERO styled/css imports (grep over
   `reference/browser/**` for `styled|@reference-ui/css`:
   no hits) — the "so Panda can scan styled primitives"
   rationale is stale.
2. Zero code consumers of `virtual/_reference-component`:
   repo-wide grep hits only the copier itself plus one
   COMMENT in core `entry/types.ts:5` ("Panda still scans
   mirrored sources" — rationale restatement, not a read).
3. Only load-bearing role is the completion barrier
   (`sync/events.ts`: `virtual:copy:complete` →
   `run:reference:component:copy` → `reference:component:
   copied` → `virtual:complete`, the gate for config gen,
   Panda, and reference builds) — a barrier that does not
   exist in neo serial sync. Neo bonus: the file imports
   `../../virtual/fs/copy`, which has no neo counterpart
   by design — retargeting it would mean building a
   virtual fs, explicitly forbidden. Buried (`rm`,
   plus its index export and its three bus events);
   `virtualDir` dropped from build state, log details,
   and the run suite.

### A3. Scan roots + walk-hazard kill (task 3)

`buildReferenceTastyScanOptions` (new, exported, unit-pinned):
rootDir = project, config includes pass through as authored,
decl closure appended when present, `!node_modules/**`
always appended (deduped). The prune is load-bearing, found
by probe, not review: globwalk 0.9.1 traverses ALL of
rootDir (no literal-prefix pruning) with `follow_links`,
and ONE dangling symlink under node_modules fails the
whole scan — reproduced (`failed to walk scan root ... /
node_modules/@reference-ui/broken`), and `.gitignore` does
NOT save it (refuted in a real `git init` fixture with
`node_modules` ignored). With the negation the same
fixture builds clean. Semantically neutral: node_modules
matches are dropped from the indexed set by
`is_external_file_id` regardless, and re-export discovery
resolves linked packages via node resolution, not the
walker. Valid links.ts-style junctions were already
harmless (no cycle; matches filtered). No RS change needed.

### A4. S5 decl-roots proof — RESOLVES, nothing to wire

Temp probe (deleted after; real `rebuildReferenceTastyBuild`
over a hermetic /tmp project with verbatim playground
decls + one component source, plus the real playground
tree): rebuild 9–12ms; scoped `@reference-ui/styled` and
`@reference-ui/react` lookups MISS (mechanism verified in
source: every include-matched file is `library: 'user'`,
`tasty/.../crawler.rs` + `paths/package.rs` — node_modules
paths are the only scoped ones); bare
`loadSymbolByName('SystemProperties')` HITS with 99 display
members incl. `accentColor` + `container`; the REAL Crew B
projector resolves `P` → the same 99 members, non-P →
undefined; local `WidgetProps` indexes alongside. The
2-root neo closure (`styled/types/index.d.ts` +
`style-props.d.ts`) suffices because tasty maps `./index.js`
→ `.d.ts` first (`relative.rs:49`) — confirmed end to end.
Core's `react/types/*` roots have no neo counterpart
(`react.d.mts` is unscannable by the `.ts`-only walker)
and nothing in the projection needs them. No missing
surface — no wiring, no C2 publish dependency for REF-09.

### A5. Proofs (scoped) + gate residual

- `pnpm vitest run src/reference/run.test.ts
  src/reference/bridge/init.test.ts
  src/reference/bridge/tasty-build.test.ts` → **11/11
  pass** (REF-07 port: structured complete / failed
  result / nameless skip; S5 scheduler: non-blocking,
  once-pending, cached-skip, passthrough, fail-retry;
  scan options: closure, absent-outDir, exclusion dedupe).
- Temp S5 + hazard probe → 4/4, filed above, then deleted
  (probe + playground scratch both removed).
- `pnpm agentneo q` over all 12 Crew A files: **0 errors**,
  1 non-blocking warn (`run.test.ts:88` describe-block
  length — cohesion, left per Crew B precedent).
- `npx tsc --noEmit` package-wide: exit 0, zero errors.
  Residual split: **wall 0 / own 0** — Crew S's parallel
  R2 (vendored tasty d.ts + tsconfig paths, in-tree
  uncommitted) cleared B4 mid-wave; my files import the
  same tasty seams and contribute zero errors.
- Perf law: vacuous this wave — no sync-path file touched
  (bridge is unwired until C2/D call `initReference`),
  so sync latency is byte-identical; no bench run ordered
  or needed. The non-blocking property that keeps it
  vacuous at wiring is unit-pinned (init suite).
- Tree: tip `8d91542f4`, staged set EMPTY, no commits.

### A6. Handoffs

- P5 (Crew C2/D): wire `initReference({ sourceDir, config })`
  at sync END (order "sync completes, manifest lands
  after" falls out of end-of-sync scheduling + tasty
  duration ≫ sync tail). Observe readiness via
  `getReferenceTastyBuild(sourceDir)` or the manifest
  path (`getReferenceManifestPath`); the scheduler
  returns void by design. Refresh-after-rename (REF-04)
  needs a C2 trigger calling exported
  `rebuildReferenceTastyBuild` — the once-guard consults
  the session cache, so a rebuild-then-reschedule works.
- P6 (Crew D): REF-09 case asserts the A4 numbers (99
  members incl. accentColor/container via bare-name
  fallback; scoped MISS documented, not a fault).
  Completion line rides `console.debug` — if bench
  parsers are stdout-strict, gate or drop at wiring.
- Note for captain: the `!node_modules/**` prune (A3)
  also protects any future project-root tasty scan;
  worth a glance at landing since it hardens a walker
  footgun core never tripped (core scanned outDir only).

## CREW A DONE

Files changed (working tree, uncommitted): 8× bridge
rewrites (events, index, init, logging, paths, run,
tasty-build, build-report header), 1× new `bridge/types.ts`,
2× new suites (`init.test.ts`, `tasty-build.test.ts`),
1× `run.test.ts` port, 3× burials (`worker.ts`,
`copy-browser-virtual.ts`, `worker-types.ts` — `rm`, index
clean). Proofs: 11/11 targeted vitest green; S5 runtime
probe 4/4 (projection resolves via 2-root neo closure,
99 members, 9–12ms; hazard found + killed bridge-side);
bury verdict BURY with 3-point filed proof; gate 0 errors
(+1 accepted non-blocking warn); tsc package-green,
residual wall 0 / own 0 (Crew S R2 landed in parallel).
Perf law vacuous (sync untouched). Pending: P5 sync
wiring, P6 REF-09 case (Crew C2/D).

## Crew S — shared infra (2026-09-22) — DONE

Scope (strict): `packages/reference-neo/tsconfig.json`, NEW
vendored/shim d.ts files + docs, gate config for ONE exclusion.
No `src/reference/**` edits, no lib/core edits, no
`packages/reference-rs` edits (read-only inspection only:
dist bytes, package.json version/scripts — never modified).
Governing skill `agent-neo` loaded first.

### S1. B4 repro — WALL CONFIRMED, minimal A/B

Scratch file (package root, deleted after; resolved
`@reference-ui/rust` via the workspace link), tsc 7.0.2:

- A (NodeNext, neo regime): `error TS2614: Module
  '"@reference-ui/rust/tasty"' has no exported member
  'TastyApi'` — the exact B4 wall, one import, one error.
- B (Bundler, core regime): exit 0 — core-green-via-bundler
  confirmed on the identical file.
- Positive control: `NAMER_RULES_VERSION` from
  `@reference-ui/rust/namer` (dist d.ts with explicit `.js`
  specifiers) resolves clean under NodeNext — the mechanical
  fix direction is viable in principle.
- Negative control (the "smaller fix" clause): tsconfig
  `paths` mapping `@reference-ui/rust/tasty` straight at the
  deep `dist/modules/tasty/js/index.d.ts` goes green — but a
  strict probe (`const probe: TastyApi = 42`) ALSO passes,
  while the same probe under bundler correctly fires TS2322
  twice. Verdict: paths-alone is a FALSE GREEN that degrades
  the whole tasty surface to `any` (skipLibCheck swallows the
  inner failure; named re-exports from the unresolvable
  `./api-types` become error-any). B's rejection stands, now
  with firsthand proof of a failure mode worse than red.

Chain census: the 3 tasty entries
(`tasty`, `tasty/build`, `tasty/browser`) reach a 38-file
d.ts closure, fully self-contained inside `dist/` (zero
external imports; the only directory import is
`./generated` → `generated/index.d.ts`; 2 files use
`import('...')` type positions). Only `src/reference/**`
imports tasty in neo; the rest of the package imports only
`rust/contracts` + `rust/namer` (both green today). No
bundler reads neo tsconfig paths for a tasty entry today
(microbundle callers pass explicit tsconfigRaw or bundle
non-tasty entries; vite/vitest carry no tsconfig-paths
plugin) — the paths addition is type-only with no live
runtime consumer. Handoff note for C2 below.

### S2. R2 fix — vendored tasty d.ts + 3 paths (landed)

`packages/reference-neo/tools/vendor-rust-tasty-dts.mjs` (new,
checked in) + `src/vendor/rust-tasty/` (new, committed,
38 files). The tool BFS-copies the reachable dist closure,
rewrites every relative specifier mechanically (sibling file
→ `<spec>.js`, directory → `<spec>/index.js`, externals pass
through), prepends a provenance header (2–6 sentence gate
header + `@generated` + RS version pin + regen command),
and fails loud on any unresolvable relative spec (future RS
shape change stops the tool, never silently degrades).
`--check` verifies the committed tree byte-fresh against a
fresh build. No hand mimicry anywhere: 38 files, identical
line counts, 86 differing lines, ALL on from/import
specifier lines, zero elsewhere (proven by forward-diff).
`tsconfig.json`: exactly 3 added paths entries (tasty,
tasty/build, tasty/browser → vendored tops), nothing else.
Docs: `tools/README.md` gains a "Tasty declaration vendor"
section (regen + `--check` commands, freshness contract).

Why committed output, not gitignored: the vendor feeds the
package typecheck (`q` + `agentneo run` refuse on red), so a
fresh checkout must typecheck with no extra step; rot is
answered by mechanical copy + version pin + `--check`, not
by hiding the output.

Proofs (B's files untouched throughout):
- Wired-tsconfig repro: valid use green (TS2614 gone), strict
  probe fires TS2322 ×2 — REAL TastyApi, no any-degradation.
- Full `tsc -p .`: 38 errors, TS2614 count 0, 100% inside
  Crew A scope (bridge/** + run.test.ts, their wave-2 work).
- `q` over all 17 Crew B files: 76 → **0 errors** (1
  pre-existing non-blocking typeLabel warn, B-documented).
- `q` over `src/vendor/rust-tasty`: 0 errors, 0 warnings,
  38 files. `q` over the vendor tool itself: 0 errors
  (2 loud non-blocking warns: cognitive 17 vs fail 20,
  params 5 on a replace callback — documented, not silenced).
- `unionTypeLabel.test.ts`: 4/4 green (unchanged).
- No behavior change by construction: type-only paths edit +
  additive files; runtime resolution paths untouched.

### S3. C1.6 gate flag — mirror exclusion (landed, ONE change)

`tools/quality/run.ts` (+4 lines): a `MIRROR_DIR` const
(absolute `src/reference/browser-component`) + a two-line
early return at the top of `walk()`, skipping the dir itself
and everything under it however reached (bare `q` recursion
or explicit paths). Single collection point, so all tiers
(header/biome/metrics/tsc-filter) honor it; no other gate
loosening, no biome config touch, no prose-rule change.

Proofs:
- Bare `q` before: 73 errors / 17 warns / 209 files, with 23
  mirror error lines (22 neo/header + 1 biome noExplicitAny
  on mirrored MonoText — lib's own `any`, unfixable
  mirror-side by design) + 3 mirror noUnusedImports warns.
- Bare `q` after: 50 errors / 15 warns / 187 files, ZERO
  mirror mentions. Delta is exactly the 23 mirror errors +
  3 mirror warns out, 1 walk-complexity warn in (walk 8→10,
  warn-only; any exclusion branch trips it — verified the
  readable two-condition form against the single-branch
  alternative, both warn, kept the readable one).
- Full residual documented: 50 errors = 38 neo/tsc + 12
  neo/header, ALL in Crew A scope (11 bridge files +
  run.test.ts). Zero tasty-chain, zero mirror, zero elsewhere.
- The run.ts file-lines warn (487 vs fail 500) pre-dates this
  crew (483 at HEAD); 13 lines of headroom left for the file.

### S4. Handoffs + residuals

- P5 → Crew C2: (a) regen contract — after any RS rebuild,
  `node tools/vendor-rust-tasty-dts.mjs --check`, regen on
  drift (committed output pins `@reference-ui/rust@0.0.42`
  tonight); (b) the S3 bundle leg must use explicit aliases
  or tsconfigRaw (never tsconfig auto-discovery) for tasty
  value imports, since the tasty paths entries point at
  `.d.ts` — same constraint the existing react/system d.ts
  paths already impose. (c) R1 (RS-source `.js` migration)
  stays the principled long-term fix; R2 retires whenever HQ
  sanctions it — delete `src/vendor/rust-tasty/`, the tool,
  and the 3 paths lines.
- Residuals owned elsewhere: 50 bare-q errors (all Crew A
  scope, their wave); 15 bare-q warns (14 pre-existing +
  1 walk warn from S3). Nothing of Crew S is red.
- Tree: index untouched throughout (no `git add`/`git rm`);
  scratch repro files removed; no RS bytes modified.

## CREW S DONE

Files changed: `packages/reference-neo/tsconfig.json` (+3
paths); NEW `tools/vendor-rust-tasty-dts.mjs`;
NEW `src/vendor/rust-tasty/` (38 committed d.ts);
`tools/README.md` (+vendor section);
`tools/quality/run.ts` (+4, mirror exclusion). Repro: B4
TS2614 confirmed minimal (NodeNext fails, bundler green);
paths-alone rejected with false-green any-degradation
proof. Fix: mechanical vendor (87 specifiers, byte-identical
modulo specifiers) driving the tasty-chain residual to zero
with full type fidelity (TS2322 probe fires). Gate: mirror
exclusion lands, bare-q mirror flags 23→0, residual fully
documented (50 errors, all Crew A scope). Suites:
unionTypeLabel 4/4 green; no behavior change.

## Crew S acceptance (captain, 2026-09-22)

ACCEPTED. R2 works: minimal A/B repro with positive + negative
controls, paths-alone false-green proven (any-degradation, worse
than red), mechanical vendor driving B 76→0 untouched with full
type fidelity (TS2322 probe fires), gate exclusion exactly one
change with mirror 23→0. Captain shape checks: 38 vendor files,
0 RS diffs, vendor docs section present, tsconfig +4/−1, run.ts
+4. Scope held, index empty, tip unchanged, no RS bytes. P5
handoff (regen contract, bundle-leg alias constraint, R1 as
long-term fix) recorded for C2. Watch item carried: run.ts at
487/500 file-lines — later crews must not fatten it. Crew A
still working (A0 filed, bridge edits in flight) — undisturbed.
C2/D remain held on A. Firsthand suite re-runs wait for landing.

## Wave 2 acceptance + Wave 3 dispatch (captain, 2026-09-22)

Wave 2 ACCEPTED, both crews DONE. Crew A: bridge ported (8
rewrites + `types.ts` + 2 new suites + run.test.ts port, 3
burials), 11/11 vitest, gate 0 errors, tsc package-green
(wall 0 / own 0 on S's R2), copy-browser-virtual BURIED with
3-point proof, S5 RESOLVES (99 members, 9–12ms, no wiring),
walk-hazard found + killed bridge-side (`!node_modules`
prune). Captain checks: A's tree footprint matches its report
exactly, tip unchanged, index empty, RS/lib/core/matrix
untouched. Landing watch carried: A3 prune hardens a walker
footgun core never tripped (glance at landing).

Wave 3 sends Crew C2 (entry/publish): S3 entry composition
(P1 singleton), S4 types leg (bundle per V1 a/b/c,
placeholder rewrite, manifest/runtime packaging,
links.ts+types, d.mts), P5 sync-end wiring (`initReference`
call + REF-04 rebuild trigger), regen contract honored.
Crew D held until C2 lands (cases need the wired leg).

## Crew C2 — entry + publish + sync wiring (2026-09-22) — WORKING

Scope (strict): new S3 entry module, S4 types publish leg
(bundle, placeholder rewrite, manifest/runtime packaging,
d.mts), links.ts +types extension, P5 sync-end wiring
(`initReference` call at sync END + REF-04 rebuild trigger).
No bridge/runtime/model/mirror/tsconfig/gate/vendor changes
(never hand-edit the mirror); no lib edits (REF-10 is Crew
D's); no reference-rs; nothing new builds on core. Governing
skill `agent-neo` loaded first.

### C2.0 Recon (read-only) + design

V1 mechanism settled firsthand (C1.5 outcome confirmed,
mechanism refined): re-ran C1's core bundle repro from two
cwds (matrix/reference + /tmp) — both give 55 inputs, core-src
primitives, 281171 bytes (C1's exact count). Resolution is
entry-relative, not cwd-relative. Probe of neo's own regime
(bundle `browser/Runtime.ts`, which imports the tasty/browser
VALUE): auto-discovery AND explicit tsconfigRaw both resolve
tasty to RS dist (`dist/tasty.mjs`, `dist/browser.mjs`), zero
vendor hits either way. Refined rule: esbuild consults
tsconfig `paths` only when node resolution FAILS (core's
react edge is node-unresolvable → paths redirect; neo's
tasty edges node-resolve via the workspace link → dist
wins, the vendored d.ts is never consulted). Consequence
for S3/S4: the S-P5 hijack cannot fire for tasty (node wins)
but is LIVE for `@reference-ui/react` — proven
ERR_MODULE_NOT_FOUND from neo root and neo src — where the
paths fallback would grab `react-surface.d.ts` (empty at
runtime). The explicit alias kills it deterministically;
explicit tsconfigRaw rides along as belt-and-braces so no
future node_modules gap can silently reroute any edge to a
.d.ts. Scratch probes at /tmp/c2-tsconfig-probe.mjs +
/tmp/c2-v1-mechanism.mjs (re-runnable, outside deliverable).

Design (all inside scope):
- S3 entry `src/entry/types.tsx`: three state views (Loading
  /Error/Empty, behavior-identical JSX to the buried mirror
  `ReferenceStatus.tsx`, composed from living-mirror
  `ReferenceNotice` + `MonoText`), `referenceViews` wiring
  living-mirror Frame + DocumentView, `Reference =
  createReferenceComponent(createDefaultReferenceRuntime(),
  referenceViews)` (B P1), re-export of the shipped surface
  (core `entry/types.ts` parity: Reference, factory,
  runtimes, provider, hooks, format, types; plus the
  `ReferenceViews` type the B1 factory signature requires).
  Single import direction: mirror→browser, entry→both.
- S4 leg `src/sync/reference-types.ts` (`publishReference-
  TypesBundle`, called after the decl leg, before links):
  bundle the entry with microbundle; alias
  `@reference-ui/react` → the just-generated
  `outDir/react/react.mjs` (V1a — the neo primitives entry
  for this sync IS the per-system generated entry: all 7
  mirror-needed values `Code, Div, H2, P, Small, Span,
  recipe` verified present via TAGS + runtime header);
  externals = core's list + `react-dom/client` (the generated
  entry imports it; without the line esbuild would bundle a
  second react-dom); explicit tsconfigRaw `{jsx:react-jsx}`
  (S-P5, kills discovery); then placeholder →
  `./tasty/runtime.js` rewrite with core's triple-guard
  semantics (REF-08); then write `types/` package.json
  (core TYPES_PACKAGE keys: main/types/exports `.` +
  `./manifest` + `./runtime`; version = neo
  GENERATED_VERSION), `types.mjs`, `types.d.mts` (copied
  from the template). Tasty dir itself is session-owned —
  the leg never touches it. Styled edges: neo factory/css
  carry zero bare `@reference-ui/*` value imports (grep),
  so the styled externals are precautionary (same as core's
  types entry) — kept per V1b.
- d.mts `src/entry/types.d.mts`: single-file hand merger of
  the entry surface (core ships a tsgo-emitted tree; neo
  has no packager-ts, and tsc-at-sync would break the perf
  law — static template copied by the leg). Tasty handle
  types (`TastySymbol` etc. in `ReferenceRuntimeData`) ride
  `import type from '@reference-ui/rust/tasty'`, exactly
  core's shipped posture (Sep-16 `Runtime.d.ts` line 1;
  skipLibCheck swallows for outsiders, resolves in-monorepo).
  No RS kind inlining needed. Parity: text-census test
  (entry exports ⊆ decl exports, both directions) + gate
  tsc validates the decl standalone + D's REF cases prove
  runtime.
- links.ts: LINKED_PACKAGES + `types` (V1c).
- P5 wiring in `sync/index.ts` END (after links +
  publishEnd mark, before return): `initReference(
  { sourceDir: cwd, config })` — returns void, NO await
  (perf law vacuous). REF-04 trigger: `sync()` rm-wipes
  outDir every run, so every in-process re-sync (watch,
  tests, playground) deletes `types/tasty/` while the
  once-guard goes warm — without a trigger the manifest
  never returns until restart. Trigger rule: session WARM
  (`getReferenceTastyBuild` hits) AND manifest missing on
  disk → background `rebuildReferenceTastyBuild` (promise
  with catch → console.error; never awaited). Cold+pending
  is excluded by the warm requirement, so bench first-sync
  and concurrent schedules can't double-build; steady
  state costs one Map.get + one stat. This is the
  rebuild-then-reschedule in non-blocking form (rebuild
  refreshes session + disk; initReference already no-oped
  correctly).
- One-shot CLI note (flag, not fix): `neo sync` exits
  right after sync(), so the setImmediate tasty build may
  never fire — one-shot CLI stays tasty-dark; resident
  processes (watch, vite server, cases, playground) land
  after. A's S5 design as accepted; changing it is bin/
  scope (not mine). Carried to the D handoff: REF cases
  must await readiness explicitly.
- A's P6 carried: completion line rides console.debug —
  if bench parsers are stdout-strict, D gates or drops at
  wiring. My wiring adds no console.debug (initReference
  silent; refresh failure → console.error only on failure).

### C2.1 Implementation (all in scope, index untouched)

New files:
- `src/entry/types.tsx` (S3 entry): three state views
  (Loading/Error/Empty, JSX identical to the buried mirror
  `ReferenceStatus.tsx`, composed from living-mirror
  Notice + MonoText), `referenceViews` (living-mirror Frame
  + DocumentView + the three states), `Reference =
  createReferenceComponent(createDefaultReferenceRuntime(),
  referenceViews)` (B P1), shipped-surface re-exports (core
  `entry/types.ts` parity + `ReferenceViews` for the B1
  factory signature). Explicit `.tsx` mirror specifiers
  (NodeNext). Gate 0/0 — tsc confirms the views typing.
- `src/entry/types.d.mts` (decl template): single-file
  merger of the entry surface (16 browser/types exports
  verbatim + Runtime trio + values + views). Tasty handles
  ride `import type from '@reference-ui/rust/tasty'`
  (core's shipped posture, Sep-16 Runtime.d.ts:1). Gate
  0/0.
- `src/sync/reference-types.ts` (S4 leg):
  `publishReferenceTypesBundle` (bundle entry with alias
  react→outDir/react/react.mjs + core externals +
  `react-dom/client` + tsconfigRaw jsx; triple-guard
  placeholder rewrite, exported for tests; write types.mjs
  + manifest + bannered decl). Never touches tasty/.
  Gate 0/0.
- `src/sync/reference-types.test.ts` (12 tests, below).
  Gate 0/0.
- `src/sync/clean.ts`: `cleanDir` (recursive rm with
  bounded ENOTEMPTY/EBUSY/EPERM backoff for the wipe-vs-bg
  race, below). Gate 0/0.

Edits:
- `src/sync/publish/links.ts`: LINKED_PACKAGES + `types`
  (V1c). One line.
- `src/sync/index.ts`: leg call (after decl leg, before
  links, with order comment) + `scheduleReferenceTastyPhase`
  at END (after links + publishEnd, before return:
  `initReference({sourceDir: cwd, config})`, void, never
  awaited; warm+manifest-missing bg refresh, never
  awaited) + both wipes → `cleanDir`. `sync()` extracted
  the end step to stay under function-lines fail (116,
  warn band pre-existing: 110 at HEAD).
- `src/sync/sync.test.ts` + `src/fragments/base/
  scan-crossings.test.ts`: teardown rms → `cleanDir`
  (assertions untouched).
- `tools/README.md`: vendor section updated (the "no
  bundling leg consumes a tasty entry" line went stale —
  the S4 leg bundles tasty values via node resolution;
  tsconfigRaw rationale) + decl-template regen contract
  (type-imports, no regen step, tsc fails loud on rename).

### C2.2 The wipe-vs-bg race (found by the suite, fixed)

First full-sync run: 14/18 sync.test.ts failures,
`ENOTEMPTY ... /.reference-ui/types`. Root cause: sync
rm-wipes outDir while the previous sync's background tasty
build lands `types/tasty/` — the recursive remove's
readdir→rmdir window races the writer's mkdir/atomic
rename. Inherent to serial-wipe + bg-writer (core had
barriers; neo has none by design). Fix: `cleanDir`
bounded retry at both sync wipes + both unit-test
teardowns. Bridge side needs nothing (A's design already
retries a crashed bg build next sync). Residual: an
enterprise-scale bg build (seconds) can still collide
with a wipe's microsecond window — watch self-heals via
onError + next save; bench is single-sync-per-process
(verified in `benchmark/measure/worker.ts`) so it never
re-syncs in-process. Full case-spec census: every
`await sync()` spec either fails before publish (no
schedule), asserts sync-code right after await (bg can't
interleave), or asserts open file lists — SYNC-06/07
safe by construction (proven by the case run below).

### C2.3 Proofs (scoped)

- New suite `src/sync/reference-types.test.ts`: **12/12**
  (rewrite ×3 incl. throws-when-absent; REF-01 manifest
  keys + bundle/decl presence + tasty/ untouched +
  live junction link; REF-08 literal + zero residue; V1a
  zero react imports + six displayName literals bundled
  + no `react-surface`; V1b react + jsx-runtime external;
  tasty dist bundled + no `vendor/rust-tasty`; decl
  export census entry↔decl both directions).
- Independent artifact probe (/tmp/c2-artifact.mjs):
  types.mjs **242,891 bytes** (core's 281,171 shape
  class), runtime literal 1 hit, placeholder 0, react
  import edges 7, jsx-runtime 24, react-specifier
  imports 0, root exports carry Reference + factory +
  runtimes + provider.
- Regression suites: sync 18/18, reset 6/6,
  scan-crossings 2/2, bridge run/init/tasty-build 11/11,
  unionTypeLabel 4/4 — **38 + 15, all green**.
- `pnpm agentneo run NEO-SYNC-06`: **PASS** (sync 66ms
  with the leg in-path; bg tasty landed in the world
  outDir; byte-identical consecutive syncs — determinism
  holds with the leg).
- Gate: all 10 C2 files 0 errors; bare `q` 0 errors /
  16 warns / 192 files (my delta: 0 errors, 0 new warns
  — the 2 warns on edited files are HEAD bands: sync
  110>80, sync.test 490>365, verified via `git show`);
  `tsc --noEmit` package-wide exit 0.
- Bench worker probe (P6 evidence, one worker on a
  copied SYNC-01 world): exit 0, sealed sample valid
  (syncMs 71ms), BUT stdout = JSON line + `[neo] [ref]`
  completion block — the bg build runs to completion
  before worker exit and `parseSample` whole-stdout
  `JSON.parse`s (`benchmark/measure/child.ts:50`), so
  **bench:neo parsing breaks on current HEAD+wiring**.
  Fix is bench/bridge scope (parser first-line, logging
  to stderr, or worker drain) — carried to D per brief,
  not fixed here. No full bench run (not ordered; D's
  proof owns before/after medians on the fixed parser).

### C2.4 Handoffs to Crew D

- D1 (REF cases): entry at `src/entry/types.tsx`,
  package at `outDir/types/` after any sync; tasty/
  lands after (bg) — cases must await readiness
  explicitly (`getReferenceTastyBuild` /
  manifest-path wait), since one-shot processes exit
  before the bg fires and resident ones land after.
- D2 (REF-04): rename → resync wipes → my trigger
  (warm + manifest-missing → bg rebuild, never
  awaited) restores artifacts; assert manifest refresh
  + browser update across the resync.
- D3 (REF-09): A4 numbers stand (99 members via
  bare-name fallback; scoped MISS documented).
- D4 (bench, BLOCKING the perf proof): fix the
  stdout-strict parser (or bridge log routing) FIRST —
  evidence above shows the worker currently prints
  JSON + `[neo] [ref]` block and `JSON.parse` throws.
  Then same-box enterprise seed-7 medians before/after
  (my wiring adds no await; leg cost rides publish).
- D5 (REF-10): the exact 2 lib edits
  (`reference-lib/src/index.ts:22` + tsconfig exclude
  drop) — untouched by me per scope.
- Captain flags: (a) one-shot `neo sync` stays
  tasty-dark by A's accepted S5 design (bin/ scope to
  revisit, not this wave); (b) `sync()` at 116/120
  function-lines — next editor must split, not append.

## CREW C2 DONE

Files added: `src/entry/types.tsx`, `src/entry/types.d.mts`,
`src/sync/reference-types.ts`,
`src/sync/reference-types.test.ts`, `src/sync/clean.ts`.
Files changed: `src/sync/index.ts` (leg call + P5 end
wiring + cleanDir wipes), `src/sync/publish/links.ts`
(+types), `src/sync/sync.test.ts` + `src/fragments/base/
scan-crossings.test.ts` (teardown hardening only),
`tools/README.md` (stale line + regen contract). Proofs:
12/12 new, 38 adjacent green, NEO-SYNC-06 PASS in-situ,
gate 0 errors (delta 0/0), tsc green, artifact bytes
verified independently. Known breaks handed off, not
hidden: bench parser vs bg stdout (D4, evidence filed),
one-shot CLI tasty-dark (captain flag a). Tip untouched,
index empty, no commits.

## Wave 3 acceptance + Wave 4 dispatch (captain, 2026-09-22)

Wave 3 ACCEPTED. Crew C2: S3 entry + S4 leg + links +types +
P5 wiring built and proven (12/12 new tests, 38 adjacent
green, NEO-SYNC-06 PASS in-situ with the leg in-path at
66ms, gate 0 errors, tsc green, artifact bytes independently
verified at 242,891). Found and fixed the wipe-vs-bg race
(`cleanDir` bounded retry; test edits verified teardown-only
by captain diff). V1 mechanism refined firsthand (node-wins
for tasty, alias kills the live react `.d.ts` hijack).
Captain checks: footprint matches report, tip unchanged,
index empty, RS/lib/core/matrix untouched. Landing watches
carried: (a) one-shot `neo sync` stays tasty-dark by
accepted S5 design (bin/ scope to revisit); (b) `sync()` at
116/120 function-lines — next editor splits, not appends.

SCOPE RULING for Wave 4: D4 (bench parser vs bg stdout)
blocks the perf proof, so Crew D gets a sanctioned minimal
extension — the stdout fix in exactly ONE place (parser
first-line, log routing, or worker drain; D justifies the
pick), plus its map scope (NEO-REF cases, bench medians,
REF-10's exact 2 lib edits). Nothing else. Before-medians
are the recorded pre-voyage same-box guardrail (744 pin /
787 scratch) — no tree surgery for before-measurement.

## Tick (captain, 2026-09-22)

Tick fired mid-dispatch: roster all result_ready, no live crews,
all logs IN PROGRESS, tip unchanged, index clean — nothing
deadlocked, nothing to unstick. Advanced the mission by
resuming the interrupted dispatch: Crew D (cases+perf,
Wave 4) sent out on the Wave 3 acceptance above. Reviewers
hold for D's return; landing verification + commit after.

## Crew D — cases+perf (2026-09-22) — WORKING

Scope (strict): new `NEO-REF-xx` case group; D4 stdout fix in
exactly ONE place (captain-sanctioned Wave 4 extension);
REF-10's exact 2 lib edits. No bridge/runtime/model/mirror/
entry/publish/tsconfig/gate/vendor changes; no reference-rs;
nothing new builds on core. Governing skills `agent-neo` +
`benchmark` loaded first. Never commit; never touch the index.

### D0. D4 FIRST — stdout-strict parser fix (done)

Pick: **parser-side** (`benchmark/measure/child.ts`
`parseSample` only — the single sanctioned place). The worker
contract is one JSON line (worker.ts header: "emits one JSON
line"), not a pristine stream: sync phases legitimately log
to stdout (the bg tasty completion rides `console.info`/
`console.debug` per A's accepted S5 design) after the sample
is sealed. The fix scans stdout lines and returns the first
line that parses as a `WorkerSample`, keeping both original
error shapes (no-JSON vs foreign-shape). Rejected: log
routing (changes product-visible log streams for every
consumer to satisfy one strict parser) and worker drain
(process-lifecycle change that risks truncating stdio for a
bench-only benefit). Per A P6: bench parsers are stdout-
strict, and this fix covers it — no wiring change needed.

Proofs:
- `/tmp/d4-probe.mjs` replicates C2.3 exactly (worker on a
  SYNC-01 world copy): raw stdout = JSON line + 11-line
  `[neo] [ref]` block ("Built reference in 0.02s" +
  "Reference build completed" object). `runChild` on the
  same shape now parses: `{syncMs 73ms, scorer
  bench-worker/2}`. PASS.
- End-to-end: `pnpm bench:neo --scale small --seed 7
  --runs 1` completes with a pinned report (111ms sync,
  112.5 MiB RSS) — previously `JSON.parse` threw.
- No behavior change elsewhere: 27/27 adjacent green
  (bridge run/init/tasty-build 11 + reference-types 12 +
  unionTypeLabel 4).
- Gate: `agentneo q` on the file 0 errors / 0 warnings.

### D1. NEO-REF case group (done, 2 specs red on D-OPEN-1)

7 cases, 26 specs, `tests/cases/ref/` + `shared/ref-world.ts`
(readiness wait, manifest API opener, anchored page opens,
inherited-section expansion, settle reads, innermost-exact-
text frequencies). Worlds duplicate the small oracle fixture
corpus per case (self-contained, SYNC-world pattern);
browser worlds map `@world/types` to the generated bundle
via importmap plus a local `react/jsx-runtime` shim over the
generated `createElement`. Gate over all 74 authored files:
0 errors / 0 warnings (generated `.reference-ui`/`dist`/
`node_modules` excluded — gitignored bytes the gate cannot
meaningfully judge; worlds' configs/fixtures all headed).

Results (`agentneo run NEO-REF`, this box):
- REF-01 package shape: 1/1 PASS (legs, link, live imports).
- REF-02 symbol queries: 01-symbols PASS (local, indexed-
  access, composed, type-extends, pinned — all oracle-
  identical); 02-style-projection FAIL on D-OPEN-1.
- REF-03 render contract: 17/18 PASS (all oracle tests
  except the StyleProps page); 18 FAIL on D-OPEN-1 with
  the error-state signature (`Failed to load StyleProps:
  Ambiguous symbol name`).
- REF-04 refresh: PASS (rename → resync → trigger
  restores; manifest + browser both refresh; header
  preserved across the rewrite cycle).
- REF-05 runtime shell: 2/2 PASS (stalled-chunk loading,
  error, degenerate zero-member document, provider,
  provider-required throw). Empty state verdict: defensive-
  only, unreachable (builder total) — pinned by the
  degenerate page asserting no empty text.
- REF-09 projector: PASS (bare 99 incl accentColor +
  container; scoped ×4 MISS documented; P → same 99;
  non-P → undefined).
- REF-11 deprioritization: PASS (sync-complete before
  manifest-ready; byte-identical re-sync outside tasty/).
REF-06/07/08 not duplicated as cases (unionTypeLabel,
bridge run/init/tasty-build, reference-types suites —
referenced from READMEs). REF-10 below (not a case).

Port rules learned (in READMEs): document-only readiness
anchors (the shell renders the name pre-load); expansion
before deep inherited members (decl order differs core vs
neo); innermost-whole-text frequencies for exact counts
(the tag pill holds icon + label); `accentColor` for
`WebkitAppearance` (generator inventory delta — neo emits
no `Appearance` member); REF-03 spec 18 runs last so the
blocked page aborts nothing provable.

D-OPEN-1 (BLOCKER, bridge scope — captain's call): the
tasty decl closure roots the generated
`styled/types/index.d.ts`, indexing a second top-level
`StyleProps` (manifest warning + ambiguous bare lookups).
Core never indexed its generated decls (its 4 closure
paths match nothing on disk: 36 names, 0 dupes, no
`SystemStyleObject` entry — yet `StyleProps` projects 100+
via import-following). Fix hypothesis: drop `index.d.ts`
from the closure roots, keep `style-props.d.ts` alone;
the oracle proves following resolves member types without
indexing top-level entries. Red until fixed: REF-02/02,
REF-03/18. No case-side fix exists (worlds can't steer
the closure; the browser calls bare lookup).

D-OPEN-2 (finding, reference-rs scope, CLOSED ground): the
compiler id-sorts extends (`symbols.rs`
`collect_reference_descriptors:239`, `a.id.cmp`), and ids
are root-sensitive hashes — chunk bytes prove core emits
clause order while neo emits id order. Clause-order
preservation needs an RS exception from HQ. REF-03/08 pins
membership order-insensitively; nothing else in the group
is order-sensitive (verified: contested members disjoint,
counts order-free, node assertions order-free or
self-comparative).

### D2. Perf proof (done — TASTY-CLEAN, no voyage-caused regression)

`pnpm bench:neo --scale enterprise --seed 7 --runs 5`,
same box, TWO independent invocations (replication):
- Run 1: sync [906,915,917,918,959] → median **917ms**;
  RSS med 303.4 MiB, HW med 345.3 MiB, bundle 3.2 MiB.
- Run 2: sync [909,911,917,918,926] → median **917ms**;
  RSS med 304.1 MiB, HW med 343.0 MiB, same bundle bytes.
Load byte-identical to history (3000 files, 7527 calls,
seed 7, same plan JSON). Box quiet at measure time (load
~2, no Dagger/cargo/vitest burning).

Comparison vs guardrail (raw): 917 vs 744 pin (+23%) /
787 scratch (+17%). Attribution (measured, no tree
surgery — all probes read-only or additive):
- Voyage in-path cost ≈ **15ms**: the S4 types leg timed
  standalone on the kept enterprise outDir (median 15ms
  over 5; 11ms on a small world). Tasty/schedule/links ≈
  0 by construction (void schedule, Map.get + stat) and
  by REF-11's ordering proof.
- Phased enterprise sync: scan 329 + compile 483 (both
  voyage-untouched) = 89% of the 908ms; the whole publish
  segment (all legs + links + schedule) is 69ms.
- Same-box intraday band on 09-22 spans 744–1071 across
  pinned N=5 reports — the residual is machine variance:
  pin→tip sync execution path is byte-identical (8
  commits: docs + the dead Step-0 copy only), so the
  744→917 gap cannot be code-caused beyond the 15ms leg.
- Law substance HOLDS: the enterprise bg tasty build
  takes 20.6s and lands entirely after the sealed sample
  — tasty contributes 0.0ms to syncMs (cold start pays
  once, ref syncs run on their own, exactly as ordered).
Secondary observed (reported, out of scope): RSS med 304
vs pin 382 (-20%); bundle totalBytes +7% vs pin with
identical load+code-path (deterministic across my runs —
unexplained era delta, engine/bench-harness territory,
not this objective).

VERDICT: no voyage-caused regression — perf proof PASSES
on the law's substance (tasty fully deprioritized,
background loop only, numbers prove it). Landing call
stays the captain's; D-OPEN-1 (2 red specs) is separate.

### D3. REF-10 recommission (done within exact-2 scope; green blocked on rot)

Exactly 2 lib files (verified by diff stat): `src/index.ts`
(export restored + the stale mask comment replaced by a
recommission note, one hunk) and `tsconfig.json` (the
`src/components/Reference/**` exclude dropped). No other
lib byte touched.

- Book fixtures render: PROVEN. Started Book (port was
  down; stopped it after), captured `ReferencePrototype`
  (full DocsReferenceButtonProps table) and
  `StylePropsApiReference` (full StyleProps member table);
  both show content, verified by eye. The recipe() runtime
  tolerates the missing className.
- Lib typecheck green: BLOCKED on two findings (both need
  captain sanction, both outside the exact-2 scope):
  - D-OPEN-3 (Reference scope, 3rd edit): unmasking
    surfaces `SummaryChip.tsx(5,34)` — `recipe()` misses
    the now-required `RecipeConfig.className` (required
    since 09-17, while Reference was masked; zero sibling
    recipe() users to copy). The className VALUE is a
    lib-domain call (extraction keys on it) — not guessed
    here. One-line-plus-verification fix, captain's call.
  - D-OPEN-4 (playwright-harness scope, pre-existing):
    `playwright/ct.ts` carries 2 errors (MountFn
    assignability, missing toHaveScreenshot matcher) on
    pristine HEAD content with zero Reference involvement
    — lib was already red before REF-10. Owner unknown;
    smells like Objective 5 lib-productionization.
  Before/after rigor without tree mutation: a /tmp
  tsconfig re-adding the exclude still shows all 3 (the
  barrel export keeps SummaryChip reachable); importer
  census proves nothing outside Reference itself imports
  it, and ct.ts imports neither Reference nor the barrel.

Crew D footprint (final): `tests/cases/ref/` (7 cases, 26
specs, shared helper, READMEs), `benchmark/measure/
child.ts` (D4), the 2 lib files, this log. `reports/
latest/` holds my N=5 pinned output (designed to be
overwritten every run; never a log entry). Index empty,
tip unchanged, no commits. Scratch probes live in /tmp
(d4, ref-probe, ref-extends, ref-leg ×2, ref10 configs);
the kept enterprise repo sits in /tmp alongside.

## CREW D DONE

Cases added: NEO-REF-01/02/03/04/05/09/11 (26 specs).
Results: 24 green; 2 red on D-OPEN-1 (bridge closure
duplicate-StyleProps — REF-02/02 + REF-03/18, both with
the exact ambiguous-name signature; fix hypothesis filed,
no case-side fix exists). D4 fix + proof: parser-side
sample-line scan in `benchmark/measure/child.ts` (only
place), C2 worker probe parses, small bench end-to-end
green, 27/27 adjacent suites green, gate 0/0. Bench
medians: enterprise seed-7 N=5 replicated 2× → 917ms
both (RSS ~304, HW ~344, bundle 3.2 MiB, byte-identical
load); guardrail verdict NO VOYAGE-CAUSED REGRESSION —
law substance holds (20.6s enterprise tasty fully
off-path, REF-11 ordering proves it), voyage in-path cost
≈15ms (measured leg), residual is the box's own 744–1071
intraday band. REF-10: exact 2 edits landed; Book
fixtures render (2 captures, content-verified); typecheck
green blocked on D-OPEN-3 (SummaryChip recipe rot, 3rd
edit) + D-OPEN-4 (pre-existing ct.ts, other owner).
Residuals for reviewers: D-OPEN-1 (bridge 1-root-closure
experiment), D-OPEN-2 (RS id-sorted extends, closed
ground — spec 08 pins membership), D-OPEN-3/4 (REF-10
green needs), plus the reported secondary bench deltas
(RSS -20%, bundle +7% era drift, out of scope).

## Tick (captain, 2026-09-22)

Crew D LIVE and productive (`running`, substantial fresh
writes): D4 parser-side fix done + proven (small bench green,
27/27 adjacent green, gate 0/0); NEO-REF group filed (7 cases,
26 specs, gate 0/0 over 74 files) at 24/26 green. No deadlock
— no intervention, no ping. Remaining for D: REF-10 + bench
medians + DONE report.
TRIAGE D-OPEN-1 (blocker, bridge scope): fix crew goes AFTER
D returns, not in parallel — a bridge-closure edit mid-wave
risks contaminating D's in-flight bench medians; D's medians
stay valid post-fix (sync path untouched — fix crew will
prove sync-output identical and re-run what the proof needs).
Noted D-OPEN-2 (RS id-sort; order-insensitive pins; RS
exception question for HQ at wake — not voyage-blocking).
No dispatch, nothing to commit this tick.

## Wave 4 acceptance + fix-wave dispatch (captain, 2026-09-22)

Wave 4 ACCEPTED with residuals. Crew D: 7 cases/26 specs (24
green), D4 parser fix proven, bench replicated 2× at 917ms,
REF-10 2 edits + Book renders proven. Captain checks:
footprint exact (2 lib files, child.ts, new cases dir), tip
unchanged, index empty, RS/core/matrix untouched. LANDING
NOTE: `benchmark/reports/latest/*` are TRACKED run-output
modified by D's runs — revert at landing (`checkout --`),
never commit.
RULINGS on the OPENs:
- D-OPEN-1 (bridge closure duplicate StyleProps, 2 red
  specs): fix crew F, NOW (D returned). F verifies the
  drop-`index.d.ts` hypothesis first (prove StyleProps still
  projects via import-following — don't assume), turns the 2
  reds green, runs the full NEO-REF + adjacent regression
  sweep, proves sync-output identical, then measures
  post-fix enterprise seed-7 N=5 after-medians PLUS
  scratch-clone HEAD N=5 contemporaneous before-medians
  (fresh /tmp clone, full install, zero tree/index surgery
  on the real tree) with a verdict. D's attribution (15ms
  leg + variance band) is good but indirect — the hard
  constraint deserves a contemporaneous before/after.
- D-OPEN-3 (SummaryChip recipe className, 3rd lib edit):
  SANCTIONED to lib crew L (parallel, disjoint — we
  unmasked it, we fix it). Derive the className value from
  RecipeConfig + extraction code + the 09-17 commit; never
  guess. Prove: lib tsc zero Reference errors + render
  check. L verifies via test-component.
- D-OPEN-4 (pre-existing ct.ts rot): NOT fixed in Objective
  1. L re-verifies pre-existing (read-only: importer census
  + HEAD-untouched evidence); REF-10's typecheck criterion
  becomes "zero errors attributable to recommission".
  Carried to Objective 5 (LOG-5.md) — harness rot belongs
  to lib productionization, and touching the CT harness
  tonight risks the Obj 4/5 oracle.
- D-OPEN-2 (RS id-sort): carried, HQ morning question (RS
  exception for clause order). D-OPEN-1's fix must not
  touch RS either.
- Secondary bench deltas (RSS −20%, bundle +7% era drift):
  reported out of scope, carried to HQ morning.
Reviewers hold for F+L; firsthand verification + landing
commit after.

## Crew L — lib SummaryChip fix (2026-09-22/23) — DONE

Scope (strict): `packages/reference-lib/src/components/
Reference/components/shared/SummaryChip.tsx` ONLY (one file).
Read-only everywhere else; never commit; never touch the index.
Governing skill `test-component` loaded first. Sanction: the
captain's fix-wave dispatch (D-OPEN-3 sanctioned, D-OPEN-4
carried to Objective 5, re-verify read-only).

### L0. Recon — D-OPEN-3 reproduced, census (read-only)

- `npx tsc --noEmit` in `packages/reference-lib` pre-fix:
  exactly 3 errors — `SummaryChip.tsx(5,34)` TS2741
  (missing `className`, D-OPEN-3) + `playwright/ct.ts`
  `(92,15)` TS2345 + `(108,50)` TS2339 (D-OPEN-4 pair).
- Sibling census: `recipe\(` over all of lib `src` hits ONE
  call site — `SummaryChip.tsx:5` (`const summaryChipRecipe
  = recipe({`). Zero siblings to copy; value derived, not
  guessed (L1).
- SummaryChip's sole consumer: `MemberTypeSummary.tsx:28`
  (union chips). No `__e2e__` under Reference — no CT
  snapshots exist to re-pin.

### L1. Derivation — the value `summaryChip` is forced, not chosen

Four independent surfaces converge on one string:

1. RecipeConfig type: lib typechecks `@reference-ui/react`
   against `./.reference-ui/react` (tsconfig paths), whose
   `react.d.mts` carries `interface RecipeConfig {
   className: string; ... }` — required. That decl is
   emitted from the template in neo
   `src/sync/publish/types-bundle.ts:108-115`.
2. The 09-17 commit: `08ec87170` (2026-09-17, "neo: voyage
   one complete") added `+  className: string` (required,
   since birth) to BOTH the decl template above AND the new
   runtime `src/runtime/recipe/recipe.ts:37` (`git log -S`
   confirms no earlier source). Reference was masked one
   day later by `b593ce019` (2026-09-18, "Neo switch" —
   index export commented + tsconfig exclude, "tsc 75->2
   (pre-existing harness)"), so SummaryChip never got
   migrated. Rot age: the 09-17 requirement vs the 09-18
   mask, exactly as briefed.
3. Extraction keys on it: RS
   `modules/atomic/src/extract/recipes/mod.rs:142-167` —
   an explicit `className` string literal wins, else the
   binding `<stem>Recipe` infers the stem, else a
   sync-failing `RecipeClassName` diagnostic. Binding here
   is `summaryChipRecipe` → inferred stem `summaryChip`.
   The generated bundle PROVES the inference already
   landed: `react.mjs` carries the table
   `"reference-ui__summaryChip":{variantMap:{tone:[soft,
   accent],radius:[pill,rounded]},defaultVariants:{tone:0,
   radius:1},...}` and `styles.css` carries
   `summaryChip__base`, `summaryChip_t_soft/accent`,
   `summaryChip_r_pill/rounded`.
4. Runtime lookup: generated `recipe()` (`Ii`) resolves
   `tables[system + '__' + config.className]`, miss → `""`.
   Pre-fix `className` is `undefined` → key
   `reference-ui__undefined` → miss → chip renders with
   `class=""` (unstyled; content visible — Crew D's
   "tolerates"). Only `'summaryChip'` hits the emitted
   table.

Explicit `'summaryChip'` == the already-inferred stem, so
the compiler side is byte-identical (same table key, same
CSS); the runtime flips miss→hit. Any other string would
typecheck yet keep the chip permanently unstyled — a lie,
rejected.

### L2. Fix (one line) + typecheck proof

- Edit: `SummaryChip.tsx:6` gains `className:
  'summaryChip',`. Diff stat: 1 file, 1 insertion.
  Nothing else in the tree touched by this crew.
- Post-fix `npx tsc --noEmit`: the SummaryChip error is
  GONE. Residual is exactly the D-OPEN-4 pair —
  `ct.ts(92,15)` TS2345 + `ct.ts(108,50)` TS2339, same
  lines, same codes, same messages as pre-fix. Zero
  errors attributable to Reference/recommission: REF-10's
  typecheck criterion (per the captain's ruling) is MET.

### L3. Render proof (Crew D's capture path, post-fix)

Book was down; started `pnpm dev:lib` (port 5000 → 200),
stopped it after. Crew D's pre-fix PNGs preserved to
`/tmp/CrewL-prefix-*.png` before capturing. Probe script
`/tmp/crewl-chip-probe.mjs` (outside the deliverable):
screenshot + count `[class*="summaryChip"]`, throw on zero.

- ReferencePrototype: content renders; CHIP-PROBE count
  22, classes e.g. `ref-span
  reference-ui__summaryChip__base
  reference-ui__summaryChip_t_accent
  reference-ui__summaryChip_r_rounded` — the table HIT,
  in-browser. Pre→post DIFFERS exactly by the chip
  restoration: bare text-with-outline chips become the
  authored filled pills (accent inverted, soft dark).
  Everything else on the page identical by eye.
- StylePropsApiReference: full member table renders;
  probe count 0 because the page renders ZERO SummaryChip
  instances (only MemberTypeSummary uses it) — absence,
  not a miss. Pre→post capture is BYTE-IDENTICAL (`cmp`),
  proving nothing else moved.
- No snapshot re-pins: none exist for Reference (L0);
  none created.

Note for the captain: "visuals must not move" cannot
literally hold for the chip itself — pre-fix it was
unstyled (`class=""`), post-fix it wears its authored
paint. That delta IS the fix (the table + CSS were
already emitted for it); all other pixels are proven
still.

### L4. D-OPEN-4 re-verified pre-existing (read-only, no fix)

- Importer census: `playwright/ct.ts` imports exactly
  `@playwright/test` + `./runtimes` — neither Reference
  nor the barrel. Zero Reference involvement.
- HEAD-untouched: `git show HEAD:.../ct.ts | diff - ...
  /ct.ts` → IDENTICAL bytes; `git status` clean under
  `playwright/`; last touch `ef9d4b079` (2026-09-13,
  pre-voyage). The voyage never touched the CT harness.
- Corroboration: `b593ce019` (09-18) already records
  "tsc 75->2 (pre-existing harness)" — the 2 harness
  errors pre-date Objective 1 by the commit message's own
  hand.
- VERDICT: D-OPEN-4 CARRIED to Objective 5 per the
  captain's ruling. Untouched here.

### L5. Footprint + handoff

Files changed: SummaryChip.tsx (+1 line) + this log.
Scratch: /tmp probes + preserved pre-fix PNGs (outside
the deliverable); `.reference-ui/captures/` holds the two
post-fix `*_resting.png` (gitignored Book scratch).
Index empty, tip unchanged, no commits. REF-10's 2 edits
untouched; no neo/RS/matrix/lib-barrel edits.

## CREW L DONE

Fix: `className: 'summaryChip'` (1 line), derived from
the RecipeConfig type + RS extraction (`<stem>Recipe`
inference) + the 09-17 commit that made it required —
forced by the already-emitted `reference-ui__summaryChip`
table, zero compiler delta, runtime miss→hit. Typecheck:
SummaryChip error gone; residual exactly D-OPEN-4's 2
ct.ts errors, byte-identical cause to pre-fix/HEAD —
REF-10 criterion "zero errors attributable to
recommission" MET. Render: both Crew-D fixtures re-shot
post-fix — ReferencePrototype content + 22 chips hitting
the recipe table (authored pills restored), StyleProps
byte-identical pre/post; no snapshots exist or were
re-pinned. D-OPEN-4: re-verified pre-existing (census +
HEAD-identical + 09-18 message corroboration), CARRIED to
Objective 5, untouched.

## Crew L acceptance (captain, 2026-09-22/23)

ACCEPTED. Exemplary derivation: four independent surfaces
(type, 09-17 commit, RS extraction inference, runtime table
lookup) converge on the one forced value — zero compiler
delta, runtime miss→hit. Captain confirmed the 1-line diff.
Typecheck: SummaryChip error gone, residual exactly the
D-OPEN-4 pair — REF-10's "zero errors attributable to
recommission" criterion MET. Render: 22 chips hitting the
table in-browser, StyleProps byte-identical pre/post, no
snapshots exist or were pinned. On L's note: the chip's
unstyled→authored delta IS the fix (pre-fix was broken, not
baseline) — accepted as restoration, not drift; no baseline
impact (no Reference CT snapshots exist; sole consumer is
in-Reference). D-OPEN-4 carry stands with triple evidence.
Crew F still working — undisturbed. Reviewers hold for F.

## Crew F — closure fix + perf (2026-09-23) — REFUTED, NO FIX

Scope (strict): the bridge tasty-build decl closure ONLY
(D-OPEN-1) + read-only everything else. No src changes made
(none warranted — see verdict). No lib, no reference-rs
(read-only inspection only), no index ops, never commit.
Governing skills `agent-neo` + `benchmark` loaded first.

### F0. Hypothesis under test + method

D's hypothesis: drop `styled/types/index.d.ts` from the
closure roots, keep `style-props.d.ts` alone — "the oracle
proves following resolves member types without indexing
top-level entries". Per brief step 1, verify BEFORE
applying, or STOP + refute + best alternative.

Method: 8 hermetic probe scripts (`/tmp/f-closure-probe.mjs`,
`/tmp/f-closure-v3.mjs` … `/tmp/f-closure-v9.mjs` — kept,
re-runnable, outside the deliverable), 17 build variants,
each a fresh `createTastyBuildSession` + fresh sourceDir
(no cache contamination), real `buildReferenceTastyScan-
Options`, real `rebuild`, real Crew B projector, verbatim
playground decls. Zero tree writes. Fidelity anchors: the
control reproduces D-OPEN-1's exact signature (2 entries +
`Ambiguous symbol name` + duplicate warning), and V1's
SystemProperties count (99) matches D/A4's live number
exactly.

Mechanism (established first): the dup is generated-
`StyleProps` (top-level alias in `index.d.ts`) vs fixture-
local `StyleProps` (`export type StyleProps =
SystemStyleObject & ReferenceProps` in the world fixture,
importing `SystemStyleObject` from
`@reference-ui/styled/types`).

### F1. Variant matrix — the stated hypothesis FAILS

| # | Closure / shape | Entries | Local projects? |
| --- | --- | --- | --- |
| V1 | full (both `.reference-ui` roots) | 2, ambiguous (D-OPEN-1 reproduced) | yes (extends 100, SystemProperties 99, P 99) |
| V2 | reduced (`style-props.d.ts` alone) | 1 (local `_4847…`) | NO — 2 members, no accentColor; SystemProperties 2; P 2 |
| V3/V3b/V6 | roots via `node_modules/…` (± prune) | 1 | NO — roots match nothing (dead spelling) |
| V4 | no decl roots | 1 | NO — 2 members |
| V5 | reduced + styled outside rootDir | 1 | NO |
| V9 | real (non-symlink) styled under node_modules, no roots | 1 | NO |
| V12a–d | crafted pkg {bare,subpath}×{`.d.ts`,`.d.mts`}, no roots | 1 each | ALL NO |
| V13 | core's exact scan shape (rootDir=outDir, virtual sources, absolute link) | 1 | NO |
| V15a/b | root-barrel import ± style-props root | 1 | NO |
| V17 | core-shape + core-faithful `.d.mts` barrel w/ re-export hop | 1 | NO |

Empirical law (current compiler): a generated decl file
contributes resolvable types IFF include-matched, and
matched ⇒ its top-level entries are indexed. Following
never leaves the scanned set in ANY tested configuration.
V2 (the hypothesis) buys single-entry at the price of the
projection: local `StyleProps` = `SystemStyleObject &
ReferenceProps` degrades to its 2 local members.

### F2. The oracle premise is stale — decisive evidence

- Core's 4 closure paths verified (read-only) to match
  nothing on disk — D's census stands.
- But D's "36 names, 0 dupes" is core's **Sep-16 manifest**
  (mtime verified; `manifest.js` + all of `.reference-ui`
  stamped Sep 16 20:28). Its StyleProps chunk shows the
  Sep-16 posture: intersection of a SCOPED external ref
  (`SystemStyleObject`, library `@reference-ui/system`) +
  local `ReferenceProps` — refs recorded, members resolved
  at query time.
- **V16**: current API (`createReferenceUiTastyApi`, same
  code + options as core's test helper — verified identical
  call shape in `matrix/reference/tests/unit/helpers.ts`)
  against core's OWN Sep-16 manifest → **2 members**
  (container only; no accentColor, no WebkitAppearance).
  Pure reads, zero tree writes.
- Every fresh build in every shape (incl. V13/V17 core
  replicas) records the external ref faithfully in the
  chunk but yields ~2 members: index-time recording works,
  **query-time resolution of scoped external refs is dead
  in the current compiler/API**, for every library, every
  specifier shape, every extension, both rootDir regimes.

So "the oracle proves following resolves member types" —
true of the Sep-16 tasty, FALSE of the current one. The
matrix StyleProps assertions (>100 members,
WebkitAppearance) cannot pass against current behavior:
not on the existing manifest (V16: 2 members), not on any
fresh build (V13/V17: collapse). D-OPEN-1 is not a
closure-shape problem — it is a compiler-capability
problem. RS-side, closed ground, HQ's (sibling to
D-OPEN-2's RS question).

### F3. Verdict — CREW F BLOCKED (refutation, no fix landed)

Per brief step 1 ("if the hypothesis fails, STOP the fix…
do not thrash"): NO CLOSURE-ONLY FIX EXISTS. The closure
function controls exactly {rootDir, include list};
exhausted over both degrees of freedom: any spelling that
makes `index.d.ts` resolvable indexes its top-level
`StyleProps` (dup); any spelling that avoids the dup leaves
`SystemStyleObject` unresolvable (collapse). Steps 2–5
(apply, regression, sync-identity, perf medians) are
vacuous without a fix — no bench runs burned (box left
quiet for others). Tree: zero Crew F writes (verified:
`git status` shows only prior crews' payload + Crew L's
accepted line).

### F4. Best alternative analysis (ranked, for the captain)

1. **RS fix (HQ, closed ground) — principled.** Restore
   query-time resolution of scoped external type refs (or
   index-time followed-without-indexing). Restores core's
   observed regime; unblocks the one-root closure change
   (drop `index.d.ts`), which then works exactly as D
   hypothesized. Evidence for HQ: V16 + V17 + full matrix
   (probes in /tmp, re-runnable). Suggested RS
   acceptance: V15b-shape hermetic build (style-props
   root + root-barrel import) yields single StyleProps
   with 99 members; V16 yields 100+.
2. **Decl-leg split (C2/publish scope, needs HQ product
   call).** Stop declaring top-level `StyleProps` in
   generated `styled/types/index.d.ts` (keep only the
   `SystemStyleObject`/`SystemProperties` aliases)
   after a consumption census proves nothing imports
   generated-`StyleProps` by name. Full closure then
   indexes no dup. Risk: public generated-type rename
   (census decides whether breaking).
3. **Fixture-corpus rename (D scope, oracle-deviating,
   last resort, NOT recommended).** Rename the
   world-local `StyleProps` so only the generated one
   indexes; `checkStyleProps` would pass on it
   (accentColor+container+>90 all verified present).
   Hollows the oracle's point (local-declares-StyleProps).
4. **Query-layer disambiguation — DEAD.** The spec asserts
   `findSymbolsByName === 1` (an index count); no query
   wrapper changes that without a spec change, which
   would deviate from the oracle.

Flag: the matrix oracle suite's StyleProps assertions
need re-baselining or the RS fix before Objective 1's
"parity proven by cases" criterion can go green on
REF-02/02 + REF-03/18. (Live suite status inferred from
V16, not from running matrix — scoped test-core run is
the captain's call if confirmation is wanted.)

Probes kept: `/tmp/f-closure-probe.mjs`,
`/tmp/f-closure-v3.mjs`, `/tmp/f-closure-v4.mjs`,
`/tmp/f-closure-v5.mjs`, `/tmp/f-closure-v6.mjs`,
`/tmp/f-closure-v7.mjs`, `/tmp/f-closure-v8.mjs`,
`/tmp/f-closure-v9.mjs` (hermetic /tmp builds only;
no /tmp scratch clone was needed — no fix to measure).

## CREW F BLOCKED (refutation)

D's drop-`index.d.ts` hypothesis REFUTED with oracle-grade
evidence: 17 hermetic variants prove the current tasty
resolves followed types only inside the include-matched
set, and matching the generated `index.d.ts` indexes its
top-level `StyleProps` — single-entry and projection are
mutually exclusive at the scan layer, so no closure-only
fix exists. Root cause promoted: query-time resolution
of scoped external refs is dead in the current
compiler/API (current API yields 2 members even on core's
own Sep-16 manifest — V16), so the oracle premise
describes Sep-16 behavior. No src changes (correctly —
nothing to land), no regression/perf runs (vacuous),
tree untouched. Alternatives ranked above: RS fix is the
principled path (HQ); decl-leg split is the viable
workaround (C2 scope + census + product call).

## Crew F acceptance + voyage ruling (captain, 2026-09-23)

ACCEPTED as BLOCKED — correctly. The verify-first orders
worked exactly as designed: 17 hermetic variants, V16
decisive (current API yields 2 members even on core's own
Sep-16 manifest), no thrash, no src writes. Captain verified:
tasty-build.ts untouched since Crew A's wave (mtime 00:26 vs
F's log write 01:42), tip unchanged, index empty.
D-OPEN-1 root cause PROMOTED: not a closure-shape problem —
query-time resolution of scoped external refs is dead in the
current compiler/API. The matrix oracle premise describes
Sep-16 behavior; F4.3 (fixture rename) and F4.4 are rejected
(oracle-deviating / dead). The full closure STANDS as the
landing shape (V2's reduced closure would regress green
specs — projection collapse; no closure change lands).
RULING — Objective 1 stays IN PROGRESS, no landing tonight.
Landing law requires green proofs; the 2 reds need HQ-only
calls (RS fix on closed ground, or decl-leg split as a
product call). The captain does not bend landing law on his
own word. But the night is not wasted — three parallel
READ-ONLY crews, zero tree writes, zero entanglement:
- Crew P (perf confirm): the standalone F-steps-4/5 —
  enterprise seed-7 N=5 after on the current tree + scratch
  /tmp HEAD-clone before + verdict. (Bench runs will dirty
  tracked reports/latest again — captain reverts at landing.)
- Crew Q (HQ decision packet): replicate F's kept probes
  (V1/V2/V13/V16/V17) as independent confirmation; run the
  generated-`StyleProps` consumption census (repo + fixtures
  + docs — breaking vs safe verdict); run the split
  experiment hermetically (crafted index.d.ts without
  top-level StyleProps + full closure → single entry +
  99-member projection?). Deliverable: HQ's morning packet
  (RS acceptance criteria + option framing).
- Objective 2 audit crew: read-only MAP phase starts early
  (verdicts per suite + fixtures + pipeline-purity +
  core-removal plan in LOG-2.md). Rationale: the block is
  external (HQ decision), not internal — idleness serves
  nothing, and mapping entangles nothing. STRICT: read-only
  except LOG-2.md; Neo coverage = current tree + 2 known
  reds (flag HQ-dependent verdicts); Obj 2 IMPLEMENTATION
  held for Obj 1's landing.
Carried to HQ morning: the RS-vs-decl-split call (packet
incoming), D-OPEN-2's RS question (clause order), secondary
bench deltas (RSS −20%, bundle +7% era drift). Skipped:
scoped test-core matrix confirmation of oracle-red (V16
suffices; Obj 2's audit will meet the suites itself).

## Crew P — perf confirm (2026-09-23) — WORKING

Scope (strict): MEASUREMENT ONLY. Zero src writes; zero tree
writes except the unavoidable tracked `benchmark/reports/
latest/*` bench output (LEFT dirty — captain reverts at
landing). No lib, no reference-rs, no index ops, never
commit. Governing skills `agent-neo` + `benchmark` loaded
first. Sibling crews Q + Obj2-audit read-only alongside —
box-quiet discipline at measure time (check load, wait out
sibling burns, medians decide).

### P0. Recon (read-only) + method

- HEAD `8d91542f4`; voyage payload all uncommitted (index
  empty of Crew P changes; RS worktree CLEAN — engine
  sources == HEAD by construction).
- Guardrails decoded from pinned reports: 744 = `16487a1`
  enterprise seed-7 N=5 syncMed 743.7 (RSS 381.7, bundle
  3082391, 20:35Z); intraday 09-22 band 744–1071 across
  pinned N=5/N=1 reports (1041.9, 872.3, 1062.0, 1071.4,
  762.0 — same 7527 cssCalls everywhere, seed-stable
  load). 787 = cartography's this-box scratch median.
- Latest on disk at open: D's N=5 (created 00:22Z,
  [909.2,910.5,917.3,917.7,926.4] → med 917.3, bundle
  3308678 = +7.4% vs pin — D's reported era drift).
- Scratch BEFORE method: fresh /tmp clone of HEAD,
  `git checkout 8d91542f4`, full `pnpm install` inside
  scratch, then RS `build:js` (hermetic, fast) + copy of
  ONLY the gitignored native `.node` binaries from the
  real tree into scratch `dist/native/` (read-only on the
  real tree). Justified: RS sources byte-identical both
  sides (verified clean), `dist/` is a pure build output,
  and `compileNative` hard-imports with NO fallback — the
  bench either runs the identical native engine or fails
  loudly (no silent path divergence possible). Copies hold
  the engine literally constant; avoids a cold cargo
  release burn contending with sibling crews. AFTER-side
  dist freshness verified read-only before measuring.
- One N=5 invocation each side (D already replicated the
  mid-tree 917ms 2×).

### P1. AFTER-medians — attempt 1 CONTAMINATED (sibling burn)

- AFTER-side engine for this box verified fresh: `verify-
  native-freshness` flags only darwin-arm64 + linux stamps
  (cross targets, irrelevant here); darwin-x64 binary
  (Sep 22 21:34, this box's triple) unstale. Other-target
  staleness is pre-existing, out of scope (RS closed).
- Run at 00:48Z, load 2.25 at launch: run-order sync
  955.7,967.8,1010.4,1041.0,1082.8 → med 1010.4 (RSS med
  311.3, HW 357.1, bundle 3308678 = D-identical bytes,
  cssCalls 7527 — load stable, timing only).
- CONTAMINATED: strictly monotonic climb; post-run `ps`
  shows sibling burns mid-run (Crew Q census `grep -rn
  export type StyleProps …` 85% × 3min + second grep 29%,
  load 3.70 at 00:48Z). Per box-quiet discipline this
  invocation is VOID — waiting for quiet, then one valid
  N=5. (The "one invocation each side" counts valid
  measurements; a noise run is re-run, not reported.)

### P2. Scratch BEFORE setup (during the burn, zero measure load)

- `/tmp/crewp-before-h8d91542`: local clone, `checkout
  8d91542f4`, `git status` EMPTY (exact-HEAD, clean).
- `pnpm install --prefer-offline` inside scratch: 5.5s,
  store-linked, EXIT 0.
- RS `build:js` inside scratch (tsup+tsc+dts, hermetic
  from HEAD sources): EXIT 0, `dist/atomic.mjs` present.
- Staged ONLY `dist/native/virtual-native.darwin-x64.node`
  + `.inputs.sha256` via `cp -p` from the real tree
  (read-only on the real tree; this box's triple, verified
  fresh in P1). Engine bytes literally identical both
  sides; RS sources identical by clean-tree proof.
- Smoke: scratch `--scale small --runs 1` end-to-end
  GREEN (486ms under load — timing irrelevant for smoke),
  pinned clean to `reports/8d91542f4f01/` — proves HEAD
  tree + native engine wired. Q's census grep exited
  ~00:54Z; box settling.

### P3. Valid medians — AFTER 914.5 vs BEFORE 902.4 (both quiet)

- Gap-hunted the valid AFTER: Q's second census grep +
  a DisplaysExt spike burned through polls 1–12; quiet at
  poll 13 (~00:59Z), fired immediately. AFTER run-order
  1054.9,904.1,913.8,915.4,914.5 → MED 914.5ms (RSS
  300.7, HW 340.5, bundle 3308678/gzip 295439, cssCalls
  7527). Runs 2–5 flat within 11ms; run 1 cold on both
  sides (first-child cache-cold, symmetric,
  median-excluded).
- BEFORE back-to-back in the same quiet window (scratch
  `/tmp/crewp-before-h8d91542`, pinned clean to
  `reports/8d91542f4f01/`): run-order
  985.4,906.7,901.5,902.0,902.4 → MED 902.4ms (RSS
  303.9, HW 346.5, bundle BYTE-IDENTICAL 3308678/
  295439, cssCalls 7527). Runs 2–5 flat within 6ms. No
  burners during (top 11% = own agent).
- DELTA: +12.1ms (+1.3%) AFTER vs contemporaneous
  BEFORE — inside run-to-run variance (D's own N=5s
  spanned 53/17ms within-run) and matching D's measured
  15ms S4 types leg. Sync output byte-identical; RSS/HW
  both slightly LOWER after (−3.2/−6.0).
- Guardrail reading: D's mid-tree 917 (2×) reproduced at
  914.5 (within 3ms). 744 pin / 787 scratch are
  stale-era: HEAD ITSELF measures 902.4 tonight — the
  pin→tonight gap (~160ms) is era/box, not voyage code.
  Same-night N=5 medians span 902–917 across three valid
  invocations; 744 sits at the floor of the 744–1071
  intraday band, not a same-night comparator.
- Phased breakdown: D's stands uncontested (scan 329 +
  compile 483 = 89% voyage-untouched; whole publish
  segment 69ms) — not re-burned; unneeded at +1.3%.
- Tasty-off-path on THIS tree: `agentneo run NEO-REF-11`
  re-run contemporaneous → PASS (sync seals 64ms, bg
  reference build 0.20s lands after, 0 warnings/0
  diagnostics). REF-11 ordering holds; post-D tree delta
  (L's 1-line render fix) provably off the sync path.

VERDICT: NO REGRESSION vs contemporaneous before — perf
law HOLDS. Tasty fully deprioritized (ordering re-proven
on this tree), voyage in-path cost ≈12ms (≈ the known
S4 leg), sync bytes identical.

Footprint: this log + `benchmark/reports/latest/*`
(LEFT dirty for the captain's landing revert). Zero src
writes, zero index ops, no commits. ARTIFACTS-IGNORED
verified for the case re-run. Scratch left at
/tmp/crewp-before-h8d91542 (outside the deliverable).

## CREW P DONE

AFTER median 914.5ms (run-order
1054.9,904.1,913.8,915.4,914.5; RSS 300.7, HW 340.5) vs
contemporaneous BEFORE median 902.4ms (run-order
985.4,906.7,901.5,902.0,902.4; RSS 303.9, HW 346.5) —
enterprise seed-7 N=5 each, same box, same night, quiet
box both. Delta +12.1ms (+1.3%), inside variance,
sync-output byte-identical (3308678/295439 both).
VERDICT: NO REGRESSION — perf law holds. (Void noise
attempt 1010.4 logged in P1, not counted.) D's 917
reproduced within 3ms; 744 pin explained as stale-era
(HEAD itself = 902 tonight). REF-11 re-proven PASS on
this tree. Scratch: /tmp/crewp-before-h8d91542 (left
in place).

## Crew Q — HQ decision packet (2026-09-23) — DONE

Scope (strict): READ-ONLY + HERMETIC. Zero tree writes
(probes in /tmp, hermetic builds only); no reference-rs
writes (read-only inspection); no index ops, never commit.
Governing skill `agent-neo` loaded first. F4.3 (fixture
rename) and F4.4 (query disambiguation) stay REJECTED per
the captain — neither pursued. Box note: my early broad
grep (session 610) burned CPU inside Crew P's AFTER window
and voided it — mine, apologized; all later work used
bounded `muse.search` + scoped `rg`, and the remaining
footprint is this log section only.

### Q1. Replication of Crew F — CONFIRMED IN FULL

All 8 kept probes re-run verbatim, fresh hermetic builds,
same box. Every number confirms; zero contests.

| Variant | F's number | Q replication |
| --- | --- | --- |
| V1 control (full closure) | 2 entries, ambiguous throw + dup warning; extends 100, SystemProperties 99, P 99 | CONFIRM, byte-identical incl entry ids `_81e247e1…` + `_484739e2…` |
| V2 (style-props root only) | 1 entry `_4847…`, 2 members, no accentColor; SystemProperties 2; P 2 | CONFIRM exactly (extends 3, alias 4, non-P undefined) |
| V3/V3b/V6 (node_modules spellings) | 1 entry, collapse, dead spelling | CONFIRM (2 members; SystemProperties unresolvable) |
| V4 (no decl roots) | 1 entry, 2 members | CONFIRM |
| V5 (reduced + external styled) | 1 entry, 2 members | CONFIRM |
| V9/V4sym (real vs symlink node_modules) | 1 entry, 2 members both | CONFIRM |
| V12a–d (crafted pkg × spec/extension) | all unresolved | CONFIRM (`[container]` / `[container,localTone]` all four) |
| V13 (core scan shape) | 1 entry, collapse | CONFIRM (2 members, P 0, id `_527afea5…`) |
| V15a/b/c (root-barrel ± style-props root) | 1 entry each, collapse; chunk records scoped external ref | CONFIRM with chunk forensics (library `@reference-ui/styled` / `@reference-ui/styled/types`) |
| V16 (current API on Sep-16 manifest) | 2 members | CONFIRM (container only; no accentColor/WebkitAppearance; extends 3; SystemProperties throws not-found) |
| V17 (core-shape + faithful barrel) | 1 entry, collapse | CONFIRM (2 members, 0 SystemStyleObject entries, scoped `@f/sys` ref recorded) |

Two strengthening observations: (a) V13 and V17 yield
the SAME entry id (`_527afea5…`) — both are
rootDir=outDir core-shape builds, corroborating the
root-sensitive id-hash claim (D-OPEN-2's mechanism) on
independent evidence. (b) The Sep-16 manifest is still
byte-in-place (mtime Sep 16 20:28 verified) — V16's
verdict is uncontaminated by any voyage write.

F's empirical law STANDS unamended: a generated decl
file contributes resolvable types IFF include-matched,
and matched ⇒ top-level entries indexed; following
never leaves the scanned set; index-time recording of
scoped external refs works while query-time resolution
is dead. Root cause stays PROMOTED (compiler
capability, RS-side, closed ground).

### Q2. Consumption census — verdict + evidence

Question (F4.2): who imports the generated top-level
`StyleProps` by name? Method: multiline-aware `rg -U`
over src, matrix, fixtures, tests, docs, tools,
playground, pipeline, scripts + `muse.search`,
generated dirs (`.reference-ui`/`dist`/`node_modules`)
excluded; every hit classified.

STRUCTURAL FINDING FIRST: the name originates in RUST
typegen (closed ground), not in the TS publisher —
`typegen/src/emit/style.rs:195` prints the declaration
head, `strict.rs:14` prints `SystemStyleObject =
StyleProps & …`, `strict.rs:125` prints
`BaseSystemStyleObject = StyleProps` (strict mode),
`style.rs:22` the `r?:` self-reference. So F4.2's
"C2/publish scope" holds ONLY as a TS post-pass rename
inside `publishTypesBundle` (deterministic string
surgery, must cover open + strict sites + the `r?:`
self-ref); a clean emitter rename is itself an RS
change needing the same sanction as the fix — in which
case the fix dominates (see packet §Q4).

By-name importers of generated-styled `StyleProps`
(COMPLETE — 5 files, zero elsewhere):
1. `neo/src/sync/publish/types-bundle.ts` — THE
   GENERATOR: react-wiring import (`StyleProps as
   NarrowStyleProps` from `@reference-ui/styled`) +
   `style-props.d.ts` + `prop-type.d.ts` templates
   (`import … from './index.js'`). Rewritten by the wave.
2. `neo/src/reference/bridge/tasty-build.test.ts` —
   unit test staging a FAKE generated decl pair. Wave
   updates.
3. RS test mirrors (crafted strings pinning current
   shape — test-only edits, STILL closed ground, need HQ
   sanction): `atomic/src/tests/surface.rs`,
   `styletrace/src/tests/neo_decl_roots.rs`,
   `styletrace/tests/helpers.ts`.
4. `neo/docs/evidence/styletrace-baseline/react.d.mts`
   — FROZEN read-only evidence snapshot. Do not touch;
   the wave logs the skew.

NOT importers (verified): lib `src` (ZERO `@reference-
ui/styled` imports at all — 10 TS files name StyleProps,
all 4 import/export lines use `@reference-ui/react`);
core `src` (imports only the aliases —
`SystemProperties`, `UtilityValues`, `Tokens`,
`Conditions`); matrix (zero); fixtures (StyleProps only
from `@reference-ui/react`); neo tests (REF worlds
import `SystemStyleObject`; TYPE-07 imports aliases
only); playground `src`; docs; pipeline; scripts;
reference-docs; reference-icons.

Safe classes the split preserves: (a) the projector
(`tasty/api.ts:27-50`) resolves P → `SystemProperties`
(scoped then bare) — never touches `StyleProps`;
(b) the author surface `@reference-ui/react` keeps
exporting its OWN `StyleProps` (react.d.mts declares
it; the wave only re-points its `NarrowStyleProps`
import) — every lib/matrix/styletrace consumer
unaffected; (c) NEO-TYPE-07 asserts file existence +
`./index.js` derivation + alias compilation — all
split-compatible, zero test changes; NEO-SYNC-02's
inventory (file stays) likewise. Matrix suites assert
only on CORE-generated decl text (e.g. spacing's
`UtilityValues["size"]`) — core is frozen, untouched
either way. The precise breaking surface: an external
consumer importing `StyleProps` from `@reference-ui/
styled[/types]` gets TS2305 (proven, §Q3).

VERDICT: SAFE in-repo (no by-name consumer outside the
generator + its mirrors); breaking-ness reduces to
unknown EXTERNAL direct importers of styled `StyleProps`
— that residual is the HQ product call.

### Q3. Split experiment — PASS (both designs)

`/tmp/q-split-probe.mjs` (kept, re-runnable): crafted
generated `index.d.ts` with ZERO whole-word `StyleProps`
(verbatim playground decl, 3 anchored renames) + full
2-root closure + fixture-local StyleProps (verbatim D
world, 4 exports). 13 checks per variant.

Q-SPLIT-A (object → fresh `SystemStyleProps`, alias
files re-pointed): 13/13 PASS — 1 entry; local
typeAlias; 99 members incl accentColor + container;
SystemProperties 99 (indexed once); SystemStyleObject
indexed once; extends 100 + localTone; extends-alias
101 + both locals; P → same 99; non-P undefined; zero
warnings.
Q-SPLIT-B (object declared AS `SystemProperties`,
style-props.d.ts a pure `export … from` re-export):
13/13 PASS with IDENTICAL numbers — re-exports do NOT
index (SystemProperties indexed once). The wave may
land either shape; B has a single declaration site, A
is the smaller diff.

tsc side-check (`/tmp/q-split-tsc`, crafted pkg +
symlinked install): POSITIVE consumer (SystemStyleObject
with `_hover` nesting + container, SystemProperties,
UtilityValues['accentColor'], Conditions) → exit 0;
NEGATIVE (`import StyleProps from styled/types`) →
TS2305 `has no exported member 'StyleProps'`. (One
staging fault caught and fixed mid-crew: bare `sed`
`&`-expansion corrupted the first craft — the probe's
JS-side crafting + its zero-residual guard were never
affected, and the restaged check above is clean.)

The workaround is PROVEN viable pending HQ's product
call: single entry + full projection with no closure
change and no compiler change.

### Q4. HQ DECISION PACKET

Promoted root cause (F + Q independent confirmation):
query-time resolution of scoped external type refs is
dead in the current tasty compiler/API. Chunks
faithfully record the ref (V15/V17 forensics); display
projection resolves only inside the include-matched
set; matching the generated `index.d.ts` indexes its
top-level `StyleProps` (dup). Single-entry and full
projection are mutually exclusive at the scan layer —
no closure-only fix exists. The matrix oracle premise
(>100 members via following) describes Sep-16 tasty;
current API yields 2 members even on core's own Sep-16
manifest (V16, replicated). Objective 1's full closure
STANDS (captain's ruling); the 2 reds (REF-02/02,
REF-03/18) need exactly one of the two HQ-only calls
below.

RS ACCEPTANCE CRITERIA (from F4.1, sharpened by Q's
replication — all numbers are today's failing values):
1. V16-grade: current API on the Sep-16 manifest yields
   StyleProps with 100+ members incl WebkitAppearance +
   accentColor + container (today: 2, container only).
2. V2-shape fresh build (style-props root only, subpath
   import): single StyleProps entry + 99 members incl
   accentColor/container; extends 100; SystemProperties
   99; P → 99; non-P undefined (today: 2/3/2/2).
3. V15b-shape fresh build (style-props root + ROOT-
   barrel import): same 99-projection bar (today: 2).
4. V13/V17 core-shape replicas project (single entry,
   99) — proves the fix is in resolution, not in a
   blessed layout (today: collapse to 2).
5. Oracle specs green on FRESH builds: REF-02/02 +
   REF-03/18 and matrix `reference-output` StyleProps
   assertions (>100, WebkitAppearance); zero
   duplicate-name warnings. (Fresh, not the stale
   manifest — the stale manifest must stop being load-
   bearing.)

OPTION FRAMING (no recommendation beyond the evidence
— HQ decides):
(A) RS FIX — restore query-time resolution of scoped
external refs (or index-time followed-without-indexing)
on closed ground, HQ sanctions. Principled; restores
the Sep-16 regime; unblocks the one-root closure change
(drop `index.d.ts`), which then works as D
hypothesized. Unlocks everything: 2 NEO-REF reds,
matrix oracle StyleProps assertions on fresh builds,
no generated-surface rename, no consumer migration.
Cost: RS eng time; Objective 1 stays red until it
lands. Note: D-OPEN-2's RS question (clause order)
rides the same sanction conversation.
(B) DECL-LEG SPLIT — drop top-level `StyleProps` from
NEO-generated `styled/types/index.d.ts` (aliases kept),
proven viable hermetically (§Q3: A/B 13/13 + tsc
+/-). Needs HQ's product call on the census (§Q2:
in-repo SAFE, author surface `@reference-ui/react`
unchanged, residual = external direct importers →
TS2305) + a small implementer wave: post-pass rename in
`publishTypesBundle` (open + strict sites + `r?:`
self-ref + 3 subpath templates + react wiring),
`tasty-build.test.ts` fake decls, `tasty-build.ts`
comment, NEO-REF README staleness, and the 3 RS test
mirrors (closed ground even for tests — sanction).
Leaves: matrix oracle still red on current behavior
(core frozen — an Objective 2 question, flagged for
the audit crew), and the Sep-16 capability still dead
(any future external-ref projection needs (A) anyway).
Wave-shape freedom: land split-A (alias file) or
split-B (re-export) — both proven; EITHER WAY the
`export type *` barrels propagate the rename with no
further edits, and either way the emitter-rename
variant of (B) needs RS sanction like (A) — if HQ is
opening RS, (A) dominates.

### Q5. Footprint + handoff

Tree: ZERO Crew Q writes (verified `git status` — only
prior/parallel crews' payload). Probes kept in /tmp:
`f-closure-probe.mjs`, `f-closure-v3…v9.mjs` (F's,
re-run), `q-split-probe.mjs` (the experiment),
`q-split-tsc/` (crafted pkg + positive.ts/negative.ts).
Reruns: `node /tmp/f-closure-probe.mjs` (exit 1 =
refutation holds); `node /tmp/f-closure-v{3,…,9}.mjs`;
`node /tmp/q-split-probe.mjs` (exit 0); tsc +/− in
`/tmp/q-split-tsc` per §Q3. For the Obj-2 audit crew:
matrix oracle StyleProps assertions are red-on-current
behavior under EITHER option unless (A) lands — see §Q4.

## CREW Q DONE

Replication: Crew F CONFIRMED IN FULL (all 8 probes,
11 variant rows, zero contests; V16 decisive —
2 members on the Sep-16 manifest). Census: SAFE
in-repo (5 by-name files: generator + test fake + 3 RS
mirrors + 1 frozen evidence doc; every other consumer
uses aliases or `@reference-ui/react`); breaking
surface = external direct importers (TS2305) + the
finding that RS typegen owns the name (publish-scope
split = post-pass rename). Experiment: PASS —
Q-SPLIT-A and Q-SPLIT-B 13/13 (single entry, 99/100/
101 projections, P → 99, non-P undefined, zero
warnings) + tsc positive-0/negative-TS2305. Packet: §Q4
above (promoted cause, 5 RS acceptance criteria with
today's failing numbers, option A/B framing, no
recommendation). Tree untouched; everything re-runnable
from /tmp. Pointing at the packet: LOG-1.md Crew Q §Q4.

## Crew Q acceptance + tick (captain, 2026-09-23)

Q ACCEPTED — packet complete. Independent replication
confirms F in full (all 8 probes, byte-identical entry ids,
V16 decisive + strengthening id-hash corroboration for
D-OPEN-2's mechanism). Census: SAFE in-repo (5 by-name files
enumerated) with the structural finding that RS typegen owns
the name (clean emitter rename = RS change; publish-scope
split = post-pass surgery). Experiment: PASS both designs
(13/13 + tsc +/−). Packet §Q4 carries the promoted cause, 5
RS acceptance criteria with today's failing numbers, and
A/B framing — including the dominance note (if HQ opens RS,
the fix dominates the split). Footprint zero, verified via
tree count. Q's self-reported grep burn that voided P's
attempt-1 is noted and already self-corrected (bounded
search since).
TICK PICTURE: P LIVE and disciplined (P0 method + P1 filed;
attempt-1 voided on sibling burn per box-quiet discipline,
re-running on quiet — medians decide). Audit LIVE in LOG-2
(recon + 4 nested workers out). No deadlocks, no pings, no
intervention. Nothing to commit; reviewers + landing wait
HQ's call; P + audit still out.

## Crew P acceptance (captain, 2026-09-23)

P ACCEPTED — perf law HOLDS, proven contemporaneously.
Methodology sound: noise attempt voided with evidence
(monotonic climb + ps-caught sibling burn), scratch HEAD
clone verified clean (exact-HEAD, hermetic install + build,
engine bytes literally identical via justified .node copy —
RS sources identical, dist pure output, hard-import fails
loud), both N=5 fired back-to-back in one quiet window.
AFTER 914.5 vs BEFORE 902.4: +12.1ms (+1.3%), inside
run-to-run variance, matching the measured S4 leg; sync
bytes byte-identical (3308678/295439 both); RSS/HW lower
after. The 744-pin question is CLOSED: HEAD itself measures
902.4 tonight — the pin is stale-era, not a same-night
comparator. REF-11 re-proven PASS on this tree (sync seals
64ms, bg lands after). Footprint as ordered (log +
reports/latest dirty for the landing revert).
NIGHT STATUS: all crews home. Objective 1 stands at 24/26
green + perf proven + REF-10 met, pending HQ's RS-vs-split
call (§Q4 packet). Objective 2 mapped, implementation held.
Nothing further dispatches until HQ rules — ticks stand
watch with one-line entries.

Tick (2026-09-23): all 12 crews home, all logs IN PROGRESS, tip/index clean — pends HQ's RS-vs-split call; no action.

Tick (2026-09-23): unchanged — roster all home, tip/index clean, pends HQ; no action.

Tick (2026-09-23): unchanged — roster all home, tip/index clean, pends HQ; no action.

Tick (2026-09-23): unchanged — roster all home, tip/index clean, pends HQ; no action.

Tick (2026-09-23): unchanged — roster all home, tip/index clean, pends HQ; no action.

Tick (2026-09-23): unchanged — roster all home, tip/index clean, pends HQ; no action.

Tick (2026-09-23): unchanged — roster all home, tip/index clean, pends HQ; no action.

Tick (2026-09-23): unchanged — roster all home, tip/index clean, pends HQ; no action.

Tick (2026-09-23): unchanged — roster all home, tip/index clean, pends HQ; no action.

Tick (2026-09-23): unchanged — roster all home, tip/index clean, pends HQ; no action.

Tick (2026-09-23): unchanged — roster all home, tip/index clean, pends HQ; no action.

Tick (2026-09-23): unchanged — roster all home, tip/index clean, pends HQ; no action.

Tick (2026-09-23): unchanged — roster all home, tip/index clean, pends HQ; no action.

Tick (2026-09-23): unchanged — roster all home, tip/index clean, pends HQ; no action.

## HQ ruling + RS-fix dispatch (captain, 2026-09-23)

HQ ruled (A) RS FIX — and corrected the captain: the night
should not have stalled awaiting this call. The packet
pointed at A (dominance noted in §Q4), the mandate says no
HQ in the loop overnight, and "RS is done" bars churn, not
an evidence-demanded fix the proofs require. Corrected
standing reading: RS stays closed to diets/refactors/
while-we're-heres, open to fixes the objective proofs
demand with oracle-grade evidence. Decl split (B) rejected.
D-OPEN-1 unblocks via F4.1: RS restores scoped-external-ref
resolution, then the one-root closure change (drop
index.d.ts) lands as D hypothesized.
Dispatch: RS-fix crew (agent-rs, RS scope only, Q's 5
acceptance criteria + RS gates). Then Neo-close crew
(closure change + 26/26 + regression + sync-identity +
enterprise confirm), then reviewers, then captain's
firsthand verification + landing. The RS fix rides Obj 1's
single commit (coupled with the closure change — atomic by
necessity). Obj 2 implementation still held for the landing.

## RS-fix crew (2026-09-23) — WORKING

Scope (strict): `packages/reference-rs` ONLY, this fix only:
restore resolution of scoped external type refs (HQ option
A). No diets/refactors/cleanups, no Neo/lib/matrix edits,
no index ops, never commit. Governing skill `agent-rs`
loaded first. Diff must be the fix and nothing but the fix.

### R0. Recon — baseline, mechanism, achievability verdicts

Baseline re-run (current tree, kept probes): V16
(`/tmp/f-closure-v8.mjs`) → 2 members, container only,
SystemProperties throws — CONFIRMED. V1/V2
(`/tmp/f-closure-probe.mjs`) → control 2 entries +
ambiguous + dup warning; reduced 1 entry + collapse (2/2/
3/4) — CONFIRMED. Pre-fix probe wall time: 91ms
(`/tmp/rsfix-before.txt`: 2 hermetic builds + queries).

Mechanism (traced, not inferred): the JS query layer
(`object-projection.ts` `loadReferencedSymbol`,
`api-runtime.ts` `loadManifestSymbolRef`) resolves refs
only against the manifest — and that code is UNCHANGED
since before Sep-16 (only docs/nest commits). So no
query-layer regression exists; what died is INDEX-TIME
following: W1c (`c361dd7c2`, Sep-20, Obj-3 doom fortify)
tightened `policy.rs` (user plain imports of externals no
longer followed; cross-library hops dead). Pre-W1c
manifests indexed followed externals (TST-EXT-01 golden
then: 72 names incl. csstype/json-schema) — the Sep-16
green rode on fresh builds with indexed externals, not
on the stale 36-name manifest (which never carried
external targets under any API version). Prior art:
`2d405aa9b` (Mar) loosened the same gate explicitly "to
show SystemStyleObject members"; W1c re-tightened it on
the doom over-collection find (whole packages indexed
from one plain import). Full pre-W1c restoration would
re-pollute the name index (generated `StyleProps` under
styled + fixture-local = 2 entries = ambiguous), so the
criteria MANDATE the middle ground the sanction names:
index-time followed-without-indexing.

Achievability (verified before writing a line):
- Criteria 2/3/4 (V2 99/100/101, V15b 99, V13/V17 99):
  ACHIEVABLE — NEO decls carry the 99 as an inline
  object (F's V1 proves the shape projects today).
- Criterion 5 NEO-REF halves (REF-02/02 node queries,
  REF-03/18 browser render): ACHIEVABLE via index-time
  targets in fresh artifacts + the Neo-close crew's
  closure change. REF-03/18 renders in-browser
  (`page.goto`, `reference-root`), so ONLY index-time
  targets can serve it — no query-time fallback could.
- Criterion 1 + criterion 5 matrix half as stated
  (100+ incl WebkitAppearance from `@reference-ui/
  system`): NOT ACHIEVABLE by any resolution fix, with
  evidence. The mapped generator shape
  (`CssProperties = { [K in keyof Properties]?... }`,
  `CanonAliasMap`, landed Sep-15 `c2489a55f`, one day
  BEFORE the stale manifest) means the current
  `SystemStyleObject` projects ~3 members (size/
  container/r) even with perfect resolution — tasty has
  no mapped-type member expansion (no such code path
  exists at index or query time), and the Sep-16 inline
  bytes are gone (gitignored, regenerated). The oracle
  has been red since Sep-15/16 on generator shape,
  before W1c killed resolution on Sep-20. This is a
  NEW finding for HQ/Obj-2 (oracle re-baselining), not
  a resolution defect. Consequence: NO query-time
  machinery — it has no historical basis (Sep-16 was
  index-time), buys zero acceptance (2 members would
  become ~3, never 100+), and adds risk. Index-time
  only, per the sanction's option (b).

Design (minimal, sanction-literal "scoped external type
refs"): (1) `policy.rs`: user plain imports followed
iff the specifier is SCOPED and not dev-only
(pre-W1c dev list restored verbatim for that subset);
re-export bridging unchanged; same-package-only from
library files unchanged. (2) Discovery records
`bridged_libraries` (user re-export edges); the set
threads scan→extract→resolve→bundle→emit (new field on
4 structs, 1 destructure + 4 constructors + 3 test
helpers). (3) `manifest.rs`: `symbols_by_name` skips
non-user non-bridged libraries; `symbols_by_id` +
chunks still emitted for all (resolution targets).
Preserved verbatim: every W1c pin (TST-EXT-01 css-tree
assertions + goldens — unscoped; resolve.rs react
re-pin — unscoped; workspace skip-pins — unscoped;
doom fakelib repro — unscoped), re-export bridging
semantics (whole bridged package still name-indexed),
V1 control shape (include-matched decls are user files,
still dup). Census: zero scoped imports in any TST-*
input; zero scoped-plain fixtures in Rust discovery
tests (scoped appears only via re-export or in
non-discovery extract tests) — expect zero golden
churn. READMEs (scanner + workspace boundary witnesses)
updated with the fix — W1c's lesson is contract+code
consistency.

## Tick (captain, 2026-09-23)

RS-fix crew LIVE and deep (R0 filed): baseline re-confirmed
on kept probes; mechanism traced (W1c Sep-20 policy.rs
tightening killed INDEX-time following; query layer
unchanged since pre-Sep-16 — no query regression ever
existed); design filed minimal (scoped-only following +
bridged_libraries threading + symbols_by_name skip, all W1c
pins preserved verbatim, zero golden churn expected).
Notable refinement: criterion 1 + matrix half (>100 incl
WebkitAppearance) ruled NOT achievable by any resolution
fix — generator shape changed Sep-15 (mapped types don't
expand), oracle red since Sep-15/16 on shape, before W1c.
Carried as WATCH: if the NEO specs encode Sep-16 member
counts, their re-baselining must be explicit at Neo-close
(HQ-visible), not silent. Criteria 2/3/4 + NEO halves
achievable per crew; Neo-close run will prove it. No
deadlock, no ping, no intervention. Neo-close + reviewers
wait RS-fix DONE; Obj 2 implementation still held.

### R1. Implementation — index-time followed-without-indexing

Three coordinated changes, all in
`packages/reference-rs/modules/tasty` (22 files + 1 new
case dir; no Neo/lib/matrix bytes; index never touched):

1. Scoped-plain-import following (`scanner/workspace/
   policy.rs`): user plain imports are now followed iff
   the specifier is SCOPED (`@org/name` via the existing
   `split_package_specifier`) and not dev-only (pre-W1c
   dev list restored verbatim). Re-export bridging and
   same-package-only from library files are byte-
   identical to W1c.
2. Bridge tracking + name-index skip: the crawler
   records `bridged_libraries` (libraries reached via a
   user re-export edge; user-relative re-exports don't
   pollute the set), threaded scan→extract→resolve→
   bundle→emit (new field on `ScannedWorkspace`,
   `ParsedTypeScriptAst`, `ResolvedTypeScriptGraph`,
   `TypeScriptBundle`; `Discovery` return struct).
   `manifest.rs` emits `symbols_by_id` + chunks for ALL
   graph symbols but `symbols_by_name` only for user +
   bridged libraries. Contract witnesses updated
   (`scanner/README.md` boundary, `workspace/README.md`,
   `imports.rs` doc comment) — no witness left stale.
3. Two defects found EN ROUTE by the acceptance probes,
   both required for the sanctioned outcome:
   a. `normalize_relative_path` swallowed leading `..`
      (`pop()` on an empty path), killing every barrel
      hop from followed packages in outDir-layout scans
      (core's REAL `rootDir: outDir` shape — F's V13/V17
      premise verified in core's `tasty-build.ts`).
      Pre-existing since March (the idempotency
      proptest alphabet had no dots). Fixed by
      preserving `..` past the root (3-line helper +
      proptest alphabet widened + deterministic cases +
      discovery-level barrel regression test). Without
      this, scoped-following is dead for the whole
      barrel world (system root-barrel et al).
   b. Query-layer alias-cycle OOM (`js/internal/
      object-projection.ts`): the instantiated path
      bypassed the visited-set, so any alias-definition
      cycle recursed to 4GB death — proven pre-existing
      on pure-user A↔B with zero externals (TST-PRJ-02
      only covers self-recursion through member types,
      never alias cycles). My index fix makes such
      cycles reachable via followed aliases (V17
      proved it), so the crash fix rides along: mark
      visited before following (8 lines + early-return
      split that took the function from 20 back under
      the complexity bar). Behavior on acyclic graphs
      is identical (suites prove it).

Committed tests: 3 discovery tests (scoped-plain
followed+unbridged, scoped re-export bridged, scoped
dev skipped), 1 manifest name-index filter test, 1
outDir barrel discovery test, normalize proptest +
unit cases, and new seam case TST-PRJ-03-alias-cycles
(A↔B terminates with both locals). Every W1c pin
holds verbatim (css-tree, react, unscoped skips,
re-export bridges, doom fakelib shape).

### R2. Verification — criteria, gates, handoffs

CRITERIA (Q4 bar; all probes re-runnable from /tmp):
1. V16-grade (stale Sep-16 manifest → 100+ incl
   WebkitAppearance): NOT MET — 2 members, unchanged
   (`/tmp/f-closure-v8.mjs`). BLOCKED-AS-STATED with
   evidence (R0): the member source is gone (Sep-15
   mapped refactor; tasty never expanded mapped
   types). No resolution fix can conjure members from
   absent bytes; a query-time fallback would move 2→~3
   (current package projects size/container/r —
   PROVEN by the replica below), never 100+. Needs
   HQ's oracle re-baseline call (Obj-2), not code.
2. V2-shape: MET IN FULL (`/tmp/f-closure-probe.mjs`
   → HYPOTHESIS VERIFIED): single StyleProps (same id
   `_4847…`), 99 incl accentColor+container, extends
   100, alias 101, SystemProperties 99, P→99,
   non-P undefined, zero warnings. V1 control
   reproduces D-OPEN-1 byte-identically (same 2 entry
   ids + ambiguous + dup warning).
3. V15b-shape: MET IN FULL (`/tmp/f-closure-v7.mjs`):
   1 entry, 99, extends 100, SystemProperties 99,
   P→99, non-P undefined. Chunk forensics: external
   ref now carries a RESOLVED hashed id
   (`_53e5…`, `@reference-ui/styled`), not id===name.
4. V13/V17: V13 MET (1 entry, 99, extends 100 —
   `/tmp/f-closure-v6.mjs`). V17: 2 members,
   terminates cleanly, 0 SystemStyleObject entries,
   zero warnings — CORRECT-UNDER-THE-BOUNDARY, with
   evidence: its hop-3 relatively escapes its package
   (`@f/sys` → `../../styled/…`, unlinked target),
   which the preserved same-package boundary forbids
   AND which is lexically unresolvable in EVERY
   regime (pre-W1c included — relative-following
   rules never changed). V17-99 jointly with
   single-entry is unsatisfiable in any regime
   (resolving the escape would name-index styled's
   StyleProps as user → dup). Criterion 4's SPIRIT
   (resolution across layouts, incl. barrels) is
   proven by V13 + V15b + the matrix replica; V17's
   letter rests on a false premise — captain/HQ eyes
   needed. Supporting flips (fix working as
   sanctioned): V3/V3b/V4/V5/V6 → 99 (were collapse),
   V9/V4sym → 99/99 (real + symlink), V12a–d → all
   resolve (every specifier × extension).
5. Oracle specs on FRESH builds: NEO-REF halves
   ENABLED — full group run (`pnpm agentneo run
   NEO-REF`): 24 PASS + the same 2 known reds, both
   failing ONLY on the dup with byte-identical entry
   ids (REF-02/02 `got 2`; REF-03/18 ambiguous
   error-state) — i.e. the Neo-close crew's one-root
   closure change now lands on a proven bed
   (post-closure shapes are V2-equivalent → 99/100/
   101 per criterion 2). REF-02/01 + all other
   specs green = non-StyleProps projections UNMOVED
   in-world. Matrix half (>100, WebkitAppearance):
   BLOCKED-AS-STATED (same mapped-wall evidence as
   criterion 1). Hermetic matrix replica (NEW
   `/tmp/rsfix-matrix-replica.mjs`: REAL system
   package bytes + verbatim matrix fixture +
   core-shape scan): single entry, ref RESOLVED to
   hashed id, [size, container, r] (exactly the
   mapped-wall prediction), SystemStyleObject
   unindexed, zero warnings — RESOLUTION RESTORED on
   the true core chain; counts bounded by generator
   shape, not resolution. Zero dup warnings ✓.
   (Captain's tick WATCH answered: NEO specs assert
   >90/accentColor/container — the LIVE inline
   shape — so they need NO re-baselining; only the
   MATRIX oracle (>100/WebkitAppearance) is stale.)

GATES (RS law): `agentrs q` on all 15 touched files
— 0 violations (remaining warnings all pre-existing
in untouched functions; my one introduced warn
refactored back under the bar); `agentrs c` FULL
workspace green (39 suites ok, 0 failed; tasty 75
incl. 6 new tests); `agentrs v tasty` green (83/83
incl. new TST-PRJ-03); TST-* goldens: ZERO churn
(`git status` shows only the new PRJ-03 dir —
before/after hermetic diff on non-StyleProps
projections is EMPTY). Vendor freshness (Crew S's
tool `--check`): FRESH — the dist rebuild changed
no exported types, zero drift to report (Neo-close
crew: nothing to regen).

PERF (handoff b): no hot sync-path impact. Query
delta is one Set lookup + one small Set clone per
followed ref (measured: 50× 99-member projections
in 0.4ms); index delta (scoped decls enter the
graph: V2 build emits 23 chunks vs ~5) lands wholly
in the background tasty build — REF-11's ordering
(sync seals before manifest-ready) is structural
and untouched. Probe wall: 91ms → 112ms for 2
full hermetic builds + queries (noise-inclusive).

D-OPEN-2-adjacent (handoff c — observed, NOT fixed):
(a) relative imports that escape their package are
not same-package-checked (policy gates only
bare-specifier hops; relatives resolve lexically —
core's real `../../../styled/types/csstype` escape
resolves by same-scope lexical accident); (b)
followed symbols inherit the root-sensitive id-hash
scheme unchanged; (c) mixed `export *` + explicit
re-exports in entry barrels resolve (star-ambiguity
exclusion didn't bite the system chain).

HANDOFF to Neo-close crew: the closure change (drop
`index.d.ts`, keep `style-props.d.ts`) is now VALID
— V2-shape proves single-entry + 99/100/101 + P→99
with zero warnings. Then 26/26 + regression +
sync-identity + enterprise confirm per dispatch. New
repro probes kept: `/tmp/rsfix-matrix-replica.mjs`
(real-system resolution proof),
`/tmp/rsfix-cycle.mjs` (alias-cycle termination),
`/tmp/rsfix-barrel-debug.mjs`,
`/tmp/rsfix-barrel-l2.mjs`, `/tmp/rsfix-matrix.mjs`,
`/tmp/rsfix-sym.mjs`, `/tmp/rsfix-bisect.mjs`,
`/tmp/rsfix-isolate.mjs`, `/tmp/rsfix-oom.mjs`
(debug trail). Footprint: 22 files in
`packages/reference-rs/modules/tasty` + new
TST-PRJ-03 dir + this log section; dist/.node
rebuilt locally (gitignored); index untouched.

## RS-FIX DONE (resolution restored; 2 sub-verdicts need HQ eyes)

RS-FIX DONE on the sanctioned scope: scoped external
type refs resolve at index time, followed-without-
indexing, all W1c pins + gates + seams green, zero
golden churn. Criteria 2, 3, V13-half of 4, and the
NEO-REF halves of 5 (enabled pending Neo-close)
PROVEN with oracle-grade evidence. Two sub-verdicts
are BLOCKED-AS-STATED with evidence and need HQ's
call, not more code: (i) criterion 1 + matrix half
of 5 (>100/WebkitAppearance from `@reference-ui/
system`) — the Sep-15 mapped generator shape
projects ~3 members under ANY resolution; the
oracle needs re-baselining (Obj-2) or a separately
sanctioned mapped-expansion feature (never existed);
(ii) criterion 4's V17-99 letter — its cross-package
escape is unsatisfiable jointly with single-entry in
every regime; V17 correctly degrades to 2. Files,
gates, vendor, perf, and handoff above (R1/R2).

## RS-fix acceptance + Neo-close dispatch (captain, 2026-09-23)

RS-FIX ACCEPTED. Scope verified firsthand: 23 RS paths
(22 modified + TST-PRJ-03), all inside modules/tasty,
matching the crew's report exactly; nothing outside RS
except known payload; tip/index clean. Delivery:
index-time followed-without-indexing (scoped-plain
following + bridged_libraries threading + name-index
skip), all W1c pins verbatim, gates green (q 0
violations, cargo 39 suites, tasty vitest 83/83), zero
golden churn, vendor FRESH (no regen), no hot-path perf
impact. Criteria: 2, 3, V13 MET with oracle-grade
evidence; NEO-REF halves ENABLED (24 + same 2 reds,
dup-only — closure change valid). Two en-route defect
fixes (normalize `..` swallowing, alias-cycle OOM) accepted
as part of the fix arc — both evidenced as required
(barrel world dead / V17-class cycles crash without
them), both pre-existing, both test-pinned.
Two sub-verdicts to HQ (need call, not code): (i) criterion
1 + matrix half — mapped wall (Sep-15 generator shape),
oracle needs Obj-2 re-baselining or a separately
sanctioned mapped-expansion feature; captain's
recommendation: re-baseline, feature is not tonight;
(ii) V17-99 letter — jointly unsatisfiable with
single-entry in every regime; accept correct-under-
boundary (spirit proven by V13+V15b+replica).
Tick WATCH answered: NEO specs assert the live inline
shape — NO re-baselining needed for 26/26.
NOT STALLING on the sub-verdicts: Neo-close dispatched
now (closure change + 26/26 + regression + sync-identity +
enterprise confirm + vendor re-check). Reviewers after;
captain's firsthand verification + single landing commit
after that (RS fix rides it, atomic).

## Neo-close crew (2026-09-23) — WORKING

Scope (strict): the bridge tasty-build decl closure change
ONLY (drop `index.d.ts`, keep `style-props.d.ts` — D's
hypothesis, now valid on the RS fix) + read-only
everything else. No RS, no lib, no entry/publish/gate/
vendor writes; never commit, never touch the index.
Governing skill `agent-neo` loaded first.

### N0. Vendor re-check + closure change (done)

Crew S's check re-run BEFORE applying: `node
packages/reference-neo/tools/vendor-rust-tasty-dts.mjs
--check` → `Vendored tasty d.ts is fresh
(@reference-ui/rust@0.0.42, 38 files)`, exit 0. FRESH —
zero drift, nothing regenerated (matches the RS crew's
R2 report; their dist rebuild is gitignored build
output as expected).

Closure change (2 files, the pin + its test):
- `src/reference/bridge/tasty-build.ts`:
  `buildReferenceTastyScanOptions` roots
  `styled/types/style-props.d.ts` ALONE (the
  `index.d.ts` root line dropped); doc comment updated
  to the single-root rationale (`index.d.ts` would
  index a second top-level `StyleProps`; the compiler
  follows its types through the import without
  indexing them).
- `src/reference/bridge/tasty-build.test.ts` (pin):
  `DECL_INDEX` const + both expectation entries
  removed; `makeProject` still stages `index.d.ts` on
  disk as the present-but-never-rooted witness (every
  real outDir carries it).
No other src byte touched (verified: only these 2
files differ from the pre-close tree; `git status`
count 125 before and after; index empty throughout).
REF READMEs still name D-OPEN-1 as a blocker — left
stale per strict scope; reviewers/captain own the doc
touch at landing.

### N1. NEO-REF group — 26/26 GREEN (done)

`pnpm agentneo run NEO-REF`, exit 0, this box:
- REF-01 package-shape 1/1; REF-02 01-symbols +
  **02-style-projection** 2/2; REF-03 all 18 incl
  **18-style-props-page**; REF-04 refresh; REF-05 2/2;
  REF-09 projector; REF-11 deprioritized. Total 26
  PASS, 0 FAIL (full stdout kept at
  `/tmp/neoclose-ref-run.txt`: 26 `PASS` lines, no
  FAIL/Error).
- Both former reds green on single-entry + full
  projection, unmodified specs — the captain's WATCH
  answer holds (no re-baselining needed, none done).
- All 7 worlds `warningCount: 0`, zero
  duplicate-name warnings, zero `Ambiguous` strings in
  the run output — the D-OPEN-1 signature is gone.

### N2. Regression sweep (done, all green)

One vitest invocation, 6 files, **45/45 pass**:
run 3 + init 5 + tasty-build 3 (= 11 bridge, matching
D's census) + reference-types 12 + unionTypeLabel 4 +
sync 18. Zero failures.
- `pnpm agentneo q` (bare): **0 errors**, 16
  warnings, 192 files — none on the 2 touched files
  (warn sites: fragments base/lib, typeLabel,
  run.test, recipe, sync/index, sync.test,
  lastRun, quality prose/run — all pre-existing,
  out of scope).
- Package `tsc --noEmit -p tsconfig.json`: clean,
  exit 0, zero output.

### N3. Sync-identity + REF-11 ordering (done, PASS)

- Standalone probe `/tmp/neoclose-sync-identity.mjs`
  (REF-11 style, outside the case harness: scratch
  copy of the REF-11 world, two consecutive syncs
  with the bg tasty allowed to land between): 25/25
  files byte-identical outside `tasty/` across both
  passes; ordering `sync-seals-before-manifest-ready
  = true` on the wiped-manifest second pass. PASS.
- Harness re-confirm: `pnpm agentneo run
  NEO-REF-11` → PASS `deprioritized.spec.ts` (sync
  59ms, warningCount 0). Ordering holds on the
  closure-changed tree.

### N4. Enterprise confirm — NO REGRESSION (done)

`pnpm bench:neo --scale enterprise --seed 7 --runs 5`
(seed never overridden), same box, ONE valid N=5
invocation. Box-quiet discipline: load 5.4 + dual
fileWatcher burn at first check (transient churn from
my own case/vitest runs) — waited, no bench burned;
fired at load 2.2 with three consecutive burner-free
polls; ran nothing else during. Run-order flat, no
voids needed.
- Sync: [925.3, 932.8, 929.1, 929.8, 923.7] →
  median **929.1ms** (span 9.0ms, tightest of the
  night — no contamination signature). Load
  byte-identical to history (3000 files, 7527
  calls, seed 7, same plan).
- vs Crew P's same-night band: AFTER 914.5 → +14.6ms
  (+1.6%); BEFORE 902.4 → +26.7ms (+3.0%).
  Same-night medians now 902–929 across 5 valid
  invocations; D's intraday band 744–1071.
- Sync output byte-identical: bundle 3308678/295439
  — exact match to P's AFTER *and* BEFORE bytes.
- Secondary observed (not the law): RSS med 309.9
  (P: 300.7/303.9), HW med 350.8 (P: 340.5/346.5).
VERDICT: NO REGRESSION — perf law holds. The +14.6ms
sits inside box variance on P's own accepted
reasoning (+12.1ms accepted at P): nothing in-path
changed (the closure strictly removes background
scan work; the RS fix rides the background tasty
build + manifest the S4 leg already packages), tasty
still fully off-path (REF-11 re-proven on this exact
tree), bytes identical. `reports/latest/` left dirty
for the captain's landing revert, as ordered.

Footprint: the 2 closure files + this log. Probes in
/tmp (`neoclose-ref-run.txt`, `neoclose-sync-
identity.mjs` + its scratch world). Index empty, no
commits.

## NEO-CLOSE DONE

Closure diff: `tasty-build.ts` single-roots
`style-props.d.ts` (+ rationale comment);
`tasty-build.test.ts` pin updated (index staged as
the never-rooted witness). 26/26 NEO-REF green
(REF-02/02 + REF-03/18 incl, 0 warnings, no spec
edits). Regression 45/45; gate 0 errors (16
pre-existing warns, none touched); tsc clean.
Sync-identity PASS standalone (25/25 bytes) +
REF-11 PASS in harness. Enterprise median 929.1ms,
+14.6 vs P-AFTER — NO REGRESSION, bytes identical.
Vendor re-check FRESH. Residual for reviewers: REF
READMEs still cite D-OPEN-1 (doc-only, scoped out).

## Neo-close acceptance + reviewer dispatch (captain, 2026-09-23)

NEO-CLOSE ACCEPTED. Captain reviewed the closure hunk
firsthand: single-roots `style-props.d.ts`, `index.d.ts`
deliberately unrooted with the rationale comment — exactly
as briefed. Delivery: 26/26 NEO-REF green on unmodified
specs (both former reds on single-entry + full projection,
zero warnings, D-OPEN-1 signature gone), 45/45 regression,
gate 0 errors (16 pre-existing warns, none touched), tsc
clean, sync-identity PASS (25/25 bytes) + REF-11 PASS,
enterprise 929.1 (+14.6 vs P-after, bytes identical —
verdict consistent with P's accepted reasoning; same-night
band now 902–929 over 5 valid runs), vendor FRESH. Tip/
index clean. Residual: REF READMEs still cite D-OPEN-1
(doc-only) — reviewers own it.
Reviewers dispatched: independent verification pass
(re-run 26/26 + q + tsc + unit suites), full-payload diff
review (port rules 1–4, RS scope, no creep), perf-verdict
soundness read, landing checklist (un-commit + reverts +
stray check), README citation updates (doc-only), and a
LAND/NO-LAND verdict. Captain's firsthand verification +
single landing commit after (RS fix rides it, atomic).

## Review — Objective 1 review crew (2026-09-23) — VERDICT: LAND

Scope held: read-only throughout except the 4 REF README
citation updates below + this log section. No src changes,
no index ops, no commits. Governing skill `agent-neo`
loaded first. VOYAGE.md Objective 1 + this log read in
full before any run. Mirror tool never executed (verified
by reading only, per brief).

### V1. Independent re-runs (scoped proof) — ALL GREEN

- `pnpm agentneo run NEO-REF` → exit 0, **26 PASS / 0 FAIL**
  (full stdout at /tmp/review-neo-ref-run.txt): REF-01 1,
  REF-02 2 (incl 02-style-projection), REF-03 18 (incl
  18-style-props-page), REF-04 1, REF-05 2, REF-09 1,
  REF-11 1. Zero `Ambiguous` strings, warningCount 0 ×7 —
  the D-OPEN-1 signature is gone on my run too.
- Bare `pnpm agentneo q` → **0 errors, 16 warnings,
  192 files** — warn sites match N2's documented list
  exactly (fragments base ×4, scanner ×2, typeLabel,
  run.test, recipe, sync/index, sync.test, lastRun,
  prose ×2, quality/run ×2). None on voyage-touched
  logic except the two accepted HEAD-band warns (sync
  116, sync.test 492) and the two S3-documented ones.
- Package `tsc --noEmit -p tsconfig.json` → exit 0,
  zero output.
- Unit sweep (one vitest invocation, 6 files) →
  **45/45**: run 3 + init 5 + tasty-build 3 (= 11
  bridge) + reference-types 12 + unionTypeLabel 4 +
  sync 18. Zero failures.
- Bonus (read-only, file-list gate): explicit `q` over
  exactly the 96 authored case files → **0 errors,
  0 warnings, 74 files** (74 = judged code; 8 READMEs
  pass prose; 7 case.json + 7 index.html unjudged) —
  D's 0/0 reproduced on the current tree, and again
  after my README edits (same 0/0/74).

### V2. Payload diff review — CLEAN, every path belongs

Inventory: 110 tracked changes + 153 untracked, all
mapped. HEAD moved since the crews' waves (8d91542f4 →
1b49cca1e) by 3 docs-only commits (`docs/bugs/*`) that
touch no payload file — review vs HEAD stands.

Belongs (Obj 1 commit): `.gitignore` (1 line, C1.3);
LOG-1.md; lib 3 (index.ts REF-10 restore hunk-exact,
tsconfig exclude drop, SummaryChip +1 line — all three
diffs read, exact); bench child.ts (D4 parser scan, both
error shapes kept — read); neo bridge 8 rewrites + new
types.ts + 2 suites + run.test.ts port + 3 burials;
browser 6 kept files (Reference.tsx reshape = B1 design
verbatim, singleton at entry — read; rest headers +
specifiers); browser-model 6 + fixtures + test port;
tasty/api.ts + api.ts (+headers only); 3 stray mds
deleted, docs/reference-browser.md carries the content;
entry/types.tsx + types.d.mts (composition read:
mirror→browser, entry→both); sync/reference-types.ts +
test 12 + clean.ts (leg + rewrite read); sync/index.ts
(leg call + never-awaited P5 wiring + cleanDir wipes —
read); links.ts +types (1 line); sync.test.ts +
scan-crossings.test.ts (teardown-only, hunk-verified);
tsconfig +3 paths (read); quality/run.ts +4 mirror
exclusion (read); tools/ (mirror tool + vendor tool +
README — read); vendor 38 (count-verified); cases/ref
96 authored (74 code + 8 README + 7 case.json + 7 html,
zero generated leakage — extension-audited); RS 22
modified + TST-PRJ-03 (2 files).

NOT payload (exclude at landing): LOG-2.md (Obj 2
audit), LOG-5.md (D-OPEN-4 carry), LOG.md (master
index) — other objectives' logs, legit tree state but
never in this commit. `benchmark/reports/latest/*`
(2 files) — tracked run output, REVERT, never commit.
Zero changes anywhere else (no core/matrix/pipeline/
fixtures/vendor/docs/scripts drift).

Port rule 1: PLAN.md absent from neo (ls-verified),
core untouched; the copy-pasta is documented properly
(tools/README.md explicit invocation + mirror semantics;
docs/reference-browser.md one-way truth flow +
architecture). PASS.
Port rule 2: single clean shape — shims deleted,
zero `./components` / `ReferenceStatus` edges in
browser+entry (grep-verified), sole mirror importer is
the entry, mirror→browser edges are 9×
`../../browser/component-api` + intra-mirror only,
`@reference-ui/types` residue 0. PASS.
Port rule 3: burials complete and unreferenced —
copy-browser-virtual + worker + worker-types +
reference/index + mirror shell/index/fixtures/theme +
3 stray mds all gone from disk; zero references to any
buried module, event, or path repo-wide in neo src
(grep-verified, incl. copy trio + `reference:ready`).
PASS.
Port rule 4: seam explicit — checked-in tool, named
invocation, provenance headers (sampled), gitignore
line, zero package.json scripts, links +types, no
silent copies. Regenerability verified by reading:
MIRROR_ROOTS=[components,document], lib source holds
exactly the 22 mirrored files (1:1 names), lock +
wipe + fail-loud residue check. PASS.
RS scope: 23 paths, all inside modules/tasty, fix-only
— every hunk read: scoped-plain following (policy.rs),
bridged_libraries threading (9 plumbing files),
name-index skip + pin test (manifest.rs), crawler
bridge recording, README witnesses (2), and the two
en-route defect fixes, both minimal, both justified in
the log as required-for-outcome (barrel world dead /
alias-cycle OOM), both test-pinned (4 discovery tests
incl. barrel regression, normalize proptest widen +
5 deterministic cases, TST-PRJ-03 A↔B case). Zero
diets, zero refactors. PASS.
Scope creep: none. No file fails the belong test.

### V3. Perf-verdict soundness — CONFIRMED (read, not re-run)

Chain audited end to end; no bench burned (captain's
firsthand re-run decides at landing):
- D2: 917/917 replicated, 15ms leg measured
  standalone, phased breakdown (scan+compile 89%
  voyage-untouched), byte-identical load, 20.6s bg
  tasty fully off-path. Honest about the stale
  guardrail; verdict qualified, landing call deferred.
  Sound.
- P: void discipline exemplary (1010.4 voided with
  monotonic climb + ps-caught sibling burn, re-fired
  quiet). Scratch BEFORE method sound (exact-HEAD
  clean clone, hermetic install+build, .node copy
  justified with fail-loud reasoning, smoke green).
  AFTER 914.5 vs BEFORE 902.4 back-to-back, runs 2–5
  flat both sides, +12.1 (+1.3%) inside variance,
  bytes identical, RSS/HW lower after. 744-pin closure
  decisive (HEAD itself = 902.4). REF-11 re-proven.
  Sound.
- N4: quiet discipline (waited out load 5.4, fired at
  2.2, 3 clean polls), tightest span (9.0ms), 929.1
  (+14.6 vs P-AFTER, +26.7 vs P-BEFORE), bytes
  identical, REF-11 re-proven on the exact tree.
  Reasoning valid (closure strictly removes bg work;
  RS fix rides bg). Sound.
- Firsthand corroboration from disk: N4's latest/
  result.json parsed — runs [925.3,932.8,929.1,929.8,
  923.7] → 929.1 ✓, RSS 309.9 / HW 350.8 ✓, bundle
  3308678/295439 ✓, load 3000/7527/seed 7 ✓. P's
  BEFORE pin survives in scratch (8d91542f4f01,
  01:01Z): [985.4,906.7,901.5,902.0,902.4] → 902.4 ✓,
  identical bundle bytes ✓. D2/P-AFTER medians rest on
  log record (rolling latest/ slot overwritten —
  expected). Same-night band 902–929 over 5 valid N=5s
  vs intraday 744–1071.
- Caveat (stated, not blocking): N=5 medians cannot
  resolve a ~15ms leg from noise — but the law's
  substance is structural (REF-11 ordering re-proven
  on the landing tree, incl. my own NEO-REF-11 PASS),
  not merely statistical.
VERDICT ON PERF: NO REGRESSION stands — confirm.

### V4. Landing checklist (for the captain)

- Mirror un-commit (C1.7 verified against current
  status): `git rm --cached -r
  packages/reference-neo/src/reference/browser-component`
  — covers exactly the 38 tracked paths (23 M + 15 D,
  `git ls-files` count-verified); gitignore line
  present; index currently empty.
- Reports revert: `git checkout --
  packages/reference-neo/benchmark/reports/latest/`
  (exactly 2 tracked files in that dir: report.md +
  result.json — both N4's run output).
- Stray check: zero `/tmp` references in any payload
  file (LOGs excluded); zero probe/scratch/debug
  files among the 153 untracked; no unintended files
  (see V2 NOT-payload list — the only non-Obj-1
  deltas are LOG-2/LOG-5/LOG.md + reports/latest).
- Mirror regen: verified by reading (tool + gitignore
  + status) per brief — NOT executed. Fresh tree
  regenerates via the documented command.
- FINDING (not blocking): working-tree mirror is
  stale by exactly Crew L's 1 line (`className:
  'summaryChip'` missing from mirrored SummaryChip —
  regen predates L). Harmless: the mirror un-commits
  at landing and regenerates with the fix; all proofs
  ran on this exact tree. Recommend a post-landing
  regen for hygiene before any further case runs.
- FINDING (not blocking): 2 stale D-OPEN-1 comments
  in spec sources (out of review write scope — doc
  files only): NEO-REF-02/specs/02-style-projection.
  spec.ts:23-24 and NEO-REF-03/specs/18-style-props-
  page.spec.ts:3-4. Captain may touch at landing or
  carry; specs themselves are green and unmodified.
- NOTE: bare `q` never covered case files
  (pre-existing gate shape — only `<group>/specs`
  dirs; ref nests specs per-case), and explicit
  dir-walk `q` trips on gitignored world output
  (pre-existing `.reference-ui` non-exclusion, same
  class as the fixed mirror flag). Neither blocks:
  authored files proven 0/0 by explicit file-list
  gate (V1). Carried as gate follow-up, not Obj 1
  scope.

### V5. README task (sole write) — DONE

All 4 stale D-OPEN-1 citations in *.md under
packages/reference-neo updated to resolved-with-outcome
(one line each: dup-StyleProps closure shape → RS
scoped-external-ref fix + single-root closure change →
26/26 green): tests/cases/ref/README.md:32,
NEO-REF-02/README.md:24, NEO-REF-03/README.md:13,
NEO-REF-01/README.md:16. No other prose touched.
D-OPEN-2 citation (NEO-REF-03:29) left — still open,
not stale. Case gate re-run after edits: 0/0/74.

## REVIEW DONE — VERDICT: LAND

LAND. Reasons: (1) all re-runs green with exact
numbers (26/26, q 0/16/192, tsc clean, 45/45 =
11+12+4+18, case files 0/0/74); (2) payload clean —
110+153 paths all belong, port rules 1–4 verified by
grep+read, RS 23 paths fix-only with test-pinned
en-route fixes, zero creep; (3) perf NO REGRESSION
confirmed — void discipline, scratch methodology,
band reasoning, bytes-identical evidence (both ends
parsed from disk), REF-11 ordering re-proven;
(4) landing checklist complete (un-commit command
verified, revert paths exact, stray check clean,
regen verified by reading); (5) READMEs current.
Two non-blocking findings filed above (mirror 1-line
staleness, 2 spec comments) — neither touches the
verdict. Captain's firsthand verification + single
landing commit (RS fix rides it, atomic) unblocked.

## Tick (captain, 2026-09-23)

Review crew `running`, freshly dispatched, no log section
yet — expected at this age, not deadlock. No ping, no
intervention. Landing follows the verdict + captain's
firsthand verification. Obj 2 implementation still held.

## LANDING — Objective 1 COMPLETE (captain, 2026-09-23)

Review verdict LAND accepted; captain's firsthand
verification (this tree, post-regen + comment touch):
agentneo run NEO-REF exit 0, 7/7 cases ok; bare q 0
errors / 16 warns / 192 files (exact match); tsc clean;
unit sweep 45/45; V2 probe holds firsthand (99/100/101,
P→99, zero ambiguity — its 2 "control FAIL" lines are the
probe's stale pre-closure expectations, confirming the
single-root change is live); tasty crate 75/0; enterprise
seed-7 N=5 median 929ms ([929,928,923,952,934], load-flat,
bytes 3.2 MiB/288.5 KiB rounded-match) — NO REGRESSION
firsthand. Honest note: exact-bytes capture of my own run
was lost to revert sequencing (reverted before reading
result.json — captain's error); verdict rests on my median
+ N4/P exact-bytes evidence on the same tree shape. The
enterprise bench was re-run firsthand after all — the hard
constraint deserved the captain's eyes, not just the
oracle's.
Landing mechanics: mirror regenerated (idempotent,
SummaryChip +className landed in-tree), 2 stale spec
comments touched (comment-only, oracle-flagged for the
captain — the 26/26 above proves behavior), reports/latest
reverted (never committed), mirror un-committed
(`rm --cached -r`, 38 staged deletions, living files
ignored on disk). Per Step-0 precedent (payload + master
docs ride; objective logs stay working papers): commit =
Obj-1 payload + LOG.md; LOG-1/2/5 stay uncommitted.
Port rules 1–4 verified by reviewers (grep + read);
perf law holds; seam written down (tool + docs).
Done criteria met: parity proven by cases (26/26
unmodified), no sync regression, no dead plan or
duplication, seam explicit. D-OPEN-1 CLOSED.
Carried (not landing): matrix oracle re-baselining
(Obj-2, mapped wall — HQ sub-verdict i), V17-letter
acceptance (HQ sub-verdict ii), D-OPEN-2 (RS clause
order), D-OPEN-4 (ct.ts → Obj-5), gate follow-up (case
coverage + world-output exclusion), secondary bench
deltas. Obj 2 implementation UN-HOLDS on this commit.

Landing commit: c62838b32 (257 files, +6492/−2213). Obj 2 implementation un-holds.
