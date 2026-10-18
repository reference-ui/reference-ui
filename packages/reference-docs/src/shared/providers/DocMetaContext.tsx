import { createContext, useContext } from 'react'
import type { DocMeta } from '../../collections/runtime'

/**
 * The frontmatter of the page being rendered. `DocPage` provides it so MDX
 * element mappings (the page header's lead) can read metadata without each
 * page importing it.
 */
export const DocMetaContext = createContext<DocMeta | undefined>(undefined)

export function useDocMeta(): DocMeta | undefined {
  return useContext(DocMetaContext)
}
