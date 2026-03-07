# system/panda

The panda worker's domain. All Panda CSS execution lives here — nothing else does.

**Status:** The panda worker is defined but not wired into the default sync flow. Projects that need Panda codegen can wire `run:panda:codegen` after `system:config:complete`. For now, `ref sync` writes `panda.config.ts` and copies virtual files without running Panda.

---

## Prerequisites

Requires a valid `panda.config.ts` to already exist (written by the config worker). The config is generated from a **base config** (`system/config/base.ts`) merged with fragment contributions. Because the base config has no dependencies on generated code, the CLI can bootstrap itself.

Requires `@pandacss/dev` to be installed in the project. If missing, codegen fails gracefully and logs an error.

---

## Operations

Two distinct modes, triggered independently:

### Codegen (`run:panda:codegen`)

Full Panda pipeline: generates TS utilities, patterns, recipes, and CSS.

- Output: `outDir/system/styled/` (JS/TS), `outDir/system/style.css`
- When: Cold start, or after a config-affecting change
- Emits: `system:panda:css`, then `system:panda:codegen`

### CSS-only (`run:panda:css`)

Regenerates CSS without codegen. Fast path for watch mode.

- Output: `outDir/system/style.css`
- When: File changes that don't affect config
- Emits: `system:panda:css`

---

## What It Does Not Do

- Does not eval files
- Does not write `panda.config` (that's the config worker's job)
- Does not know about fragments or collectors
- Does not orchestrate — just responds to trigger events

---

## Structure

```
panda/
  codegen.ts   — runPandaCodegen() / runPandaCss()
  index.ts     — onRunCss / onRunCodegen event handlers
  init.ts      — initPanda(); starts the worker
  worker.ts    — worker entry; subscribes to events, emits system:panda:ready
```

---

## Wiring (When Enabled)

To include panda in the sync flow:

```ts
// In sync/events.ts
on('system:config:complete', () => {
  emit('run:panda:codegen')
})

on('system:panda:codegen', () => {
  emit('run:virtual:copy:all')
})
```

And call `initPanda()` in `sync/command.ts`.
