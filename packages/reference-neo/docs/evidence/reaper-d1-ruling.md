# Reaper D1 ruling — walk-owned literals and the pool

D1: DECLINE

Date: 2026-09-20. Architect: Reaper Phase R3 (D1 consult, main tree, sequential).
Contract: `docs/missions/operation-reaper.md` Part II. Evidence: `reaper-01-real-compile.md`
(Slice 1 numbers, re-verified this session: `pnpm agentrs c atomic -t harvest` 18+1 green,
`pnpm agentrs v modules/atomic/tests/harvest-census.test.ts` 4 green), `reaper-ready-03`
(the bound), fixture forensics over `harvest-enterprise/src/`, harvest sources
(`literals.rs`, `sinks.rs`, `mint/`, `twins.rs`, `classify.rs`), `docs/ATOMIC.md`,
HARVEST-01..05 + SEAM-07 stations.

Rule (voyage brief): SIGN iff BOTH (a) material size win on the Slice 1 numbers AND
(b) no authored-pattern breakage beyond named cases. Anything else DECLINES.

## Reasons

**(a) FAILS — the prize is the floor, 180 classes (3.6%), and real code runs smaller.**

The 180–1,645 bracket collapses under fixture forensics. Every ambiguous color
(74), keyword (4), url (2), and transform (2) occurs unbound in an array by
construction (`SHARED_*`, `KEYWORDS`, `ASSET_URLS`, `MOTION`); only the 10
leaf-only px values (`121px`–`130px`) are truly leaf-only. 123 of 133 ambiguous
values provably stay in the pool under Slice 2. True prize on the fixture:
10 values × 18 net-new sinks = **180 classes, ~12.4 KB raw, ~1.5 KB gzip,
~0.4 ms parse** — 3.6% of the 4,938-class / 341 KB / 41.5 KB-gzip sheet.

Three strikes against materiality:

1. The fixture was *engineered* to contain leaf-only values, and still yields 3.6%.
   Real pools run the other way: lib's 518-string pool is dominated by 216
   unbound `oklch()` token definitions that pool either way, and the enterprise
   pattern (central palette/spacing modules) is unbound-friendly. 3.6% is an
   upper bound on real-world effect, not a lower bound.
2. The mission's planning numbers do not move: "messy app ~1–2 MB / 150–200 KB
   gzip", "3 MB takes ~1,000 strings", parse bands (~10 ms fixture, ~53 ms M500).
   A size optimization that moves none of the planning numbers is, by the
   mission's own frame, immaterial.
3. The mission's Part II predicted "likely small" — Slice 1 confirms it, at the
   floor. Ruling SIGN would re-litigate a measurement the mission already priced in.

**(b) HOLDS — breakage is confined to the named rule, but it does not save the sign.**

Breakage = values occurring ONLY as static leaves no longer paint through
non-twin holes (cross-prop, cross-when, cross-important). That is the mission's
named `#00aeff` case generalized across the twin-key axes (see inventory).
Same-(prop, when) reuse still paints via the static atom itself. HARVEST-01..05
and SEAM-07-as-written stay green; twin skip unchanged. So (b) is satisfied —
narrowly, and only because the named rule was stated generally. But the rule
requires BOTH. (a) fails, so D1 DECLINES.

## Prize-vs-doctrine-cost

| Side | Content |
|---|---|
| Prize (measured, fixture) | 180 classes / ~12 KB raw / ~1.5 KB gzip / ~0.4 ms parse; less in real code |
| Prize (ceiling, refuted) | 1,645 classes assumed all-ambiguous-leaf-only; construction disproves 123/133 |
| Cost: authorship rule | "Define the values somewhere" → "...somewhere UNBOUND". Four documented wordings break: ATOMIC.md:91 ("never wrote"), ATOMIC.md:220 (Pool "position does not matter"), `literals.rs` header ("Position is irrelevant"), worked example 1 ("Harvest sees 'red'/'4px'") |
| Cost: silence | Compile-silent paint loss. Harvest never warns (A5); the hole's warn pre-exists; the only signal is a runtime dev-warn at miss time. Author wrote the value, sees the hole accepted, gets no paint |
| Cost: perverse incentive | Restoring paint requires adding the value somewhere unbound — i.e. a dead unread array. HARVEST-01 stops being "the floor" and becomes boilerplate tax |
| Cost: permanence | Every future author must learn "static definitions don't count as definitions", to save ~3.6% on a synthetic sheet |

A permanent, silent doctrine change for a sub-planning-number cut is a bad trade
at any discount. DECLINE.

## Breakage inventory (what WOULD have broken — for the record)

Within the named rule (mission's `#00aeff` case + twin-key axes):

1. **Cross-prop static→hole** (mission-named): `css({ color: '#00aeff' })` static +
   `borderColor` hole receiving `'#00aeff'` at runtime. Today paints; Slice 2 misses.
2. **Cross-when static→hole**: rest leaf → `_hover`/`md` hole and reverse. Includes
   ATOMIC.md's own `css({ color: 'red', _hover: { color: 'blue' } })` example when
   `'blue'` is sole-sourced there.
3. **Cross-important static→hole**: twin key includes `important`; a leaf-only value
   under one importance stops painting holes under the other.
4. **Static-corpus + identifier hole** (SEAM-07-shaped with a real hole): +500 → +0.
5. **Single-use brand values**: a value defined once statically and consumed
   dynamically — the most natural authoring there is — silently unpaints unless the
   author adds a dead unbound copy.

NOT broken (verified by reading sources + stations, no code run beyond census):

- Same-(canonical-prop, when, important) reuse: the static atom itself paints;
  twin skip already covers the identical pair, Slice 2 or not.
- HARVEST-01 (unread array still pools), -02 (holey templates untouched), -03
  (unbound palette + conditioned hole), -04 (no-sink path untouched; static sheet
  still byte-identical with/without harvest), -05 (inner literals sit at a
  *refused* site, not a bound leaf — pools, **provided** Slice 2 skips only
  complete-bound-leaf spans; this is the sharp edge any future implementation
  must hold).
- SEAM-07 as-written: null hole never sinks (reaper-01 surprise #1); its +500 is
  static leaves, untouched by any pool change. Green either way.
- Token paths, `staticCss` numbers, unknown/runtime-owned props: never pool, untouched.

## Slice 2 boundary

**Nothing is authorized. Slice 2 is not dispatched under this ruling.** No code
changes, no `ATM-HARVEST-06`, no `literals.rs` span reporting, no ATOMIC.md doctrine
edit beyond recording this answer (R6, Slice 4's prose pass).

If HQ overrides this DECLINE in the morning, the exact boundary the override
inherits is the mission's, unchanged:

- Touch: `extract/harvest/literals.rs` (pool visitor skips string nodes at
  walk-reported complete-leaf spans) + the walk's span reporting + `ATM-HARVEST-06`
  station + `docs/ATOMIC.md` harvest section (authorship rule rewritten to
  unbound-only, all four wordings above updated together).
- Do NOT touch: `mint/twins.rs` (R4), sink recording, the kind gate, `staticCss`,
  the runtime namer, `NativeRuntimeArtifact`, `css()`.
- Hold green: `ATM-HARVEST-01..05` unchanged (H05's refused-site literals must
  still pool — span-skip covers complete bound leaves ONLY), SEAM-07, full
  `pnpm agentrs t`, `pnpm agentrs q` on every touched file.
- Re-measure: prize must land at exactly 180 classes / the pinned byte cells on
  the unchanged fixture; any other number means the span-skip over- or
  under-collects.

## Recommendation to HQ

Ratify DECLINE. Harvest keeps the pool as-is: position-free, "define the values
somewhere in your source". The lever for sheet size stays where the mission put
it — sink vocabulary, lived-with sheet, or leave H2 alone — chosen from Slice 1's
numbers, not from Slice 2. Close Reaper Part II with this file + the R6 prose pass.
