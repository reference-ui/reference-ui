# cli — the user-facing command layer, thin by law

`ref` is a surface, not an engine. This folder maps argv to subsystem
calls, prints the human lines, and returns the exit code; the bin is a
trampoline that forwards argv and exits.

The thinness law (§3.12) is the whole design: cli owns argv shape, exit
codes, printing, and process lifecycle (signals, the watch
never-promise). It must not own the link list (derived from the
packager's PACKAGES), the wipe (the retrying cleanDir primitive), the
tasty drain (one subsystem call — the REF-10 knowledge lives with the
bridge), or any compile/publish/link logic (subsystem calls, never
inlined). Commander.js owns argv shape only; the law above is
unchanged by the framework.

Init is the one writer outside the generated folder: it drops a default
`ui.config.ts` and refuses when config discovery already finds one.

Watch splits at the flag: cli owns `--watch` routing unconditionally,
while the watch driver lives in `src/lib/watch/`.
Output strings are pinned by the bin tests and the CLI cases, which
is where the §3.12 one-line contract (glyph + command + stats) is
checked.
