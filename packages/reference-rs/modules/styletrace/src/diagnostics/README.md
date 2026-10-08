# Styletrace Diagnostics

Styletrace diagnostics are typed facts, not string guesses. This submodule owns every
`STT-*` diagnostic the tracer emits: producers mint codes from the stable table,
construct template values with the legacy skip sentences, and the outcome carries
them back to the caller. **Not** a fallback resolver — phases never guess a missing
surface or file, and no producer invents a code outside the table.

## How a trace flows

1. `trace_style_bindings_with_hint` (and the detailed twin) resolves the declaration
   root from the hint, or climbs for a sync root; an unlocatable root throws
   `STT-E-UNRESOLVED-SURFACE`.
2. `StyleSurface::from_declaration_root` resolves StyleProps names and primitive
   names; a missing entrypoint, malformed graph, or unreadable declaration throws
   `STT-E-UNRESOLVED-SURFACE`.
3. `discover_source_files` walks the source root; an unreadable root throws
   `STT-E-SCAN-FAILED`.
4. Entries that fail to parse or read yield one `STT-W-SKIPPED-FILE` each and
   contribute no hosts; edge targets that fail to parse or read are recorded by
   the walker the same way; siblings still trace.
5. The residual walker error — unreachable in practice, since resolution never
   fails — degrades to one unlocated `STT-W-SKIPPED-FILE` rather than failing
   resolved siblings.

Positions: per-file skips carry the file path; the residual and both refusals are
request-level and carry no file. Proof stations: `parse_failure_isolated`
(`tests/cases/`, names only) plus `tests/detailed.test.ts` (exact wire bytes);
whole-compiler repros: Neo's `repro.test.ts` styletrace suite.

## ERROR CODES

Every code the tracer can emit, with the minimal authored shape that raises
it. The warning rides `TraceOutcome.diagnostics` (siblings kept); both errors
refuse the request as coded throws, mirroring the tasty scan channel. The shared
registry (`modules/diagnostics/REGISTRY.md`) is the deliberate home for meanings
and raise sites; Neo's `repro.test.ts` pins one whole-compiler repro per row.
Codes are wire contract: never rename, never remove.

| Code | Severity | Trigger |
| ---- | -------- | ------- |
| `STT-W-SKIPPED-FILE` | warning | `src/broken.tsx` with `export function Broken( {` beside a tracing sibling |
| `STT-E-SCAN-FAILED` | error | `traceDetailed('/nonexistent-src', declRoot)` (unreadable source root refuses discovery) |
| `STT-E-UNRESOLVED-SURFACE` | error | `traceDetailed(src, emptyDir)` (no StyleProps entrypoint); also the hintless trace outside any project (no sync root) |

## Must not

- Emit a diagnostic without a code; the constructors require one.
- Rename a code once a golden pins it; extend the table instead.
- Guess a missing surface or file; report it and keep siblings.
- Reword the skip sentence; it stays byte-identical to the legacy prose the
  `ATM-SITE-57`, `ATM-DIAG-03`, and `ATM-DIAG-14` goldens pin.
- Ride an error in the outcome payload; refusals throw coded.
