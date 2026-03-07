# Font Module

Top-level font system module. Collects font definitions via `extendFont`, renders to tokens, @font-face, recipe, and pattern fragments via Liquid templates.

**Not yet hooked into the rest of the system** — this is scaffolded for review.

---

## Structure

```
font/
├── liquid/           # Liquid templates
│   ├── tokens.liquid  # Font family + font weight tokens
│   ├── fontface.liquid # @font-face rules (globalFontface)
│   ├── recipe.liquid  # fontStyle recipe with variants
│   ├── pattern.liquid # font + weight props for box pattern
│   └── index.ts      # Template loader
├── collect.ts        # collectFonts (app space only)
├── render.ts         # renderFontSystem (Liquid)
├── types.ts          # Types
├── index.ts          # Public API
└── README.md
```

---

## App space only

Fonts are defined in the **app** via `extendFont()` (e.g. `app/src/system/fonts.ts`). The CLI has no built-in fonts — it only collects and renders what the app defines.

---

## Flow (when integrated)

1. **Collect** — `collectFonts({ cwd, userInclude, tempDir })` scans app code for `extendFont` calls.
2. **Render** — `renderFontSystem(fonts)` runs Liquid templates → `{ tokens, fontface, recipe, pattern }`.
3. **Inject** — Each output becomes a fragment:
   - `tokens` → extendPandaConfig (theme.extend.tokens)
   - `fontface` → globalFontface()
   - `recipe` → recipe('fontStyle', ...)
   - `pattern` → extendPattern (font + weight props) — merges with box pattern

---

## Config Integration (planned)

Similar to patterns, config would call:

```ts
const fontFragments = await getFontFragmentsForConfig({
  cwd, userInclude, tempDir,
})
// Merge into internalFragments / userFragments
```

The **pattern** fragment (font + weight props) would be passed to the patterns module to merge with the box pattern. The tokens, fontface, and recipe fragments would be injected into the Panda config bundle.

---

## Collector

Uses `extendFont` from `system/collectors/extendFont.ts`. Same fragment collector pattern as `extendPattern`.

---

## Moved from internal/font

- Types, Liquid templates, generate logic → this module
- `internal/font` can be deprecated once integration is complete
