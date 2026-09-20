# NAMER ledger

Statuses: `open`, `in-progress`, `done`, `blocked-on-rs`, `approved-absence`, `retired`. Ids are append-only; never renumber.

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NEO-NAMER-01 | Differential: the runtime namer over every authored declaration of every engine case input equals the compiled plans, slot and className | open | ATM-SEAM-06/07/08, ATM-NAME-08 | `@reference-ui/rust/namer` | node-side loop, byte-equal declaration lists | `[atm]` SEAM-06/07/08, NAME-08 |
| NEO-NAMER-02 | Browser corpus: holes, responsive arrays, per-prop objects, `_hover`, `md`, `!`, and the macros paint exactly the pre-cutover class lists | open | ATM-NAME-08 | `css()` via the runtime namer | class strings plus computed styles | `[atm]` NAME-08 |
| NEO-NAMER-03 | Miss: the miss class is present, paints the inherited value, and reports exactly one browser-dev diagnostic | open | — | `css()` miss path | class string, computed color, captured diagnostic | `[atm]` GHOST (miss class is not a ghost) |
