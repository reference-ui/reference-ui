Goal: make the atomic compiler resolve TONES — a colour token at a named opacity, `bg="blue.500/medium"` — through the existing opacity modifier, with a per-property role amount and an unknown-tone diagnostic. Rust only, with Rust unit tests. (Spec stations, SPEC.md and the Neo diagnostic case are a later job; do not write them.)

## Background

Today `blue.500/10` resolves to
`color-mix(in srgb, var(--colors-blue-500) 10%, transparent)` in
`packages/reference-rs/modules/atomic/src/resolve/tokens/mod.rs`
(`resolve_pathed_value`, `split_opacity`, `opacity_suffix`, `format_entry`,
`format_color_mix`, `malformed_opacity`) and inside braces in
`resolve/tokens/interpolate.rs` (`SegmentExpander::expand_open`).

Tones are ordinary tokens in category `tones`, declared like
`tokens({ tones: { medium: { surface: { value: '10%' }, line: { value: '34%' } }, hush: { value: '6%' } } })`.
In the `BaseSystem` they are entries keyed `tones.medium.surface`,
`tones.medium.line`, `tones.hush` with css vars `--tones-medium-surface`,
`--tones-medium-line`, `--tones-hush` (no lowering changes are needed; use
`system.token("tones.medium.surface")` etc.).

## Required behaviour

1. **Emit.** A resolved tone emits a custom property, not a literal:
   `color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-surface), transparent)`.
   Numeric modifiers must stay byte-for-byte identical to today.

2. **Gate order for a bare (unbraced) value `path/suffix`** in `resolve_pathed_value`:
   a. whole-value dictionary hit first (today's `lookup_entry(prop, whole)`), then
   b. numeric suffix (today's behaviour, unchanged), then
   c. the TONE path, only when ALL hold: `suffix` is an identifier
      `[A-Za-z][A-Za-z0-9_-]*`; `path` does not start with `-`; `path` is not a
      CSS colour keyword (reuse `colors_keyword(path)`; e.g. `white/medium`,
      `transparent/medium`, `currentColor/medium` never take the tone path even
      if a `colors.white` token exists); and `lookup_entry(prop, path)` returns
      an entry whose `category()` is `colors`.
   d. otherwise today's behaviour exactly (malformed-opacity warning when
      `malformed_opacity` says so, else lookup/interpolate/fallback).
   Note: today a whole-value hit is checked AFTER `split_opacity`; keep numeric
   semantics as-is and only make the tone path come after the whole-value hit.
   `resolve_negated_token` must not resolve tones: `-blue.500/medium` must keep
   today's behaviour (it currently warns UnknownTokenPath and passes through raw).

3. **Role.** The amount depends on the property (canonicalise first with
   `canon::resolve_canonical_prop`). Two roles: `surface` and `line`.
   `line` = any canonical property starting with `border` or `outline`, plus
   exactly: `color`, `caretColor`, `columnRule`, `columnRuleColor`,
   `rowRuleColor`, `ruleColor`, `textDecoration`, `textDecorationColor`,
   `textEmphasis`, `textEmphasisColor`, `stroke`, `strokeColor`, `boxShadow`,
   `boxShadowColor`, `textShadow`, `textShadowColor`, `webkitTextFillColor`,
   `webkitTextStroke`, `webkitTextStrokeColor`, `webkitTextDecorationColor`,
   `webkitTextEmphasisColor`, `webkitColumnRuleColor`, `webkitBorderBeforeColor`,
   `mozColumnRuleColor`, `mozOutlineColor`, `mozTextDecorationColor`,
   `mozBorderBottomColors`, `mozBorderEndColor`, `mozBorderLeftColors`,
   `mozBorderRightColors`, `mozBorderStartColor`, `mozBorderTopColors`.
   `surface` = everything else (background*, bg, fill, accentColor,
   floodColor, lightingColor, stopColor, gradient*, scrollbarColor,
   webkitTapHighlightColor, msScrollbar*, fillImage, strokeImage, custom
   properties `--x`, unknown props). Expose it as a small enum + fn in a new
   file, with a unit test per family including `webkitTextFillColor` → line
   and one `ms*`/`moz` default → surface. Do NOT add anything to canon's
   COLOR_PROPERTIES.

4. **Tone lookup** for name N and role R: `tones.N.R`, then `tones.N` (flat
   leaf serves every role), then `tones.N.surface` (a surface-only tone serves
   every role). The first hit wins.

5. **Value shape.** A tone entry is usable only if its light value, and its
   dark value when present, is `<number>%` (e.g. `10%`, `12.5%`) or a whole
   `{tones.<path>}` reference to another tones entry that is itself usable
   (follow at most 8 hops). Anything else (e.g. Arc-style `0.1`) is treated
   exactly like an unknown tone (item 6) so invalid CSS is never emitted.

6. **Unknown tone, bare value** → a new PASSTHROUGH WARNING, value stays raw
   (same mechanics as `DiagnosticCode::MalformedOpacity` / `TokenDetail::MalformedOpacity`):
   - code `DiagnosticCode::UnknownTone`, string `ATM-W-UNKNOWN-TONE` (append;
     never rename existing codes);
   - `TokenDetail::UnknownTone { text, tone }` (text = the authored value);
   - message: ``unknown tone `mediun` in `blue.500/mediun` ``;
   - help: a did-you-mean line over the system's tone NAMES (first segment
     after `tones.`) when one is near, then a fix line:
     ``declare it with tokens({ tones: { mediun: { surface: { value: '10%' }, line: { value: '34%' } } } }) — tone values are percentages — or use /<0-100>``.
   Wire every touchpoint: `diagnostics/codes.rs` (variant + table row + any
   code-list tests), `diagnostics/facts.rs`, `diagnostics/policy/resolve.rs`
   (sentence + help arms), `resolve/suggest.rs` (`token_suggestion` arm ranking
   tone names; `supports_code`), the suggestion code list in the shared
   diagnostics crate's `message.rs` (`SUGGESTION_CODES`, update its length
   test), the shared registry `packages/reference-rs/modules/diagnostics/js/index.ts`
   (fix line for the code) and `packages/reference-rs/modules/diagnostics/REGISTRY.md`
   (row), plus any generated napi mirrors that list codes (search for
   `ATM-W-MALFORMED-OPACITY` across `packages/reference-rs` excluding
   `target/` and `node_modules/` and mirror it for the new code everywhere in
   that package; if a mirror is generated, regenerate it with the package's
   own script rather than hand-editing). Do not edit `packages/reference-neo`.

7. **Braces.** Inside `{…}` interpolation (`interpolate.rs`), `{colors.blue.500/medium}`
   resolves with the same gate (identifier suffix, colours base, keyword and
   value-shape checks) and the role of the OUTER property
   (`border: '1px solid {colors.blue.500/medium}'` → line var;
   `boxShadow: '0 0 0 3px {colors.blue.500/medium}'` → line var). An unknown or
   unusable tone inside braces is an ERROR that drops the atom, reusing
   `DiagnosticCode::UnknownTokenReference`, with message
   ``unknown tone `mediun` in `{colors.blue.500/mediun}` `` and, when one is
   near, `` (did you mean `medium`?)`` appended. Severity must be Error.

8. **Untouched:** static_css, negated tokens, CSS keywords, non-colour bases
   (`spacing.4/medium` keeps today's malformed warning), values whose whole
   path is a declared token (e.g. a colour key `a/b`).

## Code organisation and quality

Put the tone logic (role map, suffix shape, lookup, value-shape check,
formatting) in new files under `resolve/tokens/` (e.g. `tones.rs`, plus a
`tones_tests.rs` or `#[cfg(test)]` module), keeping `mod.rs` edits to the
gate wiring — `mod.rs` is already over the 365-line warning. Each new file
needs a 2–6 sentence `//!` header. Follow AGENTS.md section 4: no `#[allow]`,
no unwrap/expect in library code, functions small, ≤ 5 args (use a context
struct if needed). Update `resolve/tokens/README.md` with a short tones
paragraph (no file lists).

## Unit tests (Rust, colocated)

Using small `BaseSystem`s built with `TokenLeaf` (category `tones`, paths
`medium.surface` etc.; see `resolve/tokens/tests.rs` helpers):
- `bg` and `borderColor` with `blue.500/medium` → surface vs line vars;
- flat tone serves both roles; surface-only tone serves line;
- numeric `blue.500/10` and `blue.500/25%` unchanged byte-for-byte;
- unknown tone bare → raw + one `ATM-W-UNKNOWN-TONE` warning whose help has
  `did you mean` `medium`;
- fraction-valued tone (`0.1`) → treated as unknown (raw + warning, no color-mix);
- `-blue.500/medium` → unchanged behaviour (raw, UnknownTokenPath warning, no color-mix);
- `white/medium` with and without a `colors.white` token → no tone path;
- a colour token whose key literally contains a slash (`colors` path `a/b`) plus
  a tone named `b` → the literal token wins (`var(--colors-a/b)`-style output as today);
- braces: line var in `border`/`boxShadow` composites; unknown tone in braces
  → atom dropped + Error severity with the tone message;
- `spacing.4/medium` on `mt` → today's behaviour.

## Done when (run from /Users/ryn/Developer/reference-ui)

- `pnpm agentrs c atomic` passes
- `pnpm agentrs v atomic` passes with ZERO golden changes (do not pass
  `--update-goldens`; `git status` must show no changes under
  `packages/reference-rs/modules/atomic/tests/cases`)
- `pnpm agentrs c diagnostics` (or the shared diagnostics crate's name — find it) passes
- `pnpm agentrs q` reports zero code violations for every file you touched

Report summary: the gate order as implemented (function names), the role
function, the new code's message/help text exactly as rendered in one unit
test, the list of files touched (and why each registry/mirror changed), and
the pass counts of each done command.
