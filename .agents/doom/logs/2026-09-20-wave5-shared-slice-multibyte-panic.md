---
date: 2026-09-20
cycle: wave5
module: shared/span-utils
theories_spent: 1
verdict: break-found
---

# shared::slice_span panics on mid-char spans

## Hypothesis

Gap: `shared::slice_span` (`packages/reference-rs/modules/shared/src/lib.rs:11-19`)
promises "safely clamped to bounds" slicing of Oxc spans over source text, but
the guard checks only byte length (`end <= source.len()`) before indexing
`&source[start..end]`. Oxc spans are byte offsets over TS source that may
contain multi-byte chars (unicode identifiers, strings, comments, emoji), so a
span bound landing inside a multi-byte char is an ordinary input shape — and
Rust string indexing panics on it instead of clamping.

Red test (staged temporarily by the repro script, tree left clean):
`shared::slice_span("héllo", Span::new(0, 2))` — byte 2 splits 'é'
(bytes 1..3). Per contract this must return `""`; it panics.

Research notes (free, unspent): every domain crate (atlas, tasty, virtualrs,
styletrace) vendors its OWN local `slice_span`/`unquote` copy instead of using
`shared::` — the shared helpers have zero production callers today
(only `shared::testing::*` is imported: ScratchWorkspace, fixtures,
contracts). Styletrace's copy (`.get(..).unwrap_or_default()`) is panic-free;
the others index raw and share the flaw, but they are out of this brief's
scope. Unexplored gaps for future hunts: `ScratchWorkspace::write` swallowing
all IO errors (silent fixture loss), and `write("../..")` path escape
surviving `Drop` cleanup ("cleans up all written artifacts" claim). Thin log
on this module before this hunt — no prior shared report existed.

## Verdict

`break-found`. Repro: `/tmp/doom-wave5-shared-slice-panic.sh` (blind-runnable;
stages a temp integration test, runs `pnpm agentrs c shared -t
doom_wave5_slice_span`, removes the temp test via trap).

Observed firsthand:
`panicked at modules/shared/src/lib.rs:15:16: byte index 2 is not a char boundary; it is inside 'é' (bytes 1..3)`.

Violated contract: `slice_span` doc "Slice a span from source text, safely
clamped to bounds" (lib.rs:9) plus README "bounds-checked source buffer
slicing ... to safely extract raw syntax fragments" (modules/shared/README.md).
No physics violation involved: non-ASCII TS compile inputs are in-bounds
compiler food, and a panic on valid input is never the correct refusal.

Severity: latent crash in shared compiler infrastructure, not currently
user-facing (zero production callers — the vendored copies carry the live
risk). Fix direction is for the fortify crew, not this report; the obvious
shape is styletrace's `.get().unwrap_or_default()` semantics.
