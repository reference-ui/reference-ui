# watch release readiness

## Verdict

Not yet release-ready.

## Why

The `watch` module is small, but it sits at the front of the incremental update
loop.

Its contract is simple:

- detect file changes
- map them into `add` / `change` / `unlink`
- emit `watch:change` only for relevant source files

If that contract is wrong, incremental sync can silently miss changes, emit the
wrong event type, or keep downstream state stale even while the overall process
still looks alive.

## What is already strong

There is good downstream evidence that watch mode works in realistic flows.

Current downstream tests prove:

- app-level watch mode updates the virtual mirror after file edits
- broader end-to-end watch mode updates visible runtime styling after source
  edits

That is valuable because it exercises the watch module in the real pipeline
rather than only in isolation.

## What is still missing

By the standard in `TEST_RELEASE_PLAN.md`, this area still lacks the direct core
tests that would make the contract feel owned.

I did not find focused `reference-core` tests that directly verify:

- event mapping from parcel watcher events:
  `create -> add`, `update -> change`, `delete -> unlink`
- include glob filtering behavior
- `node_modules` ignore behavior
- repeated edits not creating stale or duplicated downstream events
- watcher error handling behavior
- worker startup and subscription contracts in isolation

This means the current confidence is mostly integration confidence rather than
fast module-level confidence.

## Practical judgment

`watch` is fine for ongoing internal development and dogfooding.

Its implementation is small and readable, and the downstream watch experience is
good enough that I would keep building on it. But I would not call it
release-ready yet, because incremental update bugs are exactly the sort of bugs
that can feel intermittent and expensive when they are only covered indirectly.

## What would change the verdict

I would be comfortable calling `watch` release-ready once `reference-core`
directly proves:

- watcher event mapping
- include and ignore filtering
- one stable watcher error-path contract
- one repeated-edit or rerun consistency contract

That would turn this from "seems to work in the full system" into "the module
explicitly owns its incremental update behavior."
