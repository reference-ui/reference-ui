# CONTINUITY-T RULE — verdict: BREAK

Date: 2026-09-27. Oracle (independent of finder and reproducer).

## Firsthand verification

Oracle replayed `/tmp/doom-t-repro-independent.mts` unmodified: `--spacing-4: 1r`
minted into `@layer tokens`, diagnostics count 0, utility served as
`.repro-t__p_4 { padding: var(--spacing-4); }`. Claim confirmed exactly.
Oracle also read `stylesheet/system_layers/mod.rs:196-215` vs `:286-295`:
keyframes resolve through the `css()` + rhythm + token chain while
`css_token_value` expands only whole-value `{brace}` aliases and prints the
rest verbatim. The asymmetry is real and firsthand.

(The "live plan" clause is immaterial: the repro shape exposes no `plan`
field, but the break — invalid mint + silence + healthy-looking utility —
does not depend on it.)

## Ruling: genuine BREAK

No contract blesses this behavior:

- `1r` is engine grammar with a pinned lowering (`SPEC.md` ATM-RHYTHM-01:
  `1r` → `var(--spacing-root)`), resolved in utilities and keyframes. It is
  not a CSS unit in any browser, so `--spacing-4: 1r` is guaranteed-invalid
  and every `padding: var(--spacing-4)` substitution is silently dropped paint.
- The tokens-layer verbatim license covers only *unresolvable* values: SPEC
  ATM-LAYER-10 pins "Unresolvable values print verbatim (spec-owned, no
  source location), mirroring the tokens layer." `1r` is resolvable — the
  keyframe path proves it — so verbatim here exceeds the license.
- `resolve/tokens/README.md` Must-not: "Fail closed: diagnostic + `Raw` /
  passthrough only when the author wrote a raw CSS value." The author wrote
  engine grammar the compiler resolves everywhere else, not raw CSS.
- ATM-TOKEN-12 sets the fail-closed precedent: bad token-adjacent input must
  diagnose and omit so the sheet stays valid CSS. This mints invalid CSS with
  silence — the opposite direction.

## Severity (honest)

User-facing consequence, latent trigger. When triggered: silent wrong paint
(a whole spacing scale drops in the browser, zero diagnostics) on fully
static authorship — the worst combination. But no in-tree system or fixture
authors r-valued tokens today (oracle swept `tests/` for token definitions
with r values and goldens minting `: Nr;` — none found; matches are utility
authorship, a different slot). Trigger requires a theme author to write a
rhythm/alias expression as a token value. Real BREAK, not a drill; not a
five-alarm fire.

## Fortify boundary

**May change:** `css_token_value`
(`packages/reference-rs/modules/atomic/src/stylesheet/system_layers/mod.rs:286-295`) —
the single choke point. Both `TokenMode::Light` and `TokenMode::Dark` flow
through `write_token_entry` → `css_token_value`, so one fix covers both modes.

**Two acceptable closes** (oracle constrains, fortify chooses):

- (a) *Resolve*: run engine-grammar values through the rhythm chain before
  the verbatim fallback, mirroring `resolve_keyframe_value`. Reuse
  `resolve::rhythm::resolve_rhythm` (already imported in the module) — never
  fork a second rhythm lowering.
- (b) *Refuse*: emit a diagnostic and omit (or valid-fallback) r-valued token
  slots so the sheet stays valid CSS, per the ATM-TOKEN-12 precedent.

Either close must satisfy: no invalid-CSS mint, no silence.

**Must move together:** light + dark paths (same function — automatic, but pin
both with a dark-override r-valued twin case).

**Cycle guard:** resolving `1r` → `var(--spacing-root)` inside a token value
is safe except when the token itself defines `--spacing-root` (rhythm root
defined in terms of rhythm = self-reference). If direction (a), fortify must
handle that edge (refuse with diagnostic); do not introduce
self-referential vars.

**Sweep obligations:**

- Re-sweep goldens/cases for raw r mints (`:\s*[0-9.+-]*r\s*;`) across
  `packages/reference-rs` tests, lib fixtures, and the `ATM-COND-01` golden.
- Sibling-slot check: `staticCss` wildcard expansion, recipe token emit, and
  any other emitter that prints raw token values into the sheet — cover them
  or rule each out with cited evidence. The doom-log gap on opacity
  modifiers over non-color tokens (`{spacing.4/50}` → `color-mix` over a
  length var) is explicitly OUT of this fortify's scope; do not expand into it.
- Keep ATM-TOKEN-11 green: the `{brace}` → `var(--…)` path (heavily pinned by
  the `ATM-COND-01` golden) must not regress.

**Stays untouched:** utility resolution (`resolve_token_value`, rhythm in
utilities), the keyframe path (reference implementation, already correct),
raw-CSS passthrough for genuine CSS values (`0.25rem`, `#fff`, `rgba(…)` —
the ATM-TOKEN-14 CSS-wins principle), layer order/preamble, class naming,
`--spacing-root` semantics.

**Pins / regression case owed:**

1. `spacing.4 = "1r"` mints `--spacing-4: var(--spacing-root)` (direction a,
   zero diagnostics) OR emits a located diagnostic with no invalid
   declaration (direction b).
2. Dark-override twin of (1).
3. Guard: genuine raw CSS token values (`0.25rem`) still print verbatim with
   zero diagnostics.
4. If direction (a): `--spacing-root`-as-r-value edge case pinned (no
   self-referential var).
5. ATM-TOKEN-11 brace-alias behavior stays green (existing station, no new pin
   needed — just don't break it).

Fortify runs under the `agent-rs` quality gate (complexity/file limits, no
clippy allows). No fixes were made by this crew.
