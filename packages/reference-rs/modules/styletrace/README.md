# Styletrace

`styletrace` takes a source tree and a Reference sync root. It emits the sorted names of exported JSX components whose StyleProps reach a Reference primitive or the Reference style pipeline, plus located, coded diagnostics. `trace()` returns names; `traceDetailed()` returns bindings, diagnostics, and owned props. Part of reference-rs.

## Identity rules

- Primitive identity comes from the synced primitive declarations, resolved through candidate entrypoints under the declaration root — never from PascalCase names or a parallel list.
- Style-prop identity comes from the synced `StyleProps` type, expanded through imports, re-exports, intersections, mapped types, indexed accesses, and the utility wrappers the Reference type system uses.
- Wrapper detection comes from actual prop flow: style props exposed at the component boundary must reach a primitive, another traced wrapper, or the `splitCssProps` / `box` / `css` pipeline. This covers direct and rest/spread forwarding, wrapper chains, barrels, aliases, namespaces, factories, export-site HOCs, and package imports resolved through the shared package path.
- Class components are not traced: a class whose props expose StyleProps emits `STT-W-CLASS-COMPONENT` instead.

## Diagnostics

Entries that fail to parse or read yield one `STT-W-SKIPPED-FILE` each and siblings still trace; an unreadable source root or a declaration root with no StyleProps entrypoint refuses the request with a coded throw, never an outcome diagnostic. Codes are wire contract: never rename, never remove. Meanings and raise sites live in the shared registry.

A source nested deeper than 1,024 levels is refused by the nesting gate in `shared` before Oxc parses it, and it is skipped the same way: one `STT-W-SKIPPED-FILE` names the file with `StyleTrace: nesting deeper than 1024 levels at line L` as its message, and its siblings still trace.

| Code | Severity | Trigger |
| ---- | -------- | ------- |
| `STT-W-SKIPPED-FILE` | warning | one file unreadable or unparsable; siblings kept |
| `STT-W-CLASS-COMPONENT` | warning | StyleProps-exposing class component; not traced |
| `STT-W-UNRESOLVED-HOC-ARGUMENT` | warning | export-site HOC argument names no component |
| `STT-W-TYPE-EXPANSION-LIMIT` | warning | a type declaration expansion hit the depth, argument-size or session-budget guard limit and the names it could reach are missing from the trace; those props are not traced |
| `STT-E-SCAN-FAILED` | error | unreadable source root; trace refused |
| `STT-E-UNRESOLVED-SURFACE` | error | no StyleProps entrypoint or sync root, or a guard limit hid a surface name; trace refused |

A guard cut behind `STT-W-TYPE-EXPANSION-LIMIT` counts as lossy when the static reach of its refused declaration (the names its body declares or references, the arguments written at the site, and the in-scope bindings they read) is not a subset of the names the trace finally returns, or when a declaration it reads fails to load. The check is conservative: it can over-report, for example by counting an argument the callee never reads, but it never misses a lost name.

## Open gaps

- **STT-23** — primitive identity from the synced declarations rather than name lookup is unproven: no case yet distinguishes declaration lookup from prop flow.

## Tripwires

- Never guess a missing surface or file: refuse with the coded throw, or skip the one file and keep its siblings.
- Never reword the skip sentence; it is pinned byte-identical to the legacy prose.
- Never expect tsconfig `paths` aliases to trace: an authoring alias must never win (deliberate).
- Never expect a local `export default function Card` in an entry to mint `Card`: the entry's own default still mints `default`. Only a re-exported default takes the component's name.
- Never expect an `Object.assign` root to trace, even when it is style-bearing (known limit).

> Search terms: forwardRef, rest spread, style prop tracer, wrapper analysis, styletrace/resolution, styletrace/wrappers, styletrace/primitives, styletrace/forwarding, rs:canon, rs:atomic, rs:base-system
