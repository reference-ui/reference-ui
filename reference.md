# Reference Findings

Date: 2026-04-04

## Scope

This note captures the current findings from investigating the `Reference` pipeline in:

- `packages/reference-core` (`reference` bridge + browser model)
- `packages/reference-lib` (`Reference` UI rendering)
- `packages/reference-rs` (`Tasty` manifest / duplicate-name behavior)

Primary questions:

- Why full `StyleProps` are still not visible in API tables
- How to harden the underlying system
- How symbol collisions are handled today and where they still leak through
- Whether package re-exports are part of the problem

## Executive Summary

The UI renderer is probably not the root cause.

The stronger evidence points at the symbol/document generation path:

1. `Reference` renders whatever members it receives.
2. The `StyleProps` symbol is a projected type alias:
   - `Omit<SystemStyleObject, 'font' | 'weight' | 'container' | 'r'> & ReferenceProps`
3. The bridge currently force-includes only one generated Panda declaration file:
   - `.reference-ui/styled/types/style-props.d.ts`
4. That narrow include was explicitly added to avoid duplicate symbol entries.
5. That same narrow include is a plausible reason the full dependency graph needed to expand `StyleProps` is incomplete.

Net: the missing rows in API tables are more likely a projection / scan / symbol-resolution problem than a presentation problem.

## What I Verified

### 1. `StyleProps` is still defined as a projected alias

File: `packages/reference-core/src/types/style-props.ts`

Current shape:

```ts
export type StyleProps = Omit<SystemStyleObject, 'font' | 'weight' | 'container' | 'r'> &
  ReferenceProps
```

This means the docs pipeline must correctly:

- resolve `SystemStyleObject`
- understand the `Omit<...>` projection
- subtract the omitted keys
- merge in `ReferenceProps`
- preserve the resulting member set for display

If any of those steps degrade, the table collapses to only the locally obvious properties.

### 2. `SystemStyleObject` is a wrapper over external styled types

File: `packages/reference-core/src/types/system-style-object.ts`

Current shape:

```ts
export type SystemStyleObject = StrictColorProps<StyledSystemStyleObject>
```

Where `StyledSystemStyleObject` comes from:

```ts
import type { SystemStyleObject as StyledSystemStyleObject } from '@reference-ui/styled/types'
```

So the full `StyleProps` projection depends on external generated declarations, not only local source types.

### 3. The reference bridge intentionally scans a minimal styled declaration subset

File: `packages/reference-core/src/reference/bridge/tasty-build.ts`

Observed behavior:

- the bridge scans under `.reference-ui/`
- it appends only `styled/types/style-props.d.ts` if present
- it explicitly says this is to avoid duplicate symbol entries from scanning the full styled tree

Relevant comment already in code:

- full styled tree causes duplicate symbol overlaps
- only the single file is included as a workaround

This is the most suspicious point in the current pipeline.

### 4. `Reference` UI would show inherited/member groups if they existed

Files:

- `packages/reference-lib/src/Reference/components/ReferenceDocumentView.tsx`
- `packages/reference-lib/src/Reference/components/ReferenceMemberList.tsx`
- `packages/reference-lib/src/Reference/components/ReferenceMemberRow.tsx`

Observed behavior:

- the view renders either a type or interface document
- member rows are rendered from the `members` array it receives
- inherited members are grouped if `member.inheritedFrom` is present

Nothing here explains a table showing only `container`, `r`, `font`, and `weight` unless the document itself only contains those members.

Conclusion: renderer is not the first place to fix.

### 5. The browser/runtime `Reference` path still uses bare-name lookup

File: `packages/reference-core/src/reference/browser/Runtime.ts`

Observed behavior:

```ts
const symbol = await api.loadSymbolByName(name)
```

By contrast, MCP already has scoped lookup support in:

File: `packages/reference-core/src/mcp/reference.ts`

Observed behavior:

- prefers `api.loadSymbolByScopedName(library, name)` when source is known
- falls back to bare-name lookup only if needed

This means:

- MCP is already partially hardened against duplicate symbol names
- browser `Reference` is not equally hardened yet

This is a real collision risk even if it is not the direct cause of the `StyleProps` issue.

### 6. Duplicate-name handling exists in Tasty, but the browser path does not fully use it

File: `packages/reference-rs/src/tasty/generator/bundle/modules/manifest.rs`

Verified behavior:

- duplicate symbol names are preserved in the manifest
- duplicate-name warnings are emitted
- warnings explicitly say to use symbol id or scoped lookup to disambiguate

The release notes in:

File: `packages/reference-core/src/reference/RELEASE_READY.md`

also state:

- duplicate-name lookups should warn
- explicit disambiguation is required
- silent overwrite behavior was intentionally removed

So the intended system contract is already clear:

- bare-name lookup is unsafe when duplicates exist
- consumers should scope or otherwise disambiguate

### 7. Test coverage is missing for the failing behavior

Existing coverage I found:

- style props e2e tests cover runtime styling behavior, not reference API tables
- reference tests cover union labels and some scoped MCP lookup behavior
- scanner tests cover external import / re-export traversal behavior

What is missing:

- a test asserting that `Reference` for `StyleProps` contains a large projected member set
- a test asserting browser `Reference` uses scoped/disambiguated lookup when possible
- a test pinning behavior when duplicate symbol names exist across packages

This missing coverage helps explain why the same issue can recur.

## Likely Root Cause For Missing Full Style Props

Most likely cause:

- the bridge workaround that includes only `styled/types/style-props.d.ts` is too narrow

Why that likely breaks projection:

1. `StyleProps` depends on `SystemStyleObject`
2. `SystemStyleObject` depends on `@reference-ui/styled/types`
3. The projected member expansion likely needs more of the styled declaration graph than one leaf file
4. The bridge currently trades completeness for duplicate suppression

Likely resulting failure mode:

- Tasty can load the named symbol
- but the symbol graph is incomplete or partially shadowed
- so display members collapse to the local overlay surface instead of the full expanded system props

This matches the screenshot more closely than a UI bug.

## Collision Analysis

### What is already good

- Tasty manifest no longer silently overwrites duplicate symbol names
- duplicate symbol names emit warnings
- MCP already supports scoped lookup by library/source

### What is still weak

- browser `Reference` still uses `loadSymbolByName(name)` directly
- the user-facing `Reference` component currently accepts only `name`
- when two packages export the same type name, browser docs can still resolve ambiguously

### Practical implication

If two libraries export `StyleProps`, `ButtonProps`, `Theme`, etc.:

- MCP can often disambiguate if source is known
- `Reference` UI cannot reliably do that yet unless the runtime or component API is extended

## Re-export / Bridge Findings

The current system intentionally relies on explicit user exposure of external types.

Scanner docs and tests show that external library types are brought into the docs graph through imports/re-exports in controlled ways.

That means the following is expected behavior, not a bug:

- a user generally needs to export or otherwise expose the type they want documented

However, package-level type re-exports can still make collisions worse if the same symbol name is surfaced through multiple packages.

## Hardening Recommendations

### 1. Stop treating the browser `Reference` path as a special case

Make browser `Reference` use the same scoped lookup policy MCP already uses.

Concretely:

- introduce a scoped lookup path in `packages/reference-core/src/reference/browser/Runtime.ts`
- allow the `Reference` API to accept optional source/library disambiguation
- fall back to bare-name lookup only when no scope is available

This aligns browser docs with the intended manifest contract.

### 2. Add a first-class disambiguation API

Current `Reference` API is effectively:

```ts
{
  name: string
}
```

That is too weak for a system that already knows duplicate names are valid.

Recommended direction:

- support one of:
  - `{ name, source }`
  - `{ id }`
  - `{ name, library }`

Best long-term option:

- allow symbol-id lookup for exact resolution
- keep scoped lookup as the ergonomic middle ground

### 3. Replace the narrow styled-file workaround with a safer inclusion contract

Current workaround:

- include only `styled/types/style-props.d.ts`

Better direction:

- define a minimal but complete include set for styled declarations required to expand `StyleProps`
- or generate a dedicated reference bridge declaration file that intentionally flattens/anchors the needed symbols

Example strategy:

- create a synthetic bridge `.d.ts` that imports and re-exports only the symbols needed for docs generation
- scan that bridge instead of scanning a single leaf declaration file

That gives you:

- explicit ownership of the docs surface
- fewer accidental duplicates
- better reproducibility

### 4. Prefer explicit reference-owned bridge symbols over broad package re-exports

The quick fix proposed in the investigation request is directionally sound:

- avoid letting `reference-ui` packages re-export broad type surfaces unless needed

More precise version:

- do not re-export large overlapping type barrels solely for docs convenience
- expose a small, intentional bridge surface for reference generation

Reason:

- broad re-exports amplify duplicate names
- they also make symbol provenance harder to reason about

### 5. Add regression tests at the exact failure points

Needed tests:

- `StyleProps` reference document contains a materially large member count
- omitted keys are absent (`font`, `weight`, `container`, `r` should not come from the base type projection)
- `Reference` browser runtime prefers scoped lookup when source is provided
- duplicate-name browser reference resolution is explicit and stable
- bridge include set is sufficient to expand the styled/system-style dependency graph

These tests are more valuable than another round of ad hoc fixes.

## Recommended Implementation Order

1. Add a failing test for `StyleProps` reference output.
2. Inspect the emitted manifest/runtime for the actual `StyleProps` symbol and member count.
3. Fix the bridge include strategy so the full projected graph is available.
4. Add scoped lookup support to browser `Reference`.
5. Add explicit disambiguation API to `Reference` component.
6. Trim unnecessary cross-package type re-exports if they broaden collision surface.

## Confidence / Gaps

High confidence:

- renderer is not the primary root cause
- collision handling is stronger in MCP than in browser `Reference`
- bridge include minimization is a major suspect
- coverage gap is real

Not yet verified:

- the exact emitted `StyleProps` symbol shape in the current built manifest
- whether the failure is due to incomplete include coverage, duplicate suppression side effects, or both together

Reason not yet verified:

- the build/sync step needed to inspect the live emitted manifest was interrupted before completion

## Proposed Next Step

Build the current artifacts, inspect the emitted `StyleProps` symbol directly, and then implement the smallest fix that:

- restores full `StyleProps` expansion
- preserves duplicate-symbol safety
- adds regression coverage so this stops recurring
