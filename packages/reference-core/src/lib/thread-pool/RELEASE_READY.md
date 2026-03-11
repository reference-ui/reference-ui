# thread-pool release readiness

## Verdict

Not release-ready yet.

## Why

`TEST_RELEASE_PLAN.md` explicitly calls worker orchestration and failure
propagation thin in `reference-core`, and this module is where that concern
starts.

This is not just a helper. It controls whether worker-backed phases behave
predictably, fail loudly, and recover cleanly.

## Missing confidence

- no direct tests for `initPool()` / `runWorker()` / `shutdown()`
- no direct tests for the "must call initPool first" contract
- no direct tests for manifest-to-path mapping
- no direct tests for worker failure surfacing
- no direct tests for rerun/recovery behavior after a failed worker
- no direct tests for memory logging lifecycle

## Practical judgment

The design is understandable, but this module is still below the release bar
because the dangerous parts are not pinned down by direct tests.
