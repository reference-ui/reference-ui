# NEO-WATCH-23 — an include glob that matches no files warns by name and the sync still exits 0, in both human and --json output

The spec builds a temp world whose only include glob, `nothing/**/*.ts`, reaches no file, so the token file is never
scanned. A one-shot sync must still exit 0, but its verbose output must name the dead pattern in a warning, and the
`--json` diagnostics array must carry the same warning as a row. Before the fix the sync exited 0 with no word at all,
and the tokens were dropped without a trace.

> Search terms: include glob, matches nothing, silent drop, tokens dropped, warning, --json diagnostics, fragment scan, NEO-WATCH-23
