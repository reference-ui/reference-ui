# Styletrace

`styletrace` takes a source tree and a Reference sync root and emits the sorted names of exported JSX components whose StyleProps reach a Reference primitive or the Reference style pipeline, plus located, coded diagnostics. `trace()` returns names; `traceDetailed()` returns bindings, diagnostics, and owned props. Part of [reference-rs](../../README.md); the frozen claim list and proofs live in [SPEC.md](./SPEC.md).

## Identity rules

- Primitive identity comes from the synced primitive declarations, resolved through candidate entrypoints under the declaration root — never from PascalCase names or a parallel list.
- Style-prop identity comes from the synced `StyleProps` type, expanded through imports, re-exports, intersections, mapped types, indexed accesses, and the utility wrappers the Reference type system uses.
- Wrapper detection comes from actual prop flow: style props exposed at the component boundary must reach a primitive, another traced wrapper, or the `splitCssProps` / `box` / `css` pipeline. This covers direct and rest/spread forwarding, wrapper chains, barrels, aliases, namespaces, factories, export-site HOCs, and package imports resolved through the shared package path.
- Class components are not traced: a class whose props expose StyleProps emits `STT-W-CLASS-COMPONENT` instead.

## Diagnostics

Entries that fail to parse or read yield one `STT-W-SKIPPED-FILE` each and siblings still trace; an unreadable source root or a declaration root with no StyleProps entrypoint refuses the request with a coded throw, never an outcome diagnostic. Codes are wire contract: never rename, never remove. Meanings and raise sites live in the [shared registry](../../diagnostics/REGISTRY.md).

| Code | Severity | Trigger |
| ---- | -------- | ------- |
| `STT-W-SKIPPED-FILE` | warning | one file unreadable or unparsable; siblings kept |
| `STT-W-CLASS-COMPONENT` | warning | StyleProps-exposing class component; not traced |
| `STT-W-UNRESOLVED-HOC-ARGUMENT` | warning | export-site HOC argument names no component |
| `STT-E-SCAN-FAILED` | error | unreadable source root; trace refused |
| `STT-E-UNRESOLVED-SURFACE` | error | no StyleProps entrypoint or sync root; trace refused |

> Search terms: forwardRef, rest spread, style prop tracer, wrapper analysis, styletrace/resolution, styletrace/wrappers, styletrace/primitives, styletrace/forwarding, rs:canon, rs:atomic, rs:base-system
