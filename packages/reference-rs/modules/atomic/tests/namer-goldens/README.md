# Namer goldens

One `input → output` file per lexical function and per procedure, plus the
composed `name` probes. The compiler generates every file from its own
functions (`src/goldens/`); the runtime namer reproduces each file exactly.

Runner contract: call the export named by `function` as `fn(input, tables)`,
where `tables` is the compiling system's `runtime.namer`. Pure lexical
functions ignore the second argument; shaping, conditions, slots, and `name`
read it. The composed cases use the case-harness system on both sides, so the
writer's tables and the runner's tables are identical by construction.

Freshness: `cargo test` regenerates every file in memory and diffs. A diff
fails until re-blessed. `NAMER_UPDATE_GOLDENS=1` is the only rewrite path,
and a re-bless without a `NAMER_RULES_VERSION` bump is a review failure when
a naming rule intentionally changed a class.
