# Reference Core

This package ships as **source code** that gets built on the user's environment.

## Structure

```
reference-core/
├── src/                 # Source code (components, tokens, etc.)
│   ├── components/      # Web component definitions
│   ├── tokens.ts        # Design tokens
│   ├── panda-config.ts  # Panda CSS configuration
│   └── index.ts         # Main export
├── cli/                 # Build system
│   ├── src/
│   │   ├── commands/    # CLI commands
│   │   ├── compiler/    # Design system compiler
│   │   └── lib/         # Utilities (materialize, resolve-core, etc.)
│   ├── package.json     # CLI dependencies
│   └── tsdown.config.ts # CLI bundler config
├── styled-system/       # Generated Panda CSS output
├── panda.config.ts      # Panda config for development
└── package.json         # Main package config
```

## How It Works

1. **User installs `@reference-ui/core`**

   ```bash
   npm install @reference-ui/core
   ```

2. **Postinstall runs the build**
   - The `postinstall` script builds the CLI
   - User doesn't need to do anything manually

3. **User runs `ref-sync` to materialize the system**

   ```bash
   npx ref-sync
   ```

   This:
   - Reads source from `@reference-ui/core`
   - Compiles into in-memory `BuildResult`
   - Materializes to `.reference/system/`
   - Bundles with tsdown
   - Copies to `node_modules/@reference-ui/`

4. **System is available at these namespaces**
   - `@reference-ui/system` - Full system
   - `@reference-ui/web` - Web components
   - `@reference-ui/react` - React bindings (from Lit)

## Development

### Build core's Panda system

```bash
npm run gen
```

### Watch core development

```bash
npm run dev:core
```

### Watch CLI development

```bash
cd cli
npm run dev
```

## Output Locations

When `ref-sync` runs:

- **Source materialized**: `packageRoot/.reference/system/`
- **Bundled output**: `packageRoot/.reference/dist/`
- **Available via imports**: `node_modules/@reference-ui/{system,web,react}`

## No Build Step Required

Users can import directly without a build step - imports resolve to the bundled output in `node_modules`.

None directly — all outputs are produced via the compiler

Key invariants

No knowledge of consumers

No filesystem logic

No runtime configuration

No conditional behaviour based on environment

What it is not

❌ A library users import

❌ A configurable framework

❌ A runtime package

❌ A CLI tool

Mental model

The Reference System defines what a design system is.
It does not care who uses it or how.

How the pieces fit together
reference-system
↓
reference-compiler
↓
@reference-ui/cli
↓
node_modules/@reference/\* (generated output)

System defines meaning

Compiler produces artifacts

CLI controls execution and placement

Generated output is disposable build product

Guiding principle (shared across all modules)

Semantics are compile-time.
Values are inputs.
Files are outputs.
Everything is reproducible.

That’s the contract.
