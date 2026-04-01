# config

Owns loading `ui.config.ts` / `ui.config.js` into a validated `ReferenceUIConfig`.

This module is internal infrastructure for the CLI. Its job is not to provide
the system fragment API or run codegen. Its job is to:

1. Find the user's config file
2. Bundle it so TypeScript and normal imports work
3. Evaluate the bundle
4. Validate the result
5. Expose the normalized config to the rest of core

## The flow

`loadUserConfig()` is the entry point:

1. `resolveRefConfigFile(cwd)` finds `ui.config.ts` or `ui.config.js`
2. `bundleConfig()` bundles that file with esbuild
3. `evaluateConfig()` executes the bundled code and reads `module.exports`
4. `validateConfig()` unwraps `default`, checks required fields, and returns a `ReferenceUIConfig`

In other words, this module turns:

```ts
export default defineConfig({
  name: 'my-system',
  include: ['src/**/*.{ts,tsx}'],
})
```

into a validated runtime object the rest of the pipeline can trust.

## MCP-specific config

The top-level `include` field controls design-system work:

- virtual source mirroring
- Panda scan input
- reference build input

The MCP layer has a separate config surface:

```ts
export default defineConfig({
  name: 'my-system',
  include: ['src/**/*.{ts,tsx}'],
  mcp: {
    include: ['src/**/*.{ts,tsx}', 'tests/mcp-fixtures/**/*.{ts,tsx}'],
    exclude: ['tests/mcp-fixtures/ExcludedFixture.tsx'],
  },
})
```

`mcp.include` and `mcp.exclude` are passed directly to Atlas and do not change
the normal design-system `include` behavior.

## Why config is bundled to CJS

This module intentionally bundles user config to CommonJS before evaluation.

That does **not** mean Reference UI is a CommonJS package. It is just the
lowest-friction way to evaluate bundled config code from a string:

```ts
new Function('module', 'exports', 'require', bundledCode)
```

Using a CJS-shaped bundle lets the loader:

- evaluate config without writing a temp file
- intercept `require('@reference-ui/core')` and related ids
- provide only `{ defineConfig }` for those imports
- fall back to normal Node resolution for everything else
