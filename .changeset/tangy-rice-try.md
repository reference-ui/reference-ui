---
'@reference-ui/icons': patch
'@reference-ui/core': patch
'@reference-ui/lib': patch
'@reference-ui/rust': patch
---

Prepare the icon package for release and tighten generated package handling across the toolchain.

- add `ref build` as shorthand for `ref sync --build`
- give generated `@reference-ui/*` packages stable project-scoped version identities so separate generated copies do not collide in TypeScript and tsserver
- support build-mode package installation for packaged consumers that need real `node_modules` copies instead of dev symlinks
- isolate `@reference-ui/icons` from `reference-lib` and the docs site, trim it down to a release-focused build flow, and ensure published bundles include `baseSystem`
