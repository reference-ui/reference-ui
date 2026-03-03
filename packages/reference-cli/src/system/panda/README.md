# system/panda

The panda worker's domain. All Panda CSS execution lives here — nothing else does.

Requires a valid `panda.config` to already exist (written by the config worker) before any of this runs.

## What it does

Two distinct operations, triggered independently:

**CSS** (`run:panda:css`) — runs `cssgen` only. Parses virtual files and writes `styles.css`. Fast. This is the hot path in watch mode when a non-config file changes. Emits `system:panda:css`.

**Codegen** (`run:panda:codegen`) — runs the full Panda pipeline: codegen (TS utilities, patterns, recipes) + CSS + `baseSystem.mjs`. Slower. Triggered on cold start or after a config-affecting change. Emits `system:panda:css` then `system:panda:codegen`.

## What it does not do

Does not eval files. Does not write `panda.config`. Does not know about the collector or fragment merging. Its only inputs are a valid `panda.config` on disk and the trigger events.

## Structure (planned)

```
panda/
  css.ts        — cssgen (fast path)
  codegen.ts    — full Panda pipeline + baseSystem
  index.ts      — onRunCss / onRunCodegen handlers (entry point for the panda worker)
```
