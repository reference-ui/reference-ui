# `tests/shared/` — the harness

Everything the cases share: `case.json` discovery and search, the
isolated per-case HTTP server, headless runs, artifact plumbing. This
folder IS the harness, and it ships its own CLI (`agentcore`):

```text
list / search <query> / run [case-id] / q [paths...]
```

Based on the `test-component` skill and its scripts — borrow heavily,
that work is done. Differences from `agentct`:

- React 19 latest only. No `--react` switching. We're testing CSS; the
  multi-runtime axis stays a matrix problem for later.
- Cases, not components. Discovers `tests/cases/` via `case.json`,
  descriptions from each case's `README.md`, search over id, name,
  and README text.
- Convention checks at discovery (`caseIndex.ts`): the folder is a raw
  case ID, `case.json` `id` equals the folder and `name` is set, and the
  README first line is `# <ID> — <name>` with that same name. `list`,
  `search`, `status` and run-all fail on any broken folder; `run <ID>`
  fails only for the folders it selects and warns about the rest.
- A CLI tool agents call, not an MCP server. List, search, run
  one/some/all, quality-gate, report.
- Two inspection modes. Fast mode: headless run prints per-case
  artifacts (screenshot, accessibility snapshot, video/trace on
  failure). Interactive mode: serve one case world locally and poke
  it live with your host's browser tools (host table in root
  `AGENTS.md` section 2); the capability is "inspect a live case
  world", not any one tool.
- Per-run server first; the warm server plus queue slots (agentct's
  daemon shape) and Darwin QoS elevation land as the case count
  grows.

Proven constraints the code designs around: the browser blocks
`file://`, so worlds are always served over local HTTP; screenshots
and artifacts must land under the workspace (`tests/.artifacts/`).

Mechanism lives here. Policy lives in the `agent-core` skill: how the
CLI gets executed — concurrency, gating, QoS — so that many agents
can test Core at once, at near-full capacity, without bogging down the
machine. That seamless multi-agent performance is the skill's job;
this folder's job is to be drivable.
