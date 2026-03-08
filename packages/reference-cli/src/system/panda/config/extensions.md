# `extendTokens` First

## Why focus here

If we get **`extendTokens`** right, the rest of the extensions API should follow the same shape.

This is the cleanest first pattern because the flow is simple:

1. `tokens(...)` collects raw token fragments from user files.
2. The generated Panda config reads the collected token value expression.
3. `extendTokens(...)` is the only place that knows how to merge those fragments into the final Panda config.

That means the template stops owning merge behavior.

---

## The contract

`tokens(...)` and `extendTokens(...)` should have different jobs:

- **`tokens(...)`** is public fragment API.
  It just records token fragments during fragment evaluation.
- **`extendTokens(...)`** is internal extensions API.
  It receives the collected token fragments, merges them, and applies them to the Panda config collector/runtime store.

So the collector side is about **capturing values**.
The extensions side is about **turning those values into config**.

---

## What `extendTokens` should do

`extendTokens(...)` should live in bundled TypeScript, not inline in Liquid.

Its job is:

1. Accept the collected token fragments.
2. Merge them with `deepMerge`.
3. Write the merged result into one shared Panda config collector on `globalThis`.

Conceptually:

```ts
const PANDA_CONFIG_KEY = '__refPandaConfigCollector'

function getPandaConfig() {
  const existing = globalThis[PANDA_CONFIG_KEY]
  if (existing && typeof existing === 'object') return existing

  const next = {}
  globalThis[PANDA_CONFIG_KEY] = next
  return next
}

export function extendTokens(tokenFragments: Array<Record<string, unknown>>) {
  const mergedTokens = deepMerge({}, ...tokenFragments)
  const pandaConfig = getPandaConfig()

  pandaConfig.theme = deepMerge({}, pandaConfig.theme || {}, {
    tokens: mergedTokens,
  })
}
```

That shared Panda config cannot just be a module-local object.
Because we are bundling this runtime and moving it between internal build output and user `outDir`, it needs a stable portable store that survives "load the bundle, run helpers, export final config."

So the important part is:

- **`extendTokens` owns the merge and apply semantics**
- **the Panda config lives behind a named global collector/runtime key**

---

## What the template should do

The generated Panda config should stay dumb.

It should:

1. Load the bundled extensions API.
2. Run the collector fragments.
3. Read the tokens collector value expression.
4. Call `extendTokens(tokensValueExpression)`.
5. Read the final Panda config from the global collector/runtime store.
6. Export that config.

So instead of this kind of template behavior:

- read token fragments
- call `deepMerge(...)`
- manually spread into `theme`

we want this:

```ts
const tokensFragments = {{ tokensValueExpression | raw }}
extendTokens(tokensFragments)
const config = getPandaConfig()
```

That is the right boundary.

---

## Why this is better

- **Logic lives in code**: `deepMerge` stays in normal TS we can test and bundle.
- **Liquid stays clean**: the template only wires runtime pieces together.
- **One source of truth**: internal build and user `ref sync` can use the same bundled extensions runtime.
- **Portable runtime state**: the Panda config lives in a named global collector instead of a fragile local module object.
- **Easy pattern to repeat**: later `extendKeyframes(...)`, `extendPatterns(...)`, etc. can follow the same contract.

---

## Build + sync shape

For this to work cleanly:

1. During `packages/reference-cli/src/build/styled.ts`, bundle the extensions API into local CLI output at `src/system/styled/extensions`.
2. During `ref sync`, copy that same bundle into `outDir/styled/extensions`.
3. The generated Panda config loads that bundled runtime, calls `extendTokens(...)`, then reads the final config from the global Panda config collector.

So there is one implementation of token-merge behavior, and both environments run the same thing.

---

## Summary

For now, the rule should be:

- `tokens(...)` collects
- `extendTokens(...)` merges and applies
- Panda config state lives in a portable global collector/runtime key
- Liquid routes values into `extendTokens(...)` and reads the final config back out

If that boundary feels good in code, the rest of the extensions API should fall out naturally from the same pattern.
