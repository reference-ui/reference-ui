Status: DONE (fallback brief; ruling payload carried no inspected content)

## Run 2026-09-25 — rewire to @reference-ui/rust/diagnostics

Ruling/prior results arrived as bare "structured result submitted" with no
usable content, so executed the fallback brief verbatim.

Changes (packages/reference-neo only, no commits):
- `src/diagnostics/hints.ts` (new): WARNING_HINTS + warningHintFor moved
  here verbatim from codes.ts; sole importer is format.ts.
- `src/diagnostics/transport.ts`: DiagnosticParseError, codeSeverityTag,
  parseCode now imported from `@reference-ui/rust/diagnostics`.
- `src/diagnostics/format.ts`: warningHintFor now imported from ./hints.ts.
- `src/diagnostics/index.ts`: code template symbols
  (DiagnosticParseError, REGISTERED_NAMESPACES, TEMPLATE_NAMESPACE,
  codeNamespace, codeSeverityTag, isRegisteredNamespace, parseCode) plus
  `type DiagnosticCode` re-exported from `@reference-ui/rust/diagnostics`;
  warningHintFor re-exported from ./hints.ts. isWarningCode/isErrorCode
  dropped: Rust exports no such helpers and the only consumer was
  transport.test.ts (now asserts codeSeverityTag directly).
- `src/diagnostics/codes.ts`: deleted; mirror fully evacuated.
- `src/diagnostics/tests/transport.test.ts`: header reworded (native code
  template), isWarningCode/isErrorCode imports/assertions replaced with
  codeSeverityTag checks.
- Type drift: none existed in Neo (no local DiagnosticCode declaration);
  barrel re-exports the Rust string-alias type so consumers share one name.

Verify:
- `cd packages/reference-neo && npx vitest run src/diagnostics/` →
  7 files, 101 tests, all passed.
- `cd packages/reference-neo && npx vitest run src/cli/output.test.ts` →
  35 passed (format.ts importer check).
- `pnpm agentneo q` → 0 errors, 25 warnings, 295 files. Single
  diagnostics warning (transport.ts toCanonicalRecord cyclomatic 9) is
  pre-existing and warn-only; no warning touches new/rewritten lines.

# SEAM-3 NEO-CREW log

Scope: rewire Neo diagnostics to `@reference-ui/rust/diagnostics`,
split WARNING_HINTS to its own module, delete the mirror remainder,
proved with the diagnostics suite + agentneo q.
