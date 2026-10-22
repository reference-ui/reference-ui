# STT-BOUND-02 — a source nested 300,000 levels deep is skipped with STT-W-SKIPPED-FILE while its sibling traces

`input/Card.tsx` alone is the station input, traced in process. The bound is the deep source: `spec.ts` writes
`deep.ts`, a single initialiser nested 300,000 parentheses deep, beside a copy of `Card.tsx` in a virtual workspace,
and traces that workspace through `traceDetailed` in a child process under `runIsolated` (kill budget 30 s, budget
2000 ms through `expectBounded`).

The pre-scan refuses `deep.ts` before Oxc sees it. The trace must report exactly one `STT-W-SKIPPED-FILE` that names
`deep.ts` with the message `StyleTrace: nesting deeper than 1024 levels at line 1; split or flatten the deeply nested expression`, and must still trace `Card`.

The depth is sized past the current build's limit. On the exports' 256 MiB thread the unguarded trace survives
5,000 and 50,000 levels, with `Card` traced and no skip, and dies with SIGILL at 300,000, so the red run fails by
signal and the green run skips the file by name.

Siblings: STT-BOUND-01 (an export-star clique traced in a child process within 2 s), STT-NEG-04 (an unparsable file
reached from several places warns once).

> Search terms: nesting depth, pre-scan, skipped file, STT-W-SKIPPED-FILE, sibling trace, deep parentheses, bounded trace
