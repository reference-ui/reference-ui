# Default active project deadlock

**Severity:** High (blocks zero-config agent onboarding)
**Area:** MCP (`list_projects`, `list_components`, `get_tokens`, …)
**Not panda CSS.**

## Observed

On startup the MCP server defaults to an unsynced fixture:

```json
"activeProject": "/.../fixtures/atlas-project",
"isDefault": true,
"hasArtifacts": false
```

Discovery tools then fail:

```text
Project at '/.../fixtures/atlas-project' has not been synced yet.
Generated type artifacts are missing at '/.../fixtures/atlas-project/.reference-ui/types/tasty/manifest.js'.
Run 'ref sync' (or 'pnpm dev') to generate the model artifacts.
```

An agent without shell access, or unaware it must switch projects, is stuck.

## Fix

1. Default to a project that already has artifacts (for example `packages/reference-lib`).
2. If the active project has no artifacts, fall back to universal primitives mode or list synced projects instead of throwing.
