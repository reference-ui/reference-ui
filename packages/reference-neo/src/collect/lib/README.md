# lib — the collection machinery

Everything behind the surface: discovery, bundling, preparation,
evaluation, merging. Scan walks the project's include globs and keeps
every file whose imports mention a fragment needle; the native scan
does the same walk engine-side and the differential batteries pin the
two to identical selection on every tree. Each matched file bundles
to a self-contained IIFE with the author ids aliased back at Neo
source — at collection time no generated package exists yet, so the
bootstrap import map is the one lie the pipeline tells on purpose.
Preparation gathers upstream portable bundles, local IIFEs, and the
retention ref; evaluation runs the whole assembly exactly once as a
single Node script with upstream bundles first (the `globalCss`
collector suppressed, since upstream global CSS ships through the
packed-CSS merge) and local bundles after, each source-tagged.
Merging resolves later-wins with recursive objects, wholesale arrays,
and upstream `_private` stripped at the boundary.

```text
scan ──▶ bundle ──▶ prepare ──▶ evaluate ──▶ merge ──▶ spec
```

Shared literals — discovery needles, native mirror sets, source tags —
live once in the root constants, extracted so no two stages can drift
apart.

## What lib does NOT own

The author calls and their shapes (the surface), the wire format
(`reference-rs/contracts`), and everything downstream of the spec:
compile, publish, links, runtime resolution.
