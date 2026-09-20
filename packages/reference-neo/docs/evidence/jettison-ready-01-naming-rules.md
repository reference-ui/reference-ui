# Jettison READY ask 1 — Naming-rules completeness

Challenge audit of `operation-jettison.md` §3 (20 naming rules) against the tree.
Read-only walk of `resolve/`, `runtime/builder.rs`, `stylesheet/name/`, plus the
canon tables, `atom/`, base-system accessors, and the Neo `css()` entry path that
feeds the runtime namer. Verdicts below are per-rule; corrections first.

Method: every class-minting call site (`class_name_with_system` callers:
`builder.rs:231,272,319`, `assembly.rs:177` legacy map, the `name/mod.rs` join)
traced backwards to every site where the emitted `{prop, stem}` differs from
`canonical(prop)` + `sanitize(authored)`. Counts re-measured 2026-09-20; float,
whitespace, and case claims verified by probes in `/tmp/jettison-probe/`
(`parse.rs`, `num.js`, `ws.rs` — rerunnable, not committed).

## Verdict

The 20 rules cover the mechanism set, with **one missing row**, four rules
needing corrections, one D4 amendment, and two sizing drifts. No missing
*mechanism* was found: every divergence point below already has a home in §3
or §9 once corrected.

## F1 (missing row): `--*` custom props need rule 21 — and it is load-bearing, not docs

§3 has no row for `--*`, yet three code sites special-case it and one of them
is a genuine divergence trap for the §5 prefix table:

1. `canon::is_known_style_prop` (`canon/src/lib.rs:27`) — `--*` always known.
2. `canon::is_unitless_prop` (`canon/src/css/mod.rs:167`) — `--*` always
   unitless (numbers stay bare). Combined with `accepts_bare_number` defaulting
   true for non-color props (`unit.rs:130`), `--gap: 4` and `--gap: '4'` both
   canonicalize to stem `4`.
3. `class_prefix_for_prop` fallback (`canon/src/lib.rs:45`) — no `Property`
   record exists for any `--*` name, so the prefix is the prop **verbatim**.

Trap: the §5 `prefixes` table ("only where ≠ kebab, ~84% fall back") computes
the fallback as `kebab(canonical)`. For lowercase custom props that coincides
(`--brand-x`), but for `--brandX` Rust emits prefix `--brandX` verbatim while
`kebab()` yields `--brand-x`. **DIVERGENT.** The fallback order must be:
table hit → `--*` verbatim → `kebab(canonical)`. (Ask 8 carries the exact
criterion; the 5 `ms-` exceptions to kebab-purity are also there.)

Corollary, verified: the `find_property`-miss fallback arm serves **only**
`--*` among naming-reachable props. All 315 aliases resolve to canonicals with
records; of the 5 `REFERENCE_PROPS`, `r`/`size` have records and
`weight`/`variant`/`colorMode` are intercepted by `lower_macro` before naming.
So rule 21 is small: "`--*`: prefix = prop verbatim; unitless; bare numbers
canonicalize; token unique-name lookup is sheet-side only
(`tokens/mod.rs:241`)."

## F2 (rule 7 correction): the dimensional gate is an allowlist + token-count window, not len-4

- `shorthands/mod.rs:24` gates on `canon ∈ {padding, margin, inset}` **and**
  `2..=4` tokens. Props with 4 canon longhands outside the allowlist
  (`borderWidth`, `borderRadius`, `inset` is in) stay whole — e.g.
  `borderWidth: '1px 2px'` mints one `bd-w_1px_2px` class. The lowering table
  must mirror the allowlist, not `longhands.len() == 4`.
- 0, 1, and 5+ tokens all stay whole (rule 7 names only 1). 0-token (`''`,
  whitespace-only) then refuses at the unit stage — a D4 free refusal.
- `dimensional.rs::expand_single` (1-token → 4 longhands) is **dead via the
  production path**: the only caller (`mod.rs`) never forwards 1 token. The
  function exists for direct callers/tests only. Do not mirror it; mirror the
  gate.

## F3 (rule 8 correction): five case/ordering facts the corpus must pin

From `border.rs` + `parser.rs` (all deterministic, all mirror-or-diverge):

1. `trimmed == "none"` is **case-sensitive**; `None` falls through to
   classification, where `is_border_style` lowercases → `border: 'None'`
   mints `bd-s_none` (style longhand), while `border: 'none'` stays whole
   (`border_none`). Same split for `outline` vs the transparent ring (ring
   requires exact `'none'`).
2. The zero gate is a closed 5-spelling set — `"0"`, `"0px"`, `"0rem"`,
   `"0em"`, `"0%"` — all emitting width `"0px"`. `0r`, `0vw`, `0ch`, `0.0`
   trio-split instead. (Ask 8 ships this as `keywords.zeroBorder`.)
3. Style tokens are stored **lowercased** (`to_ascii_lowercase`); width and
   color tokens are stored **raw** (`parser.rs:14`). `border: 'Solid 3PX RED'`
   → `bd-s_solid` + `bd-w_3PX` + `bd-c_RED`.
4. First-of-kind wins and extras are **dropped, never re-fallthrough**
   (`'3px 4px solid'` loses `4px`; it does not become the color).
5. `is_outline` is `canon == "outline"` only: a vendor outline trio (if canon
   lists one, e.g. `mozOutline`) classifies styles with the *border* set
   (no `auto`). The lowering table must carry the style set per prop
   (ask 8: `style: 'border' | 'outline'`).
6. `is_whole_value` lowercases before the `var(`/`borders.`/`outlines.` tests
   but stores the trimmed **original** (`border: 'Var(--bd)'` → whole,
   `border_Var(--bd)`).

Bonus: `build_expanded_atoms`'s all-`None` arm is unreachable (a non-empty
token list always assigns ≥1 kind). Harmless.

## F4 (rule 12 correction): `container` reads `class_name_str` of *any* value kind

`container.rs:14` branches on the rendered string, not the JSON kind:

| Authored | Rendered | Declarations |
|---|---|---|
| `true` (bool) | `"true"` | `containerType` only |
| `"true"` (string), `$token` path `"true"` | `"true"` | `containerType` only |
| `""` | `""` | `containerType` only |
| `false`, `null`, `0`, `" "`… | `"false"`, `"null"`, `"0"`, `" "`… | `containerType` + `containerName <rendered>` |

So `container={false}` mints `containerName_false`, and `container={null}`
mints `containerName_null` — on **both** the want and plan paths
consistently (verified by reading; `test_container_bool_still_lowers` pins
only the `true` arm — recommend a golden row for `false`/`null`). The
`css()` hole-drop (`null`/`undefined`/`false`) never fires here because it
runs before query construction only on the runtime path; the compiler path
pushes the want. Consistent once mirrored; the lowering guard order
(bool → empty → eq-`"true"` → default) is fixed in ask 8.

`" "` (whitespace-only) falls to default, then the unit stage refuses the
`containerName` declaration while keeping `containerType` — refusal is
**per-declaration after lowering**, which Slice 2 must preserve (same for
`border: 'NaN solid red'`, where the width drops but style+color keep).

## F5 (rule 20 correction): named `r` forms are *not* "already lowered in JS"

- Extract lowers three `r` key forms (`object/keys.rs:48`): `300`/`md`
  (anonymous) plus `card/md` (slash) and `md@card` (`@`) named-container forms
  via `lower_r_key_named`.
- `lowerResponsiveStyles.ts` lowers **anonymous numeric keys only**
  (`Number.isFinite(Number(trimmed))`); anything else returns `null` and the
  `r` object stays on the query path, where it later drops as an unknown
  condition (generic path — no class, correctly).
- So compile-time named-`r` works, runtime named-`r` is a miss. Pre-existing
  asymmetry, not a blocker: the rule should read "anonymous numeric `r` is
  lowered in JS before lookup; named forms drop through the generic path".
  Fixing it at runtime would need breakpoint widths, which §3 deliberately
  excludes from the tables — recommend documenting the asymmetry over
  extending the tables.

Related, extract-side only (never reaches the namer, noted for completeness):
`is_numeric_key` uses ungated `parse::<f64>`, so `r={{ inf: … }}` lowers at
extract while the runtime keeps it — absurd input, deterministic both sides.

## F6 (D4 amendment): ship the 27 unrealizable extensions as data, or name them construct-otherwise

`UNREALIZABLE_EXTENSIONS` (canon, 27 entries) includes live-looking props:
`truncate`, `spaceX`/`spaceY`, `translateX`/`Y`/`Z`, `srOnly`, `textStyle`,
`gradientFrom/To/Via*`, `backgroundConic/Linear/...`. All refuse at the
expansion fall-through (`resolve/mod.rs:181`) — including `truncate`, which has
a canon `Property` record but no lowering arm. (`textGradient` is also listed
but shadowed by `lower_macro`, which runs first — the interpreter must check
lowerings before the unrealizable set, mirroring `expand_or_passthrough`.)

These are realistic author inputs, unlike `NaN`. Options: (a) ship
`keywords.unrealizable` (27 static strings, one author) and refuse — recommended,
it makes a whole systematic divergence class vanish and matches compiler
diagnostics; (b) leave them in D4 "construct otherwise" explicitly. Either way
D4 must name them; R4 tolerates (b) but the DOM fills with dead classes for
every `truncate` call site.

## Particulars from the brief — all confirmed

- **gradient.rs token interpolation**: sheet-body only. `gradient::lower`
  clones the authored value onto `backgroundImage`; interpolation runs later in
  `tokens/` and only rewrites `CssValue::Token.value`, never the class path
  (`apply_rhythm_and_tokens`, `resolve/mod.rs:278`). Correctly absent from §3.
- **`r` named-container form**: see F5 — the one place the brief over-claims.
- **`--*` custom props**: see F1 — prefix = prop verbatim; leading `-`
  escaping is selector-only (`escape.rs:32`); unitless + bare-number-accepting.
- **Number on unitless vs dimensional**: same stem, different CSS, confirmed
  (`resolve_numeric_value`, `unit.rs:82`). Stronger: on *color* props, JSON
  number `4` → `Dimension` (CSS `4px`) while string `'4'` stays `String` (CSS
  `4`) — same class `c_4`, different paint. The namer is unaffected either way.

## Table-count verification (brief §3 "Tables" + §9 line counts)

| Claim | Measured | Verdict |
|---|---|---|
| aliases 315 | 315 (`Alias::new` count) | ✓ |
| prefixes: ~150–180 non-kebab | **193** by `prefix ≠ css`; **198** by shippable `prefix ≠ kebab(canonical)` | ✗ undercount (ask 8; 5 `ms-` props break kebab-purity) |
| color props 71 | 71 | ✓ |
| breakpoints 5 default | 5 (`sm..2xl` + leading `base`) | ✓ |
| presets 12 | 12 | ✓ |
| `stylePropNames` ~1.4k | 1073 + 315 + 3 = 1391 | ✓ |
| `resolve/mod.rs` 270 lines | **298** | ✗ stale |
| all other §9 line counts | exact | ✓ |

## Latent contract (no alias targets a macro prop — pin it)

`lower_macro` and `is_runtime_owned` compare the **authored** prop (`"font"`,
`"border"`, `"variant"…), while every other site resolves aliases first. Today
this is moot — no alias targets `font`/`weight`/`container`/`size`/
`textGradient`/`border`/`variant`/`colorMode`/`fontFamily` (full 315-entry
sweep: vendor-capitalization + 22 shorthand aliases only). But a future
`Alias::new("sz", "size")` would silently skip the macro in Rust while a
canonical-keyed lowering table would apply it. Recommend a guard test
(no alias may target a macro/runtime-owned prop) rather than moving Rust to
canonical matching mid-operation.

## Adjacent pre-existing skews (not jettison blockers, one line each)

1. Responsive-leaf `!`: extract *refuses the want* (`refuse_leaf_important`,
   `responsive.rs:168`) but plan capture *includes the cleaned leaf*
   (`ast_value.rs:208`), so the plan carries a class the sheet lacks. Pre-existing.
2. Plan-capture `as i64` saturation (`ast_value.rs:34`): `|v| > i64::MAX`
   near-integers saturate in plans but render full-decimal in wants.
   Pre-existing, absurd input.
3. `CssRuntime` (`CompileResult.css`) is a second per-atom map, but it rides
   `CompileResult`, not the shipped `NativeRuntimeArtifact` — out of scope
   (ask 4 owns the consumer sweep); GHOST-02 retitle covers it.
4. Multi-fold templates in single-valued plan positions take the first fold
   (`ast_value.rs:232`) while wants take all — pre-existing skew, absurd input.

## Rule-by-rule confirmation (rules without findings)

1 ✓ (`normalize.rs` + `sanitize`; collapse does not trim — mirror must not
either). 2/3 ✓ (finite-gated parse; `from_number` skips `accepts_bare_number`
— same class, noted above). 4/5 ✓ (`$token`→path; `$r` with 1e-6 epsilon +
Display + saturating `as i64` — lexical goldens in ask 9; non-numeric `$r`
renders via JSON `to_string`, quotes included). 6 ✓ (three split sites agree:
`literal.rs`, `ast_value.rs`, `css.ts`; `eq_ignore_ascii_case` vs
`toLowerCase` is an ask-9 micro-row). 9 ✓ (6-allowlist, value cloned for any
kind). 10 ✓ (exact/case-sensitive/trim-tolerant; JSON number `1` rewrites
too). 11 ✓ (blind clone). 13 ✓ (trio + generic pipeline per longhand). 14 ✓
(bool-`true` only; `false` refuses). 15 ✓ (family + `css.fontWeight` >
`weights.normal` > `400` + ordered extras with IndexMap overwrite-keeps-position
semantics). 16 ✓ (`split_once('.')` scoped → exactly the 6 listed keywords →
raw). 17 ✓ (any value, incl. arrays/objects via member-wise drop). 18 ✓
(index→name incl. `base`@0, `null` skips, beyond-scale skips silently;
`base` member gets slot `@base` with no class segment). 19 ✓ (breakpoint keys
→ `@bp` slot + condition; other keys → nested `when`; whole-object single
important; see skew (1) for leaf-`!`).
