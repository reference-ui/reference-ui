# VirtualRS Test Cases

Each direct subfolder here is a standardized test station (`VRT-*`) executed by the shared station runner in `cases.test.ts`.

Each station contains:

- `case.json`: Declarative configuration selecting the native rewrite API and relative virtual path.
- `input/input.tsx`: Source code passed directly into the native transform.
- `output/expected.tsx`: Exact rewritten output verified as a golden artifact.
- `spec.ts`: Station-specific semantic assertions implementing `StationSpec<VirtualResult>`.
- `README.md`: Documents station intent and the SPEC ID anchor proved by the test.

