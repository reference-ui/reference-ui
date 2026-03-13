# event-bus

Cross-thread event transport for `reference-core`.

This module wraps Node's `BroadcastChannel` and exposes a small typed event API:

- `emit()`
- `on()`
- `once()`
- `off()`
- `onceAll()`
- `initEventBus()`

## What it owns

- one shared `BroadcastChannel` instance for Reference UI events
- listener registration and cleanup bookkeeping
- typed event dispatch based on the central `Events` map
- optional debug logging of bus traffic

## What it does not own

- worker lifecycle
- event schema definitions
- persistence or replay
- delivery guarantees beyond what `BroadcastChannel` provides

## Notes

`initEventBus()` only enables debug logging. The event channel itself is created
eagerly and the other helpers can still be used without calling it.
