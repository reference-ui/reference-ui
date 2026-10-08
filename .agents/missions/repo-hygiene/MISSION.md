# MISSION — repo hygiene (`reference-system`)

Captain mission, 2026-10-08. Cleanup only — **non-destructive by default**:
history is archived, never deleted outright; scratch/artifacts are removed.

Oracle: `.agents/missions/repo-hygiene/briefs/PLAN.oracle.md` →
`reports/PLAN.oracle.md` (Contributor tier, Max effort).
Breadth scan: explore crew (read-only), findings folded below.

## Owner dispositions (confirmed)

- Root docs → relocate into `docs/`, archive/delete the rest.
- `reference-lib` → delete `AGENTS.md` + 4 root PNGs; move `TESTING.md` /
  `OVERLAYS.md` into `docs/`.
- `docs/evidence` (19 MB) → **keep as-is** (agent-rs scripts read it).
- Missions + logs → clean up (non-destructive).
- `test-results/` → remove; route test output next to its module.

## Guards (do not violate)

- **`sync-perf.html` stays at root** — HQ standing order, `docs/MISSIONS/LOG-2.md:9191`;
  cited by bare name from `docs/PERF/CORES.md:822` + frozen perf archives.
- Never delete mission history outright — archive it.
- Don't touch another session's live/working files.

## Scratch & artifacts (verified tracked/untracked)

**Tracked scratch (delete):**
- `packages/reference-lib/test-standalone.spec.ts` (throwaway probe; FINALIZE wrongly says removed)
- `packages/reference-lib/test-tooltip.spec.ts` (throwaway probe)
- `packages/reference-lib/src/components/Overlay/isolation/scroll-lock.ts.bak`

**Untracked/ignored, disk-only (delete):**
- `test-results/`, `packages/reference-lib/test-results/`,
  `packages/reference-lib/playwright/test-results/`
- `packages/reference-lib/reference-ui-lib-0.0.46.tgz` (908 KB; `*.tgz` ignored)
- `.playwright-mcp/`, `.complexity-temp/`, `packages/target/`, `**/.DS_Store`
- `.muse/worktrees/*` (108 stale worktrees; disk-only)

**Ignore rule:** add `.muse/` to `.gitignore` (currently unignored; its
`worktrees/` are ignored by another rule).

**Route test output to module:** matrix chain configs + the managed template
(`pipeline/src/testing/matrix/managed/playwright/templates/playwright.config.ts.liquid`)
set no `outputDir`, so root runs leak a root-level `test-results/`. Set an
`outputDir` relative to each config; lib already does this correctly.

## Arc plan (one verified commit each)

1. **Scratch & artifacts** — delete tracked scratch; disk-prune ignored output;
   add `.muse/` ignore; route matrix Playwright output to module; delete `test-results/`.
2. **Root docs** — `THEMING.md`→`docs/`, `DECISIONS.md`→`docs/MISSIONS/`,
   `DIAGNOSTICS.md`→`docs/`, `WANTS.md`→`docs/MISSIONS/`,
   `FINALIZE.md`→`docs/`, `FONT_WEIGHT_FAMILY_FALLBACK.md`→`docs/bugs/`,
   `BUNDLER_UNIFICATION.md`/`FINISH.md`/`LOG.md`→`docs/archive/`,
   `review.md` deleted. Repair every **true root** reference (component-local
   `DECISIONS.md` refs stay untouched).
3. **`reference-lib` package docs** — delete `AGENTS.md` + PNGs; `TESTING.md` /
   `OVERLAYS.md` → `docs/lib/`; fix the 4 referencing files.
4. **`matrix/` markdown** — keep `README.md` + `CHAIN.md`; fold/relocate the other 6.
5. **`reference-neo`** — remove `PLAN.md`; repair refs (`.agents/skills/agent-neo`,
   `docs/Architecture.md`, `docs/LANGUAGE/PUBLIC-API.MD`, missions, neo evidence).
   Assess `neo/docs/{SWITCH-READINESS,TESTING,evidence,archive}`.
6. **`reference-legacy`** — delete package; repair refs (`pnpm-workspace.yaml`,
   neo README, root docs).
7. **Missions & logs** — consolidate/archive `docs/MISSIONS/**` (44 files) and
   `.agents/missions/**` (298 files) non-destructively; resolve the 47 + 39 live
   refs first.
8. **Secondary strays** — `.changeset/status.json` (generated), neo
   `benchmark/PLAN.md` (landed), `measure/PLAN.md` (misnamed dup),
   reference-lib `NEXT.md` roadmaps, `react-spectrum.md`, dangling
   `reference-rs/README.md` `./PLAN.md` link, dead `pnpm-workspace.yaml` entries.
9. **Oracle final review** at the closing commit.

## Open

- Awaiting `PLAN.oracle` review before the first commit.
- `docs/MISSIONS` + `.agents/missions` consolidation shape (archive vs delete)
  needs a call; leaning archive under a single `docs/archive/missions/`.
