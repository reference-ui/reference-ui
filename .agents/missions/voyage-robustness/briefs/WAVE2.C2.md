# Brief — WAVE2.C2 (crew: general, DeepSeek V4.1 Flash, `#high`)

Wave 2 of the robustness voyage: **C2 — the cwd canon**. Read
`.agents/missions/voyage-robustness/reports/CWD.oracle.md` (the exact ruling)
and `GATES.md` (C2 bar). Work in `/Users/ryn/Developer/reference-ui`, branch
`reference-system` (base `65e95e9dc`). Do not commit, push, or `git stash`; do
not touch `packages/reference-rs/**` or the pre-existing untracked `pipeline/`
files; **do not edit the pin baseline** (captain-owned). Bench-lock timed
blocks. Disclose any file you did not touch.

## The fix (Oracle CWD.oracle §2 — implement exactly)

1. `packages/reference-neo/src/lib/microbundle/build-options.ts`: compute
   `NEO_PACKAGE_ROOT` from `import.meta.url` and set
   `absWorkingDir: NEO_PACKAGE_ROOT` **unconditionally** in
   `buildMicroBundleOptions`; export the constant. Do **not** add an
   `absWorkingDir` override to `MicroBundleOptions` (the canon is fixed).
2. `packages/reference-neo/src/config/bundle.ts:21-34`: metafile `inputs` keys
   are `absWorkingDir`-relative; resolve the non-absolute ones against the
   exported canon base instead of `configDir` (the R3 edge — otherwise watch
   `dependencyPaths` silently corrupt). `bundle.test.ts:90-91` realpath
   assertions must stay green.
3. Tests: `build-options.test.ts` pins `absWorkingDir` presence/value; add a
   **cross-cwd** test that bundles the same entry under two different
   `process.cwd()` values and asserts identical bytes. `bundle.test.ts` stays
   green (and gains a case for the canon-base resolution if not covered).
4. Rebuild the mcp dist (it vendors the seam): find its build command
   (`reference-mcp`/`@reference-ui/mcp`, `tsup.config.ts`), rebuild, confirm
   green.

## Prove (the C2 bar)

- **Lever side-effect falsifier:** `react/react.mjs` ×3 (docs/lib/icons) and
  their `.map` ×3 must be **byte-identical** before/after the change. Any move
  ⇒ STOP and report (the lever moved something it must not).
- **Canon removes the axis:** the same entry synced under cwd = repo root and
  cwd = package dir now emits **identical bytes** for `baseSystem.mjs` and
  `types.mjs` (the whole point).
- **Delta classification for the captain's re-baseline:** capture the
  before/after hashes of the **6** affected pinned files
  (`system/baseSystem.mjs` + `types/types.mjs` × docs/lib/icons) and prove the
  delta is **banner lines only** (banner-normalized equal; report the banner
  line counts). Do not edit `.agents/missions/voyage-one-shot/pins/baseline.sha256`.
- **Identity:** evaluated spec / manifest / CSS byte-identical pre/post.
- **Suites:** `bundle.test.ts` + `build-options.test.ts` + neo vitest green;
  `pnpm agentneo q` 0 errors; mcp build green.

Note: after C2, the pins legitimately change (6 lines) — the captain commits
the code first, then the pins-only commit. Your job ends with the code + the
classified delta evidence, not the re-baseline.

## Output

Write `.agents/missions/voyage-robustness/reports/WAVE2.C2.md` (fix, cross-cwd
proof, react/map no-move proof, 6-file classified delta with counts, suites),
append to `.agents/missions/voyage-robustness/WAVE2.md`, and reply with a short
summary + VERDICT.