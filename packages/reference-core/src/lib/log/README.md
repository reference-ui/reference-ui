# log

Small internal console logger for `reference-core`.

This module centralizes plain info logging, colored error output, and
debug-only logging gated by `config.store`.

## API

- `log(...)`: plain console output
- `log.info(...)`: plain console output
- `log.error(...)`: red, stderr-focused error output
- `log.debug(module, ...)`: timestamped debug output when `config.debug` is on

## What it owns

- output formatting
- debug gating
- consistent timestamp/module formatting for debug logs

## What it does not own

- log transport
- file logging
- log levels beyond the few helpers exposed here
