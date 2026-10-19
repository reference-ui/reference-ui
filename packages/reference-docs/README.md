# Reference docs app

The Reference UI documentation site: a thin Vite + React + TanStack Router shell around MDX content. There is no client-side code playground — examples render the real components and their source is shown as a static, build-time-highlighted block.

- Stack, content model, and look & feel: [DOCS.md](./DOCS.md)
- Package layout and placement rules: [STRUCTURE.md](./STRUCTURE.md)
- Sections, page order, and status: [PLAN.md](./PLAN.md)

Serve locally with `pnpm dev:docs` (port 5174). Agent workflow: the `agent-docs` skill. Part of [Reference UI](../../../README.md).
