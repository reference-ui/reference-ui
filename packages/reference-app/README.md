# @reference-ui/reference-app

Reference application demonstrating the new CLI workflow.

## Usage

Simply run:

```bash
pnpm dev
```

This will:
1. Run `reference sync` to generate design system artifacts
2. Start the Vite dev server

## How it works

- Imports `@reference-ui/cli` as a dev dependency
- Uses the `ref` CLI command to sync design system
- No manual Panda CSS configuration needed - handled by the CLI
