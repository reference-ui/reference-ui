# lib release readiness

## Question

Is `src/lib`, taken as a group, ready to ship inside a full Reference UI
release?

## Answer

Partially.

Some `lib` modules already look solid enough as internal infrastructure.
Others are still below the release bar described in
`packages/reference-core/TEST_RELEASE_PLAN.md`, mainly because they do not have
enough direct tests for their failure and lifecycle contracts.

## Current judgment by module

- `fragments`: yes
- `run`: yes
- `log`: yes, low-risk internal helper
- `event-bus`: not yet
- `microbundle`: not yet
- `paths`: not yet
- `thread-pool`: not yet
- `child-process.ts`: not yet

## Why the overall answer is not yet "yes"

The weak spots are exactly the kinds of infrastructure that can make the whole
product feel unreliable when they regress:

- worker orchestration
- bundling helpers
- path resolution
- cross-thread messaging
- process spawning

These are high-leverage internals. Even when their code is small, they need
direct contract tests to justify a release-ready label.

## Practical conclusion

`src/lib` is worth cataloging now, but it should be treated as a mixed-status
area rather than a uniformly release-ready one.
