---
'@reference-ui/icons': patch
'@reference-ui/core': patch
'@reference-ui/lib': patch
'@reference-ui/rust': patch
---

Fix Vite HMR: keep the sync-session watcher alive for the dev server (no teardown from `configureServer()`), so style and fixture updates apply without a manual refresh.

`@reference-ui/icons` is now published as its own package and has been optimized.
