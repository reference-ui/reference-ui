// Global rules for the GLOBAL-10 world. They take no input and emit a field
// bezel with a base token border plus the lib invalid compound: a literal
// `:has([aria-invalid="true"])` selector twinned with `[data-invalid]` on a
// comma selector. Written the way the lib field surface authors it.
import { globalCss } from '@reference-ui/neo'

globalCss({
  '[data-reference-field]': {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.field.border}',
  },
  '[data-reference-field]:has([aria-invalid="true"]), [data-reference-field][data-invalid]': {
    borderColor: '{colors.red.500}',
  },
})
