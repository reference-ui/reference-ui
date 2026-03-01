# Packager

The packager bundles generated design system code into npm packages and installs them into the user's project.

## Purpose

After the system worker has generated design tokens, CSS utilities, recipes, and primitives, the packager:

1. Bundles the code with esbuild
2. Creates package.json files
3. Copies additional assets (styles.css, types)
4. Installs packages to `node_modules/@reference-ui/`

## Architecture

```
┌─────────────┐
│   Virtual   │  Copies user files to .virtual
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   System    │  Runs Panda, generates tokens & primitives
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Packager   │  Bundles & installs to node_modules
└─────────────┘
```

## Module Structure

- **package/** — Package definition (`PackageDefinition`), utilities (`getShortName`, `createBundleExports`)
- **bundler/** — Transform source into package output (esbuild, copy, write package.json)
- **install/** — Deploy packages to user project (paths, symlinks)
- **packages.ts** — Package instances (`REACT_PACKAGE`, `SYSTEM_PACKAGE`, `PACKAGES`)

**Bundler** = transform source into package content (pure build step).  
**Install** = decide where packages go, create symlinks for HMR.

## Packages

| Package | Entry | Output |
|--------|-------|--------|
| `@reference-ui/system` | `src/entry/system.ts` | Design tokens, CSS utilities, patterns, recipes |
| `@reference-ui/react` | `src/entry/react.ts` | React components, runtime APIs, styles.css |

## Symlinks (HMR)

When `ENABLE_REFERENCE_UI_SYMLINKS` is true, packages are written to `.reference-ui/` and symlinked into `node_modules/@reference-ui/`. This enables Vite HMR. When false, output goes directly to `node_modules`.

## Running

The packager runs as part of `ref sync`:

```bash
ref sync           # One-time build
ref sync --watch   # Watch mode (rebundles on system changes)
```

## Public API

- `initPackager(cwd, config, options?)` — initialize packager (watch or cold)
- `bundlePackage(options)` — bundle a single package to a target dir
- `installPackages(coreDir, userProjectDir, packages)` — bundle and install to node_modules
- `PACKAGES`, `REACT_PACKAGE` — package definitions
- `PackageDefinition` — type
