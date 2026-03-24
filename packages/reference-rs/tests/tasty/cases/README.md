# Tasty cases

Each direct subfolder of this directory is one test case. A case owns its local
TypeScript input, its Vitest assertions, and its generated output.

When you run the Tasty test suite:

- Each case is scanned with the glob `{case_name}/input/**/*.{ts,tsx}`.
- Output is written back into that same case under `output/`, including `manifest.js`, `chunks/*`, and `perf-metrics.txt`.

So:

- `generics/` → type parameters, type arguments, object type literals.
- `external_libs/` → node_modules resolution (csstype, json-schema), extends, descriptions.
- `signatures/` → readonly, optional, method/call/index signatures, array/tuple/intersection (§4.2–4.3).
- `unions_literals/` → union types, literal types, optional members.
- `tsx/` → .tsx file scanning (interfaces and type aliases from TSX).
- `default_params/` → type parameters with default (e.g. `T = string`).
- `object_projection/` → bounded object-like projection for aliases, intersections, and `Omit` / `Pick`.
- `package_reexports/` → canonical library symbols remain single-source-of-truth through package type re-exports.
- `recursive_projection/` → generic alias instantiation plus recursive object-like projection boundaries.
- `style_props_projection/` → domain-shaped `ReferenceSystemStyleObject`-style projection over `Nested`, `Omit`, and pattern props.
- `unknown_complex/` → mapped and conditional types (structural, with nested unsupported pieces still emitted as Raw when needed).
- `audit_alignment/` → audit-driven coverage for intentionally raw variants (`import()`, `infer`, `type predicate`, `this`) plus their surrounding structured shapes.
- `interface_extends_utility` → `extends Omit<…>` heritage plus manifest-backed child `extends` chains.
- `interface_extends_utilities` → broad built-in utility heritage: `Omit`, `Pick`, `Partial`, `Required`, `Record`, `Readonly`, multiple heritage clauses, nested `Omit<Pick<…>>`, union omit keys, and generic key parameters.
- `intersection_patterns` → `A & B`, override / last-write-wins, `Omit<…> & { … }`, long intersections, and generic `Merge<T, U> = Omit<T, keyof U> & U`.
- `class_patterns` → class-oriented **documentation** patterns: `implements`, `extends` abstract, visibility, static, decorators, parameter properties. Tasty still emits **interfaces/types** only; non-exported `class` bodies exercise the parser.

Add a new case folder to add a new scenario. The test suite will automatically
scan `input/` and write `output/manifest.js`, `output/chunks/*`, and
`output/perf-metrics.txt`.

Shared setup (`package.json`, `package-lock.json`, `node_modules`) lives one
level up at `tests/tasty/`; each case folder contains only its scenario-specific
files.
