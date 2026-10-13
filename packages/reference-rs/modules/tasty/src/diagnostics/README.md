# Tasty Diagnostics

Tasty diagnostics are typed facts, not message strings. This submodule owns every `TST-*` code the scanner and extractor emit: producers mint codes from the stable table in `codes.rs`, build template `Diagnostic` values with the constructors in `mod.rs`, and the outcome carries them to the caller as warnings in the manifest `warnings` array. A warning means compile continued with a documented fallback. The one error, a scan refusal, throws instead of returning a diagnostic.

## How a diagnostic flows

1. Scanning refuses the request as a coded throw (`TST-E-SCAN-FAILED`) when the root, the glob, a path, or a file read fails. No partial bundle is returned.
2. Extraction warns per file. A parse failure warns once and keeps whatever the parser recovered; a file the parser abandons outright contributes no declarations, and the scan still completes (`TST-W-PARSE-ERROR`). A relative or absolute module request that names no file on disk warns once per (file, specifier) (`TST-W-UNRESOLVED-IMPORT`), and the names it provides stay external. In a user file, a path-shaped `declare module` augmentation warns once per (file, module) (`TST-W-UNSUPPORTED-AUGMENTATION`), and `declare global`, `import x = …`, or `export =` warns once per (file, construct) (`TST-W-UNSUPPORTED-SYNTAX`); the statement is skipped and named.
3. Resolution warns per name. Same-file duplicate declarations and members keep one survivor; a star-ambiguous name is excluded from the barrel (`TST-W-STAR-AMBIGUITY`).
4. Manifest emission warns once per name that several symbols share (`TST-W-DUPLICATE-SYMBOL-NAME`), with the candidate ids in the help line.

The shared registry, `modules/diagnostics/REGISTRY.md`, is the home for each code's meaning and raise site. Codes are wire contract: never rename one that a golden pins; append a row for a new failure class.

## ERROR CODES

| Code | Severity | Trigger |
| ---- | -------- | ------- |
| `TST-W-PARSE-ERROR` | warning | `export interface { broken` in a scanned file (`tests/cases/TST-ERR-01`) |
| `TST-W-DUPLICATE-DECLARATION` | warning | `export type Dup = string` and `export type Dup = number` in one file; keeps the last |
| `TST-W-DUPLICATE-MEMBER` | warning | an interface declaring `alpha` twice across merged declarations; keeps the first |
| `TST-W-STAR-AMBIGUITY` | warning | two `export *` targets provide `Widget` with different ids (`tests/cases/TST-RXP-02`) |
| `TST-W-DUPLICATE-SYMBOL-NAME` | warning | two user files export `Shared` (`tests/cases/TST-DUP-01`) |
| `TST-W-UNRESOLVED-IMPORT` | warning | `import type { Missing } from './missing'` with no `missing` file on disk (`tests/cases/TST-IMP-02`) |
| `TST-W-UNSUPPORTED-AUGMENTATION` | warning | `declare module './base' { interface Base { extra: number } }` in a user file; the members are not merged (`tests/cases/TST-EXT-03`) |
| `TST-W-UNSUPPORTED-SYNTAX` | warning | `declare global { … }`, `import x = require('…')`, or `export = X` in a user file; the statement is skipped (`tests/cases/TST-EXT-04`) |
| `TST-E-SCAN-FAILED` | error | an unreadable scan root, an invalid glob, or an unreadable source file |

## Must not

- Emit a diagnostic without a code; the constructors require one.
- Warn on a bare package specifier that does not resolve; the package may simply be unneeded.
- Treat `Raw` as an error. `Raw` is an IR choice for variants without a structured lowering and never produces a diagnostic.
- Reword a warning message a golden pins without rewriting that golden on purpose.
