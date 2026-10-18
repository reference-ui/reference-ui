// Global rules for the GLOBAL-05 world. They take no input and emit the lib
// input shape: a flex field base spread into the rule, the flex keys stripped
// with `undefined`, plus a placeholder colour and rhythm sizes. Mirrors the
// `inputs.ts` spread-then-strip authoring.
import { globalCss } from '@reference-ui/neo'

globalCss({ ':root': { '--spacing-root': '0.25rem' } })

const fieldBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2r',
  paddingInline: '3r',
  fontSize: '3.5r',
}

globalCss({
  '.ref-input': {
    ...fieldBase,
    display: undefined,
    alignItems: undefined,
    gap: undefined,
    minWidth: undefined,
    maxWidth: undefined,
    width: '100%',
    _placeholder: {
      color: '{colors.ui.field.placeholder}',
    },
  },
})
