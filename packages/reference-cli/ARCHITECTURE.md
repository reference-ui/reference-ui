# reference-cli Architecture

This document explains the dual-system import aliasing problem and how to solve it.

---

## The Real Problem: Two Styled Systems

`reference-cli` (which is actually the core package) ships with:

- **Primitives** (components, typography recipes, etc.)
- **Styled API** (tokens, recipes, fonts, etc.)
- **Config generation** that produces a styled-system (Panda config)

The fundamental issue: **We need TWO styled systems:**

1. **Internal system** - For building the CLI itself and its primitives
2. **User system** - What users generate when they run `ref sync`

### The Import Aliasing Problem

Primitives import from `@reference-ui/styled`:

```typescript
// primitives/types.ts
import type { HTMLStyledProps } from '@reference-ui/styled/types/jsx'

// styled/api/runtime/recipe.ts
import { cva, cx } from '@reference-ui/styled/css'
```

**During CLI build:**

- These imports need to resolve to an **internal styled package** (generated for CLI development)

**When packaged for users:**

- These same imports need to resolve to the **user's generated styled package**

Same code, different import destinations depending on context.

### Why This Matters

The CLI is "interlocked":

- Styled API generates config fragments
- Config fragments generate the styled-system (via Panda)
- Primitives depend on that styled-system

But we can't ship primitives that import from the CLI's internal styled package - users won't have that path. The primitives need to import from where the user's styled package will be generated.

---

## Current Approach: Fragments Without Full Solution

### What Works

The **fragments system** solves part of the problem:

- Config-time APIs (`tokens()`, `recipe()`, etc.) contribute to Panda config without importing from generated system
- Fragments are bundled as IIFEs and injected into `panda.config.ts`
- This allows Panda to run without needing the system to exist first

### What Doesn't Work

**Primitives still have styled imports:**

- `primitives/types.ts` imports from `@reference-ui/styled/types/jsx`
- `styled/api/runtime/recipe.ts` imports from `@reference-ui/styled/css`

These imports need aliasing:

1. Point to different packages in dev vs production
2. Need to resolve during CLI build (internal styled package)
3. Need to resolve after packaging (user styled package)

### The Missing Piece

**Import aliasing at build/bundle time.** We need:

1. An internal system generated via fragments for CLI development
2. A bundler configuration that rewrites imports when packaging for users
3. Primitives that remain unchanged but resolve to different systems depending on context

---

## The Solution: Fragments Configure Systems, Bundler Aliases Imports

**Fragments configure the styled system. Primitives use the styled system. Bundler rewrites imports.**

### Architecture Overview

```
Fragments → Configure → Panda → Generates → @reference-ui/styled → Used by → Primitives
```

1. **Fragments** define configuration (tokens, recipes, utilities)
2. **Panda** takes fragments and generates the styled package
3. **`@reference-ui/styled`** is an internal package that bundles up Panda CSS
4. **Primitives** are compiled code that imports from `@reference-ui/styled`
5. **Bundler** rewrites imports depending on context

### Two Systems, Same Fragments

**Internal Styled Package (CLI Development):**

```
Internal fragments
  → Generate panda.config.ts
  → Run Panda
  → Output to internal @reference-ui/styled package
  → Primitives import from @reference-ui/styled (aliased internally)
```

**User Styled Package (Consumer):**

```
Internal fragments + User fragments
  → Generate panda.config.ts
  → Run Panda
  → Output to user's @reference-ui/styled package
  → Packaged primitives import from @reference-ui/styled (aliased to user's)
```

### How Import Aliasing Works

**In CLI source code:**

```typescript
// primitives/types.ts
import type { HTMLStyledProps } from '@reference-ui/styled/types/jsx'

// During development, tsconfig.json paths:
"paths": {
  "@reference-ui/styled": ["./src/system/styled/styled"]
  "@reference-ui/styled/*": ["./src/system/styled/styled/*"]
}
// Resolves to internal styled package
```

**When bundling for users:**

```typescript
// Bundler (tsup/esbuild) config:
alias: {
  '@reference-ui/styled': '.reference-ui/styled'
}

// Output in dist/primitives.js:
import type { HTMLStyledProps } from '@reference-ui/styled/types/jsx'
// User's bundler resolves to their generated .reference-ui/styled package
```

Same source code, different resolved paths via bundler configuration.

### The Fragment System's Role

Fragments are ONLY for configuring Panda. They:

- Define tokens, recipes, patterns
- Contribute to panda.config.ts
- Are serialized as IIFEs (no @reference-ui/styled imports)
- Generate the styled package that primitives will use

Fragments are NOT for primitives. Primitives are regular TypeScript that:

- Import from @reference-ui/styled (after it's generated)
- Get compiled/bundled normally
- Have their imports rewritten by the bundler

---

## Implementation Plan

### Phase 1: Build Internal Styled Package

**`src/system/styled/build.ts` - Internal build entry point:**

This script builds the internal styled package that the CLI uses during development:

```typescript
// src/system/styled/build.ts
import { collectFragments } from './internal/collectFragments'
import { generatePandaConfig } from '../system/config/panda'
import { runPanda } from '../system/panda'

export async function buildInternalStyled() {
  // 1. Collect fragments from actual codebase
  const fragments = await collectFragments({
    scanDirs: ['./src/system/styled', './src/primitives'],
    // Collect internal fragment definitions
  })

  // 2. Generate panda.config.ts using internal fragments
  const pandaConfig = await generatePandaConfig({
    fragments,
    outputDir: './src/system/styled',
    context: 'internal', // Special flag for internal builds
  })

  // 3. Run Panda to generate styled package
  await runPanda({
    config: pandaConfig,
    outdir: './src/system/styled',
  })

  // 4. Create internalSystem that CLI can inject during ref sync
  // This allows CLI to understand the structure for user builds
  return {
    fragments,
    config: pandaConfig,
    outputPath: './src/system/styled',
  }
}
```

**Key considerations:**

- **Not using fragments internally**: When building for internal use, we don't wrap everything as fragments. We use the same pipeline functions from `system/` but adapted for internal context.
- **Dual-context system module**: The system module needs to handle both:
  - Internal context: Building styled package for CLI development
  - External context: Building styled package for user via ref sync
- **internalSystem**: Metadata about the internal build that helps CLI understand how to build user systems

### Phase 2: System Module Dual Context

Update system module to work in both contexts:

```typescript
// src/system/config/panda/generateConfig.ts
export async function generatePandaConfig(options: {
  fragments: Fragment[]
  outputDir: string
  context: 'internal' | 'external'
}) {
  if (options.context === 'internal') {
    // Internal build: Use fragments directly, no serialization
    return createConfigFromFragments(options.fragments)
  } else {
    // External build: Serialize fragments, inject into user config
    return createConfigWithFragmentInjection(options.fragments)
  }
}
```

This allows the same pipeline to handle both internal CLI builds and user builds during `ref sync`.

### Phase 3: Bundle with Import Aliasing via tsup

Configure bundler to rewrite styled imports:

```typescript
// tsup.config.ts
export default defineConfig({
  entry: ['src/primitives/index.ts', 'src/system/styled/api/index.ts', 'src/fragments/index.ts'],
  esbuildOptions(options) {
    options.alias = {
      // Rewrite internal styled imports to user styled package
      '@reference-ui/styled': '.reference-ui/styled',
    }
  },
})
```

During build:

- TypeScript resolves `@reference-ui/styled` to `./src/system/styled/styled/` (via tsconfig paths)
- tsup bundles and rewrites to `.reference-ui/styled/`
- Output primitives import from user's styled package location

### Phase 4: Separate Styled Packager

**`src/packager/styled/` - Package the styled system:**

Styled gets its own packager because it's a separate concern:

```typescript
// src/packager/styled/index.ts
export async function packageStyled(options: {
  sourceDir: string // './src/system/styled' for internal, or user's styled
  outputDir: string // Where to write packaged output
}) {
  // Package the styled system with proper structure
  // Add package.json, type declarations, etc.

  await bundleStyled({
    input: options.sourceDir,
    output: options.outputDir,
    format: ['esm', 'cjs'],
  })
}
```

**Why separate packager:**

- Users never import `@reference-ui/styled` directly
- When re-exporting primitives/apis in `@reference-ui/system` (or main package), it pulls from styled internally
- Styled is the implementation detail; system is the public API
- Clean separation allows styled to be optimized/bundled independently

### Phase 5: Package Structure & Re-exports

**Final package structure:**

```
dist/
├── styled/             # Internal styled package (packaged)
│   ├── css/
│   ├── jsx/
│   ├── patterns/
│   ├── recipes/
│   └── package.json
│
├── fragments/          # Public fragments (configure user's styled)
│   ├── tokens.js
│   ├── recipes.js
│   └── utilities.js
│
├── primitives/         # Compiled primitives (import from @reference-ui/styled)
│   └── index.js
│
├── system/             # Public API re-exports
│   └── index.js        # Re-exports primitives, styled selectively
│
├── api/                # Runtime APIs
│   └── index.js
│
└── cli.js              # CLI entry point
```

**Re-export pattern:**

```typescript
// dist/system/index.ts - Public API
// Users import from @reference-ui/system
export * from '../primitives' // Primitives internally use @reference-ui/styled
export { css, cva, cx } from '../styled/css' // Selective re-exports from styled

// Users never do: import { css } from '@reference-ui/styled'
// They do: import { css } from '@reference-ui/system'
// But primitives internally use @reference-ui/styled (via alias)
```

### Phase 6: User ref sync Integration

When user runs `ref sync`:

1. Load CLI's fragments (not primitives)
2. Collect user's fragments from ui.config.ts
3. Merge CLI internal fragments + user fragments
4. Generate panda.config.ts using external context
5. Run Panda → outputs .reference-ui/styled/
6. User's bundler resolves `@reference-ui/styled` to `.reference-ui/styled/`
7. User imports from `@reference-ui/system` (which re-exports primitives)

---

## Key Architectural Decisions

### 1. Fragments = Configuration Only

Fragments define what goes INTO the styled package:

- Tokens, colors, spacing
- Recipes, patterns
- Utilities, conditions
- Global styles, keyframes

Fragments do NOT contain primitives or runtime code.

### 2. Primitives = Compiled Code

Primitives are regular TypeScript that:

- Import from @reference-ui/styled (after it's generated)
- Are compiled/bundled with the CLI
- Have imports rewritten by bundler
- Ship as executable code, not config

### 3. Two Fragment Sets

**Internal fragments** (CLI only):

- Used to generate internal @reference-ui/styled for development
- May use unstable/internal-only APIs
- Not shipped to users

**Public fragments** (shipped to users):

- Base tokens/recipes users can extend
- Use stable, documented APIs
- Included in packaged dist/

### 4. Import Resolution Strategy

**Development time:**

- tsconfig.json `paths` alias @reference-ui/styled → ./src/system/styled/styled/
- Primitives compile against internal styled package

**Package time:**

- Bundler rewrites all @reference-ui/styled imports
- Point to user's .reference-ui/styled/
- No runtime resolution needed

---

## Codebase Structure

```
reference-cli/
├── src/
│   ├── build/                  # Build scripts
│   │   ├── styled.ts           # Internal styled package builder
│   │   └── index.ts
│   │
│   ├── internal/               # CLI development only
│   │   ├── fragments/          # Internal styled package configuration
│   │   │   ├── base-tokens.ts
│   │   │   ├── rhythm.ts
│   │   │   └── index.ts
│   │   └── collectFragments.ts # Fragment collection for internal build
│   │
│   ├── styled/                 # Styled system
│   │   ├── api/                # Design system APIs
│   │   │   ├── tokens.ts       # → fragment exports
│   │   │   ├── recipe.ts       # → fragment exports
│   │   │   └── ...
│   │   ├── internal/           # Generated internal styled package (gitignored)
│   │   │   ├── css/
│   │   │   ├── jsx/
│   │   │   ├── patterns/
│   │   │   └── ...
│   │   └── primitives/         # Components (import from @reference-ui/styled)
│   │       ├── h1.style.ts
│   │       ├── h6.style.ts
│   │       └── ...
│   │
│   ├── fragments/              # Public fragments (shipped to users)
│   │   ├── tokens.ts
│   │   ├── recipes.ts
│   │   └── index.ts
│   │
│   ├── system/                 # Build pipeline (dual-context)
│   │   ├── config/             # Config generation
│   │   │   ├── panda/
│   │   │   │   └── generateConfig.ts  # Handles internal/external
│   │   │   └── fragments/
│   │   └── panda/              # Panda execution
│   │
│   ├── packager/               # Packagers
│   │   ├── styled/             # Styled package packager
│   │   │   └── index.ts
│   │   ├── fragments/          # Fragment packager
│   │   └── index.ts
│   │
│   └── cli/                    # CLI entry point
│       └── index.ts
│
├── tsconfig.json               # Paths alias: @reference-ui/styled → ./src/system/styled/styled
├── tsup.config.ts              # Bundler alias: @reference-ui/styled → .reference-ui/styled
└── package.json                # "prebuild": "tsx src/system/styled/build.ts"
```

**Key directories:**

- **`build/styled.ts`**: Orchestrates internal styled package generation
- **`internal/`**: Internal-only fragments and utilities
- **`system/styled/`**: Generated styled package for CLI development (gitignored)
- **`packager/styled/`**: Packages styled system separately
- **`system/`**: Dual-context pipeline (internal vs external builds)
- **`fragments/`**: Public fragments shipped to users

---

## Development Workflow

### Building the CLI

```bash
# 1. Generate internal styled package
pnpm prebuild
  → Run tsx src/system/styled/build.ts
  → Collect fragments from codebase (collectFragments)
  → Generate panda.config.ts using internal context
  → Run Panda → outputs ./src/system/styled/
  → Create internalSystem metadata

# 2. Build CLI with tsup
pnpm build
  → TypeScript compiles:
    - tsconfig paths: @reference-ui/styled → ./src/system/styled/styled
    - Primitives import from @reference-ui/styled
    - Types resolve correctly

  → tsup bundles:
    - Rewrites @reference-ui/styled → .reference-ui/styled
    - Outputs primitives, fragments, api to dist/

  → Packagers run:
    - packager/styled: Package styled system separately
    - packager/fragments: Bundle public fragments
    - Creates proper package.json for each

# 3. Result structure
dist/
  ├── styled/           # Packaged styled system (internal-only)
  │   ├── css/
  │   ├── jsx/
  │   └── package.json
  │
  ├── fragments/        # Public fragments for users
  │   ├── tokens.js
  │   └── index.js
  │
  ├── primitives/       # Compiled primitives (imports rewritten)
  │   └── index.js
  │
  ├── system/           # Public API (re-exports)
  │   └── index.js      # Re-exports from primitives + styled
  │
  └── cli.js            # CLI entry point
```

### User Workflow

```bash
# User installs CLI
pnpm add @reference-ui/cli

# User creates ui.config.ts
import { tokens, recipe } from '@reference-ui/cli/fragments'

export default {
  fragments: [
    tokens({ /* user tokens */ }),
    recipe({ /* user recipes */ })
  ]
}

# User runs sync
npx ref sync
  → CLI loads internalSystem metadata
  → Injects internal fragments into pipeline
  → Load CLI's public fragments
  → Load user's fragments from ui.config.ts
  → Merge: internal + CLI public + user fragments
  → Generate panda.config.ts using external context
  → Run Panda → outputs .reference-ui/styled/

# User imports from public API (not styled directly)
import { H6, css, cva } from '@reference-ui/system'
  → @reference-ui/system re-exports:
    - Primitives (which internally use @reference-ui/styled)
    - Selected styled utilities (css, cva, cx)

  → User's bundler see imports:
    - Primitives import from @reference-ui/styled
    - Resolves to .reference-ui/styled/ generated by ref sync
    - Everything works transparently

# Users NEVER import from @reference-ui/styled directly
# @reference-ui/styled is internal implementation detail
# @reference-ui/system is the public API
```

**Key insight:** The CLI's `internalSystem` metadata allows `ref sync` to inject the internal fragments that make primitives work, while users only see the public API through `@reference-ui/system`.

---

## Summary

The solution uses **build/styled.ts for internal generation**, **dual-context system pipeline**, **separate styled packager**, and **bundler aliasing**:

### 1. Internal Build Pipeline

**`src/system/styled/build.ts`** orchestrates internal styled package generation:

- Collects fragments from codebase using `collectFragments()`
- Uses system pipeline in internal context (no fragment wrapping)
- Generates `panda.config.ts` with internal fragments
- Runs Panda → outputs `./src/system/styled/`
- Creates `internalSystem` metadata for ref sync injection

### 2. Dual-Context System Module

**`src/system/`** handles both internal and external builds:

- **Internal context**: Building styled package for CLI development
- **External context**: Building styled package for users via ref sync
- Same pipeline functions, different execution modes
- `generatePandaConfig({ context: 'internal' | 'external' })`

### 3. Styled as Separate Package

**`@reference-ui/styled`** is packaged separately:

- Has its own packager: `src/packager/styled/`
- Internal implementation detail, not public API
- Bundled independently for optimization
- Users never import from it directly

### 4. Public API via Re-exports

**`@reference-ui/system`** is the public interface:

- Re-exports primitives (which use `@reference-ui/styled` internally)
- Re-exports selected styled utilities (`css`, `cva`, `cx`)
- Users import from `@reference-ui/system`, not `@reference-ui/styled`
- Clean separation: implementation vs interface

### 5. Import Aliasing Strategy

**Aliasing happens at two layers:**

**Development time:**

```json
// tsconfig.json
"paths": {
  "@reference-ui/styled": ["./src/system/styled/styled"],
  "@reference-ui/styled/*": ["./src/system/styled/styled/*"]
}
```

**Package time:**

```typescript
// tsup.config.ts
alias: {
  '@reference-ui/styled': '.reference-ui/styled'
}
```

**Runtime (user's bundler):**

- Sees imports to `@reference-ui/styled`
- Resolves to `.reference-ui/styled/` (generated by ref sync)
- No special configuration needed

### 6. Fragment Injection

During `ref sync`:

1. CLI loads `internalSystem` metadata
2. Injects internal fragments into pipeline
3. Merges with CLI public fragments + user fragments
4. Generates complete styled package for user

This keeps the CLI as a single, cohesive package while elegantly solving the dual-system import problem through:

- Build-time generation (`build/styled.ts`)
- Dual-context pipeline (`system/`)
- Separate packaging (`packager/styled/`)
- Import aliasing (tsconfig + tsup)
- Public API abstraction (`@reference-ui/system`)
