# Typegen JS face

TypeScript orchestration over the native declaration emitter. `index.ts` exposes sync and async emit entrypoints that take an `EvaluatedSystemSpec` plus an optional strict category list and return deterministic `.d.ts` text with no filesystem writes; the detailed twin adds the `TGN-W` skip warnings for what the printers omitted. `runtime.ts` serializes requests for the Node-API boundary, and `types.ts` pins the request shapes.
