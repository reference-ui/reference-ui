/**
 * The tab system recipe: per-tab chrome for line and pill across
 * orientation, selection, and disabled axes. Every orientation effect
 * crosses with the variant, so the orientation values stay empty and
 * compounds carry the predicates; unknown author names again resolve
 * to base plus axis classes with no built-in paint.
 */
import { recipe } from '@reference-ui/react'

export const tabsTabRecipe = recipe({
  className: 'tabsTab',
  base: {
    border: 'none',
    borderColor: 'transparent',
    bg: 'transparent',
    fontWeight: '500',
    fontSize: '3.5r',
    boxShadow: 'none',
    transition:
      'color 150ms ease, border-color 150ms ease, background-color 150ms ease',
    _focusVisible: {
      outline: '2px solid',
      outlineColor: 'ui.focus.ring',
    },
  },
  variants: {
    variant: {
      line: {
        h: 'auto',
        borderRadius: '0',
        _focusVisible: { outlineOffset: '-2px' },
      },
      pill: {
        px: '3r',
        pt: '1.5r',
        pb: '1.5r',
        borderRadius: 'sm',
        _focusVisible: { outlineOffset: '2px' },
      },
    },
    // No orientation-pure tab styles exist — every orientation effect
    // crosses with the variant — so these values stay empty and compounds
    // below carry the orientation predicates.
    orientation: {
      horizontal: {},
      vertical: {},
    },
    selected: {
      selected: {},
      unselected: { color: 'design.text.light' },
    },
    disabled: {
      disabled: { cursor: 'not-allowed', opacity: 0.5 },
      enabled: { cursor: 'pointer', opacity: 1 },
    },
  },
  compoundVariants: [
    // Line padding + overlap pull (orientation-crossed).
    {
      variant: 'line',
      orientation: 'horizontal',
      css: { px: '2r', pt: '2.5r', pb: '3.5r', marginBottom: '-1px' },
    },
    {
      variant: 'line',
      orientation: 'vertical',
      css: { px: '3r', pt: '2r', pb: '2r', marginRight: '-1px' },
    },
    // Line indicator (orientation × selection crossed).
    {
      variant: 'line',
      orientation: 'horizontal',
      selected: 'selected',
      css: { borderBottom: '3px solid' },
    },
    {
      variant: 'line',
      orientation: 'horizontal',
      selected: 'unselected',
      css: { borderBottom: '3px solid transparent' },
    },
    {
      variant: 'line',
      orientation: 'vertical',
      selected: 'selected',
      css: { borderRight: '3px solid' },
    },
    {
      variant: 'line',
      orientation: 'vertical',
      selected: 'unselected',
      css: { borderRight: '3px solid transparent' },
    },
    // Selected color/weight (variant-crossed).
    {
      variant: 'line',
      selected: 'selected',
      css: {
        borderColor: 'ui.focus.ring',
        color: 'design.text.base',
        textShadow: '0 0 0.4px currentColor',
      },
    },
    {
      variant: 'pill',
      selected: 'selected',
      css: {
        bg: 'gray.200',
        // Bg is mode-STATIC light gray, so the text must be
        // mode-static dark. Mode-flipping tokens are wrong in exactly one
        // mode each: ui.button.foreground is white-on-gray.200 in light
        // mode; design.text.base would be white-on-gray.200
        // in dark mode. gray.950 reads on gray.200 in both modes.
        color: 'gray.950',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      },
    },
    // Idle hover (variant × unselected × enabled crossed).
    {
      variant: 'line',
      selected: 'unselected',
      disabled: 'enabled',
      css: {
        _hover: { color: 'design.text.base', borderColor: 'ui.field.border' },
      },
    },
    {
      variant: 'pill',
      selected: 'unselected',
      disabled: 'enabled',
      css: {
        _hover: { color: 'design.text.base', bg: 'rgba(255,255,255,0.04)' },
      },
    },
  ],
})
