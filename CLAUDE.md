@AGENTS.md

# Claude-only rules

- Repo skills live in `.agents/skills/<name>/SKILL.md` and are not
  auto-loaded: pick one from the "Skills vs test-core" table.
- Where AGENTS.md says Chrome DevTools MCP, you use the built-in browser;
  line cooks (Haiku sub-agents) never drive the shared browser pane: they
  use the repo's CLI and Playwright artifacts.
- `pnpm dev:lib` is single-instance (port 5000): only one parallel chunk at
  a time may need the dev server.
- On Claude, planning and review are the orchestrator's and the `reviewer`
  sub-agent's; Claude never calls the Muse Oracle, the `muse` CLI, or the
  opencode agents in `.opencode/`.
