# Default active project deadlock

**Severity:** High (blocks zero-config agent onboarding)
**Area:** MCP (`list_projects`, `list_components`, `get_tokens`, …)
**Status**: Fixed (commit "mcp: default project prefers synced; select_project schema; get_style_props per-query project").
**Scope**: `@reference-ui/mcp` (server).
**Not panda CSS.**

Fix: `pickDefault` picks only synced projects in the same precedence order; an explicit `--project` still wins unsynced (the `ref sync` message); with none synced, universal primitives serve. Tests: `project-manager.test.ts`, `project-context.test.ts`.

## Observed

On startup the MCP server defaults to an unsynced fixture:

```json
"activeProject": "/.../packages/reference-rs/modules/styletrace/tests/cases/plain_react_wrappers",
"isDefault": true,
"hasArtifacts": false
```

Discovery tools then fail:

```text
Project at '/.../packages/reference-rs/modules/styletrace/tests/cases/plain_react_wrappers' has not been synced yet.
Generated type artifacts are missing at '/.../packages/reference-rs/modules/styletrace/tests/cases/plain_react_wrappers/.reference-ui/types/tasty/manifest.js'.
Run 'ref sync' (or 'pnpm dev') to generate the model artifacts.
```

An agent without shell access, or unaware it must switch projects, is stuck.

## Fix

1. Default to a project that already has artifacts (for example `packages/reference-lib`).
2. If the active project has no artifacts, fall back to universal primitives mode or list synced projects instead of throwing.
