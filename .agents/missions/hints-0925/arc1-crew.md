Status: IN PROGRESS — hints crew on ARC-1

# HINTS-1 ARC-1 log

Scope: static WARNING_HINTS + warningHintFor move to the RS
diagnostics JS surface (next to SUGGESTION_CODES), coverage test over
minted warning codes, Neo rewire (delete hints.ts, import from
`@reference-ui/rust/diagnostics`), both suites + both gates green.

## Progress (crew run 2026-09-25)

RS FIRST — done:
- Moved WARNING_HINTS + warningHintFor from
  `packages/reference-neo/src/diagnostics/hints.ts` into
  `packages/reference-rs/modules/diagnostics/js/index.ts` beside
  SUGGESTION_CODES (entries verbatim, JSDoc style matched).
- Coverage audit over the five `modules/*/src/diagnostics/codes.rs`
  tables: 52 minted warnings (ATM 35, TST 5, ATL 4, STT 1, TGN 8
  after excluding the five `*-W-NOPE` negative-test fixtures). 50 were
  already hinted; the 2 gaps (`ATL-W-PACKAGE-SCAN-FAILED`,
  `TGN-W-DUPLICATE-RECIPE-STEM`) are actively minted, not retired, so
  both got real hints instead of exemptions. EXEMPT_CODES stays empty.
- New `modules/diagnostics/js/hints.test.ts`: readFileSync+regex over
  the five tables, asserts hint-or-exemption per code, exemptions stay
  live, pins 3 fix lines + off-table silence.
- `pnpm agentrs q` on both touched files: 0 violations, 1 soft warning
  (index.ts 407 lines > 365 soft limit — expected from the inlined table).
- `pnpm agentrs v modules/diagnostics/js/hints.test.ts`: 3/3 pass.
- `pnpm agentrs v modules/diagnostics/js/index.test.ts`: 16/16 pass.

THEN NEO — done:
- Deleted `src/diagnostics/hints.ts`; `format.ts` and the barrel
  `index.ts` now import `warningHintFor` from
  `@reference-ui/rust/diagnostics`.
- `pnpm --dir packages/reference-rs run build:js`: success, dist
  carries the new export (diagnostics.mjs + chunk .d.ts).
- `vitest run src/diagnostics src/cli/output.test.ts`: 8 files, 136/136 pass.
- `pnpm agentneo q`: 0 errors package-wide; touched files 0/0.
- `tsc --noEmit`: zero errors in src/; remaining errors are pre-existing
  case-spec issues (missing repro-world.ts, implicit any), untouched.

No commits, per brief.
