# @reference-ui/lib

## 0.0.5

### Patch Changes

- 247580d: Fix Vite HMR: keep the sync-session watcher alive for the dev server (no teardown from `configureServer()`), so style and fixture updates apply without a manual refresh.

  `@reference-ui/icons` is now published as its own package and has been optimized.

- Updated dependencies [247580d]
  - @reference-ui/icons@0.0.3
  - @reference-ui/core@0.0.5

## 0.0.4

### Patch Changes

- 76c3ab5: Public pre-release
- Updated dependencies [76c3ab5]
  - @reference-ui/core@0.0.4

## 0.0.3

### Patch Changes

- fdf6e69: Retry the top-level package publish after the previous release only published
  `@reference-ui/rust`, which left `@reference-ui/core` and `@reference-ui/lib`
  out of sync with the native package version.
- Updated dependencies [fdf6e69]
  - @reference-ui/core@0.0.3

## 0.0.2

### Patch Changes

- @reference-ui/core@0.0.2

## 0.0.1

### Patch Changes

- 2966eb3: Publish the first npm release for `@reference-ui/core` and `@reference-ui/lib`.

  This release establishes the initial public package artifacts and release ci.

- Updated dependencies [2966eb3]
  - @reference-ui/core@0.0.1

## 0.0.2

### Patch Changes

- cdbcce4: Publish the first npm release for `@reference-ui/core` and `@reference-ui/lib`.

  This release establishes the initial public package artifacts and release ci.

- Updated dependencies [cdbcce4]
  - @reference-ui/core@0.0.2
