# Packager Module

The packager is the final step in the Reference UI build pipeline. It takes the generated design system code and bundles it into proper npm packages that are installed directly into the user's `node_modules` directory.

## Purpose

After the system worker has:

- Generated design tokens
- Processed CSS utilities
- Created recipes and patterns
- Generated primitives and components

The packager:

1. Bundles the code using esbuild
2. Creates proper package.json files
3. Copies additional assets (styles.css, types)
4. Installs packages to `node_modules/@reference-ui/`

## Packages Created

### `@reference-ui/system`

Contains the design tokens and CSS utilities:

- Design tokens (colors, spacing, typography, etc.)
- CSS utility functions
- Pattern definitions
- Recipe definitions
- TypeScript types

**Entry**: `src/system/css/index.js`

### `@reference-ui/react`

Contains the React components and runtime APIs:

- Primitive components (Box, Button, etc.)
- Runtime CSS and recipe APIs
- Configuration utilities (defineConfig)
- Extension APIs for build-time customization

**Entry**: `src/entry/index.ts`

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

## Running

The packager runs automatically as part of `ref sync`:

```bash
ref sync        # One-time build and package
ref sync --watch  # Watch mode (packager runs on initial build only)
```

## Implementation

- **index.ts**: Public API (`initPackager`)
- **worker.ts**: Worker thread entry point
- **bundler.ts**: esbuild bundling logic
- **packages.ts**: Package definitions and metadata

## Future Improvements

- [ ] Generate proper `.d.ts` bundle files
- [ ] Support watch mode (re-package on system changes)
- [ ] Add package caching to avoid unnecessary rebuilds
- [ ] Support custom package configurations
- [ ] Add source maps for better debugging
