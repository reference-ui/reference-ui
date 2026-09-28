# CONTINUITY-R FORTIFY — done, close (a) refuse-to-passthrough

Date: 2026-09-27. Engineer crew (independent of finder, reproducer, oracle). No commit — captain commits.

## Close chosen: (a) refuse

Both parse sites in `resolve_single_rhythm` now go through one shared gate,
`parse_finite_stem` → `lexical::parse_decimal(…).finite()` (the ruling's
recommended L3 entry, same call shape as `unit.rs:34`). Non-finite refuses to
raw passthrough, silent — no warnings added.

Why (a) over (b): the ruling's (b) shorthand ("refuse NaN, print
Infinity/−Infinity for ±infinity") is literally inexact against legacy on
named spellings — JS `Number("inf")`/`Number("infinity")` is `NaN`, so legacy
*refuses* `infr`/`infinityr`, while (b)-literal would mint `calc(Infinity …)`
for them. Exact parity would need JS-`Number` emulation (case-sensitive
`Infinity` vs `inf`, overflow vs named). (a) matches legacy on every named
spelling in both paths; the only divergence is genuine-overflow singles
(`1e309r`, `Infinityr`, 309-digit), which pass through raw where legacy mints
valid `calc(Infinity * …)` — documented GIGO, per the ruling's license. No
`inf`/`NaN` ever in the sheet from any `r` stem.

## Diff summary (3 paths + this report)

- `packages/reference-rs/modules/atomic/src/resolve/rhythm/mod.rs`
  - New `parse_finite_stem` gate (`use super::lexical`; 8 lines incl. doc).
  - Fraction num (`:56`) / denom (`:57`) and single stem (`:65`) call the gate;
    single+fraction move together. `denom == 0.0` check, `get_rhythm`,
    `format_*`, fragment scanning, epsilon-collapse all untouched.
  - Two new `#[test]` pins (below).
- `packages/reference-rs/modules/atomic/tests/cases/ATM-RHYTHM-07/`
  (new): `input/src/continuity.ts` (14 `css({marginTop})` calls), `spec.ts`,
  `README.md`, committed `output/` goldens (`styles.css`, `css.json`,
  `diagnostics.json`).
- `packages/reference-rs/modules/atomic/tests/css-quarantine.ts`: 9-entry
  `ATM-RHYTHM-07` block (§11 silent bare-value passthrough, permanent, like
  `ATM-TOKEN-16`) — required by `assertWritableCss` before goldens could write.

## Pins added

- Cargo (`rhythm/mod.rs`): `test_non_finite_stems_refuse_silently` (10 stems —
  ruling's 9 + `-nanr`/`NANr` case variants — asserting `None` +
  passthrough identity; 309-digit giant) and `test_finite_neighbors_still_mint`
  (`0.5r`, `1e-3r`→`0.001`, `1e308r` mints).
- Tick `ATM-RHYTHM-07`: asserts on **sheet text** — specific
  `not.toContain('calc(inf ')` / `'/ inf)'` / `'calc(NaN ')` plus general
  `/calc\([^;{}]*\binf\b/` and `/calc\([^;{}]*\bNaN\b/` backstops (scoped to
  `calc(` so the `inf/3r` passthrough can't false-positive); 9 raw-passthrough
  `toContain`s; 5 mint controls/guards (`2r`, `1/3r`, `0.5r`, `1e-3r`,
  `1e308r` via `/calc\(1\d+ \* …/`); `diagnostics == []`; `hasWant` × 14.

## Fail-without-fix / pass-with-fix (firsthand, same tree)

| Level | Pre-fix | Post-fix |
|---|---|---|
| Oracle replay `/tmp/doom-r-red.mjs` (unmodified) | RED exit 1, 3 offending decls, control ok | GREEN exit 0, `(none)`, control ok |
| Cargo pin | `test_non_finite_stems_refuse_silently` FAILED (`Some("calc(inf * …)")` vs `None`) | 16/16 rhythm tests pass |
| Tick `ATM-RHYTHM-07` spec | RED (`expected … not to contain 'calc(inf '`) | spec GREEN; then gauge-listed 9 passthroughs → quarantined → case GREEN incl. golden diff |

## Suites + results

- `pnpm agentrs c atomic`: **747 passed, 0 failed** (733 lib + 1 + 1 + 7 + 5).
- `pnpm agentrs v atomic`: **304/305 pass**; 12/13 files. Sole failure is the
  known pre-existing `harvest-census` byte pin, baselined RED **before** the
  fix on this tree: `publishes react.mjs bytes` — `react.mjs raw: expected
  158317 to be 158073` (+244 B drift; gzip pin unreached). Unrelated to
  rhythm (react bundle bytes); never absorbed, itemized here.
- `pnpm agentrs q` on `rhythm/mod.rs`, `spec.ts`, `css-quarantine.ts`: all pass
  (file < 365 lines, CC ≤ 10, no clippy allows).
- `cargo check -p atomic` warnings mentioning `rhythm/mod.rs`: **0** (the 19
  lib warnings are pre-existing, none mine).
- Zero golden churn outside the new case: all 248 other cases pass unmodified,
  confirming no existing case authors non-finite `r` values.

## Sweep evidence per bare `parse::<f64>` site (all 10 files)

`rhythm/mod.rs` no longer contains any bare parse (verified by grep).

| Site | Verdict | Evidence |
|---|---|---|
| `resolve/r/query.rs:37` | RULED OUT | `is_ok()` discards the value; only the raw `&str` key interpolates (`:29,44,48`); no float interpolation in file. Probe: `r:{{inf}}` → `@container (min-width: infpx)` — author-literal GIGO echo, never a manufactured Display leak (ATM-VALID-02 targets the latter). |
| `diagnostics/analysis/const_values.rs:144` | RULED OUT | `json!(f)`; locked serde_json 1.0.149 maps non-finite f64 → `null` (`number.rs:183-184` `from_f64` finite-only; `ser.rs:169-174` writes null). JSON channel, never CSS text. |
| `extract/expressions/ast_value.rs:243` | RULED OUT | Same `json!(f)` → null construction; plans-JSON channel. |
| `extract/fold/fence_coerce.rs:61` | RULED OUT | `nonzero_number` returns bool (truthiness) only. (Siblings `:78,:85,:99`: `number_to_string`/`coerce_to_number` propagate atom text / f64 into the fold pipeline — no declaration printer; see coherent-fix note.) |
| `extract/fold/fence_arith.rs:158,208` | RULED OUT | `numbers_equal`, `loose_eq_string_number` return bool only. |
| `extract/fold/fence_eval.rs:137` | RULED OUT (already fenced) | `eval_negate` has an explicit `if !negated.is_finite() return None` (`:138-140`). |
| `extract/fold/unary.rs:344` | RULED OUT as print site | Re-canonicalizes into an `AtomValue`; atoms reach declarations only via `unit.rs` (ruling-scoped-out sink) — see coherent-fix note. |
| `extract/fold/coerce.rs` (`:22,:36,:49,:72,:107,:153,:159,:162`) | RULED OUT as print site | `:72,:107,:153,:159,:162` bool/compare only; `:22,:36` f64 for comparisons + finite-gated arith (`pairs.rs:127-129` "never emit Infinity or NaN into a style"); `:49` propagates atom text into folded strings (no declaration printer) — see note. |
| `extract/harvest/classify.rs:41` | RULED OUT (already fenced) | `.is_ok_and(f64::is_finite)` inline. |
| `resolve/lexical.rs:66` | SANCTIONED ENTRY | The L3 `parse_decimal` delegation itself; callers gate via `.finite()`. |

Golden re-sweep: `calc\((inf|NaN)` / `/ inf)` / `Infinity * var` / `inf * var`
across all `packages/reference-rs` stylesheets, snapshots, and neo tests →
**zero matches** (only this cycle's own README prose describing the ban).

## Coherent-fix note + adjacent doom candidate (NOT fixed, per boundary)

The sweep probe (`/tmp/doom-r-sweep.mjs`, kept) proves a *distinct*,
end-to-end non-finite chain the ruling scoped out: numeric literals record
atoms via `lit.value.to_string()` (`literal.rs:38`, `scope/*`, `fold/*` —
`1e309` → `Number("inf")` at recording, not at any parse site), and the
`unit.rs` sink verbatim-mints them (`from_number` `NotNumeric` arm, no
diagnostic; `is_non_canonical_numeric` catches JS `Infinity` but not Rust
`inf`). Observed, all silent (`diagnostics: []`): `width: 1e309` →
`width: infpx`; `zIndex: 1e309` → `z-index: inf`; `marginTop: -W` →
`margin-top: -infpx` (unary propagation); `flex: +W` → `flex: inf`;
`width: W+'px'` → `width: infpx` (concat propagation). Fencing propagation
alone is incoherent — the sink (`unit.rs`, explicitly "stays untouched")
would still mint direct literals, and identical values would refuse-or-mint
by syntactic path (folded `-W` refuses while direct `1e309` mints; `W+'px'`
refuses while `` `${W}px` `` mints via the parse-free `coerce_leaf` echo).
The coherent fix must land at the sink or the recording source — both outside
this ruling's "may change". Filed as a follow-up doom candidate with
firsthand evidence. Related out-of-sweep observations for that cycle:
`template.rs:242` prints literal holes via `lit.value.to_string()` (`` `${1e309}` ``
→ `"inf"`); `fence_eval.rs:113-116` `add_numbers` has no finite gate (unlike
`pairs.rs:127` and `eval_negate:138`).

## Notes

- Tree is shared with concurrent doom-t/doom-x crews: `codes.rs`,
  `streams.rs`, `system_layers/*`, `DECISIONS.md`, mission logs changed by
  others; my diff is exactly the 3 paths above. No `dist/` collateral
  (build outputs unreflected in git status).
- `1/0r` raw-passthrough parity, epsilon-collapse, `classify.rs`, legacy
  museum, class naming, `--spacing-root` semantics: untouched as ordered.
