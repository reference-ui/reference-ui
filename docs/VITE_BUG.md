# Vite HMR Bug

## Symptom

In Cosmos under Vite, editing a style prop in `packages/reference-lib/src/cosmos/HmrSmoke.fixture.tsx` such as:

```tsx
<Div color="red.600" />
```

did not visually update until a manual browser refresh.

The page was receiving file changes, but the actual HMR flush was not happening at the right time.

## Root Cause

The final live bug was in the Vite plugin lifecycle, not in Panda CSS generation itself.

In `packages/reference-core/src/vite/plugin.ts`, `configureServer()` started the sync-session watcher and then returned `stopWatchingViteSession`.

That was wrong for this plugin.

In practice, Vite invoked that returned function during server setup, which meant we were effectively tearing down our own sync-session bridge immediately after attaching it.

So the broken sequence was:

1. Vite server starts.
2. `configureServer()` attaches the session watcher.
3. The returned function is invoked during startup.
4. `stopWatchingViteSession()` runs immediately.
5. Later file changes still happen, but no session refresh callback survives to flush buffered writes.
6. The browser stays stale until a full refresh.

This matched the live debug logs exactly:

```text
configureServer
watchSyncSessionRefresh attach
stopWatchingViteSession
watchSyncSessionRefresh stop
```

The critical signal was that the stop happened at startup, before any real edit cycle.

## Exact Fix

The targeted fix was to keep the Vite-side session bridge alive for the lifetime of the dev server instead of returning it from `configureServer()`.

### Before

Conceptually, the plugin did this:

```ts
configureServer(devServer) {
  server = devServer
  startWatchingSyncSessionRefresh()
  return stopWatchingViteSession
}
```

### After

It now does this:

```ts
configureServer(devServer) {
  server = devServer
  startWatchingSyncSessionRefresh()
  void startWatchingManagedOutputs()

  if (!teardownRegistered) {
    teardownRegistered = true
    devServer.httpServer?.once('close', stopWatchingViteSession)
  }
}

closeBundle() {
  stopWatchingViteSession()
}
```

The behavior change is:

1. Do not return `stopWatchingViteSession` from `configureServer()`.
2. Register teardown on actual server shutdown with `httpServer.once('close', ...)`.
3. Also expose `closeBundle()` so tests and plugin shutdown can clean up explicitly.

## Why This Fixed The Browser

Once the watcher stayed alive, the already-buffered Vite HMR path could finally complete:

1. A project source edit or managed output write is buffered.
2. The sync session reaches a new `ready` signature.
3. `watchSyncSessionRefresh(...)` fires.
4. `flushManagedWrites()` runs.
5. `buildHotUpdatePayload(...)` resolves CSS and JS module updates.
6. Vite sends one native HMR payload.
7. The page updates without a manual refresh.

## Important Context: This Was The Final Fix, Not The Only Necessary Behavior

The lifecycle bug above was the last missing piece, but it sat on top of earlier behavior that is still probably correct and should not be thrown away casually.

These supporting changes matter:

### 1. Watch readiness must wait for both CSS and runtime packaging

File: `packages/reference-core/src/sync/watch-ready.ts`

Watch readiness now waits for both:

- `system:panda:css`
- `packager:runtime:complete`

That is necessary because consumers may load either:

- `.reference-ui/styled/styles.css`
- `.reference-ui/react/styles.css`

If ready fires before both are present, the browser can still refresh against stale output.

### 2. Vite must subscribe directly to managed output writes

Files:

- `packages/reference-core/src/vite/plugin.ts`
- `packages/reference-core/src/bundlers/output-subscription.ts`

Relying only on Vite `handleHotUpdate()` callbacks was not enough, because generated managed files under `.reference-ui` do not always arrive through the same source-module HMR path.

The plugin now also watches managed output writes directly and buffers them.

### 3. Project source-module HMR must also wait for sync ready

File: `packages/reference-core/src/vite/plugin.ts`

Vite source updates such as `src/cosmos/HmrSmoke.fixture.tsx` can happen before the generated CSS/runtime surfaces are safe.

So project source-module HMR is also buffered until the session emits a real ready edge.

## Minimal Functional Patch Set To Keep

If the goal is to roll back the debugging churn and keep only the real fix path, this is the smallest functional group I would preserve:

1. `packages/reference-core/src/sync/watch-ready.ts`
2. `packages/reference-core/src/session/init.test.ts`
3. `packages/reference-core/src/sync/complete.test.ts`
4. `packages/reference-core/src/bundlers/output-subscription.ts`
5. `packages/reference-core/src/bundlers/types.ts`
6. `packages/reference-core/src/vite/plugin.ts`
7. `packages/reference-core/src/vite/plugin.test.ts`
8. `packages/reference-core/src/webpack/types.ts`
9. `packages/reference-unit/tests/watch/helpers.ts`
10. `packages/reference-unit/tests/watch/watch.test.ts`

That is the behaviorally meaningful set:

- ready at the correct moment
- managed output writes captured
- source HMR deferred until ready
- Vite watcher lifetime fixed
- regression coverage for the above

## Likely Safe To Revert

These look like investigation scaffolding or unrelated side effects, not part of the targeted Vite fix itself:

1. temporary deep tracing added across session, sync, and Vite files
2. temporary bus logging control changes if they were only added to make traces readable
3. `packages/reference-lib/ui.config.ts` being forced to `debug: true`
4. temporary smoke-fixture wording tweaks made only for debugging
5. stray generated/debug artifacts such as `packages/reference-unit/.ref-sync-watch.log`

Separate decision:

- `packages/reference-lib/src/cosmos.decorator.tsx` is not part of the Vite fix. Keep or revert it based on whether you want the global Cosmos dark wrapper as an independent product change.

## Recommended Cleanup Strategy

Yes, I think the safe next step is to reduce this to a targeted patch set.

I would not roll back everything blindly, because the final lifecycle fix depended on earlier real behavior changes.

I would do this instead:

1. Keep the minimal functional patch set listed above.
2. Revert logging and debugging scaffolding.
3. Re-run the focused Vite/session tests.
4. Re-run the live Cosmos smoke repro.
5. Only then decide whether any of the earlier functional changes can also be simplified.

## How To Test

### Automated

Run the focused core tests:

```bash
pnpm --filter @reference-ui/core exec vitest run \
  src/vite/plugin.test.ts \
  src/session/public.test.ts \
  src/session/init.test.ts \
  src/sync/complete.test.ts
```

What these are proving:

1. Vite buffers managed writes and flushes them only after session ready.
2. Vite buffers project source-module HMR until session ready.
3. Watch readiness does not fire until both Panda CSS and runtime packaging complete.

### Manual Live Repro

Because `@reference-ui/core` is consumed from built dist, rebuild core first:

```bash
cd packages/reference-core
pnpm exec tsup
```

Then run the lib dev server from repo root:

```bash
pnpm dev:lib
```

Open the Cosmos HMR smoke fixture and edit:

`packages/reference-lib/src/cosmos/HmrSmoke.fixture.tsx`

Recommended edits:

1. change `color="red.300"` to `color="red.600"`
2. change visible text in the fixture

Expected result:

1. the preview updates without a manual refresh
2. style changes are visible immediately after save
3. no stale old CSS remains on screen

### Manual Regression Checklist

After cleanup, verify all of these still hold:

1. source-only edit updates without full refresh
2. style-prop edit updates without full refresh
3. generated CSS changes under `.reference-ui/styled/styles.css` are reflected
4. runtime CSS copy under `.reference-ui/react/styles.css` is also reflected
5. repeated edits do not stop working after the first update

## Short Version

The exact fix was: stop returning `stopWatchingViteSession` from `configureServer()` in the Vite plugin, and instead tear it down only on real server shutdown.

That kept the sync-session watcher alive long enough for the ready edge to flush buffered HMR writes, which is why the browser finally updated correctly.