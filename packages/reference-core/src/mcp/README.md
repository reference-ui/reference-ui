# MCP

- **`cli/`** — **`ref mcp`** command (stdio / HTTP); imports **`server/`**.
- **`server/`** — `@modelcontextprotocol/sdk` transports; uses **`pipeline/`** for the model.
- **`pipeline/`** — Atlas + Tasty + artifact assembly (`build`, `queries`, `paths`, `types`, …).
- **`worker/`** — Sync pool worker and **`worker/child-process/`** for heavy work during **`ref sync`**.
- **Root** — `events.ts` (typed bus surface), `init.ts` (start worker), docs.
