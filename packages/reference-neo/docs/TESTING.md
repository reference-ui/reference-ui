# Testing Neo

How the Neo harness runs, what a case is, and where proof lives. The
`agentneo` CLI is live and green; this file describes the contract it
implements.

## Commands

From the repository root:

```bash
pnpm agentneo list              # every case: id, name, folder, README line
pnpm agentneo search <query>    # filter over id, name, README text
pnpm agentneo run [case-id]     # serve the world, run the spec headless, print artifacts
pnpm agentneo run --failed      # rerun only cases recorded ok=false in the last-run log
pnpm agentneo run --update-snapshots --confirm
                                # bless fresh screenshots as snapshot baselines (human-gated)
pnpm agentneo q [paths...]      # structural quality gate over Neo TypeScript
```

Output is human-readable; parse the terminal, never `--json`. Exit
codes: 0 clean/pass, 1 violations/failure (also usage errors, the
no-confirm snapshot refusal, and `--failed` with no log), 2 Playwright
or tooling missing (serve-only degrade, still prints what it did),
3 quality gate not integrated yet.

Every executed `run` writes `tests/.artifacts/last-run.json`
(gitignored): a timestamp plus per-case `{ id, ok, ms }`. Partial
reruns merge into the previous log, so the file always describes the
latest known state of every case seen. Every run starts by typechecking
the package with ts7: red types refuse the run with the diagnostics and
exit 1 before any build, sync, or browser launches. Each run then serves
the world and preflights its index before any browser launches, so a
missing or empty world fails loud and fast (`world failed to load`)
instead of timing out inside a spec. Runs execute fail-first by default — cases that failed
last run go first — and `run --failed`
runs only those failures (exit 0 with "nothing to rerun" when the log
shows all green; exit 1 with a clear error when no log exists yet).

Snapshot flow: specs call `snap(page, name)` from their run argument;
a mismatch throws with the differing pixel count and percent plus the
actual/diff artifact paths, and the run fails. Every pass logs its
drift (`N of M pixels (P%) differ (pass)`), so near-misses stay visible:
the per-pixel threshold forgives small color distances everywhere at
once, and a subtle full-surface tone shift can pass. Baselines live
beside their case in `tests/cases/<id>/__snapshots__/` and move only via
`run --update-snapshots --confirm` — without `--confirm` the CLI
refuses with exit 1, and nothing else in the harness ever writes a
baseline.

## Anatomy of a case

One leaf folder per case under `tests/cases/` — groups nest, so any
folder with a `case.json` is a case at any depth, and ids must be unique
across groups (duplicates fail loud):

- `case.json` — the discriminator: assigned id (`NEO-<GROUP>-<nn>`)
  plus name. A folder with one is a case.
- `README.md` — the standard description. `list` and `search` pick up
  its first line when present. Missing or long is never a failure.
- `world/` — the case's little source tree, served over local HTTP
  (the browser blocks `file://`, so there is always a server).
  Worlds are TypeScript-only: every run transpiles `src/**/*.ts(x)`
  into gitignored `dist/` (clean rebuild, transpile-only, imports
  untouched for import maps) before serving, and pages reference
  the `dist/` output — never hand-written JS beside the sources.
- `specs/` — Playwright assertions against that world: the CSS parses
  and carries the expected rules with no ghost classes, it wins in the
  cascade (computed styles), theme and variants paint. Static checks
  plus live assertions plus settled snapshots where rendering matters.

Unit tests colocate with the code they cover in `src/`. Cases are not
compiler stations: no rigid inputs/outputs contract, no goldens. The
case defines its world; the spec asserts its outcome.

## Artifacts

Every `run` prints absolute paths. Per-case output lands under
`tests/.artifacts/<case-id>/` (gitignored): screenshot, accessibility
snapshot, and trace/video on failure only. Snapshot mismatches are
regressions until a human says otherwise — fix the code, don't move
the baseline.

## Snapshots (human-gated)

Settled-state comparisons at rendering points that matter. Baselines
update only for genuine styling changes, only after showing expected,
actual, and diff to the human, only on an explicit yes — same gate as
`agentct` (`--update-snapshots` plus `--confirm` as the machine record
of that approval).

## Quality gate

`pnpm agentneo q` runs the structural gate: Biome lint plus strict
`tsc` plus numeric thresholds (fail: cyclomatic 12, cognitive 20,
params 5, function 120 lines, file 500 lines, depth 4; loud warn line
below each), the suppression ban (`biome-ignore` and `@ts-ignore`
fail; bare `@ts-expect-error` fails), and non-negotiable type safety
(`any` banned). `pnpm agentneo q --report` prints the complexity
distribution for tuning. Each violation prints with a fix tip. No
formatting rules.

## Interactive inspection

Serve one case world and poke it live (headed only on explicit human
request; headless is pixel-identical and the default). Today's
mechanism is `@playwright/mcp` against the served world — the
capability is "inspect a live case world", MCP is just how we action
it right now. The `AutomationControlled` unsupported-flag banner is
cosmetic Playwright plumbing, never a fault.

## Conventions

- IDs assigned, `NEO-<GROUP>-<nn>`, greppable in `list`.
- React 19 only. No runtime switching, no matrix in this loop.
- Keep cases small worlds with one assertion each. A case that needs
  three paragraphs of setup is two cases.

## The agent loop

Try combinations fast, confirm visually, then lock it in:

1. Serve the case world (`run`, or interactive serve for poking).
2. Iterate on the CSS, screenshotting through the MCP after each
   change — the screenshot is the quick confirm.
3. When it looks right, write the spec assertions (computed styles,
   cascade wins, settled snapshots) so the result stays proven.

Eyes first, assertions second. A test nobody watched pass is a rumor.
