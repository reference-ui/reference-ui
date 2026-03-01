# Design Systems

> Reference UI is not just a component library — it is a design system platform that organisations can build on top of and redistribute.

---

## The Problem

`extendPandaConfig()` is a global side-effect registry. Files in `src/styled/` call it at eval time. The CLI collects those calls and merges them into `panda.config.ts`. That merge is a one-shot build artefact — there is no concept of consuming or re-publishing.

Three things are broken:

- **No chain.** You can extend Reference UI internally, but you cannot publish a config that someone else can extend in turn.
- **Tokens are implicit.** The CLI sweeps `src/styled/` and registers everything. Nothing declares what is public, opt-in, or scoped.
- **`styled/` conflates framework and theme.** The `extend*` API, box pattern, and rhythm system live beside Reference UI's specific colour scales and type scales. A third party cannot take the framework and bring their own theme.

---

## The Pattern

The goal is a composable chain where each node is both a consumer and a publisher:

```
@reference-ui/core   ← publishes baseSystem
        ↓
  @my-org/design     ← imports baseSystem, extends it, publishes its own baseSystem
        ↓
    user app         ← imports @my-org/design's baseSystem, terminal consumer
```

This is what makes Reference UI a platform rather than a library.

The authoring surface is two functions:

**`defineConfig`** — declares what a package composes from. Lives in `ui.config.ts`.

```ts
interface ReferenceConfig {
  /**
   * The identity of this design system.
   * Used as the CSS @layer name, the data-layer selector in emitted CSS,
   * and the identifier consumers pass to the layer prop.
   * Must be unique across the chain.
   */
  name: string

  /**
   * Adopt an upstream system's tokens into your global token space.
   * Tokens land at :root and in your Panda config. You can reference them
   * in your own components. Merged left-to-right, last wins.
   */
  extends?: BaseSystem[]

  /**
   * Include an upstream system's component CSS in an isolated cascade layer.
   * Components render correctly. Tokens do NOT land in your global space.
   * Use when you want components without adopting their token scale.
   */
  layers?: BaseSystem[]
}
```

**`extendSystem`** — creates a themed variant of an existing system. Returns a new `BaseSystem` that can be passed to `extends` or `layers`.

The short rule: `extends` means "I am building with these tokens." `layers` means "I want these components to work, but the tokens stay out."

`ref sync` reads `ui.config.ts`, resolves the full chain, and drives Panda. The chain is declared through imports. Nothing is implicit.

---

## Example: Use the Reference Design System

The simplest case. You want Reference UI's components with their full design language — tokens, spacing, typography, all of it in your global space.

```ts
// ui.config.ts
import { baseSystem } from '@reference-ui/core'
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  extends: [baseSystem],
})
```

`ref sync` resolves the chain and merges Reference UI's tokens into `:root` and your Panda config. You get the full token scale available in your own components alongside the Reference UI component library.

---

## Example: Theme the Reference Design System

You want Reference UI's components and structural design language, but with your brand's colours, radii, and fonts applied. `extendSystem` creates a builder from an existing `BaseSystem` — you override only what you want, everything else inherits the defaults.

```ts
// theme.ts
import { extendSystem, baseSystem } from '@reference-ui/core'

const customBaseSystem = extendSystem(baseSystem)

customBaseSystem.tokens({
 ...
})

customBaseSystem.fonts({
...
})

export { customBaseSystem }
```

```ts
// ui.config.ts
import { customBaseSystem } from './theme'
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  extends: [customBaseSystem],
})
```

`customBaseSystem` is Reference UI's full system with your values merged on top. The token names in `.tokens()` are Reference UI's public theming contract — not Panda config keys, not CSS custom property paths. You do not need to know what `ref.color.text` is. You set `color.text` and it maps correctly.

The surface is intentionally narrow: colours, radii, fonts, keyframes. Adding a new token to the contract is a deliberate API decision, not something that leaks through when an internal token gets renamed.

---

## Example: Own Design System + Reference Components

You have your own design system and want to use Reference UI components alongside it. `layers` lets you include components from another system without adopting its token scale — components render correctly, but nothing lands in your global token space.

```ts
// ui.config.ts
import { baseSystem, extendSystem, defineConfig } from '@reference-ui/core'

const referenceTheme = extendSystem(baseSystem)
referenceTheme.tokens({
  ...
})

export default defineConfig({
  layers: [referenceTheme],
})
```

---

## Example: Publishing a Design System Built on Reference UI

Your org publishes `@your-org/core`. It uses Reference UI components, themed with your brand, but does not adopt Reference UI's token scale.

```ts
// @your-org/core — ui.config.ts
import { baseSystem, extendSystem, defineConfig } from '@reference-ui/core'

const referenceTheme = extendSystem(baseSystem)
referenceTheme.tokens({
  color: { accent: '#e63946' },
  // ...
})

export default defineConfig({
  layers: [referenceTheme],
  // your own tokens registered via extend* in styled/
})
```

`ref sync` runs on `@your-org/core` and emits a `baseSystem`. That artefact carries the `layers` declaration — the Reference UI component CSS is embedded in it.

A consumer of `@your-org/core` just does:

```ts
// consumer — ui.config.ts
import { baseSystem } from '@your-org/core'
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  extends: [baseSystem],
})
```

They get your org's tokens in their global space and Reference UI components rendering correctly — without ever needing to know about or configure `@reference-ui/core` directly. The layer is carried through the chain.

---

## `baseSystem` — The Chain Artefact

`baseSystem` is the compiled, resolved config for a package — everything its `extend*` calls registered, plus any upstream `baseSystem` it composed from. It is a plain ESM module, not Panda config DSL. It captures a package's full config contribution in a portable, importable format.

`ref sync` produces it alongside the rest of the generated system:

```
ref sync
  → createPandaConfig    → panda.config.ts      (existing)
  → panda codegen        → src/system/           (existing)
  → createBaseSystem     → dist/baseSystem.mjs   (new)
  → createLayerCss       → dist/layer.css        (new)
```

**`dist/baseSystem.mjs`** — the chain artefact. Full merged system: tokens, recipes, utilities, patterns. Downstream packages put this in `extends` to adopt the token scale.

**`dist/layer.css`** — pre-compiled component CSS scoped to a named cascade layer. Downstream packages pull this in via `layers`. Self-contained and isolated.

Token contributions are registered separately via the `extend*` API, not inside `defineConfig`. `defineConfig` is strictly for declaring composition. The CLI scans `src/styled/` for `extend*` calls at build time and merges them into the emitted `baseSystem`.

```ts
// src/styled/theme/colors.ts
import { extendTokens } from '@reference-ui/core/api'

extendTokens({
  colors: {
    brand: { primary: { value: '#0052cc' } },
  },
})
```

### Token inclusion is declarative, not flagged

Reference UI's tokens live in its `baseSystem`. They are included when you put that `baseSystem` in `extends`. They are not included when you don't. A downstream publisher who wants a clean slate simply omits it:

```ts
// build on Reference UI's design language
import { baseSystem } from '@reference-ui/core'
export default defineConfig({ extends: [baseSystem] })

// use the framework, bring your own design language
export default defineConfig({})
```

The CLI has no opinion. It resolves whatever `extends` declares.

### `ref.*` token scoping

Reference UI components use `ref.*` prefixed semantic tokens internally. `ref.*` is a reserved namespace — it cannot collide with user token space. Components always resolve correctly regardless of what a publisher does.

```
user token space:       brand.primary, text.default, ...  (user-defined, untouched)
Reference UI internals: ref.color.text, ref.space.sm, ...  (reserved, never collides)
```

---

## Runtime Token Scoping — the `layer` prop

`extends` and `layers` are build-time declarations. They control what lands in the compiled stylesheet. Neither answers the question: _what if you want a token scope at a specific point in the DOM, without touching `:root`?_

The `layer` prop on any primitive closes that gap. Its value is the `name` declared in that system's `ui.config.ts`:

```tsx
<Div layer="my-org">
  <Button /> {/* resolves ref.* tokens from this node, not :root */}
  <Card />
</Div>
```

A `layer` prop renders a `data-layer` attribute on the element. The compiled `layer.css` emitted by `ref sync` — keyed by `name` — scopes all token custom properties to that selector. CSS custom property inheritance does the rest — every descendant resolves the right values without any JS involvement.

Three ways tokens can reach a component, from broadest to narrowest:

| mechanism               | token scope                           | how               |
| ----------------------- | ------------------------------------- | ----------------- |
| `extends: [baseSystem]` | `:root` — global                      | build-time config |
| `layers: [system]`      | component CSS in `@layer`, tokens out | build-time config |
| `layer="name"`          | subtree from that DOM node            | runtime attribute |

**Nesting works correctly.** A deeper `[data-layer]` overrides tokens for its own subtree. Multiple disconnected `[data-layer]` nodes are independent. There is no coordination required between them.

**No new concepts for consumers.** The prop is just a string that matches a name in the `layer.css` file. If you import `layer.css` from a package and use that package's name as the prop value, everything resolves. The connection is a naming convention, not a wiring step.

This completes the chain: `extends` for full adoption, `layers` for isolated CSS, `layer` prop for scoped DOM subtrees.

---

## Open Questions

**Config serialisation.** Not a problem. `baseSystem` is generated by `ref sync` as live ESM — the same pipeline already used for `panda.config.ts`. Functions in recipes and utility transforms are bundled as executable code, not serialised as data.

**`extends` vs Panda presets.** Panda has its own `presets` key. Reference UI's `extends` should deep-merge on top of the base Panda config (last wins), not map to Panda presets. This matches the existing `createPandaConfig` behaviour and is simpler to reason about.

**Naming collision.** `baseSystem` names the chain artefact (the compiled ESM export). `extendSystem(baseSystem)` takes that artefact as its starting point and returns a new `BaseSystem`. These are the same type — `extendSystem` is a builder that produces a `BaseSystem`. The collision is in prose, not in types. Worth a clear callout in the API docs.

**`ref.*` token resolution when a publisher opts out of `baseSystem`.** `layer.css` emits `ref.*` tokens at `:root`. The `ref.*` prefix is a reserved namespace — it cannot collide with user token space by convention. Components always resolve correctly regardless of what the publisher does. No consumer-side configuration required.

---
