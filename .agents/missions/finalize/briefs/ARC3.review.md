# Oracle review — ARC3.review

STEP: ARC3.review
PIN: base HEAD `2ffb79770` (branch `reference-system`).

This is a **plan/no-land ruling**. The Arc 3 crew hit its explicit STOP
condition and filed a plan instead of half-landing native MDX support. Judge
the live workspace and the plan file
`.agents/missions/finalize/reports/ARC3.impl.md` (read it fully). A parallel
crew may be editing `packages/reference-rs/modules/tasty/**` — ignore that
package; it is a different arc.

## Objective

`FINALIZATION_REPORT.md` Arc 3: port the legacy `mdx-to-jsx` preprocess
(`packages/reference-legacy/src/virtual/transforms/mdx-to-jsx/index.ts`, 56
lines, `@rspress/mdx-rs`) into Neo sync so MDX sources become first-class
fragment sources, using `mdx-rs`. MDX is currently excluded from fragment
bundling (landed as `06f031e7b`: `collect/constants.ts` `FRAGMENT_EXTENSIONS`
+ gated matches in `collect/lib/scan/scanner.ts`). The arc was explicitly
**bounded**: land it if the seam is small and clean, otherwise file a plan.

## What the crew found (claims to falsify or confirm)

1. `@rspress/mdx-rs` is not a neo dependency, absent from `pnpm-lock.yaml`,
   and not installed (legacy is workspace-excluded). Landing needs the NAPI
   package + platform binary and a root `pnpm install` — cross-package.
2. Native discovery reads raw bytes in Rust; TS confirms via the deliberately
   "verbatim T1" `splitScan` (`src/collect/lib/scan/native.ts:209-217`).
   Matching must run on compiled MDX — async TS work the Rust read cannot do.
3. Compiling MDX is not sufficient: a fenced code block compiles to a JS
   string that still contains the needle verbatim, and `createImportPatterns`
   (`scanner.ts:47-55`) is unanchored, so discovery needs statement-level
   matching — a global semantic change with goldens blast radius.
4. The bundle path needs an esbuild MDX plugin plus `@mdx-js/react` handling
   (emitted by mdx-rs, not resolvable, not covered by `react-stub`).
5. No `mdx` case group and no `bench:neo` MDX axis exist.

## What to review

1. **Is STOP/no-land the right call** for this bounded pass? Could any single
   piece have landed safely and usefully on its own (e.g. the esbuild plugin +
   `@mdx-js/react` stub, behind a flag), or is the dependency/lockfile install
   a hard gate that makes even a partial land unsafe?
2. **Is the plan correct, complete, and correctly ordered?** Name any missed
   blocker, wrong entry point, or wrong order. Read the actual files it cites
   (`constants.ts`, `scanner.ts`, `native.ts`, microbuild plugins,
   `SOURCE_EXTENSIONS`) at the pin.
3. **Is the `NEO-MDX-01` proving case strong enough** to distinguish a real
   land from a fence-decoy false positive, and to fail before the port?
4. **Simplifications**: is there a smaller correct approach than the
   five-phase plan (e.g. skip the scan seam entirely by transforming MDX only
   in the bundle, or scope MDX to fragments without the native path)?
5. Anything in the plan that would violate frozen contracts or the
   `reference-rs` wire format.

## Response format

First line `STATUS: DONE` (or `STATUS: REFUSED`). Findings with stable IDs,
severity, file:line evidence, recommendation, and validation gap. Mark
non-repair observations P4. End with a verdict: is the plan approved, approved
with changes, or should it be re-scoped — and whether Arc 3 stays `NOT LANDED`
for this mission.
