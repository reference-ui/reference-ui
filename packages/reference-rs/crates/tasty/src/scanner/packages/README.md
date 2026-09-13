# Package Resolution

This folder handles import resolution once the scanner leaves pure workspace-file
discovery and needs to map module specifiers to declaration-bearing files.

The package resolver is intentionally declaration-driven. It prefers package
entries that expose types and only falls back to runtime-ish entrypoints when
they can still be mapped to declarations.

## Responsibilities

- resolve relative imports to declaration or source candidates
- resolve package-root and package-subpath imports from `node_modules`
- inspect `package.json` and `exports` metadata conservatively
- discover installed declaration providers for modules that do not ship their own types

## Shape

- `relative.rs`: relative import candidate generation
- `package_entry.rs`: package root and subpath entry resolution
- `package_json.rs`: package metadata helpers
- `node_modules.rs`: installed package directory discovery

## Boundaries

- this layer maps module specifiers to files
- the workspace crawler decides whether a resolved file should enter the graph
