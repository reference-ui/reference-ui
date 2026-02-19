# reference-core Architecture

## Overview

**reference-core** is a **composable, type-safe design system framework** that generates optimized component libraries and styling infrastructure at build time. It ships as source code that gets built on the user's machine, enabling dynamic design system generation tailored to each project.

### Core Capabilities

- **Zero-runtime CSS generation** via build-time collection and bundling
- **Type-safe styling API** built on Panda CSS with custom extensions
- **CLI microbundle architecture** for extensible code generation
- **Multi-target output:** React components, Web components, and design tokens
- **Self-contained patterns** that work around Panda codegen limitations
- **Single source of truth** for design tokens, fonts, animations, and component styles

---

## What reference-core Does

### Primary Outputs

**reference-core** generates three importable packages plus base styles:

1. **`@reference-ui/react`** - React component library with full TypeScript support
2. **`@reference-ui/web`** - Web components library (framework-agnostic)
3. **`@reference-ui/system`** - Generated design system powered by Panda CSS
   - CSS-in-JS runtime (`css()`, patterns, recipes)
   - Design tokens (colors, spacing, typography)
   - Global styles and theme configuration

These are built into `node_modules` for direct import and use.

### Build Process

The build system uses a **three-layer architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│  User API Layer (styled/api/)                               │
│  • Declarative config functions: tokens(), recipe(),        │
│    pattern(), font(), keyframes(), utilities()              │
│  • High-level, type-safe configuration                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  CLI Eval & Microbundle Layer (cli/)                        │
│  • Discovers and evaluates config function calls            │
│  • Runs microbundles for complex features:                  │
│    - config/      - Base config collection & merging        │
│    - boxPattern/  - Pattern extension collector             │
│    - fontFace/    - Font system generator                   │
│  • Generates bundled.   code at build time                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Panda CSS Layer (generated)                                │
│  • Merged panda.config.ts from all config fragments         │
│  • Generated runtime patterns in styled-system/             │
│  • Type-safe CSS-in-JS with full token autocomplete         │
│  • Optimized CSS output with zero-runtime overhead          │
└─────────────────────────────────────────────────────────────┘
```

---

## User Workflow

### Installation

```bash
npm install --save-dev @reference-ui/core
# or
pnpm add -D @reference-ui/core
```

### Setup

In your app's entry file, import the base styles:

```js
import '@reference-ui/system/styles.css'
```

### Commands

- **Build:** `ref sync` - Builds the design system and component libraries
- **Watch:** `ref sync --watch` - Watches for changes and rebuilds continuously
- **Development:** Hot-reloads on config/style changes during development

### Using the Generated System

```tsx
// Import the CSS-in-JS runtime
import { css } from '@reference-ui/system/css'
import { Box } from '@reference-ui/system/jsx'

// Use design tokens and patterns
<Box 
  font="sans" 
  weight="bold" 
  r="2"  // Responsive rhythm spacing
  container="sidebar"
  css={{ color: 'blue.500' }}
>
  Hello World
</Box>

// Or use the css() function directly
const styles = css({
  color: 'blue.500',
  fontSize: 'lg',
  r: { base: '1', md: '2' },  // Responsive
  font: 'sans'
})
```

---

## Architecture Deep Dive

### 1. Styled System API (`src/styled/`)

A declarative configuration system for defining design tokens, component styles, and CSS patterns:

#### Core APIs

| API | Purpose | Example |
|-----|---------|---------|
| `tokens()` | Register design tokens | Colors, spacing, fonts, radii |
| `recipe()` | Single-part component styles | Button variants, badge styles |
| `slotRecipe()` | Multi-part component styles | Card (header, body, footer) |
| `pattern()` | Extend box pattern with custom props | Container queries, font presets |
| `font()` | All-in-one font system | Font families, weights, @font-face |
| `utilities()` | Custom utility generators | Rhythm spacing, truncation |
| `globalCss()` | Global styles | `:root` vars, body defaults |
| `staticCss()` | Force utility/recipe generation | Ensure classes exist |
| `globalFontface()` | `@font-face` rules | Web font loading |
| `keyframes()` | Animation keyframes | Fade, slide, spin animations |

#### Domain-Based Organization

The styled system is organized by **design domain** for clarity:

```
src/styled/
├── api/          # Infrastructure APIs (tokens, recipe, pattern)
├── theme/        # Core design tokens (colors, spacing, radii)
├── font/         # Typography system (font families, weights)
├── rhythm/       # Spacing/rhythm system (vertical rhythm utilities)
└── props/        # Pattern extensions (custom box props)
```

Each domain is self-contained with its own tokens, utilities, and global CSS.

### 2. CLI Eval System (`src/cli/eval/`)

The **eval system** discovers and executes configuration function calls at build time:

#### How It Works

1. **Registry** (`registry.ts`) - Defines which function names to scan for (e.g., `extendPandaConfig`)
2. **Scanner** - Walks directories finding files that call registered functions
3. **Runner** - Bundles and executes matched files with a global collector
4. **Collection** - Captures all config fragments from function calls
5. **Merging** - Deep merges fragments into final Panda config

**Example flow:**

```typescript
// User writes in styled/theme/colors.ts
tokens({
  colors: {
    brand: { value: '#3b82f6' }
  }
})

// CLI eval discovers this file
// → Bundles and runs it
// → Captures the tokens() call
// → Merges into panda.config.ts
```

### 3. CLI Microbundle Pattern (`src/cli/panda/`)

For complex features that need **code generation** (not just config), we use **microbundles**:

#### Why Microbundles?

Panda's codegen doesn't capture closure variables in pattern transforms. All transforms must be **self-contained** with inlined constants.

```typescript
// ❌ Doesn't work - PRESETS not in generated code
const PRESETS = { sans: {...} }
pattern({
  transform(props) {
    return PRESETS[props.font]  // ❌ ReferenceError at runtime
  }
})

// ✅ Works - inlined in transform body
pattern({
  transform(props) {
    const PRESETS = { sans: {...} }  // ✅ Serialized into generated code
    return PRESETS[props.font]
  }
})
```

#### Microbundle Structure

Each microbundle follows a consistent pattern:

```
cli/panda/feature/
├── extendFeature.ts         # User API (registers in globalThis)
├── initFeatureCollector.ts  # Initialize collector
├── collectEntryTemplate.ts  # Build temp entry file
├── generateFeature.ts       # Code generator (TypeScript output)
├── createFeature.ts         # Main CLI orchestrator
└── index.ts                 # Public exports
```

#### Example Microbundles

1. **`config/`** - Collects and merges Panda config fragments
   - Discovers all `extendPandaConfig()` calls
   - Deep merges into single `panda.config.ts`
   
2. **`boxPattern/`** - Combines pattern extensions into unified box
   - Collects all `pattern()` calls from `props/*.ts`
   - Generates `props/box.ts` with merged properties
   - Inlines all transforms to avoid closure issues

3. **`fontFace/`** - Generates complete font system
   - Collects all `font()` calls
   - Generates font tokens, @font-face rules, recipes, and pattern props
   - Outputs `font/font.ts` with everything needed

#### Microbundle Execution Flow

1. **Collect** - User calls API function (e.g., `font()`) → registers in `globalThis`
2. **Generate Entry** - CLI creates temp entry file importing all user files
3. **Bundle** - `microBundle()` uses esbuild to bundle with proper externals
4. **Execute** - Runs bundled code to collect all registered data
5. **Generate Code** - Transforms collected data into TypeScript
6. **Output** - Writes generated file (committed to repo)

### 4. Type Safety & Generated Code

The entire system is **fully type-safe** with generated TypeScript:

- Pattern props appear in JSX autocomplete
- Token references validated at build time
- Responsive prop types from pattern definitions
- Recipe variants fully typed
- Utility class names type-checked

### 5. Module Resolution

Both reference-core and user projects resolve `@reference-ui/system` consistently:

- Development: Points to generated `styled-system/` output
- Production: Published package exports same structure
- TypeScript: Full autocomplete and type checking in both environments

---

## Project Structure

```
packages/reference-core/
├── src/
│   ├── cli/                    # Build-time code generation
│   │   ├── eval/              # Config function discovery & execution
│   │   │   ├── registry.ts    # Registered function names
│   │   │   ├── scanner.ts     # File discovery (planned)
│   │   │   └── runner.ts      # Bundle & execute
│   │   ├── panda/             # Panda-specific microbundles
│   │   │   ├── config/        # Config collection & merging
│   │   │   ├── boxPattern/    # Pattern extension collector
│   │   │   ├── fontFace/      # Font system generator
│   │   │   └── gen/           # Panda codegen runners
│   │   └── lib/
│   │       └── microBundle.ts # esbuild wrapper for bundling
│   │
│   ├── styled/                # Styled system (user-facing)
│   │   ├── api/               # Config APIs (tokens, recipe, etc.)
│   │   ├── theme/             # Core design tokens
│   │   ├── font/              # Typography system
│   │   ├── rhythm/            # Spacing system
│   │   ├── props/             # Pattern extensions
│   │   ├── index.ts           # Main styled exports
│   │   ├── css.global.ts      # Global CSS definitions
│   │   └── PLAN.md            # Detailed styled system docs
│   │
│   ├── components/            # Component definitions (React/Web)
│   ├── primitives/            # Base component primitives
│   ├── entry/                 # Public package exports
│   │   └── index.ts           # Main entry (exports css(), etc.)
│   └── system/                # Generated by Panda
│       ├── css/               # CSS-in-JS runtime
│       ├── patterns/          # Pattern functions
│       ├── jsx/               # JSX factory + <Box>, etc.
│       └── types/             # Generated TypeScript types
│
├── panda.config.ts            # Generated Panda config
└── styled-system/             # Generated Panda output (system/)
```

---

## Key Design Principles

### 1. Zero-Runtime Performance

- All CSS generation happens at build time
- Pattern transforms are inlined during codegen
- No runtime style calculation overhead
- Optimized CSS output with automatic deduplication

### 2. Type Safety First

- Generated TypeScript from collected definitions
- Full autocomplete for tokens, recipes, patterns
- Compile-time validation of all style props
- No magic strings—everything is typed

### 3. Composability

- Small, focused APIs that compose together
- Domain-based organization for clarity
- Pattern extensions combine into unified box
- Font system integrates tokens, recipes, and patterns

### 4. Build-Time Extensibility

- CLI microbundle pattern for new features
- Eval system discovers user config automatically
- Deep merging of config fragments
- Code generation with full TypeScript output

### 5. Self-Contained Patterns

- All pattern transforms inline their dependencies
- No closure captures (works with Panda codegen)
- Generated code is human-readable
- Easy to debug and reason about

---

## Development Workflow

### For Users

1. Install `@reference-ui/core`
2. Import base styles
3. Define design tokens/styles using APIs
4. Run `ref sync` to generate system
5. Import and use components/CSS runtime

### For Contributors

1. Add/modify styled system definitions
2. Run `pnpm build` (runs all microbundles)
3. Test generated output
4. Commit both source and generated files

### Adding New Features

**Simple config (no generation needed):**
- Add API function in `styled/api/`
- Call `extendPandaConfig()` internally
- Export from `styled/api/index.ts`

**Complex features (need code generation):**
- Create microbundle in `cli/panda/feature/`
- Follow pattern: collect → bundle → execute → generate
- Add to build pipeline
- Commit generated output

---

## Related Documentation

- [styled/PLAN.md](src/styled/PLAN.md) - Detailed styled system architecture
- [cli/eval/readme.md](src/cli/eval/readme.md) - Eval system documentation
- [cli/panda/config/readme.md](src/cli/panda/config/readme.md) - Config microbundle details
- [styled/font/fontface.md](src/styled/font/fontface.md) - Font system implementation
- [styled/api/pattern.md](src/styled/api/pattern.md) - Pattern closure limitations
- [Architecture.md](../../Architecture.md) - Overall project architecture