# Oracle arc review — WAVE3.B3-depth.arc (map live-relative sources)

STEP: WAVE3.B3-depth.arc
PIN: HEAD `7dd862400` on `reference-system`. Arc commits:
- `4687076d1` — `react.mjs.map` sources derived from the **live** outDir
  (staged bytes; small esbuild `onResolve`/`onLoad` plugin re-homes the leg's
  staged within-folder inputs) + new falsifier `react.test.ts`;
- `beea20e24` — pin walk (`capture-pins.mjs`) also skips `sync.lock/`;
- `7dd862400` — pins-only re-baseline (3 `.map` lines).
Read `reports/WAVE3.B3-depth.md`, `reports/PLAN.oracle.md` §F-A,
`reports/CWD.oracle.md` §R5, and `GATES.md` at the pin.

## Captain verification (independent)

- Fresh documented package-cwd syncs; maps parsed directly: 8 sources each,
  **7 resolve** against the live `.reference-ui/react/` (6 externals now at
  `../../../`); only `../tmp/react-entry.mts` misses (disclosed synthetic entry,
  carries `sourcesContent`).
- `react.mjs` ×3 equal to pins (`659664fd`/`9440758b`/`6e742ed9`); falsifier
  `react.test.ts` 2/2.
- Re-baselined exactly the 3 `.map` lines → `verify-pins` **PASS (1258)**.

## Review

1. **Mechanism.** Does the `liveMapPathPlugin` keep *every* emitted byte in the
   stage while making *every* real source live-relative? Name any input it does
   not re-home, or any case (absolute input, node_modules dep, symlink) where
   the live twin diverges from the stage twin and the `onLoad` serves wrong
   bytes. Is `absWorkingDir = NEO_PACKAGE_ROOT` (C2) still consistent with the
   live-twin paths at real package depth?
2. **The synthetic-source exception.** Is the impossibility argument sound
   (resolving `../tmp/react-entry.mts` breaks NEO-SYNC-02 (d) or adds a 4th pin
   line), or is there a smaller correct form? Is `sourcesContent` sufficient for
   devtools in practice?
3. **`react.mjs` byte-identity.** Is it structural (the plugin only affects map
   derivation) or coincidental? What would silently move the bundle bytes?
4. **Threading.** `AssemblyInput.liveOutDir` is now required; are all callers and
   scratch callers (`reference-types.test.ts`, benchmark/harvest) correct in
   defaulting `liveOutDir` to `outDir`? Any call site that should stage but now
   resolves live, or vice-versa?
5. **Pin re-baseline.** Is the 3-line, `sources`-line-only delta the whole change
   — anything hiding (a 4th file, a non-`sources` line, a map for another leg)?
6. **The pin-walk `sync.lock` exclusion.** Correct and necessary (a live
   `--watch` holds a runtime lock that is not a shipped artifact), or does it
   mask something? Confirm `sync.lock` is never present in a committed/shipped
   `.reference-ui` when no watcher runs (i.e. it is purely transient).
7. **Anything that lets the map orphan return** — a new publish leg, a caller
   that stages differently, a packed install.

## Response format

First line `STATUS: DONE` (or `STATUS: REFUSED`). Findings with stable IDs,
severity, file:line, evidence, recommendation, validation gap; P4 for
non-repair observations. End with a verdict: LAND or HOLD (exact blocker).
