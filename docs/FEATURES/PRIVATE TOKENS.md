# Private Tokens

## Status

Implemented.

Token subtrees authored under a `_private` key resolve normally inside the
package that defines them, are stripped from any downstream consumer that
pulls the package in via `extends`, and are stripped from the MCP token
surface only when they reach it through an upstream system fragment. The
package that owns the tokens still sees them in its own MCP server.

```ts
tokens({
    colors: {
        brand: { value: '#0066cc' },
        _private: {
            secretBrand: { value: '#123456' },
        },
    },
})
```

## Behavior

- **Local resolution.** Inside the owning package, `_private` tokens are
  collected like any other token branch. Recipes, patterns, and `css()` calls
  in that package can reference them (e.g. `color: '_private.secretBrand'`)
  and Panda generates CSS rules and custom properties for them.
- **Downstream invisibility.** When another package pulls a base system in
  via `extends: [...]`, the upstream fragment is executed inside the
  downstream Panda config. Token fragments tagged as upstream have their
  `_private` subtrees stripped before they are merged, so the downstream
  config never knows the private tokens existed. Downstream user code cannot
  author against them and Panda will not generate CSS rules for downstream
  references to private token paths.
- **MCP visibility, scoped to ownership.** The MCP `get_tokens` tool
  flattens token fragments into the model artifact via `flattenTokenNode`.
  `_private` subtrees are skipped only for fragments tagged as upstream
  system fragments; fragments authored by the package itself keep their
  `_private` paths. The MCP surface therefore mirrors the language-level
  scope: a package sees its own private tokens, downstream packages do not
  see the upstream's private tokens.
- **Type surface.** Because Panda only sees public tokens in the downstream
  config, generated `Tokens["colors"]` (and similar) unions exclude
  `_private` paths. Downstream TypeScript will reject references to private
  token names at the type level.

## Boundaries

- The privacy boundary lives at the **panda config merge** step (for
  downstream consumers) and at the **MCP token projection** step (for
  upstream-tagged fragments reaching the MCP server). It is enforced
  regardless of token category — `_private` is a recognized authoring
  keyword anywhere in the token tree.
- The literal source of an extending package's exported `baseSystem.fragment`
  still contains the original `_private` subtree as JS source text. The
  privacy boundary is enforced when that fragment is executed inside another
  panda config; it is not a redaction of secrets from distributed source.
  Treat private tokens as a coupling/visibility boundary, not as a secret
  store.

## Implementation Notes

- Upstream-vs-local detection is driven by the existing
  `__refConfigFragmentSource` marker that the fragment runtime attaches to
  each pushed fragment. Fragments tagged `'upstream system fragment'` are
  routed through a `_private` strip before normalization.
- Local fragments preserve `_private` keys so the owning package can resolve
  them through the normal Panda token flow.
- Coverage:
  - `packages/reference-core/src/system/panda/config/extensions/api/resolveColorModeTokens.test.ts`
    asserts that local `_private` is preserved and upstream `_private` is
    stripped (including nested categories).
  - `packages/reference-core/src/mcp/pipeline/tokens.test.ts` asserts that
    `_private` is dropped from the MCP projection for upstream fragments
    and preserved for local fragments.
  - `matrix/mcp/tests/unit/get-tokens.test.ts` asserts the same against a
    real MCP server: the matrix consumer extends `@fixtures/extend-library`
    and never sees its `_private` subtree, while its own local `_private`
    token remains MCP-visible.
  - `matrix/chain/T1` adds runtime assertions that:
    1. The base library's component renders its private swatch with the
       private color (the rule + `--colors-_private-brand` variable both
       ship from the upstream library's portable CSS).
    2. The downstream consumer's own attempt to author against
       `_private.brand` does not receive a generated style — Panda has
       no rule for the unknown token reference.

