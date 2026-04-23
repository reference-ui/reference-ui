# SIZE

This file is a problem brief and LLM prompt for designing `size` support in this repo.

It should give another engineer, or another model, enough context to reason about the problem without having to rediscover the architecture from scratch.

## Prompt

You are helping design support for `size` in a Panda-based design system.

The semantic goal is simple:

```ts
css({ size: '10r' })
```

should mean:

```ts
{
  width: '10r',
  height: '10r',
}
```

and:

```tsx
<Div size="10r" />
```

should behave the same way.

The complication is that this repo has two overlapping style-extension surfaces:

1. Panda utilities, which can produce universal style props when Panda recognizes them
2. a custom box-pattern extension pipeline, which is especially important for `box(...)` and generated React primitives

We need a plan for how `size` should be implemented in this system.

The answer should not just say “use utilities” or “use patterns.” It needs to reason about which surface we actually care about, where Panda prop discovery is fragile, what the previous failed attempt tells us, whether we should support one or both surfaces, and how to keep them semantically aligned.

## The Problem We Are Actually Solving

We are not just trying to invent a shorthand.

We are trying to solve a concrete ergonomics and architecture problem:

- developers want to write `size` once instead of `width` and `height`
- they want rhythm values like `10r` to work the same way they already work for `width` and `height`
- they especially want this to work reliably in the React-facing API surface of this repo
- universal Panda support through `css({ size: ... })` would be nice, but may be harder or more fragile than box/primitives support

The main design question is therefore:

Should `size` be implemented as:

- a box-pattern prop
- a Panda utility / built-in utility override
- both, with one treated as the guaranteed surface and the other treated as optional universal support

## Why This Is Non-Trivial

This repo is not using raw Panda in the simplest possible way. It has a layered system:

- custom Panda config generation
- a bundled extensions runtime
- custom box-pattern collection and merge logic
- generated primitives that route style props through the box pattern
- custom rhythm token and utility behavior

So “what Panda supports in theory” and “what works reliably in this repo’s React surfaces” are not identical questions.

## Desired Behavior

The desired semantics are:

1. `size` means equal `width` and `height`
2. rhythm values like `10r`, `2r`, `0.5r`, etc. should work consistently
3. if both pattern and utility surfaces exist, they must mean exactly the same thing
4. implementation should not depend on preexisting `w-*` and `h-*` atomic classes already being generated

## Previous Failed Attempt

We already tried a Panda utility approach, and it behaved like class composition:

- `size=10r` effectively turned into something like `h-10r` and `w-10r`
- that assumed the corresponding width and height atomic classes already existed
- that is not what we want

This is important.

That failure does **not** prove that Panda utilities cannot solve this.

It only proves that the previous implementation shape was wrong.

The wrong shape was:

- treating `size` as a composition of other utilities/classes

The right shape, if utility-based, would be:

- a real utility whose transform directly returns `{ width, height }`
- or a correct use/override of Panda’s existing `boxSize` utility semantics

## Repo-Specific Facts

### 1. Rhythm values already exist for width and height

File:

- `packages/reference-core/src/system/panda/config/extensions/rhythm/utilities.ts`

This file defines rhythm-aware transforms for many props, including:

- `width`
- `height`
- `fontSize`
- `lineHeight`
- spacing-related props

The important part is that these rhythm utilities:

- use `values: 'spacing'`
- run values through `resolveRhythm(value)`

So `10r` already works for `width` and `height` in this repo.

### 2. Rhythm token data currently lives in spacing

File:

- `packages/reference-core/src/system/panda/config/extensions/rhythm/tokens.ts`

This file registers rhythm values under `theme.tokens.spacing`, e.g.:

- `r`
- `0.5r`
- `1r`
- `1.5r`
- `2r`
- `10r`

If `size` is implemented via Panda’s built-in `boxSize` utility, we may also need equivalent entries under the `sizes` token scale.

### 3. There is already a custom box-pattern extension pipeline

Files:

- `packages/reference-core/src/system/api/patterns.ts`
- `packages/reference-core/src/system/panda/config/extensions/api/extendPatterns.ts`

These files collect and merge custom extensions onto the Panda `box` pattern.

The resulting box pattern flows through generated code like:

- `@reference-ui/styled/patterns/box`
- generated primitives that call `box(boxProps)`

This is already how repo-specific props like `container`, `r`, and `weight` are handled.

### 4. Box-pattern props and universal style props are not the same surface

Relevant files:

- `packages/reference-core/src/system/styled/patterns/box.d.ts`
- `packages/reference-core/src/system/styled/patterns/box.js`
- `packages/reference-core/src/system/styled/jsx/is-valid-prop.js`
- `packages/reference-core/src/system/styled/jsx/is-valid-prop.d.ts`
- `packages/reference-core/src/system/primitives/index.tsx`
- `packages/reference-core/src/system/build/primitives/generate.ts`

Important architectural fact:

- universal Panda style props are recognized through Panda’s generated style-prop machinery, especially the `isCssProperty` / `splitCssProps` path
- box-pattern props are recognized through the box pattern’s own declared properties and then applied via `box(boxProps)`

Those are overlapping but not identical pipelines.

This is one of the main reasons `size` is tricky.

### 5. Generated Panda output already contains a built-in size-like concept

Relevant generated files:

- `packages/reference-core/src/system/styled/css/css.js`
- `packages/reference-core/src/system/styled/types/style-props.d.ts`
- `packages/reference-core/src/system/styled/types/prop-type.d.ts`

These show that Panda already has:

- `boxSize`
- shorthand `size`

But in this repo’s generated public types, the universal prop surface is clearer for `boxSize` than for a first-class `size` property.

So the repo already sits close to the concept we want, but not necessarily at the exact ergonomic/API surface we want.

### 6. There is already a pattern in Panda output where `size` means width + height

Relevant generated file:

- `packages/reference-core/src/system/styled/patterns/square.js`

That pattern already transforms:

```ts
{ size }
```

into:

```ts
{ width: size, height: size }
```

So the semantic meaning of `size` is not controversial.

The real issue is which extension surface should own it in this repo.

## Known Architecture Nuances That Matter

### Universal utility props

If `size` is implemented as a Panda utility, then the win is:

- it can become a universal style prop
- it can work in `css({ size: ... })`
- it can work in JSX style props if Panda codegen recognizes it properly

But the risk is:

- Panda prop discovery has already been flaky here, especially on React component surfaces
- the previous utility attempt was implemented in the wrong way
- utility support alone may not solve React/primitives ergonomics if recognition remains incomplete

### Box-pattern props

If `size` is implemented as a box-pattern prop, then the win is:

- it matches the repo’s existing React-facing extension surface
- it is likely to work well for `box(...)`
- it is likely to work well for generated primitives like `<Div size="10r" />`

But the limitation is:

- a pattern alone does not automatically make `css({ size: ... })` a universal Panda prop

### The repo already mixes surfaces when necessary

One clue is `weight`.

Generated primitives have explicit logic to shuttle some props into the box-pattern path. That means this system already accepts that not every useful React-facing prop comes purely from universal Panda utility recognition.

So a two-surface solution would not be unprecedented if it is kept disciplined.

## What We Need From The Answer

The answer should produce a design recommendation and a plan.

It should address all of the following:

1. What is the primary problem to optimize for?
   - universal Panda support?
   - reliable React/primitives ergonomics?
   - both?

2. Should `size` be implemented as:
   - pattern only
   - utility only
   - both pattern and utility

3. If both are used, which one is the guaranteed/public surface and which one is optional/nice-to-have?

4. How should rhythm values be sourced?
   - continue using `spacing`
   - add matching entries under `sizes`
   - share a single rhythm token builder across both scales

5. How do we avoid semantic drift if both surfaces exist?

6. What exactly went wrong in the previous utility attempt, and how should that be avoided in a future implementation?

7. What tests should exist to prove the implementation is correct?

## Constraints

The plan should respect these constraints:

- do not rely on post-hoc class composition of `width` and `height`
- do not create two independent meanings of `size`
- keep rhythm semantics consistent with existing `width` / `height` behavior
- prefer implementation shapes that match this repo’s actual architecture, not just idealized Panda docs
- if a dual-surface solution is proposed, it must be explicit and justified

## Non-Goals

These are not the main problem:

- inventing a brand-new meaning for `size`
- making arbitrary raw values work without any token discipline unless there is a strong reason
- solving unrelated Panda codegen issues beyond what is necessary for `size`

## Current Hypotheses

These are hypotheses, not final answers. The response should test them.

### Hypothesis A: pattern is the best guaranteed surface

If the real priority is React-facing ergonomics in this repo, then a box-pattern `size` prop may be the safest first implementation because it fits the existing `box` / primitives pipeline.

### Hypothesis B: utility is the only path to universal support

If we want true universal Panda support, then a Panda utility (or a correct override/use of `boxSize`) is required. Patterns alone cannot do that.

### Hypothesis C: both surfaces may be justified

If we want both:

- reliable `box(...)` / primitive support
- and universal `css({ size })` support when possible

then implementing both a pattern prop and a utility prop may be the pragmatic answer, as long as they share one semantic contract and one rhythm value source.

## Suggested Output Format

The ideal answer should include:

1. a short problem summary in repo terms
2. a decision on pattern vs utility vs both
3. reasoning tied to this repo’s architecture
4. an implementation plan in phases
5. failure modes / risks
6. a test plan

## One-Sentence Version

Design a `size` prop for this Panda-based repo that reliably works where developers actually need it, especially on React-facing box/primitives surfaces, while also evaluating whether universal Panda support is possible or worth supporting, and explain exactly how to do that without repeating the previous broken utility approach.