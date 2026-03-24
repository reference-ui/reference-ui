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
- There **is** one important request-level duplication in `packager-ts`: on a warm start, the worker can request a runtime DTS pass from stale existing outputs, and then request another runtime DTS pass again when the current runtime bundle finishes.
- In the captured run, almost all visible startup time is spent spawning and waiting for `tsup` child processes.

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

## Timing breakdown from the provided log

Approximate startup timeline:

| Stage                       | Start        | End          | Duration                                    |
| --------------------------- | ------------ | ------------ | ------------------------------------------- |
| Config generation           | 22:48:58.985 | 22:48:59.105 | ~0.12s                                      |
| Panda startup + codegen/css | 22:48:59.455 | 22:48:59.851 | ~0.40s                                      |
| Runtime packaging           | 22:48:59.871 | 22:48:59.891 | ~0.02s                                      |
| DTS pass 1                  | ~22:48:59.89 | 22:49:13.390 | ~13.5s                                      |
| Reference build             | ?            | 22:49:14.664 | completes while DTS work is still happening |
| DTS pass 2                  | 22:49:13.390 | 22:49:27.780 | ~14.4s                                      |
| DTS pass 3                  | 22:49:27.781 | 22:49:42.239 | ~14.5s                                      |
| Total visible startup       | 22:48:58.985 | 22:49:42.239 | ~43.3s                                      |

Important observation:

- **Everything before declaration generation finishes in under 1 second.**
- The remaining ~42 seconds are almost entirely the declaration pipeline.

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

- `@reference-ui/react`
- `@reference-ui/system`
- `@reference-ui/types`

And each of those is its own `tsup` child process.

Observed per-package times in the log are roughly:

- `@reference-ui/react`: ~5.4s to ~6.3s
- `@reference-ui/system`: ~1.6s
- `@reference-ui/types`: ~6.4s to ~6.6s

That gives a single full pass cost of roughly **13.5s to 14.5s**.

So:

- 1 full pass is already expensive.
- 2 or 3 passes make startup feel broken.

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

## 1\. Multiple full DTS passes

This is the biggest problem by far.

A single pass is already ~14s.  
Three passes make startup ~40s.

## 2\. Per-package `npx tsup` spawning

Each package compile is a fresh process:

- process spawn
- tsup boot
- tsconfig setup
- graph build
- emit
- teardown

Even with perfect event scheduling, the current model is still expensive because it serializes several independent `tsup` child processes.

## 3\. Runtime pass compiling packages that are only needed in the final phase

The runtime barrier exists to unblock the reference build.  
That barrier fundamentally needs the runtime package declarations.  
It does **not** need the final `@reference-ui/types` package yet.

If runtime declaration generation includes `@reference-ui/types`, that is extra work on the critical path.

## 4\. Warm-start ambiguity between stale outputs and current-generation outputs

The worker currently cannot distinguish:

- “these outputs are from the current sync generation”
- “these outputs were left by a previous run”

Without that distinction, the catch-up logic is prone to requesting unnecessary DTS work.

## What should be optimized first

## 1\. Stop warm-start catch-up from forcing an extra runtime DTS pass

Best next fix.

Options:

- add a sync generation/build id and attach it to runtime bundle completion + DTS requests
- only allow catch-up if the runtime bundle was produced in the current generation
- or restrict catch-up to true worker-restart recovery paths in watch mode

This should remove the `runtime -> runtime -> final` pattern on warm startup.

## 2\. Keep runtime DTS strictly runtime-only

The runtime phase should only compile what the reference build actually needs:

- `@reference-ui/react`
- `@reference-ui/system`

The final phase can compile:

- `@reference-ui/react`
- `@reference-ui/system`
- `@reference-ui/types`

This shortens the critical path even before any larger compiler rewrite.

## 3\. Replace per-package `tsup` invocations with a single multi-entry declaration build

This is the largest structural win.

Right now, each phase can spawn several separate `tsup` processes.  
A replacement should aim for:

- one compiler process per phase, not one per package
- shared program graph / shared module resolution
- incremental reuse across phases or watch rebuilds
- explicit control over declaration emit paths

That is where a `tsdown`\-style replacement makes sense.

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

- Implement generation-aware `packager-ts` scheduling.
- Keep runtime declaration generation limited to runtime packages.
- Prototype a single-process declaration builder as a `tsup` replacement.
- Add instrumentation that prints one summary block per sync run:
  - number of runtime DTS requests
  - number of final DTS requests
  - number of actual DTS passes executed
  - number of `tsup` child processes spawned
  - total time spent in DTS generation

## Bottom line

The slowdown is **mostly not** the sync bus itself.  
The slowdown is **mostly**:

- duplicate declaration passes caused by warm-start request scheduling
- plus the high fixed cost of spawning `tsup` repeatedly

If you remove the duplicate runtime pass and replace per-package `tsup` spawns with a single multi-entry declaration build, `dev:lib` startup should drop dramatically.
