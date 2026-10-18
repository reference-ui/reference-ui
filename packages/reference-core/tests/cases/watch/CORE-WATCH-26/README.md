# CORE-WATCH-26 — five config loads that start together all resolve, so no one-shot loses its config to another's cleanup

Evidence: `src/config/evaluate.ts` (`evaluateConfig`) and `src/config/load.ts`. Every config load makes a per-eval temp dir
under the shared `.reference-ui/tmp` root, and its cleanup removes that root, and the out dir above it, once they are
empty. The mkdir of the root and the mkdtemp of the eval dir are two calls. A load that has made the root but not yet its
own dir loses the root to another load's cleanup: mkdtemp fails with ENOENT (or EINVAL on macOS), and a one-shot
`ref sync` exits 1 with `Failed to load ui.config.ts`. Measured before the fix, a few loads in every hundred fail under
this spread of starts.

The spec loads one temp world's config five times at once, each load after a random delay of up to 4 ms. That delay
stands in for the spread of process start times, and the load is the call `ref sync` makes before it takes the lock.
150 rounds run. Every load must resolve; a failure names the round and the load. Before the fix the spec fails with
the mkdtemp error; the red run on the HEAD sources failed at round 101 of 150.

> Search terms: config load race, mkdtemp, ENOENT, EINVAL, shared tmp root, concurrent one-shots, concurrent ref sync, config evaluation, exit 1, cleanup race, CORE-WATCH-26, CORE-WATCH-09
