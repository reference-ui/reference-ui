# H-4 lib fix — add React namespace imports to Reference sources

Status: **COMPLETE** (branch `reference-system`, no commits — captain commits)

Scope kept: `packages/reference-lib/src/components/Reference` ONLY (19
source files) + this log. No tsup config change (per H-4: automatic flip
explicitly not recommended). No commits.

Diagnosis: `.agents/missions/sharp/h4.md` — `<Reference>` crashed from dist
with `React is not defined` because Reference `*.tsx` files used JSX without
a React namespace import while tsup emits the CLASSIC `React.createElement`
factory. Fix applied exactly as prescribed: `import * as React from 'react'`
(repo convention) as the first line of each file.

## Files changed (19)

The 18 from the H-4 fix list, all under
`packages/reference-lib/src/components/Reference/`:

- Reference.tsx (first-throw site)
- ReferenceView.tsx
- ReferenceStatus.tsx
- document/ReferenceDocument.tsx
- document/ReferenceDocumentHeader.tsx
- document/ReferenceInterface.tsx
- document/ReferenceType.tsx
- components/MemberDescription.tsx
- components/MemberJsDoc.tsx
- components/MemberName.tsx
- components/MemberType.tsx
- components/MemberTypeSummary.tsx
- components/ReferenceFrame.tsx (`import type * as React` → value import;
  type-only import does not bind the runtime namespace; `React.ReactNode`
  type use still resolves)
- components/ReferenceMemberList.tsx (namespace import added alongside the
  existing named `useState` import — dual-import precedent exists in repo)
- components/ReferenceMemberRow.tsx
- components/ReferenceNotice.tsx (`import type * as React` → value import,
  same as ReferenceFrame)
- components/ReferenceTypeDefinition.tsx
- components/shared/JsDocParamChip.tsx

Plus 1 found by this crew's own sweep (same latent defect, same dir):

- components/ReferenceDocumentView.tsx — uses JSX with no React import.
  Currently DEAD CODE (not imported/exported anywhere in src, not in the
  barrel, absent from dist — the `ReferenceDocumentView` in dist is the
  generator-emitted copy from types.mjs). Fixed preventively so wiring it
  up later cannot reintroduce the crash.

Not touched: `fixtures/index.tsx` (type-only re-export, no JSX — needs no
import), the 6 `.book.tsx` fixtures (dev-only, Vite automatic runtime).

## Verification (suites with Failed counts)

- `pnpm --dir packages/reference-lib sync`: green (exit 0).
- `pnpm agentct Reference --unit` (React 19): passed, 0 tests, **Failed: 0**
  (no colocated `*.test.tsx` exists for Reference).
- `pnpm agentct Reference --e2e` (React 19): no `__e2e__/*.ct.spec.ts`
  suite exists for Reference — runner exits 1 with "No tests found",
  **Failed: 0** (nothing to fail; no suite, not a red suite).
- `pnpm --dir packages/reference-lib run build` (sync + tsup + `tsc -p
  tsconfig.build.json` + build-package): green, exit 0 — so the full
  typecheck over the 19 edited files also passes.
- Dist emit check: bare `React.createElement` sites in `dist/index.mjs`
  went 78 → **0**; the former first-throw frame now emits bound
  `React26.createElement`.
- Mount probe `/tmp/h4-libfix-mount-reference.mjs` (throwaway rewrite of
  the H-4 probe, kept out of repo):
  `renderToString(createElement(Reference, { name: 'Button' }))` from fresh
  dist → **MOUNT OK, html length: 449** (was `MOUNT FAILED:
  ReferenceError - React is not defined`).

## Flags for HQ / captain

1. H-4's dist-attributed sweep missed `ReferenceDocumentView.tsx` only
   because the file is dead code — a source-level lint rule (every
   `*.tsx` with JSX must import React) would catch the next instance
   regardless of bundling reachability.
2. No `__tests__` or `__e2e__` coverage exists for Reference; the gates
   above are vacuous by construction. A dist smoke like the mount probe
   is currently the only thing guarding this crash class.
