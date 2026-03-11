# event-bus release readiness

## Verdict

Not release-ready yet.

## Why

This module is small, but it is still under-proven for something that sits on a
cross-thread boundary.

`TEST_RELEASE_PLAN.md` calls out worker orchestration and failure propagation as
thin in `reference-core`, and this module sits directly in that risk area.

## Missing confidence

- no direct tests for `emit()` -> `on()` delivery
- no direct tests for `once()` cleanup behavior
- no direct tests for `off()` removing one listener vs all listeners
- no direct tests for `onceAll()` ordering behavior
- no direct tests for `initEventBus()` debug logging behavior
- no explicit contract for listener cleanup across repeated init/use cycles

## Practical judgment

The implementation is understandable and probably fine for internal iteration,
but it does not yet meet a strong release bar for infrastructure because its
behavior is not pinned down directly.
