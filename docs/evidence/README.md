# Filed measurement evidence

This tree holds filed profiler output: every number a recon report or voyage
brief cites must resolve to a file under here. Bundles are immutable once
filed; newer procedures re-derive from preserved raws into new bundles rather
than overwriting. Nothing here is live state — regenerate with the commands
below instead of editing.

## Canonical bundles (enterprise)

Four bundles form the current corrected record; cite these, not their
siblings. They share the locked load (3000 style + 12000 dead files, 7527
css calls, seed 7) and join on same-run phase edges in `phases1b`.

- `flamegraph/enterprise-flame3/` — samply CPU profile, procedure
  `agentrs-flame/3` (weighted aggregation, same-run phases).
- `counters/enterprise-counters3/` — hardware counters plus libc census,
  procedure `agentrs-counters/3`.
- `alloc/enterprise-alloc3/` — GC census plus Rust alloc span with compiler
  phases, procedure `agentrs-alloc/3`.
- `phases/enterprise-phases1b/` — the reconciled join of the three legs,
  procedure `agentrs-phases/1`.

## The `latest` trap

Directories named `*-latest` are pin-name artifacts, not the newest
procedure: `flamegraph/enterprise-latest` is the stale `agentrs-flame/1`
capture (unweighted, unphased). Treat any `latest` bundle as historical
unless its `meta.json` procedure says otherwise.

## Reading the record

Start interactive: `flamegraph/enterprise-flame3/flamegraph.html` renders the
full stack forest with phase filtering and per-function docs. Start textual:
each bundle's `summary.md` carries the headline tables, `callers.md` (where
filed) carries caller and edge attribution the leaf tables flatten away, and
`docs/missions/completed/operation-flamegraph-recon-v2.md` carries the
synthesis with kill bars. The phase decomposition in `phases1b` is the only
place all legs are joined; single-leg walls never compare across bundles.

## Deriving without re-recording

```bash
pnpm agentrs flame --top <bundle> [--phase P] [--n N]
pnpm agentrs flame --modules <bundle> [--phase P] [--n N]
pnpm agentrs flame --inspect <bundle> <fn> [--phase P]
pnpm agentrs flame --callers <bundle> [--out dir]
pnpm agentrs flame --resummarize <bundle> [--out dir]
```

The first three print scoped reports to stdout; `--callers` files
`callers.md` beside the raws; `--resummarize` re-derives a whole bundle
under the current procedure. Scopes default to the compile phase; use
`--phase all` for whole-run views.
