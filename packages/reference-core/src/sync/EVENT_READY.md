# Event Ready Notes

This note captures the design pressure around `ready` events in the sync
pipeline, the failed approaches we tried, and the top-level goal for the sync
module.

## Top-Level Goal

The sync layer should describe the build pipeline in domain terms, not in worker
boot-order terms.

That means `sync/events.ts` should read like:

- source changes become virtual sync work
- virtual outputs trigger config and reference work
- config completion triggers Panda work
- Panda output plus reference output trigger packager work
- packager-ts completion marks sync completion

In other words, high-level orchestration should answer:

"What work depends on what work?"

It should not have to answer:

"Has worker X finished subscribing yet?"

## The Problem With `ready`

`ready` started as a practical way to avoid dropping events while workers were
still spinning up. A worker would:

1. install its `on('run:*', ...)` handlers
2. emit `*:ready`
3. return `KEEP_ALIVE`

Then sync would gate real work behind those `*:ready` events.

That works, but it leaks startup mechanics into the orchestration layer. Once
the high-level event graph has branches like:

- wait for `system:config:ready`
- wait for `reference:ready`
- wait for `packager:ready`

the sync module is no longer only describing the pipeline. It is also
describing worker boot order.

That makes the graph harder to read, harder to reason about, and easier to
break when adding workers.

## What We Learned

### 1. `onceAll()` was not enough

The first instinct was to compose with `on(...)` and `onceAll(...)`.

That fell down on a real edge case: prerequisite events may fire before another
worker becomes ready. In that situation, simply registering `onceAll(...)`
after a `ready` event misses earlier completions.

So plain composition like:

```ts
on('packager:ready', () => {
  onceAll(['system:panda:codegen', 'reference:complete'], () => {
    emit('run:packager:bundle')
  })
})
```

is not safe. It listens too late.

### 2. The real abstraction was a gate

The orchestration problem was not "wait for two events once".

It was:

- do not emit until startup is safe
- remember prerequisite completions that happened before that point
- after emitting once, wait for a fresh set of prerequisites

That is a gate with memory, not a simple one-shot combinator.

### 3. A better callsite still did not solve the real problem

We tried improving readability with helper shapes like:

- `forMatchedPair(...)`
- `emitWhenReadyPerPair(...)`
- `onReady(..., combineTrigger(...))`

Those improved the callsite, but they still encoded startup coordination in
`sync/events.ts`.

So they were nicer syntax around the same underlying leak.

### 4. The startup problem belongs below sync

The important realization was that worker readiness is not really a sync
concern. It is a thread-pool / worker-runtime concern.

If all started workers are known to be ready before the first pipeline trigger
fires, then `sync/events.ts` can shrink back down to real pipeline edges.

That is the main design direction.

## Current Desired Shape

The desired shape is:

1. thread-pool owns worker startup coordination
2. workers report native startup readiness to the pool/runtime
3. there is one global startup barrier, conceptually `workers:ready`
4. sync starts real work only after that barrier
5. after startup, sync only deals in semantic events

So the split becomes:

- thread-pool / worker runtime: "is the system subscribed and safe to start?"
- sync: "what should happen next in the build graph?"

## What Should Stay In Sync

Even after startup readiness is centralized, there are still real pipeline
guards that belong in sync:

- `virtual:complete -> run:system:config`
- `virtual:complete -> run:reference:build`
- `system:config:complete -> run:panda:codegen`
- `system:panda:codegen + reference:complete -> run:packager:bundle`
- `packager-ts:complete -> sync:complete`

And there is one especially important completion guard in
`sync/complete.ts`:

- wait for `packager:complete`
- then wait for the subsequent `packager-ts:complete`

That guard is not a startup concern. It protects against stale catch-up type
generation in watch mode and must remain even if worker readiness is redesigned.

## Trials And Errors

### Trial: per-worker `ready` directly in sync

Pros:

- simple to make work
- explicit

Cons:

- leaks worker boot order into high-level orchestration
- scales poorly as more workers are added
- makes the event DSL harder to read

### Trial: prettier DSL helpers around `ready`

Pros:

- cleaner callsites
- reduced inline state management

Cons:

- still fundamentally sync-owned startup coordination
- hides complexity rather than relocating it

### Trial: startup barrier in sync

Pros:

- better than per-edge readiness checks
- collapses many `*:ready` dependencies into one wait

Cons:

- still leaves sync as the source of truth for which workers count
- duplicates knowledge that thread-pool already has when starting workers

### Preferred direction: native barrier in thread-pool

Pros:

- source of truth comes from actual `runWorker(...)` calls
- sync no longer needs to know worker membership
- startup coordination and work orchestration are separated cleanly

Cons:

- requires a small runtime protocol between workers and the pool
- needs careful test coverage to avoid startup deadlocks

## Guiding Principle

If a concept exists only to ensure event listeners are installed, it should live
below the pipeline DSL.

If a concept describes actual build work or actual build completion, it belongs
in sync.

That is the boundary this folder should aim to preserve.
