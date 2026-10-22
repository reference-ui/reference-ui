# CORE-WATCH-32 — forty resyncs of an unchanged project that extends a sizable system retain under 3 MB of heap

Evidence: Node's ESM module cache keeps every module record for the life of the process. Each sync evaluated the
config bundle under a fresh `?t=<Date.now()>` URL and the fragment script from a fresh temp `.mjs`, and Tasty
imported its manifest under a fresh `?tastyv=N` query, so a long `ref sync --watch` grew by every module it ever
loaded: about 1.5 MB per docs resync, until dev:docs died at 4 GB. Config modules are now keyed by a hash of the
bundle, fragment scripts run as `vm` scripts that leave no module record, and Tasty keys artifacts by content.

The spec syncs the big upstream (four thousand generated tokens, so the config module is large), extends it from the
world, writes a 300 KB literal token fragment into the world (`specs/literal-fragment.ts`, gitignored, so the fragment
script is large too), and spawns a real `ref sync --watch` under `--expose-gc` with `specs/heap-probe.cjs` preloaded. The probe
samples post-GC `heapUsed` after each sync line. Five SIGUSR2 pokes warm up, then forty more resync the unchanged
project; growth between the last warm-up sample and the last poke must stay under 3 MB. Reverting
either the config fix or the fragment fix overruns it; the Tasty manifest here is too small for the case to guard
that fix, which its own vitest companion does. POSIX-only, like every
poke leg.

> Search terms: watch heap leak, memory leak, module cache, ESM cache, import cache busting, config evaluate, fragments eval, tasty manifest, artifact import, out of memory, OOM, heapUsed, expose-gc, SIGUSR2 poke, CORE-WATCH-32
