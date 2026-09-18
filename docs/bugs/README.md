# Bugs

Open issues found in agent/MCP first-touch and leftover core debt. Split out of the old root dump so panda-era items are not mixed with Atlas/MCP ones.

Panda CSS is on the way out ([packages/reference-neo/PLAN.md](../../packages/reference-neo/PLAN.md)). Review [JANK.md](./JANK.md) when that swap lands. The MCP/Atlas bugs below are independent of the compiler.

## MCP

- [mcp-default-project.md](./mcp-default-project.md) — default active project has no artifacts
- [mcp-select-project-schema.md](./mcp-select-project-schema.md) — `select_project` rejects `project`

## Atlas / inventory

- [atlas-non-identifier-props.md](./atlas-non-identifier-props.md) — `}` leaked as a prop name
- [atlas-disabled-styleprop.md](./atlas-disabled-styleprop.md) — `disabled` classified as a style prop
- [atlas-usedwith-bloat.md](./atlas-usedwith-bloat.md) — `usedWith` HTML-tag noise and inverted frequencies

## Core host (mostly panda-era)

- [JANK.md](./JANK.md) — sync disk IPC, generated absolute paths, codegen side effects, DTS patching
