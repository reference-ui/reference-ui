# `select_project` argument schema

**Severity:** Medium (failed tool calls)
**Area:** MCP `select_project`
**Not panda CSS.**

## Observed

Agent instructions say:

- Session focus: `select_project({ path: 'packages/...' })`
- Per-query targeting: pass `project: 'packages/...'`

Calling `select_project({ project: 'packages/reference-lib' })` fails Zod validation because the tool only accepts `path`.

## Impact

Models infer `project` from the tool name and the per-query convention, so the first call often dies.

## Fix

Accept either `path` or `project`, and set `path = path ?? project`.
