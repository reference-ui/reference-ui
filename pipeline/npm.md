# NPM And Verdaccio Caching Plan

## Why This Exists

Matrix consumers already install from the pipeline-managed Verdaccio instance rather than talking to npm directly from inside each Dagger container.

That is the right shape.

The next problem is install latency for external dependencies such as `vite`, `vitest`, `react`, and their transitive trees.

We want many isolated matrix runs, but we do not want each isolated run to pay the full cost of resolving and downloading the same public npm packages over and over.

## Current Reality

The current pipeline already has the first half of the desired architecture.

## Verdaccio Source Findings

Looking at Verdaccio's actual implementation changes the recommendation in a few important ways.

### 1. Metadata cache and tarball cache are separate

Verdaccio does not treat npm proxying as one undifferentiated cache.

It has two distinct cache layers:

- package metadata cache
- tarball file cache

The metadata side is freshness-checked via the uplink's `maxage` window.

The tarball side is stored separately and reused when the file already exists locally.

That means a repeated install can still cause metadata traffic even when tarballs are already cached.

### 2. Metadata cache is time-based and revalidated

In Verdaccio's proxy implementation, uplinks default to `maxage: 2m`.

So by default, cached metadata is treated as fresh for only two minutes before Verdaccio rechecks the uplink.

That matters for our pipeline because matrix consumers are generated fresh and many dependencies are expressed as semver ranges.

Implication:

- exact tarballs may already be cached locally
- but metadata for ranges can still trigger periodic uplink revalidation

### 3. Tarballs are cached lazily, not proactively

Verdaccio does not prefetch tarballs just because an uplink exists.

The tarball is only written into local storage when a client actually requests it through Verdaccio.

Implication:

- Verdaccio can absolutely become the shared cache for external dependencies
- but only after at least one install or other tarball-fetching request has touched that exact package version

So if we want predictable first-run performance across many isolated matrix jobs, a separate warmup step is still relevant.

### 4. Tarball caching is enabled by default for uplinks

Verdaccio's uplink normalization sets `cache: true` by default when it is unspecified.

That is good news.

Our current pipeline config is already aligned with the behavior we want unless we explicitly disable uplink caching.

### 5. Cache state is durable on disk across restarts

With the local filesystem storage plugin, package metadata is stored as package JSON files and tarballs are stored as files under the storage directory.

That means the Verdaccio cache is not ephemeral process memory.

It persists across registry restarts and across normal pipeline runs as long as we do not remove the storage directory.

### 6. There is no built-in prewarm or mirror sync mode for this use case

From the code paths that matter here, Verdaccio behaves as an on-demand caching proxy.

That is useful, but it also means our desired "populate the shared cache before the test fanout starts" behavior is not something Verdaccio appears to provide for us automatically.

If we want prewarming, we will need to drive it from our pipeline.

### 1. Matrix consumers already install from Verdaccio

The matrix runner does this:

- builds and stages local workspace packages into the shared host Verdaccio registry
- binds that host Verdaccio instance into the Dagger graph as `http://registry:4873`
- runs `pnpm install --registry http://registry:4873` inside the container

So the container is already pointed at the private registry, not directly at `registry.npmjs.org`.

### 2. Verdaccio is already configured as a proxy for external packages

The current Verdaccio config already contains:

- an uplink named `npmjs` pointing at `https://registry.npmjs.org/`
- a catch-all package rule:

```yaml
'**':
  access: $all
  publish: $all
  unpublish: $all
  proxy: npmjs
```

That means external packages are already supposed to flow like this:

1. container asks local Verdaccio for `vite`, `react`, `vitest`, etc.
2. Verdaccio checks whether it already has the metadata and tarball content locally
3. if not, Verdaccio fetches from npm once through the uplink
4. Verdaccio stores that result in its own storage
5. later requests can be served from Verdaccio storage instead of going back to npm

### 3. Verdaccio storage is persistent on the host

The current config stores package data under:

- `pipeline/src/registry/.store/storage`

That storage survives normal pipeline runs.

It is only removed when we explicitly rebuild or clean the managed registry state.

### 4. There is a second cache layer: the container pnpm store

The matrix runner also mounts a Dagger cache volume at `/pnpm/store`.

That cache is separate from Verdaccio.

- Verdaccio cache answers registry requests faster
- pnpm store cache avoids re-downloading package tarballs into a fresh container filesystem

These layers help different parts of the install path.

## Important Distinction

There are three different things happening during a matrix install:

1. Local package staging
2. Registry metadata and tarball serving
3. Consumer-side package extraction into the pnpm store

Those three layers should not be conflated.

### Local package staging

This is our `@reference-ui/*` and selected fixture packages.

We build them, pack them, and publish them into Verdaccio ourselves.

### Registry metadata and tarball serving

This is where Verdaccio helps with external packages.

If a container asks for `vite@x`, Verdaccio can proxy that once and retain the result for later installs.

### Consumer-side pnpm store reuse

Even if Verdaccio already has `vite`, a fresh container may still need to populate its own `/pnpm/store` unless that store cache is reused.

So a fast Verdaccio does not automatically mean `pnpm` prints large `reused` counts.

It can still mean:

- less public network traffic
- fewer upstream registry round trips
- more stable installs across many isolated tests

## Why Installs Can Still Feel Slow

Even with Verdaccio proxying enabled, installs can still spend time on:

- metadata resolution for semver ranges like `^19.2.0`
- first-time downloads into the container-side pnpm store
- large transitive trees for dev tooling such as `vite` and `vitest`
- fresh consumer package generation without a lockfile

Right now the synthetic matrix consumer is generated from fixture package metadata and does not materialize a lockfile.

That means `pnpm` is free to resolve ranges through registry metadata during install.

Verdaccio can cache those metadata lookups and tarballs, but resolution work still exists.

There is another specific Verdaccio detail here: the default metadata freshness window is short.

So a busy matrix run can still see repeated metadata validation against npm even when the tarballs themselves are already sitting in Verdaccio storage.

## What We Want

We want one shared pipeline-local dependency source for external packages across many isolated matrix runs.

More concretely:

- every matrix container should talk only to the local Verdaccio instance
- Verdaccio should fetch external packages from npm at most once per needed version
- later matrix runs should reuse the cached external package content from Verdaccio storage
- container-side pnpm caches should also be reused where practical, but that is a separate optimization layer

## What Is Already Possible

The good news is that the basic Verdaccio behavior we want is already possible with the current architecture.

In principle, Verdaccio can already behave like the shared external dependency cache for all matrix containers.

That suggests the next work is not inventing the concept from scratch.

The next work is:

- making the behavior explicit
- deciding how durable we want the cache to be
- deciding whether to proactively warm it
- improving pnpm store reuse so that container installs benefit more visibly

## Working Hypothesis

The main remaining bottleneck is probably not that Verdaccio lacks proxy caching.

The more likely bottlenecks are:

- some runs still hitting npm because Verdaccio has not been warmed for those versions yet
- some runs revalidating metadata because Verdaccio's default uplink `maxage` is only two minutes
- pnpm store reuse being weaker or more volatile than expected across isolated matrix runs
- semver resolution happening repeatedly because the generated consumer has no lockfile

This should be validated with logs before deeper implementation work.

## Proposed Direction

Treat this as a two-layer optimization problem.

### Layer A: Verdaccio as the shared external package cache

Keep all matrix containers pointed exclusively at the pipeline Verdaccio.

Then improve how we use Verdaccio:

- confirm cache persistence across normal runs
- increase uplink `maxage` from the default if we decide that lower npm revalidation traffic matters more than ultra-fresh metadata
- avoid deleting the Verdaccio store except on explicit deep-clean flows
- add observability so we can tell whether a request was a Verdaccio cache hit or an uplink fetch
- consider proactive warmup for known external dependency versions

### Layer B: pnpm store reuse inside Dagger

Improve the consumer-side cache independently of Verdaccio.

That likely means revisiting the Dagger cache key for `/pnpm/store` so it reflects the external dependency graph we expect to install, not only the local registry manifest.

If the key churns whenever local package hashes change, we may be throwing away useful external package reuse.

## Concrete Options

### Option 1: Keep the current proxy model and add observability first

This is the lowest-risk first step.

Work:

- document that Verdaccio is already the sole registry for matrix containers
- add logging or metrics around Verdaccio uplink hits versus local hits
- inspect Verdaccio storage growth after repeated matrix runs
- verify whether repeated installs still contact npm for already-cached versions

Pros:

- minimal code churn
- validates the real bottleneck before changing behavior

Cons:

- may not materially speed up installs until later steps land

### Option 2: Add an explicit warmup phase for external dependencies

Build a preflight step that discovers external dependencies needed by:

- registry packages
- matrix fixtures
- generated consumers

Then ask Verdaccio for those exact versions before the main matrix fanout begins.

This is more relevant after reading Verdaccio's code because tarballs are cached lazily rather than proactively.

Possible warmup shapes:

- run a synthetic `pnpm install` against a warmup consumer
- run `npm view` or `npm pack` through Verdaccio for exact versions
- publish nothing, only force Verdaccio to cache upstream metadata and tarballs

Pros:

- first real matrix run after warmup becomes much more predictable
- helps when many isolated jobs start concurrently

Cons:

- need clear rules for which versions to warm
- semver ranges without lockfiles complicate deterministic prewarming

### Option 3: Generate a lockfile for matrix consumers

If we generate a lockfile for the synthetic consumer, `pnpm` can skip a large amount of range resolution work.

That would make both Verdaccio and the pnpm store more effective.

Pros:

- more deterministic installs
- fewer metadata-resolution surprises
- gives Verdaccio warmup a concrete version set instead of open-ended semver ranges

Cons:

- more pipeline complexity
- lockfile generation needs a stable ownership model

### Option 4: Rework the Dagger pnpm-store cache key

Today the cache key is derived from the staged local registry manifest.

That is good for tying the store to local artifact changes, but it may be too coarse or too volatile for external dependency reuse.

We may want a key composed from:

- matrix fixture dependency shape
- generated consumer package.json content
- maybe local registry manifest versions for only the packages the consumer actually installs

Pros:

- improves reuse even when containers remain isolated
- complements Verdaccio instead of replacing it

Cons:

- easy to get wrong and accidentally over-share stale state

## Recommended Order

The sensible order is:

1. Measure the current Verdaccio proxy behavior.
2. Raise Verdaccio uplink `maxage` intentionally instead of keeping the two-minute default by accident.
3. Confirm whether external packages are already being served from the Verdaccio store on repeated runs.
4. If Verdaccio caching works but installs are still noisy, improve pnpm store reuse.
5. If first-hit latency is still too high, add a warmup phase.
6. Consider consumer lockfile generation only if the first two layers are not enough.

## Practical Notes For Implementation

### Cache durability policy

We should decide whether `pnpm pipeline clean` is meant to:

- remove everything including external package cache
- or preserve the Verdaccio uplink cache by default and reserve full cache destruction for a stronger clean command

If external cache reuse is a first-class optimization, deleting it on routine cleanup may be too expensive.

### Registry ownership policy

We should keep one rule:

- matrix containers talk to Verdaccio only

No container should fall back directly to npm.

That keeps behavior observable and ensures all external dependency traffic can benefit from the same shared cache.

### Version identity for external packages

For external packages, version identity is enough.

If Verdaccio already has `vite@X`, `react@Y`, or `vitest@Z`, later runs should just reuse that stored artifact.

That matches the goal and does not require any custom packaging logic for third-party packages.

## Suggested Near-Term Work Items

1. Add a short note to the registry docs that Verdaccio already proxies external npm packages through the `npmjs` uplink.
2. Decide on an explicit uplink `maxage` for pipeline use instead of relying on Verdaccio's default two-minute metadata TTL.
3. Add instrumentation to distinguish Verdaccio local hits from uplink fetches during matrix installs.
4. Review whether the current Dagger `/pnpm/store` cache key is too tightly coupled to the full local registry manifest.
5. Decide whether `clean` should preserve external dependency cache by default.
6. Prototype a warmup step for the external dependency set used by `fixtures/install-test`.

## Questions To Answer Before Coding

1. Do we want the Verdaccio external cache to survive across days, or only within one local development session?
2. Should cache warmup be driven by fixture manifests only, or also by the dependency graphs of staged local packages?
3. Is the bigger pain point upstream npm traffic, or the time spent repopulating `/pnpm/store` inside isolated containers?
4. Do we want deterministic consumer lockfiles for matrix runs, or do we intentionally want fresh semver resolution as part of the test?

## Bottom Line

The architecture you want is already mostly present.

Verdaccio is already acting as the shared npm-facing layer, and it is already configured to proxy public packages.

The next step is to make that behavior measurable and durable, then decide whether the larger remaining win is:

- warming Verdaccio more aggressively
- reusing the Dagger pnpm store more effectively
- or stabilizing consumer resolution with lockfiles

This should stay in `registry/` and `testing/matrix/` ownership, not become a bespoke package mirror outside the existing pipeline boundary.