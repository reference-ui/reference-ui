# WAVE3 — B3-depth: map live-relative sources (F-A)

STATUS: B3-depth IMPLEMENTED + PROVEN (uncommitted; captain re-baselines the 3
`.map` lines).

Bar (`GATES.md` B3-depth): every `react.mjs.map` source resolves to a real file
from the live dir; `react.mjs`×3 byte-identical; `.map` pin delta = depth lines
only (captain re-baselines 3 lines); test falsifier; suites green.

## Entries

- **B3-depth (crew: general, DeepSeek V4.1 Flash)** — `reports/WAVE3.B3-depth.md`.
  **VERDICT: DONE.** `publishReactBundle` takes the live outDir for the esbuild
  `outfile`/map base while `react.mjs` + map stay in the stage; a small esbuild
  plugin re-homes the leg's two staged within-folder inputs (runtime data,
  entry) at their live twins so the map resolves (the brief's outfile-only move
  would have orphaned them as `../sync.stage/…`). Threaded through
  `AssemblyInput.liveOutDir` (types), `assembleSystem`, and the sync caller.
  Proof: all 6 external deps + `../styled/runtime-data.mjs` resolve from the
  live dir ×3; `react.mjs`×3 **byte-identical**; map delta = **the `sources`
  line only** (6 external sources lose one `../`), reconstruction to stage
  depth re-hashes to the three frozen pins; `verify-pins` = **3 missing / 3
  unexpected** (the 3 maps); `tmp/` absent (NEO-SYNC-02 note d holds). One
  disclosed exception: the synthetic `../tmp/react-entry.mts` source (deleted
  build entry, embedded via `sourcesContent`) — persisting it would break
  NEO-SYNC-02 or add a 4th pin line. Suites: neo packager+sync+config+
  microbundle 112/112, full neo 570/571 (1 documented pre-existing),
  `agentneo q` 0 errors, NEO-SYNC-02/05/06 PASS. 5 files touched (4 + new
  `react.test.ts`); pins untouched.

- **Captain verification.** _pending (re-baseline 3 `.map` lines, then commit
  code+test separately from pins)._

