# log

Small internal console logger for `reference-core`.

This module centralizes plain info logging, colored error output, and
debug-only logging gated by `config.store`. On worker threads, logs are
forwarded to the main thread over a `BroadcastChannel` when the relay is
initialized.

Non-debug logs render with a branded colored pill by default. Callers can pass
`module`, `label`, and `badge` metadata through `emitLog(...)`, or keep using
the existing `log.*(...)` facade and start the first string arg with `[module]`
to promote that leading tag into a dimmed module label.

## Layout

| File | Role |
|------|------|
| `events.ts` | Shared types + `isLogEntryPayload` guard for `LogEntryPayload` |
| `serialize-args.ts` | Args safe for `postMessage` / display (errors, `inspect`, etc.) |
| `console-write.ts` | Timestamps, colors, and `console.*` output |
| `relay.ts` | `openBusChannel` + `createBusEnvelope` / `parseBusMessage` from `event-bus/channel/wire.ts` |
| `dispatch.ts` | Main-thread write vs worker forward |
| `index.ts` | `log` facade and public exports |

## API

- `log(...)`: plain console output
- `log.info(...)`: plain console output
- `log.error(...)`: red, stderr-focused error output
- `log.debug(module, ...)`: timestamped debug output when `config.debug` is on
- `emitLog(level, args, { module, label, badge })`: branded non-debug output with structured tags
- `warnRefSync(...)`: same warning styling as `log.warn`, without worker relay
- `initLogRelay()` / `closeLogRelay()`: main-thread relay for worker logs

## What it does not own

- File logging
- Log levels beyond the few helpers exposed here
