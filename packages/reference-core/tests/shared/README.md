# The shared harness

Everything the cases share: case discovery and search, the
isolated per-case HTTP server, headless runs, artifact plumbing. This
folder IS the harness, and it ships its own CLI (`agentcore`):

```text
list / search <query> / status / q [paths...]
run [case-id] [--failed] [--update-snapshots --confirm]
```

Based on the `test-component` skill and its scripts. Differences from
`agentct`:

- React 19 latest only. No `--react` switching. We're testing CSS; the
  multi-runtime axis stays a matrix problem for later.
- Cases, not components. Discovers the case tree via each case index entry,
  descriptions from each case's README claim, search over id, name,
  and README text.
- Convention checks at discovery: the folder is a raw
  case ID, the index entry `id` equals the folder and `name` is set, and the
  README first line is `# <ID> — <name>` with that same name. `list`,
  `search`, `status` and run-all fail on any broken folder; `run <ID>`
  fails only for the folders it selects and warns about the rest.
- A CLI tool agents call, not an MCP server. List, search, run
  one/some/all, quality-gate, report.
- One inspection mode: a headless run prints per-case artifacts
  (screenshot and accessibility snapshot on every run, trace on
  failure).
- Per-run server: one fresh server per run, no shared daemon.

Proven constraints the code designs around: the browser blocks
`file://`, so worlds are always served over local HTTP; screenshots
and artifacts must land under the workspace (the workspace artifacts dir).

Mechanism lives here. Policy lives in the `agent-core` skill: how the
CLI gets executed — concurrency, gating, QoS — so that many agents
can test Core at once, at near-full capacity, without bogging down the
machine. That seamless multi-agent performance is the skill's job;
this folder's job is to be drivable.
