# fs

Small filesystem helpers that need a little more policy than a raw Node call.

Right now this module owns atomic file writes and staged directory publish steps
for generated artifacts.

## What it owns

- writing generated files through a temp path plus rename
- publishing a fully-prepared directory into its live location
- creating parent directories before the write
- cleaning up temp files after a failed write attempt

## What it does not own

- deciding whether a caller should rewrite a file at all
- higher-level packaging or system-generation flow

## Why this exists

`reference-core` emits generated artifacts that other processes and watchers may
read immediately. Writing those files in place risks exposing truncated content
mid-write.

`writeFileAtomic()` centralizes the safer pattern:

1. write the next contents to a sibling temp file
2. rename that temp file into place

That keeps the behavior documented, reusable, and testable instead of repeating
ad hoc temp-file logic in feature modules.

`publishStagedDir()` does the equivalent for directories:

1. prepare the next tree in a sibling staging directory
2. move the current live tree aside
3. move the staged tree into the live path
4. remove the previous tree after the new one is visible

When rename semantics are unavailable across the relevant filesystem boundary
for a directory move, `publishStagedDir()` falls back to copying the staged
tree into place. That fallback is not atomic, but it keeps repeated sync flows
working in container/mount layouts where sibling directory renames can raise
`EXDEV`.

 