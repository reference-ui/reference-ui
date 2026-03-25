# Release Roadmap

## API Tables 

Harden Tasty (done)
Make pretty api tables (WIP)

## Tasty: scan scope & deduping (move inward from Reference)

Reference is meant to stay a **general-purpose** host for docs and API surfaces. Today some **pipeline glue** lives in `@reference-ui/core` instead: where to scan (e.g. `.reference-ui` roots, extra Panda `style-props.d.ts`), and hygiene like pruning broken `node_modules/@reference-ui/*` symlinks. Duplicate-symbol behavior is also split between manifest emission and runtime.

**Goal:** Make **crawl policy, include sets, and deduping / disambiguation** first-class in **Tasty** (or a single documented config surface) so Reference does not own scanner internals long-term — less bleed-through, easier reuse outside this repo.



## MCP Server
- make a rust module for mcp server generation


## 1st class system to detect changes and state
right now we have an internal event bus/ statemachine
we are relying on console log to detect changes in state.
this is.. not good :)



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
