# check:dist fix crew — sharp mission log

Status: COMPLETE (2026-09-27)

## Scope
- Touch ONLY: `packages/reference-lib/scripts/check-dist-fresh.mjs`
- Branch: reference-system (never switch; never commit — captain commits)

## Problem
Freshness gate watches test-only files — a Combobox SPEC edit trips
"dist is stale", but specs cannot stale a build (cries wolf → ignored).

## Fix plan
Narrow input walk to genuine build inputs:
- EXCLUDE test-only: `*.test.*`, `*.contract.test.*`, `__e2e__/*`
  (plus `*.spec.*` filenames anywhere, robustness — all current specs
  live under `__e2e__` anyway).
- KEEP story + book + src: story/book files contribute extraction
  literals to the sheet (Tree.story.tsx `120r` precedent) → MUST trip gate.

## Verify
1. touch spec file → `check:dist` PASSES
2. touch src file → FAILS naming rebuild
3. full `build` exits 0
Restore touched mtimes afterward (or rebuild at end so tree is fresh).

## Result
- Change: added `isTestOnly()` to `walk()` in check-dist-fresh.mjs —
  skips `__e2e__/` paths, `*.test.*`, `*.spec.*` filenames.
  Stories/books still watched.
- Proof 1: touched Combobox.touch.ct.spec.ts + Combobox.test.tsx +
  Calendar.contract.test.tsx → check:dist PASSES (exit 0, 298 inputs).
- Proof 2: touched Combobox.tsx → FAILS exit 1 naming
  `src/components/Combobox/Combobox.tsx` + rebuild directive.
- Bonus: touched Tree.story.tsx → FAILS naming the story (kept watched).
- Proof 3: full `pnpm --dir packages/reference-lib run build` → exit 0.
- Final: check:dist OK — tree fresh. Only content edit is the gate
  script; other `git status` entries (Listbox/Tabs) are other crews'.
