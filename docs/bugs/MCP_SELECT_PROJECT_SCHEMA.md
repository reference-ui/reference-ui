# `select_project` argument schema

**Severity:** Medium (failed tool calls)
**Area:** MCP `select_project`
**Status**: Fixed (commit "mcp: default project prefers synced; select_project schema; get_style_props per-query project").
**Scope**: `@reference-ui/mcp` (server).
**Not panda CSS.**

Fix: `select_project` takes `path` or `project` (one required; `path` wins when both are given) and `get_style_props` takes `project` like its siblings. Tests: `tools.test.ts`.

## Observed

Agent instructions say:

- Session focus: `select_project({ path: 'packages/...' })`
- Per-query targeting: pass `project: 'packages/...'`

Calling `select_project({ project: 'packages/reference-lib' })` fails Zod validation because the tool only accepts `path`.

## Impact

Models infer `project` from the tool name and the per-query convention, so the first call often dies.

## Fix

Accept either `path` or `project`, and set `path = path ?? project`.
