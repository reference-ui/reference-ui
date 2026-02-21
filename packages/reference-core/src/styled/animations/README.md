# Animations

This directory contains pre-defined CSS animation keyframes built on top of Panda CSS using the `keyframes()` API.

## Structure

Each file contains a related set of animations:

- **fade.ts** - Opacity-based transitions (fadeIn, fadeOut, fadeInUp, etc.)
- **slide.ts** - Positional slide animations (slideUp, slideDown, slideLeft, slideRight)
- **scale.ts** - Size transformations (scaleIn, scaleOut, pulse, heartbeat)
- **spin.ts** - Rotation animations (spin, rotate90, wiggle)
- **bounce.ts** - Elastic and bounce effects (bounce, bounceIn, shake)
- **attention.ts** - Attention-seeking animations (ping, flash, glow, shimmer)

## Usage

Animations are automatically registered when you import the styled system:

```ts
import '@reference-ui/core/styled'
```

Or import specific animation sets:

```ts
import '@reference-ui/core/styled/animations/fade'
import '@reference-ui/core/styled/animations/slide'
```

Use them in your components with the `css()` function:

```tsx
import { css } from '@reference-ui/core/styled-system/css'
;<div className={css({ animation: 'fadeIn 0.3s ease-out' })}>Content</div>
```

## Adding New Animations

To add new animations:

1. Create a new file or add to an existing category file
2. Import and call the `keyframes()` function
3. Export from index.ts if creating a new file

Example:

```ts
import { extendKeyframes } from '../api/extendKeyframes'

keyframes({
  myAnimation: {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
})
```

## Design Principles

- **GPU-accelerated**: Prefer `transform` and `opacity` for best performance
- **Semantic naming**: Names describe the visual effect, not the use case
- **Composable**: Animations can be combined with CSS timing functions
- **Zero-runtime**: All keyframes are generated at build time by Panda CSS

## See Also

- [Panda CSS Keyframes Documentation](https://panda-css.com/docs/concepts/keyframes)
- [MDN CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
- User documentation: `packages/reference-docs/src/docs/foundations/animations.mdx`
