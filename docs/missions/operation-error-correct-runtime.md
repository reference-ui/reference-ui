# Operation Error Correct — runtime miss reporter (companion)

Status: `idea`. Companion to
[operation-error-correct.md](./operation-error-correct.md), which owns
the build-time verdict policy. This doc owns the optional runtime
half. Nothing here is default behavior.

## Position (HQ)

The compiler can tell the runtime to report lookup misses. It's
fairly cheap (the lookup happens anyway; reporting is the miss
branch), dedup keeps it bounded, and it will never be the
cleanest signal — so it is **opt-in, never the first port of
call**. Build-time verdicts (certain-only, always on) are the
natural warnings. This reporter is an option for authors who want
miss visibility in dev.

## The problem it solves

A dev miss today knows only "requested X, not found" — no
location, no knowledge of interpolation or loops. A generated loop
(100 widths, 100 colors) floods the console with 100 cryptic
lines. Once-per-value doesn't help when all values differ.

## Design (dev-only, miss-path-only; prod pays just the `Map.get`)

1. **Cap + collapse.** First K distinct misses per prop print;
   then one grouped line ("width missed 97 more distinct values").
2. **Generated-pattern detection.** Many distinct misses on one
   prop in a session → single message: "looks generated — put it
   on the native `style` prop." Fires only on observed flood
   behavior, never on code shapes — it cannot punish correct usage.
3. **Pool-stats context.** Per-kind pool counts shipped in dev
   `runtime-data` (`{color: 40, length: 169, …}`): "width:34px
   not in sheet (169 lengths extracted; this one wasn't written)."
   Distinguishes typo/one-off from nothing-ever-authored.
4. **Trimmed stack.** Component location on the miss path, dev only.

## Boundary (non-negotiable)

Runtime reports *what missed*, never *why*. The value arrives
evaluated — partials, loops, and backends are unrecoverable pasts.
A partial (`${n}px`) is diagnosed at build. A whole-value
interpolation that missed is just a miss, same as `color={color}`.
Neither side does the other's job.

## Opt-in (signed on the parent)

Same field as compiler-level diagnostics:
`logs` in `ui.config.ts`. This reporter is the `'runtime'` channel
(`logs: ['runtime']`, or `['compiler', 'runtime']`). Not a second
flag, not an env var. Parent doc:
[operation-error-correct.md](./operation-error-correct.md) (`logs`).
This operation does not implement the channel; it owns the reporter
once the flag exists.

## Still open

1. K (cap size) and the flood threshold for pattern detection.
2. Pool-stats payload: counts only, or kind histograms?
