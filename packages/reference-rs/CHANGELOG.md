# @reference-ui/rust

## 0.0.38

### Patch Changes

- CI RELEASE

## 0.0.37

### Patch Changes

- CI RELEASE

## 0.0.36

### Patch Changes

- CI RELEASE

## 0.0.35

### Patch Changes

- CI RELEASE

## 0.0.34

### Patch Changes

- CI

## 0.0.33

### Patch Changes

- CI RELEASE

## 0.0.32

### Patch Changes

- CI RELEASE

## 0.0.31

### Patch Changes

- CI RELEASE

## 0.0.30

### Patch Changes

- CI RELEASE

## 0.0.29

### Patch Changes

- 79a460e: CI RELEASE

## 0.0.28

### Patch Changes

- dfd3cf4: CI RELEASE

## 0.0.27

### Patch Changes

- f301b4b: CI RELEASE

## 0.0.26

### Patch Changes

- 5e66c6e: RELEASE CI

## 0.0.25

### Patch Changes

- c42290a: CI RELEASE

## 0.0.24

### Patch Changes

- 23659ea: CI RELEASE
- 0ad4599: CI RELEASE

## 0.0.23

### Patch Changes

- CI RELEASE

## 0.0.22

### Patch Changes

- CI
- bac2087: CI RELEASE

## 0.0.21

### Patch Changes

- CI

## 0.0.20

### Patch Changes

- CI

## 0.0.19

### Patch Changes

- CI

## 0.0.18

### Patch Changes

- CI

## 0.0.17

### Patch Changes

- CI

## 0.0.16

### Patch Changes

- 9a20cf7: CI RELEASE

## 0.0.15

### Patch Changes

- 095b27f: CI

## 0.0.14

### Patch Changes

- bad3ae8: CI

## 0.0.13

### Patch Changes

- bae4b98: Ci

## 0.0.12

### Patch Changes

- 2194d38: Fix pipeline

## 0.0.11

### Patch Changes

- 54a2dc7: ci

## 0.0.10

### Patch Changes

- cb2befe: CI Release

## 0.0.9

### Patch Changes

- e360138: CI Release

## 0.0.8

### Patch Changes

- 6ea8726: Release reference-icons via reference-lib

## 0.0.7

### Patch Changes

- d5a0427: Test CI Release process

## 0.0.6

### Patch Changes

- 34d0b82: Prepare the icon package for release and tighten generated package handling across the toolchain.
  - add `ref build` as shorthand for `ref sync --build`
  - give generated `@reference-ui/*` packages stable project-scoped version identities so separate generated copies do not collide in TypeScript and tsserver
  - support build-mode package installation for packaged consumers that need real `node_modules` copies instead of dev symlinks
  - isolate `@reference-ui/icons` from `reference-lib` and the docs site, trim it down to a release-focused build flow, and ensure published bundles include `baseSystem`

## 0.0.5

### Patch Changes

- 247580d: Fix Vite HMR: keep the sync-session watcher alive for the dev server (no teardown from `configureServer()`), so style and fixture updates apply without a manual refresh.

  `@reference-ui/icons` is now published as its own package and has been optimized.

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
