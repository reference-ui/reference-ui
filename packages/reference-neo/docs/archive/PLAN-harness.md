# Neo Voyage Plan

> Landed record (Voyage One). The living plan is [`../PLAN.md`](../../PLAN.md);
> this file is history, not orders.

Status: r5 landed. Gate, harness, skill, and smoke case live in the
tree, converted to TypeScript, oracle-reviewed. Next: tight-loop
commands plus the snapshot facility, then Playwright install and the
playtest round. Part One exits with a commit (see §9).

## 0. Coordinates

- Neo (`packages/reference-neo`, `@reference-ui/neo`) is the **runtime
  portion of reference-rs**: TypeScript above the cut (fragments, publish,
  runtime), Rust below. Stance: `README.md`.
- "Neo" is a code word. **Retirement clause:** if the user ever says to
  change Neo into core (promote/rename Neo as the installed core), the
  code word retires: update the skill, the AGENTS.md routing table, and
  package names, and stop saying "Neo".
- Agent Neo is self-contained: it never touches `reference-lib`. No
  matrix, no Dagger in the inner loop.
- Controls before implementation. The gate and the harness land before
  any host code (fragments, publish, runtime).
- Later legs (not this pass): scan code and generate files, no `ui.config`
  initially; reference-rs atomic system work via the agent-rs skill.

## 1. Order of work

1. Quality gate for Neo TypeScript (`tools/quality/`). DONE (r4+r5).
2. Harness skeleton (`tests/shared/` CLI) plus one committed smoke case.
   DONE (r4+r5).
3. `agent-neo` skill plus AGENTS.md routing. DONE (r4+r5, validated).
4. Integration: deps, `pnpm agentneo` script, skill validation, gate and
   smoke run for real. DONE — gate exit 0, skill valid, smoke
   serve-only pending Playwright.
5. Then: tight-loop commands, snapshot facility, playtest, commit.
   RS atomic leg runs under agent-rs after.

## 2. Quality gate

Mirrors the agent-rs stance (small, explicit failure, militant about
suppressions) adapted to TypeScript. Structural quality only — **no
formatting or prettifying**; that is a later commit-hook decision.

- **Tool: Neo's own Biome config (ESLint is out).** `biome lint` plus
  `tsc --noEmit --strict` over `.ts` files plus a TS-compiler-API
  metrics counter for what Biome lacks (McCabe, params, depth, lines).
  Why not ESLint: `typescript-eslint@8.56.1` crashes at load against
  this workspace's TS 7.0.2 (verified this session: typescript-estree
  reads TS-5-only internals), and the team is done with ESLint anyway.
  Biome parses the tree fine and owns `noExplicitAny` plus
  `noExcessiveCognitiveComplexity`; the repo's `typescript` package
  counts the rest. Formatter stays off — structural only.
- **Each tool for what it's good at:** Biome owns lint rules
  (`noExplicitAny`, cognitive, recommended correctness/suspicious);
  `tsc` owns type errors; `metrics.ts` owns numeric thresholds and
  the report. No homemade linter: the metrics counter is the rs shape
  (targeted counts, not rule reimplementation), and the wrapper is
  plumbing that shells out and prints tips.
- **One thin extra check** covers only what ESLint will never judge:
  2–6 sentence file headers, no filename-table READMEs. That check is
  not the linter; it rides along in `runQuality`, nothing more.
- **Thresholds (measured against reference-core/src: 814 functions,
  cyclomatic median 2 / p95 8; cognitive p95 13).** Fail line as
  errors: cyclomatic >12, cognitive >20, params >5, function length
  >120, file length >500, depth >4. Warn line (loud, tips,
  non-failing): cyclomatic >8, cognitive >12, params >4, function
  >80, file >365. Rationale: 10/15 was "what core already was" (only
  3 functions above 15 — walkers Neo isn't taking); fail-12 forces
  real splits without lying, and fail-8 is the CYCLOMATIC_FAIL:60
  trap (gate lies on honest dispatchers, someone loosens it). McCabe
  counts value-level branches only — `?` in types never inflates it.
  Generated files (`@generated` marker or `.gen.` infix) skip the
  length rules.
- **Type safety is non-negotiable:** `any` strictly banned (Biome
  `noExplicitAny` as error), plus `tsc --noEmit --strict` over `.ts`
  files for type errors the linter can't see. A gate that lets `any`
  through is a failed deliverable.
- **Severities:** the threshold rules plus max-depth and the
  type-safety set (notably the `any` ban) are errors. Everything else is
  warnings or off — no dogma, no style rules. No sonar blob, no
  max-statements (length + cyclo + depth already cover it). Biome
  recommended correctness/suspicious ride at Biome defaults
  (near-all errors — they only fire on probable bugs); anything
  noisy gets demoted on evidence, never preemptively.
- **Two layers, distinct messages:** the gate runs the linter, then
  reports suppressions as their own failure category — "you ignored a
  rule we set up, don't." A suppression is dodging the contract, not a
  lint warning.
- **Suppression policy: `biome-ignore` is `#[allow]` — banned.** Any
  `biome-ignore` in any form fails the gate; `@ts-ignore` fails;
  `@ts-expect-error` is allowed only with a same-line justification
  (≥10 chars), bare ones fail. A dump cannot land by switching the
  gate off.
- **Boundary rule:** imports from `reference-core` or
  `reference-lib` paths fail the gate. Neo copies solved code into
  Neo-owned modules; it never imports across. Lands with the
  conversion round.
- **Tips:** every enforced rule maps to a one-paragraph agent-facing fix
  tip, agent-rs lint-table style (what it means, what to do).
- **Beautiful is a review criterion, not a rule.** Past the thresholds,
  the gate's posture is a human reviewer's: good structure, readable
  flow, beautiful code. Agents spend real thought on readability —
  would a human call this beautiful? — and refactor toward yes. This
  is judgment, not formatting (which stays out); it lives in review,
  tips, and the skill's checklist, never as a formatter.
- **Contract:** `tests/shared/cli.ts` reaches the gate via
  `import('../../tools/quality/run.ts')` → `runQuality(argv)` → exit code
  (0 clean / 1 violations / 2 tooling missing). `q --report` prints
  the complexity distribution (percentiles + top offenders) and exits
  0 — tuning stays measured, not vibes.

## 3. Harness

`tests/shared/` is the harness and ships the `agentneo` CLI agents call
(`pnpm agentneo` → `node packages/reference-neo/tests/shared/cli.ts`).
Borrowed shape: the `agentct` loop (ID-addressed runs, human-gated
snapshots, human-readable logs — never `--json`).

- **Commands:** `list`, `search <query>`, `run [case-id]`, `q [paths]`.
  `list` prints one greppable line per case: id, name, folder, plus the
  README first line when present (there will be many cases eventually).
  `search` filters over id, name, and README text. `run` serves the case
  world over local HTTP and executes its spec headless, then prints
  artifact paths.
  `q` dispatches to the quality gate; a missing gate module prints a
  clear not-integrated-yet message and exits 3, never crashes.
- **Case anatomy:** leaf folder with `case.json` (the discriminator: id
  plus name), `README.md` (the standard description), a small world
  source tree, and specs asserting the CSS is valid, wins the cascade,
  and paints theme/variants (static checks plus computed-style
  assertions plus settled snapshots where rendering matters).
- **README policy:** the README is the standard description and
  list/search pick it up when present. A missing or long README is
  **never** a failure: convention, not gate.
- **Case IDs:** assigned, `NEO-<GROUP>-<nn>`.
- **Proven constraints (verified this session):** the browser blocks
  `file://`, so every case world is served over local HTTP (127.0.0.1,
  ephemeral port); screenshots and artifacts must land under the
  workspace, collected at `tests/.artifacts/<case-id>/` (gitignored).
- **Run semantics:** headless default with artifact dump (screenshot,
  accessibility snapshot, trace/video on failure only). No Playwright or
  browsers installed degrades to serve-only with a clear message and
  exit 2, never a crash.
- **Snapshots:** settled-state, human-gated exactly like `agentct`
  (`--update-snapshots` requires genuine styling plus explicit human
  yes; machine record via `--confirm`).
- **Staged performance:** the skeleton serves a per-run server; the warm
  server plus queue slots (agentct's one-Vite/three-slot daemon shape)
  and Darwin QoS elevation come as the case count grows. Mechanism lives
  in `tests/shared/`; execution policy lives in the skill.
- **Scope:** React 19 only, one fast bundler path, no `--react`
  switching, no matrix. Unit tests colocate with the code they cover in
  `src/`.
- **Committed proof:** `NEO-SMOKE-01` (grey page, crimson dot centered;
  spec asserts computed background plus centering) must pass through
  `run` end to end. It is the smallest honest test, kept with the
  project and updated when behavior changes.

## 4. Browser tooling: capability vs mechanism

The harness is not "the Playwright MCP". The capability is headless case
runs plus interactive inspection of a served case world. `@playwright/mcp`
is today's interactive mechanism — verified working this session
(navigate, snapshot, screenshot, console; red-dot proof served over local
HTTP) — and docs plus the skill describe the capability, with MCP named
only as how we action it right now.

## 5. Skill and routing

- `.agents/skills/agent-neo/SKILL.md`: code-word context plus retirement
  clause, self-containment (never lib), CLI usage, headless policy (the
  `AutomationControlled` banner is cosmetic plumbing, never a fault),
  scope discipline (Rust/RS → agent-rs, lib look/feel → tweak-component,
  lib logic → test-component, core/matrix/pipeline → test-core), quality
  summary, execution policy for multi-agent runs.
- **Review checklist, ending with names:** the skill's loop ends in
  review, and the last review question is always naming — best
  file/module name for this? confusable with anything else?
  specific enough? `DOMAIN.md` is the nomenclature authority: the
  skill links it, agents check it before naming anything load-bearing,
  and it gets updated as the language evolves. Decisions land there.
- AGENTS.md: one routing-table row plus a short section pointing at the
  skill. No scripts or assets in the skill directory: the CLI lives in
  the package.

## 6. Agentic workflow

Three tracks (quality, harness, skill) build in parallel DIRECTLY IN
THE SHARED CHECKOUT against the fixed contracts in sections 2–3 — no
isolated worktrees. (The r1–r3 runs proved isolation strands work
invisibly: agents wrote real files into side-checkouts that never
merged back.) Strict disjoint file ownership per track, no installs
and no git ops inside children; the parent owns deps, validation, and
final verification. A read-only synthesis pass checks cross-track
consistency, then the parent runs the gate plus the smoke case for real
and shows `git status` before calling the pass done. Once agents run,
spec changes queue for the next round — killing a run deletes work.

## 7. Non-goals for this pass

Scan/generate implementation, `ui.config`, fragments/publish/runtime
host code, the packager, multi-React, multi-bundler, hermetic
containers, formatting enforcement. The harness is the product until
the host has somewhere to live.

## 8. Verification loop

The whole doctrine, three lines:

- Neo change → `pnpm agentneo run` the affected cases, then
  `pnpm agentneo q`.
- Touched the runtime in a way that crosses into Rust, or changed
  `packages/reference-rs` at all → run the agent-rs skill too
  (`pnpm agentrs`). That's it. That's the loop.

## 9. Playtesting (closes Part One)

Before Part One is done, the harness gets playtested, not just run:

- Spin up agents with no other job: interact with `agentneo`
  (list, search, run, q, report), then report how the interaction
  felt and what could improve.
- Add cases that test the harness, not the system: Playwright
  behavior, MCP visibility (what the agent can actually see),
  artifact usefulness, failure readability. No core, no system
  building — just the loop itself.
- Everything headless. A harness that steals focus is a harness
  nobody runs.

Part One exits with a commit. It is safe because Neo is
self-contained and additive-only: docs, harness, skill, and cases,
nothing else in the repo touched. No host code rides along.

## 10. Queued next rounds

In order. No churn: each round completes before the next starts.

1. **TypeScript conversion (.mjs → .ts) plus quality move.** DONE
   (r5, oracle-reviewed): everything is TypeScript, `tools/quality/`
   placed, `server.ts` named, `tsconfig.json` in, boundary rule
   enforced and probe-verified.
2. **Tight-loop round.** DONE (r6, oracle-reviewed): `--failed`,
   fail-first ordering, last-run log, snapshot facility with
   `--update-snapshots --confirm` human-gated baselines. Smoke
   baseline blessed and eyeballed against a real Chromium run.
3. **Playtest round (closes §9).** DONE (r7): two fresh agents
   built real cases (NEO-SNAP-A-01, NEO-PLAY-B-01) cascade specs,
   snapshot bless/fail cycles, fail-first e2e, and MCP
   cross-checks — all headless, all green. Their baselines were
   eyeballed before commit. Findings fixed in the same pass:
   recursive case discovery (groups nest, duplicate ids fail
   loud), world serve preflight plus goto-status guard (missing
   or empty worlds fail loud before any browser launches), and
   snapshot pass lines that log drift (the per-pixel threshold
   lets subtle full-surface tone shifts pass — documented, not
   silent). Retro: workflow terminal output must inline child
   text for report-style children (refs alone lose the
   narrative); probes stay temp (create, verify, delete).
