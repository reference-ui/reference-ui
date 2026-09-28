# OPERATION CONTINUITY-01 — Crew SCALE report

**Verdict: there is no closed r-scale table.** Both engines *compute* `N × root`
for arbitrary N. The `120r`/`200r`-in / `140r`-out phenomenon is the **harvest
model**, not a scale: the sheet only carries rules for literals observed in
scanned sources. Stories use `120r`/`200r`; nothing uses `140r`. (Second,
independent gap on the legacy path: min/max props have **zero** rhythm
coverage, so r-values there go verbatim → invalid CSS the browser drops.)

## 1. Where r-values resolve

### 1a. Root token
- `packages/reference-lib/src/core/theme/global.ts:4` —
  `'--spacing-root': '0.25rem'` (emitted via `rootThemeVars`).

### 1b. Legacy/core path (Panda extensions) — COMPUTES for covered props
- `packages/reference-legacy/src/system/panda/config/extensions/rhythm/helpers.ts:64-67` —
  `resolveSingleRhythmValue` does `Number(rhythmValue)` → `getRhythm(n)` for
  **any** numeric. `getRhythm` (`:17-25`) emits `var(--spacing-root)` /
  `calc(N * var(--spacing-root))`. Fractions likewise (`:27-44`).
- `helpers.ts:150-162` — `resolveRhythm` rewrites r-words via postcss-value-parser,
  protecting `var()`/`url()`/`env()` subtrees (`:78-82`).
- `packages/reference-legacy/src/system/panda/config/extensions/rhythm/utilities.ts:31-131` —
  the **closed prop list** that gets the transform: width/height/size,
  fontSize/lineHeight/letterSpacing, padding\*, margin\*, gap\*, inset/top/right/bottom/left,
  scrollMargin\*, scrollPadding\*, border widths, outline, decoration, shadows
  (+ border/shorthand/color spreads). **No `minWidth`/`maxWidth`/`minHeight`/`maxHeight`.**
- `packages/reference-legacy/src/system/panda/config/base.ts:13` — `presets: []`, so
  nothing else supplies a max-width utility. Negative result: the string `maxWidth`
  appears **nowhere** under `packages/reference-legacy/src/system/` (grep-verified),
  and neither does `maxW`. JSX `maxW="120r"` is therefore dropped at Panda
  extraction on this path — it compiles to nothing, not to a class.
- Recipe/base values bypass utilities entirely: `packages/reference-lib/src/core/theme/primitives/forms/field.ts:158`
  (`maxWidth: '36r'`) emits verbatim → `max-width: 36r`, invalid, browser-dropped.
  This is the documented drift: `packages/reference-neo/docs/evidence/voyage-log.md:19`
  ("core sheet carries invalid `max-width: 36/100/120r` (browser-dropped), core
  rhythm utils lack min/max coverage, Neo emits valid calc").

### 1c. Neo/atomic path (Rust) — COMPUTES for every prop
- `packages/reference-rs/modules/atomic/src/resolve/rhythm/mod.rs:43-67` —
  `resolve_single_rhythm` strips `r`, parses **f64** (int/decimal/fraction/negative),
  formats via `:20-31`. No table, no allowlist of magnitudes.
- `packages/reference-rs/modules/atomic/src/resolve/mod.rs:315-341` —
  every atom flows `unit::css_value_from_authored` → `rhythm::resolve_rhythm`
  → `tokens::resolve_token_value`. Rhythm applies to **all** props, including
  min/max (fixes the legacy gap).
- `rhythm/mod.rs:149-166` — `var()`/`url()`/`env()` bodies stay literal (core parity).

## 2. The exact closed sets that DO exist

1. **Legacy spacing-token recognition table** (NOT an r gate — governs
   `values: 'spacing'` token matching only):
   `packages/reference-legacy/src/system/panda/config/extensions/rhythm/tokens.ts:7-28`
   — 19 entries: `px`, `r`, `0.5r`, `1/2r`, `1/3r`, `1/4r`, `1/5r`, `1/6r`,
   `1r`, `1.5r`, `2r`, `3r`, `4r`, `5r`, `6r`, `8r`, `8.5r`, `10r`, `12r`.
   `120r`/`200r`/`140r` are all equally absent — yet covered props still compute them.
2. **Legacy staticCss prop list** —
   `packages/reference-legacy/src/system/panda/config/static-css.ts:1-37`:
   color/background/border-color/padding\*/margin\*/gap/width/height/size/borderRadius.
   No min/max.
3. **Neo prop vocabulary (closed prop set, open values)** —
   `packages/reference-rs/modules/canon/src/css/properties.rs:1652`
   (`maxWidth` → `max-width`, prefix `max-w`);
   `packages/reference-rs/modules/canon/src/dialect.rs:338` (`maxW` → `maxWidth`);
   `packages/reference-rs/modules/canon/src/lib.rs:27-32` (`is_known_style_prop`).
   Unknown props are **rejected with a diagnostic, zero atoms**
   (`modules/atomic/src/resolve/mod.rs:152-165`).
4. **Neo bare-value category table** —
   `packages/reference-rs/modules/atomic/src/resolve/tokens/scale.rs:93-119`
   (spacing props: margin\*/padding\*/gap/inset/sides) and `:121-126`
   (sizes props: `width|height|minWidth|maxWidth|minHeight|maxHeight|size`).
   Governs bare tokens (`maxW="4"` → `sizes.4` lookup), never r-strings.
5. **Neo length-property table** —
   `packages/reference-rs/modules/canon/src/css/values/classify.rs:37`
   (`LENGTH_PROPERTIES`; `maxWidth` entry at `:75`).
6. **The emergent closed set: harvested literals.** The shipped sheet contains
   only values seen in scanned sources —
   `packages/reference-lib/README.md:30-33` ("the shipped CSS only contains rules
   for values used inside the library. App-only values (e.g. `maxW="140r"` …
   construct a class that paints nothing and dev-warns)");
   `packages/reference-lib/scripts/check-dist-fresh.mjs:39-42` ("Story and book
   files … literals compile into shipped CSS (precedent: Tree.story.tsx `120r`)").
   `120r` is in via Tabs/Tree/Field stories + consumer-smoke template
   (`packages/reference-lib/scripts/consumer-smoke/template/src/app.tsx:103`);
   `200r` is in via `packages/reference-lib/src/components/Menu/Menu.book.tsx:86,177,217`;
   `140r` appears in zero lib sources (grep-verified: only `WANTS.md:60-64`,
   `docs/MISSIONS/DAY-REPORT.md:119-120`, `docs/MISSIONS/PLAYTEST-REQUIREMENTS.md:457-468`).

## 3. Prop families: table vs compute vs verbatim

| Family | Core/legacy | Neo/atomic |
|---|---|---|
| margin/padding/gap/inset/sides, width/height/size, font/line, border widths, outline, shadows | **compute** any `Nr` (`utilities.ts:31-131` + `helpers.ts:64-67`) | **compute** any `Nr` (`rhythm/mod.rs:43-67` via `mod.rs:324-341`) |
| min/max width/height | **nothing** (JSX dropped: no utility, `base.ts:13` presets empty) or **verbatim-invalid** (recipes, e.g. `field.ts:158`) | **compute** any `Nr` (same universal pass) |
| colors, radii, fonts, shadows, zIndex, easings, bare spacing/sizes | token table (`tokens.ts`, panda theme) | **table**: BaseSystem dictionary (`tokens/mod.rs:30-51`), category map (`scale.rs`) |
| whole-CSS values (`calc()`, `var()`, keywords, lengths) | passthrough (`resolveRhythm` no-op when unchanged, `helpers.ts:161`) | **verbatim** passthrough (`tokens/mod.rs:39-41` `is_whole_css_value`) |
| unknown dotted paths / `{bad}` refs | n/a | warn-through verbatim / error + drop atom (`tokens/mod.rs:4-6`, `:115-120`) |
| unknown props | silently dropped by Panda | **rejected** + `UnknownProperty` diagnostic (`mod.rs:152-165`) |
| bare numerics (`"4"`, `1e3`) | Panda/numeric handling | **compute w/ fence**: canonicalize, `px`-suffix on dimensional props, refuse hex/`NaN`/out-of-range (`unit.rs:29-57`, `:108-124`) |

## 4. `maxW="140r"` end-to-end

- **Neo, scanned source** (e.g. app running `ref sync`): atlas records every JSX
  literal attribute with no prop filter
  (`modules/atlas/src/usage/walker.rs:find_jsx_occurrences`,
  `modules/atlas/src/internal.rs:133-136` `JsxAttribute`) → want
  (`maxW`,`"140r"`) → alias → known `maxWidth` (`properties.rs:1652`) →
  `CssValue::String` (`unit.rs:228`) → rhythm computes
  `calc(140 * var(--spacing-root))` (`rhythm/mod.rs:29`) → whole-CSS passthrough
  (`tokens/mod.rs:39-41`) → atom + rule emitted. **Compiles. Continuous.**
- **Neo, unscanned consumer** (shipped `styles.css`, no `ref sync`): runtime namer
  constructs the class anyway (`packages/reference-neo/src/runtime/css/css.ts:259-278`);
  the miss probe scans live `@layer utilities` rules and dev-warns once, naming
  value + prop + call site
  (`modules/atomic/js/namer/miss.ts:31-53`,
  `runtime/css/css.ts:124-144`, message at `:133-135`). **Paints nothing + dev warn.**
  This is exactly the README-documented `140r` case.
- **Legacy/core**: dropped at extraction (no utility) or, if authored in a recipe,
  emitted as invalid `max-width: 140r` and dropped by the browser. Never paints.

## 5. Seam for arbitrary numerics (name only — not implemented)

- **Neo/scanned: no hook needed** — already continuous (`rhythm/mod.rs:43-67`).
  The gap is harvest scope, not math.
- If HQ wants unscanned-consumer `140r` to paint, the seam is the **runtime
  miss path**: `packages/reference-neo/src/runtime/css/css.ts:reportStyleMisses`
  + `packages/reference-rs/modules/atomic/js/namer/` (construct class → probe
  proved absence → today only warns). A runtime fallback-emission behavior would
  attach here. Alternative seam: harvest scope (scan consumer sources) so the
  class is pre-compiled.
- If HQ wants the legacy path fixed, the seam is
  `…/rhythm/utilities.ts:31-131` (add min/max `rhythmTransform` entries).
- W-04 relevance (`WANTS.md:54-69`): per the HQ challenge note, loud failure is
  only coherent for genuinely malformed values (unknown props — already
  `UnknownProperty`-rejected at `mod.rs:152-165`) — not for in-between
  numerics, which are a harvest miss, already dev-warned at `css.ts:133-135`.
