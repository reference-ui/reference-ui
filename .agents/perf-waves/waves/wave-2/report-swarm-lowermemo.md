# REPORT: swarm-lowermemo — `lower_when` memo over tiny distinct set

## Verdict

**CUT (fantasy ceiling ≈ 4.3 ms at 100% capture of all three arms clears
neither LAND prong: ≥15 ms and ≥1.5% (≈17.5 ms on the ~1164 ms base))**

One line: the memo would "work" (≤10 distinct raws, ~99.99% hit rate) but
there is almost nothing to memoize — both firing arms are already
lookup-cheap (`get_condition` is a borrow-only FxHash probe), and every
`Known` call must still construct an owned `When` (2–3 `Box<str>` allocs)
because both bench-path callers take ownership. Realistic capture ≈ 1.2 ms
of compute; the alloc floor is unreachable without an `Atom` ownership
redesign (not a memo; other crews' ground).

## Base / binaries

- Base commit: `5844b24a81a528ace14fab63e908793a6829a874` (verified
  `git rev-parse HEAD` before any work; docs-only filing over wave-1
  landing `0a7330c76`, `packages/` tree identical)
- Base `.node` sha256: N/A — nothing built, nothing timed
- Candidate `.node` sha256: N/A — CUT before implementation
- `git diff --stat`: empty (only this REPORT.md is untracked)
- Bench lock: never held by this crew (counted, never built, no lock hold)

## Mechanism counts (enterprise, seed 7, 7527 css calls)

Call volume measured by swarm-modgraph (temporary env-gated dump, 3 runs
bit-identical; this crew reuses, never re-runs):

| arm | calls | path |
| --- | --- | --- |
| `base` (Skip) | 17,294 | one `==` compare, ~1–2 ns |
| catalog (Known) | 33,475 | FxHash probe hit + `from_catalog` (3 allocs) |
| breakpoint (Known) | 28,662 | FxHash miss + 12-entry preset scan + names scan + SipHash `width_px` + `format!` + 2 allocs |
| range / at-rule / unknown | 0 | dead on bench |
| **total** | **79,431** | |

Distinct-raw cardinality (static upper bound from the frozen seed
generator — enterprise uses `APP_DIALECT`, all condition keys come from the
single 6-entry `CONDITIONS` list in
`packages/reference-neo/benchmark/generate/templates/style.ts`, all
responsive keys from `fullResponsive` + 2-element arrays):

| set | members | count |
| --- | --- | --- |
| skip | `base` | 1 |
| catalog | `_hover _dark _focus _focusVisible _active _disabled` | 6 |
| breakpoint | `sm md lg` | 3 |
| **distinct upper bound** | | **≤10** |

Corroborated by the measured zero range/at-rule/unknown split (no `xl`,
no `*Down`/`*Only`, no `@container` stamps reach `lower_when` on bench).
Calls per raw ≈ 7,943 avg; memo hit rate would be ≈ 99.99%.
The hit rate is not the problem — the compute/alloc ratio is.

Per-call cost model (static work-count + modgraph's measured 70 ns/call
breakpoint basis; allocs ≈ 10–15 ns each):

| arm | work | $/call (generous) | full-cost ceiling |
| --- | --- | --- | --- |
| base | 1 str cmp | ~2 ns | ~0.03 ms |
| catalog | FxHash probe (~5 ns) + 3 allocs (~40 ns) | ≤70 ns | ~2.3 ms |
| breakpoint | Fx miss + preset scan + names scan + SipHash probe + `format!` + 2 allocs | 70 ns (measured basis) | ~2.0 ms |
| **fantasy (arms → zero)** | | | **≈ 4.3 ms** |

## Why it can't land (ceiling math)

A memo (or perfect static dispatch over the ≤10 raws) removes compute
only. Both bench-path callers take ownership — `lower_conditions`
(`resolve/mod.rs:254`) pushes the `When` into atoms, `when_lowers`
(`mint/mod.rs:173`) constructs-then-drops — so every `Known` hit still
pays 2–3 clone-allocs, plus the memo's own hash + probe. (`diagnostics`
deliberately never calls `lower_when`; goldens/tests are off the bench
path.)

| arm | memo-addressable compute | realistic savings |
| --- | --- | --- |
| catalog | FxHash probe + strip + branch ≈ 10 ns × 33,475 | ~0.3 ms |
| breakpoint | Fx miss + scans + SipHash probe + `format!` machinery ≈ 30 ns × 28,662 | ~0.9 ms |
| base | none (guard stays) | 0 |
| **realistic total** | | **≈ 1.2 ms** |

- Fantasy (entire arms → zero, allocs included — impossible without a
  redesign): ≈ 4.3 ms < 15 ms, ≈ 0.37% < 1.5%. Clears neither prong.
- The CUT survives 3× cost-model error (≈ 13 ms, ≈ 1.1%) on both prongs.
- Design notes (considered, still dead): a std-`HashMap` memo would ADD
  SipHash per call on this path (wave-1 canon warning) against an arm
  that already probes FxHash — likely net-negative; a `match` on the ≤10
  raws saves only the same ≈ 1.2 ms compute; removing the alloc floor
  needs shared `When` ownership across `Atom`/emit/name/cascade — a
  redesign on other crews' ground, not this hypothesis.
- Flame corroboration without touching CPU while the lock was held:
  `lower_when` sits below the top-table cutoffs in filed
  `enterprise-flame3` `summary.md`/`callers.md`, consistent with a ~4 ms
  fantasy ceiling.

No subset selects its way to a LAND or a provable BANK: realistic ≈ 1.2 ms
sits an order of magnitude under 8-pair median noise (±10–40 ms per the
wave-1 canon pair table) and could never resolve in confirm.

## A/B, output hashes, determinism

Not run — no candidate was built. Running an 8-pair A/B against a
hypothesis whose fantasy ceiling sits below both prongs would burn the
shared bench lock for a foregone CUT (swarm-keys / swarm-modgraph
precedent).

Determinism: call volume bit-identical across modgraph's 3 runs; distinct
bound derives from committed generator sources (deterministic input).

## Correctness (rule 1)

- (a) Zero diff: no suites apply. Tree verified byte-clean (`git status`
  empty apart from this report); no builds, no wrappers touched.
- (b)/(c) Vacuous — nothing changed.

## Collision / scope notes (for the captain)

- Untouched per brief: `builder.rs`, cascade/sort/keys (swarm-cascade),
  key serialization (swarm-keys2), extract/parse (swarm-parse), canon
  remainder (swarm-canon2), diagnostics/proof (swarm-diag).
- Observed, not pursued (no pivot): `BreakpointScale.widths` is a
  default-hasher (SipHash) `IndexMap` — FxHash-ing it is a ~0.4 ms diet
  on adjacent ground, noted only. The sibling reseed observation
  (resolve-path `format!`s) left for its own future topic per brief.
- Re-examination bar for any future `lower_when` crew: only an `Atom`
  ownership redesign (shared/interned `When`) moves the alloc floor, and
  that is a new hypothesis with cascade/emit/name collisions to clear —
  not a memo revival.

## Process note

`flame.mjs --inspect lower_when` / `--callers` were intentionally not run:
the bench lock was held by a sibling for this crew's whole session, and
deriving from `profile.json.gz` costs box CPU. Filed `summary.md` /
`callers.md` reads plus the static work-count model already over-prove the
CUT (3× error margin), so no lock wait was warranted.
