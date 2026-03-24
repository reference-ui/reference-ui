# Performance analysis: `dev:lib` / sync startup

## Scope

This note analyzes the `dev:lib` startup log captured on `packages/reference-lib` and the current sync orchestration in `packages/reference-core/src/sync/events.ts`.

Questions to answer:

- Why is startup slow?
- Are we thrashing events?
- How much of the slowdown is `tsup`?

## Short answer

- The startup is slow primarily because **TypeScript declaration generation dominates the wall clock**.
- The top-level sync event graph is **not broadly thrashing** during initial startup.
- The original warm-start duplication in `packager-ts` has now been reduced: the stale worker-side runtime catch-up request is gone, the runtime DTS phase is limited to `@reference-ui/react` and `@reference-ui/system`, and the final DTS phase is limited to `@reference-ui/types`.
- Even after that improvement, the remaining startup cost is still mostly **spawning and waiting for `tsup` child processes**.

## What the startup is doing

The sync graph in `packages/reference-core/src/sync/events.ts` is roughly:

1.  Build the virtual workspace.
2.  Generate Panda config.
3.  Run Panda codegen.
4.  Package runtime libraries.
5.  Generate runtime declarations.
6.  Build reference output.
7.  Package final `@reference-ui/types` output.
8.  Generate final declarations.

That graph is mostly declarative and conservative:

- `forWorker(...)` buffers a single pending trigger until the worker is ready.
- `combineTrigger(...)` emits once per fresh set of prerequisite events.
- `afterFirst(...)` only starts watch-mode incremental behavior after initial startup.

That means the event topology itself is not obviously exploding into loops during initial boot.

## Updated timing after DTS dedupe

The latest startup trace is materially better.

Approximate startup timeline from the new log:

| Stage                       | Start        | End          | Duration                    |
| --------------------------- | ------------ | ------------ | --------------------------- |
| Virtual copy + config       | 23:25:00.199 | 23:25:00.354 | ~0.16s                      |
| Panda startup + codegen/css | 23:25:00.696 | 23:25:01.089 | ~0.39s                      |
| Runtime packaging           | 23:25:01.089 | 23:25:01.108 | ~0.02s                      |
| Runtime DTS                 | 23:25:01.108 | ongoing      | still the main visible cost |

What this confirms:

- The duplicate warm-start `runtime -> runtime -> final` pattern is no longer visible in the current startup trace.
- The non-DTS setup work is still comfortably sub-second.
- The next meaningful gains will come from reducing the cost of each remaining DTS phase, not from reworking the high-level sync bus.

## How much of this is `tsup`?

A lot. In this log, effectively **almost all of the wall time after the first second** is `tsup`.

The declaration compiler lives here:

- `packages/reference-core/src/packager/ts/compile/index.ts`

It currently does this for each package compile:

- creates a temporary directory
- creates a temporary `tsconfig`
- spawns `npx tsup ... --dts-only ...`
- waits for output
- copies the produced `.d.ts/.d.mts` file into the package output
- deletes the temp directory

The package installation path is:

- `packager/ts/run.ts`
- `packager/ts/install/packages.ts`
- `packager/ts/install/package.ts`
- `packager/ts/compile/index.ts`

The critical detail is that declaration generation is **per package**, not per phase as a single compiler invocation.

From the log, each pass is compiling:

- `@reference-ui/react`: ~5.4s to ~6.3s
- `@reference-ui/system`: ~1.6s
- `@reference-ui/types`: ~6.4s to ~6.6s

That gives a single full pass cost of roughly **13.5s to 14.5s**.

So:

- 1 full pass is already expensive.
- 2 or 3 passes make startup feel broken.

With the current DTS split, the intended steady-state startup is now:

- runtime DTS for `@reference-ui/react` + `@reference-ui/system`
- final DTS for `@reference-ui/types`

That is much better than the previous `runtime + runtime + final` behavior, but it still leaves startup bound by a handful of expensive `tsup` invocations.

## Are we thrashing events?

## High-level answer

- **Not in the main sync graph.**
- **Yes, in a narrower sense inside** `**packager-ts**` **request scheduling on warm startup.**

## Why the main graph does not look like the problem

From `sync/events.ts`:

- `virtual:complete` triggers config once.
- `system:config:complete` triggers Panda once per fresh completion.
- `system:panda:codegen` triggers runtime packaging once per fresh completion.
- `packager:runtime:complete` requests runtime DTS.
- `reference:complete` triggers final packaging once per fresh completion.
- `packager:complete` requests final DTS.

This is not a feedback loop by itself.

Also, the utilities in `sync/events.utils.ts` are intentionally count-based and one-way:

- `forWorker(...)` = buffer until ready
- `combineTrigger(...)` = one emit per fresh prerequisite set
- `afterFirst(...)` = ignore incremental triggers before the initial barrier

So the main orchestration is not the source of a storm on initial boot.

## Where duplication really happens

The duplication is in `packager-ts`.

Relevant files:

- `packages/reference-core/src/packager/ts/worker.ts`
- `packages/reference-core/src/packager/ts/orchestrator.ts`
- `packages/reference-core/src/packager/ts/run.ts`

### The warm-start catch-up path

When the `packager-ts` worker starts, it does this:

1.  emit `packager-ts:ready`
2.  check whether runtime bundle outputs already exist in `.reference-ui`
3.  if they exist, emit `packager-ts:runtime:requested`

That logic is here:

- `hasAllBundleOutputs(...)` in `packager/ts/worker.ts`
- followed by `emit('packager-ts:runtime:requested', {})`

This is effectively a **catch-up request**.

That is useful if the DTS worker restarts while the runtime bundle from the current session already exists.

But on `dev:lib` startup, if `.reference-ui` already contains outputs from a previous run, the worker can request a runtime DTS pass **before the current runtime packaging phase has even completed**.

### The current runtime bundle requests DTS again

Later, when the real runtime packaging phase completes, `sync/events.ts` does this:

- on `packager:runtime:complete`
- emit `packager-ts:runtime:requested`

So on a warm start, two runtime requests can exist:

- one from stale existing outputs on worker startup
- one from the actual runtime bundle completion for this sync run

### The orchestrator intentionally reruns for fresh requests

`packager/ts/orchestrator.ts` keeps counters:

- `runtimeRequestedCount`
- `finalRequestedCount`
- `runtimeCompletedCount`
- `finalCompletedCount`

If a fresh runtime request arrives while a runtime pass is already active, it **queues another runtime pass** after the first one finishes.

That behavior is explicitly tested in:

- `packager/ts/orchestrator.test.ts`

So the duplication is not accidental; it is currently the designed scheduling policy.

## What likely happened in the provided log

The provided log strongly suggests this sequence:

1.  `packager-ts` starts.
2.  Old runtime outputs already exist in `.reference-ui`.
3.  The worker emits a catch-up `packager-ts:runtime:requested`.
4.  Runtime DTS pass starts.
5.  The actual current runtime packaging finishes and emits another `packager-ts:runtime:requested`.
6.  The orchestrator queues another runtime DTS pass.
7.  During or after that, final packaging completes and emits `packager-ts:final:requested`.
8.  After the queued runtime pass finishes, the orchestrator runs the final DTS pass.

That yields:

- runtime DTS
- runtime DTS again
- final DTS

Which matches the observed **three declaration waves** in the log.

## What has been improved since that log

The DTS pipeline has since been tightened in two important ways:

- the worker-side warm-start catch-up `packager-ts:runtime:requested` was removed
- declaration package selection is now phase-specific:
  - runtime DTS builds `@reference-ui/react` and `@reference-ui/system`
  - final DTS builds `@reference-ui/types` only

That means the earlier “triple wave” explanation still describes the old trace correctly, but it is no longer the intended behavior of the current code.

## So are we thrashing events?

The most accurate answer is:

- **We are not broadly thrashing the sync event bus.**
- **We are thrashing declaration work because request-level scheduling allows stale warm-start runtime requests to stack with fresh runtime requests.**

That distinction matters because the fix is not “rewrite `sync/events.ts`.”  
The fix is “make `packager-ts` phase scheduling generation-aware and avoid duplicate work.”

## Other repeated work seen in the log

These show up, but they do not appear to be the dominant problem:

- `baseSystem` is written more than once.
- Panda reports two CSS extraction-related completions.
- Runtime package installation is repeated across phases as expected.

These are real repeated operations, but they are measured in milliseconds to low hundreds of milliseconds.  
They are not what turns startup into a 40+ second wait.

## Biggest bottlenecks, ranked

## 1\. Remaining DTS passes are still expensive

This is still the biggest problem by far.

Even after removing duplicate passes, the remaining declaration phases are still slow enough to dominate the entire boot sequence.

## 2\. Per-package `npx tsup` spawning

Each package compile is a fresh process:

- process spawn
- tsup boot
- tsconfig setup
- graph build
- emit
- teardown

Even with better event scheduling, the current model is still expensive because it serializes several independent `tsup` child processes.

## 3\. Runtime/package phase handoff is now leaner, but not enough

The runtime barrier exists to unblock the reference build.

That barrier now avoids compiling `@reference-ui/types`, which is good, but the remaining runtime declarations are still costly.

## 4\. Warm-start generation tracking is still a future hardening step

The worker-side stale catch-up request has been removed, which addresses the immediate duplication bug.

There is still a broader architectural distinction the system does not encode explicitly:

- “these outputs are from the current sync generation”
- “these outputs were left by a previous run”

That does not appear to be the main startup blocker anymore, but generation-aware scheduling would still make the pipeline more robust.

## What should be optimized first

## 1\. Replace per-package `tsup` invocations with a single multi-entry declaration build

This is now the best next fix.

Right now, each phase can still spawn separate `tsup` processes.
A replacement should aim for:

- one compiler process per phase, not one per package
- shared program graph / shared module resolution
- incremental reuse across phases or watch rebuilds
- explicit control over declaration emit paths

That is where a `tsdown`-style replacement makes the biggest sense.

## 2\. Add instrumentation to measure DTS phase cost directly

The latest trace is already enough to show that DTS is still the bottleneck, but better instrumentation would make the next optimization pass much easier to evaluate.

Useful counters per sync run:

- number of runtime DTS requests
- number of final DTS requests
- number of actual DTS passes executed
- number of `tsup` child processes spawned
- total time spent in DTS generation

## 3\. Add generation-aware scheduling as a hardening step

This is no longer the first or second thing to optimize, but it is still a good safety improvement.

Options:

- add a sync generation/build id and attach it to runtime bundle completion + DTS requests
- only allow catch-up if the runtime bundle was produced in the current generation
- or restrict catch-up to true worker-restart recovery paths in watch mode

## 4\. Coalesce watch-mode rebuild triggers

This is lower priority for the specific startup log, but likely useful later.

After `virtual:complete`, watch mode currently does:

- `virtual:fs:change` -> `run:system:config`
- `virtual:fs:change` -> `run:reference:build`

If a single source save produces multiple virtual FS events, you can get redundant incremental work.  
That is a separate watch-mode optimization and not the main startup problem shown here.

## Proposed target architecture for the DTS pipeline

If the plan is to replace `tsup`, the target should probably be:

1.  Keep the current sync topology mostly intact.
2.  Replace `compileDeclarations(...)` so it does not spawn `npx tsup` per package.
3.  Build declarations for multiple entry points in one process.
4.  Track build generations so stale `.reference-ui` outputs do not request fresh work.
5.  Teach the scheduler the difference between:
    - runtime-only declarations
    - final full declarations
    - watch-mode incremental declarations

That lets `sync/events.ts` stay declarative while the expensive work becomes much more deterministic.

## Recommended next steps

- Keep the current runtime/final DTS split in place.
- Prototype a single-process declaration builder as a `tsup` replacement.
- Add instrumentation that prints one summary block per sync run:
  - number of runtime DTS requests
  - number of final DTS requests
  - number of actual DTS passes executed
  - number of `tsup` child processes spawned
  - total time spent in DTS generation
- Add generation-aware scheduling only after the compiler-side bottleneck is better understood.

## Bottom line

The slowdown is **mostly not** the sync bus itself.  
The slowdown is **mostly**:

- the high fixed cost of spawning `tsup` repeatedly
- plus the fact that declaration generation is still the only meaningfully expensive part of startup

- The duplicate warm-start DTS work has been reduced, and startup is visibly better, but `dev:lib` will not feel fast until the DTS compiler path stops paying repeated `tsup` startup costs.
