# Bundle Modules

This folder contains the concrete emitted module templates used by Tasty bundle
assembly.

These helpers define the small fixed module set around the symbol chunks:
manifest, runtime loader, chunk registry, declaration shims, and stable chunk
paths/export names.

## Responsibilities

- build stable emitted export names for symbols
- emit the manifest module and its declaration module
- emit the runtime loader module and its declaration module
- emit the chunk registry that maps emitted chunk specifiers to dynamic imports

## Files

- `mod.rs`: shared emitted module paths and assembly helpers
- `export_names.rs`: deterministic export-name generation
- `manifest.rs`: manifest payload emission

## Boundaries

- symbol payload bodies come from `generator/symbols.rs`
- this folder focuses on module layout and loader-facing glue
