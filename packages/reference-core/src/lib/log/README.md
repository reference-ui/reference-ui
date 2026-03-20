# log

Small internal console logger for `reference-core`.

This module centralizes plain info logging, colored error output, and
debug-only logging gated by `config.store`. On worker threads, logs are
forwarded to the main thread over a `BroadcastChannel` when the relay is
initialized.

## Layout

| File | Role |
|------|------|
| `events.ts` | Shared types (`LogLevel`, `LogEntryPayload`, bus typing) |
| `serialize-args.ts` | Args safe for `postMessage` / display (errors, `inspect`, etc.) |
| `console-write.ts` | Timestamps, colors, and `console.*` output |
| `relay.ts` | Channel + `initLogRelay` / `closeLogRelay` + payload validation |
| `dispatch.ts` | Main-thread write vs worker forward |
| `index.ts` | `log` facade and public exports |

## API

- `log(...)`: plain console output
- `log.info(...)`: plain console output
- `log.error(...)`: red, stderr-focused error output
- `log.debug(module, ...)`: timestamped debug output when `config.debug` is on
- `warnRefSync(...)`: same warning styling as `log.warn`, without worker relay
- `initLogRelay()` / `closeLogRelay()`: main-thread relay for worker logs

## What it does not own

- File logging
- Log levels beyond the few helpers exposed here
