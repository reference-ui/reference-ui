Goal: pin TONES in the atomic spec stations and the Neo diagnostic repro suite. The engine already implements tones (commit def96d905); this job writes contract tests and their docs only. Do not change any Rust or TS source outside the test/case/spec files named here — if a station exposes an engine bug, stop and report it with the failing assertion.

## What tones are (implemented)

`bg="blue.500/medium"` → `color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-surface), transparent)`.
The property picks the role: `line` for border*/outline* and the composites,
`color`, `caretColor`, column/row rules, text decoration/emphasis, `stroke`,
`boxShadow(Color)`, `textShadow(Color)`, `webkitTextFillColor` and vendor
mirrors; `surface` for everything else (bg, fill, accentColor, …). Lookup:
`tones.N.role` → flat `tones.N` → `tones.N.surface`. Tone values must be
`<number>%` (or a whole `{tones.x}` alias to one), else the tone counts as
unknown. Bare unknown tone → warning `ATM-W-UNKNOWN-TONE` ("unknown tone
`mediun` in `blue.500/mediun`", help "did you mean `medium`?" + a fix line),
value painted raw. Braced unknown tone → `ATM-E-UNKNOWN-TOKEN` error ("unknown
tone `mediun` in `{colors.blue.500/mediun}` (did you mean `medium`?)"),
declaration dropped. Untouched paths: numeric modifiers byte-identical;
negated `-blue.500/medium` (UnknownTokenPath warning, raw); CSS keywords
`white/medium`, `transparent/medium` never take the tone path; bare
`boxShadow: 'blue.500/medium'` keeps the malformed-opacity warning (boxShadow
is not a canon colour prop — tones reach it only through braces). The frozen
lib fixture (`packages/reference-rs/modules/atomic/tests/fixtures/lib-system-spec.json`)
now ships ghost/medium/firm/strong with surface 4/10/14/18% and line
22/34/46/58%.

## Part A — atomic stations (`packages/reference-rs/modules/atomic/tests/cases/`)

Copy the shape of `ATM-TOKEN-06` (lib fixture: `input/src/App.tsx`,
`spec.ts`, `README.md`, generated `output/`) and `ATM-TOKEN-05` (custom
`input/baseSystem.json`). New stations, each with a sharp README first line:

- `ATM-TOKEN-19` tones happy path + role map (lib fixture). One `css({…})`:
  `bg`, `borderColor` (both `blue.500/medium`), `color: 'blue.500/strong'`,
  `outlineColor: 'blue.500/firm'`, `fill: 'blue.500/ghost'`,
  `stroke: 'blue.500/ghost'`, `accentColor: 'blue.500/medium'`,
  `webkitTextFillColor: 'blue.500/medium'`,
  `border: '1px solid {colors.blue.500/medium}'`,
  `boxShadow: '0 0 0 3px {colors.blue.500/medium}'`. Assert each emitted
  declaration exactly (surface var for bg/fill/accentColor, line var for the
  rest), that `@layer tokens`… is collapsed as usual, and zero diagnostics.
- `ATM-TOKEN-20` numeric modifier unchanged beside tones (lib fixture):
  `bg: 'blue.600/50'`, `borderColor: 'red.500/25%'`, `outlineColor: 'blue.500/medium'`.
  Assert the two numeric declarations are byte-identical to the ATM-TOKEN-03
  forms (`color-mix(in srgb, var(--colors-…) N%, transparent)`) and the tone
  one uses `var(--tones-medium-line)`.
- `ATM-TOKEN-21` unknown tone diagnostics (lib fixture):
  `bg: 'blue.500/mediun'` (warning, raw `background: blue.500/mediun;`,
  help contains did-you-mean `medium`) and a SECOND css call with
  `border: '1px solid {colors.blue.500/mediun}'` plus a valid sibling
  `color: 'blue.500'`: assert an Error with the tone message, the border
  declaration absent, the sibling present. Assert code, severity, message,
  help, file/line/column via the golden `diagnostics.json`.
- `ATM-TOKEN-22` custom tones via `tokens()` (own `input/baseSystem.json`,
  shape of ATM-TOKEN-05, with `colors.brand` and tones: flat
  `hush: { value: '6%' }`, `medium: { surface: { light/value '12%', dark '16%' }, line: { value: '30%' } }`,
  surface-only `wash: { surface: { value: '8%' } }`, fraction-valued
  `arc: { value: '0.1' }`). Assert: `bg: 'brand/hush'` and
  `borderColor: 'brand/hush'` both use `var(--tones-hush)`; `bg: 'brand/medium'`
  uses the surface var and `@layer tokens` prints `--tones-medium-surface: 12%`
  plus `16%` under the dark selector; `borderColor: 'brand/wash'` uses
  `var(--tones-wash-surface)`; `bg: 'brand/arc'` is raw with one
  `ATM-W-UNKNOWN-TONE` warning. (Check how the station harness treats
  `@layer tokens` for custom systems — ATM-TOKEN-05 asserts `--colors-brand: red;`.)
- `ATM-TOKEN-23` paths tones never take (lib fixture): `color: '-blue.500/medium'`,
  `bg: 'white/medium'`, `borderColor: 'transparent/medium'`,
  `boxShadow: 'blue.500/medium'`. Assert none emits `--tones-`, each keeps
  its pre-tones behaviour and diagnostic (record what the compiler emits and
  confirm it matches the "untouched paths" above; if it does not, stop and report).

Generate outputs with `pnpm agentrs v atomic --update-goldens` and then run
`pnpm agentrs v atomic` without the flag. Existing stations' outputs must not
change (`git status` must show only the new case folders plus the doc files below).

Update `packages/reference-rs/modules/atomic/SPEC.md`: a `[x]` entry per new
station in the TOKEN section (same style as the ATM-TOKEN-06 entry: what is
compiled, what is asserted, why), the station table rows, and the TOKEN count
in the summary table. Mention tones in `ATM-TOKEN-03`'s neighbourhood only by
adding the new entries; do not rewrite existing entries.

## Part B — Neo diagnostic repro (`packages/reference-neo`)

`ATM-W-UNKNOWN-TONE` is a new diagnostic code. Mirror how
`ATM-W-MALFORMED-OPACITY` is covered:
- add a row to `packages/reference-neo/src/diagnostics/tests/repro-rows-default.ts`
  (the repro world's `TOKENS_FILE` may not declare colours or tones — read
  `repro-world.ts`; supply what the row needs in the row's own files, e.g. a
  `tokens({ colors: …, tones: … })` file plus a style file with a misspelled
  tone);
- add a case `packages/reference-neo/tests/cases/diag/NEO-DIAG-67` (next free
  id; verify with `pnpm agentneo list`) copied from `NEO-DIAG-09`'s shape, and
  register it wherever NEO-DIAG-09 is indexed (`tests/cases/diag/TESTS.md`,
  `SPEC.md` if it lists cases, `packages/reference-rs/modules/diagnostics/REGISTRY.md`
  if it maps codes to Neo cases).

## Done when (from /Users/ryn/Developer/reference-ui)

- `pnpm agentrs v atomic` passes; only new case folders under tests/cases
- `pnpm agentrs c atomic` passes
- `pnpm agentneo run NEO-DIAG-67` passes
- the Neo repro vitest passes: find how `src/diagnostics/tests/repro.test.ts`
  is run (e.g. `pnpm --filter @reference-ui/neo exec vitest run src/diagnostics/tests/repro.test.ts`
  or `pnpm agent vitest …`) and run it
- `pnpm agentneo q` on the files you touched in packages/reference-neo passes

Report: for each new station the asserted declarations and diagnostics (one
line each), the NEO case id, every file touched, and pass counts.
