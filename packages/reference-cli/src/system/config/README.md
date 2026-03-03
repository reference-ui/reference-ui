# system/config

The config worker's domain. Everything needed to dynamically produce a valid `panda.config` from user and core source files.

Eval, collectors, and config generation all live here — they are one thing: scan sources, collect fragments, write config.

## What it does

1. **Eval** — walks core (`src/styled`) and user directories (from `ui.config` include patterns), finds files that call registered functions (`extendPandaConfig`, `extendTokens`, etc.), runs them, and captures their side-effect fragments via a global collector.

2. **Collect** — gathers all fragments from the eval run. Each `extend*` call pushes a partial config object into the collector; this folder owns that contract.

3. **Generate** — deep-merges all fragments with the base config and writes `panda.config` using Handlebars templates. No string concatenation — templates live here.

## What it does not do

Does not run Panda. Does not touch CSS or codegen. Its only output is a written `panda.config` file and a `system:config:complete` event.

## Structure (planned)

```
config/
  eval/         — scanner + runner (find files, execute, collect fragments)
  collectors/   — collector initialisation and registry of known function names
  templates/    — Handlebars templates for panda.config generation
  index.ts      — onRunConfig handler (entry point for the config worker)
```
