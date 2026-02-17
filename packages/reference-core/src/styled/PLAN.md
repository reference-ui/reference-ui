# Styled System API Plan

## Vision

Building a **composable, type-safe styling API** on top of Panda CSS that provides:
- **Zero-runtime** CSS generation via build-time collection
- **Self-contained patterns** (no closure deps due to Panda codegen limitations)
- **Multi-microbundle CLI architecture** for extensibility
- **Single source of truth** for design tokens, fonts, animations, and more

---

## Architecture Overview

### Three-Layer System

```
┌─────────────────────────────────────────────────────────┐
│  User API Layer (styled/api/)                           │
│  • tokens(), recipe(), pattern(), font(), keyframes()   │
│  • High-level, declarative configuration functions      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  CLI Microbundle Layer (cli/panda/)                    │
│  • config/      - Base config collection & merging      │
│  • boxPattern/  - Box pattern extension collector       │
│  • fontFace/    - Font system generator                 │
│  • (Future microbundles as needed)                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Panda CSS Layer                                        │
│  • Generated panda.config.ts                            │
│  • Generated runtime patterns (styled-system/)          │
│  • Type-safe CSS-in-JS with tokens                      │
└─────────────────────────────────────────────────────────┘
```

### CLI Microbundle Pattern

Each complex features uses a **microbundle** (inspired by `boxPattern/` and `config/`):

1. **Collector** - User calls API function (e.g., `font()`) → registers in `globalThis`
2. **Entry Generator** - CLI generates temp entry file importing all user files
3. **Bundle & Execute** - CLI bundles with esbuild and runs to collect data
4. **Code Generator** - Transforms collected data into final TypeScript
5. **Output** - Generated file (e.g., `font.ts`, `box.ts`) committed to repo

**Why?** Panda patterns can't use closures—all transforms must be self-contained.

---

## Completed APIs ✅

### Core Configuration APIs

| API | File | Description | Status |
|-----|------|-------------|--------|
| `tokens()` | `api/tokens.ts` | Register design tokens (colors, spacing, fonts, etc.) | ✅ Complete |
| `recipe()` | `api/recipe.ts` | Single-part component styles (button variants, etc.) | ✅ Complete |
| `slotRecipe()` | `api/recipe.ts` | Multi-part component styles (card.header, card.body) | ✅ Complete |
| `utilities()` | `api/utilities.ts` | Custom utility class generators (rhythm spacing) | ✅ Complete |
| `globalCss()` | `api/globalCss.ts` | Global styles (`:root` vars, body defaults) | ✅ Complete |
| `staticCss()` | `api/staticCss.ts` | Force utilities/recipes to always generate | ✅ Complete |
| `globalFontface()` | `api/globalFontface.ts` | `@font-face` rules for web fonts | ✅ Complete |
| `pattern()` | `api/pattern.ts` | Extend box pattern with custom props | ✅ Complete |

### Font System ✅

| Component | File | Description | Status |
|-----------|------|-------------|--------|
| `font()` API | `api/font.ts` | Declarative font registration (all-in-one) | ✅ Complete |
| Font Collector | `cli/panda/fontFace/` | CLI microbundle for font system generation | ✅ Complete |
| Generated Output | `font/font.ts` | Auto-generated font tokens/recipes/patterns | ✅ Complete |

**What it does:**
```typescript
font('sans', {
  value: '"Inter", ui-sans-serif, sans-serif',
  fontFace: { src: '...', fontWeight: '200 900' },
  weights: { thin: '200', normal: '400', bold: '700' },
  css: { letterSpacing: '-0.01em', fontWeight: 'normal' }
})
```

Automatically generates:
- Font-family tokens (`fonts.sans`)
- Weight tokens (`fontWeights['sans.bold']`)
- @font-face rules
- Recipe variants (`fontStyle.variants.font.sans`)
- Pattern props (`<Box font="sans" weight="sans.bold">`)

See [fontface.md](font/fontface.md) for details.

### Box Pattern System ✅

| Component | File | Description | Status |
|-----------|------|-------------|--------|
| Pattern Extensions | `props/*.ts` | Individual prop files (container, font, r) | ✅ Complete |
| Box Collector | `cli/panda/boxPattern/` | Collects pattern extensions into single box | ✅ Complete |
| Generated Box | `props/box.ts` | Generated combined box pattern | ✅ Complete |

**How it works:**
- Each `props/*.ts` file calls `pattern()` with properties + transform
- CLI collects all extensions at build time
- Generates `box.ts` with self-contained inline transforms (no closures!)
- Panda codegen creates runtime patterns

---

## In Progress 🚧

### Keyframes API 🚧

**Status:** Planned architecture, not implemented yet

**Goal:** Composable animation keyframes registration

```typescript
// User API (styled/api/keyframes.ts)
keyframes('fadeIn', {
  from: { opacity: 0 },
  to: { opacity: 1 }
})

keyframes('slideUp', {
  from: { transform: 'translateY(100%)' },
  to: { transform: 'translateY(0)' }
})

// Use in components
css({ animation: 'fadeIn 0.3s ease-out' })
```

**Implementation approach:**

**Option A: Simple wrapper (no microbundle needed)**
```typescript
// styled/api/keyframes.ts
export function keyframes(config: Record<string, any>): void {
  extendPandaConfig({
    theme: {
      extend: {
        keyframes: config
      }
    }
  })
}
```

This works because keyframes don't need code generation—they're just config objects.

**Option B: With tokens (if we want named animation tokens)**
```typescript
keyframes({
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 }
  },
  slideUp: {
    from: { transform: 'translateY(100%)' },
    to: { transform: 'translateY(0)' }
  }
})

// Also registers animation tokens
tokens({
  animations: {
    fadeIn: { value: 'fadeIn 0.3s ease-out' },
    slideUp: { value: 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }
  }
})
```

**Decision needed:**
- Simple keyframes-only API? (Option A)
- Include animation tokens/presets? (Option B)
- Location: `theme/keyframes.ts` or `api/keyframes.ts`?

**Files to create:**
- `styled/api/keyframes.ts` - User API function
- `styled/theme/keyframes.ts` - Define system keyframes
- Update `api/index.ts` to export

---

## Planned APIs 📋

### Runtime CSS Re-export

**Goal:** Re-export Panda's `css()` function with full prop support

```typescript
// styled/api/css.ts or entry/index.ts
export { css } from '../system/css'

// Verify responsive props work
css({ 
  color: 'blue',
  r: { base: '1', md: '2' },  // Responsive rhythm prop
  font: 'sans',                // Font prop from pattern
  container: 'sidebar'         // Container prop from pattern
})
```

**Status:** `css()` already exported from `entry/index.ts` ✅  
**TODO:** Verify all custom props (r, font, weight, container) work in `css()`

**Implementation:**
- No new code needed—already exported
- Test that box pattern props are recognized by `css()` TypeScript types
- Pattern properties should "just work" since Panda generates types

---

## Design Principles

### 1. Self-Contained Transforms

**Problem:** Panda's codegen doesn't capture closure variables in pattern transforms.

**Solution:** All pattern transforms must inline constants.

```typescript
// ❌ Doesn't work - FONT_PRESETS not in generated code
const FONT_PRESETS = { sans: {...}, serif: {...} }
pattern({
  transform(props) {
    return FONT_PRESETS[props.font] // ❌ ReferenceError at runtime
  }
})

// ✅ Works - inlined in transform body
pattern({
  transform(props) {
    const FONT_PRESETS = { sans: {...}, serif: {...} } // ✅ Serialized
    return FONT_PRESETS[props.font]
  }
})
```

See [api/pattern.md](api/pattern.md) for full explanation.

### 2. CLI Microbundles for Complex Generation

When a feature needs:
- Code generation (not just config)
- Combining multiple user calls
- Self-contained pattern transforms

→ Create a CLI microbundle:

```
cli/panda/feature/
  ├── extendFeature.ts         # Collector (globalThis registry)
  ├── initFeatureCollector.ts  # Initialize collector
  ├── collectEntryTemplate.ts  # Build temp entry file
  ├── generateFeature.ts       # Code generator
  ├── createFeature.ts         # Main CLI entry
  └── index.ts
```

**Examples:**
- `boxPattern/` - Combines pattern extensions
- `fontFace/` - Generates font tokens/recipes/patterns
- `config/` - Merges config fragments

### 3. Domain-Based Organization

Styled system organized by **design domain**:

```
styled/
├── api/        # Panda config APIs (infrastructure)
├── theme/      # Core design tokens (colors, spacing, radii)
├── font/       # Typography system
├── rhythm/     # Spacing/rhythm system
└── props/      # Pattern extensions (box props)
```

Each domain is **self-contained** with tokens, utilities, global CSS.

### 4. Type Safety First

- Generated TypeScript from collected definitions
- Pattern props fully typed in JSX
- Token references validated at build time
- Responsive prop types from pattern definitions

---

## File Organization

```
packages/reference-core/src/
├── styled/                     # Styling system
│   ├── api/                   # Configuration APIs
│   │   ├── index.ts          # Export all APIs
│   │   ├── tokens.ts         # tokens()
│   │   ├── recipe.ts         # recipe(), slotRecipe()
│   │   ├── utilities.ts      # utilities()
│   │   ├── globalCss.ts      # globalCss()
│   │   ├── staticCss.ts      # staticCss()
│   │   ├── globalFontface.ts # globalFontface()
│   │   ├── font.ts           # font()
│   │   ├── keyframes.ts      # 🚧 keyframes() (TODO)
│   │   ├── pattern.ts        # pattern()
│   │   └── pattern.md        # Pattern closure limitation docs
│   │
│   ├── theme/                # Theme domain
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── radii.ts
│   │   └── keyframes.ts      # 🚧 (TODO)
│   │
│   ├── font/                 # Font domain
│   │   ├── fonts.ts          # User font definitions
│   │   ├── font.ts           # Generated by CLI
│   │   ├── fontface.md       # Documentation
│   │   └── index.ts
│   │
│   ├── rhythm/               # Rhythm domain
│   │   ├── index.ts
│   │   ├── helpers.ts
│   │   └── utilities.ts
│   │
│   ├── props/                # Pattern extensions
│   │   ├── box.ts            # Generated combined box
│   │   ├── container.ts      # Container prop extension
│   │   ├── font.ts           # Font prop extension
│   │   ├── r.ts              # Responsive rhythm prop
│   │   └── patterns.d.ts     # Pattern types
│   │
│   ├── index.ts              # Main styled exports
│   ├── css.global.ts         # Global CSS definitions
│   ├── css.static.ts         # Static CSS config
│   ├── STRUCTURE.md          # Organization docs
│   ├── TODO.md               # Legacy todo (→ PLAN.md)
│   └── PLAN.md               # This file
│
├── cli/panda/                # CLI microbundles
│   ├── config/               # Config collection & merging
│   ├── boxPattern/           # Box pattern collector
│   ├── fontFace/             # Font system generator
│   └── gen/                  # Panda codegen runners
│
├── entry/                    # Public exports
│   └── index.ts             # Main package entry (includes css())
│
└── system/                   # Generated Panda runtime
    ├── css/                 # css(), cx(), cva()
    ├── patterns/            # Runtime pattern functions
    ├── jsx/                 # JSX factory + components
    └── types/               # Generated types
```

---

## Implementation Checklist

### Phase 1: Keyframes API 🚧

- [ ] Create `styled/api/keyframes.ts`
- [ ] Decide: Simple config wrapper vs. animation tokens
- [ ] Create `styled/theme/keyframes.ts` with system animations
- [ ] Export from `api/index.ts`
- [ ] Update `entry/index.ts` if needed
- [ ] Test with component animations
- [ ] Document in README

### Phase 2: CSS Re-export Verification ✅

- [ ] Verify `css()` exported in `entry/index.ts` ✅ (Already done!)
- [ ] Test custom props work: `css({ r: '1', font: 'sans' })`
- [ ] Verify TypeScript types include pattern props
- [ ] Add test cases for prop combinations
- [ ] Document usage examples

### Phase 3: Documentation & Polish

- [ ] Convert remaining TODOs to issues/tasks
- [ ] Document microbundle pattern for future features
- [ ] Create examples for each API
- [ ] Add migration guide for existing code
- [ ] Update Architecture.md in root

---

## Success Metrics

**✅ We've achieved:**
- 8/8 core Panda config APIs implemented
- Font system with CLI microbundle working
- Box pattern extension system functional
- Self-contained pattern transforms (no closure bugs)
- Type-safe token/recipe/pattern system

**🎯 Next milestones:**
- Keyframes API (simple wrapper, quick win)
- Verify all APIs work together seamlessly
- Complete documentation
- Real-world testing in reference-app

---

## Future Considerations

### Why No `layer()` API?

**Decision:** Not exposing cascade layer control to users.

**Rationale:**
- Users have **natural scoping** when building on reference-ui
- Their components/tokens are separate modules from reference-ui internals
- No cascade conflicts—they compose with `<Box>`, recipes, patterns
- Panda already manages layer order intelligently (utilities > recipes > base)
- Adding `layer()` would add complexity without clear user benefit

Users extend the system through existing APIs (`tokens()`, `recipe()`, `pattern()`) rather than fighting cascade precedence.

### Potential APIs

- **`breakpoints()`** - Custom viewport breakpoint registration (e.g., mobile-first or custom device widths)
  - Note: Panda already has good defaults (`sm`, `md`, `lg`, `xl`, `2xl`)
  - Only add if users need custom viewport sizes

### Existing Panda Features (No API Needed)

- **Semantic tokens** - Already supported in Panda's `tokens()` via token references
  ```typescript
  tokens({
    colors: {
      primary: { value: '{colors.blue.500}' }  // ✅ Already works
    }
  })
  ```
- **Themes (light/dark)** - Already supported via Panda's conditions system
  ```typescript
  tokens({
    colors: {
      bg: {
        value: { base: 'white', _dark: 'gray.900' }  // ✅ Already works
      }
    }
  })
  ```

### Potential Microbundles

- **`responsive/`** - If responsive prop system needs generation beyond current pattern support

### Performance Optimizations

- Cache microbundle outputs (only regenerate on source changes)
- Parallel microbundle execution
- Incremental pattern generation

---

## Questions & Decisions

### Open Questions

1. **Keyframes location:** `api/keyframes.ts` or `theme/keyframes.ts`?
   - **Recommendation:** `api/keyframes.ts` (infrastructure) + user defines in `theme/keyframes.ts`

2. **Animation tokens:** Include preset animation values?
   - **Recommendation:** Start simple (just keyframes), add tokens if needed

3. **CSS export location:** Keep in `entry/index.ts` or move to `styled/api/css.ts`?
   - **Recommendation:** Keep in `entry/` (it's a runtime export, not config)

### Resolved Decisions

✅ **Pattern closures:** Use self-contained transforms (inlined constants)  
✅ **Font system:** Dedicated microbundle (too complex for simple wrapper)  
✅ **Box pattern:** Generate combined pattern at build time  
✅ **Domain organization:** Organize by design domain (theme, font, rhythm, props)  

---

## Related Documentation

- [Architecture.md](../../../Architecture.md) - Overall system architecture
- [STRUCTURE.md](STRUCTURE.md) - File organization rationale
- [fontface.md](font/fontface.md) - Font system implementation details
- [api/pattern.md](api/pattern.md) - Pattern closure limitation explanation
- [cli/panda/config/readme.md](../../cli/panda/config/readme.md) - Config microbundle docs
- [cli/panda/boxPattern/](../../cli/panda/boxPattern/) - Box pattern microbundle reference
