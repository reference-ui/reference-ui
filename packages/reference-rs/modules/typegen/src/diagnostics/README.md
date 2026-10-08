# Typegen Diagnostics

Typegen diagnostics are typed facts, not silent skips. This submodule owns every
`TGN-*` diagnostic the printer emits: producers mint codes from the stable table,
construct template values with subject-first messages, and the detailed emit sorts
and dedupes them into the result payload. **Not** a fallback printer — phases never
guess a missing union or wrapper, and no producer invents a code outside the table.

## How an emit flows

1. `emit_dts_with_diagnostics` prints the `.d.ts` exactly as `emit_dts_with` does,
   then walks the lowered system plus printer options for every printable skip.
2. Dump token categories with no printed union emit
   `TGN-W-UNKNOWN-TOKEN-CATEGORY` once per category with a near-match nudge;
   their tokens stay out of the file.
3. Recipes that cannot PascalCase to a TypeScript identifier emit
   `TGN-W-INVALID-RECIPE-NAME` and are omitted; recipes with no printable axes emit
   `TGN-W-EMPTY-RECIPE`, while one empty axis beside printing siblings emits the same
   code scoped to the axis. Compound rows naming an unknown axis or value emit
   `TGN-W-INVALID-COMPOUND-VARIANT` per row and are skipped. Recipes sharing one
   PascalCase stem with an earlier recipe emit `TGN-W-DUPLICATE-RECIPE-STEM`
   and are omitted.
4. Strict names outside `colors` / `radii` / `spacing` emit
   `TGN-W-UNKNOWN-STRICT-CATEGORY` with a near-match nudge; known names with no
   tokens in this system emit `TGN-W-ABSENT-STRICT-CATEGORY` and print no wrapper.
   Duplicate names stay silent — the first occurrence wins, exactly as the printer runs.
5. Font families declaring no weights emit `TGN-W-EMPTY-FONT-FAMILY` and are omitted.
6. `normalize` sorts by code and message, then dedupes identical rows so station
   goldens stay deterministic. The `emit_dts` / `emit_dts_with` strings never change:
   the detailed twin only adds the rows.

Positions: every warning is request-level and carries no file. Proof: the exact wire
bytes in `diagnostics/mod.rs` plus the collector rows in `tests/diagnostics.rs`;
whole-compiler repros: Neo's `repro.test.ts` typegen suite.

## ERROR CODES

Every code the printer can emit, with the minimal authored shape that raises
it. Warnings ride `DetailedEmit.diagnostics` (siblings kept); the error refuses
the request as a coded throw. The shared registry
(`modules/diagnostics/REGISTRY.md`) is the deliberate home for meanings and
raise sites; Neo's `repro.test.ts` pins one whole-compiler repro per row.
Codes are wire contract: never rename, never remove.

| Code | Severity | Trigger |
| ---- | -------- | ------- |
| `TGN-W-UNKNOWN-TOKEN-CATEGORY` | warning | `tokens: { animations: { spin: { value: '…' } } }` (no printed union) |
| `TGN-W-INVALID-RECIPE-NAME` | warning | `recipes: { '123': { variants: … } }` (no TypeScript type stem) |
| `TGN-W-EMPTY-RECIPE` | warning | `recipes: { card: { variants: {} } }` (whole recipe); or one axis `{ size: {} }` beside printing siblings |
| `TGN-W-INVALID-COMPOUND-VARIANT` | warning | `compoundVariants: [{ tone: 'nope', … }]` (unknown value; `flavor: 'loud'` is the unknown-axis twin) |
| `TGN-W-UNKNOWN-STRICT-CATEGORY` | warning | `strict: ['fonts']` (outside colors / radii / spacing) |
| `TGN-W-ABSENT-STRICT-CATEGORY` | warning | `strict: ['spacing']` on a colors-only system (no tokens, no wrapper) |
| `TGN-W-EMPTY-FONT-FAMILY` | warning | `fonts: { display: { value: '…', weights: {} } }` (no weights) |
| `TGN-E-INVALID-BASE-SYSTEM` | error | `emitDtsSync({ baseSystem: { schemaVersion: 999, … } })` (spec fails validation; coded throw) |
| `TGN-W-DUPLICATE-RECIPE-STEM` | warning | `recipes: { button: …, Button: … }` (one PascalCase stem; first wins, loser omitted) |

## Must not

- Emit a diagnostic without a code; the constructors require one.
- Rename a code once a golden pins it; extend the table instead.
- Guess a missing union, wrapper, or recipe alias; report it and keep siblings.
- Change `emit_dts` bytes when adding a warning; the detailed twin only adds rows.
- Ride the spec refusal in the payload; it throws coded.
