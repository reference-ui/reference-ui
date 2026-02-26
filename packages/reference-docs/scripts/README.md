# Documentation Generator Scripts

## generate-primitives-docs.cjs

Automatically generates comprehensive documentation for all HTML primitives from the source code.

### Usage

```bash
npm run generate:primitives
```

Or run directly:

```bash
node scripts/generate-primitives-docs.cjs
```

### What it does

1. **Reads the source of truth**: Parses `packages/reference-core/src/primitives/tags.ts` to get the complete list of HTML tags
2. **Categorizes primitives**: Organizes them into logical groups (structure, headings, text, forms, lists, media, tables, interactive, document, other)
3. **Generates MDX documentation**: Creates `src/docs/components/primitives.mdx` with:
   - Import statements for commonly used primitives
   - Interactive examples for each category
   - Complete list of all available primitives
   - TypeScript usage examples
   - Responsive styling examples

### Output

- **File**: `packages/reference-docs/src/docs/components/primitives.mdx`
- **Primitives**: All 115 HTML elements as styled primitives
- **Examples**: Live, interactive examples showing real usage

### When to run

Run this script whenever:
- New primitives are added to the core library
- You want to ensure the documentation is in sync with the source code
- You update the categorization logic

### Benefits

- **Single source of truth**: Primitives list comes directly from the source code
- **Always in sync**: Generated docs can't get out of date with the implementation
- **Consistent**: Same format and structure every time
- **Fast**: Regenerate complete docs in seconds
