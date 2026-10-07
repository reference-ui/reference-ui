# Brief — WAVE3.B3-depth (crew: general, DeepSeek V4.1 Flash, `#high`)

Wave 3 of the robustness voyage: **B3-depth — map live-relative sources**
(Oracle PLAN F-A; `CWD.oracle` R5 confirms it is off the cwd axis and must not
move a single map byte from the C2 canon). Read `reports/PLAN.oracle.md` §F-A and
`GATES.md`. Work in `/Users/ryn/Developer/reference-ui`, branch
`reference-system` (base `a2aa41af6`). Do not commit, push, or `git stash`; do
not touch `packages/reference-rs/**` or the pre-existing untracked `pipeline/`
files; **do not edit the pin baseline**. Disclose any file you did not touch.

## The defect

`assembleSystem` is called with the **stage** dir as `input.outDir`
(`sync/index.ts` assembles into the stage, then `commit.ts` pure-renames to the
live folder). `publishReactBundle({ outDir: input.outDir, … })` sets esbuild's
`outfile: join(dir, 'react.mjs')` (`react.ts:97-99`), so `react.mjs.map`
`sources` are relative to the **stage** depth (one level deeper). After the
commit rename they are orphaned — devtools/IDE source resolution is wrong.
(Single-mode, not a mode/cwd issue.)

## Fix

Emit the map with **live-relative** sources while the bytes still land in the
stage (Oracle PLAN F-A): give `publishReactBundle` the **live** outDir for the
`outfile`/map base, and keep writing `react.mjs` + `react.mjs.map` to the stage
dir. Thread it through cleanly:
- `AssemblyInput` (`packager/types.ts`) gains the live outDir (e.g.
  `liveOutDir`) alongside the stage `outDir`.
- `assembleSystem` (`packager/assembly.ts:28-33`) passes it.
- the caller in `sync/index.ts` (the assemble stage) sets it to the live outDir.
- `publishReactBundle` (`packager/react.ts`) uses the live dir for `outfile`
  (map base) and the stage dir for the writes.

If a smaller, equally correct form exists, use it — but the map `sources` must
resolve against the **live** dir and the emitted `react.mjs` bytes must not
change (see the bar).

## Bar (`GATES.md` B3-depth)

- Every `react.mjs.map` `source` (docs/lib/icons), absolutized against the live
  `.reference-ui/react/` dir, resolves to a **real file**.
- `react.mjs` ×3 stays **byte-identical** (the code is unchanged; only the map
  base moves) — a code-byte move ⇒ STOP.
- The `.map` pin delta is **depth lines only** (`../` level), diff-reviewed;
  banner/other files unchanged.
- Add a test that asserts map `sources` resolve against the live dir (a
  falsifier that fails on the stage-depth form).
- Suites: neo packager vitest + `agentneo q` 0 errors; `verify-pins` will show
  exactly the 3 `.map` deltas (captain re-baselines those 3 lines only).

## Output

Write `.agents/missions/voyage-robustness/reports/WAVE3.B3-depth.md` (fix, the
live-resolves proof, react.mjs byte-identity, the 3-file `.map` classified
delta + hashes, suites), append to
`.agents/missions/voyage-robustness/WAVE3.md`, and reply with a short summary +
VERDICT. Do **not** edit the pins.