# Virtualfs tests

This suite uses Vitest plus the compiled N-API addon to exercise the published
virtual rewrite API end to end.

## Layout

- `cases/` contains one folder per rewrite scenario.
- Each case contains `case.json`, `input.tsx`, `expected.tsx`, and `rewrite.test.ts`.
- `globalSetup.ts` runs the real native API, writes `output/result.tsx`, and
  records `output/perf-metrics.txt`.

These tests are intentionally lighter than the Rust unit suite. They verify that
the JavaScript runtime is successfully loading and calling the native addon with
real fixture input.
