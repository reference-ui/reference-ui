# Change Detection

This note captures the boundary for first-class state and change detection in
`ref sync`, especially in watch mode where external tooling such as Vite or
Webpack may need to react to a completed logical sync rather than to a noisy
stream of intermediate file writes.

## Top-Level Boundary

Users still run `ref sync`.

That should remain the primary entry point. The internal event bus stays an
implementation detail for `reference-core` workers. Vite and Webpack should not
subscribe directly to the internal sync bus or depend on internal worker event
names.

Instead, the public boundary should be:

- `ref sync` owns the pipeline and all internal worker orchestration
- `.reference-ui` owns the project-local session metadata needed by adjacent
  tooling
- bundler plugins attach to `.reference-ui` state for the current project
- plugins react to stable build lifecycle events, not raw file watcher noise

That gives us freedom to change internal worker wiring without breaking plugin
integration.

## What External Tooling Actually Needs

Bundlers do not need to know about every internal phase.

They need answers to a much smaller set of questions:

- is there an active `ref sync --watch` session for this project?
- which `.reference-ui` output tree does it own?
- has a new logical build completed?
- did the latest build fail?
- which generated outputs changed?

That means the external contract should be a coarse lifecycle protocol rather
than a mirror of the internal event graph.

## High-Level API

We should build a high-level API around this in `reference-core` so bundler
plugins do not each need to understand session files, lock ownership, or file
watch edge cases.

The intended consumption model is:

- Vite plugin imports a small helper from `@reference-ui/core`
- Webpack plugin imports the same helper from `@reference-ui/core`
- the helper lives in the user's installed `@reference-ui/core`
- the helper hides how `.reference-ui/session.json` is discovered and watched
- the helper exposes a small session API for dev-server integration

Conceptually, this should look like a session API, with `onRefresh` as one
hook on that session rather than as the entire API surface.

For example:

```ts
import { getSyncSession } from '@reference-ui/core'

const session = getSyncSession({
  cwd: process.cwd(),
})

const stop = session.onRefresh(event => {
  // Safe point for Vite/Webpack invalidation.
})
```

The exact signature can change, but the important part is the level of
abstraction. Plugin authors should consume one small helper instead of each
plugin reimplementing:

- nearest `.reference-ui` discovery
- session.json parsing
- file watching and debounce behavior
- stale session handling
- refresh gating rules

That keeps Vite and Webpack integrations easy to build and easy to maintain.

`getSyncSession` should not invent a separate transport abstraction first. It
should fundamentally be a wrapper around `.reference-ui/session.json` and the
file watching needed to observe it safely.

In other words:

- `.reference-ui/session.json` is the underlying source of truth
- `getSyncSession(...)` is the ergonomic API exposed by `@reference-ui/core`
- bundler plugins consume the wrapper, not the file format directly

The important shape is:

- one entry point that resolves the current Reference session for a given cwd
- a small set of high-level hooks on that session
- `onRefresh` as the hook for "safe to invalidate now"

That leaves room for additional hooks later if they are useful, for example:

- `onError`
- `getSnapshot`
- `dispose`

without making Vite/Webpack plugins each invent their own session layer.

## Session Module Boundary

This should live in a separate `session` module inside `reference-core`, with a
clean break from the rest of the sync internals.

Suggested shape in the source tree:

- `src/session/`
- `src/session/init.ts`
- `src/session/state.ts`
- `src/session/files.ts`
- `src/session/public.ts`

The point is not the exact filenames. The point is that session tracking should
be owned in one place instead of being smeared across `sync`, `watch`,
`packager`, and plugin code.

This likely does not need its own thread.

It is a coordination and state-publication concern, not a worker job. So it
should run on the main thread and be initialized from the main sync startup
path.

In practical terms, that means:

- session state is created and updated on the main thread
- `ref sync` initializes the session module during sync startup
- worker threads do not own session.json directly
- plugins observe the session module through `getSyncSession(...)`

## Minimal Integration Footprint

Changes outside the session module should stay very small.

That is important because this does not need to mutate the existing codebase
much.

The intended footprint outside `src/session/` should be minimal:

- one sync startup hook to initialize session tracking on the main thread
- one public export from `@reference-ui/core` for `getSyncSession`
- a very small number of calls from existing completion/failure points to mark
  session state transitions

That is the right boundary:

- most of the implementation lives inside the session module
- existing sync workers should not need to know session internals
- existing pipeline wiring should stay mostly unchanged

If this starts requiring broad edits across unrelated workers and modules, the
design is probably too invasive.

## Path-Scoped Session Model

The simplest model is to treat the `.reference-ui` folder itself as the
identity boundary.

If a plugin can reliably discover the nearest relevant `.reference-ui` folder,
then that path already answers most of the identity question:

- which generated tree belongs to this project
- which output directory the plugin should observe
- where session metadata and locks should live

That means we probably do not need a user-visible `instanceId` or `sessionId`
as the primary design.

The filesystem location can be the identity.

What still matters is not abstract identity, but liveness and ownership:

- is there an active writer for this `.reference-ui` tree?
- is the recorded state stale?
- has a logical build completed?

Those questions can be answered with file-based state plus process metadata.

## Recommended `.reference-ui` Metadata

`ref sync` should own a small manifest inside the generated output tree.

Suggested path:

- `.reference-ui/session.json`

Suggested shape:

```json
{
  "pid": 12345,
  "mode": "watch",
  "state": "ready",
  "startedAt": "2026-04-03T18:00:00.000Z",
  "updatedAt": "2026-04-03T18:00:05.000Z",
  "transport": {
    "kind": "socket",
    "endpoint": "..."
  }
}
```

That is probably enough if the plugin is already anchored to a concrete
`.reference-ui` path.

If we later discover a real need for a build token or restart token, we can add
one then. It does not need to be part of the first version.

## Why The Metadata Lives In `.reference-ui`

This matches how users already think about the generated system.

The plugin will typically be configured in the same context that already points
at `.reference-ui`, whether by aliasing, module resolution, or local generated
artifact discovery. That makes `.reference-ui` the natural place to publish
adjacent sync metadata.

Benefits:

- project-local and self-contained
- no machine-global registry required
- easy for plugins to discover deterministically
- safe for multiple unrelated projects on the same machine
- packageable as part of `reference-core`

## Cross-Platform Constraint

The design must work on macOS, Linux, and Windows.

That means the discovery and runtime protocol should avoid platform-specific
assumptions leaking into the external shape.

Recommended split:

- discovery: filesystem metadata in `.reference-ui/session.json`
- live event transport: platform-specific implementation hidden behind one
  transport field

For transport:

- Unix domain socket on macOS/Linux
- named pipe on Windows

The plugin should not care which one is used. It should only read the endpoint
declared in the session manifest.

## Why Not Expose The Internal Event Bus

The internal sync bus is the wrong boundary for bundlers.

Reasons:

- it describes worker orchestration, not external lifecycle
- it is too fine-grained and likely to churn
- it is not the abstraction a bundler actually wants
- it does not by itself solve attachment, discovery, or stale-session problems

Even if we keep improving the internal typed state machine, that should remain
private to `reference-core`.

## Private But Real

This mechanism can be packaged as part of `reference-core` without becoming a
promoted, user-facing product API.

That means:

- it exists because our own Vite/Webpack integrations need it
- it should be versioned and tested like a real internal protocol
- it does not need to be marketed or heavily documented in the main README
- we can keep the surface narrow and purpose-built

This is similar to an internal wire contract: real, stable enough for our own
consumers, but not something we encourage users to build directly against.

## Concurrency: Two `ref sync` Processes

There are two different problems here.

### Different projects

No special issue if each project has its own `.reference-ui` tree and its own
session manifest.

### Same project, same `outDir`

This should be treated as a conflict.

The core problem is not event identity. It is concurrent writers targeting the
same generated output tree.

So `reference-core` should also own a lock file, for example:

- `.reference-ui/session.lock`

That lock should record at least:

- `pid`
- `startedAt`

Optionally it can also record the transport endpoint if that helps stale-state
cleanup, but the lock does not need a separate identity token to do its job.

Startup policy:

- if another live process already owns the same `.reference-ui` tree, fail fast
- if the lock is stale, reclaim it
- if users truly need parallel sessions, they must use different output
  directories

This is the reliable boundary. Path ownership and writer exclusion matter more
than abstract ids.

## What Plugins Should React To

Plugins should react to a committed logical build boundary, not to individual
intermediate writes.

Suggested high-level lifecycle:

- `session:started`
- `build:started`
- `build:ready`
- `build:failed`
- `session:stopped`

`build:ready` should be the key moment for HMR invalidation.

That event should carry at least:

- a summary of changed generated outputs

If a plugin is already attached to a specific `.reference-ui` folder, the path
itself provides the context. The event payload can stay very small.

That lets bundlers produce one coherent client update per logical sync instead
of reacting to every filesystem write as the pipeline is still running.

## Session API Semantics

The session API should be the plugin-facing surface.

`onRefresh` is one method on that surface, not the whole abstraction.

That means the conceptual model is:

- `getSyncSession({ cwd })` finds and watches the relevant `.reference-ui`
- the returned session object exposes high-level hooks
- `onRefresh` is the main hook bundlers use for invalidation timing

Internally, that session handle should resolve through the separate session
module rather than being embedded directly inside sync orchestration code.

This is a better fit than exporting a bare `onRefresh(...)` function because it
keeps the design open for richer session operations without changing the mental
model later.

## `onRefresh` Semantics

`onRefresh` should mean:

- it is now safe for a dev server to invalidate and refresh once
- the generated runtime surface and CSS are coherent for this build
- intermediate writes for the same logical change have settled enough that a
  refresh will not cause an HMR storm

In practical terms, `onRefresh` should fire when:

- packaging is complete
- CSS output is complete

It should not wait for:

- `packager-ts`
- MCP generation

Those are longer-running processes and should not hold the dev server hostage
if the browser-visible generated surface is already ready.

This is the important API distinction:

- internal pipeline completion can continue beyond the point that a browser
  refresh is safe
- plugin refresh completion should be defined by "good to refresh now", not by
  "every background task has finished"

That matches the actual ergonomics Vite and Webpack need.

## State Model

Internally, the machine should explicitly model both session state and build
state.

Suggested session states:

- `starting`
- `watching`
- `stopping`
- `stopped`
- `failed`

Suggested build states:

- `idle`
- `queued`
- `running`
- `ready`
- `failed`

This gives us a place to assert legal transitions and makes illegal states much
harder to represent accidentally.

## Recommended Direction

The practical design is:

1. keep the internal event bus private
2. add explicit sync session and build state inside `reference-core`
3. implement that in a separate main-thread `session` module
4. persist a project-local `.reference-ui/session.json` manifest
5. treat the `.reference-ui` path itself as the primary identity boundary
6. expose a high-level helper from `@reference-ui/core` for bundler plugins
7. make that helper session-shaped rather than callback-shaped
8. define `onRefresh` as the safe dev-server refresh point
9. use `session.json` as authoritative state and filesystem events as wake-up
   signals
10. enforce one live writer per `.reference-ui` output tree with a lock file
11. keep code changes outside the session module intentionally minimal

That gives Vite and Webpack a reliable attachment point without turning the
entire sync pipeline into public API surface.

## Short Version

If plugins are going to live next to `.reference-ui`, then `.reference-ui`
should publish a small self-contained session manifest.

That manifest does not need to carry much identity if the plugin is already
anchored to the correct generated folder.

So the model should be:

- the `.reference-ui` path is the identity boundary
- `session.json` records current state and process ownership
- plugins consume a small session helper from `@reference-ui/core`
- that session exposes `onRefresh` for the safe refresh moment
- `reference-core` prevents concurrent writers to the same output tree

That is the boundary that is cross-platform, self-contained, and reliable
enough for adjacent bundler integrations.
