# Virtualfs cases

Each direct subfolder here is one end-to-end rewrite case for the compiled
native addon.

Each case contains:

- `case.json` to choose the native API and relative virtual path.
- `input.tsx` as the source passed into the addon.
- `expected.tsx` as the exact rewritten output we expect back.
- `rewrite.test.ts` to assert the generated output and perf metrics.

Generated artifacts are written into `output/` during Vitest global setup.
