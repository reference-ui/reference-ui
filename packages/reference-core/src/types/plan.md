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
- be the only public authored style object name

The key point is:

- from Panda's perspective, the system works with the tokens and config we give it
- from Reference UI's perspective, users should type against **our** style object, not Panda's

---

## Hard decisions

### 1. There should be one public `SystemStyleObject`

We should not re-export `SystemStyleObject` directly from the generated styled package and call that done.

We also do not need a second public name like `ReferenceSystemStyleObject`.

That creates two problems:

- users stay coupled to the current backend shape
- our own API becomes noisier than it needs to be

Instead:

- `SystemStyleObject` should be defined in `src/types`
- `SystemStyleObject` should be the only public authored style object name
- backend style object names can exist internally if bridge code needs them
- user-facing exports should expose only `SystemStyleObject`
- we should not import the styled `SystemStyleObject` and then tweak or wrap it
- we should generate/assemble our own `SystemStyleObject` from smaller primitive inputs

### 2. Use `csstype`

We should import `csstype` directly, same general idea Panda uses.

Why:

- CSS property coverage is already a solved problem
- we do not need to invent the raw CSS property universe ourselves
- it gives a stable, backend-independent base

So the plan is:

- use `csstype` for raw CSS property names and base property value families
- narrow those values using Reference UI token/value unions where appropriate

### 3. Use generated token/value unions as primitives, not the generated object model

We already have generated style-system knowledge today.

That means we can use current generated unions such as:

- colors
- spaces
- font-related unions
- any other generated utility value unions

These should feed into the Reference UI type layer, but they should not define the public architecture by themselves.

Concretely:

- importing generated unions like `UtilityValues["color"]` is fine
- importing generated condition keys is fine
- importing generated selector helpers is fine
- importing the generated `SystemStyleObject` is **not** the move

In other words:

- generated unions are inputs
- generated style-object aliases are not the public contract
- `SystemStyleObject` is the Reference UI contract built from those inputs
- the generated styled `SystemStyleObject` should not be the starting point

### 3.5. Panda's assembly pattern is useful, but we should only fork the parts we actually need to own

After inspecting the generated styled declarations, the current Panda-shaped model is roughly:

1. `ConditionalValue<V>`
   - `V`
   - `Array<V | null>`
   - object keyed by generated `Conditions`

2. `Nested<P>`
   - property bag `P`
   - selector nesting
   - condition nesting

3. `SystemStyleObject`
   - `Omit<Nested<SystemProperties & CssVarProperties>, "base">`

4. `SystemProperties`
   - each property value built from generated token unions, CSS property families, css vars, and string escape hatches

That structure is useful to study, but we should treat it as a reference implementation, not as the public type to import.

Important:

- we do **not** want to recreate all of `ConditionalValue`
- we only want to take ownership of the public semantics that matter to Reference UI
- the main thing we want to remove from the inherited public model is the viewport-breakpoint-default story
- the rest of the current conditional machinery can be reused or mirrored where it is still useful

### 4. Container-query-first must shape the types

The public style object should reflect Reference UI's direction:

- container queries first
- viewport-width breakpoints not treated as the long-term primary responsive model

That means the future Reference UI conditional shape should be designed by us, not inherited accidentally from Panda.

More specifically:

- we should not inherit viewport breakpoints as the assumed default responsive model
- we do not need to throw away the entire conditional object machinery to achieve that
- we should preserve the useful generic nesting/condition behavior while changing the public default direction

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
   - initially reuses most of Panda's current conditional machinery
   - removes viewport-default semantics from the public authored model
   - eventually becomes container-query-first, Reference UI-owned

4. **Reference UI style property map**
   - property-by-property overrides
   - color properties narrowed to token unions
   - spacing properties narrowed to spacing/token unions
   - font/container/reference-specific props layered in explicitly

5. **Reference UI `SystemStyleObject`**
   - recursive/nested style object
   - selectors / conditions / nested blocks
   - the single public contract for `css()` and authored style props

The important part is that `SystemStyleObject` is assembled by us from smaller pieces.

No second public alias is needed.

---

## What to build

### A. Own `StylePropValue<T>`

Today this still points at the backend conditional type.

That is too much coupling.

We should replace it with a Reference UI-owned wrapper.

Phase 1 can still be backend-compatible in most behavior.
But the alias itself should belong to us.

The goal is not to rewrite every part of the current conditional system.

The goal is:

- keep the useful generic conditional mechanics
- stop making viewport breakpoint defaults the public authored assumption
- leave room to make container-query-first semantics more explicit over time

Later we can tighten it around container-query-first semantics.

### B. Own `SystemStyleObject`

This should be a real type definition, not a backend alias and not a renamed wrapper around a backend alias.

More clearly:

- do not import styled `SystemStyleObject`
- do not `Omit<>` or otherwise patch the styled `SystemStyleObject` into our public one
- do build our own `SystemStyleObject` from owned conditional/nesting structure plus generated primitive unions

The shape will likely look like:

- a property map built from CSS property names
- narrowed token-aware values for selected properties
- Reference UI-specific props layered in
- recursive nesting support

This is the core of the work.

It should be exported simply as `SystemStyleObject`.

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

If an internal alias is needed for a generated object shape during migration, keep it private to implementation files.

---

## Suggested file direction

### `src/types/style-prop.ts`

Target:

- define a Reference UI-owned conditional wrapper
- stop making this a direct backend alias
- start by reusing or mirroring the current generated conditional mechanics where useful
- explicitly avoid baking viewport breakpoint defaults into the public authored contract

### `src/types/style-props.ts`

Target:

- define the one public `SystemStyleObject`
- do not import `SystemStyleObject` from styled types
- do not start from styled `SystemStyleObject` and tweak it
- generate our own object type from primitive pieces
- import generated primitive inputs only as needed:
  - token/value unions
  - condition keys
  - selector keys
  - css-var key helpers if useful
- keep any backend object alias private or remove it entirely

### `src/types/colors.ts`

Target:

- keep the color-narrowing idea
- source color values from generated primitive unions
- narrow our owned property map rather than patching a backend-owned object type

### `src/types/css.ts`

Target:

- point `CssStyles` at the owned `SystemStyleObject`
- keep the runtime bridge hidden in implementation files

### `src/system/primitives/types.ts`

Target:

- consume the owned `SystemStyleObject` only
- no direct import from backend style types

---

## How `csstype` fits

The likely implementation pattern is:

1. import CSS property definitions from `csstype`
2. select the property names we want to support
3. override specific property value domains with generated unions
4. wrap those value domains in `StylePropValue<T>`
5. make the result recursively nestable

However, after inspecting the generated Panda-shaped output, we do not need to force this all in one jump.

A cleaner migration is:

1. first own the conditional wrapper and nesting structure we actually need
2. first own the public `SystemStyleObject` name and export
3. use generated primitive unions for token-aware property values
4. then progressively replace backend-derived property coverage assumptions with `csstype`-driven coverage

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

### Phase 1: Own the names and structure

- own `StylePropValue<T>`
- own `SystemStyleObject`
- remove `ReferenceSystemStyleObject` as a public concept
- keep most of the current conditional/nesting mechanics
- remove viewport-breakpoint-default semantics from the public contract
- stop importing styled `SystemStyleObject` as the basis for the public type
- keep backend compatibility under the hood

### Phase 2: Build the real property layer

- define a Reference UI property map
- narrow important token-bearing properties using generated unions
- stop patching a backend object alias
- introduce `csstype` where it improves property ownership and coverage

### Phase 3: Align responsive/conditional semantics

- shape conditional types around container-query-first behavior
- stop treating backend viewport breakpoint semantics as the public default

### Phase 4: Collapse bridge code

- reduce backend alias usage
- move runtime bridges into internal files only
- make public exports fully Reference UI-owned
- leave only one public style object name: `SystemStyleObject`

---

## Success criteria

We know this is working when:

- users import Reference UI types and never need backend style types
- `SystemStyleObject` is authored in `reference-core`
- `SystemStyleObject` is the only public authored style object name
- `SystemStyleObject` is generated/assembled by us rather than imported and patched from styled types
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

- use generated token/value unions as ingredients
- define `SystemStyleObject` ourselves
- keep Panda as the current implementation detail
- introduce `csstype` as part of owning the property layer, not as a reason to keep importing Panda's object model

That is the cleanest path to control.
