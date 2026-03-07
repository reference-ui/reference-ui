# Font System (Internal)

This directory handles font generation during CLI runtime (`ref sync`).

## Structure

- `types.ts` - TypeScript type definitions
- `generate.ts` - Font system generation logic
- `index.ts` - Public exports
- `templates/` - Liquid templates for code generation
  - `tokens.liquid` - Font and fontWeight tokens
  - `fontface.liquid` - @font-face rules via globalFontface()
  - `recipe.liquid` - Font recipe with variants
  - `pattern.liquid` - Font pattern extension (font + weight props)

## How it works

1. User defines fonts with `font()` API in their app (e.g., `app/src/system/fonts.ts`)
2. During `ref sync`, CLI collects font definitions using the fragment collector
3. Font generator (`generate.ts`) processes definitions and renders Liquid templates
4. Generated code is injected into the user's Panda config:
   - Font family tokens (`tokens.fonts`)
   - Font weight tokens (`tokens.fontWeights.{font}.{weight}`)
   - @font-face CSS rules (`globalFontface()`)
   - Font recipe with variants (`recipe('fontStyle', ...)`)
   - Font pattern extension (`extendPattern()` for box pattern)

## Template Rendering

Templates use Liquid syntax to generate code from font definitions:

- Access font properties: `{{ font.name }}`, `{{ font.value }}`
- Iterate over fonts: `{% for font in fonts %}`
- Conditional rendering: `{% if font.fontFace %}`
- Filters: `| json`, `| default: "value"`

## API Integration

The font system integrates with these CLI APIs:

- `font()` - User-facing API to define fonts (api/font.ts)
- `tokens()` - Generated font tokens
- `globalFontface()` - Generated @font-face rules
- `recipe()` - Generated font recipe
- `extendPattern()` - Generated font pattern

## Implementation Status

✅ Type definitions
✅ Generator scaffolding
✅ Liquid templates
⏳ Template rendering (TODO: integrate LiquidJS)
⏳ CLI runtime integration (TODO: wire into ref sync)
