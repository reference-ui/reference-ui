# WAVE3 — B3-depth: map live-relative sources (F-A)

STATUS: B3-depth LANDED (`4687076d1` code+test, `7dd862400` pins) — Oracle arc
review in flight

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

- **Captain verification.** Re-ran the documented package-cwd syncs, then read
  the maps independently: 8 sources each, **7 resolve** against the live
  `.reference-ui/react/` (6 externals now at `../../../`), only the disclosed
  synthetic entry misses. `react.mjs`×3 equal to pins (`659664fd`/`9440758b`/
  `6e742ed9`); falsifier `react.test.ts` 2/2. Re-baselined exactly the **3**
  `.map` lines (+ comment refresh) → `verify-pins` **PASS (1258)**. Also added
  the `sync.lock/` exclusion to the pin walk (`beea20e24`) — a live
  `ref sync --watch` (the running docs dev server) was perturbing verification
  with a runtime lock, never a shipped artifact. Commits: `4687076d1` (code),
  `beea20e24` (pin-walk), `7dd862400` (pins-only).

- **Oracle `WAVE3.B3-depth.arc`: LAND, no blocker.** Mechanism complete for every
  live input (plugin re-homes both staged within-folder inputs at their live
  twins; `outfile` is derivation-only, `write:false` keeps bytes staged);
  synthetic-source exception sound (fenced by NEO-SYNC-02 (d) and the 3-line
  bar); `react.mjs` identity structural + pinned; threading correct at every
  call site; re-baseline exactly the 3 `sources` lines; `sync.lock` exclusion
  sound (purely transient; lock lives at `outDir/sync.lock/`, stage is a
  sibling). Follow-ups → next fix line (after Wave 4): **B3D-P3-1** (`onResolve`
  ignores `args.resolveDir`; relative staged imports would emit
  `../sync.stage/…`), **B3D-P3-2** (stage-prefix test separator-sensitive on
  Win32), **B3D-P4-1** (explicit throw on unknown staged loader), **B3D-P4-3**
  (generic guard: absolutize every emitted `.map` source). P4-2/P4-4 = notes.

