# NEO-WATCH-29 — a config whose top-level await never settles exits a one-shot 1 with a named evaluation-timeout line, and a watch reports it and keeps watching until the config is fixed

Evidence: `src/config/evaluate.ts` (`evaluateConfig`, `importWithTimeout`) and `src/config/errors.ts`. The config is
imported as an ES module, and the import waits on the config's top-level await. Before the fix nothing bounds that wait.
When the event loop has no other work, Node ends the process with exit 13 and prints its own unsettled-await warning, so
`ref sync` prints no `[ref]` line and gives no reason.

The bound is 30 seconds, far above a config's normal evaluation time and past the watch's own stuck and shutdown bounds.
The spec runs two legs over temp worlds whose config awaits a promise nothing resolves.

- One-shot: the real `ref sync` CLI must end on its own, not by a signal, with exit 1, and print a `[ref] sync failed:`
  line that names the evaluation timeout.
- Watch: `watchSync()` resyncs that config. The timeout must reach `onError`, and the watch must keep running. Then the
  config is fixed, a token changes too, and the same watch must resync and carry the new brand into the sheet, with no
  restart.

Each temp world is removed in a `finally`.

> Search terms: top-level await, never settles, unsettled await, exit 13, config evaluation timeout, hung config, one-shot exit code, [ref] line, watch resync, keeps watching, onError, LoadConfigError, NEO-WATCH-29, NEO-WATCH-16, NEO-SYNC-08, NEO-LAYERS-05
