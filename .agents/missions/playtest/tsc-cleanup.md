# tsc-cleanup crew — mission log

Status: COMPLETE (branch: reference-system, no commit — captain commits)

## Scope
1. `packages/reference-lib/tsconfig.build.json` — add node types so `process.env.NODE_ENV` guards resolve (Accordion.tsx:202, Menu.tsx:294, Menubar.tsx:32). Config fix only, no component edits.
2. `packages/reference-lib/src/components/NumberField/NumberField.tsx` props interfaces ONLY — add missing `data-pressed` key to NumberFieldIncrementProps/DecrementProps. Type-only, zero behavior change.

Untouched per scope: Menubar dir (crew 172), build-package.mjs.

## Repro (pre-fix)
`pnpm --dir packages/reference-lib run build` → exit 2 at `tsc -p tsconfig.build.json`:
- Accordion.tsx(202,19) TS2591 process
- Menu.tsx(294,7) TS2591 process
- Menubar.tsx(32,7) TS2591 process
- NumberField.tsx(724,7) TS2339 data-pressed on NumberFieldIncrementProps
- NumberField.tsx(842,7) TS2339 data-pressed on NumberFieldDecrementProps
`scripts/build-package.mjs` never ran (&&-chain).

## Changes
1. `packages/reference-lib/tsconfig.build.json`: added `"types": ["node"]` to compilerOptions (resolves root `@types/node` for dev-guard `process` usages).
2. `packages/reference-lib/src/components/NumberField/NumberField.tsx`: `NumberFieldIncrementProps` and `NumberFieldDecrementProps` each gain `& { 'data-pressed'?: string }` with a "managed/stripped" doc comment. Destructuring sites (~724/~842) and emit sites unchanged — type-only.

## Verify
- `pnpm --dir packages/reference-lib run build` → exit 0; `tsc -p tsconfig.build.json` clean; `build-package: B-35 node:url branches patched: 2` executed.
- `pnpm agentct Accordion --unit` → exit 0, 1 file / 26 tests passed, Failed: 0
- `pnpm agentct Menu --unit` → exit 0, 4 files / 39 tests passed, Failed: 0
- `pnpm agentct NumberField --unit` → exit 0, 2 files / 58 tests passed, Failed: 0
