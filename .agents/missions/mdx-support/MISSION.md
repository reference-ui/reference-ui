# MISSION — native MDX support (`mdx-support`)

**Status: LANDED (first version).** Re-opens Arc 3 of the `finalize` mission as
its own bounded mission. Plan: `.agents/missions/finalize/PLAN-mdx.md`
(Oracle-approved R1–R8).

## Objective

Make `.mdx` a first-class fragment source in Neo sync via `@rspress/mdx-rs`:
bundle-loader + MDX-scoped discovery + proving case. `.md` stays excluded.

## Commits (branch `openchamber/mdx-support`)

| Commit | Arc |
| --- | --- |
| `30e3a3ae3` | Phase 1 — add `@rspress/mdx-rs@^0.6.6` to neo + root install |
| `601b72f41` | Phases 2–3 — microbundle MDX loader + MDX-scoped sync scan |
| `d4a175f7f` | Arc-review fixes F1/F2/F3/F5/F6 |
| `54f6c56dc` | Phase 4 — `NEO-MDX-01` proving case |
| `c43f35591` | Phase 4 — `bench:neo` MDX load axis (`--mdx`, default 0) |
| `571d307bc` | Phase 4 — pin the MDX-inclusive small run |

## Evidence

- **Install proven.** `import { compile } from '@rspress/mdx-rs'` resolves from
  `@reference-ui/neo`; `compile({ value, filepath, development:false, root:'' })`
  returns non-empty `code` on **darwin-x64** (this machine is a 13th-gen Intel
  i9, *not* the plan's assumed darwin-arm64) and on **linux-x64-gnu** in a
  `node:22-slim` linux/amd64 container. Platform selection rides pnpm
  `optionalDependencies`; the lock pins darwin-arm64/x64, linux gnu/musl
  x64+arm64, and win32 x64+arm64. Dagger uses the same linux-gnu path.
- **`NEO-MDX-01` fail-before / pass-after.** Pass-after: `NEO-MDX-01 PASS`
  (face + `var(--fonts-display)` + painted family). Fail-before (drop `mdx`
  from `FRAGMENT_EXTENSIONS`): `sync failed: ... ATM-E-UNKNOWN-TOKEN: unknown
  token reference {fonts.display}` — the MDX font is never collected.
- **Decoy never collected.** Scan-level lock in
  `src/collect/lib/scan/mdx.test.ts`: over a tmp tree holding `doc.mdx` (real
  import) and `decoy.mdx` (fence-only), matches equal exactly `doc.mdx`; a
  native-path test confirms the same. The sheet additionally carries no decoy
  face (a compiled fence is inert, so the scan set is the decisive proof).
- **No `.ts/.tsx` golden churn.** `vitest run src/collect/lib/scan/` (native
  differential + four-scale goldens) and `src/lib/microbundle/` → 14 files /
  70 tests green; golden fixtures untouched. Full neo vitest: 582/585, the 3
  failures reproduce at base (pre-existing/environmental).
- **`pnpm agentneo q`** → 0 errors, 25 warnings. Accepted warnings: `splitScan`
  params 5 (the plan's additive matcher arg) and `scanner.ts` 381 lines (16 over
  the warn line; the MDX helpers were extracted to `scan/mdx.ts` +
  `scan/patterns.ts` to cut it from 487).
- **Bench axis.** `pnpm bench:neo -- --scale small --files 5 --calls 1 --mdx 3
  --keep` collects the 3 real fragments (`bench-mdx-0/1/2` faces in the sheet)
  and never the 3 fence decoys. A clean-tree run
  (`--scale small --mdx 120 --runs 3`) is pinned at `reports/c43f355918f7/`:
  `small+custom`, sync ~918 ms, peak RSS ~133 MiB, bundle ~229 KiB.
  `mdxFiles` defaults to 0, so the default config bytes and four-scale goldens
  are unchanged (reproven after the change).
- **Phase 5 docs cleanup — NO-OP (independently confirmed).** The `agent-docs`
  role read the live files: no docs `.mdx` carries a real top-level fragment
  needle (both `@reference-ui/system` occurrences sit inside ` ```ts ` fences,
  so `stripMdxNoise` excludes them; a real scan returns zero `.mdx` matches —
  the sole docs fragment source is `src/docs-theme.fragments.ts`). And
  `fonts-sections.tsx` must stay: the Rust source gate
  (`reference-rs/modules/atomic/src/sources.rs` `is_supported_extension`) parses
  only `tsx|ts|jsx|js`, so inline JSX style props in MDX are still not
  extracted — fragment collection is a bundle-only seam. No docs file changed.

## Oracle

- **PLAN.oracle** → APPROVED WITH CHANGES (may proceed to Phase 1).
- **ARC.review** (pin `601b72f41`) → PROCEED to Phase 4 and merge; findings
  F1 (JSX skew), F2 (blank-line span), F3 (opener whitespace / deferred
  stripper gaps), F5 (`splitScan` fail-open default), F6 (native positive test)
  applied in `d4a175f7f`. F4 (`export … from` divergence) recorded as a
  deliberate, safe-direction divergence. F7/F8 informational.
- Reports are gitignored under `reports/`; briefs are tracked.

## Deliberately not done (smaller, precisely filed)

- **MDX atomic `css()` extraction** stays out of scope: the engine source scan
  (`SOURCE_EXTENSIONS`) excludes `mdx`, so inline JSX style props in MDX are not
  extracted — a `reference-rs` change (plan §11). This is exactly why the docs
  workaround stays (above).
- **`.md` stays excluded** (legacy parity).
- **linux-arm64 / win32** mdx-rs binaries are pinned in the lock but were not
  load-probed on this machine; Linux was probed on x64-gnu. arm64/win remain
  CI / Dagger coverage.
- **Oracle F2/F3/F4 hardening beyond the applied fixes** (indented code, HTML
  blocks, `<pre>`, `export … from`, comment-in-import) remains future work —
  all are safe-direction false-hits with negligible impact per the review.
