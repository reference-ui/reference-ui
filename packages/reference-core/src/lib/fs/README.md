# fs

Small filesystem helpers that need a little more policy than a raw Node call.

Right now this module owns atomic file writes for generated artifacts.

## What it owns

- writing generated files through a temp path plus rename
- creating parent directories before the write
- cleaning up temp files after a failed write attempt

## What it does not own

- deciding whether a caller should rewrite a file at all
- copy / move orchestration across trees
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
 