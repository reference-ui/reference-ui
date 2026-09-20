# Jettison READY ask 2 — Numeric rendering seam

Crew NUMSEAM, read-only. Brief: `docs/missions/operation-jettison.md` §3 rules 2–3, §9
builtin-divergence table (numeric rows). Toolchain measured: rustc 1.94.1, node v24.16.0,
serde_json 1.0.149 (float Display via zmij 1.0.21).

## Verdict on the brief's recommendation

The recommendation — *shortest round-trip, never exponent, `-0`→`0`, refuse
magnitudes outside `[1e-6, 1e21)` as `NonCanonicalNumeric`, Rust moves off
`to_string` onto an explicit `render_decimal`* — is **directionally right but
incomplete in four load-bearing ways** (findings 2–5). The range itself is
exactly right: `[1e-6, 1e21)` coincides with JS's own plain-notation boundary
(verified: `String(1e-6)` plain, `String(1e-7)` exponent, `String(1e20)` plain,
`String(1e21)` exponent), so in-range `String(n)` never emits exponent and the
JS mirror becomes `refuse-out-of-range → String(n)`. The core insight the brief
buries: **inside the accepted range the two sides already agree** — both are
shortest-round-trip without exponent — so the proposal is 95% a *refusal fence*,
not a renderer change. The only in-range render divergence is `-0` (Rust `"-0"`
vs JS `"0"`), and both sides already normalize it to `"0"`.

## Verified code paths

- String path: `resolve/unit.rs::canonical_numeric_string` (trim → `parse::<f64>`
  → finite-only → `to_string`), then `resolve_numeric_value`; fallback
  `legacy_string_value` → `is_non_canonical_numeric` / `parse_canonical_number`.
- Bare-number path: `runtime/builder.rs::scalar_to_atom_value` (serde_json
  `Number::to_string`, i.e. **zmij**, not Rust Display) and extract
  `lit.value.to_string()` (oxc f64 → Rust Display, never exponent), both into
  `unit.rs::from_number`, which **never parses** — the stem is the entry
  spelling verbatim (only `is_non_canonical_numeric` gate + `"0"`/`"-0"` fold).
- `$r` path: `builder.rs::r_object_to_atom_value` — epsilon collapse
  (`|f − round| < 1e-6` → `f as i64`), else `format!("{f}")` (Rust Display).
- Border classifier: `shorthands/parser.rs::is_valid_numeric_str` —
  `parse::<f64>().is_ok()`, **non-finite included**.
- Fold renderers (extract-side, already explicit): `fold/coerce.rs::canon_number`
  and `fold/unary.rs::canon_number` (both `-0`→`0` + `to_string`; duplicated —
  two copies), `coerce.rs::js_number_string` (documents the >1e21 gap as "no
  authored style reaches" — the namer cannot inherit that excuse).

## Finding 1 — inside `[1e-6, 1e21)`, JS `String(n)` ≡ Rust `to_string` already

Verified by probe on both sides (`/tmp/numprobe.rs` output, node probe):
`0.5`, `4.5`, `1000`, `0.30000000000000004`, `123456789012345680000`,
`2.0000005` render byte-identical. So `render_decimal` is behavior-preserving on
both sides for everything it accepts; **both sides change** (contra "Rust
moves"): Rust gains the refusal fence + explicit name, JS gains the fence +
`String(n)` as its renderer. No known shortest-round-trip tie-break divergence
between Rust std and V8; the differential corpus (R13) is the backstop.

## Finding 2 — Rust has THREE renderers today, and bare-vs-string already diverge

`serde_json::Number` Display is `zmij::Buffer::format_finite` (serde_json
1.0.149 `number.rs:350-358`; zmij ≡ ryu output per its own tests), which emits
exponent form and `.0` suffixes. Consequences, all verified by code reading:

| Input | Extract / string path (Rust Display) | Bare-JSON plan path (zmij) | JS `String()` |
|---|---|---|---|
| `1e21` | `p_1000000000000000000000` (22 chars, minted) | `p_1e21` (minted) | `1e+21` |
| `1e-7` | `p_0.0000001` (minted) | `p_1e-7` (minted) | `1e-7` |
| `0.0` | `p_0` | `p_0.0` (minted!) | `0` |
| `-0.0` | `p_0` | `p_-0.0` (minted! `resolve_numeric_value` only folds exact `"0"`/`"-0"`) | `0` |
| `>2^53` int (u64 exact) | verbatim stem, full precision | verbatim stem | rounded + possible exponent |

So the brief's §3 rule 2 sentence "stem is the canonical number via `f64` parse
+ `to_string`" is **false for bare numbers**: `from_number` never parses. And
verbatim bare stems can *never* agree with JS past 2^53 — bare-number
**re-render through the fence is required, not optional**. The fence must live
in `from_number` (or `resolve_numeric_value`), covering extract + fold + JSON
uniformly; fencing only `canonical_numeric_string` leaves every bare entry
bypassing it.

## Finding 3 — `$r` contradicts "shortest round-trip" twice

1. Epsilon collapse: `2.0000005` → `"2r"` (verified: round-diff
   `5.0000007e-7 < 1e-6`). Lossy, must be pinned as its own rule and mirrored
   exactly (`Number.isInteger` is NOT equivalent).
2. `f as i64` saturates: `$r: 1e21` → multiplier `"9223372036854775807"` =
   `i64::MAX` (verified, round-diff 0). A silent *wrong* class — worse than a
   miss. The magnitude fence must cover `$r`, and the cast needs a guard even
   before then.
3. Non-f64 `$r` (`{"$r": "2"}`) renders via `Value::to_string()` =
   **JSON-encoded, quotes included** (`"2"r`). A `String(v)` mirror diverges;
   specify or refuse.

## Finding 4 — the refusal fence has five untrimmed corners the brief must rule on

1. **Case**: `is_non_canonical_numeric` matches only exact `"Infinity"`,
   `"-Infinity"`, `"NaN"`. Rust parses `"inf"`, `"nan"`, `"infinity"`,
   `"INFINITY"` fine (verified, case-insensitive) but non-finite → falls to
   legacy → **minted as string classes** (`w_inf`, `w_INFINITY`). The brief's
   "refused anyway" parenthetical is wrong. R3 then forces the mirror to mint
   `w_inf` too — the mirror must reproduce exact-case refusal + passthrough.
2. **Whitespace**: `' 0x10'` / `'0x10 '` — collapse does not trim, the
   `0x`-check runs on the untrimmed string → **minted**, while `'0x10'`
   refuses. A trim-then-gate mirror diverges. Pin the order:
   collapse → canonical attempt → legacy checks on untrimmed text.
3. **Non-finite parses take string passthrough, never refusal**: `'1e999'`,
   400-digit `'100…0'` (both parse to inf, verified) → `p_1e999`-style string
   classes. The proposal must state the fence applies to **finite parsed
   values only** (recommended — minimal behavior change; goldens are clean
   either way, see below).
4. **Underflow**: `'1e-999'` parses to `0.0` (verified, finite) → numerifies
   to `p_0` today and under the proposal; `'4e-324'`→`5e-324` (verified) is
   finite with magnitude < 1e-6 → **refuses** under the proposal. Adjacent
   spellings split on the underflow boundary. Define the fence on the
   **post-rounding parsed value** (IEEE-identical both sides).
5. **Color props**: `'01'` / `'0x10'` / `'Infinity'` on a color prop **refuse**
   (`legacy_string_value` fires on all props), while `'.5'` stays `c_.5` and
   `'-0'` stays `c_-0` (no →0 fold on the string path). Brief rule 3's "stays
   a string" needs the carve-out: *except leading-zero / radix / non-finite
   spellings, which refuse everywhere*.

## Finding 5 — one grammar cannot serve both fences

`is_valid_numeric_str` (border width classifier) is parse-OK **including**
non-finite: `border: 'inf solid red'` classifies `"inf"` as width (verified by
reading: `"inf"` survives trim/lower, matches no unit suffix,
`"inf".parse::<f64>()` is `Ok`). A `Number()`-gated mirror classifies it as
color → different classes. The brief's "one explicit decimal grammar" must
instead be **two lexical functions**: `classify_length_width` (parse-ok,
non-finite included) vs `parse_finite_decimal`. D8's five-function list is
missing the classifier. (Adjacent, sheet-side only: `global/value.rs:147`
feeds zmij `n.to_string()` straight into `resolve_numeric_value`, bypassing
the `from_number` fence; `unitized_stem` uses strict `parse_canonical_number`,
so global `'1e3'` stays a string while `css()` numerifies — global CSS is not
the namer's problem, but the fence placement must not accidentally "fix" it.)

## What breaks under the proposal

- **Goldens: nothing.** Swept all `modules/atomic/tests/cases/*/output/` and
  `packages/reference-lib/.reference-ui/{react,styled,system}`: zero
  expanded-magnitude stems (22+ digits), zero exponent stems, zero
  `0.0`/`-0.0` stems, zero `inf`/`nan`/`Infinity` stems, zero `i64::MAX`.
- **ATM-UNIT-02 survives**: `'1e3'`/`.5`/`'01'` are in-range (still `p_1000`,
  `op_0.5`, `m_1`); `'Infinity'`/`'NaN'`/`'0x10'`/`''` still refuse with the
  same codes.
- **Behavior surface that changes** (all unpinned, hence safe, but real):
  extreme-magnitude strings stop minting 22–767-char classes and refuse;
  bare-JSON `0.0`/`-0.0`/`1e21` re-render/refuse; `$r` saturation becomes
  refusal; `>2^53` integer stems canonicalize to their f64 rendering.
  Requires a `rulesVersion` bump and R13 golden rows (magnitudes both sides
  of 1e21/1e-6, `-0`, `0x10`, `""`, `inf`-as-string, `$r` epsilon/saturation).

## Recommendation (challenged revision of the brief's)

Adopt the render exactly as briefed (shortest round-trip, never exponent,
`-0`→`0` — in practice: JS `String(n)` after fencing, Rust `to_string`
after fencing, both behind explicit `render_decimal`/`renderDecimal`), with
these corrections: (a) fence = **finite parsed values** with
`0 < |v| < 1e-6` or `|v| >= 1e21` refuse as `NonCanonicalNumeric`, `0` always
mints `"0"`; non-finite parses keep today's exact-case-refuse/else-passthrough;
(b) fence placed in **both** `canonical_numeric_string` **and** `from_number`
with bare-stem re-render (kills the zmij third renderer); (c) `$r` fenced +
cast guarded, epsilon rule pinned verbatim; (d) **two** grammars (classify vs
canonicalize); (e) fix §3 rules 2–3 wording and the "refused anyway"
parenthetical per findings 2/4/5. Not a blocker: no golden moves, and the
sweep bounds the blast radius to unpinned extreme-magnitude behavior.
