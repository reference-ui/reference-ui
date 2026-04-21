# @reference-ui/core

## 0.0.10

### Patch Changes

- cb2befe: CI Release
- Updated dependencies [cb2befe]
  - @reference-ui/rust@0.0.10

## 0.0.9

### Patch Changes

- e360138: CI Release
- Updated dependencies [e360138]
  - @reference-ui/rust@0.0.9

## 0.0.8

### Patch Changes

- 6ea8726: Release reference-icons via reference-lib
- Updated dependencies [6ea8726]
  - @reference-ui/rust@0.0.8

## 0.0.7

### Patch Changes

- d5a0427: Test CI Release process
- Updated dependencies [d5a0427]
  - @reference-ui/rust@0.0.7

## 0.0.6

### Patch Changes

- 34d0b82: Prepare the icon package for release and tighten generated package handling across the toolchain.
  - add `ref build` as shorthand for `ref sync --build`
  - give generated `@reference-ui/*` packages stable project-scoped version identities so separate generated copies do not collide in TypeScript and tsserver
  - support build-mode package installation for packaged consumers that need real `node_modules` copies instead of dev symlinks
  - isolate `@reference-ui/icons` from `reference-lib` and the docs site, trim it down to a release-focused build flow, and ensure published bundles include `baseSystem`

- Updated dependencies [34d0b82]
  - @reference-ui/rust@0.0.6

## 0.0.5

### Patch Changes

- 247580d: Fix Vite HMR: keep the sync-session watcher alive for the dev server (no teardown from `configureServer()`), so style and fixture updates apply without a manual refresh.

  `@reference-ui/icons` is now published as its own package and has been optimized.

- Updated dependencies [247580d]
  - @reference-ui/rust@0.0.5

## 0.0.4

### Patch Changes

- 76c3ab5: Public pre-release
- Updated dependencies [76c3ab5]
  - @reference-ui/rust@0.0.4

## 0.0.3

### Patch Changes

- fdf6e69: Retry the top-level package publish after the previous release only published
  `@reference-ui/rust`, which left `@reference-ui/core` and `@reference-ui/lib`
  out of sync with the native package version.
- Updated dependencies [fdf6e69]
  - @reference-ui/rust@0.0.3

## 0.0.2

### Patch Changes

- Updated dependencies [4a1243d]
  - @reference-ui/rust@0.0.2

## 0.0.1

### Patch Changes

- 2966eb3: Publish the first npm release for `@reference-ui/core` and `@reference-ui/lib`.

  This release establishes the initial public package artifacts and release ci.

## 0.0.2

### Patch Changes

- cdbcce4: Publish the first npm release for `@reference-ui/core` and `@reference-ui/lib`.

  This release establishes the initial public package artifacts and release ci.
