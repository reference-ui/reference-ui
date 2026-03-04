# baseSystem

Emits `baseSystem.mjs` — the bundled config artefact that `extends[]` reads. This is the chain artefact that downstream packages import and pass to `defineConfig({ extends: [baseSystem] })`.

## What it does

1. **Collects** — Uses `runCollectScript` to run a bundled entry that imports the same config files as the panda entry (panda.base.ts + src/styled + user dirs), merges fragments, and extracts the public API (tokens, font, keyframes, globalCss) to JSON.
2. **Merges extends** — Applies `config.extends` (upstream baseSystems) on top, left-to-right, last wins.
3. **Microbundles** — Writes the final object through `microBundle` with minify for compact output.

Output lands in the `@reference-ui/system` package directory (`.reference-ui/system/` or `node_modules/@reference-ui/system/`).

## Why createBaseSystem vs the collector

The **collector** (via `collectEntryTemplate.ts` and `runCollectScript`) does one thing: run a bundled script that imports config files, merges them, extracts the public API, and writes JSON. It has no knowledge of `ui.config.ts` — no `name`, no `extends`.

**createBaseSystem** orchestrates the full flow:

- Invokes the collector with the right file list (same as panda entry)
- Merges upstream baseSystems from `config.extends` — the collector cannot do this because it doesn't have access to the resolved config
- Adds `config.name` to the output
- Microbundles the result (the collector writes raw JSON; we need ESM with `export const baseSystem`)

So the collector is the **data-gathering step**; createBaseSystem is the **orchestrator** that applies config, merges extends, and emits the final artefact.
