# Type Product Surface Plan

This note is a companion to [`FIRST_CLASS_TYPES.md`](./FIRST_CLASS_TYPES.md).

That roadmap explains the long-term first-class-types direction. This plan is a
shorter working document for the next product-facing pass.

## What Has Been Done

The current first-class-types work has already moved the system a long way:

- named `export type { X } from '...'` re-exports now resolve through the
  canonical source symbol instead of synthesizing duplicate local alias shells
- the JS Tasty runtime now exposes `getDisplayMembers()` as the renderer-facing
  member policy
- bounded object-like projection exists for a useful subset of alias shapes:
  object literals, alias following, intersections, selected `Omit` / `Pick`
  flows, and recursive-boundary preservation
- downstream reference rendering can now show alias definitions and, when
  projection exists, member rows for aliases like
  `ReferenceSystemStyleObject`
- clean sync is now deterministic for generated system-type documentation

So the system can already do two important things:

1. preserve the canonical identity and definition of `type` declarations
2. derive a useful member surface for some object-like aliases

## New Product Goal

The next step is to make the product surface speak in terms of **types**, not
in terms of **type aliases**.

Internally, Tasty should still preserve the distinction between:

- `interface`
- `type alias`
- other internal symbol/type machinery

But externally, for reference/docs product surfaces, the top-level thing a user
sees should usually be:

- `Interface` for interfaces
- `Type` for `type X = ...`

That means `type alias` remains useful as **internal nomenclature**, but should
stop being the primary label shown in the reference UI.

## Product Rules

### 1. `type X = ...` should present as `Type`

For docs/product language, a `type` declaration is a **Type**.

Examples:

- `type MyType = 'a' | 'b'` → show `Type`
- `type MyType = { a: string }` → show `Type`
- `type MyType = SomeOtherType` → show `Type`

This keeps the UI aligned with what users wrote, instead of surfacing Tasty's
internal declaration-kind vocabulary.

### 2. Object-like types should prefer members over a definition chip

If a type has a meaningful member projection, the primary presentation should be
the **members table**.

That applies to cases like:

- object-literal aliases
- intersections that project to an object-like surface
- style/system helper types such as `ReferenceSystemStyleObject`

In those cases, the final object shape is what the user actually consumes, so
that should be the main document surface.

For now, the rough product rule should be:

- if projected members exist, show the member list as the primary content
- if no member projection exists, show the definition surface

This is a presentation rule. It should not mutate the underlying Tasty model.

### 3. Non-object-like types should show what the type is

For types such as:

- `'a' | 'b'`
- tuple aliases
- mapped/conditional/template literal forms
- indexed access aliases

the definition surface is the useful thing, so the UI should continue to show
that type expression.

This is where a simple fixture like `type DocsReferenceSimpleType = 'a' | 'b'`
is useful: it gives us a clean canonical "definition-first Type" example.

### 4. Simple aliasing should stay opaque at the docs surface

If a user writes:

```ts
type MyType = SomeOtherType
```

the docs surface should treat `MyType` as the public thing being documented.

We should not automatically expand `SomeOtherType` into a full object/members
story in the main API docs just because the graph can follow it. In many cases,
the point of introducing `MyType` is to publish that boundary intentionally.

So the default product rule should be:

- preserve the alias definition
- do not automatically replace the page with the target type's full shape
- only show members when the alias's own usable surface is meaningfully
  projected as the thing the user writes

This likely needs one explicit policy decision in Tasty/browser terms:

- direct alias-following is useful for internal resolution
- direct alias-following should not always imply "document the target instead"

## Desired Downstream Behavior

### `ReferenceSystemStyleObject`

Expected presentation:

- label: `Type`
- primary content: members table
- optional definition surface may still exist, but it should not be the main
  thing if members are available

### `type DocsReferenceSimpleType = 'a' | 'b'`

Expected presentation:

- label: `Type`
- primary content: definition snippet / definition block
- no members table

### `type MyType = SomeOtherType`

Expected presentation:

- label: `Type`
- primary content: `SomeOtherType` as the definition
- do not eagerly swap in the target type's members/details as the main docs
  surface

## What Needs To Change Next

### A. Clarify the Tasty contract

`FIRST_CLASS_TYPES.md` currently says:

- aliases keep canonical identity
- definitions should stay readable
- object-like aliases may expose projected members

That remains right, but the next pass should make one additional distinction
explicit:

- **internal resolution/projection policy**
- **external documentation policy**

The graph may resolve or follow through aliases for correctness, while the docs
surface may still decide to present the named alias boundary as the public API.

### B. Update browser/reference document semantics

Current downstream behavior still hardcodes:

- `Type alias` as the label for `typeAlias`
- a dedicated `Definition` block for aliases
- a split rendering path where aliases are definition-first

That should change in the browser/reference layer.

Likely touch points:

- `packages/reference-core/src/reference/browser/model/document.ts`
- `packages/reference-core/src/reference/browser/components/ReferenceDocumentView.tsx`
- `packages/reference-core/src/reference/browser/components/ReferenceTypeAliasDefinition.tsx`
- `packages/reference-lib/src/Reference/components/ReferenceDocumentView.tsx`
- `packages/reference-lib/src/Reference/components/ReferenceTypeAliasDefinition.tsx`
- `packages/reference-lib/src/Reference/document/ReferenceTypeAlias.tsx`

### C. Add fixtures that pin the product behavior

We should add at least one new fixture in `reference-lib` for a simple type:

```ts
type DocsReferenceSimpleType = 'a' | 'b'
```

This should sit alongside the existing richer reference prototype fixtures so we
have both:

- a definition-first `Type`
- a members-first `Type`

Likely fixture touch points:

- `packages/reference-lib/src/playground/ReferencePrototype.fixture.tsx`
- or a new focused fixture file in `packages/reference-lib/src/playground/`

The existing style props fixture already covers the members-first case:

- `packages/reference-lib/src/playground/StylePropsApiReference.fixture.tsx`

### D. Add downstream tests for the new wording and layout

We should pin at least these product assertions:

1. a simple union type renders with label `Type`, not `Type alias`
2. an object-like projected type renders a members table as its main surface
3. `ReferenceSystemStyleObject` renders as `Type` with members
4. a direct alias like `type MyType = SomeOtherType` does not automatically
   expose the target type as the main doc surface

Likely test areas:

- `packages/reference-unit/tests/reference/component.test.tsx`
- `packages/reference-unit/tests/reference/output.test.ts`
- `packages/reference-core/src/reference/browser/model/*` where useful

## Suggested Order

1. update this product contract in docs
2. add the simple-type fixture
3. change the browser/reference label from `Type alias` to `Type`
4. switch alias rendering to "members first when present, definition otherwise"
5. add tests for both simple and object-like types
6. revisit whether the definition block should be renamed, demoted, or removed
   when members exist

## Open Questions

These should be answered during implementation, not before:

- should object-like `Type` pages still show a secondary definition block below
  the members table, or should the definition disappear entirely when members
  exist?
- should the docs surface distinguish `Type` vs `Interface`, or should both
  collapse into a more neutral single label later?
- do we need an explicit Tasty/browser flag for "opaque alias boundary", or is
  the current projection policy already enough once the renderer stops eagerly
  preferring alias definitions?

## Short Version

The next pass is not "support type aliases better".

It is:

- keep `type alias` as an internal Tasty concept
- present `type X = ...` as **Type** in product surfaces
- show the final member surface when the type is object-like
- otherwise show the type definition
- avoid exposing aliased implementation detail when the user has intentionally
  published a named type boundary
