# E2E Matrix Plan

This document proposes a cleaner ownership model for the Playwright matrix.

The core shift is:

- fixture libraries stop being passive helper dependencies
- fixture libraries become the scenario owners
- the pipeline generates the temporary consumer project around each fixture
- every matrix run installs real published-style packages into a clean container

That gives us a matrix that behaves like a downstream user project instead of a workspace-shaped test harness.

## Why Change It

Today, `packages/reference-e2e` owns too much environment construction.

The current prep flow already does several jobs at once:

- composes a sandbox per React x bundler entry
- writes package.json dynamically
- installs dependencies into each sandbox
- builds and syncs fixture libraries directly from the workspace
- runs `ref sync` inside the sandbox before Playwright starts

That works, but it mixes three separate concerns into one package:

- Playwright assertions
- scenario ownership
- environment orchestration

The result is that `reference-e2e` still behaves more like a bespoke integration harness than a real downstream consumer.

## Proposed Model

The new model is:

1. pipeline owns the matrix runtime
2. fixture libraries own the UI or logic under test
3. pipeline generates a temporary downstream app around each fixture
4. Playwright runs against that generated app inside a clean Dagger container

In practice, each test run becomes:

- pick a fixture library
- pick a matrix entry
- generate a tiny consumer app on the fly
- install real npm-style artifacts from the local registry
- run `ref sync` and the bundler in a clean container
- run Playwright assertions against the served app

That means the matrix itself becomes the downstream smoke test.

## Ownership Split

The intended ownership boundary should be:

- `fixtures/*`
  - own the scenario package
  - own the UI or logic being exercised
  - own any scenario-specific Playwright specs or exported helpers
  - declare whether they participate in the matrix
- `packages/reference-e2e`
  - keeps the Playwright runner, helpers, and assertion utilities
  - stops owning sandbox construction and ad hoc dependency installation
- `pipeline/`
  - owns matrix discovery
  - owns generated consumer project creation
  - owns container setup
  - owns Verdaccio-backed installation flow
  - owns artifact and log collection

This keeps Playwright focused on behavior and moves environment orchestration into the pipeline where it belongs.

## Fixture Contract

Each fixture library should become a scenario package.

Minimum shape:

- `package.json`
- `ui.config.ts` or config fragments the scenario needs
- scenario source files
- optional Playwright specs or test helpers
- `matrix.json`

Recommended first `matrix.json` shape:

```json
{
  "matrix": true
}
```

That is intentionally tiny.

It answers one question only:

- should this fixture participate in the generated downstream matrix?

We can extend the schema later if needed, for example with:

- custom app entry template
- bundler exclusions
- React version exclusions
- fixture-specific setup hooks

But phase one should keep the contract minimal.

## First Scenario: `smoke`

Yes.

One of the first fixture scenarios should just be `smoke`.

The first concrete package for that direction is `@matrix/install`.

Its job is not to test a rich UI surface.

Its job is to prove the minimum downstream contract:

- a generated consumer app can install the packaged modules
- `ref sync` can run inside a clean container
- the chosen bundler can start
- Playwright can load the page and observe a minimal success condition

That makes `smoke` the thinnest valid downstream scenario.

It should use the smallest useful config:

- minimal `ui.config.ts`
- minimal app entry
- minimal rendered component tree
- no extra fixture complexity unless it is required to prove install plus boot plus render

In other words, `smoke` becomes the matrix-native replacement for the current standalone downstream smoke idea.

The distinction is:

- old model: one special downstream smoke script outside the matrix
- new model: `smoke` is just another fixture scenario, so it runs through the exact same generated-project and container pipeline as every other scenario

That is better because the simplest scenario now validates the same infrastructure path as the richer scenarios.

### What `smoke` should prove

The first version should prove only the critical path:

1. install `@reference-ui/core` and any other required packaged dependencies from the local registry
2. install React and bundler dependencies for the selected matrix entry
3. run `ref sync` successfully in the generated consumer app
4. start the dev server successfully
5. load the page in Playwright
6. assert a minimal rendered marker and one generated output marker

Good examples of assertions:

- the page renders known text such as `Reference UI smoke`
- a generated `.reference-ui` output expected for the scenario exists
- a basic style or token-driven value resolves correctly

Bad examples for `smoke`:

- lots of fixture-owned behavior
- large scenario-specific token systems
- complex component assertions that belong in richer fixtures

### Why start with `smoke`

`smoke` should be the first scenario migrated because it gives the cleanest signal.

If `smoke` fails, the infrastructure is wrong.

That usually means one of these is broken:

- registry staging
- generated consumer app creation
- install flow
- `ref sync`
- bundler startup
- container isolation assumptions

That is exactly the failure surface we want to isolate before we layer richer fixture scenarios on top.

## Generated Consumer Project

The generated app should be temporary and disposable.

Pipeline creates it on the fly for each fixture x matrix entry.

The generator only needs to write the files that make the scenario runnable:

- `package.json`
- `tsconfig.json`
- bundler config for the selected matrix entry
- `index.html` when needed
- app entry file
- `ui.config.ts` bridge file if the fixture exports config fragments instead of a complete config

The important point is that the fixture does not need to pretend to be a full hand-authored app anymore.

The fixture owns the interesting behavior.

The pipeline-owned generator owns the boring shell.

## Artifact Model

The matrix should consume the same artifact boundary we already started building for the local registry.

That means the matrix installs:

- packaged `@reference-ui/*` artifacts from the pipeline-managed local registry
- packaged fixture libraries from the same local registry
- React and bundler dependencies declared by the generated consumer app

That gives us two important properties:

1. the test environment sees publish-style package metadata, not workspace links
2. fixture scenarios are exercised the same way a real downstream app would consume them

This is the key reason the downstream smoke script becomes redundant over time.

If every matrix project is already a real downstream install flow, then a separate downstream smoke script is just a thinner duplicate of the same guarantee.

## Dagger Guarantees

The matrix should lean hard on Dagger for environment guarantees.

Each matrix container should start with:

- a clean filesystem for the generated consumer project
- no pre-existing `node_modules`
- no Rust toolchain
- no hidden workspace links
- no dependency on host machine build outputs except the packed artifacts we explicitly mount or publish

What the container is allowed to receive:

- the generated consumer project files
- the pipeline-managed registry endpoint or exported tarballs
- the exact package artifacts we intend users to install
- Playwright browser binaries and the minimal runtime needed to execute tests

What the container should not rely on:

- workspace-level installs
- in-place fixture builds from the host repo
- `link:` dependencies to local package paths
- an ambient compiler toolchain that users would not have after `npm install`

This is the most important guarantee in the whole plan.

It forces the matrix to validate the real package boundary instead of silently depending on repo-local state.

## Matrix Axes

The first-class matrix should remain environment-oriented:

- React version
- bundler
- bundler version when relevant

Fixtures are not matrix axes.

Fixtures are scenario inputs.

So the runtime model becomes:

- environment matrix: React x bundler
- scenario set: every fixture with `matrix.json` set to `true`

The effective execution grid is the cross product:

- `environment entry x fixture scenario`

That is clearer than treating fixture use cases as hidden setup baked into one shared sandbox.

## Proposed Pipeline CLI Surface

The pipeline should expose a small testing-oriented CLI surface for this flow.

Illustrative shape only:

```sh
pnpm pipeline test matrix prepare
pnpm pipeline test matrix run
pnpm pipeline test matrix run --fixture @fixtures/extend-library
pnpm pipeline test matrix run --project react19-vite5
```

The underlying responsibilities would be:

- discover matrix-enabled fixtures
- generate a consumer app for each selected fixture x matrix entry
- ensure the local registry contains the required packages
- run install, sync, dev server, and Playwright inside Dagger
- collect logs, traces, screenshots, and HTML reports

`reference-e2e` should not own those orchestration steps anymore.

## Runtime Flow

One concrete run should look like this:

1. pack and stage publish-style `@reference-ui/*` packages into the local registry
2. pack and stage publish-style fixture libraries into the same registry
3. select a matrix entry and fixture
4. generate a temporary consumer project for that pair
5. start a clean Dagger container
6. point npm or pnpm at the local registry
7. install dependencies for the generated consumer project
8. run `ref sync`
9. start the chosen bundler dev server
10. run Playwright
11. collect artifacts

That flow is downstream-realistic and still keeps the fixture ergonomics high.

## React And Bundler Mirroring

Mirroring React and bundler packages into the local registry is a good optimization, but it should not be phase one.

Phase one goal:

- make the downstream package boundary real
- keep matrix execution clean and reproducible

Later optimization:

- pre-seed Verdaccio with the exact React and bundler versions used by the matrix
- reduce external fetches during test runs
- improve repeatability when offline or under flaky network conditions

That optimization fits naturally once the registry-backed matrix flow is already real.

## What Happens To `downstream-smoke.ts`

If this plan lands, `pipeline/src/downstream-smoke.ts` should stop being the long-term strategy.

Short term:

- keep it as a narrow, fast sanity check while the matrix migration is incomplete

Long term:

- retire it after the matrix installs real registry-backed artifacts in clean containers

The direct replacement should be the `smoke` fixture scenario described above.

At that point, every E2E run already proves the same downstream-install property, but with stronger scenario coverage.

## Migration Plan

### Phase 1: Make fixtures discoverable

- add `matrix.json` to each fixture scenario package
- define a tiny schema with just `matrix: true`
- add pipeline-side fixture discovery

### Phase 2: Move consumer generation into pipeline

- create a pipeline-owned generator for package.json and bundler config
- stop generating full sandboxes inside `packages/reference-e2e`
- keep `reference-e2e` test files intact

### Phase 3: Switch fixture installation to registry-backed packages

- stop relying on `link:` dependencies for fixture libraries in the E2E prepare flow
- install fixture packages from the local registry the same way we install real published packages
- make the generated app declare normal dependencies only

### Phase 4: Move matrix execution into Dagger

- one clean container per fixture x matrix entry
- no shared host `node_modules`
- no workspace-owned process lifecycle for the app under test
- artifact collection owned by pipeline

### Phase 5: Retire redundant local harness pieces

- shrink `reference-e2e/src/prepare/index.ts`
- remove environment construction from `reference-e2e`
- deprecate `downstream-smoke.ts` once the matrix proves the same guarantees

## Non-Goals

This plan should not try to solve everything at once.

Not phase one:

- mirroring the whole npm ecosystem into Verdaccio
- inventing a broad fixture metadata schema up front
- moving Playwright assertions out of `reference-e2e`
- supporting every possible framework before the current React x bundler matrix is clean

The real win is the ownership shift and the clean downstream boundary.

## Done When

We should consider this direction real when all of the following are true:

1. a fixture library can opt into the matrix with `matrix.json`
2. pipeline can generate a runnable consumer app for that fixture on the fly
3. the generated app installs `@reference-ui/*` and fixture packages from the local registry, not workspace links
4. each matrix run happens in a clean Dagger container with no ambient `node_modules` or Rust toolchain
5. Playwright still owns assertions, but no longer owns most environment setup
6. the downstream smoke script is no longer needed because the matrix already validates the downstream install boundary

## Recommendation

This is the right direction.

It simplifies the conceptual model:

- fixtures own scenarios
- pipeline owns environments
- Playwright owns assertions

And more importantly, it raises the quality bar:

- each E2E run becomes a real consumer install test
- the container starts clean
- the package boundary matches what users actually get

That is a better foundation than continuing to grow the current sandbox-preparation layer inside `reference-e2e`.