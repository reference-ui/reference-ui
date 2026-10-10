/**
 * The tablist system recipe: strip chrome for the prepackaged line and
 * pill variants across both axes. Axes hold axis-pure styles only — the
 * strip direction is closed — while compounds carry every cross-term,
 * so unknown author variant names resolve to base plus axis classes
 * with no built-in paint.
 */
import { recipe } from '@reference-ui/react'

// Prepackaged variant styles, authored as system recipes (HQ system-variant
// mechanism — the strip direction is closed, the kernel keeps line/pill).
// Axes hold axis-pure styles only; every cross-term (padding, indicator,
// selected color, idle hover) lives in a compound keyed on its variant, so
// unknown author names resolve to base + axis classes with no built-in
// paint. Overriding a built-in goes through the normal cascade: host style
// props / css() / the css prop compile to utilities, and the utilities
// layer follows the recipes layer. Verbatim values from the former inline
// props — the 22 CT snapshots pin them pixel-identical.
export const tabsListRecipe = recipe({
  className: 'tabsList',
  base: {
    position: 'relative',
  },
  variants: {
    variant: {
      line: { display: 'flex', bg: 'transparent', p: '0' },
      pill: {
        display: 'inline-flex',
        bg: 'ui.tab.track.background',
        p: '1r',
        borderRadius: 'md',
        gap: '1r',
      },
    },
    orientation: {
      horizontal: { flexDirection: 'row' },
      vertical: { flexDirection: 'column' },
    },
  },
  compoundVariants: [
    {
      variant: 'line',
      orientation: 'horizontal',
      css: {
        gap: '4r',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'ui.table.border',
      },
    },
    {
      variant: 'line',
      orientation: 'vertical',
      css: {
        gap: '1r',
        borderRightWidth: '1px',
        borderRightStyle: 'solid',
        borderRightColor: 'ui.table.border',
      },
    },
  ],
})
