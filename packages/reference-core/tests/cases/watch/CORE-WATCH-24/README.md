# CORE-WATCH-24 — a dangling symlink under include warns once by name, and the sync still builds CSS and types

The spec builds a temp world whose include reaches `theme/`, then links `theme/dangling.ts` to a target that does not
exist, and adds a real type under `theme/` so the types build has something to index. A one-shot `ref sync --json`
must exit 0. The CSS sheet must carry the world's brand utility, the tasty types must index the real type, and exactly
one warning in the diagnostics array must name the link. Before the fix the tasty walk failed on the first error from
the dangling link (`TST-E-SCAN-FAILED`), the types build failed, and the sync exited 1.

> Search terms: dangling symlink, include, types build failure, tasty walk, scan failed, skipped link, warning by name, one warning, CSS and types, --json diagnostics, CORE-WATCH-08, CORE-WATCH-23
