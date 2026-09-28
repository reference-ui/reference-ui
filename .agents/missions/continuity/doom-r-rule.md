# CONTINUITY-R RULE — verdict: BREAK

Date: 2026-09-27. Oracle (independent of finder and reproducer).

## Firsthand verification

Oracle replayed `/tmp/doom-r-red.mjs` unmodified: RED, exit 1, with these
verbatim offending declarations and the control intact:

- `.doom-rhythm__mt_infr { margin-top: calc(inf * var(--spacing-root)); }`
- `.doom-rhythm__mt_1e309r { margin-top: calc(inf * var(--spacing-root)); }`
- `.doom-rhythm__mt_1\/infr { margin-top: calc(var(--spacing-root) / inf); }`
- Control `margin-top: calc(2 * var(--spacing-root))` present.

Oracle also read firsthand: `resolve/rhythm/mod.rs:54-66` (bare
`str::parse::<f64>()` at both sites; only fence is `denom == 0.0`),
legacy `helpers.ts:27-69` (fraction path `Number.isFinite`-fenced;
single path refuses `NaN` stems, mints `Infinity` for genuine overflow),
`SPEC.md` ATM-VALID-02 + rule 10, `lexical.rs:53-69` (L3 sanctioned
`parse_decimal` + `.finite()` entry, "never bare"), and sibling fences
(`classify.rs:41`, `fence_arith.rs`, `fence_eval.rs`, `unary.rs`,
`coerce.rs` — all finite-gated). `get_rhythm` has no callers outside
`rhythm/mod.rs`, so the two parse sites are the whole emit path.

## Ruling: genuine BREAK

No contract blesses this behavior:

- **ATM-VALID-02 + SPEC rule 10** ("Never print a Rust `Debug`/`Display`
  form into a declaration"): `inf` is a Rust `Display` spelling, not CSS.
  `calc(inf * var(--spacing-root))` and `calc(var(--spacing-root) / inf)`
  are invalid CSS — `inf` is neither a `<number>` nor a Values-4
  calc-constant (`infinity`, `-infinity`, `NaN` are). Every engine drops
  the declaration at computed-value time: silent ghost classes, zero
  diagnostics.
- **Legacy parity** (reference oracle — legacy itself is a frozen museum
  per crew-implement §1, so parity informs the close while ATM-VALID-02
  binds it): legacy refuses `infr`/`nanr`/`infinityr`/`1/infr`/`inf/3r`
  (passthrough raw, silent) and mints the *valid* `calc(Infinity * …)`
  for genuine overflow (`1e309r`, `Infinityr`). Rust mints invalid
  `calc(inf …)` in every one of those slots. Divergence on all of them.
- **Sibling discipline**: every neighboring numeric path is finite-gated;
  `rhythm/mod.rs` is the lone bare-parse-then-print site. The dropped
  one-line fence is exactly the finder's claim.

Honesty nuance: `calc(NaN * …)` (from `nanr`) is grammatically valid CSS
(`NaN` is a calc-constant, ASCII case-insensitive) — but still a
guaranteed-dead declaration (NaN → invalid at computed-value time →
IACVT/unset) minted silently where legacy passes through raw. Same fence
closes it; not a separate verdict.

## Severity (honest)

User-facing-lite. Silent ghost classes are the worst failure shape, but
the trigger requires authoring `inf`/`nan` spellings or f64-overflow
magnitudes nobody writes deliberately, and oracle swept the tree for
non-finite r authorship — none (matches are prose "infra"). Real BREAK,
not a drill; not a five-alarm fire.

## Fortify boundary

**May change:** the two parse sites in `resolve_single_rhythm`
(`packages/reference-rs/modules/atomic/src/resolve/rhythm/mod.rs:56-57`
fraction num/denom, `:65` single stem) — add a finiteness fence behind
one shared gate, not two ad-hoc checks. Recommended:
`lexical::parse_decimal(…).finite()` — L3 delegates to `parse::<f64>`
over accepted grammar, so every finite spelling parses byte-identically
and only non-finite results are rejected. A minimal
`.ok().filter(f64::is_finite)` equivalent is equally acceptable; the
close is outcome-constrained, not implementation-mandated.

**Two acceptable closes** (oracle constrains, fortify chooses):

- (a) *Refuse*: return `None` on non-finite → raw passthrough, silent.
  Matches legacy on all named spellings in both paths; diverges from
  legacy only on genuine overflow (legacy mints valid `calc(Infinity *
  …)`, refuse passes `1e309r` through raw). Acceptable GIGO — document it.
- (b) *Parity-print*: refuse `NaN`, print `Infinity`/`-Infinity` for
  ±infinity. Exact legacy parity including overflow.

Either close must satisfy: no Rust `Display` leak into the sheet (`inf`
never; `NaN` never — legacy refuses every NaN stem, so a `NaN` mint has
no parity license even though the spelling is valid CSS), no silent
invalid-CSS mint. **No diagnostic is owed**: legacy refuses silently, so
silence + a valid sheet (or raw passthrough) is the parity-correct
outcome. Do not add warnings the reference never emitted.

**Must move together:** single-stem + fraction num/denom sites (one
gate); `-inf`/`-nan`/case variants ride it automatically — pin one.

**Sweep obligations:**

- Audit every other bare `parse::<f64>` in atomic for
  non-finite-into-CSS printing — `resolve/r/query.rs:37` (`inf`
  classifies; prove it never stems/prints), `diagnostics/analysis/
  const_values.rs:144`, `extract/expressions/ast_value.rs:243`,
  `extract/fold/fence_coerce.rs:61`, `fence_arith.rs:158,208`,
  `unary.rs:344`, `coerce.rs` sites. Rule each out with cited evidence
  or fence it.
- Re-sweep goldens/cases for `inf`-calc mints (`calc\((inf|NaN|var[^)]*\/ inf)`).

**Stays untouched:** `get_rhythm` + `format_*` functions (leave the
`String` signatures), fragment scanning and var/url/env protection,
the epsilon-collapse (`0.9999999999999999r` CURIO explicitly out of
scope), `1/0r` raw-passthrough parity, `unit.rs`, `classify.rs`, the
legacy museum, goldens except the new case, class naming,
`--spacing-root` semantics.

**Pins / regression case owed:**

1. New ATM-RHYTHM tick: `infr`, `nanr`, `infinityr`, `Infinityr`,
   `-infr`, `1e309r`, 309-digit overflow, `1/infr`, `inf/3r` → sheet
   carries no `inf`/`NaN` calc (assert on **sheet text**, not just the
   css-validity gauge, which never caught this).
2. Controls intact in the same case: `2r` → `calc(2 * …)`, `1/3r`,
   plus finite-neighbor guards proving the fence is finiteness not
   magnitude (`0.5r`, `1e-3r`, finite-giant `1e308r` still mint).
3. Mirror pins as cargo `#[test]` in `rhythm/mod.rs` tests module.
4. If direction (b): pin `1e309r` →
   `calc(Infinity * var(--spacing-root))` verbatim (legacy spelling).

Fortify runs under the `agent-rs` quality gate (complexity/file limits,
no clippy allows). No fixes were made by this crew.
