# Atlas

Atlas is the component discovery, props-interface mapping, and JSX call-site analysis engine of Reference UI. It answers which React components exist in a project and its included design libraries, which props interface type each maps to, and how components, props, and values are used at JSX call sites. Callers can also observe non-component elements, such as library primitives, by import source. Part of [reference-rs](../../README.md): a Rust engine plus a thin JS wrapper, proven by `tests/cases/` and `tests/suites/`.

## Public API

`analyze(rootDir, config?)` returns the component list; `analyzeDetailed(rootDir, config?)` returns components plus diagnostics. Each component carries `name`, `source`, `interface`, `props`, `count`, `examples`, and `usedWith`. Call sites count in project sources only: package sources and `node_modules` resolve components and types but never count as usage. `config.observe` lists import sources with element names to count, adding one `observed` entry per element actually seen.

## Scope

Exported function and arrow-function components, default-exported components consumed through default imports, and props types resolving through local files or included packages (interfaces, aliases, intersections, extension, literal unions). Local and package barrels, renamed imports, and namespace imports resolve; dynamic expressions and type metaprogramming are out of scope and surface as diagnostics rather than guesses.

## Diagnostics

Unresolved or unsupported inputs emit typed `ATL-*` diagnostics, never guessed data. Codes are wire contract: never rename, never remove. Meanings and raise sites live in the [shared registry](../../diagnostics/REGISTRY.md).

| Code | Severity | Trigger |
| ---- | -------- | ------- |
| `ATL-W-UNRESOLVED-PROPS-TYPE` | warning | named props type resolves nowhere; partial component kept |
| `ATL-W-UNSUPPORTED-PROPS-ANNOTATION` | warning | inline object props annotation; component omitted |
| `ATL-W-UNRESOLVED-INCLUDE-PACKAGE` | warning | included package does not resolve; skipped |
| `ATL-W-PACKAGE-SCAN-FAILED` | warning | resolved package unreadable; siblings kept |
| `ATL-E-SCAN-FAILED` | error | discovery itself fails; analysis refused |

## Invariants

- Diagnostics over guesses: every unsupported input surfaces explicitly.
- Fail-closed boundary: only exported components and explicitly included design packages are tracked; arbitrary `node_modules` are never eagerly scanned.
- No style-system leakage: Atlas never depends on style runtime or compiler passes.

> Search terms: call-site snippets, component index, usage analyzer, discovery/components, discovery/props-interface, callsites/jsx, barrels/re-exports, diagnostics/unresolved-props, rs:tasty, rs:styletrace, rs:shared
