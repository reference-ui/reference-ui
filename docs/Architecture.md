# reference-core Complete Architecture Map

> **Complete file-by-file mapping of the reference-core design system framework**  
> Zero-runtime CSS generation • Type-safe primitives • Container-first responsive • Microbundle extensibility

---

## File Structure Map (Short Descriptions)

> Short, file-by-file notes for the entire src/ tree.

```
src/
    Architecture.md          - This document

    cli/
        index.ts               - CLI entry point and exports

        commands/
            link-system.ts       - Symlink generated system into src/system
            sync.ts              - Main build command (eval + microbundles + codegen)

        config/
            index.ts             - Config loader exports
            load-config.ts       - Load ui.config.ts

        eval/
            index.ts             - Eval exports
            readme.md            - Eval system docs
            registry.ts          - Function name registry for discovery
            runner.ts            - Bundle + execute discovered config files
            scanner.ts           - File scanner for registered calls

        internal/
            link-local-system.ts - Local dev symlinks for system output

        lib/
            microBundle.ts       - esbuild wrapper for CLI bundling
            run-generate-primitives.ts - Runs primitive generation script

        panda/
            boxPattern/
                collectEntryTemplate.ts - Temp entry template for box patterns
                createBoxPattern.ts     - Orchestrate collect/bundle/generate
                extendBoxPattern.ts     - User API to register pattern extensions
                generateBoxPattern.ts   - Generate merged pattern code
                index.ts                - Box pattern exports
                initBoxCollector.ts     - Init global collector

            config/
                COMPILER.md         - Compiler details
                SUMMARY.md          - Quick overview
                createPandaConfig.ts - Orchestrate config collection + merge
                deepMerge.ts         - Deep merge helper
                entryTemplate.ts     - Temp entry for config collection
                extendPandaConfig.ts - User API to register config fragments
                index.ts             - Config exports
                initCollector.ts     - Init global collector
                readme.md            - Config microbundle docs

            fontFace/
                collectEntryTemplate.ts - Temp entry template for fonts
                createFontSystem.ts     - Orchestrate font collection + generation
                extendFontFace.ts       - User API to register font families
                generateFontSystem.ts   - Generate font tokens/recipes/patterns
                index.ts                - Font microbundle exports
                initFontCollector.ts    - Init global collector

            gen/
                copy-to-codegen.ts      - Copy generated output for docs playground
                mdx-to-jsx.ts           - Convert MDX JSX components
                rewrite-css-imports.ts  - Rewrite CSS import paths
                rewrite-cva-imports.example.md - CVA rewrite examples
                rewrite-cva-imports.ts  - Rewrite CVA imports
                runner.ts               - Run Panda codegen

        workspace/
            copy-to-node-modules.ts   - Copy generated system into node_modules
            resolve-core.ts           - Resolve core package location

    components/
        Button.tsx              - Button example component
        RecipeCoreDemo.tsx      - Recipe system demo
        ResponsiveExample.tsx   - Responsive/container query demo

    entry/
        index.ts                - Package entry exports

    primitives/
        createPrimitive.tsx     - Primitive factory for HTML tags
        index.tsx               - Exports all primitives
        recipes.ts              - Primitive recipes
        tags.ts                 - HTML tag list
        types.ts                - Primitive types

        css/
            abbr.style.ts         - Element styles
            b.style.ts            - Element styles
            base.typography.ts    - Base typography rules
            blockquote.style.ts   - Element styles
            cite.style.ts         - Element styles
            code.style.ts         - Element styles
            em.style.ts           - Element styles
            h1.style.ts           - Element styles
            h2.style.ts           - Element styles
            h3.style.ts           - Element styles
            h4.style.ts           - Element styles
            h5.style.ts           - Element styles
            h6.style.ts           - Element styles
            i.style.ts            - Element styles
            kbd.style.ts          - Element styles
            mark.style.ts         - Element styles
            p.style.ts            - Element styles
            pre.style.ts          - Element styles
            q.style.ts            - Element styles
            s.style.ts            - Element styles
            samp.style.ts         - Element styles
            small.style.ts        - Element styles
            strong.style.ts       - Element styles
            sub.style.ts          - Element styles
            sup.style.ts          - Element styles
            u.style.ts            - Element styles
            var.style.ts          - Element styles

    styled/
        css.global.ts           - Global CSS defaults
        css.static.ts           - Static CSS generation triggers
        fontface.md             - Fontface documentation
        index.ts                - Styled system exports
        patterns.d.ts           - Pattern type declarations
        PLAN.md                 - Styled system plan
        STRUCTURE.md            - Styled system architecture
        TODO.md                 - Outstanding work

        animations/
            attention.ts          - Attention animations
            bounce.ts             - Bounce animations
            fade.ts               - Fade animations
            index.ts              - Animation exports
            README.md             - Animation docs
            scale.ts              - Scale animations
            slide.ts              - Slide animations
            spin.ts               - Spin animations

        api/
            index.ts              - Public config APIs
            internal/
                extendFont.ts       - Register font systems
                extendGlobalCss.ts  - Register global CSS
                extendGlobalFontface.ts - Register @font-face
                extendKeyframes.ts  - Register keyframes
                extendPattern.ts    - Register pattern props
                extendRecipe.ts     - Register recipes
                extendStaticCss.ts  - Register static CSS
                extendTokens.ts     - Register tokens
                extendUtilities.ts  - Register utilities
                index.ts            - Internal exports
            runtime/
                css.ts              - Runtime css() helper
                index.ts            - Runtime exports
                recipe.md           - Recipe docs
                recipe.ts           - Runtime recipe helpers

        font/
            font.ts               - Generated font system
            fontface.md           - Font system docs
            fonts.ts              - Source font definitions
            index.ts              - Font exports

        props/
            box.ts                - Generated merged box pattern
            container.ts          - Container prop extension
            font.ts               - Font prop extension
            index.ts              - Pattern exports
            r.ts                  - Responsive container query prop

        rhythm/
            helpers.ts            - Rhythm helpers
            index.ts              - Rhythm exports
            utilities.ts          - Rhythm utility generators

        theme/
            animations.ts         - Animation tokens
            colors.ts             - Color tokens
            index.ts              - Theme exports
            radii.ts              - Radius tokens
            spacing.ts            - Spacing tokens

        types/
            colors.ts             - Color-related types
            index.ts              - Type exports

    system/                   - Generated Panda output (symlink to styled-system)
        helpers.js              - Runtime helpers
        package.json            - System package metadata
        styles.css              - Generated CSS
        css/                    - CSS runtime
        jsx/                    - JSX runtime + Box
        patterns/               - Pattern functions
        recipes/                - Recipe functions
        tokens/                 - Design token values
        types/                  - TypeScript types
```

---

## 📋 Table of Contents

1. [Project Root](#project-root)
2. [Source Directory (`src/`)](#source-directory-src)
3. [CLI System (`src/cli/`)](#cli-system-srccli)
4. [Styled System (`src/styled/`)](#styled-system-srcstyled)
5. [Components & Primitives](#components--primitives)
6. [Generated Output](#generated-output)
7. [Supporting Infrastructure](#supporting-infrastructure)

---

## Project Root

### Configuration Files

| File               | Purpose                                                |
| ------------------ | ------------------------------------------------------ |
| `package.json`     | NPM package metadata, dependencies, build scripts      |
| `tsconfig.json`    | TypeScript compilation settings for entire project     |
| `tsdown.config.ts` | TSDown bundler configuration for package exports       |
| `project.json`     | Nx project configuration for monorepo integration      |
| `panda.base.ts`    | Base Panda CSS configuration (merged by CLI)           |
| `panda.config.ts`  | **Generated** - Final Panda config with all extensions |

### Documentation

| File            | Purpose                                                        |
| --------------- | -------------------------------------------------------------- |
| `README.md`     | Project overview and quick start guide                         |
| `CORE.md`       | **Vision document** - Architectural philosophy and innovations |
| `STRUCTURE.md`  | **Architecture guide** - Build system and three-layer design   |
| `PUBLIC API.md` | Public API surface documentation                               |

### Build Artifacts

| Directory        | Purpose                                                         |
| ---------------- | --------------------------------------------------------------- |
| `dist/`          | **Generated** - Compiled TypeScript output for npm distribution |
| `styled-system/` | **Generated** - Panda CSS runtime (CSS-in-JS, patterns, tokens) |
| `.panda/`        | Panda CSS internal cache                                        |
| `.ref/`          | Reference-core CLI cache                                        |
| `node_modules/`  | Dependencies                                                    |

---

## Source Directory (`src/`)

The main source code organized by functional responsibility:

```
src/
├── cli/          # Build-time code generation and discovery
├── styled/       # Design system configuration (tokens, recipes, patterns)
├── primitives/   # HTML element primitives (Button, Link, etc.)
├── components/   # Example components
├── entry/        # Package exports
└── system/       # Generated Panda CSS runtime (symlinked to styled-system/)
```

---

## CLI System (`src/cli/`)

> **Build-time discovery, evaluation, and code generation**

### Entry Point

| File           | Purpose                                            |
| -------------- | -------------------------------------------------- |
| `cli/index.ts` | Main CLI exports, orchestrates eval + microbundles |

---

### Commands (`cli/commands/`)

> **User-facing CLI commands**

| File             | Purpose                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| `sync.ts`        | Main `ref sync` command - runs eval system + Panda codegen + microbundles |
| `link-system.ts` | Links generated `styled-system/` to `src/system/` for imports             |

---

### Eval System (`cli/eval/`)

> **Discovers and executes user styling configuration at build time**

| File          | Purpose                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| `index.ts`    | Exports eval runner and registry                                        |
| `registry.ts` | **Registry of discoverable function names** (`extendPandaConfig`, etc.) |
| `scanner.ts`  | File system scanner to find files calling registered functions          |
| `runner.ts`   | **Bundles and executes** discovered files, collects results             |
| `readme.md`   | Documentation for eval system architecture                              |

**How it works:**

1. `scanner.ts` finds all files calling `extendPandaConfig()` or similar
2. `runner.ts` bundles those files with esbuild
3. Executes bundle, captures registrations via `globalThis` collectors
4. Returns collected config fragments for merging

---

### Panda Microbundles (`cli/panda/`)

> **Feature-specific code generators that produce committed TypeScript**

Each microbundle follows the pattern: **collect → bundle → execute → generate → output**

#### Config Microbundle (`cli/panda/config/`)

**Collects and merges all Panda config extensions**

| File                   | Purpose                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `index.ts`             | Exports config microbundle public API                      |
| `extendPandaConfig.ts` | **User API** - Register config fragment in `globalThis`    |
| `initCollector.ts`     | Initialize `globalThis.__pandaConfigCollector__`           |
| `entryTemplate.ts`     | Generates temp entry file importing all user configs       |
| `createPandaConfig.ts` | **Orchestrator** - Runs collection → bundling → generation |
| `deepMerge.ts`         | Deep merge utility for combining config fragments          |
| `readme.md`            | Config system documentation                                |
| `COMPILER.md`          | Compiler architecture details                              |
| `SUMMARY.md`           | Quick reference summary                                    |

**Output:** `panda.config.ts` (merged from all `extendPandaConfig()` calls)

---

#### Box Pattern Microbundle (`cli/panda/boxPattern/`)

**Generates unified box pattern from all pattern extensions**

| File                      | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `index.ts`                | Exports box pattern public API                                  |
| `extendBoxPattern.ts`     | **User API** - Register pattern extension                       |
| `initBoxCollector.ts`     | Initialize `globalThis.__boxPatternCollector__`                 |
| `collectEntryTemplate.ts` | Template for temp entry file                                    |
| `createBoxPattern.ts`     | **Orchestrator** - Collection → bundling → generation           |
| `generateBoxPattern.ts`   | **Code generator** - Outputs TypeScript with inlined transforms |

**Why needed:** Panda doesn't capture closure variables in pattern transforms.  
**Output:** `styled/props/box.ts` (merged pattern with inline transforms)

---

#### Font System Microbundle (`cli/panda/fontFace/`)

**Generates complete font system from `extendFont()` calls**

| File                      | Purpose                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| `index.ts`                | Exports font system public API                                     |
| `extendFontFace.ts`       | **User API** - Register font family with variants                  |
| `initFontCollector.ts`    | Initialize `globalThis.__fontCollector__`                          |
| `collectEntryTemplate.ts` | Template for temp entry file                                       |
| `createFontSystem.ts`     | **Orchestrator** - Collection → bundling → generation              |
| `generateFontSystem.ts`   | **Code generator** - Outputs tokens, recipes, patterns, @font-face |

**Output:** `styled/font/font.ts` (complete font system)

---

#### Panda Codegen Runners (`cli/panda/gen/`)

**Wraps Panda CSS codegen with custom transforms**

| File                             | Purpose                                                  |
| -------------------------------- | -------------------------------------------------------- |
| `runner.ts`                      | Runs Panda codegen (`panda codegen`)                     |
| `copy-to-codegen.ts`             | Copies generated `styled-system/` to `codegen/src/`      |
| `rewrite-css-imports.ts`         | Rewrites CSS import paths for bundler compatibility      |
| `rewrite-cva-imports.ts`         | Rewrites CVA (class variance authority) imports          |
| `rewrite-cva-imports.example.md` | Examples of CVA import transformations                   |
| `mdx-to-jsx.ts`                  | Converts MDX JSX components to standard React components |

---

### CLI Library (`cli/lib/`)

**Shared utilities for CLI operations**

| File                         | Purpose                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| `microBundle.ts`             | **esbuild wrapper** - Bundles code with strategic externals |
| `run-generate-primitives.ts` | Runs primitive generation script                            |

---

### CLI Config (`cli/config/`)

**CLI configuration loading**

| File             | Purpose                               |
| ---------------- | ------------------------------------- |
| `index.ts`       | Exports config loader                 |
| `load-config.ts` | Loads user config from `ui.config.ts` |

---

### CLI Workspace (`cli/workspace/`)

**Workspace resolution utilities**

| File                      | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `resolve-core.ts`         | Resolves `@reference-ui/core` package location |
| `copy-to-node-modules.ts` | Copies generated system to `node_modules/`     |

---

### CLI Internal (`cli/internal/`)

**Internal CLI utilities**

| File                   | Purpose                                |
| ---------------------- | -------------------------------------- |
| `link-local-system.ts` | Creates symlinks for local development |

---

## Styled System (`src/styled/`)

> **User-facing design system configuration APIs**

### Entry Point

| File              | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| `styled/index.ts` | Main styled system exports (all APIs + domains) |

### Documentation

| File            | Purpose                                   |
| --------------- | ----------------------------------------- |
| `PLAN.md`       | Detailed styled system planning document  |
| `STRUCTURE.md`  | Styled system architecture guide          |
| `TODO.md`       | Outstanding tasks and improvements        |
| `fontface.md`   | Font system implementation details        |
| `patterns.d.ts` | TypeScript declarations for pattern types |

### Global Styles

| File            | Purpose                                                         |
| --------------- | --------------------------------------------------------------- |
| `css.global.ts` | **Global CSS** - `:root` vars, `body` defaults, container setup |
| `css.static.ts` | **Static CSS** - Force generation of specific utilities/recipes |

---

### Styled API (`styled/api/`)

> **Public configuration functions for design tokens, recipes, patterns**

| File       | Purpose                        |
| ---------- | ------------------------------ |
| `index.ts` | Exports all configuration APIs |

#### Internal Functions (`styled/api/internal/`)

**Low-level config extension functions (called by public APIs)**

| File                      | Purpose                                                    |
| ------------------------- | ---------------------------------------------------------- |
| `index.ts`                | Exports all internal extension functions                   |
| `extendTokens.ts`         | Extends Panda design tokens (colors, spacing, fonts, etc.) |
| `extendRecipe.ts`         | Extends single-part recipes (Button, Badge variants)       |
| `extendPattern.ts`        | Extends box pattern with custom props                      |
| `extendUtilities.ts`      | Extends utility generators (custom CSS properties)         |
| `extendGlobalCss.ts`      | Extends global CSS rules                                   |
| `extendStaticCss.ts`      | Forces generation of specific utilities/recipes            |
| `extendGlobalFontface.ts` | Extends @font-face declarations                            |
| `extendKeyframes.ts`      | Extends animation keyframes                                |
| `extendFont.ts`           | All-in-one font system extension                           |

#### Runtime Functions (`styled/api/runtime/`)

**Runtime styling helpers (used in components)**

| File        | Purpose                           |
| ----------- | --------------------------------- |
| `index.ts`  | Exports runtime utilities         |
| `css.ts`    | Re-exports Panda `css()` function |
| `recipe.ts` | Recipe runtime helpers            |
| `recipe.md` | Recipe system documentation       |

---

### Theme Domain (`styled/theme/`)

> **Core design tokens (colors, spacing, radii, shadows)**

| File            | Purpose                                  |
| --------------- | ---------------------------------------- |
| `index.ts`      | Exports all theme tokens                 |
| `colors.ts`     | Color tokens (brand, semantic, neutrals) |
| `spacing.ts`    | Spacing scale tokens (0.5rem → 20rem)    |
| `radii.ts`      | Border radius tokens (rounded corners)   |
| `animations.ts` | Animation duration/timing tokens         |

---

### Font Domain (`styled/font/`)

> **Typography system (fonts, weights, @font-face)**

| File          | Purpose                                                          |
| ------------- | ---------------------------------------------------------------- |
| `index.ts`    | Exports font system                                              |
| `fonts.ts`    | Font family definitions using `extendFont()`                     |
| `font.ts`     | **Generated** - Complete font system (tokens, recipes, patterns) |
| `fontface.md` | Font system documentation                                        |

---

### Rhythm Domain (`styled/rhythm/`)

> **Vertical rhythm and spacing utilities**

| File           | Purpose                                          |
| -------------- | ------------------------------------------------ |
| `index.ts`     | Exports rhythm utilities                         |
| `utilities.ts` | Rhythm utility generators (`r` prop for spacing) |
| `helpers.ts`   | Rhythm calculation helpers                       |

---

### Props Domain (`styled/props/`)

> **Pattern extensions for Box component (r, container, font props)**

| File           | Purpose                                                    |
| -------------- | ---------------------------------------------------------- |
| `index.ts`     | Exports all pattern extensions                             |
| `box.ts`       | **Generated** - Unified box pattern with all extensions    |
| `r.ts`         | **Responsive container query prop** - `r={{ 320: {...} }}` |
| `container.ts` | **Container name prop** - `container="sidebar"`            |
| `font.ts`      | **Font preset prop** - `font="sans"`                       |

---

### Animations Domain (`styled/animations/`)

> **CSS animation keyframes**

| File           | Purpose                                      |
| -------------- | -------------------------------------------- |
| `README.md`    | Animation system documentation               |
| `index.ts`     | Exports all keyframes                        |
| `fade.ts`      | Fade in/out animations                       |
| `slide.ts`     | Slide animations (up, down, left, right)     |
| `scale.ts`     | Scale animations (zoom in/out)               |
| `spin.ts`      | Rotation animations                          |
| `bounce.ts`    | Bounce animations                            |
| `attention.ts` | Attention-grabbing animations (shake, pulse) |

---

## Components & Primitives

### Primitives (`src/primitives/`)

> **Type-safe HTML element primitives (Button, Link, Article, etc.)**

| File                  | Purpose                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `index.tsx`           | **Exports 50+ semantic HTML primitives**                         |
| `createPrimitive.tsx` | **Factory function** - Creates type-safe primitive from HTML tag |
| `tags.ts`             | List of all supported HTML tags                                  |
| `types.ts`            | TypeScript types for primitive props                             |
| `recipes.ts`          | Recipe definitions for primitives                                |

#### Primitive CSS Styles (`primitives/css/`)

**Element-specific default styles**

| File                 | Purpose                                                 |
| -------------------- | ------------------------------------------------------- |
| `base.typography.ts` | Base typography styles                                  |
| Typography elements  | `h1.style.ts` through `h6.style.ts`, `p.style.ts`, etc. |
| Code elements        | `code.style.ts`, `pre.style.ts`, `kbd.style.ts`, etc.   |
| Semantic elements    | `strong.style.ts`, `em.style.ts`, `mark.style.ts`, etc. |
| Quote elements       | `blockquote.style.ts`, `q.style.ts`, `cite.style.ts`    |

---

### Example Components (`src/components/`)

**Demo components showing API usage**

| File                    | Purpose                                |
| ----------------------- | -------------------------------------- |
| `Button.tsx`            | Example button component with variants |
| `RecipeCoreDemo.tsx`    | Recipe system demonstration            |
| `ResponsiveExample.tsx` | Container query responsive example     |

---

## Generated Output

### System Directory (`src/system/` → `styled-system/`)

> **Generated by Panda CSS - Zero-runtime CSS-in-JS**

**Note:** `src/system/` is symlinked to `styled-system/` for clean imports.

| Directory      | Purpose                                                  |
| -------------- | -------------------------------------------------------- |
| `css/`         | CSS-in-JS runtime (`css()`, `cx()`, atomic classes)      |
| `jsx/`         | JSX factory, `Box` component, styled elements            |
| `patterns/`    | Pattern functions (stack, flex, grid, container queries) |
| `recipes/`     | Recipe functions (component variants)                    |
| `tokens/`      | Design token runtime values                              |
| `types/`       | TypeScript type definitions                              |
| `styles.css`   | **Static CSS output** (all generated styles)             |
| `helpers.js`   | Runtime helper utilities                                 |
| `package.json` | Package metadata for `@reference-ui/system`              |

---

## Supporting Infrastructure

### Scripts (`scripts/`)

**Build automation scripts**

| File                      | Purpose                                      |
| ------------------------- | -------------------------------------------- |
| `gen-config.ts`           | Generates Panda config from discovered calls |
| `generate-primitives.cjs` | Generates primitive components from tag list |

---

### Codegen (`codegen/`)

**Internal documentation/playground site**

```
codegen/src/
├── main.tsx          # Playground entry point
├── router.tsx        # Playground router
├── vite-env.d.ts     # Vite TypeScript definitions
├── components/       # Playground components
├── docs/             # Documentation pages
├── lib/              # Utilities
└── routes/           # Route definitions
```

---

### Documentation (`docs/`)

| File                    | Purpose                                 |
| ----------------------- | --------------------------------------- |
| `MIGRATION-TO-REACT.md` | Guide for migrating to React primitives |
| `response.md`           | Responsive design patterns              |
| `responsive.md`         | Container query documentation           |
| `archive/`              | Archived documentation                  |

---

## Architecture Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  User Code (App)                                                 │
│  • Call extendTokens(), recipe(), pattern(), font() anywhere    │
│  • Import primitives: <Button>, <Link>, <Box>                   │
│  • Use r={{}} for responsive, container="name" for contexts     │
└──────────────────────────────────────────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│  CLI: ref sync (cli/commands/sync.ts)                           │
│  1. Eval system discovers config calls                          │
│  2. Microbundles generate code                                  │
│  3. Panda codegen creates runtime                               │
└──────────────────────────────────────────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│  Eval System (cli/eval/)                                         │
│  • scanner.ts → Finds files with registered function calls      │
│  • runner.ts → Bundles + executes → collects results            │
└──────────────────────────────────────────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│  Microbundles (cli/panda/)                                       │
│  • config/      → Merges all configs → panda.config.ts          │
│  • boxPattern/  → Merges patterns → styled/props/box.ts         │
│  • fontFace/    → Generates fonts → styled/font/font.ts         │
└──────────────────────────────────────────────────────────────────┐
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│  Panda CSS Codegen (cli/panda/gen/runner.ts)                    │
│  • Reads panda.config.ts                                        │
│  • Generates styled-system/ (CSS runtime, patterns, tokens)     │
└──────────────────────────────────────────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│  Generated Output                                                │
│  • panda.config.ts    - Final Panda configuration               │
│  • styled-system/     - Zero-runtime CSS-in-JS                  │
│  • styled/props/box.ts   - Merged box pattern                   │
│  • styled/font/font.ts   - Font system                          │
└──────────────────────────────────────────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│  Runtime (User's Browser)                                        │
│  • Static CSS (styles.css)                                      │
│  • React primitives (<Button>, <Link>, etc.)                    │
│  • Zero styling runtime overhead                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Innovations Summary

### 1. **Eval System** (`cli/eval/`)

- Automatically discovers config calls in codebase
- No manual imports or registration required
- Executes code at build time to collect design tokens

### 2. **Microbundle Architecture** (`cli/panda/`)

- Each feature is self-contained (config, boxPattern, fontFace)
- Generates committed TypeScript that Panda consumes
- Solves closure capture issues with inline transforms

### 3. **Container-First Responsive** (`styled/props/r.ts`)

- `r={{ 320: {...}, 768: {...} }}` API
- Container queries by default, not media queries
- Components respond to container size, not viewport

### 4. **Type-Safe Primitives** (`primitives/`)

- 50+ HTML elements with perfect TypeScript types
- No polymorphic `as` prop (avoids type hell)
- Each primitive strongly typed to its element

### 5. **Domain Organization** (`styled/`)

- Organized by design concern (theme, font, rhythm)
- Each domain self-contained with tokens + utilities
- Scales to hundreds of files without confusion

### 6. **Zero-Runtime Everything**

- All CSS generated at build time by Panda
- No runtime style calculation overhead
- Static CSS + React components only

---

## File Count Summary

| Category             | Count     | Purpose                                      |
| -------------------- | --------- | -------------------------------------------- |
| **CLI System**       | ~40 files | Build-time discovery and code generation     |
| **Styled System**    | ~35 files | Design tokens, recipes, patterns, fonts      |
| **Primitives**       | ~30 files | Type-safe HTML element components            |
| **Generated Output** | Variable  | Panda CSS runtime (css/, patterns/, tokens/) |
| **Documentation**    | ~10 files | Architecture, guides, planning               |
| **Config**           | ~6 files  | Package, TypeScript, build configuration     |

**Total Source Files:** ~120+  
**Generated Files:** ~100+ (in `styled-system/`)

---

## Quick Reference: Find Things Fast

| I want to...              | Go to...                                                     |
| ------------------------- | ------------------------------------------------------------ |
| Add design tokens         | `styled/theme/` or `styled/api/internal/extendTokens.ts`     |
| Create component variants | `styled/api/internal/extendRecipe.ts`                        |
| Add custom box props      | `styled/props/` + `styled/api/internal/extendPattern.ts`     |
| Add font family           | `styled/font/fonts.ts` using `extendFont()`                  |
| Create animations         | `styled/animations/`                                         |
| Modify CLI build          | `cli/commands/sync.ts`                                       |
| Understand eval system    | `cli/eval/readme.md`                                         |
| Add microbundle           | `cli/panda/` + follow existing pattern                       |
| Create primitive          | `primitives/index.tsx` + `createPrimitive()`                 |
| Configure Panda           | `panda.base.ts` + `styled/api/internal/extendPandaConfig.ts` |
| See generated output      | `styled-system/` or `src/system/`                            |

---

## Development Workflow

### 1. **User makes changes:**

```bash
# Add tokens in styled/theme/colors.ts
extendTokens({ colors: { brand: { value: '#0066FF' } } })
```

### 2. **Run build:**

```bash
ref sync         # Full build
ref sync --watch # Watch mode
```

### 3. **CLI executes:**

1. **Eval system** discovers `extendTokens()` call
2. **Config microbundle** collects + merges into `panda.config.ts`
3. **Panda codegen** generates `styled-system/`
4. **Link system** symlinks to `src/system/`

### 4. **Use in components:**

```tsx
import { css } from '@reference-ui/system/css'
import { Button } from '@reference-ui/react'

;<Button css={{ bg: 'brand' }}>Click me</Button>
```

---

## Future Expansion Points

### Planned Microbundles

- [ ] **Animation microbundle** - Declarative spring/timeline animations
- [ ] **Theme microbundle** - Zero-runtime theme switching
- [ ] **Export microbundle** - Design tokens → Figma/Sketch

### Planned Features

- [ ] Static component analysis (bundle size, style usage)
- [ ] Visual regression testing integration
- [ ] Component documentation generation
- [ ] Storybook integration
- [ ] Performance benchmarks

---

## Conclusion

**reference-core** is a **complete design system framework** built on three pillars:

1. **Eval-based discovery** - No manual config registration
2. **Microbundle extensibility** - Infinite feature expansion
3. **Zero-runtime styling** - All CSS generated at build time

The architecture is **designed to scale**:

- To hundreds of design tokens
- To dozens of component libraries
- To teams of any size
- To 5+ year lifespans without TypeScript breakage

Every file has a **clear purpose**, every domain is **self-contained**, and every generated artifact is **human-readable and committable**.

---

_Last updated: February 19, 2026_
