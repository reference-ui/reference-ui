# CORE-LAYERS-08 — a layer's globalCss, @font-face and @keyframes print once in its block, own rules win on the same selector, and its reset, root default and :root tokens stay out of the sheet

The consumer lists one real upstream under `layers`. The upstream is a real sync:
its global stream carries a `globalCss` pair (`.up-probe`, `.up-only`), one `font()`
face with a `@font-face` rule, and one `keyframes()` animation. The consumer also
styles `.up-probe` in its own `globalCss`, so one selector is styled by both systems.

The spec runs `sync()` on the upstream, rewrites the consumer config to `layers: [up]`,
re-syncs, and restores the canonical spelling in a `finally`.

What the spec proves, on the served `styled/styles.css` and in computed style:

1. The sheet states `@layer core-layers8-up, core-layers8;`. The upstream block carries the
   upstream's global block once: `.up-probe`, `.up-only`, one `@font-face` for `Literata`,
   and one `@keyframes upPulse`. `.up-only`, the `@font-face` and the keyframes each appear
   exactly once in the whole sheet; `.up-probe` appears once per system, in its own block.
2. The upstream's reset is absent from its block. The published `reset` stream is
   non-empty and carries `box-sizing: border-box`, and the upstream block holds no
   `@layer reset {` and no copy of that text. The only reset in the sheet is the own one.
3. The upstream's root default is absent from its block. The published `root` stream is
   non-empty and carries `--spacing-root`; the block does not. The consumer's own root
   default is the only `:root` block in the sheet that declares it.
4. The upstream's `:root`-hoisted tokens are absent. Every `--colors-up-ink:` declaration
   in the sheet sits under a `[data-layer="core-layers8-up"]` selector, and no `:root`
   rule declares it. Computed, `--colors-up-ink` is empty on `:root`, while a probe
   carrying `data-layer="core-layers8-up"` reads `#be185d` from its scoped token.
5. Paint. `#own-probe` (`.up-probe` in both systems) paints the own colour, so own wins on
   that selector. `#up-only` paints the layer's global colour, so a global rule from a
   layer still lands when the consumer does not restate it.

The committed `ui.config` imports nothing; the spec rewrites it, re-syncs, and restores
the canonical spelling in a `finally`. The consumer's `globalCss` lives in a fragment file
(the world theme), and the page loads no script, so no browser code imports `@reference-ui/core`.

> Search terms: layers, globalCss, font-face, keyframes, global stream, reset stream, root default, :root hoisting, tokens portable, data-layer scope, own wins same selector, CORE-LAYERS-01, CORE-GLOBAL-08
