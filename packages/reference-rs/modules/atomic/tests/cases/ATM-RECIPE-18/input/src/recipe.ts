import { recipe } from '@reference-ui/react'
import { LOUD } from './axes'

export const importedTone = recipe({
  className: 'importedTone',
  variants: {
    size: { sm: { fontSize: '12px' } },
    tone: { loud: { color: 'red' } },
  },
  compoundVariants: [{ tone: LOUD, size: 'sm', css: { fontWeight: '700' } }],
})
