# Types plan

This plan is for `packages/reference-core/src/types`.

The direction is simple:

- Reference UI must own the public style types.
- Panda can remain the current backend.
- The public authored surface must stop being a thin alias of the current backend.

We are **not** rebuilding Panda here.
We are locking down the type surface so we can swap the backend later if we want to.

---

## Goal

Define a **Reference UI-owned** `SystemStyleObject`.

That type should:

- be authored and exported from `reference-core`
- be shaped around Reference UI decisions
- use generated token/value unions from the current system
- use `csstype` for CSS property coverage
- avoid leaking backend-owned style types directly into userland

The key point is:

- from Panda's perspective, the system works with the tokens and config we give it
- from Reference UI's perspective, users should type against **our** style object, not Panda's

---

## Hard decisions

### 1. `SystemStyleObject` must be ours

We should not re-export `SystemStyleObject` directly from the generated styled package and call that done.

That keeps users coupled to the current backend shape.

Instead:

- `SystemStyleObject` should be defined in `src/types`
- backend types can still exist internally for bridge code
- user-facing exports must point at the Reference UI type

### 2. Use `csstype`

We should import `csstype` directly, same general idea Panda uses.

Why:

- CSS property coverage is already a solved problem
- we do not need to invent the raw CSS property universe ourselves
- it gives a stable, backend-independent base

So the plan is:

- use `csstype` for raw CSS property names and base property value families
- narrow those values using Reference UI token/value unions where appropriate

### 3. Use generated token/value unions

We already have generated style-system knowledge today.

That means we can use current generated unions such as:

- colors
- spaces
- font-related unions
- any other generated utility value unions

These should feed into the Reference UI type layer, but they should not define the public architecture by themselves.

In other words:

- generated unions are inputs
- `SystemStyleObject` is the Reference UI contract built from those inputs

### 4. Container-query-first must shape the types

The public style object should reflect Reference UI's direction:

- container queries first
- viewport-width breakpoints not treated as the long-term primary responsive model

That means the future Reference UI conditional shape should be designed by us, not inherited accidentally from Panda.

---

## Proposed type model

The likely layering is:

1. **Raw CSS property base**
   - from `csstype`

2. **Reference UI token unions**
   - `Colors`
   - `Spaces`
   - radii / font / shadows / etc.
   - whatever the generated system already gives us

3. **Reference UI conditional wrapper**
   - our own `StylePropValue<T>`
   - eventually container-query-first, Reference UI-owned

4. **Reference UI style property map**
   - property-by-property overrides
   - color properties narrowed to token unions
   - spacing properties narrowed to spacing/token unions
   - font/container/reference-specific props layered in explicitly

5. **Reference UI `SystemStyleObject`**
   - recursive/nested style object
   - selectors / conditions / nested blocks
   - public contract for `css()` and authored style props

The important part is that `SystemStyleObject` is assembled by us from smaller pieces.

---

## What to build

### A. Own `StylePropValue<T>`

Today this still points at the backend conditional type.

That is too much coupling.

We should replace it with a Reference UI-owned wrapper.

Phase 1 can still be backend-compatible in behavior.
But the alias itself should belong to us.

Later we can tighten it around container-query-first semantics.

### B. Own `SystemStyleObject`

This should be a real type definition, not just a backend alias.

The shape will likely look like:

- a property map built from CSS property names
- narrowed token-aware values for selected properties
- Reference UI-specific props layered in
- recursive nesting support

This is the core of the work.

### C. Own `StyleProps`

Primitive props should be based on the same Reference UI-owned system object.

That means:

- primitive style props and `css()` object types come from the same source of truth
- we stop having one "public wrapper" and one hidden "real backend shape"

### D. Keep backend bridge types internal only

If we need bridge types for:

- `@reference-ui/styled/css`
- Panda-generated runtime functions
- current generated types

that is fine.

But those types should be internal implementation details, not the public authored surface.

---

## Suggested file direction

### `src/types/style-prop.ts`

Target:

- define a Reference UI-owned conditional wrapper
- stop making this a direct backend alias

### `src/types/style-props.ts`

Target:

- define Reference UI-owned property map + `SystemStyleObject`
- stop treating backend `SystemStyleObject` as the public source of truth

### `src/types/colors.ts`

Target:

- keep the color-narrowing idea
- but source it from the Reference UI property layer instead of backend property ownership assumptions

### `src/types/css.ts`

Target:

- point `CssStyles` at the Reference UI-owned `SystemStyleObject`
- keep the runtime bridge hidden in implementation files

### `src/system/primitives/types.ts`

Target:

- consume the Reference UI-owned style object only
- no direct import from backend style types

---

## How `csstype` fits

The likely implementation pattern is:

1. import CSS property definitions from `csstype`
2. select the property names we want to support
3. override specific property value domains with generated unions
4. wrap those value domains in `StylePropValue<T>`
5. make the result recursively nestable

So for example:

- `color` should not just be generic `csstype` color strings
- it should be narrowed to Reference UI color tokens

Likewise:

- spacing-related props should be narrowed to Reference UI spacing/token values
- font props should use Reference UI-owned font unions

`csstype` gives the property universe.
Reference UI gives the allowed authored value universe.

That is the right split.

---

## Non-goals

This plan is **not**:

- rebuilding Panda
- replacing the extractor today
- inventing a custom CSS spec
- making the runtime stop using the current styled package immediately

This is about the authored type surface first.

---

## Migration order

### Phase 1: Own the names

- own `StylePropValue<T>`
- own `SystemStyleObject`
- keep backend compatibility under the hood

### Phase 2: Build the real property layer

- introduce `csstype`
- define a Reference UI property map
- narrow important token-bearing properties using generated unions

### Phase 3: Align responsive/conditional semantics

- shape conditional types around container-query-first behavior
- stop treating backend breakpoint semantics as the public default

### Phase 4: Collapse bridge code

- reduce backend alias usage
- move runtime bridges into internal files only
- make public exports fully Reference UI-owned

---

## Success criteria

We know this is working when:

- users import Reference UI types and never need backend style types
- `SystemStyleObject` is authored in `reference-core`
- `StylePropValue<T>` is authored in `reference-core`
- token narrowing is expressed through Reference UI-owned types
- the runtime can still use Panda today
- a future backend swap would not require rewriting the public authored API

---

## Practical conclusion

The right move is not:

- "wait until we replace Panda"

The right move is:

- "define the public style type system now"

That means:

- import `csstype`
- use generated token/value unions as ingredients
- define `SystemStyleObject` ourselves
- keep Panda as the current implementation detail

That is the cleanest path to control.
