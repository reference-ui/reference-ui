# `tests/shared/` — the harness

Everything the cases share: `case.json` discovery and search, the
isolated per-case HTTP server, headless runs, artifact plumbing. This
folder IS the harness, and it ships its own CLI (`agentneo`):

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
- A CLI tool agents call, not an MCP server. List, search, run
  one/some/all, quality-gate, report.
- Two inspection modes. Fast mode: headless run prints per-case
  artifacts (screenshot, accessibility snapshot, video/trace on
  failure). Interactive mode: serve one case world locally and poke
  it live — today's mechanism is `@playwright/mcp`, verified working
  this session; the capability is "inspect a live case world", MCP is
  just how we action it right now.
- Per-run server first; the warm server plus queue slots (agentct's
  daemon shape) and Darwin QoS elevation land as the case count
  grows.

Proven constraints the code designs around: the browser blocks
`file://`, so worlds are always served over local HTTP; screenshots
and artifacts must land under the workspace (`tests/.artifacts/`).

Mechanism lives here. Policy lives in the `agent-neo` skill: how the
CLI gets executed — concurrency, gating, QoS — so that many agents
can test Neo at once, at near-full capacity, without bogging down the
machine. That seamless multi-agent performance is the skill's job;
this folder's job is to be drivable.
