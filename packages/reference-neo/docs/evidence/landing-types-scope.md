# Landing scope — D19 switch-minimal `@reference-ui/types` (C2 recon)

Read-only cartography per landing crew tasking (`PLAN.md:1351`, row C2).
Question: what minimal `types/` surface must exist for reference-lib to build
and run its `Reference` component under Neo, and does it need an emitter?

## 0. Verdict

**Thin hand-written shim + verbatim data carry-over. No subset emitter.**

- Recount: **11 code importers** (all under
  `packages/reference-lib/src/components/Reference/`), importing **12 unique
  names: 8 types + 4 runtime values**. The "13" in `sync/SPEC.md:45` is
  11 code files + 2 doc mentions (`Reference/README.md:14`,
  `Reference/NEXT.md:14`) — zero code drift since W4 (`w4-oracle-c-lib.md:18`
  already reported 11).
- The 12 names' entire transitive closure is **static, hand-authored
  upstream** (`reference-core/src/reference/browser/*`,
  `reference-rs/modules/tasty/js/*`). Nothing lib uses is computed at sync
  time. A shim `types.d.mts` (~230 lines, mechanical copy) plus an esbuild
  bundle of existing core sources covers 100% of the code surface.
- The switch ALSO needs the **Tasty data leg carried over verbatim**:
  `tasty/{manifest.js, chunk-registry.js, runtime.js, chunks/}` (499 files,
  ~4.1 MB). `createDefaultReferenceRuntime` dynamically imports this data
  bundle (`Runtime.ts:228`, `__REFERENCE_UI_TYPES_RUNTIME__` postprocess
  rewrite). The data is lib-API metadata (symbol names → chunk ids),
  styling-dialect-independent, so carrying the last Panda-sync output is
  lawful without a Neo Tasty emitter — with a staleness caveat (§4.6).
- No `import type` in lib-src touches Tasty: `rust/tasty|Tasty` → 0 hits in
  `Reference/` outside fixtures. No subpath imports:
  `@reference-ui/types/` → 0 hits in lib-src (the `./manifest`, `./runtime`
  subpath exports exist but lib never uses them).

## 1. Importer × names inventory (11/11)

All paths relative to `packages/reference-lib/src/components/Reference/`.
"Uses" = fields/members actually touched (full-file read, not just imports).

| # | Importer | Names imported | How lib uses them |
| --- | --- | --- | --- |
| 1 | `components/MemberJsDoc.tsx:2` | `ReferenceJsDoc`, `ReferenceParamDoc` (types) | `param.name/.optional/.description`; `jsDoc.tags → tag.name/.value`. Never `param.type/typeRef`, never `jsDoc.summary/description*`. |
| 2 | `components/MemberTypeSummary.tsx:2-5` | `ReferenceMemberTypeSummary`, `ReferenceValueOption` (types) | Exhaustive 4-kind switch (`valueSet` → `.options`; `callSignature/typeExpression/opaqueType` → `.text`); `option.label/.isDefault`. |
| 3 | `components/ReferenceDocumentView.tsx:1` | `ReferenceDocument` (type) | `document.kind === 'typeAlias'` dispatch only. |
| 4 | `components/ReferenceMemberList.tsx:3` | `ReferenceMemberDocument`, `ReferenceSymbolRef` (types) | `member.inheritedFrom(.id)`, `member.id`, `group.origin(.id/.name)`; `ReferenceSymbolRef` as struct field type. |
| 5 | `components/ReferenceMemberRow.tsx:2` | `ReferenceMemberDocument` (type) | Fan-out: `member.name → MemberName`, `member.typeLabel → MemberType` (string only — lib never switches on `ReferenceType.kind`), `member.summary.memberTypeSummary/.description/.paramDocs`, `member.id`, `member.jsDoc`. |
| 6 | `document/ReferenceDocument.tsx:2` | `ReferenceDocument as ReferenceDocumentData` (type) | `document.kind` dispatch. |
| 7 | `document/ReferenceDocumentHeader.tsx:2` | **`formatReferenceTypeParameter` (value)**, `ReferenceDocument` (type) | `document.name/.kindLabel/.description/.typeParameterDetails/.extendsNames`; `.typeParameterDetails.map(formatReferenceTypeParameter)`. Only value import besides the runtime trio. |
| 8 | `document/ReferenceInterface.tsx:1` | `ReferenceDocument as ReferenceDocumentData` (type) | `document.members` → member list. |
| 9 | `document/ReferenceType.tsx:1` | `ReferenceDocument as ReferenceDocumentData` (type) | `document.members(.length)`, `document.definition`. |
| 10 | `Reference.tsx:1-5` | **`ReferenceRuntimeProvider`, `createDefaultReferenceRuntime` (values)**, `ReferenceComponentProps` (type) | `const runtime = createDefaultReferenceRuntime()` passed opaquely to provider; `{ name }: ReferenceComponentProps`. |
| 11 | `ReferenceView.tsx:1-4` | **`useReferenceDocumentFromContext` (value)**, `ReferenceComponentProps` (type) | Destructures `{ document, errorMessage, isLoading }` (= `ReferenceDocumentState`, never directly imported). |

Two transitively-consumed types never directly imported: `ReferenceDocumentState`
(#11 destructure target) and `ReferenceRuntime` (#10 pass-through; `load()`
never called by lib — opaque). `ReferenceMemberSummary` likewise reached only
via `member.summary.*` (#5).

### 1a. Fields lib never touches (shim keeps them anyway for fidelity)

`ReferenceDocument`: `id/library/warnings/jsDoc/typeParameters/extends/types/definitionType`.
`ReferenceMemberDocument`: `kind/optional/readonly/declaredBy/semanticKind/defaultValue/type`.
`ReferenceType` 17-arm union: never switched (rendered via preformatted
`typeLabel` strings + summaries). `ReferenceParamDoc.type/typeRef`,
`ReferenceJsDoc.summary/description/descriptionRaw`: never read.

### 1b. Transitive closure the shim must declare

`ReferenceDocument`, `ReferenceMemberDocument`, `ReferenceMemberSummary`,
`ReferenceMemberTypeSummary`, `ReferenceValueOption`, `ReferenceParamDoc`,
`ReferenceJsDoc`, `ReferenceJsDocTag`, `ReferenceSymbolRef`, `ReferenceType`
(+ `ReferenceInlineMember`, `ReferenceTupleElement`,
`ReferenceTemplateLiteralPart`, `ReferenceCallableParameter`,
`ReferenceTypeParameter`), `ReferenceComponentProps`, `ReferenceDocumentState`,
`ReferenceRuntime`, `ReferenceRuntimeData` (opaque at lib boundary — `TastySymbol`/
`TastyMember` fields never touched), plus 4 leaf unions from
`@reference-ui/rust/tasty` (all plain string literals, inlinable with zero deps):

- `TastySemanticKind`: 20 literals (`reference-rs/modules/tasty/js/semantic.ts:8`)
- `TastyMemberKind`: `'property'\|'method'\|'call'\|'index'\|'construct'`
- `TastyTypeOperatorKind`: `'keyof'\|'readonly'\|'unique'`
- `TastyMappedModifierKind`: `'preserve'\|'add'\|'remove'`

## 2. Where the surface lives today (provenance)

Sources (all hand-authored, no sync computation):

- `packages/reference-core/src/reference/browser/types.ts` (221 lines) —
  every interface in §1b except the `Runtime.ts` trio.
- `browser/Runtime.ts` (284) — `ReferenceRuntime`, `ReferenceRuntimeData`,
  `ReferenceDocumentState`, `createReferenceRuntime`,
  `createDefaultReferenceRuntime`, `useReferenceDocument`.
- `browser/ReferenceRuntimeContext.tsx` (32) — provider + hooks.
- `browser/component-api.ts` (3), `browser/index.ts` (18) — barrels.
- `browser-model/{document 151, member 35, summary 300, type 337, typeLabel 24}` —
  `create*` builders + `formatReferenceTypeParameter` (pure over
  `ReferenceType`, recurses via same-module `formatReferenceType`; `type.ts:245`).
- `reference/tasty/api.ts` — `getReferenceUiTastyBrowserApiOptions()`.

Emitted (`.reference-ui/types/`, 543 files):

- `types.mjs` (7,328 lines, esbuild bundle — sole `.js` for `reference/`;
  `reference/**/*.js` → 0 files), `types.d.mts` (1-line barrel) →
  `entry/types.d.ts` (13) → `reference/browser/*.d.ts` + `browser-model/*.d.ts`
  (~264 lines d.ts total).
- `tasty/manifest.js` (4,967 lines, `symbolsByName` → chunk ids),
  `tasty/chunk-registry.js` (498), `tasty/runtime.js` (24,
  `importTastyArtifact` loader map), `tasty/chunks/` (496 files, ~4.0 MB).
- Runtime wiring: `createDefaultReferenceRuntime` does
  `import('__REFERENCE_UI_TYPES_RUNTIME__')` (`Runtime.ts:228`), rewritten by
  the packager postprocess (`packager/postprocess/rewrite-types-runtime-import.ts`)
  to `./tasty/runtime.js`.
- Consumers outside lib-src (not switch blockers): `book/vite.config.ts:40-41`
  aliases `@reference-ui/types[ /]` → emitted bundle; `tsconfig.json:16` maps
  the specifier → `./.reference-ui/types`.

## 3. Minimal-surface proposal: shim, not emitter

### 3a. Why no emitter

Every line lib consumes is static upstream source; the only generated
artifacts lib needs at runtime are the Tasty data files, whose regeneration
would be byte-comparable data, not dialect output. An emitter would exist
only to copy. The single dynamic edge (the `__REFERENCE_UI_TYPES_RUNTIME__`
rewrite) is one already-implemented postprocess rule, reusable as-is.

### 3b. File sketch: Neo-emitted (or vendored) `.reference-ui/types/`

```text
.reference-ui/types/
  package.json          # same exports map: "." (+ "./manifest", "./runtime"
                        #   carried over; lib doesn't use them, Book alias does)
  types.mjs             # esbuild bundle of existing core sources (~7.3k lines,
                        #   ZERO authored lines): browser/Runtime.ts +
                        #   ReferenceRuntimeContext.tsx + browser-model/* +
                        #   tasty/api.ts + @reference-ui/rust/tasty/browser
                        #   (workspace dep, no codegen). Postprocess keeps the
                        #   __REFERENCE_UI_TYPES_RUNTIME__ → ./tasty/runtime.js
                        #   rewrite.
  types.d.mts           # HAND-WRITTEN, ~230 lines (sketch below)
  tasty/
    manifest.js         # carried over verbatim from last Panda sync (4,967 lines)
    chunk-registry.js   # carried over (498 lines)
    runtime.js          # carried over (24 lines)
    chunks/             # carried over (496 files, ~4.0 MB)
```

`types.d.mts` sketch (mechanical copy — leaf unions inlined, zero imports
except `react` for the provider signature):

```ts
// Leaf unions (inlined from @reference-ui/rust/tasty — values quoted §1b).
export type TastySemanticKind = 'unknown' | 'function' | /* …20 total… */ 'raw'
export type RawTastyMemberKind = 'property' | 'method' | 'call' | 'index' | 'construct'
export type RawTastyTypeOperatorKind = 'keyof' | 'readonly' | 'unique'
export type RawTastyMappedModifierKind = 'preserve' | 'add' | 'remove'

// Verbatim from browser/types.ts (179-line .d.ts): ReferenceComponentProps,
// ReferenceJsDoc(+Tag), ReferenceSymbolRef, ReferenceTypeParameter,
// ReferenceCallableParameter, ReferenceInlineMember, ReferenceTupleElement,
// ReferenceTemplateLiteralPart, ReferenceType (17 arms), ReferenceValueOption,
// ReferenceParamDoc, ReferenceMemberTypeSummary, ReferenceMemberSummary,
// ReferenceMemberDocument, ReferenceDocument.
// Verbatim from browser/Runtime.ts: ReferenceRuntime (with load()), 
...[truncated 2062 chars]