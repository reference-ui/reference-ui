# VirtualRS Tests

This suite uses Vitest plus the compiled N-API addon to exercise the published
virtual rewrite API end to end using declarative station suites.

## Layout

- `cases/` contains standardized `VRT-*` station folders.
- Each station contains `case.json`, `input/input.tsx`, `output/expected.tsx`, `spec.ts`, and `README.md`.
- `cases.test.ts` executes on-demand transforms without globalSetup or ephemeral disk writes.
- `helpers.ts` provides the runner interface and compiles individual stations.

These tests verify that the JavaScript runtime successfully loads and calls the native addon with
real fixture input, matching committed goldens and passing domain semantic specs.
