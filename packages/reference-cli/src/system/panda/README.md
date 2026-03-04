# system/panda

The panda worker's domain. All Panda CSS execution lives here — nothing else does.

Requires a valid `panda.config` to already exist (written by the config step in the main thread via `runConfig`) before any of this runs. The config is generated from a **base config** (see `system/config/base.ts`) merged with fragment contributions; that base config has no dependency on generated code, so the CLI can run `ref sync` on itself and bootstrap the system without a chicken-and-egg problem.

## What it does

Two distinct operations, triggered independently:

**CSS** (`run:panda:css`) — runs `cssgen` only. Parses virtual files and writes `style.css`. Fast. This is the hot path in watch mode when a non-config file changes. Emits `system:panda:css`.

**Codegen** (`run:panda:codegen`) — runs the full Panda pipeline: codegen (TS utilities, patterns, recipes) + CSS. Output goes to `outDir/system/styled/` and `outDir/system/style.css`. Triggered after config is written (cold start or config-affecting change). Emits `system:panda:css` then `system:panda:codegen`.

## What it does not do

Does not eval files. Does not write `panda.config`. Does not know about the collector or fragment merging. Its only inputs are a valid `panda.config` on disk (under `outDir`, e.g. `.reference-ui/panda.config.ts`) and the trigger events.

## Structure

```
panda/
  codegen.ts   — runPandaCodegen() / runPandaCss() (invoke Panda CLI from outDir)
  index.ts     — onRunCss / onRunCodegen handlers
  init.ts      — initPanda(); starts the panda worker
  worker.ts    — worker entry: subscribes to run:panda:css and run:panda:codegen, emits system:panda:ready
```
