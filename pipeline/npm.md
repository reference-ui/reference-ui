# NPM And Verdaccio Plan

## Goal

Use the pipeline-managed Verdaccio instance as the shared external package cache for matrix and downstream install flows, while keeping installs isolated and realistic.

This document answers the concrete questions behind that goal and turns them into a plan.

## Short Answer

Yes, Verdaccio can be used as a reliable external package cache for this pipeline.

But the reliable shape is specific:

- Verdaccio must be the only registry endpoint used by matrix consumers.
- Verdaccio storage must persist across normal runs.
- Verdaccio should be treated as a lazy caching proxy, not a full mirror.
- The pipeline should tune Verdaccio's metadata cache policy deliberately.
- The pipeline should separately optimize the container-side pnpm store.

The key limitation is also specific:

- Verdaccio cannot cache a package version before some client requests it.

So for unknown dependency trees, the first request for a previously unseen external package version still depends on npm being reachable.
After that first request, Verdaccio can serve the cached result from local storage across later runs.

## Questions And Answers

### 1. Can Verdaccio act as the shared external package cache for our matrix runs?

Yes.

That is already the model Verdaccio implements.

With a catch-all proxy rule, Verdaccio receives package requests from the consumer, proxies cache misses to npm, and stores the resulting metadata and tarballs locally.

For this repo, that means the existing registry shape is fundamentally correct.

### 2. Do we need a custom middleware layer because we cannot know the dependency tree ahead of time?

No, not as the first or likely best solution.

Verdaccio itself already is the middleware for unknown external dependencies.

That matters because the problem is not primarily request routing. The problem is cache durability, metadata TTL, and visibility into cache misses.

Adding another bespoke middleware layer in front of Verdaccio would mostly risk reimplementing behavior Verdaccio already provides:

- route unknown package requests
- proxy them to npm
- persist the results
- serve later requests locally

The better model is:

- all consumers talk only to Verdaccio
- Verdaccio dynamically learns the dependency tree through real requests
- the pipeline observes and preserves that cache over time

### 3. How does Verdaccio actually cache external packages?

Verdaccio has two separate cache layers.

#### Metadata cache

- package metadata is cached locally
- metadata freshness is controlled by the uplink `maxage`
- Verdaccio revalidates metadata after that freshness window passes

#### Tarball cache

- tarballs are stored locally on disk
- tarball caching is enabled by default for uplinks
- tarballs are cached lazily, only after a client requests them

This distinction matters because repeated installs may still cause metadata traffic even when tarballs are already cached.

### 4. Is the cache durable across restarts and separate runs?

Yes, if we keep Verdaccio's storage directory.

Verdaccio stores metadata and tarballs on disk, not only in process memory.

For this pipeline, the important consequence is:

- restarting Verdaccio is fine
- deleting the storage directory is what destroys the external package cache

### 5. Why can installs still feel slow even when Verdaccio is in front?

Because Verdaccio is only one layer in the install path.

There are three separate costs:

1. local package staging into Verdaccio
2. external package metadata and tarball serving through Verdaccio
3. consumer-side extraction and reuse inside the pnpm store

So even if Verdaccio has the package, installs can still spend time on:

- metadata resolution for semver ranges
- the first local pnpm-store population in a fresh container cache
- large transitive trees for tooling packages
- fresh generated consumers with no lockfile

### 6. What is the biggest Verdaccio-specific issue in the current setup?

The default metadata freshness policy is too short to leave implicit.

Verdaccio's default uplink `maxage` is 2 minutes.

That means repeated isolated installs can still revalidate metadata against npm frequently even when tarballs are already cached locally.

This is not a reason to reject Verdaccio.

It is a reason to configure Verdaccio intentionally for pipeline use.

### 7. Can Verdaccio guarantee zero npm traffic for unknown dependency trees?

No.

If a package version has never been requested before, Verdaccio must still go upstream on that first miss.

So Verdaccio gives us:

- strong reuse for already-seen versions
- durability across runs
- better resilience when npm is flaky for previously seen versions

It does not give us:

- omniscient prepopulation of unknown versions
- a full mirror of npm without explicit separate mirroring work

### 8. Should we add a warmup step?

Maybe, but it is not the first answer.

Warmup helps with first-hit latency, especially for known fixture dependency sets or highly repeated dependency graphs.

But it does not solve the core unknown-tree problem by itself.

The first answer is still:

- route everything through Verdaccio
- preserve the cache
- tune `maxage`
- measure cache misses

Warmup becomes useful after that baseline is in place.

## Concrete Decisions

### Decision 1. Verdaccio remains the single registry boundary

All matrix consumers should continue to install only through the pipeline-managed Verdaccio instance.

No container should fall back directly to npm.

### Decision 2. We will not build a bespoke pre-Verdaccio middleware layer

The dependency tree being unknown is not enough reason to add a new middleware layer.

Verdaccio already handles unknown dependencies by design.

If we later need more observability or special caching behavior, we should first prefer:

- Verdaccio configuration changes
- pipeline-owned instrumentation
- pipeline-owned warmup or cache policy steps

before inventing a second registry-like layer.

### Decision 3. Verdaccio storage should be treated as valuable cache state

Normal pipeline operation should preserve the Verdaccio storage that contains external package cache state.

If we want destructive cleanup, it should be explicit and clearly stronger than routine cleanup.

### Decision 4. We should set uplink `maxage` explicitly

We should not rely on Verdaccio's default 2-minute metadata TTL.

For pipeline use, an explicit value such as `30d` is more aligned with repeated isolated installs and shared local cache reuse.

The exact value should be a policy choice, not an accident.

### Decision 5. Verdaccio cache and pnpm-store cache are separate concerns

We should not judge Verdaccio only by pnpm's `reused` output.

Verdaccio reduces upstream registry work.

The pnpm store reduces consumer-side re-download and re-extraction work.

Both matter. Neither replaces the other.

## What This Means For The Pipeline

### Current state

The current pipeline already does the important routing step correctly:

- matrix consumers install through Verdaccio, not directly through npm
- Verdaccio is configured with a catch-all `proxy: npmjs`
- Verdaccio storage is persisted on disk

### Missing state

What is still missing is operational clarity:

- explicit metadata cache policy
- explicit cleanup policy for external cache durability
- visibility into cache hits versus upstream fetches during testing
- separate tuning of the pnpm-store cache key

## Implementation Plan

### Phase 1. Make the current Verdaccio cache reliable on purpose

Work:

1. Set `uplinks.npmjs.maxage` explicitly in the Verdaccio config.
2. Document that Verdaccio is the single registry boundary for matrix consumers.
3. Confirm that routine cleanup does not destroy useful external cache state unless explicitly intended.

Outcome:

- Verdaccio becomes a deliberately configured shared external cache, not an accidental one.

### Phase 2. Add observability

Work:

1. Capture whether matrix installs caused Verdaccio uplink traffic.
2. Distinguish local-cache reuse from upstream fetches in logs or diagnostics.
3. Inspect storage growth over repeated runs.

Outcome:

- we can measure whether Verdaccio is actually helping
- we can see whether misses are mostly first-time unknown versions or repeated metadata revalidation
- this observability remains testing-focused rather than a permanent production-style telemetry requirement

### Phase 3. Improve consumer-side reuse separately

Work:

1. Revisit the Dagger `/pnpm/store` cache key.
2. Make it reflect the actual generated consumer dependency shape more closely.
3. Avoid tying all external dependency reuse to the entire local registry manifest if that proves too volatile.

Outcome:

- repeated isolated installs pay less consumer-side setup cost even when Verdaccio is already doing its job

### Phase 4. Consider warmup for known hot paths

Work:

1. Identify repeated fixture dependency sets.
2. Prime Verdaccio for known hot dependencies when that materially reduces first-hit latency.
3. Do not depend on warmup as the only caching strategy.

Outcome:

- first-hit latency becomes more predictable for common test flows

## Recommended Order

1. Set an explicit Verdaccio `maxage`.
2. Preserve the Verdaccio storage by default.
3. Add testing-focused instrumentation for uplink fetches versus local reuse.
4. Revisit the pnpm-store cache key.
5. Add warmup only for repeated hot dependency sets if needed.
6. Consider generated lockfiles later if range resolution remains too noisy.

## Risks And Constraints

### Risk 1. Unknown first-time versions still depend on npm

This is inherent to the lazy proxy model.

### Risk 2. Overly aggressive `maxage` can make metadata less fresh

That is usually acceptable for a local test pipeline, but it is still a tradeoff.

### Risk 3. Over-sharing the pnpm store can hide correctness issues

The pnpm-store cache should be tuned carefully so it improves speed without causing stale or misleading installs.

### Risk 4. Cleanup policy can destroy the external cache accidentally

If cleanup wipes the Verdaccio storage too often, the whole shared external cache story becomes much weaker.

## Final Answers

### Can we use Verdaccio as an external package cache reliably?

Yes.

Reliable here means:

- for already-seen external package versions, Verdaccio can serve them from local persisted storage across repeated runs and restarts
- for previously unseen versions, the first request still depends on npm

### Do we need custom middleware because the dependency tree is not known ahead of time?

No.

Verdaccio already is the middleware for unknown external dependency requests.

### What should we actually do next?

1. Configure Verdaccio intentionally for pipeline use.
2. Preserve its storage by default.
3. Measure cache misses and upstream fetches during testing.
4. Optimize the pnpm-store layer separately.
5. Add targeted warmup only if the data says first-hit latency is still a problem.