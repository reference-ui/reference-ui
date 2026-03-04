# Handlebars for Codegen Templates *(planned)*

**Status: planned.** We intend to migrate from the line-builder pattern to [Handlebars](https://handlebarsjs.com) for generating entry files and config artefacts in the system pipeline (e.g. panda-entry, baseSystem collect, boxPattern collect, fontFace collect). Templates give clearer structure than the current array-of-strings approach.

## Why Handlebars

- **Readability** — The output shape is visible in the template. No array-of-strings mental overhead.
- **Separation** — Template (structure) vs data (content). Logic stays in TypeScript; templates stay declarative.
- **Loops and conditionals** — `{{#each}}` and `{{#if}}` instead of `.map().join()` and ternary chains.

## Conventions

### Strict mode

Always compile with `strict: true`:

```ts
Handlebars.compile(templateStr, { strict: true })
```

Strict mode throws when a template references a variable not present in the data. Typos like `{{configImport}}` instead of `{{configImports}}` fail at render time instead of silently producing empty output.

### Typed data

Type the data object passed to the template. TypeScript ensures we pass the right shape; strict mode ensures the template uses only what we pass.

```ts
interface PandaEntryData {
  initCollectorRel: string
  extendPandaRel: string
  configImports: string[]
  defaultFragmentsList: string
  upstream: string // JSON.stringify'd; use {{json}} helper or pre-stringify
}
```

### Template location

Templates will live as `.hbs` files next to the code that uses them (e.g. `system/config/panda/panda-entry.hbs`). Load at runtime with `readFileSync` — the CLI runs in Node, so no bundling needed. Ensure `.hbs` files are copied to `dist/` during build (tsup onSuccess or similar).

### JSON output

For object/array values that must appear as literal JSON in the generated code, either:

- Pre-stringify in TS: `upstream: JSON.stringify(upstream)` and use `{{{upstream}}}` (triple braces = no escape), or
- Register a `json` helper: `Handlebars.registerHelper('json', (val) => JSON.stringify(val))` and use `{{json upstream}}`.

## Trade-off

We gain clarity. We lose compile-time checking of template variable names — a typo in the `.hbs` file isn’t caught until render. Strict mode mitigates this by failing fast with a clear error when the variable is missing from the data.

## Implementation checklist

When implementing:

1. Add `handlebars` dependency.
2. Create `lib/template.ts` — load/compile with strict, register `json` helper, cache compiled templates.
3. Add tsup onSuccess step to copy `.hbs` from `src/cli/system/config/**/*.hbs` → `dist/cli/system/config/**/`.
4. Migrate templates (in order of simplicity): fontFace collect → boxPattern collect → panda entry → baseSystem collect. Consider generateFontSystem/generateBoxPattern separately (more dynamic; may keep line builder).
