# STT-BOUND-01 — Twelve export-star modules and an unresolved name trace Card within 2 s

Modules `m0` to `m11` each `export *` from the other eleven, and `m0` also star-exports `Card`.
`index.ts` imports `missing` from `m0`, exports it, and star-exports `m5`.
`missing` is declared nowhere, so every query for it walks the clique.
Walking every simple path of that clique took 17 s for ten modules.
The walk grows factorially, so `spec.ts` never runs it in-process.
It writes the clique into a scratch tree and calls `traceDetailed` in a child process.
`runIsolated` kills that child after 30 s.
The bounded check expects the child to finish inside 2 s and to trace `Card`.
The station input is `input/Card.tsx` alone, traced in-process.
Its golden records that the component itself traces.
