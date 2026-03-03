# System Workers

Two worker threads. Each worker is a flat `on()` list wired to event handlers — no internal orchestration logic.

---

## `config` worker (`config.ts`)

Handles eval and panda.config generation.

```
on('run:system:config', onRunConfig)

emit('system:config:complete')
```

`onRunConfig` — scans dirs, runs the eval/collector loop, generates `panda.config` via Handlebars, emits `system:config:complete` when done.

---

## `panda` worker (`panda.ts`)

Handles all Panda-related steps: cssgen, codegen, baseSystem.

```
on('run:panda:css',     onRunCss)
on('run:panda:codegen', onRunCodegen)

emit('system:panda:ready')
emit('system:panda:css')
emit('system:panda:codegen')
```

`onRunCss` — runs cssgen only (fast path, watch mode file changes), emits `system:panda:css`.

`onRunCodegen` — runs full Panda pipeline (codegen + CSS + baseSystem), emits `system:panda:css` then `system:panda:codegen`.
