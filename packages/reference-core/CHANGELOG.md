# @reference-ui/core

## 0.0.25

### Patch Changes

- 23659ea: CI RELEASE
- 0ad4599: CI RELEASE
- Updated dependencies [23659ea]
- Updated dependencies [0ad4599]
  - @reference-ui/rust@0.0.24

## 0.0.24

### Patch Changes

- CI RELEASE
- Updated dependencies
  - @reference-ui/rust@0.0.23

## 0.0.23

### Patch Changes

- CI
- bac2087: CI RELEASE
- Updated dependencies
- Updated dependencies [bac2087]
  - @reference-ui/rust@0.0.22

## 0.0.22

### Patch Changes

- CI
- Updated dependencies
  - @reference-ui/rust@0.0.21

## 0.0.21

### Patch Changes

- CI
- Updated dependencies
  - @reference-ui/rust@0.0.20

## 0.0.20

### Patch Changes

- CI
- Updated dependencies
  - @reference-ui/rust@0.0.19

## 0.0.19

### Patch Changes

- CI
- Updated dependencies
  - @reference-ui/rust@0.0.18

## 0.0.18

### Patch Changes

- CI
- Updated dependencies
  - @reference-ui/rust@0.0.17

## 0.0.17

### Patch Changes

- 9a20cf7: CI RELEASE
- Updated dependencies [9a20cf7]
  - @reference-ui/rust@0.0.16

## 0.0.16

### Patch Changes

- 095b27f: CI
- Updated dependencies [095b27f]
  - @reference-ui/rust@0.0.15

## 0.0.15

### Patch Changes

- bad3ae8: CI
- Updated dependencies [bad3ae8]
  - @reference-ui/rust@0.0.14

## 0.0.14

### Patch Changes

- bae4b98: Ci
- Updated dependencies [bae4b98]
  - @reference-ui/rust@0.0.13

## 0.0.13

### Patch Changes

- 2194d38: Fix pipeline
- Updated dependencies [2194d38]
  - @reference-ui/rust@0.0.12

## 0.0.12

### Patch Changes

- c621771: CI

## 0.0.11

### Patch Changes

- 54a2dc7: ci
- Updated dependencies [54a2dc7]
  - @reference-ui/rust@0.0.11

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
