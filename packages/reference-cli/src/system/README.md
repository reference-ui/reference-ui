# System

The system module generates a design system's runtime artefacts: a Panda config, CSS utilities, and compiled styles. It solves a fundamental bootstrapping problem and provides an event-driven architecture for incremental builds.

---

## The Problem We're Solving

Design systems built with Panda CSS face a chicken-and-egg:

1. **Primitives** (buttons, tokens, recipes) need to import from Panda's generated output (`css`, `cva`, etc.)
2. **Panda's codegen** needs a config that includes those primitives' contributions (tokens, recipes, patterns)
3. The config can't import the primitives without the generated output existing first

The old approach was to check in generated code or run Panda manually before the build. This broke CI, made the repo messy, and created subtle sync issues.

---

## The Solution

**Separate the base config from the primitives.**

The CLI owns a pure structural config (`system/config/base.ts`) that has zero imports from generated code. It defines the scaffold: `jsxFramework`, `preflight`, `outdir`, `include`/`exclude` patterns. This config can always be written without any dependencies.

User code (and eventually primitives) contribute **fragments** — small config slices collected at build time via the fragments system. The CLI scans source files, bundles fragment calls into IIFEs, and merges them with the base config to produce a complete `panda.config.ts`.

Because the base config is import-free, the CLI can run `ref sync` on itself and bootstrap the generated output. Once the output exists, primitives can import from it and contribute their own fragments.

---

## Architecture

```
ref sync
    │
    ▼
┌───────────────────────────────────────────────────────────────┐
│  virtual worker                                               │
│  Copies/transforms source files → .reference-ui/virtual      │
│  Emits: virtual:ready, virtual:complete                       │
└───────────────────────────────────────────────────────────────┘
    │ virtual:ready
    ▼
┌───────────────────────────────────────────────────────────────┐
│  config worker                                                │
│  Scans fragments, merges with base config, writes panda.config│
│  Emits: system:config:ready, system:config:complete           │
└───────────────────────────────────────────────────────────────┘
    │ system:config:complete
    ▼
┌───────────────────────────────────────────────────────────────┐
│  panda worker (optional)                                      │
│  Runs Panda codegen/cssgen → system/styled, style.css         │
│  Emits: system:panda:ready, system:panda:css, system:panda:codegen │
└───────────────────────────────────────────────────────────────┘
    │
    ▼
  sync:complete
```

Workers communicate via a `BroadcastChannel` event bus. Each worker subscribes to trigger events (`run:*`) and emits completion events (`system:*:complete`). The sync module wires them together — workers don't know about each other.

---

## Source Structure

```
system/
├── api/          # Extension surface (tokens, recipe, pattern collectors)
├── internal/    # Rhythm, props — use api to extend config
├── primitives/  # React components — read from styled
├── styled/       # Panda output (generated, gitignored)
├── config/       # Config generation pipeline
├── panda/        # Panda execution
└── workers/      # Worker docs
```

**Flow:** `api` ← `internal` (rhythm, props extend config) → `styled` (Panda) → `primitives` (components)

---

## Output Structure

All artefacts live under `outDir` (default `.reference-ui`):

```
.reference-ui/
  panda.config.ts      # Generated config (base + fragments merged)
  virtual/             # Transformed source files for Panda scanning
  system/
    styled/            # Panda codegen (css, cva, patterns, jsx, recipes)
    style.css          # Compiled CSS
```

Consumer code imports from `system/styled/`. The generated `panda.config.ts` points `outdir` there.

---

## Module Breakdown

### `config/`

Owns config generation. Key pieces:

- **`base.ts`** — Pure structural config. No side-effect imports. The bootstrap foundation.
- **`createPandaConfig.ts`** — Renders the final `panda.config.ts` from a liquid template, injecting base config + bundled fragments + deepMerge.
- **`runConfig.ts`** — Orchestrates scanning, bundling, and writing. Called by the config worker.
- **`worker.ts`** — Worker entry. Listens for `run:system:config`, calls `runConfig`, emits `system:config:complete`.

See [`config/README.md`](config/README.md) for details on the fragment merging strategy and how this replaces the old multi-pipeline system.

### `panda/`

Owns Panda execution. Two modes:

- **Codegen** — Full pipeline: generates TS utilities + CSS. Runs on cold start or config change.
- **CSS-only** — Fast path: regenerates CSS without codegen. Runs on file changes in watch mode.

The panda worker requires `panda.config.ts` to already exist (written by config worker). It invokes the Panda CLI from `outDir` so Panda finds the config.

See [`panda/README.md`](panda/README.md) for event details.

### `workers/`

Documents the worker threading model. Workers are flat event handlers — no orchestration logic. Coordination happens in `sync/events.ts`.

---

## Event Flow

Events follow a naming convention:

- **`run:*`** — Trigger events. Tell a worker to do something.
- **`system:*:ready`** — Worker is up and subscribed.
- **`system:*:complete`** — Worker finished its task.

Example flow for `ref sync`:

1. `initVirtual` → virtual worker starts, emits `virtual:ready`
2. `virtual:ready` → emit `run:system:config`
3. Config worker writes `panda.config.ts`, emits `system:config:complete`
4. `system:config:complete` → emit `run:virtual:copy:all`
5. Virtual worker copies files, emits `virtual:complete`
6. `virtual:complete` → emit `sync:complete`

Panda can be inserted between config and virtual copy when needed.

---

## Adding a New Subsystem

To add a new fragment type (e.g. `font()`):

1. Create a collector via `createFragmentCollector({ name: 'font', targetFunction: 'font' })`.
2. Export the collector so user code can call `font({ ... })`.
3. Register the collector in `runConfig.ts` so it's scanned and bundled.
4. The collector's contributions enter the same `deepMerge` fold as everything else.

No new workers, no new pipelines, no JSON round-trips.

---

## Design Principles

**Workers are dumb.** They subscribe to events, do one thing, emit completion. No conditional logic about what to run next.

**Events are the orchestration layer.** `sync/events.ts` wires workers together. Change the flow there, not in workers.

**Base config is sacred.** It must never import from generated code. This is the bootstrap invariant.

**Fragments are data.** User code calls functions that push objects to globalThis. The CLI bundles and merges. No magic, no hidden state.

**Fail gracefully.** If a step fails (e.g. Panda not installed), log clearly and continue. Don't block the entire pipeline.

---

## Subdirectory READMEs

- [`config/README.md`](config/README.md) — Fragment merging, base config, extends/layers
- [`panda/README.md`](panda/README.md) — Codegen and cssgen execution
- [`workers/README.md`](workers/README.md) — Worker threading model
- [`api/`](api/) — Extension API (tokens collector, recipe, pattern, etc.)
- [`primitives/README.md`](primitives/README.md) — React components (source: reference-core primitives)
- [`internal/README.md`](internal/README.md) — Rhythm, props (source: reference-core styled/rhythm, styled/props)
