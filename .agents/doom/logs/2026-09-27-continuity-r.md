---
date: 2026-09-27
cycle: continuity-01
module: atomic/resolve/rhythm
theories_spent: 1
verdict: break-found
---

# Non-finite `r` numerics mint `calc(inf …)` CSS

## Hypothesis

Theory 1 (spent, FAILED = break): `resolve_single_rhythm`
(`packages/reference-rs/modules/atomic/src/resolve/rhythm/mod.rs`)
parses the numeric stem with bare `str::parse::<f64>()`, which accepts
`inf`/`-inf`/`infinity`/`nan` (any case) and returns `+inf` on
overflow — with no finiteness fence. Every sibling numeric path is
fenced: legacy `parseRhythmFraction` demands `Number.isFinite` on both
parts (and `Number('inf')` is `NaN`, so the legacy single path refuses
`infr` too), `unit.rs` is documented "finite-only", and
`classify.rs::has_non_length_unit` checks `f64::is_finite`. The red
test (`/tmp/doom-r-red.mjs`, live `ref sync` on a throwaway
`/tmp/doom-r-world`) authors static `css({ marginTop: 'infr' })`,
`'1e309r'`, `'1/infr'` plus a `'2r'` control, and asserts the sheet
carries no `inf`-calc while the control survives. It fails: all three
evil literals mint classes with zero diagnostics.

## Verdict

`break-found`. Repro: `node /tmp/doom-r-red.mjs` (exit 1 = red; builds
its own world, runs `ref sync`, greps the sheet). Violated contracts:
(1) `ATM-VALID-02` — "a declaration value must always be valid CSS":
`calc(inf * var(--spacing-root))` carries `inf`, which is not a CSS
`<number>` nor a Values-4 calc-constant (`infinity` is; `inf` is a
Rust `Display` leak) — every engine drops the declaration at
computed-value time, so the minted class is a silent ghost;
(2) legacy parity — `helpers.ts` refuses `infr`/`nanr`/`infinityr`/
`1/infr`/`inf/3r` outright, and where both mint (`Infinityr`,
`1e309r`, 300-digit overflow) legacy prints the valid `Infinity`
constant while Rust prints `inf`. Severity: user-facing-lite —
nobody authors `infr` on purpose, but overflow spellings are one
fat-finger away, the failure is silent (no diagnostic), and the
missing `is_finite` check is a one-line fence the port dropped.
Not pursued (scheduler signal): `0.9999999999999999r` collapses to
exactly `var(--spacing-root)` via the `< f64::EPSILON` comparison
(legacy keeps the coefficient) — sub-visible, curiosity-grade;
`1/0r` passes through raw as `margin-top: 1/0r` on both engines
(GIGO parity, not a divergence); min/max props and `minW`/`maxW`/
`minH`/`maxH` aliases all ride the Length gate correctly (clean).
