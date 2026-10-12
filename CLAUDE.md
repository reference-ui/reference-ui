@AGENTS.md

# Claude-only rules

- Repo skills live in `.agents/skills/<name>/SKILL.md` and are not
  auto-loaded: pick one from the "Skills vs test-core" table.
- Use the built-in browser.
- `pnpm dev:lib` is single-instance (port 5000): check the port before starting
  it, and reuse a server that is already up (AGENTS.md §1).
