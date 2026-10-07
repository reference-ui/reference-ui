# Oracle arc review — WAVE2.C2.arc (dist unification + cwd canon)

STEP: WAVE2.C2.arc
PIN: HEAD `cec363eab` on `reference-system`. The arc is two landed commits:
- `490962c4d` C1 — documented syncs in dist mode + `ensure-dist` gate;
- `a65eecad7` C2 — `absWorkingDir` = neo package root (+ `config/bundle.ts`
  metafile base, mcp vendored copy, tests);
- `cec363eab` pins-only re-baseline (6 lines).
Read `reports/WAVE1.C1.md`, `reports/WAVE2.C2.md`, `reports/CWD.oracle.md`, and
`GATES.md` at the pin.

## Captain verification (independent)

- **Cross-cwd:** documented package-cwd syncs (docs/lib/icons) and root-cwd
  dir-arg syncs are **byte-identical** (1258 files, 0 diff) for the 6 banner
  files.
- **Lever falsifier:** `react/react.mjs` ×3 and `.map` ×3 **unchanged** pre/post.
- **Pin re-baseline:** exactly **6** lines changed (`system/baseSystem.mjs` +
  `types/types.mjs` × docs/lib/icons); banner-normalized **EQUAL** to the
  pre-C2 bytes (280/280 and 47/47 banner lines); `verify-pins` **PASS**.
- `ensure-dist`: fresh-clone rebuild 0.53 s; steady state 45 ms; opt-out exit 0;
  quality 0/0. Suites: neo config/microbundle vitest green; `agentneo q`
  0 errors.

## Review

1. **Gate correctness (`ensure-dist.mjs`).** Freshness predicate covers every
   dist-affecting input; fails loud; no path to silently serve stale dist; the
   CI skip env matches the existing contract.
2. **Script wiring.** lib/docs/icons documented invocations now dist mode end to
   end (incl. the `dev` watch/concurrently chain); no remaining source-mode
   invocation on a documented path; `bin/ref.ts` untouched for the inner loop.
3. **`absWorkingDir` canon.** Set unconditionally from a correctly-derived
   `NEO_PACKAGE_ROOT` (climb/fallback sound in src, dist, and packed hosts); no
   `MicroBundleOptions` override; resolution unaffected (entries/outfile/aliases
   absolute). The `config/bundle.ts` metafile-base change (R3 edge) and the
   **mcp vendored copy** are consistent; `bundle.test.ts` realpath guard holds.
4. **Test adequacy.** Does the cross-cwd test actually falsify a regression, or
   pass vacuously? Name any missing falsifier (e.g. packed-host fallback,
   `types.mjs` specifically).
5. **Pin re-baseline.** Is the 6-line, banner-only delta the whole change —
   anything that could hide (a non-banner byte, a 7th file, a map move)?
6. **Residual/caveat.** Is the drift-doc residual accurate and future-proof
   (source mode scoped to the inner loop; shipped bytes dist-only)?
7. **Anything that lets either axis (mode or cwd) silently return** — a new
   emit leg, a caller that sets its own cwd, a packed layout.

## Response format

First line `STATUS: DONE` (or `STATUS: REFUSED`). Findings with stable IDs,
severity, file:line, evidence, recommendation, validation gap; P4 for
non-repair observations. End with a verdict: LAND or HOLD (exact blocker).
