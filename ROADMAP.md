# Release Roadmap

## API Tables 

Harden Tasty (done)
Make pretty api tables (WIP)



## MCP Server
- make a rust module for mcp server generation


## Reload when Tokens get updated + add tests

## Vite 1st class integration

- **Goal:** One coherent client update per logical change — avoid HMR storms while `ref sync --watch` is still writing (Panda, packager, declarations). Buffer or defer Vite’s reaction until a defined **ready** signal (e.g. sync completion), then notify once.
- **Why:** Today every intermediate artifact can trigger invalidation; dev UX flickers even when the pipeline is fine. This is orchestration, not a substitute for faster incremental sync later.
- **Note:** `vite.config` aliases in reference-lib are a **stopgap** (stable resolution); the plugin should own “when to HMR” and can subsume or formalize those patterns.

## Webpack integration


## Errors and Warnings

- One obvious one: if components use tokens that don't technically exist yet (can catch people out)
- Figure out other areas where we can give better warns and errors.


# Library

## Add 'how to test' tests to MCP server. amazing stuff.
