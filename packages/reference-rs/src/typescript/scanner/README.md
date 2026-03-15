# Scanner Layer

This folder owns the file-system-facing part of the TypeScript pipeline.

Its job is to answer a narrower question than the AST layer:

- which files belong in the scan
- what stable `file_id` and `module_specifier` each file gets
- how an import path maps to another file on disk

It should not know how to interpret TypeScript declarations beyond the minimum
needed to discover more files. Comment text is captured by the AST layer (raw
leading comments only); JSDoc interpretation is intentionally deferred to
downstream consumers (e.g. docs, MCP).

## Responsibilities

- `workspace.rs`: expands the requested user globs into a reachable scan set
- `packages.rs`: resolves local and external imports to declaration-bearing files
- `paths.rs`: normalizes file ids, package names, and module specifiers
- `imports.rs`: extracts import/export module specifiers for discovery
- `model.rs`: scanner-local structs shared by the modules above

## Resolution Notes

External resolution is intentionally declaration-driven.

The scanner first tries the installed package itself. If that package does not
expose declarations, it then looks for any installed declaration provider whose
resolved module specifier matches the import. That means we do not hardcode a
"turn `foo` into `@types/foo`" rule in the main resolution flow.

This keeps the scanner closer to "find a file that provides types for this
module" than "guess a special package name and hope it works".

## Current Limits

- we still only follow reachable files, not the whole type world
- ambient and triple-slash-heavy ecosystems will need more work
- package export resolution is intentionally conservative for now
