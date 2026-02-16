# Styled Directory Structure

## Current State

```
styled/
├── index.ts                 # Mixed: exports + token registration
├── colors.ts               # Color tokens
├── font.ts                 # Font tokens + font-face + registration
├── patterns.ts             # Pattern global CSS
├── patterns.d.ts           # Pattern types
├── fontface.md            # Font-face docs
├── TODO.md
│
├── api/                    # Panda CSS APIs
│   ├── index.ts
│   ├── tokens.ts
│   ├── recipe.ts
│   ├── utilities.ts
│   ├── pattern.ts
│   ├── globalCss.ts
│   ├── staticCss.ts
│   ├── globalFontface.ts
│   └── patterns.md
│
└── props/                  # Pattern Extensions domain
    ├── index.ts
    ├── box.ts
    ├── container.ts
    ├── font.ts
    ├── r.ts
    ├── patterns.ts         # Pattern global CSS
    ├── patterns.d.ts       # Pattern types
    └── patterns.md         # Pattern docs
```

## Current Issues

The current organization mixes several concerns:

1. **Token definitions** (colors, fonts, spacing) are scattered
2. **Configuration APIs** (tokens(), recipe(), utilities()) are in `api/`
3. **Runtime utilities** (getRhythm, resolveRhythm) mixed with config
4. **Pattern extensions** (props/) separate from pattern globals
5. **Global CSS/font-face** definitions in multiple places
6. **Root-level files** handling different concerns (index.ts does too much)

## Proposed Structure Options

### Option A: By Domain (Recommended)

```
styled/
├── index.ts                 # Main public exports only
├── STRUCTURE.md             # This file
├── TODO.md
│
├── api/                     # Panda CSS Configuration APIs (unchanged)
│   ├── index.ts            # Re-export all APIs
│   ├── tokens.ts           # tokens() wrapper
│   ├── recipe.ts           # recipe(), slotRecipe()
│   ├── utilities.ts        # utilities() wrapper
│   ├── pattern.ts          # pattern() wrapper
│   ├── globalCss.ts        # globalCss() wrapper
│   ├── staticCss.ts        # staticCss() wrapper
│   └── globalFontface.ts   # globalFontface() wrapper
│
├── theme/                   # Theme domain (core design tokens)
│   ├── index.ts            # Register all theme tokens
│   ├── colors.ts           # Color palette definitions
│   ├── spacing.ts          # Spacing scale tokens
│   ├── radii.ts            # Border radius scale
│   ├── shadows.ts          # Box shadow tokens
│   ├── borders.ts          # Border width/style tokens
│   ├── zIndex.ts           # Z-index scale
│   ├── transitions.ts      # Transition/duration tokens
│   └── opacity.ts          # Opacity scale
│
├── rhythm/                 # Spacing & Rhythm domain
│   ├── index.ts            # Register spacing tokens
│   ├── rhythm.ts           # getRhythm() utilities
│   └── utilities.ts        # Rhythm utilities/transforms
│
├── font/                    # Font domain
│   ├── index.ts            # Register fonts + font-face
│   ├── tokens.ts           # Font family & size tokens
│   ├── fonts.ts            # Font-face definitions
│   ├── global.ts           # Font global CSS
│   └── fontface.md         # Font-face reference docs
│
└── props/                   # Pattern Extensions domain
    ├── index.ts            # Export all extensions
    ├── box.ts              # Box pattern extension
    ├── container.ts        # Container query extension
    ├── font.ts             # Font shorthand extension
    ├── r.ts                # Responsive prop extension
    ├── patterns.ts         # Pattern global CSS (rhythm vars, density)
    ├── patterns.d.ts       # Pattern type definitions
    └── patterns.md         # Pattern documentation
```

**Pros:**
- Organized by design system domain (theme, spacing, font, props)
- Theme domain houses all core design tokens (colors, shadows, radii, etc.)
- Everything related to a domain lives together (tokens, utilities, global CSS)
- Easy to work on one domain at a time
- Natural boundaries between concerns
- Pattern system is its own cohesive domain

---

---

## Recommended: Option A (Domain-Based)

**Rationale:**
- Each domain is self-contained with its tokens, utilities, and global CSS
- Natural mental model: "I'm working on spacing" → go to `spacing/`
- Easy to maintain: everything for a domain lives together
- Scalable: add new domains as design system grows
- Aligns with design system thinking

## Migration Strategy

If adopting Option A (Domain-Based):

1. **Phase 1: Create domain folders** (no breaking changes)
   - Create `theme/`, `rhythm/`, `font/`
   - Move and organize files by domain:
     - `colors.ts` → `theme/colors.ts`
     - Extract radii from root `index.ts` → `theme/radii.ts`
     - Extract spacing tokens from root `index.ts` → `theme/spacing.ts`
     - Create new token files: `theme/shadows.ts`, `theme/borders.ts`, etc.
     - `rhythm.ts` → `rhythm/rhythm.ts` (utilities only)
     - `font.ts` → `font/fonts.ts`
     - Current `patterns.ts` → `props/patterns.ts`
     - Current `patterns.d.ts` → stays in `props/`
   - Keep `api/` and `props/` as-is
   - Update internal imports

2. **Phase 2: Update root index.ts** (maintain backward compatibility)
   - Update exports to come from domain folders
   - Keep public API unchanged
   - Add domain-based exports if useful

3. **Phase 3: Consolidate token definitions**
   - Move spacing tokens from root index.ts to `theme/spacing.ts`
   - Move radii tokens from root index.ts to `theme/radii.ts`
   - Each domain index.ts registers its own tokens
   - Define additional theme tokens (shadows, borders, z-index, etc.)
   - Rhythm domain focuses on utilities (getRhythm, transforms)

4. **Phase 4: Cleanup** (optional future breaking change)
   - Remove old file locations if any remain
   - Update documentation
   - Simplify root index.ts

## Key Benefits

### For Developers
- **Domain focus**: Work on fonts without touching theme or spacing
- **Discoverability**: "Where do font sizes live?" → `font/tokens.ts`
- **Cohesion**: Everything for a domain is in one place
- **Maintenance**: Changes to a domain stay within that domain

### For Design System
- **Themability**: Each domain can be themed independently
- **Documentation**: Domain docs live with domain code
- **Testing**: Can test domains in isolation
- **Versioning**: Easier to track changes per domain

## Future Additions

With domain-based structure, here's where new features would go:

| Feature | Location | Reason |
|---------|----------|--------|
| Color manipulation | `theme/utilities.ts` | Theme domain utility |
| Dark mode colors | `theme/modes.ts` or `theme/colors.ts` | Theme domain feature |
| Animation keyframes | `theme/keyframes.ts` | Theme domain token |
| Gradient tokens | `theme/gradients.ts` | Theme domain token |
| Font size scale | `font/tokens.ts` | Font domain |
| Breakpoint tokens | `theme/breakpoints.ts` | Theme domain token |
| Breakpoint helpers | `rhythm/utilities.ts` or new domain | Layout utility |
| CSS reset | `font/global.ts` or root | Global CSS |
| New recipe | Use `api/recipe.ts` | Config API (domain-agnostic) |
| Custom pattern extension | `props/` | Pattern extension domain |

## Notes

- `api/` stays as-is - it's the foundational config layer
- `props/` stays as-is - it's the pattern extension domain
- Each domain is self-contained: tokens + utilities + global CSS
- `fontface.md` stays in `font/` as reference documentation
- Consider exporting domain-specific APIs from each domain's index
- `patterns.d.ts` types should be generated, not manually maintained
- Current `patterns.ts` should move into `props/` domain

## Domain Responsibilities

### `api/` - Configuration Layer
- Wrappers around Panda CSS APIs
- Domain-agnostic configuration functions
- Used by all other domains

### `theme/` - Theme System (Core Design Tokens)
- Color palette definitions (oklch)
- Spacing scale tokens (rhythm-based)
- Border radii scale
- Box shadow tokens
- Border width/style tokens
- Z-index scale
- Transition/duration tokens
- Opacity scale
- Theme utilities (future: color manipulation, dark mode variants)

### `rhythm/` - Rhythm Utilities
- Rhythm-based spacing utilities
- `getRhythm()` and related utilities
- Rhythm transform utilities
- Note: Spacing *tokens* live in `theme/spacing.ts`

### `font/` - Font System
- Font family tokens
- Font size scales
- Font-face definitions
- Font-related global CSS
- Font loading and display

### `props/` - Pattern Extensions
- Pattern extension system (container, font, responsive)
- Box pattern extensions
- Pattern-specific global CSS (rhythm vars, density)
- Pattern type definitions
- Pattern documentation
