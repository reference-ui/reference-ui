# NEO-WATCH-17 — a failed resync under --json prints one stdout diagnostics array that holds its failure

The runner syncs this world fresh, then the spec starts the real `ref sync --watch --json` CLI as a child process and
reads its stdout and stderr apart. Under --json, stdout carries one diagnostics array per sync event and nothing else;
every human line rides stderr. The spec saves a tokens fragment that throws while the watch runs. That failed resync
must print its human line on stderr and add one stdout array, a single error row carrying the failure, so a machine
reader counts the failed event like any other. The watch stops on SIGINT with exit code 0, and the fragment and the
generated folder are restored in a `finally`.

> Search terms: --json watch, diagnostics array, one array per sync event, failed resync, json stdout, stderr human
> line, codeless error row, fragment throw, watch error, NEO-WATCH-17
