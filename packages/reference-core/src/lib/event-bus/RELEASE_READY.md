# event-bus release readiness

## Verdict

Release-ready for internal use.

## Why

This module is small, but it sits on a cross-thread boundary, so it needed
direct behavioral proof before being considered ready.

That proof now exists through direct tests covering:

- `emit()` message shape
- `on()` delivery from another `BroadcastChannel` instance
- `once()` single-fire cleanup behavior
- `off()` removing one listener vs all listeners
- `onceAll()` any-order coordination behavior
- `initEventBus()` message logging behavior, including local opt-out switch
- repeated `initEventBus()` calls not duplicating debug listeners

`TEST_RELEASE_PLAN.md` calls out worker orchestration and failure propagation as
thin in `reference-core`, but this module itself now has a direct contract suite
for its own core behavior.

## Remaining limits

- worker-level integration confidence still depends on the surrounding worker
  modules
- the bus is still an internal transport, not a hardened public API

## Practical judgment

For its actual role inside `reference-core`, this module is now solid enough to
ship as part of Reference UI.
