# Oracle plan — voyage-robustness (PLAN.oracle)

STEP: PLAN.oracle
PIN: HEAD on `reference-system` (post `voyage-one-shot`; read
`.agents/missions/voyage-one-shot/CLOSEOUT.md` and
`docs/bugs/NEO_EMIT_MODE_DRIFT.md` at the pin).

## The question

We are starting a **robustness** voyage on the surfaces the one-shot voyage
touched. Give us: (1) verification that the candidate gaps are real and matter;
(2) any robustness gap we missed; (3) a ranked backlog with falsification bars;
(4) the correct first land; and (5) the wave/parallel/sequencing structure.

## Candidate backlog (verify, rank, or falsify)

- **T1 — Emit-mode determinism.** `NEO_EMIT_MODE_DRIFT.md`: source- vs
  dist-invoked neo changes fragment-bundle bytes because `bootstrap.ts:23-26`
  resolves alias entries from `import.meta.url` and esbuild annotates each
  bundled module with a `// <path>` banner. Proposed fix seam:
  `lib/microbundle/build-options.ts` (strip module-annotation comments, or
  canonicalize alias targets) — or `bootstrap.ts`. Is that the right seam? What
  else does the alias/`import.meta.url` resolution affect? Does stripping
  banners have any consumer (debuggability, sourcemaps, provenance)?
- **T2 — Silent stale upstream.** The `./baseSystem` subpath now reads lib's
  live `.reference-ui/system/baseSystem.mjs`; the `LoadConfigError` hint covers
  a **missing** file but not a **stale** one (a source change without an upstream
  re-sync). Is a staleness guard warranted (mtime/hash vs lib src), and where —
  config load, the `./baseSystem` export, or a `prepack`/`files` guarantee? What
  is the observable failure it prevents?
- **T3 — Proof-harness hardening.** `verify-pins.mjs` proves disk state but will
  vacuously PASS if no fresh sync preceded it; the harness measures the
  gitignored `dist` with no provenance attestation. Should this voyage harden
  those, or is it out of a product-robustness scope?
- **T4 — Survey.** Any other robustness gap on these surfaces: the config
  loader's error handling, the `exports` entry shape, the barrel-import guard,
  the packed-tarball smoke, or the emit path generally. Name it with file:line.

## Constraints and context

- The last voyage landed R1 (`5ea3dcdca`): a zero-import
  `@reference-ui/lib/baseSystem` subpath; one-shot docs ~300 ms.
- Byte/semantic identity is the standing bar; `NEO_EMIT_MODE_DRIFT` is inert
  today (comments only; executed, never hashed).
- Neo-quality and reference-rs rules apply (`agentneo`, `agentrs`); frozen
  contracts live in `packages/reference-rs/contracts/`.
- One working tree, one shared native `.node`; implementers serialize.

## Response format

First line `STATUS: DONE` (or `STATUS: REFUSED`). Then: verification of each
candidate (real / overstated / false) with file:line; missed gaps; a ranked
backlog (entry points, expected effect, risk, effort, falsification bar,
identity); the recommended first land; and the voyage structure with Oracle
review points. P4 for non-repair observations.
