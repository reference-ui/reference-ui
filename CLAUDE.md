@AGENTS.md

# Claude-only rules

- Repo skills live in `.agents/skills/<name>/SKILL.md` and are not
  auto-loaded: pick one from the "Skills vs test-core" table.
- Where AGENTS.md says Chrome DevTools MCP, you use the built-in browser;
  line cooks use `cdt`.
- `pnpm dev:lib` is single-instance (port 5000): only one parallel chunk at
  a time may need the dev server.
