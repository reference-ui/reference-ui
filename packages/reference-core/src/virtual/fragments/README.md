# Virtual Fragments

The `fragments` module classifies source files that affect generated system
config and Panda inputs without necessarily requiring a full reference rebuild.

## Purpose

When watch mode handles a single file change, virtual needs to decide whether
that change should trigger:

- `virtual:fragment:change`: regenerate system config and Panda only
- `virtual:fs:change`: regenerate config/Panda and rebuild the broader reference output

This split is mostly an optimization trick rather than a hard structural
requirement. The system would still be functionally correct if every change
fell back to `virtual:fs:change`; the fragment path exists to avoid doing the
broader rebuild work when a change only affects fragment/config inputs.

The current detector treats files importing from fragment-oriented APIs such as
`@reference-ui/system` and the config entrypoints as fragment files.

## Used By

- `../worker.ts`: the real runtime consumer; it calls `isFragmentFile()` during watch updates to choose which event to emit
- `detect.test.ts`: focused coverage for the detector itself
- `../../sync/events.ts`: does not import this module directly, but it reacts to the emitted `virtual:fragment:change` versus `virtual:fs:change` decision

## Files

- `detect.ts`: import-based fragment classification used by the virtual worker
- `detect.test.ts`: focused coverage for supported import forms and unlink/missing-file behavior