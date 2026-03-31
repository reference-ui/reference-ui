# event-bus

Cross-thread event transport for `reference-core`.

This module wraps Node's `BroadcastChannel` and exposes a small typed event API:

- `emit()`
- `on()`
- `once()`
- `off()`
- `onceAll()`
- `initEventBus()`

### Wire helpers (`channel/wire.ts`)

Same envelope shape as `emit` for any code that needs its **own** channel handle (e.g. log relay at shutdown):

- `createBusEnvelope(event, payload?)` — `{ type, event, payload }` for `postMessage`
- `parseBusMessage(data)` — structural check; `{ event, payload }` or `undefined`
- `openBusChannel()` — `new BroadcastChannel(BUS_CHANNEL_NAME)` (use when you must `close()` independently of `closeEventBus`)

## What it owns

- one shared `BroadcastChannel` instance for Reference UI events
- listener registration and cleanup bookkeeping
- typed event dispatch based on the central `Events` map
- global-debug logging of bus traffic with structured payload output
- the **wire format** (`BUS_CHANNEL_NAME`, `BUS_EVENT_ENVELOPE_TYPE`, helpers above)

## What it does not own

- worker lifecycle
- event schema definitions
- persistence or replay
- delivery guarantees beyond what `BroadcastChannel` provides

## Notes

`initEventBus()` only enables debug logging. The event channel itself is created
eagerly and the other helpers can still be used without calling it.
