@AGENTS.md

# Claude-only rules

- Repo skills live in `.agents/skills/<name>/SKILL.md` and are not
  auto-loaded: pick one from the "Skills vs test-core" table.
- Use the built-in browser.
- `pnpm dev:lib` is single-instance (port 5000): check the port before starting
  it, and reuse a server that is already up (AGENTS.md §1).

# Work logs (memex)

A commit is the final state, and its message states the result. A memex log is
the working out: the options considered, the evidence, the dead ends, and why
the result is what it is. A later model reads the logs to audit decisions, find
contradictions and spot risk. Some logs beat none: log as you go, not only at
the end. Set `MEMEX_AGENT` to your role (for example
`orchestrator`, `reviewer`, `cook`), then
`memex log <stream> --tag <area>[,...] <<'EOF' … EOF`. The store is local
(`.memex/logs`, gitignored) and worktrees write to the main checkout's store.

| Stream | One entry per | Holds |
| --- | --- | --- |
| `decisions` | ruling, trade-off or owner call | the question, the options weighed, the choice and why, what it costs, who decided, and what would reverse it |
| `verdicts` | review (refiner, oracle, xhigh) | the verdict, each finding with file:line and severity, and what was fixed or deferred |
| `landings` | branch landed | the commits, the gate evidence (suite counts, sync results, timing), the known flakes, and what stays open |
| `work` | session or long task | a summary: what was attempted, what was found, dead ends, and where things stand |

Entries are detailed but plain: cite commits, files, case ids and numbers, and
state the reasoning. Log every major decision and every landing. A cook logs a
`decisions` entry only when its brief left a call to it.
