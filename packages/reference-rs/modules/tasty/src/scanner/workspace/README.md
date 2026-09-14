# Workspace Scan

This folder owns the workspace-facing scan pass: starting from user include
globs, it discovers user files, crawls reachable imports, and enforces the scan
boundary between user code and external libraries.

This is where the high-level discovery policy lives.

## Responsibilities

- expand include globs into initial user file ids
- crawl reachable imports from those entry files
- track discovered files and pending work during traversal
- decide when external imports should or should not enter the scan

## Shape

- `file_discovery.rs`: include-glob expansion into user file ids
- `discovery.rs`: thin public wrapper for reachable-file discovery
- `crawler.rs`: mutable traversal state and crawl loop
- `policy.rs`: import-following policy for user files versus library files

## Boundaries

- user files only bridge into external libraries through re-exports
- once inside an external package, discovery stays within that same package
- later AST and generator layers only see the scanned file set produced here
