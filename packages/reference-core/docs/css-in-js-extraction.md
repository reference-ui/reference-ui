# CSS-in-JS Extraction: Panda vs WyW-in-JS

This note compares how **Panda CSS** and **WyW-in-JS** turn user-authored styles into data they can process later.

The comparison focuses on:

- API shape
- extraction pipeline
- intermediate representation (IR)
- evaluation behavior
- what happens with conditionals like ternaries

This is based on source in:

- `research/panda-main/packages/extractor/src`
- `research/wyw-in-js-main/packages/transform/src`

---

## High-level difference

- **Panda** is **AST-first**. It walks a TypeScript AST, turns style-bearing expressions into a style-specific IR, and partially evaluates expressions when safe.
- **WyW-in-JS** is **transform-and-evaluate-first**. It parses with Babel, rewrites style dependencies into hoisted/evaluable expressions, then executes the transformed module graph in a sandbox and collects the result.

The shortest version:

- **Panda**: "understand the style expression"
- **WyW**: "make the style expression runnable"

---

## API shape

The two libraries expose style APIs with very different extraction targets.

### Panda CSS

Panda supports style-bearing syntax like:

```tsx
import { css } from 'styled-system/css'
import { Box } from 'styled-system/jsx'

const className = css({
  bg: 'red.500',
  px: '4',
})

export function Demo({ isDark }: { isDark: boolean }) {
  return (
    <Box
      bg={isDark ? 'red.500' : 'blue.500'}
      px="4"
      className={className}
    />
  )
}
```

Important shape details:

- JSX utility props are first-class extraction targets
- `css({ ... })` object syntax is first-class
- `cva(...)`, recipes, patterns, and some template-literal paths are also part of the extractor surface

### WyW-in-JS

WyW is much more centered on style factories and tagged templates:

```tsx
import { css } from '@linaria/core'
import { styled } from '@linaria/react'

const buttonClass = css`
  color: ${true ? 'red' : 'blue'};
`

const Button = styled.button`
  background: ${props => props.primary ? 'red' : 'blue'};
`
```

Important shape details:

- tagged-template interpolation is the main extraction target
- expressions inside templates are treated as dependencies to evaluate
- the core flow is less about "scan arbitrary JSX utility props" and more about "prepare template dependencies for build-time evaluation"

In practice this means Panda naturally fits `<Div bg="red.500" />`, while WyW naturally fits ``css`color: ${expr}``` and `styled.button\`...\``.

---

## Panda extraction pipeline

Panda's core extractor behavior lives in `maybe-box-node.ts`, `box-factory.ts`, and `unbox.ts`.

### Step 1: parse style-bearing syntax into BoxNodes

Panda normalizes expressions into a style-specific IR called `BoxNode`.

The important node kinds are:

- `literal`
- `map`
- `array`
- `conditional`
- `unresolvable`
- `empty-initializer`

That gives Panda a vocabulary for style values before any CSS emission happens.

### Step 2: resolve common JS/TS expression forms structurally

Panda directly handles:

- string / number / boolean / null literals
- object literals
- array literals
- identifiers
- property access
- element access
- template expressions
- conditionals
- logical expressions
- some call expressions

Example:

```tsx
const colors = { primary: 'red.500', secondary: 'blue.500' }

css({
  bg: colors.primary,
  px: '4',
})
```

Panda can resolve `colors.primary` structurally without running the whole module:

1. `bg` points at an identifier
2. the identifier resolves to a variable declaration
3. the initializer is an object literal
4. property access resolves to the `primary` literal
5. Panda stores the result as a `literal` BoxNode

### Step 3: partially evaluate expressions when useful

For some expressions, Panda calls `ts-evaluator` through `safeEvaluateNode(...)`.

That helps with cases like:

```tsx
css({
  px: 2 + 2,
  bg: token('colors.red.500'),
})
```

Panda does **not** treat evaluation as the whole strategy. It uses evaluation as a helper when the expression is safe and foldable.

### Step 4: preserve uncertainty in the IR

This is the key design choice.

If Panda cannot fully resolve a conditional, it creates a `conditional` node instead of failing or forcing execution.

Example:

```tsx
css({
  bg: isDark ? 'red.500' : 'blue.500',
})
```

Panda behavior:

- if `isDark` is statically known: keep the chosen branch
- if `isDark` is not statically known: build a `conditional` BoxNode containing both branches

### Step 5: unbox into extraction output

Later, Panda turns BoxNodes into three buckets:

- `raw`
- `conditions`
- `spreadConditions`

So the previous example roughly becomes:

```ts
{
  raw: {},
  conditions: [
    { bg: 'red.500' },
    { bg: 'blue.500' }
  ],
  spreadConditions: []
}
```

This is how Panda keeps both possible style outcomes available for later CSS processing without needing to execute the whole component file.

---

## Panda code examples

### JSX utility prop

```tsx
<Div bg="red.500" px="4" />
```

Extraction model:

1. match JSX tag / prop
2. read each prop initializer
3. convert `bg="red.500"` to a `literal`
4. convert `px="4"` to a `literal`
5. build a map-like BoxNode for the component instance

### `css()` with ternary

```tsx
css({
  bg: isDark ? 'red.500' : 'blue.500',
})
```

Extraction model:

1. match `css(...)`
2. walk object literal
3. see `ConditionalExpression`
4. try to resolve/evaluate condition
5. if unresolved, store both branches in a `conditional` node
6. unbox later into `conditions`

### `css()` with conditional spread

```tsx
css({
  ...(isDark && { bg: 'red.500' }),
  px: '4',
})
```

Extraction model:

1. match object spread
2. recognize logical conditional form
3. if unresolved, preserve conditional object fragment separately
4. later expose it through `spreadConditions`

---

## WyW-in-JS extraction pipeline

WyW's extraction flow is centered on the transform pipeline in `transform.ts`, template dependency collection in `collectTemplateDependencies.ts`, and module execution in `module.ts`.

### Step 1: parse with Babel

WyW parses source into a Babel AST.

### Step 2: find style dependencies inside templates/processors

For template-based APIs, WyW inspects the interpolation sites.

Example:

```tsx
const cls = css`
  color: ${isDark ? 'red' : 'blue'};
`
```

WyW treats `${isDark ? 'red' : 'blue'}`` as a dependency to analyze.

### Step 3: try local static evaluation

WyW first uses Babel's `path.evaluate()` for a cheap confident fold.

If the expression is confidently known, it can inline the value directly.

### Step 4: hoist unresolved dependencies into lazy expressions

If the expression is not confidently evaluable, WyW hoists it into a root-scoped lazy expression.

Conceptually it turns this:

```tsx
css`
  color: ${isDark ? 'red' : 'blue'};
`
```

into something closer to:

```ts
const _exp1 = () => isDark ? 'red' : 'blue'

css`
  color: ${_exp1()};
`
```

That is not the exact emitted code, but it is the right mental model.

So WyW's "IR" is less a separate style object graph and more:

- Babel AST
- hoisted dependency functions/values
- metadata about constant vs lazy expressions

### Step 5: tree-shake and evaluate the transformed module graph

This is the biggest difference from Panda.

WyW then evaluates transformed code in a sandboxed module system built on `vm`.

That means unresolved expressions are usually meant to resolve by executing build-time code, not by being preserved as structural style alternatives.

### Step 6: collect artifacts

After evaluation, WyW collects the resulting style artifacts from the executed program.

So for WyW, the path is:

1. parse
2. identify dependencies
3. hoist / rewrite
4. execute
5. collect

not:

1. parse
2. convert to style IR
3. preserve uncertainty
4. emit from IR

---

## WyW code examples

### Template interpolation with static ternary

```tsx
const cls = css`
  color: ${true ? 'red' : 'blue'};
`
```

Extraction model:

1. inspect interpolation
2. Babel `evaluate()` is confident
3. inline `'red'`
4. continue with the transformed template

### Template interpolation with unresolved ternary

```tsx
const cls = css`
  color: ${isDark ? 'red' : 'blue'};
`
```

Extraction model:

1. inspect interpolation
2. Babel `evaluate()` is not confident
3. hoist the expression into a lazy root-scoped dependency
4. run transformed code in the sandbox
5. resolve the value during evaluation
6. collect the resulting style artifact

Important difference from Panda:

- Panda preserves both style outcomes structurally
- WyW prefers to execute and obtain a single build-time value path

### Styled factory interpolation

```tsx
const Button = styled.button`
  background: ${props => props.primary ? 'red' : 'blue'};
`
```

Extraction model:

1. identify interpolation as a dependency
2. mark it as function/lazy expression data
3. keep it available for later evaluation/processing

This is much closer to "dependency preparation for execution" than Panda's "style object graph reconstruction."

---

## Ternaries, conditionals, and uncertainty

This is the clearest behavioral difference.

### Panda

Panda treats conditionals as style-IR problems.

```tsx
css({
  bg: cond ? 'red.500' : 'blue.500',
})
```

If `cond` is unknown, Panda preserves **both** branches in a `conditional` node and later exposes both possibilities in extracted output.

### WyW-in-JS

WyW treats conditionals as evaluation problems.

```tsx
css`
  color: ${cond ? 'red' : 'blue'};
`
```

If `cond` is unknown to local Babel evaluation, WyW hoists the expression and tries to resolve it later by executing transformed code in the sandbox.

So the practical distinction is:

- **Panda**: preserve multiple possible style values
- **WyW**: prepare code so one build-time value can be computed later

---

## What each system is best described as

### Panda

Panda is best thought of as:

- AST walker
- partial evaluator
- style-specific IR builder

Its extractor answers:

> "What style values could this expression represent?"

### WyW-in-JS

WyW is best thought of as:

- Babel transform pipeline
- dependency hoister
- sandboxed build-time evaluator

Its extractor answers:

> "How do I rewrite this code so build-time execution can produce the style value?"

---

## Practical summary

If you care about `<Div bg="red.500" />`, `css({ ... })`, and preserving unresolved branches as structured style data, Panda's extraction model is much closer to that problem.

If you care about tagged-template interpolation and are comfortable with a transform pipeline that rewrites and evaluates code to materialize values, WyW-in-JS is much closer to that model.

The shortest comparison:

- **Panda**: JSX props / object styles -> `BoxNode` IR -> `raw + conditions + spreadConditions`
- **WyW**: template dependencies -> hoisted lazy expressions -> sandbox evaluation -> collected artifacts

---

## Reference UI CSS-in-JS extractor

If Reference UI does this differently from both Panda and WyW-in-JS, the cleanest way to describe it is:

- **not** a general evaluator
- **not** a bundler-shaped transform pipeline
- **not** a rich style IR first
- but a **prop-level value-domain extractor**

The core question becomes:

> For this prop, what strings and numbers could this expression theoretically produce?

That is a smaller and more data-driven problem than either:

- Panda's richer `BoxNode`-style IR
- WyW's hoist-and-execute model

### Core idea

The extractor should work at the prop boundary.

Examples:

```tsx
<Div bg="red.500" />
<Div px={dense ? 2 : 4} />
<Div bg={isDark ? palette.dark : palette.light} />
<Div css={{ bg: tokenName, px: spacing }} />
```

For each style-bearing prop, the extractor asks:

- what string leaves can reach this prop?
- what number leaves can reach this prop?
- is the set bounded and knowable?

If yes, collect them.
If not, mark the prop as unknown or partially known.

### Why this is a third approach

This differs from Panda because the main abstraction is not:

- "build a style IR that preserves all structured uncertainty"

It differs from WyW because the main abstraction is not:

- "rewrite the code so it can be executed later"

Instead, the abstraction is:

- "derive a bounded value domain for each style prop"

That means the extractor can stay focused on the actual product need:

- gather all possible style leaves
- map them to atomic CSS candidates
- generate types from the same discovered domain

### Primary data model

For styling, the meaningful leaf values are mostly:

- `string`
- `number`

Everything else is there to help reach those leaves.

So the extractor can use a deliberately small domain model:

- `StringSet`
- `NumberSet`
- `Unknown`
- maybe `Mixed` or `PartiallyKnown`

And structurally it only needs to understand:

- object literals
- arrays
- identifiers
- property access
- element access
- ternaries
- logical operators
- simple function returns

This is much narrower than "understand JavaScript."

### Return-path extraction

The especially useful idea here is return-path analysis.

The extractor does not need to care about every variable in a function body.
It only needs to care about the values that can actually flow into the returned prop.

Example:

```tsx
function getBg(isDark: boolean) {
  const unused = computeSomethingHuge()
  const light = 'blue.500'
  const dark = 'red.500'
  const border = 12

  return isDark ? dark : light
}

<Div bg={getBg(theme.dark)} />
```

A general evaluator might get distracted by the whole function body.
A value-domain extractor should instead follow the return path and conclude:

- `bg` can be `'red.500'`
- `bg` can be `'blue.500'`

and ignore everything else.

That is the right kind of "clever."

### Ternaries become unions

Under this model, ternaries are simple.

```tsx
<Div bg={isDark ? 'red.500' : 'blue.500'} />
```

becomes:

- `bg.strings = { 'red.500', 'blue.500' }`

Likewise:

```tsx
<Div px={dense ? 2 : 4} />
```

becomes:

- `px.numbers = { 2, 4 }`

So rather than treating ternaries as a runtime problem, they become a domain-union problem:

- `domain(cond ? a : b) = union(domain(a), domain(b))`

That is a much simpler mental model.

### Example: `css()` object extraction

```tsx
const bg = isDark ? 'red.500' : 'blue.500'
const px = dense ? 2 : 4

css({
  bg,
  px,
})
```

Desired extraction result:

```ts
{
  bg: {
    strings: ['red.500', 'blue.500'],
    numbers: [],
  },
  px: {
    strings: [],
    numbers: [2, 4],
  },
}
```

That is enough to:

- generate atomic CSS candidates
- precompute type unions
- avoid evaluating the whole module

### Example: function return extraction

```tsx
function getPadding(size: 'sm' | 'md') {
  const a = 2
  const b = 4
  const c = 999

  return size === 'sm' ? a : b
}

<Div px={getPadding(input)} />
```

Desired extraction result:

- `px.numbers = { 2, 4 }`

The important thing is that the extractor does **not** need to care that `c` exists.
It only cares about the values that can flow into the returned expression that feeds the prop.

### What this buys us

This model gives Reference UI a few nice properties:

- more data-driven than both Panda and WyW
- simpler than a general evaluator
- easier to implement in Rust
- naturally aligned with atomic CSS generation
- naturally aligned with type generation

It also gives a much better product boundary:

- the extractor is in the business of collecting style value domains
- not in the business of bundling, executing, or simulating arbitrary user programs

### Suggested extractor contract

The Reference UI extractor should probably answer this shape:

```ts
type PropValueDomain = {
  strings: string[]
  numbers: number[]
  unknown: boolean
}
```

or, more explicitly:

```ts
type PropValueDomain =
  | { kind: 'known'; strings: string[]; numbers: number[] }
  | { kind: 'partial'; strings: string[]; numbers: number[] }
  | { kind: 'unknown' }
```

That gives downstream systems a clean contract:

- atomic CSS emitter can generate candidates from the discovered leaves
- type emitter can turn the same sets into unions
- runtime can stay simple because extraction already established the possible domain

### Practical summary

If Panda asks:

> "What structured style information can I preserve from this expression?"

and WyW asks:

> "How do I rewrite this expression so build-time execution can resolve it?"

then the Reference UI version would ask:

> "What strings and numbers can this prop possibly be?"

That feels like a genuinely different third approach, and for a data-driven atomic styling system it may be the best one.

---

## Futureproofing today

It is not unreasonable to think that Reference UI may eventually roll its own styling extractor or compiler for more control.

That does **not** mean the user-facing shape needs to change.

In fact, the most important thing may be the opposite:

- the backend may change one day
- the public TypeScript surface should not

That is the real futureproofing goal.

### What futureproofing means here

Futureproofing today means fully controlling the TypeScript surface of anything the user interacts with.

That includes:

- `css()`
- `cva()` or any recipe-facing helpers
- primitive style props
- `SystemStyleObject`
- token-facing helper types
- any exported utility or style config type that users write against directly

If those surfaces are stable and owned by Reference UI, then the implementation underneath can change much more freely.

That means:

- Panda can be the implementation today
- a Reference UI extractor/compiler can exist tomorrow
- users do not need to care, as long as the authored API still works

### The practical implication

The practical implication is that we do **not** need to replace Panda first in order to gain control.

We can gain control now by tightening the public surface.

The key move is:

- stop leaking backend-shaped types directly into userland
- expose Reference UI-owned types instead
- treat the styling engine as an implementation detail

This is especially important around `SystemStyleObject`.

If `SystemStyleObject` is effectively a backend-defined shape, then users are still coupled to the current implementation.

If `SystemStyleObject` becomes a clearly owned Reference UI contract, then the backend can be swapped later as long as it continues to satisfy that contract.

### Why this matters more than rewriting Panda right now

Rewriting Panda or building a new extractor would be a large technical project.

Tightening the public TypeScript surface is smaller, more incremental, and immediately useful.

It creates value even if:

- Panda stays for a long time
- a new extractor is never built
- multiple backend experiments happen internally

That is because the product guarantee improves today:

- users code against Reference UI
- not against the accidental shape of the current backend

### Stability is the actual product

Most users do not care whether the implementation is Panda, a Rust extractor, or something else entirely.

They care about:

- dependability
- stable types
- predictable behavior
- documentation that stays true over time

So the design principle should be:

- give users a stable authored surface
- keep implementation freedom behind that boundary

If that is done well, then swapping styling systems later becomes a migration of internals, not a product-level rewrite.

### What we can do now

Without rebuilding Panda, Reference UI can start futureproofing by:

- tightening the exported `SystemStyleObject` shape
- tightening helper function signatures around `css()` and related APIs
- making sure user-facing style types are Reference UI-owned, not backend-owned
- reducing places where Panda-specific assumptions leak into public typings
- treating generated style internals as implementation details, not authoring contracts

This is the kind of work that compounds.

It does not require a new compiler today, but it makes a future compiler switch much more realistic.

### Practical summary

The near-term move is not:

- "replace Panda immediately"

It is:

- "own the TypeScript surface now so the backend can change later"

That is probably the highest-leverage version of futureproofing available today.
