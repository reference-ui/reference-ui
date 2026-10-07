# Brief — ARC2.impl (crew: general, DeepSeek V4.1 Flash, `#high`)

You implement **Arc 2: take the tasty drain off the one-shot `ref sync`
critical path**. Read `.agents/missions/finalize/MISSION.md` and
`FINALIZATION_REPORT.md` (repo root) first. Follow the **`agent-neo` skill**
(`.agents/skills/agent-neo/SKILL.md`); hand any Rust change to the ARC1 crew's
ground (do not edit `packages/reference-rs/**`).

Work in `/Users/ryn/Developer/reference-ui`, branch `reference-system`. Do
**not** commit, push, or `git stash`. Stay inside
`packages/reference-neo/**` (cli + reference bridge), except tests. If
`git status` shows files you did not touch, disclose them.

## Problem

`packages/reference-neo/src/cli/sync.ts`:
- `:41` `started = Date.now()`
- `:42` `await sync()` — atomic path, ~1s
- `:43–44` `await flushReferenceBuild(cwd)` — **the tasty drain**, ~11s
- `:89` prints `elapsedMs: Date.now() - started` — covers both

So one-shot reports `ready in 15454 ms`. `sync()` itself already schedules the
tasty phase and never awaits it (`sync/index.ts:283-288`). The one-shot CLI's
`flushReferenceBuild` (from `reference/bridge/init.ts`) is the only blocker.

## Choose one (report which and why)

- **(a)** Don't await the drain before printing ready: print the atomic
  success early, let the background landing report on its own line. The
  `foldRefDiagnostics` plumbing in `reference/bridge/{init,run}.ts` already
  anticipates undrained callers (see `ReferenceBuildPayload.fold/json`).
- **(b)** Incremental manifest: skip the rebuild when no input changed
  (stronger than the landed-or-not once-guard). May require Rust — if so,
  **stop and hand to ARC1's ground** rather than editing it.
- **(c)** `--skip-tasty` / `--no-ref` flag for the dev loop.

**Prefer (a)** so this arc stays TS-only and disjoint from ARC1. Whatever you
pick, keep these contracts:
- The manifest **still lands** on the background loop, and a later sync
  retries a failed background build (`sync/index.ts:64-72`).
- `ref sync --json` diagnostics stay parseable (one JSON array per line;
  check `formatJsonDiagnostics` and the background-landing path in
  `reference/bridge/run.ts:50-60`).
- Watch behaviour is unchanged (watch does not flush).

## Bar (from the report)

- Cold one-shot `ref sync` on docs **reports ≤ ~2s** (the reported `ready`
  line; the drain may still complete afterwards on the background landing).
- Cold repro: remove `.reference-ui/` tasty dir, then
  `pnpm --filter @reference-ui/reference-docs exec ref sync`; compare
  before/after. Warm `ref sync --watch` resync stays ~134 ms.
- Manifest still lands; failed build retried by a later sync.
- `pnpm agentneo run` (or the repo's Neo unit runner) green; `pnpm agentneo q`
  clean (errors 0). Redesign on any gate failure — never suppress.

## Method

- Find the real Neo unit-test command (`vitest.config.ts`,
  `docs/TESTING.md`, `tests/shared/cli.ts`); do not invent runners.
- Existing tests to read/update: `reference/bridge/*.test.ts`, `cli` tests,
  any snapshot of the boot block/ready line.
- Confirm the timing claim with the `REFERENCE_UI_PHASES_OUT` phase recorder
  (`sync/phases.ts`) so the atomic/tasty split is visible.

## Output

Write `.agents/missions/finalize/reports/ARC2.impl.md` with: chosen option +
reason, files changed (exact paths), before/after timing (cold one-shot), the
manifest-lands proof, JSON parseability proof, suites + `agentneo q` results,
and a `VERDICT:` line. Append an entry to
`.agents/missions/finalize/ARC2.md`. Then reply with a short summary.
