# NEO-WATCH-16 — a wedged watch sync reports stuck on the next save, and SIGINT exits it within the shutdown bound with the lock released

A config whose top-level await never settles pins the one resync pass the watch runs. The runner syncs this world
fresh, then the spec starts the real `ref sync --watch` CLI as a child process and reads the lines it prints. The spec
saves the wedged config, waits past the stuck bound, then saves a token: that save must print the stuck line and no
success line, since a save behind a pass that never settles is reported, never run beside it. SIGINT must then exit
the watch within the shutdown bound with exit code 1, print the line that names the sync it gave up, and leave no
sync lock behind. The original config and token come back in a `finally`, and a one-shot sync restores the generated
folder, so the tree is clean for the next run.

> Search terms: wedged sync, never-settling sync, top-level await, stuck pass, in-flight sync, stall report, shutdown
> bound, SIGINT, sync lock released, watch exit code, NEO-WATCH-08, NEO-WATCH-16
