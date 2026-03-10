# Packager

The packager bundles generated design system code into npm packages and outputs them to `outDir/@reference-ui/`.

## Purpose

After the system worker has generated design tokens, CSS utilities, recipes, and primitives, the packager:

1. Bundles the code with esbuild
2. Creates package.json files
3. Copies additional assets (styles.css, types)
4. Writes packages to `outDir/@reference-ui/` (e.g., `.reference-ui/@reference-ui/`)

## Architecture

```
┌─────────────┐
│   Virtual   │  Copies user files to .reference-ui/virtual
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Config    │  Generates panda.config
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Packager   │  Bundles & outputs to outDir/@reference-ui/
└─────────────┘
```

## Module Structure

- **package/** — Package definition (`PackageDefinition`), utilities (`getShortName`, `createBundleExports`)
- **bundler/** — Transform source into package output (esbuild, copy, write package.json)
- **install.ts** — Deploy packages to outDir
- **packages.ts** — Package instances (`REACT_PACKAGE`, `SYSTEM_PACKAGE`, `PACKAGES`)
- **lib/** — Helper utilities (resolve-core)

**Bundler** = transform source into package content (pure build step).  
**Install** = write packages to outDir/@reference-ui/.

## Packages

| Package | Entry | Output |
|--------|-------|--------|
| `@reference-ui/system` | `src/entry/system.ts` | Design tokens, CSS utilities, patterns, recipes |
| `@reference-ui/react` | `src/entry/react.ts` | React components, runtime APIs, styles.css |

## Output Location

Packages are written to `outDir/@reference-ui/` (defaults to `.reference-ui/@reference-ui/`).

No symlinks — output goes directly to the user's outDir for simplicity.

## Running

The packager runs as part of `ref sync`:

```bash
ref sync           # One-time build
ref sync --watch   # Watch mode
```

## Event Flow

The packager worker listens for events via the event bus:

1. `packager:ready` — Worker is up and subscribed
2. `run:packager:bundle` — Trigger: bundle packages (after system:config:complete)
3. `packager:complete` — Notification: bundling is done

## Public API

- `initPackager(payload)` — initialize packager worker
- `PACKAGES`, `REACT_PACKAGE`, `SYSTEM_PACKAGE` — package definitions
- `PackageDefinition` — type

## Design Principles

**Workers are dumb.** They subscribe to events, do one thing, emit completion. No conditional logic about what to run next.

**Events are the orchestration layer.** `sync/events.ts` wires workers together. Change the flow there, not in workers.

**Output to outDir.** All packages go to `outDir/@reference-ui/` — simple and predictable.
