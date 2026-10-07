# voyage-robustness — follow-ups & notes

Open items that are **not** blocking closeout, plus owner notes for later.

## Owner note (2026-10-08) — evaluate dropping tsup

> "I don't know if TSUP is even a thing that we need anymore. Originally we used
> TSUP … because we wanted to bundle up types. But now that TypeScript 7 is out
> … maybe it's creating more of a hindrance and complexity. Just something to
> note down."

Status: **NOTE — not tonight.** Context for a future investigation:

- `packages/reference-lib/tsup.config.ts` builds `dist/index.mjs` +
  `dist/theme/index.mjs` (`format esm`, `clean: true`, externals
  react/react-dom/@reference-ui/react/@reference-ui/styled, `noExternal: gsap`).
- The WAVE5 helper leak was traced to **tsc** (`tsconfig.build.json`
  `rewriteRelativeImportExtensions: true`) whose emit tsup then bundles — so
  tsup inherits, rather than causes, that specific defect.
- Repo is on `typescript@~7.0.2` (lib devDeps) / `typescript@6.0.3` present in
  some tooling trees.
- Question to answer later: with TS7, do we still need tsup's bundling, or can
  the lib ship tsc emit (or another single tool) and delete a moving part?
  Watch: build wall time, `dist` shape the consumer smoke asserts, and the
  `bundleRewrites` in `materialize-runtime.mjs` which assume tsup's output.

## Filed / deferred

- **LIB_DIST_ATOMIC_BUILD** (CONC-P3-1) — non-atomic `dist` rebuild (tsup
  `clean: true` wipes before rewrite) makes a live dev server briefly 404
  `dist/index.mjs`. Bar: "lib rebuild during a live dev server produces zero 404
  windows." Filed, not gated on closeout.
- **`normalizeConfigDependencyPaths` Win32 gap** (`config/bundle.ts:30`) — filed
  note (CWD P4-5 / CONC-P4-2); needs a real Windows runner to verify.
- **ARC-P4-1 mcp dist-content tripwire** — open recommendation (CONC-P4-3).
- **Native MDX** — separate mission (`.agents/missions/finalize/PLAN-mdx.md`).

## CUT (do not revive without fresh flames)

B2 output normalization/blanking; B3 cross-mode map identity; T2 config-load
staleness guard; T3 mission-script hardening (the `sync.lock` pin-walk exclusion
is the same class as `tmp/`, not T3 revived); compile-request relativize; alias
canonicalization; narrow-bootstrap-entry; content surgery.
