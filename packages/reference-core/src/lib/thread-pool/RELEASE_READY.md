# thread-pool release readiness

## Verdict

Release-ready for internal use.

## Why

`TEST_RELEASE_PLAN.md` explicitly calls worker orchestration and failure
propagation thin in `reference-core`, and this module is where that concern
starts.

This is not just a helper. It controls whether worker-backed phases behave
predictably, fail loudly, and recover cleanly, so it needed direct tests before
being considered ready.

That direct coverage now exists for:

- `initPool()` creating the pool once with shared `workerData`
- the "must call initPool first" contract
- `runWorker()` delegating payload and filename correctly
- rerun/recovery behavior after a failed worker task
- pool error-event logging
- startup / interval / shutdown memory logging lifecycle
- re-initialization after shutdown
- manifest-to-path mapping in `createWorkerPool()`
- direct-path worker execution in `createWorkerPool()`
- failure logging in the pool wrapper
- registry wiring from `workers.json`
- `workerEntries` generation for tsup

## Remaining limits

- broader operational confidence still depends on the worker modules themselves
- these tests mock Piscina rather than exercising real worker threads end to end

## Practical judgment

For its actual role as internal worker orchestration infrastructure, this module
is now solid enough to ship as part of Reference UI.
