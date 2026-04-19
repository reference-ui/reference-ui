# @reference-ui/rust

## 0.0.4

### Patch Changes

- 76c3ab5: Public pre-release

## 0.0.3

### Patch Changes

- fdf6e69: Retry the top-level package publish after the previous release only published
  `@reference-ui/rust`, which left `@reference-ui/core` and `@reference-ui/lib`
  out of sync with the native package version.

## 0.0.2

### Patch Changes

- 4a1243d: Establish `@reference-ui/rust` as the dedicated Rust/native package for Reference UI.

  This release publishes the new package boundary for the N-API bindings that back
  cross-platform native transforms.
