# Private Tokens

## Research Summary

- `tokens()` currently acts as a plain fragment collector.
- The token collector does not contain any `_private` handling.
- Token merge and color-mode resolution code also do not treat `_private` as special.
- A repo-wide source search found no implemented `_private` token behavior.

## Current Behavior

Today, a shape like this is just ordinary token data:

```ts
tokens({
    colors: {
        _private: {
            secretBrand: { value: '#123456' },
        },
    },
})
```

There is currently no privacy boundary attached to `_private`.

That means any `_private` subtree would be collected, merged, and treated like any other token branch unless a later build step explicitly strips it.

## What This Means

The desired feature is not implemented yet.

If we want private tokens that are available inside the current package but not exposed to downstream systems extending `baseSystem`, the privacy rule must exist at build output boundaries, not just in authoring syntax.

## Likely Implementation Boundary

This probably needs explicit filtering in the places that produce public artifacts, for example:

- portable `baseSystem.fragment` output
- generated public token types
- generated public token maps
- MCP token listing and token inspection surfaces
- any layer-extension path that consumes upstream base systems

## Recommendation

Treat `_private` as a design proposal, not a current convention.

If we adopt it, define one rule clearly:

- `_private` tokens are authorable in local user code
- `_private` tokens resolve normally inside that package during generation
- `_private` tokens are stripped from exported base-system artifacts and downstream extension surfaces

Without that final stripping step, the feature is only naming, not privacy.

## Open Design Questions

- Should `_private` be allowed at every token category level, or only in specific categories like `colors`?
- Should private tokens still be queryable by local tooling such as MCP when running inside the owning package?
- Do recipe and pattern outputs get to reference `_private` tokens after export, or must those references be resolved away during build?
- Should `_private` be erased entirely from public types, or should it remain present but inaccessible?

