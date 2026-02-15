# Panda Config Mini-Compiler

## Overview

This is a **mini-compiler** that transforms JavaScript config objects into a bundled `panda.config.ts` file. The key innovation: **preserves JavaScript functions and objects** instead of serializing to JSON.

## Architecture

### 1. Source Files (Inputs)
- **`panda.base.ts`** - Base configuration
- **`src/styled/**/*.ts`** - Any files that call `extendPandaConfig()`

### 2. Compilation Pipeline

```
┌─────────────────┐
│  Source Files   │ (panda.base.ts, src/styled/*.ts)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Eval Runner    │ Uses bundleNRequire to execute each file
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Collector     │ globalThis[COLLECTOR_KEY] captures JS objects
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  JS Serializer  │ serializeConfig() converts objects → code
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Bundle Output  │ All fragments as JS code
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ panda.config.ts │ Final merged config with functions preserved
└─────────────────┘
```

### 3. Key Components

#### `extendPandaConfig.ts`
- Export: `extendPandaConfig(partial: Config)`
- Collects config fragments via `globalThis[COLLECTOR_KEY]`
- Called by source files to contribute config pieces

#### `bundleConfig.ts` (NEW)
- **`bundleConfigFragments(fragments[])`** - Bundles all fragments
  - Uses `serialize-javascript` library to serialize objects as code
  - Handles functions, RegExp, Dates, circular references, and edge cases
  - Serializes each fragment as `const fragmentN = { ... }`
  - Exports array of fragments
  
- **`deepMerge(target, ...sources)`** - Merges config objects
  - Deep merges nested objects
  - Replaces arrays and functions (doesn't merge them)

#### `createPandaConfig.ts` (UPDATED)
The **mini-compiler orchestrator**:

1. **Execute**: Runs `runEval()` to execute all source files
2. **Collect**: Captures JS objects from `extendPandaConfig()` calls
3. **Serialize**: Uses `bundleConfigFragments()` to convert to code
4. **Generate**: Writes `panda.config.ts` with:
   - All serialized fragments
   - Deep merge utility
   - Final merged config
   - `defineConfig()` wrapper

#### `eval/runner.ts`
- Uses `bundleNRequire` to execute TypeScript files
- Sets up collector before each file
- Returns captured config fragments

## Why This Approach?

### Problem with JSON Serialization
```typescript
// This BREAKS with JSON.stringify():
const config = {
  transform: (value) => value * 2,  // Function lost!
  nested: { /* ... */ }
}
```

### Solution: JS Code Generation with serialize-javascript
```typescript
// Uses serialize-javascript library - battle-tested by webpack, vite, etc.
const fragment0 = {
  transform: (value) => value * 2,  // Function preserved!
  regex: /test/gi,                  // RegExp preserved!
  date: new Date('2024-01-01'),     // Dates preserved!
  nested: { /* ... */ }
}
```

**Why serialize-javascript?**
- Handles functions, RegExp, Dates, Maps, Sets, circular references
- XSS-safe (escapes dangerous characters)
- Battle-tested by major projects (webpack, vite)
- Handles edge cases: NaN, Infinity, undefined, Symbols

## Usage

### In Source Files
```typescript
// panda.base.ts or src/styled/*.ts
import { extendPandaConfig } from '@reference-ui/core/panda-config'

extendPandaConfig({
  theme: {
    tokens: { colors: { brand: { value: '#ff0000' } } }
  },
  utilities: {
    extend: {
      // Functions work!
      customUtil: (value) => ({ transform: `scale(${value})` })
    }
  }
})
```

### Running the Compiler
```typescript
import { createPandaConfig } from './createPandaConfig'

await createPandaConfig('/path/to/reference-core')
// Outputs: panda.config.ts
```

### Generated Output
```typescript
// panda.config.ts (generated)
import { defineConfig } from '@pandacss/dev'

const fragment0 = {
  theme: {
    tokens: {
      colors: {
        brand: {
          value: "#ff0000"
        }
      }
    }
  },
  utilities: {
    extend: {
      customUtil: (value) => ({ transform: `scale(${value})` })
    }
  }
}

const fragments = [fragment0]

function deepMerge(target, ...sources) { /* ... */ }

const config = fragments.reduce(
  (acc, fragment) => deepMerge(acc, fragment),
  {}
)

export default defineConfig(config)
```

## Design Decisions

### 1. Eval (Runtime Execution)
- **Why**: Need to execute TypeScript files to capture config objects
- **How**: `bundleNRequire` handles TS compilation and execution
- **Trade-off**: Adds eval overhead but enables dynamic configs

### 2. JS Serialization (serialize-javascript)
- **Why**: Functions are first-class citizens in Panda configs
- **How**: Use `serialize-javascript` library to convert objects → source code
- **Benefits**: 
  - Handles functions, RegExp, Dates, circular references
  - XSS-safe and battle-tested
  - Used by webpack, vite, and other major projects
- **Trade-off**: Slightly larger than JSON but preserves all JS features

### 3. Fragment-Based Architecture
- **Why**: Modular - each file contributes independently
- **How**: Collect all fragments, then merge at the end
- **Trade-off**: Merge order matters for conflicting keys

### 4. Generated Config (Not Runtime Merge)
- **Why**: Panda needs a static config file at build time
- **How**: Generate `panda.config.ts` that Panda can import
- **Trade-off**: Requires regeneration on changes

## Future Extensions

### Additional Config Functions
```typescript
// Could add:
export function keyframes(name: string, frames: any) { /* ... */ }
export function fontFace(family: string, src: string) { /* ... */ }
export function tokens(category: string, tokens: any) { /* ... */ }
```

### Watch Mode
```typescript
// Auto-regenerate on file changes
watchFiles(['panda.base.ts', 'src/styled/**'], () => {
  createPandaConfig(coreDir)
})
```

### Source Maps
```typescript
// Track which fragment came from which file
const fragment0 = { /* ... */ } // from panda.base.ts:65
const fragment1 = { /* ... */ } // from src/styled/theme.ts:12
```

## Files

- **`extendPandaConfig.ts`** - Config registration API
- **`bundleConfig.ts`** - JS serialization utilities (NEW)
- **`createPandaConfig.ts`** - Main compiler orchestrator (UPDATED)
- **`index.ts`** - Public exports
- **`eval/`** - Runtime execution layer
  - `index.ts` - Main eval API
  - `runner.ts` - File execution
  - `scanner.ts` - File discovery
  - `registry.ts` - Function name registry
