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

## Oracle

- **PLAN.oracle** → APPROVED WITH CHANGES (may proceed to Phase 1).
- **ARC.review** (pin `601b72f41`) → PROCEED to Phase 4 and merge; findings
  F1 (JSX skew), F2 (blank-line span), F3 (opener whitespace / deferred
  stripper gaps), F5 (`splitScan` fail-open default), F6 (native positive test)
  applied in `d4a175f7f`. F4 (`export … from` divergence) recorded as a
  deliberate, safe-direction divergence. F7/F8 informational.
- Reports are gitignored under `reports/`; briefs are tracked.

## Deferred (filed, not half-landed)

- **Bench axis (Phase 4, "if in reach").** Deferred. Adding an MDX knob means
  editing golden-sealed `benchmark/generate/plans.ts`, `templates/config.ts`
  (the include glob), and both generators, then pinning a `bench:neo` report.
  The default output must stay byte-identical to avoid churning the four-scale
  goldens, so it is a careful, report-producing change — out of comfortable
  reach this pass. Entry points: `plans.ts` (`LoadPlan`, `PROFILES`),
  `generate/generators/{app,churn}.ts`, `generate/templates/config.ts`,
  `benchmark/reports/`. Oracle F7 already states the knob must default to 0.
- **Docs cleanup (Phase 5).** Not applicable as written. Oracle F3: the target
  `reference-docs/src/content/docs/system/fonts-sections.tsx` is an
  **atomic-extraction** workaround (`SOURCE_EXTENSIONS` still excludes `mdx` —
  plan §11), not a fragment-collection one; MDX fragments collecting does not
  fix it. Removing it would regress the docs specimens. Also a docs dev server
  is live. Left untouched.

## Out of scope (unchanged)

- `.md` stays excluded (legacy parity).
- MDX atomic `css()` extraction (engine source scan) — not extended; would be a
  `reference-rs` change.
