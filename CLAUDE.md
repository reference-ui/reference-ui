@AGENTS.md

# Claude-only rules

- Repo skills live in `.agents/skills/<name>/SKILL.md` and are not
  auto-loaded: pick one from the "Skills vs test-core" table.
- Use the built-in browser.
- `pnpm dev:lib` is single-instance (port 5000): only one parallel chunk at
  a time may need the dev server.
