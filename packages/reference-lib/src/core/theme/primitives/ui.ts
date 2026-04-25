import { disclosurePrimitiveStyles } from './disclosure'
import { documentPrimitiveStyles } from './document'
import { formPrimitiveStyles } from './forms'
import { listPrimitiveStyles } from './typography/lists'
import { mediaPrimitiveStyles } from './media'
import { tablePrimitiveStyles } from './tables'

export { disclosurePrimitiveStyles } from './disclosure'
export { documentPrimitiveStyles } from './document'
export { formPrimitiveStyles } from './forms'
export { listPrimitiveStyles } from './typography/lists'
export { mediaPrimitiveStyles } from './media'
export { tablePrimitiveStyles } from './tables'

export const uiPrimitiveStyles = {
  ...documentPrimitiveStyles,
  ...listPrimitiveStyles,
  ...mediaPrimitiveStyles,
  ...disclosurePrimitiveStyles,
  ...formPrimitiveStyles,
  ...tablePrimitiveStyles,
} as const
