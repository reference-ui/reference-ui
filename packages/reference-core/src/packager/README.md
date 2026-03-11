# Packager

The packager turns generated Reference UI output plus core runtime entry points
into installable local packages inside the configured `outDir` (usually
`.reference-ui`).

Its job is to make these imports resolve in the user project:

- `@reference-ui/react`
- `@reference-ui/system`
- `@reference-ui/styled`

## Purpose

By the time packager runs, upstream phases have already produced config-driven
output such as Panda CSS files and generated system artifacts. The packager then:

1. bundles runtime entry points with esbuild when needed
2. copies generated assets into package folders
3. writes package metadata (`package.json`, exports, types entry fields)
4. symlinks `node_modules/@reference-ui/*` back to the generated output

This is the bridge between internal generation and normal package-style module
resolution in the user's app.

## What it actually writes

The install step writes packages directly into `outDir`:

```text
<cwd>/.reference-ui/
  react/
  system/
  styled/
```

It also creates matching symlinks here:

```text
<cwd>/node_modules/@reference-ui/
  react -> ../../.reference-ui/react
  system -> ../../.reference-ui/system
  styled -> ../../.reference-ui/styled
```

That means consuming code can import `@reference-ui/react` normally while the
real generated content still lives under the build output directory.

## Package set

| Package | How it is produced | Notes |
|--------|---------------------|-------|
| `@reference-ui/react` | bundled from `src/entry/react.ts` | runtime React API, copies `styled/styles.css`, injects configured layer name into bundle |
| `@reference-ui/system` | bundled from `src/entry/system.ts` | design-system extension/runtime entry for generated system output |
| `@reference-ui/styled` | metadata + generated files | Panda output package; packager does not bundle it, it just exposes the generated files as a package |

## Architecture

There are two distinct responsibilities:

- `bundler/`: produce package contents in a target directory
- `install.ts`: choose output locations, run the bundler, then create symlinks

That split matters:

- bundling decides what goes inside a package
- install decides where the package lives in the user project

## Module structure

- `packages.ts`: canonical package definitions (`REACT_PACKAGE`, `SYSTEM_PACKAGE`, `STYLED_PACKAGE`, `PACKAGES`)
- `package/`: `PackageDefinition`, package-name helpers, exports helpers
- `bundler/`: esbuild bundling, copying, TS-to-JS transforms, package.json writing
- `install.ts`: package installation into `outDir` plus symlink creation
- `run.ts`: event-driven execution entry point
- `worker.ts`: long-lived worker subscription
- `ts/`: separate TypeScript declaration packaging flow

The filesystem-specific symlink behavior itself lives in `src/lib/symlink`, not
in the packager folder, because it is low-level infrastructure rather than
package-definition logic.

## Build behavior

Bundled packages use esbuild with:

- ESM output
- `platform: 'neutral'`
- externals for React, React DOM, and `@reference-ui/styled`

Non-bundled assets are copied into the package directory. TypeScript source
files copied as assets are transformed to JavaScript on the way out.

For `@reference-ui/react`, the install step also replaces the internal
`__REFERENCE_UI_LAYER_NAME__` placeholder with `config.name` after bundling.

## Relationship to TypeScript packaging

JavaScript/package installation and declaration generation are split:

- `packager` writes runtime package contents and emits `packager:complete`
- `packager-ts` handles declaration output
- when `skipTypescript` is enabled, `packager` also emits `packager-ts:complete`
  so the wider sync flow can still finish cleanly

So "packager complete" does not necessarily mean every `.d.ts`-style artifact
was produced by the same worker.

## Event flow

The worker lifecycle is intentionally small:

1. `worker.ts` subscribes to `run:packager:bundle`
2. it emits `packager:ready`
3. `run.ts` resolves the core package dir and calls `installPackages(...)`
4. success emits `packager:complete`
5. if `skipTypescript` is on, it also emits `packager-ts:complete`

The worker does not decide orchestration order. It only reacts to events and
publishes completion.

## Public API

- `initPackager(payload)`
- `initTsPackager(payload)`
- `PACKAGES`, `REACT_PACKAGE`, `SYSTEM_PACKAGE`, `STYLED_PACKAGE`
- `SOURCE_PACKAGE`
- `PackageDefinition`
- `PackagerEvents`

## Design principles

**Package definitions are declarative.** `packages.ts` describes what each
package should look like; the bundler and installer execute that description.

**Generated output stays in `outDir`.** Symlinks exist for module resolution,
not as the source of truth.

**Workers stay small.** Orchestration belongs to the sync/event layer, not to
the packaging worker itself.
